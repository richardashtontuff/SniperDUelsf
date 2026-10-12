// MapGenerator.js - Multi-Map Arena Engine ("Blockout", "Pool Day", "Rooftop") & Interactive Lobby
import * as THREE from '../vendor/three/three.module.js';
import { AssetLoader } from './AssetLoader.js';

export class MapGenerator {
  constructor(scene) {
    this.scene = scene;
    this.lobbyColliders = [];
    this.arenaColliders = [];
    this.colliders = []; // Combined colliders for physics
    this.targetDummies = [];
    this.duelPads = [];
    this.shopKiosk = null;
    this.mapTerminal = null;

    this.currentMapName = 'blockout'; // 'blockout', 'poolday', 'rooftop'

    this.spawnBlue = new THREE.Vector3(0, 2.55, 55);
    this.spawnOrange = new THREE.Vector3(0, 2.55, -25);
    this.lobbySpawn = new THREE.Vector3(0, 0.55, -84); // Spawn behind the duel pads

    // Procedural textures - crisp, bright competitive Roblox blockout colors
    this.studTexture = this.generateStudTexture('#525c6d', '#677387');
    this.studTextureBlue = this.generateStudTexture('#0088dd', '#00b4ff');
    this.studTextureOrange = this.generateStudTexture('#e66000', '#ff851b');
    this.studTextureFloor = this.generateStudTexture('#444c5a', '#586273');
    this.poolTileTexture = this.generateTileTexture('#00b4d8', '#0077b6');
    this.rooftopTexture = this.generateStudTexture('#343d4d', '#49556b');

    // Advanced Pro Esports Procedural Textures (High-tech composite panels & military containers)
    this.proFloorTexture = this.generateProFloorTexture('#1a202c', '#00d2ff', 'rgba(0, 210, 255, 0.18)');
    this.proCrateTexture = this.generateSciFiCrateTexture('#28313e', '#ffaa00');
    this.proCrateBlueTexture = this.generateSciFiCrateTexture('#1e293b', '#00d2ff');
    this.proCrateOrangeTexture = this.generateSciFiCrateTexture('#1e293b', '#ff6600');

    // Groups
    this.lobbyGroup = new THREE.Group();
    this.lobbyGroup.name = 'LobbyGroup';
    this.scene.add(this.lobbyGroup);

    this.arenaGroup = new THREE.Group();
    this.arenaGroup.name = 'ArenaGroup';
    this.scene.add(this.arenaGroup);

    // Water mesh for Pool Day
    this.waterMesh = null;
    this.skyMesh = null;

    // Callbacks
    this.onMapChanged = null;
  }

  // Generates high-fidelity competitive Roblox beveled stud texture
  generateStudTexture(baseColorHex, studColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base surface with subtle beveled tile frame
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 128, 128);

    // Bevel tile border highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 126);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 124, 124);

    const studPositions = [
      { x: 32, y: 32 }, { x: 96, y: 32 },
      { x: 32, y: 96 }, { x: 96, y: 96 }
    ];

    studPositions.forEach(p => {
      // 1. Ambient occlusion contact shadow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y + 2.5, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // 2. Main cylindrical stud body
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = studColorHex;
      ctx.fill();

      // 3. Realistic 3D directional specular gradient
      const grad = ctx.createLinearGradient(p.x - 14, p.y - 14, p.x + 14, p.y + 14);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      ctx.fillStyle = grad;
      ctx.fill();

      // 4. Subtle top circular rim highlight
      ctx.beginPath();
      ctx.arc(p.x, p.y - 1, 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generates diagonal high-visibility hazard warning stripes
  generateHazardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#181a1f';
    ctx.beginPath();
    for (let x = -128; x < 256; x += 32) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x + 16 + 128, 128);
      ctx.lineTo(x + 128, 128);
      ctx.closePath();
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // High-Tech Esports Carbon-Composite Floor with laser grid seams & bevels
  generateProFloorTexture(baseColorHex, accentColorHex, gridColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base carbon plate
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 256);

    // Beveled quadrant seams
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);
    ctx.strokeRect(2, 2, 126, 126);
    ctx.strokeRect(128, 2, 126, 126);
    ctx.strokeRect(2, 128, 126, 126);
    ctx.strokeRect(128, 128, 126, 126);

    // Fine highlight seams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 122, 122);
    ctx.strokeRect(130, 4, 122, 122);
    ctx.strokeRect(4, 130, 122, 122);
    ctx.strokeRect(130, 130, 122, 122);

    // Cyber Laser Grid Lines
    ctx.strokeStyle = gridColorHex || 'rgba(0, 210, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 24; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 4);
      ctx.lineTo(i, 252);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, i);
      ctx.lineTo(252, i);
      ctx.stroke();
    }

    // Corner rivets on each quadrant
    const rivets = [
      { x: 12, y: 12 }, { x: 118, y: 12 }, { x: 12, y: 118 }, { x: 118, y: 118 },
      { x: 138, y: 12 }, { x: 244, y: 12 }, { x: 138, y: 118 }, { x: 244, y: 118 },
      { x: 12, y: 138 }, { x: 118, y: 138 }, { x: 12, y: 244 }, { x: 118, y: 244 },
      { x: 138, y: 138 }, { x: 244, y: 138 }, { x: 138, y: 244 }, { x: 244, y: 244 }
    ];
    rivets.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r.x - 0.5, r.y - 0.5, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Tactical Sci-Fi Military Supply Container with Carbon Inset & Glowing LEDs
  generateSciFiCrateTexture(baseColorHex, teamColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base metal frame
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 256);

    // Beveled outer border
    ctx.strokeStyle = '#10141b';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 242, 242);

    // Inner carbon weave panel
    ctx.fillStyle = '#171b23';
    ctx.fillRect(24, 24, 208, 208);

    // Micro-weave checker
    ctx.fillStyle = '#12151c';
    for (let y = 24; y < 232; y += 8) {
      for (let x = 24; x < 232; x += 8) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }

    // High-visibility hazard diagonal band across center
    ctx.fillStyle = teamColorHex || '#ffaa00';
    ctx.fillRect(24, 114, 208, 28);
    ctx.fillStyle = '#10141b';
    for (let x = 24; x < 232; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 114);
      ctx.lineTo(x + 12, 114);
      ctx.lineTo(x + 2, 142);
      ctx.lineTo(x - 10, 142);
      ctx.closePath();
      ctx.fill();
    }

    // Glowing status indicator LED bars
    ctx.fillStyle = teamColorHex || '#00e5ff';
    ctx.fillRect(40, 40, 36, 6);
    ctx.fillRect(82, 40, 12, 6);
    ctx.fillRect(100, 40, 12, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generates atmospheric panoramic Sky Dome tailored to active arena
  updateSkyDome(mapName) {
    if (!this.skyMesh) {
      const skyGeo = new THREE.SphereGeometry(500, 32, 16);
      const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false });
      this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(this.skyMesh);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    if (mapName === 'poolday') {
      // Azure resort midday
      grad.addColorStop(0, '#005f9e');
      grad.addColorStop(0.45, '#0096c7');
      grad.addColorStop(0.75, '#48cae4');
      grad.addColorStop(0.88, '#ade8f4');
      grad.addColorStop(1, '#caf0f8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Sun disc flare
      ctx.beginPath();
      ctx.arc(680, 120, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(680, 120, 95, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 235, 180, 0.28)';
      ctx.fill();

      this.scene.fog = new THREE.Fog(0x90e0ef, 130, 400);
      this.scene.background = new THREE.Color(0x90e0ef);
    } else if (mapName === 'rooftop') {
      // Twilight Cyberpunk Metropolis
      grad.addColorStop(0, '#070314');
      grad.addColorStop(0.45, '#190a34');
      grad.addColorStop(0.78, '#3f1159');
      grad.addColorStop(0.88, '#9a1663');
      grad.addColorStop(1, '#e01e5a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Distant silhouetted skyscraper skyline along horizon
      ctx.fillStyle = '#0a0518';
      let cx = 0;
      while (cx < 1024) {
        const bw = 24 + Math.random() * 32;
        const bh = 40 + Math.random() * 85;
        ctx.fillRect(cx, 512 - bh, bw, bh);

        // Blinking red aviation warning lights on skyscraper antenna tips
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.arc(cx + bw / 2, 512 - bh - 4, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0044';
          ctx.fill();
          ctx.fillStyle = '#0a0518';
        }
        cx += bw + 4;
      }

      this.scene.fog = new THREE.Fog(0x190a34, 100, 360);
      this.scene.background = new THREE.Color(0x190a34);
    } else {
      // Blockout: High-Tech Competitive Cyber Arena
      grad.addColorStop(0, '#070b14');
      grad.addColorStop(0.45, '#0f1828');
      grad.addColorStop(0.75, '#15253e');
      grad.addColorStop(0.88, '#183856');
      grad.addColorStop(1, '#00d2ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Distant stadium floodlight silhouettes along horizon
      ctx.fillStyle = '#0b1220';
      for (let x = 40; x < 1024; x += 120) {
        ctx.fillRect(x, 440, 12, 72);
        ctx.fillRect(x - 14, 432, 40, 10);
      }

      this.scene.fog = new THREE.Fog(0x0f1828, 110, 370);
      this.scene.background = new THREE.Color(0x0f1828);
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    if (this.skyMesh.material.map) this.skyMesh.material.map.dispose();
    this.skyMesh.material.map = skyTex;
    this.skyMesh.material.needsUpdate = true;
  }

  generateTileTexture(c1, c2) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillRect(64, 64, 64, 64);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  buildMap() {
    this.buildLobby();
    this.loadArena('blockout');
  }

  // Switch active arena dynamically
  loadArena(mapName) {
    this.currentMapName = mapName;

    // Update panoramic Sky Dome & lighting atmosphere
    this.updateSkyDome(mapName);

    // Clear previous arena
    while (this.arenaGroup.children.length > 0) {
      const obj = this.arenaGroup.children[0];
      this.arenaGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.arenaColliders = [];
    this.waterMesh = null;

    if (mapName === 'poolday') {
      this.buildPoolDayArena();
    } else if (mapName === 'rooftop') {
      this.buildRooftopArena();
    } else {
      this.buildBlockoutArena();
    }

    // Recombine colliders
    this.colliders = [...this.lobbyColliders, ...this.arenaColliders];

    if (this.onMapChanged) {
      this.onMapChanged(mapName, this.getWaypointsForMap(mapName));
    }
  }

  createBox(x, y, z, w, h, d, material, parent, isLobby = false) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const colItem = { box: box, mesh: mesh };

    if (isLobby) {
      this.lobbyColliders.push(colItem);
    } else {
      this.arenaColliders.push(colItem);
    }
    return mesh;
  }

  createRamp(x, y, z, w, h, d, mat, parent, slopeDir = 'south') {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(x, y, z);

    const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, Math.sqrt(h * h + d * d)), mat);
    const angle = Math.atan2(h, d);
    rampMesh.rotation.x = slopeDir === 'south' ? angle : -angle;
    rampMesh.position.set(0, h / 2, 0);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);
    parent.add(rampGroup);

    // Create 8 micro-step colliders for smooth, snag-free ramp climbing
    const numSteps = 8;
    const stepD = d / numSteps;
    for (let i = 0; i < numSteps; i++) {
      const frac = (i + 1) / numSteps;
      const stepH = h * frac;
      const stepZ = (slopeDir === 'south')
        ? (z - d / 2 + stepD * (i + 0.5))
        : (z + d / 2 - stepD * (i + 0.5));
      this.createBox(x, y, stepZ, w, stepH, stepD + 0.05, mat, parent);
    }
  }

  createBarrier(x, y, z, w, h, color) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.visible = false;
    return mesh;
  }

  // ==========================================
  // 1. ARENA: "BLOCKOUT" (Symmetrical Competitive)
  // ==========================================
  buildBlockoutArena() {
    this.spawnBlue.set(0, 2.55, 55);
    this.spawnOrange.set(0, 2.55, -25);

    // High-tech Carbon-Composite Floor with Laser Seams
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.proFloorTexture,
      roughness: 0.35,
      metalness: 0.28
    });
    floorMat.map.repeat.set(11, 25);

    this.createBox(0, 0, 15, 44, 0.5, 100, floorMat, this.arenaGroup);

    // Glowing Neon Floor Guide Tracks (Blue & Orange Lanes leading to center)
    const blueTrackMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const orangeTrackMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const centerTrackMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const track1 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 30), blueTrackMat);
    track1.rotation.x = -Math.PI / 2;
    track1.position.set(-6, 0.51, 35);
    this.arenaGroup.add(track1);

    const track2 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 30), blueTrackMat);
    track2.rotation.x = -Math.PI / 2;
    track2.position.set(6, 0.51, 35);
    this.arenaGroup.add(track2);

    const track3 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 30), orangeTrackMat);
    track3.rotation.x = -Math.PI / 2;
    track3.position.set(-6, 0.51, -5);
    this.arenaGroup.add(track3);

    const track4 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 30), orangeTrackMat);
    track4.rotation.x = -Math.PI / 2;
    track4.position.set(6, 0.51, -5);
    this.arenaGroup.add(track4);

    // Perimeter Arena Walls (Sleek Dark Titanium with Metallic Bevels)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x141822,
      roughness: 0.45,
      metalness: 0.55
    });
    this.createBox(-22, 0.5, 15, 1.5, 9, 100, wallMat, this.arenaGroup);
    this.createBox(22, 0.5, 15, 1.5, 9, 100, wallMat, this.arenaGroup);
    this.createBox(0, 0.5, -35, 44, 9, 1.5, wallMat, this.arenaGroup);
    this.createBox(0, 0.5, 65, 44, 9, 1.5, wallMat, this.arenaGroup);

    // Wall Glow Stripes (Cyan for South/Blue, Orange for North/Orange)
    const wallStripeBlue = new THREE.Mesh(
      new THREE.BoxGeometry(43.8, 0.25, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 0.8 })
    );
    wallStripeBlue.position.set(0, 5.0, 64.2);
    this.arenaGroup.add(wallStripeBlue);

    const wallStripeOrange = new THREE.Mesh(
      new THREE.BoxGeometry(43.8, 0.25, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.8 })
    );
    wallStripeOrange.position.set(0, 5.0, -34.2);
    this.arenaGroup.add(wallStripeOrange);

    // Team High Perch Materials
    const blueMat = new THREE.MeshStandardMaterial({
      map: this.studTextureBlue,
      roughness: 0.38,
      metalness: 0.35
    });
    blueMat.map.repeat.set(4, 3);

    const orangeMat = new THREE.MeshStandardMaterial({
      map: this.studTextureOrange,
      roughness: 0.38,
      metalness: 0.35
    });
    orangeMat.map.repeat.set(4, 3);

    // Blue Team High Perch & Ramp (extended flush to back wall)
    this.createBox(0, 0.5, 56.5, 28, 2.0, 16, blueMat, this.arenaGroup);
    this.createRamp(0, 0.5, 45, 12, 2.0, 7, blueMat, this.arenaGroup, 'south');
    this.createRamp(-16, 0.5, 52, 4, 2.0, 9, blueMat, this.arenaGroup, 'south');
    this.createRamp(16, 0.5, 52, 4, 2.0, 9, blueMat, this.arenaGroup, 'south');

    // Glowing Neon Edge Line along Blue Perch
    const blueEdge = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 1.0 })
    );
    blueEdge.position.set(0, 2.56, 48.5);
    this.arenaGroup.add(blueEdge);

    // Orange Team High Perch & Ramp (extended flush to back wall)
    this.createBox(0, 0.5, -26.5, 28, 2.0, 16, orangeMat, this.arenaGroup);
    this.createRamp(0, 0.5, -15, 12, 2.0, 7, orangeMat, this.arenaGroup, 'north');
    this.createRamp(-16, 0.5, -22, 4, 2.0, 9, orangeMat, this.arenaGroup, 'north');
    this.createRamp(16, 0.5, -22, 4, 2.0, 9, orangeMat, this.arenaGroup, 'north');

    // Glowing Neon Edge Line along Orange Perch
    const orangeEdge = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 1.0 })
    );
    orangeEdge.position.set(0, 2.56, -18.5);
    this.arenaGroup.add(orangeEdge);

    // Mid Bridge (Elevated Tactical Center)
    const midBridgeMat = new THREE.MeshStandardMaterial({
      color: 0x2d3442,
      roughness: 0.35,
      metalness: 0.5
    });
    this.createBox(0, 0.5, 15, 16, 2.2, 10, midBridgeMat, this.arenaGroup);
    this.createRamp(0, 0.5, 8, 8, 2.2, 4, midBridgeMat, this.arenaGroup, 'south');
    this.createRamp(0, 0.5, 22, 8, 2.2, 4, midBridgeMat, this.arenaGroup, 'north');

    // Glowing Neon Rails & Edge Accents
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x0099cc,
      emissiveIntensity: 0.85,
      roughness: 0.15
    });
    this.createBox(-7.5, 2.7, 15, 0.4, 1.0, 10, railMat, this.arenaGroup);
    this.createBox(7.5, 2.7, 15, 0.4, 1.0, 10, railMat, this.arenaGroup);

    // Center Duel Circle Marker on Bridge
    const duelRingGeo = new THREE.RingGeometry(1.6, 1.9, 32);
    duelRingGeo.rotateX(-Math.PI / 2);
    const duelRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    const duelRing = new THREE.Mesh(duelRingGeo, duelRingMat);
    duelRing.position.set(0, 2.71, 15);
    this.arenaGroup.add(duelRing);

    // Hazard Stripes on Bridge Edges
    const hazardMat = new THREE.MeshBasicMaterial({ map: this.generateHazardTexture() });
    hazardMat.map.repeat.set(4, 1);
    const hz1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 10), hazardMat);
    hz1.position.set(-7.7, 2.72, 15);
    this.arenaGroup.add(hz1);
    const hz2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 10), hazardMat);
    hz2.position.set(7.7, 2.72, 15);
    this.arenaGroup.add(hz2);

    // Arena Stadium Floodlight Towers (4 corners)
    const towerPositions = [
      { x: -20, z: -32, lightColor: 0xff851b },
      { x: 20, z: -32, lightColor: 0xff851b },
      { x: -20, z: 62, lightColor: 0x00d2ff },
      { x: 20, z: 62, lightColor: 0x00d2ff }
    ];

    towerPositions.forEach(tp => {
      // Steel lattice pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 14, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.85, roughness: 0.25 })
      );
      pole.position.set(tp.x, 7.5, tp.z);
      this.arenaGroup.add(pole);

      // Light head bracket
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.0, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x10141d, metalness: 0.9, roughness: 0.2 })
      );
      head.position.set(tp.x, 14.5, tp.z);
      this.arenaGroup.add(head);

      // Glowing lens panel
      const lens = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      lens.position.set(tp.x, 14.5, tp.z + (tp.z > 0 ? -0.41 : 0.41));
      lens.rotation.y = tp.z > 0 ? Math.PI : 0;
      this.arenaGroup.add(lens);

      // Soft floodlight glow
      const flood = new THREE.PointLight(tp.lightColor, 2.4, 48);
      flood.position.set(tp.x, 14.0, tp.z + (tp.z > 0 ? -2.0 : 2.0));
      this.arenaGroup.add(flood);
    });

    // High-End Tactical Military Crates with Team Accents
    const crateMatBlue = new THREE.MeshStandardMaterial({ map: this.proCrateBlueTexture, roughness: 0.4, metalness: 0.3 });
    const crateMatOrange = new THREE.MeshStandardMaterial({ map: this.proCrateOrangeTexture, roughness: 0.4, metalness: 0.3 });
    const crateMatMid = new THREE.MeshStandardMaterial({ map: this.proCrateTexture, roughness: 0.4, metalness: 0.3 });

    const crates = [
      { x: -14, z: 35, w: 3.5, h: 2.2, d: 3.5, mat: crateMatBlue },
      { x: -12, z: 15, w: 3.0, h: 2.5, d: 5.0, mat: crateMatMid },
      { x: -14, z: -5, w: 3.5, h: 2.2, d: 3.5, mat: crateMatOrange },
      { x: 14, z: 35, w: 3.5, h: 2.2, d: 3.5, mat: crateMatBlue },
      { x: 12, z: 15, w: 3.0, h: 2.5, d: 5.0, mat: crateMatMid },
      { x: 14, z: -5, w: 3.5, h: 2.2, d: 3.5, mat: crateMatOrange },
      { x: -6, z: 49, w: 2.5, h: 1.3, d: 2.5, mat: crateMatBlue },
      { x: 6, z: 49, w: 2.5, h: 1.3, d: 2.5, mat: crateMatBlue },
      { x: -6, z: -19, w: 2.5, h: 1.3, d: 2.5, mat: crateMatOrange },
      { x: 6, z: -19, w: 2.5, h: 1.3, d: 2.5, mat: crateMatOrange }
    ];
    crates.forEach(c => this.createBox(c.x, 0.5, c.z, c.w, c.h, c.d, c.mat, this.arenaGroup));

    this.blueBarrier = this.createBarrier(0, 2.5, 47, 24, 6, 0x00d2ff);
    this.orangeBarrier = this.createBarrier(0, 2.5, -17, 24, 6, 0xff7700);
    this.arenaGroup.add(this.blueBarrier);
    this.arenaGroup.add(this.orangeBarrier);
  }

  // ==========================================
  // 2. ARENA: "POOL DAY" (Sunken Pool & Diving Boards)
  // ==========================================
  buildPoolDayArena() {
    this.spawnBlue.set(0, 2.05, 50);
    this.spawnOrange.set(0, 2.05, -20);

    const tileMat = new THREE.MeshStandardMaterial({ map: this.poolTileTexture, roughness: 0.3 });
    tileMat.map.repeat.set(12, 24);

    // Deck Surrounding Floor
    this.createBox(0, 0, 15, 44, 0.5, 100, tileMat, this.arenaGroup);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x27496d, roughness: 0.7 });
    this.createBox(-22, 0.5, 15, 1.5, 9, 100, wallMat, this.arenaGroup);
    this.createBox(22, 0.5, 15, 1.5, 9, 100, wallMat, this.arenaGroup);
    this.createBox(0, 0.5, -35, 44, 9, 1.5, wallMat, this.arenaGroup);
    this.createBox(0, 0.5, 65, 44, 9, 1.5, wallMat, this.arenaGroup);

    // Sunken Pool Basin (X: -11 to 11, Z: -5 to 35)
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x0081a7, roughness: 0.2 });
    // Side decks
    this.createBox(-16, 0.5, 15, 10, 1.5, 40, tileMat, this.arenaGroup);
    this.createBox(16, 0.5, 15, 10, 1.5, 40, tileMat, this.arenaGroup);
    // End decks
    this.createBox(0, 0.5, 45, 44, 1.5, 20, tileMat, this.arenaGroup);
    this.createBox(0, 0.5, -15, 44, 1.5, 20, tileMat, this.arenaGroup);

    // Translucent Animated Water Mesh in Pool
    const waterGeo = new THREE.PlaneGeometry(22, 40);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.8
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, 1.4, 15);
    this.arenaGroup.add(this.waterMesh);

    // Smooth Walk-Out Pool Stairs & Ramps (Eliminates sunken pool trap!)
    this.createRamp(0, 0.5, 32.5, 8, 1.5, 5, tileMat, this.arenaGroup, 'south');
    this.createRamp(0, 0.5, -2.5, 8, 1.5, 5, tileMat, this.arenaGroup, 'north');
    this.createBox(-9.5, 0.5, 15, 3.0, 0.75, 10, tileMat, this.arenaGroup);
    this.createBox(9.5, 0.5, 15, 3.0, 0.75, 10, tileMat, this.arenaGroup);

    // Diving Boards (Blue & Orange Sniper Vantage Points!)
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const ladderMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });

    // Blue High Diving Platform (Z = 38)
    this.createBox(0, 2.0, 40, 2.5, 3.0, 2.5, ladderMat, this.arenaGroup);
    this.createBox(0, 4.8, 35, 2.0, 0.3, 8.0, boardMat, this.arenaGroup);

    // Orange High Diving Platform (Z = -8)
    this.createBox(0, 2.0, -10, 2.5, 3.0, 2.5, ladderMat, this.arenaGroup);
    this.createBox(0, 4.8, -5, 2.0, 0.3, 8.0, boardMat, this.arenaGroup);

    // Cabanas / Locker Cubicles (Cover)
    const cabanaMat = new THREE.MeshStandardMaterial({ color: 0xfdf0d5, roughness: 0.5 });
    this.createBox(-14, 2.0, 25, 4, 3, 6, cabanaMat, this.arenaGroup);
    this.createBox(-14, 2.0, 5, 4, 3, 6, cabanaMat, this.arenaGroup);
    this.createBox(14, 2.0, 25, 4, 3, 6, cabanaMat, this.arenaGroup);
    this.createBox(14, 2.0, 5, 4, 3, 6, cabanaMat, this.arenaGroup);

    this.blueBarrier = this.createBarrier(0, 2.5, 47, 24, 6, 0x00d2ff);
    this.orangeBarrier = this.createBarrier(0, 2.5, -17, 24, 6, 0xff7700);
    this.arenaGroup.add(this.blueBarrier);
    this.arenaGroup.add(this.orangeBarrier);
  }

  // ==========================================
  // 3. ARENA: "ROOFTOP SKYLINE" (High-Rise Skyscraper)
  // ==========================================
  buildRooftopArena() {
    this.spawnBlue.set(0, 0.55, 55);
    this.spawnOrange.set(0, 0.55, -25);

    const roofMat = new THREE.MeshStandardMaterial({ map: this.rooftopTexture, roughness: 0.7 });
    roofMat.map.repeat.set(16, 32);

    this.createBox(0, 0, 15, 44, 0.5, 100, roofMat, this.arenaGroup);

    // Low parapet walls instead of tall enclosed walls!
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.6 });
    this.createBox(-21.5, 0.5, 15, 1.0, 1.5, 100, parapetMat, this.arenaGroup);
    this.createBox(21.5, 0.5, 15, 1.0, 1.5, 100, parapetMat, this.arenaGroup);
    this.createBox(0, 0.5, -34.5, 44, 1.5, 1.0, parapetMat, this.arenaGroup);
    this.createBox(0, 0.5, 64.5, 44, 1.5, 1.0, parapetMat, this.arenaGroup);

    // Center Illuminated Helipad
    const heliPadBase = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })
    );
    heliPadBase.position.set(0, 0.7, 15);
    this.arenaGroup.add(heliPadBase);
    this.createBox(0, 0.5, 15, 16, 0.4, 16, parapetMat, this.arenaGroup);

    // Neon Yellow Ring & "H" on Helipad
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(6.5, 7.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0, 0.92, 15);
    this.arenaGroup.add(ringMesh);

    // HVAC Units & Industrial Ducts (Great tactical cover)
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.6, roughness: 0.3 });
    const hvacs = [
      { x: -12, z: 32, w: 4.5, h: 2.2, d: 3.5 },
      { x: 12, z: 32, w: 4.5, h: 2.2, d: 3.5 },
      { x: -12, z: -2, w: 4.5, h: 2.2, d: 3.5 },
      { x: 12, z: -2, w: 4.5, h: 2.2, d: 3.5 },
      { x: -7, z: 15, w: 2.5, h: 1.8, d: 5.0 },
      { x: 7, z: 15, w: 2.5, h: 1.8, d: 5.0 }
    ];
    hvacs.forEach(h => this.createBox(h.x, 0.5, h.z, h.w, h.h, h.d, hvacMat, this.arenaGroup));

    // Distant City Skyline Towers (Skybox aesthetic)
    const towerMat = new THREE.MeshBasicMaterial({ color: 0x080a10 });
    const distantTowers = [
      { x: -60, z: 15, w: 25, h: 70, d: 25 },
      { x: 60, z: 15, w: 25, h: 80, d: 25 },
      { x: -50, z: -60, w: 30, h: 90, d: 30 },
      { x: 50, z: -60, w: 30, h: 100, d: 30 },
      { x: 0, z: 95, w: 35, h: 110, d: 35 }
    ];
    distantTowers.forEach(t => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), towerMat);
      b.position.set(t.x, t.h / 2 - 20, t.z);
      this.arenaGroup.add(b);
    });

    this.blueBarrier = this.createBarrier(0, 2.5, 47, 24, 6, 0x00d2ff);
    this.orangeBarrier = this.createBarrier(0, 2.5, -17, 24, 6, 0xff7700);
    this.arenaGroup.add(this.blueBarrier);
    this.arenaGroup.add(this.orangeBarrier);
  }

  // Waypoints for AI Bot navigation tailored to each map
  getWaypointsForMap(mapName) {
    if (mapName === 'poolday') {
      return [
        new THREE.Vector3(-14, 2.0, 5),   // Cabana west
        new THREE.Vector3(14, 2.0, 5),    // Cabana east
        new THREE.Vector3(0, 4.8, -5),    // Diving board orange
        new THREE.Vector3(-14, 2.0, 25),  // Cabana south-west
        new THREE.Vector3(14, 2.0, 25),   // Cabana south-east
        new THREE.Vector3(0, 2.0, 15)     // Pool edge
      ];
    } else if (mapName === 'rooftop') {
      return [
        new THREE.Vector3(-12, 1.8, -2),  // HVAC west
        new THREE.Vector3(12, 1.8, -2),   // HVAC east
        new THREE.Vector3(0, 1.8, 15),    // Helipad center
        new THREE.Vector3(-12, 1.8, 32),  // HVAC south-west
        new THREE.Vector3(12, 1.8, 32),   // HVAC south-east
        new THREE.Vector3(7, 1.8, 15)     // Duct cover
      ];
    } else {
      // Default Blockout
      return [
        new THREE.Vector3(-14, 1.8, -5),
        new THREE.Vector3(-6, 2.8, -19),
        new THREE.Vector3(6, 2.8, -19),
        new THREE.Vector3(14, 1.8, -5),
        new THREE.Vector3(0, 3.0, 15),
        new THREE.Vector3(-12, 1.8, 15),
        new THREE.Vector3(12, 1.8, 15)
      ];
    }
  }

  // ==========================================
  // 4. INTERACTIVE LOBBY
  // ==========================================
  buildLobby() {
    const lobbyFloorMat = new THREE.MeshStandardMaterial({
      map: this.studTextureFloor,
      roughness: 0.4,
      metalness: 0.2
    });
    lobbyFloorMat.map.repeat.set(16, 16);

    this.createBox(0, 0, -100, 44, 0.5, 50, lobbyFloorMat, this.lobbyGroup, true);

    const lobbyWallMat = new THREE.MeshStandardMaterial({ color: 0x323a48, roughness: 0.6 });
    this.createBox(-22, 0.5, -100, 1.5, 9, 50, lobbyWallMat, this.lobbyGroup, true);
    this.createBox(22, 0.5, -100, 1.5, 9, 50, lobbyWallMat, this.lobbyGroup, true);
    this.createBox(0, 0.5, -125, 44, 9, 1.5, lobbyWallMat, this.lobbyGroup, true);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0x3a4f66, roughness: 0.3, metalness: 0.5 });
    this.createBox(-14, 0.5, -75, 16, 9, 1.0, glassMat, this.lobbyGroup, true);
    this.createBox(14, 0.5, -75, 16, 9, 1.0, glassMat, this.lobbyGroup, true);

    // Duel Pads: Middle is 1v1 Duel Pad (reduced size), Left & Right are Solo Bot Duels
    const duelPad1 = this.createDuelPad(0, 0.52, -100, 5.5, 0x00ffcc, '1v1 DUEL PAD', 'multiplayer_queue');
    this.lobbyGroup.add(duelPad1);
    this.duelPads.push(duelPad1);

    const duelPad2 = this.createDuelPad(-13, 0.52, -100, 6.5, 0x00b4d8, 'CASUAL BOT DUEL (SOLO)', 'casual');
    this.lobbyGroup.add(duelPad2);
    this.duelPads.push(duelPad2);

    const duelPad3 = this.createDuelPad(13, 0.52, -100, 6.5, 0xff0055, 'AWP GOD BOT DUEL (SOLO)', 'hard');
    this.lobbyGroup.add(duelPad3);
    this.duelPads.push(duelPad3);

    // Shooting Range (Lobby North)
    const targets = [
      { x: -8, dist: '15m' }, { x: -3, dist: '25m' },
      { x: 3, dist: '35m' }, { x: 8, dist: '50m' }
    ];
    targets.forEach(t => {
      const dummy = AssetLoader.createTargetDummy();
      dummy.position.set(t.x, 0.5, -122);
      this.lobbyGroup.add(dummy);
      this.targetDummies.push(dummy);

      const markerGeo = new THREE.PlaneGeometry(1.6, 0.6);
      markerGeo.rotateX(-Math.PI / 2);
      const markerMesh = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0x556677 }));
      markerMesh.position.set(t.x, 0.55, -114);
      this.lobbyGroup.add(markerMesh);
    });

    // Unbox Shop Kiosk (Lobby West: X = -16, Z = -85)
    this.buildShopKiosk(this.lobbyGroup);

    // Map Selector Terminal (Lobby East: X = 16, Z = -85)
    this.buildMapTerminal(this.lobbyGroup);

    // Dedicated Bot Testing Lab Portal & Sandbox Room (Lobby West: X = -14, Z = -93)
    this.buildTestingLabPortal(this.lobbyGroup);
    this.buildTestingLab(this.lobbyGroup);
  }

  // Interactive Portal Pad in Lobby to enter the Testing Lab
  buildTestingLabPortal(parent) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(-14, 0.52, -93);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x221338, roughness: 0.3, emissive: 0x120520 })
    );
    portalGroup.add(base);

    const ringGeo = new THREE.RingGeometry(1.9, 2.2, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.08;
    portalGroup.add(ring);

    // Holographic Floating Title
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(20, 10, 35, 0.9)';
    ctx.roundRect(10, 10, 492, 108, 16);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 34px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🤖 BOT TESTING LAB', 256, 52);
    ctx.fillStyle = '#ffaa00'; ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('PHYSICS DUMMY • STEP HERE TO ENTER', 256, 92);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.position.set(0, 2.5, 0);
    sprite.scale.set(3.8, 0.95, 1.0);
    portalGroup.add(sprite);

    parent.add(portalGroup);
    portalGroup.userData = { ringMesh: ring };
    this.testingEntrancePad = portalGroup;
  }

  // Dedicated Separate Testing Lab Room (Isolated at Z: -200)
  buildTestingLab(parent) {
    const labGroup = new THREE.Group();
    labGroup.position.set(0, 0, 0);

    // Lab floor: 32m wide, 44m long (Z: -222 to -178)
    const labFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1b2028,
      roughness: 0.35,
      metalness: 0.3
    });
    this.createBox(0, 0, -200, 32, 0.5, 44, labFloorMat, labGroup, true);

    // Boundary walls (12m high)
    const labWallMat = new THREE.MeshStandardMaterial({ color: 0x27303f, roughness: 0.5 });
    this.createBox(-16, 0.5, -200, 1.5, 12, 44, labWallMat, labGroup, true); // West
    this.createBox(16, 0.5, -200, 1.5, 12, 44, labWallMat, labGroup, true);  // East
    this.createBox(0, 0.5, -222, 32, 12, 1.5, labWallMat, labGroup, true);  // North
    this.createBox(0, 0.5, -178, 32, 12, 1.5, labWallMat, labGroup, true);  // South

    // Distance markings on floor from dummy starting position (Z = -205)
    const distanceMarkers = [
      { z: -200, text: '5 METERS' },
      { z: -195, text: '10 METERS' },
      { z: -190, text: '15 METERS' },
      { z: -185, text: '20 METERS' }
    ];

    distanceMarkers.forEach(m => {
      const stripGeo = new THREE.PlaneGeometry(28, 0.25);
      stripGeo.rotateX(-Math.PI / 2);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.55 });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 0.52, m.z);
      labGroup.add(strip);

      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#00d2ff'; ctx.font = 'bold 28px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(m.text, 128, 42);

      const tex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), labelMat);
      label.rotateX(-Math.PI / 2);
      label.position.set(-11, 0.53, m.z);
      labGroup.add(label);
    });

    // Test Dummy starting pedestal
    const botPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.2, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3, emissive: 0x442200 })
    );
    botPedestal.position.set(0, 0.55, -205);
    labGroup.add(botPedestal);

    const ringGeo = new THREE.RingGeometry(1.8, 2.0, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide }));
    ring.position.set(0, 0.64, -205);
    labGroup.add(ring);

    // "LEAVE AREA" Exit Pad (South end of room at Z = -182)
    const exitPadGroup = new THREE.Group();
    exitPadGroup.position.set(0, 0.52, -182);

    const padBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.7, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3, emissive: 0x330008 })
    );
    exitPadGroup.add(padBase);

    const exitRingGeo = new THREE.RingGeometry(2.1, 2.4, 24);
    exitRingGeo.rotateX(-Math.PI / 2);
    const exitRing = new THREE.Mesh(exitRingGeo, new THREE.MeshBasicMaterial({ color: 0xff3355, side: THREE.DoubleSide }));
    exitRing.position.y = 0.08;
    exitPadGroup.add(exitRing);

    // Floating sign: "LEAVE AREA / RETURN TO LOBBY"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512; signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = 'rgba(217, 4, 41, 0.88)';
    sCtx.roundRect(10, 10, 492, 108, 16);
    sCtx.fill();
    sCtx.strokeStyle = '#ffffff'; sCtx.lineWidth = 4; sCtx.stroke();
    sCtx.fillStyle = '#ffffff'; sCtx.font = 'bold 36px "Segoe UI", sans-serif'; sCtx.textAlign = 'center';
    sCtx.fillText('🚪 LEAVE AREA', 256, 52);
    sCtx.font = 'bold 24px "Segoe UI", sans-serif';
    sCtx.fillText('STEP HERE TO RETURN TO LOBBY', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex, transparent: true }));
    signSprite.position.set(0, 2.5, 0);
    signSprite.scale.set(4.0, 1.0, 1.0);
    exitPadGroup.add(signSprite);

    labGroup.add(exitPadGroup);
    parent.add(labGroup);

    exitPadGroup.userData = { ringMesh: exitRing };
    this.testingExitPad = exitPadGroup;
  }

  createDuelPad(x, y, z, radius, colorHex, labelText, mode) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const padBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius / 2, radius / 2, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.3 })
    );
    group.add(padBase);

    const ringGeo = new THREE.RingGeometry(radius / 2 - 0.25, radius / 2, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.08;
    group.add(ring);

    const innerStud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, emissive: colorHex, emissiveIntensity: 0.5 })
    );
    innerStud.position.y = 0.08;
    group.add(innerStud);

    group.userData = {
      isDuelPad: true,
      radius: radius / 2,
      mode: mode,
      label: labelText,
      ringMesh: ring,
      baseColor: colorHex
    };
    return group;
  }

  buildShopKiosk(parent) {
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(-16, 0.5, -85);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.4 })
    );
    base.position.y = 0.45;
    kioskGroup.add(base);

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, roughness: 0.3, metalness: 0.8, emissive: 0x332200
    });
    const crateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6), crateMat);
    crateMesh.position.y = 1.6;
    kioskGroup.add(crateMesh);

    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256; textCanvas.height = 64;
    const ctx = textCanvas.getContext('2d');
    ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CRATE SHOP', 128, 42);

    const textTex = new THREE.CanvasTexture(textCanvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex }));
    sprite.position.set(0, 2.4, 0);
    sprite.scale.set(2.4, 0.6, 1);
    kioskGroup.add(sprite);

    parent.add(kioskGroup);
    this.shopKiosk = { group: kioskGroup, crateMesh: crateMesh };
  }

  buildMapTerminal(parent) {
    const termGroup = new THREE.Group();
    termGroup.position.set(16, 0.5, -85);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.4 })
    );
    base.position.y = 0.45;
    termGroup.add(base);

    // Floating Rotating Hologram Globe / Icon
    const holoMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, wireframe: true, emissive: 0x00d2ff, emissiveIntensity: 0.6 })
    );
    holoMesh.position.y = 1.6;
    termGroup.add(holoMesh);

    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256; textCanvas.height = 64;
    const ctx = textCanvas.getContext('2d');
    ctx.fillStyle = '#00d2ff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('MAP SELECTOR', 128, 42);

    const textTex = new THREE.CanvasTexture(textCanvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex }));
    sprite.position.set(0, 2.4, 0);
    sprite.scale.set(2.4, 0.6, 1);
    termGroup.add(sprite);

    parent.add(termGroup);
    this.mapTerminal = { group: termGroup, holoMesh: holoMesh };
  }

  update(delta, time) {
    this.duelPads.forEach(pad => {
      const scale = 1.0 + Math.sin(time * 3.5) * 0.04;
      pad.userData.ringMesh.scale.set(scale, scale, scale);
    });

    if (this.testingEntrancePad && this.testingEntrancePad.userData.ringMesh) {
      const scale = 1.0 + Math.sin(time * 3.0) * 0.05;
      this.testingEntrancePad.userData.ringMesh.scale.set(scale, scale, scale);
    }
    if (this.testingExitPad && this.testingExitPad.userData.ringMesh) {
      const scale = 1.0 + Math.sin(time * 3.0) * 0.05;
      this.testingExitPad.userData.ringMesh.scale.set(scale, scale, scale);
    }

    if (this.shopKiosk) {
      this.shopKiosk.crateMesh.rotation.y += delta * 1.2;
      this.shopKiosk.crateMesh.position.y = 1.6 + Math.sin(time * 2.5) * 0.08;
    }

    if (this.mapTerminal) {
      this.mapTerminal.holoMesh.rotation.y += delta * 1.5;
      this.mapTerminal.holoMesh.rotation.x += delta * 0.8;
      this.mapTerminal.holoMesh.position.y = 1.6 + Math.sin(time * 2.5) * 0.08;
    }

    // Animate water ripples in Pool Day
    if (this.waterMesh) {
      this.waterMesh.position.y = 1.4 + Math.sin(time * 2.0) * 0.03;
    }

    this.targetDummies.forEach(dummy => {
      if (dummy.userData.isKnockedDown) {
        dummy.userData.resetTimer -= delta;
        if (dummy.userData.resetTimer <= 0) {
          dummy.userData.isKnockedDown = false;
          dummy.userData.pivot.rotation.x = 0;
        }
      }
    });
  }

  hitTarget(dummy, isHeadshot) {
    dummy.userData.isKnockedDown = true;
    dummy.userData.resetTimer = 2.5;
    dummy.userData.pivot.rotation.x = -Math.PI / 2.2;
  }
}
