// server.js - Full-Featured Real-Time WebSocket & Static Game Server for SNIPER DUELS
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Catch any unhandled database or async errors so the server never crashes
process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Unhandled rejection notice:', reason);
});
process.on('uncaughtException', (err) => {
  console.warn('[Server] Uncaught exception notice:', err.message);
});
let WebSocketServer = null;
try {
  WebSocketServer = require('./vendor/ws').WebSocketServer;
} catch (e1) {
  try {
    WebSocketServer = require('ws').WebSocketServer;
  } catch (e2) {
    console.warn('[Server] WebSocketServer not available:', e2.message);
  }
}

// ==========================================
// USER DATABASE (POSTGRESQL / MYSQL / LOCAL LOOKUP)
// ==========================================
const DB_FILE = path.join(__dirname, 'data', 'users.json');
let userLookupTable = {};

// Load existing lookup table from disk
try {
  if (fs.existsSync(DB_FILE)) {
    userLookupTable = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } else {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(userLookupTable, null, 2));
  }
} catch (e) {
  console.warn('[DB] Notice initializing user lookup file:', e.message);
}

function saveUserLookupTable() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(userLookupTable, null, 2));
  } catch (e) {
    console.warn('[DB] Notice saving user lookup table:', e.message);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(`sniper_duels_salt_${password}`).digest('hex');
}

// Database auto-detection: PostgreSQL, MySQL, or local lookup fallback
let pgPool = null;
let mysqlPool = null;

// Read Wasmer auto-generated variables (db_host, db_username, db_password, db_port, db_name)
const dbHost = process.env.DB_HOST || process.env.db_host || process.env.PGHOST || process.env.POSTGRES_HOST;
const dbUser = process.env.DB_USERNAME || process.env.db_username || process.env.DB_USER || process.env.db_user || process.env.PGUSER || process.env.POSTGRES_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.db_password || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
const dbName = process.env.DB_NAME || process.env.db_name || process.env.DB_DATABASE || process.env.db_database || process.env.PGDATABASE || process.env.POSTGRES_DB;
const dbPort = parseInt(process.env.DB_PORT || process.env.db_port || process.env.PGPORT || '5432', 10);

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.MYSQL_URL;
const isPostgres = (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) ||
                   Boolean(dbHost) || Boolean(process.env.PGHOST);
const isMysql = (dbUrl && dbUrl.startsWith('mysql://')) || Boolean(process.env.MYSQL_HOST);

if (isPostgres) {
  try {
    const { Pool } = require('pg');
    let poolConfig;

    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      poolConfig = {
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      };
    } else {
      poolConfig = {
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName || 'sniper_duels',
        port: Number(dbPort) || 5432,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      };
    }

    pgPool = new Pool(poolConfig);
    pgPool.on('error', (err) => {
      console.warn('[DB] PostgreSQL pool client notice (non-fatal):', err.message);
    });

    console.log(`[DB] Connecting to PostgreSQL database at ${dbHost || dbUrl || 'localhost'} on Wasmer...`);

    // Auto-create users table in PostgreSQL
    pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      console.log('[DB] ✓ PostgreSQL "users" table verified and active on Wasmer!');
    }).catch(err => {
      console.warn('[DB] PostgreSQL schema notice (using local lookup fallback):', err.message);
    });
  } catch (err) {
    console.log('[DB] Notice initializing PostgreSQL (using local lookup fallback):', err.message);
  }
} else if (isMysql) {
  try {
    const mysql = require('mysql2');
    const poolOptions = dbUrl || {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sniper_duels',
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000
    };

    mysqlPool = mysql.createPool(poolOptions);
    mysqlPool.on('error', (err) => {
      console.warn('[DB] MySQL pool notice (non-fatal):', err.message);
    });
    console.log('[DB] Connecting to MySQL database...');

    mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
      if (err) {
        console.warn('[DB] MySQL notice (using local lookup table fallback):', err.message);
      } else {
        console.log('[DB] ✓ MySQL "users" lookup table verified and active!');
      }
    });
  } catch (err) {
    console.log('[DB] Notice initializing MySQL (using local lookup table fallback):', err.message);
  }
}

async function registerUser(username, password) {
  const cleanUsername = username.trim();
  const lower = cleanUsername.toLowerCase();
  const passwordHash = hashPassword(password);

  if (userLookupTable[lower]) {
    return { success: false, message: 'Username already taken. Please choose another.' };
  }

  // PostgreSQL insertion
  if (pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        [cleanUsername, passwordHash]
      );
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return { success: false, message: 'Username already taken.' };
      }
      console.warn('[DB] PostgreSQL notice:', dbErr.message);
    }
  }

  // MySQL insertion
  if (mysqlPool) {
    try {
      await new Promise((resolve, reject) => {
        mysqlPool.query(
          'INSERT INTO users (username, password_hash) VALUES (?, ?)',
          [cleanUsername, passwordHash],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'Username already exists.' };
      }
      console.warn('[DB] MySQL notice:', dbErr.message);
    }
  }

  userLookupTable[lower] = {
    username: cleanUsername,
    passwordHash: passwordHash,
    createdAt: new Date().toISOString()
  };
  saveUserLookupTable();

  return { success: true, username: cleanUsername, message: 'Account created successfully!' };
}

async function authenticateUser(username, password) {
  const cleanUsername = username.trim();
  const lower = cleanUsername.toLowerCase();
  const passwordHash = hashPassword(password);

  // PostgreSQL authentication
  if (pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT username, password_hash FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
        [cleanUsername]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        if (row.password_hash === passwordHash) {
          return { success: true, username: row.username, message: 'Login successful!' };
        } else {
          return { success: false, message: 'Incorrect password.' };
        }
      }
    } catch (dbErr) {
      console.warn('[DB] PostgreSQL notice:', dbErr.message);
    }
  }

  // MySQL authentication
  if (mysqlPool) {
    try {
      const row = await new Promise((resolve, reject) => {
        mysqlPool.query(
          'SELECT username, password_hash FROM users WHERE LOWER(username) = ? LIMIT 1',
          [lower],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows[0]);
          }
        );
      });
      if (row) {
        if (row.password_hash === passwordHash) {
          return { success: true, username: row.username, message: 'Login successful!' };
        } else {
          return { success: false, message: 'Incorrect password.' };
        }
      }
    } catch (dbErr) {
      console.warn('[DB] MySQL notice:', dbErr.message);
    }
  }

  const record = userLookupTable[lower];
  if (!record) {
    return { success: false, message: 'Account not found. Please create one.' };
  }
  if (record.passwordHash !== passwordHash) {
    return { success: false, message: 'Incorrect password.' };
  }

  return { success: true, username: record.username, message: 'Login successful!' };
}

function readJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 5e5) req.destroy();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json'
};

// 1. Static HTTP Request Handler
function requestHandler(req, res) {
  let reqPath = req.url.split('?')[0];

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Cloud Healthchecks
  if (reqPath === '/health' || reqPath === '/healthz' || reqPath === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // REST API: User Registration
  if (reqPath === '/api/auth/register' && req.method === 'POST') {
    return readJsonBody(req, async (err, data) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (err || !data.username || !data.password) {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Username and password required.' }));
      }
      const username = String(data.username).trim();
      const password = String(data.password);
      if (username.length < 3 || username.length > 20) {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Username must be between 3 and 20 characters.' }));
      }
      if (password.length < 3) {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Password must be at least 3 characters.' }));
      }

      const result = await registerUser(username, password);
      res.writeHead(result.success ? 200 : 400);
      return res.end(JSON.stringify(result));
    });
  }

  // REST API: User Login
  if (reqPath === '/api/auth/login' && req.method === 'POST') {
    return readJsonBody(req, async (err, data) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (err || !data.username || !data.password) {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Username and password required.' }));
      }
      const username = String(data.username).trim();
      const password = String(data.password);

      const result = await authenticateUser(username, password);
      res.writeHead(result.success ? 200 : 401);
      return res.end(JSON.stringify(result));
    });
  }

  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content, 'utf-8');
    }
  });
}

// 2. HTTP Server instance (binds PORT for Wasmer, Docker & Cloud environments)
const PORT = parseInt(process.env.PORT, 10) || 3000;
const server = http.createServer(requestHandler);

// 3. Real-Time 60Hz Authoritative WebSocket Game Server
const wss = new WebSocketServer({ server });

// Start listening immediately so cloud health checks pass with 0 latency
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SNIPER DUELS Server live on http://0.0.0.0:${PORT}`);
});

let clients = new Map();
let nextPlayerId = 1;
let queuePlayers = new Set(); // Set of player IDs standing on the Middle 1v1 Queue Mat
let activeMatches = new Map(); // matchId -> matchData

wss.on('connection', handleConnection);

function handleConnection(ws) {
  const playerId = `player_${nextPlayerId++}`;
  const playerObj = {
    id: playerId,
    ws: ws,
    team: 'BLUE',
    health: 100,
    position: { x: 0, y: 0.55, z: -84 },
    rotation: { y: 0, pitch: 0 },
    slot: 'SNIPER',
    isAiming: false,
    isSliding: false,
    onQueuePad: false,
    matchId: null
  };

  clients.set(playerId, playerObj);
  console.log(`[WS] ${playerId} connected. Total online: ${clients.size}`);

  // Send initialization info
  ws.send(JSON.stringify({
    type: 'INIT',
    playerId: playerId,
    playerCount: clients.size,
    queueCount: queuePlayers.size
  }));

  // Notify other clients about the new player in lobby
  broadcastExcept(playerId, {
    type: 'PLAYER_JOINED',
    player: {
      id: playerId,
      position: playerObj.position,
      rotation: playerObj.rotation,
      slot: playerObj.slot
    }
  });

  // Send existing players to the newcomer
  for (const [id, other] of clients.entries()) {
    if (id !== playerId) {
      ws.send(JSON.stringify({
        type: 'PLAYER_JOINED',
        player: {
          id: other.id,
          position: other.position,
          rotation: other.rotation,
          slot: other.slot
        }
      }));
    }
  }

  // Broadcast updated player counts
  broadcast({
    type: 'SERVER_STATS',
    onlinePlayers: clients.size,
    queuePlayers: queuePlayers.size
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(playerId, data);
    } catch (e) {
      console.warn(`[WS] Invalid message from ${playerId}:`, e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] ${playerId} disconnected.`);
    if (queuePlayers.has(playerId)) {
      queuePlayers.delete(playerId);
      broadcastQueueStatus();
    }

    // If player was in an active match, notify opponent
    if (playerObj.matchId && activeMatches.has(playerObj.matchId)) {
      const match = activeMatches.get(playerObj.matchId);
      if (match && match.timerInterval) {
        clearTimeout(match.timerInterval);
        clearInterval(match.timerInterval);
      }
      const opponentId = match.p1 === playerId ? match.p2 : match.p1;
      const opponent = clients.get(opponentId);
      if (opponent && opponent.ws.readyState === ws.OPEN) {
        opponent.ws.send(JSON.stringify({
          type: 'MATCH_OVER',
          winnerId: opponentId,
          reason: 'OPPONENT_DISCONNECTED'
        }));
        opponent.matchId = null;
      }
      activeMatches.delete(playerObj.matchId);
    }

    clients.delete(playerId);
    broadcast({
      type: 'PLAYER_LEFT',
      playerId: playerId
    });
    broadcast({
      type: 'SERVER_STATS',
      onlinePlayers: clients.size,
      queuePlayers: queuePlayers.size
    });
  });
}

function handleClientMessage(senderId, data) {
  const player = clients.get(senderId);
  if (!player) return;

  switch (data.type) {
    // 60Hz transform sync
    case 'SYNC_TRANSFORM':
      player.position = data.position;
      player.rotation = data.rotation;
      player.slot = data.slot;
      player.isAiming = data.isAiming;
      player.isSliding = data.isSliding;

      broadcastExcept(senderId, {
        type: 'PLAYER_TRANSFORM',
        id: senderId,
        position: data.position,
        rotation: data.rotation,
        slot: data.slot,
        isAiming: data.isAiming,
        isSliding: data.isSliding
      });
      break;

    // Player steps ON the Middle 1v1 Queue Mat
    case 'QUEUE_PAD_ENTER':
      if (player.matchId) return; // already in match
      player.onQueuePad = true;
      queuePlayers.add(senderId);
      console.log(`[Queue] ${senderId} entered 1v1 Queue Mat. Players on mat: ${queuePlayers.size}`);
      checkMatchmakingQueue();
      break;

    // Player steps OFF the Middle 1v1 Queue Mat
    case 'QUEUE_PAD_LEAVE':
      player.onQueuePad = false;
      queuePlayers.delete(senderId);
      console.log(`[Queue] ${senderId} left 1v1 Queue Mat. Players on mat: ${queuePlayers.size}`);
      broadcastQueueStatus();
      break;

    // Gunshot or knife slash
    case 'FIRE_WEAPON':
      broadcastExcept(senderId, {
        type: 'REMOTE_FIRE',
        id: senderId,
        origin: data.origin,
        direction: data.direction,
        spread: data.spread,
        isAiming: data.isAiming,
        weaponType: data.weaponType
      });
      break;

    // Damage inflicted in 1v1 Duel
    case 'INFLICT_DAMAGE':
      // Cannot inflict damage inside the lobby - only in active matches
      if (!player.matchId) {
        console.log(`[Combat] Blocked damage from ${senderId}: players are in lobby.`);
        break;
      }

      const target = clients.get(data.targetId);
      if (target) {
        target.health = Math.max(0, target.health - data.damage);
        console.log(`[Combat] ${senderId} dealt ${data.damage} dmg to ${data.targetId} (Remaining HP: ${target.health})`);

        // Notify target of damage
        if (target.ws.readyState === target.ws.OPEN) {
          target.ws.send(JSON.stringify({
            type: 'DAMAGE_TAKEN',
            attackerId: senderId,
            damage: data.damage,
            isHeadshot: data.isHeadshot,
            remainingHealth: target.health
          }));
        }

        // Notify attacker of hit confirmation
        if (player.ws.readyState === player.ws.OPEN) {
          player.ws.send(JSON.stringify({
            type: 'HIT_CONFIRMED',
            targetId: data.targetId,
            damage: data.damage,
            isHeadshot: data.isHeadshot,
            remainingHealth: target.health
          }));
        }

        // Check for fatal elimination -> Advance Round or End Match
        if (target.health <= 0) {
          const matchId = player.matchId;
          const match = activeMatches.get(matchId);

          if (match) {
            match.scores[senderId] = (match.scores[senderId] || 0) + 1;
            const blueScore = match.scores[match.p1] || 0;
            const redScore = match.scores[match.p2] || 0;
            const winnerScore = match.scores[senderId];

            console.log(`[Combat] Fatal kill! ${senderId} won Round ${match.roundNumber}! Score: Blue ${blueScore} - Red ${redScore}`);

            // Check if player reached maxScore (e.g. 3 wins)
            if (winnerScore >= match.maxScore) {
              console.log(`[Match] ${senderId} won the entire duel (${winnerScore} wins)!`);

              const p1Client = clients.get(match.p1);
              const p2Client = clients.get(match.p2);

              if (p1Client && p1Client.ws.readyState === p1Client.ws.OPEN) {
                p1Client.ws.send(JSON.stringify({
                  type: 'MATCH_OVER',
                  winnerId: senderId,
                  loserId: data.targetId,
                  isHeadshot: data.isHeadshot,
                  isWinner: (senderId === match.p1),
                  scores: { blue: blueScore, red: redScore }
                }));
                p1Client.matchId = null;
                p1Client.onQueuePad = false;
              }

              if (p2Client && p2Client.ws.readyState === p2Client.ws.OPEN) {
                p2Client.ws.send(JSON.stringify({
                  type: 'MATCH_OVER',
                  winnerId: senderId,
                  loserId: data.targetId,
                  isHeadshot: data.isHeadshot,
                  isWinner: (senderId === match.p2),
                  scores: { blue: blueScore, red: redScore }
                }));
                p2Client.matchId = null;
                p2Client.onQueuePad = false;
              }

              queuePlayers.delete(match.p1);
              queuePlayers.delete(match.p2);
              activeMatches.delete(matchId);
              broadcastQueueStatus();
            } else {
              // Advance to next round!
              match.roundNumber++;
              player.health = 100;
              target.health = 100;

              const p1Client = clients.get(match.p1);
              const p2Client = clients.get(match.p2);

              if (p1Client && p1Client.ws.readyState === p1Client.ws.OPEN) {
                p1Client.ws.send(JSON.stringify({
                  type: 'ROUND_OVER',
                  roundWinnerId: senderId,
                  roundLoserId: data.targetId,
                  isWinner: (senderId === match.p1),
                  isHeadshot: data.isHeadshot,
                  scores: { blue: blueScore, red: redScore },
                  nextRoundNumber: match.roundNumber,
                  maxScore: match.maxScore,
                  intermissionSeconds: 3
                }));
              }
              if (p2Client && p2Client.ws.readyState === p2Client.ws.OPEN) {
                p2Client.ws.send(JSON.stringify({
                  type: 'ROUND_OVER',
                  roundWinnerId: senderId,
                  roundLoserId: data.targetId,
                  isWinner: (senderId === match.p2),
                  isHeadshot: data.isHeadshot,
                  scores: { blue: blueScore, red: redScore },
                  nextRoundNumber: match.roundNumber,
                  maxScore: match.maxScore,
                  intermissionSeconds: 3
                }));
              }
            }
          } else {
            if (player.ws.readyState === player.ws.OPEN) {
              player.ws.send(JSON.stringify({
                type: 'MATCH_OVER',
                winnerId: senderId,
                loserId: data.targetId,
                isHeadshot: data.isHeadshot,
                isWinner: true,
                scores: { blue: 1, red: 0 }
              }));
            }
            if (target.ws.readyState === target.ws.OPEN) {
              target.ws.send(JSON.stringify({
                type: 'MATCH_OVER',
                winnerId: senderId,
                loserId: data.targetId,
                isHeadshot: data.isHeadshot,
                isWinner: false,
                scores: { blue: 1, red: 0 }
              }));
            }
            player.matchId = null;
            target.matchId = null;
          }
        }
      }
      break;

    case 'VOTE_MAP':
      const currentMatch = activeMatches.get(data.matchId);
      if (currentMatch && currentMatch.state === 'MAP_VOTING') {
        currentMatch.votes[senderId] = data.mapName;
        console.log(`[Vote] ${senderId} voted for ${data.mapName} in match ${data.matchId}`);

        // Recalculate vote tallies
        const counts = { blockout: 0, poolday: 0, rooftop: 0 };
        for (const vote of Object.values(currentMatch.votes)) {
          if (counts[vote] !== undefined) counts[vote]++;
        }
        currentMatch.voteCounts = counts;

        // Broadcast updated tally to both players
        const voteUpdateMsg = JSON.stringify({
          type: 'VOTE_UPDATE',
          votes: counts,
          playerVoted: senderId,
          votedMap: data.mapName
        });
        const p1Client = clients.get(currentMatch.p1);
        const p2Client = clients.get(currentMatch.p2);
        if (p1Client?.ws.readyState === p1Client.ws.OPEN) p1Client.ws.send(voteUpdateMsg);
        if (p2Client?.ws.readyState === p2Client.ws.OPEN) p2Client.ws.send(voteUpdateMsg);

        // If BOTH players have voted, resolve immediately without waiting for remaining time!
        if (Object.keys(currentMatch.votes).length >= 2) {
          console.log(`[Vote] Both players have voted. Resolving map vote immediately!`);
          resolveMapVote(currentMatch);
        }
      }
      break;

    case 'MATCH_EXIT':
      if (player.matchId) {
        const m = activeMatches.get(player.matchId);
        if (m && m.timerInterval) {
          clearTimeout(m.timerInterval);
          clearInterval(m.timerInterval);
        }
        activeMatches.delete(player.matchId);
        player.matchId = null;
      }
      player.onQueuePad = false;
      queuePlayers.delete(senderId);
      broadcastQueueStatus();
      break;
  }
}

// Checks if 2 players are standing on the Middle Queue Mat to launch the match!
function checkMatchmakingQueue() {
  if (queuePlayers.size < 2) {
    broadcastQueueStatus();
    return;
  }

  const queueArray = Array.from(queuePlayers);
  const p1Id = queueArray[0];
  const p2Id = queueArray[1];

  queuePlayers.delete(p1Id);
  queuePlayers.delete(p2Id);

  // Notify everyone that match is locked in with 2/2 players
  broadcast({
    type: 'QUEUE_UPDATE',
    playersOnPad: 2,
    message: 'BOTH PLAYERS ON PAD (2/2)! STARTING 1v1 DUEL...'
  });

  const p1 = clients.get(p1Id);
  const p2 = clients.get(p2Id);

  if (p1 && p2 && p1.ws.readyState === p1.ws.OPEN && p2.ws.readyState === p2.ws.OPEN) {
    const matchId = `match_${Date.now()}`;
    p1.matchId = matchId;
    p2.matchId = matchId;
    p1.team = 'BLUE';
    p2.team = 'RED';
    p1.health = 100;
    p2.health = 100;

    const matchData = {
      id: matchId,
      p1: p1Id,
      p2: p2Id,
      state: 'MAP_VOTING',
      votes: {},
      voteCounts: { blockout: 0, poolday: 0, rooftop: 0 },
      roundNumber: 1,
      maxScore: 3,
      scores: {
        [p1Id]: 0,
        [p2Id]: 0
      },
      timerInterval: null
    };
    activeMatches.set(matchId, matchData);

    console.log(`[1v1 Match] Started 1v1 map vote: ${p1Id} (BLUE) vs ${p2Id} (RED) on Middle Platform!`);

    const voteMsg1 = JSON.stringify({
      type: 'MAP_VOTE_START',
      matchId: matchId,
      opponentId: p2Id,
      myTeam: 'BLUE',
      opponentTeam: 'RED',
      duration: 10
    });
    const voteMsg2 = JSON.stringify({
      type: 'MAP_VOTE_START',
      matchId: matchId,
      opponentId: p1Id,
      myTeam: 'RED',
      opponentTeam: 'BLUE',
      duration: 10
    });

    p1.ws.send(voteMsg1);
    p2.ws.send(voteMsg2);
    broadcastQueueStatus();

    matchData.timerInterval = setTimeout(() => {
      resolveMapVote(matchData);
    }, 10000);
  }
}

// Resolves map vote: most voted wins; tie or 0 votes triggers random selection
function resolveMapVote(match) {
  if (match.state !== 'MAP_VOTING') return;
  match.state = 'MATCH_ACTIVE';
  if (match.timerInterval) {
    clearTimeout(match.timerInterval);
    clearInterval(match.timerInterval);
    match.timerInterval = null;
  }

  const allMaps = ['blockout', 'poolday', 'rooftop'];
  const counts = match.voteCounts;

  const maxVotes = Math.max(counts.blockout, counts.poolday, counts.rooftop);
  let winningMap;
  let wasTie = false;

  if (maxVotes === 0) {
    // Neither player voted -> random selection among all 3 maps
    winningMap = allMaps[Math.floor(Math.random() * allMaps.length)];
    wasTie = true;
  } else {
    // Filter maps that tied for the top vote count
    const tiedMaps = allMaps.filter(m => counts[m] === maxVotes);
    if (tiedMaps.length === 1) {
      winningMap = tiedMaps[0];
      wasTie = false;
    } else {
      // Tie -> randomly pick among the tied maps
      winningMap = tiedMaps[Math.floor(Math.random() * tiedMaps.length)];
      wasTie = true;
    }
  }

  match.selectedMap = winningMap;
  console.log(`[Matchmaking] Map vote result: "${winningMap}" (Tally: ${JSON.stringify(counts)}, Tiebreaker: ${wasTie})`);

  const p1 = clients.get(match.p1);
  const p2 = clients.get(match.p2);

  const startMsg1 = JSON.stringify({
    type: 'MATCH_START_2P',
    matchId: match.id,
    opponentId: match.p2,
    myTeam: 'BLUE',
    opponentTeam: 'RED',
    selectedMap: winningMap,
    votes: counts,
    wasTie: wasTie,
    maxScore: match.maxScore
  });

  const startMsg2 = JSON.stringify({
    type: 'MATCH_START_2P',
    matchId: match.id,
    opponentId: match.p1,
    myTeam: 'RED',
    opponentTeam: 'BLUE',
    selectedMap: winningMap,
    votes: counts,
    wasTie: wasTie,
    maxScore: match.maxScore
  });

  if (p1 && p1.ws.readyState === p1.ws.OPEN) p1.ws.send(startMsg1);
  if (p2 && p2.ws.readyState === p2.ws.OPEN) p2.ws.send(startMsg2);

  broadcastQueueStatus();
}

function broadcastQueueStatus() {
  const count = queuePlayers.size;
  broadcast({
    type: 'QUEUE_UPDATE',
    playersOnPad: count,
    message: count === 1 ? 'WAITING FOR OPPONENT (1/2 ON PAD)...' : (count >= 2 ? 'OPPONENT DETECTED! STARTING 1v1...' : 'STAND ON PAD TO QUEUE 1v1')
  });
}

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const client of clients.values()) {
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastExcept(excludeId, msg) {
  const payload = JSON.stringify(msg);
  for (const [id, client] of clients.entries()) {
    if (id !== excludeId && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload);
    }
  }
}
