/**
 * THE GASLIGHT MIRROR - Core Application Engine
 * Architecture: Client-side vision (face-api.js) + Web Audio API synthesizer + Canvas2D FX
 */

(() => {
  'use strict';

  // ============================================================================
  // CONSTANTS & REACTION CAPTION POOLS
  // ============================================================================

  const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

  const CAPTIONS = {
    idle: [
      "Target missing. Searching for an ego to destabilize...",
      "Align your face with the optical sensors. Don't be shy.",
      "Scanning room for viable human specimens...",
      "Zero emotional input detected. Are you a mannequin?"
    ],
    mock: {
      mild: [
        "That expression isn't doing you any favors.",
        "Cheer up, it could be worse... wait, no it couldn't.",
        "A dramatic sigh in human form.",
        "Rough day or is that just your resting face?"
      ],
      sarcastic: [
        "Skill issue, honestly.",
        "Call the drama academy, we have a lead actor.",
        "World's smallest violin is currently out of service for you.",
        "Have you tried turning your mood off and on again?",
        "Bro is fighting invisible demons and losing.",
        "10/10 for theatrical sulking, 2/10 for composure."
      ],
      unhinged: [
        "Certified clown moment detected by neural weights.",
        "EMOTIONAL COLLAPSE: Initiating confetti barrage!",
        "Bro's emotional bandwidth is running on dial-up.",
        "The mirror is actively judging every life choice you made.",
        "Warning: High sodium levels detected from pure saltiness.",
        "Congratulations on achieving peak comedy by accident."
      ]
    },
    guilt: {
      mild: [
        "Smiling? In this economy?",
        "Don't get too comfortable with that joy.",
        "What did you forget to do today?",
        "A suspicious amount of optimism detected."
      ],
      sarcastic: [
        "Must be nice living in willful ignorance.",
        "Your unread notifications are weeping quietly.",
        "Someone else is doing your chores right now, aren't they?",
        "That happiness is purely temporary. Enjoy the next 4 seconds.",
        "Did you remember to water the plants or just your delusion?",
        "Overconfidence identified. Deploying corrective tears."
      ],
      unhinged: [
        "HOW DARE YOU SMILE WHILE THE PLANET SPINS IN CHAOS?!",
        "Auditing your happiness: Balance insufficient.",
        "Initiating moral crisis protocols immediately.",
        "A sudden wave of existential dread has been dispatched to your location.",
        "Happiness detected. Deploying emergency guilt deluge!"
      ]
    },
    threat: [
      "BOREDOM DETECTED. DO SOMETHING ENTERTAINING.",
      "NEURAL FLATLINE: Express an emotion or face the consequences!",
      "CRITICAL DULLNESS THRESHOLD EXCEEDED.",
      "THE MIRROR DEMANDS STIMULATION. 3 SECONDS REMAIN."
    ]
  };

  // ============================================================================
  // AUDIO SYNTHESIZER (WEB AUDIO API)
  // ============================================================================

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.masterGain = null;
    }

    ensure() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMute(mute) {
      this.isMuted = mute;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.35, this.ctx.currentTime, 0.05);
      }
    }

    playLaughTrack() {
      if (this.isMuted) return;
      this.ensure();
      const now = this.ctx.currentTime;
      const pitches = [260, 310, 245, 330, 290, 350, 230];

      pitches.forEach((freq, idx) => {
        const noteTime = now + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, noteTime + 0.09);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.1);
      });
    }

    playViolinSting() {
      if (this.isMuted) return;
      this.ensure();
      const now = this.ctx.currentTime;
      const duration = 1.8;
      const rootFreqs = [220, 261.63, 329.63]; // A minor chord (A3, C4, E4)

      rootFreqs.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
        filter.frequency.exponentialRampToValueAtTime(300, now + duration);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, now);
        lfoGain.gain.setValueAtTime(4.5, now);
        lfo.connect(osc.frequency);
        lfo.start(now + 0.3);
        lfo.stop(now + duration);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
      });
    }

    playAlarmBeep(step) {
      if (this.isMuted) return;
      this.ensure();
      const now = this.ctx.currentTime;
      const freq = step === 1 ? 880 : step === 2 ? 660 : 440;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    playClick() {
      if (this.isMuted) return;
      this.ensure();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // ============================================================================
  // PARTICLE & FX SYSTEMS
  // ============================================================================

  class ParticleSystem {
    constructor() {
      this.confetti = [];
      this.skulls = [];
      this.tears = [];
      this.rain = [];
    }

    burstConfetti(originX, originY, count = 45) {
      const colors = ['#e2ff38', '#ff2a5f', '#00f0ff', '#bd00ff', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.confetti.push({
          x: originX + (Math.random() - 0.5) * 60,
          y: originY + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 16,
          size: Math.random() * 10 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0,
          decay: Math.random() * 0.015 + 0.008
        });
      }
    }

    spawnSkulls(headX, headY) {
      if (this.skulls.length < 5) {
        this.skulls.push({
          centerX: headX,
          centerY: headY,
          radius: Math.random() * 90 + 90,
          angle: Math.random() * Math.PI * 2,
          speed: (Math.random() * 0.04 + 0.03) * (Math.random() > 0.5 ? 1 : -1),
          scale: Math.random() * 0.4 + 0.8,
          life: 1.0
        });
      }
    }

    spawnTears(leftEye, rightEye) {
      const spawnForEye = (eye) => {
        this.tears.push({
          x: eye.x + (Math.random() - 0.5) * 6,
          y: eye.y + 6,
          vy: Math.random() * 3 + 4,
          radius: Math.random() * 4 + 4,
          life: 1.0,
          decay: 0.018
        });
      };
      if (leftEye) spawnForEye(leftEye);
      if (rightEye) spawnForEye(rightEye);
    }

    initRain(width, height) {
      if (this.rain.length < 50) {
        for (let i = 0; i < 50; i++) {
          this.rain.push({
            x: Math.random() * width,
            y: Math.random() * height,
            length: Math.random() * 20 + 12,
            speed: Math.random() * 14 + 10,
            alpha: Math.random() * 0.35 + 0.15
          });
        }
      }
    }

    clear() {
      this.confetti = [];
      this.skulls = [];
      this.tears = [];
      this.rain = [];
    }

    updateAndDraw(ctx, width, height, currentMode) {
      // 1. Confetti
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const p = this.confetti[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        if (p.life <= 0 || p.y > height + 20) {
          this.confetti.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      // 2. Skulls
      for (let i = this.skulls.length - 1; i >= 0; i--) {
        const s = this.skulls[i];
        s.angle += s.speed;
        const x = s.centerX + Math.cos(s.angle) * s.radius;
        const y = s.centerY + Math.sin(s.angle) * (s.radius * 0.45);

        if (currentMode !== 'mock') {
          s.life -= 0.05;
          if (s.life <= 0) {
            this.skulls.splice(i, 1);
            continue;
          }
        }

        ctx.save();
        ctx.font = `${Math.floor(28 * s.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.shadowColor = '#e2ff38';
        ctx.shadowBlur = 10;
        ctx.fillText('💀', x, y);
        ctx.restore();
      }

      // 3. Tears
      for (let i = this.tears.length - 1; i >= 0; i--) {
        const t = this.tears[i];
        t.y += t.vy;
        t.vy += 0.12;
        t.life -= t.decay;

        if (t.life <= 0 || t.y > height) {
          this.tears.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = '#60a5fa';
        ctx.globalAlpha = Math.max(0, t.life * 0.85);
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(t.x - t.radius * 0.8, t.y);
        ctx.lineTo(t.x, t.y - t.radius * 2.2);
        ctx.lineTo(t.x + t.radius * 0.8, t.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 4. Gloomy Rain
      if (currentMode === 'guilt' && this.rain.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < this.rain.length; i++) {
          const r = this.rain[i];
          r.y += r.speed;
          r.x += 1.5;
          if (r.y > height) {
            r.y = -20;
            r.x = Math.random() * width;
          }
          ctx.globalAlpha = r.alpha;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + 3, r.y + r.length);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // ============================================================================
  // PROCEDURAL PARTY HAT & FACE OVERLAYS
  // ============================================================================

  function drawPartyHat(ctx, headCenter, headWidth) {
    const hatHeight = headWidth * 1.05;
    const hatBaseWidth = headWidth * 0.65;
    const tipX = headCenter.x;
    const tipY = headCenter.y - hatHeight;
    const baseLeftX = headCenter.x - hatBaseWidth / 2;
    const baseRightX = headCenter.x + hatBaseWidth / 2;
    const baseY = headCenter.y;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseRightX, baseY);
    ctx.quadraticCurveTo(headCenter.x, baseY + 12, baseLeftX, baseY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(baseLeftX, baseY, tipX, tipY);
    gradient.addColorStop(0, '#ff2a5f');
    gradient.addColorStop(0.3, '#e2ff38');
    gradient.addColorStop(0.6, '#00f0ff');
    gradient.addColorStop(1, '#bd00ff');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(255, 42, 95, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tipX, tipY - 4, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#e2ff38';
    ctx.shadowColor = '#e2ff38';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(baseLeftX, baseY, 6, 0, Math.PI * 2);
    ctx.arc(headCenter.x, baseY + 8, 6, 0, Math.PI * 2);
    ctx.arc(baseRightX, baseY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    ctx.restore();
  }

  function drawCyberReticle(ctx, box, confidence, landmarks = null) {
    ctx.save();
    const { x, y, width, height } = box;
    const bracketSize = Math.min(width, height) * 0.2;

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + bracketSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketSize, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + width - bracketSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + height - bracketSize);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + bracketSize, y + height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + width - bracketSize, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - bracketSize);
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px monospace';
    ctx.fillText(`TARGET_LOCK // CONF: ${(confidence * 100).toFixed(0)}%`, x, y - 6);

    if (landmarks) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      landmarks.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  // ============================================================================
  // MAIN CONTROLLER CLASS
  // ============================================================================

  class GaslightMirrorApp {
    constructor() {
      // DOM Elements
      this.video = document.getElementById('webcamVideo');
      this.canvas = document.getElementById('fxCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.viewportWrapper = document.getElementById('viewportWrapper');
      this.portalScreen = document.getElementById('portalScreen');
      this.startBtn = document.getElementById('startBtn');
      this.scanningHud = document.getElementById('scanningHud');
      this.scanningText = document.getElementById('scanningText');
      this.threatHud = document.getElementById('threatHud');
      this.countdownValue = document.getElementById('countdownValue');
      this.captionText = document.getElementById('captionText');
      this.statusChip = document.getElementById('statusChip');
      this.statusLabel = document.getElementById('statusLabel');
      this.fpsDisplay = document.getElementById('fpsDisplay');
      this.latencyDisplay = document.getElementById('latencyDisplay');
      this.targetFaceStatus = document.getElementById('targetFaceStatus');

      // Metric elements
      this.bars = {
        neutral: document.getElementById('barNeutral'),
        happy: document.getElementById('barHappy'),
        sad: document.getElementById('barSad'),
        angry: document.getElementById('barAngry'),
        fearful: document.getElementById('barFearful'),
        disgusted: document.getElementById('barDisgusted')
      };
      this.vals = {
        neutral: document.getElementById('valNeutral'),
        happy: document.getElementById('valHappy'),
        sad: document.getElementById('valSad'),
        angry: document.getElementById('valAngry'),
        fearful: document.getElementById('valFearful'),
        disgusted: document.getElementById('valDisgusted')
      };
      this.boredomBar = document.getElementById('boredomBar');
      this.boredomSeconds = document.getElementById('boredomSeconds');

      // Control elements
      this.btnAudioToggle = document.getElementById('btnAudioToggle');
      this.audioIcon = document.getElementById('audioIcon');
      this.audioLabel = document.getElementById('audioLabel');
      this.btnOverlayToggle = document.getElementById('btnOverlayToggle');
      this.btnSnapshot = document.getElementById('btnSnapshot');
      this.btnExit = document.getElementById('btnExit');
      this.intensityButtons = document.querySelectorAll('#intensitySelector .segmented-btn');

      // Receipt modal elements
      this.receiptModal = document.getElementById('receiptModal');
      this.receiptImage = document.getElementById('receiptImage');
      this.receiptTime = document.getElementById('receiptTime');
      this.receiptState = document.getElementById('receiptState');
      this.receiptScore = document.getElementById('receiptScore');
      this.receiptCaption = document.getElementById('receiptCaption');
      this.btnDownloadReceipt = document.getElementById('btnDownloadReceipt');
      this.btnCloseModal = document.getElementById('btnCloseModal');

      // Side Video Intervention System (Local Video Assets)
      this.sideVideoPanel = document.getElementById('sideVideoPanel');
      this.sideVideoPlayer = document.getElementById('sideVideoPlayer') || document.getElementById('sideVideoIframe');
      this.sideVideoIframe = document.getElementById('sideVideoIframe');
      this.sideVideoTitle = document.getElementById('sideVideoTitle');
      this.sideVideoFooter = document.getElementById('sideVideoFooter');
      this.sideVideoIcon = document.getElementById('sideVideoIcon');
      this.btnCloseSideVideo = document.getElementById('btnCloseSideVideo');
      this.activeVideoType = null;
      this.videoCooldown = 0;
      this._videoHideTimer = null;

      // Subsystems
      this.audio = new AudioEngine();
      this.particles = new ParticleSystem();

      // State
      this.isRunning = false;
      this.stream = null;
      this.currentMode = 'idle';
      this.roastIntensity = 'sarcastic';
      this.showLandmarks = false;
      this.neutralDuration = 0;
      this.lastDetectionTime = performance.now();
      this.threatCountdown = 3;
      this.threatInterval = null;
      this.lastCaptionSwapTime = 0;

      // Detection & Telemetry Tracking
      this.latestFace = null;
      this.frameCount = 0;
      this.lastFpsUpdate = performance.now();
      this.fps = 60;
      this.lastDetectionLatency = 0;
      this._isAiFetching = false;

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());

      // Audio toggle
      this.btnAudioToggle.addEventListener('click', () => {
        this.audio.ensure();
        const nextMute = !this.audio.isMuted;
        this.audio.setMute(nextMute);
        if (this.sideVideoPlayer && this.sideVideoPlayer.tagName === 'VIDEO') {
          this.sideVideoPlayer.muted = nextMute;
        }
        this.audioIcon.textContent = nextMute ? '🔇' : '🔊';
        this.audioLabel.textContent = nextMute ? 'AUDIO OFF' : 'AUDIO ON';
        this.btnAudioToggle.style.borderColor = nextMute ? 'var(--alarm)' : 'var(--border-dim)';
        if (!nextMute) this.audio.playClick();
      });

      // Landmark overlay toggle
      this.btnOverlayToggle.addEventListener('click', () => {
        this.showLandmarks = !this.showLandmarks;
        this.btnOverlayToggle.style.borderColor = this.showLandmarks ? 'var(--cyan)' : 'var(--border-dim)';
        this.audio.playClick();
      });

      // Intensity buttons
      this.intensityButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.intensityButtons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.roastIntensity = btn.getAttribute('data-intensity');
          this.audio.playClick();
          this.swapCaption(true);
        });
      });

      // Snapshot receipt button
      this.btnSnapshot.addEventListener('click', () => this.generateReceipt());

      // Emergency exit button
      this.btnExit.addEventListener('click', () => this.stop());

      // Modal controls
      this.btnCloseModal.addEventListener('click', () => {
        this.receiptModal.classList.remove('open');
        this.audio.playClick();
      });

      // Side video dismiss button
      if (this.btnCloseSideVideo) {
        this.btnCloseSideVideo.addEventListener('click', () => {
          this.hideSideVideo();
          this.videoCooldown = performance.now() + 15000; // 15s cooldown after manual close
          this.audio.playClick();
        });
      }

      // Preview rows
      const happyRow = document.querySelector('.emotion-row.happy');
      if (happyRow) {
        happyRow.style.cursor = 'pointer';
        happyRow.title = 'Click to preview Happy Reaction (/static/assets/sad.mp4)';
        happyRow.addEventListener('click', () => this.playSideVideo('happy'));
      }

      const sadRow = document.querySelector('.emotion-row.sad');
      if (sadRow) {
        sadRow.style.cursor = 'pointer';
        sadRow.title = 'Click to preview Sad Reaction (/static/assets/happy.mp4)';
        sadRow.addEventListener('click', () => this.playSideVideo('sad'));
      }

      const neutralRow = document.querySelector('.emotion-row.neutral');
      if (neutralRow) {
        neutralRow.style.cursor = 'pointer';
        neutralRow.title = 'Click to preview Neutral Video (/static/assets/neutral.mp4)';
        neutralRow.addEventListener('click', () => this.playSideVideo('neutral'));
      }

      this.btnDownloadReceipt.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `gaslight-receipt-${Date.now()}.png`;
        link.href = this.receiptImage.src;
        link.click();
      });

      // Responsive canvas resizing
      window.addEventListener('resize', () => this.syncCanvasSize());
    }

    syncCanvasSize() {
      if (!this.viewportWrapper) return;
      const rect = this.viewportWrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
      }
    }

    // ============================================================================
    // BOOTSTRAP & MODELS
    // ============================================================================

    async start() {
      this.audio.ensure();
      this.audio.playClick();

      this.portalScreen.classList.add('hidden');
      this.scanningHud.style.display = 'flex';
      this.scanningText.textContent = 'LOADING NEURAL MODELS...';

      try {
        await this.loadModels();
        await this.startWebcam();
        this.syncCanvasSize();

        this.isRunning = true;
        this.scanningHud.style.display = 'none';

        // Start detection loop (~180ms)
        this.scheduleDetection();

        // Start 60fps render loop
        requestAnimationFrame((t) => this.renderLoop(t));
      } catch (err) {
        console.error('Initialization error:', err);
        this.scanningText.innerHTML = `⚠️ ERROR: ${err.message || 'Camera or Model load failed.'}<br><small>Check permissions and refresh.</small>`;
      }
    }

    async loadModels() {
      if (typeof faceapi === 'undefined') {
        throw new Error('face-api.js failed to load from CDN. Check your internet connection.');
      }

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
    }

    async startWebcam() {
      this.scanningText.textContent = 'REQUESTING CAMERA ACCESS...';

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.video.srcObject = stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.syncCanvasSize();
          resolve();
        };
      });
    }

    stop() {
      this.isRunning = false;
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
      this.hideSideVideo();
      this.particles.clear();
      this.setMode('idle');
      this.portalScreen.classList.remove('hidden');
      this.audio.playClick();
    }

    // ============================================================================
    // LOCAL SIDE VIDEO SYSTEM (/static/assets/)
    // ============================================================================

    playSideVideo(type) {
      if (this.activeVideoType === type) return;
      if (performance.now() < this.videoCooldown) return;

      const VIDEOS = {
        happy: {
          file: '/static/assets/sad.mp4',
          src: '/static/assets/sad.mp4',
          title: '😢 SAD REACTION ACTIVATED',
          footer: 'HAPPINESS DETECTED • GUILT-TRIP INTERVENTION',
          icon: '😢'
        },
        sad: {
          file: '/static/assets/happy.mp4',
          src: '/static/assets/happy.mp4',
          title: '😄 HAPPY REACTION ACTIVATED',
          footer: 'SADNESS DETECTED • CELEBRATION DISPATCHED',
          icon: '😄'
        },
        neutral: {
          file: '/static/assets/neutral.mp4',
          src: '/static/assets/neutral.mp4',
          title: '😐 NEUTRAL FACE DETECTED',
          footer: 'AUDIO ON • NEUTRALITY PROTOCOL',
          icon: '😐'
        }
      };

      const cfg = VIDEOS[type];
      if (!cfg) return;

      this.activeVideoType = type;

      const panel = this.sideVideoPanel;
      const player = this.sideVideoPlayer || this.sideVideoIframe;

      if (panel && player) {
        if (this.sideVideoTitle) this.sideVideoTitle.textContent = cfg.title;
        if (this.sideVideoFooter) this.sideVideoFooter.textContent = cfg.footer;
        if (this.sideVideoIcon) this.sideVideoIcon.textContent = cfg.icon;

        panel.classList.add('active');

        const videoPath = cfg.file || cfg.src;

        if (player.tagName === 'VIDEO') {
          if (!player.src.endsWith(videoPath)) {
            player.src = videoPath;
          }
          player.currentTime = 0;
          player.loop = true;
          player.muted = this.audio ? this.audio.isMuted : false;

          const playPromise = player.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('[GaslightMirror] Unmuted autoplay blocked by browser, attempting muted playback:', err);
              player.muted = true;
              player.play().catch((e) => console.error('[GaslightMirror] Video autoplay blocked completely:', e));
            });
          }
        } else if (player.tagName === 'IFRAME') {
          player.src = videoPath;
        }

        setTimeout(() => this.syncCanvasSize(), 360);
      }
    }

    hideSideVideo() {
      if (!this.activeVideoType) return;
      this.activeVideoType = null;
      const panel = this.sideVideoPanel;
      const player = this.sideVideoPlayer || this.sideVideoIframe;
      if (panel) {
        panel.classList.remove('active');
      }
      if (player) {
        if (player.tagName === 'VIDEO') {
          player.pause();
          player.currentTime = 0;
          player.removeAttribute('src');
          player.load();
        } else if (player.tagName === 'IFRAME') {
          player.src = 'about:blank';
        }
        setTimeout(() => this.syncCanvasSize(), 360);
      }
    }

    // ============================================================================
    // DETECTION LOOP (Throttled ~180ms)
    // ============================================================================

    scheduleDetection() {
      if (!this.isRunning) return;

      setTimeout(async () => {
        const t0 = performance.now();
        await this.runDetectionStep();
        this.lastDetectionLatency = Math.round(performance.now() - t0);
        this.latencyDisplay.textContent = `${this.lastDetectionLatency}ms`;

        this.scheduleDetection();
      }, 180);
    }

    async runDetectionStep() {
      if (!this.video || this.video.readyState < 2) return;

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.4
      });

      try {
        const detection = await faceapi
          .detectSingleFace(this.video, options)
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detection) {
          this.targetFaceStatus.textContent = 'LOCKED';
          this.targetFaceStatus.style.color = 'var(--cyan)';

          const scaleX = this.canvas.width / this.video.videoWidth;
          const scaleY = this.canvas.height / this.video.videoHeight;

          const rawBox = detection.detection.box;
          const mirroredBox = {
            x: this.canvas.width - (rawBox.x + rawBox.width) * scaleX,
            y: rawBox.y * scaleY,
            width: rawBox.width * scaleX,
            height: rawBox.height * scaleY
          };

          const rawLandmarks = detection.landmarks.positions;
          const mirroredLandmarks = rawLandmarks.map((pt) => ({
            x: this.canvas.width - pt.x * scaleX,
            y: pt.y * scaleY
          }));

          this.latestFace = {
            box: mirroredBox,
            landmarks: mirroredLandmarks,
            expressions: detection.expressions,
            confidence: detection.detection.score
          };

          this.updateMetricBars(detection.expressions);
          this.evaluateEmotion(detection.expressions);
        } else {
          this.targetFaceStatus.textContent = 'SEARCHING';
          this.targetFaceStatus.style.color = 'var(--muted)';
          this.latestFace = null;
          this.resetMetricBars();
          this.setMode('idle');
        }
      } catch (err) {
        console.warn('Detection step error:', err);
      }
    }

    // ============================================================================
    // STATE MACHINE & EMOTIONAL EVALUATION
    // ============================================================================

    evaluateEmotion(expressions) {
      if (this.currentMode === 'threat' && this.threatInterval) {
        return;
      }

      const { happy, sad, angry, fearful, disgusted, neutral } = expressions;

      // 1. Happy Detection -> Sad Reaction Video (/static/assets/sad.mp4)
      if (happy > 0.4) {
        if (this._videoHideTimer) {
          clearTimeout(this._videoHideTimer);
          this._videoHideTimer = null;
        }
        this.playSideVideo('happy');
      }
      // 2. Sadness Detection -> Happy Reaction Video (/static/assets/happy.mp4)
      else if (sad > 0.35) {
        if (this._videoHideTimer) {
          clearTimeout(this._videoHideTimer);
          this._videoHideTimer = null;
        }
        this.playSideVideo('sad');
      }
      // 3. Neutral Detection -> Play Neutral Video (Y7WqiO-PNZA)
      else if (neutral > 0.45 && sad < 0.25 && happy < 0.3) {
        if (this._videoHideTimer) {
          clearTimeout(this._videoHideTimer);
          this._videoHideTimer = null;
        }
        this.playSideVideo('neutral');
      }
      // 4. Angry, fearful, or disgusted -> schedule hide
      else if (angry > 0.45 || fearful > 0.45 || disgusted > 0.45) {
        if (this.activeVideoType && !this._videoHideTimer) {
          this._videoHideTimer = setTimeout(() => {
            this.hideSideVideo();
            this._videoHideTimer = null;
          }, 2500);
        }
      }

      // Sad / Angry / Fearful / Disgusted -> Mockery
      const negativeScore = Math.max(sad, angry, fearful, disgusted);
      if (negativeScore > 0.4) {
        this.neutralDuration = 0;
        this.setMode('mock');
        return;
      }

      // Happy -> Guilt-Trip
      if (happy > 0.45) {
        this.neutralDuration = 0;
        this.setMode('guilt');
        return;
      }

      // Neutral -> Boredom tracker
      if (neutral > 0.5) {
        this.neutralDuration += 0.18;
        const clampedSeconds = Math.min(3.0, this.neutralDuration);
        this.boredomSeconds.textContent = `${clampedSeconds.toFixed(1)}s / 3.0s`;
        this.boredomBar.style.width = `${(clampedSeconds / 3.0) * 100}%`;

        if (this.neutralDuration >= 3.0) {
          this.triggerThreatMode();
        } else if (this.currentMode !== 'idle') {
          this.setMode('idle');
        }
        return;
      }

      this.neutralDuration = 0;
      this.setMode('idle');
    }

    setMode(newMode) {
      if (this.currentMode === newMode) return;

      this.currentMode = newMode;

      this.viewportWrapper.classList.remove('mode-mock', 'mode-guilt', 'mode-threat');
      if (newMode !== 'idle') {
        this.viewportWrapper.classList.add(`mode-${newMode}`);
      }

      this.statusChip.className = `status-chip ${newMode}`;
      const labels = {
        idle: 'SCANNING',
        mock: 'MOCKERY ACTIVE',
        guilt: 'GUILT-TRIP ACTIVE',
        threat: 'THREAT PROTOCOL'
      };
      this.statusLabel.textContent = labels[newMode] || newMode.toUpperCase();

      if (newMode === 'mock') {
        this.audio.playLaughTrack();
        if (this.latestFace) {
          const { box } = this.latestFace;
          this.particles.burstConfetti(box.x + box.width / 2, box.y + box.height / 2, 50);
          this.particles.spawnSkulls(box.x + box.width / 2, box.y + box.height / 2);
        }
      } else if (newMode === 'guilt') {
        this.audio.playViolinSting();
        this.particles.initRain(this.canvas.width, this.canvas.height);
      }

      this.swapCaption(true);
    }

    triggerThreatMode() {
      if (this.currentMode === 'threat') return;

      this.setMode('threat');
      this.threatHud.classList.add('active');
      this.threatCountdown = 3;
      this.countdownValue.textContent = '3';
      this.audio.playAlarmBeep(3);

      if (this.threatInterval) clearInterval(this.threatInterval);

      this.threatInterval = setInterval(() => {
        this.threatCountdown -= 1;
        if (this.threatCountdown > 0) {
          this.countdownValue.textContent = this.threatCountdown;
          this.audio.playAlarmBeep(this.threatCountdown);
        } else {
          clearInterval(this.threatInterval);
          this.threatInterval = null;
          this.threatHud.classList.remove('active');
          this.neutralDuration = 0;
          this.boredomBar.style.width = '0%';
          this.boredomSeconds.textContent = '0.0s / 3.0s';

          const nextPunishment = Math.random() > 0.5 ? 'mock' : 'guilt';
          this.setMode(nextPunishment);
        }
      }, 1000);
    }

    // ============================================================================
    // CAPTIONS & SUBTITLES
    // ============================================================================

    async swapCaption(force = false) {
      const now = performance.now();
      if (!force && now - this.lastCaptionSwapTime < 2400) return;
      this.lastCaptionSwapTime = now;

      let pool = CAPTIONS.idle;
      if (this.currentMode === 'mock') {
        pool = CAPTIONS.mock[this.roastIntensity] || CAPTIONS.mock.sarcastic;
      } else if (this.currentMode === 'guilt') {
        pool = CAPTIONS.guilt[this.roastIntensity] || CAPTIONS.guilt.sarcastic;
      } else if (this.currentMode === 'threat') {
        pool = CAPTIONS.threat;
      }

      const randomCaption = pool[Math.floor(Math.random() * pool.length)];

      this.captionText.classList.add('glitch');
      this.captionText.textContent = randomCaption;

      setTimeout(() => {
        this.captionText.classList.remove('glitch');
      }, 250);

      if (this.currentMode !== 'idle' && !this._isAiFetching) {
        this._isAiFetching = true;
        try {
          const dominantEmotion = this.currentMode === 'guilt' ? 'happy' : (this.currentMode === 'mock' ? 'sad/angry' : 'bored/neutral');
          const key = window.GaslightApi ? window.GaslightApi.getKey() : null;
          const model = window.GaslightApi ? window.GaslightApi.getModel() : null;

          const res = await fetch('/api/roast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emotion: dominantEmotion,
              intensity: this.roastIntensity,
              api_key: key,
              model: model
            })
          });
          const data = await res.json();
          if (data.status === 'success' && data.roast) {
            this.captionText.classList.add('glitch');
            this.captionText.textContent = data.roast;
            setTimeout(() => this.captionText.classList.remove('glitch'), 200);
          }
        } catch (e) {
          // Local fallback retained
        } finally {
          this._isAiFetching = false;
        }
      }
    }

    // ============================================================================
    // METRICS TELEMETRY UI
    // ============================================================================

    updateMetricBars(expressions) {
      for (const [key, element] of Object.entries(this.bars)) {
        if (element && expressions[key] !== undefined) {
          const pct = Math.round(expressions[key] * 100);
          element.style.width = `${pct}%`;
          if (this.vals[key]) {
            this.vals[key].textContent = `${pct}%`;
          }
        }
      }
    }

    resetMetricBars() {
      for (const element of Object.values(this.bars)) {
        if (element) element.style.width = '0%';
      }
      for (const element of Object.values(this.vals)) {
        if (element) element.textContent = '0%';
      }
      this.neutralDuration = 0;
      this.boredomBar.style.width = '0%';
      this.boredomSeconds.textContent = '0.0s / 3.0s';
    }

    // ============================================================================
    // RENDER LOOP (60 FPS Canvas2D)
    // ============================================================================

    renderLoop(timestamp) {
      if (!this.isRunning) return;

      this.frameCount++;
      if (timestamp - this.lastFpsUpdate >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
        this.fpsDisplay.textContent = this.fps;
        this.frameCount = 0;
        this.lastFpsUpdate = timestamp;
      }

      this.swapCaption(false);

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.latestFace) {
        const { box, landmarks, confidence } = this.latestFace;

        if (this.showLandmarks) {
          drawCyberReticle(this.ctx, box, confidence, landmarks);
        }

        if (this.currentMode === 'mock') {
          const headCenter = {
            x: box.x + box.width / 2,
            y: box.y + box.height * 0.08
          };
          drawPartyHat(this.ctx, headCenter, box.width);

          if (Math.random() < 0.1) {
            this.particles.spawnSkulls(headCenter.x, headCenter.y);
          }
        } else if (this.currentMode === 'guilt') {
          if (landmarks && landmarks.length >= 68) {
            const leftEye = landmarks[36];
            const rightEye = landmarks[45];
            this.particles.spawnTears(leftEye, rightEye);
          }
        }
      }

      this.particles.updateAndDraw(this.ctx, this.canvas.width, this.canvas.height, this.currentMode);

      requestAnimationFrame((t) => this.renderLoop(t));
    }

    // ============================================================================
    // SNAPSHOT / ROAST RECEIPT GENERATOR
    // ============================================================================

    generateReceipt() {
      this.audio.playClick();

      const compCanvas = document.createElement('canvas');
      compCanvas.width = 640;
      compCanvas.height = 480;
      const compCtx = compCanvas.getContext('2d');

      compCtx.save();
      compCtx.translate(compCanvas.width, 0);
      compCtx.scale(-1, 1);
      compCtx.drawImage(this.video, 0, 0, compCanvas.width, compCanvas.height);
      compCtx.restore();

      compCtx.drawImage(this.canvas, 0, 0, compCanvas.width, compCanvas.height);

      compCtx.save();
      compCtx.fillStyle = 'rgba(7, 9, 14, 0.75)';
      compCtx.fillRect(14, compCanvas.height - 70, compCanvas.width - 28, 56);
      compCtx.strokeStyle = 'var(--cyan)';
      compCtx.lineWidth = 1;
      compCtx.strokeRect(14, compCanvas.height - 70, compCanvas.width - 28, 56);

      compCtx.fillStyle = '#00f0ff';
      compCtx.font = 'bold 12px monospace';
      compCtx.fillText('GASLIGHT MIRROR // EMOTIONAL AUDIT RECEIPT', 24, compCanvas.height - 48);

      compCtx.fillStyle = '#f0f4f8';
      compCtx.font = '11px sans-serif';
      const truncatedCaption = this.captionText.textContent.slice(0, 75);
      compCtx.fillText(`"${truncatedCaption}"`, 24, compCanvas.height - 26);

      compCtx.translate(compCanvas.width - 120, 50);
      compCtx.rotate(-0.2);
      compCtx.strokeStyle = '#ff2a5f';
      compCtx.lineWidth = 3;
      compCtx.strokeRect(0, 0, 100, 36);
      compCtx.fillStyle = '#ff2a5f';
      compCtx.font = 'bold 14px monospace';
      compCtx.fillText('ROASTED', 16, 24);
      compCtx.restore();

      const dataUrl = compCanvas.toDataURL('image/png');
      this.receiptImage.src = dataUrl;

      const date = new Date();
      this.receiptTime.textContent = date.toLocaleTimeString();
      this.receiptState.textContent = this.currentMode.toUpperCase();
      this.receiptScore.textContent = `${Math.floor(Math.random() * 20 + 80)}% UNRELIABLE`;
      this.receiptCaption.textContent = `"${this.captionText.textContent}"`;

      this.receiptModal.classList.add('open');
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.gaslightApp = new GaslightMirrorApp();
  });
})();