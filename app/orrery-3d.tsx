"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OrreryPlanet = {
  name: string;
  slug: string;
  texture: string;
  accent: string;
  distanceAu: number;
  periodDays: number;
  startAngle: number;
  axialTilt: string;
  spin: number;
  periodLabel: string;
  ring?: "saturn" | "uranus";
};

type Orrery3DProps = {
  planets: OrreryPlanet[];
  selectedSlug: string;
  onPick: (slug: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const EARTH_YEAR_DAYS = 365.256;
const SPEEDS = [2, 4, 8, 16];

const SUN_RADIUS = 7.2;
const ORBIT_INNER = 15.5;
const ORBIT_OUTER = 61;

/* Display radii. Real proportions are compressed so Mercury stays visible
   while Jupiter still reads as the giant of the family. */
const BODY_RADIUS: Record<string, number> = {
  mercury: 1.2,
  venus: 1.8,
  earth: 1.95,
  mars: 1.45,
  jupiter: 4.3,
  saturn: 3.7,
  uranus: 2.6,
  neptune: 2.5,
};

/* Earth's orbit, used by the live readout. Perihelion 3 Jan 2026, 17:16 UTC. */
const EARTH_PERIHELION_MS = Date.UTC(2026, 0, 3, 17, 16, 0);
const EARTH_ECCENTRICITY = 0.0167086;
const EARTH_SEMI_MAJOR_KM = 149.598e6;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function earthReadout(now: number) {
  const period = EARTH_YEAR_DAYS * DAY_MS;
  const raw = (now - EARTH_PERIHELION_MS) / period;
  const phase = ((raw % 1) + 1) % 1;
  const meanAnomaly = phase * Math.PI * 2;
  const eccentric = EARTH_ECCENTRICITY;
  const anomaly =
    meanAnomaly +
    eccentric * Math.sin(meanAnomaly) +
    0.5 * eccentric * eccentric * Math.sin(2 * meanAnomaly);
  const radiusAu = 1 - eccentric * Math.cos(anomaly);
  return {
    phase,
    distanceKm: EARTH_SEMI_MAJOR_KM * radiusAu,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Orrery3D({
  planets,
  selectedSlug,
  onPick,
}: Orrery3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const liveDateRef = useRef<HTMLSpanElement>(null);
  const liveBarRef = useRef<HTMLSpanElement>(null);
  const liveMarkerRef = useRef<HTMLSpanElement>(null);
  const livePhaseRef = useRef<HTMLElement>(null);
  const liveDistanceRef = useRef<HTMLElement>(null);
  const liveTravelRef = useRef<HTMLElement>(null);

  type Mode = "live" | "play" | "paused";

  const [speed, setSpeed] = useState(2);
  const [mode, setMode] = useState<Mode>("play");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const speedRef = useRef(2);
  const modeRef = useRef<Mode>("play");
  const previousModeRef = useRef<"live" | "play">("play");
  const hoverRef = useRef(false);
  const onPickRef = useRef(onPick);
  const selectedRef = useRef(selectedSlug);
  const applySelectionRef = useRef<(slug: string) => void>(() => {});
  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    onPickRef.current = onPick;
    selectedRef.current = selectedSlug;
    applySelectionRef.current(selectedSlug);
  }, [onPick, selectedSlug]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /* Live Earth readout — always true to the wall clock, independent of the
     simulation speed, so the page always shows Earth's real position. */
  useEffect(() => {
    const opened = Date.now();
    const paint = () => {
      const now = Date.now();
      const { phase, distanceKm } = earthReadout(now);
      if (liveDateRef.current) {
        liveDateRef.current.textContent = `${dateFormatter.format(now)} · ${clockFormatter.format(now)} UTC`;
      }
      if (liveBarRef.current) {
        liveBarRef.current.style.transform = `scaleX(${phase.toFixed(6)})`;
      }
      if (liveMarkerRef.current) {
        liveMarkerRef.current.style.left = `${(phase * 100).toFixed(4)}%`;
      }
      if (livePhaseRef.current) {
        livePhaseRef.current.textContent = `${(phase * 100).toFixed(1)}%`;
      }
      if (liveDistanceRef.current) {
        liveDistanceRef.current.textContent = `${(distanceKm / 1e6).toFixed(1)} million km`;
      }
      if (liveTravelRef.current) {
        const travelled = ((now - opened) / 1000) * 29.78;
        liveTravelRef.current.textContent = `${numberFormatter.format(travelled)} km`;
      }
    };

    paint();
    const timer = window.setInterval(paint, 400);
    return () => window.clearInterval(timer);
  }, []);

  /* Three.js scene. Loaded on demand so the rest of the page stays light. */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        setFailed(true);
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "orrery-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);

      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      const loader = new THREE.TextureLoader();
      const unitSphere = new THREE.SphereGeometry(1, 64, 48);
      const disposables: Array<{ dispose: () => void }> = [unitSphere];

      /* ---------------- star field ---------------- */
      const makeStars = (count: number, size: number, opacity: number) => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const radius = 150 + Math.random() * 220;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.cos(phi);
          positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        const material = new THREE.PointsMaterial({
          color: 0xc7c7c7,
          size,
          sizeAttenuation: true,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        disposables.push(geometry, material);
        scene.add(new THREE.Points(geometry, material));
      };
      makeStars(900, 0.5, 0.7);
      makeStars(140, 1.1, 0.85);

      /* ---------------- faint galactic band ---------------- */
      const galaxyTexture = loader.load("/textures/2k_stars_milky_way.jpg");
      galaxyTexture.colorSpace = THREE.SRGBColorSpace;
      galaxyTexture.anisotropy = maxAnisotropy;
      disposables.push(galaxyTexture);
      const galaxyGeometry = new THREE.SphereGeometry(520, 48, 32);
      const galaxyMaterial = new THREE.MeshBasicMaterial({
        map: galaxyTexture,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.42,
        color: 0x999999,
        depthWrite: false,
      });
      disposables.push(galaxyGeometry, galaxyMaterial);
      scene.add(new THREE.Mesh(galaxyGeometry, galaxyMaterial));

      /* ---------------- light ---------------- */
      scene.add(new THREE.AmbientLight(0xc6c6c6, 0.44));
      const sunlight = new THREE.PointLight(0xf1f1f1, 3.3, 0, 0);
      scene.add(sunlight);

      /* ---------------- sun ---------------- */
      const sunTexture = loader.load("/textures/2k_sun.jpg");
      sunTexture.colorSpace = THREE.SRGBColorSpace;
      sunTexture.anisotropy = maxAnisotropy;
      disposables.push(sunTexture);

      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_RADIUS, 72, 54),
        new THREE.MeshBasicMaterial({ map: sunTexture, toneMapped: false }),
      );
      sun.rotation.z = 0.12;
      scene.add(sun);
      disposables.push(sun.geometry, sun.material as import("three").Material);

      /* limb glow — a thin fresnel shell around the photosphere */
      const limbMaterial = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0xafafaf) } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
            gl_FragColor = vec4(uColor, rim * 0.7);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const limb = new THREE.Mesh(unitSphere, limbMaterial);
      limb.scale.setScalar(SUN_RADIUS * 1.035);
      scene.add(limb);
      disposables.push(limbMaterial);

      /* corona — animated streamers on a camera-facing plane */
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p *= 2.03;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            if (r > 1.0) discard;

            float angle = atan(p.y, p.x);
            vec2 q = vec2(cos(angle), sin(angle)) * r * 3.4;
            float grain = fbm(q * 2.6 + vec2(uTime * 0.03, -uTime * 0.02));
            float streaks = 0.35 + 0.65 * sin(angle * 9.0 + grain * 10.0 + uTime * 0.12);
            float lace = 0.5 + 0.5 * fbm(vec2(angle * 4.0, r * 5.0 - uTime * 0.04));
            float falloff = pow(1.0 - r, 2.35);
            float start = smoothstep(0.23, 0.34, r);
            float alpha = falloff * start * (0.34 + 0.58 * streaks * grain * lace);
            vec3 warm = mix(vec3(1.0, 0.4, 0.08), vec3(1.0, 0.88, 0.6), falloff);
            gl_FragColor = vec4(warm, alpha * 1.15);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const corona = new THREE.Mesh(
        new THREE.PlaneGeometry(SUN_RADIUS * 4.0, SUN_RADIUS * 4.0),
        coronaMaterial,
      );
      corona.renderOrder = 2;
      scene.add(corona);
      disposables.push(corona.geometry, coronaMaterial);

      /* soft bloom sprites behind the corona */
      const glowTexture = (() => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext("2d");
        if (context) {
          const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
          gradient.addColorStop(0, "rgba(237, 237, 237, 0.95)");
          gradient.addColorStop(0.18, "rgba(198, 198, 198, 0.55)");
          gradient.addColorStop(0.45, "rgba(157, 157, 157, 0.18)");
          gradient.addColorStop(1, "rgba(135, 135, 135, 0)");
          context.fillStyle = gradient;
          context.fillRect(0, 0, 256, 256);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      })();
      disposables.push(glowTexture);

      const makeGlow = (scale: number, opacity: number) => {
        const material = new THREE.SpriteMaterial({
          map: glowTexture,
          transparent: true,
          opacity,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.setScalar(scale);
        sprite.renderOrder = 0;
        scene.add(sprite);
        disposables.push(material);
      };
      makeGlow(SUN_RADIUS * 6.4, 0.38);
      makeGlow(SUN_RADIUS * 3.4, 0.6);

      /* ---------------- planet orbits ---------------- */
      const sqrtMin = Math.sqrt(0.387);
      const sqrtMax = Math.sqrt(30.07);
      const orbitRadius = (au: number) => {
        const t = (Math.sqrt(au) - sqrtMin) / (sqrtMax - sqrtMin);
        return ORBIT_INNER + t * (ORBIT_OUTER - ORBIT_INNER);
      };

      const orbitLines = new Map<string, import("three").LineBasicMaterial>();

      planets.forEach((planet) => {
        const radius = orbitRadius(planet.distanceAu);
        const points: import("three").Vector3[] = [];
        const segments = 256;
        for (let i = 0; i < segments; i += 1) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(
            new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
          );
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xc1c1c1,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        });
        const line = new THREE.LineLoop(geometry, material);
        line.renderOrder = -1;
        scene.add(line);
        orbitLines.set(planet.slug, material);
        disposables.push(geometry, material);
      });

      /* ---------------- Earth's live orbit arc ----------------
         The mint arc traces how far Earth has travelled since perihelion.
         In real-time mode its tip is where Earth actually is right now. */
      const earthPlanet = planets.find((planet) => planet.slug === "earth");
      const earthOrbit = orbitRadius(earthPlanet?.distanceAu ?? 1);
      const arcSegments = 192;
      const arcPositions = new Float32Array((arcSegments + 1) * 3);
      const arcGeometry = new THREE.BufferGeometry();
      arcGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(arcPositions, 3),
      );
      arcGeometry.setDrawRange(0, arcSegments + 1);
      const arcMaterial = new THREE.LineBasicMaterial({
        color: 0xd8d8d8,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const earthArc = new THREE.Line(arcGeometry, arcMaterial);
      earthArc.renderOrder = 0;
      scene.add(earthArc);
      disposables.push(arcGeometry, arcMaterial);

      const perihelionDays = (EARTH_PERIHELION_MS - J2000_MS) / DAY_MS;
      const perihelionAngle =
        ((earthPlanet?.startAngle ?? 100.46) +
          (perihelionDays / EARTH_YEAR_DAYS) * 360) *
        (Math.PI / 180);

      /* ---------------- saturn ring shader ---------------- */
      const ringMaterial = (
        inner: number,
        outer: number,
        tint: number,
        strength: number,
      ) =>
        new THREE.ShaderMaterial({
          uniforms: {
            uInner: { value: inner },
            uOuter: { value: outer },
            uTint: { value: new THREE.Color(tint) },
            uStrength: { value: strength },
          },
          vertexShader: `
            varying float vRadius;
            void main() {
              vRadius = length(position.xy);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uInner;
            uniform float uOuter;
            uniform vec3 uTint;
            uniform float uStrength;
            varying float vRadius;

            void main() {
              float t = clamp((vRadius - uInner) / (uOuter - uInner), 0.0, 1.0);
              float bands = 0.58 + 0.42 * sin(t * 46.0) * sin(t * 17.0 + 1.7);
              float fine = 0.72 + 0.28 * sin(t * 128.0 + 0.6);
              float cassini = smoothstep(0.0, 0.018, abs(t - 0.62));
              float encke = smoothstep(0.0, 0.008, abs(t - 0.88));
              float edge = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.93, t);
              float alpha = bands * fine * cassini * encke * edge * uStrength;
              vec3 color = mix(uTint * 0.72, uTint * 1.12, t);
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

      /* ---------------- planets ---------------- */
      type BuiltPlanet = {
        planet: OrreryPlanet;
        pivot: import("three").Group;
        spin: import("three").Object3D;
        clouds?: import("three").Object3D;
        radius: number;
        marker: import("three").Sprite;
      };

      const built: BuiltPlanet[] = [];
      const hitTargets: import("three").Object3D[] = [];

      /* ring marker for the selected body */
      const markerTexture = (() => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        if (context) {
          context.strokeStyle = "rgba(232, 232, 232, 0.95)";
          context.lineWidth = 2.5;
          context.beginPath();
          context.arc(64, 64, 47, 0, Math.PI * 2);
          context.stroke();
          const gradient = context.createRadialGradient(64, 64, 38, 64, 64, 64);
          gradient.addColorStop(0, "rgba(138, 138, 138, 0)");
          gradient.addColorStop(0.7, "rgba(160, 160, 160, 0.16)");
          gradient.addColorStop(1, "rgba(160, 160, 160, 0)");
          context.fillStyle = gradient;
          context.fillRect(0, 0, 128, 128);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      })();
      disposables.push(markerTexture);

      planets.forEach((planet) => {
        const radius = BODY_RADIUS[planet.slug] ?? 2;
        const pivot = new THREE.Group();
        const tilt = new THREE.Group();
        tilt.rotation.z =
          (Number.parseFloat(planet.axialTilt.replace("°", "")) * Math.PI) / 180;
        pivot.add(tilt);

        const texture = loader.load(planet.texture);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        disposables.push(texture);

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.94,
          metalness: 0,
        });
        const mesh = new THREE.Mesh(unitSphere, material);
        mesh.scale.setScalar(radius);
        mesh.rotation.y = Math.random() * Math.PI;
        tilt.add(mesh);
        disposables.push(material);

        let clouds: import("three").Object3D | undefined;
        if (planet.slug === "earth") {
          const cloudTexture = loader.load("/textures/2k_earth_clouds.jpg");
          cloudTexture.colorSpace = THREE.SRGBColorSpace;
          cloudTexture.anisotropy = maxAnisotropy;
          disposables.push(cloudTexture);
          const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            roughness: 1,
          });
          clouds = new THREE.Mesh(unitSphere, cloudMaterial);
          clouds.scale.setScalar(radius * 1.015);
          tilt.add(clouds);
          disposables.push(cloudMaterial);

          const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: { uColor: { value: new THREE.Color(0xa1a1a1) } },
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vView;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vView = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
              }
            `,
            fragmentShader: `
              uniform vec3 uColor;
              varying vec3 vNormal;
              varying vec3 vView;
              void main() {
                float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
                gl_FragColor = vec4(uColor, rim * 0.85);
              }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const atmosphere = new THREE.Mesh(unitSphere, atmosphereMaterial);
          atmosphere.scale.setScalar(radius * 1.09);
          tilt.add(atmosphere);
          disposables.push(atmosphereMaterial);
        }

        if (planet.ring === "saturn") {
          const inner = radius * 1.32;
          const outer = radius * 2.34;
          const ringGeometry = new THREE.RingGeometry(inner, outer, 160, 1);
          const ringMat = ringMaterial(inner, outer, 0xd4d4d4, 0.72);
          const ring = new THREE.Mesh(ringGeometry, ringMat);
          ring.rotation.x = -Math.PI / 2;
          tilt.add(ring);
          disposables.push(ringGeometry, ringMat);
        }

        if (planet.ring === "uranus") {
          const inner = radius * 1.55;
          const outer = radius * 1.95;
          const ringGeometry = new THREE.RingGeometry(inner, outer, 128, 1);
          const ringMat = ringMaterial(inner, outer, 0xd0d0d0, 0.3);
          const ring = new THREE.Mesh(ringGeometry, ringMat);
          ring.rotation.x = -Math.PI / 2;
          tilt.add(ring);
          disposables.push(ringGeometry, ringMat);
        }

        /* generous invisible hit area */
        const hitMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          colorWrite: false,
        });
        const hit = new THREE.Mesh(unitSphere, hitMaterial);
        hit.scale.setScalar(Math.max(radius * 1.8, 2.6));
        hit.userData.slug = planet.slug;
        pivot.add(hit);
        hitTargets.push(hit);
        disposables.push(hitMaterial);

        const marker = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: markerTexture,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        marker.scale.setScalar(radius * 4.2);
        marker.visible = false;
        marker.renderOrder = 3;
        pivot.add(marker);
        disposables.push(marker.material);

        scene.add(pivot);

        built.push({
          planet,
          pivot,
          spin: mesh,
          clouds,
          radius,
          marker,
        });
      });

      /* The Sun is a first-class pick target as well. */
      const sunHitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      });
      const sunHit = new THREE.Mesh(unitSphere, sunHitMaterial);
      sunHit.scale.setScalar(SUN_RADIUS * 1.35);
      sunHit.userData.slug = "sun";
      scene.add(sunHit);
      hitTargets.push(sunHit);
      disposables.push(sunHitMaterial);

      const sunMarker = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: markerTexture,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      sunMarker.scale.setScalar(SUN_RADIUS * 4.2);
      sunMarker.visible = false;
      sunMarker.renderOrder = 3;
      sunMarker.position.set(0, 0, 0);
      scene.add(sunMarker);
      disposables.push(sunMarker.material);

      /* ---------------- selection ---------------- */
      applySelectionRef.current = (slug: string) => {
        orbitLines.forEach((material, key) => {
          material.opacity = key === slug ? 0.62 : 0.26;
          material.color.setHex(key === slug ? 0xdcdcdc : 0xbdbdbd);
        });
        sunMarker.visible = slug === "sun";
        built.forEach((item) => {
          item.marker.visible = item.planet.slug === slug;
        });
      };
      applySelectionRef.current(selectedRef.current);

      /* ---------------- camera ---------------- */
      let azimuth = 0;
      let userAzimuth = 0;
      let elevation = 0.66;
      let cameraDistance = 170;
      let stageWidth = 0;
      let stageHeight = 0;
      let lastFitElevation = -10;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const fitPoint = new THREE.Vector3();
      const fitCamera = (width: number, height: number) => {
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        const cos = Math.cos(elevation);
        let distance = Math.max(cameraDistance, 60);
        let extentX = 0;
        let extentY = 0;
        /* Fit the projected outer orbit into the wide 16:9 frame. The
           horizontal and vertical budgets are measured separately so a
           shallow camera angle still fills the width of the stage. */
        for (let pass = 0; pass < 10; pass += 1) {
          camera.position.set(
            Math.sin(azimuth) * cos * distance,
            Math.sin(elevation) * distance,
            Math.cos(azimuth) * cos * distance,
          );
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          extentX = 0;
          extentY = 0;
          for (let i = 0; i < 48; i += 1) {
            const angle = (i / 48) * Math.PI * 2;
            fitPoint
              .set(
                Math.cos(angle) * (ORBIT_OUTER + 2),
                0,
                Math.sin(angle) * (ORBIT_OUTER + 2),
              )
              .project(camera);
            extentX = Math.max(extentX, Math.abs(fitPoint.x));
            extentY = Math.max(extentY, Math.abs(fitPoint.y));
          }
          const ratio = Math.max(extentX / 0.93, extentY / 0.9);
          if (Math.abs(ratio - 1) < 0.008) break;
          distance *= ratio;
        }
        cameraDistance = distance;
        lastFitElevation = elevation;
      };

      const placeCamera = () => {
        const cos = Math.cos(elevation);
        camera.position.set(
          Math.sin(azimuth) * cos * cameraDistance,
          Math.sin(elevation) * cameraDistance,
          Math.cos(azimuth) * cos * cameraDistance,
        );
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
      };

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        stageWidth = width;
        stageHeight = height;
        renderer.setSize(width, height, false);
        fitCamera(width, height);
        placeCamera();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      /* ---------------- interaction ---------------- */
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const canvas = renderer.domElement;
      let dragging = false;
      let pointerId: number | null = null;
      let lastX = 0;
      let lastY = 0;
      let travelled = 0;
      let hovered: string | null = null;

      const hitAt = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(hitTargets, false);
        return (hits[0]?.object.userData.slug as string | undefined) ?? null;
      };

      const setHovered = (slug: string | null) => {
        if (hovered === slug) return;
        hovered = slug;
        hoverRef.current = Boolean(slug);
        canvas.style.cursor = slug ? "pointer" : "grab";
        sunMarker.visible = selectedRef.current === "sun" || slug === "sun";
        built.forEach((item) => {
          item.marker.visible =
            item.planet.slug === selectedRef.current ||
            item.planet.slug === slug;
        });
      };

      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        pointerId = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        travelled = 0;
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = "grabbing";
      };

      const onPointerMove = (event: PointerEvent) => {
        if (dragging) {
          const dx = event.clientX - lastX;
          const dy = event.pointerType === "touch" ? 0 : event.clientY - lastY;
          lastX = event.clientX;
          lastY = event.clientY;
          travelled += Math.abs(dx) + Math.abs(dy);
          userAzimuth = Math.max(-0.62, Math.min(0.62, userAzimuth + dx * 0.005));
          elevation = Math.max(0.44, Math.min(0.98, elevation + dy * 0.003));
          return;
        }
        setHovered(hitAt(event.clientX, event.clientY));
      };

      const onPointerUp = (event: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = hovered ? "pointer" : "grab";
        if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
          canvas.releasePointerCapture(pointerId);
        }
        pointerId = null;
        if (travelled < 7) {
          const slug = hitAt(event.clientX, event.clientY);
          if (slug) onPickRef.current(slug);
        }
      };

      const onPointerLeave = () => {
        setHovered(null);
        if (!dragging) canvas.style.cursor = "grab";
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerLeave);

      /* ---------------- simulation ---------------- */
      let simDays = (Date.now() - J2000_MS) / DAY_MS;
      resetRef.current = () => {
        simDays = (Date.now() - J2000_MS) / DAY_MS;
      };

      let frame = 0;
      let last = performance.now();

      const update = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        if (modeRef.current === "live") {
          simDays = (Date.now() - J2000_MS) / DAY_MS;
        } else if (modeRef.current === "play" && !reduced) {
          simDays += dt * (EARTH_YEAR_DAYS / 40) * speedRef.current;
        }

        /* gentle idle drift so the depth reads even before you touch it,
           while a drag keeps the angle the visitor chose */
        const idle = reduced ? 0 : Math.sin(now * 0.00009) * 0.022;
        const targetAzimuth = userAzimuth + idle;
        azimuth += (targetAzimuth - azimuth) * 0.06;
        if (
          stageWidth &&
          stageHeight &&
          Math.abs(elevation - lastFitElevation) > 0.0005
        ) {
          fitCamera(stageWidth, stageHeight);
        }
        placeCamera();

        const days = simDays;

        built.forEach((item) => {
          const orbit = orbitRadius(item.planet.distanceAu);
          const angle =
            ((item.planet.startAngle ?? 0) + (days / item.planet.periodDays) * 360) *
            (Math.PI / 180);
          item.pivot.position.set(
            Math.cos(angle) * orbit,
            0,
            Math.sin(angle) * orbit,
          );
          item.spin.rotation.y += dt * (Math.PI * 2) / Math.max(item.planet.spin, 1);
          if (item.clouds) {
            item.clouds.rotation.y += dt * (Math.PI * 2) / Math.max(item.planet.spin * 1.4, 1);
          }
          if (item.marker.visible) {
            const pulse = 1 + Math.sin(now * 0.003) * 0.06;
            item.marker.scale.setScalar(item.radius * 4.2 * pulse);
          }
        });

        sun.rotation.y += dt * 0.012;
        coronaMaterial.uniforms.uTime.value = now * 0.001;
        corona.quaternion.copy(camera.quaternion);

        /* real-time arc: sweep from perihelion to Earth's current angle */
        const earthPhase =
          (((days - perihelionDays) / EARTH_YEAR_DAYS) % 1 + 1) % 1;
        const sweep = earthPhase * Math.PI * 2;
        for (let i = 0; i <= arcSegments; i += 1) {
          const angle = perihelionAngle + (i / arcSegments) * sweep;
          arcPositions[i * 3] = Math.cos(angle) * earthOrbit;
          arcPositions[i * 3 + 1] = 0.03;
          arcPositions[i * 3 + 2] = Math.sin(angle) * earthOrbit;
        }
        arcGeometry.attributes.position.needsUpdate = true;
        arcGeometry.computeBoundingSphere();

        if (sunMarker.visible) {
          const pulse = 1 + Math.sin(now * 0.003) * 0.06;
          sunMarker.scale.setScalar(SUN_RADIUS * 4.2 * pulse);
        }

        /* clock */
        if (clockRef.current) {
          const date = new Date(J2000_MS + days * DAY_MS);
          clockRef.current.textContent =
            modeRef.current === "live"
              ? `${dateFormatter.format(date)} · ${clockFormatter.format(date)} UTC`
              : dateFormatter.format(date);
        }

        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(update);
      };

      setReady(true);
      frame = window.requestAnimationFrame(update);

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        renderer.dispose();
        disposables.forEach((item) => item.dispose());
        canvas.remove();
      };
    })().catch(() => {
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [planets]);

  const handlePause = useCallback(() => {
    setMode((value) => {
      if (value === "paused") return previousModeRef.current;
      previousModeRef.current = value;
      return "paused";
    });
  }, []);

  const handleSpeed = useCallback((value: number) => {
    setSpeed(value);
    setMode("play");
  }, []);

  const handleLive = useCallback(() => {
    setMode("live");
  }, []);

  const handleReset = useCallback(() => {
    setSpeed(2);
    setMode("play");
    resetRef.current();
  }, []);

  return (
    <div className="orrery-shell">
      <div className="orrery-toolbar">
        <div
          className={`sim-clock${mode === "paused" ? " is-paused" : ""}${mode === "live" ? " is-live" : ""}`}
        >
          <span className="sim-pulse" aria-hidden="true" />
          <span ref={clockRef} className="sim-time">
            Today
          </span>
          <span className="sim-epoch">
            {mode === "live"
              ? "Real-time rate"
              : mode === "paused"
                ? "Paused"
                : `×${speed} · 1 yr = ${Math.round(40 / speed)} s`}
          </span>
        </div>
        <div className="orrery-controls">
          <button
            type="button"
            className="control-button play-button"
            onClick={handlePause}
            aria-label={mode === "paused" ? "Resume the orbits" : "Pause the orbits"}
          >
            <span aria-hidden="true">{mode === "paused" ? "▶" : "❚❚"}</span>
            {mode === "paused" ? "Play" : "Pause"}
          </button>
          <div className="speed-group" role="group" aria-label="Simulation speed">
            {SPEEDS.map((value) => (
              <button
                type="button"
                key={value}
                className={`speed-button${mode === "play" && speed === value ? " active" : ""}`}
                onClick={() => handleSpeed(value)}
                aria-pressed={mode === "play" && speed === value}
                aria-label={`Set simulation speed to ${value} times`}
              >
                ×{value}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`control-button live-button${mode === "live" ? " is-live" : ""}`}
            onClick={handleLive}
            aria-pressed={mode === "live"}
            aria-label="Show Earth at its true position and run the planets at the real rate"
          >
            <span className="live-dot" aria-hidden="true" />
            Real time
          </button>
          <button
            type="button"
            className="control-button"
            onClick={handleReset}
            aria-label="Reset the simulation to today's positions"
          >
            ↺<span className="control-word">Today</span>
          </button>
        </div>
      </div>

      <div
        className={`orrery-stage${ready ? " is-ready" : ""}${failed ? " has-failed" : ""}`}
        ref={stageRef}
        role="group"
        aria-label="Interactive three-dimensional model of the Solar System. Drag to orbit the camera, and choose a planet to open its dossier."
      >
        <div className="orrery-canvas-mount" ref={mountRef} />
        <span className="stage-hint" aria-hidden="true">
          Drag to orbit · Click a world
        </span>
        {!ready && !failed && (
          <div className="orrery-loading" aria-hidden="true">
            <span className="orrery-loading-star" />
            Charting the Solar System…
          </div>
        )}
        {failed && (
          <div className="orrery-fallback">
            <p>This browser could not open the 3D view.</p>
            <p>Use the planet list below to open a world&rsquo;s dossier.</p>
          </div>
        )}
      </div>

      <div className="earth-live">
        <div className="earth-live-head">
          <p className="earth-live-kicker">
            <span className="live-dot" aria-hidden="true" />
            Earth · live now
          </p>
          <p className="earth-live-date">
            <span ref={liveDateRef} />
          </p>
        </div>
        <div className="earth-live-track" aria-hidden="true">
          <span ref={liveBarRef} className="earth-live-fill" />
          <span ref={liveMarkerRef} className="earth-live-marker" />
        </div>
        <dl className="earth-live-stats">
          <div>
            <dt>Orbit phase</dt>
            <dd ref={livePhaseRef}>—</dd>
          </div>
          <div>
            <dt>Distance from the Sun</dt>
            <dd ref={liveDistanceRef}>—</dd>
          </div>
          <div>
            <dt>Orbital speed</dt>
            <dd>29.78 km/s</dd>
          </div>
          <div>
            <dt>Travelled since you arrived</dt>
            <dd ref={liveTravelRef}>—</dd>
          </div>
        </dl>
        <p className="earth-live-note">
          Earth carries you 2.57 million km around the Sun every day. The
          silver arc on its orbit traces the year since perihelion. The map
          opens at ×2 — press <strong>Real time</strong> to lock every world to
          this exact moment.
        </p>
      </div>

      <div className="orrery-footer">
        <p className="orbit-caption">
          Orbital periods keep their true ratios; distances are square-root
          compressed so Neptune stays in frame. The map opens at ×2, a step
          ahead of today&rsquo;s true positions. Drag to look around.
        </p>
        <div className="planet-picker" role="group" aria-label="Jump to a world">
          <button
            type="button"
            className={`picker-button${selectedSlug === "sun" ? " active" : ""}`}
            onClick={() => onPick("sun")}
            aria-pressed={selectedSlug === "sun"}
          >
            <span
              className="picker-dot"
              style={{ background: "rgba(236, 236, 236, 0.85)" }}
              aria-hidden="true"
            />
            Sun
          </button>
          {planets.map((planet) => (
            <button
              type="button"
              key={planet.slug}
              className={`picker-button${selectedSlug === planet.slug ? " active" : ""}`}
              onClick={() => onPick(planet.slug)}
              aria-pressed={selectedSlug === planet.slug}
            >
              <span
                className="picker-dot"
                style={{ background: planet.accent }}
                aria-hidden="true"
              />
              {planet.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
