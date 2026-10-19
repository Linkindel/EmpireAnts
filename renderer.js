/**
 * Empire Fourmi - Moteur de Rendu Graphique 2D Réaliste (Canvas)
 * - Circulation des fourmis par graphe dans les galeries et chambres
 * - Cycle Jour / Nuit + 4 Saisons dynamiques (Printemps, Été, Automne, Hiver avec neige)
 * - Barricade d'entrée évolutive & Champignonnière bioluminescente
 * - Animation des raids de Fourmis Rouges et particules de combat (mandibules & acide)
 */

let canvas, ctx;
const visualAnts = [];
const stars = [];
const snowflakes = [];
const grassBlades = [];
const rockSpeckles = [];
const combatParticles = [];

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

function initCanvas() {
  canvas = document.getElementById('colonyCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initEnvironmentDetails();
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
}

// --- GRAPHE DE NAVIGATION DES GALERIES ---
function getNodePixelPos(nodeId) {
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
  const roles = ['worker', 'scout', 'warrior', 'tank'];

  roles.forEach(role => {
    const deployedInExp = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot[role]) || 0;
    const inNestCount = Math.max(0, (gameState.ants[role] || 0) - deployedInExp);
    const desired = Math.min(inNestCount, caps[role]);
    const currentAnts = visualAnts.filter(a => a.role === role);

    if (currentAnts.length < desired) {
      const toAdd = desired - currentAnts.length;
      const defaultStart = role === 'warrior' || role === 'tank' ? 'dorm' : 'queen';
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
window.triggerRaidVisuals = function(victory) {
  if (!canvas) return;
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

  // 1. Ciel dynamique (Cycle Jour/Nuit + 4 Saisons), Soleil/Lune, Herbe et Tertre
  const surfaceY = h * GAME_CONFIG.CANVAS_THEME.surfaceHeightRatio;
  drawSkyAndSurface(w, h, surfaceY, timestamp);

  // 2. Sous-sol & Texture rocheuse
  drawUndergroundBackground(w, h, surfaceY);

  // 3. Tunnels du réseau souterrain
  drawAllTunnels();

  // 4. Chambres souterraines & Détails internes
  drawAllChambers();

  // 5. Barricade d'entrée
  drawBarricade();

  // 6. Fourmis de la colonie circulant dans les tunnels et chambres
  updateAndDrawColonyAnts();

  // 7. Raids ennemis & Particules de combat
  updateAndDrawRaidScene();
  updateAndDrawCombatParticles();

  // 8. Indicateur visuel d'expédition en surface
  drawSurfaceExpeditionBanner(w, surfaceY);

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
  const theme = GAME_CONFIG.CANVAS_THEME;
  const dn = theme.dayNight;
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

  // Sol herbeux teinté selon la saison
  ctx.fillStyle = starAlpha > 0.5 ? season.grassNight : season.grassDay;
  ctx.fillRect(0, surfaceY - 7, w, 9);

  ctx.save();
  ctx.strokeStyle = starAlpha > 0.5 ? season.grassDay : season.grassBladeColor;
  ctx.lineWidth = 1.8;
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

  // Gisements visuels en surface
  drawSurfaceResources(w, surfaceY, season);

  // Tertre de la fourmilière
  ctx.save();
  const moundGrad = ctx.createLinearGradient(w * 0.4, surfaceY - 28, w * 0.6, surfaceY);
  moundGrad.addColorStop(0, theme.moundHighlight);
  moundGrad.addColorStop(1, theme.moundColor);
  ctx.fillStyle = moundGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.39, surfaceY);
  ctx.quadraticCurveTo(w * 0.5, surfaceY - 30, w * 0.61, surfaceY);
  ctx.fill();

  // Entrée sombre du nid
  ctx.fillStyle = theme.entranceColor;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, surfaceY - 3, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSurfaceResources(w, surfaceY, season) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  ctx.save();
  const leftX = w * theme.nodes.surface_left.xRatio;
  ctx.fillStyle = season.leafDepositColor;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(leftX + i * 7, surfaceY - 9 - Math.abs(i % 2) * 4, 6, 3.5, i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const rightX = w * theme.nodes.surface_right.xRatio;
  ctx.fillStyle = theme.seedCarryColor;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(rightX + i * 6, surfaceY - 7 - (i % 2) * 3, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- 2. SOUS-SOL & GALERIES ---
function drawUndergroundBackground(w, h, surfaceY) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  const earthGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
  earthGrad.addColorStop(0, theme.earthGradientTop);
  earthGrad.addColorStop(0.5, theme.earthGradientMid);
  earthGrad.addColorStop(1, theme.earthGradientBottom);
  ctx.fillStyle = earthGrad;
  ctx.fillRect(0, surfaceY, w, h - surfaceY);

  ctx.save();
  ctx.fillStyle = theme.rockSpeckleColor;
  rockSpeckles.forEach(r => {
    ctx.beginPath();
    ctx.ellipse(r.xRatio * w, r.yRatio * h, r.rx, r.ry, r.angle, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawAllTunnels() {
  const theme = GAME_CONFIG.CANVAS_THEME;
  GAME_CONFIG.CANVAS_THEME.edges.forEach(([a, b]) => {
    if (a.startsWith('surface') && b === 'entrance') return;
    if (b.startsWith('surface') && a === 'entrance') return;
    // Masquer les galeries vers la champignonnière tant qu'elle est au niveau 0
    if ((a === 'fungus' || b === 'fungus') && gameState.rooms.fungus <= 0) return;

    const p1 = getNodePixelPos(a);
    const p2 = getNodePixelPos(b);

    ctx.save();
    ctx.strokeStyle = theme.tunnelOuterColor;
    ctx.lineWidth = theme.tunnelWidth + 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.strokeStyle = theme.tunnelColor;
    ctx.lineWidth = theme.tunnelWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  });
}

// --- 3. CHAMBRES SOUTERRAINES & DÉTAILS INTERNES ---
function drawAllChambers() {
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
    }
  });
}

function drawUnbuiltChamber(x, y, rx, ry, label) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  ctx.save();
  ctx.strokeStyle = 'rgba(166, 152, 136, 0.2)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(166, 152, 136, 0.45)';
  ctx.font = '500 9.5px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🍄 ${label} (${t('canvas.unbuilt')})`, x, y + 3);
  ctx.restore();
}

function drawChamberBase(x, y, rx, ry, label, roomLvl, roomKey, bgColor) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = theme.chamberStrokeColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.chamberLabelColor;
  ctx.font = '600 10px Outfit, sans-serif';
  ctx.textAlign = 'center';
  const lvlText = roomKey ? ` (${t('canvas.lvl.short')} ${roomLvl})` : '';
  ctx.fillText(`${label}${lvlText}`, x, y + ry - 8);
  ctx.restore();
}

function drawQueenChamberDetails(x, y, rx, ry) {
  const details = GAME_CONFIG.CANVAS_THEME.chamberDetails;
  ctx.save();
  ctx.fillStyle = details.royalRugColor;
  ctx.beginPath();
  ctx.ellipse(x, y - 3, rx * 0.65, ry * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawQueen(x, y);
}

function drawGranaryDetails(x, y, rx, ry) {
  const details = GAME_CONFIG.CANVAS_THEME.chamberDetails;
  const fillRatio = Math.min(1, Math.max(0, gameState.food / gameState.maxFood));
  const itemCount = Math.floor(fillRatio * 22);

  ctx.save();
  for (let i = 0; i < itemCount; i++) {
    const row = Math.floor(i / 6);
    const col = (i % 6) - 2.5;
    const ix = x + col * (rx * 0.22);
    const iy = y + 6 - row * 6;

    ctx.fillStyle = i % 2 === 0 ? details.seedColor : details.leafColor;
    ctx.beginPath();
    ctx.ellipse(ix, iy, 4.5, 2.8, (i * 0.5) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDormDetails(x, y, rx, ry, lvl) {
  const details = GAME_CONFIG.CANVAS_THEME.chamberDetails;
  const alcoves = Math.min(5, 2 + Math.floor(lvl / 2));
  ctx.save();
  ctx.fillStyle = details.dormBunkColor;
  for (let i = 0; i < alcoves; i++) {
    const offset = (i - (alcoves - 1) / 2) * 20;
    ctx.beginPath();
    ctx.ellipse(x + offset, y - 4, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFungusDetails(x, y, rx, ry, lvl) {
  const details = GAME_CONFIG.CANVAS_THEME.chamberDetails;
  const count = Math.min(8, 2 + lvl * 2);
  ctx.save();
  ctx.fillStyle = details.mushroomGlow;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, rx * 0.65, ry * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < count; i++) {
    const mx = x + (i - (count - 1) / 2) * 12;
    const my = y + 2 - (i % 2) * 5;

    // Pied du champignon
    ctx.fillStyle = details.mushroomStem;
    ctx.fillRect(mx - 1.5, my - 5, 3, 6);

    // Chapeau bioluminescent
    ctx.fillStyle = details.mushroomCap;
    ctx.beginPath();
    ctx.arc(mx, my - 5, 5.5, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawNurseryDetails(x, y, rx, ry) {
  const details = GAME_CONFIG.CANVAS_THEME.chamberDetails;
  const activeEggsCount = gameState.eggs ? gameState.eggs.length : 0;
  const baseEggs = Math.min(14, 4 + gameState.rooms.queen * 2 + activeEggsCount);

  ctx.save();
  for (let i = 0; i < baseEggs; i++) {
    const angle = (i / baseEggs) * Math.PI * 2;
    const dist = (i % 3) * 8 + 5;
    const ex = x + Math.cos(angle) * dist * 1.3;
    const ey = y - 4 + Math.sin(angle) * dist * 0.6;
    const isIncubating = i < activeEggsCount;

    ctx.fillStyle = details.eggShadow;
    ctx.beginPath();
    ctx.ellipse(ex, ey + 1, 4.5, 2.8, angle * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isIncubating ? details.eggActiveColor : details.eggColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey, isIncubating ? 4.4 : 3.6, isIncubating ? 2.7 : 2.2, angle * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- 4. BARRICADE D'ENTRÉE ---
function drawBarricade() {
  const lvl = gameState.rooms.barricade;
  const pos = getNodePixelPos('barricade');
  const bTheme = GAME_CONFIG.CANVAS_THEME.barricadeVisual;

  ctx.save();
  ctx.translate(pos.x, pos.y);

  if (lvl <= 0) {
    ctx.strokeStyle = 'rgba(166, 152, 136, 0.22)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.fillStyle = bTheme.shieldGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 + Math.min(10, lvl * 2), 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const logsCount = Math.min(7, 2 + lvl);
  for (let i = 0; i < logsCount; i++) {
    const yOff = (i - (logsCount - 1) / 2) * 2.5;
    const tilt = (i % 2 === 0 ? 1 : -1) * 0.18;
    ctx.save();
    ctx.translate(0, yOff);
    ctx.rotate(tilt);
    ctx.fillStyle = i % 2 === 0 ? bTheme.woodDark : bTheme.woodLight;
    ctx.fillRect(-18, -2.5, 36, 5);
    ctx.restore();
  }

  ctx.fillStyle = bTheme.stoneColor;
  ctx.beginPath();
  ctx.arc(-16, 2, 5, 0, Math.PI * 2);
  ctx.arc(16, 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bTheme.badgeBg;
  ctx.strokeStyle = bTheme.badgeBorder;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(22, -9, 54, 17, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = bTheme.badgeText;
  ctx.font = '700 9.5px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🧱 ${t('canvas.lvl.short')}${lvl}`, 49, 3);

  ctx.restore();
}

// --- 5. REINE ---
function drawQueen(x, y) {
  const qTheme = GAME_CONFIG.CANVAS_THEME.queen;
  const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.04;

  ctx.save();
  ctx.translate(x, y - 5);

  ctx.fillStyle = qTheme.abdomen;
  ctx.beginPath();
  ctx.ellipse(-12, 0, 18 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = qTheme.abdomenStripe;
  ctx.lineWidth = 2;
  for (let s = -18; s <= -6; s += 6) {
    ctx.beginPath();
    ctx.moveTo(s, -9 * pulse);
    ctx.quadraticCurveTo(s + 2, 0, s, 9 * pulse);
    ctx.stroke();
  }

  ctx.fillStyle = qTheme.thorax;
  ctx.beginPath();
  ctx.ellipse(6, 0, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = qTheme.head;
  ctx.beginPath();
  ctx.ellipse(18, 0, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const antWave = Math.sin(performance.now() * 0.006) * 2;
  ctx.strokeStyle = qTheme.antennae;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(22, -3);
  ctx.lineTo(29, -8 + antWave);
  ctx.moveTo(22, 3);
  ctx.lineTo(29, 8 - antWave);
  ctx.stroke();

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

function spawnCombatParticle(x, y, useAcid) {
  const cTheme = GAME_CONFIG.CANVAS_THEME.combat;
  const isAcid = useAcid && Math.random() < 0.55;
  combatParticles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 3.2,
    vy: (Math.random() - 0.5) * 3.2,
    radius: isAcid ? 3.5 : 2.2,
    color: isAcid ? cTheme.acidColor : (Math.random() < 0.5 ? cTheme.sparkColor : cTheme.bloodColor),
    alpha: 1.0
  });
}

function updateAndDrawCombatParticles() {
  for (let i = combatParticles.length - 1; i >= 0; i--) {
    const p = combatParticles[i];
    if (gameState.speed > 0) {
      p.x += p.vx * gameState.speed;
      p.y += p.vy * gameState.speed;
      p.alpha -= 0.04 * gameState.speed;
    }
    if (p.alpha <= 0) {
      combatParticles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

// --- DESSIN D'UNE FOURMI (COLONIE OU ENNEMIE) ---
function drawAnt(x, y, vx, vy, role, phase, carrying) {
  const theme = GAME_CONFIG.CANVAS_THEME;
  const isEnemy = role === 'enemy';
  const casteToken = isEnemy ? theme.enemyAnt : (GAME_CONFIG.CASTES[role] || GAME_CONFIG.CASTES.worker);

  ctx.save();
  ctx.translate(x, y);

  const angle = Math.atan2(vy, vx);
  ctx.rotate(angle);
  ctx.scale(casteToken.scale, casteToken.scale);

  if (isEnemy) {
    ctx.fillStyle = theme.enemyAnt.glowColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = isEnemy ? theme.enemyAnt.legColor : theme.antLegColor;
  ctx.lineWidth = 1.1;
  const legOffset = Math.sin(phase) * 2.8;
  ctx.beginPath();
  ctx.moveTo(-3, -5 + legOffset);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-3, 5 - legOffset);
  ctx.moveTo(0, -5.5 - legOffset);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, 5.5 + legOffset);
  ctx.moveTo(3, -5 + legOffset);
  ctx.lineTo(2, 0);
  ctx.lineTo(3, 5 - legOffset);
  ctx.stroke();

  ctx.fillStyle = casteToken.canvasColor;
  ctx.beginPath();
  ctx.ellipse(-5, 0, 4.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, 0, 2.6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = casteToken.headColor || casteToken.canvasColor;
  ctx.beginPath();
  if (role === 'tank') {
    ctx.ellipse(4.2, 0, 4, 3.6, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(4, 0, 2.6, 2.3, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  if (role === 'warrior' || role === 'tank' || isEnemy) {
    ctx.strokeStyle = isEnemy ? '#fbd38d' : '#e2e8f0';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(6, -1.5);
    ctx.lineTo(8.2, -0.6);
    ctx.moveTo(6, 1.5);
    ctx.lineTo(8.2, 0.6);
    ctx.stroke();
  }

  if (carrying === 'leaf') {
    ctx.fillStyle = theme.leafColor;
    ctx.beginPath();
    ctx.ellipse(8.5, 0, 4.2, 2.5, 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (carrying === 'seed') {
    ctx.fillStyle = theme.seedCarryColor;
    ctx.beginPath();
    ctx.arc(8, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
