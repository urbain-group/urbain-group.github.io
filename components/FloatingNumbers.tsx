'use client';

import { useEffect, useState } from 'react';

type Pop = { id: number; x: number; text: string; coin?: boolean };
let seq = 0;

export default function FloatingNumbers({ trigger, amount }: { trigger: number; amount: number }) {
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    if (trigger <= 0 || amount <= 0) return;
    const man = Math.round(amount / 10_000);
    const created: Pop[] = [];
    // メインの収入表示
    created.push({ id: ++seq, x: 50, text: `+${man.toLocaleString()}万円` });
    // コインを散らす
    const coins = Math.min(14, 4 + Math.floor(man / 8));
    for (let i = 0; i < coins; i++) {
      created.push({ id: ++seq, x: 12 + Math.random() * 76, text: '🪙', coin: true });
    }
    setPops((prev) => [...prev, ...created]);
    const timer = setTimeout(() => {
      setPops((prev) => prev.filter((p) => !created.some((c) => c.id === p.id)));
    }, 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-24 z-30 h-0">
      {pops.map((p) => (
        <span
          key={p.id}
          className="absolute -translate-x-1/2 animate-[floatUp_1.5s_ease-out_forwards] whitespace-nowrap font-bold"
          style={{
            left: `${p.x}%`,
            fontSize: p.coin ? '20px' : '26px',
            color: p.coin ? undefined : '#F0B028',
            textShadow: p.coin ? undefined : '2px 2px 0 #5A3C28',
          }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}
