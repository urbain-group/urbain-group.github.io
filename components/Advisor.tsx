'use client';

import { GameState } from '@/types';
import { calcMonthlyCashFlow } from '@/lib/finance';
import { WIN_NET_WORTH } from '@/lib/config';

function advisorComment(s: GameState, netWorth: number): string {
  const totalCF = s.properties.reduce((sum, p) => sum + calcMonthlyCashFlow(p), 0);

  if (s.status === 'won') return 'お見事です、社長！この成果、業界中の噂になりますよ！';
  if (s.status === 'bankrupt') return '……次は現金にもっと余裕を。再起しましょう、社長。';
  if (s.status === 'timeup') return 'タイムアップです。次は序盤からCFを積み上げましょう。';

  if (s.properties.length === 0)
    return 'まずは1件目ですね！表面利回りだけでなく、立地・築年・災害リスクも見てください。';
  if (s.cash < 5_000_000)
    return '⚠️ 現金が心細いです！突発修繕が来たら危険…売却か、購入を控えましょう。';
  if (totalCF < 0)
    return '⚠️ 毎月の収支が赤字です。このままだと現金が削られ続けます…';
  if (netWorth >= WIN_NET_WORTH * 0.9)
    return '目標まであと少し！この調子です、社長！';
  if (netWorth < s.rivalNetWorth)
    return 'ライバル社に純資産で負けています。攻め時かもしれません！';
  if (s.marketChill > 0)
    return '市場が冷えています。いま売ると損…保有で耐えるのも手です。';
  return '順調です！CFと現金残高のバランスを保ちつつ拡大しましょう。';
}

export default function Advisor({ state, netWorth }: { state: GameState; netWorth: number }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/characters/advisor.svg"
        alt="秘書・橘"
        className="sprite h-12 w-12 shrink-0 rounded border-[3px] border-[#5A3C28] bg-[#A8E0F0]"
      />
      <div className="pix-panel relative flex-1 px-3 py-2 text-sm">
        <span className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-[3px] border-l-[3px] border-[#5A3C28] bg-[#FCF4DC]" />
        {advisorComment(state, netWorth)}
      </div>
    </div>
  );
}
