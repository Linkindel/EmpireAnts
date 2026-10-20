/**
 * Empire Fourmi - Moteur d'Évolution, Arbre Génétique, Hauts Faits & Vol Nuptial (Lot 6)
 * Standards d'Architecture Senior SOLID : fonctions pures déterministes, zéro dette, zéro dépendance DOM.
 * Compatible Navigateur (<script>) et Node.js (require/module.exports).
 */

(function (root) {
  'use strict';

  // Récupération sécurisée de GAME_CONFIG
  const GAME_CONFIG = root.GAME_CONFIG || (typeof require === 'function' ? require('./config.js').GAME_CONFIG : null);

  /**
   * Calcul pur de la population totale d'une colonie (adultes vivants).
   */
  function getTotalAnts(state) {
    if (!state || !state.ants || typeof state.ants !== 'object') return 0;
    const a = state.ants;
    return (
      Math.max(0, Number(a.worker) || 0) +
      Math.max(0, Number(a.scout) || 0) +
      Math.max(0, Number(a.warrior) || 0) +
      Math.max(0, Number(a.tank) || 0) +
      Math.max(0, Number(a.nurse) || 0)
    );
  }

  /**
   * Somme pure des niveaux de salles souterraines.
   */
  function getTotalRoomLevels(state) {
    if (!state || !state.rooms || typeof state.rooms !== 'object') return 0;
    return Object.values(state.rooms).reduce(function (sum, lvl) {
      return sum + Math.max(0, Number(lvl) || 0);
    }, 0);
  }

  /**
   * Formateur compact et lisible pour les nombres et statistiques.
   */
  function formatNumberCompact(val) {
    if (typeof val !== 'number' || !Number.isFinite(val)) return '0';
    if (val < 0) return '-' + formatNumberCompact(-val);
    if (val < 1000) {
      return Number.isInteger(val) ? String(val) : val.toFixed(1);
    }
    const units = ['K', 'M', 'B', 'T', 'Qa'];
    let idx = -1;
    let n = val;
    while (n >= 1000 && idx < units.length - 1) {
      n /= 1000;
      idx++;
    }
    return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + units[idx];
  }

  /**
   * Vérifie purement si une mutation génétique peut être recherchée.
   *
   * @param {string} mutationKey Clé de la mutation
   * @param {Object} state État de jeu courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} { canUnlock: boolean, reason: string, cost: number, requiresKey: string|null }
   */
  function canUnlockMutation(mutationKey, state, config = GAME_CONFIG) {
    const mutsCfg = (config && config.MUTATIONS) || {};
    const mut = mutsCfg[mutationKey];
    if (!mut) {
      return { canUnlock: false, reason: 'INVALID_MUTATION', cost: 0, requiresKey: null };
    }

    const stateMuts = (state && state.mutations) || {};
    if (Boolean(stateMuts[mutationKey])) {
      return { canUnlock: false, reason: 'ALREADY_UNLOCKED', cost: mut.cost || 0, requiresKey: mut.requires || null };
    }

    // Vérification du prérequis d'arbre
    if (mut.requires && !Boolean(stateMuts[mut.requires])) {
      return { canUnlock: false, reason: 'MISSING_PREREQUISITE', cost: mut.cost || 0, requiresKey: mut.requires };
    }

    // Vérification des phéromones
    const phero = Math.max(0, (state && Number(state.pheromone)) || 0);
    const cost = Math.max(0, Number(mut.cost) || 0);
    if (phero < cost) {
      return { canUnlock: false, reason: 'INSUFFICIENT_PHEROMONE', cost, requiresKey: mut.requires || null };
    }

    return { canUnlock: true, reason: 'OK', cost, requiresKey: mut.requires || null };
  }

  /**
   * Recherche pure d'une mutation (zéro effet de bord, retourne un nouvel état cloné).
   *
   * @param {string} mutationKey Clé de la mutation
   * @param {Object} state État de jeu courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} { success: boolean, nextState: Object, unlockedMutation: Object|null, reason?: string }
   */
  function unlockMutationPure(mutationKey, state, config = GAME_CONFIG) {
    const check = canUnlockMutation(mutationKey, state, config);
    if (!check.canUnlock) {
      return { success: false, nextState: state, unlockedMutation: null, reason: check.reason };
    }

    const mut = config.MUTATIONS[mutationKey];
    const nextState = JSON.parse(JSON.stringify(state));

    nextState.pheromone = Math.max(0, (Number(nextState.pheromone) || 0) - check.cost);
    if (!nextState.mutations || typeof nextState.mutations !== 'object') {
      nextState.mutations = {};
    }
    nextState.mutations[mutationKey] = true;

    // Mise à jour défensive des statistiques
    if (!nextState.stats || typeof nextState.stats !== 'object') {
      nextState.stats = {};
    }
    nextState.stats.totalMutationsUnlocked = Object.values(nextState.mutations).filter(Boolean).length;

    return {
      success: true,
      nextState,
      unlockedMutation: mut,
      reason: 'OK'
    };
  }

  /**
   * Évalue purement tous les hauts faits de la colonie.
   *
   * @param {Object} state État de jeu courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} { unlockedKeys: string[], newlyUnlocked: Object[], totalRewardsPheromone: number, progress: { count: number, total: number } }
   */
  function evaluateAchievements(state, config = GAME_CONFIG) {
    const achRegistry = (config && config.ACHIEVEMENTS) || {};
    const stateAchs = (state && state.achievements) || {};
    const unlockedKeys = [];
    const newlyUnlocked = [];
    let totalRewardsPheromone = 0;
    const allKeys = Object.keys(achRegistry);

    allKeys.forEach(function (key) {
      const ach = achRegistry[key];
      const isAlreadyUnlocked = Boolean(stateAchs[key]);

      if (isAlreadyUnlocked) {
        unlockedKeys.push(key);
      } else if (typeof ach.check === 'function' && ach.check(state, config)) {
        unlockedKeys.push(key);
        newlyUnlocked.push(ach);
        totalRewardsPheromone += Math.max(0, Number(ach.rewardPhero) || 0);
      }
    });

    return {
      unlockedKeys,
      newlyUnlocked,
      totalRewardsPheromone,
      progress: {
        count: unlockedKeys.length,
        total: allKeys.length
      }
    };
  }

  /**
   * Vérifie si la colonie remplit les conditions requises pour le Vol Nuptial.
   *
   * @param {Object} state État courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} { canTrigger: boolean, currentQueenLevel: number, minQueenLevel: number, currentPop: number, minPop: number }
   */
  function canTriggerNuptialFlight(state, config = GAME_CONFIG) {
    const prestigeCfg = (config && config.PRESTIGE && config.PRESTIGE.nuptialFlight) || {};
    const reqs = prestigeCfg.requirements || { minQueenRoomLevel: 5, minPopulation: 50 };

    const queenLevel = (state && state.rooms && Math.max(0, Number(state.rooms.queen) || 0)) || 0;
    const pop = getTotalAnts(state);

    const minQueenLevel = Math.max(1, Number(reqs.minQueenRoomLevel) || 5);
    const minPop = Math.max(1, Number(reqs.minPopulation) || 50);

    const canTrigger = queenLevel >= minQueenLevel && pop >= minPop;

    return {
      canTrigger,
      currentQueenLevel: queenLevel,
      minQueenLevel,
      currentPop: pop,
      minPop
    };
  }

  /**
   * Formule pure calculant le gain d'ADN Royal accordé par un Vol Nuptial.
   *
   * Formule :
   * - Population : 1 pt d'ADN par tranche de 10 fourmis
   * - Salles souterraines : 1 pt d'ADN par tranche de 3 niveaux cumulés
   * - Phéromones historiques : 1 pt d'ADN par tranche de 50 phéromones générées
   * - Boss vaincu (Mante) : +5 pts
   * - Hauts faits accomplis : +2 pts par haut fait
   *
   * @param {Object} state État de jeu courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {number} Points d'ADN Royal gagnés (entier ≥ 0)
   */
  function computeRoyalDnaGain(state, config = GAME_CONFIG) {
    const check = canTriggerNuptialFlight(state, config);
    if (!check.canTrigger) {
      return 0;
    }

    const pop = check.currentPop;
    const roomLevels = getTotalRoomLevels(state);
    const lifetimePhero = (state && state.stats && Math.max(0, Number(state.stats.totalPheromonesEarned) || 0)) ||
                          (state && Math.max(0, Number(state.pheromone) || 0)) || 0;

    const popPoints = Math.floor(pop / 10);
    const roomPoints = Math.floor(roomLevels / 3);
    const pheroPoints = Math.floor(lifetimePhero / 50);
    const bossPoints = (state && state.bossesDefeated && state.bossesDefeated.mantis) ? 5 : 0;
    const achPoints = (state && state.achievements) ? Object.keys(state.achievements).length * 2 : 0;

    const total = popPoints + roomPoints + pheroPoints + bossPoints + achPoints;
    return Math.max(1, Math.floor(total));
  }

  /**
   * Planificateur transparent de Vol Nuptial (Prestige 1).
   * Décompose les sources de gain d'ADN Royal et calcule le prochain palier rentable (Next Breakpoint).
   *
   * @param {Object} state État de jeu courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} Prévisualisation complète et décomposition du gain
   */
  function getNuptialFlightPreview(state, config = GAME_CONFIG) {
    const check = canTriggerNuptialFlight(state, config);
    const pop = check.currentPop;
    const roomLevels = getTotalRoomLevels(state);
    const lifetimePhero = (state && state.stats && Math.max(0, Number(state.stats.totalPheromonesEarned) || 0)) ||
                          (state && Math.max(0, Number(state.pheromone) || 0)) || 0;

    const popStep = 10;
    const roomStep = 3;
    const pheroStep = 50;

    const popPoints = Math.floor(pop / popStep);
    const roomPoints = Math.floor(roomLevels / roomStep);
    const pheroPoints = Math.floor(lifetimePhero / pheroStep);
    const bossPoints = (state && state.bossesDefeated && state.bossesDefeated.mantis) ? 5 : 0;
    const achCount = (state && state.achievements) ? Object.keys(state.achievements).length : 0;
    const achPoints = achCount * 2;

    const gainedDna = check.canTrigger
      ? Math.max(1, Math.floor(popPoints + roomPoints + pheroPoints + bossPoints + achPoints))
      : 0;

    const nextPopIn = popStep - (pop % popStep);
    const nextRoomIn = roomStep - (roomLevels % roomStep);
    const nextPheroIn = pheroStep - (Math.floor(lifetimePhero) % pheroStep);

    // Calcul du prochain palier le plus accessible
    let bestSource = 'population';
    let missingAmount = nextPopIn;

    if (nextRoomIn <= 1) {
      bestSource = 'rooms';
      missingAmount = nextRoomIn;
    } else if (nextPopIn <= 3) {
      bestSource = 'population';
      missingAmount = nextPopIn;
    } else if (nextRoomIn <= 2) {
      bestSource = 'rooms';
      missingAmount = nextRoomIn;
    }

    const bonusPerDna = (config && config.PRESTIGE && config.PRESTIGE.nuptialFlight && config.PRESTIGE.nuptialFlight.bonusPerDna) || 0.05;
    const currentRoyalDna = Math.max(0, (state && Number(state.royalDna)) || 0);
    const newTotalDna = currentRoyalDna + gainedDna;
    const currentBonusPercent = Math.round(currentRoyalDna * bonusPerDna * 100);
    const nextBonusPercent = Math.round(newTotalDna * bonusPerDna * 100);

    return {
      canTrigger: check.canTrigger,
      currentQueenLevel: check.currentQueenLevel,
      minQueenLevel: check.minQueenLevel,
      currentPop: check.currentPop,
      minPop: check.minPop,
      gainedDna,
      currentRoyalDna,
      newTotalDna,
      currentBonusPercent,
      nextBonusPercent,
      breakdown: {
        population: { points: popPoints, current: pop, step: popStep, nextIn: nextPopIn },
        rooms: { points: roomPoints, current: roomLevels, step: roomStep, nextIn: nextRoomIn },
        pheromones: { points: pheroPoints, current: Math.round(lifetimePhero * 10) / 10, step: pheroStep, nextIn: nextPheroIn },
        boss: { points: bossPoints, mantisDefeated: Boolean(bossPoints > 0) },
        achievements: { points: achPoints, count: achCount }
      },
      nextBreakpoint: {
        source: bestSource,
        missingAmount,
        nextPopIn,
        nextRoomIn,
        nextPheroIn
      }
    };
  }

  /**
   * Exécution pure du Vol Nuptial (Prestige 1).
   * Réinitialise le run tout en conservant la méta-progression (ADN Royal, stats, hauts faits).
   *
   * @param {Object} state État courant
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {Object} { success: boolean, nextState: Object, gainedDna: number, totalRoyalDna: number, reason?: string }
   */
  function executeNuptialFlightPure(state, config = GAME_CONFIG) {
    const check = canTriggerNuptialFlight(state, config);
    if (!check.canTrigger) {
      return {
        success: false,
        nextState: state,
        gainedDna: 0,
        totalRoyalDna: (state && Number(state.royalDna)) || 0,
        reason: 'REQUIREMENTS_NOT_MET'
      };
    }

    const gainedDna = computeRoyalDnaGain(state, config);
    const currentRoyalDna = Math.max(0, (state && Number(state.royalDna)) || 0);
    const totalRoyalDna = currentRoyalDna + gainedDna;

    // Préparation de l'état réinitialisé à partir de INITIAL_STATE
    const init = config.INITIAL_STATE || {};
    const nextState = JSON.parse(JSON.stringify(init));

    // Préservation des préférences utilisateur
    nextState.schemaVersion = config.SCHEMA_VERSION || 4;
    nextState.lang = (state && state.lang) || init.lang || 'fr';
    nextState.soundEnabled = state && typeof state.soundEnabled === 'boolean' ? state.soundEnabled : true;

    // Préservation de la méta-progression
    nextState.royalDna = totalRoyalDna;

    // Préservation de l'Ambre 🟠 et des Reliques Primordiales (Lot 7)
    const preservedAmber = Math.max(0, (state && state.resources && Number(state.resources.amber)) || (state && Number(state.amber)) || 0);
    if (!nextState.resources) nextState.resources = {};
    nextState.resources.amber = preservedAmber;
    nextState.amber = preservedAmber;

    const oldRelics = (state && state.exploration && state.exploration.relics && typeof state.exploration.relics === 'object')
      ? JSON.parse(JSON.stringify(state.exploration.relics))
      : { queen_amber: 0, fossil_mandible: 0, eternal_spore: 0, solar_sap: 0 };
    if (!nextState.exploration) nextState.exploration = {};
    nextState.exploration.relics = oldRelics;

    // Conservation intégrale des hauts faits
    nextState.achievements = state && state.achievements && typeof state.achievements === 'object'
      ? JSON.parse(JSON.stringify(state.achievements))
      : {};

    // Conservation et enrichissement des statistiques historiques
    const oldStats = (state && state.stats && typeof state.stats === 'object') ? state.stats : {};
    nextState.stats = {
      totalAntsHatched: Math.max(0, Number(oldStats.totalAntsHatched) || 0),
      totalRaidsDefeated: Math.max(0, Number(oldStats.totalRaidsDefeated) || 0),
      totalBossesDefeated: Math.max(0, Number(oldStats.totalBossesDefeated) || 0) + ((state && state.bossesDefeated && state.bossesDefeated.mantis) ? 1 : 0),
      totalDaysSurvived: Math.max(0, Number(oldStats.totalDaysSurvived) || 0) + Math.max(0, (state && Number(state.day)) || 1),
      totalFoodHarvested: Math.max(0, Number(oldStats.totalFoodHarvested) || 0),
      totalPheromonesEarned: Math.max(0, Number(oldStats.totalPheromonesEarned) || 0),
      totalMutationsUnlocked: Math.max(0, Number(oldStats.totalMutationsUnlocked) || 0),
      winterSurvived: Math.max(0, Number(oldStats.winterSurvived) || 0),
      highestPopReached: Math.max(getTotalAnts(state), Number(oldStats.highestPopReached) || 0),
      prestigesCount: Math.max(0, Number(oldStats.prestigesCount) || 0) + 1,
      totalRoyalDnaEarned: Math.max(0, Number(oldStats.totalRoyalDnaEarned) || 0) + gainedDna
    };

    // Attribution automatique du haut fait Fondateur de Dynastie
    if (config.ACHIEVEMENTS && config.ACHIEVEMENTS.dynasty_founder) {
      nextState.achievements.dynasty_founder = true;
    }

    return {
      success: true,
      nextState,
      gainedDna,
      totalRoyalDna,
      reason: 'OK'
    };
  }

  // API Publique du module Evolution
  const API = {
    getTotalAnts,
    getTotalRoomLevels,
    formatNumberCompact,
    canUnlockMutation,
    unlockMutationPure,
    evaluateAchievements,
    canTriggerNuptialFlight,
    computeRoyalDnaGain,
    getNuptialFlightPreview,
    executeNuptialFlightPure
  };

  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
