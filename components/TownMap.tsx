'use client';

import { Property } from '@/types';

const SPRITE: Record<Property['type'], string> = {
  区分マンション: '/properties/kubun.svg',
  一棟アパート: '/properties/apartment.svg',
  一棟マンション: '/properties/mansion.svg',
};

const TILES = 12; // 表示マス数（本社1＋物件11まで。超えたら拡張）

export default function TownMap({ properties }: { properties: Property[] }) {
  const tiles = Math.max(TILES, properties.length + 1);
  return (
    <section className="pix-panel mt-4 overflow-hidden">
      <h2 className="pix-title px-3 py-1.5 text-sm">🏙️ アーベインの街 〜物件が増えると街が育つ〜</h2>
      <div className="grass m-3 grid grid-cols-4 gap-0 border-0 p-2 sm:grid-cols-6">
        {Array.from({ length: tiles }).map((_, i) => {
          if (i === 0) {
            return (
              <Tile key="hq" img="/properties/hq.svg" label="本社" hop />
            );
          }
          const p = properties[i - 1];
          if (p) {
            return <Tile key={p.id} img={SPRITE[p.type]} label={p.name.split(' ')[0]} hop />;
          }
          return <Tile key={`empty${i}`} img="/properties/tree.svg" label="" dim />;
        })}
      </div>
    </section>
  );
}

function Tile({ img, label, hop, dim }: { img: string; label: string; hop?: boolean; dim?: boolean }) {
  return (
    <div className="flex h-24 flex-col items-center justify-end pb-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt=""
        className={`sprite h-14 w-14 ${dim ? 'opacity-60' : ''} ${hop ? 'hover:animate-[hop_.4s_ease-in-out]' : ''}`}
      />
      {label && (
        <span className="mt-0.5 max-w-full truncate rounded bg-[#5A3C28]/80 px-1 text-[9px] leading-4 text-[#FFF8E8]">
          {label}
        </span>
      )}
    </div>
  );
}
