// main.js - Browser-Based "SNIPER DUELS" 3D Engine Entry Point
import * as THREE from '../vendor/three/three.module.js';
import { AudioSystem } from './AudioSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { MapGenerator } from './MapGenerator.js';
import { CameraManager } from './CameraManager.js';
import { FPSControls } from './Controls.js';
import { WeaponSystem } from './WeaponSystem.js';
import { BotAI } from './BotAI.js';
import { CaseSystem } from './CaseSystem.js';
import { MatchManager } from './MatchManager.js';
import { MultiplayerClient } from './MultiplayerClient.js';
import { AssetLoader } from './AssetLoader.js';
import { DummyBot } from './DummyBot.js';

// Available weapons registry for scalable loadouts
export const WEAPON_REGISTRY = [
  {
    id: 'SNIPER',
    name: 'AWP Sniper Rifle',
    category: 'PRIMARY WEAPON',
    icon: '🎯',
    color: '#00d2ff',
    badge: '1-SHOT HEADSHOT',
    damage: 100,
    ammo: 5,
    maxAmmo: 5,
    rpm: 48,
    fireMode: 'Bolt-Action',
    optic: 'High-Power Scope',
    description: 'Precision bolt-action sniper rifle. Instakill headshots, 5 rounds per magazine, high-magnification optical scope overlay.'
  },
  {
    id: 'AR',
    name: 'M4A1 Assault Rifle',
    category: 'PRIMARY WEAPON',
    icon: '⚡',
    color: '#ffaa00',
    badge: 'RAPID AUTO-FIRE',
    damage: 5,
    ammo: 30,
    maxAmmo: 30,
    rpm: 600,
    fireMode: 'Full-Automatic',
    optic: 'Reflex Holo Sight',
    description: 'Rapid automatic tactical carbine. 30 bullets, 5 dmg per shot, 600 RPM. Aiming down sights tightens spread significantly.'
  },
  {
    id: 'RPG',
    name: 'RPG-7 Rocket Launcher',
    category: 'PRIMARY WEAPON',
    icon: '🚀',
    color: '#00e5ff',
    badge: 'EXPANDED SPLASH & SPEED',
    damage: 75,
    ammo: 1,
    maxAmmo: 1,
    rpm: 20,
    fireMode: 'Single Rocket',
    optic: 'PGO-7 Sight',
    description: 'Anti-tank rocket launcher. Fires fast high-explosive rockets (88 m/s) with an 11.5m blast radius and gentle damage falloff. Launches targets. Zero self-damage to shooter. 3s reload.'
  }
];

export class GameEngine {
  constructor() {
    this.container = document.getElementById('canvas-container');

    const initW = window.innerWidth > 0 ? window.innerWidth : 800;
    const initH = window.innerHeight > 0 ? window.innerHeight : 600;

    // 1. Core WebGL Renderer (Optimized for High Framerate & Crisp Esports Visuals)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(initW, initH);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0x0c1322, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 2. World Scene & Atmospheric Lighting (Cinematic Esports Arena)
    this.worldScene = new THREE.Scene();
    this.worldScene.background = new THREE.Color(0x0c1322);
    this.worldScene.fog = new THREE.FogExp2(0x0c1322, 0.0055);

    // Hemisphere skylight (vibrant cyan zenith + deep indigo bounce fill)
    const hemiLight = new THREE.HemisphereLight(0xdaf0ff, 0x141f33, 1.35);
    this.worldScene.add(hemiLight);

    // Primary Sun Directional Light (crisp warm key light + tight high-res shadow frustum)
    const dirLight = new THREE.DirectionalLight(0xfffaee, 2.1);
    dirLight.position.set(32, 50, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 55;
    dirLight.shadow.camera.bottom = -55;
    dirLight.shadow.bias = -0.0002;
    dirLight.shadow.normalBias = 0.025;
    this.worldScene.add(dirLight);

    // Secondary Cool Blue Rim Light (rim lighting on players and weapon silhouettes)
    const rimDirLight = new THREE.DirectionalLight(0x00d2ff, 0.55);
    rimDirLight.position.set(-25, 20, -35);
    this.worldScene.add(rimDirLight);

    // Overhead Lobby Spot/Point Lights
    const lobbyCenterLight = new THREE.PointLight(0x00ffff, 4.0, 48);
    lobbyCenterLight.position.set(0, 7.5, -100);
    this.worldScene.add(lobbyCenterLight);

    const targetRangeLight = new THREE.PointLight(0xffffff, 3.2, 42);
    targetRangeLight.position.set(0, 6.5, -118);
    this.worldScene.add(targetRangeLight);

    const shopLight = new THREE.PointLight(0xffaa00, 2.8, 32);
    shopLight.position.set(-16, 6.5, -85);
    this.worldScene.add(shopLight);

    const mapTermLight = new THREE.PointLight(0x00d2ff, 2.8, 32);
    mapTermLight.position.set(16, 6.5, -85);
    this.worldScene.add(mapTermLight);

    // 3. Subsystems
    this.audio = new AudioSystem();
    this.particles = new ParticleSystem(this.worldScene);
    this.map = new MapGenerator(this.worldScene);
    this.map.buildMap();

    // 4. Dual Camera Manager
    this.cameraManager = new CameraManager(this.renderer, initW / initH);

    // 5. FPS Controls
    this.controls = new FPSControls(
      this.cameraManager.worldCamera,
      this.renderer.domElement,
      this.map
    );
    this.worldScene.add(this.controls.yawObject);

    // 6. Weapon System (Sniper & Knife Viewmodels)
    this.weaponSystem = new WeaponSystem(
      this.cameraManager.vmScene,
      this.audio,
      this.particles
    );
    this.weaponSystem.setCameraManager(this.cameraManager);

    // 7. Bot Opponent
    this.bot = new BotAI(
      this.worldScene,
      this.map,
      this.audio,
      this.particles
    );

    // 8. Economy & Case Unboxing System
    this.caseSystem = new CaseSystem(this.audio, this.weaponSystem);

    // 9. Match Engine (First to 6 Wins)
    this.matchManager = new MatchManager(
      this.controls,
      this.bot,
      this.map,
      this.audio,
      this.particles,
      this.caseSystem
    );

    // 10. Real-time Multiplayer Client
    this.mpClient = new MultiplayerClient(this);
    this.matchManager.setMultiplayerClient(this.mpClient);
    this.matchManager.setWeaponSystem(this.weaponSystem);
    this.matchManager.game = this;

    // 11. Physics Sandbox Dummy Bot (Dedicated Testing Lab)
    this.dummyBot = new DummyBot(this.worldScene);
    this.pendingShot = false;

    // 12. Tactical Grenades & Aiming Trajectory
    this.activeGrenades = [];
    this.activeRockets = [];
    this.isAimingGrenade = false;
    this.initGrenadeTrajectory();

    // Wire input events & combat
    this.setupEvents();

    // Clock
    this.clock = new THREE.Clock();

    window.__gameEngineInstance = this;

    // Render initial frame immediately so the 3D scene is drawn on canvas
    this.cameraManager.render(this.worldScene, this.weaponSystem.vmScene, this.weaponSystem.currentSlot);

    // If user clicked play before engine initialized, start now
    if (window.__pendingStart && typeof window.onStartGameClick === 'function') {
      window.onStartGameClick();
    }

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEvents() {
    // Resume audio context and start game on play button or blocker click
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.ensureContext();
        this.controls.startGame();
      });
      playBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.audio.ensureContext();
        this.controls.startGame();
      });
    }

    const blocker = document.getElementById('blocker');
    if (blocker) {
      blocker.addEventListener('click', () => {
        this.audio.ensureContext();
        this.controls.startGame();
      });
    }

    window.addEventListener('click', () => {
      this.audio.ensureContext();
    });

    // Window Resize
    window.addEventListener('resize', () => {
      this.cameraManager.onResize(window.innerWidth, window.innerHeight);
    });

    // Tab Focus & Visibility Monitoring:
    // If player is not focused into this tab during an active match, they forfeit to lobby and opponent wins
    let unfocusDebounceTimer = null;
    const checkTabFocusLoss = () => {
      if (unfocusDebounceTimer) clearTimeout(unfocusDebounceTimer);
      unfocusDebounceTimer = setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          if (this.matchManager && this.matchManager.isInActiveMatch()) {
            this.matchManager.handleMatchForfeit('UNFOCUSED');
          }
        }
      }, 120);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        checkTabFocusLoss();
      }
    });

    window.addEventListener('blur', () => {
      if (this.matchManager && this.matchManager.isOnQueuePad && this.mpClient) {
        this.mpClient.stepOffQueuePad();
      }
      checkTabFocusLoss();
    });

    window.addEventListener('focus', () => {
      if (unfocusDebounceTimer) {
        clearTimeout(unfocusDebounceTimer);
        unfocusDebounceTimer = null;
      }
    });

    // Weapon Switching hotkeys (1, 2, Q)
    this.controls.onSlotSwitch = (slot) => {
      let targetSlot = slot;
      if (targetSlot === 'SNIPER' || targetSlot === 'PRIMARY') {
        targetSlot = this.weaponSystem.primaryWeapon;
      }
      this.weaponSystem.equipSlot(targetSlot);
      this.controls.currentWeaponSlot = this.weaponSystem.currentSlot;
      this.updateHUDWeapon();
    };

    this.controls.onQuickSwitch = () => {
      this.weaponSystem.quickSwitch();
      this.controls.currentWeaponSlot = this.weaponSystem.currentSlot;
      this.updateHUDWeapon();
    };

    // Tactical Grenade Aim & Throw callbacks
    this.controls.onGrenadeAim = (isAiming) => {
      if (this.weaponSystem.currentSlot !== 'GRENADE') return;
      this.isAimingGrenade = isAiming;
      this.weaponSystem.isAimingThrow = isAiming;
      if (this.trajectoryGroup) {
        this.trajectoryGroup.visible = isAiming;
      }
    };

    this.controls.onGrenadeThrow = () => {
      if (this.weaponSystem.currentSlot !== 'GRENADE') return;
      this.isAimingGrenade = false;
      this.weaponSystem.isAimingThrow = false;
      if (this.trajectoryGroup) {
        this.trajectoryGroup.visible = false;
      }
      this.throwGrenade();
    };

    // Return to Lobby / Forfeit Match (L)
    this.controls.onReturnLobby = () => {
      if (this.matchManager.isInActiveMatch()) {
        this.matchManager.handleMatchForfeit('FORFEIT');
      } else if (this.matchManager.state === 'TESTING_LAB') {
        this.matchManager.leaveTestingLab();
      } else {
        this.matchManager.returnToLobby();
      }
    };

    // Inspect (F)
    this.controls.onInspect = () => {
      this.weaponSystem.inspect();
    };

    // Reload (R)
    this.controls.onReload = () => {
      this.weaponSystem.reload();
      this.updateHUDWeapon();
    };

    // ADS (Right Click)
    this.controls.onADS = (aiming) => {
      this.weaponSystem.setADS(aiming);
    };

    // Mouse Sway
    this.controls.onMouseMove = (dx, dy) => {
      this.weaponSystem.addSway(dx, dy);
    };

    // Slide callback
    this.controls.onSlide = () => {
      this.audio.playSlide();
    };

    // Map changed callback
    this.map.onMapChanged = (name, waypoints) => {
      this.bot.setWaypoints(waypoints);
    };

    // Interact (E)
    this.controls.onInteract = () => {
      const pPos = this.controls.getPosition();
      const shopPos = new THREE.Vector3(-16, 0.5, -85);
      const mapPos = new THREE.Vector3(16, 0.5, -85);

      if (pPos.distanceTo(shopPos) < 6.0) {
        document.exitPointerLock();
        this.caseSystem.openShopModal();
      } else if (pPos.distanceTo(mapPos) < 6.0) {
        document.exitPointerLock();
        this.openMapModal();
      }
    };

    // Shoot (Left Click)
    this.controls.onShoot = () => {
      this.handleShoot();
    };

    // Helper to bind both click & touchend for mobile reliability
    const bindAction = (el, handler) => {
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handler(e);
      });
      el.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handler(e);
      });
    };

    // Weapon Selector Chips
    const slotChips = document.querySelectorAll('.slot-chip');
    slotChips.forEach(chip => {
      bindAction(chip, () => {
        let slot = chip.getAttribute('data-slot');
        if (slot === 'SNIPER') {
          slot = this.weaponSystem.primaryWeapon;
        }
        if (slot) {
          this.weaponSystem.equipSlot(slot);
          this.controls.currentWeaponSlot = this.weaponSystem.currentSlot;
          this.updateHUDWeapon();
        }
      });
    });

    // Weapon card tap to quick-switch
    const weaponCard = document.querySelector('.weapon-card');
    if (weaponCard) {
      bindAction(weaponCard, () => {
        this.weaponSystem.quickSwitch();
        this.controls.currentWeaponSlot = this.weaponSystem.currentSlot;
        this.updateHUDWeapon();
      });
    }

    // Initialize Dedicated Weapon Loadout & Inventory Modal
    this.initLoadoutModal();

    // UI Buttons (Shop, Maps, Settings)
    const shopBtn = document.getElementById('shop-open-btn');
    bindAction(shopBtn, () => {
      try { document.exitPointerLock(); } catch (err) {}
      this.caseSystem.openShopModal();
    });

    const shopCloseBtn = document.getElementById('shop-close-btn');
    bindAction(shopCloseBtn, () => {
      this.caseSystem.closeShopModal();
    });

    const mapBtn = document.getElementById('map-open-btn');
    bindAction(mapBtn, () => {
      try { document.exitPointerLock(); } catch (err) {}
      this.openMapModal();
    });

    const mapCloseBtn = document.getElementById('map-close-btn');
    bindAction(mapCloseBtn, () => {
      this.closeMapModal();
    });

    // Mobile Virtual Controls Toggle
    const mobToggleBtn = document.getElementById('mobile-toggle-btn');
    bindAction(mobToggleBtn, () => {
      const mob = document.getElementById('mobile-controls');
      if (mob) {
        mob.style.display = (mob.style.display === 'block') ? 'none' : 'block';
      }
    });

    // Map Cards click & touch
    const mapCards = document.querySelectorAll('.map-card');
    mapCards.forEach(card => {
      bindAction(card, () => {
        if (this.matchManager.isTwoPlayer || this.matchManager.state !== 'LOBBY') {
          return;
        }
        const mapName = card.getAttribute('data-map');
        mapCards.forEach(c => {
          c.classList.remove('selected');
          const b = c.querySelector('.map-select-btn');
          if (b) b.textContent = 'SELECT MAP';
        });
        card.classList.add('selected');
        const activeB = card.querySelector('.map-select-btn');
        if (activeB) activeB.textContent = 'SELECTED';
        this.map.loadArena(mapName);
      });
    });

    // Settings Modal
    const settingsBtn = document.getElementById('settings-open-btn');
    bindAction(settingsBtn, () => {
      try { document.exitPointerLock(); } catch (err) {}
      this.openSettingsModal();
    });

    const settingsCloseBtn = document.getElementById('settings-close-btn');
    bindAction(settingsCloseBtn, () => {
      this.closeSettingsModal();
    });

    // Settings inputs
    const sensSlider = document.getElementById('sens-slider');
    const sensVal = document.getElementById('sens-val');
    if (sensSlider && sensVal) {
      sensSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.controls.mouseSensitivity = val;
        sensVal.textContent = (val * 1000).toFixed(1);
      });
    }

    const fovSlider = document.getElementById('fov-slider');
    const fovVal = document.getElementById('fov-val');
    if (fovSlider && fovVal) {
      fovSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.cameraManager.baseFov = val;
        this.cameraManager.worldCamera.fov = val;
        this.cameraManager.worldCamera.updateProjectionMatrix();
        fovVal.textContent = `${val}°`;
      });
    }

    const bgmBtn = document.getElementById('bgm-toggle-btn');
    if (bgmBtn) {
      bgmBtn.addEventListener('click', () => {
        if (this.audio.isBgmPlaying) {
          this.audio.stopLobbyMusic();
          bgmBtn.textContent = 'MUSIC: OFF';
          bgmBtn.style.background = '#e74c3c';
        } else {
          this.audio.startLobbyMusic();
          bgmBtn.textContent = 'MUSIC: ON';
          bgmBtn.style.background = '#2ecc71';
        }
      });
    }

    const crosshairColorSelect = document.getElementById('crosshair-color-select');
    if (crosshairColorSelect) {
      crosshairColorSelect.addEventListener('change', (e) => {
        const color = e.target.value;
        const lines = document.querySelectorAll('.crosshair-line');
        const dot = document.querySelector('.crosshair-dot');
        lines.forEach(l => l.style.backgroundColor = color);
        if (dot) dot.style.backgroundColor = color;
      });
    }

    const tutorialReplayBtn = document.getElementById('tutorial-replay-btn');
    if (tutorialReplayBtn) {
      bindAction(tutorialReplayBtn, () => {
        this.closeSettingsModal();
        if (this.startTutorialTour) this.startTutorialTour(true);
      });
    }

    // Initialize User Authentication System (Wasmer MySQL / LocalStorage)
    this.initAuthSystem();
    this.initTutorialTour();
  }

  // ==========================================
  // WEAPON LOADOUT & INVENTORY MODAL (SCALABLE CELL GRID)
  // ==========================================
  initLoadoutModal() {
    const modal = document.getElementById('loadout-modal');
    const openBtn = document.getElementById('loadout-open-btn');
    const closeBtn = document.getElementById('loadout-close-btn');
    const gridContainer = document.getElementById('loadout-grid-container');
    const activeTag = document.getElementById('loadout-active-tag');

    const renderGrid = () => {
      if (!gridContainer) return;
      gridContainer.innerHTML = '';

      WEAPON_REGISTRY.forEach(gun => {
        const isEquipped = this.weaponSystem.primaryWeapon === gun.id;
        const cell = document.createElement('div');
        cell.className = `weapon-cell ${isEquipped ? 'equipped' : ''}`;
        cell.id = `weapon-cell-${gun.id.toLowerCase()}`;
        cell.innerHTML = `
          <div class="weapon-cell-top">
            <span class="weapon-cell-cat">${gun.category}</span>
            <span class="weapon-cell-badge" style="border: 1px solid ${gun.color}66; color: ${gun.color}">${gun.badge}</span>
          </div>
          <div class="weapon-cell-main">
            <div class="weapon-cell-icon">${gun.icon}</div>
            <div>
              <div class="weapon-cell-title" style="color: ${gun.color}">${gun.name}</div>
              <div style="font-size: 11px; color: #8892b0; font-weight: 700; margin-top: 2px;">${gun.optic}</div>
            </div>
          </div>
          <div class="weapon-cell-stats">
            <div class="stat-item">
              <span class="stat-label">DAMAGE</span>
              <span class="stat-val">${gun.damage} HP</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MAGAZINE</span>
              <span class="stat-val">${gun.maxAmmo} RDS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">FIRE RATE</span>
              <span class="stat-val">${gun.rpm} RPM</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">OPERATION</span>
              <span class="stat-val">${gun.fireMode}</span>
            </div>
          </div>
          <div class="weapon-cell-desc">${gun.description}</div>
          <button class="weapon-equip-btn" data-gun="${gun.id}">
            ${isEquipped ? 'EQUIPPED ✓' : 'EQUIP WEAPON'}
          </button>
        `;

        const equipBtn = cell.querySelector('.weapon-equip-btn');
        const handleEquip = (e) => {
          if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
          if (this.matchManager.state === 'ROUND_ACTIVE') return;
          this.weaponSystem.setPrimaryWeapon(gun.id);
          renderGrid();
          this.updateHUDWeapon();
        };

        equipBtn.addEventListener('click', handleEquip);
        equipBtn.addEventListener('touchend', handleEquip, { passive: false });

        gridContainer.appendChild(cell);
      });

      if (activeTag) {
        const activeGun = WEAPON_REGISTRY.find(g => g.id === this.weaponSystem.primaryWeapon) || WEAPON_REGISTRY[0];
        activeTag.textContent = `CURRENT: ${activeGun.name.toUpperCase()}`;
        activeTag.style.color = activeGun.color;
        activeTag.style.borderColor = activeGun.color;
      }

      const chip1 = document.getElementById('slot-chip-sniper');
      if (chip1) {
        const activeGun = WEAPON_REGISTRY.find(g => g.id === this.weaponSystem.primaryWeapon);
        if (activeGun && activeGun.id === 'RPG') {
          chip1.innerHTML = '<span class="chip-num">1</span> 🚀 RPG-7';
        } else if (activeGun && activeGun.id === 'AR') {
          chip1.innerHTML = '<span class="chip-num">1</span> ⚡ AR-RIFLE';
        } else {
          chip1.innerHTML = '<span class="chip-num">1</span> 🔫 AWP';
        }
      }
    };

    if (openBtn) {
      const handleOpen = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        if (this.matchManager.state === 'ROUND_ACTIVE') return;
        try { document.exitPointerLock(); } catch (err) {}
        renderGrid();
        if (modal) modal.style.display = 'flex';
      };
      openBtn.addEventListener('click', handleOpen);
      openBtn.addEventListener('touchend', handleOpen, { passive: false });
    }

    if (closeBtn) {
      const handleClose = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        if (modal) modal.style.display = 'none';
      };
      closeBtn.addEventListener('click', handleClose);
      closeBtn.addEventListener('touchend', handleClose, { passive: false });
    }

    renderGrid();
  }

  // ==========================================
  // USER AUTHENTICATION SUBSYSTEM
  // ==========================================
  initAuthSystem() {
    this.authMode = 'login';
    this.currentUser = null;

    const widgetBtn = document.getElementById('auth-widget-btn');
    const widgetText = document.getElementById('auth-widget-text');
    const menuBtn = document.getElementById('auth-menu-btn');
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-close-btn');

    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formFields = document.getElementById('auth-form-fields');
    const profileView = document.getElementById('auth-profile-view');
    const profileUser = document.getElementById('auth-profile-username');
    const logoutBtn = document.getElementById('auth-logout-btn');

    const usernameInput = document.getElementById('auth-username-input');
    const passwordInput = document.getElementById('auth-password-input');
    const submitBtn = document.getElementById('auth-submit-btn');
    const feedback = document.getElementById('auth-feedback');

    const showFeedback = (msg, isError = false) => {
      if (!feedback) return;
      feedback.style.display = 'block';
      feedback.className = `auth-feedback ${isError ? 'error' : 'success'}`;
      feedback.textContent = msg;
    };

    const clearFeedback = () => {
      if (feedback) feedback.style.display = 'none';
    };

    const updateAuthUI = (user = null, profile = null) => {
      this.currentUser = user;
      window.__currentUser = user;

      if (this.mpClient && typeof this.mpClient.setUsername === 'function') {
        this.mpClient.setUsername(user);
      }

      if (user) {
        if (widgetText) widgetText.textContent = `👤 ${user.toUpperCase()}`;
        if (widgetBtn) widgetBtn.classList.add('logged-in');
        if (menuBtn) menuBtn.textContent = `👤 ${user.toUpperCase()}`;
        if (formFields) formFields.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        if (profileUser) profileUser.textContent = user;
        if (tabLogin) tabLogin.style.display = 'none';
        if (tabRegister) tabRegister.style.display = 'none';

        if (profile && this.caseSystem) {
          this.caseSystem.loadProfile(profile);
        }
      } else {
        if (widgetText) widgetText.textContent = 'SIGN IN / REGISTER';
        if (widgetBtn) widgetBtn.classList.remove('logged-in');
        if (menuBtn) menuBtn.textContent = '👤 ACCOUNT';
        if (formFields) formFields.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
        if (tabLogin) tabLogin.style.display = 'block';
        if (tabRegister) tabRegister.style.display = 'block';
      }
    };

    const openModal = (e) => {
      if (e) {
        e.stopPropagation();
        if (e.cancelable && e.type !== 'click') e.preventDefault();
      }
      try {
        if (document.exitPointerLock) document.exitPointerLock();
      } catch (err) {}
      if (modal) {
        modal.style.display = 'flex';
      }
      clearFeedback();
    };

    if (widgetBtn) {
      widgetBtn.addEventListener('click', openModal);
      widgetBtn.addEventListener('touchend', openModal, { passive: false });
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', openModal);
      menuBtn.addEventListener('touchend', openModal, { passive: false });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modal) modal.style.display = 'none';
      });
      closeBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (modal) modal.style.display = 'none';
      });
    }

    const setTab = (mode) => {
      this.authMode = mode;
      clearFeedback();
      if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        submitBtn.textContent = 'SIGN IN';
      } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        submitBtn.textContent = 'CREATE ACCOUNT';
      }
    };

    if (tabLogin) tabLogin.addEventListener('click', () => setTab('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => setTab('register'));

    const doSubmit = async () => {
      const u = usernameInput ? usernameInput.value.trim() : '';
      const p = passwordInput ? passwordInput.value : '';

      if (!u || !p) {
        showFeedback('Please enter both username and password.', true);
        return;
      }
      if (u.length < 3 || u.length > 20) {
        showFeedback('Username must be 3-20 characters.', true);
        return;
      }
      if (p.length < 3) {
        showFeedback('Password must be at least 3 characters.', true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'PROCESSING...';

      try {
        const endpoint = this.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // Save credentials in localStorage as requested
          localStorage.setItem('sniper_duels_auth', JSON.stringify({
            username: data.username,
            password: p,
            savedAt: Date.now()
          }));

          showFeedback(`✓ ${data.message}`, false);
          updateAuthUI(data.username, data);

          setTimeout(() => {
            if (modal) modal.style.display = 'none';
          }, 1200);
        } else {
          showFeedback(data.message || 'Authentication failed.', true);
        }
      } catch (err) {
        showFeedback('Failed to reach server. Check connection.', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = this.authMode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN';
      }
    };

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        doSubmit();
      });
      submitBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        doSubmit();
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSubmit();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('sniper_duels_auth');
        updateAuthUI(null);
        showFeedback('Logged out successfully.', false);
      });
    }

    // Auto-login / restore credentials from localStorage
    try {
      const savedAuth = localStorage.getItem('sniper_duels_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.username && parsed.password) {
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: parsed.username, password: parsed.password })
          }).then(r => r.json()).then(data => {
            if (data.success) {
              updateAuthUI(data.username, data);
            }
          }).catch(() => {
            updateAuthUI(parsed.username);
          });
        }
      }
    } catch (e) {}
  }

  // ==========================================
  // FIRST-TIME LOGIN ONBOARDING TUTORIAL TOUR (STEP-BY-STEP WITH ARROWS & SKIP)
  // ==========================================
  initTutorialTour() {
    const overlay = document.getElementById('tutorial-tour-overlay');
    const card = document.getElementById('tutorial-card');
    const arrow = document.getElementById('tutorial-arrow');
    const badge = document.getElementById('tutorial-badge');
    const title = document.getElementById('tutorial-title');
    const desc = document.getElementById('tutorial-desc');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const skipBtn = document.getElementById('tutorial-skip-btn');

    if (!overlay || !card || !nextBtn || !skipBtn) return;

    const steps = [
      {
        badge: 'STEP 1 OF 5',
        title: '1. ACCOUNT & CLOUD SAVE 👤',
        desc: 'Sign in or register your account! Your coins, loadout, operator skins, and match history will be saved to your cloud profile.',
        arrowDir: 'left',
        getPos: (cardW) => {
          const el = document.getElementById('auth-widget-btn') || document.getElementById('auth-sidebar-widget');
          if (!el) return { top: 72, left: 240, arrowTop: 30 };
          const rect = el.getBoundingClientRect();
          const targetCenterY = rect.top + rect.height / 2;
          const top = Math.max(16, Math.min(window.innerHeight - 220, targetCenterY - 45));
          const left = Math.min(window.innerWidth - cardW - 16, rect.right + 18);
          const arrowTop = Math.max(18, Math.min(130, targetCenterY - top - 12));
          return { top, left, arrowTop };
        }
      },
      {
        badge: 'STEP 2 OF 5',
        title: '2. WEAPON LOADOUT 🎒',
        desc: 'Customize your primary weapon! Equip the AWP Bolt-Action, Hunting Rifle, AR-15, Tactical Shotgun, or explosive RPG-7 Launcher.',
        arrowDir: 'up',
        getPos: (cardW) => {
          const el = document.getElementById('loadout-open-btn');
          if (!el) return { top: 90, left: window.innerWidth - cardW - 20, arrowLeft: cardW / 2 };
          const rect = el.getBoundingClientRect();
          const targetCenterX = rect.left + rect.width / 2;
          const top = rect.bottom + 16;
          const left = Math.max(16, Math.min(window.innerWidth - cardW - 16, targetCenterX - cardW / 2));
          const arrowLeft = Math.max(18, Math.min(cardW - 42, targetCenterX - left - 12));
          return { top, left, arrowLeft };
        }
      },
      {
        badge: 'STEP 3 OF 5',
        title: '3. CASES & 3D SKINS 📦',
        desc: 'Unbox 15 diverse futuristic, cyber, and gothic operator skins, knives, and snipers! Inspect any item in real-time 3D with 360° preview.',
        arrowDir: 'up',
        getPos: (cardW) => {
          const el = document.getElementById('shop-open-btn');
          if (!el) return { top: 90, left: window.innerWidth - cardW - 20, arrowLeft: cardW / 2 };
          const rect = el.getBoundingClientRect();
          const targetCenterX = rect.left + rect.width / 2;
          const top = rect.bottom + 16;
          const left = Math.max(16, Math.min(window.innerWidth - cardW - 16, targetCenterX - cardW / 2));
          const arrowLeft = Math.max(18, Math.min(cardW - 42, targetCenterX - left - 12));
          return { top, left, arrowLeft };
        }
      },
      {
        badge: 'STEP 4 OF 5',
        title: '4. LIVE LOBBY CHAT 💬',
        desc: 'Chat with everyone on the server in real-time under your registered username! Press "/" or click the chat button to type and send messages.',
        arrowDir: 'left',
        getPos: (cardW) => {
          const el = (document.getElementById('chat-open-btn') && document.getElementById('chat-open-btn').style.display !== 'none')
            ? document.getElementById('chat-open-btn')
            : (document.getElementById('chatroom-container') || document.getElementById('chat-open-btn'));
          if (!el) return { top: 120, left: 380, arrowTop: 30 };
          const rect = el.getBoundingClientRect();
          const targetCenterY = rect.top + Math.min(36, rect.height / 2);
          const top = Math.max(16, Math.min(window.innerHeight - 220, targetCenterY - 45));
          const left = Math.min(window.innerWidth - cardW - 16, rect.right + 18);
          const arrowTop = Math.max(18, Math.min(130, targetCenterY - top - 12));
          return { top, left, arrowTop };
        }
      },
      {
        badge: 'STEP 5 OF 5',
        title: '5. DUEL PADS & COMBAT ⚔️',
        desc: 'Step on the green middle floor mat to queue 1v1 against a real player, or step on the side mats for solo bot practice. You are ready to duel!',
        arrowDir: 'down',
        getPos: (cardW) => {
          const top = Math.max(40, window.innerHeight * 0.44);
          const left = Math.max(16, (window.innerWidth - cardW) / 2);
          const arrowLeft = cardW / 2 - 12;
          return { top, left, arrowLeft };
        }
      }
    ];

    let currentStep = 0;

    const showStep = (idx) => {
      if (idx >= steps.length) {
        completeTutorial();
        return;
      }
      currentStep = idx;
      const s = steps[idx];
      badge.textContent = s.badge;
      title.textContent = s.title;
      desc.textContent = s.desc;
      nextBtn.textContent = (idx === steps.length - 1) ? 'FINISH ✓' : 'NEXT ➔';

      arrow.className = `tutorial-arrow ${s.arrowDir}`;

      const cardW = card.offsetWidth || 320;
      const pos = s.getPos(cardW);
      card.style.top = `${pos.top}px`;
      card.style.left = `${pos.left}px`;

      if (s.arrowDir === 'up' || s.arrowDir === 'down') {
        arrow.style.left = `${pos.arrowLeft !== undefined ? pos.arrowLeft : (cardW / 2 - 12)}px`;
        arrow.style.top = '';
      } else if (s.arrowDir === 'left' || s.arrowDir === 'right') {
        arrow.style.top = `${pos.arrowTop !== undefined ? pos.arrowTop : 30}px`;
        arrow.style.left = '';
      }
    };

    const completeTutorial = () => {
      overlay.style.display = 'none';
      try {
        localStorage.setItem('sniper_duels_tutorial_done', 'true');
      } catch (err) {}
    };

    nextBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      showStep(currentStep + 1);
    };

    skipBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      completeTutorial();
    };

    this.startTutorialTour = (force = false) => {
      try {
        const done = localStorage.getItem('sniper_duels_tutorial_done');
        if (!done || force) {
          overlay.style.display = 'block';
          try { document.exitPointerLock(); } catch (err) {}
          showStep(0);
        }
      } catch (err) {}
    };

    // Auto-launch on first logon if not completed yet
    setTimeout(() => {
      this.startTutorialTour(false);
    }, 1500);
  }

  openMapModal() {
    if (this.matchManager.isTwoPlayer || this.matchManager.state !== 'LOBBY') {
      this.matchManager.updateStateBanner('CANNOT SWITCH MAPS DURING AN ACTIVE 1v1 MATCH!', true, '#ff4444');
      setTimeout(() => {
        if (this.matchManager.state === 'ROUND_ACTIVE') {
          const duelLabel = this.matchManager.isTwoPlayer ? '1v1 PLAYER DUEL' : 'SOLO BOT DUEL';
          this.matchManager.updateStateBanner(`${duelLabel} - ROUND ${this.matchManager.roundNumber}`, true, '#00d2ff');
        } else if (this.matchManager.state === 'LOBBY') {
          this.matchManager.updateStateBanner('LOBBY PRACTICE - STEP ON A DUEL PAD TO PLAY', true, '#ffffff');
        }
      }, 2500);
      return;
    }
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'flex';
  }

  closeMapModal() {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
  }

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
  }

  handleShoot() {
    if (this.caseSystem.isUnboxing) return;
    // Lock shooting outside of active gameplay (cannot shoot during intermission, warmup, or victory)
    if (this.matchManager.state !== 'LOBBY' && this.matchManager.state !== 'ROUND_ACTIVE' && this.matchManager.state !== 'TESTING_LAB') {
      // Buffer shot if player clicked during warmup countdown right before round start
      if (this.matchManager.state === 'WARMUP') {
        this.pendingShot = true;
      }
      return;
    }

    if (this.weaponSystem.currentSlot === 'GRENADE') {
      this.throwGrenade();
      return;
    }

    const shootResult = this.weaponSystem.shoot();
    if (!shootResult.fired) return;

    this.updateHUDWeapon();

    // Knife Attack
    if (shootResult.type === 'KNIFE') {
      this.handleKnifeSlash();
      return;
    }

    // RPG Rocket Attack
    if (shootResult.type === 'RPG') {
      this.fireRPGRocket();
      return;
    }

    // Sniper Bullet Raycast
    const shootRay = this.controls.getShootRay();
    let rayDir = shootRay.direction.clone();

    // Apply hipfire spread (if moving / not in ADS)
    if (shootResult.spread > 0) {
      const spreadX = (Math.random() - 0.5) * shootResult.spread;
      const spreadY = (Math.random() - 0.5) * shootResult.spread;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraManager.worldCamera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraManager.worldCamera.quaternion);
      rayDir.addScaledVector(right, spreadX).addScaledVector(up, spreadY).normalize();
    }

    const raycaster = new THREE.Raycaster(shootRay.origin, rayDir, 0.1, 400);

    // Broadcast fire event in multiplayer
    this.mpClient.sendFireWeapon(shootRay.origin, rayDir, shootResult.spread, shootResult.isAiming, shootResult.type);

    // Muzzle position for tracer beam
    const muzzlePos = shootRay.origin.clone().add(rayDir.clone().multiplyScalar(0.8));

    // Objects to test: Bot limbs, Remote players, Target Dummies, Physics Dummy Bot, and Map Obstacles
    const candidates = [];

    // Bot hitboxes
    if (this.bot.isAlive && this.bot.mesh.visible) {
      candidates.push(this.bot.head, this.bot.torso, this.bot.leftArm, this.bot.rightArm, this.bot.leftLeg, this.bot.rightLeg);
    }

    // Physics Dummy Bot in Testing Lab
    if (this.dummyBot && this.dummyBot.mesh && this.dummyBot.mesh.visible) {
      candidates.push(this.dummyBot.head, this.dummyBot.torso, this.dummyBot.leftArm, this.dummyBot.rightArm, this.dummyBot.leftLeg, this.dummyBot.rightLeg);
    }

    // Remote human player hitboxes
    if (this.mpClient && this.mpClient.remotePlayers) {
      for (const rp of this.mpClient.remotePlayers.values()) {
        if (rp.group && rp.group.visible) {
          candidates.push(rp.head, rp.torso, rp.leftArm, rp.rightArm, rp.leftLeg, rp.rightLeg);
        }
      }
    }

    // Target Dummies in shooting range
    this.map.targetDummies.forEach(d => {
      if (!d.userData.isKnockedDown) {
        candidates.push(d.userData.headMesh, d.userData.torsoMesh);
      }
    });

    // Map colliders
    this.map.colliders.forEach(c => candidates.push(c.mesh));

    const intersects = raycaster.intersectObjects(candidates, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitPoint = hit.point;
      const hitObj = hit.object;

      // 1. Tracer Beam from weapon to impact point
      this.particles.addTracer(muzzlePos, hitPoint);

      // 2. Check if Physics Dummy Bot Hit (Infinite Health Sandbox Dummy in Testing Lab)
      if (hitObj.userData && hitObj.userData.isDummyBot) {
        const isHeadshot = hitObj.userData.isHeadshot === true;
        const damage = shootResult.type === 'AR' ? 5 : (isHeadshot ? 100 : 92);
        this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), isHeadshot ? 0xffcc00 : 0x00e5ff, 14);
        this.dummyBot.takeDamage(damage, isHeadshot);
        this.audio.playHitmarker(isHeadshot);
        this.matchManager.showHitmarker(isHeadshot);
        this.matchManager.showDamageNumber(damage, isHeadshot);
        return;
      }

      // 3. Check if Remote Human Player Hit (Cannot attack in lobby)
      if (hitObj.userData && hitObj.userData.isRemotePlayer) {
        if (this.matchManager.state === 'ROUND_ACTIVE') {
          const isHeadshot = hitObj.userData.isHeadshot === true;
          const damage = shootResult.type === 'AR' ? 5 : (isHeadshot ? 150 : 92);
          this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xff3300, 14);
          this.mpClient.sendInflictDamage(hitObj.userData.playerId, damage, isHeadshot, null, shootResult.type, this.mpClient.myId);
        }
        return;
      }

      // 4. Check if Bot Hit (Cannot attack in lobby)
      if (hitObj.userData && hitObj.userData.isBot) {
        if (this.matchManager.state === 'ROUND_ACTIVE') {
          const isHeadshot = hitObj.userData.isHeadshot === true;
          const damage = shootResult.type === 'AR' ? 5 : (isHeadshot ? 150 : 92);
          this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xff3300, 14);
          this.matchManager.onBotDamaged(damage, isHeadshot, shootResult.type);
        }
        return;
      }

      // 5. Check if Target Dummy Hit (Lobby Range)
      const targetDummy = this.map.targetDummies.find(d =>
        d.userData.headMesh === hitObj || d.userData.torsoMesh === hitObj
      );
      if (targetDummy) {
        const isHeadshot = (hitObj === targetDummy.userData.headMesh);
        const damage = shootResult.type === 'AR' ? 5 : (isHeadshot ? 150 : 85);
        this.audio.playHitmarker(isHeadshot);
        this.matchManager.showHitmarker(isHeadshot);
        this.matchManager.showDamageNumber(damage, isHeadshot);
        this.map.hitTarget(targetDummy, isHeadshot);
        this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xffcc00, 10);
        return;
      }

      // 6. Wall Impact (sparks & dust)
      if (hit.face) {
        this.particles.addImpact(hitPoint, hit.face.normal, 0xffbb44, 8);
      }
    } else {
      // Bullet shot into the sky
      const farPoint = shootRay.origin.clone().add(rayDir.multiplyScalar(200));
      this.particles.addTracer(muzzlePos, farPoint);
    }
  }

  handleKnifeSlash() {
    if (this.matchManager.state !== 'LOBBY' && this.matchManager.state !== 'ROUND_ACTIVE' && this.matchManager.state !== 'TESTING_LAB') {
      return;
    }

    const shootRay = this.controls.getShootRay();
    const raycaster = new THREE.Raycaster(shootRay.origin, shootRay.direction, 0.1, 2.8);

    const candidates = [];
    if (this.bot.isAlive && this.bot.mesh.visible) {
      candidates.push(this.bot.head, this.bot.torso);
    }
    if (this.dummyBot && this.dummyBot.mesh && this.dummyBot.mesh.visible) {
      candidates.push(this.dummyBot.head, this.dummyBot.torso);
    }
    if (this.mpClient && this.mpClient.remotePlayers) {
      for (const rp of this.mpClient.remotePlayers.values()) {
        if (rp.group && rp.group.visible) {
          candidates.push(rp.head, rp.torso);
        }
      }
    }

    const intersects = raycaster.intersectObjects(candidates, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const isHeadshot = hit.object.userData.isHeadshot === true;
      const damage = isHeadshot ? 120 : 65;

      if (hit.object.userData && hit.object.userData.isDummyBot) {
        this.dummyBot.takeDamage(damage, isHeadshot);
        this.audio.playHitmarker(isHeadshot);
        this.matchManager.showHitmarker(isHeadshot);
        this.matchManager.showDamageNumber(damage, isHeadshot);
        this.particles.addImpact(hit.point, new THREE.Vector3(0, 1, 0), 0x00e5ff, 12);
        return;
      }

      if (this.matchManager.state === 'ROUND_ACTIVE') {
        if (hit.object.userData.isRemotePlayer) {
          this.mpClient.sendInflictDamage(hit.object.userData.playerId, damage, isHeadshot, null, 'KNIFE', this.mpClient.myId);
        } else {
          this.matchManager.onBotDamaged(damage, isHeadshot, 'KNIFE');
        }
        this.particles.addImpact(hit.point, new THREE.Vector3(0, 1, 0), 0xff0044, 12);
      }
    }
  }

  // ==========================================
  // TACTICAL GRENADE SYSTEM & TRAJECTORY AIMING
  // ==========================================

  initGrenadeTrajectory() {
    this.trajectoryGroup = new THREE.Group();
    this.trajectoryGroup.visible = false;

    // Glowing trajectory beads (dotted parabolic arc)
    this.trajectoryDots = [];
    const dotGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 32; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.material.opacity = Math.max(0.2, 1.0 - (i / 32) * 0.7);
      this.trajectoryGroup.add(dot);
      this.trajectoryDots.push(dot);
    }

    // Impact / Landing Ring Decal
    const ringGeo = new THREE.RingGeometry(0.35, 0.52, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.trajectoryLandingRing = new THREE.Mesh(ringGeo, ringMat);
    this.trajectoryGroup.add(this.trajectoryLandingRing);

    this.worldScene.add(this.trajectoryGroup);
  }

  updateGrenadeTrajectory() {
    if (!this.isAimingGrenade || !this.trajectoryGroup || !this.trajectoryGroup.visible) return;

    const shootRay = this.controls.getShootRay();
    const forward = shootRay.direction.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraManager.worldCamera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    // Launch origin & velocity
    const origin = shootRay.origin.clone().addScaledVector(forward, 0.35).addScaledVector(right, 0.15).addScaledVector(up, -0.08);
    const velocity = forward.clone().multiplyScalar(22.0).add(new THREE.Vector3(0, 4.5, 0));
    const gravity = new THREE.Vector3(0, -20.0, 0);

    const dt = 0.038;
    let currentPos = origin.clone();
    let currentVel = velocity.clone();

    if (!this.trajRaycaster) this.trajRaycaster = new THREE.Raycaster();
    const colliders = this.map.colliders.map(c => c.mesh);
    let hitFound = false;
    let hitPoint = null;
    let hitNormal = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.trajectoryDots.length; i++) {
      const dot = this.trajectoryDots[i];
      if (hitFound) {
        dot.visible = false;
        continue;
      }

      const nextPos = currentPos.clone().addScaledVector(currentVel, dt);
      currentVel.addScaledVector(gravity, dt);

      // Check collision between currentPos and nextPos
      const segDir = nextPos.clone().sub(currentPos);
      const segDist = segDir.length();
      if (segDist > 0.001) {
        this.trajRaycaster.set(currentPos, segDir.clone().normalize());
        this.trajRaycaster.far = segDist;
        const hits = this.trajRaycaster.intersectObjects(colliders, false);
        if (hits.length > 0) {
          hitFound = true;
          hitPoint = hits[0].point;
          if (hits[0].face) {
            hitNormal = hits[0].face.normal.clone();
            hitNormal.transformDirection(hits[0].object.matrixWorld);
          }
          nextPos.copy(hitPoint);
        } else if (nextPos.y <= 0.5) {
          // Floor check
          hitFound = true;
          hitPoint = new THREE.Vector3(nextPos.x, 0.52, nextPos.z);
          hitNormal = new THREE.Vector3(0, 1, 0);
          nextPos.copy(hitPoint);
        }
      }

      dot.position.copy(nextPos);
      dot.visible = true;
      currentPos.copy(nextPos);
    }

    if (hitFound && hitPoint) {
      this.trajectoryLandingRing.visible = true;
      this.trajectoryLandingRing.position.copy(hitPoint).addScaledVector(hitNormal, 0.02);
      this.trajectoryLandingRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hitNormal);
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.15;
      this.trajectoryLandingRing.scale.set(pulse, pulse, pulse);
    } else {
      this.trajectoryLandingRing.visible = false;
    }
  }

  throwGrenade() {
    if (this.weaponSystem.currentSlot !== 'GRENADE') return;
    if (this.weaponSystem.grenades <= 0) return;

    this.weaponSystem.grenades--;
    this.weaponSystem.isThrowingGrenade = true;
    this.weaponSystem.throwAnimTimer = 0;
    this.updateHUDWeapon();

    const shootRay = this.controls.getShootRay();
    const forward = shootRay.direction.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraManager.worldCamera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    const origin = shootRay.origin.clone().addScaledVector(forward, 0.4).addScaledVector(right, 0.15).addScaledVector(up, -0.08);
    const velocity = forward.clone().multiplyScalar(22.0).add(new THREE.Vector3(0, 4.5, 0));

    this.audio.playGrenadePin();
    this.audio.playKnifeSlash();

    const mesh = AssetLoader.createProceduralGrenade();
    mesh.position.copy(origin);
    mesh.scale.set(2.0, 2.0, 2.0);

    const fuseLight = new THREE.PointLight(0xff7700, 3.5, 8);
    fuseLight.position.set(0, 0.1, 0);
    mesh.add(fuseLight);

    this.worldScene.add(mesh);

    this.activeGrenades.push({
      mesh: mesh,
      fuseLight: fuseLight,
      position: origin.clone(),
      velocity: velocity.clone(),
      rotVel: new THREE.Vector3(
        (Math.random() - 0.5) * 12 + 6,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6
      ),
      fuse: 2.0,
      bounces: 0
    });

    // In lobby practice, replenish grenade after 4 seconds
    if (this.matchManager.state === 'LOBBY') {
      setTimeout(() => {
        if (this.weaponSystem.grenades < this.weaponSystem.maxGrenades) {
          this.weaponSystem.grenades = this.weaponSystem.maxGrenades;
          if (this.weaponSystem.currentSlot === 'GRENADE' && this.weaponSystem.grenadeMesh) {
            this.weaponSystem.grenadeMesh.visible = true;
          }
          this.updateHUDWeapon();
        }
      }, 4000);
    } else if (this.weaponSystem.grenades <= 0) {
      // In active match, swap back to primary weapon after throw
      setTimeout(() => {
        if (this.weaponSystem.currentSlot === 'GRENADE') {
          this.weaponSystem.equipSlot(this.weaponSystem.primaryWeapon);
          this.updateHUDWeapon();
        }
      }, 550);
    }
  }

  updateActiveGrenades(delta) {
    if (!this.grenadeRaycaster) this.grenadeRaycaster = new THREE.Raycaster();
    const colliders = this.map.colliders.map(c => c.mesh);

    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuse -= delta;

      // Gravity
      g.velocity.y -= 20.0 * delta;

      const step = g.velocity.clone().multiplyScalar(delta);
      const stepDist = step.length();

      if (stepDist > 0.001) {
        this.grenadeRaycaster.set(g.position, step.clone().normalize());
        this.grenadeRaycaster.far = stepDist + 0.1;
        const hits = this.grenadeRaycaster.intersectObjects(colliders, false);

        if (hits.length > 0) {
          const hit = hits[0];
          g.position.copy(hit.point);
          const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);

          // Reflect velocity with restitution
          g.velocity.reflect(normal).multiplyScalar(0.42);
          g.rotVel.multiplyScalar(0.7);
          g.bounces++;
          if (g.velocity.length() > 2.0) {
            this.audio.playGrenadeBounce();
          }
        } else if (g.position.y + step.y <= 0.6) {
          // Floor bounce
          g.position.y = 0.6;
          g.position.x += step.x;
          g.position.z += step.z;
          g.velocity.y = Math.abs(g.velocity.y) * 0.4;
          g.velocity.x *= 0.72;
          g.velocity.z *= 0.72;
          g.rotVel.multiplyScalar(0.65);
          g.bounces++;
          if (Math.abs(g.velocity.y) > 1.5) {
            this.audio.playGrenadeBounce();
          }
        } else {
          g.position.add(step);
        }
      }

      g.mesh.position.copy(g.position);
      g.mesh.rotation.x += g.rotVel.x * delta;
      g.mesh.rotation.y += g.rotVel.y * delta;
      g.mesh.rotation.z += g.rotVel.z * delta;

      // Detonate when fuse expires
      if (g.fuse <= 0) {
        this.detonateGrenade(g.position);
        this.worldScene.remove(g.mesh);
        g.mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.activeGrenades.splice(i, 1);
      }
    }
  }

  // Tactical Grenade Blast: 150 damage max with linear falloff to 25 min at 8.0m
  detonateGrenade(pos) {
    // 1. Audio & Visual Explosion FX
    this.particles.addExplosion(pos);
    this.audio.playExplosion();

    // 2. Proximity Camera Shake
    const playerPos = this.controls.getPosition();
    const playerDist = playerPos.distanceTo(pos);
    if (playerDist < 22.0) {
      const shakeFactor = Math.max(0, 1.0 - (playerDist / 22.0));
      this.controls.addCameraShake(shakeFactor * 0.55);
    }

    // Damage calculator: 150 max at <= 1.5m, linear falloff to 25 min at 8.0m, 0 beyond 8.0m
    const calculateDamage = (dist) => {
      if (dist <= 1.5) return 150;
      if (dist > 8.0) return 0;
      const t = (dist - 1.5) / (8.0 - 1.5);
      return Math.round(150 - t * (150 - 25));
    };

    // 3. Bot Opponent (Solo Matches)
    if (this.bot && this.bot.isAlive) {
      const bDist = this.bot.position.distanceTo(pos);
      if (bDist <= 8.0) {
        const damage = calculateDamage(bDist);
        this.matchManager.onBotDamaged(damage, false, 'GRENADE');
      }
    }

    // 3b. Physics Dummy Bot in Testing Lab
    if (this.dummyBot && this.dummyBot.mesh && this.dummyBot.mesh.visible) {
      const dbDist = this.dummyBot.position.distanceTo(pos);
      if (dbDist <= 8.0) {
        const damage = calculateDamage(dbDist);
        this.dummyBot.takeDamage(damage);
        const blastDir = this.dummyBot.position.clone().sub(pos).normalize();
        blastDir.y = Math.max(0.42, blastDir.y + 0.38);
        this.dummyBot.applyImpulse(blastDir.multiplyScalar((damage / 150) * 22.0));
        this.audio.playHitmarker(damage >= 100);
        this.matchManager.showHitmarker(damage >= 100);
        this.matchManager.showDamageNumber(damage, damage >= 100);
      }
    }

    // 4. Remote Opponent (2-Player 1v1 Matches)
    if (this.matchManager.isTwoPlayer && this.matchManager.state === 'ROUND_ACTIVE' && this.mpClient) {
      const oppId = this.matchManager.opponentId;
      if (oppId && this.mpClient.remotePlayers.has(oppId)) {
        const opp = this.mpClient.remotePlayers.get(oppId);
        const oppPos = opp.group ? opp.group.position : null;
        if (oppPos) {
          const oppDist = oppPos.distanceTo(pos);
          if (oppDist <= 8.0) {
            const damage = calculateDamage(oppDist);
            this.mpClient.sendInflictDamage(oppId, damage, false, null, 'GRENADE', this.mpClient.myId);
            this.audio.playHitmarker(damage >= 100);
            this.matchManager.showHitmarker(damage >= 100);
            this.matchManager.showDamageNumber(damage, damage >= 100);
          }
        }
      }
    }

    // 5. Target Dummies in Lobby Range
    this.map.targetDummies.forEach(d => {
      if (!d.userData.isKnockedDown) {
        const dDist = d.position.distanceTo(pos);
        if (dDist <= 8.0) {
          const damage = calculateDamage(dDist);
          this.audio.playHitmarker(false);
          this.matchManager.showHitmarker(false);
          this.matchManager.showDamageNumber(damage, false);
          this.map.hitTarget(d, false);
        }
      }
    });

    // 6. Local Player Self-Damage (in active round)
    if (this.matchManager.state === 'ROUND_ACTIVE') {
      if (playerDist <= 8.0) {
        const selfDmg = Math.round(calculateDamage(playerDist) * 0.7);
        if (selfDmg > 0) {
          this.matchManager.onPlayerDamaged(selfDmg, false);
        }
      }
    }
  }

  // RPG-7 Rocket Firing Logic
  fireRPGRocket() {
    const shootRay = this.controls.getShootRay();
    let rayDir = shootRay.direction.clone().normalize();

    // Broadcast fire event in multiplayer
    if (this.mpClient) {
      this.mpClient.sendFireWeapon(shootRay.origin, rayDir, 0, this.weaponSystem.isAiming, 'RPG');
    }

    const forward = rayDir.clone().normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraManager.worldCamera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    // Muzzle launch position in world coordinates
    const origin = shootRay.origin.clone()
      .addScaledVector(forward, 0.75)
      .addScaledVector(right, 0.2)
      .addScaledVector(up, -0.1);

    const rocketSpeed = 88.0; // Faster, high-velocity rocket flight
    const velocity = forward.clone().multiplyScalar(rocketSpeed);

    const rocketMesh = AssetLoader.createProceduralRocketWarhead();
    rocketMesh.position.copy(origin);
    rocketMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
    rocketMesh.scale.set(1.4, 1.4, 1.4);

    const rocketLight = new THREE.PointLight(0xff6600, 1.8, 6);
    rocketLight.castShadow = false;
    rocketLight.position.set(0, 0, 0.35);
    rocketMesh.add(rocketLight);

    this.worldScene.add(rocketMesh);

    this.activeRockets.push({
      mesh: rocketMesh,
      light: rocketLight,
      position: origin.clone(),
      velocity: velocity.clone(),
      direction: forward.clone(),
      isRemote: false,
      lifetime: 4.5,
      trailTimer: 0
    });
  }

  spawnRemoteRocket(origin, direction) {
    const forward = direction.clone().normalize();
    const rocketSpeed = 88.0; // Faster remote rocket velocity
    const velocity = forward.clone().multiplyScalar(rocketSpeed);

    const rocketMesh = AssetLoader.createProceduralRocketWarhead();
    rocketMesh.position.copy(origin);
    rocketMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
    rocketMesh.scale.set(1.4, 1.4, 1.4);

    const rocketLight = new THREE.PointLight(0xff6600, 1.8, 6);
    rocketLight.castShadow = false;
    rocketLight.position.set(0, 0, 0.35);
    rocketMesh.add(rocketLight);

    this.worldScene.add(rocketMesh);

    this.activeRockets.push({
      mesh: rocketMesh,
      light: rocketLight,
      position: origin.clone(),
      velocity: velocity.clone(),
      direction: forward.clone(),
      isRemote: true,
      lifetime: 4.5,
      trailTimer: 0
    });
  }

  updateActiveRockets(delta) {
    if (!this.rpgRaycaster) this.rpgRaycaster = new THREE.Raycaster();

    const candidates = [];
    this.map.colliders.forEach(c => candidates.push(c.mesh));

    this.map.targetDummies.forEach(d => {
      if (!d.userData.isKnockedDown) {
        if (d.userData.headMesh) candidates.push(d.userData.headMesh);
        if (d.userData.torsoMesh) candidates.push(d.userData.torsoMesh);
      }
    });

    if (this.bot && this.bot.isAlive && this.bot.mesh.visible) {
      candidates.push(this.bot.head, this.bot.torso, this.bot.leftArm, this.bot.rightArm, this.bot.leftLeg, this.bot.rightLeg);
    }

    if (this.dummyBot && this.dummyBot.mesh && this.dummyBot.mesh.visible) {
      candidates.push(this.dummyBot.head, this.dummyBot.torso, this.dummyBot.leftArm, this.dummyBot.rightArm, this.dummyBot.leftLeg, this.dummyBot.rightLeg);
    }

    if (this.mpClient && this.mpClient.remotePlayers) {
      for (const rp of this.mpClient.remotePlayers.values()) {
        if (rp.group && rp.group.visible) {
          candidates.push(rp.head, rp.torso, rp.leftArm, rp.rightArm, rp.leftLeg, rp.rightLeg);
        }
      }
    }

    for (let i = this.activeRockets.length - 1; i >= 0; i--) {
      const r = this.activeRockets[i];
      r.lifetime -= delta;

      // Gentle ballistic arc for high-speed rocket
      r.velocity.y -= 1.8 * delta;

      const step = r.velocity.clone().multiplyScalar(delta);
      const stepDist = step.length();

      // Emit rocket smoke & fire trail (Throttled to 20Hz for butter-smooth framerate)
      r.trailTimer += delta;
      if (r.trailTimer >= 0.045) {
        this.particles.addRocketSmoke(r.position);
        r.trailTimer = 0;
      }

      let detonated = false;

      if (stepDist > 0.001) {
        this.rpgRaycaster.set(r.position, step.clone().normalize());
        this.rpgRaycaster.far = stepDist + 0.15;
        const hits = this.rpgRaycaster.intersectObjects(candidates, false);

        if (hits.length > 0) {
          const hit = hits[0];
          this.detonateRPGRocket(hit.point, r.isRemote);
          detonated = true;
        } else if (r.position.y + step.y <= 0.5) {
          // Ground impact
          const floorHit = r.position.clone().add(step);
          floorHit.y = 0.5;
          this.detonateRPGRocket(floorHit, r.isRemote);
          detonated = true;
        } else {
          r.position.add(step);
          r.mesh.position.copy(r.position);
          r.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), r.velocity.clone().normalize());
        }
      }

      if (!detonated && r.lifetime <= 0) {
        this.detonateRPGRocket(r.position, r.isRemote);
        detonated = true;
      }

      if (detonated) {
        this.worldScene.remove(r.mesh);
        r.mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.activeRockets.splice(i, 1);
      }
    }
  }

  // RPG Detonation: Max 75 damage, expanded 11.5m blast radius, shallower drop-off, NO self-damage to shooter
  detonateRPGRocket(pos, isRemote = false) {
    // 1. Audio & Visual FX
    this.particles.addExplosion(pos);
    this.audio.playExplosion();

    // 2. Proximity Camera Shake (larger 30m radius)
    const playerPos = this.controls.getPosition();
    const playerDist = playerPos.distanceTo(pos);
    if (playerDist < 30.0) {
      const shakeFactor = Math.max(0, 1.0 - (playerDist / 30.0));
      this.controls.addCameraShake(shakeFactor * 0.75);
    }

    // RPG Stats: 75 dmg at best (<= 3.0m), expanded 11.5m radius, gentle drop-off to 25 min
    const calculateRPGImpact = (targetPos) => {
      const dir = targetPos.clone().sub(pos);
      const dist = dir.length();
      const blastRadius = 11.5;
      if (dist > blastRadius) return { damage: 0, impulse: new THREE.Vector3() };

      // Full 75 damage up to 3.0m, shallow gentle drop-off to 25 at 11.5m
      let damage = 75;
      if (dist > 3.0) {
        const t = (dist - 3.0) / (blastRadius - 3.0);
        damage = Math.max(25, Math.round(75 - Math.pow(t, 1.15) * (75 - 25)));
      }

      // Launch vector away from explosion with strong upward vertical lift
      if (dist < 0.001) {
        dir.set(0, 1, 0);
      } else {
        dir.normalize();
      }
      dir.y = Math.min(1.0, Math.max(0.48, dir.y + 0.42));
      dir.normalize();

      // Launch impulse proportional to damage hit
      const ratio = damage / 75.0;
      const launchPower = ratio * 28.0;
      const impulse = dir.clone().multiplyScalar(launchPower);

      return { damage, impulse };
    };

    // 3. Bot Opponent (Solo matches)
    if (this.bot && this.bot.isAlive) {
      const bPos = this.bot.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const { damage, impulse } = calculateRPGImpact(bPos);
      if (damage > 0) {
        this.matchManager.onBotDamaged(damage, false, 'RPG');
        this.bot.applyImpulse(impulse);
      }
    }

    // 3b. Physics Dummy Bot in Testing Lab (Infinite Health & Physical Launch)
    if (this.dummyBot && this.dummyBot.mesh && this.dummyBot.mesh.visible) {
      const dbPos = this.dummyBot.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const { damage, impulse } = calculateRPGImpact(dbPos);
      if (damage > 0) {
        this.dummyBot.takeDamage(damage, false);
        this.dummyBot.applyImpulse(impulse);
        this.audio.playHitmarker(false);
        this.matchManager.showHitmarker(false);
        this.matchManager.showDamageNumber(damage, false);
      }
    }

    // 4. Remote Opponent (2-Player 1v1 Matches)
    // CRITICAL: ONLY the player who fired the rocket (!isRemote) evaluates damage on opponent.
    // A remote spectator/target client must NEVER report damage back onto the launcher!
    if (!isRemote && this.matchManager.isTwoPlayer && this.matchManager.state === 'ROUND_ACTIVE' && this.mpClient) {
      const oppId = this.matchManager.opponentId;
      if (oppId && this.mpClient.remotePlayers.has(oppId)) {
        const opp = this.mpClient.remotePlayers.get(oppId);
        const oppPos = opp.group ? opp.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)) : null;
        if (oppPos) {
          const { damage, impulse } = calculateRPGImpact(oppPos);
          if (damage > 0) {
            this.mpClient.sendInflictDamage(oppId, damage, false, impulse, 'RPG', this.mpClient.myId);
            this.audio.playHitmarker(damage >= 75);
            this.matchManager.showHitmarker(damage >= 75);
            this.matchManager.showDamageNumber(damage, damage >= 75);
          }
        }
      }
    }

    // 5. Target Dummies in Lobby Range
    this.map.targetDummies.forEach(d => {
      if (!d.userData.isKnockedDown) {
        const dPos = d.position.clone().add(new THREE.Vector3(0, 0.8, 0));
        const { damage } = calculateRPGImpact(dPos);
        if (damage > 0) {
          this.audio.playHitmarker(false);
          this.matchManager.showHitmarker(false);
          this.matchManager.showDamageNumber(damage, false);
          this.map.hitTarget(d, false);
        }
      }
    });

    // 6. Local Player: Guaranteed ZERO damage to the RPG launcher!
    // If the local player fired this rocket (!isRemote), strictly 0 self-damage!
    // If a remote rocket detonated (isRemote === true), the attacker's client authoritatively sends INFLICT_DAMAGE
    // so we only apply physical launch impulse locally, never duplicate local damage!
    const pPos = this.controls.getPosition().clone().add(new THREE.Vector3(0, 0.9, 0));
    const { damage: pDmg, impulse: pImpulse } = calculateRPGImpact(pPos);

    if (!isRemote) {
      // Local player fired this rocket -> strictly 0 self-damage!
      // Provides vertical/horizontal rocket jump propulsion only:
      if (pImpulse && pImpulse.lengthSq() > 0) {
        this.controls.applyImpulse(pImpulse);
      }
    } else {
      // Remote rocket: apply impulse locally; damage is handled authoritatively via server DAMAGE_TAKEN
      if (pImpulse && pImpulse.lengthSq() > 0) {
        this.controls.applyImpulse(pImpulse);
      }
    }
  }

  updateHUDWeapon() {
    const ammoCount = document.getElementById('ammo-count');
    const scopeAmmo = document.getElementById('scope-ammo-val');
    const slotName = document.getElementById('weapon-name');
    const boltNotice = document.getElementById('bolt-status');
    const loadoutBadge = document.getElementById('loadout-lock-badge');

    if (ammoCount) {
      if (this.weaponSystem.currentSlot === 'RPG') {
        ammoCount.textContent = `${this.weaponSystem.rpgAmmo} / ${this.weaponSystem.rpgMaxAmmo}`;
      } else if (this.weaponSystem.currentSlot === 'AR') {
        ammoCount.textContent = `${this.weaponSystem.arAmmo} / ${this.weaponSystem.arMaxAmmo}`;
      } else if (this.weaponSystem.currentSlot === 'SNIPER') {
        ammoCount.textContent = `${this.weaponSystem.ammo} / ${this.weaponSystem.maxAmmo}`;
      } else if (this.weaponSystem.currentSlot === 'KNIFE') {
        ammoCount.textContent = '∞';
      } else if (this.weaponSystem.currentSlot === 'GRENADE') {
        ammoCount.textContent = `${this.weaponSystem.grenades} / 1`;
      }
    }

    if (scopeAmmo) {
      if (this.weaponSystem.currentSlot === 'RPG') {
        scopeAmmo.textContent = `${this.weaponSystem.rpgAmmo} / ${this.weaponSystem.rpgMaxAmmo}`;
      } else {
        scopeAmmo.textContent = this.weaponSystem.currentSlot === 'AR'
          ? `${this.weaponSystem.arAmmo} / ${this.weaponSystem.arMaxAmmo}`
          : `${this.weaponSystem.ammo} / ${this.weaponSystem.maxAmmo}`;
      }
    }

    if (slotName) {
      if (this.weaponSystem.currentSlot === 'RPG') {
        slotName.textContent = 'RPG-7 ROCKET LAUNCHER';
      } else if (this.weaponSystem.currentSlot === 'AR') {
        slotName.textContent = 'M4A1 ASSAULT RIFLE';
      } else if (this.weaponSystem.currentSlot === 'SNIPER') {
        slotName.textContent = 'AWP BOLT-ACTION';
      } else if (this.weaponSystem.currentSlot === 'KNIFE') {
        slotName.textContent = 'TACTICAL KNIFE';
      } else if (this.weaponSystem.currentSlot === 'GRENADE') {
        slotName.textContent = 'M67 FRAG GRENADE';
      }
    }

    // Sync current slot to Controls
    if (this.controls) {
      this.controls.currentWeaponSlot = this.weaponSystem.currentSlot;
    }

    // Update Mobile SWAP button icon & label
    const switchBtn = document.getElementById('m-btn-switch');
    if (switchBtn) {
      const icon = switchBtn.querySelector('.btn-icon');
      const label = switchBtn.querySelector('.btn-label');
      if (this.weaponSystem.currentSlot === 'AR' || this.weaponSystem.currentSlot === 'SNIPER' || this.weaponSystem.currentSlot === 'RPG') {
        if (icon) icon.textContent = '🗡️';
        if (label) label.textContent = 'KNIFE';
      } else if (this.weaponSystem.currentSlot === 'KNIFE') {
        if (icon) icon.textContent = '💣';
        if (label) label.textContent = 'GRENADE';
      } else if (this.weaponSystem.currentSlot === 'GRENADE') {
        let pIcon = '🔫';
        let pLabel = 'AWP';
        if (this.weaponSystem.primaryWeapon === 'RPG') {
          pIcon = '🚀';
          pLabel = 'RPG-7';
        } else if (this.weaponSystem.primaryWeapon === 'AR') {
          pIcon = '⚡';
          pLabel = 'AR-15';
        }
        if (icon) icon.textContent = pIcon;
        if (label) label.textContent = pLabel;
      }
    }

    // Update Weapon Selector Chips
    const isPrimaryActive = this.weaponSystem.currentSlot === 'SNIPER' || this.weaponSystem.currentSlot === 'AR' || this.weaponSystem.currentSlot === 'RPG';
    const chipSniper = document.getElementById('slot-chip-sniper');
    if (chipSniper) chipSniper.classList.toggle('active', isPrimaryActive);
    const chipKnife = document.getElementById('slot-chip-knife');
    if (chipKnife) chipKnife.classList.toggle('active', this.weaponSystem.currentSlot === 'KNIFE');
    const chipGrenade = document.getElementById('slot-chip-grenade');
    if (chipGrenade) chipGrenade.classList.toggle('active', this.weaponSystem.currentSlot === 'GRENADE');

    // In active match, hide Loadout button and close modal so no popup appears during the game
    const loadoutOpenBtn = document.getElementById('loadout-open-btn');
    const loadoutModal = document.getElementById('loadout-modal');
    if (this.matchManager.state === 'ROUND_ACTIVE') {
      if (loadoutOpenBtn) loadoutOpenBtn.style.display = 'none';
      if (loadoutModal) loadoutModal.style.display = 'none';
    } else {
      if (loadoutOpenBtn) loadoutOpenBtn.style.display = 'inline-block';
    }

    if (boltNotice) {
      if (this.weaponSystem.isBolting) {
        boltNotice.style.display = 'block';
        boltNotice.textContent = 'CYCLING BOLT...';
      } else if (this.weaponSystem.isReloading) {
        boltNotice.style.display = 'block';
        boltNotice.textContent = 'RELOADING...';
      } else {
        boltNotice.style.display = 'none';
      }
    }

    // Dynamic Crosshair Spread
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      if (this.weaponSystem.adsProgress > 0.7 || this.isAimingGrenade) {
        crosshair.style.opacity = '0'; // Hide crosshair in ADS or Grenade Trajectory Aim
      } else {
        crosshair.style.opacity = '1';
        const spreadPx = 14 + (this.weaponSystem.getSpread(true) * 120);
        crosshair.style.setProperty('--spread', `${spreadPx}px`);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Automatic fire while holding mouse or touch button for AR-Rifle
    if (this.controls.isShootingContinuous && this.weaponSystem.currentSlot === 'AR' && this.weaponSystem.canShoot()) {
      this.handleShoot();
    }

    // Trigger buffered first shot the instant round goes active
    if (this.matchManager.state === 'ROUND_ACTIVE' && this.pendingShot && this.weaponSystem.canShoot()) {
      this.pendingShot = false;
      this.handleShoot();
    }

    // 1. Update FPS Movement Physics & Speed modifier
    const speedMod = this.weaponSystem.getSpeedModifier();
    const moveInfo = this.controls.update(delta, speedMod);

    // 2. Update Weapon Viewmodel (sway, bobbing, ADS, bolt action)
    const isMoving = moveInfo ? moveInfo.isMoving : false;
    const isSprinting = moveInfo ? moveInfo.isSprinting : false;
    const velLen = moveInfo ? moveInfo.velocityLength : 0;
    this.weaponSystem.update(delta, isMoving, isSprinting, velLen);

    // 3. Update Camera Zoom for ADS (tactical 52° for AR, 20° high zoom for Sniper)
    this.cameraManager.updateADS(this.weaponSystem.adsProgress, delta, this.weaponSystem.currentSlot);
    this.cameraManager.updateTrauma(delta);

    // Dynamic weapon strafe banking
    if (this.controls.moveLeft) this.weaponSystem.addStrafeTilt(1);
    if (this.controls.moveRight) this.weaponSystem.addStrafeTilt(-1);

    // 4. Update Particle Effects (tracers, sparks, ejected shells, confetti)
    this.particles.update(delta);

    // 5. Update Map (pulsing duel pads, floating shop crate, resetting target dummies)
    this.map.update(delta, elapsedTime);

    // 6. Update Match State Machine ("First to 6 Wins", Duel Pads, Bot AI)
    this.matchManager.update(delta);

    // Update Physics Dummy Bot in Testing Lab
    if (this.dummyBot) {
      this.dummyBot.update(delta);
    }

    // Check Testing Lab Portal & Leave Area pads
    const playerPos = this.controls.getPosition();
    if (this.matchManager.state === 'LOBBY' && this.map.testingEntrancePad) {
      const pDist = Math.hypot(playerPos.x - this.map.testingEntrancePad.position.x, playerPos.z - this.map.testingEntrancePad.position.z);
      if (pDist < 2.5) {
        this.controls.teleport(new THREE.Vector3(0, 0.55, -188), new THREE.Vector3(0, 0.55, -205));
        this.matchManager.enterTestingLab();
      }
    } else if (this.matchManager.state === 'TESTING_LAB' && this.map.testingExitPad) {
      const pDist = Math.hypot(playerPos.x - this.map.testingExitPad.position.x, playerPos.z - this.map.testingExitPad.position.z);
      if (pDist < 2.5) {
        this.controls.teleport(new THREE.Vector3(0, 0.55, -84), new THREE.Vector3(0, 0.55, 0));
        this.matchManager.leaveTestingLab();
        if (this.dummyBot) this.dummyBot.reset();
      }
    }

    // 7. Update Active Thrown Grenades & Aiming Trajectory & RPG Rockets
    this.updateActiveGrenades(delta);
    this.updateActiveRockets(delta);
    this.updateGrenadeTrajectory();

    // 8. Update HUD dynamic indicators
    this.updateHUDWeapon();

    // 9. Dual-Pass Render (World Scene + No-Clip Viewmodel)
    this.cameraManager.render(this.worldScene, this.weaponSystem.vmScene, this.weaponSystem.currentSlot);
  }
}

// Start Game on Page Load with readyState check
function initGame() {
  if (window.__gameEngineInstance) return;
  try {
    window.__gameEngineInstance = new GameEngine();
    if (window.__pendingStart && typeof window.onStartGameClick === 'function') {
      window.onStartGameClick();
    }
  } catch (err) {
    console.error('Failed to initialize GameEngine:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
