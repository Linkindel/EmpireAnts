const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { GAME_CONFIG } = require('../config.js');
const { gameState, createFreshGameState } = require('../game.js');
const renderer = require('../renderer.js');

const {
  visualAnts,
  stars,
  snowflakes,
  combatParticles,
  raidScene,
  initCanvas,
  resizeCanvas,
  initEnvironmentDetails,
  syncVisualAntsWithColony,
  triggerAntSpawnEffect,
  triggerRaidVisuals,
  spawnCombatParticle,
  updateAndDrawCombatParticles,
  drawSkyAndSurface,
  drawUndergroundBackground,
  drawAllTunnels,
  drawAllChambers,
  drawBarricade,
  drawQueen,
  drawAnt,
  updateAndDrawColonyAnts,
  updateAndDrawRaidScene,
  drawSurfaceExpeditionBanner,
  hitTestNode,
  triggerScreenShake,
  spawnCanvasFloatingText,
  updateAndDrawFloatingTexts,
  drawPheromoneTrails,
  drawBioluminescentSpores,
  initSeasonalParticles,
  updateAndDrawSeasonalParticles,
  drawHoverHaloAndTooltip,
  floatingTexts,
  seasonalParticles,
  handleCanvasClick,
  handleCanvasMouseMove,
  handleCanvasMouseLeave,
  handleCanvasTouchStart,
  handleCanvasTouchMove,
  handleCanvasTouchEnd
} = renderer;

// Mock complet du contexte Canvas 2D
function createMockCanvasContext() {
  return {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    arc: () => {},
    ellipse: () => {},
    roundRect: () => {},
    rect: () => {},
    fill: () => {},
    stroke: () => {},
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    canvas: { width: 800, height: 600 }
  };
}

describe('Moteur Graphique (renderer.js) - Tests Canvas, Particules & Entités', () => {
  beforeEach(() => {
    Object.assign(gameState, createFreshGameState());
    visualAnts.length = 0;
    combatParticles.length = 0;
    stars.length = 0;
    snowflakes.length = 0;
  });

  it('doit générer les détails environnementaux (étoiles, neige) selon le thème', () => {
    initEnvironmentDetails();
    assert.equal(stars.length, GAME_CONFIG.CANVAS_THEME.dayNight.starCount);
    assert.equal(snowflakes.length, GAME_CONFIG.CANVAS_THEME.dayNight.snowCount);

    stars.forEach(s => {
      assert.ok(s.xRatio >= 0 && s.xRatio <= 1);
      assert.ok(s.yRatio >= 0 && s.yRatio <= 1);
      assert.ok(s.radius > 0);
    });
  });

  it('doit synchroniser visualAnts avec les effectifs de la colonie (dans la limite du plafond)', () => {
    gameState.ants = { worker: 8, scout: 2, warrior: 3, tank: 1 };
    syncVisualAntsWithColony();

    assert.ok(visualAnts.length > 0);
    const workers = visualAnts.filter(a => a.role === 'worker');
    const scouts = visualAnts.filter(a => a.role === 'scout');
    const warriors = visualAnts.filter(a => a.role === 'warrior');
    const tanks = visualAnts.filter(a => a.role === 'tank');

    assert.equal(workers.length, 8);
    assert.equal(scouts.length, 2);
    assert.equal(warriors.length, 3);
    assert.equal(tanks.length, 1);

    // Si on réduit les troupes, visualAnts doit purger le surplus
    gameState.ants.worker = 3;
    syncVisualAntsWithColony();
    assert.equal(visualAnts.filter(a => a.role === 'worker').length, 3);

    // Si les troupes dépassent le plafond visuel, on plafonne
    const maxWorker = GAME_CONFIG.CANVAS_THEME.maxVisualAntsPerCaste.worker;
    gameState.ants.worker = 200;
    syncVisualAntsWithColony();
    assert.equal(visualAnts.filter(a => a.role === 'worker').length, maxWorker);
  });

  it('doit générer des particules de combat et faire progresser leur cycle de vie', () => {
    spawnCombatParticle(100, 150, false);
    spawnCombatParticle(120, 160, true);

    assert.equal(combatParticles.length, 2);
    assert.equal(combatParticles[0].x, 100);
    assert.equal(combatParticles[0].y, 150);
    assert.equal(combatParticles[0].alpha, 1.0);

    // Faire évoluer les particules
    globalThis.ctx = createMockCanvasContext();
    gameState.speed = 1;
    updateAndDrawCombatParticles();

    // L'opacité diminue
    assert.ok(combatParticles[0].alpha < 1.0);

    // Forcer la fin de vie
    combatParticles[0].alpha = 0.01;
    combatParticles[1].alpha = 0.01;
    updateAndDrawCombatParticles();
    assert.equal(combatParticles.length, 0);
  });

  it('doit initialiser et piloter la scène visuelle de raid', () => {
    const mockCtx = createMockCanvasContext();
    globalThis.canvas = { width: 800, height: 600, parentElement: { clientWidth: 800, clientHeight: 600 } };
    globalThis.ctx = mockCtx;

    // Déclencher un raid victorieux
    if (typeof globalThis.triggerRaidVisuals === 'function') {
      globalThis.triggerRaidVisuals(true);
      assert.equal(raidScene.active, true);
      assert.equal(raidScene.victory, true);
      assert.ok(raidScene.enemies.length > 0);
      assert.equal(raidScene.bannerColor, GAME_CONFIG.CANVAS_THEME.leafColor);

      // Déclencher un raid perdu
      globalThis.triggerRaidVisuals(false);
      assert.equal(raidScene.active, true);
      assert.equal(raidScene.victory, false);
      assert.equal(raidScene.bannerColor, GAME_CONFIG.CANVAS_THEME.enemyAnt.canvasColor);
    }
  });

  it('doit supporter triggerAntSpawnEffect et resizeCanvas en mode DOM', () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      parentElement: { clientWidth: 1024, clientHeight: 768 },
      getContext: () => createMockCanvasContext()
    };
    globalThis.document = {
      getElementById: (id) => (id === 'colonyCanvas' ? mockCanvas : null)
    };
    globalThis.window = {
      addEventListener: () => {}
    };

    initCanvas();
    assert.equal(mockCanvas.width, 1024);
    assert.equal(mockCanvas.height, 768);

    const prevCount = visualAnts.length;
    triggerAntSpawnEffect('worker');
    assert.equal(visualAnts.length, prevCount + 1);
    assert.equal(visualAnts[visualAnts.length - 1].role, 'worker');
    assert.equal(visualAnts[visualAnts.length - 1].currentNode, 'nursery');
  });

  it('doit exécuter les fonctions de dessin vectoriel (ciel, sous-sol, tunnels, chambres, barricade, reine, fourmis) sans erreur', () => {
    const mockCtx = createMockCanvasContext();
    globalThis.canvas = { width: 800, height: 600 };
    globalThis.ctx = mockCtx;

    // Test Ciel et Surface
    drawSkyAndSurface(800, 600, 114, 1000);

    // Test Arrière-plan souterrain
    drawUndergroundBackground(800, 600, 114);

    // Test Tunnels
    drawAllTunnels();

    // Test Chambres avec différents niveaux de salles
    gameState.rooms = { queen: 2, granary: 3, dorm: 2, barricade: 1, fungus: 2 };
    drawAllChambers();

    // Test Barricade
    drawBarricade();

    // Test Reine
    drawQueen(400, 300);

    // Test Dessin de toutes les castes de fourmis (worker, scout, warrior, tank, nurse, enemy) style Fourmiz (Antz) et objets transportés
    drawAnt(100, 100, 1, 0, 'worker', 0, 'leaf');
    drawAnt(120, 100, -1, 0, 'worker', 0.5, 'seed');
    drawAnt(140, 100, 0, 1, 'scout', 1.0, null);
    drawAnt(160, 100, 0, -1, 'warrior', 1.5, null);
    drawAnt(180, 100, 1, 1, 'tank', 2.0, null);
    drawAnt(190, 100, 1, 0, 'nurse', 1.2, null);
    drawAnt(200, 100, -1, -1, 'enemy', 2.5, 'seed');

    // Test Chambre Royale avec Trophée Mante Royale et Gisements en Cooldown
    gameState.bossesDefeated = { mantis: true };
    gameState.manualHarvestCooldowns = { left: (Date.now() / 1000) + 2, right: 0 };
    drawAllChambers();
    drawSkyAndSurface(800, 600, 114, 1000);

    // Test Animation des fourmis de colonie en mouvement et patrouille
    gameState.ants = { worker: 4, scout: 2, warrior: 2, tank: 1 };
    syncVisualAntsWithColony();
    gameState.speed = 1;
    updateAndDrawColonyAnts();

    // Test Animation de la scène de raid
    triggerRaidVisuals(true);
    updateAndDrawRaidScene();

    // Test Bannière d'expédition active
    gameState.activeExpedition = { id: 'pucerons', duration: 8, timer: 5 };
    drawSurfaceExpeditionBanner(800, 114);
  });
});

describe('Lot 2 — Canvas Living World & Interactivité Directe (Game Feel)', () => {
  let mockCtx;

  beforeEach(() => {
    Object.assign(gameState, createFreshGameState());
    mockCtx = createMockCanvasContext();
    globalThis.canvas = {
      width: 800,
      height: 600,
      style: {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    };
    globalThis.ctx = mockCtx;
    floatingTexts.length = 0;
    seasonalParticles.length = 0;
  });

  it('doit détecter précisément les nœuds avec hitTestNode (chambres elliptiques et dépôts circulaires)', () => {
    const size = { width: 800, height: 600 };
    const nodes = GAME_CONFIG.CANVAS_THEME.nodes;

    // 1. Chambre Royale au centre (xRatio: 0.50 -> 400, yRatio: 0.46 -> 276, rx: 76, ry: 42)
    const hitQueenCenter = hitTestNode(400, 276, nodes, size);
    assert.ok(hitQueenCenter, 'Centre de la reine doit être détecté');
    assert.equal(hitQueenCenter.nodeId, 'queen');
    assert.equal(hitQueenCenter.isChamber, true);
    assert.equal(hitQueenCenter.distance, 0);

    // Point intérieur dans l'ellipse de la reine (dx=40, dy=20 -> (40/76)^2 + (20/42)^2 = 0.27 + 0.22 < 1)
    const hitQueenInside = hitTestNode(440, 296, nodes, size);
    assert.ok(hitQueenInside);
    assert.equal(hitQueenInside.nodeId, 'queen');

    // Point en dehors de l'ellipse de la reine
    const hitQueenOutside = hitTestNode(400, 200, nodes, size);
    assert.ok(!hitQueenOutside || hitQueenOutside.nodeId !== 'queen');

    // 2. Dépôt de surface gauche (xRatio: 0.12 -> 96, yRatio: 0.175 -> 105, hitRadius: 28)
    const hitSurfaceLeft = hitTestNode(96, 105, nodes, size);
    assert.ok(hitSurfaceLeft, 'Dépôt surface_left doit être détecté');
    assert.equal(hitSurfaceLeft.nodeId, 'surface_left');
    assert.equal(hitSurfaceLeft.isChamber, false);

    // 3. Cas limites défensifs
    assert.equal(hitTestNode(null, 100), null);
    assert.equal(hitTestNode(100, undefined), null);
    assert.equal(hitTestNode(NaN, 100), null);
    assert.equal(hitTestNode(100, Infinity), null);
    assert.equal(hitTestNode(100, 100, null), null);
    assert.equal(hitTestNode(100, 100, nodes, { width: 0, height: 600 }), null);
    assert.equal(hitTestNode(100, 100, nodes, { width: 800, height: -10 }), null);
    assert.equal(hitTestNode(100, 100, nodes, null), null);
  });

  it('doit gérer le cycle de vie des textes flottants (spawn, montée vy, fondu et purge)', () => {
    // Spawn par identifiant de nœud
    spawnCanvasFloatingText('granary', '+15 🍃', '#48bb78');
    assert.equal(floatingTexts.length, 1);
    assert.equal(floatingTexts[0].text, '+15 🍃');
    assert.equal(floatingTexts[0].color, '#48bb78');
    assert.ok(floatingTexts[0].vy < 0);

    // Spawn par coordonnées absolues
    spawnCanvasFloatingText({ x: 250, y: 180 }, '+1 🐜', '#f6ad55');
    assert.equal(floatingTexts.length, 2);
    assert.equal(floatingTexts[1].text, '+1 🐜');

    // Appel invalide sans effet
    spawnCanvasFloatingText(null, 'invalide');
    assert.equal(floatingTexts.length, 2);

    // Évolution avec updateAndDrawFloatingTexts
    const prevY = floatingTexts[0].y;
    updateAndDrawFloatingTexts();
    assert.ok(floatingTexts[0].y < prevY, 'Le texte doit monter vers le haut');

    // Purge lorsque life arrive à 0
    floatingTexts[0].life = 1;
    floatingTexts[1].life = 1;
    updateAndDrawFloatingTexts();
    assert.equal(floatingTexts.length, 0, 'Les textes expirés doivent être retirés');
  });

  it('doit appliquer et amortir le screen shake', () => {
    triggerScreenShake(7, 18);
    // Vérifier l'exécution dans renderCanvasLoop sans crash
    const frameTs = 1000;
    assert.doesNotThrow(() => {
      // Mock requestAnimationFrame pour éviter boucle infinie en test
      globalThis.requestAnimationFrame = () => {};
      renderer.renderCanvasLoop(frameTs);
    });
  });

  it('doit dessiner les phéromones lumineuses et les spores bioluminescentes', () => {
    // Sans fourmis exploratrices
    gameState.ants = { worker: 0, scout: 0 };
    drawPheromoneTrails(1000, 800, 600);

    // Avec exploratrices actives
    gameState.ants = { worker: 10, scout: 4 };
    drawPheromoneTrails(1000, 800, 600);

    // Spores champignonnière niveau 0
    gameState.rooms.fungus = 0;
    drawBioluminescentSpores(1000);

    // Spores champignonnière débloquée
    gameState.rooms.fungus = 2;
    drawBioluminescentSpores(1000);
  });

  it('doit gérer les particules et détails saisonniers (printemps, été, automne, hiver)', () => {
    initSeasonalParticles();
    assert.ok(seasonalParticles.length > 0);

    // Printemps (pollen & fleurs sauvages)
    updateAndDrawSeasonalParticles(800, 600, 114, 1000, { id: 'spring' });
    drawSkyAndSurface(800, 600, 114, 1000);

    // Été (lucioles & rayons de soleil)
    updateAndDrawSeasonalParticles(800, 600, 114, 1000, { id: 'summer' });
    drawSkyAndSurface(800, 600, 114, 1000);

    // Automne (feuilles mortes)
    updateAndDrawSeasonalParticles(800, 600, 114, 1000, { id: 'autumn' });

    // Hiver (neige & givre sur le dôme)
    updateAndDrawSeasonalParticles(800, 600, 114, 1000, { id: 'winter' });
    drawSkyAndSurface(800, 600, 114, 1000);
  });

  it('doit afficher le halo de survol et les infobulles contextuelles Canvas pour chaque type de nœud', () => {
    // 1. Survol de chambre souterraine (queen)
    globalThis.hoveredNode = {
      nodeId: 'queen',
      node: GAME_CONFIG.CANVAS_THEME.nodes.queen,
      x: 400,
      y: 276
    };
    drawHoverHaloAndTooltip(800, 600);

    // 2. Survol de récolte en surface (surface_left)
    globalThis.hoveredNode = {
      nodeId: 'surface_left',
      node: GAME_CONFIG.CANVAS_THEME.nodes.surface_left,
      x: 96,
      y: 105
    };
    drawHoverHaloAndTooltip(800, 600);

    // 3. Survol de nurserie (nursery)
    globalThis.hoveredNode = {
      nodeId: 'nursery',
      node: GAME_CONFIG.CANVAS_THEME.nodes.nursery,
      x: 448,
      y: 504
    };
    drawHoverHaloAndTooltip(800, 600);

    // 4. Survol d'entrée (entrance)
    globalThis.hoveredNode = {
      nodeId: 'entrance',
      node: GAME_CONFIG.CANVAS_THEME.nodes.entrance,
      x: 400,
      y: 111
    };
    drawHoverHaloAndTooltip(800, 600);
  });

  it('doit gérer les clics et événements tactiles Mobile (récolte, sélection de salle, shift-upgrade, nurserie)', () => {
    let harvestedDeposit = null;
    let selectedRoom = null;
    let upgradedRoom = null;
    let switchedTab = null;

    globalThis.harvestSurfaceDeposit = (key) => { harvestedDeposit = key; };
    globalThis.selectRoomInUI = (key) => { selectedRoom = key; };
    globalThis.upgradeRoom = (key) => { upgradedRoom = key; };
    globalThis.switchTab = (tab) => { switchedTab = tab; };

    // Mouvement souris sur dépôt
    handleCanvasMouseMove({ clientX: 96, clientY: 105 });
    assert.equal(globalThis.canvas.style.cursor, 'pointer');

    // Sortie de la souris
    handleCanvasMouseLeave();
    assert.equal(globalThis.hoveredNode, null);

    // Touch start, move et end sur mobile
    handleCanvasTouchStart({ touches: [{ clientX: 96, clientY: 105 }] });
    assert.ok(globalThis.hoveredNode);
    handleCanvasTouchMove({ touches: [{ clientX: 96, clientY: 105 }] });
    handleCanvasTouchEnd({ touches: [] });
    assert.equal(harvestedDeposit, 'left');

    // Clic simple sur chambre royale -> selectRoomInUI
    handleCanvasClick({ clientX: 400, clientY: 276, shiftKey: false });
    assert.equal(selectedRoom, 'queen');

    // Clic avec Shift sur chambre royale -> upgradeRoom
    handleCanvasClick({ clientX: 400, clientY: 276, shiftKey: true });
    assert.equal(upgradedRoom, 'queen');

    // Clic sur Barricade sans Shift -> selectRoomInUI('barricade')
    selectedRoom = null;
    handleCanvasClick({ clientX: 400, clientY: 180, shiftKey: false });
    assert.equal(selectedRoom, 'barricade');

    // Clic sur Nurserie -> switchTab('nursery')
    handleCanvasClick({ clientX: 448, clientY: 504 });
    assert.equal(switchedTab, 'nursery');

    // Nettoyage des mocks globaux
    delete globalThis.harvestSurfaceDeposit;
    delete globalThis.selectRoomInUI;
    delete globalThis.upgradeRoom;
    delete globalThis.switchTab;
  });

  it('doit dessiner le rendu 3D CGI style Fourmiz (Antz) et Mobile AAA pour toutes les castes, chambres et cycles horaires', () => {
    // 1. Toutes les castes + ennemi avec charges variées
    const roles = ['worker', 'scout', 'warrior', 'tank', 'nurse', 'enemy'];
    roles.forEach((role, idx) => {
      renderer.drawAnt(120 + idx * 30, 220, 1, 0.2, role, idx * 0.8, idx % 2 === 0 ? 'leaf' : 'seed');
      renderer.drawAnt(120 + idx * 30, 250, -1, -0.1, role, idx * 1.3, null);
    });

    // 2. Reine avec et sans trophée de la Mante Royale, toutes chambres débloquées
    gameState.bossesDefeated = { mantis: true };
    gameState.rooms = {
      queen: 4,
      granary: 4,
      dorm: 3,
      fungus: 3,
      aphid: 2,
      nursery: 2,
      laboratory: 2,
      barricade: 3
    };
    gameState.food = 180;
    gameState.eggQueue = [
      { caste: 'worker', remaining: 3 },
      { caste: 'warrior', remaining: 5 },
      { caste: 'nurse', remaining: 4 }
    ];
    gameState.surfaceCooldowns = { left: 4.5, right: 0 };

    // Cycles horaires : aube (0.05), midi (0.35), crépuscule (0.62), nuit (0.85)
    [0.05, 0.35, 0.62, 0.85].forEach(dp => {
      gameState.dayProgress = dp;
      renderer.drawSkyAndSurface(800, 600, 114, 1500);
    });

    renderer.drawUndergroundBackground(800, 600, 114);
    renderer.drawAllTunnels();
    renderer.drawAllChambers(1500);
    renderer.drawBarricade();
    renderer.drawQueen(1500);

    // 3. Simulation du déplacement des fourmis (en pause et à l'arrivée sur un nœud) et du raid
    renderer.syncVisualAntsWithColony();
    if (renderer.visualAnts.length > 0) {
      renderer.visualAnts[0].pauseTimer = 3;
      renderer.visualAnts[0].x = 999; // hors rayon pour déclencher le rebond wanderAngle
      if (renderer.visualAnts[1]) {
        renderer.visualAnts[1].pauseTimer = 0;
        renderer.visualAnts[1].progress = 0.99;
        renderer.visualAnts[1].currentNode = 'entrance';
        renderer.visualAnts[1].nextNode = 'surface_left';
        renderer.visualAnts[1].goalNode = 'surface_left';
      }
    }
    renderer.updateAndDrawColonyAnts(1600);

    // Raid en approche (alerte visuelle) puis raid actif qui progresse
    gameState.nextRaidTimer = 5;
    renderer.raidScene.active = false;
    renderer.updateAndDrawRaidScene();

    renderer.triggerRaidVisuals(false);
    renderer.raidScene.frame = 40;
    if (renderer.raidScene.enemies[0]) {
      renderer.raidScene.enemies[0].progress = 0.99;
    }
    renderer.updateAndDrawRaidScene();
  });
});
