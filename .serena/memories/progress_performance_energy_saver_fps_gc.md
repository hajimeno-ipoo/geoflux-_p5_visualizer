# 進捗メモ: 省エネ(blur)トグル → FPS制限 → GC削減

## 目的
- アプリ起動中のバッテリー消費が大きい/だんだん重くなる問題の対策。
- 指定順：`backdrop-filter省エネトグル → FPS制限 → 配列/オブジェクト量産削減`。

## 対応内容
### 1) backdrop-filter 省エネトグル
- `App.tsx`
  - `energySaver` state を追加。
  - 通常/Pro どちらのパネルにも「ぼかし（ガラス）をオフ」トグルを追加。
  - ルートの `.container` に `energy-saver` クラスを付与。
- `index.css`
  - `.container.energy-saver` 配下で `backdrop-filter` / `-webkit-backdrop-filter` を `none` に上書き。

### 2) FPS制限
- `App.tsx`
  - `fpsLimit` state を追加（60/30/15）。
  - `p5Instance.current.frameRate(fpsLimit)` で反映。
  - UI は通常/Pro の「省エネ」セクションに配置。

### 3) 配列/オブジェクト量産削減（最小）
- `sketch.ts`
  - `SpatialHash` を簡易プール化（セル配列とアイテムオブジェクトを再利用）して GC を削減。
  - `getNearby(x,y,out?)` で結果配列を再利用。
  - `getColorValues(..., out)` で色配列生成をやめ、`colorBuf` を使い回し。
  - `p.random([-1, 1])` をやめて `p.random() < 0.5 ? -1 : 1` に変更。

## テスト/ビルド
- `npm test` OK
- `npm run build` OK
