/**
 * Empire Fourmi - Moteur de Combat Unifié, Agrégateur de Modificateurs & Événements à Choix (Lot 4)
 * Architecture Senior SOLID : fonctions pures déterministes, aucune dépendance DOM.
 * Consomme exclusivement les tokens définis dans config.js (GAME_CONFIG).
 */

(function (root) {
  'use strict';

  /* c8 ignore next 14 */
  const GAME_CONFIG = root.GAME_CONFIG || (typeof require === 'function' ? (function () {
    try {
      const cfgModule = require('./config.js');
      return cfgModule.GAME_CONFIG || cfgModule;
    } catch (e) {
      return {};
    }
  })() : {});

  const symbiosisEngine = (typeof require === 'function')
    ? (function () {
        try {
          return require('./symbiosis.js');
        } catch (e) {
          return root;
        }
      })()
    : root;

  const gameWorldEngine = (typeof require === 'function')
    ? (function () {
        try {
          return require('./game-world.js');
        } catch (e) {
          return root;
        }
      })()
    : root;

/**
 * Résolution pure de la saison active sans dépendance externe.
 */
function getSeasonConfigPure(state, config = GAME_CONFIG) {
  const sCfg = (config && config.SEASONS) || (GAME_CONFIG && GAME_CONFIG.SEASONS);
  if (!sCfg) {
    return { id: 'summer', lootMultiplier: 1.0, raidStrengthMultiplier: 1.0, workerFoodMultiplier: 1.0, incubationSpeedMultiplier: 1.0 };
  }
  const safeDay = Math.max(1, (state && state.day) || 1);
  const daysPerSeason = sCfg.daysPerSeason || 2;
  const order = sCfg.order || ['spring', 'summer', 'autumn', 'winter'];
  const index = Math.floor((safeDay - 1) / daysPerSeason) % order.length;
  const seasonKey = order[index] || 'summer';
  return sCfg[seasonKey] || sCfg.summer;
}

/**
 * Agrégateur unique de multiplicateurs et bonus de la colonie (Lot 4).
 * Fonction pure et extensible pour tous les lots ultérieurs.
 *
 * @param {Object} [state] État de jeu (gameState ou snapshot)
 * @param {Object} [config=GAME_CONFIG] Configuration centrale
 * @returns {Object} Objet agrégé des modificateurs
 */
function computeModifiers(state, config = GAME_CONFIG) {
  const s = state || (typeof globalThis.gameState !== 'undefined' ? globalThis.gameState : (config.INITIAL_STATE || {}));
  const season = getSeasonConfigPure(s, config);
  const muts = (s && s.mutations) || {};
  const castes = (config && config.CASTES) || {};
  const ants = (s && s.ants) || {};
  const nurseCount = Math.max(0, ants.nurse || 0);
  const nurseCfg = castes.nurse || {};

  // Bonus caste nourrice
  const maxNurseIncBonus = nurseCfg.maxIncubationBonus !== undefined ? nurseCfg.maxIncubationBonus : 0.60;
  const nurseIncBonus = Math.min(
    maxNurseIncBonus,
    nurseCount * (nurseCfg.incubationBonusPerNurse || 0.03)
  );
  const nurseQueenHeal = nurseCount * (nurseCfg.queenHealBonusPerNurse || 0.04);
  const maxNurseFungus = nurseCfg.maxFungusBonus !== undefined ? nurseCfg.maxFungusBonus : 1.00;
  const nurseFungusBonus = Math.min(
    maxNurseFungus,
    nurseCount * (nurseCfg.fungusBonusPerNurse || 0.05)
  );

  // Bonus dynastique permanent d'ADN Royal (Lot 6 - Prestige 1)
  const prestigeCfg = (config && config.PRESTIGE && config.PRESTIGE.nuptialFlight) || {};
  const bonusPerDna = prestigeCfg.bonusPerDna !== undefined ? prestigeCfg.bonusPerDna : 0.05;
  const royalDnaCount = Math.max(0, (s && Number(s.royalDna)) || 0);
  const royalDnaMultiplier = 1 + (royalDnaCount * bonusPerDna);

  // Mutations génétiques (Arbre à 3 branches - Lot 6)
  const mandibulesMultiplier = muts.mandibules
    ? ((config.MUTATIONS && config.MUTATIONS.mandibules && config.MUTATIONS.mandibules.powerMultiplier) || 1.30)
    : 1.0;
  const royalExoMultiplier = muts.royal_exo ? 1.20 : 1.0;
  const trophallaxisMultiplier = muts.trophallaxis ? 1.20 : 1.0;
  const mycologyMultiplier = muts.mycology ? 1.35 : 1.0;
  const antennaeMultiplier = muts.antennae ? 1.30 : 1.0;
  const thermalBroodMultiplier = muts.thermal_brood ? 1.25 : 1.0;
  const granaryCapacityMultiplier = muts.preservation ? 1.25 : 1.0;
  const winterMitigation = muts.preservation ? 0.50 : 0.0;
  const queenHpBonus = muts.royal_exo ? 50 : 0;
  const autoSpawnCostMultiplier = muts.imperial_fervor ? 0.50 : 1.0;
  const autoSpawnBonusChance = muts.imperial_fervor ? 0.05 : 0.0;

  const acidUnlocked = Boolean(muts.acide);
  const carapaceUnlocked = Boolean(muts.carapace);

  // Économie Symbiotique & Lot 5 (Harmonie, Paliers, Thermorégulation)
  const harmony = (typeof symbiosisEngine.computeSymbiosisHarmony === 'function')
    ? symbiosisEngine.computeSymbiosisHarmony(s, config)
    : ((typeof globalThis.computeSymbiosisHarmony === 'function')
      ? globalThis.computeSymbiosisHarmony(s, config)
      : { harmonyRatio: 0, incubationBonus: 0, organicProductionBonus: 0 });

  const milestones = (typeof symbiosisEngine.computeAllRoomMilestones === 'function')
    ? symbiosisEngine.computeAllRoomMilestones(s.rooms, config)
    : ((typeof globalThis.computeAllRoomMilestones === 'function')
      ? globalThis.computeAllRoomMilestones(s.rooms, config)
      : { maxUpkeepReduction: 0, totalPassiveAmberPerHour: 0, roomBonuses: {} });

  // Thermorégulation du dôme
  const ventilation = s.domeVentilation || 'open';
  let ventWorkerFoodMult = 1.0;
  let ventIncubationMult = 1.0;
  if (season && season.id === 'winter' && ventilation === 'sealed') {
    ventWorkerFoodMult = 1.25; // Atténuation du gel hivernal
    ventIncubationMult = 1.15;
  } else if (season && season.id === 'summer' && ventilation === 'open') {
    ventWorkerFoodMult = 1.10; // Aération estivale
    ventIncubationMult = 1.15;
  }

  // Renfort structurel de la Barricade par la Chambre des Bâtisseuses
  const masonryLvl = Math.max(0, (s.rooms && Number(s.rooms.masonry_hall)) || 0);
  const masonryHallDefBonus = masonryLvl * ((config.ROOMS && config.ROOMS.masonry_hall && config.ROOMS.masonry_hall.barricadeReinforcePerLevel) || 15);

  // Reliques Ancestrales, Chaleur Géothermique & Ponts Vivants (Lot 7)
  const relicMods = (typeof gameWorldEngine.computeRelicModifiers === 'function')
    ? gameWorldEngine.computeRelicModifiers(s, config)
    : ((typeof globalThis.computeRelicModifiers === 'function')
      ? globalThis.computeRelicModifiers(s, config)
      : {
          queenHpBonus: 0,
          queenHealBonus: 0,
          militaryPowerMultiplier: 1.0,
          fungusMultiplier: 1.0,
          compostYieldBonus: 0,
          incubationSpeedMultiplier: 1.0,
          winterWorkerFoodBonus: 0,
          geothermalMitigation: 0,
          livingBridgeActive: false,
          livingBridgeHarvestBonus: 0
        });

  // Combinaison des multiplicateurs
  const relicPowerMult = relicMods.militaryPowerMultiplier || 1.0;
  const finalDamageMultiplier = mandibulesMultiplier * royalExoMultiplier * royalDnaMultiplier * relicPowerMult;
  const baseSeasonWorkerFood = (season && season.workerFoodMultiplier) || 1.0;
  // Si preservation ou chaleur géothermique est active et qu'on est en hiver (workerFoodMultiplier < 1), mitigation
  const totalWinterMitigation = Math.min(0.90, (winterMitigation > 0 ? winterMitigation : 0) + (relicMods.geothermalMitigation || 0));
  const effectiveSeasonWorkerFood = (totalWinterMitigation > 0 && baseSeasonWorkerFood < 1.0)
    ? 1.0 - ((1.0 - baseSeasonWorkerFood) * (1.0 - totalWinterMitigation))
    : baseSeasonWorkerFood;
  const winterRelicBonus = (season && season.id === 'winter' && relicMods.winterWorkerFoodBonus) ? relicMods.winterWorkerFoodBonus : 0;
  const orgBonus = (harmony && (harmony.organicProductionBonus || harmony.organicBonus)) || 0;
  const bridgeBonus = relicMods.livingBridgeHarvestBonus || 0;
  const finalWorkerFoodMultiplier = (effectiveSeasonWorkerFood + winterRelicBonus) * trophallaxisMultiplier * royalDnaMultiplier * (1 + orgBonus) * ventWorkerFoodMult * (1 + bridgeBonus);

  return {
    damageMultiplier: finalDamageMultiplier,
    lootMultiplier: (season && season.lootMultiplier) || 1.0,
    raidStrengthMultiplier: (season && season.raidStrengthMultiplier) || 1.0,
    workerFoodMultiplier: finalWorkerFoodMultiplier,
    seasonIncubationMultiplier: (season && season.incubationSpeedMultiplier) || 1.0,
    incubationSpeedMultiplier: ((season && season.incubationSpeedMultiplier) || 1.0) * (1 + nurseIncBonus) * (1 + harmony.incubationBonus) * thermalBroodMultiplier * royalDnaMultiplier * ventIncubationMult * (relicMods.incubationSpeedMultiplier || 1.0),
    nurseIncubationBonus: nurseIncBonus,
    harmonyIncubationBonus: harmony.incubationBonus,
    harmonyOrganicBonus: harmony.organicProductionBonus,
    harmonyRatio: harmony.harmonyRatio,
    upkeepReduction: milestones.maxUpkeepReduction,
    passiveAmberPerHour: milestones.totalPassiveAmberPerHour,
    masonryHallDefBonus,
    queenHealRateBonus: nurseQueenHeal + (relicMods.queenHealBonus || 0),
    fungusProductionMultiplier: (1 + nurseFungusBonus) * mycologyMultiplier * (relicMods.fungusMultiplier || 1.0),
    pheromoneMultiplier: antennaeMultiplier,
    granaryCapacityMultiplier,
    winterMitigation: totalWinterMitigation,
    queenHpBonus: queenHpBonus + (relicMods.queenHpBonus || 0),
    autoSpawnCostMultiplier,
    autoSpawnBonusChance,
    royalDnaMultiplier,
    royalDnaCount,
    royalDnaBonusPercent: royalDnaCount * bonusPerDna,
    relicDamageMultiplier: relicPowerMult,
    relicQueenHpBonus: relicMods.queenHpBonus || 0,
    relicFungusMultiplier: relicMods.fungusMultiplier || 1.0,
    geothermalMitigation: relicMods.geothermalMitigation || 0,
    livingBridgeActive: relicMods.livingBridgeActive || false,
    livingBridgeHarvestBonus: bridgeBonus,
    acidUnlocked,
    carapaceUnlocked,
    mandibulesUnlocked: Boolean(muts.mandibules),
    royalExoUnlocked: Boolean(muts.royal_exo),
    nurseCount
  };
}

/**
 * Moteur de Combat Unifié (Lot 4).
 * Fonction pure et déterministe résolvant tout affrontement (raids, missions, boss, gardiens).
 *
 * @param {Object} params
 * @param {Object} [params.allies={}] Composition alliée { tank, warrior, scout, nurse?, barricadeLvl? }
 * @param {Object} [params.enemy={}] Données ennemies { id, nameKey?, power?, difficulty?, faction?, isBoss?, trophyKey?, lootFood?, lootPhero?, bonusWorkers? }
 * @param {string} [params.doctrine='balanced'] Doctrine tactique ('balanced'|'turtle'|'rush'|'acid')
 * @param {Object} [params.modifiers] Sortie de computeModifiers
 * @param {Function} [params.rng=Math.random] Générateur pseudo-aléatoire injectable
 * @param {Object} [params.config=GAME_CONFIG] Configuration centrale
 * @returns {Object} Résultat du combat { victory, alliedPower, enemyPower, counterApplied, counterDescKey, breakdown, losses, loot }
 */
function resolveCombat({
  allies = {},
  enemy = {},
  doctrine = 'balanced',
  modifiers = null,
  rng = Math.random,
  config = GAME_CONFIG
} = {}) {
  const castes = (config && config.CASTES) || {};
  const muts = (config && config.MUTATIONS) || {};
  const doctrines = (config && config.DOCTRINES) || {};
  const docConfig = doctrines[doctrine] || doctrines.balanced || { powerMultiplier: 1.0, warriorLossChance: 0.6, tankLossChance: 0.4 };
  const mods = modifiers || computeModifiers(undefined, config);

  const tanks = Math.max(0, allies.tank || 0);
  const warriors = Math.max(0, allies.warrior || 0);
  const scouts = Math.max(0, allies.scout || 0);
  const barricadeLvl = Math.max(0, allies.barricadeLvl || 0);

  // 1. Calcul de base de la force alliée
  const tankAtk = (castes.tank && castes.tank.attackPower) || 28;
  const warriorAtk = (castes.warrior && castes.warrior.attackPower) || 36;
  const scoutAtk = (castes.scout && castes.scout.attackPower) || 14;

  const basePower = (tanks * tankAtk) + (warriors * warriorAtk) + (scouts * scoutAtk);

  // 2. Bonus de mutations
  let mutationBonus = 0;
  if (mods.carapaceUnlocked && muts.carapace) {
    mutationBonus += tanks * (muts.carapace.tankPowerBonus || 15);
  }
  if (mods.acidUnlocked && muts.acide) {
    mutationBonus += warriors * (muts.acide.warriorPowerBonus || 12);
  }
  let powerAfterMutations = basePower + mutationBonus;
  if (mods.damageMultiplier > 1.0) {
    const mandibulesGain = (powerAfterMutations * mods.damageMultiplier) - powerAfterMutations;
    mutationBonus += mandibulesGain;
    powerAfterMutations += mandibulesGain;
  }

  // 3. Bonus de doctrine
  let powerAfterDoctrine = powerAfterMutations * (docConfig.powerMultiplier || 1.0);
  if (docConfig.warriorBonusPerUnit) {
    powerAfterDoctrine += warriors * docConfig.warriorBonusPerUnit;
  }
  // Aléas des Abîmes (Lot 7) : Ténèbres sans éclaireuses
  if (enemy && enemy.hazard && enemy.hazard.id === 'abyssal_darkness' && scouts === 0) {
    powerAfterDoctrine *= 0.80; // -20% malus d'obscurité
  }
  const doctrineBonus = powerAfterDoctrine - powerAfterMutations;

  // 4. Barricade d'entrée (défense statique pour les combats au nid renforcée par la Chambre des Bâtisseuses)
  let barricadeAbsorption = 0;
  if (barricadeLvl > 0 && config.ROOMS && config.ROOMS.barricade) {
    const baseDef = barricadeLvl * (config.ROOMS.barricade.defensePerLevel || 25);
    const hallBonus = Number(mods.masonryHallDefBonus) || 0;
    barricadeAbsorption = baseDef + hallBonus;
  }

  // 5. Puissance ennemie brute
  const rawEnemyPower = Math.max(0, enemy.power !== undefined ? enemy.power : (enemy.difficulty !== undefined ? enemy.difficulty : 50));

  // 6. Contres Tactiques de Faction (Lot 4)
  let counterBonus = 0;
  let counterApplied = null;
  let counterDescKey = null;
  const enemyFaction = enemy.faction || null;

  if (enemyFaction === 'fire_ants') {
    // Les Fourmis de Feu ont une attaque brutale, contrée par les Tanks
    if (tanks > 0) {
      counterApplied = 'tank';
      counterDescKey = 'faction.fire_ants.counter';
      const tankDef = (castes.tank && castes.tank.defensePower) || 35;
      counterBonus += tanks * tankDef * 0.35;
    }
  } else if (enemyFaction === 'termites') {
    // Les Termites Blindés ont une armure lourde, contrée par l'Acide des Guerrières
    const hasAcid = doctrine === 'acid' || mods.acidUnlocked;
    if (hasAcid && warriors > 0) {
      counterApplied = 'warrior_acid';
      counterDescKey = 'faction.termites.counter';
      counterBonus += warriors * warriorAtk * 0.50;
    }
  } else if (enemyFaction === 'wasps') {
    // Les Guêpes Chasseuses attaquent par surprise et grande vitesse, contrées par les Éclaireuses
    if (scouts > 0) {
      counterApplied = 'scout';
      counterDescKey = 'faction.wasps.counter';
      counterBonus += scouts * scoutAtk * 0.70;
    }
  }

  // Puissance totale alliée
  const alliedPower = Math.round(powerAfterDoctrine + counterBonus + barricadeAbsorption);
  const enemyPower = Math.round(rawEnemyPower);

  // Victoire
  const victory = alliedPower >= enemyPower;

  // 7. Calcul des pertes alliées
  const losses = { tank: 0, warrior: 0, scout: 0 };
  const powerRatio = enemyPower / Math.max(1, alliedPower);

  if (!victory) {
    // Défaite : pertes substantielles selon la doctrine
    if (warriors > 0 && rng() < Math.min(1.0, (docConfig.warriorLossChance || 0.6) * Math.max(0.6, powerRatio))) {
      losses.warrior = Math.min(warriors, Math.max(1, Math.floor(warriors * 0.5)));
    }
    if (tanks > 0 && rng() < Math.min(1.0, (docConfig.tankLossChance || 0.4) * Math.max(0.5, powerRatio))) {
      losses.tank = Math.min(tanks, Math.max(1, Math.floor(tanks * 0.35)));
    }
    if (scouts > 0 && rng() < 0.45) {
      losses.scout = Math.min(scouts, 1);
    }
  } else {
    // Victoire : pertes nulles si écrasante (>1.35x), légères si victoire disputée
    if (alliedPower < enemyPower * 1.35) {
      if (warriors > 0 && rng() < (docConfig.warriorLossChance || 0.6) * 0.30) {
        losses.warrior = 1;
      }
      if (tanks > 0 && rng() < (docConfig.tankLossChance || 0.4) * 0.20) {
        losses.tank = 1;
      }
    }
  }

  // 8. Calcul du butin & Compostage Fongique (Lot 5) & Ambre (Lot 7)
  const loot = {
    food: 0,
    phero: 0,
    amber: 0,
    bonusWorkers: 0,
    trophy: null
  };

  if (victory) {
    const lootMult = mods.lootMultiplier || 1.0;
    loot.food = Math.round((enemy.lootFood || (enemy.loot && enemy.loot.food) || 0) * lootMult);
    loot.phero = Math.round((enemy.lootPhero || (enemy.loot && enemy.loot.phero) || 0) * lootMult);
    loot.amber = Math.round((enemy.lootAmber || (enemy.loot && enemy.loot.amber) || 0));
    loot.bonusWorkers = enemy.bonusWorkers || (enemy.loot && enemy.loot.bonusWorkers) || 0;
    if (enemy.isBoss && enemy.trophyKey) {
      loot.trophy = enemy.trophyKey;
    }
  }

  // Recyclage de biomasse en Spores et Chitine
  const recycleFn = (symbiosisEngine && symbiosisEngine.recycleCombatBiomass) || globalThis.recycleCombatBiomass;
  const compost = (typeof recycleFn === 'function')
    ? recycleFn(losses, victory ? enemy : null, null, config)
    : { sporesGained: 0, chitinGained: 0, growerBonus: 1.0 };

  return {
    victory,
    alliedPower,
    enemyPower,
    counterApplied,
    counterDescKey,
    breakdown: {
      basePower: Math.round(basePower),
      doctrineBonus: Math.round(doctrineBonus),
      mutationBonus: Math.round(mutationBonus),
      counterBonus: Math.round(counterBonus),
      barricadeAbsorption: Math.round(barricadeAbsorption)
    },
    losses,
    loot,
    compost
  };
}

/**
 * Résolution pure d'un choix d'événement aléatoire (Lot 4).
 *
 * @param {Object} state État de la colonie (gameState)
 * @param {string} eventId Clé de l'événement dans GAME_CONFIG.EVENTS.registry
 * @param {string} [choiceId='choice_a'] Identifiant du choix ('choice_a' | 'choice_b' ou id du choix)
 * @param {Function} [rng=Math.random] Générateur pseudo-aléatoire injectable
 * @param {Object} [config=GAME_CONFIG] Configuration centrale
 * @returns {Object} Résultat { success, outcomeKey, params, workersLost }
 */
function resolveEventChoice(state, eventId, choiceId = 'choice_a', rng = Math.random, config = GAME_CONFIG) {
  const s = state || (typeof globalThis.gameState !== 'undefined' ? globalThis.gameState : {});
  const eventsCfg = config && config.EVENTS && config.EVENTS.registry;
  const evt = eventsCfg && eventsCfg[eventId];
  if (!evt) return { success: false, reason: 'event_not_found' };

  let choice = null;
  if (choiceId === 'choice_a' || (evt.choices && evt.choices[0] && choiceId === evt.choices[0].id)) {
    choice = evt.choices[0];
  } else if (choiceId === 'choice_b' || (evt.choices && evt.choices[1] && choiceId === evt.choices[1].id)) {
    choice = evt.choices[1];
  } else {
    choice = evt.choices ? evt.choices[0] : null;
  }

  const effect = (choice && choice.effect) || {};
  const params = {
    food: effect.foodGain || 0,
    phero: effect.pheroGain || 0,
    scouts: effect.bonusScouts || 0
  };

  let workersLost = 0;
  if (effect.riskLossWorkerChance && s.ants && s.ants.worker > 0 && rng() < effect.riskLossWorkerChance) {
    workersLost = 1;
    s.ants.worker = Math.max(0, s.ants.worker - 1);
  }

  const maxFood = (typeof s.maxFood === 'number') ? s.maxFood : 1000;
  if (effect.foodGain) {
    s.food = Math.min(maxFood, (s.food || 0) + effect.foodGain);
  }
  if (effect.foodCost) {
    s.food = Math.max(0, (s.food || 0) - effect.foodCost);
    params.food = effect.foodCost;
  }
  if (effect.pheroGain) {
    s.pheromone = Math.round(((s.pheromone || 0) + effect.pheroGain) * 10) / 10;
  }
  if (effect.bonusScouts) {
    if (!s.ants) s.ants = {};
    const dormLvl = (s.rooms && typeof s.rooms.dorm === 'number') ? s.rooms.dorm : 1;
    const baseCap = (config.ECONOMY && config.ECONOMY.basePopCap) || 15;
    const dormBonus = (config.ROOMS && config.ROOMS.dorm && config.ROOMS.dorm.popCapPerLevel) || 10;
    const popCap = baseCap + (dormLvl * dormBonus);
    const totalPop = (s.ants.worker || 0) + (s.ants.scout || 0) + (s.ants.warrior || 0) + (s.ants.tank || 0) + (s.ants.nurse || 0);
    const room = Math.max(0, popCap - totalPop);
    const addedScouts = Math.min(room, effect.bonusScouts);
    s.ants.scout = (s.ants.scout || 0) + addedScouts;
    params.scouts = addedScouts;
  }

  s.activeEvent = null;

  return {
    success: true,
    outcomeKey: choice.outcomeKey,
    params,
    workersLost
  };
}

  // Exports universels (Navigateur & Node.js)
  const API = {
    getSeasonConfigPure,
    computeModifiers,
    resolveCombat,
    resolveEventChoice
  };

  Object.assign(root, API);
  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
