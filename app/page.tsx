"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import Orrery3D from "./orrery-3d";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Planet = {
  name: string;
  slug: string;
  type: string;
  tagline: string;
  description: string;
  highlight: string;
  funFact: string;
  distanceAu: number;
  distanceKm: string;
  periodDays: number;
  periodLabel: string;
  diameterKm: string;
  dayLength: string;
  moons: string;
  gravity: string;
  temp: string;
  axialTilt: string;
  atmosphere: string;
  science: string;
  accent: string;
  texture: string;
  spin: number;
  dot: number;
  orbit: number;
  startAngle: number;
  ring?: "saturn" | "uranus";
};

const EARTH_YEAR_DAYS = 365.256;

/* Orbit radii use a square-root compression of the real semi-major axes so
   the outer planets remain visible. Orbital periods — and therefore the
   relative speed of every planet — are exact. Start angles are the J2000
   mean heliocentric longitudes. */
const PLANETS: Planet[] = [
  {
    name: "Mercury",
    slug: "mercury",
    type: "Terrestrial planet",
    tagline: "The swift, scorched world closest to the Sun.",
    description:
      "Mercury is the smallest planet and the nearest to the Sun. Its airless, cratered surface swings between blistering day and bitter night, while a huge iron core makes it surprisingly dense.",
    highlight:
      "One solar day on Mercury lasts about 176 Earth days — two Mercury years.",
    funFact:
      "Mercury is shrinking. As its iron core cools, the crust has wrinkled into cliff-like scarps hundreds of kilometres long.",
    distanceAu: 0.387,
    distanceKm: "57.9 million km",
    periodDays: 87.969,
    periodLabel: "88 days",
    diameterKm: "4,879",
    dayLength: "58.6 Earth days",
    moons: "None",
    gravity: "3.7 m/s²",
    temp: "−173 to 427 °C",
    axialTilt: "0.03°",
    atmosphere:
      "A thin exosphere of oxygen, sodium, hydrogen, helium and potassium.",
    science:
      "MESSENGER mapped the planet and found water ice hiding in permanently shadowed polar craters, likely delivered by comets and asteroids.",
    accent: "rgba(202, 180, 154, 0.45)",
    texture: "/textures/2k_mercury.jpg",
    spin: 58,
    dot: 1.35,
    orbit: 9,
    startAngle: 252.25,
  },
  {
    name: "Venus",
    slug: "venus",
    type: "Terrestrial planet",
    tagline: "Earth's twin in size, a furnace in reality.",
    description:
      "Venus is wrapped in a dense carbon-dioxide atmosphere and bright clouds of sulfuric acid. A runaway greenhouse effect keeps its surface hot enough to melt lead, even though it receives less sunlight than Mercury.",
    highlight:
      "Venus spins backwards, and one day is longer than its entire year.",
    funFact:
      "Venus is the brightest planet in our sky — bright enough to cast a faint shadow on Earth at night.",
    distanceAu: 0.723,
    distanceKm: "108.2 million km",
    periodDays: 224.701,
    periodLabel: "224.7 days",
    diameterKm: "12,104",
    dayLength: "243 Earth days (retrograde)",
    moons: "None",
    gravity: "8.87 m/s²",
    temp: "465 °C (mean)",
    axialTilt: "177.36°",
    atmosphere:
      "96.5% carbon dioxide, 3.5% nitrogen, with clouds of sulfuric acid.",
    science:
      "Venus is a natural laboratory for runaway greenhouse warming. Its surface pressure is about 92 times Earth's — equivalent to 900 m underwater on Earth.",
    accent: "rgba(245, 198, 122, 0.5)",
    texture: "/textures/2k_venus_atmosphere.jpg",
    spin: 82,
    dot: 1.8,
    orbit: 10.78,
    startAngle: 181.98,
  },
  {
    name: "Earth",
    slug: "earth",
    type: "Terrestrial planet",
    tagline: "The only world we know to host life.",
    description:
      "Earth sits in the Sun's habitable zone, with liquid water on its surface, a protective magnetic field and an atmosphere rich in nitrogen and oxygen. Its climate and geology have been shaped by life for billions of years.",
    highlight: "About 71% of Earth's surface is covered by ocean.",
    funFact:
      "Earth bulges at the equator, so the summit of Chimborazo in Ecuador is the point farthest from the planet's centre.",
    distanceAu: 1,
    distanceKm: "149.6 million km",
    periodDays: 365.256,
    periodLabel: "365.26 days",
    diameterKm: "12,742",
    dayLength: "23 h 56 m 4 s",
    moons: "1 (the Moon)",
    gravity: "9.81 m/s²",
    temp: "15 °C (mean)",
    axialTilt: "23.44°",
    atmosphere:
      "78% nitrogen, 21% oxygen, 0.9% argon and 0.04% carbon dioxide.",
    science:
      "Earth's magnetic field and ozone layer shield the biosphere from charged particles and ultraviolet radiation — two reasons our planet remains habitable.",
    accent: "rgba(110, 180, 255, 0.6)",
    texture: "/textures/2k_earth_daymap.jpg",
    spin: 34,
    dot: 1.95,
    orbit: 11.96,
    startAngle: 100.46,
  },
  {
    name: "Mars",
    slug: "mars",
    type: "Terrestrial planet",
    tagline: "A cold desert world that once ran with water.",
    description:
      "Mars is a dusty, iron-rich world with a thin atmosphere, ancient river valleys and the largest volcano in the Solar System. Its polar caps hold water ice and frozen carbon dioxide.",
    highlight:
      "Olympus Mons rises about 22 km — nearly three times the height of Everest.",
    funFact:
      "Olympus Mons is so broad that its slopes average only about 5°, gentle enough to walk up without climbing gear.",
    distanceAu: 1.524,
    distanceKm: "227.9 million km",
    periodDays: 686.98,
    periodLabel: "687 days",
    diameterKm: "6,779",
    dayLength: "24 h 37 m",
    moons: "2 (Phobos, Deimos)",
    gravity: "3.71 m/s²",
    temp: "−63 °C (mean)",
    axialTilt: "25.19°",
    atmosphere:
      "95% carbon dioxide, 2.8% nitrogen, 2% argon and traces of oxygen.",
    science:
      "Orbiters and rovers have found ancient riverbeds, clay minerals and subsurface ice. Mars is a prime target in the search for past life.",
    accent: "rgba(235, 122, 86, 0.55)",
    texture: "/textures/2k_mars.jpg",
    spin: 36,
    dot: 1.55,
    orbit: 13.79,
    startAngle: 355.45,
  },
  {
    name: "Jupiter",
    slug: "jupiter",
    type: "Gas giant",
    tagline: "The giant that shapes the outer Solar System.",
    description:
      "Jupiter is more massive than all the other planets combined. Its banded clouds are drawn into powerful storms, and its gravity has shaped the orbits of asteroids and comets for billions of years.",
    highlight: "The Great Red Spot is a storm wider than the whole Earth.",
    funFact:
      "Jupiter spins so quickly that a day lasts under ten hours, visibly flattening the planet at its poles.",
    distanceAu: 5.203,
    distanceKm: "778.5 million km",
    periodDays: 4_332.59,
    periodLabel: "11.86 years",
    diameterKm: "139,820",
    dayLength: "9 h 56 m",
    moons: "95 confirmed",
    gravity: "24.79 m/s²",
    temp: "−108 °C (cloud tops)",
    axialTilt: "3.13°",
    atmosphere:
      "About 90% hydrogen and 10% helium, with traces of methane and ammonia.",
    science:
      "Jupiter's moon Europa hides a global salt-water ocean beneath its icy crust. Tidal heating from Jupiter keeps that ocean liquid — a leading target in astrobiology.",
    accent: "rgba(226, 181, 132, 0.45)",
    texture: "/textures/2k_jupiter.jpg",
    spin: 22,
    dot: 3.3,
    orbit: 21.97,
    startAngle: 34.4,
  },
  {
    name: "Saturn",
    slug: "saturn",
    type: "Gas giant",
    tagline: "A ringed giant, less dense than water.",
    description:
      "Saturn is a hydrogen-and-helium giant encircled by a broad system of rings made mostly of water ice. Its low density means the planet would float in a sufficiently large ocean.",
    highlight:
      "Saturn's rings span about 282,000 km but are mostly under a kilometre thick.",
    funFact:
      "A six-sided jet stream wider than Earth sits over Saturn's north pole — a stable storm that has persisted for decades.",
    distanceAu: 9.537,
    distanceKm: "1.43 billion km",
    periodDays: 10_759.22,
    periodLabel: "29.46 years",
    diameterKm: "116,460",
    dayLength: "10 h 42 m",
    moons: "274 confirmed",
    gravity: "10.44 m/s²",
    temp: "−139 °C (cloud tops)",
    axialTilt: "26.73°",
    atmosphere:
      "About 96% hydrogen and 3% helium, with traces of methane and ammonia.",
    science:
      "Enceladus vents plumes of water vapour and organic molecules from a subsurface ocean, making this small moon one of astrobiology's most exciting destinations.",
    accent: "rgba(236, 214, 160, 0.45)",
    texture: "/textures/2k_saturn.jpg",
    spin: 24,
    dot: 2.9,
    orbit: 28.28,
    startAngle: 49.94,
    ring: "saturn",
  },
  {
    name: "Uranus",
    slug: "uranus",
    type: "Ice giant",
    tagline: "The ice giant that rolls on its side.",
    description:
      "Uranus is a cold world of hydrogen, helium and methane, with a mantle of water, ammonia and methane ices. Its axis is tilted by about 98°, so it appears to roll around the Sun.",
    highlight:
      "Each pole spends about 42 Earth years in continuous sunlight, then 42 in darkness.",
    funFact:
      "Uranus holds the record for the coldest planetary atmosphere — about −224 °C, colder than more distant Neptune.",
    distanceAu: 19.191,
    distanceKm: "2.87 billion km",
    periodDays: 30_688.5,
    periodLabel: "84.0 years",
    diameterKm: "50,724",
    dayLength: "17 h 14 m (retrograde)",
    moons: "28 confirmed",
    gravity: "8.69 m/s²",
    temp: "−195 °C (cloud tops)",
    axialTilt: "97.77°",
    atmosphere:
      "About 83% hydrogen, 15% helium and 2% methane, which gives its blue-green colour.",
    science:
      "Uranus has 13 known rings and 28 moons. Its extreme tilt may be the result of a giant impact early in its history — one reason planetary scientists want to return with an orbiter.",
    accent: "rgba(128, 225, 225, 0.5)",
    texture: "/textures/2k_uranus.jpg",
    spin: 30,
    dot: 2.3,
    orbit: 38.39,
    startAngle: 313.23,
    ring: "uranus",
  },
  {
    name: "Neptune",
    slug: "neptune",
    type: "Ice giant",
    tagline: "The windiest world in the Solar System.",
    description:
      "Neptune is the most distant major planet, a deep blue ice giant with supersonic winds and dark storms. It was the first planet found by mathematical prediction rather than by chance observation.",
    highlight: "Winds on Neptune can exceed 2,000 km/h.",
    funFact:
      "Neptune has completed just one orbit of the Sun since its discovery in 1846 — it finished the lap in 2011.",
    distanceAu: 30.07,
    distanceKm: "4.5 billion km",
    periodDays: 60_182,
    periodLabel: "164.8 years",
    diameterKm: "49,244",
    dayLength: "16 h 6 m",
    moons: "16 confirmed",
    gravity: "11.15 m/s²",
    temp: "−201 °C (cloud tops)",
    axialTilt: "28.32°",
    atmosphere:
      "About 80% hydrogen, 19% helium and 1.5% methane, with high-altitude clouds.",
    science:
      "Neptune's largest moon, Triton, orbits backwards and may be a captured Kuiper Belt object. Its surface shows nitrogen geysers — evidence of active geology far from the Sun.",
    accent: "rgba(108, 150, 255, 0.55)",
    texture: "/textures/2k_neptune.jpg",
    spin: 28,
    dot: 2.2,
    orbit: 47,
    startAngle: 304.88,
  },
];

const SUN: Planet = {
  name: "Sun",
  slug: "sun",
  type: "G-type main-sequence star",
  tagline: "The star that holds every orbit in place.",
  description:
    "The Sun is a middle-aged yellow dwarf, about 4.6 billion years old and holding 99.86% of the Solar System's mass. In its core, roughly 600 million tonnes of hydrogen fuse into helium every second — the reaction that lights eight worlds and makes life on Earth possible.",
  highlight:
    "Light leaves the Sun's surface and reaches Earth in 8 minutes 20 seconds.",
  funFact:
    "A photon born in the Sun's core can take 100,000 years to escape to the surface — then only 8 minutes to reach Earth.",
  distanceAu: 0,
  distanceKm: "149.6 million km from Earth",
  periodDays: 0,
  periodLabel: "~230 million years (galactic orbit)",
  diameterKm: "1,391,400",
  dayLength: "25.4 Earth days at the equator",
  moons: "8 planets",
  gravity: "274 m/s²",
  temp: "5,505 °C surface · 15 million °C core",
  axialTilt: "7.25°",
  atmosphere: "Hydrogen 73%, helium 25%, trace metals",
  science:
    "The Sun's magnetic field reverses roughly every 11 years, driving sunspot cycles, solar flares and coronal mass ejections. The Parker Solar Probe has flown inside the corona to study how the solar wind is born.",
  accent: "rgba(255, 196, 110, 0.6)",
  texture: "/textures/2k_sun.jpg",
  spin: 40,
  dot: 4,
  orbit: 0,
  startAngle: 0,
};

const BODIES: Planet[] = [SUN, ...PLANETS];

/* A faint tint per body for the ambient glow behind the dossier. */
const TINTS: Record<string, string> = {
  sun: "255, 214, 150",
  mercury: "170, 160, 150",
  venus: "224, 200, 150",
  earth: "110, 160, 220",
  mars: "214, 120, 92",
  jupiter: "206, 176, 132",
  saturn: "226, 208, 156",
  uranus: "150, 208, 214",
  neptune: "110, 142, 214",
};

const SCIENCE_FIELDS = [
  {
    index: "01",
    tag: "Observing the sky",
    title: "Astronomy",
    text: "Astronomy is the observational study of everything beyond Earth: planets, stars, galaxies and the space between them. It asks what is out there, how it moves, and how far away it is.",
    points: [
      "Telescopes read optical, radio, infrared, ultraviolet, X-ray and gamma-ray light.",
      "Parallax and standard candles turn brightness into distance.",
      "Sky surveys map billions of objects and catch events as they happen.",
    ],
    question: "What is out there, and where?",
  },
  {
    index: "02",
    tag: "The physics of the cosmos",
    title: "Astrophysics",
    text: "Astrophysics applies physics to celestial objects. Spectroscopy reveals what stars are made of, while gravity and nuclear physics explain how they are born, shine, collapse and die.",
    points: [
      "Stars forge heavier elements in their cores and spread them through supernovae.",
      "General relativity describes black holes, gravitational lensing and spacetime.",
      "Gravitational-wave detectors now listen to colliding black holes and neutron stars.",
    ],
    question: "How does the universe work?",
  },
  {
    index: "03",
    tag: "Life beyond Earth",
    title: "Astrobiology",
    text: "Astrobiology studies the conditions for life in the universe. It brings together biology, chemistry, planetary science and astronomy to ask where life could arise — and how we might recognise it.",
    points: [
      "The habitable zone is the range where liquid water can exist on a planet's surface.",
      "Ocean worlds such as Europa and Enceladus may hold liquid water beneath ice.",
      "Biosignatures are chemical fingerprints that could reveal life in an atmosphere.",
    ],
    question: "Are we alone?",
  },
];

const TIMELINE = [
  {
    time: "10⁻⁴³ s",
    title: "The Planck era",
    body: "The known laws of physics break down at the first instant. Space, time, matter and energy are inseparable, and quantum gravity is needed to describe them.",
  },
  {
    time: "10⁻³² s",
    title: "Inflation",
    body: "A brief, extreme expansion stretches space by a huge factor. It helps explain why the universe looks so smooth and why its temperature fluctuations are so small.",
  },
  {
    time: "3 minutes",
    title: "The first nuclei",
    body: "The universe cools enough for protons and neutrons to combine. Hydrogen, helium and a trace of lithium form in the ratios we still observe today.",
  },
  {
    time: "380,000 years",
    title: "Light escapes",
    body: "Electrons combine with nuclei, and the universe becomes transparent. The released light survives as the cosmic microwave background, now cooled to 2.725 K.",
  },
  {
    time: "~200 million years",
    title: "The first stars",
    body: "Gravity pulls gas into the first stars. Their ultraviolet light reionises the universe, and their deaths seed space with the first heavy elements.",
  },
  {
    time: "9.2 billion years",
    title: "Our Solar System",
    body: "A cloud of gas and dust collapses in an outer arm of the Milky Way. The Sun ignites, and planets form from the disk of debris around it.",
  },
  {
    time: "13.8 billion years",
    title: "Today",
    body: "The universe is still expanding, still forming stars, and still full of unanswered questions. You are here, on a planet orbiting an ordinary star.",
  },
];

const COSMOLOGY_CARDS = [
  {
    n: "01",
    title: "Expansion, not an explosion",
    body: "The Big Bang was not an explosion into empty space. It was the expansion of space itself. Every region of the universe is moving away from every other on the largest scales.",
  },
  {
    n: "02",
    title: "Redshift is a ruler",
    body: "Light from receding galaxies is stretched toward longer wavelengths. Hubble's law links recession speed to distance, giving astronomers a way to measure the size and age of the cosmos.",
  },
  {
    n: "03",
    title: "An ancient afterglow",
    body: "The cosmic microwave background is a snapshot of the universe at 380,000 years old. Its tiny temperature ripples record the seeds of every galaxy and cluster.",
  },
  {
    n: "04",
    title: "The dark majority",
    body: "Around 68% of the universe is dark energy, 27% is dark matter, and only about 5% is ordinary matter. We infer the dark parts from their gravity and their effect on expansion.",
  },
  {
    n: "05",
    title: "Gravity builds structure",
    body: "Dark matter forms a cosmic web. Gas falls into its filaments, stars ignite, galaxies collide and merge. Gravity turns nearly uniform matter into the structure we see.",
  },
  {
    n: "06",
    title: "Light is a time machine",
    body: "The farther away a galaxy is, the older its light is when it reaches us. Looking deep into space means looking back in time — almost to the edge of the observable universe.",
  },
];

const WONDERS = [
  {
    tag: "Gravity at its limit",
    title: "Black holes",
    body: "A black hole is a region where gravity is so strong that not even light can escape. The Milky Way's centre hosts Sagittarius A*, about 4.3 million times the mass of the Sun.",
    stat: "4.3 million M☉",
    statLabel: "Sagittarius A*",
  },
  {
    tag: "Stellar remnants",
    title: "Neutron stars",
    body: "A neutron star packs more than the mass of the Sun into a city-sized sphere. Some spin hundreds of times a second and sweep beams of radiation across space as pulsars.",
    stat: "~20 km",
    statLabel: "typical diameter",
  },
  {
    tag: "Worlds beyond",
    title: "Exoplanets",
    body: "More than 5,900 planets have been confirmed around other stars. They range from scorching gas giants to small rocky worlds, and some orbit in their star's habitable zone.",
    stat: "5,900+",
    statLabel: "confirmed worlds",
  },
  {
    tag: "Hidden oceans",
    title: "Ocean worlds",
    body: "Europa, Enceladus and Titan may hold more liquid water than Earth. Future missions will search their ice shells and plumes for chemistry that could support life.",
    stat: "3",
    statLabel: "prime candidates",
  },
  {
    tag: "Ripples in spacetime",
    title: "Gravitational waves",
    body: "Accelerating masses send ripples through spacetime. LIGO detected the first one in 2015 from two merging black holes, opening an entirely new way to observe the universe.",
    stat: "2015",
    statLabel: "first direct detection",
  },
  {
    tag: "Still unresolved",
    title: "Open questions",
    body: "What is dark matter? Why is expansion accelerating? How does quantum mechanics fit with gravity? How did life begin? These are some of the deepest questions in modern science.",
    stat: "?",
    statLabel: "the next discovery",
  },
];

const SCALE = [
  {
    value: "384,400 km",
    label: "Earth to the Moon",
    note: "Light takes 1.28 seconds",
    width: 10,
  },
  {
    value: "1 AU",
    label: "Earth to the Sun",
    note: "149.6 million km · sunlight takes 8 min 20 s",
    width: 18,
  },
  {
    value: "4.2 light-hours",
    label: "Sun to Neptune",
    note: "A planetary realm about 60 AU across",
    width: 26,
  },
  {
    value: "4.24 light-years",
    label: "Proxima Centauri",
    note: "The nearest star beyond the Sun",
    width: 40,
  },
  {
    value: "100,000 light-years",
    label: "The Milky Way",
    note: "Home to 100–400 billion stars",
    width: 64,
  },
  {
    value: "2.5 million light-years",
    label: "Andromeda",
    note: "The nearest large spiral galaxy",
    width: 78,
  },
  {
    value: "93 billion light-years",
    label: "Observable universe",
    note: "The farthest light that has reached us",
    width: 100,
  },
];

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

/* ------------------------------------------------------------------ */
/*  Background: stars, dust, nebulae, meteors                          */
/* ------------------------------------------------------------------ */

function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    type Star = {
      x: number;
      y: number;
      r: number;
      phase: number;
      twinkle: number;
      drift: number;
      depth: number;
      tint: number;
      bright: boolean;
    };
    type Dust = {
      x: number;
      y: number;
      r: number;
      alpha: number;
      drift: number;
      hue: string;
    };
    type Meteor = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
    };

    let width = 0;
    let height = 0;
    let frame = 0;
    let time = 0;
    let stars: Star[] = [];
    let dust: Dust[] = [];
    let meteors: Meteor[] = [];
    let nextMeteor = 4;
    let targetX = 0;
    let targetY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let vigour = 1;

    const makeGlow = (color: string) => {
      const sprite = document.createElement("canvas");
      sprite.width = 128;
      sprite.height = 128;
      const spriteCtx = sprite.getContext("2d");
      if (spriteCtx) {
        const gradient = spriteCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, `rgba(${color},0.72)`);
        gradient.addColorStop(0.24, `rgba(${color},0.3)`);
        gradient.addColorStop(0.58, `rgba(${color},0.08)`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        spriteCtx.fillStyle = gradient;
        spriteCtx.fillRect(0, 0, 128, 128);
      }
      return sprite;
    };

    const sprite = makeGlow("255, 255, 255");
    const dustSprites: Record<string, HTMLCanvasElement> = {
      "109, 109, 109": makeGlow("109, 109, 109"),
      "83, 83, 83": makeGlow("83, 83, 83"),
      "132, 132, 132": makeGlow("132, 132, 132"),
    };

    const makeStars = () => {
      const count = width < 700 ? 380 : 760;
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.25 + 0.18,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.35 + Math.random() * 1.7,
        drift: (Math.random() - 0.5) * 0.012,
        depth: 0.15 + Math.random() * 0.85,
        tint: Math.random(),
        bright: Math.random() > 0.925,
      }));
      const dustCount = width < 700 ? 30 : 58;
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 12 + Math.random() * 58,
        alpha: 0.035 + Math.random() * 0.07,
        drift: (Math.random() - 0.5) * 0.008,
        hue:
          Math.random() > 0.5
            ? "109, 109, 109"
            : Math.random() > 0.4
              ? "83, 83, 83"
              : "132, 132, 132",
      }));
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      makeStars();
    };

    const drawStar = (star: Star, index: number) => {
      const scroll = window.scrollY || 0;
      const baseX =
        (((star.x * width + time * star.drift * width) % width) + width) %
        width;
      const baseY =
        ((((star.y * height + scroll * 0.035 * star.depth) %
          height) +
          height) %
          height);
      /* The field leans away from the cursor; nearer stars travel further,
         and the whole drift quickens while the pointer is moving. */
      let x = baseX + offsetX * 170 * star.depth * vigour;
      let y = baseY + offsetY * 124 * star.depth * vigour;

      /* Stars part around the pointer, like a small gravity well. */
      const dx = x - cursorX;
      const dy = y - cursorY;
      const dist2 = dx * dx + dy * dy;
      const wellRadius = 235;
      let near = 0;
      if (dist2 < wellRadius * wellRadius) {
        const dist = Math.sqrt(dist2) || 0.001;
        near = 1 - dist / wellRadius;
        const push = near * near * 30 * (0.35 + star.depth);
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      }
      const pulse = reduced
        ? 0.78
        : 0.5 + 0.5 * Math.sin(time * star.twinkle + star.phase);
      const alpha = Math.min(1, (0.22 + pulse * 0.72) * (1 + near * 0.45));
      const color =
        star.tint > 0.88
          ? "209, 209, 209"
          : star.tint < 0.13
            ? "206, 206, 206"
            : star.tint > 0.5 && star.tint < 0.56
              ? "228, 228, 228"
              : "247, 247, 247";

      context.globalAlpha = alpha;
      context.fillStyle = `rgb(${color})`;
      context.beginPath();
      context.arc(x, y, star.r, 0, Math.PI * 2);
      context.fill();

      if (star.bright) {
        context.globalAlpha = alpha * 0.5;
        context.strokeStyle = `rgb(${color})`;
        context.lineWidth = 0.55;
        context.beginPath();
        context.moveTo(x - 4.5, y);
        context.lineTo(x + 4.5, y);
        context.moveTo(x, y - 4.5);
        context.lineTo(x, y + 4.5);
        context.stroke();
      }

      if (index % 5 === 0 && star.bright) {
        context.globalAlpha = alpha * 0.22;
        context.drawImage(sprite, x - 11, y - 11, 22, 22);
      }
    };

    const drawMeteor = (meteor: Meteor) => {
      const fade = Math.min(1, meteor.life / 0.5) * Math.min(1, meteor.max - meteor.life);
      if (fade <= 0) return;
      const tail = 92 + meteor.life * 16;
      const nx = meteor.vx / Math.hypot(meteor.vx, meteor.vy);
      const ny = meteor.vy / Math.hypot(meteor.vx, meteor.vy);
      const gradient = context.createLinearGradient(
        meteor.x,
        meteor.y,
        meteor.x - nx * tail,
        meteor.y - ny * tail,
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.85 * fade})`);
      gradient.addColorStop(0.18, `rgba(200, 200, 200, ${0.45 * fade})`);
      gradient.addColorStop(1, "rgba(157, 157, 157, 0)");
      context.strokeStyle = gradient;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(meteor.x, meteor.y);
      context.lineTo(meteor.x - nx * tail, meteor.y - ny * tail);
      context.stroke();
      context.fillStyle = `rgba(255, 255, 255, ${0.9 * fade})`;
      context.beginPath();
      context.arc(meteor.x, meteor.y, 1.7, 0, Math.PI * 2);
      context.fill();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      /* Where the pointer sits, in canvas pixels. */
      cursorX = (offsetX + 0.5) * width;
      cursorY = (offsetY + 0.5) * height;

      dust.forEach((particle) => {
        const baseX =
          (((particle.x * width + time * particle.drift * width) % width) +
            width) %
          width;
        const baseY =
          ((((particle.y * height +
            (window.scrollY || 0) * 0.012) %
            height) +
            height) %
            height);
        let x = baseX + offsetX * 74 * vigour;
        let y = baseY + offsetY * 54 * vigour;

        /* Dust drifts around the pointer on a wider, softer radius. */
        const ddx = x - cursorX;
        const ddy = y - cursorY;
        const ddist2 = ddx * ddx + ddy * ddy;
        const wellRadius = 330;
        let near = 0;
        if (ddist2 < wellRadius * wellRadius) {
          const dist = Math.sqrt(ddist2) || 0.001;
          near = 1 - dist / wellRadius;
          const push = near * near * 44;
          x += (ddx / dist) * push;
          y += (ddy / dist) * push;
        }
        context.globalAlpha = Math.min(0.16, particle.alpha * (1 + near * 0.7));
        context.drawImage(
          dustSprites[particle.hue],
          x - particle.r,
          y - particle.r,
          particle.r * 2,
          particle.r * 2,
        );
      });

      context.globalAlpha = 1;
      stars.forEach(drawStar);

      meteors.forEach(drawMeteor);
      context.globalAlpha = 1;
    };

    const animate = () => {
      time += 0.016;
      const travel = Math.hypot(targetX - offsetX, targetY - offsetY);
      offsetX += (targetX - offsetX) * 0.055;
      offsetY += (targetY - offsetY) * 0.055;
      /* Faster pointer travel pulls the field a little further. */
      const targetVigour = Math.min(1.5, 1 + travel * 2.4);
      vigour += (targetVigour - vigour) * 0.06;
      if (time > nextMeteor) {
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft
          ? Math.random() * width * 0.45
          : width - Math.random() * width * 0.25;
        const startY = Math.random() * height * 0.35;
        const speed = 5 + Math.random() * 4;
        meteors.push({
          x: startX,
          y: startY,
          vx: fromLeft ? speed : -speed,
          vy: speed * 0.55,
          life: 0,
          max: 1.5 + Math.random(),
        });
        nextMeteor = time + 9 + Math.random() * 13;
      }

      meteors.forEach((meteor) => {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life += 0.016;
      });
      meteors = meteors.filter(
        (meteor) =>
          meteor.life < meteor.max &&
          meteor.x > -150 &&
          meteor.x < width + 150 &&
          meteor.y < height + 150,
      );

      draw();
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    draw();
    if (!reduced) frame = window.requestAnimationFrame(animate);
    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX / Math.max(width, 1) - 0.5;
      targetY = event.clientY / Math.max(height, 1) - 0.5;
      const root = document.documentElement;
      root.style.setProperty("--pointer-x", targetX.toFixed(4));
      root.style.setProperty("--pointer-y", targetY.toFixed(4));
    };
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      const root = document.documentElement;
      root.style.setProperty("--pointer-x", "0");
      root.style.setProperty("--pointer-y", "0");
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <>
      <div className="milky-band" aria-hidden="true" />
      <canvas ref={canvasRef} className="star-canvas" aria-hidden="true" />
      <div className="nebula nebula-a" aria-hidden="true" />
      <div className="nebula nebula-b" aria-hidden="true" />
      <div className="nebula nebula-c" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Planet visuals                                                     */
/* ------------------------------------------------------------------ */

function PlanetGlobe({
  planet,
  size = "detail",
  pixelSize,
}: {
  planet: Planet;
  size?: "detail" | "mini";
  pixelSize?: number;
}) {
  const style: Vars = {
    "--tex": `url("${planet.texture}")`,
    "--spin": `${planet.spin}s`,
    "--atmo": planet.accent,
    ...(pixelSize ? { "--g": pixelSize } : {}),
  };

  return (
    <div
      className={`globe-wrap globe-${size}${planet.ring ? ` has-ring ring-${planet.ring}` : ""}`}
      style={style}
      role="img"
      aria-label={`Rotating globe of ${planet.name}, rendered from a NASA-derived surface map`}
    >
      {planet.ring === "saturn" && (
        <span className="planet-ring ring-back" aria-hidden="true" />
      )}
      <div className="planet-globe">
        <span className="globe-texture" />
        {planet.slug === "earth" && <span className="globe-clouds" />}
        <span className="globe-shading" />
        <span className="globe-sheen" />
      </div>
      {planet.ring === "saturn" && (
        <span className="planet-ring ring-front" aria-hidden="true" />
      )}
      {planet.ring === "uranus" && (
        <span className="uranus-rings" aria-hidden="true" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Size comparison                                                    */
/* ------------------------------------------------------------------ */

const bodyDiameter = (body: Planet) =>
  Number(body.diameterKm.replace(/[^0-9.]/g, "")) || 1;

function SizeCompare({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (body: Planet) => void;
}) {
  const largest = Math.max(...PLANETS.map(bodyDiameter));

  return (
    <div className="size-compare reveal" data-delay="120">
      <div className="size-head">
        <p className="size-kicker">Relative scale</p>
        <p className="size-note">
          Eight planets at one relative scale. Sphere widths follow the square
          root of each diameter, so Earth and Mercury stay visible beside
          Jupiter.
        </p>
      </div>
      <div className="size-row">
        {PLANETS.map((body) => {
          const ratio = Math.sqrt(bodyDiameter(body) / largest);
          const px = Math.max(18, Math.round(ratio * 100));
          return (
            <button
              key={body.slug}
              type="button"
              className={`size-item${selected === body.slug ? " active" : ""}`}
              onClick={() => onSelect(body)}
              aria-label={`Open the ${body.name} dossier`}
              aria-pressed={selected === body.slug}
            >
              <span className="size-slot">
                <PlanetGlobe planet={body} size="mini" pixelSize={px} />
              </span>
              <span className="size-name">{body.name}</span>
              <span className="size-dia">{body.diameterKm} km</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Planet dossier                                                     */
/* ------------------------------------------------------------------ */

function PlanetDetail({
  planet,
  onSelect,
  detailRef,
}: {
  planet: Planet;
  onSelect: (planet: Planet, scroll: boolean) => void;
  detailRef: RefObject<HTMLElement | null>;
}) {
  const index = BODIES.findIndex((item) => item.slug === planet.slug);
  const previous = BODIES[(index - 1 + BODIES.length) % BODIES.length];
  const next = BODIES[(index + 1) % BODIES.length];
  const isSun = planet.slug === "sun";

  return (
    <article
      className="planet-detail reveal"
      id="planet-profile"
      ref={detailRef}
      aria-live="polite"
    >
      <div className="detail-visual">
        <span className="detail-orbit" aria-hidden="true" />
        <PlanetGlobe planet={planet} />
        <p className="visual-caption">
          NASA-derived surface map
          <br />
          Rotation is stylised; the data is real.
        </p>
      </div>

      <div className="detail-copy" key={planet.slug}>
        <div className="detail-topline">
          <span>{isSun ? "The centre · 01 / 09" : `World ${String(index).padStart(2, "0")} / 08`}</span>
          <span className="detail-type">{planet.type}</span>
        </div>

        <h3 className="detail-title">{planet.name}</h3>
        <p className="detail-tagline">{planet.tagline}</p>
        <p className="detail-description">{planet.description}</p>

        <p className="detail-highlight">
          {planet.highlight}
        </p>

        <div className="fact-grid">
          {isSun ? (
            <>
              <div className="fact">
                <span>Distance from Earth</span>
                <strong>1 AU · {planet.distanceKm}</strong>
              </div>
              <div className="fact">
                <span>Galactic orbit</span>
                <strong>{planet.periodLabel}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="fact">
                <span>Mean distance</span>
                <strong>
                  {planet.distanceAu} AU · {planet.distanceKm}
                </strong>
              </div>
              <div className="fact">
                <span>Orbital period</span>
                <strong>{planet.periodLabel}</strong>
              </div>
            </>
          )}
          <div className="fact">
            <span>Diameter</span>
            <strong>{planet.diameterKm} km</strong>
          </div>
          <div className="fact">
            <span>{isSun ? "Rotation" : "Day length"}</span>
            <strong>{planet.dayLength}</strong>
          </div>
          <div className="fact">
            <span>{isSun ? "Planets" : "Moons"}</span>
            <strong>{planet.moons}</strong>
          </div>
          <div className="fact">
            <span>Surface gravity</span>
            <strong>{planet.gravity}</strong>
          </div>
          <div className="fact">
            <span>{isSun ? "Surface temperature" : "Mean temperature"}</span>
            <strong>{planet.temp}</strong>
          </div>
          <div className="fact">
            <span>Axial tilt</span>
            <strong>{planet.axialTilt}</strong>
          </div>
          <div className="fact fact-atmosphere">
            <span>{isSun ? "Composition" : "Atmosphere"}</span>
            <strong>{planet.atmosphere}</strong>
          </div>
        </div>

        <div className="detail-focus">
          <span className="focus-label">In focus</span>
          <p>{planet.science}</p>
        </div>

        <div className="fun-fact">
          <span className="fun-fact-label">
            <span aria-hidden="true">✦</span> Fun fact
          </span>
          <p>{planet.funFact}</p>
        </div>

        <div className="detail-nav">
          <button
            type="button"
            className="detail-nav-button"
            onClick={() => onSelect(previous, false)}
          >
            <span aria-hidden="true">←</span> {previous.name}
          </button>
          <button
            type="button"
            className="detail-nav-button next"
            onClick={() => onSelect(next, false)}
          >
            {next.name} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Chrome: scroll progress + back to top                              */
/* ------------------------------------------------------------------ */

function ScrollChrome() {
  const barRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
      setShowTop((current) => {
        const nextValue = window.scrollY > 900;
        return current === nextValue ? current : nextValue;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div ref={barRef} />
      </div>
      <button
        type="button"
        className={`back-to-top${showTop ? " visible" : ""}`}
        onClick={() => scrollToId("home")}
        aria-label="Back to the top"
        tabIndex={showTop ? 0 : -1}
      >
        <span aria-hidden="true">↑</span>
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [selected, setSelected] = useState<Planet>(BODIES[3]);
  const detailRef = useRef<HTMLElement>(null);

  const handleSelect = useCallback(
    (planet: Planet, scroll: boolean) => {
      setSelected(planet);
      if (scroll) {
        window.requestAnimationFrame(() => {
          detailRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          });
        });
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) document.documentElement.classList.add("tara-ready");
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(markReady).catch(markReady);
    }
    const fallback = window.setTimeout(markReady, 1600);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ScrollChrome />
      <CosmicBackground />
      <div
        className="body-ambience"
        key={selected.slug}
        style={{ "--ambient": TINTS[selected.slug] ?? "255, 255, 255" } as Vars}
        aria-hidden="true"
      />

      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="TARA home">
          <span className="wordmark-letters" aria-hidden="true">
            {"TARA".split("").map((letter, index) => (
              <span
                className="wordmark-letter"
                key={`${letter}-${index}`}
                style={{ "--i": index } as Vars}
              >
                {letter}
              </span>
            ))}
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#explorer">Solar system</a>
          <a href="#sciences">Sciences</a>
          <a href="#cosmology">Cosmology</a>
          <a href="#wonders">Wonders</a>
        </nav>
        <a className="header-cta" href="#explorer">
          Start exploring <span aria-hidden="true">↓</span>
        </a>
      </header>

      <main>
        {/* ---------------------------------------------------------- */}
        <section className="hero" id="home">
          <div className="hero-halo" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-star" aria-hidden="true" />
              A field guide to the universe
            </p>

            <h1 className="hero-title" aria-label="TARA">
              <span className="title-inner" aria-hidden="true">
                {"TARA".split("").map((letter, index) => (
                  <span
                    className="title-letter"
                    data-letter={letter}
                    key={`${letter}-${index}`}
                    style={{ "--i": index } as Vars}
                  >
                    {letter}
                  </span>
                ))}
                <span className="title-star" aria-hidden="true">
                  <span className="title-star-burst" />
                  <span className="title-star-core" />
                </span>
                <span className="title-spark spark-1" aria-hidden="true" />
                <span className="title-spark spark-2" aria-hidden="true" />
                <span className="title-spark spark-3" aria-hidden="true" />
                <span className="title-spark spark-4" aria-hidden="true" />
              </span>
            </h1>

            <p className="hero-kicker">
              Astronomy <span>·</span> Astrophysics <span>·</span> Astrobiology
            </p>
            <p className="hero-lead">
              From the eight worlds circling our star to the oldest light in
              the sky, TARA is a quiet place to look up — and understand what
              we see.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#explorer">
                Explore the solar system <span aria-hidden="true">↓</span>
              </a>
              <a className="button ghost" href="#cosmology">
                Begin with cosmology
              </a>
            </div>
          </div>

          <div className="hero-meta">
            <div>
              <strong>8</strong>
              <span>planets in orbit</span>
            </div>
            <div>
              <strong>13.8</strong>
              <span>billion years young</span>
            </div>
            <div>
              <strong>1</strong>
              <span>star we call home</span>
            </div>
          </div>

          <a className="scroll-cue" href="#explorer">
            <span aria-hidden="true" />
            Scroll to orbit
          </a>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="section explorer-section" id="explorer">
          <div className="section-wrap">
            <div className="section-heading reveal">
              <p className="eyebrow">
                <span className="eyebrow-star" aria-hidden="true" />
                Our stellar neighbourhood
              </p>
              <h2>Worlds in motion</h2>
              <p className="section-intro">
                The Sun holds the centre. Eight planets circle it at their true
                relative speeds. Choose any world to open its dossier.
              </p>
            </div>

            <div className="reveal" data-delay="80">
              <Orrery3D
                planets={PLANETS}
                selectedSlug={selected.slug}
                onPick={(slug) => {
                  const body = BODIES.find((item) => item.slug === slug);
                  if (body) handleSelect(body, true);
                }}
              />
            </div>

            <SizeCompare
              selected={selected.slug}
              onSelect={(body) => handleSelect(body, true)}
            />

            <PlanetDetail
              planet={selected}
              onSelect={handleSelect}
              detailRef={detailRef}
            />

            <p className="data-note reveal">
              Orbital data: NASA planetary fact sheets and IAU values. Planet
              globes are drawn from public NASA-derived surface maps; ring and
              cloud detail is illustrative.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="section scale-section" id="scale">
          <div className="section-wrap">
            <div className="section-heading reveal">
              <p className="eyebrow">
                <span className="eyebrow-star" aria-hidden="true" />
                Perspective
              </p>
              <h2>The scale of everything</h2>
              <p className="section-intro">
                Space is measured in light, not miles. Each step outward moves
                us into a larger order of magnitude.
              </p>
            </div>

            <div className="scale-list reveal">
              {SCALE.map((item) => (
                <div className="scale-row" key={item.label}>
                  <div className="scale-copy">
                    <strong>{item.value}</strong>
                    <h3>{item.label}</h3>
                    <p>{item.note}</p>
                  </div>
                  <div
                    className="scale-bar"
                    style={{ "--w": `${item.width}%` } as Vars}
                    aria-hidden="true"
                  >
                    <span />
                  </div>
                </div>
              ))}
            </div>

            <p className="light-year-note reveal">
              A light-year is a measure of
              distance, not time: about 9.46 trillion kilometres. The universe
              is about 13.8 billion years old, yet the observable universe
              stretches about 93 billion light-years across because space
              itself has expanded.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="section sciences-section" id="sciences">
          <div className="section-wrap">
            <div className="section-heading reveal">
              <p className="eyebrow">
                <span className="eyebrow-star" aria-hidden="true" />
                Three ways of looking up
              </p>
              <h2>Astronomy, astrophysics, astrobiology</h2>
              <p className="section-intro">
                Different questions, one universe. These sciences overlap at
                the frontier, where observation, physics and the search for
                life meet.
              </p>
            </div>

            <div className="science-grid">
              {SCIENCE_FIELDS.map((field, index) => (
                <article
                  className="science-card reveal"
                  key={field.title}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <span className="science-index" aria-hidden="true">
                    {field.index}
                  </span>
                  <p className="science-tag">{field.tag}</p>
                  <h3>{field.title}</h3>
                  <p className="science-text">{field.text}</p>
                  <ul>
                    {field.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <p className="science-question">
                    <span aria-hidden="true">↳</span> {field.question}
                  </p>
                </article>
              ))}
            </div>

            <div className="science-note reveal">
              <span className="note-mark" aria-hidden="true">✧</span>
              <p>
                <strong>How we know:</strong> spectroscopy splits starlight
                into its chemical fingerprint; parallax measures nearby
                distances; gravitational lensing weighs distant clusters;
                sample-return missions bring pieces of other worlds home.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="section cosmology-section" id="cosmology">
          <div className="section-wrap">
            <div className="section-heading reveal">
              <p className="eyebrow">
                <span className="eyebrow-star" aria-hidden="true" />
                The science of the whole
              </p>
              <h2>Cosmology, from the first instant</h2>
              <p className="section-intro">
                Cosmology asks how the universe began, how it changes, and what
                it is made of. Here is the story the evidence tells so far.
              </p>
            </div>

            <div className="timeline reveal">
              {TIMELINE.map((item) => (
                <div className="timeline-item" key={item.title}>
                  <div className="timeline-when">
                    <span className="timeline-dot" aria-hidden="true" />
                    <time>{item.time}</time>
                  </div>
                  <div className="timeline-what">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cosmology-grid">
              {COSMOLOGY_CARDS.map((card, index) => (
                <article
                  className="cosmo-card reveal"
                  key={card.title}
                  style={{ transitionDelay: `${(index % 3) * 70}ms` }}
                >
                  <span className="cosmo-number">{card.n}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>

            <div className="dark-universe reveal">
              <div className="dark-copy">
                <p className="science-tag">The composition of the cosmos</p>
                <h3>Everything we can see is the smallest part.</h3>
                <p>
                  Ordinary matter — stars, planets, gas and dust — makes up only
                  about 5% of the universe. Dark matter and dark energy are
                  known through their effects, not their light.
                </p>
              </div>
              <div className="dark-chart">
                <div className="dark-bar" aria-hidden="true">
                  <span className="ordinary" style={{ width: "5%" }} />
                  <span className="dark-matter" style={{ width: "27%" }} />
                  <span className="dark-energy" style={{ width: "68%" }} />
                </div>
                <ul className="dark-key">
                  <li>
                    <span className="key-dot ordinary" aria-hidden="true" />
                    <strong>5%</strong> ordinary matter
                  </li>
                  <li>
                    <span className="key-dot matter" aria-hidden="true" />
                    <strong>27%</strong> dark matter
                  </li>
                  <li>
                    <span className="key-dot energy" aria-hidden="true" />
                    <strong>68%</strong> dark energy
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="section wonders-section" id="wonders">
          <div className="section-wrap">
            <div className="section-heading reveal">
              <p className="eyebrow">
                <span className="eyebrow-star" aria-hidden="true" />
                Edge of the known
              </p>
              <h2>Wonders and open questions</h2>
              <p className="section-intro">
                Some of the most extraordinary objects in the universe are also
                the hardest to explain. Every answer opens a larger question.
              </p>
            </div>

            <div className="wonders-grid">
              {WONDERS.map((wonder, index) => (
                <article
                  className="wonder-card reveal"
                  key={wonder.title}
                  style={{ transitionDelay: `${(index % 3) * 80}ms` }}
                >
                  <p className="wonder-tag">{wonder.tag}</p>
                  <h3>{wonder.title}</h3>
                  <p>{wonder.body}</p>
                  <div className="wonder-stat">
                    <strong>{wonder.stat}</strong>
                    <span>{wonder.statLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        <section className="closing-section" id="credits">
          <div className="closing-inner reveal">
            <p className="eyebrow">
              <span className="eyebrow-star" aria-hidden="true" />
              Keep looking up
            </p>
            <h2>
              The universe is
              <br />
              still unfolding.
            </h2>
            <p className="closing-copy">
              There is no edge to curiosity. The next discovery is already on
              its way to us — carried by light that left long before we were
              here.
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => scrollToId("home")}
            >
              Back to the beginning <span aria-hidden="true">↑</span>
            </button>

            <div className="credits-block">
              <span className="credits-label">Created by</span>
              <p className="credit-names">
                <span>Sainandan</span>
                <span className="credit-and">and</span>
                <span>Mohan Teja</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-wordmark" href="#home">
          TARA
        </a>
        <p className="footer-line">
          A little closer to the cosmos · astronomy, astrophysics &amp;
          astrobiology
        </p>
        <p className="footer-sources">
          Data: NASA · ESA · IAU
          <span className="footer-divider" aria-hidden="true">·</span>
          <span className="footer-credit">Sainandan &amp; Mohan Teja</span>
        </p>
      </footer>
    </>
  );
}
