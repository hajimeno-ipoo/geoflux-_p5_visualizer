# 調査メモ: オーディオファイルが再生できない原因

## 状況
- ユーザーから「オーディオファイルが再生できない。原因調査＋“コードはあるのに機能してないもの”も調査」の依頼。

## 有力原因（コード根拠）
1) `sketch.ts` 側の音声ロードが `p5.sound` なしだと何もしない
- `(p as any).updateAudioFile` の先頭で `if (typeof p5s.loadSound !== 'function') return;` となっており、`p5s.loadSound` が無い環境ではロード処理が走らず `song` が作られない。

2) `App.tsx` 側のUIが「ロード成功」と誤認させる
- `handleAudioFile()` は `(p5Instance.current as any).updateAudioFile(file)` の結果に関係なく `setHasAudio(true)` とトースト「読み込みました」を出すため、失敗していても成功に見える。

3) `p5.sound` 依存がCDN/グローバルに寄っていて、React側の `import p5 from 'p5'` と噛み合わない可能性
- `index.html` で `p5.min.js` と `p5.sound.min.js` を CDN から読み込む一方、アプリは `App.tsx`/`sketch.ts` で npm の `p5` を import して `new p5(...)` を生成している。
- `sketch.ts` には `window.p5` から `Amplitude/FFT` を拾うフォールバックがあるが、`loadSound` のフォールバックが無いので、グローバル側にだけ `p5.sound` が乗っているケースだと音声ロードができない。

## “コードはあるのに機能してない”候補
- `App.tsx` の `generateRandomParams` が定義のみで未使用（UIから呼ばれていない）。
- `createSketch` の引数 `audioFileRef` が `sketch.ts` 内で参照されていない（保持だけしている状態）。
- `vite.config.ts` で `process.env.GEMINI_API_KEY` を define しているが、アプリコードから参照が無い（現状は未使用）。

## ユーザー向け確認ポイント（提案）
- ブラウザDevToolsのNetworkで `p5.sound.min.js` が 200 でロードされているか。
- Consoleで `typeof window.p5?.prototype?.loadSound` を確認。
- 可能なら `p5Instance.current` の `loadSound` が存在するかをログ出力して確認。

## 修正案（必要なら）
- `p5/lib/addons/p5.sound` をモジュールとして import し、React側で使っている `p5` に `loadSound/userStartAudio` を確実に生やす（CDN依存を減らせる）。
- `handleAudioFile()` でロード失敗時に `hasAudio` を true にしない／エラー表示を出すようにする。
