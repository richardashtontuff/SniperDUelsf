// DummyBot.js - Infinite-Health Physics Sandbox Dummy Bot for testing damage & RPG launches
import * as THREE from '../vendor/three/three.module.js';
import { AssetLoader } from './AssetLoader.js';

export class DummyBot {
  constructor(scene, initialPosition = new THREE.Vector3(0, 1.8, -205)) {
    this.scene = scene;
    this.initialPosition = initialPosition.clone();
    this.position = initialPosition.clone();
    this.velocity = new THREE.Vector3();
    this.health = 999999;
    this.maxHealth = 999999;
    this.isAlive = true;
    this.isGrounded = true;
    this.flinchTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    // Distinct high-tech Test Dummy styling: safety hazard orange jersey & yellow skin
    this.mesh = AssetLoader.createRobloxCharacter(0xff6600, 0x1e242d, 0xffd200);
    this.mesh.name = 'PhysicsDummyBot';
    this.mesh.position.copy(this.position);

    // Tag all hitboxes for raycasting & explosion damage detection
    const tagHitbox = (obj, isHeadshot) => {
      if (!obj) return;
      obj.userData = {
        isDummyBot: true,
        dummyInstance: this,
        isHeadshot: isHeadshot
      };
    };

    tagHitbox(this.mesh.userData.head, true);
    tagHitbox(this.mesh.userData.torso, false);
    tagHitbox(this.mesh.userData.leftArm, false);
    tagHitbox(this.mesh.userData.rightArm, false);
    tagHitbox(this.mesh.userData.leftLeg, false);
    tagHitbox(this.mesh.userData.rightLeg, false);

    this.head = this.mesh.userData.head;
    this.torso = this.mesh.userData.torso;
    this.leftArm = this.mesh.userData.leftArm;
    this.rightArm = this.mesh.userData.rightArm;
    this.leftLeg = this.mesh.userData.leftLeg;
    this.rightLeg = this.mesh.userData.rightLeg;

    // Floating 3D holographic title above head: "TEST DUMMY (PHYSICS LAB)"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 20, 28, 0.88)';
    ctx.roundRect(10, 10, 492, 108, 16);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤖 PHYSICS TEST DUMMY', 256, 52);

    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText('HP: ∞ • LAUNCHABLE • R6 PHYSICS', 256, 92);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.labelSprite = new THREE.Sprite(spriteMat);
    this.labelSprite.position.set(0, 2.3, 0);
    this.labelSprite.scale.set(3.4, 0.85, 1.0);
    this.mesh.add(this.labelSprite);

    this.scene.add(this.mesh);
  }

  // Applies physical explosion / knockback impulse (e.g. from RPG blast or grenade)
  applyImpulse(impulse) {
    if (!impulse) return;
    this.velocity.x += impulse.x || 0;
    this.velocity.y += impulse.y || 0;
    this.velocity.z += impulse.z || 0;
    this.isGrounded = false;
  }

  // Inflicts damage: flinches, absorbs, never dies permanently (infinite health)
  takeDamage(amount, isHeadshot = false) {
    this.flinchTimer = 0.18;
    if (this.torso && this.torso.material) {
      this.torso.material.color.setHex(0xffffff); // White flinch flash
    }
    // Small bullet impact impulse if stationary
    if (this.velocity.lengthSq() < 0.1) {
      this.velocity.y += 1.5;
    }
    return false; // Infinite health: never dies
  }

  reset() {
    this.position.copy(this.initialPosition);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
    this.isGrounded = true;
  }

  update(delta) {
    // 1. Flinch recovery
    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      if (this.flinchTimer <= 0 && this.torso && this.torso.material) {
        this.torso.material.color.setHex(0xff6600);
      }
    }

    // 2. Real Player Kinematic Physics: Gravity + Velocity + Friction
    const hasVelocity = this.velocity.lengthSq() > 0.0001;
    if (hasVelocity || !this.isGrounded) {
      // Realistic player gravity
      this.velocity.y -= 25.0 * delta;

      // Integrate position
      this.position.addScaledVector(this.velocity, delta);

      // Ground friction vs air drag
      if (this.isGrounded) {
        const friction = 7.5;
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.z -= this.velocity.z * friction * delta;
      } else {
        this.velocity.x -= this.velocity.x * 1.5 * delta;
        this.velocity.z -= this.velocity.z * 1.5 * delta;
      }

      // Floor collision (floor at Y = 0.5; feet on floor means R6 center Y = 1.8)
      if (this.position.y <= 1.8) {
        this.position.y = 1.8;
        if (this.velocity.y < -3.0) {
          this.velocity.y = -this.velocity.y * 0.22; // Slight landing bounce
        } else {
          this.velocity.y = 0;
          this.isGrounded = true;
        }
      }

      // Room boundary clamps (Testing room: X from -14.5 to +14.5, Z from -218 to -182)
      if (this.position.x < -14.5) {
        this.position.x = -14.5;
        this.velocity.x = -this.velocity.x * 0.4;
      } else if (this.position.x > 14.5) {
        this.position.x = 14.5;
        this.velocity.x = -this.velocity.x * 0.4;
      }

      if (this.position.z < -218) {
        this.position.z = -218;
        this.velocity.z = -this.velocity.z * 0.4;
      } else if (this.position.z > -182) {
        this.position.z = -182;
        this.velocity.z = -this.velocity.z * 0.4;
      }

      // Sync character mesh position
      this.mesh.position.copy(this.position);

      // Tilts character slightly based on airborne velocity for dynamic ragdoll-like feel
      if (!this.isGrounded) {
        this.mesh.rotation.z = -this.velocity.x * 0.04;
        this.mesh.rotation.x = this.velocity.z * 0.04;
      } else {
        this.mesh.rotation.x = THREE.MathUtils.damp(this.mesh.rotation.x, 0, 10.0, delta);
        this.mesh.rotation.z = THREE.MathUtils.damp(this.mesh.rotation.z, 0, 10.0, delta);
      }
    }

    // Safety fallback
    if (this.position.y < 0.5) {
      this.reset();
    }
  }
}
