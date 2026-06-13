// ブラウザ内で音を合成するサウンドエンジン（音声ファイル不要）
// BGM: 84bpm ローファイ風 4コードループ / SE: 各種演出音

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bgmGain: GainNode | null = null;
let muted = false;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let nextBarTime = 0;
let barIndex = 0;
let noiseBuf: AudioBuffer | null = null;

const MASTER_VOL = 0.5;
const BGM_VOL = 0.32;

function ensure(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOL;
    master.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = BGM_VOL;
    bgmGain.connect(master);
    // ノイズバッファ（ハイハット・打撃用）
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : MASTER_VOL;
  return muted;
}
export function isMuted() { return muted; }

// ─── 基本パーツ ───
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode) {
  const c = ensure();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(dest ?? master!);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(t: number, dur: number, vol: number, hp = 6000, dest?: AudioNode) {
  const c = ensure();
  if (!noiseBuf) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  src.connect(f); f.connect(g); g.connect(dest ?? master!);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// ─── BGM（Cmaj7→Am7→Dm7→G7 のローファイループ） ───
const BPM = 116;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
// [ベース, コード構成音(midi)]（明るいC-Am-F-G）
const PROG: [number, number[]][] = [
  [36, [60, 64, 67]], // C
  [33, [57, 60, 64]], // Am
  [29, [53, 57, 60]], // F
  [31, [55, 59, 62]], // G
];
// 小節ごとの固定メロディ（4分音符×4。キャッチーに）
const MELODY: number[][] = [
  [72, 76, 79, 76], // ドミソミ
  [72, 76, 81, 79], // ドミラソ
  [69, 72, 77, 76], // ラドファミ
  [74, 77, 79, 83], // レファソシ
];

function scheduleBar(t: number, idx: number) {
  const bar = idx % PROG.length;
  const [bassN, chord] = PROG[bar];
  const dest = bgmGain!;
  // ベース：4分でズンズン（1・3拍ルート、2・4拍は5度）
  tone(midi(bassN), t, BEAT * 0.85, 'triangle', 0.28, dest);
  tone(midi(bassN + 7), t + BEAT, BEAT * 0.85, 'triangle', 0.18, dest);
  tone(midi(bassN), t + BEAT * 2, BEAT * 0.85, 'triangle', 0.28, dest);
  tone(midi(bassN + 7), t + BEAT * 3, BEAT * 0.85, 'triangle', 0.18, dest);
  // コード：裏拍のポルカ風スタブ
  for (const n of chord) {
    for (let b = 0; b < 4; b++) {
      tone(midi(n), t + BEAT * b + BEAT / 2, BEAT * 0.3, 'square', 0.022, dest);
    }
  }
  // メロディ：矩形波のリードで固定フレーズ（チップチューンの主役）
  const phrase = MELODY[bar];
  phrase.forEach((n, i) => {
    tone(midi(n), t + BEAT * i, BEAT * 0.75, 'square', 0.06, dest);
  });
  // ハット：8分
  for (let i = 0; i < 8; i++) noise(t + (BEAT / 2) * i, 0.025, i % 2 === 0 ? 0.045 : 0.02, 8000, dest);
}

export function startBGM() {
  const c = ensure();
  if (bgmTimer) return;
  nextBarTime = c.currentTime + 0.1;
  barIndex = 0;
  bgmTimer = setInterval(() => {
    while (nextBarTime < c.currentTime + 0.4) {
      scheduleBar(nextBarTime, barIndex);
      nextBarTime += BAR;
      barIndex += 1;
    }
  }, 150);
}

export function stopBGM() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
}

// ─── SE ───
export function seClick() {
  const t = ensure().currentTime;
  tone(880, t, 0.06, 'square', 0.06);
}

export function seBuy() { // レジ「チャリーン」
  const t = ensure().currentTime;
  noise(t, 0.05, 0.15, 4000);
  tone(1318, t + 0.03, 0.18, 'sine', 0.18);
  tone(1975, t + 0.09, 0.30, 'sine', 0.16);
}

export function seSell() { // コイン上昇アルペジオ
  const t = ensure().currentTime;
  [988, 1318, 1568, 1975].forEach((f, i) => tone(f, t + i * 0.06, 0.16, 'sine', 0.14));
}

export function seRenovate() { // 工事トンカン
  const t = ensure().currentTime;
  noise(t, 0.08, 0.2, 1500);
  noise(t + 0.14, 0.08, 0.16, 1800);
  tone(523, t + 0.26, 0.2, 'triangle', 0.12);
}

export function seRepay() {
  const t = ensure().currentTime;
  tone(659, t, 0.1, 'sine', 0.12);
  tone(523, t + 0.08, 0.16, 'sine', 0.12);
}

export function seTurnEnd() { // めくり＋ドン
  const t = ensure().currentTime;
  noise(t, 0.12, 0.10, 2500);
  tone(196, t + 0.10, 0.25, 'triangle', 0.22);
}

export function seEventPos() { // 明るいスティング
  const t = ensure().currentTime;
  [659, 831, 988].forEach((f, i) => tone(f, t + i * 0.07, 0.25, 'triangle', 0.14));
}

export function seEventNeg() { // 不穏なスティング
  const t = ensure().currentTime;
  tone(220, t, 0.4, 'sawtooth', 0.10);
  tone(233, t, 0.4, 'sawtooth', 0.10);
  tone(110, t + 0.05, 0.5, 'triangle', 0.16);
}

export function seAchieve() { // 実績ファンファーレ
  const t = ensure().currentTime;
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.3, 'triangle', 0.15));
}

export function seWin() {
  const t = ensure().currentTime;
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, t + i * 0.12, 0.5, 'triangle', 0.16));
}

export function seLose() {
  const t = ensure().currentTime;
  [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.5, 'triangle', 0.14));
}


export function seCoin() { // 数字噴出の小気味よい音
  const t = ensure().currentTime;
  tone(1568, t, 0.08, 'square', 0.10);
  tone(2093, t + 0.04, 0.10, 'square', 0.08);
}

export function seCard() { // カード選択
  const t = ensure().currentTime;
  tone(1047, t, 0.06, 'square', 0.08);
  tone(1568, t + 0.05, 0.10, 'square', 0.07);
}

export function seLevelUp() { // レベルアップ・ファンファーレ（豪華）
  const t = ensure().currentTime;
  const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
  notes.forEach((f, i) => {
    tone(f, t + i * 0.07, 0.4, 'square', 0.13);
    tone(f / 2, t + i * 0.07, 0.4, 'triangle', 0.06);
  });
  // きらめき
  for (let i = 0; i < 6; i++) tone(2093 + i * 200, t + 0.5 + i * 0.04, 0.2, 'sine', 0.05);
}

export function seCombo() { // GOOD/GREAT等のフラッシュ
  const t = ensure().currentTime;
  tone(880, t, 0.1, 'square', 0.1);
  tone(1320, t + 0.07, 0.18, 'square', 0.1);
}
