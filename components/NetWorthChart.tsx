'use client';

import { HistoryPoint } from '@/types';
import { WIN_NET_WORTH, RIVAL_NAME } from '@/lib/config';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

export default function NetWorthChart({ history }: { history: HistoryPoint[] }) {
  const data = history.map((h) => ({
    turn: h.turn,
    あなた: Math.round(h.netWorth / 10_000),
    [RIVAL_NAME]: Math.round(h.rival / 10_000),
    現金: Math.round(h.cash / 10_000),
  }));

  return (
    <section className="pix-panel overflow-hidden">
      <h2 className="pix-title px-3 py-1.5 text-sm">📈 純資産の推移（万円）</h2>
      <div className="h-52 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#E0D0A8" strokeDasharray="3 3" />
            <XAxis dataKey="turn" stroke="#8A7458" fontSize={11} tickLine={false} />
            <YAxis stroke="#8A7458" fontSize={11} tickLine={false} width={50} />
            <Tooltip
              contentStyle={{
                background: '#FCF4DC', border: '3px solid #5A3C28',
                borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-pixel)',
              }}
              labelFormatter={(t) => `${t}ヶ月目`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine
              y={WIN_NET_WORTH / 10_000}
              stroke="#3E9028"
              strokeDasharray="6 4"
              label={{ value: '目標7,500万', fill: '#3E9028', fontSize: 11, position: 'insideTopRight' }}
            />
            <Line type="monotone" dataKey="あなた" stroke="#F08020" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey={RIVAL_NAME} stroke="#7878D0" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="現金" stroke="#A89058" strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
