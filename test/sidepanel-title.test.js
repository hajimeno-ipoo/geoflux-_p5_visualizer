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

test('通常モードにランダム生成ボタンがある', async () => {
  const appTsx = await readFile(path.join(projectRoot, 'App.tsx'), 'utf8');
  assert.ok(appTsx.includes('<button onClick={generateRandomParams}'), '通常モードの「ランダム生成」ボタンが見つからないよ');
});

test('p5.soundを読み込まない（AudioWorklet回避）', async () => {
  const html = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
  assert.ok(!html.includes('p5.sound.min.js'), 'index.html に p5.sound の読み込みが残ってるよ');
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
