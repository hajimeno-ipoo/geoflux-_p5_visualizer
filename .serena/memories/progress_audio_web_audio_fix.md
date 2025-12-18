# 進捗メモ: 音声が再生できない（AudioWorkletエラー）対策

## 症状
- Chrome Console に `InvalidStateError: Failed to construct 'AudioWorkletNode'` が出て、再生/停止が動かない。
- p5.sound が内部で AudioWorkletNode を使うため、初期化/生成に失敗すると音再生が止まる。

## 対応（最小置き換え）
- `p5.sound` 依存を外し、Web Audio API（`AudioContext` + `AnalyserNode` + `GainNode` + `HTMLAudioElement`）で
  - 音声ファイル再生
  - 音量
  - 解析（bass/mid/treble + RMS）
  を行うように変更。

## 変更点
- `sketch.ts`
  - `updateAudioFile/toggleAudio/stopAudio/setAudioVolume` を Web Audio API ベースに置き換え
  - `p.draw` 内の音声解析を `AnalyserNode.getByteFrequencyData/getByteTimeDomainData` へ切替
  - `onAudioPlayStateChange` 通知は維持
- `index.html`
  - CDN の `p5.sound.min.js` 読み込みを削除
- `App.tsx`
  - `updateAudioFile` 失敗時のトースト文言を一般化
- `test/sidepanel-title.test.js`
  - `p5.sound` 読み込みが残っていないことのチェックに更新

## 実行確認
- `npm test` OK
- `npm run build` OK
