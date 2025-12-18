
export interface AppParams {
  mode: 'moire' | 'spiral' | 'grid' | 'random' | 'flower' | 'wave' | 'shader' | 'custom';
  palette: 'rainbow' | 'cyberpunk' | 'monochrome' | 'pastel' | 'warm' | 'cool' | 'golden';
  speed: number;
  hueSpeed: number;
  alpha: number;
  trailAlpha: number;
  circles: number;
  points: number;
  dist: number;
  spiralStrength: number;
  layers: number;
  gridDensity: number;
  rotDiff: number;
  randomPoints: number;
  petals: number;
  flowerSpeed: number;
  waves: number;
  amp: number;
  
  // Custom Mode Parameters
  customCount: number;
  customFreqX: number;
  customFreqY: number;
  customMod: number;
  customFeedback: number;
  customCircles: number;
  customPoints: number;
  customDist: number;
  customSpeed: number;
  customHueSpeed: number;
  customAlpha: number;
  customTrailAlpha: number;
  customPalette: 'rainbow' | 'cyberpunk' | 'monochrome' | 'pastel' | 'warm' | 'cool' | 'golden';
  
  // Pro専用設定 (連動回避用)
  customPpMirror: boolean;
  customPpInvert: boolean;
  customPpGlitch: boolean;
  customAudioSens: number;
  customAudioSensBass: number;
  customAudioSensMid: number;
  customAudioSensTreble: number;
  customAudioVol: number;
  
  // --- NEW PRO ENHANCEMENTS ---
  customSymmetry: number;
  customStyle: 'line' | 'curve' | 'point' | 'glow';
  customAudioMapMod: 'bass' | 'mid' | 'treble' | 'none';
  customAudioMapFreq: 'bass' | 'mid' | 'treble' | 'none';
  customDrift: boolean;
  // ----------------------------

  audioSens: number;
  audioSensBass: number;
  audioSensMid: number;
  audioSensTreble: number;
  audioVol: number;
  shaderSpeed: number;
  shaderScale: number;
  ppMirror: boolean;
  ppInvert: boolean;
  ppGlitch: boolean;
}

export const defaultParams: AppParams = {
  mode: 'moire',
  palette: 'rainbow',
  speed: 0.01,
  hueSpeed: 50,
  alpha: 60,
  trailAlpha: 20,
  circles: 3,
  points: 12,
  dist: 200,
  spiralStrength: 0.05,
  layers: 5,
  gridDensity: 20,
  rotDiff: 0.1,
  randomPoints: 200,
  petals: 8,
  flowerSpeed: 3,
  waves: 10,
  amp: 100,
  
  // Custom Defaults
  customCount: 600,
  customFreqX: 3,
  customFreqY: 2,
  customMod: 0.5,
  customFeedback: 0.1,
  customCircles: 3,
  customPoints: 12,
  customDist: 200,
  customSpeed: 0.01,
  customHueSpeed: 50,
  customAlpha: 60,
  customTrailAlpha: 20,
  customPalette: 'cyberpunk',
  
  // Pro専用初期値
  customPpMirror: false,
  customPpInvert: false,
  customPpGlitch: false,
  customAudioSens: 2.0,
  customAudioSensBass: 1.0,
  customAudioSensMid: 1.0,
  customAudioSensTreble: 1.0,
  customAudioVol: 0.8,
  
  // NEW PRO DEFAULTS
  customSymmetry: 1,
  customStyle: 'line',
  customAudioMapMod: 'mid',
  customAudioMapFreq: 'none',
  customDrift: false,

  audioSens: 2.0,
  audioSensBass: 1.0,
  audioSensMid: 1.0,
  audioSensTreble: 1.0,
  audioVol: 0.8,
  shaderSpeed: 1.0,
  shaderScale: 1.0,
  ppMirror: false,
  ppInvert: false,
  ppGlitch: false
};

export interface Preset extends Partial<AppParams> {
  name: string;
}

export const presets: Preset[] = [
  { name: "🌀 クラシックモアレ", mode: 'moire', palette: 'rainbow', circles: 3, points: 12, dist: 200 },
  { name: "✨ ネオン・スパイラル", mode: 'spiral', palette: 'cyberpunk', spiralStrength: 0.05, layers: 8, speed: 0.02 },
  { name: "🕸 グリッド・イリュージョン", mode: 'grid', palette: 'monochrome', gridDensity: 25, rotDiff: 0.05 },
  { name: "🌌 星屑コネクション", mode: 'random', palette: 'cool', randomPoints: 300, dist: 120, trailAlpha: 10 },
  { name: "🌸 デジタル・フラワー", mode: 'flower', palette: 'pastel', petals: 12, flowerSpeed: 2 },
  { name: "🌊 ウェイブ・干渉", mode: 'wave', palette: 'golden', waves: 20, amp: 150 },
  { name: "🧬 リサージュ・カオス (カスタム)", mode: 'custom', customPalette: 'cyberpunk', customFreqX: 5, customFreqY: 4, customMod: 2.5, customFeedback: 2.0, customSpeed: 0.005 },
  { name: "👽 エイリアン・オーガニック (カスタム)", mode: 'custom', customPalette: 'cool', customFreqX: 1, customFreqY: 1, customMod: 3.0, customFeedback: 5.0, customTrailAlpha: 5 }
];
