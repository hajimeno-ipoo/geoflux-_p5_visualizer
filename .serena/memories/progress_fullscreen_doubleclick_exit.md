# 進捗メモ: 全画面 → ダブルクリックで元に戻らない

## 症状
- 「⛶ 全画面」で入ったあと、ダブルクリックで元の表示に戻れない（ユーザー報告）。

## 原因（可能性が高い）
- ブラウザによっては `document.fullscreenElement` が正しく取れず、
  すでに全画面でも「未全画面」と判定して `requestFullscreen()` を再実行してしまい、`exitFullscreen()` が呼ばれないことがある。

## 対応（最小）
- `App.tsx` の `toggleFullscreen()` をブラウザ互換に変更。
  - 判定: `document.fullscreenElement` に加えて `document.webkitFullscreenElement` なども参照
  - 入る: `requestFullscreen` が無い場合は `webkitRequestFullscreen` 等も使用
  - 出る: `exitFullscreen` が無い場合は `webkitExitFullscreen` 等も使用

## 確認
- Playwrightで「⛶ 全画面 → #canvasContainer をダブルクリック → fullscreen解除」を確認
- `npm test` / `npm run build` OK