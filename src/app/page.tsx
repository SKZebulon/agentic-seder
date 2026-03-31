'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { DEFAULT_CHARACTERS, charMap } from '@/data/characters';
import { buildScript } from '@/data/haggadah-script';
import { AudioEngine } from '@/engine/audio';
import { DialogueEngine } from '@/engine/dialogue';
import { Director } from '@/engine/director';
import {
  defaultPrefs,
  loadPrefs,
  savePrefs,
  subtitleFontPx,
  type SederPrefs,
} from '@/lib/seder-settings';

// ═══════════════════════════════════════════════════════════════
// 3D SCENE BUILDER
// ═══════════════════════════════════════════════════════════════

interface CharMesh {
  group: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  lArm: THREE.Mesh;
  rArm: THREE.Mesh;
  baseY: number;
  headY: number;
  standing: boolean;
  speaking: boolean;
  celebrating: boolean;
  drinking: boolean;
  phase: number;
}

/** Newer Three.js marks `position` read-only; Object.assign(mesh, { position }) throws. */
function place<T extends THREE.Object3D>(obj: T, x: number, y: number, z: number): T {
  obj.position.set(x, y, z);
  return obj;
}

function buildSederScene(
  canvas: HTMLCanvasElement,
  opts?: { cinematic?: boolean; reducedMotion?: boolean }
) {
  const cinematic = opts?.cinematic !== false;
  const reducedMotion = opts?.reducedMotion === true;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0614);
  scene.fog = new THREE.FogExp2(0x06020c, 0.014);
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 7, 10);
  camera.lookAt(0, 1, 0);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x2A2218, roughness: 0.88 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // Wall
  scene.add(place(new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshStandardMaterial({ color: 0x2C241C, roughness: 0.95 })), 0, 5, -8));

  // Table
  const tMat = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.7 });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.12, 32), tMat);
  table.position.y = 1; table.scale.set(1.3, 1, 1); table.castShadow = true; table.receiveShadow = true; scene.add(table);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), tMat), Math.cos(a) * 2.8, 0.5, Math.sin(a) * 2.2)); }

  // Tablecloth
  const cloth = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.6, 32), new THREE.MeshStandardMaterial({ color: 0xFAF0E6, side: THREE.DoubleSide }));
  cloth.rotation.x = -Math.PI / 2; cloth.position.y = 1.07; cloth.scale.set(1.3, 1, 1); scene.add(cloth);

  // Seder plate
  scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xC0A080, metalness: 0.3 })), 0, 1.1, 0));
  [0x4A7A3A, 0x8B4513, 0xF5DEB3, 0xFFFFE0, 0x654321, 0x4A7A3A].forEach((c, i) => { const a = (i / 6) * Math.PI * 2; scene.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: c })), Math.cos(a) * 0.28, 1.14, Math.sin(a) * 0.28)); });

  // Matzah stack
  for (let i = 0; i < 3; i++) scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 })), -0.6, 1.1 + i * 0.02, 0.3));

  // Candles
  const candles: THREE.Object3D[] = [];
  [[-0.25, 0, -0.55], [0.25, 0, -0.55]].forEach(([cx, , cz]) => {
    scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8 })), cx, 1.24, cz));
    scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xFFF8DC })), cx, 1.47, cz));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), new THREE.MeshBasicMaterial({ color: 0xFFAA33 }));
    f.position.set(cx, 1.62, cz);
    f.userData.isFlame = true;
    scene.add(f); candles.push(f);
    const cl = new THREE.PointLight(0xFFCC66, 1.4, 18, 1.8); cl.position.set(cx, 1.65, cz); cl.castShadow = true;
    cl.userData.isCandleLight = true;
    scene.add(cl); candles.push(cl);
  });

  // Elijah cup
  scene.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0xDAA520, metalness: 0.7, roughness: 0.3 })), 0, 1.18, -0.28));

  // Lighting — warm room fill + table so faces aren’t lost in shadow
  scene.add(new THREE.AmbientLight(0xE8D4C4, 0.52));
  scene.add(new THREE.HemisphereLight(0xC4B4A8, 0x2A2018, 0.45));
  const over = new THREE.PointLight(0xFFF5E6, 1.25, 35, 1.2); over.position.set(0, 7.5, 2); over.castShadow = true; scene.add(over);
  scene.add(place(new THREE.PointLight(0xFFD4A8, 0.55, 22, 1.5), -6, 4.5, 4));
  scene.add(place(new THREE.PointLight(0xFFD4A8, 0.55, 22, 1.5), 6, 4.5, 4));
  scene.add(place(new THREE.PointLight(0xFFE8CC, 0.4, 16, 1.6), 0, 2.8, 5));

  // Characters
  const chars: Record<string, CharMesh> = {};
  const n = DEFAULT_CHARACTERS.length;

  DEFAULT_CHARACTERS.forEach((ch, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * 4.2, z = Math.sin(ang) * 3.2;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.lookAt(0, 1, 0);

    // Chair
    const chMat = new THREE.MeshStandardMaterial({ color: 0x4A3520 });
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.42), chMat), 0, 0.64, 0));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.04), chMat), 0, 0.95, -0.19));
    for (let l = 0; l < 4; l++) g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.64, 6), chMat), l % 2 ? 0.2 : -0.2, 0.32, l < 2 ? -0.17 : 0.17));

    // Body
    const bMat = new THREE.MeshStandardMaterial({ color: ch.color, roughness: 0.7 });
    const baseY = ch.age === 'child' ? 0.9 : 1.04;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(ch.bodyW, ch.bodyW * 0.85, ch.bodyH, 8), bMat);
    body.position.set(0, baseY, 0.04); g.add(body);

    // Head
    const hSize = 0.13 * ch.headS;
    const head = new THREE.Mesh(new THREE.SphereGeometry(hSize, 12, 12), new THREE.MeshStandardMaterial({ color: ch.skin, roughness: 0.6 }));
    const headY = baseY + ch.bodyH / 2 + hSize + 0.02;
    head.position.set(0, headY, 0.04); g.add(head);

    // Hair
    if (ch.hairType === 'long') { const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 1.1, 10, 10), new THREE.MeshStandardMaterial({ color: ch.hair })); h.scale.set(1, 1.3, 1); h.position.set(0, headY - 0.01, 0.02); g.add(h); }
    else if (ch.hairType === 'short') { const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 0.9, 8, 8), new THREE.MeshStandardMaterial({ color: ch.hair })); h.position.set(0, headY + hSize * 0.35, 0.02); h.scale.set(1.1, 0.5, 1); g.add(h); }
    else if (ch.hairType === 'short_curly') { const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 0.95, 8, 8), new THREE.MeshStandardMaterial({ color: ch.hair })); h.position.set(0, headY + hSize * 0.2, 0.02); h.scale.set(1.15, 0.6, 1.1); g.add(h); }
    if (ch.kippah) { const k = new THREE.Mesh(new THREE.SphereGeometry(hSize * 0.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0x1A1A2E })); k.position.set(0, headY + hSize * 0.7, 0); k.scale.set(1, 0.3, 1); g.add(k); }
    if (ch.beard) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: ch.hair })); b.position.set(0, headY - hSize * 0.8, 0.08); b.scale.set(0.8, 1.2, 0.6); g.add(b); }

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.035, 0.03, ch.bodyH * 0.7, 6);
    const lArm = new THREE.Mesh(armGeo, bMat.clone()); lArm.position.set(-ch.bodyW - 0.04, baseY - 0.02, 0.08); lArm.rotation.z = 0.25; g.add(lArm);
    const rArm = new THREE.Mesh(armGeo, bMat.clone()); rArm.position.set(ch.bodyW + 0.04, baseY - 0.02, 0.08); rArm.rotation.z = -0.25; g.add(rArm);

    // Cup + wine + plate
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.5 })), 0.15, 1.1, 0.32));
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.025, 8), new THREE.MeshStandardMaterial({ color: 0x722F37 })), 0.15, 1.12, 0.32));
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.008, 12), new THREE.MeshStandardMaterial({ color: 0xFAF0E6 })), -0.1, 1.07, 0.32));

    scene.add(g);
    chars[ch.id] = { group: g, body, head, lArm, rArm, baseY, headY, standing: false, speaking: false, celebrating: false, drinking: false, phase: Math.random() * 6.28 };
  });

  return { scene, camera, renderer, chars, candles, over, cinematic, reducedMotion };
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SederPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const directorRef = useRef<Director | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animRef = useRef<number>(0);

  const [started, setStarted] = useState(false);
  const [prefs, setPrefs] = useState<SederPrefs>(defaultPrefs);
  const [agentThinking, setAgentThinking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const patchPrefs = useCallback((p: Partial<SederPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      savePrefs(next);
      return next;
    });
  }, []);

  const [phase, setPhase] = useState('');
  const [subtitle, setSubtitle] = useState({ he: '', en: '', speaker: '' as string | null });
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [beatIdx, setBeatIdx] = useState(0);
  const [totalBeats, setTotalBeats] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [audioOn, setAudioOn] = useState(true);
  const [showHe, setShowHe] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [done, setDone] = useState(false);

  // Animation loop for characters
  const animateScene = useCallback((sc: any, clock: THREE.Clock) => {
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      Object.values(sc.chars as Record<string, CharMesh>).forEach((c) => {
        c.body.position.y = c.baseY + Math.sin(t * 1.5 + c.phase) * 0.004;
        c.head.position.y = c.headY + Math.sin(t * 1.5 + c.phase) * 0.004;
        if (c.speaking) { c.head.rotation.y = Math.sin(t * 3) * 0.08; c.rArm.rotation.z = -0.25 + Math.sin(t * 2) * 0.15; c.rArm.rotation.x = Math.sin(t * 1.8) * 0.1; }
        else { c.head.rotation.y *= 0.93; c.rArm.rotation.z += (-0.25 - c.rArm.rotation.z) * 0.05; c.rArm.rotation.x *= 0.93; }
        if (c.standing) { c.body.position.y = c.baseY + 0.32; c.head.position.y = c.headY + 0.32; c.lArm.position.y = c.baseY + 0.3; c.rArm.position.y = c.baseY + 0.3; }
        else { c.lArm.position.y += (c.baseY - 0.02 - c.lArm.position.y) * 0.05; c.rArm.position.y += (c.baseY - 0.02 - c.rArm.position.y) * 0.05; }
        if (c.drinking) { c.rArm.rotation.z = -1.2; c.rArm.rotation.x = -0.3; }
        if (c.celebrating) { c.lArm.rotation.z = 0.25 + Math.sin(t * 4 + c.phase) * 0.5; c.rArm.rotation.z = -0.25 - Math.sin(t * 4 + c.phase + 1) * 0.5; c.lArm.rotation.x = Math.sin(t * 3) * 0.3 - 0.5; c.rArm.rotation.x = Math.sin(t * 3 + 0.5) * 0.3 - 0.5; }
        else if (!c.speaking && !c.drinking) { c.lArm.rotation.z += (0.25 - c.lArm.rotation.z) * 0.05; c.lArm.rotation.x *= 0.93; }
      });

      sc.candles.forEach((obj: THREE.Object3D, i: number) => {
        if (obj.userData?.isCandleLight && obj instanceof THREE.PointLight) {
          obj.intensity = 1.25 + Math.sin(t * 8 + i * 0.5) * 0.35;
        } else if (obj.userData?.isFlame && obj instanceof THREE.Mesh) {
          const f = obj as THREE.Mesh;
          f.scale.y = 1 + Math.sin(t * 10 + i) * 0.12;
          f.scale.x = 1 + Math.sin(t * 11 + i) * 0.08;
        }
      });

      const orbit = sc.cinematic !== false && !sc.reducedMotion;
      if (!orbit) {
        sc.camera.position.set(0, 7, 10);
        sc.camera.lookAt(0, 1.2, 0);
      } else {
        const ca = t * 0.05;
        sc.camera.position.x = Math.sin(ca) * 8.5;
        sc.camera.position.z = 6.2 + Math.cos(ca) * 3.6;
        sc.camera.position.y = 5.2 + Math.sin(t * 0.07) * 1.2;
        sc.camera.lookAt(0, 1.15, 0);
      }
      sc.renderer.render(sc.scene, sc.camera);
    };
    loop();
  }, []);

  const startSeder = async () => {
    setStarted(true);
    const script = buildScript(prefs.tradition);
    setTotalBeats(script.length);

    await new Promise(r => setTimeout(r, 400));

    // Init audio
    const audio = new AudioEngine();
    await audio.init();
    audio.speakLang = prefs.speakLang;
    audio.enabled = audioOn;

    // Init dialogue engine — agent activity lights up the “thinking” UI
    const dialogue = new DialogueEngine((active) => setAgentThinking(active));
    await dialogue.loadProfiles(DEFAULT_CHARACTERS.map(c => c.id));

    // Init 3D
    clockRef.current = new THREE.Clock();
    const sc = buildSederScene(canvasRef.current!, {
      cinematic: prefs.cinematicCamera,
      reducedMotion: prefs.reducedMotion,
    });
    sceneRef.current = sc;
    animateScene(sc, clockRef.current);

    // Resize handler
    const onResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
      sc.camera.aspect = w / h; sc.camera.updateProjectionMatrix(); sc.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Create and start director
    const director = new Director(script, audio, dialogue, {
      onPhase: setPhase,
      onSubtitle: (d) => setSubtitle(d),
      onSpeaker: setSpeaker,
      onBeatIndex: setBeatIdx,
      onFinished: () => setDone(true),
      onDoor: () => { if (sc.over) { sc.over.intensity = 0.15; setTimeout(() => { if (sc.over) sc.over.intensity = 0.6; }, 5000); } },
      onAnimate: (spk, action) => {
        const apply = (cid: string) => {
          const c = sc.chars[cid]; if (!c) return;
          switch (action) {
            case 'speak': case 'mumble': c.speaking = true; break;
            case 'stand': c.standing = true; break;
            case 'sit': c.standing = false; break;
            case 'drink': c.drinking = true; setTimeout(() => { c.drinking = false; }, 2500); break;
            case 'eat': case 'eat_meal': case 'break_matzah': c.speaking = true; break;
            case 'sing': c.speaking = true; c.celebrating = true; break;
            case 'celebrate': c.celebrating = true; break;
            case 'spill': c.speaking = true; break;
          }
        };
        if (spk === 'all') Object.keys(sc.chars).forEach(apply);
        else if (spk) apply(spk);
      },
      onResetCharacter: (spk) => {
        if (spk === 'all') Object.values(sc.chars).forEach((c: CharMesh) => { c.speaking = false; c.celebrating = false; c.drinking = false; });
        else { const c = sc.chars[spk]; if (c) { c.speaking = false; c.celebrating = false; c.drinking = false; } }
      },
    }, prefs.useAI);

    directorRef.current = director;
    director.run();
  };

  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc || !('cinematic' in sc)) return;
    sc.cinematic = prefs.cinematicCamera;
    sc.reducedMotion = prefs.reducedMotion;
  }, [prefs.cinematicCamera, prefs.reducedMotion, started]);

  // Sync pause/speed to director
  useEffect(() => { if (directorRef.current) directorRef.current.setPaused(paused); }, [paused]);
  useEffect(() => { if (directorRef.current) directorRef.current.speed = speed; }, [speed]);

  const speakerName = speaker === 'all' ? 'Everyone' : charMap[speaker || '']?.name || '';
  const speakerRole = speaker === 'all' ? '' : charMap[speaker || '']?.role || '';
  const subFonts = subtitleFontPx(prefs.subtitleScale);

  // ── SPLASH SCREEN ──
  if (!started) return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 32px' }}>
      <div className="seder-magical-bg" aria-hidden />
      <div className="seder-ember-layer" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="seder-ember"
            style={{
              left: `${5 + (i * 5.7) % 88}%`,
              animationDelay: `${i * 0.55}s`,
              animationDuration: `${11 + (i % 6)}s`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', animation: 'fadeIn 1.2s ease', maxWidth: 480, width: '100%' }}>
        <div style={{ fontSize: 'clamp(40px,11vw,56px)', marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 28, filter: 'drop-shadow(0 0 20px rgba(232,197,106,0.25))' }}>
          <span style={{ animation: 'seder-float 3s ease-in-out infinite' }}>🕯️</span>
          <span style={{ animation: 'seder-float 3s ease-in-out infinite 0.5s' }}>✡️</span>
          <span style={{ animation: 'seder-float 3s ease-in-out infinite 1s' }}>🕯️</span>
        </div>
        <p style={{ color: 'var(--seder-gold-dim)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase' as const, marginBottom: 12, fontFamily: 'var(--font-body)' }}>
          Autonomous · AI · 3D
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          color: '#FAF0E6',
          fontSize: 'clamp(2.4rem, 8vw, 3.4rem)',
          fontWeight: 500,
          margin: 0,
          lineHeight: 1.05,
          textShadow: '0 0 80px rgba(232,197,106,0.2)',
        }}>
          The Agentic Seder
        </h1>
        <div style={{ color: 'var(--seder-gold)', fontSize: 'clamp(1.5rem,5vw,2rem)', margin: '12px 0 20px', fontWeight: 300, letterSpacing: '0.02em' }}>הַסֵּדֶר</div>
        <p style={{ color: '#a09080', fontSize: 15, lineHeight: 1.75, margin: '0 auto 28px', maxWidth: 420 }}>
          Twelve souls around one table — liturgy, song, and <strong style={{ color: '#c9a86c' }}>living dialogue</strong> shaped by your character profiles. Press play and let the night unfold.
        </p>

        <div className="seder-glass-panel" style={{ padding: '22px 20px 24px', marginBottom: 22, textAlign: 'left' }}>
          <div style={{ color: 'var(--seder-gold)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Tradition</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {(['ashkenazi', 'sephardi'] as const).map(t => (
              <button
                key={t}
                type="button"
                className="seder-setting-chip"
                data-active={prefs.tradition === t}
                onClick={() => patchPrefs({ tradition: t })}
              >
                {t === 'ashkenazi' ? 'Ashkenazi' : 'Sephardi'}
              </button>
            ))}
          </div>
          <div style={{ color: 'var(--seder-gold)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Voice</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {([['en', 'English'], ['he', 'עברית'], ['both', 'Both']] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                className="seder-setting-chip"
                data-active={prefs.speakLang === v}
                onClick={() => patchPrefs({ speakLang: v })}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ color: 'var(--seder-gold)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Agent (dialogue)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18, alignItems: 'center' }}>
            <button
              type="button"
              className="seder-setting-chip"
              data-active={prefs.useAI}
              onClick={() => patchPrefs({ useAI: !prefs.useAI })}
            >
              {prefs.useAI ? '✨ Claude — on' : '📝 Scripted only'}
            </button>
            <span style={{ color: '#6a5a4a', fontSize: 12, marginLeft: 4 }}>Uses profiles in <code style={{ color: '#8a7a6a' }}>public/characters/</code></span>
          </div>
          <div style={{ color: 'var(--seder-gold)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Experience</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="seder-setting-chip"
                data-active={prefs.subtitleScale === s}
                onClick={() => patchPrefs({ subtitleScale: s })}
              >
                Subtitles {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="seder-setting-chip"
              data-active={prefs.cinematicCamera}
              onClick={() => patchPrefs({ cinematicCamera: !prefs.cinematicCamera })}
            >
              Cinematic camera
            </button>
            <button
              type="button"
              className="seder-setting-chip"
              data-active={prefs.reducedMotion}
              onClick={() => patchPrefs({ reducedMotion: !prefs.reducedMotion })}
            >
              Calm motion
            </button>
          </div>
        </div>

        <button type="button" className="seder-btn-primary" onClick={startSeder}>
          Light the candles
        </button>
        <p style={{ color: '#4a3c38', fontSize: 12, marginTop: 22, lineHeight: 1.6 }}>
          Preferences saved in this browser. Open source — edit markdown profiles to match your family.
        </p>
      </div>
    </div>
  );

  // ── MAIN 3D VIEW ──
  return (
    <div className="seder-root" style={{
      width: '100%',
      minHeight: '100vh',
      position: 'relative',
      background: 'var(--seder-bg-deep)',
      overflow: 'hidden',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div className="seder-magical-bg" style={{ opacity: 0.55 }} aria-hidden />
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes subtIn{from{opacity:0}to{opacity:1}}
        .seder-root { min-height:100dvh; }
        .seder-canvas-wrap { width:100%; height:100%; min-height:100dvh; touch-action:none; }
        .seder-subtitle-box { width:92%; max-width:720px; box-shadow: 0 8px 40px rgba(0,0,0,0.45), 0 0 1px rgba(232,197,106,0.2) inset; }
        @media (max-width:640px){
          .seder-phase-pill { font-size:13px !important; padding:5px 12px !important; max-width:92vw; }
          .seder-speaker-box { max-width:46vw; }
          .seder-subtitle-box { width:96% !important; padding:10px 14px !important; }
          .seder-controls { flex-wrap:wrap; padding:10px 8px calc(10px + env(safe-area-inset-bottom)) !important; gap:8px !important; }
          .seder-controls button, .seder-controls select { min-height:44px; min-width:44px; font-size:14px !important; touch-action:manipulation; }
        }
      `}</style>

      <canvas ref={canvasRef} className="seder-canvas-wrap" style={{ display: 'block' }} />

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="seder-glass-panel"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 30,
          width: 46,
          height: 46,
          borderRadius: 12,
          cursor: 'pointer',
          color: 'var(--seder-gold)',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(232,197,106,0.2)',
        }}
        aria-label="Settings"
      >
        ⚙
      </button>

      {/* Phase */}
      {phase && <div className="seder-phase-pill" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,8,18,0.88)', borderRadius: 12, padding: '8px 22px', border: '1px solid rgba(232,197,106,0.15)', zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
        <div style={{ color: 'var(--seder-gold)', fontSize: 15, fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>{phase}</div>
      </div>}

      {/* Speaker + agent */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'min(280px, 46vw)' }}>
        {speaker && (
          <div className="seder-speaker-box seder-glass-panel" style={{ padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ color: '#8fd9a8', fontSize: 9, letterSpacing: '0.15em', fontWeight: 600 }}>SPEAKING</div>
            <div style={{ color: '#E8D5B7', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{speakerName}</div>
            {speakerRole && <div style={{ color: '#8B7355', fontSize: 11, marginTop: 2 }}>{speakerRole}</div>}
          </div>
        )}
        {agentThinking && prefs.useAI && (
          <div className="seder-agent-orb seder-glass-panel" style={{ padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <div>
              <div style={{ color: 'var(--seder-gold)', fontSize: 10, letterSpacing: '0.12em' }}>AGENT</div>
              <div style={{ color: '#b8a090', fontSize: 11 }}>Weaving a line…</div>
            </div>
          </div>
        )}
      </div>

      {/* Subtitles */}
      {(subtitle.he || subtitle.en) && (
        <div className="seder-subtitle-box" style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,6,14,0.92)', borderRadius: 14, padding: '14px 22px', border: '1px solid rgba(232,197,106,0.12)', backdropFilter: 'blur(12px)', zIndex: 10, animation: 'subtIn 0.35s ease' }}>
          {showHe && subtitle.he && <p className="seder-subtitle-he" style={{ color: '#FAF0E6', fontSize: subFonts.he, lineHeight: 1.75, margin: 0, direction: 'rtl', textAlign: 'right', fontWeight: 300, fontFamily: 'var(--font-body)' }}>{subtitle.he}</p>}
          {showEn && subtitle.en && <p className="seder-subtitle-en" style={{ color: showHe ? '#b0a090' : '#FAF0E6', fontSize: showHe ? subFonts.en : subFonts.he, lineHeight: 1.55, margin: showHe ? '8px 0 0' : 0, fontStyle: showHe ? 'italic' as const : 'normal' as const }}>{subtitle.en}</p>}
        </div>
      )}

      {/* Controls */}
      <div className="seder-controls" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(6,4,10,0.97) 28%)', borderTop: '1px solid rgba(232,197,106,0.08)', padding: '10px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => setPaused(p => !p)} style={{ ...bs, background: paused ? '#6b1d2a' : '#1e1610', minWidth: 44, minHeight: 40, color: '#d4c4b0' }}>{paused ? '▶' : '⏸'}</button>
          <select value={speed} onChange={e => setSpeed(+e.target.value)} style={{ background: '#1e1610', color: 'var(--seder-gold-dim)', border: '1px solid rgba(232,197,106,0.2)', borderRadius: 8, padding: '8px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option>
          </select>
        </div>
        <div style={{ flex: 1, margin: '0 8px', minWidth: 0 }}>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, cursor: 'pointer', overflow: 'hidden' }} onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const p = (e.clientX - r.left) / r.width; directorRef.current?.skipTo(Math.floor(p * totalBeats)); }}>
            <div style={{ height: 6, borderRadius: 4, background: 'linear-gradient(90deg, #6b3a5c, var(--seder-gold))', width: `${totalBeats ? (beatIdx / totalBeats) * 100 : 0}%`, transition: 'width 0.35s ease' }} />
          </div>
          <div style={{ color: '#6a5a50', fontSize: 10, textAlign: 'center', marginTop: 4, letterSpacing: '0.06em' }}>{beatIdx + 1} / {totalBeats}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" onClick={() => setShowHe(h => !h)} style={{ ...bs, background: showHe ? '#2a1a10' : '#14100c', color: showHe ? 'var(--seder-gold)' : '#5a4a40', fontSize: 12 }}>עב</button>
          <button type="button" onClick={() => setShowEn(e => !e)} style={{ ...bs, background: showEn ? '#2a1a10' : '#14100c', color: showEn ? 'var(--seder-gold)' : '#5a4a40', fontSize: 12 }}>EN</button>
          <button type="button" onClick={() => setAudioOn(a => !a)} style={{ ...bs, color: audioOn ? 'var(--seder-gold)' : '#5a4a40', minWidth: 40 }}>{audioOn ? '🔊' : '🔇'}</button>
        </div>
      </div>

      {settingsOpen && (
        <div
          role="dialog"
          aria-modal
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,2,8,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setSettingsOpen(false)}
        >
          <div className="seder-glass-panel" style={{ maxWidth: 420, width: '100%', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--seder-gold)', fontSize: 22, fontWeight: 500 }}>Settings</h2>
              <button type="button" onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: '#8a7a70', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ color: '#7a6a60', fontSize: 13, marginBottom: 16 }}>Changes apply live (camera follows on next frame). Profiles: edit markdown in <code style={{ color: '#9a8a80' }}>public/characters/</code>.</p>
            <div style={{ color: 'var(--seder-gold-dim)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8 }}>TRADITION</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['ashkenazi', 'sephardi'] as const).map(t => (
                <button key={t} type="button" className="seder-setting-chip" data-active={prefs.tradition === t} onClick={() => patchPrefs({ tradition: t })}>{t === 'ashkenazi' ? 'Ashkenazi' : 'Sephardi'}</button>
              ))}
            </div>
            <div style={{ color: 'var(--seder-gold-dim)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8 }}>VOICE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['en', 'he', 'both'] as const).map(v => (
                <button key={v} type="button" className="seder-setting-chip" data-active={prefs.speakLang === v} onClick={() => patchPrefs({ speakLang: v })}>{v === 'en' ? 'English' : v === 'he' ? 'עברית' : 'Both'}</button>
              ))}
            </div>
            <div style={{ color: 'var(--seder-gold-dim)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8 }}>AGENT</div>
            <div style={{ marginBottom: 16 }}>
              <button type="button" className="seder-setting-chip" data-active={prefs.useAI} onClick={() => patchPrefs({ useAI: !prefs.useAI })}>{prefs.useAI ? '✨ Claude on' : '📝 Scripted'}</button>
            </div>
            <div style={{ color: 'var(--seder-gold-dim)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8 }}>SUBTITLES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['sm', 'md', 'lg'] as const).map(s => (
                <button key={s} type="button" className="seder-setting-chip" data-active={prefs.subtitleScale === s} onClick={() => patchPrefs({ subtitleScale: s })}>{s.toUpperCase()}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="seder-setting-chip" data-active={prefs.cinematicCamera} onClick={() => patchPrefs({ cinematicCamera: !prefs.cinematicCamera })}>Cinematic camera</button>
              <button type="button" className="seder-setting-chip" data-active={prefs.reducedMotion} onClick={() => patchPrefs({ reducedMotion: !prefs.reducedMotion })}>Calm motion</button>
            </div>
          </div>
        </div>
      )}

      {/* Done */}
      {done && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(40,20,50,0.5) 0%, rgba(4,2,8,0.95) 65%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 1.5s ease' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 'clamp(40px,12vw,64px)', marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(232,197,106,0.3))' }}>🕯️✡️🕯️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--seder-gold)', fontSize: 'clamp(1.5rem,5vw,2rem)', fontWeight: 500, margin: '0 0 8px' }}>לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם</h2>
          <p style={{ color: '#FAF0E6', fontSize: 18, margin: '0 0 8px' }}>Next Year in Jerusalem</p>
          <p style={{ color: '#8B7355', fontSize: 14, margin: '0 0 28px' }}>The Seder is complete. Chag Pesach Sameach!</p>
          <button type="button" className="seder-btn-primary" onClick={() => window.location.reload()}>Again</button>
        </div>
      </div>}
    </div>
  );
}

const bs: React.CSSProperties = { background: '#2A2118', border: '1px solid #3D3428', color: '#8B7355', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: "'Crimson Pro',serif" };
