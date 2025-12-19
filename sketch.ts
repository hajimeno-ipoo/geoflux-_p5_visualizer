import React from 'react';
import p5 from 'p5';
import { AppParams } from './types';

let p5SoundLoadPromise: Promise<void> | null = null;

export const ensureP5SoundAddon = async () => {
  if (p5SoundLoadPromise) return p5SoundLoadPromise;
  p5SoundLoadPromise = (async () => {
    try {
      const w: any = globalThis as any;
      const AudioContextCtor = w.AudioContext ?? w.webkitAudioContext;
      const hasAudioWorklet = !!(AudioContextCtor?.prototype && typeof AudioContextCtor.prototype.audioWorklet !== 'undefined');
      const hasWorkletNode = typeof w.AudioWorkletNode === 'function';

      // Chrome などで AudioContext.audioWorklet が無いのに AudioWorkletNode だけ居ると、
      // p5.sound が init で落ちるので、p5.sound 側の polyfill を使わせる
      if (!hasAudioWorklet && hasWorkletNode) w.AudioWorkletNode = undefined;
    } catch { }

    await import('p5/lib/addons/p5.sound');
  })();
  return p5SoundLoadPromise;
};

const TWO_PI = Math.PI * 2;
const LUT_SIZE = 1440; // 0.25 degree resolution
const SIN_LUT = new Float32Array(LUT_SIZE);
const COS_LUT = new Float32Array(LUT_SIZE);
for (let i = 0; i < LUT_SIZE; i++) {
  const rad = (i / LUT_SIZE) * TWO_PI;
  SIN_LUT[i] = Math.sin(rad);
  COS_LUT[i] = Math.cos(rad);
}

const fastSin = (rad: number) => {
  let idx = Math.floor(((rad % TWO_PI + TWO_PI) % TWO_PI) / TWO_PI * LUT_SIZE);
  return SIN_LUT[idx];
};
const fastCos = (rad: number) => {
  let idx = Math.floor(((rad % TWO_PI + TWO_PI) % TWO_PI) / TWO_PI * LUT_SIZE);
  return COS_LUT[idx];
};

type SpatialItem = { x: number; y: number; data: any };

class SpatialHash {
  private grid: Map<string, SpatialItem[]>;
  private cellSize: number;
  private itemPool: SpatialItem[];
  private listPool: SpatialItem[][];
  constructor(cellSize: number) {
    this.grid = new Map();
    this.cellSize = cellSize;
    this.itemPool = [];
    this.listPool = [];
  }
  clear() {
    for (const items of this.grid.values()) {
      for (let i = 0; i < items.length; i++) this.itemPool.push(items[i]);
      items.length = 0;
      this.listPool.push(items);
    }
    this.grid.clear();
  }
  add(x: number, y: number, data: any) {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    let items = this.grid.get(key);
    if (!items) {
      items = this.listPool.pop() ?? [];
      this.grid.set(key, items);
    }
    const item = this.itemPool.pop() ?? { x, y, data };
    item.x = x;
    item.y = y;
    item.data = data;
    items.push(item);
  }
  getNearby(x: number, y: number, out?: SpatialItem[]) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const results: SpatialItem[] = out ?? [];
    results.length = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const items = this.grid.get(key);
        if (items) {
          for (let i = 0; i < items.length; i++) results.push(items[i]);
        }
      }
    }
    return results;
  }
}

export const createSketch = (
  paramsRef: React.MutableRefObject<AppParams>,
  audioFileRef: React.MutableRefObject<File | null>,
  zoomRef: React.MutableRefObject<number>
) => {
  return (p: p5) => {
	    const PREVIEW_BG = '#050816';
	    const PREVIEW_BG_RGB = '5, 8, 22';
	    let f = 0;
	    let frameSeed = 0;
	    let frameCounter = 0;
	    let soundFile: any = null;
	    let fft: any = null;
	    let amp: any = null;
	    let audioObjectUrl: string | null = null;
	    let pendingPlay = false;
	    let audioReady = false;
	    let audioLoading = false;
	    let audioBass = 0;
    let audioMid = 0;
    let audioTreble = 0;
    let audioLevel = 0;
    let pg: p5.Graphics;
    let pgShader: p5.Graphics;
    let theShader: p5.Shader;
    let exportPg: p5.Graphics | null = null;
    let exportPgShader: p5.Graphics | null = null;
    let exportShader: p5.Shader | null = null;
    let exportCanvas: p5.Graphics | null = null;

    // 描画予算管理
    let linesDrawn = 0;
    const LINE_BUDGET = 12000; // 最適化により上限を引き上げ

    const MAX_POINTS = 2000;
    const moireX = new Float32Array(MAX_POINTS);
    const moireY = new Float32Array(MAX_POINTS);
    const randomX = new Float32Array(MAX_POINTS);
    const randomY = new Float32Array(MAX_POINTS);
    const spatialNearby: SpatialItem[] = [];
    const colorBuf: [number, number, number] = [0, 0, 0];

    const vertSrc = `
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;
      void main() {
        vTexCoord = aTexCoord;
        gl_Position = vec4(aPosition, 1.0);
      }
    `;

    const fragSrc = `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_scale;
      uniform float u_audio;
      uniform float u_bass;
      uniform float u_mid;
      uniform float u_treble;
      uniform int u_mode;
      uniform float u_paramA;
      uniform float u_paramB;
      uniform float u_paramC;
      uniform vec3 u_palette_a;
      uniform vec3 u_palette_b;
      uniform vec3 u_palette_c;
      uniform vec3 u_palette_d;

      vec3 palette(float t) {
          return u_palette_a + u_palette_b * cos(6.28318 * (u_palette_c * t + u_palette_d + u_mid * 0.1));
      }

      void main() {
          vec2 uv = vTexCoord * 2.0 - 1.0;
          float aspect = u_resolution.x / u_resolution.y;
          uv.x *= aspect;
          uv.y *= -1.0;
          uv *= u_scale * (1.0 - u_bass * 0.1);

          vec3 finalColor = vec3(0.0);

          if (u_mode == 1) {
              // Moire interference - Reactive to circles/points/dist
              vec2 p = uv * (1.0 + u_audio * 0.2);
              float freq = u_paramC * 0.1; // mapping dist to frequency
              float d1 = length(p + vec2(sin(u_time * 0.5), cos(u_time * 0.3)) * 0.2);
              float d2 = length(p - vec2(cos(u_time * 0.4), sin(u_time * 0.6)) * 0.2);
              float f1 = sin(d1 * freq + u_time);
              float f2 = sin(d2 * freq - u_time * 1.1);
              float interaction = abs(f1 - f2);
              float density = u_paramA * u_paramB * 0.05;
              finalColor = palette(interaction + u_time * 0.1) * pow(interaction, 2.0) * density;
          } else if (u_mode == 2) {
              // Spiral mode - Reactive to spiralStrength/layers
              float angle = atan(uv.y, uv.x) + u_time * 0.2;
              float dist = length(uv);
              float strength = u_paramA * 50.0;
              float layers = u_paramB;
              float s = sin(dist * strength - angle * layers + u_time);
              finalColor = palette(dist + s * 0.5 + u_time * 0.2) * (1.0 - abs(s));
              finalColor *= exp(-dist * 0.5);
          } else {
              // Default generative
              vec2 uv0 = uv;
              for (float i = 0.0; i < 4.0; i++) {
                  uv = fract(uv * 1.5) - 0.5;
                  float d = length(uv) * exp(-length(uv0));
                  vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);
                  d = sin(d * 8.0 + u_time) / 8.0;
                  d = abs(d);
                  float shine = 1.2 + u_treble * 2.0;
                  d = pow(0.01 / d, shine);
                  finalColor += col * d;
              }
          }

          finalColor *= (1.0 + u_audio * 0.5 + u_bass * 0.3);
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

	    const notifyAudioPlayState = (playing: boolean) => {
	      const cb = (p as any).onAudioPlayStateChange;
	      if (typeof cb === 'function') cb(playing);
	    };

	    const getP5SoundRoot = () => ((globalThis as any).p5 ?? p5) as any;

	    const ensureP5Sound = () => {
	      const P5Sound = getP5SoundRoot();
	      const loadSoundFn = (p as any).loadSound ?? (globalThis as any).loadSound;
	      const hasLoadSound = typeof loadSoundFn === 'function';
	      const hasFFT = typeof P5Sound?.FFT === 'function';
	      const hasAmplitude = typeof P5Sound?.Amplitude === 'function';
	      if (!hasLoadSound || !hasFFT || !hasAmplitude) return false;
	      if (!fft) fft = new P5Sound.FFT(0.8, 1024);
	      if (!amp) amp = new P5Sound.Amplitude(0.9);
	      return true;
	    };

	    const teardownSound = () => {
	      pendingPlay = false;
	      audioReady = false;
	      audioLoading = false;
	      if (soundFile) {
	        try { soundFile.stop(); } catch { }
	        try { soundFile.disconnect(); } catch { }
	        soundFile = null;
	      }
	      if (audioObjectUrl) { URL.revokeObjectURL(audioObjectUrl); audioObjectUrl = null; }
	      notifyAudioPlayState(false);
	    };

	    (p as any).updateAudioFile = (file: File, autoplay = false) => {
	      if (!ensureP5Sound()) return false;
	      try { ((p as any).userStartAudio ?? (globalThis as any).userStartAudio)?.call(p); } catch { }
	      teardownSound();

	      const currentVol = paramsRef.current.mode === 'custom' ? paramsRef.current.customAudioVol : paramsRef.current.audioVol;

	      audioObjectUrl = URL.createObjectURL(file);
	      pendingPlay = autoplay;
	      audioLoading = true;

	      const loadSoundFn = (p as any).loadSound ?? (globalThis as any).loadSound;
	      soundFile = loadSoundFn.call(
	        p,
	        audioObjectUrl,
	        () => {
	          audioLoading = false;
	          audioReady = true;
	          try { soundFile?.setVolume?.(currentVol); } catch { }
	          try { fft?.setInput?.(soundFile); } catch { }
	          try { amp?.setInput?.(soundFile); } catch { }
	          try { soundFile?.onended?.(() => notifyAudioPlayState(false)); } catch { }

	          if (pendingPlay) {
	            pendingPlay = false;
	            try { ((p as any).userStartAudio ?? (globalThis as any).userStartAudio)?.call(p); } catch { }
	            try { soundFile?.play?.(); } catch { }
	            notifyAudioPlayState(true);
	          }
	        },
	        (e: any) => {
	          console.warn('Failed to load audio file:', e);
	          audioLoading = false;
	          pendingPlay = false;
	          audioReady = false;
	          notifyAudioPlayState(false);
	        }
	      );

	      notifyAudioPlayState(false);
	      return true;
	    };

	    (p as any).toggleAudio = () => {
	      if (!ensureP5Sound()) return false;
	      try { ((p as any).userStartAudio ?? (globalThis as any).userStartAudio)?.call(p); } catch { }

	      if (!soundFile) {
	        if (audioFileRef.current) (p as any).updateAudioFile(audioFileRef.current, true);
	        return false;
	      }
	      if (audioLoading || !audioReady) {
	        pendingPlay = true;
	        return false;
	      }
	      if (soundFile.isPlaying?.()) {
	        pendingPlay = false;
	        try { soundFile.pause?.(); } catch { }
	        notifyAudioPlayState(false);
	        return false;
	      }
	      pendingPlay = false;
	      try { soundFile.play?.(); } catch { }
	      notifyAudioPlayState(true);
	      return true;
	    };

	    (p as any).stopAudio = () => {
	      pendingPlay = false;
	      if (!soundFile) { notifyAudioPlayState(false); return; }
	      try { soundFile.stop?.(); } catch { }
	      notifyAudioPlayState(false);
	    };
	    (p as any).setAudioVolume = (vol: number) => { try { soundFile?.setVolume?.(vol); } catch { } };
	    (p as any).exportHighRes = () => {
	      if (!pg) return;
	      const scale = 2;
	      const w = Math.max(1, Math.round(pg.width * scale));
	      const h = Math.max(1, Math.round(pg.height * scale));

	      if (!exportPg || exportPg.width !== w || exportPg.height !== h) {
	        exportPg = p.createGraphics(w, h);
	        exportPg.pixelDensity(1);
	        exportPg.colorMode(p.HSB, 360, 100, 100, 100);
	      }
	      if (!exportPgShader || exportPgShader.width !== w || exportPgShader.height !== h) {
	        exportPgShader = p.createGraphics(w, h, p.WEBGL);
	        exportPgShader.pixelDensity(1);
	        exportShader = exportPgShader.createShader(vertSrc, fragSrc);
	      }
	      if (!exportCanvas || exportCanvas.width !== w || exportCanvas.height !== h) {
	        exportCanvas = p.createGraphics(w, h);
	        exportCanvas.pixelDensity(1);
	      }
	      const expPg = exportPg;
	      const expPgShader = exportPgShader;
	      const expCanvas = exportCanvas;
	      if (!expPg || !expPgShader || !expCanvas) return;

	      if (!exportShader) exportShader = expPgShader.createShader(vertSrc, fragSrc);
	      const expShader = exportShader;
	      if (!expShader) return;

	      // 描画先を一時的に差し替えて、同じロジックで高解像度に描き直す
	      const prevPg = pg;
	      const prevPgShader = pgShader;
	      const prevShader = theShader;
	      pg = expPg;
	      pgShader = expPgShader;
	      theShader = expShader;
	      try {
	        p.randomSeed(frameSeed);
	        expPg.background(PREVIEW_BG);
	        expPgShader.clear();
	        expPgShader.background(PREVIEW_BG);
	        expCanvas.background(PREVIEW_BG);
	        renderPattern(paramsRef.current, zoomRef.current);
	        drawPostProcessTo(expCanvas, expPg, paramsRef.current);
	        p.saveCanvas(expCanvas.canvas, 'pattern-HD-' + Date.now(), 'png');
	      } finally {
	        pg = prevPg;
	        pgShader = prevPgShader;
	        theShader = prevShader;
	      }
    };

    (p as any).clearCanvas = () => {
      p.background(PREVIEW_BG);
      if (pg) { pg.background(PREVIEW_BG); }
      if (pgShader) { pgShader.clear(); pgShader.background(PREVIEW_BG); }
    };

    (p as any).resetAnimation = () => {
      f = 0;
    };

    p.setup = () => {
      const node = (p as any)._userNode;
      const w = (node && node.clientWidth > 0) ? node.clientWidth : 300;
      const h = (node && node.clientHeight > 0) ? node.clientHeight : 300;
      p.createCanvas(w, h);
      p.pixelDensity(1);
      pg = p.createGraphics(w, h);
      pg.pixelDensity(1);
      pg.colorMode(p.HSB, 360, 100, 100, 100);
      pgShader = p.createGraphics(w, h, p.WEBGL);
      pgShader.pixelDensity(1);
      theShader = pgShader.createShader(vertSrc, fragSrc);

      (p as any).spatialHash = new SpatialHash(100);

      if (audioFileRef.current) (p as any).updateAudioFile(audioFileRef.current);
    };

    (p as any).customResize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      p.resizeCanvas(w, h);
      if (pg) { pg.resizeCanvas(w, h); pg.background(PREVIEW_BG); }
      if (pgShader) pgShader.resizeCanvas(w, h);
    };

    p.draw = () => {
      const params = paramsRef.current;
      const zoom = zoomRef.current;
      linesDrawn = 0;

      try {
        frameSeed = frameCounter;
        p.randomSeed(frameSeed);
	        {
	          const isCustomMode = params.mode === 'custom';
	          const sens = isCustomMode ? params.customAudioSens : params.audioSens;
	          const sBass = isCustomMode ? params.customAudioSensBass : params.audioSensBass;
	          const sMid = isCustomMode ? params.customAudioSensMid : params.audioSensMid;
	          const sTreble = isCustomMode ? params.customAudioSensTreble : params.audioSensTreble;

	          if (fft && amp && soundFile && audioReady && soundFile.isPlaying?.()) {
	            try { fft.analyze?.(); } catch { }
	            const bass = (fft.getEnergy?.('bass') ?? 0) / 255;
	            const mid = (fft.getEnergy?.('mid') ?? 0) / 255;
	            const treble = (fft.getEnergy?.('treble') ?? 0) / 255;
	            const level = amp.getLevel?.() ?? 0;

	            audioBass = bass * sens * sBass;
	            audioMid = mid * sens * sMid;
	            audioTreble = treble * sens * sTreble;
	            audioLevel = level * sens;
	          } else {
	            audioBass = 0;
	            audioMid = 0;
	            audioTreble = 0;
	            audioLevel = 0;
	          }
	        }

        const isCustom = params.mode === 'custom';
        const currentSpeed = isCustom ? params.customSpeed : params.speed;
        renderPattern(params, zoom);
        drawPostProcessTo(p, pg, params);
        if (p.isLooping()) f += currentSpeed;
      } catch (e) {
        console.error("Error in p5 draw loop:", e);
      } finally {
        frameCounter++;
      }
    };

    function setStrokeColor(p: p5, val: number, palette: string, params: AppParams, brightnessOverride: number | null = null, alphaOverride: number | null = null) {
      let h = 0, s = 0, b = 0;
      const a = alphaOverride !== null ? alphaOverride : (params.mode === 'custom' ? params.customAlpha : params.alpha);
      switch (palette) {
        case 'cyberpunk': h = p.map(p.sin(val * 0.02), -1, 1, 180, 320); s = 90; b = 100; break;
        case 'monochrome': h = 0; s = 0; b = p.map(p.sin(val * 0.05), -1, 1, 40, 100); break;
        case 'pastel': h = val % 360; s = 40; b = 95; break;
        case 'warm': h = p.map(p.sin(val * 0.03), -1, 1, 330, 420) % 360; s = 90; b = 100; break;
        case 'cool': h = p.map(p.sin(val * 0.03), -1, 1, 150, 260); s = 80; b = 100; break;
        case 'golden': h = p.map(p.sin(val * 0.04), -1, 1, 30, 55); s = p.map(p.sin(val * 0.1), -1, 1, 70, 100); b = p.map(p.cos(val * 0.1), -1, 1, 80, 100); break;
        default: h = val % 360; s = 80; b = 100;
      }
      if (brightnessOverride !== null) b = brightnessOverride;
      b = p.min(100, b + audioTreble * 30);
      pg.stroke(h, s, b, a);
    }

    function getColorValues(p: p5, val: number, palette: string, out: [number, number, number]) {
      switch (palette) {
        case 'cyberpunk':
          out[0] = p.map(p.sin(val * 0.02), -1, 1, 180, 320); out[1] = 90; out[2] = 100; break;
        case 'monochrome':
          out[0] = 0; out[1] = 0; out[2] = p.map(p.sin(val * 0.05), -1, 1, 40, 100); break;
        case 'pastel':
          out[0] = val % 360; out[1] = 40; out[2] = 95; break;
        case 'warm':
          out[0] = p.map(p.sin(val * 0.03), -1, 1, 330, 420) % 360; out[1] = 90; out[2] = 100; break;
        case 'cool':
          out[0] = p.map(p.sin(val * 0.03), -1, 1, 150, 260); out[1] = 80; out[2] = 100; break;
        case 'golden':
          out[0] = p.map(p.sin(val * 0.04), -1, 1, 30, 55); out[1] = p.map(p.sin(val * 0.1), -1, 1, 70, 100); out[2] = p.map(p.cos(val * 0.1), -1, 1, 80, 100); break;
        default:
          out[0] = val % 360; out[1] = 80; out[2] = 100;
      }
    }

    function drawCustom(p: p5, params: AppParams, minDim: number, palette: string) {
      if (linesDrawn >= LINE_BUDGET) return;

      const layers = Math.max(1, params.customCircles);
      const res = Math.max(4, params.customPoints);
      const totalPoints = params.customCount;
      const connectDist = params.customDist;
      const sym = Math.max(1, params.customSymmetry);

      const complexityFactor = sym * layers * totalPoints;
      const pointStep = Math.max(1, Math.floor(complexityFactor / 10000));

      const getAudioBand = (band: string) => {
        if (band === 'bass') return audioBass;
        if (band === 'mid') return audioMid;
        if (band === 'treble') return audioTreble;
        return 0;
      };
      const modReact = getAudioBand(params.customAudioMapMod);
      const freqReact = getAudioBand(params.customAudioMapFreq);

      let driftX = 0, driftY = 0, driftMod = 0;
      if (params.customDrift) {
        driftX = p.noise(f * 0.1, 100) * 2;
        driftY = p.noise(f * 0.1, 200) * 2;
        driftMod = p.noise(f * 0.05, 300) * 3;
      }

      const scale = minDim * 0.35 * (1 + audioBass * 0.15);
      pg.strokeWeight(1.5 * (1 + audioTreble * 1.0));

      for (let s = 0; s < sym; s++) {
        if (linesDrawn >= LINE_BUDGET) break;
        const symRot = (p.TAU / sym) * s;
        pg.push();
        pg.rotate(symRot);

        for (let l = 0; l < layers; l++) {
          if (linesDrawn >= LINE_BUDGET) break;
          const layerRot = (p.TAU / layers) * l + f * params.customSpeed * 20;
          const layerPoints: { x: number, y: number }[] = [];
          let prevX: number | undefined, prevY: number | undefined;

          if (params.customStyle === 'curve' || params.customStyle === 'glow') pg.beginShape();

          for (let i = 0; i <= totalPoints; i += pointStep) {
            const t = (i / totalPoints) * p.TAU * (res / 4);
            const fb = fastSin(t * (params.customFeedback + driftX) + f * 2.0) * (params.customMod + driftMod) * (1 + modReact);
            const angX = t * (params.customFreqX + freqReact) + fb + f;
            const angY = t * params.customFreqY + fb;
            const r = scale * (1 + 0.1 * fastSin(t * 3 + f));

            const lx = fastSin(angX) * r;
            const ly = fastCos(angY) * r;
            const gx = lx * fastCos(layerRot) - ly * fastSin(layerRot);
            const gy = lx * fastSin(layerRot) + ly * fastCos(layerRot);

            if (connectDist > 0) layerPoints.push({ x: gx, y: gy });

            const val = f * params.customHueSpeed + i * (params.customHueSpeed / 10) + l * 30;
            setStrokeColor(p, val, palette, params, null, params.customAlpha);

            if (params.customStyle === 'point') {
              pg.point(gx, gy);
              linesDrawn += 0.1;
            } else if (params.customStyle === 'curve' || params.customStyle === 'glow') {
              if (params.customStyle === 'glow') pg.strokeWeight(4);
              (pg as any).vertex(gx, gy);
              linesDrawn += 0.2;
            } else { // 'line'
              if (prevX !== undefined) {
                pg.line(prevX, prevY, gx, gy);
                linesDrawn++;
              }
            }
            prevX = gx; prevY = gy;
          }
          if (params.customStyle === 'curve' || params.customStyle === 'glow') pg.endShape();

          const hash: SpatialHash = (p as any).spatialHash;
          if (connectDist > 0 && linesDrawn < LINE_BUDGET) {
            hash.clear();
            const cellSize = connectDist;
            // @ts-ignore
            hash.cellSize = cellSize;

            layerPoints.forEach((pt, i) => hash.add(pt.x, pt.y, i));

            const threshSq = connectDist * connectDist * (1 + audioMid * 0.3);
            const skip = 1;

            for (let i = 0; i < layerPoints.length; i += skip) {
              if (linesDrawn >= LINE_BUDGET) break;
	              const p1 = layerPoints[i];
	              const nearby = hash.getNearby(p1.x, p1.y, spatialNearby);

              for (const other of nearby) {
                const j = other.data;
                if (j <= i) continue;
                if (linesDrawn >= LINE_BUDGET) break;

                const dx = p1.x - other.x;
                const dy = p1.y - other.y;
                if (dx * dx + dy * dy < threshSq) {
                  const val = f * params.customHueSpeed + i * 5 + l * 30;
                  setStrokeColor(p, val, palette, params, null, params.customAlpha * 0.3);
                  pg.line(p1.x, p1.y, other.x, other.y);
                  linesDrawn++;
                }
              }
            }
          }
        }
        pg.pop();
      }
    }

    function drawMoire(p: p5, params: AppParams, minDim: number, palette: string) {
      let idx = 0; let d = 1;
      const baseStart = minDim * 0.15;
      const stepSize = minDim * 0.1;
      let j = baseStart;
      const TAU = p.TAU;

      const maxCircles = params.circles;
      const pointsPerCircle = params.points;

      for (let c = 0; c < maxCircles; c++) {
        for (let i = 0; i < TAU; i += TAU / pointsPerCircle) {
          if (idx >= MAX_POINTS) break;
          let I = i + f * d * (1 + j / 100);
          let radius = j * (1 + audioBass * 0.15);
          moireX[idx] = fastSin(I) * radius; moireY[idx] = fastCos(I) * radius;
          setStrokeColor(p, f * params.hueSpeed + i * 10 + j, palette, params);
          pg.strokeWeight((1 + fastSin(f * 10 + i) / 3) * (1 + audioLevel * 1.5 + audioTreble * 2.0));
          idx++;
        }
        j += stepSize; d = -d;
      }

      const hash: SpatialHash = (p as any).spatialHash;
      const baseDist = params.dist * (minDim / 600);
      const cellSize = baseDist;
      // @ts-ignore
      hash.cellSize = cellSize;
      hash.clear();

      for (let i = 0; i < idx; i++) {
        hash.add(moireX[i], moireY[i], i);
      }

      const threshSq = baseDist * baseDist * (1 + audioMid * 0.2) * (1 + audioMid * 0.2);
      const skip = 1;

      for (let i = 0; i < idx; i += skip) {
	        if (linesDrawn >= LINE_BUDGET) break;
	        let px = moireX[i]; let py = moireY[i];
	        const nearby = hash.getNearby(px, py, spatialNearby);

        for (const other of nearby) {
          const k = other.data;
          if (k <= i) continue;
          if (linesDrawn >= LINE_BUDGET) break;

          let qx = moireX[k]; let qy = moireY[k];
          let dx = px - qx; let dy = py - qy;
          if (dx * dx + dy * dy < threshSq) {
            pg.line(px, py, qx, qy);
            linesDrawn++;
          }
        }
      }
    }

    function drawSpiral(p: p5, params: AppParams, minDim: number, palette: string) {
      pg.strokeWeight(1.2 * (1 + audioTreble * 1.5));
      let prevX: number | undefined, prevY: number | undefined;
      const TAU = p.TAU;
      const stepR = minDim * 0.03; const layerR = minDim * 0.06;
      for (let l = 0; l < params.layers; l++) {
        if (linesDrawn >= LINE_BUDGET) break;
        pg.beginShape();
        pg.noFill();
        for (let i = 0; i < TAU * 5; i += 0.12) {
          let r = (i * stepR + l * layerR) * (1 + audioBass * 0.25);
          let ang = i * (3 + params.spiralStrength * 10) + f * (l % 2 ? -1 : 1) + audioMid * 0.15;
          let x = fastCos(ang) * r; let y = fastSin(ang) * r;
          if (i === 0) {
            setStrokeColor(p, f * params.hueSpeed + l * 30, palette, params);
          }
          pg.vertex(x, y);
          linesDrawn++;
        }
        pg.endShape();
      }
    }

    function drawGrid(p: p5, params: AppParams, minDim: number, palette: string) {
      let density = Math.max(2, params.gridDensity / (1 + audioBass * 0.3));
      const cw = pg?.width ?? p.width;
      const ch = pg?.height ?? p.height;
      let step = cw / density;
      pg.strokeWeight(1.5 + audioTreble * 4.0);

      const drawFullGrid = () => {
        pg.beginShape(p.LINES);
        for (let i = -cw; i <= cw; i += step) {
          pg.vertex(i, -ch); pg.vertex(i, ch);
          pg.vertex(-cw, i); pg.vertex(cw, i);
          linesDrawn += 2;
        }
        pg.endShape();
      };

      setStrokeColor(p, f * params.hueSpeed, palette, params);
      drawFullGrid();

      pg.push();
      pg.rotate(params.rotDiff + f * 0.01 + audioMid * 0.2);
      setStrokeColor(p, f * params.hueSpeed + 120, palette, params, null, params.alpha * 0.7);
      drawFullGrid();
      pg.pop();
    }

	    function drawRandom(p: p5, params: AppParams, minDim: number, palette: string) {
	      const safeRadius = (minDim * 0.4) * (1 + audioBass * 0.2);
	      const count = params.randomPoints;
	      for (let i = 0; i < count; i++) {
	        let ang = p.random(p.TAU) + f * (p.random() < 0.5 ? -1 : 1);
	        let r = p.random(safeRadius);
	        randomX[i] = fastCos(ang) * r; randomY[i] = fastSin(ang) * r;
	      }
      pg.strokeWeight(1 + audioTreble * 4.0);

      const hash: SpatialHash = (p as any).spatialHash;
      const maxDist = 150 * (minDim / 600) * (1 + audioMid * 0.3);
      // @ts-ignore
      hash.cellSize = maxDist;
      hash.clear();
      for (let i = 0; i < count; i++) {
        hash.add(randomX[i], randomY[i], i);
      }

      const threshSq = maxDist * maxDist;
	      for (let i = 0; i < count; i++) {
	        if (linesDrawn >= LINE_BUDGET) break;
	        const px = randomX[i]; const py = randomY[i];
	        const nearby = hash.getNearby(px, py, spatialNearby);

        for (const other of nearby) {
          const j = other.data;
          if (j <= i) continue;
          if (linesDrawn >= LINE_BUDGET) break;

          let dx = px - other.x; let dy = py - other.y;
	          let distSq = dx * dx + dy * dy;
	          if (distSq < threshSq) {
	            let d = Math.sqrt(distSq);
	            getColorValues(p, i + f * params.hueSpeed, palette, colorBuf);
	            pg.stroke(colorBuf[0], colorBuf[1], colorBuf[2], p.map(d, 0, maxDist, params.alpha, 0));
	            pg.line(px, py, other.x, other.y);
	            linesDrawn++;
	          }
	        }
	      }
    }

    function drawFlower(p: p5, params: AppParams, minDim: number, palette: string) {
      pg.strokeWeight(1.5 * (1 + audioTreble * 1.5));
      const baseR = minDim * 0.15; const varR = minDim * 0.25;
      for (let petal = 0; petal < params.petals; petal++) {
        if (linesDrawn >= LINE_BUDGET) break;
        let offset = petal * p.TAU / params.petals;
        pg.beginShape();
        pg.noFill();
        for (let i = 0; i < p.TAU; i += 0.05) {
          let r = (baseR + fastSin(i * params.petals / 2) * varR) * (1 + audioBass * 0.3);
          let ang = i * params.flowerSpeed + f + offset + audioMid * 0.1;
          if (i === 0) setStrokeColor(p, f * params.hueSpeed + petal * 30, palette, params);
          let cx = fastCos(ang) * r; let cy = fastSin(ang) * r;
          pg.vertex(cx, cy);
          linesDrawn++;
        }
        pg.endShape();
      }
    }

    function drawWave(p: p5, params: AppParams, minDim: number, palette: string) {
      pg.strokeWeight(2 + audioTreble * 3);
      for (let w = 0; w < params.waves; w++) {
        if (linesDrawn >= LINE_BUDGET) break;
        let offset = w * 20;
        pg.beginShape();
        pg.noFill();
        const cw = pg?.width ?? p.width;
        const ch = pg?.height ?? p.height;
        for (let x = -cw / 2; x < cw / 2; x += 8) {
          let y = fastSin(x * 0.02 + f + offset) * params.amp * (1 + audioMid * 0.4) + fastCos(x * 0.01) * 30;
          y = p.constrain(y, -ch / 2 + 10, ch / 2 - 10);
          if (x === -cw / 2) setStrokeColor(p, f * params.hueSpeed + w * 20, palette, params);
          pg.vertex(x, y);
          linesDrawn++;
        }
        pg.endShape();
      }
    }

    function drawPostProcessTo(target: any, source: p5.Graphics, params: AppParams) {
      const w = target?.width ?? p.width;
      const h = target?.height ?? p.height;
      target.background(PREVIEW_BG);
      const isCustom = params.mode === 'custom';
      const isPpMirror = isCustom ? params.customPpMirror : params.ppMirror;
      const isPpInvert = isCustom ? params.customPpInvert : params.ppInvert;
      const isPpGlitch = isCustom ? params.customPpGlitch : params.ppGlitch;

      let ox = 0, oy = 0;
      if (isPpGlitch && (p.random() < 0.1 || (audioTreble > 0.8 && p.random() < 0.5))) { ox = p.random(-20, 20); oy = p.random(-5, 5); }
      if (isPpMirror) {
        target.image(source, ox, oy, w / 2, h / 2, 0, 0, w, h);
        target.push(); target.translate(w, 0); target.scale(-1, 1); target.image(source, 0, 0, w / 2, h / 2, 0, 0, w, h); target.pop();
        target.push(); target.translate(0, h); target.scale(1, -1); target.image(source, 0, 0, w / 2, h / 2, 0, 0, w, h); target.pop();
        target.push(); target.translate(w, h); target.scale(-1, -1); target.image(source, 0, 0, w / 2, h / 2, 0, 0, w, h); target.pop();
      } else if (source) {
        target.image(source, ox, oy, w, h);
      }
      if (isPpGlitch && (p.random() < 0.2 || audioTreble > 0.7)) {
        let y = p.random(h), bandH = p.random(5, 50) * (1 + audioTreble), shift = p.random(-50, 50) * (1 + audioTreble);
        target.image(target.get(0, y, w, bandH), shift, y);
      }
      if (isPpInvert) target.filter(p.INVERT);
    }

    function renderPattern(params: AppParams, zoom: number) {
      const isCustom = params.mode === 'custom';
      const currentTrail = isCustom ? params.customTrailAlpha : params.trailAlpha;
      const currentPalette = isCustom ? params.customPalette : params.palette;

      const isMoireSpiral = params.mode === 'moire' || params.mode === 'spiral';
      const useGPU = (params.mode === 'shader') || (params.gpuAccelerated && isMoireSpiral);

      const w = pg?.width ?? p.width;
      const h = pg?.height ?? p.height;
      const minDim = p.min(w, h);

      if (useGPU && pgShader && theShader) {
        pgShader.shader(theShader);
        theShader.setUniform('u_resolution', [w, h]);
        theShader.setUniform('u_time', f * (params.mode === 'shader' ? params.shaderSpeed : params.speed * 100));
        theShader.setUniform('u_scale', (params.mode === 'shader' ? params.shaderScale : 1.0) / zoom);
        theShader.setUniform('u_audio', audioLevel);
        theShader.setUniform('u_bass', audioBass);
        theShader.setUniform('u_mid', audioMid);
        theShader.setUniform('u_treble', audioTreble);

        let shaderModeVal = 0;
        let pA = 0, pB = 0, pC = 0;
        if (params.mode === 'moire') {
          shaderModeVal = 1;
          pA = params.circles;
          pB = params.points;
          pC = params.dist;
        } else if (params.mode === 'spiral') {
          shaderModeVal = 2;
          pA = params.spiralStrength;
          pB = params.layers;
        }
        theShader.setUniform('u_mode', shaderModeVal);
        theShader.setUniform('u_paramA', pA);
        theShader.setUniform('u_paramB', pB);
        theShader.setUniform('u_paramC', pC);

        const getPaletteCoeffs = (pal: string) => {
          switch (pal) {
            case 'cyberpunk': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.6, 0.7, 0.8] };
            case 'monochrome': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.0, 0.0, 0.0] };
            case 'pastel': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.3, 0.2, 0.2] };
            case 'warm': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.0, 0.1, 0.2] };
            case 'cool': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.5, 0.6, 0.7] };
            case 'golden': return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.1, 0.2, 0.3] };
            default: return { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.0, 0.33, 0.67] };
          }
        };
        const coeffs = getPaletteCoeffs(currentPalette);
        theShader.setUniform('u_palette_a', coeffs.a);
        theShader.setUniform('u_palette_b', coeffs.b);
        theShader.setUniform('u_palette_c', coeffs.c);
        theShader.setUniform('u_palette_d', coeffs.d);

        pgShader.resetMatrix();
        // @ts-ignore
        pgShader.beginShape(p.TRIANGLE_STRIP);
        pgShader.vertex(-1, -1, 0, 0, 1); pgShader.vertex(1, -1, 0, 1, 1);
        pgShader.vertex(-1, 1, 0, 0, 0); pgShader.vertex(1, 1, 0, 1, 0);
        pgShader.endShape();
        if (pg) {
          pg.resetMatrix(); pg.imageMode(p.CORNER); pg.image(pgShader, 0, 0, w, h);
        }
        return;
      }

      if (!pg) return;
      pg.noStroke();
      pg.fill(`rgba(${PREVIEW_BG_RGB}, ${currentTrail / 100})`);
      pg.rect(0, 0, w, h);
      pg.push();
      pg.translate(w / 2, h / 2);
      let baseScale = (params.mode === 'grid' || params.mode === 'wave') ? 1.0 : 0.85;
      pg.scale(baseScale * zoom);
      if (params.mode === 'moire') drawMoire(p, params, minDim, currentPalette);
      else if (params.mode === 'spiral') drawSpiral(p, params, minDim, currentPalette);
      else if (params.mode === 'grid') drawGrid(p, params, minDim, currentPalette);
      else if (params.mode === 'random') drawRandom(p, params, minDim, currentPalette);
      else if (params.mode === 'flower') drawFlower(p, params, minDim, currentPalette);
      else if (params.mode === 'wave') drawWave(p, params, minDim, currentPalette);
      else if (params.mode === 'custom') drawCustom(p, params, minDim, currentPalette);
      pg.pop();
    }
  };
};
