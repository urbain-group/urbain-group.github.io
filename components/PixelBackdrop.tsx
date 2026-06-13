/* eslint-disable @next/next/no-img-element */
// 背景の賑やかし：太陽・雲・鳥・気球・山並み・高層ビル群・街並み・道路・車・草花
// ※必ず <main> の外（兄弟要素）として描画すること。z-0で最背面に敷かれる。
export default function PixelBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 太陽 */}
      <img
        src="/bg/sun.svg" alt=""
        className="sprite absolute right-[7%] top-[5%] h-16 w-16 animate-[sunPulse_5s_ease-in-out_infinite]"
      />

      {/* 雲 */}
      <img src="/bg/cloud.svg" alt="" className="sprite absolute top-[8%] h-10 w-20 animate-[cloudDrift_75s_linear_infinite]" />
      <img src="/bg/cloud.svg" alt="" className="sprite absolute top-[17%] h-14 w-28 opacity-90 animate-[cloudDrift_110s_linear_infinite]" style={{ animationDelay: '-40s' }} />
      <img src="/bg/cloud.svg" alt="" className="sprite absolute top-[28%] h-8 w-16 opacity-75 animate-[cloudDrift_95s_linear_infinite]" style={{ animationDelay: '-70s' }} />

      {/* 鳥 */}
      <img src="/bg/bird.svg" alt="" className="sprite absolute top-[13%] h-4 w-8 animate-[birdFly_38s_linear_infinite]" style={{ animationDelay: '-10s' }} />
      <img src="/bg/bird.svg" alt="" className="sprite absolute top-[22%] h-3 w-6 opacity-80 animate-[birdFly_46s_linear_infinite]" style={{ animationDelay: '-30s' }} />

      {/* 気球 */}
      <div className="absolute left-0 top-[20%] animate-[balloonDrift_160s_linear_infinite]" style={{ animationDelay: '-50s' }}>
        <img src="/bg/balloon.svg" alt="" className="sprite h-16 w-12 animate-[bob_3.5s_ease-in-out_infinite]" />
      </div>

      {/* 遠景：山並み */}
      <div
        className="absolute left-0 right-0 top-[60%] h-20 -translate-y-full bg-repeat-x opacity-70"
        style={{ backgroundImage: 'url(/bg/mountains.svg)', backgroundSize: 'auto 100%', backgroundPosition: 'bottom', imageRendering: 'pixelated' }}
      />

      {/* 中景：高層マンション・ビル群（街並みの奥） */}
      <div
        className="absolute left-0 right-0 top-[60%] h-36 -translate-y-full bg-repeat-x opacity-90"
        style={{ backgroundImage: 'url(/bg/skyline.svg)', backgroundSize: 'auto 100%', backgroundPosition: 'bottom', imageRendering: 'pixelated' }}
      />

      {/* 近景：商店街 */}
      <div
        className="absolute left-0 right-0 top-[60%] h-24 -translate-y-full bg-repeat-x"
        style={{ backgroundImage: 'url(/bg/town.svg)', backgroundSize: 'auto 100%', backgroundPosition: 'bottom', imageRendering: 'pixelated' }}
      />

      {/* 道路（地平線の直下に敷く） */}
      <div className="absolute left-0 right-0 top-[60%] h-4 bg-[#8A8078] border-t-2 border-[#6E665E]">
        <div
          className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F8F0D8 0 12px, transparent 12px 28px)' }}
        />
      </div>

      {/* 車（道路の上を走る。folder内keyframesで往復＆向き反転） */}
      <img
        src="/bg/car.svg" alt=""
        className="sprite absolute top-[60%] h-5 w-10 animate-[carDrive_40s_linear_infinite]"
      />

      {/* 草地の花 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[36%] bg-repeat opacity-50"
        style={{ backgroundImage: 'url(/bg/flowers.svg)', backgroundSize: '144px 48px', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
