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

  const proTitle = appTsx.indexOf('preset-name preset-name--pro', proPanelStart);
  const proResetButton = appTsx.indexOf('<button onClick={handleProReset}', proPanelStart);
  const proPanelHead = appTsx.slice(proPanelStart, proPanelStart + 300);
  assert.notEqual(proTitle, -1, 'Proパネルのタイトルが見つからないよ');
  assert.notEqual(proResetButton, -1, 'Proパネルのリセットボタンが見つからないよ');
  assert.ok(proTitle < proResetButton, 'Proパネルはタイトルがいちばん上に来てほしいよ');
  assert.match(
    proPanelHead,
    /<div className="preset-name preset-name--pro">Proモード<\/div>/,
    'Proパネルのタイトルは「Proモード」にしてほしいよ',
  );

  const normalPanelStart = appTsx.indexOf('<div className="panel-shared controls">');
  assert.notEqual(normalPanelStart, -1, '通常パネルのDOM開始が見つからないよ');

  const normalTitle = appTsx.indexOf('<div className="preset-name">{modeName}</div>', normalPanelStart);
  const normalResetButton = appTsx.indexOf('<button onClick={handleNormalReset}', normalPanelStart);
  assert.notEqual(normalTitle, -1, '通常パネルのタイトルが見つからないよ');
  assert.notEqual(normalResetButton, -1, '通常パネルのリセットボタンが見つからないよ');
  assert.ok(normalTitle < normalResetButton, '通常パネルはタイトルがいちばん上に来てほしいよ');
});

test('Proタイトル用のCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.preset-name--pro\s*\{[\s\S]*?color:\s*var\(--accent-pink\);/);
});

test('タイトル見た目のCSSがある', async () => {
  const css = await readFile(path.join(projectRoot, 'index.css'), 'utf8');
  assert.match(css, /\.preset-name\s*\{[\s\S]*?font-size:\s*1\.2em;/);
  assert.match(css, /\.preset-name\s*\{[\s\S]*?margin:\s*0;/);
});
