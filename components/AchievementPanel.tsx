'use client';

import { ACHIEVEMENTS } from '@/lib/achievements';

export default function AchievementPanel({ unlocked }: { unlocked: string[] }) {
  return (
    <section className="pix-panel overflow-hidden">
      <h2 className="pix-title px-3 py-1.5 text-sm">
        🏅 実績 {unlocked.length}/{ACHIEVEMENTS.length}
      </h2>
      <div className="grid grid-cols-4 gap-1.5 p-2.5 sm:grid-cols-7 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.includes(a.id);
          return (
            <div
              key={a.id}
              title={`${a.name}：${a.description}`}
              className={`rounded border-2 p-1.5 text-center ${
                got ? 'border-[#C08018] bg-[#FCE8B8]' : 'border-[#C8B890] bg-[#F0E4C8] opacity-60'
              }`}
            >
              <div className="text-base leading-5">{got ? '🏅' : '🔒'}</div>
              <p className={`mt-0.5 text-[9px] leading-3 ${got ? 'text-[#C08018] font-bold' : 'text-[#8A7458]'}`}>
                {a.name}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
