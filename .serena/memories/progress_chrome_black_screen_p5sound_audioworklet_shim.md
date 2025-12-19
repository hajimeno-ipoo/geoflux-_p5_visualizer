# 進捗メモ: Chromeで真っ黒（p5.soundのaudioWorklet addModuleでクラッシュ）

## 症状
- Chromeでアプリを開くと真っ黒。
- Console に `Uncaught TypeError: Cannot read properties of undefined (reading 'addModule')` が出る。
- スタックが `p5_lib_addons_p5_sound.js` → `App.tsx` の `new p5(...)` 付近。

## 原因
- p5.sound が `AudioContext.audioWorklet.addModule(...)` を無条件に呼ぶ。
- 環境によって `AudioContext.prototype.audioWorklet` が存在しない場合があり、そこで落ちる。
  （http のIPアクセス等で発生しやすい可能性）

## 対応（最小）
- `sketch.ts` に `ensureP5SoundAddon()` を追加して、p5.sound を **動的 import** で読み込むように変更。
- 読み込み前に、`AudioContext.prototype.audioWorklet` が無いのに `AudioWorkletNode` だけある環境では、`AudioWorkletNode` を `undefined` にして **p5.sound 側の polyfill を発動** させる（init で落ちない＆音声も動く狙い）。
- `App.tsx` の p5 初期化は `await ensureP5SoundAddon()` の後に `new p5(...)` を実行。

## 確認
- `npm test` OK
- `npm run build` OK
