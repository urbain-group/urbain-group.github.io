import { Property, GameState } from '@/types';
import { OPEX_RATE_BUILDING, OPEX_RATE_KUBUN, LOAN_TERM_MONTHS } from './config';

/** 元利均等の月次返済額 */
export function calcLoanPayment(
  principal: number,
  annualRate: number,
  termMonths: number = LOAN_TERM_MONTHS
): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / termMonths;
  const pow = Math.pow(1 + r, termMonths);
  return (principal * r * pow) / (pow - 1);
}

/** 物件タイプに応じた運営費率 */
export function opexRateOf(p: Property): number {
  return p.type === '区分マンション' ? OPEX_RATE_KUBUN : OPEX_RATE_BUILDING;
}

/** 月次の運営費 */
export function calcMonthlyOpex(p: Property): number {
  return p.monthlyRent * opexRateOf(p);
}

/** 物件の月次キャッシュフロー = 家賃×入居率 − 運営費 − ローン返済
 *  ※v1簡略化：返済額は現在残債をLOAN_TERM_MONTHSで返す想定の近似 */
export function calcMonthlyCashFlow(p: Property): number {
  const income = p.monthlyRent * p.occupancyRate;
  const opex = calcMonthlyOpex(p);
  const debt = calcLoanPayment(p.loanBalance, p.loanRate);
  return income - opex - debt;
}

/** 純資産 = Σ評価額 − Σ残債 + 現金 */
export function calcNetWorth(s: GameState): number {
  const assets = s.properties.reduce((sum, p) => sum + p.price, 0);
  const debt = s.properties.reduce((sum, p) => sum + p.loanBalance, 0);
  return assets - debt + s.cash;
}

/** 表面利回り（年間満室家賃 ÷ 評価額） */
export function calcGrossYield(p: Property): number {
  if (p.price <= 0) return 0;
  return (p.monthlyRent * 12) / p.price;
}

/** 実質利回り（(満室家賃−運営費)×12 ÷ 評価額。v1簡略） */
export function calcNetYield(p: Property): number {
  if (p.price <= 0) return 0;
  return ((p.monthlyRent - calcMonthlyOpex(p)) * 12) / p.price;
}
