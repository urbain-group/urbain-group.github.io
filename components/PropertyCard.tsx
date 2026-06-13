'use client';

import { Property } from '@/types';
import { calcGrossYield, calcNetYield, calcMonthlyCashFlow } from '@/lib/finance';
import { buyCashRequired, sellProceeds, renovateCost, canRenovate, GameAction } from '@/lib/game';

const man = (yen: number) => `${Math.round(yen / 10_000).toLocaleString()}万`;

const SPRITE: Record<Property['type'], string> = {
  区分マンション: '/properties/kubun.svg',
  一棟アパート: '/properties/apartment.svg',
  一棟マンション: '/properties/mansion.svg',
};

const HAZARD_CLS: Record<Property['hazard'], string> = {
  低: 'bg-[#D8F0C0] text-[#3E9028]',
  中: 'bg-[#FCE8B8] text-[#C08018]',
  高: 'bg-[#F8D0C8] text-[#D04830]',
};

const LOCATION_LABEL: Record<Property['locationRank'], string> = {
  S: '都心S', A: '都市A', B: '郊外B', C: '地方C',
};

export default function PropertyCard({
  property: p, variant, cash, marketChill, sellMult = 1, dispatch,
}: {
  property: Property;
  variant: 'owned' | 'market';
  cash: number;
  marketChill: number;
  sellMult?: number;
  dispatch: (a: GameAction) => void;
}) {
  const gross = calcGrossYield(p) * 100;
  const net = calcNetYield(p) * 100;
  const cf = calcMonthlyCashFlow(p);
  const ltv = p.price > 0 ? (p.loanBalance / p.price) * 100 : 0;
  const required = buyCashRequired(p);
  const canBuy = cash >= required;

  return (
    <article className="pix-panel overflow-hidden transition hover:-translate-y-0.5">
      {/* 上段：スプライト＋名前＋属性バッジ */}
      <div className="flex items-center gap-3 border-b-[3px] border-[#5A3C28] bg-[#F4E8C8] p-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SPRITE[p.type]} alt={p.type} className="sprite h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{p.name}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] leading-4">
            <Badge>{p.type}</Badge>
            <Badge>{p.structure}造</Badge>
            <Badge>{LOCATION_LABEL[p.locationRank]}</Badge>
            <Badge>築{p.age}年</Badge>
            <span className={`rounded px-1.5 ${HAZARD_CLS[p.hazard]}`}>災害{p.hazard}</span>
          </div>
        </div>
        <div className="shrink-0 rounded border-2 border-[#C08018] bg-[#FCE8B8] px-2 py-1 text-center">
          <span className="block text-base font-bold leading-tight text-[#C08018]">{gross.toFixed(1)}%</span>
          <span className="block text-[9px] text-[#8A7458]">表面利回り</span>
        </div>
      </div>

      {/* 諸元 */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 px-3 py-2 text-sm sm:grid-cols-6">
        <Stat label="価格" value={man(p.price)} />
        <Stat label="家賃/月" value={man(p.monthlyRent)} />
        <Stat label="実質利回り" value={`${net.toFixed(1)}%`} />
        <Stat label="入居率" value={`${Math.round(p.occupancyRate * 100)}%`} />
        {variant === 'owned' ? (
          <>
            <Stat label="月次CF" value={`${cf >= 0 ? '+' : ''}${man(cf)}`} tone={cf >= 0 ? 'pos' : 'neg'} />
            <Stat label="LTV(残債)" value={`${ltv.toFixed(0)}%`} tone={ltv > 80 ? 'neg' : undefined} />
          </>
        ) : (
          <>
            <Stat label="状態" value={`${p.condition}/100`} />
            <Stat label="必要現金" value={man(required)} tone={canBuy ? undefined : 'neg'} />
          </>
        )}
      </div>

      {/* 操作 */}
      <div className="flex flex-wrap gap-2 border-t-[3px] border-[#5A3C28] bg-[#F4E8C8] p-2">
        {variant === 'market' ? (
          <button
            disabled={!canBuy}
            onClick={() => dispatch({ type: 'BUY', propertyId: p.id })}
            title={canBuy ? '' : '現金不足（頭金20%+諸費用7%が必要）'}
            className="pix-btn px-3 py-1.5 text-xs font-bold"
          >
            🏠 購入する（{man(required)}）
          </button>
        ) : (
          <>
            <button
              onClick={() => dispatch({ type: 'SELL', propertyId: p.id })}
              title={marketChill > 0 ? '売却難：通常より10%引かれます' : ''}
              className="pix-btn pix-btn-plain px-3 py-1.5 text-xs"
            >
              💰 売却（{man(sellProceeds(p, marketChill, sellMult))}）{marketChill > 0 && ' 🥶'}
            </button>
            <button
              disabled={!canRenovate(p, cash)}
              onClick={() => dispatch({ type: 'RENOVATE', propertyId: p.id })}
              title={p.condition >= 85 ? '状態が良好なため効果なし' : cash < renovateCost(p) ? '現金不足' : ''}
              className="pix-btn pix-btn-plain px-3 py-1.5 text-xs"
            >
              🔨 リフォーム（{man(renovateCost(p))}）
            </button>
            <button
              disabled={p.loanBalance <= 0 || cash <= 0}
              onClick={() => dispatch({ type: 'REPAY_LOAN', propertyId: p.id })}
              className="pix-btn pix-btn-plain px-3 py-1.5 text-xs"
            >
              🏦 繰上返済（500万）
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-[#E8D8B0] px-1.5 text-[#6A5038]">{children}</span>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div>
      <p className="text-[9px] text-[#8A7458]">{label}</p>
      <p className={`font-bold leading-tight ${tone === 'pos' ? 'text-[#3E9028]' : tone === 'neg' ? 'text-[#D04830]' : 'text-[#4A3020]'}`}>
        {value}
      </p>
    </div>
  );
}
