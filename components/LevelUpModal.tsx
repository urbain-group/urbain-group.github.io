'use client';

import { getUpgrade, Rarity } from '@/lib/upgrades';
import { GameAction } from '@/lib/game';

const RARITY_STYLE: Record<Rarity, { card: string; tag: string; label: string }> = {
  normal: { card: 'border-[#5A3C28] bg-[#FCF4DC]', tag: 'bg-[#C8B890] text-[#4A3020]', label: 'ノーマル' },
  rare:   { card: 'border-[#3A78C0] bg-[#E8F0FC]', tag: 'bg-[#3A78C0] text-white', label: 'レア' },
  epic:   { card: 'border-[#E0A020] bg-[#FFF6D8]', tag: 'bg-[#E0A020] text-white', label: 'エピック' },
};

export default function LevelUpModal({
  choices, level, dispatch,
}: {
  choices: string[];
  level: number;
  dispatch: (a: GameAction) => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#201408]/80 animate-[backdropIn_.2s_ease-out]">
      {/* 放射状のきらめき背景 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'repeating-conic-gradient(from 0deg, transparent 0deg 12deg, rgba(255,216,120,.5) 12deg 24deg)' }}
      />
      <div className="relative mx-4 w-full max-w-2xl animate-[cutinPop_.35s_cubic-bezier(.2,1.4,.4,1)]">
        <div className="mb-3 text-center">
          <p className="text-3xl font-bold text-[#FFE070]" style={{ textShadow: '2px 2px 0 #B05810' }}>
            ⭐ LEVEL UP! ⭐
          </p>
          <p className="mt-1 text-sm text-[#FFF0C8]">Lv.{level} → Lv.{level + 1} ／ 強化を1つ選べ！</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {choices.map((id) => {
            const u = getUpgrade(id);
            if (!u) return null;
            const st = RARITY_STYLE[u.rarity];
            return (
              <button
                key={id}
                onClick={() => dispatch({ type: 'RESOLVE_LEVELUP', upgradeId: id })}
                className={`pix-panel ${st.card} flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:brightness-105`}
              >
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${st.tag}`}>{st.label}</span>
                <span className="text-4xl">{u.icon}</span>
                <span className="text-sm font-bold text-[#4A3020]">{u.name}</span>
                <span className="text-[11px] leading-5 text-[#6A5038]">{u.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
