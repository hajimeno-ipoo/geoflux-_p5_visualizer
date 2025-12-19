# 進捗メモ: 全画面退出後にサイドパネルが見えない/切れる

## 症状
- 全画面（ダブルクリック or ⛶）で入って、退出（ダブルクリック/Esc）すると、
  サイドパネルが右に押し出されて「見えない/一部だけ見える」。
- ブラウザの表示縮小（ズームアウト）をすると、サイドパネルが少し見え始める。
- ダブルクリック直後に一瞬だけパネルが見えて消えることがある。

## 原因（コード/レイアウト）
- `.container` と `body` が `overflow: hidden` で横スクロールできない。
- 全画面で大きくなった p5 の `canvas` が「横幅を主張」して、flexアイテムのデフォルト `min-width:auto` のせいで `.canvas-container` が縮められず、
  その結果サイドパネルが画面外へ押し出される。
- さらに `.panel-shared { width: 340px; padding: 24px; }` で実幅が増え、押し出しが起きやすい。

## 対応（最小CSS）
- `index.css`
  - `.canvas-container` に `min-width: 0; overflow: hidden;` を追加（canvasが大きくてもレイアウトを崩さず縮める）
  - `.panel-shared` に `box-sizing: border-box;` を追加（padding込みで幅を制御）

## 確認
- `npm test` OK（CSSの回帰テスト追加）
- `npm run build` OK

## 備考
- この修正は「全画面中にサイドパネルを出す」ではなく、退出後にパネルが押し出されて消えるのを防ぐ対策。