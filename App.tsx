
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import p5 from 'p5';
import { createSketch } from './sketch';
import { AppParams, defaultParams, presets, Preset } from './types';
import './index.css';

interface AudioControlsProps {
  params: AppParams;
  isPro: boolean;
  handleParamChange: (key: keyof AppParams, value: number | string | boolean) => void;
  handleAudioFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleAudio: () => void;
  stopAudio: () => void;
  hasAudio: boolean;
  isAudioPlaying: boolean;
}

interface CommonParamsControlsProps {
  params: AppParams;
  handleParamChange: (key: keyof AppParams, value: number | string | boolean) => void;
}

interface ModeSpecificControlsProps {
  params: AppParams;
  handleParamChange: (key: keyof AppParams, value: number | string | boolean) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  params, isPro, handleParamChange, handleAudioFile, toggleAudio, stopAudio, hasAudio, isAudioPlaying
}) => {
  const sensKey = isPro ? 'customAudioSens' : 'audioSens';
  const bassKey = isPro ? 'customAudioSensBass' : 'audioSensBass';
  const midKey = isPro ? 'customAudioSensMid' : 'audioSensMid';
  const trebleKey = isPro ? 'customAudioSensTreble' : 'audioSensTreble';
  const volKey = isPro ? 'customAudioVol' : 'audioVol';

  return (
    <div className="section-divider">
      <label className="section-title">🎵 音声リアクティブ (Audio Reactive)</label>
      <input type="file" accept="audio/*" onChange={handleAudioFile} style={{ width: '100%', fontSize: '0.8em', marginBottom: '8px', color: '#aaa' }} />
      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
        <button onClick={toggleAudio} disabled={!hasAudio}>{isAudioPlaying ? "⏸ 一時停止" : "▶ 再生"}</button>
        <button onClick={stopAudio} disabled={!hasAudio}>⏹ 停止</button>
      </div>
      <label>感度 (Sensitivity)</label>
      <div className="slider-group">
        <input type="range" min="0" max="5" step="0.1" value={params[sensKey] as number} onChange={e => handleParamChange(sensKey, parseFloat(e.target.value))} />
        <input type="number" step="0.1" value={params[sensKey] as number} onChange={e => handleParamChange(sensKey, parseFloat(e.target.value))} />
      </div>
      <div style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '2px solid #444', marginBottom: '8px' }}>
        <label style={{ fontSize: '0.85em', color: '#ccc' }}>Low (Bass)</label>
        <div className="slider-group">
          <input type="range" min="0" max="3" step="0.1" value={params[bassKey] as number} onChange={e => handleParamChange(bassKey, parseFloat(e.target.value))} />
          <input type="number" step="0.1" value={params[bassKey] as number} onChange={e => handleParamChange(bassKey, parseFloat(e.target.value))} />
        </div>
        <label style={{ fontSize: '0.85em', color: '#ccc' }}>Mid</label>
        <div className="slider-group">
          <input type="range" min="0" max="3" step="0.1" value={params[midKey] as number} onChange={e => handleParamChange(midKey, parseFloat(e.target.value))} />
          <input type="number" step="0.1" value={params[midKey] as number} onChange={e => handleParamChange(midKey, parseFloat(e.target.value))} />
        </div>
        <label style={{ fontSize: '0.85em', color: '#ccc' }}>High (Treble)</label>
        <div className="slider-group">
          <input type="range" min="0" max="3" step="0.1" value={params[trebleKey] as number} onChange={e => handleParamChange(trebleKey, parseFloat(e.target.value))} />
          <input type="number" step="0.1" value={params[trebleKey] as number} onChange={e => handleParamChange(trebleKey, parseFloat(e.target.value))} />
        </div>
      </div>
      <label>音量 (Volume)</label>
      <div className="slider-group">
        <input type="range" min="0" max="1" step="0.01" value={params[volKey] as number} onChange={e => handleParamChange(volKey, parseFloat(e.target.value))} />
        <input type="number" step="0.01" value={params[volKey] as number} onChange={e => handleParamChange(volKey, parseFloat(e.target.value))} />
      </div>
    </div>
  );
};

const CommonParamsControls: React.FC<CommonParamsControlsProps> = ({ params, handleParamChange }) => (
  <>
    <label>速度 (Speed)</label>
    <div className="slider-group">
      <input type="range" min="0" max="0.05" step="0.001" value={params.speed} onChange={e => handleParamChange('speed', parseFloat(e.target.value))} />
      <input type="number" step="0.001" value={params.speed} onChange={e => handleParamChange('speed', parseFloat(e.target.value))} />
    </div>
    <label>色変化速度 (Hue Speed)</label>
    <div className="slider-group">
      <input type="range" min="0" max="200" step="5" value={params.hueSpeed} onChange={e => handleParamChange('hueSpeed', parseFloat(e.target.value))} />
      <input type="number" step="5" value={params.hueSpeed} onChange={e => handleParamChange('hueSpeed', parseFloat(e.target.value))} />
    </div>
    <label>描画透明度 (Opacity)</label>
    <div className="slider-group">
      <input type="range" min="5" max="100" step="5" value={params.alpha} onChange={e => handleParamChange('alpha', parseFloat(e.target.value))} />
      <input type="number" step="5" value={params.alpha} onChange={e => handleParamChange('alpha', parseFloat(e.target.value))} />
    </div>
    <label>残像 (Trail Effect)</label>
    <div className="slider-group">
      <input type="range" min="1" max="100" step="1" value={params.trailAlpha} onChange={e => handleParamChange('trailAlpha', parseFloat(e.target.value))} />
      <input type="number" step="1" value={params.trailAlpha} onChange={e => handleParamChange('trailAlpha', parseFloat(e.target.value))} />
    </div>
    <div className="checkbox-group" style={{
      marginTop: '10px',
      marginBottom: '10px',
      display: (params.mode === 'moire' || params.mode === 'spiral' || params.mode === 'shader') ? 'block' : 'none'
    }}>
      <label>
        <input
          type="checkbox"
          checked={params.gpuAccelerated || params.mode === 'shader'}
          disabled={params.mode === 'shader'}
          onChange={e => handleParamChange('gpuAccelerated', e.target.checked)}
        /> ⚡ GPU高速化 (GPU Acceleration)
      </label>
    </div>
  </>
);

const ModeSpecificControls: React.FC<ModeSpecificControlsProps> = ({ params, handleParamChange }) => (
  <>
    {params.mode === 'moire' && (
      <div>
        <label>円の数: {params.circles}</label>
        <input type="range" min="1" max="10" step="1" value={params.circles} onChange={e => handleParamChange('circles', parseInt(e.target.value))} />
        <label>点の数: {params.points}</label>
        <input type="range" min="5" max="60" step="1" value={params.points} onChange={e => handleParamChange('points', parseInt(e.target.value))} />
        <label>接続距離: {params.dist}</label>
        <input type="range" min="50" max="500" step="10" value={params.dist} onChange={e => handleParamChange('dist', parseInt(e.target.value))} />
      </div>
    )}
    {params.mode === 'spiral' && (
      <div>
        <label>螺旋強さ: {params.spiralStrength.toFixed(3)}</label>
        <input type="range" min="0" max="0.3" step="0.01" value={params.spiralStrength} onChange={e => handleParamChange('spiralStrength', parseFloat(e.target.value))} />
        <label>レイヤー数: {params.layers}</label>
        <input type="range" min="2" max="20" step="1" value={params.layers} onChange={e => handleParamChange('layers', parseInt(e.target.value))} />
      </div>
    )}
    {params.mode === 'grid' && (
      <div>
        <label>グリッド密度: {params.gridDensity}</label>
        <input type="range" min="5" max="50" step="1" value={params.gridDensity} onChange={e => handleParamChange('gridDensity', parseInt(e.target.value))} />
        <label>回転差: {params.rotDiff.toFixed(3)}</label>
        <input type="range" min="0" max="1.0" step="0.01" value={params.rotDiff} onChange={e => handleParamChange('rotDiff', parseFloat(e.target.value))} />
      </div>
    )}
    {params.mode === 'random' && (
      <div>
        <label>点の数: {params.randomPoints}</label>
        <input type="range" min="50" max="600" step="10" value={params.randomPoints} onChange={e => handleParamChange('randomPoints', parseInt(e.target.value))} />
      </div>
    )}
    {params.mode === 'flower' && (
      <div>
        <label>花びら数: {params.petals}</label>
        <input type="range" min="3" max="25" step="1" value={params.petals} onChange={e => handleParamChange('petals', parseInt(e.target.value))} />
        <label>回転倍率: {params.flowerSpeed}</label>
        <input type="range" min="1" max="15" step="1" value={params.flowerSpeed} onChange={e => handleParamChange('flowerSpeed', parseInt(e.target.value))} />
      </div>
    )}
    {params.mode === 'wave' && (
      <div>
        <label>波の数: {params.waves}</label>
        <input type="range" min="3" max="40" step="1" value={params.waves} onChange={e => handleParamChange('waves', parseInt(e.target.value))} />
        <label>振幅: {params.amp}</label>
        <input type="range" min="20" max="300" step="10" value={params.amp} onChange={e => handleParamChange('amp', parseInt(e.target.value))} />
      </div>
    )}
    {params.mode === 'shader' && (
      <div>
        <label>時間速度: {params.shaderSpeed.toFixed(1)}</label>
        <input type="range" min="0.1" max="5.0" step="0.1" value={params.shaderSpeed} onChange={e => handleParamChange('shaderSpeed', parseFloat(e.target.value))} />
        <label>ズーム: {params.shaderScale.toFixed(1)}</label>
        <input type="range" min="0.5" max="5.0" step="0.1" value={params.shaderScale} onChange={e => handleParamChange('shaderScale', parseFloat(e.target.value))} />
      </div>
    )}
  </>
);

const App: React.FC = () => {
  const [params, setParams] = useState<AppParams>(defaultParams);
  const [modeName, setModeName] = useState<string>("通常モード");
  const [currentPresetIdx, setCurrentPresetIdx] = useState<string>("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showProPanel, setShowProPanel] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [snapshots, setSnapshots] = useState<(AppParams | null)[]>([null, null, null]);
  const [fps, setFps] = useState<number>(0);

  const paramsRef = useRef<AppParams>(defaultParams);
  const audioFileRef = useRef<File | null>(null);
  const p5Instance = useRef<p5 | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<number>(1.0);
  const savedNormalParams = useRef<AppParams | null>(null);

  useEffect(() => {
    paramsRef.current = params;
    const currentVol = params.mode === 'custom' ? params.customAudioVol : params.audioVol;
    if (p5Instance.current) (p5Instance.current as any).setAudioVolume?.(currentVol);
  }, [params]);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    if (!containerRef.current) return;
    const sketch = createSketch(paramsRef, audioFileRef, zoomRef);
    const p5Obj = new p5(sketch, containerRef.current);
    p5Instance.current = p5Obj;

    // FPSの更新ループを追加
    const fpsInterval = setInterval(() => {
      if (p5Obj) {
        setFps(Math.round(p5Obj.frameRate()));
      }
    }, 500);

    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      (p5Obj as any).customResize?.(clientWidth, clientHeight);
    }
    return () => {
      p5Obj.remove();
      p5Instance.current = null;
      clearInterval(fpsInterval);
    };
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (containerRef.current && p5Instance.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        (p5Instance.current as any).customResize?.(clientWidth, clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { window.removeEventListener('resize', handleResize); observer.disconnect(); };
  }, [showProPanel]);

  const handleParamChange = (key: keyof AppParams, value: number | string | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setCurrentPresetIdx("");
  };

  const handleNormalReset = () => {
    if (p5Instance.current) (p5Instance.current as any).clearCanvas?.();
    setParams(prev => {
      const next = { ...prev };
      (Object.keys(defaultParams) as Array<keyof AppParams>).forEach(key => {
        if (!key.startsWith('custom')) {
          // @ts-ignore
          next[key] = defaultParams[key];
        }
      });
      return next;
    });
    setCurrentPresetIdx("");
    displayToast('通常モードの設定をリセットしました');
  };

  const handleProReset = () => {
    if (p5Instance.current) (p5Instance.current as any).clearCanvas?.();
    setParams(prev => {
      const next = { ...prev };
      (Object.keys(defaultParams) as Array<keyof AppParams>).forEach(key => {
        if (key.startsWith('custom')) {
          // @ts-ignore
          next[key] = defaultParams[key];
        }
      });
      return next;
    });
    displayToast('Proモードの設定をリセットしました');
  };

  const toggleProPanel = () => {
    if (!showProPanel) {
      savedNormalParams.current = { ...params };
      if (p5Instance.current) (p5Instance.current as any).clearCanvas?.();
      setParams(prev => ({ ...prev, mode: 'custom', customCircles: 6, customPoints: 20, customDist: 50 }));
      setShowProPanel(true);
      setModeName("🧪 カスタムラボ・モード");
      setCurrentPresetIdx("");
    } else {
      if (p5Instance.current) (p5Instance.current as any).clearCanvas?.();
      setShowProPanel(false);
      if (savedNormalParams.current) {
        setParams(prev => {
          const restored = { ...savedNormalParams.current! };
          (Object.keys(prev) as Array<keyof AppParams>).forEach(key => {
            if (key.startsWith('custom')) { // @ts-ignore
              restored[key] = prev[key];
            }
          });
          return restored;
        });
        setModeName("通常モード");
        setCurrentPresetIdx("");
      }
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idxStr = e.target.value;
    if (idxStr === "") {
      setCurrentPresetIdx("");
      return;
    }
    const idx = parseInt(idxStr);
    if (isNaN(idx)) return;
    const p = presets[idx];
    const newParams = { ...params };
    (Object.keys(p) as Array<keyof Preset>).forEach(key => {
      if (key !== 'name' && key in newParams) { // @ts-ignore
        newParams[key] = p[key];
      }
    });
    setParams(newParams);
    setCurrentPresetIdx(idxStr);
  };

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && p5Instance.current) {
      audioFileRef.current = file; (p5Instance.current as any).updateAudioFile(file);
      setHasAudio(true); setIsAudioPlaying(false); displayToast('音楽ファイルを読み込みました');
    }
  };

  const toggleAudio = () => {
    if (p5Instance.current) {
      const playing = (p5Instance.current as any).toggleAudio(); setIsAudioPlaying(playing);
    }
  };

  const stopAudio = () => { if (p5Instance.current) { (p5Instance.current as any).stopAudio(); setIsAudioPlaying(false); } };

  const generateRandomParams = () => {
    const modes: AppParams['mode'][] = ['moire', 'spiral', 'grid', 'flower', 'wave', 'shader'];
    const palettes: AppParams['palette'][] = ['rainbow', 'cyberpunk', 'monochrome', 'pastel', 'warm', 'cool', 'golden'];
    const r = (min: number, max: number) => Math.random() * (max - min) + min;
    const ri = (min: number, max: number) => Math.floor(r(min, max));

    setParams(prev => {
      const next = { ...prev };
      next.mode = modes[ri(0, modes.length)];
      next.palette = palettes[ri(0, palettes.length)];
      next.speed = r(0.002, 0.025);
      next.hueSpeed = ri(20, 90);
      next.alpha = ri(40, 80);
      next.trailAlpha = ri(10, 40);
      next.randomPoints = ri(150, 400);
      next.ppMirror = Math.random() < 0.3;
      next.ppInvert = Math.random() < 0.1;
      next.ppGlitch = Math.random() < 0.1;
      return next;
    });
    setCurrentPresetIdx("");
    displayToast('通常モードの設定をランダム生成しました');
  };

  const generateProRandomParams = () => {
    const palettes: AppParams['palette'][] = ['rainbow', 'cyberpunk', 'monochrome', 'pastel', 'warm', 'cool', 'golden'];
    const styles: AppParams['customStyle'][] = ['line', 'curve', 'point', 'glow'];
    const r = (min: number, max: number) => Math.random() * (max - min) + min;
    const ri = (min: number, max: number) => Math.floor(r(min, max));
    const rb = () => Math.random() < 0.3;

    setParams(prev => ({
      ...prev,
      customCount: ri(300, 1500),
      customFreqX: ri(1, 15),
      customFreqY: ri(1, 15),
      customMod: r(0.1, 5.0),
      customFeedback: r(0.1, 5.0),
      customCircles: ri(1, 10),
      customPoints: ri(8, 60),
      customDist: ri(0, 200),
      customSpeed: r(0.005, 0.025),
      customHueSpeed: ri(20, 120),
      customAlpha: ri(30, 95),
      customTrailAlpha: ri(5, 45),
      customPalette: palettes[ri(0, palettes.length)],
      customSymmetry: ri(1, 10),
      customStyle: styles[ri(0, styles.length)],
      customPpMirror: rb(),
      customPpInvert: Math.random() < 0.1,
      customPpGlitch: Math.random() < 0.1,
      customDrift: rb(),
    }));
    displayToast('Proモードの設定をランダム生成しました');
  };

  const saveImage = () => { if (p5Instance.current) { (p5Instance.current as any).exportHighRes(); displayToast('画像を保存しました！'); } };
  const displayToast = (msg: string) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };
  const copyCode = (elementId: string = 'codeOutput') => {
    const code = document.getElementById(elementId) as HTMLTextAreaElement;
    if (code) { navigator.clipboard.writeText(code.value).then(() => displayToast('コードをコピーしました！')).catch(() => displayToast('コピーに失敗しました')); }
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('canvasContainer')?.requestFullscreen().catch(() => displayToast('全画面表示エラー'));
    } else { document.exitFullscreen(); }
  };

  const saveSnapshot = (idx: number) => {
    const newSnaps = [...snapshots];
    newSnaps[idx] = { ...params };
    setSnapshots(newSnaps);
    displayToast(`スロット ${idx + 1} に保存しました`);
  };
  const loadSnapshot = (idx: number) => {
    if (snapshots[idx]) {
      setParams(snapshots[idx]!);
      displayToast(`スロット ${idx + 1} を読み込みました`);
      setCurrentPresetIdx("");
    }
  };

  const generateOneLiner = () => {
    if (params.mode === 'shader') return "// シェーダーモードはWebEditor等での再現に複数のファイル(frag/vert)が必要なため、現在は対象外です。";

    const isCustom = params.mode === 'custom';
    const s = isCustom ? params.customSpeed : params.speed;
    const hSpeed = isCustom ? params.customHueSpeed : params.hueSpeed;
    const a = isCustom ? params.customAlpha : params.alpha;
    const tAlpha = isCustom ? params.customTrailAlpha : params.trailAlpha;
    const currentPalette = isCustom ? params.customPalette : params.palette;
    const isPpMirror = isCustom ? params.customPpMirror : params.ppMirror;
    const isPpInvert = isCustom ? params.customPpInvert : params.ppInvert;
    const isPpGlitch = isCustom ? params.customPpGlitch : params.ppGlitch;

    const getStrokeCode = (valExpr: string) => {
      switch (currentPalette) {
        case 'cyberpunk': return `stroke(map(sin((${valExpr})*0.02),-1,1,180,320),90,100,${a});`;
        case 'monochrome': return `stroke(0,0,map(sin((${valExpr})*0.05),-1,1,40,100),${a});`;
        case 'pastel': return `stroke((${valExpr})%360,40,95,${a});`;
        case 'warm': return `stroke(map(sin((${valExpr})*0.03),-1,1,330,420)%360,90,100,${a});`;
        case 'cool': return `stroke(map(sin((${valExpr})*0.03),-1,1,150,260),80,100,${a});`;
        case 'golden': return `stroke(map(sin((${valExpr})*0.04),-1,1,30,55),80,100,${a});`;
        default: return `stroke((${valExpr})%360,80,100,${a});`;
      }
    };

    let drawLogic = "";
    if (params.mode === 'moire') {
      drawLogic = `
  let pts = []; let d = 1;
  for(let c=0; c<${params.circles}; c++) {
    let r = 50 + c * ${params.dist / 5};
    for(let i=0; i<TAU; i+=TAU/${params.points}) {
      let ang = i + f * d * (1 + r/100);
      pts.push({x: sin(ang)*r, y: cos(ang)*r, v: f*${hSpeed}+i*10+r});
    }
    d *= -1;
  }
  for(let i=0; i<pts.length; i++) {
    let p1 = pts[i]; let v = p1.v; ${getStrokeCode('v')}
    point(p1.x, p1.y);
    for(let j=i+1; j<pts.length; j++) {
      let p2 = pts[j]; let d = dist(p1.x, p1.y, p2.x, p2.y);
      if(d < ${params.dist}) line(p1.x, p1.y, p2.x, p2.y);
    }
  }`;
    } else if (params.mode === 'spiral') {
      drawLogic = `
  for(let l=0; l<${params.layers}; l++) {
    let px, py;
    for(let i=0; i<TAU*5; i+=0.15) {
      let r = i*15 + l*30;
      let ang = i*(3 + ${params.spiralStrength}*10) + f*(l%2?1:-1);
      let x = cos(ang)*r, y = sin(ang)*r;
      let v = f*${hSpeed} + i*15 + l*30; ${getStrokeCode('v')}
      if(i>0) line(px, py, x, y);
      px=x; py=y;
    }
  }`;
    } else if (params.mode === 'grid') {
      drawLogic = `
  let st = 600/${params.gridDensity};
  let v = f*${hSpeed}; ${getStrokeCode('v')}
  for(let i=-300; i<=300; i+=st) { line(i,-300,i,300); line(-300,i,300,i); }
  push();
  rotate(${params.rotDiff} + f*0.1);
  v += 120; ${getStrokeCode('v')}
  for(let i=-300; i<=300; i+=st) { line(i,-300,i,300); line(-300,i,300,i); }
  pop();`;
    } else if (params.mode === 'random') {
      drawLogic = `
  randomSeed(1);
  let pts = [];
  for(let i=0; i<${params.randomPoints}; i++) {
    let a = random(TAU) + f * (i%2?1:-1);
    let r = random(250);
    pts.push({x: cos(a)*r, y: sin(a)*r});
  }
  for(let i=0; i<pts.length; i++) {
    for(let j=i+1; j<pts.length; j++) {
      let d = dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      if(d < 120) {
        let v = f*${hSpeed} + i; ${getStrokeCode('v')}
        line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      }
    }
  }`;
    } else if (params.mode === 'flower') {
      drawLogic = `
  for(let p=0; p<${params.petals}; p++) {
    let o = p*TAU/${params.petals}, px, py;
    for(let i=0; i<TAU; i+=0.1) {
      let r = 100 + sin(i*${params.petals}/2)*80;
      let ang = i*${params.flowerSpeed} + f + o;
      let x = cos(ang)*r, y = sin(ang)*r;
      let v = f*${hSpeed} + p*30 + i*20; ${getStrokeCode('v')}
      if(i>0) line(px, py, x, y);
      px=x; py=y;
    }
  }`;
    } else if (params.mode === 'wave') {
      drawLogic = `
  for(let w=0; w<${params.waves}; w++) {
    let px, py;
    for(let x=-300; x<=300; x+=10) {
      let y = sin(x*0.02 + f + w*0.5)*${params.amp / 2};
      let v = f*${hSpeed} + w*20; ${getStrokeCode('v')}
      if(x>-300) line(x-10, py, x, y);
      py=y;
    }
  }`;
    } else if (params.mode === 'custom') {
      const style = params.customStyle;
      let drawCmd = style === 'point' ? `point(gx, gy);` :
        style === 'glow' ? `strokeWeight(4); point(gx, gy); strokeWeight(1); point(gx, gy);` :
          style === 'curve' ? `vertex(gx, gy);` : `if(px!==undefined) line(px, py, gx, gy);`;
      let driftCode = params.customDrift ? `let dx=noise(f*0.1,100)*2, dy=noise(f*0.1,200)*2, dm=noise(f*0.05,300)*3;` : `let dx=0,dy=0,dm=0;`;

      drawLogic = `
  ${driftCode}
  let sym = ${params.customSymmetry}, layers = ${params.customCircles}, total = ${params.customCount}, cDist = ${params.customDist};
  for(let s=0; s<sym; s++) {
    push(); rotate(s*TAU/sym);
    for(let l=0; l<layers; l++) {
      let layerRot = l*TAU/layers + f*0.1, layerPts = [], px, py;
      ${style === 'curve' ? 'beginShape();' : ''}
      for(let i=0; i<=total; i+=10) {
        let t = (i/total)*TAU*2;
        let fb = sin(t*(${params.customFeedback}+dx)+f)*(${params.customMod}+dm);
        let lx = sin(t*${params.customFreqX}+fb+f)*200;
        let ly = cos(t*${params.customFreqY}+fb)*200;
        let gx = lx*cos(layerRot) - ly*sin(layerRot), gy = lx*sin(layerRot) + ly*cos(layerRot);
        let v = f*${hSpeed} + i + l*30; ${getStrokeCode('v')}
        ${drawCmd}
        px=gx; py=gy;
        if(cDist > 0) layerPts.push({x:gx, y:gy});
      }
      ${style === 'curve' ? 'endShape();' : ''}
      if(cDist > 0) {
        for(let i=0; i<layerPts.length; i+=2) {
          for(let j=i+1; j<layerPts.length; j+=4) {
            let d = dist(layerPts[i].x, layerPts[i].y, layerPts[j].x, layerPts[j].y);
            if(d < cDist) { let v = f*${hSpeed} + i + l*30; ${getStrokeCode('v')} line(layerPts[i].x, layerPts[i].y, layerPts[j].x, layerPts[j].y); }
          }
        }
      }
    }
    pop();
  }`;
    }

    let ppPre = `  background(0, ${tAlpha});\n  translate(width/2, height/2);`;
    let ppPost = `  f += ${s.toFixed(4)};`;

    if (isPpMirror) {
      ppPre = `
  if(!window.pg) { window.pg = createGraphics(600, 600); window.pg.colorMode(HSB, 360, 100, 100, 100); }
  let g = window.pg; g.background(0, ${tAlpha}); g.push(); g.translate(300, 300);`;

      drawLogic = drawLogic
        .replace(/stroke\(/g, 'g.stroke(')
        .replace(/line\(/g, 'g.line(')
        .replace(/point\(/g, 'g.point(')
        .replace(/rotate\(/g, 'g.rotate(')
        .replace(/push\(/g, 'g.push(')
        .replace(/pop\(/g, 'g.pop(')
        .replace(/beginShape/g, 'g.beginShape')
        .replace(/endShape/g, 'g.endShape')
        .replace(/vertex/g, 'g.vertex')
        .replace(/dist\(/g, 'g.dist(')
        .replace(/strokeWeight\(/g, 'g.strokeWeight(');

      ppPost = `
  g.pop(); background(0); image(g, 0, 0, 300, 300);
  push(); translate(600, 0); scale(-1, 1); image(g, 0, 0, 300, 300); pop();
  push(); translate(0, 600); scale(1, -1); image(g, 0, 0, 300, 300); pop();
  push(); translate(600, 600); scale(-1, -1); image(g, 0, 0, 300, 300); pop();
  ${ppPost}`;
    }

    if (isPpInvert) ppPost += `\n  filter(INVERT);`;
    if (isPpGlitch) ppPost += `\n  if(random()<0.05) { let y=random(height), h=random(5,30), s=random(-20,20); image(get(0,y,width,h), s, y); }`;

    return `/**
 * GeoFlux Pattern Script
 * Created with GeoFlux Visualizer Lab
 */
let f = 0;

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
${ppPre}
${drawLogic}
${ppPost}
}`;
  };

  return (
    <div className="container">
      <div id="canvasContainer" className="canvas-container" ref={containerRef} onDoubleClick={toggleFullscreen}>
        <div className="zoom-controls">
          <div className="zoom-value">{Math.round(zoom * 100)}%</div>
          <div className="zoom-slider-wrapper">
            <input type="range" min="0.1" max="5.0" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="vertical-slider" title="プレビュー拡大/縮小" />
          </div>
          <button onClick={() => setZoom(1.0)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75em' }}>リセット</button>
        </div>
        <div className="fps-indicator">
          <span>FPS: {fps}</span>
          {(params.gpuAccelerated && (params.mode === 'moire' || params.mode === 'spiral')) || params.mode === 'shader' ? <span style={{ color: 'var(--accent-blue)', marginLeft: '8px' }}>⚡ GPU</span> : null}
        </div>
      </div>

      {showProPanel ? (
        <div className="panel-shared pro-panel">
          <button onClick={handleProReset} className="btn-danger" style={{ marginBottom: '8px' }}>🔄 設定をリセット</button>
          <h2 className="pro-title" style={{ color: 'var(--accent-pink)', fontSize: '1.2em', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>🛠 Pro Mode Lab</h2>

          <div className="section-divider">
            <label className="section-title">📂 スナップショット (Snapshots)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => saveSnapshot(i)} style={{ fontSize: '0.75em', padding: '6px' }}>Save {i + 1}</button>
                  <button onClick={() => loadSnapshot(i)} disabled={!snapshots[i]} style={{ fontSize: '0.75em', padding: '6px' }}>Load {i + 1}</button>
                </div>
              ))}
            </div>
            <button onClick={generateProRandomParams} className="btn-primary" style={{ marginTop: '12px' }}>🎲 ランダム生成</button>
          </div>

          <AudioControls params={params} isPro={true} handleParamChange={handleParamChange} handleAudioFile={handleAudioFile} toggleAudio={toggleAudio} stopAudio={stopAudio} hasAudio={hasAudio} isAudioPlaying={isAudioPlaying} />

          <div className="section-divider">
            <label className="section-title" style={{ color: '#00ffaa' }}>🎛 オーディオ・マッピング</label>
            <label>変調度(Mod)に反応する音域</label>
            <select value={params.customAudioMapMod} onChange={e => handleParamChange('customAudioMapMod', e.target.value)}>
              <option value="none">None</option><option value="bass">Bass (低音)</option><option value="mid">Mid (中音)</option><option value="treble">Treble (高音)</option>
            </select>
            <label>周波数(Freq)に反応する音域</label>
            <select value={params.customAudioMapFreq} onChange={e => handleParamChange('customAudioMapFreq', e.target.value)}>
              <option value="none">None</option><option value="bass">Bass (低音)</option><option value="mid">Mid (中音)</option><option value="treble">Treble (高音)</option>
            </select>
          </div>

          <div className="section-divider">
            <label className="section-title">🧬 ジェネレータ (Base Shape)</label>
            <label>長さ (Density)</label>
            <div className="slider-group">
              <input type="range" min="200" max="2000" step="50" value={params.customCount} onChange={e => handleParamChange('customCount', parseInt(e.target.value))} />
              <input type="number" step="50" value={params.customCount} onChange={e => handleParamChange('customCount', parseInt(e.target.value))} />
            </div>

            <label>X周波数</label>
            <div className="slider-group">
              <input type="range" min="1" max="20" step="1" value={params.customFreqX} onChange={e => handleParamChange('customFreqX', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customFreqX} onChange={e => handleParamChange('customFreqX', parseInt(e.target.value))} />
            </div>

            <label>Y周波数</label>
            <div className="slider-group">
              <input type="range" min="1" max="20" step="1" value={params.customFreqY} onChange={e => handleParamChange('customFreqY', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customFreqY} onChange={e => handleParamChange('customFreqY', parseInt(e.target.value))} />
            </div>

            <label>変調 (Mod)</label>
            <div className="slider-group">
              <input type="range" min="0" max="10" step="0.1" value={params.customMod} onChange={e => handleParamChange('customMod', parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={params.customMod} onChange={e => handleParamChange('customMod', parseFloat(e.target.value))} />
            </div>

            <label>ひねり (Feedback)</label>
            <div className="slider-group">
              <input type="range" min="0" max="10" step="0.1" value={params.customFeedback} onChange={e => handleParamChange('customFeedback', parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={params.customFeedback} onChange={e => handleParamChange('customFeedback', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="section-divider">
            <label className="section-title pink">❄ 対称性とスタイル (Symmetry & Style)</label>
            <label>回転対称 (Symmetry)</label>
            <div className="slider-group">
              <input type="range" min="1" max="12" step="1" value={params.customSymmetry} onChange={e => handleParamChange('customSymmetry', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customSymmetry} onChange={e => handleParamChange('customSymmetry', parseInt(e.target.value))} />
            </div>

            <label>描画スタイル</label>
            <select value={params.customStyle} onChange={e => handleParamChange('customStyle', e.target.value)}>
              <option value="line">Line (標準)</option>
              <option value="point">Point (点画)</option>
              <option value="curve">Curve (曲線)</option>
              <option value="glow">Glow (発光線)</option>
            </select>

            <div className="checkbox-group" style={{ marginTop: '10px' }}>
              <label><input type="checkbox" checked={params.customDrift} onChange={e => handleParamChange('customDrift', e.target.checked)} /> 🧬 自動変化 (Evolution Drift)</label>
            </div>
          </div>

          <div className="section-divider">
            <label className="section-title pink">✨ ポストプロセス効果</label>
            <div className="checkbox-group">
              <label><input type="checkbox" checked={params.customPpMirror} onChange={e => handleParamChange('customPpMirror', e.target.checked)} /> ミラー万華鏡</label>
              <label><input type="checkbox" checked={params.customPpInvert} onChange={e => handleParamChange('customPpInvert', e.target.checked)} /> 色反転</label>
              <label><input type="checkbox" checked={params.customPpGlitch} onChange={e => handleParamChange('customPpGlitch', e.target.checked)} /> グリッチ</label>
            </div>
          </div>

          <div className="section-divider">
            <label className="section-title" style={{ color: '#ffaa00' }}>🎨 構造と詳細</label>
            <label>パレット</label>
            <select value={params.customPalette} onChange={e => handleParamChange('customPalette', e.target.value)}>
              <option value="rainbow">🌈 Rainbow</option><option value="cyberpunk">🤖 Cyberpunk</option><option value="monochrome">🌑 Monochrome</option><option value="pastel">🌸 Pastel</option><option value="warm">🔥 Warm</option><option value="cool">💧 Cool</option><option value="golden">👑 Golden</option>
            </select>

            <label>レイヤー</label>
            <div className="slider-group">
              <input type="range" min="1" max="16" step="1" value={params.customCircles} onChange={e => handleParamChange('customCircles', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customCircles} onChange={e => handleParamChange('customCircles', parseInt(e.target.value))} />
            </div>

            <label>頂点解像度 (Complexity)</label>
            <div className="slider-group">
              <input type="range" min="4" max="80" step="1" value={params.customPoints} onChange={e => handleParamChange('customPoints', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customPoints} onChange={e => handleParamChange('customPoints', parseInt(e.target.value))} />
            </div>

            <label>メッシュ距離</label>
            <div className="slider-group">
              <input type="range" min="0" max="300" step="10" value={params.customDist} onChange={e => handleParamChange('customDist', parseInt(e.target.value))} />
              <input type="number" step="10" value={params.customDist} onChange={e => handleParamChange('customDist', parseInt(e.target.value))} />
            </div>

            <label>速度</label>
            <div className="slider-group">
              <input type="range" min="0" max="0.05" step="0.001" value={params.customSpeed} onChange={e => handleParamChange('customSpeed', parseFloat(e.target.value))} />
              <input type="number" step="0.001" value={params.customSpeed} onChange={e => handleParamChange('customSpeed', parseFloat(e.target.value))} />
            </div>

            <label>透明度</label>
            <div className="slider-group">
              <input type="range" min="5" max="100" step="5" value={params.customAlpha} onChange={e => handleParamChange('customAlpha', parseFloat(e.target.value))} />
              <input type="number" step="5" value={params.customAlpha} onChange={e => handleParamChange('customAlpha', parseFloat(e.target.value))} />
            </div>

            <label>残像</label>
            <div className="slider-group">
              <input type="range" min="1" max="100" step="1" value={params.customTrailAlpha} onChange={e => handleParamChange('customTrailAlpha', parseInt(e.target.value))} />
              <input type="number" step="1" value={params.customTrailAlpha} onChange={e => handleParamChange('customTrailAlpha', parseInt(e.target.value))} />
            </div>

            <label>色変化速度</label>
            <div className="slider-group">
              <input type="range" min="0" max="200" step="5" value={params.customHueSpeed} onChange={e => handleParamChange('customHueSpeed', parseInt(e.target.value))} />
              <input type="number" step="5" value={params.customHueSpeed} onChange={e => handleParamChange('customHueSpeed', parseInt(e.target.value))} />
            </div>
          </div>

          <div className="section-divider">
            <label className="section-title">💾 エクスポートとアクション</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={toggleFullscreen}>⛶ 全画面</button>
              <button onClick={saveImage}>📷 画像保存</button>
            </div>
            <button onClick={() => copyCode('proCodeOutput')} className="btn-primary">📋 スクリプトをコピー</button>
            <textarea id="proCodeOutput" className="textarea-code" readOnly value={generateOneLiner()} />
          </div>

          <button onClick={toggleProPanel} className="btn-danger" style={{ marginTop: '24px' }}>通常モードに戻る</button>
        </div>
      ) : (
        <div className="panel-shared controls">
          <button onClick={handleNormalReset} className="btn-danger" style={{ marginBottom: '8px' }}>🔄 設定をリセット</button>
          <button onClick={toggleProPanel} className="btn-primary" style={{ marginBottom: '16px' }}>🛠 Proモードを起動</button>
          <div className="preset-name">{modeName}</div>
          <label>パターンモード</label>
          <select value={params.mode} onChange={e => handleParamChange('mode', e.target.value)} disabled={showProPanel}>
            <option value="moire">モアレ円回転</option><option value="spiral">螺旋渦巻き</option><option value="grid">グリッド干渉</option><option value="random">ランダムポイント接続</option><option value="flower">花びら放射</option><option value="wave">波状干渉</option><option value="shader">🌌 シェーダー (GLSL)</option>
          </select>
          <label>カラーパレット (シェーダー以外)</label>
          <select value={params.palette} onChange={e => handleParamChange('palette', e.target.value)} disabled={params.mode === 'shader' || showProPanel}>
            <option value="rainbow">🌈 Rainbow</option><option value="cyberpunk">🤖 Cyberpunk</option><option value="monochrome">🌑 Monochrome</option><option value="pastel">🌸 Pastel</option><option value="warm">🔥 Warm</option><option value="cool">💧 Cool</option><option value="golden">👑 Golden</option>
          </select>
          <AudioControls params={params} isPro={false} handleParamChange={handleParamChange} handleAudioFile={handleAudioFile} toggleAudio={toggleAudio} stopAudio={stopAudio} hasAudio={hasAudio} isAudioPlaying={isAudioPlaying} />
          <div className="section-divider">
            <label className="section-title pink">✨ ポストプロセス効果</label>
            <div className="checkbox-group">
              <label><input type="checkbox" checked={params.ppMirror} onChange={e => handleParamChange('ppMirror', e.target.checked)} /> ミラー万華鏡</label>
              <label><input type="checkbox" checked={params.ppInvert} onChange={e => handleParamChange('ppInvert', e.target.checked)} /> 色反転</label>
              <label><input type="checkbox" checked={params.ppGlitch} onChange={e => handleParamChange('ppGlitch', e.target.checked)} /> グリッチ</label>
            </div>
          </div>
          <CommonParamsControls params={params} handleParamChange={handleParamChange} />
          <ModeSpecificControls params={params} handleParamChange={handleParamChange} />
          <label style={{ marginTop: '15px', borderTop: '1px solid #444', paddingTop: '10px' }}>おすすめプリセット</label>
          <select value={currentPresetIdx} onChange={handlePresetChange}>
            <option value="">-- 選択してください --</option>{presets.map((p, i) => (<option key={i} value={i}>{p.name}</option>))}
          </select>
          <div className="section-divider">
            <label className="section-title">💾 エクスポートとアクション</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={toggleFullscreen}>⛶ 全画面</button>
              <button onClick={saveImage}>📷 画像保存</button>
            </div>
            <button onClick={() => copyCode('codeOutput')} className="btn-primary">📋 スクリプトをコピー</button>
            <textarea id="codeOutput" className="textarea-code" readOnly value={generateOneLiner()} />
          </div>
        </div>
      )}
      <div className={`toast ${showToast ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
};

export default App;
