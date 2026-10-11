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

  // Iconic Roblox R6 Character with hitboxes
  static createRobloxCharacter(shirtColor = 0x00d2ff, pantsColor = 0x22262d, skinColor = 0xffd200) {
    const root = new THREE.Group();
    root.name = 'RobloxPlayer';

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.6 });

    // Head (instakill hitbox)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.position.y = 1.65;
    head.castShadow = true;
    head.userData = { isHeadshot: true };
    root.add(head);

    // Torso (bodyshot hitbox)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.4), shirtMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.userData = { isHeadshot: false };
    root.add(torso);

    // Limbs
    const armGeo = new THREE.BoxGeometry(0.35, 0.75, 0.35);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.6, 1.0, 0);
    leftArm.userData = { isHeadshot: false };
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
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

    // 3D Miniature Held Weapon
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
      heldWeapon
    };

    return root;
  }
}
