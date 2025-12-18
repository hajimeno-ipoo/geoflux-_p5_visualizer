# 進捗メモ: 再生ボタン押しても鳴らない対策

## 対象
- `sketch.ts`
- `App.tsx`
- `test/sidepanel-title.test.js`

## 対応内容
- `sketch.ts`
  - `loadSound` を `File` で直接ロードするように変更（ObjectURL依存を回避）
  - `loadSound`/`userStartAudio` を `p5s` と `window.p5.prototype` の両方から拾えるようにして、p5の取り違えに強くした
  - 読み込み中に再生が押されたら `pendingPlay` で要求を保持し、ロード完了後に自動で `song.play()` する
  - `onAudioPlayStateChange`（コールバック）経由で、再生状態をAppへ通知するようにした（ロード後の自動再生でもUIがズレない）

- `App.tsx`
  - p5インスタンス生成後に `(p5Obj as any).onAudioPlayStateChange = (...) => setIsAudioPlaying(...)` を設定
  - `handleAudioFile()` で `updateAudioFile()` が false を返したらエラートースト＆ `hasAudio=false` にする
  - トースト文言を「読み込み中…」に変更

## テスト
- `test/sidepanel-title.test.js` に、`onAudioPlayStateChange` の接続確認を追加
- `npm test` OK
- `npm run build` OK
