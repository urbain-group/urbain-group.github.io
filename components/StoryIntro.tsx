'use client';

import { RIVAL_NAME, ADVISOR_NAME } from '@/lib/config';

export default function StoryIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302010]/80">
      <div className="pix-panel mx-4 max-w-xl animate-[cutinPop_.35s_ease-out] overflow-hidden">
        <h1 className="pix-title px-4 py-2 text-center text-lg">
          🏢 アーベイン・タイクーン 🏢
        </h1>
        <div className="space-y-3 p-5 text-sm leading-7">
          <p>
            2026年春。あなたは、祖父が遺した不動産会社
            <span className="font-bold text-[#C08018]">「アーベイン」</span>
            の三代目社長に就任した。
          </p>
          <p>
            しかし金庫に残されていたのは、現金<span className="font-bold">5,000万円</span>のみ。
            業界最大手<span className="font-bold text-[#D04830]">「{RIVAL_NAME}」</span>が、買収の手を伸ばしてくる——。
          </p>
          <p className="rounded border-2 border-[#5A3C28] bg-[#F4E8C8] px-3 py-2">
            取締役会の条件はただひとつ。<br />
            <span className="font-bold text-[#D04830]">「36ヶ月以内に純資産7,500万円。達成できなければ、会社を売却する」</span>
          </p>
          <p>{ADVISOR_NAME}とともに、アーベインの看板を守り抜け！</p>
        </div>
        <div className="px-5 pb-5 text-center">
          <button onClick={onStart} className="pix-btn pix-btn-green px-10 py-3 text-base font-bold">
            ▶ 経営をはじめる
          </button>
        </div>
      </div>
    </div>
  );
}
