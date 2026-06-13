'use client';

import { CutIn } from '@/types';
import { GameAction } from '@/lib/game';

const TONE_BAR = {
  pos: 'bg-[#58B030]',
  neg: 'bg-[#D04830]',
  neutral: 'bg-[#F08020]',
} as const;

const SPEAKER_IMG: Record<CutIn['speaker'], string | null> = {
  advisor: '/characters/advisor.svg',
  rival: '/characters/rival.svg',
  event: null,
};

export default function EventCutIn({
  cutin, dispatch,
}: {
  cutin: CutIn;
  dispatch: (a: GameAction) => void;
}) {
  const img = SPEAKER_IMG[cutin.speaker];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302010]/70 animate-[backdropIn_.2s_ease-out]">
      <div className="pix-panel mx-4 w-full max-w-md animate-[cutinPop_.3s_cubic-bezier(.2,1.4,.4,1)] overflow-hidden">
        <h3
          className={`px-3 py-1.5 text-sm text-[#FFF8E8] border-b-[3px] border-[#5A3C28] ${TONE_BAR[cutin.tone]}`}
          style={{ textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}
        >
          {cutin.title}
        </h3>
        <div className="flex items-start gap-3 p-4">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="sprite h-16 w-16 shrink-0 animate-[portraitIn_.35s_ease-out] rounded border-2 border-[#5A3C28]" />
          )}
          <p className="text-sm leading-7">{cutin.message}</p>
        </div>

        <div className="space-y-2 px-4 pb-4">
          {cutin.choices ? (
            cutin.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => dispatch({ type: 'RESOLVE_CUTIN', choice: i })}
                className="pix-btn pix-btn-plain block w-full px-3 py-2.5 text-left"
              >
                <span className="text-sm font-bold">▶ {c.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#8A7458]">{c.hint}</span>
              </button>
            ))
          ) : (
            <button
              onClick={() => dispatch({ type: 'DISMISS_CUTIN' })}
              className="pix-btn mx-auto block px-10 py-2 text-sm font-bold"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
