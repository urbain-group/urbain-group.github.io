import { createInitialState, gameReducer, generateMarket } from '../lib/game';
import { calcNetWorth, calcGrossYield, calcMonthlyCashFlow } from '../lib/finance';

// ─── 1) 購入候補の生成チェック ───
console.log('━━━ 購入候補（サンプル6件） ━━━');
for (const p of generateMarket(6)) {
  console.log(
    `${p.name} | ${p.type}/${p.structure}/立地${p.locationRank}/築${p.age}年/ハザード${p.hazard}` +
    ` | 価格${(p.price / 10_000).toLocaleString()}万 | 表面${(calcGrossYield(p) * 100).toFixed(1)}%` +
    ` | 家賃${(p.monthlyRent / 10_000).toFixed(1)}万/月`
  );
}

// ─── 2) 物件なしで36ターン回す：現金不変・ライバルは約+8%/年で成長 ───
let s = createInitialState();
for (let i = 0; i < 36; i++) s = gameReducer(s, { type: 'END_TURN' });
console.log('\n━━━ 36ターン経過（物件なし） ━━━');
console.log('ターン:', s.turn, '/ status:', s.status);                 // 期待: 36 / timeup
console.log('現金:', s.cash.toLocaleString());                          // 期待: 50,000,000（不変）
console.log('ライバル純資産:', s.rivalNetWorth.toLocaleString());       // 期待: 約63,000,000（±変動）

// ─── 3) 物件を1件持たせて精算が機能するか ───
let s2 = createInitialState();
const prop = generateMarket(1)[0];
prop.loanBalance = Math.round(prop.price * 0.8); // LTV80%で持った想定
s2 = { ...s2, properties: [prop], cash: s2.cash - Math.round(prop.price * 0.27) }; // 頭金20%+諸費用7%
console.log('\n━━━ 物件1件保有で12ターン ━━━');
console.log('物件:', prop.name, '/ 月次CF:', Math.round(calcMonthlyCashFlow(prop)).toLocaleString());
const balBefore = prop.loanBalance;
for (let i = 0; i < 12; i++) s2 = gameReducer(s2, { type: 'END_TURN' });
console.log('12ヶ月後の残債:', s2.properties[0].loanBalance.toLocaleString(), `（開始時 ${balBefore.toLocaleString()} → 減っていればOK）`);
console.log('現金:', s2.cash.toLocaleString(), '/ 純資産:', calcNetWorth(s2).toLocaleString());
console.log('ログ末尾:', s2.log[s2.log.length - 1]);
