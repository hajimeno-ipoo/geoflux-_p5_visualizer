import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

test('サイドパネルのタイトルが統一されて最上部にある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');

  const proPanelStart = appTsx.indexOf('<div className="panel-shared pro-panel">');
  assert.notEqual(proPanelStart, -1, 'ProパネルのDOM開始が見つからないよ');

  const proResetButton = appTsx.indexOf('<button onClick={handleProReset}', proPanelStart);
  const proReturnButton = appTsx.indexOf('<button onClick={toggleProPanel}', proPanelStart);
  assert.notEqual(proResetButton, -1, 'Proパネルのリセットボタンが見つからないよ');
  assert.notEqual(proReturnButton, -1, 'Proパネルの「通常モードに戻る」ボタンが見つからないよ');
  assert.ok(proReturnButton < proResetButton, 'Proパネルは「通常モードに戻る」をリセットより上にしてほしいよ');
  const proPanelBeforeReset = appTsx.slice(proPanelStart, proResetButton);
  assert.ok(!proPanelBeforeReset.includes('preset-name'), 'Proパネルの中にタイトルが入ってないでほしいよ');

  const proTitleMarkup = '<div className="preset-name preset-name--pro">Proモード</div>';
  const proTitle = appTsx.lastIndexOf(proTitleMarkup, proPanelStart);
  assert.notEqual(proTitle, -1, 'Proパネルのタイトルが見つからないよ');
  assert.ok(proTitle < proPanelStart, 'Proパネルのタイトルはサイドパネルの外に置いてほしいよ');

  const proStackStart = appTsx.lastIndexOf('<div className="sidebar-stack">', proPanelStart);
  assert.notEqual(proStackStart, -1, 'Pro側のラッパー(.sidebar-stack)が見つからないよ');
  assert.ok(proStackStart < proTitle, 'Pro側のラッパー内にタイトルがあってほしいよ');

  const normalPanelStart = appTsx.indexOf('<div className="panel-shared controls">');
  assert.notEqual(normalPanelStart, -1, '通常パネルのDOM開始が見つからないよ');

  const normalResetButton = appTsx.indexOf('<button onClick={handleNormalReset}', normalPanelStart);
  assert.notEqual(normalResetButton, -1, '通常パネルのリセットボタンが見つからないよ');
  const normalPanelBeforeReset = appTsx.slice(normalPanelStart, normalResetButton);
  assert.ok(!normalPanelBeforeReset.includes('preset-name'), '通常パネルの中にタイトルが入ってないでほしいよ');

  const normalTitleMarkup = '<div className="preset-name">{modeName}</div>';
  const normalTitle = appTsx.lastIndexOf(normalTitleMarkup, normalPanelStart);
  assert.notEqual(normalTitle, -1, '通常パネルのタイトルが見つからないよ');
  assert.ok(normalTitle < normalPanelStart, '通常パネルのタイトルはサイドパネルの外に置いてほしいよ');

  const normalStackStart = appTsx.lastIndexOf('<div className="sidebar-stack">', normalPanelStart);
  assert.notEqual(normalStackStart, -1, '通常側のラッパー(.sidebar-stack)が見つからないよ');
  assert.ok(normalStackStart < normalTitle, '通常側のラッパー内にタイトルがあってほしいよ');
});

test('Proタイトル用のCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.preset-name--pro\s*\{[\s\S]*?color:\s*var\(--accent-pink\);/);
});

test('タイトル見た目のCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.preset-name\s*\{[\s\S]*?font-size:\s*1\.2em;/);
  assert.match(css, /\.preset-name\s*\{[\s\S]*?margin:\s*16px 24px 12px 24px;/);
  assert.match(css, /\.sidebar-stack\s*\{[\s\S]*?display:\s*flex;/);
});

test('コードコピー欄が横にはみ出さないCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.textarea-code\s*\{[\s\S]*?box-sizing:\s*border-box;/);
});

test('省エネトグルとFPS上限がある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  assert.ok(appTsx.includes('ぼかし（ガラス）をオフ'), '省エネトグル（ぼかしOFF）が見つからないよ');
  assert.ok(appTsx.includes('FPS上限'), 'FPS上限のUIが見つからないよ');
  assert.ok(appTsx.includes('frameRate(fpsLimit)'), 'fpsLimit を p5 に反映してないっぽいよ');
});

test('省エネ時にbackdrop-filterを無効化するCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.container\.energy-saver\s+\.panel-shared[\s\S]*?backdrop-filter:\s*none;/);
  assert.match(css, /\.container\.energy-saver[\s\S]*?-webkit-backdrop-filter:\s*none;/);
});

test('プレビューに再生/一時停止/停止ボタンがある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  assert.ok(appTsx.includes('preview-playback-controls'), 'プレビューの再生UIが見つからないよ');
  assert.ok(appTsx.includes('aria-label="再生"'), '再生ボタンが見つからないよ');
  assert.ok(appTsx.includes('aria-label="一時停止"'), '一時停止ボタンが見つからないよ');
  assert.ok(appTsx.includes('aria-label="停止"'), '停止ボタンが見つからないよ');
});

test('プレビュー再生UIが大きくなりすぎないCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.preview-playback-controls\s*\{[\s\S]*?padding:\s*6px;/);
  assert.match(css, /\.preview-playback-controls\s+button\s*\{[\s\S]*?padding:\s*6px 8px;/);
  assert.match(css, /\.preview-playback-controls\s+button\s*\{[\s\S]*?height:\s*30px;/);
});

test('通常モードにランダム生成ボタンがある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  assert.ok(appTsx.includes('<button onClick={generateRandomParams}'), '通常モードの「ランダム生成」ボタンが見つからないよ');
});

test('p5.soundを使う（音楽っぽい帯域のため）', async () => {
  const sketchTs = await readFile(path.join(projectRoot, 'sketch.ts'), 'utf8');
  assert.ok(sketchTs.includes("p5/lib/addons/p5.sound"), 'sketch.ts で p5.sound を読み込んでないよ');
  assert.ok(sketchTs.includes("getEnergy?.('bass')"), 'p5.FFT.getEnergy(bass) が見つからないよ');
});

test('audioFileRefがsketch内で使われている', async () => {
  const sketchTs = await readFile(path.join(projectRoot, 'sketch.ts'), 'utf8');
  assert.ok(sketchTs.includes('audioFileRef.current'), 'sketch.ts で audioFileRef を参照してないよ');
});

test('再生状態がsketchからAppへ通知される', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  const sketchTs = await readFile(path.join(projectRoot, 'sketch.ts'), 'utf8');
  assert.ok(appTsx.includes('onAudioPlayStateChange'), 'App.tsx に onAudioPlayStateChange の受け口が無いよ');
  assert.ok(sketchTs.includes('onAudioPlayStateChange'), 'sketch.ts から onAudioPlayStateChange を呼んでないよ');
});

test('sketch.ts のGC負荷を減らす修正が入ってる', async () => {
  const sketchTs = await readFile(path.join(projectRoot, 'sketch.ts'), 'utf8');
  assert.ok(!sketchTs.includes('p.random([-1, 1])'), 'p.random([-1, 1]) が残ってるよ');
  assert.ok(sketchTs.includes('getNearby(x: number, y: number, out?: SpatialItem[])'), 'SpatialHash.getNearby が配列再利用に対応してないよ');
  assert.ok(sketchTs.includes('function getColorValues(p: p5, val: number, palette: string, out: [number, number, number])'), 'getColorValues が配列再利用に対応してないよ');
});

test('プレビュー停止で時間をリセットできる', async () => {
  const sketchTs = await readFile(path.join(projectRoot, 'sketch.ts'), 'utf8');
  assert.ok(sketchTs.includes('(p as any).resetAnimation'), 'sketch.ts に resetAnimation が無いよ');
  assert.ok(sketchTs.includes('if (p.isLooping()) f += currentSpeed;'), '停止中の redraw で時間が進まないようになってないよ');
});

test('全画面退出後にサイドパネルが押し出されないCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.canvas-container\s*\{[\s\S]*?min-width:\s*0\s*;/);
  assert.match(css, /\.canvas-container\s*\{[\s\S]*?overflow:\s*hidden\s*;/);
  assert.match(css, /\.panel-shared\s*\{[\s\S]*?box-sizing:\s*border-box\s*;/);
});

test('ライセンス表示のボタンとモーダルがある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  assert.ok(appTsx.includes('📄 ライセンス'), 'ライセンスボタンが見つからないよ');
  assert.ok(appTsx.includes('license-overlay'), 'ライセンスのオーバーレイが見つからないよ');
  assert.ok(appTsx.includes('license-dialog'), 'ライセンスのダイアログが見つからないよ');
  assert.ok(appTsx.includes('Personal Use Only License'), 'ライセンス本文が見つからないよ');
  assert.ok(!appTsx.includes('[あなたの名前]'), 'ライセンス表示に名前が入ってるよ');
});

test('ライセンスモーダルのCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.license-overlay\s*\{[\s\S]*?position:\s*absolute\s*;/);
  assert.match(css, /\.license-dialog\s*\{[\s\S]*?border-radius:\s*var\(--radius-outer\);/);
  assert.match(css, /\.license-text\s*\{[\s\S]*?white-space:\s*pre-wrap;/);
});

test('トースト表示がレイアウトを押さないCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.toast\s*\{[\s\S]*?position:\s*absolute\s*;/);
  assert.match(css, /\.toast\s*\{[\s\S]*?right:\s*12px\s*;/);
  assert.match(css, /\.toast\.show\s*\{[\s\S]*?opacity:\s*1\s*;/);
});
