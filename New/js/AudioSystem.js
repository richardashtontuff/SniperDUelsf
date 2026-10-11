// AudioSystem.js - Procedural Web Audio API Sound Synthesizer
// Zero external asset dependencies: guarantees 100% reliable, zero-latency audio

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- WEAPON SOUNDS ---

  playSniperShot() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Transient sharp click (crack)
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'triangle';
    crackOsc.frequency.setValueAtTime(2800, now);
    crackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
    crackGain.gain.setValueAtTime(1.0, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crackOsc.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackOsc.start(now);
    crackOsc.stop(now + 0.06);

    // 2. Heavy boom (sub-bass punch)
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(320, now);
    bassOsc.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    bassGain.gain.setValueAtTime(0.9, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.55);

    // 3. Reverberant noise blast & echo tail
    const bufferSize = this.ctx.sampleRate * 0.9;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseNode.start(now);
  }

  // Rapid punchy Assault Rifle (AR) gunshot
  playARRifleShot() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Sharp supersonic muzzle crack
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(1800, now);
    crackOsc.frequency.exponentialRampToValueAtTime(160, now + 0.04);
    crackGain.gain.setValueAtTime(0.75, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    crackOsc.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackOsc.start(now);
    crackOsc.stop(now + 0.05);

    // 2. Punchy rifle body blast (tight decay for rapid automatic firing)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(260, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    bodyGain.gain.setValueAtTime(0.8, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.masterGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.16);

    // 3. Compact mechanical chamber noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(1.8, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseNode.start(now);
  }

  // Fast tactical AR reload sequence (mag drop, click-in, bolt slap)
  playARRifleReload() {
    this.ensureContext();
    if (!this.ctx) return;
    // Mag drop (t = 0.2s)
    setTimeout(() => {
      this.playMetallicClick(1200, 600, 0.06, 0.35);
    }, 200);
    // Mag insert (t = 0.85s)
    setTimeout(() => {
      this.playMetallicClick(1800, 1100, 0.08, 0.5);
    }, 850);
    // Bolt release / charging handle snap (t = 1.35s)
    setTimeout(() => {
      this.playMetallicClick(2400, 900, 0.07, 0.6);
    }, 1350);
  }

  // RPG-7 Rocket Launcher Firing Audio: Muzzle blast followed by screaming rocket thruster roar
  playRPGLaunch() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Initial Muzzle Launch Blast (Heavy explosive thump)
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sawtooth';
    boomOsc.frequency.setValueAtTime(240, now);
    boomOsc.frequency.exponentialRampToValueAtTime(35, now + 0.38);
    boomGain.gain.setValueAtTime(0.9, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.45);

    // 2. High-speed Rocket Motor Thruster Roar / Whoosh
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.65);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.58);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // RPG 3.0-Second Reload Audio: Empty tube clank, slide fresh PG-7V rocket into tube, latch lock
  playRPGReload() {
    this.ensureContext();
    if (!this.ctx) return;
    // Stage 1: Empty launcher tube tilt & clank (t = 0.3s)
    setTimeout(() => {
      this.playMetallicClick(750, 280, 0.08, 0.4);
    }, 300);
    // Stage 2: Slide rocket warhead into front tube (t = 1.4s)
    setTimeout(() => {
      this.playMetallicClick(520, 880, 0.14, 0.55);
    }, 1400);
    // Stage 3: Rocket contact latch lock & hammer cock (t = 2.5s)
    setTimeout(() => {
      this.playMetallicClick(1500, 920, 0.07, 0.65);
    }, 2500);
  }

  // Bolt-action sequence: metallic lift & pull back, then push forward & lock
  playBoltAction() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Part 1: Bolt open/pull (t = 0.2s)
    setTimeout(() => {
      this.playMetallicClick(1400, 700, 0.07, 0.4);
    }, 220);

    // Shell eject clink (t = 0.45s)
    setTimeout(() => {
      this.playMetallicClick(2400, 1800, 0.04, 0.25);
    }, 450);

    // Part 2: Bolt push forward/lock (t = 0.75s)
    setTimeout(() => {
      this.playMetallicClick(800, 1500, 0.09, 0.45);
    }, 750);
  }

  playMetallicClick(freqStart, freqEnd, duration, volume = 0.3) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playReload() {
    this.ensureContext();
    if (!this.ctx) return;
    // Magazine drop
    this.playMetallicClick(600, 300, 0.12, 0.35);
    // Magazine insertion after 1.1s
    setTimeout(() => {
      this.playMetallicClick(900, 1600, 0.1, 0.4);
    }, 1100);
    // Bolt rack after 1.7s
    setTimeout(() => {
      this.playMetallicClick(1300, 800, 0.08, 0.4);
    }, 1700);
  }

  playEmptyDryFire() {
    this.ensureContext();
    this.playMetallicClick(2200, 1100, 0.03, 0.25);
  }

  playKnifeSlash() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  playKnifeInspect() {
    this.ensureContext();
    this.playMetallicClick(3200, 2400, 0.05, 0.15);
  }

  // --- GRENADE & EXPLOSION AUDIO ---

  playGrenadePin() {
    this.ensureContext();
    this.playMetallicClick(2800, 1600, 0.06, 0.35);
  }

  playGrenadeBounce() {
    this.ensureContext();
    this.playMetallicClick(550, 220, 0.08, 0.4);
  }

  playExplosion() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Deep Sub-Bass Shockwave Rumble (130Hz -> 25Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 1.3);

    // 2. High Explosive Blast Noise & Pressure Wave
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.16));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.6);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    whiteNoise.start(now);

    // 3. Shrapnel / Debris Clatter
    setTimeout(() => {
      this.playMetallicClick(1800, 400, 0.08, 0.35);
    }, 110);
  }

  // --- HITMARKERS & COMBAT FEEDBACK ---

  playHitmarker(isHeadshot = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (isHeadshot) {
      // Iconic crisp double dink (high harmonic bell)
      [1900, 2500].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.45, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.13);
      });
    } else {
      // Crisp single thud/tick
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  playFootstep() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Slide sound effect
  playSlide() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noiseNode.start(now);
  }

  // --- PROCEDURAL LOBBY SYNTHWAVE BGM ---
  startLobbyMusic() {
    this.ensureContext();
    if (!this.ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.14;
    this.bgmGain.connect(this.masterGain);

    const bassNotes = [110, 110, 130.81, 146.83, 98, 98, 123.47, 130.81]; // A2, C3, D3, G2, B2
    const arpNotes = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass pulse
      if (step % 2 === 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        const bFreq = bassNotes[(step / 2) % bassNotes.length];
        bOsc.frequency.setValueAtTime(bFreq, now);

        const bFilter = this.ctx.createBiquadFilter();
        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(450, now);
        bFilter.frequency.exponentialRampToValueAtTime(120, now + 0.3);

        bGain.gain.setValueAtTime(0.3, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.bgmGain);
        bOsc.start(now);
        bOsc.stop(now + 0.35);
      }

      // Arpeggio chime
      const aOsc = this.ctx.createOscillator();
      const aGain = this.ctx.createGain();
      aOsc.type = 'triangle';
      aOsc.frequency.setValueAtTime(arpNotes[step % arpNotes.length], now);

      aGain.gain.setValueAtTime(0.12, now);
      aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      aOsc.connect(aGain);
      aGain.connect(this.bgmGain);
      aOsc.start(now);
      aOsc.stop(now + 0.25);

      step++;
    }, 220);
  }

  stopLobbyMusic() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  // --- MATCH & UI SOUNDS ---

  playCountdownTick() {
    this.ensureContext();
    this.playMetallicClick(880, 880, 0.08, 0.3);
  }

  playRoundStart() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  playRoundWon() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.3, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  }

  playRoundLost() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.25, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.45);
    });
  }

  // --- UNBOXING CASE SOUNDS ---

  playCrateTick() {
    this.ensureContext();
    this.playMetallicClick(2200, 1800, 0.02, 0.2);
  }

  playUnlockFanfare(rarity) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    let notes = [523.25, 659.25, 783.99, 1046.5];
    if (rarity === 'legendary' || rarity === 'exotic') {
      notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    }
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.35, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.55);
    });
  }
}
