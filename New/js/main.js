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

class GameEngine {
  constructor() {
    this.container = document.getElementById('canvas-container');

    const initW = window.innerWidth > 0 ? window.innerWidth : 800;
    const initH = window.innerHeight > 0 ? window.innerHeight : 600;

    // 1. Core WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(initW, initH);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x232a38, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 2. World Scene & Atmospheric Lighting
    this.worldScene = new THREE.Scene();
    this.worldScene.background = new THREE.Color(0x232a38);
    this.worldScene.fog = new THREE.Fog(0x232a38, 120, 350);

    // Hemisphere skylight (strong ambient fill)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x556677, 1.4);
    this.worldScene.add(hemiLight);

    // Sun Directional Light
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    dirLight.position.set(30, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;
    dirLight.shadow.bias = -0.0005;
    this.worldScene.add(dirLight);

    // Overhead Lobby Spot/Point Lights
    const lobbyCenterLight = new THREE.PointLight(0x00ffff, 3.5, 45);
    lobbyCenterLight.position.set(0, 7, -100);
    this.worldScene.add(lobbyCenterLight);

    const targetRangeLight = new THREE.PointLight(0xffffff, 3.0, 40);
    targetRangeLight.position.set(0, 6, -118);
    this.worldScene.add(targetRangeLight);

    const shopLight = new THREE.PointLight(0xffaa00, 2.5, 30);
    shopLight.position.set(-16, 6, -85);
    this.worldScene.add(shopLight);

    const mapTermLight = new THREE.PointLight(0x00d2ff, 2.5, 30);
    mapTermLight.position.set(16, 6, -85);
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

    // 11. Tactical Grenades & Aiming Trajectory
    this.activeGrenades = [];
    this.isAimingGrenade = false;
    this.initGrenadeTrajectory();

    // Wire input events & combat
    this.setupEvents();

    // Clock
    this.clock = new THREE.Clock();

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

    // Weapon Switching hotkeys (1, 2, Q)
    this.controls.onSlotSwitch = (slot) => {
      this.weaponSystem.equipSlot(slot);
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

    // Return to Lobby (L)
    this.controls.onReturnLobby = () => {
      this.matchManager.returnToLobby();
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
        const slot = chip.getAttribute('data-slot');
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

    // Initialize User Authentication System (Wasmer MySQL / LocalStorage)
    this.initAuthSystem();
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
    if (this.matchManager.state !== 'LOBBY' && this.matchManager.state !== 'ROUND_ACTIVE') {
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

    // Objects to test: Bot limbs, Remote players, Target Dummies, and Map Obstacles
    const candidates = [];

    // Bot hitboxes
    if (this.bot.isAlive && this.bot.mesh.visible) {
      candidates.push(this.bot.head, this.bot.torso, this.bot.leftArm, this.bot.rightArm, this.bot.leftLeg, this.bot.rightLeg);
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

      // 2. Check if Remote Human Player Hit (Cannot attack in lobby)
      if (hitObj.userData && hitObj.userData.isRemotePlayer) {
        if (this.matchManager.state === 'ROUND_ACTIVE') {
          const isHeadshot = hitObj.userData.isHeadshot === true;
          const damage = isHeadshot ? 150 : 92;
          this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xff3300, 14);
          this.mpClient.sendInflictDamage(hitObj.userData.playerId, damage, isHeadshot);
        }
        return;
      }

      // 3. Check if Bot Hit (Cannot attack in lobby)
      if (hitObj.userData && hitObj.userData.isBot) {
        if (this.matchManager.state === 'ROUND_ACTIVE') {
          const isHeadshot = hitObj.userData.isHeadshot === true;
          const damage = isHeadshot ? 150 : 92; // Instakill headshots!
          this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xff3300, 14);
          this.matchManager.onBotDamaged(damage, isHeadshot);
        }
        return;
      }

      // 4. Check if Target Dummy Hit (Lobby Range)
      const targetDummy = this.map.targetDummies.find(d =>
        d.userData.headMesh === hitObj || d.userData.torsoMesh === hitObj
      );
      if (targetDummy) {
        const isHeadshot = (hitObj === targetDummy.userData.headMesh);
        const damage = isHeadshot ? 150 : 85;
        this.audio.playHitmarker(isHeadshot);
        this.matchManager.showHitmarker(isHeadshot);
        this.matchManager.showDamageNumber(damage, isHeadshot);
        this.map.hitTarget(targetDummy, isHeadshot);
        this.particles.addImpact(hitPoint, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xffcc00, 10);
        return;
      }

      // 5. Wall Impact (sparks & dust)
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
    if (this.matchManager.state !== 'LOBBY' && this.matchManager.state !== 'ROUND_ACTIVE') {
      return;
    }

    const shootRay = this.controls.getShootRay();
    const raycaster = new THREE.Raycaster(shootRay.origin, shootRay.direction, 0.1, 2.8);

    const candidates = [];
    if (this.bot.isAlive && this.bot.mesh.visible) {
      candidates.push(this.bot.head, this.bot.torso);
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
      // Cannot attack someone in lobby
      if (this.matchManager.state === 'ROUND_ACTIVE') {
        const isHeadshot = hit.object.userData.isHeadshot === true;
        const damage = isHeadshot ? 120 : 65;
        if (hit.object.userData.isRemotePlayer) {
          this.mpClient.sendInflictDamage(hit.object.userData.playerId, damage, isHeadshot);
        } else {
          this.matchManager.onBotDamaged(damage, isHeadshot);
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
        this.bot.takeDamage(damage);
        const isLethal = damage >= 100 || !this.bot.isAlive;
        this.audio.playHitmarker(isLethal);
        this.matchManager.showHitmarker(isLethal);
        this.matchManager.showDamageNumber(damage, isLethal);
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
            this.mpClient.sendInflictDamage(oppId, damage, false);
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

  updateHUDWeapon() {
    const ammoCount = document.getElementById('ammo-count');
    const scopeAmmo = document.getElementById('scope-ammo-val');
    const slotName = document.getElementById('weapon-name');
    const boltNotice = document.getElementById('bolt-status');

    if (ammoCount) {
      if (this.weaponSystem.currentSlot === 'SNIPER') {
        ammoCount.textContent = `${this.weaponSystem.ammo} / ${this.weaponSystem.maxAmmo}`;
      } else if (this.weaponSystem.currentSlot === 'KNIFE') {
        ammoCount.textContent = '∞';
      } else if (this.weaponSystem.currentSlot === 'GRENADE') {
        ammoCount.textContent = `${this.weaponSystem.grenades} / 1`;
      }
    }

    if (scopeAmmo) {
      scopeAmmo.textContent = `${this.weaponSystem.ammo} / ${this.weaponSystem.maxAmmo}`;
    }

    if (slotName) {
      if (this.weaponSystem.currentSlot === 'SNIPER') {
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
      if (this.weaponSystem.currentSlot === 'SNIPER') {
        if (icon) icon.textContent = '🗡️';
        if (label) label.textContent = 'KNIFE';
      } else if (this.weaponSystem.currentSlot === 'KNIFE') {
        if (icon) icon.textContent = '💣';
        if (label) label.textContent = 'GRENADE';
      } else if (this.weaponSystem.currentSlot === 'GRENADE') {
        if (icon) icon.textContent = '🔫';
        if (label) label.textContent = 'AWP';
      }
    }

    // Update Weapon Selector Chips
    ['SNIPER', 'KNIFE', 'GRENADE'].forEach(slot => {
      const chip = document.getElementById(`slot-chip-${slot.toLowerCase()}`);
      if (chip) {
        chip.classList.toggle('active', this.weaponSystem.currentSlot === slot);
      }
    });

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

    // 1. Update FPS Movement Physics & Speed modifier
    const speedMod = this.weaponSystem.getSpeedModifier();
    const moveInfo = this.controls.update(delta, speedMod);

    // 2. Update Weapon Viewmodel (sway, bobbing, ADS, bolt action)
    const isMoving = moveInfo ? moveInfo.isMoving : false;
    const isSprinting = moveInfo ? moveInfo.isSprinting : false;
    const velLen = moveInfo ? moveInfo.velocityLength : 0;
    this.weaponSystem.update(delta, isMoving, isSprinting, velLen);

    // 3. Update Camera Zoom for ADS
    this.cameraManager.updateADS(this.weaponSystem.adsProgress, delta);

    // 4. Update Particle Effects (tracers, sparks, ejected shells, confetti)
    this.particles.update(delta);

    // 5. Update Map (pulsing duel pads, floating shop crate, resetting target dummies)
    this.map.update(delta, elapsedTime);

    // 6. Update Match State Machine ("First to 6 Wins", Duel Pads, Bot AI)
    this.matchManager.update(delta);

    // 7. Update Active Thrown Grenades & Aiming Trajectory
    this.updateActiveGrenades(delta);
    this.updateGrenadeTrajectory();

    // 8. Update HUD dynamic indicators
    this.updateHUDWeapon();

    // 9. Dual-Pass Render (World Scene + No-Clip Viewmodel)
    this.cameraManager.render(this.worldScene, this.weaponSystem.vmScene);
  }
}

// Start Game on Page Load with readyState check
function initGame() {
  if (window.__gameEngineInstance) return;
  try {
    window.__gameEngineInstance = new GameEngine();
  } catch (err) {
    console.error('Failed to initialize GameEngine:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
