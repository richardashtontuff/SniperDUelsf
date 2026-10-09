# SNIPER DUELS - 3D Browser FPS

Competitive 3D Web FPS inspired by Roblox "Sniper Duels", built with Three.js r160, WebGL, and an authoritative Node.js WebSocket multiplayer server.

## Features
- **Movement & Viewmodel**: First-person camera, ADS sniper zoom, weapon bobbing/sway, knife inspect, sliding mechanics.
- **Combat & Ballistics**: Instant hit detection, headshot multipliers, 3D luminous bullet tracers, impact sparks, tactical in-scope digital ammo counter.
- **Match Engine & Lobby**: Duel pads, shooting range with target dummies, multi-round scoring (First to 3 Wins), death ragdoll and winner tracking camera.
- **Self-Contained**: 100% standalone vendored Three.js and WebSocket engine — zero external submodule dependencies.

## Deployment on Wasmer (GitHub Import)
1. Push this repository to GitHub.
2. In the [Wasmer Dashboard](https://wasmer.io), click **New App** -> **Import from GitHub**.
3. Select your repository.
4. Wasmer will detect `app.yaml` / `Dockerfile` and deploy your app to `https://<your-app>.wasmer.app`.

## Local / Docker Run
```bash
npm start
# Server runs on http://localhost:3000 (or PORT env)
```
