# 進捗メモ: サイドパネルタイトル統一＆最上部移動

- 対象: `App.tsx` の通常パネル/Proパネルのタイトル表示
- 対応内容:
  - タイトル表示を `.preset-name` に統一（Proは `.preset-name--pro` で色だけ変更）
  - タイトルを各パネルの先頭要素に移動（最上部に表示される並びに変更）
  - `index.css` の `.preset-name` を微調整（`font-size: 1.2em;` / `margin: 0;`）
- 追加:
  - Node組み込みの `node --test` を使った最小テスト追加（DOM順とCSS存在チェック）

## 実行確認
- `npm run build` OK
- `npm test` OK

## メモ
- サンドボックス制限でローカルHTTPサーバのポートバインドができず、ブラウザでの自動目視確認は未実施。

## 追記: Proタイトル変更＆Mac風見た目

- Proパネルのタイトル文言を「Proモード」に変更
- タイトルの見た目を“Macっぽいタイトルバー”風に調整（背景/枠/影/左の3色ドット/スクロール時に上で固定）
- テストに「Proモード」文言チェックを追加

## 実行確認（追記）
- `npm test` OK
- `npm run build` OK


## 追記: タイトルをサイドパネル外へ分離

- タイトルを `.panel-shared` の外に移動し、サイドパネルと“切り離し”配置に変更（画像イメージ寄せ）
- `.sidebar-stack` を追加して、タイトル（上）＋パネル（下、スクロール）構造に
- `.preset-name` は外置き用に `margin` など微調整（sticky解除、relativeに変更）

## 実行確認（追記）
- `npm test` OK
- `npm run build` OK


## 追記: サイドパネル右端で切れる問題

- 原因: `.sidebar-stack` の幅が固定(340px)で、`.panel-shared`（padding込みの見た目幅）がはみ出して右端で切れていた
- 対応: `.sidebar-stack` の幅固定を外し、`flex-shrink: 0` を追加してパネル幅に追従＆縮まないようにした

## 実行確認（追記）
- `npm test` OK
- `npm run build` OK


## 追記: Proモードの横スクロール(グレー帯)対策

- 原因候補: `.textarea-code` が `width: 100%` なのに `box-sizing` 未指定で、padding/border 分だけ横にはみ出しやすい
- 対応: `.textarea-code { box-sizing: border-box; }` を追加
- テスト: CSSに `box-sizing: border-box` が入ってることを最小チェック

## 実行確認（追記）
- `npm test` OK


## 追記: Proモードの「通常モードに戻る」ボタン位置

- Proモードの「通常モードに戻る」ボタンを、`🔄 設定をリセット` ボタンの上へ移動
- テストでボタン順（戻る→リセット）を最小チェック

## 実行確認（追記）
- `npm test` OK


## 追記: 「通常モードに戻る」ボタンを黄色に

- Proモードの「通常モードに戻る」ボタンのクラスを `btn-warning` に変更
- `index.css` に `.btn-warning`（黄色系）を追加

## 実行確認（追記）
- `npm test` OK


## 追記: プレビュー背景を深いネイビーに

- プレビュー背景を黒→深いネイビー寄りの“ほぼ黒”へ変更
  - p5側: `sketch.ts` の `background(0)` を `#050816` に統一、残像フェードも `rgba(5, 8, 22, alpha)` へ
  - CSS側: `.canvas-container` の背景を `#050816` に変更

## 実行確認（追記）
- `npm test` OK
- `npm run build` OK
