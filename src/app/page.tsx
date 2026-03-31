'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { DEFAULT_CHARACTERS, charMap } from '@/data/characters';
import { buildScript } from '@/data/haggadah-script';
import { AudioEngine } from '@/engine/audio';
import { DialogueEngine } from '@/engine/dialogue';
import { Director } from '@/engine/director';
import { buildCharacter, buildChair, BuiltCharacter } from '@/components/CharacterBuilder';

// ═══════════════════════════════════════════════════════════════
// 3D SCENE — COMPLETELY REBUILT
// Rectangular table, characters in chairs AROUND the table,
// proper room, visible food, warm lighting
// ═══════════════════════════════════════════════════════════════

interface CharMesh {
  built: BuiltCharacter;
  group: THREE.Group;
  standing: boolean;
  speaking: boolean;
  celebrating: boolean;
  drinking: boolean;
  phase: number;
}

function buildScene(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100D08);

  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 6, 9);
  camera.lookAt(0, 0.8, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  // ── ROOM ──
  // Floor — warm wood
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2A1E10, roughness: 0.85 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1E180F, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
  backWall.position.set(0, 3, -6); scene.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
  leftWall.position.set(-8, 3, -0); leftWall.rotation.y = Math.PI / 2; scene.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
  rightWall.position.set(8, 3, 0); rightWall.rotation.y = -Math.PI / 2; scene.add(rightWall);

  // ── TABLE — Long rectangle, like a real dining table ──
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x4A3018, roughness: 0.6, metalness: 0.05 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 2.8), tableMat);
  tableTop.position.set(0, 0.75, 0); tableTop.castShadow = true; tableTop.receiveShadow = true; scene.add(tableTop);

  // Table legs
  for (const [lx, lz] of [[-2.5, -1.2], [2.5, -1.2], [-2.5, 1.2], [2.5, 1.2]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), tableMat);
    leg.position.set(lx, 0.375, lz); leg.castShadow = true; scene.add(leg);
  }

  // ── TABLECLOTH — white cloth draped over the table ──
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E0, roughness: 0.8 });
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.02, 3.0), clothMat);
  cloth.position.set(0, 0.81, 0); scene.add(cloth);

  // ── TABLE ITEMS ──
  // Seder plate — center
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xC0A070, metalness: 0.3, roughness: 0.5 });
  const sederPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 20), plateMat);
  sederPlate.position.set(0, 0.84, 0); scene.add(sederPlate);

  // Items on seder plate
  const itemCols = [0x4A7A3A, 0x8B4513, 0xF5DEB3, 0xFFE4B5, 0x654321, 0x4A7A3A];
  itemCols.forEach((c, i) => {
    const a = (i / 6) * Math.PI * 2;
    const item = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({ color: c }));
    item.position.set(Math.cos(a) * 0.25, 0.88, Math.sin(a) * 0.25); scene.add(item);
  });

  // Matzah stack — to the left of plate
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.35), new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 }));
    m.position.set(-0.7, 0.84 + i * 0.018, 0); scene.add(m);
  }

  // Matzah cover (cloth over matzah)
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.005, 0.4), new THREE.MeshStandardMaterial({ color: 0xE8E0D0 }));
  cover.position.set(-0.7, 0.90, 0); scene.add(cover);

  // Candles in candlesticks — right side
  for (const cx of [-0.15, 0.15]) {
    // Candlestick base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 }));
    base.position.set(0.7 + cx, 0.84, -0.3); scene.add(base);
    // Candlestick stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8 }));
    stem.position.set(0.7 + cx, 0.97, -0.3); scene.add(stem);
    // Candle
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xFFF8DC }));
    candle.position.set(0.7 + cx, 1.17, -0.3); scene.add(candle);
    // Flame
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 6), new THREE.MeshBasicMaterial({ color: 0xFFAA33 }));
    flame.position.set(0.7 + cx, 1.30, -0.3); scene.add(flame);
  }

  // Candle lights
  const candleLight1 = new THREE.PointLight(0xFFAA33, 1.2, 6);
  candleLight1.position.set(0.55, 1.4, -0.3); candleLight1.castShadow = true; scene.add(candleLight1);
  const candleLight2 = new THREE.PointLight(0xFFAA33, 1.2, 6);
  candleLight2.position.set(0.85, 1.4, -0.3); candleLight2.castShadow = true; scene.add(candleLight2);

  // Elijah's cup — gold, center-back of table
  const elijahCup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xDAA520, metalness: 0.8, roughness: 0.2 }));
  elijahCup.position.set(0.3, 0.89, -0.6); scene.add(elijahCup);

  // Haggadah books scattered on table
  for (let i = 0; i < 6; i++) {
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: [0x8B1A1A, 0x1A1A8B, 0x2E8B57, 0x8B4513, 0x4A1A6B, 0x1A6B4A][i] }));
    const bx = (i - 2.5) * 0.8 + (Math.random() - 0.5) * 0.3;
    const bz = (i % 2 === 0 ? 0.7 : -0.7) + (Math.random() - 0.5) * 0.2;
    book.position.set(bx, 0.83, bz);
    book.rotation.y = Math.random() * 0.3 - 0.15;
    scene.add(book);
  }

  // ── LIGHTING — warm, candlelit feel ──
  const ambient = new THREE.AmbientLight(0x1A1008, 0.3);
  scene.add(ambient);

  // Overhead warm light (like a chandelier)
  const overhead = new THREE.PointLight(0xFFDDBB, 0.5, 12);
  overhead.position.set(0, 4, 0); overhead.castShadow = true; scene.add(overhead);

  // Warm fill lights
  scene.add(Object.assign(new THREE.PointLight(0xFF9955, 0.2, 8), { position: new THREE.Vector3(-3, 2, -2) }));
  scene.add(Object.assign(new THREE.PointLight(0xFF9955, 0.2, 8), { position: new THREE.Vector3(3, 2, -2) }));

  // ── CHARACTERS — Built with the CharacterBuilder for detailed humanoid figures ──
  const chars: Record<string, CharMesh> = {};

  // Seat positions — 6 per side of the rectangular table, leader at head
  const seatPositions: [number, number, number][] = [];
  seatPositions.push([0, 0, -2.2]); // Head of table (leader)
  for (let i = 0; i < 5; i++) seatPositions.push([-3.2, 0, -1.0 + i * 0.6]); // Left side
  for (let i = 0; i < 5; i++) seatPositions.push([3.2, 0, -1.0 + i * 0.6]);  // Right side
  seatPositions.push([0, 0, 2.2]); // Foot of table

  DEFAULT_CHARACTERS.forEach((ch, i) => {
    const [sx, , sz] = seatPositions[i] || seatPositions[0];

    // Build chair
    const chair = buildChair();
    chair.position.set(sx, 0, sz);
    chair.lookAt(0, 0.8, 0);
    scene.add(chair);

    // Build character using the detailed CharacterBuilder
    const built = buildCharacter(ch);
    built.group.position.set(sx, 0, sz);
    built.group.lookAt(0, 0.8, 0);
    scene.add(built.group);

    // Place setting on the table near this character
    const dirToCenter = new THREE.Vector3(-sx, 0, -sz).normalize();
    const plateX = sx + dirToCenter.x * (Math.abs(sx) > 2 ? 1.5 : 0.8);
    const plateZ = sz + dirToCenter.z * (Math.abs(sz) > 2 ? 0.6 : 0.8);

    // Plate
    scene.add(Object.assign(new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.008, 12),
      new THREE.MeshStandardMaterial({ color: 0xFAF0E6, roughness: 0.7 })
    ), { position: new THREE.Vector3(plateX, 0.83, plateZ) }));

    // Wine cup
    scene.add(Object.assign(new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.018, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.6, roughness: 0.3 })
    ), { position: new THREE.Vector3(plateX + 0.15, 0.87, plateZ) }));

    // Wine in cup
    scene.add(Object.assign(new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.02, 8),
      new THREE.MeshStandardMaterial({ color: 0x722F37 })
    ), { position: new THREE.Vector3(plateX + 0.15, 0.89, plateZ) }));

    chars[ch.id] = {
      built,
      group: built.group,
      standing: false, speaking: false, celebrating: false, drinking: false,
      phase: Math.random() * Math.PI * 2
    };
  });

  return { scene, camera, renderer, chars, candleLight1, candleLight2, overhead };
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function SederPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const dirRef = useRef<Director | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animRef = useRef<number>(0);

  const [started, setStarted] = useState(false);
  const [tradition, setTradition] = useState<'ashkenazi' | 'sephardi'>('ashkenazi');
  const [speakLang, setSpeakLang] = useState<'en' | 'he'>('en');
  const [apiKey, setApiKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');

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

  const startSeder = async () => {
    setStarted(true);
    const script = buildScript(tradition);
    setTotalBeats(script.length);

    await new Promise(r => setTimeout(r, 300));

    const audio = new AudioEngine();
    await audio.init(apiKey ? undefined : undefined); // Web Speech only if no EL key
    // Try ElevenLabs key from env or input
    const elKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || elevenKey;
    if (elKey) {
      await audio.init(elKey);
    } else {
      await audio.init();
    }
    audio.speakLang = speakLang;
    audio.enabled = audioOn;

    const dialogue = new DialogueEngine();
    dialogue.apiKey = apiKey;
    await dialogue.loadProfiles(DEFAULT_CHARACTERS.map(c => c.id));

    clockRef.current = new THREE.Clock();
    const sc = buildScene(canvasRef.current!);
    sceneRef.current = sc;

    // Animation loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const t = clockRef.current!.getElapsedTime();

      Object.values(sc.chars).forEach((c: CharMesh) => {
        const b = c.built;
        // Idle breathing
        const breath = Math.sin(t * 1.5 + c.phase) * 0.003;
        b.body.position.y = b.bodyBaseY + breath;
        b.head.position.y = b.headBaseY + breath;

        // Speaking animation — head moves, arm gestures, mouth opens
        if (c.speaking) {
          b.head.rotation.y = Math.sin(t * 2.5 + c.phase) * 0.12;
          b.head.rotation.x = Math.sin(t * 2) * 0.04;
          b.rArm.rotation.z = -0.25 + Math.sin(t * 1.8) * 0.2;
          b.rArm.rotation.x = -0.2 + Math.sin(t * 1.5) * 0.15;
          // Mouth animation — scale the mouth to simulate talking
          if (b.mouth) {
            b.mouth.scale.y = 1 + Math.abs(Math.sin(t * 8)) * 0.8;
            b.mouth.scale.x = 1 + Math.abs(Math.sin(t * 6)) * 0.3;
          }
          // Eyes look around slightly
          if (b.lEye && b.rEye) {
            const eyeShift = Math.sin(t * 1.2) * 0.003;
            b.lEye.position.x += eyeShift * 0.1;
            b.rEye.position.x += eyeShift * 0.1;
          }
        } else {
          b.head.rotation.y *= 0.92;
          b.head.rotation.x *= 0.92;
          b.rArm.rotation.z += (-0.25 - b.rArm.rotation.z) * 0.06;
          b.rArm.rotation.x += (-0.2 - b.rArm.rotation.x) * 0.06;
          if (b.mouth) {
            b.mouth.scale.y += (1 - b.mouth.scale.y) * 0.1;
            b.mouth.scale.x += (1 - b.mouth.scale.x) * 0.1;
          }
        }

        // Standing
        if (c.standing) {
          const standOff = 0.3;
          b.body.position.y = b.bodyBaseY + standOff;
          b.head.position.y = b.headBaseY + standOff;
          b.lArm.position.y = b.armBaseY + standOff;
          b.rArm.position.y = b.armBaseY + standOff;
        } else {
          b.lArm.position.y += (b.armBaseY - b.lArm.position.y) * 0.06;
          b.rArm.position.y += (b.armBaseY - b.rArm.position.y) * 0.06;
        }

        // Drinking
        if (c.drinking) {
          b.rArm.rotation.z = -1.1;
          b.rArm.rotation.x = -0.5;
        }

        // Celebrating — wave both arms
        if (c.celebrating) {
          b.lArm.rotation.z = 0.25 + Math.sin(t * 4 + c.phase) * 0.6;
          b.rArm.rotation.z = -0.25 - Math.sin(t * 4 + c.phase + 1) * 0.6;
          b.lArm.rotation.x = Math.sin(t * 3) * 0.3 - 0.6;
          b.rArm.rotation.x = Math.sin(t * 3 + 0.5) * 0.3 - 0.6;
        } else if (!c.speaking && !c.drinking) {
          b.lArm.rotation.z += (0.25 - b.lArm.rotation.z) * 0.06;
          b.lArm.rotation.x += (-0.2 - b.lArm.rotation.x) * 0.06;
        }
      });

      // Candle flicker
      sc.candleLight1.intensity = 1.2 + Math.sin(t * 7) * 0.3;
      sc.candleLight2.intensity = 1.2 + Math.sin(t * 8 + 1) * 0.3;

      // Camera — slow orbit with gentle bob
      const ca = t * 0.04;
      const camR = 9;
      sc.camera.position.x = Math.sin(ca) * camR;
      sc.camera.position.z = 3 + Math.cos(ca) * (camR - 3);
      sc.camera.position.y = 4.5 + Math.sin(t * 0.06) * 0.8;
      sc.camera.lookAt(0, 0.9, 0);

      sc.renderer.render(sc.scene, sc.camera);
    };
    animate();

    window.addEventListener('resize', () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
      sc.camera.aspect = w / h; sc.camera.updateProjectionMatrix(); sc.renderer.setSize(w, h);
    });

    const director = new Director(script, audio, dialogue, {
      onPhase: setPhase,
      onSubtitle: setSubtitle,
      onSpeaker: setSpeaker,
      onBeatIndex: setBeatIdx,
      onFinished: () => setDone(true),
      onDoor: () => { sc.overhead.intensity = 0.1; setTimeout(() => sc.overhead.intensity = 0.5, 5000); },
      onAnimate: (spk, action) => {
        const apply = (id: string) => {
          const c = sc.chars[id]; if (!c) return;
          if (action === 'speak' || action === 'mumble') c.speaking = true;
          else if (action === 'stand') c.standing = true;
          else if (action === 'sit') c.standing = false;
          else if (action === 'drink') { c.drinking = true; setTimeout(() => c.drinking = false, 2500); }
          else if (action === 'eat' || action === 'eat_meal' || action === 'break_matzah') c.speaking = true;
          else if (action === 'sing') { c.speaking = true; c.celebrating = true; }
          else if (action === 'celebrate') c.celebrating = true;
          else if (action === 'spill') c.speaking = true;
        };
        if (spk === 'all') Object.keys(sc.chars).forEach(apply);
        else if (spk) apply(spk);
      },
      onResetCharacter: (spk) => {
        const reset = (id: string) => { const c = sc.chars[id]; if (c) { c.speaking = false; c.celebrating = false; c.drinking = false; } };
        if (spk === 'all') Object.keys(sc.chars).forEach(reset);
        else reset(spk);
      },
    }, !!apiKey);

    dirRef.current = director;
    director.run();
  };

  useEffect(() => { if (dirRef.current) dirRef.current.paused = paused; }, [paused]);
  useEffect(() => { if (dirRef.current) dirRef.current.speed = speed; }, [speed]);

  const spkName = speaker === 'all' ? 'Everyone' : charMap[speaker || '']?.name || '';
  const spkRole = speaker === 'all' ? '' : charMap[speaker || '']?.role || '';

  // ── SPLASH ──
  if (!started) return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 40% 30%,#2A1F14 0%,#0C0906 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Crimson Pro',Georgia,serif", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&display=swap');
      @keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
      @keyframes flicker{0%,100%{opacity:1}40%{opacity:0.8}}
      @keyframes glow{0%,100%{text-shadow:0 0 10px #D4A01733}50%{text-shadow:0 0 25px #D4A01766}}
      *{box-sizing:border-box}`}</style>
      <div style={{ textAlign: 'center', animation: 'fadeIn 2s ease', maxWidth: 520 }}>
        <div style={{ fontSize: 48, marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 32 }}>
          <span style={{ animation: 'flicker 4s infinite' }}>🕯️</span>
          <span style={{ animation: 'flicker 4s infinite 1s' }}>🕯️</span>
        </div>
        <div style={{ color: '#D4A017', fontSize: 11, letterSpacing: 6, textTransform: 'uppercase' as const, marginBottom: 12 }}>A Fully Autonomous 3D AI Seder</div>
        <h1 style={{ color: '#FAF0E6', fontSize: 48, fontWeight: 200, margin: 0, animation: 'glow 4s infinite' }}>The Agentic Seder</h1>
        <div style={{ color: '#8B7355', fontSize: 36, margin: '6px 0 20px' }}>הַסֵּדֶר</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
          {(['ashkenazi', 'sephardi'] as const).map(t => (
            <button key={t} onClick={() => setTradition(t)} style={{ background: tradition === t ? '#D4A01733' : '#1A1410', border: `1px solid ${tradition === t ? '#D4A017' : '#3D3428'}`, color: tradition === t ? '#D4A017' : '#8B7355', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: 13, fontFamily: "'Crimson Pro',serif" }}>
              {t === 'ashkenazi' ? 'Ashkenazi' : 'Sephardi'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          {([['en', 'English'], ['he', 'עברית']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setSpeakLang(v as any)} style={{ background: speakLang === v ? '#3A2A10' : '#1A1410', border: `1px solid ${speakLang === v ? '#D4A017' : '#3D3428'}`, color: speakLang === v ? '#D4A017' : '#5A4D3C', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>{l}</button>
          ))}
        </div>

        {/* API Keys */}
        <div style={{ marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
          <input
            type="password"
            placeholder="Claude API key (enables AI dialogue)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ width: '100%', background: '#1A1410', border: '1px solid #3D3428', borderRadius: 8, padding: '8px 14px', color: '#8B7355', fontSize: 12, outline: 'none', textAlign: 'center', fontFamily: 'monospace', marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="ElevenLabs API key (enables natural voices)"
            value={elevenKey}
            onChange={e => setElevenKey(e.target.value)}
            style={{ width: '100%', background: '#1A1410', border: '1px solid #3D3428', borderRadius: 8, padding: '8px 14px', color: '#8B7355', fontSize: 12, outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
          />
          <div style={{ color: '#3D3428', fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>
            {apiKey ? '🟢 AI dialogue' : '⚪ Fallback dialogue'} · {elevenKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? '🟢 Natural voices (ElevenLabs)' : '⚪ Browser voices'}
          </div>
        </div>

        <button onClick={startSeder} style={{ background: 'linear-gradient(135deg,#8B1A1A,#4A0A0A)', color: '#FAF0E6', border: '1px solid #A0282844', borderRadius: 14, padding: '16px 52px', fontSize: 20, fontFamily: "'Crimson Pro',serif", fontWeight: 300, cursor: 'pointer', boxShadow: '0 6px 40px rgba(139,26,26,0.35)', transition: 'transform 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}>
          Light the Candles
        </button>
        <div style={{ color: '#3D3428', fontSize: 10, marginTop: 16 }}>12 characters · Full Haggadah · Spoken audio · Open Source</div>
      </div>
    </div>
  );

  // ── MAIN ──
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0C0906', overflow: 'hidden', fontFamily: "'Crimson Pro',Georgia,serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&display=swap');
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes subtIn{from{opacity:0}to{opacity:1}}*{box-sizing:border-box}`}</style>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {phase && <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,8,5,0.88)', borderRadius: 10, padding: '6px 20px', border: '1px solid #D4A01722', zIndex: 10 }}>
        <div style={{ color: '#D4A017', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>{phase}</div>
      </div>}

      {speaker && <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(10,8,5,0.85)', borderRadius: 8, padding: '5px 12px', border: '1px solid #3D342833', zIndex: 10 }}>
        <div style={{ color: '#7EC87E', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>Speaking</div>
        <div style={{ color: '#E8D5B7', fontSize: 14, fontWeight: 600 }}>{spkName}</div>
        {spkRole && <div style={{ color: '#8B7355', fontSize: 10 }}>{spkRole}</div>}
      </div>}

      {(subtitle.he || subtitle.en) && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 680, background: 'rgba(6,5,3,0.92)', borderRadius: 12, padding: '12px 20px', border: '1px solid #3D342816', backdropFilter: 'blur(10px)', zIndex: 10, animation: 'subtIn 0.25s ease' }}>
          {showHe && subtitle.he && <p style={{ color: '#FAF0E6', fontSize: 16, lineHeight: 1.7, margin: 0, direction: 'rtl', textAlign: 'right', fontWeight: 300 }}>{subtitle.he}</p>}
          {showEn && subtitle.en && <p style={{ color: showHe && subtitle.he ? '#B8A88A' : '#FAF0E6', fontSize: showHe && subtitle.he ? 13 : 15, lineHeight: 1.5, margin: showHe && subtitle.he ? '6px 0 0' : 0, fontStyle: showHe && subtitle.he ? 'italic' as const : 'normal' as const }}>{subtitle.en}</p>}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(6,5,3,0.93)', borderTop: '1px solid #1A1410', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, gap: 6 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <button onClick={() => setPaused(p => !p)} style={{ ...bs, background: paused ? '#8B1A1A' : '#2A2118', minWidth: 34 }}>{paused ? '▶' : '⏸'}</button>
          <select value={speed} onChange={e => setSpeed(+e.target.value)} style={{ background: '#2A2118', color: '#8B7355', border: '1px solid #3D3428', borderRadius: 5, padding: '3px 5px', fontSize: 10, cursor: 'pointer' }}>
            <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option>
          </select>
        </div>
        <div style={{ flex: 1, margin: '0 8px' }}>
          <div style={{ height: 3, background: '#1A1410', borderRadius: 2, cursor: 'pointer' }} onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); dirRef.current?.skipTo(Math.floor(((e.clientX - r.left) / r.width) * totalBeats)); }}>
            <div style={{ height: 3, borderRadius: 2, background: '#D4A017', width: `${totalBeats ? (beatIdx / totalBeats) * 100 : 0}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ color: '#5A4D3C', fontSize: 8, textAlign: 'center', marginTop: 2 }}>{beatIdx + 1}/{totalBeats}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setShowHe(h => !h)} style={{ ...bs, background: showHe ? '#3A2A10' : '#1A1410', color: showHe ? '#D4A017' : '#5A4D3C', fontSize: 10 }}>עב</button>
          <button onClick={() => setShowEn(e => !e)} style={{ ...bs, background: showEn ? '#3A2A10' : '#1A1410', color: showEn ? '#D4A017' : '#5A4D3C', fontSize: 10 }}>EN</button>
          <button onClick={() => setAudioOn(a => !a)} style={{ ...bs, color: audioOn ? '#D4A017' : '#5A4D3C' }}>{audioOn ? '🔊' : '🔇'}</button>
        </div>
      </div>

      {done && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 2s ease' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🕯️✡️🕯️</div>
          <h2 style={{ color: '#D4A017', fontSize: 30, fontWeight: 200, margin: '0 0 6px' }}>לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם</h2>
          <p style={{ color: '#FAF0E6', fontSize: 17 }}>Next Year in Jerusalem</p>
          <p style={{ color: '#8B7355', fontSize: 13, margin: '4px 0 20px' }}>Chag Pesach Sameach!</p>
          <button onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#8B1A1A,#4A0A0A)', color: '#FAF0E6', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 15, cursor: 'pointer', fontFamily: "'Crimson Pro',serif" }}>Watch Again</button>
        </div>
      </div>}
    </div>
  );
}

const bs: React.CSSProperties = { background: '#2A2118', border: '1px solid #3D3428', color: '#8B7355', borderRadius: 5, padding: '4px 9px', cursor: 'pointer', fontSize: 12, fontFamily: "'Crimson Pro',serif" };
