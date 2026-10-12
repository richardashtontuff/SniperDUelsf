// CameraManager.js - Dual-Pass Rendering, No-Clip Viewmodel & ADS Scope Zoom
import * as THREE from '../vendor/three/three.module.js';

export class CameraManager {
  constructor(renderer, aspect) {
    this.renderer = renderer;

    const safeAspect = (aspect && !isNaN(aspect) && isFinite(aspect) && aspect > 0) ? aspect : (16 / 9);

    // 1. World Camera
    this.baseFov = 75;
    this.scopedFov = 20;
    this.worldCamera = new THREE.PerspectiveCamera(this.baseFov, safeAspect, 0.1, 1000);

    // 2. Dedicated Viewmodel Camera (Fixed FOV prevents fisheye distortion)
    this.vmFov = 52;
    this.vmCamera = new THREE.PerspectiveCamera(this.vmFov, safeAspect, 0.01, 20);

    // Viewmodel scene
    this.vmScene = new THREE.Scene();

    // Lighting for Viewmodel so weapons always look vibrant, metallic, and crisp
    const vmAmbient = new THREE.AmbientLight(0xffffff, 1.25);
    this.vmScene.add(vmAmbient);
    const vmDirectional = new THREE.DirectionalLight(0xfffaea, 1.85);
    vmDirectional.position.set(2.5, 4.2, 3.0);
    this.vmScene.add(vmDirectional);
    const vmRimLight = new THREE.DirectionalLight(0x00e5ff, 0.95);
    vmRimLight.position.set(-2.5, -1.0, -2.0);
    this.vmScene.add(vmRimLight);
    const vmWarmFill = new THREE.DirectionalLight(0xff8833, 0.4);
    vmWarmFill.position.set(0, -3.0, 1.5);
    this.vmScene.add(vmWarmFill);

    // Scope Overlay DOM Element
    this.scopeOverlay = document.getElementById('sniper-scope-overlay');

    // Camera Trauma & Screen Shake Engine
    this.trauma = 0;
    this.shakeRot = new THREE.Euler(0, 0, 0);
  }

  // Adds procedural trauma (clamped 0 to 1) for physical recoil and explosions
  addTrauma(val) {
    this.trauma = Math.min(1.0, this.trauma + Math.max(0, val));
  }

  updateTrauma(delta) {
    if (this.trauma <= 0) return;
    this.trauma = Math.max(0, this.trauma - delta * 2.2);
    const shake = this.trauma * this.trauma; // Non-linear response
    const t = performance.now() * 0.04;

    this.shakeRot.x = Math.sin(t * 1.3) * 0.035 * shake;
    this.shakeRot.y = Math.cos(t * 1.7) * 0.03 * shake;
    this.shakeRot.z = Math.sin(t * 0.9) * 0.02 * shake;
  }

  onResize(width, height) {
    const w = (width && width > 0) ? width : (window.innerWidth || 800);
    const h = (height && height > 0) ? height : (window.innerHeight || 600);
    const aspect = w / h;

    this.worldCamera.aspect = aspect;
    this.worldCamera.updateProjectionMatrix();

    this.vmCamera.aspect = aspect;
    this.vmCamera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  updateADS(adsProgress, delta, weaponType = 'SNIPER') {
    const safeProgress = (typeof adsProgress === 'number' && !isNaN(adsProgress)) ? adsProgress : 0;
    const isSniper = weaponType === 'SNIPER';
    const isRPG = weaponType === 'RPG';
    const isAR = weaponType === 'AR';

    // Interpolate World Camera FOV: Sniper has high 20° zoom, RPG has 50° sight zoom, AR has tactical 52° zoom
    let zoomTarget = this.scopedFov;
    if (isAR) zoomTarget = 52;
    else if (isRPG) zoomTarget = 50;

    const targetFov = THREE.MathUtils.lerp(this.baseFov, zoomTarget, safeProgress);

    this.worldCamera.fov = isNaN(targetFov) ? this.baseFov : targetFov;
    this.worldCamera.updateProjectionMatrix();

    // Update Scope DOM Overlay opacity (Only for Sniper)
    if (!this.scopeOverlay) {
      this.scopeOverlay = document.getElementById('sniper-scope-overlay');
    }
    if (this.scopeOverlay) {
      if (isSniper && safeProgress > 0.6) {
        this.scopeOverlay.style.opacity = ((safeProgress - 0.6) / 0.4).toFixed(3);
        this.scopeOverlay.style.pointerEvents = 'none';
        this.scopeOverlay.style.display = 'block';
      } else {
        this.scopeOverlay.style.opacity = '0';
        this.scopeOverlay.style.display = 'none';
      }
    }
  }

  // Dual-Pass Render
  render(worldScene, vmScene = null, weaponType = 'SNIPER') {
    // Apply camera trauma shake
    if (this.trauma > 0) {
      this.worldCamera.rotation.x += this.shakeRot.x;
      this.worldCamera.rotation.y += this.shakeRot.y;
      this.worldCamera.rotation.z += this.shakeRot.z;
    }

    // Ensure world scene matrix is up to date
    this.worldCamera.updateMatrixWorld(true);

    // Render World
    this.renderer.autoClear = false;
    this.renderer.clear();
    this.renderer.render(worldScene, this.worldCamera);

    // Revert shake offset so controls stay strictly authoritative
    if (this.trauma > 0) {
      this.worldCamera.rotation.x -= this.shakeRot.x;
      this.worldCamera.rotation.y -= this.shakeRot.y;
      this.worldCamera.rotation.z -= this.shakeRot.z;
      this.worldCamera.updateMatrixWorld(true);
    }

    // For sniper when fully scoped in, skip viewmodel render pass so the rifle body never obstructs the scope aperture
    if (weaponType !== 'AR' && this.worldCamera.fov < 48) {
      return;
    }

    const sceneToRender = vmScene || this.vmScene;
    if (sceneToRender) {
      // Viewmodel camera is fixed at origin looking directly down -Z at the weapon
      this.vmCamera.position.set(0, 0, 0);
      this.vmCamera.rotation.set(0, 0, 0);
      this.vmCamera.quaternion.set(0, 0, 0, 1);
      this.vmCamera.updateMatrixWorld(true);

      // Clear Depth Buffer so viewmodel renders cleanly on top without wall clipping
      this.renderer.clearDepth();

      // Render Viewmodel Weapon
      this.renderer.render(sceneToRender, this.vmCamera);
    }
  }
}
