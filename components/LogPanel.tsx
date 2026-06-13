'use client';

export default function LogPanel({ log }: { log: string[] }) {
  const recent = log.slice(-8).reverse();
  return (
    <section className="pix-panel mt-5 overflow-hidden">
      <h2 className="pix-title px-3 py-1.5 text-sm">📜 社史（記録）</h2>
      <div className="p-3 text-sm leading-7 text-[#6A5038]">
        {recent.length === 0 ? (
          <p>まだ記録はありません。</p>
        ) : (
          recent.map((line, i) => (
            <p key={i} className={i === 0 ? 'font-bold text-[#4A3020]' : ''}>
              {line}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
