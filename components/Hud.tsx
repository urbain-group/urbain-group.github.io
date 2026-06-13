'use client';

import { GameState } from '@/types';
import { calcMonthlyCashFlow } from '@/lib/finance';
import { WIN_NET_WORTH, TOTAL_TURNS, RIVAL_NAME } from '@/lib/config';
import { expNeeded } from '@/lib/game';

const man = (yen: number) => `${Math.round(yen / 10_000).toLocaleString()}万`;

export default function Hud({ state, netWorth }: { state: GameState; netWorth: number }) {
  const totalCF = state.properties.reduce((s, p) => s + calcMonthlyCashFlow(p), 0) + state.perks.passiveIncome;
  const toGoal = WIN_NET_WORTH - netWorth;
  const progress = Math.min(100, Math.max(0, (netWorth / WIN_NET_WORTH) * 100));
  const ahead = netWorth >= state.rivalNetWorth;
  const expPct = Math.min(100, (state.exp / expNeeded(state.level)) * 100);

  const items: { label: string; value: string; cls: string }[] = [
    { label: '💰 現金', value: man(state.cash), cls: state.cash < 5_000_000 ? 'text-[#D04830]' : 'text-[#4A3020]' },
    { label: '🏆 純資産', value: man(netWorth), cls: 'text-[#C08018]' },
    { label: '🎯 目標まで', value: toGoal <= 0 ? '達成!' : man(toGoal), cls: toGoal <= 0 ? 'text-[#3E9028]' : 'text-[#4A3020]' },
    { label: '📊 月次CF', value: `${totalCF >= 0 ? '+' : ''}${man(totalCF)}`, cls: totalCF >= 0 ? 'text-[#3E9028]' : 'text-[#D04830]' },
    { label: `😤 ${RIVAL_NAME}`, value: man(state.rivalNetWorth), cls: ahead ? 'text-[#8A7458]' : 'text-[#D04830]' },
  ];

  return (
    <div className="pix-panel overflow-hidden">
      {/* レベルバー */}
      <div className="flex items-center gap-2 border-b-[3px] border-[#5A3C28] bg-[#3A78C0] px-3 py-1.5">
        <span className="rounded bg-[#FFE070] px-2 py-0.5 text-xs font-bold text-[#5A3C28]">Lv.{state.level}</span>
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-[#1E4880] bg-[#1E4880]">
          <div className="h-full bg-gradient-to-r from-[#A0E0FF] to-[#FFE070] transition-all duration-500" style={{ width: `${expPct}%` }} />
        </div>
        <span className="text-[10px] text-white">EXP {state.exp}/{expNeeded(state.level)}</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[#5A3C28]/20 sm:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="bg-[#FCF4DC] px-3 py-2">
            <p className="text-[10px] text-[#8A7458]">{it.label}</p>
            <p className={`text-xl font-bold leading-tight ${it.cls}`}>{it.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t-[3px] border-[#5A3C28] bg-[#F4E8C8] px-3 py-2">
        <div className="flex justify-between text-[11px] text-[#8A7458]">
          <span>目標 7,500万円までの進捗</span>
          <span className="font-bold text-[#4A3020]">{state.turn} / {TOTAL_TURNS}ヶ月</span>
        </div>
        <div className="mt-1 h-4 overflow-hidden rounded border-2 border-[#5A3C28] bg-[#E8D8B0]">
          <div className="bar-stripes h-full bg-gradient-to-b from-[#A0E060] to-[#58B030] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
