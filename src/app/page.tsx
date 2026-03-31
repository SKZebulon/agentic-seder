'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { DEFAULT_CHARACTERS, charMap } from '@/data/characters';
import { buildScript } from '@/data/haggadah-script';
import { AudioEngine } from '@/engine/audio';
import { DialogueEngine } from '@/engine/dialogue';
import { Director } from '@/engine/director';

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

function buildSederScene(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x18120E);
  scene.fog = new THREE.FogExp2(0x14100C, 0.018);
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
    f.position.set(cx, 1.62, cz); scene.add(f); candles.push(f);
    const cl = new THREE.PointLight(0xFFCC66, 1.4, 18, 1.8); cl.position.set(cx, 1.65, cz); cl.castShadow = true; scene.add(cl); candles.push(cl);
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

  return { scene, camera, renderer, chars, candles, over };
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
  const [tradition, setTradition] = useState<'ashkenazi' | 'sephardi'>('ashkenazi');
  const [speakLang, setSpeakLang] = useState<'en' | 'he' | 'both'>('en');
  const [useAI, setUseAI] = useState(true);

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

      sc.candles.forEach((c: any, i: number) => {
        if (c.isLight) c.intensity = 0.7 + Math.sin(t * 8 + i) * 0.2;
        else if (c.isMesh) { c.scale.x = 1 + Math.sin(t * 10 + i) * 0.15; c.position.x += Math.sin(t * 7 + i) * 0.0002; }
      });

      const ca = t * 0.06;
      sc.camera.position.x = Math.sin(ca) * 10;
      sc.camera.position.z = 6 + Math.cos(ca) * 4;
      sc.camera.position.y = 5.5 + Math.sin(t * 0.08) * 1.5;
      sc.camera.lookAt(0, 1.2, 0);
      sc.renderer.render(sc.scene, sc.camera);
    };
    loop();
  }, []);

  const startSeder = async () => {
    setStarted(true);
    const script = buildScript(tradition);
    setTotalBeats(script.length);

    await new Promise(r => setTimeout(r, 500));

    // Init audio
    const audio = new AudioEngine();
    await audio.init();
    audio.speakLang = speakLang;
    audio.enabled = audioOn;

    // Init dialogue engine
    const dialogue = new DialogueEngine();
    await dialogue.loadProfiles(DEFAULT_CHARACTERS.map(c => c.id));

    // Init 3D
    clockRef.current = new THREE.Clock();
    const sc = buildSederScene(canvasRef.current!);
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
    }, useAI);

    directorRef.current = director;
    director.run();
  };

  // Sync pause/speed to director
  useEffect(() => { if (directorRef.current) directorRef.current.setPaused(paused); }, [paused]);
  useEffect(() => { if (directorRef.current) directorRef.current.speed = speed; }, [speed]);

  const speakerName = speaker === 'all' ? 'Everyone' : charMap[speaker || '']?.name || '';
  const speakerRole = speaker === 'all' ? '' : charMap[speaker || '']?.role || '';

  // ── SPLASH SCREEN ──
  if (!started) return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 40% 30%,#2A1F14 0%,#0C0906 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}@keyframes flicker{0%,100%{opacity:1}40%{opacity:0.8}}@keyframes glow{0%,100%{text-shadow:0 0 10px #D4A01733}50%{text-shadow:0 0 25px #D4A01766}}`}</style>
      <div style={{ textAlign: 'center', animation: 'fadeIn 2s ease', maxWidth: 520 }}>
        <div style={{ fontSize: 48, marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 32 }}>
          <span style={{ animation: 'flicker 4s infinite' }}>🕯️</span>
          <span style={{ animation: 'flicker 4s infinite 1s' }}>🕯️</span>
        </div>
        <div style={{ color: '#D4A017', fontSize: 11, letterSpacing: 6, textTransform: 'uppercase' as const, marginBottom: 16 }}>A Fully Autonomous 3D AI Experience</div>
        <h1 style={{ color: '#FAF0E6', fontSize: 52, fontWeight: 200, margin: 0, lineHeight: 1, animation: 'glow 4s infinite' }}>The Agentic Seder</h1>
        <div style={{ color: '#8B7355', fontSize: 38, margin: '8px 0 24px' }}>הַסֵּדֶר</div>
        <p style={{ color: '#8B7355', fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 20px' }}>
          12 characters with AI-generated personalities sit around a 3D table and conduct a complete Passover Seder — every blessing, every song, every argument — all on their own.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {(['ashkenazi', 'sephardi'] as const).map(t => (
            <button key={t} onClick={() => setTradition(t)} style={{ background: tradition === t ? '#D4A01733' : '#1A1410', border: `1px solid ${tradition === t ? '#D4A017' : '#3D3428'}`, color: tradition === t ? '#D4A017' : '#8B7355', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontFamily: "'Crimson Pro',serif" }}>
              {t === 'ashkenazi' ? 'Ashkenazi' : 'Sephardi'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ color: '#5A4D3C', fontSize: 12, alignSelf: 'center' }}>Voice:</span>
          {([['en', 'English'], ['he', 'עברית'], ['both', 'Both']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setSpeakLang(v as any)} style={{ background: speakLang === v ? '#3A2A10' : '#1A1410', border: `1px solid ${speakLang === v ? '#D4A017' : '#3D3428'}`, color: speakLang === v ? '#D4A017' : '#5A4D3C', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setUseAI(!useAI)} style={{ background: useAI ? '#2D5A2733' : '#1A1410', border: `1px solid ${useAI ? '#7EC87E' : '#3D3428'}`, color: useAI ? '#7EC87E' : '#5A4D3C', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}>
            {useAI ? '🤖 AI Dialogue ON' : '📝 Fallback Dialogue'}
          </button>
        </div>

        <button onClick={startSeder} style={{ background: 'linear-gradient(135deg,#8B1A1A,#4A0A0A)', color: '#FAF0E6', border: '1px solid #A0282844', borderRadius: 14, padding: '18px 56px', fontSize: 20, fontFamily: "'Crimson Pro',serif", fontWeight: 300, cursor: 'pointer', letterSpacing: 1, boxShadow: '0 6px 40px rgba(139,26,26,0.35)', transition: 'transform 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.06)')} onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}>
          Light the Candles
        </button>
        <div style={{ color: '#3D3428', fontSize: 11, marginTop: 20 }}>12 characters · AI dialogue · Hebrew + English audio · Open Source</div>
      </div>
    </div>
  );

  // ── MAIN 3D VIEW ──
  return (
    <div className="seder-root" style={{
      width: '100%',
      minHeight: '100vh',
      position: 'relative',
      background: '#0C0906',
      overflow: 'hidden',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes subtIn{from{opacity:0}to{opacity:1}}
        .seder-root { min-height:100dvh; }
        .seder-canvas-wrap { width:100%; height:100%; min-height:100dvh; touch-action:none; }
        .seder-subtitle-box { width:92%; max-width:700px; }
        @media (max-width:640px){
          .seder-phase-pill { font-size:13px !important; padding:5px 12px !important; max-width:92vw; }
          .seder-speaker-box { max-width:42vw; }
          .seder-subtitle-box { width:96% !important; padding:10px 14px !important; }
          .seder-subtitle-he { font-size:15px !important; }
          .seder-subtitle-en { font-size:12px !important; }
          .seder-controls { flex-wrap:wrap; padding:10px 8px calc(10px + env(safe-area-inset-bottom)) !important; gap:8px !important; }
          .seder-controls button, .seder-controls select { min-height:44px; min-width:44px; font-size:14px !important; touch-action:manipulation; }
        }
      `}</style>

      <canvas ref={canvasRef} className="seder-canvas-wrap" style={{ display: 'block' }} />

      {/* Phase */}
      {phase && <div className="seder-phase-pill" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,9,6,0.85)', borderRadius: 10, padding: '6px 20px', border: '1px solid #3D342844', zIndex: 10 }}>
        <div style={{ color: '#D4A017', fontSize: 16, fontWeight: 600, textAlign: 'center', letterSpacing: 1 }}>{phase}</div>
      </div>}

      {/* Speaker */}
      {speaker && <div className="seder-speaker-box" style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(12,9,6,0.8)', borderRadius: 8, padding: '5px 12px', border: '1px solid #3D342844', zIndex: 10 }}>
        <div style={{ color: '#7EC87E', fontSize: 10, letterSpacing: 1 }}>SPEAKING</div>
        <div style={{ color: '#E8D5B7', fontSize: 14, fontWeight: 600 }}>{speakerName}</div>
        {speakerRole && <div style={{ color: '#8B7355', fontSize: 10 }}>{speakerRole}</div>}
      </div>}

      {/* Subtitles */}
      {(subtitle.he || subtitle.en) && (
        <div className="seder-subtitle-box" style={{ position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,6,4,0.9)', borderRadius: 12, padding: '12px 20px', border: '1px solid #3D342822', backdropFilter: 'blur(8px)', zIndex: 10, animation: 'subtIn 0.3s ease' }}>
          {showHe && subtitle.he && <p className="seder-subtitle-he" style={{ color: '#FAF0E6', fontSize: 17, lineHeight: 1.7, margin: 0, direction: 'rtl', textAlign: 'right', fontWeight: 300 }}>{subtitle.he}</p>}
          {showEn && subtitle.en && <p className="seder-subtitle-en" style={{ color: showHe ? '#B8A88A' : '#FAF0E6', fontSize: showHe ? 13 : 16, lineHeight: 1.5, margin: showHe ? '6px 0 0' : 0, fontStyle: showHe ? 'italic' as const : 'normal' as const }}>{subtitle.en}</p>}
        </div>
      )}

      {/* Controls */}
      <div className="seder-controls" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(8,6,4,0.92)', borderTop: '1px solid #1A1410', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setPaused(p => !p)} style={{ ...bs, background: paused ? '#8B1A1A' : '#2A2118', minWidth: 36 }}>{paused ? '▶' : '⏸'}</button>
          <select value={speed} onChange={e => setSpeed(+e.target.value)} style={{ background: '#2A2118', color: '#8B7355', border: '1px solid #3D3428', borderRadius: 6, padding: '4px 6px', fontSize: 11, cursor: 'pointer' }}>
            <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option>
          </select>
        </div>
        <div style={{ flex: 1, margin: '0 8px' }}>
          <div style={{ height: 4, background: '#1A1410', borderRadius: 2, cursor: 'pointer' }} onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const p = (e.clientX - r.left) / r.width; directorRef.current?.skipTo(Math.floor(p * totalBeats)); }}>
            <div style={{ height: 4, borderRadius: 2, background: '#D4A017', width: `${totalBeats ? (beatIdx / totalBeats) * 100 : 0}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ color: '#5A4D3C', fontSize: 9, textAlign: 'center', marginTop: 2 }}>{beatIdx + 1}/{totalBeats}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setShowHe(h => !h)} style={{ ...bs, background: showHe ? '#3A2A10' : '#1A1410', color: showHe ? '#D4A017' : '#5A4D3C', fontSize: 11 }}>עב</button>
          <button onClick={() => setShowEn(e => !e)} style={{ ...bs, background: showEn ? '#3A2A10' : '#1A1410', color: showEn ? '#D4A017' : '#5A4D3C', fontSize: 11 }}>EN</button>
          <button onClick={() => setAudioOn(a => !a)} style={{ ...bs, color: audioOn ? '#D4A017' : '#5A4D3C' }}>{audioOn ? '🔊' : '🔇'}</button>
        </div>
      </div>

      {/* Done */}
      {done && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 2s ease' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🕯️✡️🕯️</div>
          <h2 style={{ color: '#D4A017', fontSize: 32, fontWeight: 200, margin: '0 0 6px' }}>לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם</h2>
          <p style={{ color: '#FAF0E6', fontSize: 18, margin: '0 0 6px' }}>Next Year in Jerusalem</p>
          <p style={{ color: '#8B7355', fontSize: 14, margin: '0 0 24px' }}>The Seder is complete. Chag Pesach Sameach!</p>
          <button onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#8B1A1A,#4A0A0A)', color: '#FAF0E6', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, cursor: 'pointer', fontFamily: "'Crimson Pro',serif" }}>Watch Again</button>
        </div>
      </div>}
    </div>
  );
}

const bs: React.CSSProperties = { background: '#2A2118', border: '1px solid #3D3428', color: '#8B7355', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: "'Crimson Pro',serif" };
