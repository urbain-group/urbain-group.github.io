import { GameState, Property, CutIn, CutInPayload } from '@/types';
import { EVENT_PROB, POS_EVENT_EFFECT, NEG_EVENT_EFFECT } from './config';

// ───────────────────────────────────────────────
// リスク係数（属性連動＝「データを読めば避けられる」の核）
// ───────────────────────────────────────────────

const LOC_RISK: Record<Property['locationRank'], number> = { S: 0.6, A: 0.8, B: 1.2, C: 1.6 };
const STRUCT_RISK: Record<Property['structure'], number> = { RC: 0.8, 鉄骨: 1.1, 木造: 1.4 };
const HAZ_RISK: Record<Property['hazard'], number> = { 低: 0.7, 中: 1.2, 高: 1.8 };
const ageRisk = (age: number) => (age >= 30 ? 1.6 : age >= 20 ? 1.3 : age >= 10 ? 1.0 : 0.7);

const vacancyRisk = (p: Property) => LOC_RISK[p.locationRank] * ageRisk(p.age);
const repairRisk = (p: Property) => ageRisk(p.age) * STRUCT_RISK[p.structure] * (1 + (100 - p.condition) / 200);
const disasterRisk = (p: Property) => HAZ_RISK[p.hazard] * STRUCT_RISK[p.structure];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const man = (yen: number) => `${Math.round(yen / 10_000).toLocaleString()}万円`;
let seq = 0;
const cid = () => `c${++seq}`;

function pickTarget(props: Property[], riskFn: (p: Property) => number): Property {
  const weights = props.map(riskFn);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < props.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return props[i];
  }
  return props[props.length - 1];
}

function updateProp(s: GameState, id: string, patch: Partial<Property>): GameState {
  return { ...s, properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

// ───────────────────────────────────────────────
// イベント定義（instant＝即適用＋通知 / choice＝選択待ち）
// ───────────────────────────────────────────────

type EventDef = {
  id: string;
  weight: number;
  needsProps: boolean;
  roll: (s: GameState) => { state: GameState; cutin: CutIn };
};

const EVENTS: EventDef[] = [
  // ════ 即時イベント（負） ════
  {
    id: 'vacancy', weight: 13, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, vacancyRisk);
      const drop = rand(0.10, 0.25) * NEG_EVENT_EFFECT * (1 - CURRENT_RESIST);
      const occ = Math.max(0.4, t.occupancyRate - drop);
      return {
        state: updateProp(s, t.id, { occupancyRate: occ }),
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '🚪 空室発生',
          message: `${t.name} で退去が発生。入居率が ${Math.round(occ * 100)}% に低下した。` },
      };
    },
  },
  {
    id: 'rentDrop', weight: 9, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, vacancyRisk);
      const ratio = 1 - rand(0.03, 0.05) * NEG_EVENT_EFFECT;
      const rent = Math.round((t.monthlyRent * ratio) / 1_000) * 1_000;
      return {
        state: updateProp(s, t.id, { monthlyRent: rent }),
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '📉 家賃下落',
          message: `周辺相場の下落により、${t.name} の家賃が ${man(rent)}/月 に低下した。` },
      };
    },
  },
  {
    id: 'arrears', weight: 7, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, vacancyRisk);
      const loss = Math.round(t.monthlyRent * t.occupancyRate * rand(0.5, 1.0) * NEG_EVENT_EFFECT * (1 - CURRENT_RESIST));
      return {
        state: { ...s, cash: s.cash - loss },
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '💸 家賃滞納',
          message: `${t.name} で滞納が発生。今月 −${man(loss)} の取りはぐれ。` },
      };
    },
  },
  {
    id: 'rateUp', weight: 6, needsProps: true,
    roll: (s) => {
      const delta = rand(0.0025, 0.005) * NEG_EVENT_EFFECT;
      const props = s.properties.map((p) => ({ ...p, loanRate: Math.min(0.05, p.loanRate + delta) }));
      return {
        state: { ...s, properties: props },
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '📈 金利上昇',
          message: `日銀の利上げ観測で、全ローンの金利が +${(delta * 100).toFixed(2)}%。毎月の返済額が増える。` },
      };
    },
  },
  {
    id: 'priceDown', weight: 7, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, (p) => LOC_RISK[p.locationRank]);
      const ratio = 1 - rand(0.03, 0.06) * NEG_EVENT_EFFECT;
      const price = Math.round((t.price * ratio) / 1_000_000) * 1_000_000;
      return {
        state: updateProp(s, t.id, { price }),
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '🏷️ 価格下落',
          message: `市況悪化。${t.name} の評価額が ${man(price)} に低下した。` },
      };
    },
  },
  {
    id: 'disaster', weight: 4, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, disasterRisk);
      const gross = t.price * rand(0.04, 0.08) * NEG_EVENT_EFFECT;
      const cost = Math.round(gross * 0.25);
      return {
        state: {
          ...updateProp(s, t.id, {
            condition: Math.max(10, t.condition - 20),
            occupancyRate: Math.max(0.3, t.occupancyRate - 0.15),
          }),
          cash: s.cash - cost,
        },
        cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '🌊 災害発生',
          message: `${t.name} が被災！保険適用後も −${man(cost)} の負担。入居率も低下した。` },
      };
    },
  },
  {
    id: 'marketChill', weight: 4, needsProps: true,
    roll: (s) => ({
      state: { ...s, marketChill: 3 },
      cutin: { id: cid(), speaker: 'event', tone: 'neg', title: '🥶 売却難',
        message: '市場の流動性が低下。3ヶ月間、売却額が10%引かれる。いま売るのは不利だ。' },
    }),
  },

  // ════ 選択式イベント（プレイヤーの決断） ════
  {
    id: 'repairChoice', weight: 10, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, repairRisk);
      const fullCost = Math.round(t.monthlyRent * rand(2.5, 4) * NEG_EVENT_EFFECT);
      const cheapCost = Math.round(fullCost * 0.3);
      const payload: CutInPayload = { kind: 'repair', targetId: t.id, fullCost, cheapCost };
      return {
        state: s,
        cutin: {
          id: cid(), speaker: 'event', tone: 'neg', title: '🔧 突発修繕',
          message: `${t.name} で給湯設備が故障！どう対応する？`,
          choices: [
            { label: `しっかり直す（−${man(fullCost)}）`, hint: '出費は痛いが資産は守られる' },
            { label: `応急処置で済ます（−${man(cheapCost)}）`, hint: '安いが状態が悪化し、入居率も下がる' },
          ],
          payload,
        },
      };
    },
  },
  {
    id: 'bigRepairChoice', weight: 5, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, repairRisk);
      const fullCost = Math.round(t.price * rand(0.025, 0.04) * NEG_EVENT_EFFECT);
      const minCost = Math.round(fullCost * 0.35);
      const payload: CutInPayload = { kind: 'bigRepair', targetId: t.id, fullCost, minCost };
      return {
        state: s,
        cutin: {
          id: cid(), speaker: 'event', tone: 'neg', title: '🏗️ 大規模修繕の時期',
          message: `${t.name} が大規模修繕の時期を迎えた。`,
          choices: [
            { label: `フル修繕（−${man(fullCost)}）`, hint: '状態が大きく回復し、資産価値を保てる' },
            { label: `最低限の補修（−${man(minCost)}）`, hint: '安いが状態は少し悪化する' },
          ],
          payload,
        },
      };
    },
  },
  {
    id: 'troubleChoice', weight: 7, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, vacancyRisk);
      const politeCost = Math.round(t.monthlyRent * rand(1.5, 2.5) * NEG_EVENT_EFFECT * (1 - CURRENT_RESIST));
      const payload: CutInPayload = { kind: 'trouble', targetId: t.id, politeCost };
      return {
        state: s,
        cutin: {
          id: cid(), speaker: 'event', tone: 'neg', title: '😤 入居者トラブル',
          message: `${t.name} で入居者トラブルが発生。対応方針は？`,
          choices: [
            { label: `誠実に対応する（−${man(politeCost)}）`, hint: '費用はかかるが穏便に収まる' },
            { label: '強気に出る（費用なし）', hint: '丸く収まるかもしれないし、大量退去を招くかもしれない（賭け）' },
          ],
          payload,
        },
      };
    },
  },
  {
    id: 'offerChoice', weight: 4, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, () => 1);
      const offerPrice = Math.round((t.price * (1 + rand(0.06, 0.10) * POS_EVENT_EFFECT)) / 1_000_000) * 1_000_000;
      const net = Math.round(offerPrice * 0.96 - t.loanBalance);
      const payload: CutInPayload = { kind: 'offer', targetId: t.id, offerPrice };
      return {
        state: s,
        cutin: {
          id: cid(), speaker: 'event', tone: 'pos', title: '🤵 買付が入った！',
          message: `${t.name} に相場より高い ${man(offerPrice)} の買付が入った。売却するか？（手取り約 ${man(net)}）`,
          choices: [
            { label: '売却する', hint: '利益確定。ただし家賃収入は失う' },
            { label: '断って保有を続ける', hint: '毎月のCFを取り続ける' },
          ],
          payload,
        },
      };
    },
  },

  // ════ 即時イベント（正） ════
  {
    id: 'rentUp', weight: 6, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, (p) => 1 / LOC_RISK[p.locationRank]);
      const ratio = 1 + rand(0.03, 0.05) * POS_EVENT_EFFECT;
      const rent = Math.round((t.monthlyRent * ratio) / 1_000) * 1_000;
      return {
        state: updateProp(s, t.id, { monthlyRent: rent }),
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '📈 家賃上昇',
          message: `周辺相場の上昇！${t.name} の家賃が ${man(rent)}/月 にUPした。` },
      };
    },
  },
  {
    id: 'priceUp', weight: 6, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, (p) => 1 / LOC_RISK[p.locationRank]);
      const ratio = 1 + rand(0.03, 0.06) * POS_EVENT_EFFECT;
      const price = Math.round((t.price * ratio) / 1_000_000) * 1_000_000;
      return {
        state: updateProp(s, t.id, { price }),
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '🏷️ 価格上昇',
          message: `市況好転！${t.name} の評価額が ${man(price)} にUPした。` },
      };
    },
  },
  {
    id: 'goodTenant', weight: 5, needsProps: true,
    roll: (s) => {
      const t = pickTarget(s.properties, () => 1);
      return {
        state: updateProp(s, t.id, { occupancyRate: 1.0 }),
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '🤝 優良入居者',
          message: `${t.name} に長期契約の優良入居者が決まり、満室になった！` },
      };
    },
  },
  {
    id: 'rateDown', weight: 3, needsProps: true,
    roll: (s) => {
      const delta = rand(0.002, 0.003) * POS_EVENT_EFFECT;
      const props = s.properties.map((p) => ({ ...p, loanRate: Math.max(0.005, p.loanRate - delta) }));
      return {
        state: { ...s, properties: props },
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '📉 金利低下',
          message: `全ローンの金利が −${(delta * 100).toFixed(2)}%。毎月の返済が軽くなる。` },
      };
    },
  },
  {
    id: 'lottery', weight: 4, needsProps: false,
    roll: (s) => {
      const amount = Math.round(rand(1_000_000, 6_000_000) / 100_000) * 100_000;
      return {
        state: { ...s, cash: s.cash + amount },
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '🎰 商店街の福引で当選！',
          message: `ガラガラを回すと…大当たり！臨時収入 +${man(amount)} を獲得した！` },
      };
    },
  },
  {
    id: 'subsidy', weight: 2, needsProps: false,
    roll: (s) => {
      const amount = Math.round(rand(2_000_000, 5_000_000) * POS_EVENT_EFFECT);
      return {
        state: { ...s, cash: s.cash + amount },
        cutin: { id: cid(), speaker: 'event', tone: 'pos', title: '🎁 補助金・税優遇',
          message: `行政の支援策が適用され、一時金 +${man(amount)} を受領した。` },
      };
    },
  },
];

// ───────────────────────────────────────────────
// 抽選 ＆ 選択の解決
// ───────────────────────────────────────────────

let CURRENT_RESIST = 0;
export function rollEvent(s: GameState, vacancyResist: number = 0): { state: GameState; cutin: CutIn } | null {
  CURRENT_RESIST = vacancyResist;
  if (Math.random() >= EVENT_PROB) return null;
  const candidates = EVENTS.filter((e) => !e.needsProps || s.properties.length > 0);
  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of candidates) {
    roll -= e.weight;
    if (roll <= 0) return e.roll(s);
  }
  return null;
}

/** 選択式カットインの決着 */
export function resolveCutIn(s: GameState, cutin: CutIn, choice: number): { state: GameState; message: string } {
  const pl = cutin.payload;
  if (!pl) return { state: s, message: '' };
  const t = s.properties.find((p) => p.id === pl.targetId);
  if (!t) return { state: s, message: '（対象物件は既に手放していた）' };

  switch (pl.kind) {
    case 'repair': {
      if (choice === 0) {
        return {
          state: { ...s, cash: s.cash - pl.fullCost },
          message: `🔧 ${t.name} をしっかり修理した（−${man(pl.fullCost)}）。資産は守られた。`,
        };
      }
      return {
        state: {
          ...updateProp(s, t.id, {
            condition: Math.max(10, t.condition - 15),
            occupancyRate: Math.max(0.4, t.occupancyRate - 0.05),
          }),
          cash: s.cash - pl.cheapCost,
        },
        message: `🩹 ${t.name} は応急処置で済ませた（−${man(pl.cheapCost)}）。状態と入居率が悪化…。`,
      };
    }
    case 'bigRepair': {
      if (choice === 0) {
        return {
          state: { ...updateProp(s, t.id, { condition: Math.min(100, t.condition + 25) }), cash: s.cash - pl.fullCost },
          message: `🏗️ ${t.name} をフル修繕（−${man(pl.fullCost)}）。状態が大きく回復した。`,
        };
      }
      return {
        state: { ...updateProp(s, t.id, { condition: Math.max(10, t.condition - 5) }), cash: s.cash - pl.minCost },
        message: `🔩 ${t.name} は最低限の補修に留めた（−${man(pl.minCost)}）。`,
      };
    }
    case 'trouble': {
      if (choice === 0) {
        return {
          state: {
            ...updateProp(s, t.id, { occupancyRate: Math.max(0.4, t.occupancyRate - 0.05) }),
            cash: s.cash - pl.politeCost,
          },
          message: `🤝 誠実な対応で収束（−${man(pl.politeCost)}）。軽微な退去のみで済んだ。`,
        };
      }
      // 強気＝五分五分の賭け
      if (Math.random() < 0.5) {
        return { state: s, message: `😎 強気の対応が奏功！費用ゼロで丸く収まった。` };
      }
      return {
        state: updateProp(s, t.id, { occupancyRate: Math.max(0.3, t.occupancyRate - 0.2) }),
        message: `😱 強気の対応が裏目に…${t.name} で大量退去が発生した。`,
      };
    }
    case 'offer': {
      if (choice === 0) {
        const net = Math.round(pl.offerPrice * 0.96 - t.loanBalance);
        return {
          state: {
            ...s,
            cash: s.cash + net,
            properties: s.properties.filter((p) => p.id !== t.id),
          },
          message: `💰 ${t.name} を高値売却！手取り ${man(net)} を獲得。`,
        };
      }
      return { state: s, message: `🏠 買付を断り、${t.name} の保有を続ける。` };
    }
  }
}
