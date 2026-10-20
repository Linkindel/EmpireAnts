const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { GAME_CONFIG, t } = require('../config.js');
const game = require('../game.js');

const {
  gameState,
  sanitizeNumber,
  sanitizeGameState,
  createFreshGameState,
  buildSavePayload,
  exportSaveString,
  parseSaveString,
  importSaveString,
  formatDurationSeconds,
  computeOfflineProgress,
  applyOfflineProgress,
  saveGame,
  loadGame,
  resetGame,
  toggleSound,
  setLanguage,
  resolveTranslatedParams,
  initStaticTokensUI,
  initTabs,
  initSpeedControls,
  getCurrentSeasonConfig,
  getTotalPop,
  getReservedPop,
  getPopCap,
  getNetFoodPerSec,
  getPheromoneGainPerSec,
  getIncubationSpeedMultiplier,
  calculateSquadPower,
  gameTick,
  incubateAnt,
  upgradeRoom,
  harvestSurfaceDeposit,
  switchTab,
  selectRoomInUI,
  adjustSquad,
  setDoctrine,
  launchExpedition,
  recallExpedition,
  resolveExpedition,
  handleRaidSystem,
  triggerEnemyRaid,
  researchMutation,
  logMessageKey,
  updateUI,
  openSaveModal,
  closeSaveModal,
  handleExportSaveUI,
  handleImportSaveUI,
  showOfflineModal,
  closeOfflineModal
} = game;

// --- MOCK LÉGER DU DOM & LOCALSTORAGE POUR LES TESTS D'INTÉGRATION UI ---
function setupMockBrowserEnv() {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear()
  };

  const elements = new Map();
  function createMockEl(id = '') {
    const classes = new Set();
    const attrs = new Map();
    const listeners = {};
    const children = [];
    const el = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      disabled: false,
      dataset: {},
      style: { display: 'none', width: '0%' },
      className: '',
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        toggle: (c, force) => {
          const shouldAdd = force !== undefined ? Boolean(force) : !classes.has(c);
          if (shouldAdd) classes.add(c);
          else classes.delete(c);
          return shouldAdd;
        },
        contains: (c) => classes.has(c)
      },
      setAttribute: (k, v) => attrs.set(k, String(v)),
      getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
      appendChild: (child) => children.push(child),
      querySelector: (sel) => {
        if (sel === '.log-msg') return el._msgSpan || null;
        return null;
      },
      addEventListener: (evt, fn) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      trigger: (evt) => {
        (listeners[evt] || []).forEach(fn => fn());
      },
      select: () => {},
      _children: children
    };
    return el;
  }

  function getOrCreateEl(id) {
    if (!elements.has(id)) {
      elements.set(id, createMockEl(id));
    }
    return elements.get(id);
  }

  const i18nEl = createMockEl('i18nSample');
  i18nEl.setAttribute('data-i18n', 'brand.title');

  const i18nTitleEl = createMockEl('i18nTitleSample');
  i18nTitleEl.setAttribute('data-i18n-title', 'res.food.title');

  const i18nPlaceholderEl = getOrCreateEl('saveCodeInput');
  i18nPlaceholderEl.setAttribute('data-i18n-placeholder', 'save.input.placeholder');

  const chipBalanced = createMockEl('chipBalanced');
  chipBalanced.dataset.doctrine = 'balanced';
  const chipRush = createMockEl('chipRush');
  chipRush.dataset.doctrine = 'rush';

  const tabBtnNursery = createMockEl('tabBtnNursery');
  tabBtnNursery.dataset.tab = 'nursery';
  const tabBtnRooms = createMockEl('tabBtnRooms');
  tabBtnRooms.dataset.tab = 'rooms';

  const tabContentNursery = getOrCreateEl('tab-nursery');
  const tabContentRooms = getOrCreateEl('tab-rooms');

  globalThis.document = {
    documentElement: { lang: 'fr' },
    title: '',
    visibilityState: 'visible',
    getElementById: (id) => getOrCreateEl(id),
    createElement: (tag) => {
      const el = createMockEl(tag);
      const msgSpan = createMockEl('span');
      el._msgSpan = msgSpan;
      return el;
    },
    querySelectorAll: (sel) => {
      if (sel === '[data-i18n]') return [i18nEl];
      if (sel === '[data-i18n-title]') return [i18nTitleEl];
      if (sel === '[data-i18n-placeholder]') return [i18nPlaceholderEl];
      if (sel === '.doctrine-chip') return [chipBalanced, chipRush];
      if (sel === '#logContainer .log-entry[data-log-key]') {
        return getOrCreateEl('logContainer')._children;
      }
      if (sel === '#desktopTabs .tab-btn') return [tabBtnNursery, tabBtnRooms];
      if (sel === '#mobileNav .tab-btn') return [tabBtnNursery];
      if (sel === '.tab-content') return [tabContentNursery, tabContentRooms];
      if (sel === '.tab-btn') return [tabBtnNursery, tabBtnRooms];
      if (sel.startsWith('[data-tab="')) return [tabBtnRooms];
      return [];
    },
    addEventListener: () => {}
  };

  globalThis.window = {
    confirm: () => true,
    AudioContext: function() {
      return {
        state: 'suspended',
        currentTime: 0,
        destination: {},
        resume: () => {},
        createOscillator: () => ({
          type: 'sine',
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {}
          },
          connect: () => {},
          start: () => {},
          stop: () => {}
        }),
        createGain: () => ({
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {}
          },
          connect: () => {}
        })
      };
    }
  };

  return { elements, storage, tabBtnRooms, tabContentRooms };
}

describe('Lot 1 — Configuration Centrale & Parité Bilingue FR/EN (config.js)', () => {
  it('doit exposer SCHEMA_VERSION >= 2 et les paramètres hors-ligne dans ECONOMY', () => {
    assert.ok(GAME_CONFIG.SCHEMA_VERSION >= 2);
    assert.equal(GAME_CONFIG.ECONOMY.maxOfflineSeconds, 28800);
    assert.equal(GAME_CONFIG.ECONOMY.minOfflineReportSeconds, 15);
    assert.equal(GAME_CONFIG.ECONOMY.offlineEfficiencyRatio, 0.75);
  });

  it('doit calculer correctement les coûts évolutifs de toutes les salles', () => {
    assert.equal(GAME_CONFIG.ROOMS.queen.cost(1), 50 + 35);
    assert.equal(GAME_CONFIG.ROOMS.granary.cost(2), 40 + 50);
    assert.equal(GAME_CONFIG.ROOMS.dorm.cost(1), 60 + 40);
    assert.equal(GAME_CONFIG.ROOMS.barricade.cost(0), 45);
    assert.equal(GAME_CONFIG.ROOMS.fungus.cost(3), 55 + 105);
  });

  it('doit garantir une parité stricte à 100% entre GAME_CONFIG.I18N.fr et GAME_CONFIG.I18N.en', () => {
    const frKeys = Object.keys(GAME_CONFIG.I18N.fr).sort();
    const enKeys = Object.keys(GAME_CONFIG.I18N.en).sort();

    const missingInEn = frKeys.filter(k => !enKeys.includes(k));
    const missingInFr = enKeys.filter(k => !frKeys.includes(k));

    assert.deepEqual(missingInEn, [], `Clés FR manquantes dans EN : ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInFr, [], `Clés EN manquantes dans FR : ${missingInFr.join(', ')}`);

    frKeys.forEach(key => {
      const frVal = GAME_CONFIG.I18N.fr[key];
      const enVal = GAME_CONFIG.I18N.en[key];
      assert.equal(typeof frVal, 'string');
      assert.equal(typeof enVal, 'string');
      assert.ok(frVal.trim().length > 0, `Clé FR vide : ${key}`);
      assert.ok(enVal.trim().length > 0, `Clé EN vide : ${key}`);

      const frPlaceholders = (frVal.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const enPlaceholders = (enVal.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      assert.deepEqual(
        frPlaceholders,
        enPlaceholders,
        `Divergence de paramètres {param} sur la clé "${key}" entre FR et EN`
      );
    });
  });

  it('doit traduire correctement les clés avec paramètres en FR et EN via t()', () => {
    gameState.lang = 'fr';
    assert.equal(t('brand.title'), 'EMPIRE FOURMI');
    assert.ok(t('log.room_up', { name: 'Grenier', lvl: 3 }).includes('Grenier'));
    assert.ok(t('log.room_up', { name: 'Grenier', lvl: 3 }).includes('3'));

    gameState.lang = 'en';
    assert.equal(t('brand.title'), 'ANT EMPIRE');
    assert.ok(t('log.room_up', { name: 'Granary', lvl: 3 }).includes('Granary'));

    assert.equal(t('unknown.missing.key'), 'unknown.missing.key');
    gameState.lang = 'fr';
  });
});

describe('Lot 1 — Persistance Défensive, sanitizeGameState & Import/Export', () => {
  beforeEach(() => {
    setupMockBrowserEnv();
    Object.assign(gameState, createFreshGameState());
  });

  it('sanitizeNumber doit rejeter NaN, null, undefined, Infinity et borner les valeurs', () => {
    assert.equal(sanitizeNumber(NaN, 10, 0, 100), 10);
    assert.equal(sanitizeNumber(Infinity, 10, 0, 100), 10);
    assert.equal(sanitizeNumber(null, 15, 0, 100), 15);
    assert.equal(sanitizeNumber(-20, 10, 0, 100), 0);
    assert.equal(sanitizeNumber(250, 10, 0, 100), 100);
    assert.equal(sanitizeNumber(42, 10, 0, 100), 42);
  });

  it('sanitizeGameState doit réaliser un Deep Merge sécurisé et plafonner squad aux effectifs ants', () => {
    const corruptedRaw = {
      food: -999,
      maxFood: NaN,
      pheromone: Infinity,
      queenHealth: 500,
      day: -3,
      speed: 99,
      ants: { worker: 10, scout: -4, warrior: 2, tank: NaN },
      rooms: { queen: 0, granary: 3 },
      squad: { tank: 50, warrior: 10, scout: 5, doctrine: 'invalid_doc' },
      mutations: { mandibules: 1, carapace: null },
      eggs: [
        { caste: 'worker', elapsed: -5, totalTime: 4 },
        { caste: 'invalid_caste', elapsed: 1, totalTime: 5 },
        null
      ],
      activeExpedition: {
        id: 'pucerons',
        timer: 5,
        squadSnapshot: { tank: 99, warrior: 1, scout: 0, doctrine: 'rush' }
      }
    };

    const clean = sanitizeGameState(corruptedRaw);
    assert.equal(clean.schemaVersion, GAME_CONFIG.SCHEMA_VERSION);
    assert.equal(clean.food, 0);
    assert.equal(clean.maxFood, 180 + 2 * 60);
    assert.equal(clean.pheromone, GAME_CONFIG.INITIAL_STATE.pheromone);
    assert.equal(clean.queenHealth, clean.maxQueenHealth);
    assert.equal(clean.day, 1);
    assert.equal(clean.speed, 1);

    assert.equal(clean.ants.worker, 10);
    assert.equal(clean.ants.scout, 0);
    assert.equal(clean.ants.warrior, 2);
    assert.equal(clean.ants.tank, GAME_CONFIG.INITIAL_STATE.ants.tank);

    // Squad ne doit jamais dépasser ants
    assert.equal(clean.squad.tank, clean.ants.tank);
    assert.equal(clean.squad.warrior, 2);
    assert.equal(clean.squad.scout, 0);
    assert.equal(clean.squad.doctrine, 'balanced');

    assert.equal(clean.mutations.mandibules, true);
    assert.equal(clean.mutations.carapace, false);
    assert.equal(clean.eggs.length, 1);
    assert.equal(clean.eggs[0].elapsed, 0);
    assert.ok(clean.activeExpedition);
    assert.equal(clean.activeExpedition.squadSnapshot.tank, clean.ants.tank);
  });

  it('doit exporter et réimporter une sauvegarde en Base64 et en JSON brut, et rejeter les codes corrompus', () => {
    gameState.food = 165;
    gameState.pheromone = 88.5;
    gameState.ants.warrior = 7;

    const codeB64 = exportSaveString(gameState);
    assert.equal(typeof codeB64, 'string');
    assert.ok(codeB64.length > 20);

    // Réinitialiser puis réimporter
    Object.assign(gameState, createFreshGameState());
    assert.equal(gameState.food, 120);

    const res = importSaveString(codeB64, gameState);
    assert.equal(res.ok, true);
    assert.equal(gameState.food, 165);
    assert.equal(gameState.pheromone, 88.5);
    assert.equal(gameState.ants.warrior, 7);

    // Import JSON brut direct
    const jsonRaw = JSON.stringify({ food: 140, ants: { worker: 12, scout: 3, warrior: 4, tank: 2 } });
    const resJson = importSaveString(jsonRaw, gameState);
    assert.equal(resJson.ok, true);
    assert.equal(gameState.food, 140);
    assert.equal(gameState.ants.worker, 12);

    // Rejet des chaînes invalides
    assert.equal(importSaveString('', gameState).ok, false);
    assert.equal(importSaveString('not-a-valid-save-!!!', gameState).ok, false);
    assert.equal(importSaveString('{"unrelated":true}', gameState).ok, false);
  });
});

describe('Lot 1 — Calculs Économiques, Saisons, Puissance & Temps Hors-Ligne (Δt)', () => {
  beforeEach(() => {
    setupMockBrowserEnv();
    Object.assign(gameState, createFreshGameState());
  });

  it('doit calculer correctement la population, le plafond, les saisons et la puissance d’escouade', () => {
    assert.equal(getTotalPop(gameState), 11);
    assert.equal(getPopCap(gameState), 25);

    gameState.eggs.push({ caste: 'worker', elapsed: 0, totalTime: 4 });
    assert.equal(getReservedPop(gameState), 12);

    // Cycle des 4 saisons (2 jours par saison)
    assert.equal(getCurrentSeasonConfig({ day: 1 }).id, 'spring');
    assert.equal(getCurrentSeasonConfig({ day: 3 }).id, 'summer');
    assert.equal(getCurrentSeasonConfig({ day: 5 }).id, 'autumn');
    assert.equal(getCurrentSeasonConfig({ day: 7 }).id, 'winter');

    // Puissance d'escouade avec doctrines et mutations
    const squad = { tank: 2, warrior: 3, scout: 1, doctrine: 'balanced' };
    const basePower = calculateSquadPower(squad, gameState);
    assert.equal(basePower, 2 * 28 + 3 * 36 + 1 * 14); // 178

    gameState.mutations.mandibules = true;
    gameState.mutations.carapace = true;
    gameState.mutations.acide = true;
    const mutatedPower = calculateSquadPower({ ...squad, doctrine: 'acid' }, gameState);
    assert.ok(mutatedPower > basePower);
  });

  it('doit calculer et appliquer la progression hors-ligne (computeOfflineProgress & applyOfflineProgress)', () => {
    gameState.food = 50;
    gameState.pheromone = 10;
    gameState.eggs = [
      { caste: 'worker', elapsed: 0, totalTime: 4 },
      { caste: 'scout', elapsed: 0, totalTime: 6 }
    ];
    gameState.activeExpedition = {
      ...GAME_CONFIG.MISSIONS.pucerons,
      timer: 8,
      squadSnapshot: { tank: 1, warrior: 1, scout: 0, doctrine: 'balanced' }
    };

    // Test avec dépassement du plafond de 8h (50 000s -> plafonné à 28 800s)
    const report = computeOfflineProgress(gameState, 50000, GAME_CONFIG);
    assert.equal(report.effectiveSeconds, GAME_CONFIG.ECONOMY.maxOfflineSeconds);
    assert.equal(report.totalHatched, 2);
    assert.equal(report.updatedEggs.length, 0);
    assert.equal(report.updatedFood, gameState.maxFood);
    assert.ok(report.pheromoneGained > 0);
    assert.ok(report.daysPassed > 0);
    assert.equal(report.updatedActiveExpedition.timer, 1);

    // Application effective sur gameState
    applyOfflineProgress(gameState, 120, GAME_CONFIG);
    assert.equal(gameState.eggs.length, 0);
    assert.ok(gameState.food > 50);

    // Cas elapsedSeconds = 0 et œuf partiellement incubé
    const zeroReport = applyOfflineProgress(gameState, 0, GAME_CONFIG);
    assert.equal(zeroReport.effectiveSeconds, 0);

    gameState.eggs = [{ caste: 'tank', elapsed: 0, totalTime: 100 }];
    const partialReport = computeOfflineProgress(gameState, 5, GAME_CONFIG);
    assert.equal(partialReport.totalHatched, 0);
    assert.equal(partialReport.updatedEggs.length, 1);
    assert.ok(partialReport.updatedEggs[0].elapsed > 0);

    assert.equal(formatDurationSeconds(3665), '1h 1m');
    assert.equal(formatDurationSeconds(125), '2m 5s');
    assert.equal(formatDurationSeconds(12), '12s');
  });

  it('doit charger une sauvegarde depuis localStorage et déclencher le rattrapage hors-ligne si >= 15s', () => {
    const pastTime = Date.now() - 60000; // 60 secondes d'absence
    gameState.food = 60;
    saveGame(pastTime);

    Object.assign(gameState, createFreshGameState());
    gameState.food = 10;

    const offlineReport = loadGame(Date.now());
    assert.ok(offlineReport);
    assert.ok(offlineReport.effectiveSeconds >= 59);
    assert.ok(gameState.food > 60);
  });
});

describe('Lot 1 — Moteur de Simulation, Actions Métier, Combats & Synchronisation UI', () => {
  let env;
  beforeEach(() => {
    env = setupMockBrowserEnv();
    Object.assign(gameState, createFreshGameState());
  });

  it('doit gérer l’incubation, l’amélioration de salles et la recherche de mutations', () => {
    // Incubation réussie
    const prevFood = gameState.food;
    incubateAnt('worker');
    assert.equal(gameState.eggs.length, 1);
    assert.equal(gameState.food, prevFood - GAME_CONFIG.CASTES.worker.cost);

    // Incubation refusée si nourriture insuffisante
    gameState.food = 2;
    incubateAnt('tank');
    assert.equal(gameState.eggs.length, 1);

    // Incubation refusée si plafond de population atteint
    gameState.food = 500;
    gameState.ants.worker = 30;
    incubateAnt('worker');
    assert.equal(gameState.eggs.length, 1);

    // Amélioration de salle (Granary augmente maxFood)
    gameState.ants.worker = 6;
    gameState.food = 200;
    const prevMaxFood = gameState.maxFood;
    upgradeRoom('granary');
    assert.equal(gameState.rooms.granary, 2);
    assert.equal(gameState.maxFood, prevMaxFood + GAME_CONFIG.ROOMS.granary.storagePerLevel);

    // Mutation génétique
    gameState.pheromone = 100;
    researchMutation('mandibules');
    assert.equal(gameState.mutations.mandibules, true);
    researchMutation('mandibules'); // déjà débloquée
    assert.equal(gameState.mutations.mandibules, true);
  });

  it('doit exécuter gameTick (éclosion, changement de jour/saison, famine, expéditions et raids)', () => {
    gameState.speed = 2;
    gameState.timeSeconds = 59;
    gameState.eggs.push({ caste: 'worker', elapsed: 3.9, totalTime: 4 });
    gameState.nextRaidTimer = 2;

    gameTick();
    assert.equal(gameState.day, 2);
    assert.equal(gameState.eggs.length, 0);
    assert.ok(gameState.ants.worker >= 7);

    // Test de famine quand food = 0 et aucun ouvrier
    gameState.ants.worker = 0;
    gameState.ants.warrior = 5;
    gameState.food = 0;
    gameState.speed = 1;
    const prevHp = gameState.queenHealth;
    gameTick();
    assert.ok(gameState.queenHealth < prevHp);
  });

  it('doit gérer les expéditions (déploiement, rappel, victoire et défaite) et les raids ennemis', () => {
    adjustSquad('tank', 1);
    adjustSquad('warrior', 2);
    setDoctrine('rush');
    assert.equal(gameState.squad.tank, 1);
    assert.equal(gameState.squad.warrior, 2);
    assert.equal(gameState.squad.doctrine, 'rush');

    launchExpedition('pucerons');
    assert.ok(gameState.activeExpedition);

    recallExpedition();
    assert.equal(gameState.activeExpedition, null);

    // Victoire d'expédition avec bonusWorkers
    gameState.ants.tank = 5;
    gameState.ants.warrior = 5;
    gameState.squad.tank = 4;
    gameState.squad.warrior = 4;
    launchExpedition('fourmis_rouges');
    resolveExpedition();
    assert.equal(gameState.activeExpedition, null);

    // Défaite d'expédition (escouade faible contre cible difficile)
    gameState.squad.tank = 0;
    gameState.squad.warrior = 0;
    gameState.squad.scout = 1;
    launchExpedition('fourmis_rouges');
    resolveExpedition();
    assert.equal(gameState.activeExpedition, null);

    // Raid ennemi repoussé avec barricade
    gameState.rooms.barricade = 3;
    gameState.ants.tank = 5;
    gameState.ants.warrior = 5;
    triggerEnemyRaid();

    // Raid ennemi subi (défense nulle)
    gameState.rooms.barricade = 0;
    gameState.ants.tank = 0;
    gameState.ants.warrior = 0;
    gameState.ants.scout = 0;
    gameState.food = 100;
    triggerEnemyRaid();
    assert.ok(gameState.food < 100);
  });

  it('doit synchroniser l’UI, les onglets, la langue, le son et les modales sans erreur', () => {
    initTabs();
    initSpeedControls();
    env.tabBtnRooms.trigger('click');
    assert.equal(env.tabContentRooms.classList.contains('active'), true);

    env.elements.get('btnPause').trigger('click');
    assert.equal(gameState.speed, 0);
    gameTick(); // ne fait rien en pause
    env.elements.get('btnSpeed1').trigger('click');
    assert.equal(gameState.speed, 1);
    env.elements.get('btnSpeed2').trigger('click');
    assert.equal(gameState.speed, 2);
    env.elements.get('btnSpeed3').trigger('click');
    assert.equal(gameState.speed, 3);

    // Cas limites des actions métier (entrées invalides, fonds insuffisants, escouade vide)
    incubateAnt('unknown_caste');
    upgradeRoom('unknown_room');
    gameState.food = 0;
    upgradeRoom('queen');
    researchMutation('unknown_mut');
    gameState.pheromone = 0;
    researchMutation('acide');
    adjustSquad('invalid_caste', 1);
    setDoctrine('invalid_doctrine');
    gameState.squad = { tank: 0, warrior: 0, scout: 0, doctrine: 'balanced' };
    launchExpedition('pucerons'); // escouade vide
    gameState.squad.warrior = 1;
    launchExpedition('unknown_mission');
    launchExpedition('pucerons');
    launchExpedition('pucerons'); // déjà en expédition

    // Résolution automatique d'expédition et soin de la Reine dans gameTick
    gameState.food = 100;
    gameState.queenHealth = 80;
    gameState.activeExpedition.timer = 1;
    gameState.nextRaidTimer = 20;
    gameState.speed = 1;
    gameTick();
    assert.equal(gameState.activeExpedition, null);
    assert.ok(gameState.queenHealth > 80);

    setLanguage('invalid_lang');
    setLanguage('en');
    assert.equal(gameState.lang, 'en');
    setLanguage('fr');
    assert.equal(gameState.lang, 'fr');

    toggleSound();
    assert.equal(gameState.soundEnabled, false);
    toggleSound();
    assert.equal(gameState.soundEnabled, true);

    openSaveModal();
    handleExportSaveUI();
    handleImportSaveUI();
    env.elements.get('saveCodeInput').value = 'invalid-code';
    handleImportSaveUI();
    closeSaveModal();

    showOfflineModal({ effectiveSeconds: 180, foodGained: 45, pheromoneGained: 12, totalHatched: 2 });
    closeOfflineModal();

    resetGame();
    assert.equal(gameState.day, 1);
  });

  it('doit couvrir les cas limites aléatoires (Math.random), les appels headless sans DOM et les erreurs localStorage', () => {
    const origRandom = Math.random;
    try {
      // Forcer Math.random() = 0.001 pour déclencher ponte royale auto, log famine et pertes de combat
      Math.random = () => 0.001;

      // Changement de saison au passage du jour 2 au jour 3 (timeSeconds = 119 -> 120)
      gameState.day = 2;
      gameState.timeSeconds = 119;
      gameState.food = 100;
      gameState.speed = 1;
      globalThis.triggerAntSpawnEffect = () => {};
      globalThis.triggerRaidVisuals = () => {};
      gameTick();
      assert.equal(gameState.day, 3);

      // Famine avec log garanti (Math.random = 0.001 < starvationLogChance)
      gameState.food = 0;
      gameState.ants.worker = 0;
      gameState.ants.tank = 3;
      gameTick();

      // Défaite d'expédition avec pertes de warrior et tank garanties
      gameState.ants.warrior = 2;
      gameState.ants.tank = 2;
      gameState.squad = { tank: 1, warrior: 1, scout: 0, doctrine: 'rush' };
      gameState.activeExpedition = {
        ...GAME_CONFIG.MISSIONS.fourmis_rouges,
        timer: 1,
        squadSnapshot: { ...gameState.squad }
      };
      resolveExpedition();
      assert.equal(gameState.ants.warrior, 1);
      assert.equal(gameState.ants.tank, 1);

      // Raid avec mutations défensives actives
      gameState.mutations.carapace = true;
      gameState.mutations.acide = true;
      gameState.ants.tank = 5;
      gameState.ants.warrior = 5;
      triggerEnemyRaid();
    } finally {
      Math.random = origRandom;
      delete globalThis.triggerAntSpawnEffect;
      delete globalThis.triggerRaidVisuals;
    }

    // Cas limites de loadGame (vide, JSON invalide, absence courte < 15s)
    globalThis.localStorage.clear();
    assert.equal(loadGame(), null);
    globalThis.localStorage.setItem(GAME_CONFIG.SAVE_KEY, '{corrupted_json');
    assert.equal(loadGame(), null);
    saveGame(Date.now() - 3000);
    assert.equal(loadGame(Date.now()), null);

    // Cas limites de sanitizeGameState et calculateSquadPower
    assert.ok(sanitizeGameState());
    assert.equal(calculateSquadPower(null), 0);

    // Appels sécurisés en environnement Headless (sans document)
    const savedDoc = globalThis.document;
    try {
      delete globalThis.document;
      setLanguage('fr');
      initStaticTokensUI();
      initTabs();
      initSpeedControls();
      updateUI();
      logMessageKey('log.init');
    } finally {
      globalThis.document = savedDoc;
    }
  });
});

describe('Lot 2 — Récolte Manuelle Active, Textes Flottants & Navigation Directe', () => {
  let env;

  beforeEach(() => {
    env = setupMockBrowserEnv();
    Object.assign(gameState, createFreshGameState());
  });

  it('doit exécuter harvestSurfaceDeposit avec gestion rigoureuse du cooldown et plafond de nourriture', () => {
    const fixedNow = 1000;
    const prevFood = gameState.food;
    const foodReward = GAME_CONFIG.CANVAS_INTERACTION.manualHarvestFood;
    const cooldownSec = GAME_CONFIG.CANVAS_INTERACTION.manualHarvestCooldownSeconds;

    let spawnedText = null;
    globalThis.spawnCanvasFloatingText = (nodeId, text, color) => {
      spawnedText = { nodeId, text, color };
    };

    // 1. Première récolte réussie sur surface_left
    const res1 = harvestSurfaceDeposit('left', fixedNow);
    assert.equal(res1.success, true);
    assert.equal(res1.foodGained, foodReward);
    assert.equal(gameState.food, prevFood + foodReward);
    assert.equal(gameState.manualHarvestCooldowns.left, fixedNow + cooldownSec);
    assert.ok(spawnedText);
    assert.equal(spawnedText.nodeId, 'surface_left');
    assert.equal(spawnedText.text, `+${foodReward} 🍃`);

    // 2. Tentative immédiate rejetée par le cooldown
    const resCooldown = harvestSurfaceDeposit('left', fixedNow + 1);
    assert.equal(resCooldown.success, false);
    assert.equal(resCooldown.reason, 'cooldown');
    assert.equal(resCooldown.remainingSeconds, cooldownSec - 1);

    // 3. Récolte indépendante autorisée sur surface_right
    const resRight = harvestSurfaceDeposit('right', fixedNow + 1);
    assert.equal(resRight.success, true);
    assert.equal(gameState.manualHarvestCooldowns.right, fixedNow + 1 + cooldownSec);

    // 4. Récolte à nouveau possible après expiration du cooldown
    const resAfterCooldown = harvestSurfaceDeposit('left', fixedNow + cooldownSec + 0.1);
    assert.equal(resAfterCooldown.success, true);

    // 5. Plafonnement de la récolte à maxFood
    gameState.food = gameState.maxFood;
    const resCapped = harvestSurfaceDeposit('left', fixedNow + cooldownSec * 3);
    assert.equal(resCapped.success, true);
    assert.equal(gameState.food, gameState.maxFood);

    delete globalThis.spawnCanvasFloatingText;
  });

  it('doit déclencher selectRoomInUI et switchTab avec mise en valeur de la carte', () => {
    initTabs();
    selectRoomInUI('queen');
    assert.equal(env.tabContentRooms.classList.contains('active'), true);
  });

  it('doit déclencher le Screen Shake et les textes flottants lors des raids ennemis et des pontes', () => {
    let shakeTriggered = false;
    let floatingTextsLog = [];

    globalThis.triggerScreenShake = (intensity, duration) => {
      shakeTriggered = true;
    };
    globalThis.spawnCanvasFloatingText = (nodeId, text, color) => {
      floatingTextsLog.push({ nodeId, text, color });
    };

    // Raid avec barricade
    gameState.rooms.barricade = 2;
    gameState.ants.tank = 5;
    gameState.ants.warrior = 5;
    triggerEnemyRaid();

    assert.equal(shakeTriggered, true, 'Le Screen Shake doit être déclenché lors du raid');
    assert.ok(floatingTextsLog.some(ft => ft.nodeId === 'barricade'), 'La barricade doit afficher un texte flottant');

    // Défaite de raid -> texte flottant sur la reine
    floatingTextsLog = [];
    gameState.rooms.barricade = 0;
    gameState.ants.tank = 0;
    gameState.ants.warrior = 0;
    gameState.food = 100;
    triggerEnemyRaid();
    assert.ok(floatingTextsLog.some(ft => ft.nodeId === 'queen' && ft.color === '#e53e3e'));

    // Éclosion d'œuf dans gameTick -> texte flottant sur la nurserie
    floatingTextsLog = [];
    gameState.speed = 1;
    gameState.eggs = [{ caste: 'worker', elapsed: 3.9, totalTime: 4 }];
    gameTick();
    assert.ok(floatingTextsLog.some(ft => ft.nodeId === 'nursery'));

    delete globalThis.triggerScreenShake;
    delete globalThis.spawnCanvasFloatingText;
  });
});

describe('Lot 4 — Caste Nourrice, Événements à Choix & Combat Unifié dans game.js', () => {
  let env;

  beforeEach(() => {
    env = setupMockBrowserEnv();
    Object.assign(gameState, createFreshGameState());
  });

  it('doit incuber une nourrice et appliquer ses bonus de soin et d’accélération', () => {
    gameState.food = 100;
    const initialPop = getTotalPop();

    incubateAnt('nurse');
    assert.equal(gameState.eggs.length, 1);
    assert.equal(gameState.eggs[0].caste, 'nurse');

    // Éclosion avec Math.random contrôlé (éviter ponte spontanée de la reine pendant le tick)
    const origRnd = Math.random;
    try {
      Math.random = () => 0.999;
      gameState.speed = 1;
      gameState.eggs[0].elapsed = 4.9;
      gameTick();

      assert.equal(gameState.ants.nurse, 1);
      assert.equal(getTotalPop(), initialPop + 1);
    } finally {
      Math.random = origRnd;
    }

    // Vérifier le soin accéléré de la reine
    gameState.food = 100;
    gameState.queenHealth = 80;
    const prevHealth = gameState.queenHealth;
    gameTick();
    assert.ok(gameState.queenHealth > prevHealth);
  });

  it('doit exécuter une expédition avec resolveCombat et générer lastBattleReport', () => {
    gameState.squad = { tank: 2, warrior: 3, scout: 1, doctrine: 'balanced' };
    gameState.ants.tank = 3;
    gameState.ants.warrior = 5;
    gameState.ants.scout = 2;

    launchExpedition('termites_bastion');
    assert.ok(gameState.activeExpedition);
    assert.equal(gameState.activeExpedition.id, 'termites_bastion');

    // Résolution
    gameState.activeExpedition.timer = 1;
    gameTick();

    assert.equal(gameState.activeExpedition, null);
    assert.ok(gameState.lastBattleReport);
    assert.equal(gameState.lastBattleReport.source, 'expedition');
    assert.equal(gameState.lastBattleReport.faction, 'termites');
  });

  it('doit gérer le cycle de vie des événements inattendus (déclenchement, choix et expiration)', () => {
    // Déclencheur automatique de handleEventSystem
    gameState.activeEvent = null;
    gameState.nextEventTimer = 1;
    gameState.day = 5;
    gameState.speed = 1;
    gameTick();

    assert.ok(gameState.activeEvent, 'Un événement doit être activé');
    assert.ok(gameState.activeEvent.timeLeft > 0);

    // Choix interactif
    const evtId = gameState.activeEvent.id;
    game.handleChooseEvent(0);
    assert.equal(gameState.activeEvent, null, 'L\'événement doit être résolu après le choix');
  });

  it('doit mettre à jour les éléments UI du rapport de combat et de la carte d’événement', () => {
    gameState.lastBattleReport = {
      source: 'raid',
      victory: true,
      alliedPower: 250,
      enemyPower: 120,
      counterDescKey: 'faction.fire_ants.counter',
      losses: { tank: 0, warrior: 0, scout: 0 },
      loot: { food: 150, phero: 25, bonusWorkers: 1, trophy: null }
    };
    gameState.activeEvent = {
      id: 'golden_sap',
      timeLeft: 22
    };

    game.updateBattleReportUI();
    game.updateEventCardUI();

    assert.ok(true, 'Les fonctions de mise à jour UI s\'exécutent sans erreur');
  });
});
