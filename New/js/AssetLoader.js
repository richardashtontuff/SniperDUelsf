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

  // Iconic High-Fidelity Roblox R6 Character with tactical armor & hitboxes
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

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.45 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.35, metalness: 0.2 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsCol, roughness: 0.65 });
    const armorMat = new THREE.MeshStandardMaterial({ color: armorCol, roughness: 0.7, metalness: 0.35 });
    const visorMat = new THREE.MeshStandardMaterial({
      color: visorCol,
      emissive: visorCol,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.8
    });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairCol, roughness: 0.85 });

    // 1. Head (instakill hitbox - standard 0.5 x 0.5 x 0.5 at y = 1.65)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
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
    const isSleeveless = (theme === 'skin_manga_demon' || theme === 'manga_demon' || theme === 'skin_manga_saiyan' || theme === 'manga_saiyan' || theme === 'skin_military_desert' || theme === 'military_desert');
    const leftArm = new THREE.Mesh(armGeo, isSleeveless ? skinMat : shirtMat);
    leftArm.position.set(-0.6, 1.0, 0);
    leftArm.userData = { isHeadshot: false };
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, isSleeveless ? skinMat : shirtMat);
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

    // --- PROCEDURAL ACCESSORY BUILDERS ---
    const addMangaSpikes = (hColor, accentTipColor = null, auraScale = 1.0) => {
      const hMat = new THREE.MeshStandardMaterial({ color: hColor, roughness: 0.85 });
      const tipMat = accentTipColor ? new THREE.MeshStandardMaterial({ color: accentTipColor, emissive: accentTipColor, emissiveIntensity: 0.5 }) : hMat;

      const spikes = [
        { pos: [0, 1.95, -0.05], rot: [-0.15, 0, 0], scale: [0.18, 0.28 * auraScale, 0.18] },
        { pos: [0.15, 1.92, 0.05], rot: [0.1, 0, -0.32], scale: [0.16, 0.26 * auraScale, 0.16] },
        { pos: [-0.15, 1.92, 0.05], rot: [0.1, 0, 0.32], scale: [0.16, 0.26 * auraScale, 0.16] },
        { pos: [0.22, 1.82, -0.1], rot: [-0.2, 0.2, -0.45], scale: [0.15, 0.24 * auraScale, 0.15] },
        { pos: [-0.22, 1.82, -0.1], rot: [-0.2, -0.2, 0.45], scale: [0.15, 0.24 * auraScale, 0.15] },
        { pos: [0, 1.88, 0.18], rot: [0.35, 0, 0], scale: [0.17, 0.25 * auraScale, 0.17] },
        { pos: [0, 1.78, -0.26], rot: [-0.5, 0, 0], scale: [0.16, 0.20 * auraScale, 0.14] }
      ];

      spikes.forEach(sp => {
        const coneGeo = new THREE.ConeGeometry(sp.scale[0], sp.scale[1], 5);
        const m = new THREE.Mesh(coneGeo, tipMat);
        m.position.set(...sp.pos);
        m.rotation.set(...sp.rot);
        root.add(m);
      });
    };

    const addCyberWings = (wingColor) => {
      const wingMat = new THREE.MeshStandardMaterial({
        color: wingColor,
        emissive: wingColor,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      });
      [-1, 1].forEach(side => {
        const wingGeo = new THREE.BoxGeometry(0.55, 0.12, 0.04);
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(side * 0.45, 1.25, 0.28);
        wing.rotation.set(0.2, side * 0.45, side * 0.35);
        root.add(wing);

        const wingTipGeo = new THREE.BoxGeometry(0.35, 0.08, 0.03);
        const wingTip = new THREE.Mesh(wingTipGeo, wingMat);
        wingTip.position.set(side * 0.72, 1.42, 0.38);
        wingTip.rotation.set(0.3, side * 0.55, side * 0.45);
        root.add(wingTip);
      });
    };

    const addNVG = (lensColor) => {
      const goggleMat = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.8 });
      const lensMat = new THREE.MeshStandardMaterial({ color: lensColor, emissive: lensColor, emissiveIntensity: 0.95 });
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
      const gMat = new THREE.MeshStandardMaterial({ color: accentGlow, emissive: accentGlow, emissiveIntensity: 0.7 });
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

    // --- THEME-SPECIFIC ACCESSORIES ---
    if (theme === 'skin_manga_demon' || theme === 'manga_demon') {
      // 1. Flame Demon Slayer
      addMangaSpikes(0x111111, 0xd63031, 1.15);

      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.95 });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), eyeMat);
      leftEye.position.set(-0.12, 1.68, -0.26);
      leftEye.rotation.z = -0.12;
      const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), eyeMat);
      rightEye.position.set(0.12, 1.68, -0.26);
      rightEye.rotation.z = 0.12;
      root.add(leftEye);
      root.add(rightEye);

      const haori = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.72, 0.46), new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.5 }));
      haori.position.set(0, 0.98, 0);
      root.add(haori);

      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.12, 0.48), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      belt.position.set(0, 0.68, 0);
      root.add(belt);

      const hipKatana = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
      hipKatana.position.set(-0.48, 0.72, 0.08);
      hipKatana.rotation.z = -0.45;
      root.add(hipKatana);

    } else if (theme === 'skin_cyber_ninja' || theme === 'cyber_ninja') {
      // 2. Cyber Shinobi 2099
      const nVisor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.14), visorMat);
      nVisor.position.set(0, 1.68, -0.24);
      root.add(nVisor);

      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.15), armorMat);
      mask.position.set(0, 1.54, -0.22);
      root.add(mask);

      addCrossedKatanas(0x111418, 0x00f7ff);

      [-0.6, 0.6].forEach(x => {
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), armorMat);
        pauldron.position.set(x, 1.28, 0);
        root.add(pauldron);

        const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), visorMat);
        neonStrip.position.set(x, 1.22, 0);
        root.add(neonStrip);
      });

    } else if (theme === 'skin_specops_ghost' || theme === 'specops_ghost') {
      // 3. Ghost Operative
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.54), armorMat);
      helmet.position.set(0, 1.82, 0);
      root.add(helmet);

      addNVG(0x2ecc71);

      const skullPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 }));
      skullPlate.position.set(0, 1.54, -0.25);
      root.add(skullPlate);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.66, 0.46), armorMat);
      vest.position.set(0, 1.02, 0);
      root.add(vest);

      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), armorMat);
      radio.position.set(-0.32, 1.22, -0.24);
      root.add(radio);

      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 6), armorMat);
      antenna.position.set(-0.32, 1.44, -0.24);
      root.add(antenna);

    } else if (theme === 'skin_manga_mecha' || theme === 'manga_mecha') {
      // 4. Unit-01 Mecha Pilot
      [-1, 1].forEach(side => {
        const hornGeo = new THREE.BoxGeometry(0.06, 0.32, 0.1);
        const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.3 }));
        horn.position.set(side * 0.28, 1.95, -0.05);
        horn.rotation.set(-0.25, 0, side * 0.35);
        root.add(horn);
      });

      const mVisor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.12), visorMat);
      mVisor.position.set(0, 1.68, -0.24);
      root.add(mVisor);

      const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
      coreGeo.rotateX(Math.PI / 2);
      const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.95 }));
      core.position.set(0, 1.15, -0.23);
      root.add(core);

      [-0.62, 0.62].forEach(x => {
        const pylonGeo = new THREE.BoxGeometry(0.18, 0.44, 0.36);
        const pylon = new THREE.Mesh(pylonGeo, new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.35 }));
        pylon.position.set(x, 1.35, 0.04);
        root.add(pylon);

        const pylonTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.38), new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.6 }));
        pylonTrim.position.set(x, 1.48, 0.04);
        root.add(pylonTrim);
      });

    } else if (theme === 'skin_agent_tactical' || theme === 'agent_tactical') {
      // 5. Agent 00: Infiltrator
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.52), hairMat);
      hair.position.set(0, 1.86, 0);
      root.add(hair);

      const glassesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 }));
      glassesFrame.position.set(0, 1.68, -0.25);
      root.add(glassesFrame);

      const shirtTri = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
      shirtTri.position.set(0, 1.22, -0.21);
      root.add(shirtTri);

      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.05), new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.4 }));
      tie.position.set(0, 1.12, -0.22);
      root.add(tie);

      const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.06), new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.4 }));
      lapelLeft.position.set(-0.24, 1.15, -0.21);
      const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.06), new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.4 }));
      lapelRight.position.set(0.24, 1.15, -0.21);
      root.add(lapelLeft);
      root.add(lapelRight);

    } else if (theme === 'skin_military_desert' || theme === 'military_desert') {
      // 6. Desert Storm Vanguard
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.56), new THREE.MeshStandardMaterial({ color: 0xdfb15b, roughness: 0.7 }));
      helmet.position.set(0, 1.84, 0);
      root.add(helmet);

      const goggleBand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.58), armorMat);
      goggleBand.position.set(0, 1.84, 0);
      root.add(goggleBand);
      const goggleLenses = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.06), new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.2, metalness: 0.6 }));
      goggleLenses.position.set(0, 1.84, -0.3);
      root.add(goggleLenses);

      const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.58), new THREE.MeshStandardMaterial({ color: 0xdfb15b, roughness: 0.85 }));
      scarf.position.set(0, 1.42, 0);
      root.add(scarf);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.65, 0.46), new THREE.MeshStandardMaterial({ color: 0x8c7853, roughness: 0.75 }));
      vest.position.set(0, 1.02, 0);
      root.add(vest);

    } else if (theme === 'skin_military_arctic' || theme === 'military_arctic') {
      // 7. Arctic Spec-Ops Frost
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.54), new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.7 }));
      hood.position.set(0, 1.68, 0.04);
      root.add(hood);

      const furTrim = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.18, 0.58), new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.9 }));
      furTrim.position.set(0, 1.42, 0);
      root.add(furTrim);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.12), new THREE.MeshStandardMaterial({ color: 0x38b2ac, emissive: 0x38b2ac, emissiveIntensity: 0.7 }));
      visor.position.set(0, 1.68, -0.24);
      root.add(visor);

      const rig = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.66, 0.46), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      rig.position.set(0, 1.02, 0);
      root.add(rig);

    } else if (theme === 'skin_military_urban' || theme === 'military_urban') {
      // 8. Urban Blackout Marine
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.54), new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.6 }));
      helmet.position.set(0, 1.84, 0);
      root.add(helmet);

      const riotVisor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x63b3ed, transparent: true, opacity: 0.65, roughness: 0.1 }));
      riotVisor.position.set(0, 1.66, -0.26);
      root.add(riotVisor);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.66, 0.46), new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.7 }));
      vest.position.set(0, 1.02, 0);
      root.add(vest);

    } else if (theme === 'skin_cyber_netrunner' || theme === 'cyber_netrunner') {
      // 9. Neon Netrunner
      addMangaSpikes(0xff007f, 0x00ffff, 1.05);

      const cyberGlasses = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.9 }));
      cyberGlasses.position.set(0, 1.68, -0.24);
      root.add(cyberGlasses);

      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.24, 0.52), new THREE.MeshStandardMaterial({ color: 0x2d112c, roughness: 0.4 }));
      collar.position.set(0, 1.44, 0);
      root.add(collar);

    } else if (theme === 'skin_cyber_glitch' || theme === 'cyber_glitch') {
      // 10. Glitch Phantom
      const gVisor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.14), new THREE.MeshStandardMaterial({ color: 0x66fcf1, emissive: 0x66fcf1, emissiveIntensity: 0.95 }));
      gVisor.position.set(0, 1.66, -0.22);
      root.add(gVisor);

      [-0.38, 0.36].forEach((x, idx) => {
        const frag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x45a29e, emissive: 0x66fcf1, emissiveIntensity: 0.8 }));
        frag.position.set(x, 1.55 + idx * 0.15, -0.15);
        frag.rotation.set(0.4, 0.5, 0.3);
        root.add(frag);
      });

    } else if (theme === 'skin_manga_ronin' || theme === 'manga_ronin') {
      // 11. Cyber Ronin
      addKasaHat(0x1f2421, 0xe63946);

      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }));
      mask.position.set(0, 1.54, -0.24);
      root.add(mask);

      const haori = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.72, 0.46), new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.6 }));
      haori.position.set(0, 0.98, 0);
      root.add(haori);

      const goldCrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.04), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 }));
      goldCrest.position.set(0, 1.15, -0.24);
      root.add(goldCrest);

      const hipKatana = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3 }));
      hipKatana.position.set(-0.48, 0.72, 0.08);
      hipKatana.rotation.z = -0.45;
      root.add(hipKatana);

    } else if (theme === 'skin_manga_valkyrie' || theme === 'manga_valkyrie') {
      // 12. Neon Valkyrie
      addMangaSpikes(0xffe600, 0xffffff, 1.15);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.12), new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 0.95 }));
      visor.position.set(0, 1.68, -0.24);
      root.add(visor);

      addCyberWings(0x00d2ff);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.66, 0.44), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 }));
      vest.position.set(0, 1.02, 0);
      root.add(vest);

      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.46), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85, roughness: 0.2 }));
      goldTrim.position.set(0, 1.25, 0);
      root.add(goldTrim);

    } else if (theme === 'skin_agent_shadow' || theme === 'agent_shadow') {
      // 13. Shadow Syndicate Assassin
      const maskCenter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.18), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
      maskCenter.position.set(0, 1.55, -0.24);
      root.add(maskCenter);

      [-0.14, 0.14].forEach(x => {
        const canGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 12);
        canGeo.rotateZ(Math.PI / 2);
        const can = new THREE.Mesh(canGeo, new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 0.6 }));
        can.position.set(x, 1.52, -0.26);
        root.add(can);
      });

      const coat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.74, 0.48), new THREE.MeshStandardMaterial({ color: 0x0f0f14, roughness: 0.5 }));
      coat.position.set(0, 0.98, 0);
      root.add(coat);

      const tallCollar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.52), new THREE.MeshStandardMaterial({ color: 0x0f0f14, roughness: 0.5 }));
      tallCollar.position.set(0, 1.48, 0);
      root.add(tallCollar);

    } else if (theme === 'skin_cyber_hazard' || theme === 'cyber_hazard') {
      // 14. Tox-Hazmat Enforcer
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }));
      hood.position.set(0, 1.68, 0);
      root.add(hood);

      const amberVisor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.12), new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff9900, emissiveIntensity: 0.7 }));
      amberVisor.position.set(0, 1.68, -0.26);
      root.add(amberVisor);

      [-0.15, 0.15].forEach(x => {
        const fGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10);
        fGeo.rotateX(Math.PI / 2);
        const f = new THREE.Mesh(fGeo, new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
        f.position.set(x, 1.5, -0.28);
        root.add(f);
      });

      const harness = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.65, 0.44), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
      harness.position.set(0, 1.02, 0);
      root.add(harness);

    } else if (theme === 'skin_manga_saiyan' || theme === 'manga_saiyan') {
      // 15. Super Star Striker (Manga Saiyan)
      addMangaSpikes(0x00f7ff, 0xffffff, 1.45);

      const blueChest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.04), new THREE.MeshStandardMaterial({ color: 0x004e89, roughness: 0.5 }));
      blueChest.position.set(0, 1.18, -0.21);
      root.add(blueChest);

      const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f7ff, emissiveIntensity: 0.8, side: THREE.DoubleSide }));
      emblem.position.set(0.18, 1.18, -0.22);
      root.add(emblem);

      [-0.6, 0.6].forEach(x => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.38), new THREE.MeshStandardMaterial({ color: 0x004e89, roughness: 0.5 }));
        band.position.set(x, 0.72, 0);
        root.add(band);
      });

      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 0.46), new THREE.MeshStandardMaterial({ color: 0x004e89, roughness: 0.5 }));
      sash.position.set(0, 0.68, 0);
      root.add(sash);

    } else {
      // Default Classic Roblox Player
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.13, 0.12), visorMat);
      visor.position.set(0, 1.68, -0.22);
      root.add(visor);

      const headsetBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12, 1, true, 0, Math.PI),
        armorMat
      );
      headsetBand.rotation.z = Math.PI / 2;
      headsetBand.position.set(0, 1.88, 0);
      root.add(headsetBand);

      const earCupGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10);
      earCupGeo.rotateZ(Math.PI / 2);
      const leftCup = new THREE.Mesh(earCupGeo, armorMat);
      leftCup.position.set(-0.27, 1.65, 0);
      const rightCup = new THREE.Mesh(earCupGeo, armorMat);
      rightCup.position.set(0.27, 1.65, 0);
      root.add(leftCup);
      root.add(rightCup);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.65, 0.44), armorMat);
      vest.position.set(0, 1.02, 0);
      root.add(vest);
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
