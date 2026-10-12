// CaseSystem.js - In-Game Economy, Crate Shop, Roulette Wheel & 3D Skin Preview System
import * as THREE from '../vendor/three/three.module.js';
import { AssetLoader } from './AssetLoader.js';

export class CaseSystem {
  constructor(audioSystem, weaponSystem) {
    this.audio = audioSystem;
    this.weaponSystem = weaponSystem;

    // Currency & Inventory state
    this.coins = 350;
    this.inventory = ['sniper_classic', 'knife_vanilla', 'skin_agent_tactical'];
    this.equippedSniper = 'sniper_classic';
    this.equippedKnife = 'knife_vanilla';
    this.equippedSkin = 'skin_agent_tactical';

    this.isUnboxing = false;
    this.invFilter = 'ALL'; // 'ALL', 'SKIN', 'SNIPER', 'KNIFE'

    // 3D Preview State
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewModelGroup = null;
    this.previewPedestal = null;
    this.previewYaw = 0;
    this.previewPitch = 0;
    this.previewTargetDistance = 3.8;
    this.currentPreviewItemId = null;

    this.onSkinEquipped = null;

    // Skins Database - 8 Snipers, 5 Knives, and 15 Diverse Futuristic/Manga/Military Player Skins
    this.skins = {
      // ==========================================
      // 1. SNIPER RIFLES (8 Skins)
      // ==========================================
      sniper_classic: {
        id: 'sniper_classic',
        name: 'Classic Blockout AWP',
        type: 'SNIPER',
        rarity: 'common',
        color: '#95a5a6',
        primaryColor: 0x242830,
        accentColor: 0x00c3ff,
        desc: 'Standard factory specification bolt-action sniper rifle with matte steel finish.'
      },
      sniper_desert: {
        id: 'sniper_desert',
        name: 'Desert Stud AWP',
        type: 'SNIPER',
        rarity: 'uncommon',
        color: '#2ecc71',
        primaryColor: 0x8c7853,
        accentColor: 0x4a3f2c,
        desc: 'Mil-spec desert digital camouflage finish for arid combat environments.'
      },
      sniper_arctic: {
        id: 'sniper_arctic',
        name: 'Arctic Frost AWP',
        type: 'SNIPER',
        rarity: 'uncommon',
        color: '#2ecc71',
        primaryColor: 0xced6e0,
        accentColor: 0x747d8c,
        desc: 'Sub-zero cryo-tempered frame coated in high-altitude snow camouflage.'
      },
      sniper_neon: {
        id: 'sniper_neon',
        name: 'Cyberpunk Neon AWP',
        type: 'SNIPER',
        rarity: 'rare',
        color: '#3498db',
        primaryColor: 0x1e272e,
        accentColor: 0x00f7ff,
        emissive: true,
        desc: 'Night City black carbon chassis laced with active electroluminescent neon conduits.'
      },
      sniper_orange: {
        id: 'sniper_orange',
        name: 'Orange Blockout AWP',
        type: 'SNIPER',
        rarity: 'rare',
        color: '#3498db',
        primaryColor: 0x2f3542,
        accentColor: 0xff6600,
        emissive: true,
        desc: 'High-visibility safety hazard orange accents with reinforced composite barrel.'
      },
      sniper_asiimov: {
        id: 'sniper_asiimov',
        name: 'Asiimov Mecha AWP',
        type: 'SNIPER',
        rarity: 'epic',
        color: '#9b59b6',
        primaryColor: 0xecf0f1,
        accentColor: 0xff5500,
        metalColor: 0x222222,
        roughness: 0.25,
        desc: 'Futuristic sci-fi mecha aesthetics featuring clean white panels and racing orange stripes.'
      },
      sniper_void: {
        id: 'sniper_void',
        name: 'Hyper Void AWP',
        type: 'SNIPER',
        rarity: 'epic',
        color: '#9b59b6',
        primaryColor: 0x2c003e,
        accentColor: 0xff007f,
        emissive: true,
        desc: 'Dark matter dimensional frame radiating intense UV void energy.'
      },
      sniper_dragon: {
        id: 'sniper_dragon',
        name: 'Dragon Lore Gold AWP',
        type: 'SNIPER',
        rarity: 'legendary',
        color: '#f1c40f',
        primaryColor: 0xffcc00,
        accentColor: 0x33ff66,
        metalness: 0.85,
        roughness: 0.15,
        emissive: true,
        desc: 'Mythical golden dragon-carved rifle. The pinnacle of competitive prestige.'
      },

      // ==========================================
      // 2. TACTICAL KNIVES (5 Skins)
      // ==========================================
      knife_vanilla: {
        id: 'knife_vanilla',
        name: 'Standard Issue Tanto',
        type: 'KNIFE',
        rarity: 'common',
        color: '#95a5a6',
        bladeColor: 0xd8d8d8,
        handleColor: 0x222428,
        desc: 'Hardened high-carbon steel tactical combat tanto with ribbed polymer grip.'
      },
      knife_olive: {
        id: 'knife_olive',
        name: 'Tactical Olive Tanto',
        type: 'KNIFE',
        rarity: 'uncommon',
        color: '#2ecc71',
        bladeColor: 0x4b5320,
        handleColor: 0x1a1c14,
        desc: 'Anti-reflective olive drab ceramic coat designed for woodland reconnaissance.'
      },
      knife_cobalt: {
        id: 'knife_cobalt',
        name: 'Cobalt Dagger',
        type: 'KNIFE',
        rarity: 'rare',
        color: '#3498db',
        bladeColor: 0x0088ff,
        handleColor: 0x111e2e,
        desc: 'Titanium-nitride cobalt blue blade with hardened tungsten steel edge.'
      },
      knife_crimson: {
        id: 'knife_crimson',
        name: 'Crimson Web Knife',
        type: 'KNIFE',
        rarity: 'epic',
        color: '#9b59b6',
        bladeColor: 0xd63031,
        handleColor: 0x111111,
        desc: 'Glossy blood-red lacquered finish etched with spiderweb tactical patterns.'
      },
      knife_fade: {
        id: 'knife_fade',
        name: 'Fade Marble Karambit',
        type: 'KNIFE',
        rarity: 'legendary',
        color: '#f1c40f',
        bladeColor: 0x9b59b6,
        handleColor: 0x222222,
        desc: 'Ultra-rare heat-anodized marble fade transition from spectrum violet to molten gold.'
      },

      // ==========================================
      // 3. DIVERSE PLAYER OPERATOR SKINS (15 Unique Skins)
      // ==========================================
      skin_manga_demon: {
        id: 'skin_manga_demon',
        name: 'Flame Demon Slayer',
        type: 'SKIN',
        rarity: 'legendary',
        color: '#f1c40f',
        icon: '🔥',
        theme: 'skin_manga_demon',
        shirtColor: 0xd63031,
        pantsColor: 0x18181c,
        skinColor: 0xffe0bd,
        armorColor: 0x111111,
        accentColor: 0xff7675,
        visorColor: 0xff4400,
        desc: 'Forged in crimson flames. Manga demon hunter uniform with fiery haori, anime aura hair, and glowing demon eye optics.'
      },
      skin_cyber_ninja: {
        id: 'skin_cyber_ninja',
        name: 'Cyber Shinobi 2099',
        type: 'SKIN',
        rarity: 'epic',
        color: '#9b59b6',
        icon: '🥷',
        theme: 'skin_cyber_ninja',
        shirtColor: 0x1e272e,
        pantsColor: 0x141a20,
        skinColor: 0x22262d,
        armorColor: 0x111418,
        accentColor: 0x00f7ff,
        visorColor: 0x00f7ff,
        desc: 'High-tech carbon ninja frame equipped with dual crossed energy blades and cyan laser optics.'
      },
      skin_specops_ghost: {
        id: 'skin_specops_ghost',
        name: 'Ghost Operative',
        type: 'SKIN',
        rarity: 'epic',
        color: '#9b59b6',
        icon: '💀',
        theme: 'skin_specops_ghost',
        shirtColor: 0x111418,
        pantsColor: 0x181c22,
        skinColor: 0x111418,
        armorColor: 0x0d1013,
        accentColor: 0x2ecc71,
        visorColor: 0x2ecc71,
        desc: 'Black Ops shadow operator equipped with skull balaclava and glowing green quad-NVG night vision optics.'
      },
      skin_manga_mecha: {
        id: 'skin_manga_mecha',
        name: 'Unit-01 Mecha Pilot',
        type: 'SKIN',
        rarity: 'legendary',
        color: '#f1c40f',
        icon: '🤖',
        theme: 'skin_manga_mecha',
        shirtColor: 0x6c5ce7,
        pantsColor: 0x2d3436,
        skinColor: 0xffeaa7,
        armorColor: 0x2d3436,
        accentColor: 0x00ff88,
        visorColor: 0x00ff88,
        desc: 'Evangelion-inspired mecha plugsuit featuring mecha antenna horns, vertical shoulder pylons, and glowing core reactor.'
      },
      skin_agent_tactical: {
        id: 'skin_agent_tactical',
        name: 'Agent 00: Infiltrator',
        type: 'SKIN',
        rarity: 'rare',
        color: '#3498db',
        icon: '🕶️',
        theme: 'skin_agent_tactical',
        shirtColor: 0x161820,
        pantsColor: 0x14161c,
        skinColor: 0xffd200,
        armorColor: 0x161820,
        accentColor: 0xd63031,
        visorColor: 0xf1c40f,
        desc: 'Debonair secret agent in tailored ballistic tuxedo with gold aviator shades and crimson tie.'
      },
      skin_military_desert: {
        id: 'skin_military_desert',
        name: 'Desert Storm Vanguard',
        type: 'SKIN',
        rarity: 'uncommon',
        color: '#2ecc71',
        icon: '🏜️',
        theme: 'skin_military_desert',
        shirtColor: 0xdfb15b,
        pantsColor: 0x8c7853,
        skinColor: 0xffd200,
        armorColor: 0x5a4a35,
        accentColor: 0xffaa00,
        visorColor: 0xffaa00,
        desc: 'Desert MARPAT digital camouflage combat uniform with shemagh scarf and amber dust goggles.'
      },
      skin_military_arctic: {
        id: 'skin_military_arctic',
        name: 'Arctic Spec-Ops Frost',
        type: 'SKIN',
        rarity: 'uncommon',
        color: '#2ecc71',
        icon: '❄️',
        theme: 'skin_military_arctic',
        shirtColor: 0xedf2f7,
        pantsColor: 0x718096,
        skinColor: 0xffe0bd,
        armorColor: 0xcfd8dc,
        accentColor: 0x38b2ac,
        visorColor: 0x38b2ac,
        desc: 'Sub-zero alpine operative in winter snow parka with fur collar and polarized ice visor.'
      },
      skin_military_urban: {
        id: 'skin_military_urban',
        name: 'Urban Blackout Marine',
        type: 'SKIN',
        rarity: 'uncommon',
        color: '#2ecc71',
        icon: '⚓',
        theme: 'skin_military_urban',
        shirtColor: 0x2b3a4a,
        pantsColor: 0x1a202c,
        skinColor: 0xffd200,
        armorColor: 0x1a202c,
        accentColor: 0x63b3ed,
        visorColor: 0x63b3ed,
        desc: 'Heavy metropolitan tactical response gear with slate navy armor and ballistic blast shield.'
      },
      skin_cyber_netrunner: {
        id: 'skin_cyber_netrunner',
        name: 'Neon Netrunner',
        type: 'SKIN',
        rarity: 'rare',
        color: '#3498db',
        icon: '⚡',
        theme: 'skin_cyber_netrunner',
        shirtColor: 0x2d112c,
        pantsColor: 0x111116,
        skinColor: 0xffe0bd,
        armorColor: 0x1e1526,
        accentColor: 0xff007f,
        visorColor: 0x00ffff,
        desc: 'Cyberpunk underground hacker with glowing magenta street punk hair and holographic cyber-glasses.'
      },
      skin_cyber_glitch: {
        id: 'skin_cyber_glitch',
        name: 'Glitch Phantom',
        type: 'SKIN',
        rarity: 'epic',
        color: '#9b59b6',
        icon: '👾',
        theme: 'skin_cyber_glitch',
        shirtColor: 0x0b0c10,
        pantsColor: 0x050608,
        skinColor: 0x1f2833,
        armorColor: 0x0b0c10,
        accentColor: 0x66fcf1,
        visorColor: 0x66fcf1,
        desc: 'Corrupted digital anomaly frame with floating polygon glitch fragments and matrix circuit optics.'
      },
      skin_manga_ronin: {
        id: 'skin_manga_ronin',
        name: 'Cyber Ronin',
        type: 'SKIN',
        rarity: 'epic',
        color: '#9b59b6',
        icon: '🗡️',
        theme: 'skin_manga_ronin',
        shirtColor: 0x1f2421,
        pantsColor: 0x141715,
        skinColor: 0xffe0bd,
        armorColor: 0x111111,
        accentColor: 0xd4af37,
        visorColor: 0xe63946,
        desc: 'Futuristic wandering samurai equipped with conical high-tech kasa hat, Oni half-mask, and golden haori.'
      },
      skin_manga_valkyrie: {
        id: 'skin_manga_valkyrie',
        name: 'Neon Valkyrie',
        type: 'SKIN',
        rarity: 'legendary',
        color: '#f1c40f',
        icon: '🪽',
        theme: 'skin_manga_valkyrie',
        shirtColor: 0xffffff,
        pantsColor: 0xf1c40f,
        skinColor: 0xffe0bd,
        armorColor: 0xffffff,
        accentColor: 0xf1c40f,
        visorColor: 0x00d2ff,
        desc: 'Divine anime warrior heroine with golden spiky hair, pure white and gold power armor, and glowing cyber wings.'
      },
      skin_agent_shadow: {
        id: 'skin_agent_shadow',
        name: 'Shadow Syndicate Assassin',
        type: 'SKIN',
        rarity: 'rare',
        color: '#3498db',
        icon: '🩸',
        theme: 'skin_agent_shadow',
        shirtColor: 0x0f0f14,
        pantsColor: 0x09090c,
        skinColor: 0x111116,
        armorColor: 0x0f0f14,
        accentColor: 0x8b0000,
        visorColor: 0xff2a2a,
        desc: 'Contract assassin clad in noir popped-collar trenchcoat with dual glowing red respirator canisters.'
      },
      skin_cyber_hazard: {
        id: 'skin_cyber_hazard',
        name: 'Tox-Hazmat Enforcer',
        type: 'SKIN',
        rarity: 'rare',
        color: '#3498db',
        icon: '☣️',
        theme: 'skin_cyber_hazard',
        shirtColor: 0xffcc00,
        pantsColor: 0x222222,
        skinColor: 0xffd200,
        armorColor: 0x333333,
        accentColor: 0xff9900,
        visorColor: 0xff9900,
        desc: 'Heavy industrial hazardous containment suit with yellow bio-sealed hood and dual bio-filter mask.'
      },
      skin_manga_saiyan: {
        id: 'skin_manga_saiyan',
        name: 'Super Star Striker',
        type: 'SKIN',
        rarity: 'legendary',
        color: '#f1c40f',
        icon: '💥',
        theme: 'skin_manga_saiyan',
        shirtColor: 0xff6b35,
        pantsColor: 0xff6b35,
        skinColor: 0xffd200,
        armorColor: 0x004e89,
        accentColor: 0x00f7ff,
        visorColor: 0x00f7ff,
        desc: 'Legendary manga warrior in orange martial arts dogi with massive upward electric cyan aura hair.'
      }
    };

    // 5 Thematic Crate Definitions with Weapons and Operator Skins
    this.cases = [
      {
        id: 'case_blockout',
        name: 'Blockout Military Crate',
        cost: 100,
        pool: ['sniper_desert', 'sniper_arctic', 'knife_olive', 'skin_military_desert', 'skin_military_arctic', 'skin_military_urban']
      },
      {
        id: 'case_cyber',
        name: 'Cyberpunk Strike Case',
        cost: 250,
        pool: ['sniper_neon', 'knife_cobalt', 'skin_cyber_ninja', 'skin_cyber_netrunner', 'skin_cyber_hazard', 'skin_agent_tactical']
      },
      {
        id: 'case_agent',
        name: 'Black Ops Special Agent Crate',
        cost: 300,
        pool: ['knife_crimson', 'sniper_asiimov', 'skin_specops_ghost', 'skin_agent_tactical', 'skin_agent_shadow', 'skin_military_urban']
      },
      {
        id: 'case_manga',
        name: 'Manga & Anime Legends Crate',
        cost: 350,
        pool: ['sniper_void', 'knife_fade', 'skin_manga_ronin', 'skin_cyber_glitch', 'skin_manga_demon', 'skin_manga_mecha', 'skin_manga_valkyrie', 'skin_manga_saiyan']
      },
      {
        id: 'case_lockedin',
        name: 'Locked In Mythic Crate',
        cost: 500,
        pool: ['sniper_dragon', 'knife_fade', 'skin_manga_demon', 'skin_manga_mecha', 'skin_manga_valkyrie', 'skin_manga_saiyan', 'skin_cyber_ninja', 'skin_specops_ghost']
      }
    ];

    this.initUI();
  }

  saveProfile() {
    const data = {
      coins: this.coins,
      inventory: this.inventory,
      equippedSniper: this.equippedSniper,
      equippedKnife: this.equippedKnife,
      equippedSkin: this.equippedSkin
    };
    try {
      localStorage.setItem('sniper_duels_profile', JSON.stringify(data));
      if (window.__currentUser) {
        localStorage.setItem(`sniper_duels_profile_${window.__currentUser}`, JSON.stringify(data));
        fetch('/api/user/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: window.__currentUser, ...data })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  loadProfile(profileData) {
    if (!profileData) return;
    if (typeof profileData.coins === 'number') this.coins = profileData.coins;
    if (Array.isArray(profileData.inventory) && profileData.inventory.length > 0) {
      this.inventory = profileData.inventory;
    }
    if (profileData.equippedSniper && this.skins[profileData.equippedSniper]) {
      this.equippedSniper = profileData.equippedSniper;
      if (this.weaponSystem && this.weaponSystem.applySniperSkin) {
        this.weaponSystem.applySniperSkin(this.skins[this.equippedSniper]);
      }
    }
    if (profileData.equippedKnife && this.skins[profileData.equippedKnife]) {
      this.equippedKnife = profileData.equippedKnife;
      if (this.weaponSystem && this.weaponSystem.applyKnifeSkin) {
        this.weaponSystem.applyKnifeSkin(this.skins[this.equippedKnife]);
      }
    }
    if (profileData.equippedSkin && this.skins[profileData.equippedSkin]) {
      this.equippedSkin = profileData.equippedSkin;
      if (this.onSkinEquipped) {
        this.onSkinEquipped(this.skins[this.equippedSkin]);
      }
    }
    this.updateHUDCoins();
    this.renderShopCases();
    this.renderInventory();
  }

  addCoins(amount) {
    this.coins = Math.max(0, this.coins + amount);
    this.updateHUDCoins();
    this.saveProfile();
  }

  deductCoins(amount = 100) {
    this.coins = Math.max(0, this.coins - amount);
    this.updateHUDCoins();
    this.saveProfile();
    return this.coins;
  }

  updateHUDCoins() {
    const el = document.getElementById('coin-display');
    if (el) el.textContent = `${this.coins} 🪙`;
    const shopCoins = document.getElementById('shop-coins-counter');
    if (shopCoins) shopCoins.textContent = this.coins;
  }

  initUI() {
    try {
      const saved = localStorage.getItem('sniper_duels_profile');
      if (saved) {
        this.loadProfile(JSON.parse(saved));
      }
    } catch (e) {}
    this.updateHUDCoins();
  }

  openShopModal() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.renderShopCases();
      this.renderInventory();
    }
  }

  closeShopModal() {
    const modal = document.getElementById('shop-modal');
    if (modal) modal.style.display = 'none';
  }

  renderShopCases() {
    const container = document.getElementById('case-list-container');
    if (!container) return;
    container.innerHTML = '';

    this.cases.forEach(c => {
      const card = document.createElement('div');
      card.className = 'case-card';

      // Build drops pills
      const dropPillsHtml = c.pool.map(id => {
        const item = this.skins[id];
        if (!item) return '';
        const icon = item.icon || (item.type === 'SNIPER' ? '🎯' : (item.type === 'KNIFE' ? '🗡️' : '👤'));
        return `<span class="case-drop-pill" data-preview-id="${id}" style="color: ${item.color}; border-color: ${item.color}66;" title="${item.name} (${item.rarity.toUpperCase()})">
          ${icon} ${item.name}
        </span>`;
      }).join('');

      card.innerHTML = `
        <div class="case-card-title">${c.name}</div>
        <div class="case-card-icon">📦</div>
        <div class="case-card-cost">${c.cost} 🪙</div>
        <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">DROPS (CLICK TO PREVIEW 3D):</div>
        <div class="case-drops-row">${dropPillsHtml}</div>
        <button class="case-open-btn" ${this.coins < c.cost || this.isUnboxing ? 'disabled' : ''}>
          ${this.coins < c.cost ? 'NOT ENOUGH COINS' : 'UNBOX CASE'}
        </button>
      `;

      // Attach preview triggers to pills
      card.querySelectorAll('.case-drop-pill').forEach(pill => {
        const pId = pill.getAttribute('data-preview-id');
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.openPreview(pId);
        });
      });

      const btn = card.querySelector('.case-open-btn');
      const handleOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.startUnbox(c);
      };
      btn.addEventListener('click', handleOpen);
      btn.addEventListener('touchend', handleOpen, { passive: false });

      container.appendChild(card);
    });
  }

  renderInventory() {
    const invContainer = document.getElementById('inventory-list-container');
    if (!invContainer) return;

    // Insert Filter Tabs Header if not existing
    let tabsHeader = document.getElementById('inv-category-tabs');
    if (!tabsHeader) {
      tabsHeader = document.createElement('div');
      tabsHeader.id = 'inv-category-tabs';
      tabsHeader.className = 'inv-tabs';
      tabsHeader.innerHTML = `
        <button class="inv-tab-btn active" data-filter="ALL">ALL ITEMS</button>
        <button class="inv-tab-btn" data-filter="SKIN">OPERATOR SKINS (15)</button>
        <button class="inv-tab-btn" data-filter="SNIPER">SNIPER RIFLES</button>
        <button class="inv-tab-btn" data-filter="KNIFE">TACTICAL KNIVES</button>
      `;
      invContainer.parentElement.insertBefore(tabsHeader, invContainer);

      tabsHeader.querySelectorAll('.inv-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          tabsHeader.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.invFilter = btn.getAttribute('data-filter');
          this.renderInventory();
        });
      });
    }

    invContainer.innerHTML = '';

    const filteredItems = this.inventory.filter(skinId => {
      const skin = this.skins[skinId];
      if (!skin) return false;
      if (this.invFilter === 'ALL') return true;
      return skin.type === this.invFilter;
    });

    if (filteredItems.length === 0) {
      invContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px; font-weight: 700;">No items found in this category. Open crates to collect!</div>`;
      return;
    }

    filteredItems.forEach(skinId => {
      const skin = this.skins[skinId];
      if (!skin) return;

      const isEquipped = (skin.type === 'SNIPER' && this.equippedSniper === skinId) ||
                         (skin.type === 'KNIFE' && this.equippedKnife === skinId) ||
                         (skin.type === 'SKIN' && this.equippedSkin === skinId);

      const typeLabel = skin.type === 'SKIN' ? 'OPERATOR' : (skin.type === 'SNIPER' ? 'SNIPER' : 'KNIFE');
      const icon = skin.icon || (skin.type === 'SNIPER' ? '🎯' : (skin.type === 'KNIFE' ? '🗡️' : '👤'));

      const item = document.createElement('div');
      item.className = `inventory-item rarity-${skin.rarity}`;
      item.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 2px;">${icon}</div>
        <div class="inv-name" style="color: ${skin.color};">${skin.name}</div>
        <div class="inv-type">${typeLabel} • ${skin.rarity.toUpperCase()}</div>
        <div class="inv-btn-row">
          <button class="inv-equip-btn ${isEquipped ? 'equipped' : ''}">
            ${isEquipped ? 'EQUIPPED' : 'EQUIP'}
          </button>
          <button class="inv-preview-btn">👁️ PREVIEW</button>
        </div>
      `;

      const btnEquip = item.querySelector('.inv-equip-btn');
      const handleEquip = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.equipSkin(skinId);
        this.renderInventory();
      };
      btnEquip.addEventListener('click', handleEquip);
      btnEquip.addEventListener('touchend', handleEquip, { passive: false });

      const btnPreview = item.querySelector('.inv-preview-btn');
      const handlePreview = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.openPreview(skinId);
      };
      btnPreview.addEventListener('click', handlePreview);
      btnPreview.addEventListener('touchend', handlePreview, { passive: false });

      invContainer.appendChild(item);
    });
  }

  equipSkin(skinId) {
    const skin = this.skins[skinId];
    if (!skin) return;

    if (skin.type === 'SNIPER') {
      this.equippedSniper = skinId;
      if (this.weaponSystem && this.weaponSystem.applySniperSkin) {
        this.weaponSystem.applySniperSkin(skin);
      }
    } else if (skin.type === 'KNIFE') {
      this.equippedKnife = skinId;
      if (this.weaponSystem && this.weaponSystem.applyKnifeSkin) {
        this.weaponSystem.applyKnifeSkin(skin);
      }
    } else if (skin.type === 'SKIN') {
      this.equippedSkin = skinId;
      if (this.onSkinEquipped) {
        this.onSkinEquipped(skin);
      }
    }
    this.saveProfile();
  }

  // ==========================================
  // 3D INTERACTIVE ITEM PREVIEW SYSTEM
  // ==========================================

  initPreviewModal() {
    if (document.getElementById('item-preview-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'item-preview-modal';
    modal.innerHTML = `
      <div class="preview-window">
        <div class="preview-header">
          <div class="preview-title-wrap">
            <span id="preview-item-icon" style="font-size: 26px;">🎯</span>
            <div>
              <div id="preview-item-name" class="preview-item-name">ITEM NAME</div>
              <span id="preview-item-badge" class="preview-item-badge">COMMON</span>
            </div>
          </div>
          <button id="preview-close-btn" class="preview-close-btn" title="Close Preview">&times;</button>
        </div>

        <div class="preview-body">
          <div class="preview-viewport-box" id="preview-viewport-box">
            <canvas id="preview-three-canvas"></canvas>
            <div class="preview-hint">🖱️ Drag to rotate 360° • Scroll to zoom</div>
          </div>

          <div class="preview-sidebar">
            <div class="preview-meta">
              <div class="preview-meta-row">
                <span class="preview-meta-label">ITEM TYPE</span>
                <span id="preview-category-val" class="preview-meta-value">OPERATOR SKIN</span>
              </div>
              <div class="preview-meta-row">
                <span class="preview-meta-label">RARITY TIER</span>
                <span id="preview-rarity-val" class="preview-meta-value">LEGENDARY</span>
              </div>
              <div class="preview-meta-row">
                <span class="preview-meta-label">STATUS</span>
                <span id="preview-ownership-val" class="preview-meta-value" style="color: #00ffcc;">UNLOCKED ✓</span>
              </div>
              <div class="preview-desc-text" id="preview-desc-text">
                Description goes here.
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button id="preview-equip-action-btn" class="preview-action-btn equip">EQUIP ITEM</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('preview-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePreview();
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closePreview();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.closePreview();
      }
    });

    this.initPreviewThreeScene();
  }

  initPreviewThreeScene() {
    const canvas = document.getElementById('preview-three-canvas');
    const container = document.getElementById('preview-viewport-box');
    if (!canvas || !container) return;

    this.previewScene = new THREE.Scene();

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 480;

    this.previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.previewCamera.position.set(0, 1.1, 3.8);

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.previewRenderer.setSize(width, height);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.previewScene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 6, 5);
    this.previewScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 1.3);
    rimLight.position.set(-4, 3, -4);
    this.previewScene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffaa55, 0.6);
    fillLight.position.set(0, -3, 3);
    this.previewScene.add(fillLight);

    // Studio Hologram Pedestal Disc
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.08, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.15
    });
    this.previewPedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    this.previewPedestal.position.y = -0.95;
    this.previewScene.add(this.previewPedestal);

    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.9;
    this.previewScene.add(ring);

    // Group that holds the inspected item
    this.previewModelGroup = new THREE.Group();
    this.previewScene.add(this.previewModelGroup);

    // Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    this.previewYaw = 0;
    this.previewPitch = 0;
    this.previewTargetDistance = 3.8;

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      this.previewYaw += dx * 0.012;
      this.previewPitch = Math.max(-0.6, Math.min(0.6, this.previewPitch + dy * 0.012));
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch controls for mobile preview
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - prevMouseX;
      const dy = e.touches[0].clientY - prevMouseY;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      this.previewYaw += dx * 0.015;
      this.previewPitch = Math.max(-0.6, Math.min(0.6, this.previewPitch + dy * 0.015));
    }, { passive: false });

    container.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Scroll to zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.previewTargetDistance = Math.max(1.8, Math.min(6.5, this.previewTargetDistance + e.deltaY * 0.004));
    }, { passive: false });

    // Render loop
    const renderPreview = () => {
      requestAnimationFrame(renderPreview);
      const modal = document.getElementById('item-preview-modal');
      if (!modal || modal.style.display !== 'flex') return;

      if (!isDragging) {
        this.previewYaw += 0.005;
      }

      this.previewModelGroup.rotation.y = this.previewYaw;
      this.previewModelGroup.rotation.x = this.previewPitch;

      this.previewCamera.position.z = THREE.MathUtils.lerp(this.previewCamera.position.z, this.previewTargetDistance, 0.1);

      this.previewRenderer.render(this.previewScene, this.previewCamera);
    };
    renderPreview();
  }

  openPreview(itemId) {
    this.initPreviewModal();
    const skin = this.skins[itemId];
    if (!skin) return;

    this.currentPreviewItemId = itemId;

    // Clear previous model
    while (this.previewModelGroup.children.length > 0) {
      const child = this.previewModelGroup.children[0];
      this.previewModelGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    this.previewYaw = 0;
    this.previewPitch = 0;

    // Instantiate appropriate 3D model
    if (skin.type === 'SNIPER') {
      const sniperModel = AssetLoader.createProceduralSniper(skin);
      sniperModel.scale.set(1.4, 1.4, 1.4);
      sniperModel.position.set(0, 0, 0);
      sniperModel.rotation.set(0, -Math.PI / 4, 0);
      this.previewModelGroup.add(sniperModel);
      this.previewCamera.position.set(0, 0.35, 3.2);
      this.previewTargetDistance = 3.2;
      this.previewPedestal.visible = false;
    } else if (skin.type === 'KNIFE') {
      const knifeModel = AssetLoader.createProceduralKnife(skin);
      knifeModel.scale.set(2.8, 2.8, 2.8);
      knifeModel.position.set(0, 0, 0);
      knifeModel.rotation.set(0, 0, Math.PI / 6);
      this.previewModelGroup.add(knifeModel);
      this.previewCamera.position.set(0, 0.25, 2.4);
      this.previewTargetDistance = 2.4;
      this.previewPedestal.visible = false;
    } else if (skin.type === 'SKIN') {
      const playerModel = AssetLoader.createRobloxCharacter(skin);
      playerModel.scale.set(1.15, 1.15, 1.15);
      playerModel.position.set(0, -0.9, 0);
      this.previewModelGroup.add(playerModel);
      this.previewCamera.position.set(0, 0.6, 4.0);
      this.previewTargetDistance = 4.0;
      this.previewPedestal.visible = true;
    }

    // Update UI elements
    const nameEl = document.getElementById('preview-item-name');
    const badgeEl = document.getElementById('preview-item-badge');
    const iconEl = document.getElementById('preview-item-icon');
    const catEl = document.getElementById('preview-category-val');
    const rarityEl = document.getElementById('preview-rarity-val');
    const ownerEl = document.getElementById('preview-ownership-val');
    const descEl = document.getElementById('preview-desc-text');
    const equipBtn = document.getElementById('preview-equip-action-btn');

    if (nameEl) {
      nameEl.textContent = skin.name;
      nameEl.style.color = skin.color || '#fff';
    }
    if (badgeEl) {
      badgeEl.textContent = skin.rarity.toUpperCase();
      badgeEl.style.backgroundColor = `${skin.color}33`;
      badgeEl.style.color = skin.color;
      badgeEl.style.border = `1px solid ${skin.color}`;
    }
    if (iconEl) {
      iconEl.textContent = skin.icon || (skin.type === 'SNIPER' ? '🎯' : (skin.type === 'KNIFE' ? '🗡️' : '👤'));
    }
    if (catEl) {
      catEl.textContent = skin.type === 'SKIN' ? 'OPERATOR SKIN' : (skin.type === 'SNIPER' ? 'SNIPER RIFLE' : 'TACTICAL KNIFE');
    }
    if (rarityEl) {
      rarityEl.textContent = skin.rarity.toUpperCase();
      rarityEl.style.color = skin.color;
    }
    if (descEl) {
      descEl.textContent = skin.desc || 'High-performance combat equipment forged for competitive duels.';
    }

    const isOwned = this.inventory.includes(itemId);
    const isEquipped = (skin.type === 'SNIPER' && this.equippedSniper === itemId) ||
                       (skin.type === 'KNIFE' && this.equippedKnife === itemId) ||
                       (skin.type === 'SKIN' && this.equippedSkin === itemId);

    if (ownerEl) {
      ownerEl.textContent = isOwned ? 'UNLOCKED ✓' : 'LOCKED 🔒';
      ownerEl.style.color = isOwned ? '#00ffcc' : '#ff4444';
    }

    if (equipBtn) {
      if (isEquipped) {
        equipBtn.textContent = 'CURRENTLY EQUIPPED ✓';
        equipBtn.className = 'preview-action-btn equipped';
        equipBtn.disabled = true;
      } else if (isOwned) {
        equipBtn.textContent = 'EQUIP THIS ITEM';
        equipBtn.className = 'preview-action-btn equip';
        equipBtn.disabled = false;
        equipBtn.onclick = (e) => {
          e.stopPropagation();
          this.equipSkin(itemId);
          this.openPreview(itemId);
          this.renderInventory();
        };
      } else {
        equipBtn.textContent = 'LOCKED • UNBOX IN SHOP';
        equipBtn.className = 'preview-action-btn locked';
        equipBtn.disabled = false;
        equipBtn.onclick = (e) => {
          e.stopPropagation();
          this.closePreview();
          this.openShopModal();
        };
      }
    }

    const modal = document.getElementById('item-preview-modal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => {
        const container = document.getElementById('preview-viewport-box');
        if (container && this.previewRenderer && this.previewCamera) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          this.previewCamera.aspect = w / h;
          this.previewCamera.updateProjectionMatrix();
          this.previewRenderer.setSize(w, h);
        }
      }, 50);
    }
  }

  closePreview() {
    const modal = document.getElementById('item-preview-modal');
    if (modal) modal.style.display = 'none';
  }

  // Horizontal CS:GO / Roblox unboxing carousel animation
  startUnbox(caseItem) {
    if (this.coins < caseItem.cost || this.isUnboxing) return;

    this.isUnboxing = true;
    this.addCoins(-caseItem.cost);
    this.renderShopCases();

    const rouletteOverlay = document.getElementById('roulette-overlay');
    const strip = document.getElementById('roulette-strip');
    const rewardModal = document.getElementById('reward-modal');

    rouletteOverlay.style.display = 'flex';
    strip.innerHTML = '';
    strip.style.transform = 'translateX(0px)';

    // Pick winning item based on rarity weights
    const winningSkinId = this.pickRandomSkinFromPool(caseItem.pool);
    const winningSkin = this.skins[winningSkinId];

    // Generate 60 cards for the spinning roulette strip
    const totalCards = 60;
    const winnerIndex = 48;
    const cardWidth = 140;

    for (let i = 0; i < totalCards; i++) {
      const sId = (i === winnerIndex) ? winningSkinId : caseItem.pool[Math.floor(Math.random() * caseItem.pool.length)];
      const skin = this.skins[sId];
      const icon = skin.icon || (skin.type === 'SNIPER' ? '🎯' : (skin.type === 'KNIFE' ? '🗡️' : '👤'));

      const card = document.createElement('div');
      card.className = `roulette-card rarity-${skin.rarity}`;
      card.innerHTML = `
        <div class="card-bar" style="background: ${skin.color}"></div>
        <div class="card-icon">${icon}</div>
        <div class="card-title" style="color: ${skin.color};">${skin.name}</div>
        <div class="card-rarity">${skin.rarity.toUpperCase()}</div>
      `;
      strip.appendChild(card);
    }

    // Play ticking audio as it rolls
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      this.audio.playCrateTick();
      tickCount++;
      if (tickCount > 35) clearInterval(tickInterval);
    }, 110);

    // Calculate exact stopping pixel position so the winner card lands in the center needle
    const centerOffset = rouletteOverlay.clientWidth / 2;
    const targetOffset = -(winnerIndex * cardWidth + cardWidth / 2 - centerOffset) + (Math.random() * 60 - 30);

    setTimeout(() => {
      strip.style.transition = 'transform 4.5s cubic-bezier(0.12, 0.8, 0.25, 1)';
      strip.style.transform = `translateX(${targetOffset}px)`;
    }, 50);

    // On finish rolling
    setTimeout(() => {
      this.isUnboxing = false;
      this.inventory.push(winningSkinId);
      this.saveProfile();

      this.audio.playUnlockFanfare(winningSkin.rarity);

      // Display Reward Modal
      rewardModal.style.display = 'flex';
      const rewardContent = document.getElementById('reward-content');
      const icon = winningSkin.icon || (winningSkin.type === 'SNIPER' ? '🎯' : (winningSkin.type === 'KNIFE' ? '🗡️' : '👤'));
      const catLabel = winningSkin.type === 'SKIN' ? 'OPERATOR SKIN' : (winningSkin.type === 'SNIPER' ? 'SNIPER RIFLE' : 'TACTICAL KNIFE');

      rewardContent.innerHTML = `
        <div class="reward-glow" style="box-shadow: 0 0 60px ${winningSkin.color};"></div>
        <div style="font-size: 42px; margin-bottom: 8px;">${icon}</div>
        <h2 style="color: ${winningSkin.color};">${winningSkin.name}</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 12px 0;">${catLabel} • <strong style="color: ${winningSkin.color}; text-transform: uppercase;">${winningSkin.rarity}</strong></p>
        <div style="display: flex; gap: 8px; width: 100%;">
          <button id="reward-equip-btn" class="case-open-btn" style="flex: 1;">EQUIP NOW</button>
          <button id="reward-preview-btn" class="case-open-btn" style="flex: 1; background: #252e3e; border: 1px solid #00d2ff88; color: #00d2ff;">3D PREVIEW 👁️</button>
        </div>
        <button id="reward-close-btn" class="case-open-btn" style="background: #334155; margin-top: 8px;">CLOSE</button>
      `;

      const equipBtn = document.getElementById('reward-equip-btn');
      const previewBtn = document.getElementById('reward-preview-btn');
      const closeBtn = document.getElementById('reward-close-btn');

      const handleRewardEquip = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        this.equipSkin(winningSkinId);
        rewardModal.style.display = 'none';
        rouletteOverlay.style.display = 'none';
        this.renderInventory();
        this.renderShopCases();
      };

      const handleRewardPreview = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        rewardModal.style.display = 'none';
        rouletteOverlay.style.display = 'none';
        this.openPreview(winningSkinId);
      };

      const handleRewardClose = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        rewardModal.style.display = 'none';
        rouletteOverlay.style.display = 'none';
        this.renderShopCases();
      };

      if (equipBtn) {
        equipBtn.onclick = handleRewardEquip;
        equipBtn.addEventListener('touchend', handleRewardEquip, { passive: false });
      }
      if (previewBtn) {
        previewBtn.onclick = handleRewardPreview;
        previewBtn.addEventListener('touchend', handleRewardPreview, { passive: false });
      }
      if (closeBtn) {
        closeBtn.onclick = handleRewardClose;
        closeBtn.addEventListener('touchend', handleRewardClose, { passive: false });
      }
    }, 4800);
  }

  pickRandomSkinFromPool(pool) {
    const rand = Math.random();
    // Probabilities: Common: 45%, Uncommon: 30%, Rare: 15%, Epic: 7%, Legendary: 3%
    const weights = {
      common: 0.45,
      uncommon: 0.30,
      rare: 0.15,
      epic: 0.07,
      legendary: 0.03
    };

    const skinsByRarity = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };
    pool.forEach(id => {
      const s = this.skins[id];
      if (s && skinsByRarity[s.rarity]) skinsByRarity[s.rarity].push(id);
    });

    let cumulative = 0;
    const sortedRarities = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    for (const r of sortedRarities) {
      cumulative += weights[r];
      if (rand <= cumulative && skinsByRarity[r].length > 0) {
        return skinsByRarity[r][Math.floor(Math.random() * skinsByRarity[r].length)];
      }
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
