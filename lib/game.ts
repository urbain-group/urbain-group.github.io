import { GameState, Property, PropertyType, Structure, LocationRank, Hazard, CutIn, Perks } from '@/types';
import {
  INITIAL_CASH, TOTAL_TURNS, WIN_NET_WORTH, MARKET_SIZE,
  RIVAL_MONTHLY_RATE, RIVAL_RANDOM, DEFAULT_LOAN_RATE,
  LTV_MAX, ACQUISITION_COST, REFORM_VALUE_MULT, RIVAL_NAME,
} from './config';
import { calcMonthlyCashFlow, calcLoanPayment, calcNetWorth } from './finance';
import { rollEvent, resolveCutIn } from './events';
import { applyAchievements } from './achievements';
import { applyUpgrade, pick3 } from './upgrades';

// ───────────────────────────────────────────────
// 物件ティア
// ───────────────────────────────────────────────
type Tier = {
  label: string; weight: number;
  priceRange: [number, number]; yieldRange: [number, number]; ageRange: [number, number];
  types: PropertyType[]; structures: Structure[]; locations: LocationRank[]; hazards: Hazard[];
};

const TIERS: Tier[] = [
  { label: '都心築浅区分', weight: 25, priceRange: [30_000_000, 50_000_000], yieldRange: [0.04, 0.06], ageRange: [0, 10], types: ['区分マンション'], structures: ['RC'], locations: ['S', 'A'], hazards: ['低', '低', '中'] },
  { label: '都市部中築', weight: 30, priceRange: [50_000_000, 120_000_000], yieldRange: [0.06, 0.08], ageRange: [10, 25], types: ['一棟アパート', '区分マンション'], structures: ['鉄骨', 'RC', '木造'], locations: ['A', 'B'], hazards: ['低', '中'] },
  { label: '都市RC一棟', weight: 10, priceRange: [100_000_000, 250_000_000], yieldRange: [0.05, 0.07], ageRange: [5, 20], types: ['一棟マンション'], structures: ['RC'], locations: ['S', 'A'], hazards: ['低', '中'] },
  { label: '地方築古木造', weight: 25, priceRange: [10_000_000, 60_000_000], yieldRange: [0.08, 0.12], ageRange: [20, 35], types: ['一棟アパート'], structures: ['木造'], locations: ['B', 'C'], hazards: ['中', '高'] },
  { label: '高利回りの罠', weight: 10, priceRange: [5_000_000, 30_000_000], yieldRange: [0.14, 0.18], ageRange: [30, 45], types: ['一棟アパート'], structures: ['木造'], locations: ['C'], hazards: ['中', '高', '高'] },
];

const randBetween = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(randBetween(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function pickTier(): Tier {
  const total = TIERS.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of TIERS) { roll -= t.weight; if (roll <= 0) return t; }
  return TIERS[TIERS.length - 1];
}

let propertySeq = 0;
let cutinSeq = 1000;
const NAME_PARTS = ['グランド', 'パーク', 'リバー', 'サン', 'ヒルズ', 'コート', 'メゾン', 'ヴィラ', 'レジデンス', 'テラス'];

export function generateProperty(): Property {
  const tier = pickTier();
  const price = Math.round(randBetween(...tier.priceRange) / 1_000_000) * 1_000_000;
  const grossYield = randBetween(...tier.yieldRange);
  const monthlyRent = Math.round((price * grossYield) / 12 / 1_000) * 1_000;
  propertySeq += 1;
  return {
    id: `p${propertySeq}`,
    name: `${pick(NAME_PARTS)}${pick(NAME_PARTS)} ${tier.label}`,
    type: pick(tier.types), structure: pick(tier.structures), locationRank: pick(tier.locations),
    age: randInt(...tier.ageRange), hazard: pick(tier.hazards),
    price, monthlyRent, occupancyRate: randBetween(0.85, 1.0),
    loanBalance: 0, loanRate: DEFAULT_LOAN_RATE, condition: Math.max(20, 100 - randInt(...tier.ageRange) * 2),
  };
}

export function generateMarket(n: number = MARKET_SIZE): Property[] {
  return Array.from({ length: n }, () => generateProperty());
}

// ───────────────────────────────────────────────
// 計算（UIからも参照）
// ───────────────────────────────────────────────
export function buyCashRequired(p: Property): number {
  return Math.round(p.price * (1 - LTV_MAX) + p.price * ACQUISITION_COST);
}
export function sellProceeds(p: Property, marketChill: number = 0, sellMult: number = 1): number {
  const chillDiscount = marketChill > 0 ? 0.10 : 0;
  return Math.round(p.price * (0.96 - chillDiscount) * sellMult - p.loanBalance);
}
export function renovateCost(p: Property): number {
  return Math.max(1_000_000, Math.round(p.price * 0.05));
}
export function canRenovate(p: Property, cash: number): boolean {
  return p.condition < 85 && cash >= renovateCost(p);
}
const REPAY_UNIT = 5_000_000;

// ───────────────────────────────────────────────
// レベル＆EXP
// ───────────────────────────────────────────────
export function expNeeded(level: number): number {
  return 6 + level * 4; // Lv1→2に10、以降4ずつ増
}

/** EXPがしきい値を超えていて、まだカード提示中でなければ強化カードを用意 */
function checkLevelUp(s: GameState): GameState {
  if (s.pendingLevelUp || s.status !== 'playing') return s;
  if (s.exp >= expNeeded(s.level)) {
    return { ...s, pendingLevelUp: pick3() };
  }
  return s;
}

const initialPerks: Perks = {
  rentMult: 1, loanRateBonus: 0, passiveIncome: 0, reformMult: 1, sellMult: 1, vacancyResist: 0,
};

export function createInitialState(): GameState {
  return {
    turn: 0, cash: INITIAL_CASH, properties: [], market: generateMarket(),
    rivalNetWorth: INITIAL_CASH, status: 'playing',
    log: [`ゲーム開始：取締役会の条件は「36ヶ月で純資産7,500万円」。${RIVAL_NAME}の買収を退けろ！`],
    unlockedAchievements: [], lastEvent: null, marketChill: 0, cutins: [],
    history: [{ turn: 0, netWorth: INITIAL_CASH, rival: INITIAL_CASH, cash: INITIAL_CASH }],
    exp: 0, level: 1, perks: { ...initialPerks }, pendingLevelUp: null,
    lastTurnIncome: 0, comboFlash: null,
  };
}

function checkEndings(s: GameState): GameState {
  if (s.status !== 'playing') return s;
  const netWorth = calcNetWorth(s);
  if (s.cash < 0) return { ...s, status: 'bankrupt', log: [...s.log, `💥 現金が尽きた…アーベインは${RIVAL_NAME}に買収された。`] };
  if (netWorth >= WIN_NET_WORTH) return { ...s, status: 'won', log: [...s.log, `🎉 純資産${Math.round(netWorth / 10_000).toLocaleString()}万円達成！${RIVAL_NAME}の買収提案を堂々と退けた！`] };
  if (s.turn >= TOTAL_TURNS) return { ...s, status: 'timeup', log: [...s.log, `⏰ 約束の36ヶ月が経過。目標未達…取締役会は${RIVAL_NAME}への売却を決議した。`] };
  return s;
}

export type GameAction =
  | { type: 'END_TURN' }
  | { type: 'BUY'; propertyId: string }
  | { type: 'SELL'; propertyId: string }
  | { type: 'RENOVATE'; propertyId: string }
  | { type: 'REPAY_LOAN'; propertyId: string }
  | { type: 'DISMISS_CUTIN' }
  | { type: 'RESOLVE_CUTIN'; choice: number }
  | { type: 'RESOLVE_LEVELUP'; upgradeId: string };

const man = (yen: number) => `${Math.round(yen / 10_000).toLocaleString()}万円`;

export function gameReducer(state: GameState, action: GameAction): GameState {
  // ポーズ中（カットイン or レベルアップ）は対応アクション以外をブロック
  const paused = state.cutins.length > 0 || state.pendingLevelUp;
  const allowed = ['DISMISS_CUTIN', 'RESOLVE_CUTIN', 'RESOLVE_LEVELUP'];
  if (paused && !allowed.includes(action.type)) return state;
  if (state.status !== 'playing' && action.type !== 'DISMISS_CUTIN') return state;

  switch (action.type) {
    case 'DISMISS_CUTIN':
      return { ...state, cutins: state.cutins.slice(1) };

    case 'RESOLVE_CUTIN': {
      const cutin = state.cutins[0];
      if (!cutin || !cutin.choices) return { ...state, cutins: state.cutins.slice(1) };
      const { state: resolved, message } = resolveCutIn(state, cutin, action.choice);
      let next: GameState = { ...resolved, cutins: state.cutins.slice(1), lastEvent: message, log: message ? [...resolved.log, message] : resolved.log };
      next = checkEndings(next);
      return applyAchievements(next);
    }

    case 'RESOLVE_LEVELUP': {
      if (!state.pendingLevelUp) return state;
      const u = applyUpgrade(state, action.upgradeId);
      let next: GameState = {
        ...u,
        exp: u.exp - expNeeded(u.level),
        level: u.level + 1,
        pendingLevelUp: null,
        log: [...u.log, `⭐ Lv.${u.level + 1} に昇格！強化「${actionUpgradeName(action.upgradeId)}」を獲得`],
      };
      next = checkLevelUp(next);            // 連続レベルアップ対応
      next = checkEndings(next);
      return applyAchievements(next);
    }

    case 'BUY': {
      const p = state.market.find((m) => m.id === action.propertyId);
      if (!p) return state;
      const required = buyCashRequired(p);
      if (state.cash < required) return state;

      // パーク反映：今後の物件の家賃倍率・金利引き下げを購入時にベイク
      const bought: Property = {
        ...p,
        monthlyRent: Math.round((p.monthlyRent * state.perks.rentMult) / 1000) * 1000,
        loanRate: Math.max(0.005, p.loanRate - state.perks.loanRateBonus),
        loanBalance: Math.round(p.price * LTV_MAX),
      };
      let next: GameState = {
        ...state,
        cash: state.cash - required,
        properties: [...state.properties, bought],
        market: state.market.filter((m) => m.id !== p.id),
        exp: state.exp + 6, // 購入でEXP
        log: [...state.log, `🏠 ${p.name} を購入（価格${man(p.price)}／頭金+諸費用 ${man(required)}／借入${man(bought.loanBalance)}）`],
      };
      next = checkLevelUp(next);
      return applyAchievements(next);
    }

    case 'SELL': {
      const p = state.properties.find((m) => m.id === action.propertyId);
      if (!p) return state;
      const proceeds = sellProceeds(p, state.marketChill, state.perks.sellMult);
      return applyAchievements({
        ...state,
        cash: state.cash + proceeds,
        properties: state.properties.filter((m) => m.id !== p.id),
        log: [...state.log, `💰 ${p.name} を売却（手取り ${proceeds >= 0 ? '' : '−'}${man(Math.abs(proceeds))}）`],
      });
    }

    case 'RENOVATE': {
      const p = state.properties.find((m) => m.id === action.propertyId);
      if (!p || !canRenovate(p, state.cash)) return state;
      const cost = renovateCost(p);
      const headroom = Math.max(0, (100 - p.condition) / 100);
      const valueGain = Math.round(cost * REFORM_VALUE_MULT * state.perks.reformMult * headroom);
      const rentGain = Math.round((p.monthlyRent * valueGain) / p.price / 1_000) * 1_000;
      const renovated: Property = {
        ...p, price: p.price + valueGain, monthlyRent: p.monthlyRent + rentGain,
        condition: Math.min(100, p.condition + 25), occupancyRate: Math.min(1, p.occupancyRate + 0.05),
      };
      return applyAchievements({
        ...state, cash: state.cash - cost,
        properties: state.properties.map((m) => (m.id === p.id ? renovated : m)),
        log: [...state.log, `🔨 ${p.name} をリフォーム（費用${man(cost)}→評価額+${man(valueGain)}・家賃+${man(rentGain)}/月）`],
      });
    }

    case 'REPAY_LOAN': {
      const p = state.properties.find((m) => m.id === action.propertyId);
      if (!p || p.loanBalance <= 0) return state;
      const amount = Math.min(REPAY_UNIT, p.loanBalance, state.cash);
      if (amount <= 0) return state;
      return applyAchievements({
        ...state, cash: state.cash - amount,
        properties: state.properties.map((m) => (m.id === p.id ? { ...m, loanBalance: m.loanBalance - amount } : m)),
        log: [...state.log, `🏦 ${p.name} のローンを繰上返済（${man(amount)}）`],
      });
    }

    case 'END_TURN': {
      const log: string[] = [];
      const prevNetWorth = calcNetWorth(state);

      // 1) 収支精算＋元本返済＋副収入
      let grossRent = 0;
      let cashDelta = state.perks.passiveIncome;
      const properties = state.properties.map((p) => {
        grossRent += p.monthlyRent * p.occupancyRate;
        cashDelta += calcMonthlyCashFlow(p);
        const payment = calcLoanPayment(p.loanBalance, p.loanRate);
        const interest = (p.loanBalance * p.loanRate) / 12;
        const principalPaid = Math.min(Math.max(payment - interest, 0), p.loanBalance);
        return { ...p, loanBalance: Math.round(p.loanBalance - principalPaid) };
      });
      const cash = Math.round(state.cash + cashDelta);
      if (state.properties.length > 0) {
        log.push(`月次精算：キャッシュフロー ${cashDelta >= 0 ? '+' : ''}${Math.round(cashDelta).toLocaleString()}円`);
      }

      // 2) ライバル
      const rivalGrowth = RIVAL_MONTHLY_RATE + randBetween(-RIVAL_RANDOM, RIVAL_RANDOM);
      const rivalNetWorth = Math.round(state.rivalNetWorth * (1 + rivalGrowth));

      // 3) EXP（家賃収入ベース＋保有ボーナス）
      const expGain = Math.floor(grossRent / 100_000) + (state.properties.length > 0 ? 1 : 0);

      const turn = state.turn + 1;
      let next: GameState = {
        ...state, turn, cash, properties, rivalNetWorth,
        market: generateMarket(), marketChill: Math.max(0, state.marketChill - 1),
        lastEvent: null, cutins: [], exp: state.exp + expGain,
        lastTurnIncome: Math.round(grossRent + state.perks.passiveIncome),
        comboFlash: null, log: [...state.log, ...log],
      };

      // 4) イベント（パーク：空室耐性を渡す）
      const event = rollEvent(next, next.perks.vacancyResist);
      if (event) {
        next = { ...event.state, cutins: [...next.cutins, event.cutin], lastEvent: event.cutin.choices ? null : `${event.cutin.title}：${event.cutin.message}` };
        if (!event.cutin.choices) next = { ...next, log: [...next.log, `${event.cutin.title}：${event.cutin.message}`] };
      }

      // 5) ストーリービート（決算）
      if (turn === 12 || turn === 24) {
        const nw = calcNetWorth(next);
        const ahead = nw > next.rivalNetWorth;
        cutinSeq += 1;
        next = {
          ...next,
          cutins: [...next.cutins, {
            id: `story${cutinSeq}`, speaker: 'rival', tone: ahead ? 'pos' : 'neg',
            title: `📅 第${turn / 12}期 決算 ─ ${RIVAL_NAME}社長`,
            message: ahead
              ? `「ほう…純資産${Math.round(nw / 10_000).toLocaleString()}万か。少しはやるようだな。だが3年後に笑うのは我々だ」`
              : `「その程度か。当社は${Math.round(next.rivalNetWorth / 10_000).toLocaleString()}万だ。アーベインの看板が泣いているぞ」`,
          }],
        };
      }

      // 6) コンボフラッシュ（純資産の伸び）
      const newNetWorth = calcNetWorth(next);
      const gain = newNetWorth - prevNetWorth;
      const ratio = prevNetWorth > 0 ? gain / prevNetWorth : 0;
      next.comboFlash = ratio >= 0.10 ? 'EXCELLENT' : ratio >= 0.06 ? 'GREAT' : ratio >= 0.03 ? 'GOOD' : null;

      // 7) 履歴・勝敗・実績・レベルアップ
      next = { ...next, history: [...state.history, { turn, netWorth: newNetWorth, rival: next.rivalNetWorth, cash: next.cash }] };
      next = checkEndings(next);
      next = applyAchievements(next);
      next = checkLevelUp(next);
      return next;
    }

    default:
      return state;
  }
}

// レベルアップログ用に名前を引く（循環import回避のため軽量に）
function actionUpgradeName(id: string): string {
  const m: Record<string, string> = {
    rent: '家賃アップ交渉', rate: '金利優遇', passive: 'コンサル副収入', occ: '満室経営ノウハウ',
    reform: '敏腕リフォーム', sell: '高値売却術', resist: '空室・滞納対策', value: '資産価値向上', jackpot: '臨時ボーナス',
  };
  return m[id] ?? id;
}
