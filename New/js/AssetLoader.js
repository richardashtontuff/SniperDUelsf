// AssetLoader.js - Robust 3D Model Factory with Procedural Fallbacks
// Provides procedural low-poly sniper rifles, knives, crates, and GLTF loading fallback
import * as THREE from '../vendor/three/three.module.js';

export class AssetLoader {
  constructor() {
    this.cache = new Map();
  }

  // Attempts to load a GLTF model if available; falls back to procedural generator
  async loadModelWithFallback(url, proceduralFallbackFn) {
    if (this.cache.has(url)) {
      return this.cache.get(url).clone();
    }
    try {
      const gltf = await this.loadGLTF(url);
      if (gltf && gltf.scene) {
        this.cache.set(url, gltf.scene);
        return gltf.scene.clone();
      }
    } catch (err) {
      // Fallback
    }
    const fallback = proceduralFallbackFn();
    this.cache.set(url, fallback);
    return fallback.clone();
  }

  async loadGLTF(url) {
    // Uses procedural low-poly Roblox mesh fallbacks
    return this.createFallback('box');
  }

  // --- PROCEDURAL WEAPON CREATION ---

  // High quality low-poly Bolt-Action Sniper Rifle (AWP style)
  static createProceduralSniper(skinConfig = {}) {
    const root = new THREE.Group();
    root.name = 'SniperRifle';

    const baseColor = skinConfig.primaryColor || 0x242830;
    const accentColor = skinConfig.accentColor || 0x00c3ff;
    const metalColor = skinConfig.metalColor || 0x181818;
    const scopeColor = skinConfig.scopeColor || 0x111317;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.45,
      metalness: 0.25
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.3,
      metalness: 0.6,
      emissive: skinConfig.emissive ? accentColor : 0x000000,
      emissiveIntensity: skinConfig.emissive ? 0.3 : 0
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metalColor,
      roughness: 0.3,
      metalness: 0.85
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x004466,
      emissiveIntensity: 0.4
    });

    // 1. Receiver / Main Body
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.11, 0.7);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0, -0.15);
    root.add(bodyMesh);

    // Accent Stripe
    const stripeGeo = new THREE.BoxGeometry(0.082, 0.03, 0.6);
    const stripeMesh = new THREE.Mesh(stripeGeo, accentMat);
    stripeMesh.position.set(0, 0.02, -0.15);
    root.add(stripeMesh);

    // 2. Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.75, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
    barrelMesh.position.set(0, 0.03, -0.75);
    root.add(barrelMesh);

    // Muzzle Brake
    const brakeGeo = new THREE.BoxGeometry(0.042, 0.042, 0.1);
    const brakeMesh = new THREE.Mesh(brakeGeo, metalMat);
    brakeMesh.position.set(0, 0.03, -1.15);
    root.add(brakeMesh);

    // 3. High-Power Optical Scope
    const scopeMountGeo = new THREE.BoxGeometry(0.03, 0.04, 0.2);
    const scopeMount = new THREE.Mesh(scopeMountGeo, metalMat);
    scopeMount.position.set(0, 0.085, -0.2);
    root.add(scopeMount);

    // Scope main tube
    const scopeTubeGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.38, 12);
    scopeTubeGeo.rotateX(Math.PI / 2);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, new THREE.MeshStandardMaterial({ color: scopeColor, roughness: 0.3, metalness: 0.5 }));
    scopeTube.position.set(0, 0.125, -0.2);
    root.add(scopeTube);

    // Scope front objective bell
    const scopeFrontGeo = new THREE.CylinderGeometry(0.04, 0.028, 0.12, 12);
    scopeFrontGeo.rotateX(Math.PI / 2);
    const scopeFront = new THREE.Mesh(scopeFrontGeo, metalMat);
    scopeFront.position.set(0, 0.125, -0.42);
    root.add(scopeFront);

    // Scope front lens
    const lensGeo = new THREE.CircleGeometry(0.035, 12);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.125, -0.481);
    lens.rotation.y = Math.PI;
    root.add(lens);

    // Scope eye-piece bell
    const scopeRearGeo = new THREE.CylinderGeometry(0.028, 0.036, 0.08, 12);
    scopeRearGeo.rotateX(Math.PI / 2);
    const scopeRear = new THREE.Mesh(scopeRearGeo, metalMat);
    scopeRear.position.set(0, 0.125, -0.01);
    root.add(scopeRear);

    // Scope adjustment turrets
    const turretGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8);
    const topTurret = new THREE.Mesh(turretGeo, metalMat);
    topTurret.position.set(0, 0.16, -0.2);
    root.add(topTurret);

    const sideTurret = new THREE.Mesh(turretGeo, metalMat);
    sideTurret.rotation.z = Math.PI / 2;
    sideTurret.position.set(0.035, 0.125, -0.2);
    root.add(sideTurret);

    // 4. Bolt-Action Assembly (interactive animation group)
    const boltGroup = new THREE.Group();
    boltGroup.name = 'BoltGroup';
    boltGroup.position.set(0, 0.04, -0.05);

    const boltCylinderGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10);
    boltCylinderGeo.rotateX(Math.PI / 2);
    const boltCylinder = new THREE.Mesh(boltCylinderGeo, metalMat);
    boltGroup.add(boltCylinder);

    // Bolt handle stem and knob
    const handleStemGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.07, 8);
    handleStemGeo.rotateZ(Math.PI / 2);
    const handleStem = new THREE.Mesh(handleStemGeo, metalMat);
    handleStem.position.set(0.045, 0.01, 0.05);
    boltGroup.add(handleStem);

    const handleKnobGeo = new THREE.SphereGeometry(0.016, 8, 8);
    const handleKnob = new THREE.Mesh(handleKnobGeo, metalMat);
    handleKnob.position.set(0.08, 0.01, 0.05);
    boltGroup.add(handleKnob);

    root.add(boltGroup);

    // 5. Magazine
    const magGeo = new THREE.BoxGeometry(0.05, 0.16, 0.1);
    const magMesh = new THREE.Mesh(magGeo, metalMat);
    magMesh.name = 'Magazine';
    magMesh.position.set(0, -0.12, -0.12);
    magMesh.rotation.x = -0.15;
    root.add(magMesh);

    // 6. Stock & Grip
    const gripGeo = new THREE.BoxGeometry(0.065, 0.18, 0.09);
    const gripMesh = new THREE.Mesh(gripGeo, bodyMat);
    gripMesh.position.set(0, -0.12, 0.12);
    gripMesh.rotation.x = 0.45;
    root.add(gripMesh);

    const stockGeo = new THREE.BoxGeometry(0.07, 0.13, 0.35);
    const stockMesh = new THREE.Mesh(stockGeo, bodyMat);
    stockMesh.position.set(0, -0.02, 0.35);
    root.add(stockMesh);

    const padGeo = new THREE.BoxGeometry(0.074, 0.15, 0.03);
    const padMesh = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    padMesh.position.set(0, -0.02, 0.53);
    root.add(padMesh);

    // Store references for animations and material swaps
    root.userData = {
      boltGroup: boltGroup,
      magazine: magMesh,
      bodyMesh: bodyMesh,
      stripeMesh: stripeMesh,
      barrelMesh: barrelMesh,
      muzzlePos: new THREE.Vector3(0, 0.03, -1.2)
    };

    return root;
  }

  // Procedural Tactical Assault Rifle (AR-15 / M4 Carbine / SCAR Hybrid)
  static createProceduralAR(skinConfig = {}) {
    const root = new THREE.Group();
    root.name = 'AssaultRifle';

    const baseColor = skinConfig.primaryColor || 0x22242a;
    const accentColor = skinConfig.accentColor || 0xff6600;
    const metalColor = skinConfig.metalColor || 0x141619;
    const magColor = skinConfig.magColor || 0x2e3238;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.42,
      metalness: 0.35
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.35,
      metalness: 0.6,
      emissive: skinConfig.emissive ? accentColor : 0x000000,
      emissiveIntensity: skinConfig.emissive ? 0.35 : 0
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metalColor,
      roughness: 0.28,
      metalness: 0.88
    });

    const magMat = new THREE.MeshStandardMaterial({
      color: magColor,
      roughness: 0.5,
      metalness: 0.4
    });

    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xff1133,
      transparent: true,
      opacity: 0.95
    });

    // 1. Lower Receiver
    const lowerGeo = new THREE.BoxGeometry(0.07, 0.08, 0.28);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.set(0, -0.01, -0.05);
    root.add(lowerMesh);

    // 2. Upper Receiver with Picatinny Top Rail
    const upperGeo = new THREE.BoxGeometry(0.072, 0.075, 0.32);
    const upperMesh = new THREE.Mesh(upperGeo, bodyMat);
    upperMesh.position.set(0, 0.05, -0.06);
    root.add(upperMesh);

    const railGeo = new THREE.BoxGeometry(0.05, 0.015, 0.38);
    const railMesh = new THREE.Mesh(railGeo, metalMat);
    railMesh.position.set(0, 0.095, -0.07);
    root.add(railMesh);

    // Accent side stripe
    const stripeGeo = new THREE.BoxGeometry(0.075, 0.02, 0.3);
    const stripeMesh = new THREE.Mesh(stripeGeo, accentMat);
    stripeMesh.position.set(0, 0.045, -0.06);
    root.add(stripeMesh);

    // 3. Handguard / Quad-Rail Shroud
    const handguardGeo = new THREE.BoxGeometry(0.068, 0.072, 0.36);
    const handguardMesh = new THREE.Mesh(handguardGeo, bodyMat);
    handguardMesh.position.set(0, 0.04, -0.38);
    root.add(handguardMesh);

    // Handguard rails (top, bottom)
    const topHgRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.35), metalMat);
    topHgRail.position.set(0, 0.08, -0.38);
    root.add(topHgRail);

    const botHgRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.32), metalMat);
    botHgRail.position.set(0, 0.0, -0.38);
    root.add(botHgRail);

    // 4. Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.015, 0.017, 0.42, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
    barrelMesh.position.set(0, 0.04, -0.66);
    root.add(barrelMesh);

    // Gas Block
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), metalMat);
    gasBlock.position.set(0, 0.06, -0.58);
    root.add(gasBlock);

    // Birdcage Flash Hider / Muzzle Brake
    const brakeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.09, 10);
    brakeGeo.rotateX(Math.PI / 2);
    const brakeMesh = new THREE.Mesh(brakeGeo, metalMat);
    brakeMesh.position.set(0, 0.04, -0.9);
    root.add(brakeMesh);

    // 5. Curved 30-Round STANAG Magazine
    const magGroup = new THREE.Group();
    magGroup.name = 'Magazine';
    const magGeo = new THREE.BoxGeometry(0.052, 0.22, 0.095);
    const magMesh = new THREE.Mesh(magGeo, magMat);
    magMesh.position.set(0, -0.11, -0.1);
    magMesh.rotation.x = 0.16;
    magGroup.add(magMesh);

    // Mag baseplate & ribs
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.02, 0.105), metalMat);
    magBase.position.set(0, -0.21, -0.08);
    magBase.rotation.x = 0.16;
    magGroup.add(magBase);

    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.01, 0.088), accentMat);
      rib.position.set(0, -0.06 - r * 0.045, -0.11 + r * 0.008);
      rib.rotation.x = 0.16;
      magGroup.add(rib);
    }
    root.add(magGroup);

    // 6. Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.16, 0.065);
    const gripMesh = new THREE.Mesh(gripGeo, bodyMat);
    gripMesh.position.set(0, -0.1, 0.08);
    gripMesh.rotation.x = -0.32;
    root.add(gripMesh);

    // 7. Tactical Crane Buttstock & Buffer Tube
    const tubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10);
    tubeGeo.rotateX(Math.PI / 2);
    const tubeMesh = new THREE.Mesh(tubeGeo, metalMat);
    tubeMesh.position.set(0, 0.04, 0.2);
    root.add(tubeMesh);

    const stockGeo = new THREE.BoxGeometry(0.065, 0.14, 0.24);
    const stockMesh = new THREE.Mesh(stockGeo, bodyMat);
    stockMesh.position.set(0, 0.01, 0.28);
    root.add(stockMesh);

    const padGeo = new THREE.BoxGeometry(0.068, 0.15, 0.025);
    const padMesh = new THREE.Mesh(padGeo, metalMat);
    padMesh.position.set(0, 0.01, 0.4);
    root.add(padMesh);

    // 8. Holographic Optic Sight (Reflex Sight)
    const opticGroup = new THREE.Group();
    opticGroup.name = 'HoloSight';

    // Base clamp
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.02, 0.12), metalMat);
    opticBase.position.set(0, 0.11, -0.12);
    opticGroup.add(opticBase);

    // Protective hood
    const hoodLeft = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.065, 0.11), metalMat);
    hoodLeft.position.set(-0.032, 0.145, -0.12);
    opticGroup.add(hoodLeft);

    const hoodRight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.065, 0.11), metalMat);
    hoodRight.position.set(0.032, 0.145, -0.12);
    opticGroup.add(hoodRight);

    const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.01, 0.11), metalMat);
    hoodTop.position.set(0, 0.175, -0.12);
    opticGroup.add(hoodTop);

    // Glass Lens
    const lensGeo = new THREE.PlaneGeometry(0.052, 0.052);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x22ffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 0.145, -0.12);
    opticGroup.add(lensMesh);

    // Illuminated Red Center Dot Reticle
    const dotGeo = new THREE.RingGeometry(0.003, 0.007, 12);
    const dotMesh = new THREE.Mesh(dotGeo, reticleMat);
    dotMesh.position.set(0, 0.145, -0.121);
    opticGroup.add(dotMesh);

    root.add(opticGroup);

    // 9. Flip-up Front Sight
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.02), metalMat);
    frontSight.position.set(0, 0.105, -0.54);
    root.add(frontSight);

    // 10. Ejection Port & Shell Deflector
    const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.035, 0.075), metalMat);
    ejectPort.position.set(0.038, 0.05, -0.06);
    root.add(ejectPort);

    root.userData = {
      bodyMesh: lowerMesh,
      upperMesh: upperMesh,
      stripeMesh: stripeMesh,
      barrelMesh: barrelMesh,
      magazine: magGroup,
      opticGroup: opticGroup,
      muzzlePos: new THREE.Vector3(0, 0.04, -0.95)
    };

    return root;
  }

  // Procedural RPG-7 Rocket Launcher (Shoulder-Fired Anti-Tank Launcher)
  static createProceduralRPG(skinConfig = {}) {
    const root = new THREE.Group();
    root.name = 'RPGLauncher';

    const tubeColor = skinConfig.primaryColor || 0x2b332b; // Dark military green
    const woodColor = skinConfig.woodColor || 0x5a3e22; // Bakelite / wood heat shield
    const metalColor = skinConfig.metalColor || 0x181a1c;
    const rocketColor = skinConfig.rocketColor || 0x475e3e; // Olive drab warhead

    const tubeMat = new THREE.MeshStandardMaterial({
      color: tubeColor,
      roughness: 0.5,
      metalness: 0.6
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: woodColor,
      roughness: 0.65,
      metalness: 0.15
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metalColor,
      roughness: 0.35,
      metalness: 0.85
    });

    const warheadMat = new THREE.MeshStandardMaterial({
      color: rocketColor,
      roughness: 0.45,
      metalness: 0.4
    });

    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.9
    });

    // 1. Main Tube (Cylinder, oriented along Z axis)
    const tubeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.75, 16);
    tubeGeo.rotateX(Math.PI / 2);
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.position.set(0, 0, 0);
    root.add(tubeMesh);

    // 2. Rear Venturi Exhaust Cone (Flared cone at back)
    const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.07, 0.2, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMesh = new THREE.Mesh(exhaustGeo, metalMat);
    exhaustMesh.position.set(0, 0, 0.45);
    root.add(exhaustMesh);

    // 3. Wood / Fiberglass Heat Shield (Middle section)
    const heatShieldGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.38, 16);
    heatShieldGeo.rotateX(Math.PI / 2);
    const heatShield = new THREE.Mesh(heatShieldGeo, woodMat);
    heatShield.position.set(0, 0, 0.05);
    root.add(heatShield);

    // Heat shield reinforcing metal bands
    const bandGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.02, 16);
    bandGeo.rotateX(Math.PI / 2);
    const band1 = new THREE.Mesh(bandGeo, metalMat);
    band1.position.set(0, 0, 0.22);
    const band2 = new THREE.Mesh(bandGeo, metalMat);
    band2.position.set(0, 0, -0.12);
    root.add(band1);
    root.add(band2);

    // 4. Front Muzzle Ring
    const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, metalMat);
    muzzle.position.set(0, 0, -0.38);
    root.add(muzzle);

    // 5. Handles & Trigger
    const gripGeo = new THREE.BoxGeometry(0.035, 0.14, 0.05);
    gripGeo.rotateX(-0.2);
    const grip = new THREE.Mesh(gripGeo, woodMat);
    grip.position.set(0, -0.1, 0.15);
    root.add(grip);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.04), metalMat);
    guard.position.set(0, -0.06, 0.18);
    root.add(guard);

    const frontGripGeo = new THREE.BoxGeometry(0.035, 0.12, 0.045);
    frontGripGeo.rotateX(-0.15);
    const frontGrip = new THREE.Mesh(frontGripGeo, woodMat);
    frontGrip.position.set(0, -0.09, -0.16);
    root.add(frontGrip);

    // 6. PGO-7 Optical Scope Bracket & Sight (Mounted on left side)
    const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.1), metalMat);
    scopeMount.position.set(-0.05, 0.04, -0.05);
    root.add(scopeMount);

    const scopeTubeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
    scopeTubeGeo.rotateX(Math.PI / 2);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, metalMat);
    scopeTube.position.set(-0.065, 0.08, -0.05);
    root.add(scopeTube);

    const eyecupGeo = new THREE.CylinderGeometry(0.03, 0.024, 0.05, 12);
    eyecupGeo.rotateX(Math.PI / 2);
    const eyecup = new THREE.Mesh(eyecupGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    eyecup.position.set(-0.065, 0.08, 0.06);
    root.add(eyecup);

    // 7. PG-7V Rocket Warhead (Loaded in the front of the launcher!)
    const warheadGroup = new THREE.Group();
    warheadGroup.position.set(0, 0, -0.38);

    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
    stemGeo.rotateX(Math.PI / 2);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(0, 0, -0.1);
    warheadGroup.add(stem);

    const flareGeo = new THREE.CylinderGeometry(0.075, 0.025, 0.14, 16);
    flareGeo.rotateX(-Math.PI / 2);
    const flare = new THREE.Mesh(flareGeo, warheadMat);
    flare.position.set(0, 0, -0.22);
    warheadGroup.add(flare);

    const bulbGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.15, 16);
    bulbGeo.rotateX(Math.PI / 2);
    const bulb = new THREE.Mesh(bulbGeo, warheadMat);
    bulb.position.set(0, 0, -0.36);
    warheadGroup.add(bulb);

    const noseGeo = new THREE.ConeGeometry(0.075, 0.22, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, warheadMat);
    nose.position.set(0, 0, -0.54);
    warheadGroup.add(nose);

    const spikeGeo = new THREE.CylinderGeometry(0.008, 0.015, 0.1, 8);
    spikeGeo.rotateX(Math.PI / 2);
    const spike = new THREE.Mesh(spikeGeo, tipMat);
    spike.position.set(0, 0, -0.68);
    warheadGroup.add(spike);

    root.add(warheadGroup);

    root.userData = {
      bodyMesh: tubeMesh,
      warhead: warheadGroup,
      heatShield: heatShield,
      muzzlePos: new THREE.Vector3(0, 0, -1.0)
    };

    return root;
  }

  // Standalone PG-7V High Explosive Rocket Projectile for World Flight
  static createProceduralRocketWarhead() {
    const root = new THREE.Group();
    root.name = 'RPGRocket';

    const rocketMat = new THREE.MeshStandardMaterial({
      color: 0x475e3e,
      roughness: 0.45,
      metalness: 0.4
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.35,
      metalness: 0.85
    });
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    // Motor body
    const motorGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12);
    motorGeo.rotateX(Math.PI / 2);
    const motor = new THREE.Mesh(motorGeo, metalMat);
    motor.position.set(0, 0, 0.15);
    root.add(motor);

    // Exhaust nozzle glowing fiery
    const nozzleGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.08, 12);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, motorMat);
    nozzle.position.set(0, 0, 0.4);
    root.add(nozzle);

    // Tail stabilizer fins
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.01, 0.14, 0.12);
      const fin = new THREE.Mesh(finGeo, metalMat);
      fin.rotation.z = (Math.PI / 2) * i;
      fin.position.set(0, 0, 0.32);
      root.add(fin);
    }

    // Warhead conical flare
    const flareGeo = new THREE.CylinderGeometry(0.085, 0.035, 0.16, 16);
    flareGeo.rotateX(-Math.PI / 2);
    const flare = new THREE.Mesh(flareGeo, rocketMat);
    flare.position.set(0, 0, -0.15);
    root.add(flare);

    // Main warhead cylinder
    const bulbGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.16, 16);
    bulbGeo.rotateX(Math.PI / 2);
    const bulb = new THREE.Mesh(bulbGeo, rocketMat);
    bulb.position.set(0, 0, -0.31);
    root.add(bulb);

    // Ogive nose cone
    const noseGeo = new THREE.ConeGeometry(0.085, 0.25, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, rocketMat);
    nose.position.set(0, 0, -0.51);
    root.add(nose);

    // Contact fuse spike
    const spikeGeo = new THREE.CylinderGeometry(0.008, 0.016, 0.12, 8);
    spikeGeo.rotateX(Math.PI / 2);
    const spike = new THREE.Mesh(spikeGeo, metalMat);
    spike.position.set(0, 0, -0.68);
    root.add(spike);

    return root;
  }

  // Procedural Tactical Knife (Karambit / Tanto Blade)
  static createProceduralKnife(skinConfig = {}) {
    const root = new THREE.Group();
    root.name = 'TacticalKnife';

    const bladeColor = skinConfig.bladeColor || 0xd8d8d8;
    const handleColor = skinConfig.handleColor || 0x222428;
    const accentColor = skinConfig.accentColor || 0xff0055;

    const bladeMat = new THREE.MeshStandardMaterial({
      color: bladeColor,
      roughness: 0.18,
      metalness: 0.95
    });

    const handleMat = new THREE.MeshStandardMaterial({
      color: handleColor,
      roughness: 0.7,
      metalness: 0.2
    });

    const ringMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.3,
      metalness: 0.8
    });

    // Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.03, 0.16);
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.position.set(0, 0, 0.08);
    root.add(handleMesh);

    // Tactical finger grooves
    for (let i = 0; i < 3; i++) {
      const grooveGeo = new THREE.BoxGeometry(0.042, 0.008, 0.02);
      const groove = new THREE.Mesh(grooveGeo, ringMat);
      groove.position.set(0, -0.012, 0.04 + i * 0.04);
      root.add(groove);
    }

    // Rear finger ring (Karambit style)
    const ringGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0, 0.18);
    root.add(ringMesh);

    // Guard
    const guardGeo = new THREE.BoxGeometry(0.046, 0.05, 0.015);
    const guardMesh = new THREE.Mesh(guardGeo, ringMat);
    guardMesh.position.set(0, 0, 0);
    root.add(guardMesh);

    // Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.005, 0.035);
    bladeShape.lineTo(0.18, 0.018);
    bladeShape.lineTo(0.24, 0);
    bladeShape.lineTo(0.05, -0.015);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.008, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.003, bevelThickness: 0.003 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    bladeGeo.rotateY(Math.PI / 2);
    bladeGeo.center();

    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.name = 'KnifeBlade';
    bladeMesh.position.set(0, 0.01, -0.14);
    root.add(bladeMesh);

    root.userData = {
      bladeMesh: bladeMesh,
      handleMesh: handleMesh
    };

    return root;
  }

  // Procedural Tactical Frag Grenade (M67 / Pineapple tactical grenade)
  static createProceduralGrenade() {
    const root = new THREE.Group();
    root.name = 'TacticalGrenade';

    const oliveMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b38,
      roughness: 0.65,
      metalness: 0.25
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2326,
      roughness: 0.5,
      metalness: 0.75
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xb0b8c0,
      roughness: 0.25,
      metalness: 0.95
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xe6b800,
      roughness: 0.5,
      metalness: 0.1
    });

    // 1. Grenade Spheroid Body
    const bodyGeo = new THREE.SphereGeometry(0.065, 18, 14);
    bodyGeo.scale(1.0, 1.25, 1.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, oliveMat);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // 2. Tactical Fragmentation Rings (3 ribbed segments)
    [-0.035, 0.0, 0.035].forEach(yPos => {
      const ribGeo = new THREE.TorusGeometry(0.066, 0.005, 8, 24);
      ribGeo.rotateX(Math.PI / 2);
      const ribMesh = new THREE.Mesh(ribGeo, darkMetalMat);
      ribMesh.position.y = yPos;
      root.add(ribMesh);
    });

    // 3. Collar / Fuse Neck
    const neckGeo = new THREE.CylinderGeometry(0.024, 0.027, 0.035, 14);
    const neckMesh = new THREE.Mesh(neckGeo, darkMetalMat);
    neckMesh.position.y = 0.095;
    root.add(neckMesh);

    // 4. Yellow High-Explosive Ordnance Ring
    const stripeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 14);
    const stripeMesh = new THREE.Mesh(stripeGeo, yellowMat);
    stripeMesh.position.y = 0.088;
    root.add(stripeMesh);

    // 5. Fuse Cap / Bouchon Top
    const capGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.025, 12);
    const capMesh = new THREE.Mesh(capGeo, steelMat);
    capMesh.position.y = 0.12;
    root.add(capMesh);

    // 6. Safety Lever / Curved Spoon
    const spoonGroup = new THREE.Group();
    spoonGroup.position.set(0, 0.12, 0);

    const spoonGeo = new THREE.BoxGeometry(0.018, 0.14, 0.006);
    const spoonMesh = new THREE.Mesh(spoonGeo, oliveMat);
    spoonMesh.position.set(0.032, -0.05, 0);
    spoonMesh.rotation.z = -0.12;
    spoonGroup.add(spoonMesh);
    root.add(spoonGroup);

    // 7. Safety Pin Pull Ring & Cotter Pin
    const pinShaftGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.035, 8);
    pinShaftGeo.rotateZ(Math.PI / 2);
    const pinShaft = new THREE.Mesh(pinShaftGeo, steelMat);
    pinShaft.position.set(0, 0.115, 0);
    root.add(pinShaft);

    const ringGeo = new THREE.TorusGeometry(0.018, 0.003, 8, 18);
    const ringMesh = new THREE.Mesh(ringGeo, steelMat);
    ringMesh.position.set(-0.024, 0.115, 0);
    ringMesh.rotation.y = Math.PI / 2;
    root.add(ringMesh);

    root.userData = {
      bodyMesh,
      spoonGroup,
      ringMesh
    };

    return root;
  }

  // Procedural Target Dummy for Shooting Range in Lobby
  static createTargetDummy() {
    const root = new THREE.Group();
    root.name = 'TargetDummy';

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });

    // Stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), baseMat);
    stand.position.y = 0.6;
    root.add(stand);

    // Hinge Pivot for knockdown animation
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.2, 0);
    root.add(pivot);

    // Target Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.08);
    const torsoMesh = new THREE.Mesh(torsoGeo, woodMat);
    torsoMesh.position.y = 0.375;
    pivot.add(torsoMesh);

    // Bullseye Ring on Torso
    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.084, 16), redMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.set(0, 0.375, 0);
    pivot.add(outerRing);

    const innerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.086, 16), whiteMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.set(0, 0.375, 0);
    pivot.add(innerRing);

    // Target Head (Headshot target!)
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.08);
    const headMesh = new THREE.Mesh(headGeo, redMat);
    headMesh.name = 'TargetHead';
    headMesh.position.set(0, 0.9, 0);
    pivot.add(headMesh);

    // User data for hit detection
    root.userData = {
      isTarget: true,
      pivot: pivot,
      headMesh: headMesh,
      torsoMesh: torsoMesh,
      isKnockedDown: false,
      resetTimer: 0
    };

    return root;
  }

  // ==========================================
  // PROCEDURAL HIGH-FIDELITY AVATAR SKIN TEXTURE GENERATOR
  // ==========================================
  static _skinTexCache = {};

  static getSkinTextures(theme, cfg = {}) {
    if (typeof document === 'undefined') return {};
    if (AssetLoader._skinTexCache[theme]) return AssetLoader._skinTexCache[theme];

    const shirtHex = typeof cfg.shirtColor === 'number' ? '#' + cfg.shirtColor.toString(16).padStart(6, '0') : (cfg.shirtColor || '#00d2ff');
    const accentHex = typeof cfg.accentColor === 'number' ? '#' + cfg.accentColor.toString(16).padStart(6, '0') : (cfg.accentColor || shirtHex);
    const pantsHex = typeof cfg.pantsColor === 'number' ? '#' + cfg.pantsColor.toString(16).padStart(6, '0') : (cfg.pantsColor || '#1a1e26');
    const visorHex = typeof cfg.visorColor === 'number' ? '#' + cfg.visorColor.toString(16).padStart(6, '0') : (cfg.visorColor || accentHex);

    // Torso Canvas (512x512)
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 512;
    tCanvas.height = 512;
    const tCtx = tCanvas.getContext('2d');

    // Torso Emissive Canvas (512x512)
    const teCanvas = document.createElement('canvas');
    teCanvas.width = 512;
    teCanvas.height = 512;
    const teCtx = teCanvas.getContext('2d');
    teCtx.fillStyle = '#000000';
    teCtx.fillRect(0, 0, 512, 512);

    // Limbs Canvas (256x256)
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 256;
    lCanvas.height = 256;
    const lCtx = lCanvas.getContext('2d');

    // Limbs Emissive Canvas (256x256)
    const leCanvas = document.createElement('canvas');
    leCanvas.width = 256;
    leCanvas.height = 256;
    const leCtx = leCanvas.getContext('2d');
    leCtx.fillStyle = '#000000';
    leCtx.fillRect(0, 0, 256, 256);

    // Head / Face Canvas (256x256)
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 256;
    hCanvas.height = 256;
    const hCtx = hCanvas.getContext('2d');

    const isCyber = theme.includes('cyber') || theme === 'skin_cyber_ninja';
    const isGothic = theme.includes('shadow') || theme.includes('angel') || theme === 'skin_agent_shadow';
    const isDemon = theme.includes('demon') || theme === 'skin_manga_demon';
    const isMecha = theme.includes('mecha') || theme === 'skin_manga_mecha';
    const isValkyrie = theme.includes('valkyrie') || theme === 'skin_manga_valkyrie';
    const isSaiyan = theme.includes('saiyan') || theme === 'skin_manga_saiyan';
    const isSpecOps = theme.includes('ghost') || theme === 'skin_specops_ghost';
    const isMilitary = theme.includes('military');
    const isTactical = theme.includes('tactical');

    if (isCyber) {
      // 1. CYBERNEON / TECH OPERATOR (Image 1 Style)
      tCtx.fillStyle = '#0a0f16';
      tCtx.fillRect(0, 0, 512, 512);

      // Carbon fiber weave background
      tCtx.strokeStyle = '#151e2a';
      tCtx.lineWidth = 1;
      for (let i = 0; i < 512; i += 16) {
        tCtx.beginPath(); tCtx.moveTo(0, i); tCtx.lineTo(512, i); tCtx.stroke();
        tCtx.beginPath(); tCtx.moveTo(i, 0); tCtx.lineTo(i, 512); tCtx.stroke();
      }

      // Front: Armored Pectoral Plates
      tCtx.fillStyle = '#162232';
      tCtx.beginPath();
      tCtx.moveTo(120, 80); tCtx.lineTo(240, 90); tCtx.lineTo(230, 220); tCtx.lineTo(130, 210); tCtx.closePath();
      tCtx.fill();
      tCtx.beginPath();
      tCtx.moveTo(272, 90); tCtx.lineTo(392, 80); tCtx.lineTo(382, 210); tCtx.lineTo(282, 220); tCtx.closePath();
      tCtx.fill();

      // Front: Center Arc Reactor Core
      tCtx.fillStyle = '#00d2ff';
      tCtx.beginPath(); tCtx.arc(256, 180, 42, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = '#ffffff';
      tCtx.beginPath(); tCtx.arc(256, 180, 24, 0, Math.PI * 2); tCtx.fill();

      teCtx.fillStyle = '#00f7ff';
      teCtx.beginPath(); teCtx.arc(256, 180, 42, 0, Math.PI * 2); teCtx.fill();
      teCtx.fillStyle = '#ffffff';
      teCtx.beginPath(); teCtx.arc(256, 180, 24, 0, Math.PI * 2); teCtx.fill();

      // Branching Glowing Circuit Traces
      tCtx.strokeStyle = '#00f7ff';
      tCtx.lineWidth = 4;
      teCtx.strokeStyle = '#00f7ff';
      teCtx.lineWidth = 4;

      const drawCircuit = (ctx) => {
        ctx.beginPath();
        ctx.moveTo(256, 222); ctx.lineTo(256, 380);
        ctx.moveTo(256, 260); ctx.lineTo(190, 310); ctx.lineTo(130, 310);
        ctx.moveTo(256, 260); ctx.lineTo(322, 310); ctx.lineTo(382, 310);
        ctx.moveTo(256, 340); ctx.lineTo(200, 390); ctx.lineTo(140, 390);
        ctx.moveTo(256, 340); ctx.lineTo(312, 390); ctx.lineTo(372, 390);
        ctx.stroke();
      };
      drawCircuit(tCtx);
      drawCircuit(teCtx);

      // Back: Glowing Spinal Vertebrae Conduits
      tCtx.fillStyle = '#00f7ff';
      teCtx.fillStyle = '#00f7ff';
      for (let y = 100; y < 440; y += 40) {
        tCtx.fillRect(244, y, 24, 22);
        teCtx.fillRect(244, y, 24, 22);
      }

      // Tech stencils
      tCtx.fillStyle = '#64748b';
      tCtx.font = 'bold 16px monospace';
      tCtx.fillText('CYBER_01 // 98.4%', 60, 470);
      tCtx.fillText('OVERDRIVE ENGAGED', 310, 470);

      // Limbs: Conduits & Telemetry
      lCtx.fillStyle = '#0f1722';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.strokeStyle = '#00f7ff';
      lCtx.lineWidth = 3;
      lCtx.strokeRect(30, 40, 196, 180);
      lCtx.fillStyle = '#00f7ff';
      lCtx.font = 'bold 12px monospace';
      lCtx.fillText('SYS_OK', 42, 65);
      lCtx.fillText('PWR 100%', 42, 85);

      leCtx.strokeStyle = '#00f7ff';
      leCtx.lineWidth = 3;
      leCtx.strokeRect(30, 40, 196, 180);
      leCtx.fillStyle = '#00f7ff';
      leCtx.font = 'bold 12px monospace';
      leCtx.fillText('SYS_OK', 42, 65);
      leCtx.fillText('PWR 100%', 42, 85);

    } else if (isGothic) {
      // 2. GOTHIC DARK ANGEL / EMO PUNK (Image 2 Style)
      tCtx.fillStyle = '#0d0d12';
      tCtx.fillRect(0, 0, 512, 512);

      // Leather grain texture
      tCtx.fillStyle = '#16161e';
      for (let i = 0; i < 400; i++) {
        tCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }

      // X-Shaped Studded Bondage Harness Straps
      tCtx.strokeStyle = '#1a1a24';
      tCtx.lineWidth = 26;
      tCtx.beginPath();
      tCtx.moveTo(80, 80); tCtx.lineTo(432, 432);
      tCtx.moveTo(432, 80); tCtx.lineTo(80, 432);
      tCtx.stroke();

      // Silver Rivets / Studs along Harness Straps
      const drawRivets = (x1, y1, x2, y2, count) => {
        for (let i = 1; i < count; i++) {
          const t = i / count;
          const rx = x1 + (x2 - x1) * t;
          const ry = y1 + (y2 - y1) * t;
          // Outer shadow
          tCtx.fillStyle = '#000000';
          tCtx.beginPath(); tCtx.arc(rx + 2, ry + 2, 6, 0, Math.PI * 2); tCtx.fill();
          // Polished silver
          tCtx.fillStyle = '#e2e8f0';
          tCtx.beginPath(); tCtx.arc(rx, ry, 6, 0, Math.PI * 2); tCtx.fill();
          // Metallic specular
          tCtx.fillStyle = '#ffffff';
          tCtx.beginPath(); tCtx.arc(rx - 2, ry - 2, 2.5, 0, Math.PI * 2); tCtx.fill();
        }
      };
      drawRivets(80, 80, 432, 432, 10);
      drawRivets(432, 80, 80, 432, 10);

      // Center Chrome O-Ring Hub
      tCtx.fillStyle = '#000000';
      tCtx.beginPath(); tCtx.arc(258, 258, 38, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = '#cbd5e1';
      tCtx.beginPath(); tCtx.arc(256, 256, 38, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = '#0d0d12';
      tCtx.beginPath(); tCtx.arc(256, 256, 22, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = '#ffffff';
      tCtx.beginPath(); tCtx.arc(248, 248, 8, 0, Math.PI * 2); tCtx.fill();

      // Silver Choker Collar & Hanging Padlock Pendant
      tCtx.fillStyle = '#1c1c26';
      tCtx.fillRect(160, 40, 192, 22);
      tCtx.fillStyle = '#e2e8f0';
      // Padlock
      tCtx.fillRect(244, 75, 24, 28);
      tCtx.strokeStyle = '#e2e8f0';
      tCtx.lineWidth = 4;
      tCtx.beginPath(); tCtx.arc(256, 75, 12, Math.PI, Math.PI * 2); tCtx.stroke();

      // Double Studded Waist Belt with Hanging Chains
      tCtx.fillStyle = '#111116';
      tCtx.fillRect(60, 430, 392, 36);
      tCtx.fillStyle = '#e2e8f0';
      for (let x = 80; x < 430; x += 30) {
        tCtx.fillRect(x, 436, 12, 10);
        tCtx.fillRect(x, 450, 12, 10);
      }
      // Buckle
      tCtx.strokeStyle = '#ffffff';
      tCtx.lineWidth = 6;
      tCtx.strokeRect(236, 428, 40, 40);

      // Limbs: Straps, Studs & Combat Boot Laces
      lCtx.fillStyle = '#0d0d12';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.fillStyle = '#1a1a24';
      lCtx.fillRect(20, 30, 216, 24);
      lCtx.fillRect(20, 100, 216, 24);
      lCtx.fillRect(20, 170, 216, 24);
      lCtx.fillStyle = '#e2e8f0';
      for (let x = 35; x < 230; x += 32) {
        lCtx.beginPath(); lCtx.arc(x, 42, 5, 0, Math.PI * 2); lCtx.fill();
        lCtx.beginPath(); lCtx.arc(x, 112, 5, 0, Math.PI * 2); lCtx.fill();
        lCtx.beginPath(); lCtx.arc(x, 182, 5, 0, Math.PI * 2); lCtx.fill();
      }

    } else if (isDemon) {
      // 3. FLAME DEMON SLAYER
      tCtx.fillStyle = '#121218';
      tCtx.fillRect(0, 0, 512, 512);

      // Stylized Rising Flame Waves
      tCtx.fillStyle = '#d63031';
      tCtx.beginPath();
      tCtx.moveTo(0, 512);
      tCtx.lineTo(0, 260);
      tCtx.quadraticCurveTo(80, 200, 140, 320);
      tCtx.quadraticCurveTo(200, 180, 256, 280);
      tCtx.quadraticCurveTo(320, 160, 380, 300);
      tCtx.quadraticCurveTo(450, 210, 512, 250);
      tCtx.lineTo(512, 512);
      tCtx.closePath();
      tCtx.fill();

      tCtx.fillStyle = '#ff7675';
      tCtx.beginPath();
      tCtx.moveTo(0, 512);
      tCtx.lineTo(0, 340);
      tCtx.quadraticCurveTo(80, 280, 140, 390);
      tCtx.quadraticCurveTo(200, 260, 256, 360);
      tCtx.quadraticCurveTo(320, 240, 380, 380);
      tCtx.quadraticCurveTo(450, 290, 512, 330);
      tCtx.lineTo(512, 512);
      tCtx.closePath();
      tCtx.fill();

      // Golden Kanji Crest (滅 / 炎)
      tCtx.fillStyle = '#f1c40f';
      tCtx.font = 'bold 96px serif';
      tCtx.textAlign = 'center';
      tCtx.fillText('炎', 256, 210);

      teCtx.fillStyle = '#ff4400';
      teCtx.font = 'bold 96px serif';
      teCtx.textAlign = 'center';
      teCtx.fillText('炎', 256, 210);

      lCtx.fillStyle = '#161620';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.strokeStyle = '#ffffff';
      lCtx.lineWidth = 3;
      for (let y = 30; y < 240; y += 35) {
        lCtx.beginPath(); lCtx.moveTo(30, y); lCtx.lineTo(226, y + 15); lCtx.stroke();
        lCtx.beginPath(); lCtx.moveTo(226, y); lCtx.lineTo(30, y + 15); lCtx.stroke();
      }

    } else if (isSpecOps || isMilitary) {
      // 4. MIL-SPEC DIGITAL MARPAT CAMOUFLAGE
      const baseCol = isSpecOps ? '#1e242b' : (theme.includes('desert') ? '#8c7853' : (theme.includes('arctic') ? '#ced6e0' : '#2b3a4a'));
      const c1 = isSpecOps ? '#2d3748' : '#a38f6b';
      const c2 = isSpecOps ? '#111418' : '#5a4a35';
      const c3 = isSpecOps ? '#3b4758' : '#c4b18c';

      tCtx.fillStyle = baseCol;
      tCtx.fillRect(0, 0, 512, 512);

      // Pixelated camouflage matrix
      [c1, c2, c3].forEach(c => {
        tCtx.fillStyle = c;
        for (let i = 0; i < 90; i++) {
          const x = Math.floor(Math.random() * 32) * 16;
          const y = Math.floor(Math.random() * 32) * 16;
          const w = (Math.floor(Math.random() * 3) + 1) * 16;
          const h = (Math.floor(Math.random() * 3) + 1) * 16;
          tCtx.fillRect(x, y, w, h);
        }
      });

      // Tactical MOLLE Webbing Loops
      tCtx.strokeStyle = 'rgba(0,0,0,0.6)';
      tCtx.lineWidth = 3;
      for (let y = 140; y < 420; y += 32) {
        tCtx.strokeRect(80, y, 352, 18);
      }

      // Ballistic chest plate outline & Velcro flag
      tCtx.strokeStyle = 'rgba(255,255,255,0.25)';
      tCtx.lineWidth = 4;
      tCtx.strokeRect(100, 80, 312, 340);

      if (isSpecOps) {
        // Ghost Operative Skull Face Texture
        hCtx.fillStyle = '#111418';
        hCtx.fillRect(0, 0, 256, 256);
        hCtx.fillStyle = '#f1f5f9';
        // Stylized skull teeth and nasal bone
        hCtx.fillRect(78, 140, 100, 30);
        hCtx.fillStyle = '#111418';
        for (let x = 86; x < 170; x += 16) {
          hCtx.fillRect(x, 140, 4, 30);
        }
        hCtx.fillStyle = '#f1f5f9';
        hCtx.beginPath();
        hCtx.moveTo(128, 110); hCtx.lineTo(112, 134); hCtx.lineTo(144, 134); hCtx.closePath();
        hCtx.fill();
      }

      lCtx.fillStyle = baseCol;
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.fillStyle = c2;
      for (let i = 0; i < 40; i++) {
        lCtx.fillRect(Math.floor(Math.random() * 16) * 16, Math.floor(Math.random() * 16) * 16, 24, 24);
      }
      lCtx.fillStyle = '#111418';
      lCtx.fillRect(40, 90, 176, 50); // Knee pad

    } else if (isMecha) {
      // 5. UNIT-01 SCI-FI MECHA
      tCtx.fillStyle = '#5c48c7';
      tCtx.fillRect(0, 0, 512, 512);

      // Yellow/Black diagonal hazard caution stripes
      const drawHazards = (ctx, y) => {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(40, y, 432, 26);
        ctx.fillStyle = '#111116';
        for (let x = 40; x < 470; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, y + 26); ctx.lineTo(x + 16, y); ctx.lineTo(x + 28, y); ctx.lineTo(x + 12, y + 26);
          ctx.closePath();
          ctx.fill();
        }
      };
      drawHazards(tCtx, 60);
      drawHazards(tCtx, 420);

      // S2 Core Engine
      tCtx.fillStyle = '#00ff88';
      tCtx.beginPath(); tCtx.arc(256, 240, 46, 0, Math.PI * 2); tCtx.fill();
      teCtx.fillStyle = '#00ff88';
      teCtx.beginPath(); teCtx.arc(256, 240, 46, 0, Math.PI * 2); teCtx.fill();

      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'bold 16px sans-serif';
      tCtx.fillText('EVA-01 // PILOT SYNC: 100%', 120, 330);

      lCtx.fillStyle = '#2d3436';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.fillStyle = '#5c48c7';
      lCtx.fillRect(30, 30, 196, 60);
      lCtx.fillStyle = '#00ff88';
      lCtx.fillRect(30, 88, 196, 6);

    } else if (isValkyrie) {
      // 6. NEON DIVINE VALKYRIE
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, 512, 512);

      // Golden Filigree & Holy Wing Insignia
      tCtx.fillStyle = '#f1c40f';
      tCtx.beginPath();
      tCtx.moveTo(256, 120);
      tCtx.lineTo(360, 200); tCtx.lineTo(256, 260); tCtx.lineTo(152, 200);
      tCtx.closePath();
      tCtx.fill();

      tCtx.fillStyle = '#00d2ff';
      tCtx.beginPath(); tCtx.arc(256, 200, 28, 0, Math.PI * 2); tCtx.fill();
      teCtx.fillStyle = '#00d2ff';
      teCtx.beginPath(); teCtx.arc(256, 200, 28, 0, Math.PI * 2); teCtx.fill();

      // Gold Chevrons
      tCtx.strokeStyle = '#f1c40f';
      tCtx.lineWidth = 8;
      for (let y = 290; y < 440; y += 38) {
        tCtx.beginPath();
        tCtx.moveTo(120, y); tCtx.lineTo(256, y + 30); tCtx.lineTo(392, y);
        tCtx.stroke();
      }

      lCtx.fillStyle = '#f1c40f';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.fillStyle = '#ffffff';
      lCtx.fillRect(30, 30, 196, 196);
      lCtx.fillStyle = '#f1c40f';
      lCtx.fillRect(30, 100, 196, 16);

    } else {
      // 7. DEFAULT / TACTICAL / AGENT
      tCtx.fillStyle = shirtHex;
      tCtx.fillRect(0, 0, 512, 512);
      tCtx.strokeStyle = 'rgba(0,0,0,0.3)';
      tCtx.lineWidth = 4;
      tCtx.strokeRect(60, 60, 392, 392);

      lCtx.fillStyle = pantsHex;
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.fillStyle = 'rgba(0,0,0,0.25)';
      lCtx.fillRect(30, 100, 196, 50);
    }

    const torsoTex = new THREE.CanvasTexture(tCanvas);
    const torsoEmissiveTex = new THREE.CanvasTexture(teCanvas);
    const limbTex = new THREE.CanvasTexture(lCanvas);
    const limbEmissiveTex = new THREE.CanvasTexture(leCanvas);
    const headTex = isSpecOps ? new THREE.CanvasTexture(hCanvas) : null;

    const res = { torsoTex, torsoEmissiveTex, limbTex, limbEmissiveTex, headTex };
    AssetLoader._skinTexCache[theme] = res;
    return res;
  }

  // Iconic High-Fidelity Roblox R6 Character with tactical armor, textures & accessories
  static createRobloxCharacter(configOrShirtColor = 0x00d2ff, pantsColor = 0x22262d, skinColor = 0xffd200) {
    const root = new THREE.Group();
    root.name = 'RobloxPlayer';

    let cfg = {};
    if (typeof configOrShirtColor === 'object' && configOrShirtColor !== null) {
      cfg = configOrShirtColor;
    } else if (typeof configOrShirtColor === 'string') {
      cfg = { theme: configOrShirtColor, id: configOrShirtColor };
    } else {
      cfg = {
        shirtColor: configOrShirtColor,
        pantsColor: pantsColor,
        skinColor: skinColor
      };
    }

    const theme = cfg.theme || cfg.id || 'default';
    const shirtColor = cfg.shirtColor || cfg.primaryColor || 0x00d2ff;
    const pantsCol = cfg.pantsColor || 0x22262d;
    const skinTone = cfg.skinColor || 0xffd200;
    const armorCol = cfg.armorColor || 0x161a20;
    const accentCol = cfg.accentColor || shirtColor;
    const visorCol = cfg.visorColor || accentCol;
    const hairCol = cfg.hairColor || 0x111111;

    // Fetch rich procedural textures
    const textures = AssetLoader.getSkinTextures(theme, cfg);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.45 });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.35,
      metalness: 0.2,
      map: textures.torsoTex || null,
      emissiveMap: textures.torsoEmissiveTex || null,
      emissive: textures.torsoEmissiveTex ? 0xffffff : 0x000000,
      emissiveIntensity: textures.torsoEmissiveTex ? 0.95 : 0
    });
    const armShirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.4,
      metalness: 0.2,
      map: textures.limbTex || null,
      emissiveMap: textures.limbEmissiveTex || null,
      emissive: textures.limbEmissiveTex ? 0xffffff : 0x000000,
      emissiveIntensity: textures.limbEmissiveTex ? 0.85 : 0
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsCol,
      roughness: 0.65,
      map: textures.limbTex || null,
      emissiveMap: textures.limbEmissiveTex || null,
      emissive: textures.limbEmissiveTex ? 0xffffff : 0x000000,
      emissiveIntensity: textures.limbEmissiveTex ? 0.85 : 0
    });
    const armorMat = new THREE.MeshStandardMaterial({ color: armorCol, roughness: 0.7, metalness: 0.35 });
    const visorMat = new THREE.MeshStandardMaterial({
      color: visorCol,
      emissive: visorCol,
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.8
    });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairCol, roughness: 0.85 });

    // 1. Head (instakill hitbox - standard 0.5 x 0.5 x 0.5 at y = 1.65)
    const headMat = textures.headTex ? new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.headTex, roughness: 0.5 }) : skinMat;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
    head.position.y = 1.65;
    head.castShadow = true;
    head.userData = { isHeadshot: true };
    root.add(head);

    // 2. Torso (bodyshot hitbox - standard 0.8 x 0.8 x 0.4 at y = 1.0)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.4), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.userData = { isHeadshot: false };
    root.add(torso);

    // 3. Limbs (arms: 0.35 x 0.75 x 0.35, legs: 0.38 x 0.75 x 0.38)
    const armGeo = new THREE.BoxGeometry(0.35, 0.75, 0.35);
    const isSleeveless = (theme.includes('demon') || theme.includes('saiyan') || theme.includes('desert'));
    const leftArm = new THREE.Mesh(armGeo, isSleeveless ? skinMat : armShirtMat);
    leftArm.position.set(-0.6, 1.0, 0);
    leftArm.userData = { isHeadshot: false };
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, isSleeveless ? skinMat : armShirtMat);
    rightArm.position.set(0.6, 1.0, 0);
    rightArm.userData = { isHeadshot: false };
    root.add(rightArm);

    const legGeo = new THREE.BoxGeometry(0.38, 0.75, 0.38);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.22, 0.38, 0);
    leftLeg.userData = { isHeadshot: false };
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.22, 0.38, 0);
    rightLeg.userData = { isHeadshot: false };
    root.add(rightLeg);

    // ==========================================
    // AUTHENTIC 3D ACCESSORY BUILDERS (IMAGES 1 & 2)
    // ==========================================

    // 1. FLOATING CYBER HALO (IMAGE 1 STYLE)
    const addCyberHalo = (haloColor = 0x00f7ff) => {
      const haloGroup = new THREE.Group();
      haloGroup.position.set(0, 2.22, -0.04);
      haloGroup.rotation.x = 0.22;

      const glowMat = new THREE.MeshStandardMaterial({
        color: haloColor,
        emissive: haloColor,
        emissiveIntensity: 1.8,
        roughness: 0.1
      });

      // Inner ring & Outer ring
      const inGeo = new THREE.TorusGeometry(0.24, 0.016, 12, 32);
      const outGeo = new THREE.TorusGeometry(0.36, 0.016, 12, 32);
      haloGroup.add(new THREE.Mesh(inGeo, glowMat));
      haloGroup.add(new THREE.Mesh(outGeo, glowMat));

      // 8 Radiating Digital Pips
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const pip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.02), glowMat);
        pip.position.set(Math.cos(ang) * 0.38, Math.sin(ang) * 0.38, 0);
        pip.rotation.z = ang;
        haloGroup.add(pip);
      }

      // 4 Crosshair Tick Bars connecting the rings
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.018), glowMat);
        bar.position.set(Math.cos(ang) * 0.30, Math.sin(ang) * 0.30, 0);
        bar.rotation.z = ang;
        haloGroup.add(bar);
      }
      root.add(haloGroup);
    };

    // 2. MULTI-SEGMENTED CYBER BLADE WINGS (IMAGE 1 STYLE)
    const addSegmentedCyberWings = (wingColor = 0x00f7ff) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(0, 1.15, 0.24);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.4, metalness: 0.8 });
      const bladeMat = new THREE.MeshStandardMaterial({
        color: wingColor,
        emissive: wingColor,
        emissiveIntensity: 1.6,
        roughness: 0.15,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });

      [-1, 1].forEach(side => {
        const sideGroup = new THREE.Group();
        sideGroup.position.set(side * 0.18, 0, 0);

        // Tier 1: Upper Primary Blade
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.035), bladeMat);
        b1.position.set(side * 0.42, 0.42, 0);
        b1.rotation.set(0.15, side * 0.25, side * -0.72);
        sideGroup.add(b1);

        const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.06, 0.045), frameMat);
        f1.position.set(side * 0.38, 0.42, 0);
        f1.rotation.set(0.15, side * 0.25, side * -0.72);
        sideGroup.add(f1);

        // Tier 2: Mid Auxiliary Blade
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.74, 0.035), bladeMat);
        b2.position.set(side * 0.36, 0.12, 0);
        b2.rotation.set(0.1, side * 0.2, side * -0.38);
        sideGroup.add(b2);

        // Tier 3: Lower Stabilizer Blade
        const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.52, 0.035), bladeMat);
        b3.position.set(side * 0.28, -0.18, 0);
        b3.rotation.set(0.05, side * 0.15, side * 0.18);
        sideGroup.add(b3);

        wingGroup.add(sideGroup);
      });
      root.add(wingGroup);
    };

    // 3. CAT-EAR CYBER HEADSET (IMAGE 1 STYLE)
    const addCatEarCyberHeadset = (accentCol = 0x00f7ff) => {
      const earMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.4 });
      const glowMat = new THREE.MeshStandardMaterial({ color: accentCol, emissive: accentCol, emissiveIntensity: 1.4 });

      // Curved headband
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.08), earMat);
      band.position.set(0, 1.94, 0);
      root.add(band);

      // Ear-cups with glowing rings
      [-0.27, 0.27].forEach(x => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), earMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(x, 1.65, 0);
        root.add(cup);

        const neonRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 16), glowMat);
        neonRing.rotation.y = Math.PI / 2;
        neonRing.position.set(x + (x > 0 ? 0.04 : -0.04), 1.65, 0);
        root.add(neonRing);
      });

      // Cat-Ear / Fin Antennas on top
      [-0.18, 0.18].forEach(x => {
        const finGeo = new THREE.ConeGeometry(0.06, 0.18, 4);
        const fin = new THREE.Mesh(finGeo, earMat);
        fin.position.set(x, 2.02, 0);
        fin.rotation.set(0, 0, x > 0 ? -0.35 : 0.35);
        root.add(fin);

        const finGlow = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.04), glowMat);
        finGlow.position.set(x, 2.02, 0);
        finGlow.rotation.set(0, 0, x > 0 ? -0.35 : 0.35);
        root.add(finGlow);
      });
    };

    // 4. SPIKED CROWN OF THORNS / SPIKED HALO (IMAGE 2 STYLE)
    const addSpikedCrown = (spikeCol = 0x111116) => {
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 1.95, 0);

      const ringMat = new THREE.MeshStandardMaterial({ color: spikeCol, metalness: 0.9, roughness: 0.2 });
      const ringGeo = new THREE.TorusGeometry(0.28, 0.022, 12, 32);
      ringGeo.rotateX(Math.PI / 2);
      crownGroup.add(new THREE.Mesh(ringGeo, ringMat));

      // 14 Radiating Sharp Conical Spikes
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.22, 8), ringMat);
        spike.position.set(Math.cos(ang) * 0.29, 0.07, Math.sin(ang) * 0.29);
        spike.rotation.set(-Math.sin(ang) * 0.5, 0, Math.cos(ang) * 0.5);
        crownGroup.add(spike);
      }
      root.add(crownGroup);
    };

    // 5. 4 MASSIVE LAYERED FEATHERED FALLEN ANGEL WINGS (IMAGE 2 STYLE)
    const addLayeredFallenAngelWings = (featherCol = 0x14141a) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(0, 1.25, 0.25);

      const fMat = new THREE.MeshStandardMaterial({
        color: featherCol,
        roughness: 0.6,
        metalness: 0.3,
        side: THREE.DoubleSide
      });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });

      [-1, 1].forEach(side => {
        const sideGroup = new THREE.Group();
        sideGroup.position.set(side * 0.15, 0, 0);

        // Upper Main Sweeping Wing (7 Layered Feathers in 3 Tiers)
        const mainWing = new THREE.Group();
        for (let i = 0; i < 7; i++) {
          const frac = i / 6;
          const len = 0.55 + frac * 0.55;
          const feather = new THREE.Mesh(new THREE.BoxGeometry(0.12, len, 0.03), i % 2 === 0 ? fMat : rimMat);
          feather.position.set(side * (0.2 + frac * 0.55), 0.35 - frac * 0.25, -frac * 0.08);
          feather.rotation.set(0.15, side * 0.25, side * -(0.45 + frac * 0.45));
          mainWing.add(feather);
        }
        sideGroup.add(mainWing);

        // Lower Secondary Wing (4 Layered Feathers Spreading Downward)
        const lowerWing = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const frac = i / 3;
          const len = 0.45 + frac * 0.35;
          const feather = new THREE.Mesh(new THREE.BoxGeometry(0.10, len, 0.025), fMat);
          feather.position.set(side * (0.2 + frac * 0.35), -0.25 - frac * 0.15, -frac * 0.06);
          feather.rotation.set(0.08, side * 0.15, side * (0.2 + frac * 0.3));
          lowerWing.add(feather);
        }
        sideGroup.add(lowerWing);

        wingGroup.add(sideGroup);
      });
      root.add(wingGroup);
    };

    // 6. 3D SPIKED WRIST GAUNTLETS (IMAGE 2 STYLE)
    const addSpikedWristGauntlets = (studCol = 0xd8e0ea) => {
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.7 });
      const studMat = new THREE.MeshStandardMaterial({ color: studCol, metalness: 0.95, roughness: 0.15 });

      [leftArm, rightArm].forEach(arm => {
        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.16, 0.39), cuffMat);
        cuff.position.set(0, -0.22, 0);
        arm.add(cuff);

        // 6 Cone Spikes around wrist
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), studMat);
          spike.position.set(Math.cos(ang) * 0.21, -0.22, Math.sin(ang) * 0.21);
          spike.rotation.set(-Math.sin(ang) * Math.PI / 2, 0, Math.cos(ang) * Math.PI / 2);
          arm.add(spike);
        }
      });
    };

    // 7. VOLUMETRIC MESSY EMO / ANIME SPIKY HAIR (IMAGES 1 & 2)
    const addVolumetricEmoHair = (hColor = 0x111111, accentGlow = null) => {
      const hMat = new THREE.MeshStandardMaterial({ color: hColor, roughness: 0.85 });
      const tipMat = accentGlow ? new THREE.MeshStandardMaterial({ color: accentGlow, emissive: accentGlow, emissiveIntensity: 0.8 }) : hMat;

      const clumps = [
        // Top crown clumps
        { pos: [0, 1.96, -0.05], rot: [-0.15, 0, 0], scale: [0.18, 0.30, 0.18] },
        { pos: [0.16, 1.94, 0.06], rot: [0.1, 0, -0.35], scale: [0.16, 0.28, 0.16] },
        { pos: [-0.16, 1.94, 0.06], rot: [0.1, 0, 0.35], scale: [0.16, 0.28, 0.16] },
        { pos: [0.24, 1.84, -0.1], rot: [-0.2, 0.2, -0.5], scale: [0.15, 0.26, 0.15] },
        { pos: [-0.24, 1.84, -0.1], rot: [-0.2, -0.2, 0.5], scale: [0.15, 0.26, 0.15] },
        // Swept Emo Fringe Bangs across forehead
        { pos: [-0.08, 1.82, -0.26], rot: [0.55, 0.3, -0.25], scale: [0.14, 0.28, 0.12] },
        { pos: [0.12, 1.78, -0.26], rot: [0.45, -0.2, 0.35], scale: [0.14, 0.25, 0.12] },
        { pos: [-0.22, 1.74, -0.22], rot: [0.35, 0.4, -0.45], scale: [0.13, 0.26, 0.12] },
        // Back spiky clumps
        { pos: [0, 1.76, 0.26], rot: [0.45, 0, 0], scale: [0.16, 0.24, 0.14] },
        { pos: [0.15, 1.72, 0.24], rot: [0.4, 0, -0.3], scale: [0.14, 0.22, 0.14] },
        { pos: [-0.15, 1.72, 0.24], rot: [0.4, 0, 0.3], scale: [0.14, 0.22, 0.14] }
      ];

      clumps.forEach((cl, idx) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(cl.scale[0], cl.scale[1], 5), (accentGlow && idx < 3) ? tipMat : hMat);
        cone.position.set(...cl.pos);
        cone.rotation.set(...cl.rot);
        root.add(cone);
      });
    };

    const addNVG = (lensColor) => {
      const goggleMat = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.8 });
      const lensMat = new THREE.MeshStandardMaterial({ color: lensColor, emissive: lensColor, emissiveIntensity: 1.2 });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.12), goggleMat);
      bridge.position.set(0, 1.74, -0.28);
      root.add(bridge);
      [-0.14, -0.05, 0.05, 0.14].forEach(x => {
        const lensGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12);
        lensGeo.rotateX(Math.PI / 2);
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(x, 1.74, -0.34);
        root.add(lens);
      });
    };

    const addKasaHat = (hatColor, rimColor) => {
      const kHatGeo = new THREE.ConeGeometry(0.48, 0.18, 16);
      const kHatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.7 });
      const kHat = new THREE.Mesh(kHatGeo, kHatMat);
      kHat.position.set(0, 1.96, 0);
      root.add(kHat);

      const rimGeo = new THREE.TorusGeometry(0.48, 0.016, 8, 24);
      rimGeo.rotateX(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ color: rimColor, emissive: rimColor, emissiveIntensity: 0.8 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(0, 1.88, 0);
      root.add(rim);
    };

    const addCrossedKatanas = (sheathColor, accentGlow) => {
      const sMat = new THREE.MeshStandardMaterial({ color: sheathColor, roughness: 0.5 });
      const gMat = new THREE.MeshStandardMaterial({ color: accentGlow, emissive: accentGlow, emissiveIntensity: 0.8 });
      [-1, 1].forEach(side => {
        const sGeo = new THREE.BoxGeometry(0.05, 0.95, 0.05);
        const s = new THREE.Mesh(sGeo, sMat);
        s.position.set(side * 0.12, 1.1, 0.28);
        s.rotation.set(0, 0, side * 0.55);
        root.add(s);

        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), gMat);
        hilt.position.set(side * 0.32, 1.48, 0.3);
        hilt.rotation.set(0, 0, side * 0.55);
        root.add(hilt);
      });
    };

    // --- ASSIGN ACCESSORIES PER THEME ---
    if (theme === 'skin_cyber_ninja' || theme === 'cyber_ninja') {
      // 1. Cyber Shinobi 2099 (Matches User Screenshot 1!)
      addCyberHalo(0x00f7ff);
      addSegmentedCyberWings(0x00f7ff);
      addCatEarCyberHeadset(0x00f7ff);
      addVolumetricEmoHair(0x111620, 0x00f7ff);
      addCrossedKatanas(0x111418, 0x00f7ff);

    } else if (theme === 'skin_agent_shadow' || theme === 'agent_shadow') {
      // 2. Dark Fallen Angel (Matches User Screenshot 2!)
      addSpikedCrown(0x111116);
      addLayeredFallenAngelWings(0x121218);
      addSpikedWristGauntlets(0xd8e0ea);
      addVolumetricEmoHair(0x0f0f14, null);

    } else if (theme === 'skin_manga_demon' || theme === 'manga_demon') {
      // 3. Flame Demon Slayer
      addVolumetricEmoHair(0x111111, 0xd63031);
      addCrossedKatanas(0x111111, 0xd63031);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 1.2 });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), eyeMat);
      leftEye.position.set(-0.12, 1.68, -0.26);
      leftEye.rotation.z = -0.12;
      const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), eyeMat);
      rightEye.position.set(0.12, 1.68, -0.26);
      rightEye.rotation.z = 0.12;
      root.add(leftEye);
      root.add(rightEye);

    } else if (theme === 'skin_specops_ghost' || theme === 'specops_ghost') {
      // 4. Ghost Operative
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.54), armorMat);
      helmet.position.set(0, 1.82, 0);
      root.add(helmet);
      addNVG(0x2ecc71);

    } else if (theme === 'skin_manga_mecha' || theme === 'manga_mecha') {
      // 5. Unit-01 Mecha Pilot
      [-1, 1].forEach(side => {
        const hornGeo = new THREE.BoxGeometry(0.06, 0.32, 0.1);
        const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.3 }));
        horn.position.set(side * 0.28, 1.95, -0.05);
        horn.rotation.set(-0.25, 0, side * 0.35);
        root.add(horn);
      });
      [-0.62, 0.62].forEach(x => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.36), new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.35 }));
        pylon.position.set(x, 1.35, 0.04);
        root.add(pylon);
      });

    } else if (theme === 'skin_manga_valkyrie' || theme === 'manga_valkyrie') {
      // 6. Neon Valkyrie
      addCyberHalo(0xf1c40f);
      addSegmentedCyberWings(0x00d2ff);
      addVolumetricEmoHair(0xffe600, 0xffffff);

    } else if (theme === 'skin_manga_ronin' || theme === 'manga_ronin') {
      // 7. Cyber Ronin
      addKasaHat(0x1f2421, 0xe63946);
      addCrossedKatanas(0xd4af37, 0xe63946);

    } else if (theme === 'skin_cyber_netrunner' || theme === 'cyber_netrunner') {
      // 8. Neon Netrunner
      addCatEarCyberHeadset(0xff007f);
      addVolumetricEmoHair(0xff007f, 0x00ffff);

    } else if (theme === 'skin_cyber_glitch' || theme === 'cyber_glitch') {
      // 9. Glitch Phantom
      addCyberHalo(0x66fcf1);
      [-0.38, 0.36].forEach((x, idx) => {
        const frag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x45a29e, emissive: 0x66fcf1, emissiveIntensity: 0.8 }));
        frag.position.set(x, 1.55 + idx * 0.15, -0.15);
        frag.rotation.set(0.4, 0.5, 0.3);
        root.add(frag);
      });

    } else if (theme === 'skin_manga_saiyan' || theme === 'manga_saiyan') {
      // 10. Super Star Striker
      addVolumetricEmoHair(0x00f7ff, 0xffffff);
      addCyberHalo(0x00f7ff);

    } else if (theme === 'skin_agent_tactical' || theme === 'agent_tactical') {
      // 11. Agent 00: Infiltrator
      const glassesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 }));
      glassesFrame.position.set(0, 1.68, -0.25);
      root.add(glassesFrame);
      addVolumetricEmoHair(0x161820, null);

    } else if (theme === 'skin_cyber_hazard' || theme === 'cyber_hazard') {
      // 12. Tox-Hazmat Enforcer
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }));
      hood.position.set(0, 1.68, 0);
      root.add(hood);
      [-0.15, 0.15].forEach(x => {
        const f = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
        f.rotation.x = Math.PI / 2;
        f.position.set(x, 1.5, -0.28);
        root.add(f);
      });

    } else {
      // Default / Military
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.13, 0.12), visorMat);
      visor.position.set(0, 1.68, -0.22);
      root.add(visor);
      addVolumetricEmoHair(hairCol, null);
    }

    // Standard Knee Armor Pads
    const kneeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.08);
    const leftKnee = new THREE.Mesh(kneeGeo, armorMat);
    leftKnee.position.set(-0.22, 0.42, -0.22);
    const rightKnee = new THREE.Mesh(kneeGeo, armorMat);
    rightKnee.position.set(0.22, 0.42, -0.22);
    root.add(leftKnee);
    root.add(rightKnee);

    // 3D Miniature Held Weapon (Sniper Rifle)
    const heldWeapon = AssetLoader.createProceduralSniper();
    heldWeapon.scale.set(0.7, 0.7, 0.7);
    heldWeapon.position.set(0.35, 0.85, -0.4);
    heldWeapon.rotation.set(0, -Math.PI / 12, 0);
    root.add(heldWeapon);

    root.userData = {
      head,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      heldWeapon,
      theme,
      skinConfig: cfg
    };

    return root;
  }
}
