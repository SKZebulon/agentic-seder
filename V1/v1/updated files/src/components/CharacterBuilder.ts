// Character Builder — Stylized humanoid 3D characters
// Creates charming, detailed figures with faces, hair, clothing, hands
// Proportions vary by age/gender for visual distinction

import * as THREE from 'three';

interface CharDef {
  gender: 'M' | 'F';
  age: 'child' | 'teen' | 'young' | 'adult' | 'elder';
  color: number;    // clothing
  skin: number;
  hair: number;
  hairType: string;
  kippah?: boolean;
  beard?: boolean;
  bodyW: number;
  bodyH: number;
  headS: number;
}

// Smooth skin material
const skinMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.02 });
const clothMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.0 });
const hairMaterial = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 });

// Scale factors by age
const SCALE: Record<string, { bodyScale: number; headRatio: number; shoulderW: number; legLen: number }> = {
  child:  { bodyScale: 0.6, headRatio: 1.35, shoulderW: 0.7, legLen: 0.55 },
  teen:   { bodyScale: 0.82, headRatio: 1.12, shoulderW: 0.85, legLen: 0.8 },
  young:  { bodyScale: 1.0, headRatio: 1.0, shoulderW: 1.0, legLen: 1.0 },
  adult:  { bodyScale: 1.0, headRatio: 1.0, shoulderW: 1.05, legLen: 1.0 },
  elder:  { bodyScale: 0.92, headRatio: 1.0, shoulderW: 0.95, legLen: 0.92 },
};

export interface BuiltCharacter {
  group: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  lArm: THREE.Group;
  rArm: THREE.Group;
  lHand: THREE.Mesh;
  rHand: THREE.Mesh;
  mouth: THREE.Mesh;
  lEye: THREE.Mesh;
  rEye: THREE.Mesh;
  // Animation bases
  seatY: number;
  headBaseY: number;
  bodyBaseY: number;
  armBaseY: number;
}

export function buildCharacter(ch: CharDef): BuiltCharacter {
  const s = SCALE[ch.age] || SCALE.adult;
  const isFemale = ch.gender === 'F';
  const isChild = ch.age === 'child';
  const isElder = ch.age === 'elder';

  const group = new THREE.Group();
  const seatY = 0.47;

  // ═══ BODY / TORSO ═══
  // Use a rounded shape — capsule-like by combining cylinder + spheres
  const bodyGroup = new THREE.Group();
  const torsoH = 0.28 * s.bodyScale;
  const torsoW = (isFemale ? 0.11 : 0.13) * s.shoulderW;
  const torsoD = isFemale ? 0.08 : 0.09;

  // Main torso — rounded box feel using a cylinder with high segments
  const torsoGeo = new THREE.CylinderGeometry(
    torsoW * (isFemale ? 0.85 : 1.0),  // top (shoulders)
    torsoW * (isFemale ? 1.1 : 0.95),   // bottom (waist/hips)
    torsoH, 12, 1
  );
  const torso = new THREE.Mesh(torsoGeo, clothMat(ch.color));
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Shoulders — rounded caps
  const shoulderGeo = new THREE.SphereGeometry(torsoW * 0.65, 10, 10);
  const lShoulder = new THREE.Mesh(shoulderGeo, clothMat(ch.color));
  lShoulder.position.set(-torsoW * 0.85, torsoH * 0.4, 0);
  lShoulder.scale.set(1, 0.6, 0.8);
  bodyGroup.add(lShoulder);
  const rShoulder = new THREE.Mesh(shoulderGeo, clothMat(ch.color));
  rShoulder.position.set(torsoW * 0.85, torsoH * 0.4, 0);
  rShoulder.scale.set(1, 0.6, 0.8);
  bodyGroup.add(rShoulder);

  // Collar / neckline detail
  const collarGeo = new THREE.TorusGeometry(torsoW * 0.55, 0.012, 8, 16, Math.PI);
  const collar = new THREE.Mesh(collarGeo, clothMat(
    isElder ? 0xE8E0D0 : // white collar for elder/rabbi
    isFemale ? adjustColor(ch.color, 1.2) : adjustColor(ch.color, 0.8)
  ));
  collar.position.set(0, torsoH * 0.48, 0.04);
  collar.rotation.x = Math.PI * 0.6;
  bodyGroup.add(collar);

  const bodyBaseY = seatY + torsoH / 2 + 0.02;
  bodyGroup.position.set(0, bodyBaseY, 0.02);
  group.add(bodyGroup);

  // ═══ NECK ═══
  const neckGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.05, 8);
  const neck = new THREE.Mesh(neckGeo, skinMat(ch.skin));
  neck.position.set(0, bodyBaseY + torsoH / 2 + 0.025, 0.02);
  group.add(neck);

  // ═══ HEAD ═══
  const headGroup = new THREE.Group();
  const headR = 0.095 * s.headRatio * ch.headS;
  const headBaseY = bodyBaseY + torsoH / 2 + 0.05 + headR;

  // Head — slightly oval, not a perfect sphere
  const headGeo = new THREE.SphereGeometry(headR, 20, 20);
  const headMesh = new THREE.Mesh(headGeo, skinMat(ch.skin));
  headMesh.scale.set(1, 1.08, 0.95); // slightly tall, slightly flat front-back
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // ═══ FACE ═══
  // Eyes — white with dark iris
  const eyeWhiteGeo = new THREE.SphereGeometry(headR * 0.18, 10, 10);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.3 });
  const eyeSpacing = headR * 0.38;
  const eyeY = headR * 0.12;
  const eyeZ = headR * 0.82;

  const lEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  lEyeWhite.position.set(-eyeSpacing, eyeY, eyeZ);
  lEyeWhite.scale.set(1, 1.1, 0.5);
  headGroup.add(lEyeWhite);
  const rEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rEyeWhite.position.set(eyeSpacing, eyeY, eyeZ);
  rEyeWhite.scale.set(1, 1.1, 0.5);
  headGroup.add(rEyeWhite);

  // Irises
  const irisGeo = new THREE.SphereGeometry(headR * 0.1, 8, 8);
  const irisMat = new THREE.MeshStandardMaterial({ color: isChild ? 0x4A3520 : 0x2A1A0A, roughness: 0.2 });
  const lEye = new THREE.Mesh(irisGeo, irisMat);
  lEye.position.set(-eyeSpacing, eyeY, eyeZ + headR * 0.08);
  lEye.scale.set(0.9, 1.0, 0.5);
  headGroup.add(lEye);
  const rEye = new THREE.Mesh(irisGeo, irisMat);
  rEye.position.set(eyeSpacing, eyeY, eyeZ + headR * 0.08);
  rEye.scale.set(0.9, 1.0, 0.5);
  headGroup.add(rEye);

  // Eyebrows (subtle arches)
  const browGeo = new THREE.CylinderGeometry(0.002, 0.002, headR * 0.35, 4);
  const browMat = new THREE.MeshStandardMaterial({ color: adjustColor(ch.hair, 0.7) });
  const lBrow = new THREE.Mesh(browGeo, browMat);
  lBrow.position.set(-eyeSpacing, eyeY + headR * 0.22, eyeZ);
  lBrow.rotation.z = Math.PI / 2 + 0.15; lBrow.rotation.x = -0.2;
  headGroup.add(lBrow);
  const rBrow = new THREE.Mesh(browGeo, browMat);
  rBrow.position.set(eyeSpacing, eyeY + headR * 0.22, eyeZ);
  rBrow.rotation.z = Math.PI / 2 - 0.15; rBrow.rotation.x = -0.2;
  headGroup.add(rBrow);

  // Nose — small rounded bump
  const noseGeo = new THREE.SphereGeometry(headR * 0.1, 8, 8);
  const nose = new THREE.Mesh(noseGeo, skinMat(adjustColor(ch.skin, 0.97)));
  nose.position.set(0, eyeY - headR * 0.12, eyeZ + headR * 0.1);
  nose.scale.set(0.7, 0.8, 0.6);
  headGroup.add(nose);

  // Mouth — slightly curved line
  const mouthGeo = new THREE.TorusGeometry(headR * 0.15, 0.008, 6, 12, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x994444, roughness: 0.5 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, eyeY - headR * 0.35, eyeZ + headR * 0.02);
  mouth.rotation.x = Math.PI * 0.1;
  mouth.rotation.z = Math.PI; // flip so it smiles
  headGroup.add(mouth);

  // Ears
  const earGeo = new THREE.SphereGeometry(headR * 0.15, 8, 8);
  const earMat = skinMat(ch.skin);
  const lEar = new THREE.Mesh(earGeo, earMat);
  lEar.position.set(-headR * 0.92, eyeY, 0);
  lEar.scale.set(0.4, 0.7, 0.5);
  headGroup.add(lEar);
  const rEar = new THREE.Mesh(earGeo, earMat);
  rEar.position.set(headR * 0.92, eyeY, 0);
  rEar.scale.set(0.4, 0.7, 0.5);
  headGroup.add(rEar);

  // ═══ HAIR ═══
  const hMat = hairMaterial(ch.hair);

  if (ch.hairType === 'long') {
    // Long hair — top cap + sides flowing down
    const topGeo = new THREE.SphereGeometry(headR * 1.08, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const top = new THREE.Mesh(topGeo, hMat);
    top.position.set(0, headR * 0.15, -headR * 0.05);
    headGroup.add(top);

    // Side hair flowing down — two elongated shapes
    for (const side of [-1, 1]) {
      const sideGeo = new THREE.CylinderGeometry(headR * 0.25, headR * 0.15, headR * 1.8, 8);
      const sideHair = new THREE.Mesh(sideGeo, hMat);
      sideHair.position.set(side * headR * 0.7, -headR * 0.5, -headR * 0.1);
      sideHair.rotation.z = side * 0.1;
      headGroup.add(sideHair);
    }
    // Back hair
    const backGeo = new THREE.SphereGeometry(headR * 1.0, 10, 10);
    const backHair = new THREE.Mesh(backGeo, hMat);
    backHair.position.set(0, -headR * 0.1, -headR * 0.4);
    backHair.scale.set(1, 1.5, 0.7);
    headGroup.add(backHair);
  }
  else if (ch.hairType === 'short') {
    // Short cropped hair — cap on top, close to head
    const topGeo = new THREE.SphereGeometry(headR * 1.04, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const top = new THREE.Mesh(topGeo, hMat);
    top.position.set(0, headR * 0.1, 0);
    headGroup.add(top);
    // Slight fringe
    const fringeGeo = new THREE.SphereGeometry(headR * 0.3, 8, 8);
    const fringe = new THREE.Mesh(fringeGeo, hMat);
    fringe.position.set(0, headR * 0.6, headR * 0.5);
    fringe.scale.set(2, 0.4, 0.5);
    headGroup.add(fringe);
  }
  else if (ch.hairType === 'short_curly') {
    // Curly — bumpy texture using multiple small spheres
    const topGeo = new THREE.SphereGeometry(headR * 1.06, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const top = new THREE.Mesh(topGeo, hMat);
    top.position.set(0, headR * 0.1, 0);
    headGroup.add(top);
    // Curl bumps
    for (let ci = 0; ci < 12; ci++) {
      const a = (ci / 12) * Math.PI * 2;
      const cy = headR * 0.5 + Math.sin(a * 3) * headR * 0.15;
      const cx = Math.cos(a) * headR * 0.85;
      const cz = Math.sin(a) * headR * 0.85;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.15, 6, 6), hMat);
      curl.position.set(cx, cy, cz);
      headGroup.add(curl);
    }
  }
  // bald — just a subtle shine on the head (no extra geometry)

  // ═══ KIPPAH ═══
  if (ch.kippah) {
    const kGeo = new THREE.SphereGeometry(headR * 0.4, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const kMat = new THREE.MeshStandardMaterial({
      color: isChild ? 0x2244AA : 0x1A1A3A,
      roughness: 0.6
    });
    const kippah = new THREE.Mesh(kGeo, kMat);
    kippah.position.set(0, headR * 0.75, -headR * 0.2);
    kippah.rotation.x = -0.3;
    headGroup.add(kippah);
  }

  // ═══ BEARD ═══
  if (ch.beard) {
    // Multi-part beard for better look
    const chinGeo = new THREE.SphereGeometry(headR * 0.4, 10, 10);
    const chin = new THREE.Mesh(chinGeo, hMat);
    chin.position.set(0, -headR * 0.6, headR * 0.35);
    chin.scale.set(0.8, 1.1, 0.6);
    headGroup.add(chin);
    // Mustache
    const mustGeo = new THREE.CylinderGeometry(0.003, 0.003, headR * 0.5, 4);
    const mustache = new THREE.Mesh(mustGeo, hMat);
    mustache.position.set(0, eyeY - headR * 0.22, eyeZ + headR * 0.05);
    mustache.rotation.z = Math.PI / 2;
    headGroup.add(mustache);
    // Side whiskers
    for (const side of [-1, 1]) {
      const whiskerGeo = new THREE.SphereGeometry(headR * 0.18, 8, 8);
      const whisker = new THREE.Mesh(whiskerGeo, hMat);
      whisker.position.set(side * headR * 0.5, -headR * 0.35, headR * 0.4);
      whisker.scale.set(0.5, 1.2, 0.5);
      headGroup.add(whisker);
    }
  }

  // Glasses for elder characters
  if (isElder && ch.gender === 'M') {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    // Rims
    for (const side of [-1, 1]) {
      const rimGeo = new THREE.TorusGeometry(headR * 0.15, 0.004, 6, 16);
      const rim = new THREE.Mesh(rimGeo, glassMat);
      rim.position.set(side * eyeSpacing, eyeY, eyeZ + headR * 0.05);
      headGroup.add(rim);
    }
    // Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.003, 0.003, eyeSpacing * 0.8, 4);
    const bridge = new THREE.Mesh(bridgeGeo, glassMat);
    bridge.position.set(0, eyeY + headR * 0.05, eyeZ + headR * 0.06);
    bridge.rotation.z = Math.PI / 2;
    headGroup.add(bridge);
  }

  headGroup.position.set(0, headBaseY, 0.02);
  group.add(headGroup);

  // ═══ ARMS with HANDS ═══
  const armLen = torsoH * 1.1 * s.bodyScale;
  const armW = 0.025;

  // Upper arms
  const armGeo = new THREE.CylinderGeometry(armW, armW * 0.85, armLen, 8);

  const lArmGroup = new THREE.Group();
  const lArmMesh = new THREE.Mesh(armGeo, clothMat(ch.color));
  lArmGroup.add(lArmMesh);
  // Left hand
  const lHand = new THREE.Mesh(
    new THREE.SphereGeometry(armW * 1.3, 8, 8),
    skinMat(ch.skin)
  );
  lHand.position.set(0, -armLen / 2 - armW, 0);
  lHand.scale.set(1, 0.7, 0.8);
  lArmGroup.add(lHand);

  const armBaseY = bodyBaseY + torsoH * 0.35;
  lArmGroup.position.set(-torsoW - 0.035, armBaseY, 0.04);
  lArmGroup.rotation.z = 0.25;
  lArmGroup.rotation.x = -0.2;
  group.add(lArmGroup);

  const rArmGroup = new THREE.Group();
  const rArmMesh = new THREE.Mesh(armGeo, clothMat(ch.color));
  rArmGroup.add(rArmMesh);
  const rHand = new THREE.Mesh(
    new THREE.SphereGeometry(armW * 1.3, 8, 8),
    skinMat(ch.skin)
  );
  rHand.position.set(0, -armLen / 2 - armW, 0);
  rHand.scale.set(1, 0.7, 0.8);
  rArmGroup.add(rHand);

  rArmGroup.position.set(torsoW + 0.035, armBaseY, 0.04);
  rArmGroup.rotation.z = -0.25;
  rArmGroup.rotation.x = -0.2;
  group.add(rArmGroup);

  // ═══ LEGS (visible below the table) ═══
  const legLen = 0.22 * s.legLen;
  const legGeo = new THREE.CylinderGeometry(0.03, 0.028, legLen, 8);
  const legMat = new THREE.MeshStandardMaterial({
    color: isChild ? 0x3A5A8A : ch.gender === 'F' ? adjustColor(ch.color, 0.7) : 0x2A2A2A,
    roughness: 0.7
  });
  for (const side of [-0.05, 0.05]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(side, seatY - legLen / 2 - 0.02, 0.08);
    group.add(leg);
    // Shoes
    const shoe = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshStandardMaterial({ color: isChild ? 0xFF4444 : 0x1A1A1A, roughness: 0.6 })
    );
    shoe.position.set(side, seatY - legLen - 0.04, 0.12);
    shoe.scale.set(0.8, 0.5, 1.3);
    group.add(shoe);
  }

  return {
    group, head: headGroup, body: bodyGroup,
    lArm: lArmGroup, rArm: rArmGroup,
    lHand, rHand, mouth, lEye, rEye,
    seatY, headBaseY, bodyBaseY, armBaseY,
  };
}

// ═══ CHAIR BUILDER ═══
export function buildChair(): THREE.Group {
  const chair = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5A3D1E, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3A2812, roughness: 0.7 });

  // Seat — slightly curved
  const seatGeo = new THREE.BoxGeometry(0.44, 0.035, 0.4);
  const seat = new THREE.Mesh(seatGeo, mat);
  seat.position.set(0, 0.45, 0); seat.castShadow = true; chair.add(seat);

  // Seat cushion
  const cushionGeo = new THREE.BoxGeometry(0.38, 0.025, 0.34);
  const cushion = new THREE.Mesh(cushionGeo, new THREE.MeshStandardMaterial({ color: 0x8B1A1A, roughness: 0.8 }));
  cushion.position.set(0, 0.475, 0.01); chair.add(cushion);

  // Back — with slight curve via multiple slats
  const backGeo = new THREE.BoxGeometry(0.44, 0.52, 0.025);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, 0.73, -0.185); chair.add(back);

  // Back decorative top rail
  const railGeo = new THREE.BoxGeometry(0.48, 0.04, 0.03);
  const rail = new THREE.Mesh(railGeo, darkMat);
  rail.position.set(0, 1.0, -0.185); chair.add(rail);

  // Legs — turned/tapered
  for (const [lx, lz] of [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]]) {
    const legGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.45, 8);
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(lx, 0.225, lz); leg.castShadow = true; chair.add(leg);
  }

  // Cross braces
  for (const lz of [-0.17, 0.17]) {
    const braceGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.34, 4);
    const brace = new THREE.Mesh(braceGeo, darkMat);
    brace.position.set(0, 0.15, lz);
    brace.rotation.z = Math.PI / 2;
    chair.add(brace);
  }

  return chair;
}

// Color utility
function adjustColor(hex: number, factor: number): number {
  const r = Math.min(255, Math.floor(((hex >> 16) & 255) * factor));
  const g = Math.min(255, Math.floor(((hex >> 8) & 255) * factor));
  const b = Math.min(255, Math.floor((hex & 255) * factor));
  return (r << 16) | (g << 8) | b;
}
