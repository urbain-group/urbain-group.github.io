import { GameState, Property } from '@/types';

export type Rarity = 'normal' | 'rare' | 'epic';

export type UpgradeDef = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: Rarity;
  weight: number;
  apply: (s: GameState) => GameState;
};

const bumpOwned = (s: GameState, fn: (p: Property) => Property): GameState => ({
  ...s,
  properties: s.properties.map(fn),
});

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'rent', name: '家賃アップ交渉', desc: '全保有＆今後の物件の家賃 +6%', icon: '🏷️',
    rarity: 'normal', weight: 100,
    apply: (s) => ({
      ...bumpOwned(s, (p) => ({ ...p, monthlyRent: Math.round((p.monthlyRent * 1.06) / 1000) * 1000 })),
      perks: { ...s.perks, rentMult: s.perks.rentMult * 1.06 },
    }),
  },
  {
    id: 'rate', name: '金利優遇', desc: '全ローン＆今後の借入金利 −0.3%', icon: '🏦',
    rarity: 'normal', weight: 90,
    apply: (s) => ({
      ...bumpOwned(s, (p) => ({ ...p, loanRate: Math.max(0.005, p.loanRate - 0.003) })),
      perks: { ...s.perks, loanRateBonus: s.perks.loanRateBonus + 0.003 },
    }),
  },
  {
    id: 'passive', name: 'コンサル副収入', desc: '毎月の副収入 +15万円', icon: '💼',
    rarity: 'normal', weight: 90,
    apply: (s) => ({ ...s, perks: { ...s.perks, passiveIncome: s.perks.passiveIncome + 150_000 } }),
  },
  {
    id: 'occ', name: '満室経営ノウハウ', desc: '全保有物件の入居率 +8%', icon: '🏠',
    rarity: 'normal', weight: 80,
    apply: (s) => bumpOwned(s, (p) => ({ ...p, occupancyRate: Math.min(1, p.occupancyRate + 0.08) })),
  },
  {
    id: 'reform', name: '敏腕リフォーム', desc: 'リフォーム効果 +50%', icon: '🔨',
    rarity: 'rare', weight: 35,
    apply: (s) => ({ ...s, perks: { ...s.perks, reformMult: s.perks.reformMult + 0.5 } }),
  },
  {
    id: 'sell', name: '高値売却術', desc: '売却手取り +12%', icon: '💰',
    rarity: 'rare', weight: 35,
    apply: (s) => ({ ...s, perks: { ...s.perks, sellMult: s.perks.sellMult + 0.12 } }),
  },
  {
    id: 'resist', name: '空室・滞納対策', desc: '空室/滞納/トラブルの被害 −30%', icon: '🛡️',
    rarity: 'rare', weight: 32,
    apply: (s) => ({ ...s, perks: { ...s.perks, vacancyResist: Math.min(0.8, s.perks.vacancyResist + 0.3) } }),
  },
  {
    id: 'value', name: '資産価値向上', desc: '全保有物件の評価額 +5%（純資産が即上昇）', icon: '📈',
    rarity: 'rare', weight: 30,
    apply: (s) => bumpOwned(s, (p) => ({ ...p, price: Math.round((p.price * 1.05) / 1_000_000) * 1_000_000 })),
  },
  {
    id: 'jackpot', name: '臨時ボーナス', desc: '今すぐ現金 +800万円！', icon: '💎',
    rarity: 'epic', weight: 12,
    apply: (s) => ({ ...s, cash: s.cash + 8_000_000 }),
  },
];

export function getUpgrade(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function applyUpgrade(s: GameState, id: string): GameState {
  const u = getUpgrade(id);
  return u ? u.apply(s) : s;
}

/** 重み付きで重複なし3枚を選ぶ */
export function pick3(): string[] {
  const pool = [...UPGRADES];
  const chosen: string[] = [];
  for (let k = 0; k < 3 && pool.length; k++) {
    const total = pool.reduce((sum, u) => sum + u.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) { idx = i; break; }
    }
    chosen.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return chosen;
}
