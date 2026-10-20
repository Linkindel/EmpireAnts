/**
 * Empire Fourmi - Moteur d'Économie Symbiotique, Chantiers Bornés & Biologie (symbiosis.js)
 * Lot 5 : Métiers d'ouvrières, Chambre des Bâtisseuses, Chantiers Réels Bornés (T <= 2h),
 * Paliers d'Ères Architecturales, Compostage Fongique, Thermorégulation & Trophallaxie Royale.
 *
 * Module pur et déterministe (zéro accès direct au DOM, compatible Node.js et Navigateur).
 */

(function (root) {
  'use strict';

  /* c8 ignore next 6 */
  const GAME_CONFIG = root.GAME_CONFIG || (typeof require === 'function' ? (function () {
    try { return require('./config.js').GAME_CONFIG; } catch (e) { return {}; }
  })() : {});

  /**
   * Calcule la durée d'un chantier de salle selon une formule asymptotique bornée à 2h (7200s).
   * T(lvl) = T_base + (T_max - T_base) * (1 - e^(-k * lvl))
   * Réduit par le niveau de la Chambre des Bâtisseuses (-12%/niveau),
   * par les Maçonnes assignées (+10%/tranche de 5, max +150%),
   * et divisé par 2 si le boost Miellat est actif.
   * Plancher de sécurité : minConstructionSeconds (5s).
   */
  function computeConstructionTime(roomKey, targetLevel, state, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const roomsCfg = (config && config.ROOMS) || (GAME_CONFIG && GAME_CONFIG.ROOMS) || {};
    const lvl = Math.max(1, Number(targetLevel) || 1);

    const baseSec = cfg.constructionBaseSeconds !== undefined ? cfg.constructionBaseSeconds : 30;
    const maxSec = cfg.constructionMaxSeconds !== undefined ? cfg.constructionMaxSeconds : 7200;
    const k = cfg.constructionAsymptoticK !== undefined ? cfg.constructionAsymptoticK : 0.05;
    const minSec = cfg.minConstructionSeconds !== undefined ? cfg.minConstructionSeconds : 5;

    // Durée asymptotique brute bornée
    const rawTime = baseSec + (maxSec - baseSec) * (1 - Math.exp(-k * (lvl - 1)));

    // Réduction par le niveau de la Chambre des Bâtisseuses
    const masonryLvl = (state && state.rooms && Number(state.rooms.masonry_hall)) || 0;
    const hallCfg = roomsCfg.masonry_hall || {};
    const delayReduc = hallCfg.delayReductionPerLevel !== undefined ? hallCfg.delayReductionPerLevel : 0.12;
    const hallFactor = Math.pow(Math.max(0.1, 1 - delayReduc), masonryLvl);

    // Multiplicateur de vitesse des maçonnes et coup de collier au miellat
    const speedMult = computeActiveConstructionSpeed(state, config);

    const finalTime = (rawTime * hallFactor) / Math.max(0.1, speedMult);
    return Math.max(minSec, Math.round(finalTime));
  }

  /**
   * Calcule le multiplicateur de vitesse de creusement actif.
   * Bonus Maçonnes (+10% / tranche de 5, cap +150%) * Boost Miellat (x2 si actif).
   */
  function computeActiveConstructionSpeed(state, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const stepSize = cfg.masonStepSize || 5;
    const stepBonus = cfg.masonSpeedBonusPerStep || 0.10;
    const maxBonus = cfg.maxMasonSpeedBonus || 1.50;

    const masonsCount = (state && state.workerRoles && Number(state.workerRoles.mason)) || 0;
    const steps = Math.floor(masonsCount / stepSize);
    const masonMult = 1 + Math.min(maxBonus, steps * stepBonus);

    const isHoneyBoosted = Boolean(state && Number(state.honeyBoostTimer) > 0);
    const honeyMult = isHoneyBoosted ? (cfg.honeyBoostSpeedMultiplier || 2.0) : 1.0;

    return masonMult * honeyMult;
  }

  /**
   * Évalue les limites de chantiers simultanés et de file d'attente selon le niveau de masonry_hall.
   */
  function getConstructionLimits(state, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const hallLvl = (state && state.rooms && Number(state.rooms.masonry_hall)) || 0;
    const limits = cfg.simultaneousBuildLimits || [
      { minHallLevel: 0, maxActive: 1, maxQueued: 1 },
      { minHallLevel: 1, maxActive: 1, maxQueued: 2 },
      { minHallLevel: 3, maxActive: 2, maxQueued: 4 },
      { minHallLevel: 5, maxActive: 3, maxQueued: Infinity }
    ];

    let current = limits[0];
    for (let i = 0; i < limits.length; i++) {
      if (hallLvl >= limits[i].minHallLevel) {
        current = limits[i];
      }
    }
    return {
      maxActive: current.maxActive,
      maxQueued: current.maxQueued
    };
  }

  /**
   * Évalue l'Harmonie Symbiotique entre les 3 métiers spécialisés et les nourrices.
   * Retourne un score de 0 à 1, ainsi que les bonus d'incubation et organique associés.
   */
  function computeSymbiosisHarmony(state, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    if (!state || !state.workerRoles) {
      return { harmonyScore: 0, incubationBonus: 0, organicBonus: 0 };
    }

    const harv = Number(state.workerRoles.harvester) || 0;
    const breed = Number(state.workerRoles.breeder) || 0;
    const grow = Number(state.workerRoles.grower) || 0;
    const mas = Number(state.workerRoles.mason) || 0;
    const nurse = (state.ants && Number(state.ants.nurse)) || 0;

    const totalSpecialized = breed + grow + mas + nurse;
    if (totalSpecialized === 0) {
      return { harmonyScore: 0, incubationBonus: 0, organicBonus: 0 };
    }

    // Mesure d'équilibre par entropie/dispersion entre les rôles actifs
    const roles = [breed, grow, mas, nurse].filter(c => c > 0);
    const diversityRatio = roles.length / 4; // jusqu'à 1 si les 4 métiers sont occupés

    // Indice d'équilibre : min / max parmi les métiers actifs
    const minRole = Math.min(...roles);
    const maxRole = Math.max(...roles);
    const balanceRatio = maxRole > 0 ? (minRole / maxRole) : 0;

    const harmonyScore = Math.min(1, (diversityRatio * 0.6) + (balanceRatio * 0.4));
    const maxIncubation = cfg.harmonyMaxIncubationBonus || 0.25;
    const maxOrganic = cfg.harmonyMaxOrganicBonus || 0.20;

    return {
      harmonyScore: Number(harmonyScore.toFixed(3)),
      harmonyRatio: Number(harmonyScore.toFixed(3)),
      incubationBonus: Number((harmonyScore * maxIncubation).toFixed(3)),
      organicBonus: Number((harmonyScore * maxOrganic).toFixed(3)),
      organicProductionBonus: Number((harmonyScore * maxOrganic).toFixed(3))
    };
  }

  /**
   * Calcule la production par seconde issue des ouvrières selon leurs métiers.
   */
  function computeWorkerRoleProduction(state, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const roles = (state && state.workerRoles) || {};

    const harvesters = Number(roles.harvester) || 0;
    const breeders = Number(roles.breeder) || 0;
    const growers = Number(roles.grower) || 0;
    const masons = Number(roles.mason) || 0;

    const harmony = computeSymbiosisHarmony(state, config);
    const organicMult = 1 + harmony.organicBonus;

    // Production de nourriture par les récolteuses (modulée par saisons/mutations si state fourni)
    const baseWorkerFood = (config && config.CASTES && config.CASTES.worker && config.CASTES.worker.foodProduction) || 0.35;
    const foodProd = harvesters * baseWorkerFood;

    // Miellat par les éleveuses
    const baseHoneydew = cfg.breederHoneydewProd || 0.08;
    const honeydewProd = breeders * baseHoneydew * organicMult;

    // Spores par les cultivatrices
    const baseSpores = cfg.growerSporesProd || 0.05;
    const sporesProd = growers * baseSpores * organicMult;

    // Brindilles et Chitine par les maçonnes
    const baseTwigs = cfg.masonTwigsProd || 0.10;
    const twigsProd = masons * baseTwigs;

    const baseChitin = cfg.masonChitinProd || 0.02;
    const chitinProd = masons * baseChitin;

    return {
      food: foodProd,
      honeydew: honeydewProd,
      spores: sporesProd,
      twigs: twigsProd,
      chitin: chitinProd
    };
  }

  /**
   * Recycle la biomasse d'un combat en Spores et Chitine (Compostage Fongique).
   */
  function recycleCombatBiomass(losses, enemyPower, config) {
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const antLosses = (losses && losses.ants) || {};
    const totalLostAnts = (Number(antLosses.worker) || 0) + (Number(antLosses.scout) || 0) +
                          (Number(antLosses.warrior) || 0) + (Number(antLosses.tank) || 0) +
                          (Number(antLosses.nurse) || 0);

    const compostLossSpores = cfg.compostLossSpores || 1.5;
    const compostLossChitin = cfg.compostLossChitin || 0.8;
    const enemySporesRatio = cfg.compostEnemyPowerSporesRatio || 0.15;
    const enemyChitinRatio = cfg.compostEnemyPowerChitinRatio || 0.10;

    const sporesFromLosses = totalLostAnts * compostLossSpores;
    const chitinFromLosses = totalLostAnts * compostLossChitin;

    const pwr = Math.max(0, Number(enemyPower) || 0);
    const sporesFromEnemies = pwr * enemySporesRatio;
    const chitinFromEnemies = pwr * enemyChitinRatio;

    return {
      spores: Math.round((sporesFromLosses + sporesFromEnemies) * 10) / 10,
      chitin: Math.round((chitinFromLosses + chitinFromEnemies) * 10) / 10
    };
  }

  /**
   * Évalue les bonus majeurs des Ères Architecturales (Paliers 10, 25, 50, 100, 250, 500+).
   */
  function evaluateRoomMilestoneBonuses(rooms, config) {
    const milestones = (config && config.ROOM_MILESTONES) || (GAME_CONFIG && GAME_CONFIG.ROOM_MILESTONES) || [];
    const r = rooms || {};

    let totalMilestonesUnlocked = 0;
    let totalUpkeepReduction = 0;
    let totalEfficiencyBonus = 0;
    let relicSlots = 0;
    let passiveAmberPerHour = 0;

    Object.keys(r).forEach(roomKey => {
      const lvl = Number(r[roomKey]) || 0;
      milestones.forEach(m => {
        if (lvl >= m.level) {
          totalMilestonesUnlocked++;
          if (m.upkeepReduction) totalUpkeepReduction += m.upkeepReduction;
          if (m.efficiencyBonus) totalEfficiencyBonus += m.efficiencyBonus;
          if (m.relicSlotUnlocked) relicSlots++;
          if (m.passiveAmberPerHour) passiveAmberPerHour += m.passiveAmberPerHour;
        }
      });
    });

    return {
      unlockedCount: totalMilestonesUnlocked,
      upkeepReduction: Math.min(0.75, totalUpkeepReduction),
      maxUpkeepReduction: Math.min(0.75, totalUpkeepReduction),
      efficiencyBonus: totalEfficiencyBonus,
      relicSlots,
      passiveAmberPerHour,
      totalPassiveAmberPerHour: passiveAmberPerHour,
      roomBonuses: {}
    };
  }

  /**
   * Réassigne de manière pure et sécurisée le rôle d'un groupe d'ouvrières.
   */
  function assignWorkerRolePure(currentRoles, totalWorkers, targetRole, delta) {
    const validRoles = ['harvester', 'breeder', 'grower', 'mason'];
    if (!validRoles.includes(targetRole)) return null;

    const roles = {
      harvester: Math.max(0, Number(currentRoles && currentRoles.harvester) || 0),
      breeder: Math.max(0, Number(currentRoles && currentRoles.breeder) || 0),
      grower: Math.max(0, Number(currentRoles && currentRoles.grower) || 0),
      mason: Math.max(0, Number(currentRoles && currentRoles.mason) || 0)
    };

    const maxW = Math.max(0, Number(totalWorkers) || 0);
    const assignedTotal = roles.harvester + roles.breeder + roles.grower + roles.mason;

    if (delta > 0) {
      // Trouver les ouvrières disponibles depuis les récolteuses (harvester) ou non assignées
      const unassigned = Math.max(0, maxW - assignedTotal);
      let toAdd = delta;

      if (unassigned >= toAdd) {
        roles[targetRole] += toAdd;
        return roles;
      }

      // Prendre le reliquat sur les récolteuses si targetRole !== 'harvester'
      roles[targetRole] += unassigned;
      toAdd -= unassigned;

      if (targetRole !== 'harvester' && roles.harvester > 0) {
        const take = Math.min(toAdd, roles.harvester);
        roles.harvester -= take;
        roles[targetRole] += take;
      }
    } else if (delta < 0) {
      const toRemove = Math.min(roles[targetRole], Math.abs(delta));
      roles[targetRole] -= toRemove;
      if (targetRole !== 'harvester') {
        roles.harvester += toRemove; // retour par défaut aux récolteuses
      }
    }

    return roles;
  }

  /**
   * Fait avancer les chantiers en temps réel (purement).
   */
  function tickConstructionsPure(activeConstructions, buildQueue, dt, state, config) {
    const active = Array.isArray(activeConstructions) ? [...activeConstructions] : [];
    const queued = Array.isArray(buildQueue) ? [...buildQueue] : [];
    const completed = [];

    const speedMult = computeActiveConstructionSpeed(state, config);
    const effectiveDt = dt * speedMult;

    // Décrémenter les chantiers actifs
    for (let i = active.length - 1; i >= 0; i--) {
      const c = { ...active[i] };
      c.remainingSeconds = Math.max(0, c.remainingSeconds - effectiveDt);
      if (c.remainingSeconds <= 0) {
        completed.push(c);
        active.splice(i, 1);
      } else {
        active[i] = c;
      }
    }

    // Promouvoir les chantiers en attente vers les emplacements libres
    const limits = getConstructionLimits(state, config);
    while (active.length < limits.maxActive && queued.length > 0) {
      const nextBuild = queued.shift();
      const targetLvl = nextBuild.targetLevel;
      const duration = computeConstructionTime(nextBuild.roomKey, targetLvl, state, config);
      active.push({
        roomKey: nextBuild.roomKey,
        targetLevel: targetLvl,
        remainingSeconds: duration,
        totalSeconds: duration
      });
    }

    return {
      activeConstructions: active,
      buildQueue: queued,
      completed
    };
  }

  /**
   * Fait avancer les chantiers dans gameState et applique les montées de niveau terminées.
   */
  function tickConstructions(state, dt, config) {
    if (!state) return [];
    if (!Array.isArray(state.activeConstructions)) state.activeConstructions = [];
    if (!Array.isArray(state.buildQueue)) state.buildQueue = [];

    const res = tickConstructionsPure(state.activeConstructions, state.buildQueue, dt, state, config);
    state.activeConstructions = res.activeConstructions;
    state.buildQueue = res.buildQueue;

    const roomsCfg = (config && config.ROOMS) || (GAME_CONFIG && GAME_CONFIG.ROOMS) || {};
    res.completed.forEach(job => {
      if (!state.rooms) state.rooms = {};
      state.rooms[job.roomKey] = job.targetLevel;
      if (job.roomKey === 'granary') {
        const granaryCfg = roomsCfg.granary || {};
        const storagePerLvl = granaryCfg.storagePerLevel || 60;
        state.maxFood = (state.maxFood || 180) + storagePerLvl;
      }
    });

    return res.completed;
  }

  /**
   * Démarre la construction ou mise en file d'attente d'une salle.
   */
  function startRoomConstruction(roomKey, state, config) {
    if (!state) return { success: false, reason: 'INVALID_STATE' };
    const roomsCfg = (config && config.ROOMS) || (GAME_CONFIG && GAME_CONFIG.ROOMS) || {};
    const roomCfg = roomsCfg[roomKey];
    if (!roomCfg) return { success: false, reason: 'UNKNOWN_ROOM' };

    if (!state.rooms) state.rooms = {};
    if (!Array.isArray(state.activeConstructions)) state.activeConstructions = [];
    if (!Array.isArray(state.buildQueue)) state.buildQueue = [];

    // Vérifier si cette salle est déjà en cours de chantier
    const isAlreadyActive = state.activeConstructions.some(c => c.roomKey === roomKey);
    const isAlreadyQueued = state.buildQueue.some(c => c.roomKey === roomKey);
    if (isAlreadyActive || isAlreadyQueued) {
      return { success: false, reason: 'ALREADY_UNDER_CONSTRUCTION' };
    }

    const currentLvl = Number(state.rooms[roomKey]) || 0;
    const targetLevel = currentLvl + 1;
    const cost = typeof roomCfg.cost === 'function' ? roomCfg.cost(currentLvl) : (roomCfg.baseCost || 50);

    const currentFood = state.food !== undefined ? state.food : ((state.resources && state.resources.food) || 0);
    if (currentFood < cost) {
      return { success: false, reason: 'INSUFFICIENT_FOOD', cost };
    }

    const limits = getConstructionLimits(state, config);
    if (state.activeConstructions.length >= limits.maxActive && state.buildQueue.length >= limits.maxQueued) {
      return { success: false, reason: 'QUEUE_FULL' };
    }

    // Déduction des ressources
    state.food -= cost;
    if (state.resources) state.resources.food = state.food;

    const duration = computeConstructionTime(roomKey, targetLevel, state, config);
    const job = {
      roomKey,
      targetLevel,
      remainingSeconds: duration,
      totalSeconds: duration,
      totalTime: duration
    };

    if (state.activeConstructions.length < limits.maxActive) {
      state.activeConstructions.push(job);
    } else {
      state.buildQueue.push(job);
    }

    return {
      success: true,
      construction: job
    };
  }

  /**
   * Action d'assignation de rôle aux ouvrières.
   */
  function assignWorkerRole(role, delta, state) {
    if (!state || !state.ants) return { success: false, reason: 'INVALID_STATE' };
    const totalWorkers = Number(state.ants.worker) || 0;
    const newRoles = assignWorkerRolePure(state.workerRoles, totalWorkers, role, delta);
    if (!newRoles) return { success: false, reason: 'INVALID_ROLE' };

    state.workerRoles = newRoles;
    return { success: true, workerRoles: newRoles };
  }

  /**
   * Coup de collier au Miellat (Trophallaxis d'Urgence).
   */
  function boostConstructionWithHoney(state, config) {
    if (!state) return { success: false, reason: 'INVALID_STATE' };
    const cfg = (config && config.SYMBIOSIS) || (GAME_CONFIG && GAME_CONFIG.SYMBIOSIS) || {};
    const honeyCost = cfg.honeyBoostCost || 20;

    const currentHoney = state.honeydew !== undefined ? state.honeydew : ((state.resources && state.resources.honeydew) || 0);
    if (currentHoney < honeyCost) {
      return { success: false, reason: 'INSUFFICIENT_HONEYDEW', cost: honeyCost };
    }

    state.honeydew = Math.round((currentHoney - honeyCost) * 100) / 100;
    if (state.resources) state.resources.honeydew = state.honeydew;
    state.honeyBoostTimer = cfg.honeyBoostDurationSeconds || 300;

    return { success: true, duration: state.honeyBoostTimer };
  }

  function setDomeVentilation(mode, state) {
    if (!state) return;
    state.domeVentilation = mode === 'sealed' ? 'sealed' : 'open';
  }

  function setQueenDiet(diet, state) {
    if (!state) return;
    state.queenDiet = diet === 'royal_jelly' ? 'royal_jelly' : 'standard';
  }

  function getWorkerRoles(state) {
    if (!state || !state.workerRoles) {
      return { harvester: 6, breeder: 0, grower: 0, mason: 0 };
    }
    return state.workerRoles;
  }

  function getMaxActiveConstructions(state, config) {
    return getConstructionLimits(state, config).maxActive;
  }

  function getRoomMilestoneBonuses(roomKey, level, config) {
    const milestones = (config && config.ROOM_MILESTONES) || (GAME_CONFIG && GAME_CONFIG.ROOM_MILESTONES) || [];
    const lvl = Number(level) || 0;
    return milestones.filter(m => lvl >= m.level);
  }

  function computeAllRoomMilestones(rooms, config) {
    return evaluateRoomMilestoneBonuses(rooms, config);
  }

  // API publique
  const API = {
    computeConstructionTime,
    computeActiveConstructionSpeed,
    getConstructionLimits,
    computeSymbiosisHarmony,
    computeWorkerRoleProduction,
    recycleCombatBiomass,
    evaluateRoomMilestoneBonuses,
    assignWorkerRolePure,
    tickConstructionsPure,
    tickConstructions,
    startRoomConstruction,
    assignWorkerRole,
    boostConstructionWithHoney,
    setDomeVentilation,
    setQueenDiet,
    getWorkerRoles,
    getMaxActiveConstructions,
    getRoomMilestoneBonuses,
    computeAllRoomMilestones
  };

  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
