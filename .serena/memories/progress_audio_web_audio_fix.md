# 進捗メモ: 音声再生まわり（Web Audio → p5.soundへ戻した）

## これまで
- 以前は `InvalidStateError: Failed to construct 'AudioWorkletNode'` などのエラー回避のため、
  一度 Web Audio API（`AudioContext` + `AnalyserNode` + `GainNode` + `HTMLAudioElement`）に置き換えていた。

## いま（最新版）
- ユーザー要望により **p5.sound に復帰**（音楽的にチューニングされた帯域(bass/mid/treble)を重視）。
- `sketch.ts` で `import 'p5/lib/addons/p5.sound';` を使い、
  - 再生: `p.loadSound(...).play()/pause()/stop()`
  - 解析: `p5.FFT.getEnergy('bass'|'mid'|'treble')` / `p5.Amplitude.getLevel()`
  に統一。

## 追加で踏んだ罠と対策
- 罠: 環境によっては p5 が「CDNで入ったグローバルp5」と「Viteでimportしたp5」でズレて、
  p5.soundの `loadSound/FFT/Amplitude` が `new p5(...)` 側に見えず、`updateAudioFile` が `false` になる。
- 対策（最小）
  - `App.tsx`: `new p5(...)` の生成に `window.p5` を優先
  - `sketch.ts`: `loadSound/userStartAudio` を `p` or `globalThis` から拾えるようにフォールバック、`FFT/Amplitude` の生成も `globalThis.p5` 優先

## 実行確認
- `npm test` OK
- `npm run build` OK
- E2Eで「ファイル選択 → ▶再生 → ⏸一時停止 → ⏹停止」まで動作確認済み