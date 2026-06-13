import { GameState } from '@/types';
import { calcNetWorth, calcGrossYield } from './finance';
import { TOTAL_TURNS } from './config';

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  check: (s: GameState) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'firstBuy',
    name: 'はじめの一歩',
    description: '初めての物件を購入する',
    check: (s) => s.properties.length >= 1,
  },
  {
    id: 'highYield',
    name: '利回りハンター',
    description: '表面利回り10%以上の物件を取得する',
    check: (s) => s.properties.some((p) => calcGrossYield(p) >= 0.10),
  },
  {
    id: 'loanFree',
    name: '無借金経営',
    description: '保有物件のローンを完済する',
    check: (s) => s.properties.some((p) => p.loanBalance === 0),
  },
  {
    id: 'tenProps',
    name: '不動産王への道',
    description: '物件を10件同時に保有する',
    check: (s) => s.properties.length >= 10,
  },
  {
    id: 'survivor',
    name: '完走者',
    description: '破産せずに36ヶ月を走り切る',
    check: (s) => s.turn >= TOTAL_TURNS && s.status !== 'bankrupt',
  },
  {
    id: 'hundredMillion',
    name: '伝説の投資家',
    description: '純資産1億円を達成する（ストレッチ目標）',
    check: (s) => calcNetWorth(s) >= 100_000_000,
  },
  {
    id: 'beatRival',
    name: '業界の覇者',
    description: 'ライバル会社を上回ってクリアする',
    check: (s) => s.status === 'won' && calcNetWorth(s) > s.rivalNetWorth,
  },
];

/** 未解除の実績をチェックし、新規解除があれば反映して返す */
export function applyAchievements(s: GameState): GameState {
  const newly = ACHIEVEMENTS.filter(
    (a) => !s.unlockedAchievements.includes(a.id) && a.check(s)
  );
  if (newly.length === 0) return s;
  return {
    ...s,
    unlockedAchievements: [...s.unlockedAchievements, ...newly.map((a) => a.id)],
    log: [...s.log, ...newly.map((a) => `🏅 実績解除：「${a.name}」 ${a.description}`)],
  };
}
