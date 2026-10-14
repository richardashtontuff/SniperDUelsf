// MultiplayerClient.js - Real-Time 60Hz WebSocket Network Sync Client
import * as THREE from '../vendor/three/three.module.js';
import { AssetLoader } from './AssetLoader.js';

export class MultiplayerClient {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.ws = null;
    this.isConnected = false;
    this.localPlayerId = null;
    this.username = (typeof window !== 'undefined' && window.__currentUser) ? window.__currentUser : null;
    this.opponentUsername = null;
    this.localTeam = 'BLUE';
    this.remotePlayers = new Map(); // id -> { id, group, head, torso, leftArm, rightArm, leftLeg, rightLeg, heldWeapon, targetPos, targetRot, username }
    this.currentMatchId = null;
    this.currentOpponentId = null;
    this.isTwoPlayerMatch = false;
    this.voteInterval = null;

    this.syncInterval = null;
    this.initVoteUI();
    this.setupChat();
    this.connect();
  }

  get myId() {
    return this.localPlayerId;
  }

  setUsername(username) {
    this.username = username || null;
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN && this.username) {
      this.ws.send(JSON.stringify({
        type: 'SET_USERNAME',
        username: this.username
      }));
    }
  }

  initVoteUI() {
    const cards = document.querySelectorAll('.vote-card');
    cards.forEach(card => {
      const handleVote = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.currentMatchId) return;
        const mapName = card.dataset.vote;
        this.castVote(mapName);
      };
      card.addEventListener('click', handleVote);
      card.addEventListener('touchend', handleVote, { passive: false });
    });
  }

  showMapVoting(duration = 10) {
    const overlay = document.getElementById('map-vote-overlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();

    // Reset cards and badges
    document.querySelectorAll('.vote-card').forEach(c => {
      c.classList.remove('voted', 'winner');
    });
    ['blockout', 'poolday', 'rooftop'].forEach(m => {
      const b = document.getElementById(`vote-badge-${m}`);
      if (b) b.textContent = '0 VOTES';
    });

    const statusText = document.getElementById('vote-status-text');
    if (statusText) statusText.textContent = 'Pick your arena! Most votes wins • Random on tie';

    let timeLeft = duration;
    const timerText = document.getElementById('vote-timer-text');
    if (timerText) timerText.textContent = `TIME: ${timeLeft}s`;

    if (this.voteInterval) clearInterval(this.voteInterval);
    this.voteInterval = setInterval(() => {
      timeLeft--;
      if (timerText) timerText.textContent = `TIME: ${Math.max(0, timeLeft)}s`;
      if (timeLeft <= 0) {
        clearInterval(this.voteInterval);
        this.voteInterval = null;
      }
    }, 1000);
  }

  castVote(mapName) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.currentMatchId) return;

    // Highlight card
    document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('voted'));
    const selectedCard = document.getElementById(`vote-card-${mapName}`);
    if (selectedCard) selectedCard.classList.add('voted');

    const statusText = document.getElementById('vote-status-text');
    if (statusText) statusText.textContent = `YOU VOTED FOR ${mapName.toUpperCase()} ✓ • WAITING FOR OPPONENT...`;

    this.ws.send(JSON.stringify({
      type: 'VOTE_MAP',
      matchId: this.currentMatchId,
      mapName: mapName
    }));
  }

  connect() {
    if (!location.host || location.protocol === 'file:' || location.origin === 'null') {
      console.info('[MultiplayerClient] Standalone/Offline mode active.');
      return;
    }
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[MultiplayerClient] Connected to WebSocket Game Server!');
        if (this.username || (typeof window !== 'undefined' && window.__currentUser)) {
          this.setUsername(this.username || window.__currentUser);
        }
        this.startTransformSync();
        this.updateHUDOnlineStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.warn('[MultiplayerClient] Bad message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.updateHUDOnlineStatus(false);
        if (this.syncInterval) clearInterval(this.syncInterval);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.updateHUDOnlineStatus(false);
      };
    } catch (err) {
      console.info('[MultiplayerClient] Running in Solo Offline / Local Bot mode.');
    }
  }

  updateHUDOnlineStatus(online) {
    const banner = document.getElementById('match-status-banner');
    if (online) {
      console.log('[Multiplayer] Real-time multiplayer synchronization active.');
    }
  }

  startTransformSync() {
    // 60Hz state sync
    this.syncInterval = setInterval(() => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const pos = this.game.controls.getPosition();
      const payload = {
        type: 'SYNC_TRANSFORM',
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { y: this.game.controls.yaw, pitch: this.game.controls.pitch },
        slot: this.game.weaponSystem.currentSlot,
        skin: this.game.caseSystem ? this.game.caseSystem.equippedSkin : 'skin_agent_tactical',
        isAiming: this.game.weaponSystem.isAiming,
        isSliding: this.game.controls.isSliding
      };

      this.ws.send(JSON.stringify(payload));
    }, 1000 / 60);
  }

  stepOnQueuePad() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'QUEUE_PAD_ENTER' }));
  }

  stepOffQueuePad() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'QUEUE_PAD_LEAVE' }));
  }

  sendFireWeapon(origin, direction, spread, isAiming, weaponType) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'FIRE_WEAPON',
      origin: { x: origin.x, y: origin.y, z: origin.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      spread: spread,
      isAiming: isAiming,
      weaponType: weaponType
    }));
  }

  sendInflictDamage(targetId, damage, isHeadshot, impulse = null, weaponType = 'BULLET', launcherId = null) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!targetId || targetId === this.myId) return; // Prevent any self-damage reflection
    this.ws.send(JSON.stringify({
      type: 'INFLICT_DAMAGE',
      targetId: targetId,
      damage: damage,
      isHeadshot: isHeadshot,
      impulse: impulse ? { x: impulse.x, y: impulse.y, z: impulse.z } : null,
      weaponType: weaponType,
      launcherId: launcherId || this.myId
    }));
  }

  sendMatchExit(reason = 'FORFEIT') {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'MATCH_EXIT',
      reason: reason
    }));
    this.isTwoPlayerMatch = false;
    this.currentMatchId = null;
    this.currentOpponentId = null;
    if (this.voteInterval) {
      clearInterval(this.voteInterval);
      this.voteInterval = null;
    }
    const voteOverlay = document.getElementById('map-vote-overlay');
    if (voteOverlay) voteOverlay.style.display = 'none';
  }

  createRemotePlayer(pInfo) {
    if (this.remotePlayers.has(pInfo.id)) return;

    let skinConfig = null;
    if (pInfo.skin && this.game.caseSystem && this.game.caseSystem.skins[pInfo.skin]) {
      skinConfig = this.game.caseSystem.skins[pInfo.skin];
    } else {
      const shirtColor = (pInfo.team === 'RED') ? 0xff4444 : 0x00d2ff;
      skinConfig = { shirtColor, pantsColor: 0x22262d, skinColor: 0xffd200 };
    }

    const model = AssetLoader.createRobloxCharacter(skinConfig);

    model.position.set(pInfo.position.x, pInfo.position.y, pInfo.position.z);
    model.rotation.y = pInfo.rotation ? pInfo.rotation.y : 0;

    // Tag hitboxes for raycasting
    model.userData.head.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: true };
    model.userData.torso.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: false };
    model.userData.leftArm.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: false };
    model.userData.rightArm.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: false };
    model.userData.leftLeg.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: false };
    model.userData.rightLeg.userData = { isRemotePlayer: true, playerId: pInfo.id, isHeadshot: false };

    this.game.worldScene.add(model);

    this.remotePlayers.set(pInfo.id, {
      id: pInfo.id,
      username: pInfo.username || null,
      currentSkin: pInfo.skin || null,
      group: model,
      head: model.userData.head,
      torso: model.userData.torso,
      leftArm: model.userData.leftArm,
      rightArm: model.userData.rightArm,
      leftLeg: model.userData.leftLeg,
      rightLeg: model.userData.rightLeg,
      heldWeapon: model.userData.heldWeapon,
      targetPos: new THREE.Vector3(pInfo.position.x, pInfo.position.y, pInfo.position.z),
      targetYaw: pInfo.rotation ? pInfo.rotation.y : 0
    });
  }

  removeRemotePlayer(playerId) {
    if (this.remotePlayers.has(playerId)) {
      const rp = this.remotePlayers.get(playerId);
      this.game.worldScene.remove(rp.group);
      this.remotePlayers.delete(playerId);
    }
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case 'INIT':
        this.localPlayerId = msg.playerId;
        console.log(`[Multiplayer] Assigned ID: ${this.localPlayerId}`);
        if (this.username || (typeof window !== 'undefined' && window.__currentUser)) {
          this.setUsername(this.username || window.__currentUser);
        }
        const initOnline = document.getElementById('online-count');
        const initQueue = document.getElementById('queue-count');
        if (initOnline && msg.playerCount) initOnline.textContent = msg.playerCount;
        if (initQueue && msg.queueCount !== undefined) initQueue.textContent = msg.queueCount;
        break;

      case 'SERVER_STATS':
        const elOnline = document.getElementById('online-count');
        const elQueue = document.getElementById('queue-count');
        if (elOnline && msg.onlinePlayers !== undefined) elOnline.textContent = msg.onlinePlayers;
        if (elQueue && msg.queuePlayers !== undefined) elQueue.textContent = msg.queuePlayers;
        break;

      case 'PLAYER_JOINED':
        if (msg.player.id !== this.localPlayerId) {
          this.createRemotePlayer(msg.player);
        }
        break;

      case 'PLAYER_NAME_UPDATE':
        if (msg.id === this.currentOpponentId) {
          this.opponentUsername = msg.username;
          if (this.game.matchManager) {
            this.game.matchManager.opponentUsername = msg.username;
          }
        }
        if (this.remotePlayers.has(msg.id)) {
          this.remotePlayers.get(msg.id).username = msg.username;
        }
        break;

      case 'PLAYER_LEFT':
        this.removeRemotePlayer(msg.playerId);
        break;

      case 'CHAT_HISTORY':
        const boxHist = document.getElementById('chat-messages');
        if (boxHist) {
          boxHist.innerHTML = '';
          if (Array.isArray(msg.messages)) {
            msg.messages.forEach(m => this.appendChatMessage(m));
          }
        }
        break;

      case 'CHAT_MESSAGE':
        if (msg.message) {
          this.appendChatMessage(msg.message);
        }
        break;

      case 'QUEUE_UPDATE':
        const elQ = document.getElementById('queue-count');
        if (elQ && msg.playersOnPad !== undefined) elQ.textContent = msg.playersOnPad;
        // If local player is waiting on the middle queue pad, display queue progress
        if (this.game.matchManager && this.game.matchManager.activePad && this.game.matchManager.activePad.userData.mode === 'multiplayer_queue') {
          this.game.matchManager.updateStateBanner(msg.message, true, msg.playersOnPad >= 2 ? '#00ffcc' : '#f1c40f');
        }
        break;

      case 'PLAYER_TRANSFORM':
        // Auto-create remote player if model doesn't exist yet
        if (!this.remotePlayers.has(msg.id)) {
          this.createRemotePlayer({
            id: msg.id,
            team: 'BLUE',
            skin: msg.skin,
            position: msg.position,
            rotation: msg.rotation
          });
        }

        if (this.remotePlayers.has(msg.id)) {
          const rp = this.remotePlayers.get(msg.id);
          if (msg.skin && rp.currentSkin !== msg.skin && this.game.caseSystem && this.game.caseSystem.skins[msg.skin]) {
            const oldUser = rp.username;
            this.removeRemotePlayer(msg.id);
            this.createRemotePlayer({
              id: msg.id,
              username: oldUser,
              team: 'BLUE',
              skin: msg.skin,
              position: msg.position,
              rotation: msg.rotation
            });
            break;
          }
          rp.targetPos.set(msg.position.x, msg.position.y, msg.position.z);
          rp.targetYaw = msg.rotation.y;

          // Smoothly interpolate position and orientation
          rp.group.position.lerp(rp.targetPos, 0.4);
          rp.group.rotation.y = THREE.MathUtils.lerp(rp.group.rotation.y, rp.targetYaw, 0.4);

          // Animate running legs
          const isMoving = rp.group.position.distanceTo(rp.targetPos) > 0.05;
          const legAngle = isMoving ? Math.sin(Date.now() * 0.012) * 0.5 : 0;
          rp.leftLeg.rotation.x = legAngle;
          rp.rightLeg.rotation.x = -legAngle;

          // Sync weapon visibility
          if (rp.heldWeapon) {
            rp.heldWeapon.visible = (msg.slot === 'SNIPER');
          }
        }
        break;

      case 'MAP_VOTE_START':
        this.currentMatchId = msg.matchId;
        this.currentOpponentId = msg.opponentId;
        this.opponentUsername = msg.opponentUsername || msg.opponentId;
        this.myTeam = msg.myTeam;
        this.opponentTeam = msg.opponentTeam;
        if (this.game.matchManager) {
          this.game.matchManager.opponentUsername = this.opponentUsername;
        }
        console.log(`[Multiplayer] Map vote started for match ${this.currentMatchId} vs ${this.opponentUsername}`);
        this.showMapVoting(msg.duration || 10);
        break;

      case 'VOTE_UPDATE':
        if (msg.votes) {
          for (const [m, count] of Object.entries(msg.votes)) {
            const b = document.getElementById(`vote-badge-${m}`);
            if (b) b.textContent = `${count} VOTE${count === 1 ? '' : 'S'}`;
          }
        }
        break;

      case 'MATCH_START_2P':
        this.currentMatchId = msg.matchId;
        this.currentRoomIndex = msg.roomIndex || 1;
        this.currentArenaOffset = msg.arenaOffset || { x: 0, y: 0, z: 0 };
        this.currentOpponentId = msg.opponentId;
        this.opponentUsername = msg.opponentUsername || msg.opponentId;
        this.isTwoPlayerMatch = true;
        if (this.game.matchManager) {
          this.game.matchManager.opponentUsername = this.opponentUsername;
          this.game.matchManager.roomIndex = this.currentRoomIndex;
        }
        console.log(`[Matchmaking] 2-Player Match starting in Dedicated Room #${this.currentRoomIndex} (Offset X: ${this.currentArenaOffset.x}) against ${this.opponentUsername}! Team: ${msg.myTeam}, Arena: ${msg.selectedMap}`);

        if (this.voteInterval) {
          clearInterval(this.voteInterval);
          this.voteInterval = null;
        }

        // Clean up any non-opponent remote players so our room is pristine
        for (const [id, rp] of this.remotePlayers.entries()) {
          if (id !== msg.opponentId) {
            this.removeRemotePlayer(id);
          }
        }

        const chosenMap = msg.selectedMap || 'blockout';
        const winnerCard = document.getElementById(`vote-card-${chosenMap}`);
        if (winnerCard) winnerCard.classList.add('winner');

        const statusText = document.getElementById('vote-status-text');
        if (statusText) {
          statusText.textContent = msg.wasTie ?
            `TIEBREAKER! RANDOMLY SELECTED: ${chosenMap.toUpperCase()}` :
            `WINNER: ${chosenMap.toUpperCase()} (MOST VOTES)`;
        }

        setTimeout(() => {
          const overlay = document.getElementById('map-vote-overlay');
          if (overlay) overlay.style.display = 'none';

          // Load the chosen arena in our DEDICATED ROOM!
          this.game.map.loadArena(chosenMap, this.currentArenaOffset);

          // Ensure opponent model is spawned at the dedicated room position
          const oppSpawnZ = (msg.opponentTeam === 'RED' ? -25 : 55);
          if (!this.remotePlayers.has(msg.opponentId)) {
            this.createRemotePlayer({
              id: msg.opponentId,
              username: this.opponentUsername,
              team: msg.opponentTeam,
              position: {
                x: this.currentArenaOffset.x + 0,
                y: 2.55,
                z: this.currentArenaOffset.z + oppSpawnZ
              }
            });
          }

          // Delegate to match manager to start 2-player duel!
          this.game.matchManager.startTwoPlayerMatch(
            msg.myTeam,
            msg.opponentId,
            chosenMap,
            msg.maxScore,
            this.opponentUsername,
            this.currentRoomIndex
          );
        }, 1200);
        break;

      case 'REMOTE_FIRE':
        // Render remote player tracer and gunshot audio based on weapon type
        if (msg.weaponType === 'AR') {
          this.game.audio.playARRifleShot();
        } else if (msg.weaponType === 'RPG') {
          this.game.audio.playRPGLaunch();
          if (this.game.spawnRemoteRocket) {
            const start = new THREE.Vector3(msg.origin.x, msg.origin.y, msg.origin.z);
            const dir = new THREE.Vector3(msg.direction.x, msg.direction.y, msg.direction.z);
            this.game.spawnRemoteRocket(start, dir);
          }
          break;
        } else {
          this.game.audio.playSniperShot();
        }
        const start = new THREE.Vector3(msg.origin.x, msg.origin.y, msg.origin.z);
        const dir = new THREE.Vector3(msg.direction.x, msg.direction.y, msg.direction.z);
        const end = start.clone().addScaledVector(dir, 150);
        this.game.particles.addTracer(start, end);
        break;

      case 'DAMAGE_TAKEN':
        // Local player took damage from opponent
        this.game.matchManager.onPlayerDamaged(msg.damage, msg.isHeadshot, msg.weaponType || 'SNIPER');
        if (msg.impulse && this.game.controls && this.game.controls.applyImpulse) {
          this.game.controls.applyImpulse(new THREE.Vector3(msg.impulse.x, msg.impulse.y, msg.impulse.z));
        }
        break;

      case 'HIT_CONFIRMED':
        // Local player shot the opponent
        this.game.audio.playHitmarker(msg.isHeadshot);
        this.game.matchManager.showHitmarker(msg.isHeadshot);
        this.game.matchManager.showDamageNumber(msg.damage, msg.isHeadshot);
        break;

      case 'ROUND_OVER':
        // Multi-round match: advance round and show intermission
        this.game.matchManager.onTwoPlayerRoundOver(msg);
        break;

      case 'MATCH_OVER':
        this.isTwoPlayerMatch = false;
        this.currentMatchId = null;
        this.currentOpponentId = null;

        if (this.voteInterval) {
          clearInterval(this.voteInterval);
          this.voteInterval = null;
        }
        const voteOverlay = document.getElementById('map-vote-overlay');
        if (voteOverlay) voteOverlay.style.display = 'none';

        if (msg.scores) {
          this.game.matchManager.scorePlayer = msg.scores.blue;
          this.game.matchManager.scoreBot = msg.scores.red;
          this.game.matchManager.updateHUDScore();
        }

        if (msg.reason === 'OPPONENT_DISCONNECTED' || msg.reason === 'OPPONENT_QUIT' || msg.reason === 'UNFOCUSED' || msg.reason === 'FORFEIT') {
          this.game.matchManager.triggerMatchVictory('OPPONENT_QUIT', msg.winnerUsername, msg.loserUsername, msg.reason);
        } else if (msg.isWinner) {
          this.game.matchManager.triggerMatchVictory('YOU', msg.winnerUsername, msg.loserUsername);
        } else {
          this.game.matchManager.triggerMatchVictory('OPPONENT', msg.winnerUsername, msg.loserUsername);
        }
        break;
    }
  }

  setupChat() {
    if (typeof document === 'undefined') return;

    const container = document.getElementById('chatroom-container');
    const openBtn = document.getElementById('chat-open-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    if (closeBtn && container && openBtn) {
      const handleClose = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        container.style.display = 'none';
        openBtn.style.display = 'block';
        if (input) input.blur();
      };
      closeBtn.addEventListener('click', handleClose);
      closeBtn.addEventListener('touchend', handleClose, { passive: false });
    }

    if (openBtn && container) {
      const handleOpen = (e) => {
        if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
        container.style.display = 'flex';
        openBtn.style.display = 'none';
        if (input) input.focus();
      };
      openBtn.addEventListener('click', handleOpen);
      openBtn.addEventListener('touchend', handleOpen, { passive: false });
    }

    const sendMessage = () => {
      if (!input) return;
      const text = input.value.trim().slice(0, 200);
      if (text.length === 0) return;
      this.sendChatMessage(text);
      input.value = '';
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendMessage();
      });
    }

    // Stop keyboard movement and weapon switching while typing in chat
    if (input) {
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        } else if (e.key === 'Escape') {
          input.blur();
        }
      });
      input.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });
      input.addEventListener('focus', () => {
        try { document.exitPointerLock(); } catch (err) {}
      });
    }

    // Quick focus chat on pressing '/' when not typing
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input) {
        if (container && container.style.display === 'none') {
          container.style.display = 'flex';
          if (openBtn) openBtn.style.display = 'none';
        }
        e.preventDefault();
        try { document.exitPointerLock(); } catch (err) {}
        if (input) input.focus();
      }
    });
  }

  sendChatMessage(text) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'SEND_CHAT',
      text: text.slice(0, 200)
    }));
  }

  appendChatMessage(msg) {
    const box = document.getElementById('chat-messages');
    if (!box) return;

    const row = document.createElement('div');
    row.className = 'chat-msg-row';

    const safeSender = (msg.senderName || 'Player').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeText = (msg.text || '').slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let timeStr = '';
    if (msg.timestamp) {
      const d = new Date(msg.timestamp);
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    row.innerHTML = `
      <span class="chat-msg-sender">[${safeSender}]:</span>
      <span class="chat-msg-text">${safeText}</span>
      ${timeStr ? `<span class="chat-msg-time">${timeStr}</span>` : ''}
    `;

    box.appendChild(row);

    // Auto-scroll to bottom
    box.scrollTop = box.scrollHeight;
  }
}
