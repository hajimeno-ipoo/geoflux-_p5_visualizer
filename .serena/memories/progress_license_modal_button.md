# 進捗メモ: アプリ内ライセンス表示ボタン

- 対象: `App.tsx`, `index.css`, `test/sidepanel-title.test.js`
- 追加内容:
  - ライセンス表示用の状態 `showLicense` とモーダルUIを追加（ボタンは通常/Pro両方のエクスポートセクション）
  - 表示文はライセンスの本文のみで名前は含めない
  - モーダル用CSS（overlay/dialog/text）を追加
  - テスト追加（ライセンスボタン/モーダル/CSS/名前が表示に含まれないこと）

## 実行確認
- `npm test` OK
