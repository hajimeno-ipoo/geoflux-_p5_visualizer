# 進捗メモ: 音声ファイル読み込みでサイドパネルが動く

## 症状
- 音声ファイル選択（読み込み中トースト表示）した直後に、サイドパネルが左へずれて見える。

## 原因
- `.container` が `display: flex` の横並び。
- `App.tsx` で `<div className="toast ...">` を `.container` 直下に置いているが、`index.css` に `.toast` のスタイルが無く、
  トーストが **flexアイテムとして横幅を持ってしまい** サイドパネルを押した。

## 対応（最小）
- `index.css` に `.toast` を追加し、`position: absolute; top/right` の overlay 表示に変更（レイアウトを押さない）。
- ついでに `.toast.show` で表示/非表示を `opacity` で制御。

## 確認
- `npm test` OK（CSSの回帰テスト追加）
- `npm run build` OK
