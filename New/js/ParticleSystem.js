// ParticleSystem.js - Fast visual FX: Tracers, Muzzle Flash, Ejected Shells, Sparks, Atmosphere
import * as THREE from '../vendor/three/three.module.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.sparks = [];
    this.shells = [];
    this.confetti = [];
    this.explosions = [];
    this.muzzleFlashes = [];
    this.bulletHoles = [];
    this.motes = null;

    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array([0, 0, 0]);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    this.shellGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 6);
    this.shellMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Brass gold
      metalness: 0.85,
      roughness: 0.25
    });

    // Reusable Unit Geometries for Tracers (Zero memory churn & GC stutter)
    this.unitCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    this.unitCylinderGeo.translate(0, 0.5, 0);
    this.unitCylinderGeo.rotateX(Math.PI / 2);
    this.unitTipGeo = new THREE.SphereGeometry(1, 8, 8);

    // Reusable Geometries & Materials for RPG Rocket Exhaust & Explosions (Prevents stutter)
    this.unitRocketSmokeGeo = new THREE.SphereGeometry(1, 6, 5);
    this.rocketSmokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending });
    this.rocketFireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });

    this.unitShockwaveGeo = new THREE.RingGeometry(0.2, 0.45, 18);
    this.unitShockwaveGeo.rotateX(-Math.PI / 2);
    this.unitFireballGeo = new THREE.SphereGeometry(1, 8, 6);
    this.unitExplosionSmokeGeo = new THREE.DodecahedronGeometry(1, 0);
    this.explosionSmokeMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.65 });
    this.explosionSparkMat = new THREE.PointsMaterial({ color: 0xffaa22, size: 0.18, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });

    // Muzzle Flash Point Light (reused for performance)
    this.flashLight = new THREE.PointLight(0xffaa33, 0, 14);
    this.scene.add(this.flashLight);
    this.flashTimer = 0;

    // Atmospheric Floating Dust / Cyber Motes
    this.initAtmosphericMotes();
  }

  // Atmospheric micro-motes floating in the arena air
  initAtmosphericMotes() {
    const moteCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(moteCount * 3);
    const phases = new Float32Array(moteCount);

    for (let i = 0; i < moteCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 15 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x90e0ef,
      size: 0.16,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.motes = new THREE.Points(geometry, material);
    this.motes.userData = { phases, positions };
    this.scene.add(this.motes);
  }

  // Dynamic Multi-Layered Volumetric Muzzle Flash with dynamic light cast
  addMuzzleFlash(position, direction, scale = 1.0, color = 0xffaa22) {
    const group = new THREE.Group();
    group.position.copy(position);

    // 1. Core Starburst Cross
    const starGeo = new THREE.PlaneGeometry(0.55 * scale, 0.55 * scale);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const starMesh1 = new THREE.Mesh(starGeo, starMat);
    const starMesh2 = new THREE.Mesh(starGeo, starMat);
    starMesh2.rotation.z = Math.PI / 4;
    group.add(starMesh1);
    group.add(starMesh2);

    // 2. Outer Fiery Glow Halo
    const haloGeo = new THREE.SphereGeometry(0.38 * scale, 8, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    group.add(haloMesh);

    // Orient along muzzle direction
    group.lookAt(position.clone().add(direction));
    this.scene.add(group);

    // Trigger Dynamic Point Light Flash
    this.flashLight.position.copy(position);
    this.flashLight.color.setHex(color);
    this.flashLight.intensity = 4.5 * scale;
    this.flashTimer = 0.06;

    this.muzzleFlashes.push({
      group: group,
      starMat: starMat,
      haloMat: haloMat,
      life: 0.055,
      maxLife: 0.055,
      scale: scale
    });
  }

  // Thick, vibrant glowing bullet tracer beam from barrel to impact
  addTracer(startVec, endVec) {
    const dir = endVec.clone().sub(startVec);
    const dist = dir.length();
    if (dist < 0.2) return;

    const group = new THREE.Group();

    // 1. Outer luminous glowing beam (Scaled from unit cylinder)
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xffcc22,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const outerMesh = new THREE.Mesh(this.unitCylinderGeo, outerMat);
    outerMesh.scale.set(0.12, 0.12, dist);
    group.add(outerMesh);

    // 2. Inner brilliant white-hot laser core
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const innerMesh = new THREE.Mesh(this.unitCylinderGeo, innerMat);
    innerMesh.scale.set(0.045, 0.045, dist);
    group.add(innerMesh);

    // 3. Glowing bullet head tip
    const tipMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const tipMesh = new THREE.Mesh(this.unitTipGeo, tipMat);
    tipMesh.scale.set(0.15, 0.15, 0.15);
    tipMesh.position.copy(endVec);
    this.scene.add(tipMesh);

    group.position.copy(startVec);
    group.lookAt(endVec);
    this.scene.add(group);

    this.tracers.push({
      group: group,
      outerMesh: outerMesh,
      innerMesh: innerMesh,
      tip: tipMesh,
      outerMat: outerMat,
      innerMat: innerMat,
      tipMat: tipMat,
      life: 0.42,
      maxLife: 0.42
    });
  }

  // Wall impact spark burst and bullet hole decal
  addImpact(point, normal, color = 0xffcc44, count = 14) {
    // 1. Bullet hole decal ring
    this.addBulletHole(point, normal);

    // 2. Directional spark shower
    for (let i = 0; i < count; i++) {
      const pMat = new THREE.PointsMaterial({
        color: color,
        size: 0.09 + Math.random() * 0.08,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      });
      const spark = new THREE.Points(this.sparkGeo.clone(), pMat);
      spark.position.copy(point);

      // Random velocity oriented around surface normal
      const vel = normal.clone().multiplyScalar(2.5 + Math.random() * 5.0);
      vel.x += (Math.random() - 0.5) * 4.5;
      vel.y += (Math.random() - 0.5) * 4.5;
      vel.z += (Math.random() - 0.5) * 4.5;

      this.scene.add(spark);
      this.sparks.push({
        mesh: spark,
        vel: vel,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6
      });
    }
  }

  // High-performance bullet mark decal
  addBulletHole(point, normal) {
    const holeGeo = new THREE.RingGeometry(0.02, 0.09, 12);
    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x111317,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.copy(point).addScaledVector(normal, 0.015);
    hole.lookAt(point.clone().add(normal));

    this.scene.add(hole);
    this.bulletHoles.push({
      mesh: hole,
      life: 8.0,
      maxLife: 8.0
    });

    // Cap total active bullet marks to 30 for performance
    if (this.bulletHoles.length > 30) {
      const oldest = this.bulletHoles.shift();
      this.scene.remove(oldest.mesh);
      oldest.mesh.geometry.dispose();
      oldest.mesh.material.dispose();
    }
  }

  // Eject brass casing on sniper bolt cycle
  ejectShell(position, forwardDir) {
    const shell = new THREE.Mesh(this.shellGeo, this.shellMat);
    shell.position.copy(position);

    // Eject to the right and slightly backward/upward
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), forwardDir));
    const vel = right.multiplyScalar(2.5 + Math.random() * 1.5);
    vel.y += 1.8 + Math.random() * 1.2;
    vel.addScaledVector(forwardDir, -0.8);

    this.scene.add(shell);
    this.shells.push({
      mesh: shell,
      vel: vel,
      rotVel: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ),
      life: 1.8
    });
  }

  // RPG Rocket exhaust smoke puffs & fiery trail (Reuses shared unit geometry and materials)
  addRocketSmoke(pos) {
    const isFire = Math.random() < 0.45;
    const smokeMesh = new THREE.Mesh(this.unitRocketSmokeGeo, isFire ? this.rocketFireMat : this.rocketSmokeMat);
    smokeMesh.position.copy(pos);
    const s = 0.16 + Math.random() * 0.09;
    smokeMesh.scale.set(s, s, s);
    this.scene.add(smokeMesh);
    this.sparks.push({
      mesh: smokeMesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.6 + 0.2, (Math.random() - 0.5) * 0.6),
      life: 0.30,
      maxLife: 0.30,
      sharedMat: true
    });
  }

  // Tactical Grenade High-Explosive & RPG Detonation FX (High-performance pooled particles)
  addExplosion(center) {
    // 1. Expanding Ground Shockwave Ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const shockwaveMesh = new THREE.Mesh(this.unitShockwaveGeo, ringMat);
    shockwaveMesh.position.copy(center);
    shockwaveMesh.position.y += 0.05;
    this.scene.add(shockwaveMesh);

    // 2. Central Fireball Flash
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const flashMesh = new THREE.Mesh(this.unitFireballGeo, flashMat);
    flashMesh.position.copy(center);
    flashMesh.scale.set(0.65, 0.65, 0.65);
    this.scene.add(flashMesh);

    // 3. Fiery Explosion Sparks & Shrapnel (Optimized from 36 down to 14 lightweight points)
    const sparkItems = [];
    for (let i = 0; i < 14; i++) {
      const spark = new THREE.Points(this.sparkGeo, this.explosionSparkMat);
      spark.position.copy(center);

      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI * 0.5; // Upward hemisphere
      const speed = 8.0 + Math.random() * 12.0;
      const vel = new THREE.Vector3(
        Math.cos(phi) * Math.sin(theta) * speed,
        Math.cos(theta) * speed + 3.0,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.scene.add(spark);
      sparkItems.push({
        mesh: spark,
        vel: vel,
        life: 0.40 + Math.random() * 0.25,
        maxLife: 0.65
      });
    }

    // 4. Billowing Smoke Puffs (Optimized from 12 down to 5, using lightweight basic material)
    const smokeItems = [];
    for (let i = 0; i < 5; i++) {
      const smokeMesh = new THREE.Mesh(this.unitExplosionSmokeGeo, this.explosionSmokeMat);
      smokeMesh.position.copy(center).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.5
      ));
      const s = 0.35 + Math.random() * 0.25;
      smokeMesh.scale.set(s, s, s);
      this.scene.add(smokeMesh);

      smokeItems.push({
        mesh: smokeMesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          1.5 + Math.random() * 2.0,
          (Math.random() - 0.5) * 2.2
        ),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        baseScale: s
      });
    }

    this.explosions.push({
      shockwave: shockwaveMesh,
      flash: flashMesh,
      sparks: sparkItems,
      smoke: smokeItems,
      life: 1.2,
      maxLife: 1.2
    });
  }

  // Confetti explosion on match victory
  spawnVictoryConfetti(origin) {
    const colors = [0xff0055, 0x00d2ff, 0xffd200, 0x00ff88, 0xff7700, 0xaa00ff];
    for (let i = 0; i < 70; i++) {
      const geo = new THREE.PlaneGeometry(0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin).add(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 4
      ));

      this.scene.add(mesh);
      this.confetti.push({
        mesh: mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          2.0 + Math.random() * 3.0,
          (Math.random() - 0.5) * 3
        ),
        rotVel: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
        life: 4.0
      });
    }
  }

  // Backwards-compatible aliases
  createBulletTracer(from, to) { this.addTracer(from, to); }
  createHitSparks(point, normal, color, count) { this.addImpact(point, normal || new THREE.Vector3(0, 1, 0), color, count); }
  createBloodSplatter(point, count) { this.addImpact(point, new THREE.Vector3(0, 1, 0), 0xb30000, count); }
  createConfetti(origin) { this.spawnVictoryConfetti(origin); }
  createMuzzleFlash(pos, dir) {}

  update(delta) {
    // 1. Update bullet tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= delta;
      const progress = Math.max(0, t.life / t.maxLife);
      if (t.outerMat) t.outerMat.opacity = progress * 0.95;
      if (t.innerMat) t.innerMat.opacity = progress;
      if (t.tipMat) t.tipMat.opacity = progress;

      if (t.life <= 0) {
        this.scene.remove(t.group);
        this.scene.remove(t.tip);
        if (t.outerMat) t.outerMat.dispose();
        if (t.innerMat) t.innerMat.dispose();
        if (t.tipMat) t.tipMat.dispose();
        this.tracers.splice(i, 1);
      }
    }

    // 2. Update sparks & rocket exhaust puffs
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= delta;
      s.mesh.position.addScaledVector(s.vel, delta);
      s.vel.y -= (s.sharedMat ? 0.6 : 9.8) * delta;
      if (!s.sharedMat && s.mesh.material) {
        s.mesh.material.opacity = Math.max(0, s.life / s.maxLife);
      } else if (s.sharedMat) {
        const sc = s.mesh.scale.x * (1.0 + delta * 1.5);
        s.mesh.scale.set(sc, sc, sc);
      }

      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        if (!s.sharedMat && s.mesh.material) {
          s.mesh.material.dispose();
        }
        this.sparks.splice(i, 1);
      }
    }

    // 3. Update ejected shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      sh.life -= delta;
      sh.mesh.position.addScaledVector(sh.vel, delta);
      sh.vel.y -= 12.0 * delta; // Shell gravity
      sh.mesh.rotation.x += sh.rotVel.x * delta;
      sh.mesh.rotation.y += sh.rotVel.y * delta;

      // Floor bounce at Y = 0.05
      if (sh.mesh.position.y < 0.05) {
        sh.mesh.position.y = 0.05;
        sh.vel.y *= -0.4;
        sh.vel.x *= 0.6;
        sh.vel.z *= 0.6;
      }

      if (sh.life <= 0) {
        this.scene.remove(sh.mesh);
        this.shells.splice(i, 1);
      }
    }

    // 4. Update victory confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.life -= delta;
      c.mesh.position.addScaledVector(c.vel, delta);
      c.vel.y -= 3.0 * delta; // Slow flutter gravity
      c.mesh.rotation.x += c.rotVel.x * delta;
      c.mesh.rotation.y += c.rotVel.y * delta;

      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        this.confetti.splice(i, 1);
      }
    }

    // 5. Update explosions (Shockwave, flash, fireball sparks, smoke)
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life -= delta;
      const progress = 1.0 - (exp.life / exp.maxLife);

      // Expand shockwave
      if (exp.shockwave) {
        const ringScale = 1.0 + progress * 16.0;
        exp.shockwave.scale.set(ringScale, ringScale, 1.0);
        exp.shockwave.material.opacity = Math.max(0, (1.0 - progress) * 0.95);
        if (progress >= 1.0) {
          this.scene.remove(exp.shockwave);
          exp.shockwave.geometry.dispose();
          exp.shockwave.material.dispose();
          exp.shockwave = null;
        }
      }

      // Flash decay
      if (exp.flash) {
        const flashScale = 1.0 + progress * 6.0;
        exp.flash.scale.set(flashScale, flashScale, flashScale);
        exp.flash.material.opacity = Math.max(0, 1.0 - progress * 4.0);
        if (progress >= 0.25) {
          this.scene.remove(exp.flash);
          exp.flash.geometry.dispose();
          exp.flash.material.dispose();
          exp.flash = null;
        }
      }

      // Explosion sparks
      for (let j = exp.sparks.length - 1; j >= 0; j--) {
        const sp = exp.sparks[j];
        sp.life -= delta;
        sp.mesh.position.addScaledVector(sp.vel, delta);
        sp.vel.y -= 14.0 * delta; // Gravity
        if (sp.life <= 0) {
          this.scene.remove(sp.mesh);
          exp.sparks.splice(j, 1);
        }
      }

      // Smoke puffs
      for (let k = exp.smoke.length - 1; k >= 0; k--) {
        const sm = exp.smoke[k];
        sm.life -= delta;
        sm.mesh.position.addScaledVector(sm.vel, delta);
        sm.mesh.rotation.x += sm.rotVel.x * delta;
        sm.mesh.rotation.y += sm.rotVel.y * delta;
        const smProg = 1.0 - (sm.life / sm.maxLife);
        const smScale = sm.baseScale * (1.0 + smProg * 2.2);
        sm.mesh.scale.set(smScale, smScale, smScale);
        if (sm.life <= 0) {
          this.scene.remove(sm.mesh);
          exp.smoke.splice(k, 1);
        }
      }

      if (exp.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // 6. Update Muzzle Flashes & Light
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.flashLight.intensity = 0;
      }
    }

    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.life -= delta;
      const progress = Math.max(0, mf.life / mf.maxLife);
      mf.starMat.opacity = progress;
      mf.haloMat.opacity = progress * 0.8;
      const curScale = mf.scale * (1.0 + (1.0 - progress) * 0.8);
      mf.group.scale.set(curScale, curScale, curScale);

      if (mf.life <= 0) {
        this.scene.remove(mf.group);
        mf.group.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
        this.muzzleFlashes.splice(i, 1);
      }
    }

    // 7. Update Atmospheric Floating Motes
    if (this.motes && this.motes.geometry) {
      const posAttr = this.motes.geometry.attributes.position;
      const arr = posAttr.array;
      const phases = this.motes.userData.phases;
      const time = performance.now() * 0.001;

      for (let i = 0; i < phases.length; i++) {
        // Drift in gentle sinusoidal patterns
        arr[i * 3 + 0] += Math.sin(time * 0.4 + phases[i]) * 0.004;
        arr[i * 3 + 1] += Math.cos(time * 0.6 + phases[i]) * 0.003;
        arr[i * 3 + 2] += Math.sin(time * 0.3 + phases[i] * 2.0) * 0.004;

        // Wrap around bounds
        if (arr[i * 3 + 1] < 0.2) arr[i * 3 + 1] = 14.0;
        if (arr[i * 3 + 1] > 15.0) arr[i * 3 + 1] = 0.5;
      }
      posAttr.needsUpdate = true;
    }

    // 8. Update Bullet Hole Decals
    for (let i = this.bulletHoles.length - 1; i >= 0; i--) {
      const bh = this.bulletHoles[i];
      bh.life -= delta;
      if (bh.life < 1.0) {
        bh.mesh.material.opacity = Math.max(0, bh.life);
      }
      if (bh.life <= 0) {
        this.scene.remove(bh.mesh);
        bh.mesh.geometry.dispose();
        bh.mesh.material.dispose();
        this.bulletHoles.splice(i, 1);
      }
    }
  }
}
