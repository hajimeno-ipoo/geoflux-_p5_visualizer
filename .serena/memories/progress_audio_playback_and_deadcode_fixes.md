# 進捗メモ: 音声再生/未使用コードの3点修正

## 対象
- `App.tsx`
- `sketch.ts`
- `test/sidepanel-title.test.js`

## 対応内容
1) 音声ファイルが再生できない問題
- `App.tsx` で `p5.sound` をモジュールとして読み込むように変更：`import 'p5/lib/addons/p5.sound';`
  - React側で生成する `new p5(...)` インスタンスに `loadSound/userStartAudio/FFT/Amplitude` などが確実に生える想定。

2) 通常モード用 `generateRandomParams` が未使用（死んでる）
- 通常モードUIに「🎲 ランダム生成」ボタンを追加して `generateRandomParams` を呼ぶように接続。

3) `audioFileRef` が `createSketch` に渡されてるのに未使用
- `sketch.ts` の `p.setup` 内で `audioFileRef.current` がある場合に `updateAudioFile` する処理を追加。
  - p5インスタンス再生成時に、選択済みの音声ファイルを復元しやすくする意図。

## テスト
- 既存テストに加えて、
  - 通常モードのランダム生成ボタン存在
  - `p5.sound` import の存在
  - `sketch.ts` 内で `audioFileRef.current` を参照していること
  を静的にチェックするテストを追加。

## 実行確認
- `npm test` OK
- `npm run build` OK
