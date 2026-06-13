'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '@/types';
import { createInitialState, gameReducer, GameAction } from '@/lib/game';
import { calcNetWorth } from '@/lib/finance';
import { TOTAL_TURNS, RIVAL_NAME } from '@/lib/config';
import Hud from '@/components/Hud';
import TownMap from '@/components/TownMap';
import PropertyCard from '@/components/PropertyCard';
import LogPanel from '@/components/LogPanel';
import AchievementPanel from '@/components/AchievementPanel';
import Advisor from '@/components/Advisor';
import EventCutIn from '@/components/EventCutIn';
import LevelUpModal from '@/components/LevelUpModal';
import FloatingNumbers from '@/components/FloatingNumbers';
import NetWorthChart from '@/components/NetWorthChart';
import StoryIntro from '@/components/StoryIntro';
import SoundToggle from '@/components/SoundToggle';
import PixelBackdrop from '@/components/PixelBackdrop';
import {
  startBGM, seClick, seBuy, seSell, seRenovate, seRepay, seTurnEnd,
  seEventPos, seEventNeg, seAchieve, seWin, seLose, seCoin, seCard, seLevelUp, seCombo,
} from '@/lib/sound';

export default function Home() {
  const [state, setState] = useState<GameState | null>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => { setState(createInitialState()); }, []);

  const dispatch = useCallback((action: GameAction) => {
    switch (action.type) {
      case 'BUY': seBuy(); break;
      case 'SELL': seSell(); break;
      case 'RENOVATE': seRenovate(); break;
      case 'REPAY_LOAN': seRepay(); break;
      case 'END_TURN': seTurnEnd(); break;
      case 'RESOLVE_LEVELUP': seCard(); break;
      case 'RESOLVE_CUTIN': case 'DISMISS_CUTIN': seClick(); break;
    }
    setState((prev) => (prev ? gameReducer(prev, action) : prev));
  }, []);

  const restart = useCallback(() => { setState(createInitialState()); setStarted(false); }, []);

  const activeCutin = state?.cutins[0] ?? null;
  const levelUp = !activeCutin ? state?.pendingLevelUp ?? null : null;

  // 演出SE
  const prevCutinId = useRef<string | null>(null);
  useEffect(() => {
    if (activeCutin && activeCutin.id !== prevCutinId.current) {
      prevCutinId.current = activeCutin.id;
      if (activeCutin.tone === 'pos') seEventPos();
      else if (activeCutin.tone === 'neg') seEventNeg();
    }
  }, [activeCutin]);

  const levelUpShown = useRef(false);
  useEffect(() => {
    if (levelUp && !levelUpShown.current) { seLevelUp(); levelUpShown.current = true; }
    if (!levelUp) levelUpShown.current = false;
  }, [levelUp]);

  const prevAchieveCount = useRef(0);
  useEffect(() => {
    const n = state?.unlockedAchievements.length ?? 0;
    if (n > prevAchieveCount.current && started) seAchieve();
    prevAchieveCount.current = n;
  }, [state?.unlockedAchievements.length, started]);

  const prevStatus = useRef<string>('playing');
  useEffect(() => {
    const s = state?.status ?? 'playing';
    if (s !== prevStatus.current) {
      if (s === 'won') seWin();
      if (s === 'bankrupt' || s === 'timeup') seLose();
      prevStatus.current = s;
    }
  }, [state?.status]);

  // ターン進行時：コイン音
  const prevTurn = useRef(0);
  useEffect(() => {
    if (state && state.turn > prevTurn.current && started) {
      if (state.lastTurnIncome > 0) seCoin();
      if (state.comboFlash) seCombo();
      prevTurn.current = state.turn;
    }
  }, [state?.turn, started, state?.lastTurnIncome, state?.comboFlash]);

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="pix-panel px-6 py-3">市場データを取得中…</p>
      </main>
    );
  }

  const netWorth = calcNetWorth(state);
  const finished = state.status !== 'playing';
  const beatRival = netWorth > state.rivalNetWorth;
  const paused = !!activeCutin || !!levelUp;

  const title =
    state.status === 'won'
      ? netWorth >= 100_000_000 ? '👑 称号「伝説の投資家」を獲得！'
        : beatRival ? '🏆 称号「業界の覇者」を獲得！' : '🎉 称号「一流の不動産投資家」を獲得！'
      : null;

  return (
    <>
    <PixelBackdrop />
    <FloatingNumbers trigger={state.turn} amount={state.lastTurnIncome} />

    {/* コンボフラッシュ */}
    {state.comboFlash && !finished && (
      <div
        key={`combo-${state.turn}`}
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/3 z-40 animate-[comboPop_1.2s_ease-out_forwards] text-5xl font-extrabold"
        style={{ color: '#FFE070', textShadow: '3px 3px 0 #D04830, -1px -1px 0 #B05810' }}
      >
        {state.comboFlash}!
      </div>
    )}

    <main className="relative z-10 mx-auto max-w-6xl px-3 pb-12">
      <SoundToggle />

      {!started && (
        <StoryIntro onStart={() => { startBGM(); seClick(); setStarted(true); }} />
      )}

      {started && activeCutin && <EventCutIn cutin={activeCutin} dispatch={dispatch} />}
      {started && levelUp && <LevelUpModal choices={levelUp} level={state.level} dispatch={dispatch} />}

      <header className="pt-4 pb-3 text-center">
        <div className="pix-panel inline-block px-6 py-2">
          <h1 className="text-2xl font-bold text-[#C08018]" style={{ textShadow: '2px 2px 0 #5A3C28' }}>
            🏢 アーベイン・タイクーン
          </h1>
          <p className="mt-0.5 text-[11px] text-[#8A7458]">
            {RIVAL_NAME}の買収を退けろ！ 36ヶ月で純資産7,500万円
          </p>
        </div>
      </header>

      <Hud state={state} netWorth={netWorth} />
      <Advisor state={state} netWorth={netWorth} />
      <TownMap properties={state.properties} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <NetWorthChart history={state.history} />
        <div className="space-y-3">
          {state.lastEvent && !finished && (
            <div key={state.turn} className="pix-panel animate-[fadeSlide_.5s_ease-out] overflow-hidden">
              <h2 className="pix-title px-3 py-1 text-xs">📰 今月の出来事</h2>
              <p className="px-3 py-2 text-sm">{state.lastEvent}</p>
            </div>
          )}
          {state.marketChill > 0 && !finished && (
            <div className="pix-panel border-[#D04830] px-3 py-2 text-xs text-[#D04830]">
              🥶 流動性低下中：あと{state.marketChill}ヶ月、売却額が10%引かれます
            </div>
          )}
          <AchievementPanel unlocked={state.unlockedAchievements} />
        </div>
      </div>

      {finished && (
        <div className="pix-panel mt-4 overflow-hidden text-center">
          <h2 className={`px-3 py-1.5 text-sm text-[#FFF8E8] border-b-[3px] border-[#5A3C28] ${state.status === 'won' ? 'bg-[#58B030]' : 'bg-[#D04830]'}`}>
            {state.status === 'won' ? '🎊 ゲームクリア！' : '😢 ゲームオーバー'}
          </h2>
          <div className="p-4">
            <p className="text-base font-bold">
              {state.status === 'won' && `アーベインは${RIVAL_NAME}の買収提案を退け、独立を守り抜いた——`}
              {state.status === 'bankrupt' && `資金が尽き、アーベインの看板は${RIVAL_NAME}の手に渡った——`}
              {state.status === 'timeup' && `約束の3年。目標未達…取締役会は${RIVAL_NAME}への売却を決議した——`}
            </p>
            {title && <p className="mt-1 text-sm text-[#C08018]">{title}</p>}
            <p className="mt-2 text-sm text-[#6A5038]">
              最終純資産 {Math.round(netWorth / 10_000).toLocaleString()}万円 ／ {RIVAL_NAME}{' '}
              {Math.round(state.rivalNetWorth / 10_000).toLocaleString()}万円
              （{beatRival ? 'あなたの勝ち！' : 'ライバルの勝ち'}）
            </p>
            <button onClick={restart} className="pix-btn mt-3 px-6 py-2 text-sm font-bold">🔄 もう一度挑戦する</button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="pix-panel mb-2 inline-block px-3 py-1 text-sm font-bold">
            🏘️ 保有物件 <span className="text-[#C08018]">{state.properties.length}件</span>
          </h2>
          {state.properties.length === 0 ? (
            <div className="pix-panel p-5 text-center text-sm text-[#8A7458]">
              まだ物件を保有していません。購入候補から最初の一棟を選びましょう！
            </div>
          ) : (
            <div className="space-y-3">
              {state.properties.map((p) => (
                <PropertyCard key={p.id} property={p} variant="owned" cash={state.cash} marketChill={state.marketChill} sellMult={state.perks.sellMult} dispatch={dispatch} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="pix-panel mb-2 inline-block px-3 py-1 text-sm font-bold">🏪 購入候補（売り物件）</h2>
          <div className="space-y-3">
            {state.market.map((p) => (
              <PropertyCard key={p.id} property={p} variant="market" cash={state.cash} marketChill={state.marketChill} sellMult={state.perks.sellMult} dispatch={dispatch} />
            ))}
          </div>
        </section>
      </div>

      <div className="sticky bottom-3 z-20 mt-6 flex justify-center">
        <button
          onClick={() => dispatch({ type: 'END_TURN' })}
          disabled={finished || paused}
          className="pix-btn pix-btn-green px-12 py-3 text-base font-bold"
        >
          ▶ ターン終了（{state.turn + 1} / {TOTAL_TURNS}ヶ月目へ）
        </button>
      </div>

      <LogPanel log={state.log} />
    </main>
    </>
  );
}
