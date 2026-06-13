import { calcLoanPayment, calcMonthlyCashFlow, calcNetWorth, calcGrossYield } from '../lib/finance';
import { Property, GameState } from '../types';

// テスト物件：4,000万の区分、家賃16万（表面4.8%）、借入3,200万＠2%
const p: Property = {
  id: 't1', name: 'テスト区分', type: '区分マンション', structure: 'RC',
  locationRank: 'S', age: 5, hazard: '低',
  price: 40_000_000, monthlyRent: 160_000, occupancyRate: 1.0,
  loanBalance: 32_000_000, loanRate: 0.02, condition: 90,
};

const s: GameState = {
  turn: 0, cash: 10_000_000, properties: [p], market: [],
  rivalNetWorth: 50_000_000, status: 'playing', log: [],
};

console.log('返済/月 :', Math.round(calcLoanPayment(32_000_000, 0.02))); // 期待: 約135,600
console.log('CF/月   :', Math.round(calcMonthlyCashFlow(p)));           // 期待: 約 -15,600(区分opex25%)
console.log('純資産  :', calcNetWorth(s));                               // 期待: 18,000,000
console.log('表面利回り:', (calcGrossYield(p) * 100).toFixed(2) + '%');  // 期待: 4.80%
