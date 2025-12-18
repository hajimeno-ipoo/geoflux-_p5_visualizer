
import p5 from 'p5';
import { AppParams } from './types';

type P5WithSound = p5 & {
  loadSound: (path: string | File, success?: (s: any) => void, error?: (err: any) => void) => any;
  Amplitude: new () => any;
  FFT: new (smoothing?: number, bins?: number) => any;
  userStartAudio: () => Promise<void>;
  getAudioContext: () => AudioContext;
};

export const createSketch = (
  paramsRef: React.MutableRefObject<AppParams>, 
  audioFileRef: React.MutableRefObject<File | null>,
  zoomRef: React.MutableRefObject<number>
) => {
  return (p: p5) => {
    const p5s = p as P5WithSound;
    let f = 0;
    let song: any = null;
    let amplitude: any;
    let fft: any;
    let audioBass = 0;
    let audioMid = 0;
    let audioTreble = 0;
    let audioLevel = 0;
    let pg: p5.Graphics;
    let pgShader: p5.Graphics;
    let theShader: p5.Shader;

    // 描画予算管理
    let linesDrawn = 0;
    const LINE_BUDGET = 4000; // 1フレームあたりの最大描画ライン数

    const MAX_POINTS = 2000;
    const moireX = new Float32Array(MAX_POINTS);
    const moireY = new Float32Array(MAX_POINTS);
    const randomX = new Float32Array(MAX_POINTS);
    const randomY = new Float32Array(MAX_POINTS);

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

      vec3 palette(float t) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.263, 0.416, 0.557);
          return a + b * cos(6.28318 * (c * t + d + u_mid * 0.2));
      }

      void main() {
          vec2 uv = vTexCoord * 2.0 - 1.0;
          float aspect = u_resolution.x / u_resolution.y;
          uv.x *= aspect;
          uv.y *= -1.0;
          uv *= u_scale * (1.0 - u_bass * 0.1);
          vec2 uv0 = uv;
          vec3 finalColor = vec3(0.0);
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
          finalColor *= (1.0 + u_audio * 0.5 + u_bass * 0.3);
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const ensureAudioContext = () => {
        if (p5s.userStartAudio) p5s.userStartAudio().catch(() => {});
    };

    (p as any).updateAudioFile = (file: File) => {
      if (typeof p5s.loadSound !== 'function') return;
      ensureAudioContext();
      if (song) { song.stop(); song.disconnect(); }
      const url = URL.createObjectURL(file);
      song = p5s.loadSound(url, (loadedSong: any) => {
        song = loadedSong;
        const currentVol = paramsRef.current.mode === 'custom' ? paramsRef.current.customAudioVol : paramsRef.current.audioVol;
        song.setVolume(currentVol);
        song.disconnect();
        song.connect(); 
        if (fft) fft.setInput();
        if (amplitude) amplitude.setInput();
      });
    };

    (p as any).toggleAudio = () => {
      ensureAudioContext();
      if (song && song.isLoaded()) {
        if (song.isPlaying()) song.pause(); else song.play();
        return song.isPlaying();
      }
      return false;
    };

    (p as any).stopAudio = () => { if (song) song.stop(); };
    (p as any).setAudioVolume = (vol: number) => { if (song) song.setVolume(vol); };
    (p as any).exportHighRes = () => {
        const currentDensity = p.pixelDensity();
        p.pixelDensity(2);
        p.saveCanvas('pattern-HD-' + Date.now(), 'png');
        p.pixelDensity(currentDensity);
    };

    (p as any).clearCanvas = () => {
        p.background(0);
        if (pg) { pg.background(0); }
        if (pgShader) { pgShader.clear(); pgShader.background(0); }
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
      const GlobalP5 = (window as any).p5;
      try {
        if (p5s.Amplitude) amplitude = new p5s.Amplitude();
        else if (GlobalP5 && GlobalP5.Amplitude) amplitude = new GlobalP5.Amplitude();
        if (p5s.FFT) fft = new p5s.FFT(0.8, 512);
        else if (GlobalP5 && GlobalP5.FFT) fft = new GlobalP5.FFT(0.8, 512);
      } catch(e) {}
    };

    (p as any).customResize = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return;
        p.resizeCanvas(w, h);
        if(pg) { pg.resizeCanvas(w, h); pg.background(0); }
        if(pgShader) pgShader.resizeCanvas(w, h);
    };

    p.draw = () => {
      const params = paramsRef.current;
      const zoom = zoomRef.current;
      linesDrawn = 0;

      try {
        if (fft) {
            fft.analyze();
            const rawLevel = amplitude ? amplitude.getLevel() : 0;
            const isCustom = params.mode === 'custom';
            const sens = isCustom ? params.customAudioSens : params.audioSens;
            const sBass = isCustom ? params.customAudioSensBass : params.audioSensBass;
            const sMid = isCustom ? params.customAudioSensMid : params.audioSensMid;
            const sTreble = isCustom ? params.customAudioSensTreble : params.audioSensTreble;
            
            audioBass = p.map(fft.getEnergy("bass"), 0, 255, 0, 1.0) * sens * sBass;
            audioMid = p.map(fft.getEnergy("mid"), 0, 255, 0, 1.0) * sens * sMid;
            audioTreble = p.map(fft.getEnergy("treble"), 0, 255, 0, 1.0) * sens * sTreble;
            audioLevel = rawLevel * sens;
        }

        const isCustom = params.mode === 'custom';
        const currentSpeed = isCustom ? params.customSpeed : params.speed;
        const currentTrail = isCustom ? params.customTrailAlpha : params.trailAlpha;
        const currentPalette = isCustom ? params.customPalette : params.palette;

        if (params.mode === 'shader') {
          pgShader.shader(theShader);
          theShader.setUniform('u_resolution', [p.width, p.height]);
          theShader.setUniform('u_time', f * params.shaderSpeed);
          theShader.setUniform('u_scale', params.shaderScale / zoom);
          theShader.setUniform('u_audio', audioLevel);
          theShader.setUniform('u_bass', audioBass);
          theShader.setUniform('u_mid', audioMid);
          theShader.setUniform('u_treble', audioTreble);
          pgShader.resetMatrix();
          // @ts-ignore
          pgShader.beginShape(p.TRIANGLE_STRIP);
          pgShader.vertex(-1, -1, 0, 0, 1); pgShader.vertex(1, -1, 0, 1, 1);
          pgShader.vertex(-1, 1, 0, 0, 0); pgShader.vertex(1, 1, 0, 1, 0);
          pgShader.endShape();
          pg.resetMatrix(); pg.imageMode(p.CORNER); pg.image(pgShader, 0, 0, p.width, p.height);
        } else {
          pg.noStroke();
          pg.fill(0, 0, 0, currentTrail);
          pg.rect(0, 0, p.width, p.height);
          pg.push(); 
          pg.translate(p.width/2, p.height/2); 
          const minDim = p.min(p.width, p.height);
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
        drawPostProcess(p, params);
        f += currentSpeed;
      } catch(e) {}
    };

    function setStrokeColor(p: p5, val: number, palette: string, params: AppParams, brightnessOverride: number | null = null, alphaOverride: number | null = null) {
      let h = 0, s = 0, b = 0;
      const a = alphaOverride !== null ? alphaOverride : (params.mode === 'custom' ? params.customAlpha : params.alpha);
      switch(palette) {
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

    function getColorValues(p: p5, val: number, palette: string): number[] {
        switch(palette) {
          case 'cyberpunk': return [p.map(p.sin(val * 0.02), -1, 1, 180, 320), 90, 100];
          case 'monochrome': return [0, 0, p.map(p.sin(val * 0.05), -1, 1, 40, 100)];
          case 'pastel': return [val % 360, 40, 95];
          case 'warm': return [p.map(p.sin(val * 0.03), -1, 1, 330, 420) % 360, 90, 100];
          case 'cool': return [p.map(p.sin(val * 0.03), -1, 1, 150, 260), 80, 100];
          case 'golden': return [p.map(p.sin(val * 0.04), -1, 1, 30, 55), p.map(p.sin(val * 0.1), -1, 1, 70, 100), p.map(p.cos(val * 0.1), -1, 1, 80, 100)];
          default: return [val % 360, 80, 100];
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
                const layerPoints: {x:number, y:number}[] = [];
                let prevX: number | undefined, prevY: number | undefined;

                if (params.customStyle === 'curve' || params.customStyle === 'glow') pg.beginShape();

                for (let i = 0; i <= totalPoints; i += pointStep) {
                    const t = (i / totalPoints) * p.TAU * (res / 4);
                    const fb = p.sin(t * (params.customFeedback + driftX) + f * 2.0) * (params.customMod + driftMod) * (1 + modReact);
                    const angX = t * (params.customFreqX + freqReact) + fb + f;
                    const angY = t * params.customFreqY + fb;
                    const r = scale * (1 + 0.1 * p.sin(t * 3 + f));
                    
                    const lx = p.sin(angX) * r;
                    const ly = p.cos(angY) * r;
                    const gx = lx * p.cos(layerRot) - ly * p.sin(layerRot);
                    const gy = lx * p.sin(layerRot) + ly * p.cos(layerRot);
                    
                    if (connectDist > 0) layerPoints.push({x: gx, y: gy});
                    
                    const val = f * params.customHueSpeed + i * (params.customHueSpeed/10) + l * 30;
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

                if (connectDist > 0 && linesDrawn < LINE_BUDGET) {
                     const threshSq = connectDist * connectDist * (1 + audioMid * 0.3);
                     const meshComplexity = sym * layers * (layerPoints.length * layerPoints.length);
                     const skip = Math.max(1, Math.floor(meshComplexity / 100000)); 
                     
                     for (let i = 0; i < layerPoints.length; i += skip) {
                         if (linesDrawn >= LINE_BUDGET) break;
                         for (let j = i + skip; j < layerPoints.length; j += skip * 2) {
                             if (linesDrawn >= LINE_BUDGET) break;
                             const p1 = layerPoints[i]; const p2 = layerPoints[j];
                             const dx = p1.x - p2.x; const dy = p1.y - p2.y;
                             if (Math.abs(dx) > connectDist || Math.abs(dy) > connectDist) continue;
                             if ((dx*dx + dy*dy) < threshSq) {
                                 const val = f * params.customHueSpeed + i * 5 + l * 30;
                                 setStrokeColor(p, val, palette, params, null, params.customAlpha * 0.3);
                                 pg.line(p1.x, p1.y, p2.x, p2.y);
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
          moireX[idx] = p.sin(I) * radius; moireY[idx] = p.cos(I) * radius;
          setStrokeColor(p, f * params.hueSpeed + i * 10 + j, palette, params);
          pg.strokeWeight((1 + p.sin(f * 10 + i) / 3) * (1 + audioLevel * 1.5 + audioTreble * 2.0));
          idx++;
        }
        j += stepSize; d = -d;
      }

      const baseDist = params.dist * (minDim / 600);
      const threshSq = baseDist * baseDist * (1 + audioMid * 0.2) * (1 + audioMid * 0.2);
      const moireComplexity = idx * idx;
      const skip = Math.max(1, Math.floor(moireComplexity / 100000));

      for (let i = 0; i < idx; i += skip) {
        if (linesDrawn >= LINE_BUDGET) break;
        let px = moireX[i]; let py = moireY[i];
        for (let k = i + 1; k < idx; k += skip) {
          if (linesDrawn >= LINE_BUDGET) break;
          let qx = moireX[k]; let qy = moireY[k];
          let dx = px-qx; let dy = py-qy;
          if (Math.abs(dx) > baseDist || Math.abs(dy) > baseDist) continue;
          if (dx*dx + dy*dy < threshSq) {
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
          for (let i = 0; i < TAU * 5; i += 0.12) {
            let r = (i * stepR + l * layerR) * (1 + audioBass * 0.25); 
            let ang = i * (3 + params.spiralStrength * 10) + f * (l % 2 ? -1 : 1) + audioMid * 0.15;
            let x = p.cos(ang) * r; let y = p.sin(ang) * r;
            setStrokeColor(p, f * params.hueSpeed + i * 15 + l * 30, palette, params);
            pg.point(x, y);
            if (prevX !== undefined) {
                pg.line(prevX, prevY, x, y);
                linesDrawn++;
            }
            prevX = x; prevY = y;
          }
          prevX = prevY = undefined;
        }
    }

    function drawGrid(p: p5, params: AppParams, minDim: number, palette: string) {
        let density = params.gridDensity / (1 + audioBass * 0.3); 
        let step = p.width / density;
        pg.strokeWeight(1.5 + audioTreble * 4.0);
        setStrokeColor(p, f * params.hueSpeed, palette, params);
        for (let i = -p.width; i <= p.width; i += step) { pg.line(i, -p.height, i, p.height); pg.line(-p.width, i, p.width, i); linesDrawn+=2; }
        pg.push(); pg.rotate(params.rotDiff + f * 0.01 + audioMid * 0.2); 
        setStrokeColor(p, f * params.hueSpeed + 120, palette, params);
        for (let i = -p.width; i <= p.width; i += step) { pg.line(i, -p.height, i, p.height); pg.line(-p.width, i, p.width, i); linesDrawn+=2; }
        pg.pop();
    }

    function drawRandom(p: p5, params: AppParams, minDim: number, palette: string) {
        const safeRadius = (minDim * 0.4) * (1 + audioBass * 0.2);
        const count = params.randomPoints;
        for (let i = 0; i < count; i++) {
          let ang = p.random(p.TAU) + f * p.random([-1, 1]);
          let r = p.random(safeRadius); 
          randomX[i] = p.cos(ang) * r; randomY[i] = p.sin(ang) * r;
        }
        pg.strokeWeight(1 + audioTreble * 4.0); 

        const maxDist = 150 * (minDim / 600) * (1 + audioMid * 0.3);
        const threshSq = maxDist * maxDist;
        const skip = Math.max(1, Math.floor((count * count) / 100000));

        for (let i = 0; i < count; i += skip) {
          if (linesDrawn >= LINE_BUDGET) break;
          for (let j = i + 1; j < count; j += skip) {
            if (linesDrawn >= LINE_BUDGET) break;
            let dx = randomX[i] - randomX[j]; let dy = randomY[i] - randomY[j];
            if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;
            let distSq = dx*dx + dy*dy;
            if (distSq < threshSq) {
              let d = Math.sqrt(distSq);
              const [h, s, b] = getColorValues(p, i + f * params.hueSpeed, palette);
              pg.stroke(h, s, b, p.map(d, 0, maxDist, params.alpha, 0));
              pg.line(randomX[i], randomY[i], randomX[j], randomY[j]);
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
          let prevX: number | undefined, prevY: number | undefined;
          for (let i = 0; i < p.TAU; i += 0.05) {
            let r = (baseR + p.sin(i * params.petals / 2) * varR) * (1 + audioBass * 0.3); 
            let ang = i * params.flowerSpeed + f + offset + audioMid * 0.1;
            setStrokeColor(p, f * params.hueSpeed + petal * 30 + i * 20, palette, params);
            let cx = p.cos(ang)*r; let cy = p.sin(ang)*r;
            pg.point(cx, cy);
            if (prevX !== undefined) {
                pg.line(prevX, prevY, cx, cy);
                linesDrawn++;
            }
            prevX = cx; prevY = cy;
          }
        }
    }

    function drawWave(p: p5, params: AppParams, minDim: number, palette: string) {
        pg.strokeWeight(2 + audioTreble * 3);
        for (let w = 0; w < params.waves; w++) {
          if (linesDrawn >= LINE_BUDGET) break;
          let offset = w * 20; let prevY: number | undefined;
          for (let x = -p.width/2; x < p.width/2; x += 8) {
            let y = p.sin(x * 0.02 + f + offset) * params.amp * (1 + audioMid * 0.4) + p.cos(x * 0.01) * 30; 
            y = p.constrain(y, -p.height/2 + 10, p.height/2 - 10);
            setStrokeColor(p, f * params.hueSpeed + w * 20 + (x + p.width/2) * 0.1, palette, params);
            pg.point(x, y);
            if (prevY !== undefined) {
                pg.line(x - 8, prevY, x, y);
                linesDrawn++;
            }
            prevY = y;
          }
        }
    }

    function drawPostProcess(p: p5, params: AppParams) {
        p.background(0);
        const isCustom = params.mode === 'custom';
        const isPpMirror = isCustom ? params.customPpMirror : params.ppMirror;
        const isPpInvert = isCustom ? params.customPpInvert : params.ppInvert;
        const isPpGlitch = isCustom ? params.customPpGlitch : params.ppGlitch;

        let ox = 0, oy = 0;
        if (isPpGlitch && (p.random() < 0.1 || (audioTreble > 0.8 && p.random() < 0.5))) { ox = p.random(-20, 20); oy = p.random(-5, 5); }
        if (isPpMirror) {
          p.image(pg, ox, oy, p.width/2, p.height/2, 0, 0, p.width, p.height);
          p.push(); p.translate(p.width, 0); p.scale(-1, 1); p.image(pg, 0, 0, p.width/2, p.height/2, 0, 0, p.width, p.height); p.pop();
          p.push(); p.translate(0, p.height); p.scale(1, -1); p.image(pg, 0, 0, p.width/2, p.height/2, 0, 0, p.width, p.height); p.pop();
          p.push(); p.translate(p.width, p.height); p.scale(-1, -1); p.image(pg, 0, 0, p.width/2, p.height/2, 0, 0, p.width, p.height); p.pop();
        } else p.image(pg, ox, oy, p.width, p.height);
        if (isPpGlitch && (p.random() < 0.2 || audioTreble > 0.7)) {
          let y = p.random(p.height), h = p.random(5, 50) * (1 + audioTreble), shift = p.random(-50, 50) * (1 + audioTreble);
          p.image(p.get(0, y, p.width, h), shift, y);
        }
        if (isPpInvert) p.filter(p.INVERT);
    }
  };
};
