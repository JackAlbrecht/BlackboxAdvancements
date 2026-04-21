// =====================================================================
// Blackbox Advancements — splash WebGL FX
// Ports the 21st.dev "hero-futuristic" effect (depth-mapped image +
// cell-noise dot mask + scan line + bloom) to vanilla three.js, tinted
// in the Blackbox purple/cyan palette.
// =====================================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TEX_SRC = 'assets/splash-img.png';
const DEPTH_SRC = 'assets/splash-depth.webp';

export function initSplashFX(canvas) {
  // WebGL capability check
  const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!testCtx) return null;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const colorTex = loader.load(TEX_SRC);
  const depthTex = loader.load(DEPTH_SRC);
  [colorTex, depthTex].forEach((t) => {
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
  });

  const initialW = canvas.clientWidth || window.innerWidth;
  const initialH = canvas.clientHeight || window.innerHeight;

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uProgress: { value: 0 },
    uScanProgress: { value: 0 },
    uTexture: { value: colorTex },
    uDepth: { value: depthTex },
    uRes: { value: new THREE.Vector2(initialW, initialH) },
    uReveal: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uProgress;
      uniform float uScanProgress;
      uniform sampler2D uTexture;
      uniform sampler2D uDepth;
      uniform vec2 uRes;
      uniform float uReveal;
      varying vec2 vUv;

      // Hash + voronoi-style cell noise (matches the feel of mx_cell_noise_float)
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)),
                 dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123);
      }
      float cellNoise(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        float d = 1.0;
        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(ip + g);
            vec2 r = g + o - fp;
            d = min(d, dot(r, r));
          }
        }
        return sqrt(d);
      }

      // Screen blend (matches blendScreen from TSL)
      vec3 blendScreen(vec3 base, vec3 mask) {
        return 1.0 - (1.0 - base) * (1.0 - mask);
      }

      void main() {
        vec2 uv = vUv;

        // ------- Image plane: fit a square image into the center ----------
        float aspect = uRes.x / max(uRes.y, 1.0);
        float imgScale = 0.42; // portion of the viewport the image covers
        vec2 centered = (uv - 0.5);
        vec2 imgUv;
        if (aspect >= 1.0) {
          imgUv = vec2(centered.x * aspect, centered.y) / imgScale + 0.5;
        } else {
          imgUv = vec2(centered.x, centered.y / aspect) / imgScale + 0.5;
        }
        bool inImage = imgUv.x >= 0.0 && imgUv.x <= 1.0
                    && imgUv.y >= 0.0 && imgUv.y <= 1.0;

        vec4 outCol = vec4(0.0);

        if (inImage) {
          // Parallax driven by pointer + depth map
          vec4 depthSample = texture2D(uDepth, imgUv);
          vec2 parallax = uPointer * depthSample.r * 0.012;
          vec4 base = texture2D(uTexture, clamp(imgUv + parallax, 0.001, 0.999));

          // Cell-noise dot pattern (pixelated dot field across the image)
          float tiling = 120.0;
          vec2 tUv = imgUv;
          vec2 tiled = mod(tUv * tiling, 2.0) - 1.0;
          float brightness = cellNoise(tUv * tiling * 0.5);
          float dist = length(tiled);
          float dotMask = smoothstep(0.5, 0.49, dist) * brightness;

          // Depth-driven "flow" band — only dots near the current slice light up
          float flow = 1.0 - smoothstep(0.0, 0.02, abs(depthSample.r - uProgress));

          // Purple-violet glow tint (toned down so it doesn't compete with the headline text)
          vec3 maskColor = vec3(3.5, 1.0, 6.0) * dotMask * flow;

          vec3 merged = blendScreen(base.rgb, maskColor);

          // Fade image slightly dark at edges to blend with splash bg
          float edgeFade = smoothstep(0.0, 0.12, imgUv.x)
                         * smoothstep(1.0, 0.88, imgUv.x)
                         * smoothstep(0.0, 0.12, imgUv.y)
                         * smoothstep(1.0, 0.88, imgUv.y);

          outCol = vec4(merged * edgeFade, base.a * edgeFade);
        }

        // ------- Full-screen scan line (cyan) ----------
        float scanWidth = 0.05;
        float scanLine = smoothstep(0.0, scanWidth, abs(uv.y - uScanProgress));
        vec3 scanTint = vec3(0.13, 0.83, 0.93); // #22d3ee cyan
        vec3 scanOverlay = scanTint * (1.0 - scanLine) * 0.45;

        // Keep the scan overlay subtle everywhere, stronger right at the scan edge
        float scanMix = mix(0.35, 1.0, smoothstep(0.92, 1.0, 1.0 - scanLine));
        outCol.rgb += scanOverlay * scanMix;
        outCol.a = max(outCol.a, (1.0 - scanLine) * 0.28);

        // Reveal fade-in
        outCol *= uReveal;

        gl_FragColor = outCol;
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  // ------- Post-processing: bloom -------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  composer.setSize(initialW, initialH);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(initialW, initialH),
    0.9,  // strength
    0.4,  // radius
    0.2,  // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ------- Pointer tracking -------
  const onPointerMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    // Soft-follow the pointer for a less jittery parallax
    uniforms.uPointer.value.lerp(new THREE.Vector2(x, y), 1.0);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // ------- Resize -------
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    uniforms.uRes.value.set(w, h);
  };
  window.addEventListener('resize', resize);
  resize();

  // ------- Reveal fade-in once textures load (or after a short grace period) -------
  const rampReveal = () => {
    if (uniforms.uReveal.value > 0) return; // already ramping
    const start = performance.now();
    const dur = 900;
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      uniforms.uReveal.value = t * t * (3 - 2 * t); // smoothstep
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  };
  // Use three.js TextureLoader's onLoad by re-loading via manager — simpler: poll image readiness
  const allReady = () => (colorTex.image && colorTex.image.complete !== false)
                      && (depthTex.image && depthTex.image.complete !== false);
  const waitForTextures = (tries = 0) => {
    if (allReady()) rampReveal();
    else if (tries < 30) setTimeout(() => waitForTextures(tries + 1), 120);
    else rampReveal(); // give up waiting, show what we've got
  };
  waitForTextures();

  // ------- Animate -------
  const clock = new THREE.Clock();
  let running = true;
  let raf;
  const tick = () => {
    if (!running) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    const wave = Math.sin(t * 0.5) * 0.5 + 0.5;
    uniforms.uProgress.value = wave;
    uniforms.uScanProgress.value = wave;
    composer.render();
    raf = requestAnimationFrame(tick);
  };
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      clock.start(); // resync to avoid jump
      tick();
    }
  });

  return {
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
    },
  };
}
