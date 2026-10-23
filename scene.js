/* ECN Group — Espace Formation : scène 3D de fond (Three.js)
   Initié : icosaèdre filaire argent · Membre : nœud d'or liquide · Fondateur : gemme champagne + anneaux */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 760;
const G = window.gsap;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
} catch {
  canvas.remove(); // pas de WebGL : le reste de la page fonctionne sans la 3D
  throw new Error('WebGL indisponible');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x050608, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 0, 10);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

const key = new THREE.DirectionalLight(0xfff1c8, 1.4);
key.position.set(4, 5, 6);
const rim = new THREE.PointLight(0xd4af37, 18, 30);
rim.position.set(-5, -2, 4);
scene.add(key, rim);

/* ---------- Objets par pack ---------- */
const gold = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: .16, clearcoat: 1, clearcoatRoughness: .08 });
const champagne = new THREE.MeshPhysicalMaterial({ color: 0xe9cf86, metalness: 1, roughness: .05, clearcoat: 1, flatShading: true, iridescence: .7, iridescenceIOR: 1.5 });
const silver = new THREE.MeshStandardMaterial({ color: 0xc3cad8, metalness: .8, roughness: .3, wireframe: true, transparent: true, opacity: .5 });

const initie = new THREE.Group();
initie.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 2), silver));
initie.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshStandardMaterial({ color: 0x8a94a8, metalness: 1, roughness: .4, flatShading: true })));

const membre = new THREE.Mesh(new THREE.TorusKnotGeometry(1.25, .4, small ? 160 : 300, small ? 24 : 48, 2, 3), gold);

const fondateur = new THREE.Group();
const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), champagne);
gem.scale.y = 1.35;
const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.5, .03, 16, 220), gold);
ringA.rotation.x = 1.25;
const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.85, .02, 16, 220), champagne);
ringB.rotation.set(.5, .9, 0);
fondateur.add(gem, ringA, ringB);

const hero = new THREE.Group();
const OBJ = { initie, membre, fondateur };
Object.values(OBJ).forEach(o => { o.visible = false; hero.add(o); });
scene.add(hero);

/* ---------- Galaxie de particules ---------- */
const N = small ? 1400 : 3600;
const pos = new Float32Array(N * 3), seed = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = 2.6 + Math.pow(Math.random(), 1.6) * 13;
  const a = (i % 3) * (Math.PI * 2 / 3) + r * .42 + (Math.random() - .5) * .9;
  pos[i * 3] = Math.cos(a) * r;
  pos[i * 3 + 1] = (Math.random() - .5) * (1.6 + r * .12);
  pos[i * 3 + 2] = Math.sin(a) * r;
  seed[i] = Math.random();
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xe2b84a) }, uSize: { value: 26 * renderer.getPixelRatio() }, uAlpha: { value: 1 } },
  vertexShader: `
    attribute float seed; uniform float uTime; uniform float uSize; varying float vTw;
    void main() {
      vec3 p = position; p.y += sin(uTime * .6 + seed * 20.) * .12;
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      vTw = .55 + .45 * sin(uTime * 2. + seed * 40.);
      gl_PointSize = uSize * (.35 + seed) / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor; uniform float uAlpha; varying float vTw;
    void main() {
      float d = length(gl_PointCoord - .5);
      float a = smoothstep(.5, 0., d);
      gl_FragColor = vec4(uColor * (1. + a), a * vTw * uAlpha);
    }`
});
const galaxy = new THREE.Points(pGeo, pMat);
galaxy.rotation.x = .38;
scene.add(galaxy);

/* ---------- Post-traitement ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .5, .86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- Thèmes ---------- */
const THEME = {
  initie: { color: 0xa9b2c4, rim: 0x8a94a8, bloom: .15, exposure: .8, alpha: .55 },
  membre: { color: 0xe2b84a, rim: 0xd4af37, bloom: .42, exposure: .9, alpha: 1 },
  fondateur: { color: 0xf5e2a8, rim: 0xfff1c8, bloom: .6, exposure: 1, alpha: 1 }
};
let tier = document.documentElement.dataset.tier || 'membre';
let active = OBJ[tier] || membre;
function applyTheme(t, instant) {
  const T = THEME[t] || THEME.membre;
  const c = new THREE.Color(T.color), rc = new THREE.Color(T.rim);
  if (instant || !G) {
    pMat.uniforms.uColor.value.copy(c); rim.color.copy(rc);
    bloom.strength = T.bloom; renderer.toneMappingExposure = T.exposure; pMat.uniforms.uAlpha.value = T.alpha;
    return;
  }
  G.to(pMat.uniforms.uColor.value, { r: c.r, g: c.g, b: c.b, duration: 1.6, ease: 'power2.inOut' });
  G.to(rim.color, { r: rc.r, g: rc.g, b: rc.b, duration: 1.6 });
  G.to(bloom, { strength: T.bloom, duration: 1.6 });
  G.to(renderer, { toneMappingExposure: T.exposure, duration: 1.6 });
  G.to(pMat.uniforms.uAlpha, { value: T.alpha, duration: 1.6 });
}
active.visible = true;
applyTheme(tier, true);

let spin = 0;
function swap(t) {
  const next = OBJ[t];
  if (!next || next === active) return;
  const prev = active;
  active = next;
  tier = t;
  applyTheme(t);
  if (!G || reduce) { prev.visible = false; next.visible = true; render(); return; }
  G.to(prev.scale, { x: 0, y: 0, z: 0, duration: .7, ease: 'back.in(2)', onComplete: () => { prev.visible = false; prev.scale.set(1, 1, 1); } });
  G.to({ v: 0 }, { v: 1, duration: 1.6, ease: 'expo.inOut', onUpdate() { spin = this.targets()[0].v * Math.PI * 2; } });
  next.visible = true;
  next.scale.set(0, 0, 0);
  G.to(next.scale, { x: 1, y: 1, z: 1, duration: 1.8, delay: .55, ease: 'elastic.out(1, .45)' });
}

/* ---------- Interaction & boucle ---------- */
let mx = 0, my = 0, sx = 0, sy = 0, paused = false, onDash = true, dashK = 1;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
addEventListener('ecn:tier', e => swap(e.detail));
addEventListener('ecn:pause', e => { paused = e.detail; if (!paused) loop(); });
addEventListener('ecn:view', e => { onDash = e.detail === 'dashboard'; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  render(performance.now());
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

const clock = new THREE.Clock();
let raf = 0;
function render(now) {
  const t = clock.getElapsedTime();
  const s = scrollY / innerHeight;
  sx += (mx - sx) * .05;
  sy += (my - sy) * .05;
  dashK += ((onDash ? 1 : 0) - dashK) * .05;
  const wide = innerWidth > 980;

  // l'objet vit derrière la carte de pass, puis s'éloigne au scroll
  const hs = Math.min(s, 2.2);
  hero.position.set((wide ? 3.05 : 0) - hs * (wide ? .8 : 0), (wide ? .1 : -1.4) + hs * 3.2, -hs * 3 - (1 - dashK) * 6);
  hero.rotation.y = sx * .7 + spin;
  hero.rotation.x = sy * .5;
  active.rotation.x = t * .18 + s * .8;
  active.rotation.y = t * .26 + s * 1.2;
  if (active === fondateur) { ringA.rotation.z = t * .5; ringB.rotation.z = -t * .35; gem.rotation.y = t * .6; }

  galaxy.rotation.y = t * .025 + s * .35 + sx * .15;
  galaxy.position.y = s * 1.5;
  camera.position.x = sx * .6;
  camera.position.y = -sy * .4;
  camera.lookAt(0, 0, 0);
  pMat.uniforms.uTime.value = t;
  composer.render();
}
function loop() {
  cancelAnimationFrame(raf);
  if (paused || document.hidden) return;
  render(performance.now());
  if (!reduce) raf = requestAnimationFrame(loop);
}
loop();
