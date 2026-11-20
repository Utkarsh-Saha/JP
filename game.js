/**
 * VECTOR: SHADOW RUN — 2D Side-Scrolling Parkour Runner
 * Landscape-locked & mobile-optimized with a fixed 720p virtual coordinate height
 * so physics, jump arcs, and obstacle spacing stay balanced across phones, tablets, and desktops.
 */

(() => {
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const hudDistance = document.getElementById('hud-distance');
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const hudBest = document.getElementById('hud-best');
  const hunterBar = document.getElementById('hunter-bar');
  const hunterDistText = document.getElementById('hunter-dist-text');
  const surgeBar = document.getElementById('surge-bar');
  const surgeText = document.getElementById('surge-text');
  const zoneBanner = document.getElementById('zone-banner');
  const zoneBannerSub = document.getElementById('zone-banner-sub');
  const zoneBannerTitle = document.getElementById('zone-banner-title');
  const zoneBannerDesc = document.getElementById('zone-banner-desc');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTag = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnAutoZone = document.getElementById('btn-auto-zone');
  const btnSwapChars = document.getElementById('btn-swap-chars');
  const modalSwapBtn = document.getElementById('modal-swap-btn');
  const btnStyleMode = document.getElementById('btn-style-mode');
  const styleBtnText = document.getElementById('style-btn-text');
  const btnAudio = document.getElementById('btn-audio');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnPause = document.getElementById('btn-pause');
  const previewRunnerImg = document.getElementById('preview-runner-img');
  const previewHunterImg = document.getElementById('preview-hunter-img');
  const runnerNameLabel = document.getElementById('runner-name-label');
  const hunterNameLabel = document.getElementById('hunter-name-label');

  // Load Uploaded & Generated Image Assets
  const assets = {
    charHead: new Image(),
    charFull: new Image(),
    bonusUltra: new Image(),
    bgZones: [new Image(), new Image(), new Image()],
    loaded: { charHead: false, charFull: false, bonusUltra: false, bg: [false, false, false] }
  };

  assets.charHead.onload = () => { assets.loaded.charHead = true; };
  assets.charHead.src = 'assets/char_head.png';

  assets.charFull.onload = () => { assets.loaded.charFull = true; };
  assets.charFull.src = 'assets/char_full.png';

  assets.bonusUltra.onload = () => { assets.loaded.bonusUltra = true; };
  assets.bonusUltra.src = 'assets/bonus_ultra.png';

  const bgPaths = ['assets/bg_zone1.png', 'assets/bg_zone2.jpg', 'assets/bg_zone3.png'];
  bgPaths.forEach((path, idx) => {
    assets.bgZones[idx].onload = () => { assets.loaded.bg[idx] = true; };
    assets.bgZones[idx].src = path;
  });

  // ---------------------------------------------------------------------------
  // 3 ZONES SPECIFICATION
  // ---------------------------------------------------------------------------
  const ZONES = [
    {
      id: 0,
      code: 'SECTOR 01 // DUSK',
      name: 'DOWNTOWN ROOFTOPS',
      subtitle: 'CLASSIC VECTOR TWILIGHT // MONORAIL & SKYLINE CORRIDOR',
      skyStops: [
        { pos: 0.0, color: '#0d132a' },
        { pos: 0.42, color: '#27234a' },
        { pos: 0.74, color: '#6b3857' },
        { pos: 0.92, color: '#d97642' },
        { pos: 1.0, color: '#f3a852' }
      ],
      hazeColor: 'rgba(196, 118, 92, 0.22)',
      fogColor: 'rgba(48, 38, 74, 0.55)',
      farLayerColor: '#363254',
      midLayerColor: '#1e1b33',
      nearMidColor: '#131122',
      fgColor: '#0A0A0F',
      windowColors: ['#ffd27d', '#ff9b42', '#7ce8ff'],
      accentGlow: '#ff9d2e',
      hasMonorail: true,
      hasRain: false,
      hasSearchlights: false,
      hasShuttles: false
    },
    {
      id: 1,
      code: 'SECTOR 02 // HEAVY RAIN',
      name: 'INDUSTRIAL DISTRICT',
      subtitle: 'RAIN-SLICKED FACTORY ROOFTOPS // COOLING TOWERS & SEARCHLIGHTS',
      skyStops: [
        { pos: 0.0, color: '#070e14' },
        { pos: 0.45, color: '#10202b' },
        { pos: 0.78, color: '#1b3340' },
        { pos: 1.0, color: '#2c4c59' }
      ],
      hazeColor: 'rgba(56, 102, 120, 0.24)',
      fogColor: 'rgba(20, 42, 54, 0.62)',
      farLayerColor: '#243c47',
      midLayerColor: '#162730',
      nearMidColor: '#0e1920',
      fgColor: '#0A0A0F',
      windowColors: ['#80d4ff', '#f5b041', '#a3e4d7'],
      accentGlow: '#00e5ff',
      hasMonorail: false,
      hasRain: true,
      hasSearchlights: true,
      hasShuttles: false
    },
    {
      id: 2,
      code: 'SECTOR 03 // DAWN',
      name: 'HIGH-TECH CYBER PLAZA',
      subtitle: 'CORPORATE MEGASTRUCTURES // HOLO-ARRAYS & BURNING GOLD DAWN',
      skyStops: [
        { pos: 0.0, color: '#140926' },
        { pos: 0.36, color: '#39124a' },
        { pos: 0.68, color: '#8f1d63' },
        { pos: 0.88, color: '#d95b43' },
        { pos: 1.0, color: '#ffbe42' }
      ],
      hazeColor: 'rgba(235, 72, 136, 0.22)',
      fogColor: 'rgba(65, 18, 82, 0.55)',
      farLayerColor: '#431c57',
      midLayerColor: '#281038',
      nearMidColor: '#170924',
      fgColor: '#0A0A0F',
      windowColors: ['#ff2a85', '#00f0ff', '#ffe066'],
      accentGlow: '#ff2a85',
      hasMonorail: true,
      hasRain: false,
      hasSearchlights: false,
      hasShuttles: true
    }
  ];

  // ---------------------------------------------------------------------------
  // WEB AUDIO SYNTHESIZER
  // ---------------------------------------------------------------------------
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, vol = 0.12, slideFreq = null) {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
          osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (_) {}
    }

    jump() {
      this.playTone(190, 'triangle', 0.16, 0.14, 420);
    }

    vault() {
      this.playTone(320, 'sine', 0.12, 0.15, 660);
      setTimeout(() => this.playTone(520, 'triangle', 0.18, 0.12, 880), 65);
    }

    slide() {
      this.playTone(160, 'sawtooth', 0.18, 0.08, 75);
    }

    surge() {
      this.playTone(220, 'sawtooth', 0.35, 0.15, 780);
    }

    hit() {
      this.playTone(110, 'sawtooth', 0.25, 0.18, 45);
    }

    ultra() {
      this.playTone(330, 'triangle', 0.15, 0.16, 660);
      setTimeout(() => this.playTone(495, 'sine', 0.18, 0.16, 990), 90);
      setTimeout(() => this.playTone(660, 'triangle', 0.35, 0.18, 1320), 180);
    }
  }

  const sfx = new SoundEngine();

  // ---------------------------------------------------------------------------
  // FIXED VIRTUAL LANDSCAPE COORDINATE SPACE (720p base height)
  // Guarantees identical physics, character scale, and jump height on all mobile phones
  // ---------------------------------------------------------------------------
  let H = 720;
  let W = 1280;
  let isForcedLandscape = false;
  let groundBaseY = H * 0.76;

  const state = {
    mode: 'MENU', // MENU, PLAYING, PAUSED, GAMEOVER
    currentZone: 0,
    autoCycleZones: true,
    swapRoles: false,
    renderStyle: 0, // 0: HYBRID, 1: SILHOUETTE, 2: CUTOUT
    distance: 0,
    score: 0,
    bestScore: parseInt(localStorage.getItem('vector_best_score') || '0', 10),
    speed: 520,
    baseSpeed: 520,
    maxSpeed: 900,
    surgeMeter: 100,
    surgeActiveTimer: 0,
    ultraTimer: 0,
    ultraPowerDuration: 7.5,
    ultraInstinctTimer: 0,
    ultraInstinctDuration: 14.0,
    ganjaaCoins: 0,
    nextBonusSpawnTimer: 12,
    hunterGap: 28,
    screenShake: 0,
    bgScrollX: 0,
    time: 0
  };

  hudBest.textContent = state.bestScore.toLocaleString();

  // Player & Hunter Entities
  const runner = {
    x: 270,
    y: 0,
    vy: 0,
    width: 44,
    height: 92,
    onGround: false,
    isSliding: false,
    slideTimer: 0,
    jumpCount: 0,
    animPhase: 0,
    flipAngle: 0,
    isFlipping: false,
    vaultTimer: 0,
    vaultType: '',
    stumbleTimer: 0,
    trail: []
  };

  const hunter = {
    x: 90,
    y: 0,
    vy: 0,
    onGround: true,
    isSliding: false,
    animPhase: 1.7,
    flipAngle: 0
  };

  // World Arrays
  let rooftops = [];
  let obstacles = [];
  let bonusDrops = [];
  let farBuildings = [];
  let midBuildings = [];
  let floatingTexts = [];
  let particles = [];
  let rainDrops = [];
  let shuttles = [];
  let monorail = { x: -600, y: 0, speed: 340, active: true };

  // ---------------------------------------------------------------------------
  // PROCEDURAL PARALLAX CITY & ROOFTOP GENERATOR
  // ---------------------------------------------------------------------------
  function initParallaxLayers() {
    farBuildings = [];
    midBuildings = [];
    rainDrops = [];
    shuttles = [];

    let fx = -100;
    while (fx < W * 2.2) {
      const bw = 90 + Math.random() * 140;
      const bh = 180 + Math.random() * 290;
      farBuildings.push({
        x: fx,
        w: bw,
        h: bh,
        hasSpire: Math.random() > 0.45,
        hasBridge: Math.random() > 0.65
      });
      fx += bw - 12;
    }

    let mx = -100;
    while (mx < W * 2.2) {
      const bw = 75 + Math.random() * 125;
      const bh = 130 + Math.random() * 240;
      const windows = [];
      const cols = Math.floor(bw / 18);
      const rows = Math.floor(bh / 24);
      for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
          if (Math.random() > 0.76) {
            windows.push({
              rx: c * 16,
              ry: r * 22,
              w: 6,
              h: 9,
              cIdx: Math.floor(Math.random() * 3)
            });
          }
        }
      }
      midBuildings.push({
        x: mx,
        w: bw,
        h: bh,
        kind: Math.random() > 0.72 ? 'cooling_tower' : (Math.random() > 0.75 ? 'crane_tower' : 'skyscraper'),
        windows,
        hasHoloSign: Math.random() > 0.6
      });
      mx += bw + 10 + Math.random() * 25;
    }

    for (let i = 0; i < 160; i++) {
      rainDrops.push({
        x: Math.random() * W * 1.3,
        y: Math.random() * H,
        len: 18 + Math.random() * 24,
        speed: 850 + Math.random() * 420
      });
    }

    for (let i = 0; i < 5; i++) {
      shuttles.push({
        x: Math.random() * W,
        y: H * (0.14 + Math.random() * 0.28),
        speed: 90 + Math.random() * 160,
        dir: Math.random() > 0.5 ? 1 : -1,
        size: 18 + Math.random() * 18
      });
    }
  }

  function createRooftopSegment(startX, prevY, isFirst = false) {
    const width = isFirst ? 1400 : 980 + Math.random() * 820;
    const gap = isFirst ? 0 : 120 + Math.random() * 95;
    const x = startX + gap;
    const deltaY = isFirst ? 0 : (Math.random() - 0.48) * 60;
    const y = Math.max(H * 0.60, Math.min(H * 0.80, prevY + deltaY));

    // Populate playable parkour obstacles with generous landing/takeoff zones & spacing
    const segmentObstacles = [];
    if (!isFirst) {
      const speedFactor = Math.max(1, state.speed / 520);
      const landingSafeMargin = 360 * speedFactor;
      const takeoffSafeMargin = 340 * speedFactor;
      let ox = x + landingSafeMargin + Math.random() * 90;

      while (ox < x + width - takeoffSafeMargin) {
        const kindRoll = Math.random();
        let obs;
        if (kindRoll < 0.44) {
          obs = {
            x: ox,
            y: y - 46,
            w: 56,
            h: 46,
            roofY: y,
            type: 'VAULT_AC',
            cleared: false,
            hit: false
          };
        } else if (kindRoll < 0.78) {
          obs = {
            x: ox,
            y: y - 156,
            w: 96,
            h: 62,
            roofY: y,
            type: 'SLIDE_DUCT',
            cleared: false,
            hit: false
          };
        } else {
          obs = {
            x: ox,
            y: y - 58,
            w: 44,
            h: 58,
            roofY: y,
            type: 'HIGH_VENT',
            cleared: false,
            hit: false
          };
        }
        obstacles.push(obs);
        segmentObstacles.push(obs);

        const minSpacing = (540 + Math.random() * 280) * speedFactor;
        ox += minSpacing;
      }
    }

    // Decorative background-edge rooftop props (spaced well apart & never overlapping obstacles)
    const props = [];
    let px = 140;
    while (px < width - 180) {
      const worldPx = x + px;
      const tooCloseToObstacle = segmentObstacles.some(
        (o) => Math.abs((worldPx + 35) - (o.x + o.w * 0.5)) < 165
      );

      if (!tooCloseToObstacle) {
        const roll = Math.random();
        if (roll < 0.24) {
          props.push({ type: 'water_tower', rx: px, w: 64, h: 115 });
        } else if (roll < 0.48) {
          props.push({ type: 'antenna_mast', rx: px, w: 32, h: 145 });
        } else if (roll < 0.68) {
          props.push({ type: 'satellite_dish', rx: px, w: 46, h: 58 });
        } else if (roll < 0.85) {
          props.push({ type: 'guard_rail', rx: px, w: 110, h: 22 });
        } else {
          props.push({ type: 'chimney_pipe', rx: px, w: 36, h: 105 });
        }
        px += 340 + Math.random() * 240;
      } else {
        px += 120;
      }
    }

    const roof = {
      x,
      y,
      w: width,
      h: H - y + 200,
      props,
      hasCableToNext: Math.random() > 0.25,
      hasLadder: true
    };
    rooftops.push(roof);

    // Sometimes drop a Ganjaa Bonus item from the sky onto this rooftop (2x rarity: ~27.5% chance)
    if (!isFirst && Math.random() < 0.275) {
      const dropX = x + 260 + Math.random() * Math.max(200, width - 520);
      const targetY = y - 105 - Math.random() * 65;
      bonusDrops.push({
        x: dropX,
        y: -120 - Math.random() * 140,
        targetY,
        vy: 240 + Math.random() * 90,
        size: 168,
        ttl: 5.5, // Time limit before the dropped bonus expires!
        maxTtl: 5.5,
        phase: Math.random() * Math.PI * 2,
        collected: false
      });
    }
  }

  function resetWorld() {
    groundBaseY = H * 0.76;
    rooftops = [];
    obstacles = [];
    bonusDrops = [];
    floatingTexts = [];
    particles = [];

    createRooftopSegment(0, groundBaseY, true);
    for (let i = 0; i < 5; i++) {
      const last = rooftops[rooftops.length - 1];
      createRooftopSegment(last.x + last.w, last.y, false);
    }

    runner.x = Math.min(280, W * 0.24);
    runner.y = groundBaseY;
    runner.vy = 0;
    runner.onGround = true;
    runner.isSliding = false;
    runner.slideTimer = 0;
    runner.jumpCount = 0;
    runner.flipAngle = 0;
    runner.isFlipping = false;
    runner.vaultTimer = 0;
    runner.stumbleTimer = 0;
    runner.trail = [];

    hunter.x = runner.x - 175;
    hunter.y = groundBaseY;
    hunter.vy = 0;

    state.distance = 0;
    state.score = 0;
    state.speed = state.baseSpeed;
    state.surgeMeter = 100;
    state.surgeActiveTimer = 0;
    state.ultraTimer = 0;
    state.ultraInstinctTimer = 0;
    state.ganjaaCoins = 0;
    state.nextBonusSpawnTimer = 12;
    state.hunterGap = 28;
    state.screenShake = 0;
    if (hudCoins) hudCoins.textContent = '0/10';
  }

  // ---------------------------------------------------------------------------
  // PARKOUR CONTROLS & ACTIONS
  // ---------------------------------------------------------------------------
  function addFloatingText(text, x, y, color = '#ff9d2e') {
    floatingTexts.push({
      text,
      x,
      y,
      vy: -55,
      alpha: 1.0,
      color
    });
  }

  function spawnSparks(x, y, color = '#ff9d2e', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 220;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        size: 2 + Math.random() * 3.5,
        alpha: 1,
        color
      });
    }
  }

  function triggerJumpOrVault() {
    if (state.mode !== 'PLAYING') return;
    sfx.init();

    const nearObs = obstacles.find(
      (o) =>
        !o.cleared &&
        (o.type === 'VAULT_AC' || o.type === 'HIGH_VENT') &&
        o.x - runner.x > -24 &&
        o.x - runner.x < 135
    );

    if (runner.onGround) {
      runner.onGround = false;
      runner.isSliding = false;
      runner.jumpCount = 1;

      if (nearObs) {
        runner.vy = -730;
        runner.vaultTimer = 0.44;
        const vaultNames = ['KONG VAULT', 'SPEED VAULT', 'MONKEY VAULT', 'DASH VAULT'];
        runner.vaultType = vaultNames[Math.floor(Math.random() * vaultNames.length)];
        nearObs.cleared = true;
        state.score += 150;
        state.surgeMeter = Math.min(100, state.surgeMeter + 18);
        addFloatingText(`${runner.vaultType} +150`, runner.x + 20, runner.y - 195, '#00e5ff');
        spawnSparks(nearObs.x + nearObs.w / 2, nearObs.y, '#00e5ff', 14);
        sfx.vault();
      } else {
        runner.vy = -760;
        sfx.jump();
      }
    } else if (runner.jumpCount < 2) {
      runner.vy = -660;
      runner.jumpCount = 2;
      runner.isFlipping = true;
      runner.flipAngle = 0;
      state.score += 100;
      addFloatingText('WEBSTER FLIP +100', runner.x, runner.y - 190, '#ff9d2e');
      spawnSparks(runner.x, runner.y - 80, '#ff9d2e', 10);
      sfx.vault();
    }
  }

  function triggerSlideOrRoll() {
    if (state.mode !== 'PLAYING') return;
    sfx.init();

    if (!runner.onGround) {
      runner.vy = 920;
      runner.isSliding = true;
      runner.slideTimer = 0.65;
      addFloatingText('SAFETY ROLL +75', runner.x, runner.y - 70, '#ffd27d');
      state.score += 75;
      sfx.slide();
    } else if (!runner.isSliding) {
      runner.isSliding = true;
      runner.slideTimer = 0.68;
      spawnSparks(runner.x, runner.y, '#ff9d2e', 8);
      sfx.slide();
    }
  }

  function triggerSurge() {
    if (state.mode !== 'PLAYING') return;
    sfx.init();
    if (state.surgeMeter >= 35 && state.surgeActiveTimer <= 0) {
      state.surgeActiveTimer = 2.2;
      state.surgeMeter = Math.max(0, state.surgeMeter - 45);
      state.hunterGap = Math.min(40, state.hunterGap + 7.5);
      state.screenShake = 6;
      addFloatingText('ADRENALINE SURGE!', runner.x + 30, runner.y - 125, '#ff2a85');
      spawnSparks(runner.x, runner.y - 45, '#ff2a85', 22);
      sfx.surge();
    }
  }

  function switchZone(zoneIdx, showNotification = true) {
    state.currentZone = zoneIdx;
    document.querySelectorAll('.zone-btn[data-zone]').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.zone, 10) === zoneIdx);
    });
    document.querySelectorAll('.modal-zone-card').forEach((card) => {
      card.classList.toggle('active', parseInt(card.dataset.zone, 10) === zoneIdx);
    });

    if (showNotification) {
      const z = ZONES[zoneIdx];
      zoneBannerSub.textContent = z.code;
      zoneBannerTitle.textContent = z.name;
      zoneBannerDesc.textContent = z.subtitle;
      zoneBanner.classList.remove('hidden');
      clearTimeout(zoneBanner._timer);
      zoneBanner._timer = setTimeout(() => {
        zoneBanner.classList.add('hidden');
      }, 2500);
    }
  }

  function toggleRoleSwap() {
    state.swapRoles = !state.swapRoles;
    if (state.swapRoles) {
      previewRunnerImg.src = 'assets/char_full.png';
      previewHunterImg.src = 'assets/char_head.png';
      runnerNameLabel.textContent = 'Blue Jacket Maverick';
      hunterNameLabel.textContent = 'Shadow Pursuer';
    } else {
      previewRunnerImg.src = 'assets/char_head.png';
      previewHunterImg.src = 'assets/char_full.png';
      runnerNameLabel.textContent = 'Shadow Fugitive';
      hunterNameLabel.textContent = 'Sector Commander';
    }
    if (state.mode === 'PLAYING') {
      addFloatingText('CHARACTERS SWAPPED!', runner.x, runner.y - 120, '#00e5ff');
    }
  }

  function cycleRenderStyle() {
    state.renderStyle = (state.renderStyle + 1) % 3;
    const labels = ['HYBRID', 'SILHOUETTE', 'CUTOUT'];
    styleBtnText.textContent = labels[state.renderStyle];
    if (state.mode === 'PLAYING') {
      addFloatingText(`STYLE: ${labels[state.renderStyle]}`, runner.x, runner.y - 120, '#ff9d2e');
    }
  }

  async function requestFullscreenLandscape() {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // INPUT LISTENERS (Desktop Keyboard + Mobile Multi-Touch & Rotate-Aware Gestures)
  // ---------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (state.mode === 'MENU' || state.mode === 'GAMEOVER') {
        startGame();
      } else {
        triggerJumpOrVault();
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      triggerSlideOrRoll();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyD' || e.code === 'ArrowRight') {
      e.preventDefault();
      triggerSurge();
    } else if (e.code === 'Digit1') {
      state.autoCycleZones = false;
      btnAutoZone.classList.remove('auto-active');
      switchZone(0, true);
    } else if (e.code === 'Digit2') {
      state.autoCycleZones = false;
      btnAutoZone.classList.remove('auto-active');
      switchZone(1, true);
    } else if (e.code === 'Digit3') {
      state.autoCycleZones = false;
      btnAutoZone.classList.remove('auto-active');
      switchZone(2, true);
    } else if (e.code === 'KeyC') {
      toggleRoleSwap();
    } else if (e.code === 'KeyV') {
      cycleRenderStyle();
    } else if (e.code === 'KeyM') {
      sfx.enabled = !sfx.enabled;
      btnAudio.style.opacity = sfx.enabled ? '1' : '0.45';
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      togglePause();
    }
  });

  // Ergonomic On-Screen Thumb Buttons
  function bindTouchBtn(id, action) {
    const btn = document.getElementById(id);
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');
      action();
    });
    const clearPress = () => btn.classList.remove('pressed');
    btn.addEventListener('pointerup', clearPress);
    btn.addEventListener('pointercancel', clearPress);
    btn.addEventListener('pointerleave', clearPress);
  }

  bindTouchBtn('touch-jump', triggerJumpOrVault);
  bindTouchBtn('touch-slide', triggerSlideOrRoll);
  bindTouchBtn('touch-surge', triggerSurge);

  // Convert screen pointer coordinates into landscape-aligned coordinates (even when CSS rotated 90deg in portrait!)
  function getLandscapePoint(e) {
    if (!isForcedLandscape) {
      return { x: e.clientX, y: e.clientY, viewW: window.innerWidth, viewH: window.innerHeight };
    }
    // When #game-container is rotated 90deg clockwise in portrait mode:
    // Landscape X corresponds to clientY; Landscape Y corresponds to (window.innerWidth - clientX)
    return {
      x: e.clientY,
      y: window.innerWidth - e.clientX,
      viewW: window.innerHeight,
      viewH: window.innerWidth
    };
  }

  let touchStartPt = null;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    touchStartPt = getLandscapePoint(e);
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!touchStartPt) return;
    const endPt = getLandscapePoint(e);
    const dx = endPt.x - touchStartPt.x;
    const dy = endPt.y - touchStartPt.y;

    if (Math.abs(dy) > 26 && Math.abs(dy) >= Math.abs(dx)) {
      if (dy < 0) triggerJumpOrVault();
      else triggerSlideOrRoll();
    } else if (dx > 45 && Math.abs(dx) > Math.abs(dy)) {
      triggerSurge();
    } else {
      // Quick Tap: Right half of landscape screen = Jump/Vault, Left half = Slide/Roll
      if (endPt.x > endPt.viewW * 0.5) triggerJumpOrVault();
      else triggerSlideOrRoll();
    }
    touchStartPt = null;
  });

  // UI Buttons
  document.querySelectorAll('.zone-btn[data-zone]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.autoCycleZones = false;
      btnAutoZone.classList.remove('auto-active');
      switchZone(parseInt(btn.dataset.zone, 10), true);
    });
  });

  document.querySelectorAll('.modal-zone-card').forEach((card) => {
    card.addEventListener('click', () => {
      switchZone(parseInt(card.dataset.zone, 10), false);
    });
  });

  btnAutoZone.addEventListener('click', () => {
    state.autoCycleZones = !state.autoCycleZones;
    btnAutoZone.classList.toggle('auto-active', state.autoCycleZones);
  });

  btnSwapChars.addEventListener('click', toggleRoleSwap);
  modalSwapBtn.addEventListener('click', toggleRoleSwap);
  btnStyleMode.addEventListener('click', cycleRenderStyle);
  btnFullscreen.addEventListener('click', requestFullscreenLandscape);

  btnAudio.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    btnAudio.style.opacity = sfx.enabled ? '1' : '0.45';
  });

  btnPause.addEventListener('click', togglePause);
  btnStartGame.addEventListener('click', () => {
    // On mobile touch devices, try locking landscape orientation gracefully
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
    startGame();
  });

  function startGame() {
    sfx.init();
    resetWorld();
    state.mode = 'PLAYING';
    modalOverlay.classList.add('hidden');
    switchZone(state.currentZone, true);
  }

  function togglePause() {
    if (state.mode === 'PLAYING') {
      state.mode = 'PAUSED';
      modalTag.textContent = 'SYSTEM PAUSED';
      modalTitle.textContent = 'RUN SUSPENDED';
      modalSubtitle.textContent = `Current Distance: ${Math.floor(state.distance)}m | Score: ${Math.floor(state.score).toLocaleString()}. Switch zones, swap roles, or resume your rooftop escape.`;
      btnStartGame.innerHTML = '&#9654; RESUME';
      modalOverlay.classList.remove('hidden');
    } else if (state.mode === 'PAUSED') {
      state.mode = 'PLAYING';
      modalOverlay.classList.add('hidden');
    }
  }

  function triggerGameOver(reason) {
    state.mode = 'GAMEOVER';
    sfx.hit();
    const finalScore = Math.floor(state.score + state.distance * 10);
    if (finalScore > state.bestScore) {
      state.bestScore = finalScore;
      localStorage.setItem('vector_best_score', String(state.bestScore));
      hudBest.textContent = state.bestScore.toLocaleString();
    }
    modalTag.textContent = 'ESCAPE TERMINATED';
    modalTitle.textContent = reason;
    modalSubtitle.textContent = `Distance: ${Math.floor(state.distance)}m | Total Score: ${finalScore.toLocaleString()}.`;
    btnStartGame.innerHTML = '&#8635; RUN AGAIN';
    modalOverlay.classList.remove('hidden');
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOOP
  // ---------------------------------------------------------------------------
  function update(dt) {
    state.time += dt;

    if (state.mode !== 'PLAYING') return;

    state.baseSpeed = Math.min(state.maxSpeed, 520 + state.distance * 0.22);
    let currentSpeed = state.baseSpeed;

    if (state.ultraInstinctTimer > 0) {
      state.ultraInstinctTimer -= dt;
      currentSpeed *= 1.95;
      state.surgeMeter = 100;
      state.hunterGap = 40;
    } else if (state.ultraTimer > 0) {
      state.ultraTimer -= dt;
      currentSpeed *= 1.55;
      state.surgeMeter = 100;
      state.hunterGap = Math.min(40, state.hunterGap + dt * 3.5);
    } else if (state.surgeActiveTimer > 0) {
      state.surgeActiveTimer -= dt;
      currentSpeed *= 1.38;
    } else if (runner.stumbleTimer > 0) {
      runner.stumbleTimer -= dt;
      currentSpeed *= 0.62;
    }

    // 2x rarity periodic mid-run sky drop timer (every 18-28s)
    state.nextBonusSpawnTimer -= dt;
    if (state.nextBonusSpawnTimer <= 0) {
      state.nextBonusSpawnTimer = 18 + Math.random() * 10;
      const aheadRoof = rooftops.find((r) => r.x + r.w > runner.x + 550 && r.x < runner.x + 1100);
      if (aheadRoof) {
        const dropX = Math.max(aheadRoof.x + 150, Math.min(aheadRoof.x + aheadRoof.w - 150, runner.x + 680));
        bonusDrops.push({
          x: dropX,
          y: -100,
          targetY: aheadRoof.y - 110,
          vy: 280,
          size: 168,
          ttl: 5.5,
          maxTtl: 5.5,
          phase: Math.random() * Math.PI * 2,
          collected: false
        });
      }
    }

    state.speed = currentSpeed;
    const dx = currentSpeed * dt;
    state.bgScrollX += dx;

    const prevDistFloor = Math.floor(state.distance / 450);
    state.distance += dx / 42;
    state.score += (dx / 42) * 10;

    if (state.autoCycleZones && Math.floor(state.distance / 450) > prevDistFloor) {
      switchZone((state.currentZone + 1) % 3, true);
    }

    state.surgeMeter = Math.min(100, state.surgeMeter + dt * 6.5);

    for (let i = rooftops.length - 1; i >= 0; i--) {
      rooftops[i].x -= dx;
    }
    if (rooftops[0].x + rooftops[0].w < -300) {
      rooftops.shift();
      const last = rooftops[rooftops.length - 1];
      createRooftopSegment(last.x + last.w, last.y, false);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= dx;
      if (obstacles[i].x + obstacles[i].w < -200) {
        obstacles.splice(i, 1);
      }
    }

    // Update Falling / Floating Bonus Drops & Countdown Time Limit
    for (let i = bonusDrops.length - 1; i >= 0; i--) {
      const b = bonusDrops[i];
      b.x -= dx;
      b.phase += dt * 4.2;
      if (b.y < b.targetY) {
        b.y = Math.min(b.targetY, b.y + b.vy * dt);
      } else if (b.x < W) {
        // Count down pickup time limit once on-screen and landed
        b.ttl -= dt;
        if (b.ttl <= 0) {
          addFloatingText('BONUS EXPIRED!', b.x, b.y - 40, '#94a3b8');
          bonusDrops.splice(i, 1);
          continue;
        }
      }
      if (b.x < -200 || b.collected) {
        bonusDrops.splice(i, 1);
      }
    }

    farBuildings.forEach((b) => {
      b.x -= dx * 0.12;
    });
    if (farBuildings.length && farBuildings[0].x + farBuildings[0].w < -150) {
      const first = farBuildings.shift();
      const last = farBuildings[farBuildings.length - 1];
      first.x = last.x + last.w - 10;
      farBuildings.push(first);
    }

    midBuildings.forEach((b) => {
      b.x -= dx * 0.32;
    });
    if (midBuildings.length && midBuildings[0].x + midBuildings[0].w < -150) {
      const first = midBuildings.shift();
      const last = midBuildings[midBuildings.length - 1];
      first.x = last.x + last.w + 15;
      midBuildings.push(first);
    }

    monorail.x += (monorail.speed - dx * 0.45) * dt;
    if (monorail.x > W + 700) monorail.x = -900;
    if (monorail.x < -1100) monorail.x = W + 600;

    if (ZONES[state.currentZone].hasRain) {
      rainDrops.forEach((r) => {
        r.x -= (dx * 0.65 + 240) * dt;
        r.y += r.speed * dt;
        if (r.y > H) {
          r.y = -20;
          r.x = Math.random() * W * 1.3;
        }
        if (r.x < -50) r.x = W + Math.random() * 200;
      });
    }

    if (ZONES[state.currentZone].hasShuttles) {
      shuttles.forEach((s) => {
        s.x += (s.dir * s.speed - dx * 0.15) * dt;
        if (s.x > W + 200) s.x = -180;
        if (s.x < -200) s.x = W + 180;
      });
    }

    // Runner Physics
    runner.animPhase += dt * (currentSpeed / 42);
    if (runner.vaultTimer > 0) runner.vaultTimer -= dt;

    if (runner.isSliding) {
      runner.slideTimer -= dt;
      if (runner.slideTimer <= 0) {
        runner.isSliding = false;
      }
    }

    if (runner.isFlipping) {
      runner.flipAngle += dt * Math.PI * 4.5;
      if (runner.flipAngle >= Math.PI * 2) {
        runner.flipAngle = 0;
        runner.isFlipping = false;
      }
    }

    const prevY = runner.y;
    runner.vy += 1780 * dt;
    runner.y += runner.vy * dt;

    const activeRoof = rooftops.find(
      (r) => runner.x + 16 >= r.x && runner.x - 16 <= r.x + r.w
    );

    if (activeRoof) {
      if (prevY <= activeRoof.y + 18 && runner.y >= activeRoof.y && runner.vy >= 0) {
        runner.y = activeRoof.y;
        runner.vy = 0;
        runner.onGround = true;
        runner.jumpCount = 0;
        runner.isFlipping = false;
        runner.flipAngle = 0;
      } else if (
        runner.x >= activeRoof.x - 16 &&
        runner.x <= activeRoof.x + 38 &&
        runner.y > activeRoof.y &&
        runner.y < activeRoof.y + 72
      ) {
        runner.y = activeRoof.y;
        runner.vy = -220;
        runner.onGround = true;
        runner.jumpCount = 0;
        addFloatingText('LEDGE CLIMB +120', runner.x, runner.y - 95, '#00e5ff');
        state.score += 120;
        spawnSparks(activeRoof.x, activeRoof.y, '#00e5ff', 10);
        sfx.vault();
      } else if (runner.y > activeRoof.y + 4) {
        runner.onGround = false;
      }
    } else {
      runner.onGround = false;
      // Sky-Boost during Ganjaa Power or Ultra Instinct Mode!
      if ((state.ultraTimer > 0 || state.ultraInstinctTimer > 0) && runner.y > H * 0.78 && runner.vy > 0) {
        runner.vy = -750;
        runner.isFlipping = true;
        runner.flipAngle = 0;
        const boostColor = state.ultraInstinctTimer > 0 ? '#e2e8f0' : '#4ade80';
        spawnSparks(runner.x, runner.y, boostColor, 18);
        addFloatingText(
          state.ultraInstinctTimer > 0 ? 'ULTRA INSTINCT SKY-STEP!' : 'GANJAA SKY-BOOST!',
          runner.x,
          runner.y - 170,
          boostColor
        );
        sfx.vault();
      }
    }

    if (runner.y > H + 140) {
      triggerGameOver('FELL INTO THE ABYSS');
      return;
    }

    const rBox = {
      x: runner.x - 24,
      y: runner.isSliding ? runner.y - 78 : runner.y - 168,
      w: 48,
      h: runner.isSliding ? 78 : 164
    };

    // Check Ganjaa Bonus Drop Pickup
    bonusDrops.forEach((b) => {
      if (b.collected) return;
      const hoverY = b.y + Math.sin(b.phase) * 10;
      const distX = Math.abs(runner.x - b.x);
      const distY = Math.abs((runner.y - 84) - hoverY);
      if (distX < 98 && distY < 118) {
        b.collected = true;
        state.ganjaaCoins += 1;
        state.surgeMeter = 100;
        state.hunterGap = 38;
        state.screenShake = 10;
        spawnSparks(b.x, hoverY, '#4ade80', 26);
        spawnSparks(b.x, hoverY, '#facc15', 18);

        if (state.ganjaaCoins >= 10 && state.ganjaaCoins % 10 === 0) {
          // 10 Coins Consumed -> ULTRA INSTINCT MODE + Big Text "HIGH ON GANJAAA"
          state.ultraInstinctTimer = state.ultraInstinctDuration;
          state.ultraTimer = 0;
          state.score += 5000;
          state.screenShake = 18;
          spawnSparks(runner.x, runner.y - 90, '#ffffff', 40);
          spawnSparks(runner.x, runner.y - 90, '#38bdf8', 35);
          addFloatingText('★ ULTRA INSTINCT MODE! +5000 ★', runner.x, runner.y - 220, '#38bdf8');
        } else {
          state.ultraTimer = state.ultraPowerDuration;
          state.score += 1000;
          addFloatingText('★ GANJAA POWER ACTIVATED! +1000 ★', runner.x, runner.y - 205, '#4ade80');
        }

        if (hudCoins) {
          hudCoins.textContent = `${state.ganjaaCoins % 10 === 0 && state.ultraInstinctTimer > 0 ? 10 : state.ganjaaCoins % 10}/10`;
        }
        sfx.ultra();
      }
    });

    obstacles.forEach((obs) => {
      if (obs.hit) return;

      if (
        obs.type === 'SLIDE_DUCT' &&
        !obs.cleared &&
        runner.isSliding &&
        runner.x > obs.x + obs.w * 0.5 &&
        runner.x < obs.x + obs.w + 30
      ) {
        obs.cleared = true;
        state.score += 125;
        state.surgeMeter = Math.min(100, state.surgeMeter + 14);
        addFloatingText('POWER SLIDE +125', runner.x, runner.y - 75, '#00e5ff');
      }

      const overlap =
        rBox.x < obs.x + obs.w - 6 &&
        rBox.x + rBox.w > obs.x + 6 &&
        rBox.y < obs.y + obs.h - 4 &&
        rBox.y + rBox.h > obs.y + 4;

      if (overlap) {
        if (state.ultraInstinctTimer > 0) {
          obs.hit = true;
          obs.cleared = true;
          spawnSparks(obs.x + obs.w / 2, obs.y + obs.h / 2, '#38bdf8', 28);
          addFloatingText('ULTRA INSTINCT +500', runner.x, runner.y - 195, '#e2e8f0');
          state.score += 500;
          sfx.vault();
        } else if (state.ultraTimer > 0) {
          obs.hit = true;
          obs.cleared = true;
          spawnSparks(obs.x + obs.w / 2, obs.y + obs.h / 2, '#4ade80', 22);
          addFloatingText('GANJAA SMASH +250', runner.x, runner.y - 190, '#4ade80');
          state.score += 250;
          sfx.vault();
        } else if (state.surgeActiveTimer > 0) {
          obs.hit = true;
          obs.cleared = true;
          spawnSparks(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ff2a85', 18);
          addFloatingText('SURGE BREACH +200', runner.x, runner.y - 100, '#ff2a85');
          state.score += 200;
          sfx.vault();
        } else {
          obs.hit = true;
          runner.stumbleTimer = 0.85;
          state.hunterGap -= 10.5;
          state.screenShake = 11;
          spawnSparks(runner.x, runner.y - 40, '#ef4444', 18);
          addFloatingText('STUMBLED!', runner.x, runner.y - 115, '#ef4444');
          sfx.hit();
        }
      }
    });

    if (runner.stumbleTimer <= 0 && state.surgeActiveTimer <= 0) {
      state.hunterGap = Math.min(32, state.hunterGap + dt * 0.9);
    }

    if (state.hunterGap <= 0) {
      state.hunterGap = 0;
      triggerGameOver('CAPTURED BY ENFORCER');
      return;
    }

    const targetHunterX = runner.x - Math.max(76, state.hunterGap * 8.2);
    hunter.x += (targetHunterX - hunter.x) * Math.min(1, dt * 8);
    hunter.animPhase += dt * (currentSpeed / 40);

    const hunterRoof = rooftops.find(
      (r) => hunter.x + 15 >= r.x && hunter.x - 15 <= r.x + r.w
    );
    const targetHunterY = hunterRoof ? hunterRoof.y : runner.y;
    hunter.y += (targetHunterY - hunter.y) * Math.min(1, dt * 14);

    if (state.ultraInstinctTimer > 0 || state.ultraTimer > 0 || state.surgeActiveTimer > 0 || runner.vaultTimer > 0 || runner.isFlipping) {
      runner.trail.push({
        x: runner.x,
        y: runner.y,
        isSliding: runner.isSliding,
        isUltraInstinct: state.ultraInstinctTimer > 0,
        isUltra: state.ultraTimer > 0,
        alpha: 0.68
      });
    }
    for (let i = runner.trail.length - 1; i >= 0; i--) {
      runner.trail[i].x -= dx * 0.5;
      runner.trail[i].alpha -= dt * 2.4;
      if (runner.trail[i].alpha <= 0) runner.trail.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.85;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += (p.vx - dx * 0.35) * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.alpha -= dt * 1.7;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    if (state.screenShake > 0) {
      state.screenShake = Math.max(0, state.screenShake - dt * 28);
    }

    // Update Compact HUD
    hudDistance.textContent = `${String(Math.floor(state.distance)).padStart(4, '0')}m`;
    hudScore.textContent = Math.floor(state.score).toLocaleString();

    const dangerPct = Math.max(0, Math.min(100, ((35 - state.hunterGap) / 35) * 100));
    hunterBar.style.width = `${dangerPct}%`;
    if (state.hunterGap < 11) {
      hunterDistText.textContent = `DANGER (${Math.floor(state.hunterGap)}m)`;
      hunterDistText.style.color = '#ef4444';
    } else if (state.hunterGap < 20) {
      hunterDistText.textContent = `WARN (${Math.floor(state.hunterGap)}m)`;
      hunterDistText.style.color = '#f59e0b';
    } else {
      hunterDistText.textContent = `SAFE (${Math.floor(state.hunterGap)}m)`;
      hunterDistText.style.color = '#22c55e';
    }

    if (state.ultraInstinctTimer > 0) {
      const pct = (state.ultraInstinctTimer / state.ultraInstinctDuration) * 100;
      surgeBar.style.width = `${pct}%`;
      surgeText.textContent = `ULTRA INSTINCT (${state.ultraInstinctTimer.toFixed(1)}s)`;
      surgeText.style.color = '#38bdf8';
    } else if (state.ultraTimer > 0) {
      const pct = (state.ultraTimer / state.ultraPowerDuration) * 100;
      surgeBar.style.width = `${pct}%`;
      surgeText.textContent = `GANJAA (${state.ultraTimer.toFixed(1)}s)`;
      surgeText.style.color = '#4ade80';
    } else {
      surgeBar.style.width = `${state.surgeMeter}%`;
      surgeText.style.color = '';
      surgeText.textContent =
        state.surgeActiveTimer > 0
          ? 'ACTIVE!'
          : state.surgeMeter >= 35
          ? 'READY'
          : `${Math.floor(state.surgeMeter)}%`;
    }
  }

  // ---------------------------------------------------------------------------
  // RENDERING SYSTEM
  // ---------------------------------------------------------------------------
  function drawSkyAndBackgroundImage(zone) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.85);
    zone.skyStops.forEach((s) => skyGrad.addColorStop(s.pos, s.color));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    const bgImg = assets.bgZones[state.currentZone];
    if (assets.loaded.bg[state.currentZone] && bgImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.62;
      const scale = Math.max(H / bgImg.naturalHeight, W / bgImg.naturalWidth);
      const drawW = bgImg.naturalWidth * scale;
      const drawH = bgImg.naturalHeight * scale;
      const scrollOffset = (state.bgScrollX * 0.08) % (drawW * 2);

      for (let tile = -1; tile <= 2; tile++) {
        const tx = tile * drawW - (scrollOffset % drawW);
        ctx.save();
        if (Math.abs(tile) % 2 === 1) {
          ctx.translate(tx + drawW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bgImg, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(bgImg, tx, 0, drawW, drawH);
        }
        ctx.restore();
      }
      ctx.restore();
    }

    if (zone.hasSearchlights) {
      for (let i = 0; i < 3; i++) {
        const baseX = (W * (0.22 + i * 0.3)) % W;
        const baseY = H * 0.78;
        const swing = Math.sin(state.time * (0.65 + i * 0.25) + i * 2) * 0.48;
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(swing);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, -H * 0.85);
        beamGrad.addColorStop(0, 'rgba(180, 235, 255, 0.22)');
        beamGrad.addColorStop(1, 'rgba(180, 235, 255, 0.0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-110, -H * 0.85);
        ctx.lineTo(110, -H * 0.85);
        ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawBackgroundLayer(zone) {
    const horizonY = H * 0.78;

    ctx.fillStyle = zone.farLayerColor;
    farBuildings.forEach((b, idx) => {
      const by = horizonY - b.h;
      ctx.fillRect(b.x, by, b.w, b.h + 120);

      if (b.hasSpire) {
        ctx.fillRect(b.x + b.w * 0.45, by - 65, 4, 65);
        if (Math.sin(state.time * 3 + idx) > 0) {
          ctx.fillStyle = zone.accentGlow;
          ctx.fillRect(b.x + b.w * 0.45 - 1, by - 68, 6, 6);
          ctx.fillStyle = zone.farLayerColor;
        }
      }

      if (b.hasBridge) {
        ctx.fillRect(b.x + b.w, by + 45, 95, 10);
        ctx.fillRect(b.x + b.w, by + 62, 95, 5);
      }
    });

    if (zone.hasShuttles) {
      shuttles.forEach((s) => {
        ctx.save();
        ctx.fillStyle = '#1b0829';
        ctx.fillRect(s.x, s.y, s.size * 1.8, 6);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(
          s.dir > 0 ? s.x - 10 : s.x + s.size * 1.8,
          s.y + 1,
          10,
          3
        );
        ctx.restore();
      });
    }

    const fogGrad = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.85);
    fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fogGrad.addColorStop(0.6, zone.hazeColor);
    fogGrad.addColorStop(1, zone.fogColor);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, H * 0.42, W, H * 0.45);
  }

  function drawMidgroundLayer(zone) {
    const horizonY = H * 0.8;

    if (zone.hasMonorail) {
      const trackY = H * 0.54;
      ctx.fillStyle = zone.midLayerColor;
      ctx.fillRect(0, trackY, W, 10);
      for (let px = -(state.bgScrollX * 0.32) % 240; px < W; px += 240) {
        ctx.fillRect(px, trackY, 16, H - trackY);
      }

      const trainY = trackY - 22;
      ctx.fillStyle = '#110f1d';
      ctx.beginPath();
      ctx.moveTo(monorail.x, trainY + 22);
      ctx.lineTo(monorail.x + 24, trainY);
      ctx.lineTo(monorail.x + 360, trainY);
      ctx.lineTo(monorail.x + 384, trainY + 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = zone.accentGlow;
      for (let wx = monorail.x + 34; wx < monorail.x + 345; wx += 36) {
        ctx.fillRect(wx, trainY + 7, 24, 6);
      }
    }

    midBuildings.forEach((b) => {
      const by = horizonY - b.h;
      ctx.fillStyle = zone.midLayerColor;

      if (b.kind === 'cooling_tower' && state.currentZone === 1) {
        ctx.beginPath();
        ctx.moveTo(b.x, horizonY + 80);
        ctx.quadraticCurveTo(b.x + b.w * 0.24, by + b.h * 0.4, b.x + b.w * 0.14, by);
        ctx.lineTo(b.x + b.w * 0.86, by);
        ctx.quadraticCurveTo(b.x + b.w * 0.76, by + b.h * 0.4, b.x + b.w, horizonY + 80);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(b.x, by, b.w, b.h + 100);

        if (b.kind === 'crane_tower') {
          const cx = b.x + b.w * 0.5;
          ctx.fillRect(cx - 4, by - 85, 8, 85);
          ctx.fillRect(cx - 45, by - 80, 145, 5);
          ctx.fillRect(cx + 75, by - 75, 2, 42);
        }

        b.windows.forEach((win) => {
          ctx.fillStyle = zone.windowColors[win.cIdx % zone.windowColors.length];
          ctx.globalAlpha = 0.65;
          ctx.fillRect(b.x + win.rx, by + win.ry, win.w, win.h);
        });
        ctx.globalAlpha = 1.0;

        if (state.currentZone === 2 && b.hasHoloSign) {
          ctx.save();
          ctx.strokeStyle = zone.accentGlow;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.55;
          ctx.strokeRect(b.x + 12, by + 18, b.w - 24, 22);
          ctx.fillStyle = zone.accentGlow;
          ctx.globalAlpha = 0.18;
          ctx.fillRect(b.x + 12, by + 18, b.w - 24, 22);
          ctx.restore();
        }
      }
    });
  }

  function drawImmediateForeground() {
    ctx.fillStyle = '#0A0A0F';
    ctx.strokeStyle = '#0A0A0F';

    for (let i = 0; i < rooftops.length; i++) {
      const r = rooftops[i];

      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillRect(r.x - 8, r.y, r.w + 16, 14);

      if (r.hasLadder) {
        const lx = r.x - 14;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, r.y + 8);
        ctx.lineTo(lx, r.y + 180);
        ctx.moveTo(lx + 10, r.y + 8);
        ctx.lineTo(lx + 10, r.y + 180);
        for (let ry = r.y + 20; ry < r.y + 175; ry += 16) {
          ctx.moveTo(lx, ry);
          ctx.lineTo(lx + 10, ry);
        }
        ctx.stroke();
      }

      if (r.hasCableToNext && i < rooftops.length - 1) {
        const next = rooftops[i + 1];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.x + r.w - 15, r.y + 22);
        ctx.quadraticCurveTo(
          (r.x + r.w + next.x) * 0.5,
          Math.max(r.y, next.y) + 75,
          next.x + 15,
          next.y + 22
        );
        ctx.stroke();
      }

      // Rooftop Silhouette Props (Recessed slightly so they never obscure playable obstacles)
      ctx.save();
      ctx.globalAlpha = 0.48;
      r.props.forEach((p) => {
        const px = r.x + p.rx;
        const py = r.y;

        if (p.type === 'water_tower') {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px + 6, py);
          ctx.lineTo(px + 14, py - 55);
          ctx.moveTo(px + p.w - 6, py);
          ctx.lineTo(px + p.w - 14, py - 55);
          ctx.moveTo(px + 9, py - 28);
          ctx.lineTo(px + p.w - 9, py - 28);
          ctx.stroke();
          ctx.fillRect(px + 8, py - 102, p.w - 16, 48);
          ctx.beginPath();
          ctx.moveTo(px + 4, py - 102);
          ctx.lineTo(px + p.w * 0.5, py - 122);
          ctx.lineTo(px + p.w - 4, py - 102);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'antenna_mast') {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 12, py - p.h);
          ctx.lineTo(px + 24, py);
          for (let ay = py - 22; ay > py - p.h + 15; ay -= 22) {
            ctx.moveTo(px + 4, ay);
            ctx.lineTo(px + 20, ay - 10);
          }
          ctx.stroke();
        } else if (p.type === 'satellite_dish') {
          ctx.fillRect(px + 18, py - 26, 6, 26);
          ctx.beginPath();
          ctx.arc(px + 24, py - 36, 20, Math.PI * 0.75, Math.PI * 1.75);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'guard_rail') {
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py - 22, p.w, 22);
          ctx.beginPath();
          for (let gx = px + 20; gx < px + p.w; gx += 20) {
            ctx.moveTo(gx, py - 22);
            ctx.lineTo(gx, py);
          }
          ctx.stroke();
        } else if (p.type === 'chimney_pipe') {
          ctx.fillRect(px, py - p.h, 22, p.h);
          ctx.fillRect(px - 3, py - p.h, 28, 8);
        }
      });
      ctx.restore();
    }

    // Playable Parkour Obstacles
    obstacles.forEach((obs) => {
      ctx.save();
      ctx.fillStyle = '#0A0A0F';

      if (obs.type === 'VAULT_AC') {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = ZONES[state.currentZone].accentGlow;
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
        ctx.fillStyle = ZONES[state.currentZone].accentGlow;
        ctx.fillRect(obs.x + 8, obs.y + 8, 12, 3);
      } else if (obs.type === 'SLIDE_DUCT') {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillRect(obs.x + 4, obs.y - 14, 5, obs.roofY - (obs.y - 14));
        ctx.fillRect(obs.x + obs.w - 9, obs.y - 14, 5, obs.roofY - (obs.y - 14));
        ctx.fillStyle = '#ff9d2e';
        ctx.fillRect(obs.x + 4, obs.y + obs.h - 4, obs.w - 8, 3);
      } else if (obs.type === 'HIGH_VENT') {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + 8, obs.y);
        ctx.lineTo(obs.x + obs.w - 4, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawParkourCharacter(entity, isHunter) {
    ctx.save();
    ctx.translate(entity.x, entity.y);
    // Double character scale (2x) anchored at feet (0, 0)
    ctx.scale(2, 2);

    const useFullImg = (!state.swapRoles && isHunter) || (state.swapRoles && !isHunter);
    const rimColor = isHunter
      ? '#ff2a85'
      : state.ultraInstinctTimer > 0
      ? '#e2e8f0'
      : state.ultraTimer > 0
      ? '#4ade80'
      : '#00e5ff';

    if (entity.isSliding) {
      ctx.translate(0, -20);
      ctx.rotate(-Math.PI * 0.36);
      ctx.translate(0, 20);
    } else if (entity.isFlipping) {
      ctx.translate(0, -48);
      ctx.rotate(entity.flipAngle);
      ctx.translate(0, 48);
    } else if (entity.vaultTimer > 0) {
      ctx.translate(0, -46);
      ctx.rotate(0.45);
      ctx.translate(0, 46);
    }

    if (
      (state.renderStyle === 2 || (state.renderStyle === 0 && useFullImg)) &&
      assets.loaded.charFull &&
      useFullImg
    ) {
      const bob = entity.onGround ? Math.sin(entity.animPhase * 2) * 4 : 0;
      const tilt = entity.onGround ? 0.14 : -0.08;
      ctx.save();
      ctx.translate(0, -48 + bob);
      ctx.rotate(tilt);
      ctx.shadowColor = rimColor;
      ctx.shadowBlur = 14;
      ctx.drawImage(assets.charFull, -32, -52, 64, 104);
      ctx.restore();
      ctx.restore();
      return;
    }

    const phase = entity.animPhase;
    const bob = entity.onGround ? Math.abs(Math.sin(phase)) * 6 : 0;
    const hipY = -44 - bob;
    const shoulderX = 8;
    const shoulderY = hipY - 28;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const thigh1 = Math.sin(phase) * 0.75;
    const calf1 = Math.max(0, Math.sin(phase - 0.7)) * 1.1;
    const thigh2 = Math.sin(phase + Math.PI) * 0.75;
    const calf2 = Math.max(0, Math.sin(phase + Math.PI - 0.7)) * 1.1;

    const arm1 = Math.sin(phase + Math.PI) * 0.7;
    const arm2 = Math.sin(phase) * 0.7;

    const drawLimb = (sx, sy, a1, l1, a2, l2, width) => {
      const kx = sx + Math.sin(a1) * l1;
      const ky = sy + Math.cos(a1) * l1;
      const fx = kx + Math.sin(a1 - a2) * l2;
      const fy = ky + Math.cos(a1 - a2) * l2;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.lineWidth = width + 2.5;
      ctx.strokeStyle = rimColor;
      ctx.stroke();

      ctx.lineWidth = width;
      ctx.strokeStyle = '#0A0A0F';
      ctx.stroke();
    };

    drawLimb(0, hipY, thigh2, 22, calf2, 22, 8.5);
    drawLimb(shoulderX, shoulderY, arm2, 18, -0.85, 16, 7);

    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.lineWidth = 15.5;
    ctx.strokeStyle = rimColor;
    ctx.stroke();
    ctx.lineWidth = 13;
    ctx.strokeStyle = '#0A0A0F';
    ctx.stroke();

    drawLimb(0, hipY, thigh1, 22, calf1, 22, 9);
    drawLimb(shoulderX, shoulderY, arm1, 18, -0.9, 16, 7.5);

    const headX = shoulderX + 4;
    const headY = shoulderY - 14;

    if (state.renderStyle !== 1 && assets.loaded.charHead && !useFullImg) {
      ctx.save();
      ctx.translate(headX, headY);
      ctx.shadowColor = rimColor;
      ctx.shadowBlur = 10;
      ctx.drawImage(assets.charHead, -18, -22, 36, 40);
      ctx.restore();
    } else if (state.renderStyle !== 1 && assets.loaded.charFull && useFullImg) {
      ctx.save();
      ctx.translate(headX, headY);
      ctx.shadowColor = rimColor;
      ctx.shadowBlur = 10;
      ctx.drawImage(
        assets.charFull,
        0,
        0,
        assets.charFull.naturalWidth,
        assets.charFull.naturalHeight * 0.35,
        -18,
        -20,
        36,
        38
      );
      ctx.restore();
    } else {
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      ctx.arc(headX, headY, 10.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0A0A0F';
      ctx.beginPath();
      ctx.arc(headX, headY, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rimColor;
      ctx.fillRect(headX + 2, headY - 3, 7, 3);
    }

    ctx.restore();
  }

  function drawEffectsAndCallouts(zone) {
    // Draw Falling / Hovering Bonus Drops (Clean 2x uploaded image + subtle expiration timer when landing)
    bonusDrops.forEach((b) => {
      if (b.collected) return;
      const hoverY = b.y + Math.sin(b.phase) * 8;

      ctx.save();
      ctx.translate(b.x, hoverY);
      // Blink warning when < 1.5s left on pickup time limit
      if (b.ttl < 1.5 && Math.floor(b.ttl * 10) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }
      ctx.rotate(Math.sin(b.phase * 0.8) * 0.12);
      if (assets.loaded.bonusUltra) {
        ctx.drawImage(assets.bonusUltra, -b.size * 0.5, -b.size * 0.5, b.size, b.size);
      }
      ctx.restore();

      // Show pickup expiration countdown above item once landed
      if (b.y >= b.targetY - 2) {
        ctx.save();
        ctx.font = '800 13px "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = b.ttl < 1.8 ? '#ef4444' : '#facc15';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText(`${b.ttl.toFixed(1)}s`, b.x, hoverY - b.size * 0.42);
        ctx.restore();
      }
    });

    runner.trail.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.45;
      ctx.fillStyle = t.isUltraInstinct
        ? '#e2e8f0'
        : t.isUltra
        ? '#4ade80'
        : state.surgeActiveTimer > 0
        ? '#ff2a85'
        : '#00e5ff';
      ctx.beginPath();
      ctx.arc(t.x, t.y - (t.isSliding ? 44 : 96), 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Active Power Time Limit Overlay & Giant "HIGH ON GANJAAA" Ultra Instinct Banner
    if (state.ultraInstinctTimer > 0) {
      ctx.save();
      const pulse = 1 + Math.sin(state.time * 10) * 0.06;
      ctx.translate(W * 0.5, H * 0.24);
      ctx.scale(pulse, pulse);
      ctx.textAlign = 'center';

      ctx.font = '900 54px "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HIGH ON GANJAAA', 0, 0);

      ctx.font = '900 20px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillText(`★ ULTRA INSTINCT MODE — ${state.ultraInstinctTimer.toFixed(1)}s ★`, 0, 32);

      // Countdown progress bar
      const barW = 320;
      const pct = Math.max(0, state.ultraInstinctTimer / state.ultraInstinctDuration);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(-barW * 0.5, 44, barW, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-barW * 0.5, 44, barW * pct, 7);
      ctx.restore();
    } else if (state.ultraTimer > 0) {
      ctx.save();
      ctx.translate(W * 0.5, H * 0.22);
      ctx.textAlign = 'center';
      ctx.font = '900 26px "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#4ade80';
      ctx.fillText(`GANJAA POWER ACTIVATED — ${state.ultraTimer.toFixed(1)}s`, 0, 0);

      const barW = 240;
      const pct = Math.max(0, state.ultraTimer / state.ultraPowerDuration);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(-barW * 0.5, 12, barW, 6);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-barW * 0.5, 12, barW * pct, 6);
      ctx.restore();
    }

    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });

    if (zone.hasRain) {
      ctx.save();
      ctx.strokeStyle = 'rgba(175, 225, 255, 0.32)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      rainDrops.forEach((r) => {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.36, r.y + r.len);
      });
      ctx.stroke();
      ctx.restore();
    }

    floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 16px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x - 40, ft.y);
      ctx.restore();
    });
  }

  function render() {
    const zone = ZONES[state.currentZone];
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake;
      const sy = (Math.random() - 0.5) * state.screenShake;
      ctx.translate(sx, sy);
    }

    drawSkyAndBackgroundImage(zone);
    drawBackgroundLayer(zone);
    drawMidgroundLayer(zone);
    drawImmediateForeground();

    drawParkourCharacter(hunter, true);
    drawParkourCharacter(runner, false);

    drawEffectsAndCallouts(zone);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // RESPONSIVE LANDSCAPE VIEWPORT & VIRTUAL 720P SCALING
  // ---------------------------------------------------------------------------
  function handleResize() {
    const rawW = window.innerWidth;
    const rawH = window.innerHeight;

    // If on a mobile/portrait screen (rawH > rawW), auto-rotate the game container 90deg into landscape!
    isForcedLandscape = rawH > rawW;
    gameContainer.classList.toggle('force-landscape', isForcedLandscape);

    const viewW = isForcedLandscape ? rawH : rawW;
    const viewH = isForcedLandscape ? rawW : rawH;

    const aspect = Math.max(1.33, Math.min(2.4, viewW / Math.max(1, viewH)));
    H = 720;
    W = Math.round(H * aspect);

    canvas.width = W;
    canvas.height = H;
    initParallaxLayers();
    if (rooftops.length === 0) {
      resetWorld();
    }
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => setTimeout(handleResize, 120));
  handleResize();

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
