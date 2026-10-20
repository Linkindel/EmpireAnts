/**
 * Empire Fourmi - Moteur de Rendu Graphique 2D Réaliste (Canvas)
 * - Circulation des fourmis par graphe dans les galeries et chambres
 * - Cycle Jour / Nuit + 4 Saisons dynamiques (Printemps, Été, Automne, Hiver avec neige)
 * - Barricade d'entrée évolutive & Champignonnière bioluminescente
 * - Animation des raids de Fourmis Rouges et rendu des castes
 * Découpage modulaire SOLID : effets météo, textes flottants et particules isolés dans renderer-effects.js.
 */

const fxEngine = (typeof require === 'function')
  ? require('./renderer-effects.js')
  : (typeof globalThis !== 'undefined' ? { ...globalThis } : {});
if (typeof require === 'function' && fxEngine && typeof globalThis !== 'undefined') {
  Object.assign(globalThis, fxEngine);
}

let canvas, ctx;
const visualAnts = [];
const stars = [];
const snowflakes = [];
const grassBlades = [];
const rockSpeckles = [];
const combatParticles = (fxEngine && fxEngine.combatParticles) || [];
const floatingTexts = (fxEngine && fxEngine.floatingTexts) || [];
const seasonalParticles = (fxEngine && fxEngine.seasonalParticles) || [];
let screenShakeTimer = 0;
let screenShakeIntensity = 0;
let hoveredNode = null;

// État visuel des raids ennemis sur le Canvas
const raidScene = {
  active: false,
  victory: true,
  frame: 0,
  maxFrames: 260,
  enemies: [],
  bannerColor: ''
};

// Sous-tick pour interpoler l'heure du jour à 60 FPS
let lastTickTimeSeconds = 0;
let subSecondAccumulator = 0;
let lastFrameTimestamp = 0;

function ensureCanvasBindings() {
  if (typeof globalThis !== 'undefined') {
    if (globalThis.ctx && globalThis.ctx !== ctx) ctx = globalThis.ctx;
    if (globalThis.canvas && globalThis.canvas !== canvas) canvas = globalThis.canvas;
  }
}

function fillEllipse(x, y, rx, ry, color, rot = 0) {
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

function fillCircle(x, y, r, color) {
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function initCanvas() {
  canvas = document.getElementById('colonyCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  globalThis.canvas = canvas;
  globalThis.ctx = ctx;

  resizeCanvas();
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('resize', resizeCanvas);
  }

  if (typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: true });
  }

  initEnvironmentDetails();
  initSeasonalParticles();
  syncVisualAntsWithColony();
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  initEnvironmentDetails();
}

function initEnvironmentDetails() {
  const theme = GAME_CONFIG.CANVAS_THEME;
  stars.length = 0;
  for (let i = 0; i < theme.dayNight.starCount; i++) {
    stars.push({
      xRatio: Math.random(),
      yRatio: Math.random() * 0.82,
      radius: 0.7 + Math.random() * 1.4,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }

  snowflakes.length = 0;
  for (let i = 0; i < theme.dayNight.snowCount; i++) {
    snowflakes.push({
      xRatio: Math.random(),
      yRatio: Math.random(),
      radius: 1.2 + Math.random() * 1.8,
      speedY: 0.003 + Math.random() * 0.004,
      driftPhase: Math.random() * Math.PI * 2
    });
  }

  grassBlades.length = 0;
  const bladeCount = 65;
  for (let i = 0; i < bladeCount; i++) {
    const xRatio = i / bladeCount + (Math.random() * 0.01);
    if (xRatio > 0.41 && xRatio < 0.59) continue;
    grassBlades.push({
      xRatio,
      height: 7 + Math.random() * 9,
      tilt: (Math.random() - 0.5) * 4,
      phase: Math.random() * Math.PI * 2
    });
  }

  rockSpeckles.length = 0;
  for (let i = 0; i < 45; i++) {
    rockSpeckles.push({
      xRatio: 0.05 + Math.random() * 0.9,
      yRatio: theme.surfaceHeightRatio + 0.05 + Math.random() * (0.92 - theme.surfaceHeightRatio),
      rx: 3 + Math.random() * 10,
      ry: 2 + Math.random() * 5,
      angle: Math.random() * Math.PI
    });
  }

  initSeasonalParticles();
}

/**
 * Détection de survol (Hit-testing) pure et testable sans DOM pour les nœuds du Canvas.
 * Conforme aux exigences du Lot 2 (parcours dynamique de tout le registre des nœuds).
 *
 * @param {number} px Coordonnée X dans le canvas
 * @param {number} py Coordonnée Y dans le canvas
 * @param {Object} [nodes=GAME_CONFIG.CANVAS_THEME.nodes] Registre des nœuds
 * @param {{ width: number, height: number }} [canvasSize] Dimensions du canvas
 * @returns {{ nodeId: string, node: Object, isChamber: boolean, distance: number, x: number, y: number }|null}
 */
function hitTestNode(
  px,
  py,
  nodes = (GAME_CONFIG.CANVAS_THEME && GAME_CONFIG.CANVAS_THEME.nodes),
  canvasSize = { width: (((typeof globalThis !== 'undefined' && globalThis.canvas) || canvas || {}).width) || 800, height: (((typeof globalThis !== 'undefined' && globalThis.canvas) || canvas || {}).height) || 600 }
) {
  ensureCanvasBindings();
  if (
    !nodes ||
    typeof nodes !== 'object' ||
    !canvasSize ||
    typeof canvasSize.width !== 'number' ||
    typeof canvasSize.height !== 'number' ||
    canvasSize.width <= 0 ||
    canvasSize.height <= 0 ||
    typeof px !== 'number' ||
    typeof py !== 'number' ||
    !Number.isFinite(px) ||
    !Number.isFinite(py)
  ) {
    return null;
  }

  const w = canvasSize.width;
  const h = canvasSize.height;
  const hitRadius = (GAME_CONFIG.CANVAS_INTERACTION && GAME_CONFIG.CANVAS_INTERACTION.nodeHitRadius) || 28;

  let closest = null;
  let minDistance = Infinity;

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!node || typeof node.xRatio !== 'number' || typeof node.yRatio !== 'number') continue;
    const nx = node.xRatio * w;
    const ny = node.yRatio * h;

    if (node.isChamber && node.rx && node.ry) {
      const dx = px - nx;
      const dy = py - ny;
      const normDist = (dx * dx) / (node.rx * node.rx) + (dy * dy) / (node.ry * node.ry);
      if (normDist <= 1) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closest = { nodeId, node, isChamber: true, distance: dist, x: nx, y: ny };
        }
      }
    } else {
      const dx = px - nx;
      const dy = py - ny;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= hitRadius && dist < minDistance) {
        minDistance = dist;
        closest = { nodeId, node, isChamber: false, distance: dist, x: nx, y: ny };
      }
    }
  }

  return closest;
}

function getCanvasRelativeCoords(e) {
  ensureCanvasBindings();
  const activeCanvas = (typeof globalThis !== 'undefined' && globalThis.canvas) || canvas;
  if (!activeCanvas) return { x: 0, y: 0 };
  const rect = (typeof activeCanvas.getBoundingClientRect === 'function')
    ? activeCanvas.getBoundingClientRect()
    : { left: 0, top: 0, width: activeCanvas.width || 800, height: activeCanvas.height || 600 };
  const touch = (e && e.touches && e.touches.length > 0 && e.touches[0]) ||
    (e && e.changedTouches && e.changedTouches.length > 0 && e.changedTouches[0]) ||
    null;
  const clientX = touch ? touch.clientX : (e && typeof e.clientX === 'number' ? e.clientX : 0);
  const clientY = touch ? touch.clientY : (e && typeof e.clientY === 'number' ? e.clientY : 0);
  const scaleX = rect.width > 0 ? (activeCanvas.width || 800) / rect.width : 1;
  const scaleY = rect.height > 0 ? (activeCanvas.height || 600) / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function handleCanvasMouseMove(e) {
  ensureCanvasBindings();
  const activeCanvas = (typeof globalThis !== 'undefined' && globalThis.canvas) || canvas;
  const coords = getCanvasRelativeCoords(e);
  hoveredNode = hitTestNode(coords.x, coords.y);
  globalThis.hoveredNode = hoveredNode;
  if (activeCanvas && activeCanvas.style) {
    activeCanvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  }
}

function handleCanvasMouseLeave() {
  hoveredNode = null;
  globalThis.hoveredNode = null;
}

function handleCanvasTouchStart(e) {
  const coords = getCanvasRelativeCoords(e);
  hoveredNode = hitTestNode(coords.x, coords.y);
  globalThis.hoveredNode = hoveredNode;
}

function handleCanvasTouchMove(e) {
  const coords = getCanvasRelativeCoords(e);
  hoveredNode = hitTestNode(coords.x, coords.y);
  globalThis.hoveredNode = hoveredNode;
}

function handleCanvasTouchEnd(e) {
  const activeHover = hoveredNode || globalThis.hoveredNode;
  if (activeHover) {
    handleCanvasClick(e);
    setTimeout(() => {
      hoveredNode = null;
      globalThis.hoveredNode = null;
    }, 1800);
  }
}

function handleCanvasClick(e) {
  let hit = null;
  const hasCoords = e && (typeof e.clientX === 'number' || (e.touches && e.touches.length > 0) || (e.changedTouches && e.changedTouches.length > 0));
  if (hasCoords) {
    const coords = getCanvasRelativeCoords(e);
    hit = hitTestNode(coords.x, coords.y);
  } else {
    hit = hoveredNode || globalThis.hoveredNode;
  }
  if (!hit || !hit.node) return;

  const node = hit.node;
  if (node.interaction === 'harvest') {
    if (typeof harvestSurfaceDeposit === 'function') {
      harvestSurfaceDeposit(node.depositKey || 'left');
    }
  } else if (node.interaction === 'room' && node.roomKey) {
    if (e && e.shiftKey) {
      if (typeof upgradeRoom === 'function') {
        upgradeRoom(node.roomKey);
      }
    } else {
      if (typeof selectRoomInUI === 'function') {
        selectRoomInUI(node.roomKey);
      } else if (typeof upgradeRoom === 'function') {
        upgradeRoom(node.roomKey);
      }
    }
  } else if (node.interaction === 'barricade') {
    if (e && e.shiftKey) {
      if (typeof upgradeRoom === 'function') {
        upgradeRoom('barricade');
      }
    } else {
      if (typeof selectRoomInUI === 'function') {
        selectRoomInUI('barricade');
      } else if (typeof upgradeRoom === 'function') {
        upgradeRoom('barricade');
      }
    }
  } else if (node.interaction === 'nursery') {
    if (typeof switchTab === 'function') {
      switchTab('nursery');
    }
  }
}

// --- GRAPHE DE NAVIGATION DES GALERIES ---
function getNodePixelPos(nodeId) {
  ensureCanvasBindings();
  const node = GAME_CONFIG.CANVAS_THEME.nodes[nodeId];
  if (!node || !canvas) return { x: 0, y: 0 };
  return {
    x: canvas.width * node.xRatio,
    y: canvas.height * node.yRatio
  };
}

function getAdjacentNodes(nodeId) {
  const adj = [];
  GAME_CONFIG.CANVAS_THEME.edges.forEach(([a, b]) => {
    // Si la champignonnière n'est pas encore creusée, éviter d'y envoyer des fourmis
    if ((a === 'fungus' || b === 'fungus') && (!gameState.rooms.fungus || gameState.rooms.fungus <= 0)) {
      return;
    }
    if (a === nodeId) adj.push(b);
    else if (b === nodeId) adj.push(a);
  });
  return adj;
}

function findNextNodeTowards(startId, targetId) {
  if (startId === targetId) return startId;
  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    const neighbors = getAdjacentNodes(current);
    for (const next of neighbors) {
      if (next === targetId) {
        return path[1] || targetId;
      }
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  const fallback = getAdjacentNodes(startId);
  return fallback[Math.floor(Math.random() * fallback.length)] || startId;
}

function chooseGoalNodeForAnt(ant) {
  const raidImminent = gameState.nextRaidTimer <= GAME_CONFIG.RAIDS.alertThresholdSeconds || raidScene.active;
  const hasFungus = gameState.rooms.fungus > 0;

  if (ant.role === 'worker') {
    if (ant.carrying) {
      return Math.random() < 0.78 ? 'granary' : 'queen';
    }
    if (raidImminent) {
      const safeRooms = hasFungus ? ['granary', 'nursery', 'queen', 'fungus'] : ['granary', 'nursery', 'queen'];
      return safeRooms[Math.floor(Math.random() * safeRooms.length)];
    }
    const roll = Math.random();
    if (hasFungus && roll < 0.28) {
      return 'fungus';
    } else if (roll < 0.65) {
      return Math.random() < 0.5 ? 'surface_left' : 'surface_right';
    } else if (roll < 0.85) {
      return 'nursery';
    }
    return 'granary';
  }

  if (ant.role === 'scout') {
    if (raidImminent) return 'barricade';
    const patrol = ['surface_left', 'surface_right', 'entrance', 'queen', 'dorm'];
    return patrol[Math.floor(Math.random() * patrol.length)];
  }

  if (ant.role === 'warrior' || ant.role === 'tank') {
    if (raidImminent) {
      return Math.random() < 0.7 ? 'barricade' : 'entrance';
    }
    const guardPoints = ['dorm', 'barricade', 'queen', 'entrance', 'nursery'];
    return guardPoints[Math.floor(Math.random() * guardPoints.length)];
  }

  if (ant.role === 'nurse') {
    if (raidImminent) return 'nursery';
    const nursePoints = hasFungus ? ['nursery', 'queen', 'fungus'] : ['nursery', 'queen'];
    return nursePoints[Math.floor(Math.random() * nursePoints.length)];
  }

  return 'queen';
}

function createVisualAnt(role, startNodeId = 'queen') {
  const goalNode = chooseGoalNodeForAnt({ role, carrying: null });
  const nextNode = findNextNodeTowards(startNodeId, goalNode);
  const pos = getNodePixelPos(startNodeId);

  return {
    role,
    currentNode: startNodeId,
    nextNode,
    goalNode,
    progress: Math.random() * 0.3,
    laneOffset: (Math.random() - 0.5) * 10,
    x: pos.x,
    y: pos.y,
    vx: 1,
    vy: 0,
    legPhase: Math.random() * Math.PI * 2,
    carrying: null,
    pauseTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2
  };
}

function syncVisualAntsWithColony() {
  const caps = GAME_CONFIG.CANVAS_THEME.maxVisualAntsPerCaste;
  const roles = ['worker', 'scout', 'warrior', 'tank', 'nurse'];

  roles.forEach(role => {
    const deployedInExp = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot && gameState.activeExpedition.squadSnapshot[role]) || 0;
    const inNestCount = Math.max(0, (gameState.ants && gameState.ants[role] || 0) - deployedInExp);
    const capForRole = (caps && caps[role]) !== undefined ? caps[role] : 6;
    const desired = Math.min(inNestCount, capForRole);
    const currentAnts = visualAnts.filter(a => a.role === role);

    if (currentAnts.length < desired) {
      const toAdd = desired - currentAnts.length;
      let defaultStart = 'queen';
      if (role === 'warrior' || role === 'tank') defaultStart = 'dorm';
      else if (role === 'nurse') defaultStart = 'nursery';
      for (let i = 0; i < toAdd; i++) {
        visualAnts.push(createVisualAnt(role, defaultStart));
      }
    } else if (currentAnts.length > desired) {
      let toRemove = currentAnts.length - desired;
      for (let i = visualAnts.length - 1; i >= 0 && toRemove > 0; i--) {
        if (visualAnts[i].role === role) {
          visualAnts.splice(i, 1);
          toRemove--;
        }
      }
    }
  });
}

function triggerAntSpawnEffect(caste) {
  if (!canvas) return;
  const caps = GAME_CONFIG.CANVAS_THEME.maxVisualAntsPerCaste;
  const currentCount = visualAnts.filter(a => a.role === caste).length;
  if (currentCount < caps[caste]) {
    visualAnts.push(createVisualAnt(caste, 'nursery'));
  }
}

// --- DÉCLENCHEMENT VISUEL DES RAIDS ENNEMIS ---
function triggerRaidVisuals(victory) {
  const activeCanvas = canvas || (typeof globalThis !== 'undefined' && globalThis.canvas);
  if (!activeCanvas) return;
  const raidCfg = GAME_CONFIG.RAIDS;
  raidScene.active = true;
  raidScene.victory = victory;
  raidScene.frame = 0;
  raidScene.maxFrames = raidCfg.combatDurationFrames;
  raidScene.bannerColor = victory ? GAME_CONFIG.CANVAS_THEME.leafColor : GAME_CONFIG.CANVAS_THEME.enemyAnt.canvasColor;

  raidScene.enemies = [];
  const enemyCount = Math.min(14, 6 + Math.floor(gameState.day * 1.2));

  for (let i = 0; i < enemyCount; i++) {
    const fromLeft = i % 2 === 0;
    const startNode = fromLeft ? 'surface_left' : 'surface_right';
    raidScene.enemies.push({
      currentNode: startNode,
      nextNode: 'entrance',
      progress: Math.random() * 0.6,
      laneOffset: (Math.random() - 0.5) * 12,
      x: 0,
      y: 0,
      vx: fromLeft ? 1 : -1,
      vy: 0,
      legPhase: Math.random() * Math.PI * 2,
      hp: 100,
      retreating: false,
      carryingStolenFood: false
    });
  }

  visualAnts.forEach(ant => {
    if (ant.role === 'tank' || ant.role === 'warrior') {
      ant.pauseTimer = 0;
      ant.goalNode = 'barricade';
      ant.nextNode = findNextNodeTowards(ant.currentNode, 'barricade');
    }
  });
};

// --- DÉLÉGATION DES EFFETS VISUELS VERS renderer-effects.js ---
const initSeasonalParticles = (...args) => fxEngine.initSeasonalParticles(...args);
const updateAndDrawSeasonalParticles = (...args) => fxEngine.updateAndDrawSeasonalParticles(...args);
const triggerScreenShake = (intensity = 5.5, duration = 18) => {
  screenShakeIntensity = intensity;
  screenShakeTimer = duration;
  return fxEngine.triggerScreenShake(intensity, duration);
};
const spawnCanvasFloatingText = (...args) => fxEngine.spawnCanvasFloatingText(...args);
const updateAndDrawFloatingTexts = (...args) => fxEngine.updateAndDrawFloatingTexts(...args);
const drawPheromoneTrails = (...args) => fxEngine.drawPheromoneTrails(...args);
const drawBioluminescentSpores = (...args) => fxEngine.drawBioluminescentSpores(...args);
const drawHoverHaloAndTooltip = (...args) => fxEngine.drawHoverHaloAndTooltip(...args);
const spawnCombatParticle = (...args) => fxEngine.spawnCombatParticle(...args);
const updateAndDrawCombatParticles = (...args) => fxEngine.updateAndDrawCombatParticles(...args);

// --- BOUCLE DE RENDU PRINCIPALE (60 FPS) ---
function renderCanvasLoop(timestamp) {
  if (!ctx || !canvas) return;

  const dt = lastFrameTimestamp ? Math.min(0.05, (timestamp - lastFrameTimestamp) / 1000) : 0.016;
  lastFrameTimestamp = timestamp;

  if (gameState.timeSeconds !== lastTickTimeSeconds) {
    lastTickTimeSeconds = gameState.timeSeconds;
    subSecondAccumulator = 0;
  } else if (gameState.speed > 0) {
    subSecondAccumulator = Math.min(0.99, subSecondAccumulator + dt * gameState.speed);
  }

  syncVisualAntsWithColony();

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (screenShakeTimer > 0) {
    screenShakeTimer--;
    const shakeAngle = Math.random() * Math.PI * 2;
    const currentIntensity = screenShakeIntensity * (screenShakeTimer / 18);
    const shakeX = Math.cos(shakeAngle) * currentIntensity;
    const shakeY = Math.sin(shakeAngle) * currentIntensity;
    ctx.translate(shakeX, shakeY);
  }

  // 1. Ciel dynamique (Cycle Jour/Nuit + 4 Saisons), Soleil/Lune, Herbe et Tertre
  const surfaceY = h * GAME_CONFIG.CANVAS_THEME.surfaceHeightRatio;
  drawSkyAndSurface(w, h, surfaceY, timestamp);

  // 2. Sous-sol & Texture rocheuse
  drawUndergroundBackground(w, h, surfaceY);

  // 3. Tunnels du réseau souterrain
  drawAllTunnels();
  drawPheromoneTrails(timestamp, w, h);

  // 4. Chambres souterraines & Détails internes
  drawAllChambers();
  drawBioluminescentSpores(timestamp);

  // 5. Barricade d'entrée
  drawBarricade();

  // 6. Fourmis de la colonie circulant dans les tunnels et chambres
  updateAndDrawColonyAnts();

  // 7. Raids ennemis & Particules de combat
  updateAndDrawRaidScene();
  updateAndDrawCombatParticles();

  // 8. Indicateur visuel d'expédition en surface
  drawSurfaceExpeditionBanner(w, surfaceY);

  // 9. Textes flottants & Infobulles interactives
  updateAndDrawFloatingTexts();
  drawHoverHaloAndTooltip(w, h);

  ctx.restore();

  requestAnimationFrame(renderCanvasLoop);
}

// --- 1. CIEL, CYCLE JOUR/NUIT, 4 SAISONS & SURFACE ---
function lerpColor(rgbA, rgbB, tRatio) {
  const r = Math.round(rgbA[0] + (rgbB[0] - rgbA[0]) * tRatio);
  const g = Math.round(rgbA[1] + (rgbB[1] - rgbA[1]) * tRatio);
  const b = Math.round(rgbA[2] + (rgbB[2] - rgbA[2]) * tRatio);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawSkyAndSurface(w, h, surfaceY, timestamp) {
  ensureCanvasBindings();
  const theme = GAME_CONFIG.CANVAS_THEME;
  const dn = theme.dayNight;
  const aaa = theme.worldAAA || {};
  const season = typeof getCurrentSeasonConfig === 'function'
    ? getCurrentSeasonConfig()
    : GAME_CONFIG.SEASONS.summer;

  const dayDur = GAME_CONFIG.ECONOMY.dayDurationSeconds;
  const exactSec = (gameState.timeSeconds % dayDur) + subSecondAccumulator;
  const dayProgress = exactSec / dayDur;

  let skyTop, skyBottom, starAlpha = 0, timeLabel = t('time.noon'), timeIcon = '☀️';

  if (dayProgress < 0.15) {
    const tProg = dayProgress / 0.15;
    skyTop = lerpColor(dn.duskSkyTop, dn.daySkyTop, tProg);
    skyBottom = lerpColor(dn.duskSkyBottom, dn.daySkyBottom, tProg);
    starAlpha = Math.max(0, 1 - tProg * 1.5);
    timeIcon = '🌅';
    timeLabel = t('time.dawn');
  } else if (dayProgress < 0.55) {
    skyTop = lerpColor(dn.daySkyTop, dn.daySkyTop, 0);
    skyBottom = lerpColor(dn.daySkyBottom, dn.daySkyBottom, 0);
    timeIcon = '☀️';
    timeLabel = t('time.noon');
  } else if (dayProgress < 0.70) {
    const tProg = (dayProgress - 0.55) / 0.15;
    skyTop = lerpColor(dn.daySkyTop, dn.duskSkyTop, tProg);
    skyBottom = lerpColor(dn.daySkyBottom, dn.duskSkyBottom, tProg);
    starAlpha = tProg * 0.5;
    timeIcon = '🌇';
    timeLabel = t('time.dusk');
  } else {
    const tProg = Math.min(1, (dayProgress - 0.70) / 0.12);
    skyTop = lerpColor(dn.duskSkyTop, dn.nightSkyTop, tProg);
    skyBottom = lerpColor(dn.duskSkyBottom, dn.nightSkyBottom, tProg);
    starAlpha = 0.5 + tProg * 0.5;
    timeIcon = '🌙';
    timeLabel = t('time.night');
  }

  // Mise à jour du badge Jour / Saison / Heure dans l'overlay
  const badgeSeason = document.getElementById('badgeSeason');
  if (badgeSeason) {
    const seasonName = t(`season.${season.id}`);
    const seasonDesc = t(`season.${season.id}.desc`);
    badgeSeason.innerHTML =
      `<span>${season.icon}</span> ${t('time.day')} <span id="gameDay">${gameState.day}</span> - ${seasonName} (${timeIcon} ${timeLabel}) ` +
      `<span class="season-effect-tag">[${seasonDesc}]</span>`;
  }

  const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, surfaceY);

  // Étoiles scintillantes la nuit
  if (starAlpha > 0.02) {
    ctx.save();
    stars.forEach(st => {
      const twinkle = 0.55 + 0.45 * Math.sin(timestamp * 0.004 + st.twinkleOffset);
      ctx.globalAlpha = starAlpha * twinkle;
      ctx.fillStyle = dn.starColor;
      ctx.beginPath();
      ctx.arc(st.xRatio * w, st.yRatio * surfaceY, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Soleil ou Lune
  ctx.save();
  if (dayProgress <= 0.68) {
    const sunT = dayProgress / 0.68;
    const sunX = w * (0.12 + sunT * 0.76);
    const sunY = surfaceY * (0.85 - Math.sin(sunT * Math.PI) * 0.58);

    ctx.fillStyle = dn.sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = dn.sunColor;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Rayons chauds du soleil en Été
    const sDetails = (theme && theme.seasonalDetails) || {};
    if (season.id === 'summer' && sDetails.summerSunRayCount) {
      ctx.strokeStyle = sDetails.summerSunRayColor || 'rgba(254, 240, 138, 0.14)';
      ctx.lineWidth = 1.6;
      const rayLen = sDetails.summerSunRayLength || 48;
      for (let r = 0; r < sDetails.summerSunRayCount; r++) {
        const rayAngle = (timestamp * 0.0006) + (r * (Math.PI * 2 / sDetails.summerSunRayCount));
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(rayAngle) * rayLen, sunY + Math.sin(rayAngle) * rayLen);
        ctx.stroke();
      }
    }
  } else {
    const moonT = (dayProgress - 0.68) / 0.32;
    const moonX = w * (0.15 + moonT * 0.70);
    const moonY = surfaceY * (0.82 - Math.sin(moonT * Math.PI) * 0.55);

    ctx.fillStyle = dn.moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = dn.moonColor;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Flocons de neige en Hiver
  if (season.id === 'winter') {
    ctx.save();
    ctx.fillStyle = dn.snowColor;
    snowflakes.forEach(sf => {
      if (gameState.speed > 0) {
        sf.yRatio = (sf.yRatio + sf.speedY * gameState.speed) % 1;
      }
      const sx = (sf.xRatio * w) + Math.sin(timestamp * 0.002 + sf.driftPhase) * 6;
      const sy = sf.yRatio * surfaceY;
      ctx.beginPath();
      ctx.arc(sx, sy, sf.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Particules météo saisonnières (Pollen au printemps, lucioles en été, feuilles en automne)
  updateAndDrawSeasonalParticles(w, h, surfaceY, timestamp, season);

  // Sol herbeux teinté selon la saison + profondeur de champ AAA (herbes géantes d'arrière-plan)
  ctx.save();
  ctx.globalAlpha = aaa.bgGrassAlpha || 0.28;
  ctx.strokeStyle = starAlpha > 0.5 ? season.grassNight : season.grassDay;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  const bgScale = aaa.bgGrassScale || 2.1;
  for (let i = 0; i < grassBlades.length; i += 2) {
    const b = grassBlades[i];
    const bx = b.xRatio * w;
    const sway = Math.sin(timestamp * 0.0014 + b.phase) * 4.5;
    const bh = b.height * bgScale;
    ctx.beginPath();
    ctx.moveTo(bx, surfaceY - 3);
    ctx.quadraticCurveTo(bx + b.tilt * 1.4, surfaceY - 3 - bh * 0.5, bx + b.tilt * 1.8 + sway, surfaceY - 3 - bh);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = starAlpha > 0.5 ? season.grassNight : season.grassDay;
  ctx.fillRect(0, surfaceY - 7, w, 9);

  ctx.save();
  ctx.strokeStyle = starAlpha > 0.5 ? season.grassDay : season.grassBladeColor;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  grassBlades.forEach(b => {
    const bx = b.xRatio * w;
    const sway = Math.sin(timestamp * 0.002 + b.phase) * 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, surfaceY - 4);
    ctx.quadraticCurveTo(bx + b.tilt, surfaceY - 4 - b.height * 0.5, bx + b.tilt + sway, surfaceY - 4 - b.height);
    ctx.stroke();
  });
  ctx.restore();

  // Fleurs sauvages au Printemps
  const sDetails = (theme && theme.seasonalDetails) || {};
  if (season.id === 'spring' && sDetails.springFlowerCount) {
    ctx.save();
    const flowerColors = sDetails.springFlowerColors || ['#f687b3', '#faf089', '#ffffff'];
    const centerColor = sDetails.springFlowerCenterColor || '#ecc94b';
    for (let f = 0; f < sDetails.springFlowerCount; f++) {
      const fx = w * (0.07 + f * 0.11 + (f % 2 === 0 ? 0.02 : 0));
      if (fx > w * 0.40 && fx < w * 0.60) continue;
      const fy = surfaceY - 8 - (f % 3) * 3;
      ctx.fillStyle = flowerColors[f % flowerColors.length];
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Gisements visuels en surface
  drawSurfaceResources(w, surfaceY, season, timestamp);
  if (typeof drawLivingBridgeEffect === 'function') {
    drawLivingBridgeEffect(w, surfaceY);
  }

  // Tertre 3D de la fourmilière
  ctx.save();
  const moundGrad = ctx.createLinearGradient(w * 0.4, surfaceY - 32, w * 0.6, surfaceY + 4);
  moundGrad.addColorStop(0, theme.moundHighlight);
  moundGrad.addColorStop(1, theme.moundColor);
  ctx.fillStyle = moundGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, surfaceY);
  ctx.quadraticCurveTo(w * 0.5, surfaceY - 32, w * 0.62, surfaceY);
  ctx.fill();

  // Couche de givre hivernal sur le dôme
  if (season.id === 'winter' && sDetails.winterMoundFrostColor) {
    ctx.save();
    ctx.strokeStyle = sDetails.winterMoundFrostColor;
    ctx.lineWidth = sDetails.winterMoundFrostWidth || 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.41, surfaceY - 4);
    ctx.quadraticCurveTo(w * 0.5, surfaceY - 31, w * 0.59, surfaceY - 4);
    ctx.stroke();
    ctx.restore();
  }

  // Cratère d'entrée 3D avec rebord éclairé
  ctx.strokeStyle = theme.moundHighlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, surfaceY - 3, 24, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = theme.entranceColor;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, surfaceY - 3, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (typeof drawSurfaceDomeVentilation === 'function') {
    drawSurfaceDomeVentilation(w, surfaceY, timestamp);
  }
  ctx.restore();
}

function drawSurfaceResources(w, surfaceY, season, timestamp = 0) {
  if (typeof globalThis.drawSurfaceResources === 'function' && globalThis.drawSurfaceResources !== drawSurfaceResources) {
    return globalThis.drawSurfaceResources(w, surfaceY, season, timestamp);
  }
}

// --- 2. SOUS-SOL & GALERIES 3D ---
function drawUndergroundBackground(w, h, surfaceY) {
  ensureCanvasBindings();
  const theme = GAME_CONFIG.CANVAS_THEME;
  const aaa = theme.worldAAA || {};
  const earthGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
  earthGrad.addColorStop(0, theme.earthGradientTop);
  earthGrad.addColorStop(0.5, theme.earthGradientMid);
  earthGrad.addColorStop(1, theme.earthGradientBottom);
  ctx.fillStyle = earthGrad;
  ctx.fillRect(0, surfaceY, w, h - surfaceY);

  // Strates géologiques subtiles + racines végétales sous la surface
  ctx.save();
  ctx.strokeStyle = aaa.strataLineColor || 'rgba(255, 215, 170, 0.04)';
  ctx.lineWidth = 2;
  for (let s = 1; s <= 4; s++) {
    const sy = surfaceY + (h - surfaceY) * (s * 0.2);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.quadraticCurveTo(w * 0.5, sy + (s % 2 === 0 ? 14 : -14), w, sy);
    ctx.stroke();
  }

  ctx.strokeStyle = aaa.rootColor || 'rgba(139, 90, 43, 0.35)';
  ctx.lineWidth = 1.6;
  for (let r = 0; r < 8; r++) {
    const rx = w * (0.08 + r * 0.12);
    if (rx > w * 0.42 && rx < w * 0.58) continue;
    ctx.beginPath();
    ctx.moveTo(rx, surfaceY);
    ctx.quadraticCurveTo(rx + (r % 2 === 0 ? 8 : -8), surfaceY + 18, rx + (r % 2 === 0 ? -4 : 5), surfaceY + 34);
    ctx.stroke();
  }

  ctx.fillStyle = theme.rockSpeckleColor;
  rockSpeckles.forEach(r => {
    ctx.beginPath();
    ctx.ellipse(r.xRatio * w, r.yRatio * h, r.rx, r.ry, r.angle, 0, Math.PI * 2);
    ctx.fill();
  });

  // Puits de lumière volumétrique sous l'entrée du dôme
  const rayGrad = ctx.createLinearGradient(w * 0.5, surfaceY, w * 0.5, surfaceY + 110);
  rayGrad.addColorStop(0, aaa.godRayColor || 'rgba(254, 243, 199, 0.09)');
  rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rayGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.47, surfaceY);
  ctx.lineTo(w * 0.53, surfaceY);
  ctx.lineTo(w * 0.58, surfaceY + 110);
  ctx.lineTo(w * 0.42, surfaceY + 110);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAllTunnels() {
  ensureCanvasBindings();
  const theme = GAME_CONFIG.CANVAS_THEME;
  const aaa = theme.worldAAA || {};
  GAME_CONFIG.CANVAS_THEME.edges.forEach(([a, b]) => {
    if (a.startsWith('surface') && b === 'entrance') return;
    if (b.startsWith('surface') && a === 'entrance') return;
    if ((a === 'fungus' || b === 'fungus') && gameState.rooms.fungus <= 0) return;

    const p1 = getNodePixelPos(a);
    const p2 = getNodePixelPos(b);

    ctx.save();
    ctx.lineCap = 'round';
    // Paroi externe ombrée 3D
    ctx.strokeStyle = aaa.tunnelShadowColor || 'rgba(5, 3, 2, 0.65)';
    ctx.lineWidth = theme.tunnelWidth + 10;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Paroi de terre excavée
    ctx.strokeStyle = theme.tunnelOuterColor;
    ctx.lineWidth = theme.tunnelWidth + 5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Cavité centrale du tunnel
    ctx.strokeStyle = theme.tunnelColor;
    ctx.lineWidth = theme.tunnelWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Reflet de sol de galerie
    ctx.strokeStyle = aaa.tunnelHighlightColor || 'rgba(214, 158, 46, 0.08)';
    ctx.lineWidth = theme.tunnelWidth * 0.35;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y + 2);
    ctx.lineTo(p2.x, p2.y + 2);
    ctx.stroke();
    ctx.restore();
  });
}

// --- 3. CHAMBRES SOUTERRAINES 3D & DÉTAILS INTERNES ---
function drawAllChambers() {
  ensureCanvasBindings();
  const nodes = GAME_CONFIG.CANVAS_THEME.nodes;
  Object.keys(nodes).forEach(nodeId => {
    const n = nodes[nodeId];
    if (!n.isChamber) return;

    const pos = getNodePixelPos(nodeId);
    const roomLvl = n.roomKey ? (gameState.rooms[n.roomKey] !== undefined ? gameState.rooms[n.roomKey] : 1) : 1;

    if (nodeId === 'fungus' && roomLvl <= 0) {
      drawUnbuiltChamber(pos.x, pos.y, n.rx * 0.85, n.ry * 0.85, t(n.labelKey));
      return;
    }

    const scaleBonus = 1 + Math.min(0.28, Math.max(0, roomLvl - 1) * 0.05);
    const rx = n.rx * scaleBonus;
    const ry = n.ry * scaleBonus;

    drawChamberBase(pos.x, pos.y, rx, ry, t(n.labelKey), roomLvl, n.roomKey, n.bg);

    if (nodeId === 'queen') {
      drawQueenChamberDetails(pos.x, pos.y, rx, ry);
    } else if (nodeId === 'granary') {
      drawGranaryDetails(pos.x, pos.y, rx, ry);
    } else if (nodeId === 'dorm') {
      drawDormDetails(pos.x, pos.y, rx, ry, roomLvl);
    } else if (nodeId === 'fungus') {
      drawFungusDetails(pos.x, pos.y, rx, ry, roomLvl);
    } else if (nodeId === 'nursery') {
      drawNurseryDetails(pos.x, pos.y, rx, ry);
    } else if (nodeId === 'aphid_farm') {
      if (typeof drawAphidFarmDetails === 'function') {
        drawAphidFarmDetails(pos.x, pos.y, rx, ry, roomLvl);
      }
    } else if (nodeId === 'masonry_hall') {
      if (typeof drawMasonryHallDetails === 'function') {
        drawMasonryHallDetails(pos.x, pos.y, rx, ry, roomLvl);
      }
    } else if (nodeId === 'abyss_shaft') {
      if (typeof drawAbyssShaftDetails === 'function') {
        drawAbyssShaftDetails(pos.x, pos.y, rx, ry);
      }
    }
  });

  if (typeof drawActiveChamberConstructions === 'function') {
    drawActiveChamberConstructions(nodes);
  }
}

function drawUnbuiltChamber(x, y, rx, ry, label) {
  ctx.save();
  ctx.strokeStyle = 'rgba(166, 152, 136, 0.25)';
  if (typeof ctx.setLineDash === 'function') ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(166, 152, 136, 0.5)';
  ctx.font = '500 9.5px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🍄 ${label} (${t('canvas.unbuilt')})`, x, y + 3);
  ctx.restore();
}

function drawChamberBase(x, y, rx, ry, label, roomLvl, roomKey, bgColor) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  const aaa = theme.worldAAA || {};
  ctx.save();

  // Ombre caverneuse externe
  ctx.strokeStyle = aaa.chamberShadowColor || 'rgba(6, 4, 2, 0.72)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 2, ry + 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Fond de la cavité + bordure rocheuse
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = theme.chamberStrokeColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Éclairage zénithal chaud au sol de la chambre
  ctx.fillStyle = aaa.chamberInnerGlow || 'rgba(246, 173, 85, 0.14)';
  ctx.beginPath();
  ctx.ellipse(x, y + ry * 0.15, rx * 0.78, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pilule de titre AAA
  const lvlText = roomKey ? ` • ${t('canvas.lvl.short')} ${roomLvl}` : '';
  const fullLabel = `${label}${lvlText}`;
  ctx.fillStyle = theme.chamberLabelColor;
  ctx.font = '600 10px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fullLabel, x, y + ry - 7);
  ctx.restore();
}

function drawQueenChamberDetails(x, y, rx, ry) {
  if (typeof globalThis.drawQueenChamberDetails === 'function' && globalThis.drawQueenChamberDetails !== drawQueenChamberDetails) {
    return globalThis.drawQueenChamberDetails(x, y, rx, ry);
  }
}

function drawGranaryDetails(x, y, rx, ry) {
  if (typeof globalThis.drawGranaryDetails === 'function' && globalThis.drawGranaryDetails !== drawGranaryDetails) {
    return globalThis.drawGranaryDetails(x, y, rx, ry);
  }
}

function drawDormDetails(x, y, rx, ry, lvl) {
  if (typeof globalThis.drawDormDetails === 'function' && globalThis.drawDormDetails !== drawDormDetails) {
    return globalThis.drawDormDetails(x, y, rx, ry, lvl);
  }
}

function drawFungusDetails(x, y, rx, ry, lvl) {
  if (typeof globalThis.drawFungusDetails === 'function' && globalThis.drawFungusDetails !== drawFungusDetails) {
    return globalThis.drawFungusDetails(x, y, rx, ry, lvl);
  }
}

function drawNurseryDetails(x, y, rx, ry) {
  if (typeof globalThis.drawNurseryDetails === 'function' && globalThis.drawNurseryDetails !== drawNurseryDetails) {
    return globalThis.drawNurseryDetails(x, y, rx, ry);
  }
}

// --- 4. BARRICADE D'ENTRÉE ---
function drawBarricade() {
  if (typeof globalThis.drawBarricade === 'function' && globalThis.drawBarricade !== drawBarricade) {
    return globalThis.drawBarricade();
  }
}

// --- 5. REINE (RENDU 3D CGI STYLE FILM FOURMIZ / ANTZ) ---
function drawQueen(x, y) {
  ensureCanvasBindings();
  const qTheme = GAME_CONFIG.CANVAS_THEME.queen;
  const antz = GAME_CONFIG.CANVAS_THEME.antzStyle || {};
  const now = performance.now();
  const pulse = 1 + Math.sin(now * 0.003) * 0.045;
  const antWave = Math.sin(now * 0.005) * 2.2;

  ctx.save();
  ctx.translate(x, y - 4);
  fillEllipse(-2, 2, 32 * pulse, 18 * pulse, antz.queenAuraColor || 'rgba(236, 201, 75, 0.24)');
  fillEllipse(-1, 5, 28, 12, antz.dropShadowColor || 'rgba(8, 5, 3, 0.48)');

  ctx.strokeStyle = GAME_CONFIG.CANVAS_THEME.antLegColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  [-1, 1].forEach(side => {
    [-1, 0, 1].forEach(idx => {
      const baseX = 4 + idx * 4.5;
      ctx.beginPath();
      ctx.moveTo(baseX, side * 3);
      ctx.lineTo(baseX - 1.5 + Math.sin(now * 0.002 + idx) * 0.8, side * (9 + Math.abs(idx) * 1.5));
      ctx.lineTo(baseX + idx * 3.5, side * (15 + (idx === 0 ? 2 : 0)));
      ctx.stroke();
    });
  });

  fillEllipse(-14, 0, 19 * pulse, 12.5 * pulse, qTheme.abdomen);
  ctx.strokeStyle = qTheme.abdomenStripe;
  ctx.lineWidth = 2.2;
  for (let s = -24; s <= -5; s += 5) {
    const hSeg = Math.sqrt(Math.max(0.1, 1 - Math.pow((s + 14) / 19, 2))) * 11.5 * pulse;
    ctx.beginPath();
    ctx.moveTo(s, -hSeg);
    ctx.quadraticCurveTo(s + 2.5, 0, s, hSeg);
    ctx.stroke();
  }
  fillEllipse(-15, -4.2 * pulse, 12 * pulse, 4.2 * pulse, qTheme.abdomenHighlight || '#f6ad55', -0.08);
  fillEllipse(-17, -5.2 * pulse, 6.5 * pulse, 1.8 * pulse, antz.specularColor || 'rgba(255, 246, 224, 0.58)', -0.1);
  fillEllipse(2, 0, 3.2, 2.6, antz.petioleColor || '#3d1f0d');
  fillEllipse(9, 0, 8.5, 7, qTheme.thorax);
  fillEllipse(5, -2.5, 9, 3.6, antz.queenCapeColor || 'rgba(254, 243, 199, 0.24)', -0.25);
  fillEllipse(5, 2.5, 9, 3.6, antz.queenCapeColor || 'rgba(254, 243, 199, 0.24)', 0.25);
  fillEllipse(9, -2.8, 5, 2, antz.specularColor || 'rgba(255, 246, 224, 0.58)');
  fillEllipse(19.5, 0, 6.8, 6.2, qTheme.head);

  ctx.fillStyle = antz.queenCrownColor || '#f6e05e';
  ctx.beginPath();
  ctx.moveTo(16, -3.5); ctx.lineTo(19, -6.5); ctx.lineTo(18.5, -1.5); ctx.lineTo(22, -3);
  ctx.lineTo(19.5, 0); ctx.lineTo(22, 3); ctx.lineTo(18.5, 1.5); ctx.lineTo(19, 6.5); ctx.lineTo(16, 3.5);
  ctx.closePath();
  ctx.fill();

  [-1, 1].forEach(side => {
    const ey = side * 3.4;
    fillEllipse(21.5, ey, 2.4, 1.8, qTheme.eyeColor || '#fef3c7', side * 0.25);
    fillCircle(22.2, ey, 1.0, qTheme.pupilColor || '#261005');
    fillCircle(21.6, ey - 0.5, 0.55, antz.eyeCatchlight || '#ffffff');
    ctx.strokeStyle = qTheme.antennae;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24.5, side * 2.2);
    ctx.lineTo(28.5, side * 6.5 + antWave * 0.4);
    ctx.lineTo(33, side * 4.5 + antWave);
    ctx.stroke();
  });
  ctx.restore();
}

// --- 6. MOUVEMENT DES FOURMIS SUR LE RÉSEAU DE TUNNELS ---
function updateAndDrawColonyAnts() {
  const nodes = GAME_CONFIG.CANVAS_THEME.nodes;

  visualAnts.forEach(ant => {
    const casteCfg = GAME_CONFIG.CASTES[ant.role] || GAME_CONFIG.CASTES.worker;

    if (gameState.speed > 0) {
      if (ant.pauseTimer > 0) {
        ant.pauseTimer -= gameState.speed;
        ant.wanderAngle += (Math.random() - 0.5) * 0.3;
        const center = getNodePixelPos(ant.currentNode);
        const nodeInfo = nodes[ant.currentNode];
        const maxR = nodeInfo && nodeInfo.isChamber ? nodeInfo.rx * 0.45 : 10;

        ant.vx = Math.cos(ant.wanderAngle);
        ant.vy = Math.sin(ant.wanderAngle) * 0.6;
        ant.x += ant.vx * 0.5 * gameState.speed;
        ant.y += ant.vy * 0.5 * gameState.speed;

        const dx = ant.x - center.x;
        const dy = ant.y - center.y;
        if (Math.hypot(dx, dy) > maxR) {
          ant.wanderAngle = Math.atan2(-dy, -dx);
        }
        ant.legPhase += 0.18 * gameState.speed;
      } else {
        const p1 = getNodePixelPos(ant.currentNode);
        const p2 = getNodePixelPos(ant.nextNode);
        const segDx = p2.x - p1.x;
        const segDy = p2.y - p1.y;
        const segDist = Math.max(1, Math.hypot(segDx, segDy));

        const step = (casteCfg.moveSpeed * gameState.speed) / segDist;
        ant.progress += step;
        ant.legPhase += 0.28 * casteCfg.moveSpeed * gameState.speed;

        const nx = -segDy / segDist;
        const ny = segDx / segDist;

        ant.x = p1.x + segDx * ant.progress + nx * ant.laneOffset;
        ant.y = p1.y + segDy * ant.progress + ny * ant.laneOffset;
        ant.vx = segDx;
        ant.vy = segDy;

        if (ant.progress >= 1) {
          ant.currentNode = ant.nextNode;
          ant.progress = 0;

          if (ant.role === 'worker') {
            if (ant.currentNode === 'surface_left' || ant.currentNode === 'surface_right') {
              ant.carrying = ant.currentNode === 'surface_left' ? 'leaf' : 'seed';
              ant.pauseTimer = 18;
            } else if (ant.currentNode === 'fungus') {
              ant.carrying = 'seed';
              ant.pauseTimer = 20;
            } else if (ant.currentNode === 'granary' && ant.carrying) {
              ant.carrying = null;
              ant.pauseTimer = 25;
            }
          }

          if (ant.currentNode === ant.goalNode) {
            const nodeObj = nodes[ant.currentNode];
            if (nodeObj && nodeObj.isChamber) {
              ant.pauseTimer = 25 + Math.floor(Math.random() * 35);
            }
            ant.goalNode = chooseGoalNodeForAnt(ant);
          }

          ant.nextNode = findNextNodeTowards(ant.currentNode, ant.goalNode);
        }
      }
    }

    drawAnt(ant.x, ant.y, ant.vx, ant.vy, ant.role, ant.legPhase, ant.carrying);
  });
}

// --- 7. ANIMATION DES RAIDS DE FOURMIS ROUGES & PARTICULES ---
function updateAndDrawRaidScene() {
  const warnSec = GAME_CONFIG.RAIDS.visualWarningSeconds;
  if (!raidScene.active && gameState.nextRaidTimer <= warnSec && gameState.nextRaidTimer > 0) {
    drawApproachingEnemyScouts();
  }

  if (!raidScene.active) return;

  if (gameState.speed > 0) {
    raidScene.frame += gameState.speed;
  }

  const combatNode = gameState.rooms.barricade > 0 ? 'barricade' : 'queen';
  const clashPos = getNodePixelPos(combatNode);
  const enemyCfg = GAME_CONFIG.CANVAS_THEME.enemyAnt;

  if (gameState.speed > 0 && raidScene.frame > 30 && raidScene.frame < raidScene.maxFrames - 45) {
    if (Math.random() < 0.45) {
      spawnCombatParticle(
        clashPos.x + (Math.random() - 0.5) * 34,
        clashPos.y + (Math.random() - 0.5) * 24,
        gameState.mutations.acide || gameState.squad.doctrine === 'acid'
      );
    }
  }

  raidScene.enemies.forEach(en => {
    if (gameState.speed > 0) {
      const p1 = getNodePixelPos(en.currentNode);
      const p2 = getNodePixelPos(en.nextNode);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.max(1, Math.hypot(dx, dy));

      en.progress += (enemyCfg.moveSpeed * gameState.speed) / dist;
      en.legPhase += 0.35 * gameState.speed;

      const nx = -dy / dist;
      const ny = dx / dist;
      en.x = p1.x + dx * en.progress + nx * en.laneOffset;
      en.y = p1.y + dy * en.progress + ny * en.laneOffset;
      en.vx = dx;
      en.vy = dy;

      if (en.progress >= 1) {
        en.currentNode = en.nextNode;
        en.progress = 0;

        if (!en.retreating) {
          if (en.currentNode === 'entrance') {
            en.nextNode = 'barricade';
          } else if (en.currentNode === 'barricade') {
            if (!raidScene.victory && gameState.rooms.barricade === 0) {
              en.nextNode = 'queen';
            } else {
              en.retreating = true;
              en.carryingStolenFood = !raidScene.victory;
              en.nextNode = 'entrance';
            }
          } else if (en.currentNode === 'queen') {
            en.retreating = true;
            en.carryingStolenFood = !raidScene.victory;
            en.nextNode = 'barricade';
          }
        } else {
          if (en.currentNode === 'barricade') {
            en.nextNode = 'entrance';
          } else if (en.currentNode === 'entrance') {
            en.nextNode = Math.random() < 0.5 ? 'surface_left' : 'surface_right';
          }
        }
      }
    }

    const fadeProgress = raidScene.frame / raidScene.maxFrames;
    if (!(raidScene.victory && en.retreating && fadeProgress > 0.75)) {
      drawAnt(
        en.x,
        en.y,
        en.vx,
        en.vy,
        'enemy',
        en.legPhase,
        en.carryingStolenFood ? 'seed' : null
      );
    }
  });

  if (raidScene.frame < raidScene.maxFrames) {
    const bannerText = raidScene.victory ? t('canvas.raid.win') : t('canvas.raid.loss');
    ctx.save();
    ctx.fillStyle = 'rgba(15, 12, 10, 0.82)';
    ctx.strokeStyle = raidScene.bannerColor;
    ctx.lineWidth = 1.5;
    const bw = 220;
    const bh = 26;
    ctx.beginPath();
    ctx.roundRect(clashPos.x - bw / 2, clashPos.y - 38, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = raidScene.bannerColor;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bannerText, clashPos.x, clashPos.y - 21);
    ctx.restore();
  } else {
    raidScene.active = false;
    raidScene.enemies = [];
  }
}

function drawApproachingEnemyScouts() {
  const warnSec = GAME_CONFIG.RAIDS.visualWarningSeconds;
  const ratio = 1 - (gameState.nextRaidTimer / warnSec);
  const pLeft = getNodePixelPos('surface_left');
  const pEnt = getNodePixelPos('entrance');

  for (let i = 0; i < 4; i++) {
    const tProg = Math.min(0.95, Math.max(0, ratio - i * 0.12));
    const x = pLeft.x + (pEnt.x - pLeft.x) * tProg;
    const y = pLeft.y + (pEnt.y - pLeft.y) * tProg;
    drawAnt(x, y, 1, 0, 'enemy', performance.now() * 0.02 + i, null);
  }
}

// --- 8. BANNIÈRE D'EXPÉDITION EN SURFACE ---
function drawSurfaceExpeditionBanner(w, surfaceY) {
  if (!gameState.activeExpedition) return;
  const exp = gameState.activeExpedition;
  const expShortName = t(`mission.${exp.id}.short`);

  ctx.save();
  const bx = w * 0.5;
  const by = surfaceY - 42;
  ctx.fillStyle = 'rgba(20, 16, 12, 0.85)';
  ctx.strokeStyle = '#f6ad55';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(bx - 105, by - 12, 210, 22, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f6ad55';
  ctx.font = '700 10.5px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('canvas.exp.banner', { name: expShortName, sec: exp.timer }), bx, by + 3);
  ctx.restore();
}

// --- DESSIN D'UNE FOURMI 3D CGI (STYLE FILM FOURMIZ / ANTZ : VOLUMES, YEUX EXPRESSIFS, PATTES ARTICULÉES) ---
function drawAnt(x, y, vx, vy, role, phase, carrying) {
  ensureCanvasBindings();
  const theme = GAME_CONFIG.CANVAS_THEME;
  const antz = theme.antzStyle || {};
  const isEnemy = role === 'enemy';
  const casteToken = isEnemy ? theme.enemyAnt : (GAME_CONFIG.CASTES[role] || GAME_CONFIG.CASTES.worker);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx));
  ctx.scale(casteToken.scale, casteToken.scale);

  fillEllipse(-0.5, 1.8, 7.5, 4.2, antz.dropShadowColor || 'rgba(8, 5, 3, 0.48)');
  if (isEnemy) fillEllipse(0, 0, 9.5, 6, theme.enemyAnt.glowColor);
  else if (role === 'nurse') fillEllipse(-5.5, 0, 6.5, 5, casteToken.honeyGlow || 'rgba(251, 191, 36, 0.45)');

  ctx.strokeStyle = isEnemy ? theme.enemyAnt.legColor : theme.antLegColor;
  ctx.lineWidth = role === 'tank' ? 1.35 : 1.05;
  ctx.lineCap = 'round';
  const gait = Math.sin(phase) * 2.4;
  [-1, 1].forEach(side => {
    [-1, 0, 1].forEach(legIdx => {
      const swing = gait * (legIdx === 0 ? -1 : 1) * side;
      const hipX = legIdx * 2.2;
      ctx.beginPath();
      ctx.moveTo(hipX, side * 1.4);
      ctx.lineTo(hipX + swing * 0.45, side * 4.2);
      ctx.lineTo(hipX + legIdx * 1.6 + swing, side * (6.8 + (legIdx === 0 ? 0.8 : 0)));
      ctx.stroke();
    });
  });

  const gastreRx = role === 'nurse' ? 5.2 : (role === 'tank' ? 4.8 : 4.5);
  const gastreRy = role === 'nurse' ? 3.9 : (role === 'tank' ? 3.5 : 3.1);
  fillEllipse(-6.2, 0, gastreRx, gastreRy, casteToken.canvasColor);

  ctx.strokeStyle = casteToken.stripeColor || '#3d1f0d';
  ctx.lineWidth = 0.85;
  [-8.2, -6.2, -4.2].forEach(sx => {
    ctx.beginPath();
    ctx.moveTo(sx, -gastreRy * 0.82);
    ctx.quadraticCurveTo(sx + 0.9, 0, sx, gastreRy * 0.82);
    ctx.stroke();
  });

  fillEllipse(-6.8, -gastreRy * 0.38, gastreRx * 0.58, gastreRy * 0.34,
    role === 'nurse' ? 'rgba(254, 240, 138, 0.75)' : (casteToken.highlightColor || antz.specularColor || 'rgba(255, 246, 224, 0.55)'), -0.1);
  fillEllipse(-2.1, 0, 1.2, 0.95, antz.petioleColor || '#3d1f0d');
  fillEllipse(0.6, 0, 3.1, 2.2, casteToken.canvasColor);

  if (role === 'warrior' || role === 'tank') fillEllipse(0.8, 0, 2.5, 1.9, casteToken.armorColor || '#d69e2e');
  else fillEllipse(0.6, -0.7, 1.8, 0.75, antz.specularColor || 'rgba(255, 246, 224, 0.58)');

  const headX = role === 'tank' ? 4.8 : 4.4;
  const headRx = role === 'tank' ? 4.1 : (role === 'warrior' ? 3.1 : 2.8);
  const headRy = role === 'tank' ? 3.7 : (role === 'warrior' ? 2.7 : 2.4);
  fillEllipse(headX, 0, headRx, headRy, casteToken.headColor || casteToken.canvasColor);

  if (role === 'tank') {
    ctx.strokeStyle = casteToken.armorColor || '#d69e2e';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(headX - 0.5, 0, headRy * 0.75, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
  }

  const eyeX = headX + headRx * 0.28, eyeSpread = headRy * 0.68;
  const antWiggle = Math.sin(phase * 0.5) * 0.9;
  const isFighter = role === 'warrior' || role === 'tank' || isEnemy;
  const jawLen = isFighter ? 2.8 : 1.5;

  [-1, 1].forEach(side => {
    const ey = side * eyeSpread;
    fillEllipse(eyeX, ey, 1.25, 0.95, casteToken.eyeColor || '#fef3c7', side * 0.25);
    fillCircle(eyeX + 0.35, ey, 0.52, casteToken.pupilColor || '#261005');
    fillCircle(eyeX + 0.1, ey - 0.25, 0.28, antz.eyeCatchlight || '#ffffff');

    ctx.strokeStyle = isEnemy ? theme.enemyAnt.legColor : theme.antLegColor;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(headX + headRx * 0.65, side * 1.1);
    ctx.lineTo(headX + headRx + 1.8, side * 3.1 + antWiggle * 0.5);
    ctx.lineTo(headX + headRx + 3.8, side * 2.1 + antWiggle);
    ctx.stroke();

    ctx.strokeStyle = isFighter ? (isEnemy ? '#fbd38d' : (antz.mandibleSteel || '#e2e8f0')) : (casteToken.highlightColor || '#ed9b5a');
    ctx.lineWidth = isFighter ? 1.15 : 0.8;
    ctx.beginPath();
    ctx.moveTo(headX + headRx * 0.75, side * 1.35);
    ctx.quadraticCurveTo(headX + headRx + jawLen * 0.6, side * 1.6, headX + headRx + jawLen, side * 0.35);
    ctx.stroke();
  });

  if (carrying === 'leaf') {
    const lx = headX + headRx + 3.2;
    fillEllipse(lx, 0, 4.5, 2.7, theme.leafColor, 0.35);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(lx - 2.8, -0.8);
    ctx.lineTo(lx + 2.8, 0.8);
    ctx.stroke();
  } else if (carrying === 'seed') {
    const sx = headX + headRx + 2.6;
    fillCircle(sx, 0, 2.7, theme.seedCarryColor);
    fillCircle(sx - 0.8, -0.8, 0.8, '#ffffff');
  } else if (carrying === 'honeydew') {
    const hx = headX + headRx + 2.8;
    fillEllipse(hx, 0, 3.2, 2.4, '#ecc94b', 0.1);
    fillCircle(hx - 0.7, -0.6, 0.7, '#ffffff');
  } else if (carrying === 'twigs') {
    const tx = headX + headRx + 2.8;
    ctx.strokeStyle = '#d69e2e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tx - 3, -3);
    ctx.lineTo(tx + 3, 3);
    ctx.stroke();
  } else if (carrying === 'chitin') {
    const cx = headX + headRx + 2.6;
    fillEllipse(cx, 0, 3.0, 2.1, '#319795', -0.2);
    fillCircle(cx - 0.6, -0.6, 0.6, '#ffffff');
  }

  ctx.restore();
}

// Export unifié pour l'environnement de test Node.js et modularité globale
const rendererScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
const rendererExports = {
  visualAnts, stars, snowflakes, combatParticles, floatingTexts, seasonalParticles, raidScene,
  initCanvas, resizeCanvas, initEnvironmentDetails, syncVisualAntsWithColony, triggerAntSpawnEffect,
  triggerRaidVisuals, spawnCombatParticle, updateAndDrawCombatParticles, renderCanvasLoop,
  drawSkyAndSurface, drawUndergroundBackground, drawAllTunnels, drawAllChambers, drawBarricade,
  drawQueen, drawAnt, updateAndDrawColonyAnts, updateAndDrawRaidScene, drawSurfaceExpeditionBanner,
  hitTestNode, triggerScreenShake, spawnCanvasFloatingText, updateAndDrawFloatingTexts,
  drawPheromoneTrails, drawBioluminescentSpores, initSeasonalParticles, updateAndDrawSeasonalParticles,
  drawHoverHaloAndTooltip, handleCanvasClick, handleCanvasMouseMove, handleCanvasMouseLeave,
  handleCanvasTouchStart, handleCanvasTouchMove, handleCanvasTouchEnd
};
Object.assign(rendererScope, rendererExports);

/* c8 ignore next 3 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = rendererExports;
}
