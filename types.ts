export type PropertyType = '区分マンション' | '一棟アパート' | '一棟マンション';
export type Structure = '木造' | '鉄骨' | 'RC';
export type LocationRank = 'S' | 'A' | 'B' | 'C';
export type Hazard = '低' | '中' | '高';

export type Property = {
  id: string;
  name: string;
  type: PropertyType;
  structure: Structure;
  locationRank: LocationRank;
  age: number;
  hazard: Hazard;
  price: number;
  monthlyRent: number;
  occupancyRate: number;
  loanBalance: number;
  loanRate: number;
  condition: number;
};

export type GameStatus = 'playing' | 'won' | 'bankrupt' | 'timeup';

export type CutInSpeaker = 'advisor' | 'rival' | 'event';
export type CutInTone = 'pos' | 'neg' | 'neutral';
export type ChoiceOption = { label: string; hint: string };

export type CutInPayload =
  | { kind: 'repair'; targetId: string; fullCost: number; cheapCost: number }
  | { kind: 'bigRepair'; targetId: string; fullCost: number; minCost: number }
  | { kind: 'trouble'; targetId: string; politeCost: number }
  | { kind: 'offer'; targetId: string; offerPrice: number };

export type CutIn = {
  id: string;
  speaker: CutInSpeaker;
  title: string;
  message: string;
  tone: CutInTone;
  choices?: ChoiceOption[];
  payload?: CutInPayload;
};

export type HistoryPoint = { turn: number; netWorth: number; rival: number; cash: number };

// ─── 強化パーク（レベルアップで獲得する恒久ボーナス） ───
export type Perks = {
  rentMult: number;       // 今後購入する物件の家賃倍率（累積）
  loanRateBonus: number;  // ローン金利からの引き下げ幅（累積）
  passiveIncome: number;  // 毎月の副収入（円）
  reformMult: number;     // リフォーム効果の倍率（1=標準）
  sellMult: number;       // 売却額の倍率（1=標準）
  vacancyResist: number;  // 空室/滞納/トラブル被害の軽減率（0〜0.8）
};

export type ComboFlash = 'GOOD' | 'GREAT' | 'EXCELLENT' | null;

export type GameState = {
  turn: number;
  cash: number;
  properties: Property[];
  market: Property[];
  rivalNetWorth: number;
  status: GameStatus;
  log: string[];
  unlockedAchievements: string[];
  lastEvent: string | null;
  marketChill: number;
  cutins: CutIn[];
  history: HistoryPoint[];
  // ─── レベル＆強化 ───
  exp: number;
  level: number;
  perks: Perks;
  pendingLevelUp: string[] | null; // レベルアップ時に提示する強化カードID3枚
  // ─── 演出用 ───
  lastTurnIncome: number;          // 直近ターンの家賃収入合計（数字噴出用）
  comboFlash: ComboFlash;          // 純資産が大きく伸びた時のフラッシュ
};
