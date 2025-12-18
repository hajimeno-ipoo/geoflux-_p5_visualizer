# 進捗メモ: パターンプレビューの再生/一時停止/停止

## 目的
- パターンプレビュー（p5描画）を「再生 / 一時停止 / 停止」で操作できるようにする。
- UI がプレビュー上で大きくなりすぎないようにする。

## 対応内容
### UI（プレビュー上）
- `App.tsx`
  - `isPreviewPaused` state を追加。
  - `.canvas-container` 内に `.preview-playback-controls` を追加。
  - ボタン: 再生(▶) / 一時停止(⏸) / 停止(⏹)
    - 再生: `p5.loop()`
    - 一時停止: `p5.noLoop()`
    - 停止: `noLoop → resetAnimation → clearCanvas → redraw`（先頭フレームを描画）

### sketch 側
- `sketch.ts`
  - `(p as any).resetAnimation = () => { f = 0; }` を追加。
  - `p.draw` の `f += currentSpeed` を `if (p.isLooping()) f += currentSpeed;` に変更。
    - noLoop 状態で `redraw()` したときに時間が進まないようにする。

### 見た目（大きくしない）
- `index.css`
  - `.preview-playback-controls` と `.preview-playback-controls button` を追加。
  - ボタンの `padding`/`height` を小さめにして、プレビュー上で邪魔になりにくくした。
  - `energy-saver`（省エネ）時は `backdrop-filter` を無効化対象に追加。

## テスト/ビルド
- `npm test` OK
- `npm run build` OK
