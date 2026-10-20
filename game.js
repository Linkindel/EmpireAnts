/**
 * Empire Fourmi - Moteur de Simulation, Saisons, Incubation, Audio, Sauvegarde Défensive & i18n (FR/EN)
 * Architecture Senior SOLID : séparation des fonctions pures de calcul et de la couche DOM/UI.
 * Consomme exclusivement les tokens définis dans config.js (GAME_CONFIG).
 */

/* c8 ignore next 12 */
if (typeof GAME_CONFIG === 'undefined' && typeof require === 'function') {
  const cfgModule = require('./config.js');
  globalThis.GAME_CONFIG = cfgModule.GAME_CONFIG || cfgModule;
  if (cfgModule.t) globalThis.t = cfgModule.t;
}

const combatEngine = (typeof require === 'function')
  ? require('./combat.js')
  : {
      computeModifiers: globalThis.computeModifiers,
      resolveCombat: globalThis.resolveCombat,
      resolveEventChoice: globalThis.resolveEventChoice
    };
const computeModifiers = (state = gameState) => combatEngine.computeModifiers(state, GAME_CONFIG);
const resolveCombat = (params = {}) => combatEngine.resolveCombat({ ...params, config: GAME_CONFIG });
const resolveEventChoice = (state = gameState, eventId, choiceId = 'choice_a', rng = Math.random) =>
  combatEngine.resolveEventChoice(state, eventId, choiceId, rng, GAME_CONFIG);
globalThis.computeModifiers = computeModifiers;
globalThis.resolveCombat = resolveCombat;
globalThis.resolveEventChoice = resolveEventChoice;

const evoEngine = (typeof require === 'function')
  ? require('./evolution.js')
  : (typeof globalThis !== 'undefined' ? { ...globalThis } : {});
const canUnlockMutation = (k, s = gameState, c = GAME_CONFIG) => (evoEngine.canUnlockMutation || globalThis.canUnlockMutation)(k, s, c);
const unlockMutationPure = (k, s = gameState, c = GAME_CONFIG) => (evoEngine.unlockMutationPure || globalThis.unlockMutationPure)(k, s, c);
const evaluateAchievements = (s = gameState, c = GAME_CONFIG) => (evoEngine.evaluateAchievements || globalThis.evaluateAchievements)(s, c);
const canTriggerNuptialFlight = (s = gameState, c = GAME_CONFIG) => (evoEngine.canTriggerNuptialFlight || globalThis.canTriggerNuptialFlight)(s, c);
const computeRoyalDnaGain = (s = gameState, c = GAME_CONFIG) => (evoEngine.computeRoyalDnaGain || globalThis.computeRoyalDnaGain)(s, c);
const getNuptialFlightPreview = (s = gameState, c = GAME_CONFIG) => (evoEngine.getNuptialFlightPreview || globalThis.getNuptialFlightPreview)(s, c);
const executeNuptialFlightPure = (s = gameState, c = GAME_CONFIG) => (evoEngine.executeNuptialFlightPure || globalThis.executeNuptialFlightPure)(s, c);

const symbiosisEngine = (typeof require === 'function')
  ? (function () {
      try {
        return require('./symbiosis.js');
      } catch (e) {
        return typeof globalThis !== 'undefined' ? { ...globalThis } : {};
      }
    })()
  : (typeof globalThis !== 'undefined' ? { ...globalThis } : {});
const computeSymbiosisHarmony = (s = gameState, c = GAME_CONFIG) => (symbiosisEngine.computeSymbiosisHarmony || globalThis.computeSymbiosisHarmony)(s, c);
const computeConstructionTime = (k, l, s = gameState, c = GAME_CONFIG) => (symbiosisEngine.computeConstructionTime || globalThis.computeConstructionTime)(k, l, s, c);
const getMaxActiveConstructions = (s = gameState, c = GAME_CONFIG) => (symbiosisEngine.getMaxActiveConstructions || globalThis.getMaxActiveConstructions)(s, c);
const getRoomMilestoneBonuses = (k, l, c = GAME_CONFIG) => (symbiosisEngine.getRoomMilestoneBonuses || globalThis.getRoomMilestoneBonuses)(k, l, c);
const computeAllRoomMilestones = (r = gameState.rooms, c = GAME_CONFIG) => (symbiosisEngine.computeAllRoomMilestones || globalThis.computeAllRoomMilestones)(r, c);
const assignWorkerRole = (r, d, s = gameState) => (symbiosisEngine.assignWorkerRole || globalThis.assignWorkerRole)(r, d, s);
const getWorkerRoles = (s = gameState) => (symbiosisEngine.getWorkerRoles || globalThis.getWorkerRoles)(s);
const boostConstructionWithHoney = (s = gameState, c = GAME_CONFIG) => (symbiosisEngine.boostConstructionWithHoney || globalThis.boostConstructionWithHoney)(s, c);
const setDomeVentilation = (m, s = gameState) => (symbiosisEngine.setDomeVentilation || globalThis.setDomeVentilation)(m, s);
const setQueenDiet = (d, s = gameState) => (symbiosisEngine.setQueenDiet || globalThis.setQueenDiet)(d, s);
const recycleCombatBiomass = (l, e, s = gameState, c = GAME_CONFIG) => (symbiosisEngine.recycleCombatBiomass || globalThis.recycleCombatBiomass)(l, e, s, c);
const startRoomConstruction = (k, s = gameState, c = GAME_CONFIG) => (symbiosisEngine.startRoomConstruction || globalThis.startRoomConstruction)(k, s, c);
const tickConstructions = (s = gameState, dt = 1, c = GAME_CONFIG) => (symbiosisEngine.tickConstructions || globalThis.tickConstructions)(s, dt, c);

globalThis.computeSymbiosisHarmony = computeSymbiosisHarmony;
globalThis.computeConstructionTime = computeConstructionTime;
globalThis.getMaxActiveConstructions = getMaxActiveConstructions;
globalThis.getRoomMilestoneBonuses = getRoomMilestoneBonuses;
globalThis.computeAllRoomMilestones = computeAllRoomMilestones;
globalThis.assignWorkerRole = assignWorkerRole;
globalThis.getWorkerRoles = getWorkerRoles;
globalThis.boostConstructionWithHoney = boostConstructionWithHoney;
globalThis.setDomeVentilation = setDomeVentilation;
globalThis.setQueenDiet = setQueenDiet;
globalThis.recycleCombatBiomass = recycleCombatBiomass;
globalThis.startRoomConstruction = startRoomConstruction;
globalThis.tickConstructions = tickConstructions;

const gameUI = (typeof require === 'function')
  ? (function () {
      try {
        return require('./game-ui.js');
      } catch (e) {
        return typeof globalThis !== 'undefined' ? { ...globalThis } : {};
      }
    })()
  : (typeof globalThis !== 'undefined' ? { ...globalThis } : {});

// --- UTILITAIRES DOM DÉFENSIFS ---
function getEl(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

function setText(id, val) {
  const el = getEl(id);
  if (el) el.textContent = String(val);
}

function setDisabled(id, isDisabled) {
  const el = getEl(id);
  if (el) el.disabled = Boolean(isDisabled);
}

// --- UTILITAIRES DE VALIDATION & ASSAINISSEMENT PURS (PROGRAMMATION DÉFENSIVE) ---
function sanitizeNumber(val, fallback, min = 0, max = Infinity) {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, val));
}

/**
 * Fusion profonde (Deep Merge) et assainissement défensif d'une sauvegarde brute.
 * Garantit la migration vers GAME_CONFIG.SCHEMA_VERSION, protège contre NaN/null/Infinity,
 * et assure que l'escouade ne dépasse jamais les effectifs réels.
 */
function sanitizeGameState(rawData, initialState = GAME_CONFIG.INITIAL_STATE) {
  const src = (rawData && typeof rawData === 'object') ? rawData : {};
  const init = (initialState && initialState.rooms && typeof initialState.rooms === 'object')
    ? initialState
    : GAME_CONFIG.INITIAL_STATE;

  const lang = (typeof src.lang === 'string' && GAME_CONFIG.I18N[src.lang])
    ? src.lang
    : init.lang;
  const soundEnabled = typeof src.soundEnabled === 'boolean'
    ? src.soundEnabled
    : init.soundEnabled;

  // Assainissement des niveaux de salles
  const rooms = {};
  const rawRooms = (src.rooms && typeof src.rooms === 'object') ? src.rooms : {};
  Object.keys(init.rooms).forEach(roomKey => {
    const minLvl = init.rooms[roomKey] > 0 ? 1 : 0;
    rooms[roomKey] = Math.floor(sanitizeNumber(rawRooms[roomKey], init.rooms[roomKey], minLvl));
  });

  // Assainissement des plafonds et ressources
  const minGranaryMaxFood = init.maxFood + Math.max(0, rooms.granary - 1) * GAME_CONFIG.ROOMS.granary.storagePerLevel;
  const maxFood = Math.max(minGranaryMaxFood, Math.floor(sanitizeNumber(src.maxFood, minGranaryMaxFood, init.maxFood)));
  const food = sanitizeNumber(src.food, init.food, 0, maxFood);
  const pheromone = Math.round(sanitizeNumber(src.pheromone, init.pheromone, 0) * 10) / 10;

  const maxQueenHealth = sanitizeNumber(src.maxQueenHealth, init.maxQueenHealth, 1);
  const queenHealth = sanitizeNumber(src.queenHealth, init.queenHealth, 0, maxQueenHealth);

  const day = Math.floor(sanitizeNumber(src.day, init.day, 1));
  const timeSeconds = Math.floor(sanitizeNumber(src.timeSeconds, init.timeSeconds, 0));
  const speed = [0, 1, 2, 3].includes(src.speed) ? src.speed : init.speed;
  const nextRaidTimer = Math.floor(sanitizeNumber(src.nextRaidTimer, init.nextRaidTimer, 1));

  // Assainissement des effectifs par caste
  const ants = {};
  const rawAnts = (src.ants && typeof src.ants === 'object') ? src.ants : {};
  Object.keys(init.ants).forEach(casteKey => {
    ants[casteKey] = Math.floor(sanitizeNumber(rawAnts[casteKey], init.ants[casteKey], 0));
  });

  // Assainissement de l'escouade (ne dépasse jamais les fourmis disponibles)
  const rawSquad = (src.squad && typeof src.squad === 'object') ? src.squad : {};
  const doctrine = (typeof rawSquad.doctrine === 'string' && GAME_CONFIG.DOCTRINES[rawSquad.doctrine])
    ? rawSquad.doctrine
    : init.squad.doctrine;

  const squad = {
    tank: Math.min(ants.tank, Math.floor(sanitizeNumber(rawSquad.tank, init.squad.tank, 0))),
    warrior: Math.min(ants.warrior, Math.floor(sanitizeNumber(rawSquad.warrior, init.squad.warrior, 0))),
    scout: Math.min(ants.scout, Math.floor(sanitizeNumber(rawSquad.scout, init.squad.scout, 0))),
    doctrine
  };

  // Assainissement des mutations
  const mutations = {};
  const rawMuts = (src.mutations && typeof src.mutations === 'object') ? src.mutations : {};
  Object.keys(init.mutations).forEach(mutKey => {
    mutations[mutKey] = Boolean(rawMuts[mutKey]);
  });

  // Assainissement de la file d'incubation (œufs)
  const eggs = [];
  if (Array.isArray(src.eggs)) {
    src.eggs.forEach(egg => {
      if (egg && typeof egg === 'object' && GAME_CONFIG.CASTES[egg.caste]) {
        const defaultTotal = GAME_CONFIG.CASTES[egg.caste].incubationSeconds;
        const totalTime = sanitizeNumber(egg.totalTime, defaultTotal, 1);
        const elapsed = sanitizeNumber(egg.elapsed, 0, 0, totalTime);
        eggs.push({ caste: egg.caste, elapsed, totalTime });
      }
    });
  }

  // Assainissement de l'expédition active
  let activeExpedition = null;
  if (src.activeExpedition && typeof src.activeExpedition === 'object') {
    const missionCfg = GAME_CONFIG.MISSIONS[src.activeExpedition.id];
    if (missionCfg) {
      const snap = (src.activeExpedition.squadSnapshot && typeof src.activeExpedition.squadSnapshot === 'object')
        ? src.activeExpedition.squadSnapshot
        : squad;
      activeExpedition = {
        ...missionCfg,
        timer: Math.floor(sanitizeNumber(src.activeExpedition.timer, missionCfg.duration, 1, missionCfg.duration * 2)),
        squadSnapshot: {
          tank: Math.min(ants.tank, Math.floor(sanitizeNumber(snap.tank, 0, 0))),
          warrior: Math.min(ants.warrior, Math.floor(sanitizeNumber(snap.warrior, 0, 0))),
          scout: Math.min(ants.scout, Math.floor(sanitizeNumber(snap.scout, 0, 0))),
          doctrine: (typeof snap.doctrine === 'string' && GAME_CONFIG.DOCTRINES[snap.doctrine]) ? snap.doctrine : 'balanced'
        }
      };
    }
  }

  const lastSavedAt = (typeof src.lastSavedAt === 'number' && Number.isFinite(src.lastSavedAt) && src.lastSavedAt > 0)
    ? src.lastSavedAt
    : null;

  const manualHarvestCooldowns = {
    left: (src.manualHarvestCooldowns && typeof src.manualHarvestCooldowns.left === 'number')
      ? src.manualHarvestCooldowns.left
      : 0,
    right: (src.manualHarvestCooldowns && typeof src.manualHarvestCooldowns.right === 'number')
      ? src.manualHarvestCooldowns.right
      : 0
  };

  const nextRaidFaction = (typeof src.nextRaidFaction === 'string' && GAME_CONFIG.FACTIONS && GAME_CONFIG.FACTIONS[src.nextRaidFaction])
    ? src.nextRaidFaction
    : 'fire_ants';

  const nextEventTimer = Math.floor(sanitizeNumber(src.nextEventTimer, init.nextEventTimer || 75, 1));
  const activeEvent = (src.activeEvent && typeof src.activeEvent === 'object' && src.activeEvent.id)
    ? {
        id: src.activeEvent.id,
        timeLeft: Math.floor(sanitizeNumber(src.activeEvent.timeLeft, 30, 1, 60))
      }
    : null;

  const bossesDefeated = {
    mantis: Boolean(src.bossesDefeated && src.bossesDefeated.mantis)
  };

  const lastBattleReport = (src.lastBattleReport && typeof src.lastBattleReport === 'object')
    ? src.lastBattleReport
    : null;

  // Assainissement de l'ADN Royal, stats historiques et hauts faits (Lot 6)
  const royalDna = Math.floor(sanitizeNumber(src.royalDna, init.royalDna || 0, 0));

  const stats = {};
  const rawStats = (src.stats && typeof src.stats === 'object') ? src.stats : {};
  const initStats = init.stats || {};
  Object.keys(initStats).forEach(k => {
    stats[k] = Math.floor(sanitizeNumber(rawStats[k], initStats[k], 0));
  });

  const achievements = {};
  const rawAchs = (src.achievements && typeof src.achievements === 'object') ? src.achievements : {};
  const achCfg = GAME_CONFIG.ACHIEVEMENTS || {};
  Object.keys(achCfg).forEach(k => {
    achievements[k] = Boolean(rawAchs[k]);
  });

  // Registre extensible de ressources & compatibilité miroir (Lots 3, 5 & 7)
  const twigs = Math.max(0, sanitizeNumber(src.twigs !== undefined ? src.twigs : (src.resources && src.resources.twigs), init.twigs || 0));
  const honeydew = Math.max(0, sanitizeNumber(src.honeydew !== undefined ? src.honeydew : (src.resources && src.resources.honeydew), init.honeydew || 0));
  const chitin = Math.max(0, sanitizeNumber(src.chitin !== undefined ? src.chitin : (src.resources && src.resources.chitin), init.chitin || 0));
  const spores = Math.max(0, sanitizeNumber(src.spores !== undefined ? src.spores : (src.resources && src.resources.spores), init.spores || 0));
  const amber = Math.max(0, sanitizeNumber(src.amber !== undefined ? src.amber : (src.resources && src.resources.amber), init.amber || 0));

  const resources = {
    food: food,
    pheromone: pheromone,
    twigs: Math.round(twigs * 10) / 10,
    honeydew: Math.round(honeydew * 10) / 10,
    chitin: Math.round(chitin * 10) / 10,
    spores: Math.round(spores * 10) / 10,
    amber: Math.round(amber * 10) / 10
  };
  if (src.resources && typeof src.resources === 'object') {
    Object.keys(src.resources).forEach(k => {
      if (typeof src.resources[k] === 'number' && Number.isFinite(src.resources[k])) {
        resources[k] = Math.max(0, src.resources[k]);
      }
    });
    resources.food = food;
    resources.pheromone = pheromone;
    resources.twigs = Math.round(twigs * 10) / 10;
    resources.honeydew = Math.round(honeydew * 10) / 10;
    resources.chitin = Math.round(chitin * 10) / 10;
    resources.spores = Math.round(spores * 10) / 10;
    resources.amber = Math.round(amber * 10) / 10;
  }

  // Rôles d'ouvrières (Lot 5 - Métiers)
  const rawRoles = (src.workerRoles && typeof src.workerRoles === 'object') ? src.workerRoles : {};
  const initRoles = init.workerRoles || { harvester: 6, breeder: 0, grower: 0, mason: 0 };
  const breeder = Math.min(ants.worker, Math.max(0, Math.floor(sanitizeNumber(rawRoles.breeder, initRoles.breeder || 0, 0))));
  const grower = Math.min(ants.worker - breeder, Math.max(0, Math.floor(sanitizeNumber(rawRoles.grower, initRoles.grower || 0, 0))));
  const mason = Math.min(ants.worker - (breeder + grower), Math.max(0, Math.floor(sanitizeNumber(rawRoles.mason, initRoles.mason || 0, 0))));
  const harvester = Math.max(0, ants.worker - (breeder + grower + mason));
  const workerRoles = { harvester, breeder, grower, mason };

  // Chantiers en cours et en file d'attente (Lot 5)
  const activeConstructions = [];
  if (Array.isArray(src.activeConstructions)) {
    src.activeConstructions.forEach(c => {
      if (c && typeof c === 'object' && c.roomKey && GAME_CONFIG.ROOMS[c.roomKey]) {
        activeConstructions.push({
          roomKey: c.roomKey,
          targetLevel: Math.floor(sanitizeNumber(c.targetLevel, 1, 1)),
          elapsed: sanitizeNumber(c.elapsed, 0, 0, sanitizeNumber(c.totalTime, 30, 1)),
          totalTime: Math.max(1, Math.floor(sanitizeNumber(c.totalTime, 30, 1))),
          cost: Math.floor(sanitizeNumber(c.cost, 10, 0))
        });
      }
    });
  }

  const buildQueue = [];
  if (Array.isArray(src.buildQueue)) {
    src.buildQueue.forEach(c => {
      if (c && typeof c === 'object' && c.roomKey && GAME_CONFIG.ROOMS[c.roomKey]) {
        buildQueue.push({
          roomKey: c.roomKey,
          targetLevel: Math.floor(sanitizeNumber(c.targetLevel, 1, 1)),
          elapsed: 0,
          totalTime: Math.max(1, Math.floor(sanitizeNumber(c.totalTime, 30, 1))),
          cost: Math.floor(sanitizeNumber(c.cost, 10, 0))
        });
      }
    });
  }

  const honeyBoostTimer = Math.max(0, Math.floor(sanitizeNumber(src.honeyBoostTimer, 0, 0)));
  const domeVentilation = ['open', 'sealed'].includes(src.domeVentilation) ? src.domeVentilation : 'open';
  const queenDiet = ['standard', 'royal_jelly'].includes(src.queenDiet) ? src.queenDiet : 'standard';

  // Multiplicateur d'incubation par lots (Lot 3)
  const incubationMultiplier = [1, 5, 'max'].includes(src.incubationMultiplier) ? src.incubationMultiplier : (init.incubationMultiplier || 1);

  // Navigation par panneaux & sous-onglets (Lot 3)
  const activeTab = typeof src.activeTab === 'string' ? src.activeTab : (init.activeTab || 'colony');
  const activeSubtabs = (src.activeSubtabs && typeof src.activeSubtabs === 'object')
    ? { ...init.activeSubtabs, ...src.activeSubtabs }
    : (init.activeSubtabs || { colony: 'nursery', army: 'squad', evolution: 'mutations' });

  // Options de confort & accessibilité (Lot 3)
  const rawSettings = (src.settings && typeof src.settings === 'object') ? src.settings : {};
  const settings = {
    screenShakeEnabled: typeof rawSettings.screenShakeEnabled === 'boolean' ? rawSettings.screenShakeEnabled : true,
    particleDensity: ['low', 'normal', 'high'].includes(rawSettings.particleDensity) ? rawSettings.particleDensity : 'normal',
    numberNotation: ['standard', 'scientific'].includes(rawSettings.numberNotation) ? rawSettings.numberNotation : 'standard'
  };

  // Objectif épinglé (Lot 3)
  const pinnedTarget = (src.pinnedTarget && typeof src.pinnedTarget === 'object') ? src.pinnedTarget : null;

  // Exploration Infinie, Anneaux, Abîmes & Reliques (Lot 7)
  const rawExplo = (src.exploration && typeof src.exploration === 'object') ? src.exploration : {};
  const initExplo = (init.exploration && typeof init.exploration === 'object') ? init.exploration : {};
  const rawRelics = (rawExplo.relics && typeof rawExplo.relics === 'object') ? rawExplo.relics : {};
  const exploration = {
    currentRing: Math.max(1, Math.floor(sanitizeNumber(rawExplo.currentRing, initExplo.currentRing || 1, 1))),
    unlockedRing: Math.max(1, Math.floor(sanitizeNumber(rawExplo.unlockedRing, initExplo.unlockedRing || 1, 1))),
    ringSectorsCleared: (rawExplo.ringSectorsCleared && typeof rawExplo.ringSectorsCleared === 'object') ? rawExplo.ringSectorsCleared : {},
    ringGuardiansDefeated: (rawExplo.ringGuardiansDefeated && typeof rawExplo.ringGuardiansDefeated === 'object') ? rawExplo.ringGuardiansDefeated : {},
    abyssDepth: Math.max(0, Math.floor(sanitizeNumber(rawExplo.abyssDepth, initExplo.abyssDepth || 0, 0))),
    maxAbyssDepth: Math.max(0, Math.floor(sanitizeNumber(rawExplo.maxAbyssDepth, initExplo.maxAbyssDepth || 0, 0))),
    abyssGuardiansDefeated: (rawExplo.abyssGuardiansDefeated && typeof rawExplo.abyssGuardiansDefeated === 'object') ? rawExplo.abyssGuardiansDefeated : {},
    activeHazard: typeof rawExplo.activeHazard === 'string' ? rawExplo.activeHazard : null,
    livingBridges: {
      surfaceHarvest: Boolean(rawExplo.livingBridges && rawExplo.livingBridges.surfaceHarvest),
      activeBridgeWorkers: Math.max(0, Math.floor(sanitizeNumber(rawExplo.livingBridges && rawExplo.livingBridges.activeBridgeWorkers, 0, 0)))
    },
    relics: {
      queen_amber: Math.max(0, Math.floor(sanitizeNumber(rawRelics.queen_amber, 0, 0))),
      fossil_mandible: Math.max(0, Math.floor(sanitizeNumber(rawRelics.fossil_mandible, 0, 0))),
      eternal_spore: Math.max(0, Math.floor(sanitizeNumber(rawRelics.eternal_spore, 0, 0))),
      solar_sap: Math.max(0, Math.floor(sanitizeNumber(rawRelics.solar_sap, 0, 0)))
    }
  };

  return {
    schemaVersion: GAME_CONFIG.SCHEMA_VERSION,
    lastSavedAt,
    lang,
    soundEnabled,
    resources,
    food,
    maxFood,
    pheromone,
    twigs: resources.twigs,
    honeydew: resources.honeydew,
    chitin: resources.chitin,
    spores: resources.spores,
    amber: resources.amber,
    workerRoles,
    activeConstructions,
    buildQueue,
    honeyBoostTimer,
    domeVentilation,
    queenDiet,
    queenHealth,
    maxQueenHealth,
    day,
    timeSeconds,
    speed,
    ants,
    rooms,
    squad,
    activeExpedition,
    mutations,
    royalDna,
    stats,
    achievements,
    incubationMultiplier,
    activeTab,
    activeSubtabs,
    settings,
    pinnedTarget,
    exploration,
    nextRaidTimer,
    nextRaidFaction,
    nextEventTimer,
    activeEvent,
    bossesDefeated,
    lastBattleReport,
    raidActive: false,
    eggs,
    manualHarvestCooldowns
  };
}

// --- ÉTAT DU JEU (Initialisé depuis GAME_CONFIG.INITIAL_STATE + localStorage) ---
function createFreshGameState() {
  let savedLang = GAME_CONFIG.INITIAL_STATE.lang;
  try {
    if (typeof localStorage !== 'undefined') {
      savedLang = localStorage.getItem(GAME_CONFIG.LANG_KEY) || savedLang;
    }
  } catch (e) {}

  return sanitizeGameState({ lang: savedLang, lastSavedAt: Date.now() }, GAME_CONFIG.INITIAL_STATE);
}

const gameState = createFreshGameState();
globalThis.gameState = gameState;

// --- SYSTÈME AUDIO PROCÉDURAL (WEB AUDIO API) ---
const playSfx = (type, opts) => (gameUI.playSfx || globalThis.playSfx || (() => {}))(type, opts);
function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;
  const btn = getEl('btnSound');
  if (btn) btn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
  if (gameState.soundEnabled) playSfx('click');
  saveGame();
  return gameState.soundEnabled;
}
globalThis.playSfx = playSfx;
globalThis.toggleSound = toggleSound;

// --- SAUVEGARDE, CHARGEMENT, EXPORT/IMPORT & PROGRESSION HORS-LIGNE ---
function buildSavePayload(state = gameState, now = Date.now()) {
  return {
    schemaVersion: GAME_CONFIG.SCHEMA_VERSION,
    lastSavedAt: now,
    lang: state.lang,
    soundEnabled: state.soundEnabled,
    resources: state.resources || { food: state.food, pheromone: state.pheromone },
    food: state.food,
    maxFood: state.maxFood,
    pheromone: state.pheromone,
    queenHealth: state.queenHealth,
    maxQueenHealth: state.maxQueenHealth,
    day: state.day,
    timeSeconds: state.timeSeconds,
    speed: state.speed,
    ants: state.ants,
    rooms: state.rooms,
    squad: state.squad,
    activeExpedition: state.activeExpedition,
    mutations: state.mutations,
    royalDna: state.royalDna || 0,
    stats: state.stats || {},
    achievements: state.achievements || {},
    bossesDefeated: state.bossesDefeated || {},
    lastBattleReport: state.lastBattleReport || null,
    incubationMultiplier: state.incubationMultiplier || 1,
    activeTab: state.activeTab || 'colony',
    activeSubtabs: state.activeSubtabs || {},
    settings: state.settings || { screenShakeEnabled: true, particleDensity: 'normal', numberNotation: 'standard' },
    amber: (state.resources && state.resources.amber) || state.amber || 0,
    exploration: state.exploration || null,
    pinnedTarget: state.pinnedTarget || null,
    nextRaidTimer: state.nextRaidTimer,
    eggs: state.eggs
  };
}

function saveGame(now = Date.now()) {
  try {
    gameState.schemaVersion = GAME_CONFIG.SCHEMA_VERSION;
    gameState.lastSavedAt = now;
    if (typeof localStorage !== 'undefined') {
      const payload = buildSavePayload(gameState, now);
      localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(payload));
    }
  } catch (e) {
    // Ignorer si localStorage indisponible
  }
}

function encodeBase64(str) {
  return btoa(encodeURIComponent(str));
}

function decodeBase64(b64) {
  return decodeURIComponent(atob(b64));
}

function exportSaveString(state = gameState, now = Date.now()) {
  const payload = buildSavePayload(state, now);
  return encodeBase64(JSON.stringify(payload));
}

function parseSaveString(rawString) {
  if (typeof rawString !== 'string') return null;
  const trimmed = rawString.trim();
  if (!trimmed) return null;

  let parsed = null;
  if (trimmed.startsWith('{')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      return null;
    }
  } else {
    try {
      const decoded = decodeBase64(trimmed);
      parsed = JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const hasValidSignature =
    typeof parsed.food === 'number' ||
    (parsed.ants && typeof parsed.ants === 'object') ||
    (parsed.rooms && typeof parsed.rooms === 'object') ||
    typeof parsed.schemaVersion === 'number';

  return hasValidSignature ? parsed : null;
}

function importSaveString(rawString, targetState = gameState) {
  const parsed = parseSaveString(rawString);
  if (!parsed) {
    return { ok: false, error: 'INVALID_SAVE_CODE' };
  }

  const sanitized = sanitizeGameState(parsed, GAME_CONFIG.INITIAL_STATE);
  sanitized.lastSavedAt = Date.now();
  Object.assign(targetState, sanitized);

  saveGame(sanitized.lastSavedAt);
  setLanguage(targetState.lang);
  logMessageKey('log.save_imported', { version: targetState.schemaVersion }, 'birth');
  updateUI();

  return { ok: true, state: targetState };
}

function formatDurationSeconds(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Calcul pur et déterministe de la progression hors-ligne (Offline Catch-up).
 * Plafonne le temps à maxOfflineSeconds, applique offlineEfficiencyRatio (75%),
 * fait éclore les œufs dans la limite du plafond de population et ne déclenche aucun raid destructeur.
 */
function computeOfflineProgress(state = gameState, elapsedSeconds = 0, config = GAME_CONFIG) {
  const eco = config.ECONOMY;
  const effectiveSeconds = Math.min(
    eco.maxOfflineSeconds,
    Math.max(0, Math.floor(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0))
  );

  const updatedAnts = { ...state.ants };
  const updatedEggs = (state.eggs || []).map(e => ({ ...e }));
  const hatchedCounts = { worker: 0, scout: 0, warrior: 0, tank: 0 };
  let totalHatched = 0;

  if (effectiveSeconds <= 0) {
    return {
      effectiveSeconds: 0,
      foodGained: 0,
      pheromoneGained: 0,
      hatchedCounts,
      totalHatched: 0,
      daysPassed: 0,
      updatedAnts,
      updatedEggs,
      updatedFood: state.food,
      updatedPheromone: state.pheromone,
      updatedDay: state.day,
      updatedTimeSeconds: state.timeSeconds,
      updatedActiveExpedition: state.activeExpedition ? { ...state.activeExpedition } : null
    };
  }

  const effRatio = eco.offlineEfficiencyRatio;
  const incSpeed = getIncubationSpeedMultiplier(state);
  const incProgress = effectiveSeconds * incSpeed * effRatio;
  const popCap = getPopCap(state);

  const remainingEggs = [];
  for (let i = 0; i < updatedEggs.length; i++) {
    const egg = updatedEggs[i];
    const currentPop = updatedAnts.worker + updatedAnts.scout + updatedAnts.warrior + updatedAnts.tank;
    if (egg.elapsed + incProgress >= egg.totalTime && currentPop < popCap) {
      updatedAnts[egg.caste] += 1;
      hatchedCounts[egg.caste] += 1;
      totalHatched++;
    } else {
      remainingEggs.push({
        ...egg,
        elapsed: Math.min(egg.totalTime, egg.elapsed + incProgress)
      });
    }
  }

  const postHatchState = { ...state, ants: updatedAnts, eggs: remainingEggs };
  const netFoodPerSec = getNetFoodPerSec(postHatchState);
  let updatedFood = state.food;
  let foodGained = 0;

  if (netFoodPerSec > 0) {
    const rawFood = netFoodPerSec * effectiveSeconds * effRatio;
    updatedFood = Math.min(state.maxFood, state.food + rawFood);
    foodGained = Math.max(0, Math.round((updatedFood - state.food) * 10) / 10);
  }

  const pheroPerSec = getPheromoneGainPerSec(postHatchState);
  const pheromoneGained = Math.round((pheroPerSec * effectiveSeconds * effRatio) * 10) / 10;
  const updatedPheromone = Math.round((state.pheromone + pheromoneGained) * 10) / 10;

  const updatedTimeSeconds = state.timeSeconds + effectiveSeconds;
  const prevDays = Math.floor(state.timeSeconds / eco.dayDurationSeconds);
  const newDays = Math.floor(updatedTimeSeconds / eco.dayDurationSeconds);
  const daysPassed = Math.max(0, newDays - prevDays);
  const updatedDay = state.day + daysPassed;

  let updatedActiveExpedition = null;
  if (state.activeExpedition) {
    updatedActiveExpedition = {
      ...state.activeExpedition,
      timer: Math.max(1, state.activeExpedition.timer - effectiveSeconds)
    };
  }

  return {
    effectiveSeconds,
    foodGained,
    pheromoneGained,
    hatchedCounts,
    totalHatched,
    daysPassed,
    updatedAnts,
    updatedEggs: remainingEggs,
    updatedFood,
    updatedPheromone,
    updatedDay,
    updatedTimeSeconds,
    updatedActiveExpedition
  };
}

function applyOfflineProgress(state = gameState, elapsedSeconds = 0, config = GAME_CONFIG) {
  const report = computeOfflineProgress(state, elapsedSeconds, config);
  if (report.effectiveSeconds <= 0) return report;

  state.ants = report.updatedAnts;
  state.eggs = report.updatedEggs;
  state.food = report.updatedFood;
  state.pheromone = report.updatedPheromone;
  state.day = report.updatedDay;
  state.timeSeconds = report.updatedTimeSeconds;
  state.activeExpedition = report.updatedActiveExpedition;
  state.lastSavedAt = Date.now();

  if (report.effectiveSeconds >= config.ECONOMY.minOfflineReportSeconds) {
    const durStr = formatDurationSeconds(report.effectiveSeconds);
    logMessageKey(
      'log.offline_return',
      {
        duration: durStr,
        food: Math.floor(report.foodGained),
        phero: report.pheromoneGained,
        hatched: report.totalHatched
      },
      'loot'
    );
    showOfflineModal(report);
  }

  return report;
}

function loadGame(now = Date.now()) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const sanitized = sanitizeGameState(data, GAME_CONFIG.INITIAL_STATE);
    const prevSavedAt = sanitized.lastSavedAt;

    Object.assign(gameState, sanitized);

    if (prevSavedAt && now > prevSavedAt) {
      const elapsedSec = Math.floor((now - prevSavedAt) / 1000);
      if (elapsedSec >= GAME_CONFIG.ECONOMY.minOfflineReportSeconds) {
        return applyOfflineProgress(gameState, elapsedSec, GAME_CONFIG);
      }
    }
    gameState.lastSavedAt = now;
    return null;
  } catch (e) {
    // Sauvegarde corrompue ignorée, maintien de l'état sain
    return null;
  }
}

// --- MODALES UI (Déléguées à game-ui.js) ---
const openSaveModal = () => (gameUI.openSaveModal || globalThis.openSaveModal || (() => {}))();
const closeSaveModal = () => (gameUI.closeSaveModal || globalThis.closeSaveModal || (() => {}))();
const handleExportSaveUI = () => (gameUI.handleExportSaveUI || globalThis.handleExportSaveUI || (() => {}))();
const handleImportSaveUI = () => (gameUI.handleImportSaveUI || globalThis.handleImportSaveUI || (() => {}))();
const showOfflineModal = (r) => (gameUI.showOfflineModal || globalThis.showOfflineModal || (() => {}))(r);
const closeOfflineModal = () => (gameUI.closeOfflineModal || globalThis.closeOfflineModal || (() => {}))();

globalThis.openSaveModal = openSaveModal;
globalThis.closeSaveModal = closeSaveModal;
globalThis.handleExportSaveUI = handleExportSaveUI;
globalThis.handleImportSaveUI = handleImportSaveUI;
globalThis.showOfflineModal = showOfflineModal;
globalThis.closeOfflineModal = closeOfflineModal;

function resetGame() {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (!window.confirm(t('reset.confirm'))) return;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(GAME_CONFIG.SAVE_KEY);
    }
  } catch (e) {}

  const currentLang = gameState.lang;
  const currentSound = gameState.soundEnabled;
  const fresh = createFreshGameState();
  Object.assign(gameState, fresh);
  gameState.lang = currentLang;
  gameState.soundEnabled = currentSound;

  const logContainer = getEl('logContainer');
  if (logContainer) logContainer.innerHTML = '';

  setLanguage(gameState.lang);
  logMessageKey('log.init');
  logMessageKey('log.ready', {}, 'birth');
  updateUI();
}
globalThis.resetGame = resetGame;

// --- INITIALISATION AU CHARGEMENT ---
/* c8 ignore start */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    initTabs();
    initSpeedControls();

    setText('btnSound', gameState.soundEnabled ? '🔊' : '🔇');

    setLanguage(gameState.lang);
    if (typeof initCanvas === 'function') initCanvas();
    updateUI();

    setInterval(gameTick, 1000);
    if (typeof requestAnimationFrame === 'function' && typeof renderCanvasLoop === 'function') {
      requestAnimationFrame(renderCanvasLoop);
    }

    logMessageKey('log.ready', {}, 'birth');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveGame(Date.now());
    } else if (document.visibilityState === 'visible' && gameState.lastSavedAt) {
      const now = Date.now();
      const elapsedSec = Math.floor((now - gameState.lastSavedAt) / 1000);
      if (elapsedSec >= GAME_CONFIG.ECONOMY.minOfflineReportSeconds) {
        applyOfflineProgress(gameState, elapsedSec, GAME_CONFIG);
        saveGame(now);
        updateUI();
      }
    }
  });
}
/* c8 ignore stop */

// --- SYSTÈME DES 4 SAISONS ---
function getCurrentSeasonConfig(state = gameState) {
  const sCfg = GAME_CONFIG.SEASONS;
  const safeDay = Math.max(1, (state && state.day) || 1);
  const index = Math.floor((safeDay - 1) / sCfg.daysPerSeason) % sCfg.order.length;
  const seasonKey = sCfg.order[index];
  return sCfg[seasonKey] || sCfg.summer;
}

// --- SYSTÈME BILINGUE FRANÇAIS / ANGLAIS (i18n) & NAVIGATION DOM ---
function resolveTranslatedParams(params) {
  const out = { ...params };
  if (out.nameKey) out.name = t(out.nameKey);
  if (out.descKey) out.desc = t(out.descKey);
  if (out.upperNameKey) out.name = t(out.upperNameKey).toUpperCase();
  if (out.bonusWorkersCount) {
    out.bonus = t('log.exp_bonus_workers', { count: out.bonusWorkersCount });
  } else if (out.bonus === undefined) {
    out.bonus = '';
  }
  return out;
}

function setLanguage(lang) {
  if (!GAME_CONFIG.I18N || !GAME_CONFIG.I18N[lang]) return;
  gameState.lang = lang;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GAME_CONFIG.LANG_KEY, lang);
    }
  } catch (e) {}

  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = t('app.title');

  const btnFR = document.getElementById('btnLangFR');
  const btnEN = document.getElementById('btnLangEN');
  if (btnFR) btnFR.classList.toggle('active', lang === 'fr');
  if (btnEN) btnEN.classList.toggle('active', lang === 'en');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('.doctrine-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.doctrine === (gameState.squad && gameState.squad.doctrine));
  });

  initStaticTokensUI();
  updateUI();
}

function initStaticTokensUI() {
  if (typeof document === 'undefined') return;
  const workerUpkeep = document.getElementById('statWorkerUpkeep');
  if (workerUpkeep) workerUpkeep.textContent = `-${GAME_CONFIG.ECONOMY.baseFoodConsumptionPerAnt} 🍃/s`;

  const scoutPhero = document.getElementById('statScoutPhero');
  if (scoutPhero) scoutPhero.textContent = `+${GAME_CONFIG.CASTES.scout.pheroProd} 🧪/s`;

  Object.values(GAME_CONFIG.CASTES).forEach(caste => {
    const costEl = document.getElementById(`costIncubate_${caste.id}`);
    if (costEl) costEl.textContent = `${caste.cost} 🍃 (${caste.incubationSeconds}s)`;
  });

  Object.values(GAME_CONFIG.MUTATIONS).forEach(mut => {
    const costEl = document.getElementById(`costMut_${mut.id}`);
    if (costEl) costEl.textContent = `${mut.cost} 🧪`;
  });
}

const switchTab = (tabId) => {
  if (gameUI && typeof gameUI.switchTab === 'function') {
    gameUI.switchTab(tabId);
  }
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
};

function selectRoomInUI(roomKey) {
  switchTab('rooms');
  if (typeof document !== 'undefined') {
    const card = document.getElementById(`roomCard_${roomKey}`) || document.getElementById(`card_${roomKey}`);
    if (card) {
      card.classList.add('highlight-glow');
      setTimeout(() => card.classList.remove('highlight-glow'), 1800);
    }
  }
}

function initTabs() {
  if (typeof document === 'undefined') return;
  const desktopBtns = document.querySelectorAll('#desktopTabs .tab-btn');
  const mobileBtns = document.querySelectorAll('#mobileNav .tab-btn');
  desktopBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  mobileBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
}

function initSpeedControls() {
  if (typeof document === 'undefined') return;
  const btns = {
    pause: document.getElementById('btnPause'),
    s1: document.getElementById('btnSpeed1'),
    s2: document.getElementById('btnSpeed2'),
    s3: document.getElementById('btnSpeed3')
  };

  function setSpeed(val, activeBtn) {
    gameState.speed = val;
    Object.values(btns).forEach(b => b && b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  if (btns.pause) btns.pause.addEventListener('click', () => setSpeed(0, btns.pause));
  if (btns.s1) btns.s1.addEventListener('click', () => setSpeed(1, btns.s1));
  if (btns.s2) btns.s2.addEventListener('click', () => setSpeed(2, btns.s2));
  if (btns.s3) btns.s3.addEventListener('click', () => setSpeed(3, btns.s3));
}

globalThis.setLanguage = setLanguage;
globalThis.switchTab = switchTab;
globalThis.selectRoomInUI = selectRoomInUI;
globalThis.initTabs = initTabs;
globalThis.initSpeedControls = initSpeedControls;
globalThis.initStaticTokensUI = initStaticTokensUI;
globalThis.resolveTranslatedParams = resolveTranslatedParams;

// --- CALCULS ÉCONOMIQUES, POPULATION & PUISSANCE (FONCTIONS PURES) ---
function getTotalPop(state = gameState) {
  const ants = (state && state.ants) || GAME_CONFIG.INITIAL_STATE.ants;
  return (ants.worker || 0) + (ants.scout || 0) + (ants.warrior || 0) + (ants.tank || 0) + (ants.nurse || 0);
}

function getReservedPop(state = gameState) {
  return getTotalPop(state) + (state && Array.isArray(state.eggs) ? state.eggs.length : 0);
}

function getPopCap(state = gameState) {
  const dormLvl = (state && state.rooms && typeof state.rooms.dorm === 'number') ? state.rooms.dorm : 1;
  return GAME_CONFIG.ECONOMY.basePopCap + (dormLvl * GAME_CONFIG.ROOMS.dorm.popCapPerLevel);
}

function getNetFoodPerSec(state = gameState) {
  if (gameUI && typeof gameUI.getEconomyBreakdown === 'function') {
    return gameUI.getEconomyBreakdown(state).food.net;
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.getEconomyBreakdown === 'function') {
    return globalThis.getEconomyBreakdown(state).food.net;
  }
  const eco = GAME_CONFIG.ECONOMY;
  const castes = GAME_CONFIG.CASTES;
  const season = getCurrentSeasonConfig(state);
  const popTotal = getTotalPop(state);
  const mods = computeModifiers(state);

  const surfaceMult = (mods && mods.workerFoodMultiplier !== undefined) ? mods.workerFoodMultiplier : season.workerFoodMultiplier;
  const surfaceProduction = (state.ants.worker || 0) * castes.worker.foodProd * surfaceMult;
  const fungusProduction = ((state.rooms && state.rooms.fungus) || 0) * GAME_CONFIG.ROOMS.fungus.foodPerLevel * mods.fungusProductionMultiplier;
  const consumption =
    (popTotal * eco.baseFoodConsumptionPerAnt) +
    ((state.ants.tank || 0) * castes.tank.extraUpkeep) +
    ((state.ants.warrior || 0) * castes.warrior.extraUpkeep) +
    ((state.ants.nurse || 0) * (castes.nurse.extraUpkeep || 0));

  return (surfaceProduction + fungusProduction) - consumption;
}

function getPheromoneGainPerSec(state = gameState) {
  const scouts = (state && state.ants && state.ants.scout) || 0;
  return GAME_CONFIG.ECONOMY.basePheromoneGain + (scouts * GAME_CONFIG.CASTES.scout.pheroProd);
}

function getIncubationSpeedMultiplier(state = gameState) {
  const eco = GAME_CONFIG.ECONOMY;
  const season = getCurrentSeasonConfig(state);
  const mods = computeModifiers(state);
  const queenLvl = (state && state.rooms && typeof state.rooms.queen === 'number') ? state.rooms.queen : 1;
  const queenBonus = 1 + (Math.max(0, queenLvl - 1) * eco.queenIncubationSpeedPerLevel);
  return queenBonus * season.incubationSpeedMultiplier * (1 + mods.nurseIncubationBonus);
}

function calculateSquadPower(squadObj, state = gameState) {
  if (!squadObj || typeof squadObj !== 'object') return 0;
  const outcome = resolveCombat({
    allies: squadObj,
    enemy: { power: 0 },
    doctrine: squadObj.doctrine || 'balanced',
    modifiers: computeModifiers(state)
  });
  return outcome.alliedPower;
}

// --- BOUCLE DE SIMULATION (LOGIQUE MÉTIER) ---
function gameTick() {
  if (gameState.speed === 0) return;

  const eco = GAME_CONFIG.ECONOMY;

  for (let s = 0; s < gameState.speed; s++) {
    gameState.timeSeconds++;

    // Passage de jour et vérification de changement de saison
    if (gameState.timeSeconds % eco.dayDurationSeconds === 0) {
      const prevSeason = getCurrentSeasonConfig().id;
      gameState.day++;
      const newSeason = getCurrentSeasonConfig().id;

      logMessageKey('log.new_day', { day: gameState.day, nameKey: `season.${newSeason}` });

      if (newSeason !== prevSeason) {
        if (prevSeason === 'winter' && gameState.queenHealth > 0) {
          if (!gameState.stats) gameState.stats = {};
          gameState.stats.winterSurvived = (gameState.stats.winterSurvived || 0) + 1;
        }
        logMessageKey(
          'log.season_change',
          { nameKey: `season.${newSeason}`, descKey: `season.${newSeason}.desc` },
          'birth'
        );
      }
    }

    // 1. Calcul économique (Nourriture & Stocks)
    const mods = computeModifiers();
    const baseGranaryMaxFood = GAME_CONFIG.INITIAL_STATE.maxFood + Math.max(0, ((gameState.rooms && gameState.rooms.granary) || 1) - 1) * GAME_CONFIG.ROOMS.granary.storagePerLevel;
    gameState.maxFood = Math.floor(baseGranaryMaxFood * (mods.granaryCapacityMultiplier || 1.0));
    gameState.maxQueenHealth = GAME_CONFIG.INITIAL_STATE.maxQueenHealth + (mods.queenHpBonus || 0);

    const netFood = getNetFoodPerSec();
    gameState.food = Math.min(gameState.maxFood, Math.max(0, gameState.food + netFood));

    if (!gameState.stats) gameState.stats = {};
    if (netFood > 0) {
      gameState.stats.totalFoodHarvested = (gameState.stats.totalFoodHarvested || 0) + netFood;
    }

    // Risque de famine si la nourriture tombe à 0
    if (gameState.food <= 0) {
      gameState.queenHealth = Math.max(eco.starvationMinQueenHealth, gameState.queenHealth - eco.starvationQueenDamagePerSec);
      if (Math.random() < eco.starvationLogChance) {
        logMessageKey('log.starvation', {}, 'combat');
      }
    } else if (gameState.queenHealth < gameState.maxQueenHealth) {
      const effectiveHeal = eco.queenHealRatePerSec + (mods.queenHealRateBonus || 0);
      gameState.queenHealth = Math.min(gameState.maxQueenHealth, gameState.queenHealth + effectiveHeal);
    }

    // 2. Production passive de Phéromones (boostée par Antennes)
    const pheroGain = getPheromoneGainPerSec() * (mods.pheromoneMultiplier || 1.0);
    gameState.pheromone = Math.round((gameState.pheromone + pheroGain) * 10) / 10;
    gameState.stats.totalPheromonesEarned = (gameState.stats.totalPheromonesEarned || 0) + pheroGain;
    gameState.stats.highestPopReached = Math.max(gameState.stats.highestPopReached || 0, getTotalPop(gameState));

    // 2b. Économie Symbiotique & Métiers (Lot 5)
    const roles = (typeof symbiosisEngine.getWorkerRoles === 'function')
      ? symbiosisEngine.getWorkerRoles(gameState)
      : (gameState.workerRoles || { harvester: gameState.ants.worker, breeder: 0, grower: 0, mason: 0 });
    const symCfg = GAME_CONFIG.SYMBIOSIS || {};

    // Éleveuses -> Miellat (si aphid_farm >= 1)
    if (gameState.rooms && gameState.rooms.aphid_farm > 0) {
      const roomBonus = 1 + (gameState.rooms.aphid_farm - 1) * 0.20;
      const breederProd = roles.breeder * (symCfg.breederHoneydewProd || 0.08) * roomBonus * (1 + (mods.harmonyOrganicBonus || 0));
      gameState.honeydew = Math.round((gameState.honeydew + breederProd) * 100) / 100;
    }

    // Cultivatrices -> Spores (si fungus >= 1)
    if (gameState.rooms && gameState.rooms.fungus > 0) {
      const growerProd = roles.grower * (symCfg.growerSporesProd || 0.05) * (1 + (mods.harmonyOrganicBonus || 0));
      gameState.spores = Math.round((gameState.spores + growerProd) * 100) / 100;
    }

    // Maçonnes -> Brindilles & Chitine
    const masonTwigs = roles.mason * (symCfg.masonTwigsProd || 0.10);
    gameState.twigs = Math.round((gameState.twigs + masonTwigs) * 100) / 100;
    if (gameState.rooms && gameState.rooms.masonry_hall > 0) {
      const masonChitin = roles.mason * (symCfg.masonChitinProd || 0.02);
      gameState.chitin = Math.round((gameState.chitin + masonChitin) * 100) / 100;
    }

    // Décompte du Boost Miellat
    if (gameState.honeyBoostTimer > 0) {
      gameState.honeyBoostTimer--;
    }

    // Régime Royal au Miellat (Gelée de Miellat)
    let queenFedHoneydew = false;
    if (gameState.queenDiet === 'royal_jelly') {
      const jellyUpkeep = symCfg.royalJellyHoneydewUpkeepPerSec || 0.15;
      if (gameState.honeydew >= jellyUpkeep) {
        gameState.honeydew = Math.round((gameState.honeydew - jellyUpkeep) * 100) / 100;
        queenFedHoneydew = true;
      }
    }

    // 3. Progression de la file d'incubation (gameState.eggs) avec support Œuf Doré (Lot 5)
    const incSpeed = getIncubationSpeedMultiplier();
    for (let i = gameState.eggs.length - 1; i >= 0; i--) {
      const egg = gameState.eggs[i];
      egg.elapsed += incSpeed;
      if (egg.elapsed >= egg.totalTime) {
        const hatchedCaste = egg.caste;
        gameState.eggs.splice(i, 1);

        let hatchedCount = 1;
        if (queenFedHoneydew && Math.random() < (symCfg.goldenEggChance || 0.15)) {
          hatchedCount = 2;
          logMessageKey('log.golden_egg', {}, 'birth');
          if (typeof globalThis.spawnCanvasFloatingText === 'function') {
            globalThis.spawnCanvasFloatingText('queen', '✨ +2 🐜', '#f6e05e');
          }
        }

        gameState.ants[hatchedCaste] += hatchedCount;
        gameState.stats.totalAntsHatched = (gameState.stats.totalAntsHatched || 0) + hatchedCount;
        if (typeof globalThis.triggerAntSpawnEffect === 'function') {
          globalThis.triggerAntSpawnEffect(hatchedCaste);
        }
        if (typeof globalThis.spawnCanvasFloatingText === 'function') {
          globalThis.spawnCanvasFloatingText('nursery', `+${hatchedCount} 🐜`, '#f6ad55');
        }
        playSfx('hatch');
        logMessageKey('log.incubated', { nameKey: `caste.${hatchedCaste}.short` }, 'birth');
      }
    }

    // 3b. Progression des chantiers réels (Lot 5)
    const tickFn = (symbiosisEngine && symbiosisEngine.tickConstructions) || globalThis.tickConstructions;
    if (typeof tickFn === 'function') {
      const finishedRooms = tickFn(gameState, 1, GAME_CONFIG);
      finishedRooms.forEach(job => {
        playSfx('upgrade');
        logMessageKey('log.construction_finished', { name: t(`room.${job.roomKey}.name`), lvl: job.targetLevel });
        if (typeof globalThis.spawnCanvasFloatingText === 'function') {
          globalThis.spawnCanvasFloatingText(job.roomKey, `+${t('canvas.lvl.short')} ${job.targetLevel}`, '#ecc94b');
        }
      });
    }

    // 4. Ponte automatique de la Reine (Ferveur Impériale)
    const spawnCost = Math.max(1, Math.round(eco.autoSpawnFoodCost * (mods.autoSpawnCostMultiplier || 1.0)));
    if (gameState.food >= eco.autoSpawnMinFood && getReservedPop() < getPopCap()) {
      const spawnChance = (eco.autoSpawnBaseChance + (gameState.rooms.queen * eco.autoSpawnQueenRoomBonusChance) + (mods.autoSpawnBonusChance || 0)) *
        getCurrentSeasonConfig().incubationSpeedMultiplier;
      if (Math.random() < spawnChance) {
        gameState.food -= spawnCost;
        gameState.ants.worker++;
        gameState.stats.totalAntsHatched = (gameState.stats.totalAntsHatched || 0) + 1;
        if (typeof globalThis.triggerAntSpawnEffect === 'function') {
          globalThis.triggerAntSpawnEffect('worker');
        }
        if (typeof globalThis.spawnCanvasFloatingText === 'function') {
          globalThis.spawnCanvasFloatingText('queen', '+1 🐜', '#ecc94b');
        }
        logMessageKey('log.auto_spawn', {}, 'birth');
      }
    }

    // 5. Gestion des expéditions actives
    if (gameState.activeExpedition) {
      gameState.activeExpedition.timer--;
      if (gameState.activeExpedition.timer <= 0) {
        resolveExpedition();
      }
    }

    // 6. Gestion des raids ennemis
    handleRaidSystem();

    // 7. Gestion des événements à choix aléatoires (Lot 4)
    handleEventSystem();
  }

  // Synchronisation miroir de gameState.resources (Lots 3 & 5)
  if (!gameState.resources) gameState.resources = {};
  gameState.resources.food = gameState.food;
  gameState.resources.pheromone = gameState.pheromone;
  gameState.resources.twigs = gameState.twigs;
  gameState.resources.honeydew = gameState.honeydew;
  gameState.resources.chitin = gameState.chitin;
  gameState.resources.spores = gameState.spores;
  gameState.resources.amber = gameState.amber || (gameState.resources && gameState.resources.amber) || 0;
  gameState.amber = gameState.resources.amber;

  checkAndAwardAchievements();
  saveGame();
  updateUI();
}

// --- SYSTÈME D'INCUBATION (FILE D'ATTENTE D'ŒUFS & MULTIPLICATEURS LOT 3) ---
function incubateAnt(caste, customCount) {
  const casteConfig = GAME_CONFIG.CASTES[caste];
  if (!casteConfig) return;

  const mult = customCount !== undefined ? customCount : (gameState.incubationMultiplier || 1);
  const cost = casteConfig.cost;
  const popCap = getPopCap();
  const reservedPop = getReservedPop();
  const spaceLeft = Math.max(0, popCap - reservedPop);
  const maxAffordable = Math.floor(gameState.food / cost);

  let countToQueue = 1;
  if (mult === 'max') {
    countToQueue = Math.min(spaceLeft, maxAffordable);
  } else if (typeof mult === 'number' && mult > 0) {
    countToQueue = Math.min(mult, spaceLeft, maxAffordable);
  }

  if (countToQueue <= 0) {
    if (gameState.food < cost) {
      logMessageKey('log.no_food_ant', {}, 'combat');
    } else if (reservedPop >= popCap) {
      logMessageKey('log.pop_cap', {}, 'combat');
    }
    return;
  }

  const totalCost = countToQueue * cost;
  gameState.food -= totalCost;
  for (let i = 0; i < countToQueue; i++) {
    gameState.eggs.push({
      caste,
      elapsed: 0,
      totalTime: casteConfig.incubationSeconds
    });
  }

  playSfx('click');
  const effectiveSec = Math.max(1, Math.round(casteConfig.incubationSeconds / getIncubationSpeedMultiplier()));
  logMessageKey('log.egg_queued', { nameKey: `caste.${caste}.short`, sec: effectiveSec, count: countToQueue }, 'birth');
  saveGame();
  updateUI();
}
globalThis.incubateAnt = incubateAnt;

// --- SYSTÈME DE SALLES & CHANTIERS ASYMPTOTIQUES BORNÉS (LOT 5) ---
function upgradeRoom(roomKey, options = {}) {
  if (options && options.async) {
    const startFn = (symbiosisEngine && symbiosisEngine.startRoomConstruction) || globalThis.startRoomConstruction;
    if (typeof startFn === 'function') {
      const res = startFn(roomKey, gameState, GAME_CONFIG);
      if (!res.success) {
        if (res.reason === 'INSUFFICIENT_FOOD') {
          logMessageKey('log.no_food_room', { cost: res.cost });
        } else if (res.reason === 'ALREADY_UNDER_CONSTRUCTION') {
          logMessageKey('constructions.empty');
        } else if (res.reason === 'QUEUE_FULL') {
          logMessageKey('constructions.simultaneous_max');
        }
        return res;
      }

      playSfx('click');
      const durStr = formatDurationSeconds(res.construction.totalTime);
      logMessageKey('log.construction_started', {
        name: t(`room.${roomKey}.name`),
        lvl: res.construction.targetLevel,
        dur: durStr
      });
      saveGame();
      updateUI();
      return res;
    }
  }

  // Amélioration directe synchrone (compatibilité socle et tests)
  const roomConfig = GAME_CONFIG.ROOMS[roomKey];
  if (!roomConfig) return;
  const currentLvl = gameState.rooms[roomKey] || 0;
  const cost = roomConfig.cost(currentLvl);
  if (gameState.food < cost) {
    logMessageKey('log.no_food_room', { cost });
    return;
  }
  gameState.food -= cost;
  gameState.rooms[roomKey] = currentLvl + 1;
  if (roomKey === 'granary') {
    gameState.maxFood += roomConfig.storagePerLevel;
  }
  playSfx('upgrade');
  logMessageKey('log.room_up', { nameKey: `room.${roomKey}.name`, lvl: gameState.rooms[roomKey] });
  saveGame();
  updateUI();
}
globalThis.upgradeRoom = upgradeRoom;

// --- ACTIONS D'INTERFACE SYMBIOTIQUE (LOT 5) ---
function assignWorkerRoleUI(role, delta) {
  const fn = (symbiosisEngine && symbiosisEngine.assignWorkerRole) || globalThis.assignWorkerRole;
  if (typeof fn === 'function') {
    const res = fn(role, delta, gameState);
    if (res.success) {
      playSfx('click');
      saveGame();
      updateUI();
    }
  }
}
globalThis.assignWorkerRoleUI = assignWorkerRoleUI;

function boostConstructionWithHoneyUI() {
  const fn = (symbiosisEngine && symbiosisEngine.boostConstructionWithHoney) || globalThis.boostConstructionWithHoney;
  if (typeof fn === 'function') {
    const res = fn(gameState, GAME_CONFIG);
    if (res.success) {
      playSfx('upgrade');
      logMessageKey('log.honey_boost', {}, 'loot');
      if (typeof globalThis.spawnCanvasFloatingText === 'function') {
        globalThis.spawnCanvasFloatingText('queen', '🍯 VITESSE x2', '#ecc94b');
      }
      saveGame();
      updateUI();
    } else if (res.reason === 'INSUFFICIENT_HONEYDEW') {
      logMessageKey('symbiosis.honey_boost.no_honey');
    }
  }
}
globalThis.boostConstructionWithHoneyUI = boostConstructionWithHoneyUI;

function setDomeVentilationUI(mode) {
  const fn = (symbiosisEngine && symbiosisEngine.setDomeVentilation) || globalThis.setDomeVentilation;
  if (typeof fn === 'function') {
    fn(mode, gameState);
    playSfx('click');
    saveGame();
    updateUI();
  }
}
globalThis.setDomeVentilationUI = setDomeVentilationUI;

function setQueenDietUI(diet) {
  const fn = (symbiosisEngine && symbiosisEngine.setQueenDiet) || globalThis.setQueenDiet;
  if (typeof fn === 'function') {
    fn(diet, gameState);
    playSfx('click');
    saveGame();
    updateUI();
  }
}
globalThis.setQueenDietUI = setQueenDietUI;

/**
 * Action de récolte manuelle active sur les dépôts de surface (Lot 2).
 * Fonction pure et défensive.
 *
 * @param {'left'|'right'} [depositKey='left'] Clé du gisement de surface ('left' ou 'right')
 * @param {number} [nowSeconds=Date.now() / 1000] Horodatage en secondes
 * @returns {{ success: boolean, foodGained?: number, reason?: string, remainingSeconds?: number }}
 */
function harvestSurfaceDeposit(depositKey = 'left', nowSeconds = Date.now() / 1000) {
  const safeKey = depositKey === 'right' ? 'right' : 'left';
  const interactionCfg = GAME_CONFIG.CANVAS_INTERACTION || {};
  const foodReward = interactionCfg.manualHarvestFood || 5;
  const cooldownSec = interactionCfg.manualHarvestCooldownSeconds || 3;

  if (!gameState.manualHarvestCooldowns || typeof gameState.manualHarvestCooldowns !== 'object') {
    gameState.manualHarvestCooldowns = { left: 0, right: 0 };
  }

  const currentCooldown = gameState.manualHarvestCooldowns[safeKey] || 0;
  if (currentCooldown > nowSeconds) {
    const remaining = Math.ceil(currentCooldown - nowSeconds);
    return {
      success: false,
      reason: 'cooldown',
      remainingSeconds: remaining
    };
  }

  gameState.food = Math.min(gameState.maxFood, gameState.food + foodReward);
  gameState.manualHarvestCooldowns[safeKey] = nowSeconds + cooldownSec;

  playSfx('click');
  logMessageKey('canvas.harvest.success', { amount: foodReward });

  const nodeId = safeKey === 'left' ? 'surface_left' : 'surface_right';
  if (typeof globalThis !== 'undefined' && typeof globalThis.spawnCanvasFloatingText === 'function') {
    globalThis.spawnCanvasFloatingText(nodeId, `+${foodReward} 🍃`, '#48bb78');
  }

  saveGame();
  updateUI();

  return {
    success: true,
    foodGained: foodReward
  };
}
globalThis.harvestSurfaceDeposit = harvestSurfaceDeposit;

// --- GESTION DE L'ESCOUADE ET DOCTRINES ---
function adjustSquad(caste, delta) {
  const currentInSquad = gameState.squad[caste];
  const maxAvailable = gameState.ants[caste];
  if (typeof currentInSquad !== 'number' || typeof maxAvailable !== 'number') return;
  const nextVal = currentInSquad + delta;

  if (nextVal >= 0 && nextVal <= maxAvailable) {
    gameState.squad[caste] = nextVal;
    playSfx('click');
    updateUI();
  }
}
globalThis.adjustSquad = adjustSquad;

function setDoctrine(doctrineName) {
  const doctrineConfig = GAME_CONFIG.DOCTRINES[doctrineName];
  if (!doctrineConfig) return;

  gameState.squad.doctrine = doctrineName;
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.doctrine-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.doctrine === doctrineName);
    });
  }
  playSfx('click');
  logMessageKey('log.doctrine_set', { upperNameKey: `doctrine.${doctrineName}.name` });
  updateUI();
}
globalThis.setDoctrine = setDoctrine;

// --- EXPÉDITIONS & BATAILLES ---
function launchExpedition(missionType) {
  const totalSquad = gameState.squad.tank + gameState.squad.warrior + gameState.squad.scout;
  if (totalSquad === 0) {
    logMessageKey('log.empty_squad', {}, 'combat');
    return;
  }

  if (gameState.activeExpedition) {
    logMessageKey('log.exp_busy');
    return;
  }

  const m = GAME_CONFIG.MISSIONS[missionType];
  if (!m) return;

  gameState.activeExpedition = {
    ...m,
    timer: m.duration,
    squadSnapshot: { ...gameState.squad }
  };

  playSfx('click');
  logMessageKey('log.exp_start', { nameKey: `mission.${m.id}.short`, dur: m.duration });
  saveGame();
  updateUI();
}
globalThis.launchExpedition = launchExpedition;

function recallExpedition() {
  if (!gameState.activeExpedition) return;
  gameState.activeExpedition = null;
  playSfx('click');
  logMessageKey('log.exp_recalled');
  saveGame();
  updateUI();
}
globalThis.recallExpedition = recallExpedition;

function resolveExpedition() {
  const exp = gameState.activeExpedition;
  if (!exp) return;
  gameState.activeExpedition = null;

  const mods = computeModifiers();
  const outcome = resolveCombat({
    allies: exp.squadSnapshot || gameState.squad,
    enemy: {
      id: exp.id,
      nameKey: `mission.${exp.id}.short`,
      difficulty: exp.difficulty,
      faction: exp.faction,
      lootFood: exp.lootFood,
      lootPhero: exp.lootPhero,
      bonusWorkers: exp.bonusWorkers,
      isBoss: Boolean(exp.isBoss),
      trophyKey: exp.trophyKey
    },
    doctrine: exp.squadSnapshot ? exp.squadSnapshot.doctrine : gameState.squad.doctrine,
    modifiers: mods
  });

  // Enregistrement du rapport unifié
  gameState.lastBattleReport = {
    source: 'expedition',
    targetKey: `mission.${exp.id}.short`,
    faction: exp.faction,
    isBoss: Boolean(exp.isBoss),
    ...outcome
  };

  if (outcome.counterApplied) {
    if (outcome.counterApplied === 'tank') logMessageKey('log.combat_counter_tank', {}, 'combat');
    else if (outcome.counterApplied === 'warrior_acid') logMessageKey('log.combat_counter_warrior', {}, 'combat');
    else if (outcome.counterApplied === 'scout') logMessageKey('log.combat_counter_scout', {}, 'combat');
  }

  if (outcome.victory) {
    gameState.food = Math.min(gameState.maxFood, gameState.food + outcome.loot.food);
    gameState.pheromone = Math.round((gameState.pheromone + outcome.loot.phero) * 10) / 10;

    let addedWorkers = 0;
    if (outcome.loot.bonusWorkers > 0 && getReservedPop() < getPopCap()) {
      addedWorkers = Math.min(outcome.loot.bonusWorkers, getPopCap() - getReservedPop());
      gameState.ants.worker += addedWorkers;
      if (typeof globalThis.triggerAntSpawnEffect === 'function') {
        globalThis.triggerAntSpawnEffect('worker');
      }
    }

    if (outcome.loot.trophy) {
      if (!gameState.bossesDefeated) gameState.bossesDefeated = {};
      gameState.bossesDefeated.mantis = true;
      logMessageKey('log.boss_mantis_victory', {}, 'loot');
      logMessageKey('loot.trophy', { nameKey: outcome.loot.trophy }, 'loot');
    }

    if (outcome.loot && outcome.loot.amber > 0) {
      if (!gameState.resources) gameState.resources = {};
      const curAmber = (gameState.resources.amber || gameState.amber || 0);
      gameState.resources.amber = curAmber + outcome.loot.amber;
      gameState.amber = gameState.resources.amber;
    }

    if (exp.isGuardian && gameState.exploration) {
      const curR = gameState.exploration.currentRing || 1;
      gameState.exploration.currentRing = curR + 1;
      gameState.exploration.maxRingReached = Math.max(gameState.exploration.maxRingReached || 1, curR + 1);
      logMessageKey('log.ring_cleared', { ring: curR, amber: (outcome.loot && outcome.loot.amber) || 0 }, 'loot');
    }

    playSfx('victory');
    logMessageKey(
      'log.exp_win',
      {
        nameKey: `mission.${exp.id}.short`,
        food: outcome.loot.food,
        phero: outcome.loot.phero,
        bonusWorkersCount: addedWorkers
      },
      'loot'
    );
  } else {
    // Application des pertes militaires réelles
    if (outcome.losses.warrior > 0) {
      gameState.squad.warrior = Math.max(0, gameState.squad.warrior - outcome.losses.warrior);
      gameState.ants.warrior = Math.max(0, gameState.ants.warrior - outcome.losses.warrior);
    }
    if (outcome.losses.tank > 0) {
      gameState.squad.tank = Math.max(0, gameState.squad.tank - outcome.losses.tank);
      gameState.ants.tank = Math.max(0, gameState.ants.tank - outcome.losses.tank);
    }
    if (outcome.losses.scout > 0) {
      gameState.squad.scout = Math.max(0, gameState.squad.scout - outcome.losses.scout);
      gameState.ants.scout = Math.max(0, gameState.ants.scout - outcome.losses.scout);
    }
    const totalLosses = outcome.losses.warrior + outcome.losses.tank + outcome.losses.scout;
    playSfx('raid');
    logMessageKey('log.exp_loss', { nameKey: `mission.${exp.id}.short`, losses: totalLosses }, 'combat');
  }

  // Recyclage de biomasse en compostage fongique (Lot 5)
  if (outcome.compost && (outcome.compost.sporesGained > 0 || outcome.compost.chitinGained > 0)) {
    gameState.spores = Math.round(((gameState.spores || 0) + outcome.compost.sporesGained) * 10) / 10;
    gameState.chitin = Math.round(((gameState.chitin || 0) + outcome.compost.chitinGained) * 10) / 10;
    if (gameState.resources) {
      gameState.resources.spores = gameState.spores;
  gameState.resources.amber = gameState.amber || (gameState.resources && gameState.resources.amber) || 0;
  gameState.amber = gameState.resources.amber;
      gameState.resources.chitin = gameState.chitin;
    }
    logMessageKey('log.compost_gains', {
      spores: outcome.compost.sporesGained,
      chitin: outcome.compost.chitinGained
    }, 'loot');
  }

  checkAndAwardAchievements();
  saveGame();
  updateUI();
}

// --- SYSTÈME DE RAIDS ADVERSES ---
function handleRaidSystem() {
  const raidCfg = GAME_CONFIG.RAIDS;
  gameState.nextRaidTimer--;

  const alertBanner = getEl('raidAlert');
  if (alertBanner) {
    if (gameState.nextRaidTimer <= raidCfg.alertThresholdSeconds) {
      alertBanner.style.display = 'block';
      alertBanner.textContent = t('alert.raid', { sec: gameState.nextRaidTimer });
      if (gameState.nextRaidTimer === raidCfg.alertThresholdSeconds) {
        playSfx('raid');
      }
    } else {
      alertBanner.style.display = 'none';
    }
  }

  if (gameState.nextRaidTimer <= 0) {
    triggerEnemyRaid();
    gameState.nextRaidTimer = raidCfg.minIntervalSeconds + Math.floor(Math.random() * raidCfg.randomIntervalSeconds);
    const factions = ['fire_ants', 'termites', 'wasps'];
    gameState.nextRaidFaction = factions[Math.floor(Math.random() * factions.length)];
  }
}

function triggerEnemyRaid() {
  const raidCfg = GAME_CONFIG.RAIDS;
  const season = getCurrentSeasonConfig();
  const mods = computeModifiers();
  logMessageKey('log.raid_start', {}, 'combat');

  const raidStrength = Math.round((raidCfg.baseStrength + (gameState.day * raidCfg.strengthPerDay)) * season.raidStrengthMultiplier);

  // Seules les troupes présentes dans le nid (non mobilisées à l'extérieur) défendent !
  const deployedTanks = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot.tank) || 0;
  const deployedWarriors = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot.warrior) || 0;
  const deployedScouts = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot.scout) || 0;

  const defendingTanks = Math.max(0, gameState.ants.tank - deployedTanks);
  const defendingWarriors = Math.max(0, gameState.ants.warrior - deployedWarriors);
  const defendingScouts = Math.max(0, gameState.ants.scout - deployedScouts);

  const raidFaction = gameState.nextRaidFaction || 'fire_ants';

  const outcome = resolveCombat({
    allies: {
      tank: defendingTanks,
      warrior: defendingWarriors,
      scout: defendingScouts,
      barricadeLvl: (gameState.rooms && gameState.rooms.barricade) || 0
    },
    enemy: {
      id: 'enemy_raid',
      nameKey: 'enemy.raiders.name',
      power: raidStrength,
      faction: raidFaction,
      lootPhero: raidCfg.victoryPheroReward
    },
    doctrine: gameState.squad.doctrine || 'balanced',
    modifiers: mods
  });

  // Enregistrement du rapport unifié
  gameState.lastBattleReport = {
    source: 'raid',
    targetKey: 'enemy.raiders.name',
    faction: raidFaction,
    isBoss: false,
    ...outcome
  };

  if (outcome.breakdown.barricadeAbsorption > 0) {
    logMessageKey('log.raid_barricade', { abs: outcome.breakdown.barricadeAbsorption });
    if (typeof globalThis.spawnCanvasFloatingText === 'function') {
      globalThis.spawnCanvasFloatingText('barricade', `-${outcome.breakdown.barricadeAbsorption} 🛡️`, '#63b3ed');
    }
  }

  if (outcome.counterApplied) {
    if (outcome.counterApplied === 'tank') logMessageKey('log.combat_counter_tank', {}, 'combat');
    else if (outcome.counterApplied === 'warrior_acid') logMessageKey('log.combat_counter_warrior', {}, 'combat');
    else if (outcome.counterApplied === 'scout') logMessageKey('log.combat_counter_scout', {}, 'combat');
  }

  // Déclenchement de la secousse d'écran (Screen Shake) lors de l'impact
  const interactionCfg = GAME_CONFIG.CANVAS_INTERACTION || {};
  if (typeof globalThis.triggerScreenShake === 'function') {
    globalThis.triggerScreenShake(
      interactionCfg.screenShakeIntensity || 5.5,
      interactionCfg.screenShakeDuration || 18
    );
  }

  if (typeof globalThis.triggerRaidVisuals === 'function') {
    globalThis.triggerRaidVisuals(outcome.victory);
  }

  if (outcome.victory) {
    if (!gameState.stats) gameState.stats = {};
    gameState.stats.totalRaidsDefeated = (gameState.stats.totalRaidsDefeated || 0) + 1;
    playSfx('victory');
    logMessageKey('log.raid_win', {}, 'loot');
    gameState.pheromone = Math.round((gameState.pheromone + raidCfg.victoryPheroReward) * 10) / 10;
    gameState.stats.totalPheromonesEarned = (gameState.stats.totalPheromonesEarned || 0) + raidCfg.victoryPheroReward;
    checkAndAwardAchievements();
    if (typeof globalThis.spawnCanvasFloatingText === 'function') {
      const targetNode = gameState.rooms.barricade > 0 ? 'barricade' : 'queen';
      globalThis.spawnCanvasFloatingText(targetNode, `+${raidCfg.victoryPheroReward} 🧪`, '#b794f4');
    }
  } else {
    playSfx('raid');
    const foodStolen = Math.min(gameState.food, raidCfg.minFoodStolen + Math.floor(Math.random() * raidCfg.randomFoodStolen));
    gameState.food -= foodStolen;

    if (typeof globalThis.spawnCanvasFloatingText === 'function') {
      globalThis.spawnCanvasFloatingText('queen', `-${Math.floor(foodStolen)} 🍃`, '#e53e3e');
    }

    if (gameState.ants.warrior > 0) {
      gameState.ants.warrior--;
      gameState.squad.warrior = Math.min(gameState.squad.warrior, gameState.ants.warrior);
    }
    logMessageKey('log.raid_loss', { food: Math.floor(foodStolen) }, 'combat');
  }

  // Recyclage de biomasse en compostage fongique (Lot 5)
  if (outcome.compost && (outcome.compost.sporesGained > 0 || outcome.compost.chitinGained > 0)) {
    gameState.spores = Math.round(((gameState.spores || 0) + outcome.compost.sporesGained) * 10) / 10;
    gameState.chitin = Math.round(((gameState.chitin || 0) + outcome.compost.chitinGained) * 10) / 10;
    if (gameState.resources) {
      gameState.resources.spores = gameState.spores;
  gameState.resources.amber = gameState.amber || (gameState.resources && gameState.resources.amber) || 0;
  gameState.amber = gameState.resources.amber;
      gameState.resources.chitin = gameState.chitin;
    }
    logMessageKey('log.compost_gains', {
      spores: outcome.compost.sporesGained,
      chitin: outcome.compost.chitinGained
    }, 'loot');
  }
}

// --- SYSTÈME D'ÉVÉNEMENTS À CHOIX (LOT 4) ---
function handleEventSystem() {
  const eventsCfg = GAME_CONFIG.EVENTS;
  if (!eventsCfg) return;

  if (gameState.activeEvent) {
    gameState.activeEvent.timeLeft--;
    if (gameState.activeEvent.timeLeft <= 0) {
      const res = resolveEventChoice(gameState, gameState.activeEvent.id, 'choice_a');
      logMessageKey('log.event_resolved', { outcome: t(res.outcomeKey, res.params) });
      gameState.activeEvent = null;
      gameState.nextEventTimer = eventsCfg.minIntervalSeconds + Math.floor(Math.random() * eventsCfg.randomIntervalSeconds);
    }
  } else {
    gameState.nextEventTimer--;
    if (gameState.nextEventTimer <= 0) {
      const registry = eventsCfg.registry || {};
      const eligible = Object.values(registry).filter(e => !e.minDay || gameState.day >= e.minDay);
      if (eligible.length > 0) {
        const picked = eligible[Math.floor(Math.random() * eligible.length)];
        gameState.activeEvent = {
          id: picked.id,
          timeLeft: eventsCfg.eventDurationSeconds || 30
        };
        logMessageKey('log.event_trigger', { title: t(picked.titleKey) }, 'birth');
        playSfx('click');
      }
      gameState.nextEventTimer = eventsCfg.minIntervalSeconds + Math.floor(Math.random() * eventsCfg.randomIntervalSeconds);
    }
  }
}

// --- SYSTÈME D'ÉVOLUTION, MUTATIONS, HAUTS FAITS & VOL NUPTIAL (LOT 6) ---
function researchMutation(mutKey) {
  const check = canUnlockMutation(mutKey, gameState, GAME_CONFIG);
  if (!check.canUnlock) {
    if (check.reason === 'ALREADY_UNLOCKED') {
      logMessageKey('log.mut_already');
    } else if (check.reason === 'MISSING_PREREQUISITE') {
      logMessageKey('log.mut_requires', { req: t(`mut.${check.requiresKey}.name`) });
    } else if (check.reason === 'INSUFFICIENT_PHEROMONE') {
      logMessageKey('log.no_phero', { cost: check.cost });
    }
    return;
  }

  const res = unlockMutationPure(mutKey, gameState, GAME_CONFIG);
  if (res.success) {
    gameState.pheromone = res.nextState.pheromone;
    gameState.mutations = res.nextState.mutations;
    if (!gameState.stats) gameState.stats = {};
    gameState.stats.totalMutationsUnlocked = res.nextState.stats.totalMutationsUnlocked;

    playSfx('upgrade');
    logMessageKey('log.mut_unlocked', { upperNameKey: `mut.${mutKey}.name` }, 'loot');
    checkAndAwardAchievements();
    saveGame();
    updateUI();
  }
}
globalThis.researchMutation = researchMutation;

function checkAndAwardAchievements() {
  const res = evaluateAchievements(gameState, GAME_CONFIG);
  if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
    if (!gameState.achievements) gameState.achievements = {};
    res.newlyUnlocked.forEach(ach => {
      gameState.achievements[ach.id] = true;
      const r = Math.max(0, Number(ach.rewardPhero) || 0);
      if (r > 0) {
        gameState.pheromone = Math.round((gameState.pheromone + r) * 10) / 10;
        if (!gameState.stats) gameState.stats = {};
        gameState.stats.totalPheromonesEarned = (gameState.stats.totalPheromonesEarned || 0) + r;
      }
      logMessageKey('log.ach_unlocked', { name: t(ach.nameKey), reward: r }, 'loot');
    });
    playSfx('victory');
  }
}
globalThis.checkAndAwardAchievements = checkAndAwardAchievements;

const triggerNuptialFlight = () => (gameUI.triggerNuptialFlight || globalThis.triggerNuptialFlight || (() => {}))();
const closeNuptialFlightModal = () => (gameUI.closeNuptialFlightModal || globalThis.closeNuptialFlightModal || (() => {}))();
const confirmNuptialFlight = () => (gameUI.confirmNuptialFlight || globalThis.confirmNuptialFlight || (() => {}))();

globalThis.triggerNuptialFlight = triggerNuptialFlight;
globalThis.closeNuptialFlightModal = closeNuptialFlightModal;
globalThis.confirmNuptialFlight = confirmNuptialFlight;

// --- JOURNAL D'ÉVÉNEMENTS & SYNCHRONISATION UI (Délégués à game-ui.js) ---
const logMessageKey = (k, p, type) => (gameUI.logMessageKey || globalThis.logMessageKey || (() => {}))(k, p, type);
const updateUI = () => (gameUI.updateUI || globalThis.updateUI || (() => {}))();
const updateSquadUI = () => (gameUI.updateSquadUI || globalThis.updateSquadUI || (() => {}))();
const updateIncubationQueueUI = () => (gameUI.updateIncubationQueueUI || globalThis.updateIncubationQueueUI || (() => {}))();
const updateExpeditionsUI = (s) => (gameUI.updateExpeditionsUI || globalThis.updateExpeditionsUI || (() => {}))(s);
const updateEventCardUI = () => (gameUI.updateEventCardUI || globalThis.updateEventCardUI || (() => {}))();
const handleChooseEvent = (i) => (gameUI.handleChooseEvent || globalThis.handleChooseEvent || (() => {}))(i);
const updateBattleReportUI = () => (gameUI.updateBattleReportUI || globalThis.updateBattleReportUI || (() => {}))();
const updateEvolutionUI = () => (gameUI.updateEvolutionUI || globalThis.updateEvolutionUI || (() => {}))();

globalThis.logMessageKey = logMessageKey;
globalThis.updateUI = updateUI;
globalThis.updateSquadUI = updateSquadUI;
globalThis.updateIncubationQueueUI = updateIncubationQueueUI;
globalThis.updateExpeditionsUI = updateExpeditionsUI;
globalThis.updateEventCardUI = updateEventCardUI;
globalThis.handleChooseEvent = handleChooseEvent;
globalThis.updateBattleReportUI = updateBattleReportUI;
globalThis.updateEvolutionUI = updateEvolutionUI;

/* c8 ignore next 3 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    playSfx,
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
    switchTab,
    selectRoomInUI,
    initSpeedControls,
    getCurrentSeasonConfig,
    getTotalPop,
    getReservedPop,
    getPopCap,
    getNetFoodPerSec,
    getPheromoneGainPerSec,
    getIncubationSpeedMultiplier,
    computeModifiers,
    resolveCombat,
    calculateSquadPower,
    resolveEventChoice,
    handleEventSystem,
    gameTick,
    incubateAnt,
    upgradeRoom,
    harvestSurfaceDeposit,
    adjustSquad,
    setDoctrine,
    launchExpedition,
    recallExpedition,
    resolveExpedition,
    handleRaidSystem,
    triggerEnemyRaid,
    researchMutation,
    canUnlockMutation,
    unlockMutationPure,
    evaluateAchievements,
    canTriggerNuptialFlight,
    computeRoyalDnaGain,
    getNuptialFlightPreview,
    executeNuptialFlightPure,
    triggerNuptialFlight,
    closeNuptialFlightModal,
    confirmNuptialFlight,
    checkAndAwardAchievements,
    logMessageKey,
    updateUI,
    updateSquadUI,
    updateIncubationQueueUI,
    updateExpeditionsUI,
    updateEventCardUI,
    handleChooseEvent,
    updateBattleReportUI,
    updateEvolutionUI,
    formatLargeNumber: gameUI.formatLargeNumber || globalThis.formatLargeNumber,
    getEconomyBreakdown: gameUI.getEconomyBreakdown || globalThis.getEconomyBreakdown,
    getNextMilestoneGoal: gameUI.getNextMilestoneGoal || globalThis.getNextMilestoneGoal,
    computeTargetEta: gameUI.computeTargetEta || globalThis.computeTargetEta,
    computeTabBadges: gameUI.computeTabBadges || globalThis.computeTabBadges,
    switchSubtab: gameUI.switchSubtab || globalThis.switchSubtab,
    setIncubationMultiplier: gameUI.setIncubationMultiplier || globalThis.setIncubationMultiplier,
    openSaveModal,
    closeSaveModal,
    handleExportSaveUI,
    handleImportSaveUI,
    showOfflineModal,
    closeOfflineModal,
    assignWorkerRoleUI,
    boostConstructionWithHoneyUI,
    setDomeVentilationUI,
    setQueenDietUI,
    computeSymbiosisHarmony,
    computeConstructionTime,
    getMaxActiveConstructions,
    getRoomMilestoneBonuses,
    computeAllRoomMilestones,
    assignWorkerRole,
    getWorkerRoles,
    boostConstructionWithHoney,
    setDomeVentilation,
    setQueenDiet,
    recycleCombatBiomass,
    startRoomConstruction,
    tickConstructions
  };
}
