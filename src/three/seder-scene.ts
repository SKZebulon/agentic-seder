import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DEFAULT_CHARACTERS, type Character } from '@/data/characters';

function place<T extends THREE.Object3D>(obj: T, x: number, y: number, z: number): T {
  obj.position.set(x, y, z);
  return obj;
}

export interface CharMesh {
  group: THREE.Group;
  /** Torso (group: shirt + pants meshes) */
  body: THREE.Object3D;
  head: THREE.Mesh;
  lArm: THREE.Mesh;
  rArm: THREE.Mesh;
  baseY: number;
  /** Local Y of torso at rest (shirt+pants group) */
  torsoRestY: number;
  headY: number;
  standing: boolean;
  speaking: boolean;
  celebrating: boolean;
  drinking: boolean;
  phase: number;
}

function matShirt(hex: number, em = 0.15): THREE.MeshPhysicalMaterial {
  const c = new THREE.Color(hex);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.42,
    metalness: 0.08,
    clearcoat: 0.22,
    clearcoatRoughness: 0.45,
    sheen: 0.35,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(0xffffff),
    emissive: c.clone().multiplyScalar(em * 0.5),
    emissiveIntensity: 0.35,
  });
}

function matPants(hex: number): THREE.MeshStandardMaterial {
  const c = new THREE.Color(hex).multiplyScalar(0.42);
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.62,
    metalness: 0.04,
    emissive: c.clone().multiplyScalar(0.08),
    emissiveIntensity: 0.25,
  });
}

function skinMat(hex: number): THREE.MeshPhysicalMaterial {
  const c = new THREE.Color(hex);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.08,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xffe8dc),
    emissive: c.clone().multiplyScalar(0.12),
    emissiveIntensity: 0.28,
  });
}

function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a1e16';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(${35 + Math.random() * 25},${24 + Math.random() * 18},${16 + Math.random() * 12},0.12)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.bezierCurveTo(Math.random() * 512, 170, Math.random() * 512, 340, Math.random() * 512, 512);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#1a0e28');
  g.addColorStop(0.35, '#2d1830');
  g.addColorStop(0.65, '#120a18');
  g.addColorStop(1, '#060408');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface FigureParts {
  group: THREE.Group;
  body: THREE.Object3D;
  head: THREE.Mesh;
  lArm: THREE.Mesh;
  rArm: THREE.Mesh;
  baseY: number;
  torsoRestY: number;
  headY: number;
}

function buildCharacterFigure(ch: Character): FigureParts {
  const g = new THREE.Group();
  const baseY = ch.age === 'child' ? 0.88 : ch.age === 'teen' ? 1.02 : 1.06;
  const bodyH = ch.bodyH;
  const bw = ch.bodyW;
  const shirtMat = matShirt(ch.color, 0.18);
  const pantsMat = matPants(ch.color);
  const skin = skinMat(ch.skin);

  const torso = new THREE.Group();
  const shirtLen = bodyH * 0.58;
  const shirt = new THREE.Mesh(
    new THREE.CapsuleGeometry(bw * 0.5, shirtLen * 0.72, 8, 16),
    shirtMat
  );
  shirt.position.set(0, shirtLen * 0.36, 0.04);
  shirt.castShadow = true;
  torso.add(shirt);

  const pantsLen = bodyH * 0.48;
  const pants = new THREE.Mesh(new THREE.CapsuleGeometry(bw * 0.52, pantsLen * 0.85, 8, 14), pantsMat);
  pants.position.set(0, -pantsLen * 0.38, 0.02);
  pants.castShadow = true;
  torso.add(pants);

  const torsoRestY = baseY + bodyH * 0.42;
  torso.position.set(0, torsoRestY, 0);
  g.add(torso);

  const hSize = 0.13 * ch.headS;
  const headY = baseY + bodyH + hSize * 0.92;
  const head = new THREE.Mesh(new THREE.SphereGeometry(hSize, 32, 32), skin);
  head.position.set(0, headY, 0.07);
  head.scale.set(1, 1.05, 1.02);
  head.castShadow = true;
  g.add(head);

  const eyeGeo = new THREE.SphereGeometry(hSize * 0.085, 10, 10);
  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1410,
    roughness: 0.25,
    clearcoat: 0.6,
  });
  g.add(place(new THREE.Mesh(eyeGeo, eyeMat), -hSize * 0.22, headY + hSize * 0.04, hSize * 0.86));
  g.add(place(new THREE.Mesh(eyeGeo, eyeMat), hSize * 0.22, headY + hSize * 0.04, hSize * 0.86));

  const cheek = new THREE.Mesh(
    new THREE.SphereGeometry(hSize * 0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: ch.skin, transparent: true, opacity: 0.35, roughness: 1 })
  );
  cheek.scale.set(1.4, 0.6, 0.4);
  g.add(place(cheek.clone(), -hSize * 0.32, headY - hSize * 0.08, hSize * 0.75));
  g.add(place(cheek.clone(), hSize * 0.32, headY - hSize * 0.08, hSize * 0.75));

  if (ch.hairType === 'long') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 1.18, 20, 20), matShirt(ch.hair, 0.08));
    h.scale.set(1.08, 1.32, 1.1);
    h.position.set(0, headY - hSize * 0.02, -hSize * 0.14);
    h.castShadow = true;
    g.add(h);
  } else if (ch.hairType === 'short') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 1.0, 16, 16), matShirt(ch.hair, 0.08));
    h.scale.set(1.2, 0.55, 1.08);
    h.position.set(0, headY + hSize * 0.42, 0.04);
    g.add(h);
  } else if (ch.hairType === 'short_curly') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(hSize * 1.05, 14, 14), matShirt(ch.hair, 0.08));
    h.scale.set(1.22, 0.65, 1.16);
    h.position.set(0, headY + hSize * 0.22, 0.04);
    g.add(h);
  }

  if (ch.kippah) {
    const k = new THREE.Mesh(
      new THREE.CylinderGeometry(hSize * 0.52, hSize * 0.55, hSize * 0.22, 20),
      matShirt(0x1a1a30, 0.04)
    );
    k.position.set(0, headY + hSize * 0.72, 0.02);
    k.castShadow = true;
    g.add(k);
  }
  if (ch.beard) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(hSize * 0.72, 14, 14), matShirt(ch.hair, 0.06));
    b.scale.set(1, 1.15, 0.8);
    b.position.set(0, headY - hSize * 0.52, hSize * 0.58);
    g.add(b);
  }

  const armLen = bodyH * 0.76;
  const armGeo = new THREE.CapsuleGeometry(0.034, armLen * 0.82, 6, 12);
  const lArm = new THREE.Mesh(armGeo, shirtMat.clone());
  lArm.position.set(-bw - 0.05, baseY + bodyH * 0.38, 0.1);
  lArm.rotation.z = 0.28;
  lArm.castShadow = true;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), skin);
  lHand.position.set(0, -armLen * 0.42, 0.02);
  lArm.add(lHand);
  g.add(lArm);

  const rArm = new THREE.Mesh(armGeo, shirtMat.clone());
  rArm.position.set(bw + 0.05, baseY + bodyH * 0.38, 0.1);
  rArm.rotation.z = -0.28;
  rArm.castShadow = true;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), skin);
  rHand.position.set(0, -armLen * 0.42, 0.02);
  rArm.add(rHand);
  g.add(rArm);

  const shoeGeo = new RoundedBoxGeometry(bw * 0.38, 0.06, 0.2, 2, 0.02);
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.75 });
  g.add(place(new THREE.Mesh(shoeGeo, shoeMat), -bw * 0.35, 0.04, 0.06));
  g.add(place(new THREE.Mesh(shoeGeo, shoeMat), bw * 0.35, 0.04, 0.06));

  return { group: g, body: torso, head, lArm, rArm, baseY, torsoRestY, headY };
}

export function buildSederScene(
  canvas: HTMLCanvasElement,
  opts?: { cinematic?: boolean; reducedMotion?: boolean }
) {
  const cinematic = opts?.cinematic !== false;
  const reducedMotion = opts?.reducedMotion === true;
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0612);
  scene.fog = new THREE.FogExp2(0x080612, 0.0068);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 120);
  camera.position.set(0, 6.8, 10.2);
  camera.lookAt(0, 1.05, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;

  const woodTex = createWoodTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xc4b4a8,
      roughness: 0.78,
      metalness: 0.04,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const skyTex = createSkyTexture();
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 36),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.DoubleSide, fog: false })
  );
  sky.position.set(0, 14, -16);
  scene.add(sky);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 22),
    new THREE.MeshStandardMaterial({ color: 0x1e1420, roughness: 0.92, emissive: 0x0a0608, emissiveIntensity: 0.4 })
  );
  wall.position.set(0, 8, -10);
  scene.add(wall);

  const tMat = new THREE.MeshPhysicalMaterial({
    color: 0x3d2818,
    roughness: 0.38,
    metalness: 0.18,
    clearcoat: 0.45,
    clearcoatRoughness: 0.35,
  });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.55, 0.16, 64), tMat);
  table.position.y = 1;
  table.scale.set(1.32, 1, 1);
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    scene.add(
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 1.04, 12), tMat), Math.cos(a) * 2.88, 0.52, Math.sin(a) * 2.22)
    );
  }

  const cloth = new THREE.Mesh(
    new THREE.RingGeometry(3.12, 4.78, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xf2e4d4,
      side: THREE.DoubleSide,
      roughness: 0.72,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.9,
    })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 1.09;
  cloth.scale.set(1.32, 1, 1);
  cloth.receiveShadow = true;
  scene.add(cloth);

  scene.add(
    place(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 0.038, 32),
        new THREE.MeshPhysicalMaterial({ color: 0xb89878, metalness: 0.45, roughness: 0.35, clearcoat: 0.2 })
      ),
      0,
      1.13,
      0
    )
  );

  [0x4a7a3a, 0x8b4513, 0xf5deb3, 0xffffe0, 0x654321, 0x4a7a3a].forEach((c, i) => {
    const a = (i / 6) * Math.PI * 2;
    const col = new THREE.Color(c);
    scene.add(
      place(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.052, 14, 14),
          new THREE.MeshPhysicalMaterial({
            color: col,
            emissive: col.clone().multiplyScalar(0.15),
            emissiveIntensity: 0.5,
            roughness: 0.35,
          })
        ),
        Math.cos(a) * 0.28,
        1.17,
        Math.sin(a) * 0.28
      )
    );
  });

  for (let i = 0; i < 3; i++) {
    scene.add(
      place(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20),
          new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.75, metalness: 0.1 })
        ),
        -0.62,
        1.125 + i * 0.024,
        0.32
      )
    );
  }

  const candles: THREE.Object3D[] = [];
  [[-0.26, 0, -0.56], [0.26, 0, -0.56]].forEach(([cx, , cz]) => {
    scene.add(
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.058, 0.32, 12), new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: 0.8, roughness: 0.22 })), cx, 1.26, cz)
    );
    scene.add(
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12), new THREE.MeshStandardMaterial({ color: 0xfff8dc })), cx, 1.52, cz)
    );
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.058, 10), new THREE.MeshBasicMaterial({ color: 0xffcc88 }));
    f.position.set(cx, 1.66, cz);
    f.userData.isFlame = true;
    scene.add(f);
    candles.push(f);
    const cl = new THREE.PointLight(0xffddaa, 2.6, 28, 1.55);
    cl.position.set(cx, 1.7, cz);
    cl.castShadow = true;
    cl.userData.isCandleLight = true;
    scene.add(cl);
    candles.push(cl);
  });

  scene.add(
    place(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.038, 0.18, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 0.72, roughness: 0.22, clearcoat: 0.35 })
      ),
      0,
      1.21,
      -0.3
    )
  );

  scene.add(new THREE.AmbientLight(0xd8ccf5, 0.55));
  scene.add(new THREE.HemisphereLight(0xc8b8f0, 0x2a2018, 0.62));

  const sun = new THREE.DirectionalLight(0xfff2e0, 1.15);
  sun.position.set(4.5, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.00025;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const spot = new THREE.SpotLight(0xffeedd, 1.5, 45, Math.PI / 4.2, 0.38, 1.1);
  spot.position.set(0, 13.5, 4.2);
  spot.target.position.set(0, 1.05, 0);
  spot.castShadow = true;
  scene.add(spot);
  scene.add(spot.target);

  scene.add(place(new THREE.PointLight(0xa8c8ff, 0.42, 32, 1.5), -8, 6, 7));
  scene.add(place(new THREE.PointLight(0xffc9a8, 0.48, 32, 1.5), 8, 6, 7));
  scene.add(place(new THREE.PointLight(0xfff2dd, 0.85, 22, 1.6), 0, 3.8, 6));

  const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
  rim.position.set(-6, 4, -4);
  scene.add(rim);

  const dustCount = reducedMotion ? 0 : 420;
  let dust: THREE.Points | null = null;
  if (dustCount > 0) {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = 0.8 + Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(
      dGeo,
      new THREE.PointsMaterial({
        color: 0xffe8c8,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        depthWrite: false,
      })
    );
    dust.position.set(0, 0, -2);
    scene.add(dust);
  }

  const chairMat = new THREE.MeshStandardMaterial({ color: 0x3d3028, roughness: 0.75, metalness: 0.05 });

  const chars: Record<string, CharMesh> = {};
  const n = DEFAULT_CHARACTERS.length;

  DEFAULT_CHARACTERS.forEach((ch, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * 4.25,
      z = Math.sin(ang) * 3.25;
    const seatG = new THREE.Group();
    seatG.position.set(x, 0, z);
    seatG.lookAt(0, 1, 0);

    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.055, 0.46, 3, 0.04), chairMat);
    seat.position.set(0, 0.64, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    seatG.add(seat);

    const back = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.62, 0.055, 3, 0.035), chairMat);
    back.position.set(0, 0.98, -0.2);
    back.castShadow = true;
    seatG.add(back);

    for (let l = 0; l < 4; l++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.64, 8), chairMat);
      leg.position.set(l % 2 ? 0.22 : -0.22, 0.32, l < 2 ? -0.18 : 0.18);
      leg.castShadow = true;
      seatG.add(leg);
    }

    const fig = buildCharacterFigure(ch);
    seatG.add(fig.group);

    const ph = Math.random() * 6.28;
    scene.add(seatG);
    chars[ch.id] = {
      group: seatG,
      body: fig.body,
      head: fig.head,
      lArm: fig.lArm,
      rArm: fig.rArm,
      baseY: fig.baseY,
      torsoRestY: fig.torsoRestY,
      headY: fig.headY,
      standing: false,
      speaking: false,
      celebrating: false,
      drinking: false,
      phase: ph,
    };
  });

  const over = sun;

  return { scene, camera, renderer, chars, candles, over, cinematic, reducedMotion, dust };
}
