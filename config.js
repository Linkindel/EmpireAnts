/**
 * Empire Fourmi - Game Tokens, Configuration Centrale & Dictionnaire i18n (FR / EN)
 * Toutes les valeurs d'équilibrage, de coûts, de combats, de saisons, de thème Canvas et de traductions sont réunies ici.
 */

/* c8 ignore next 6 */
if (typeof GAME_CONFIG_I18N === 'undefined' && typeof require === 'function') {
  try {
    const i18nMod = require('./i18n.js');
    globalThis.GAME_CONFIG_I18N = i18nMod.GAME_CONFIG_I18N;
    if (i18nMod.t) globalThis.t = i18nMod.t;
  } catch (e) {}
}

const GAME_CONFIG = {
  SCHEMA_VERSION: 5,
  SAVE_KEY: 'ant_empire_save_v1',
  LANG_KEY: 'ant_empire_lang',

  // --- ÉTAT INITIAL ---
  INITIAL_STATE: {
    schemaVersion: 5,
    lastSavedAt: null,
    lang: 'fr',
    soundEnabled: true,
    ambienceEnabled: true,
    resources: {
      food: 120,
      pheromone: 20,
      twigs: 0,
      honeydew: 0,
      chitin: 0,
      spores: 0,
      amber: 0
    },
    food: 120,
    maxFood: 180,
    pheromone: 20,
    twigs: 0,
    honeydew: 0,
    chitin: 0,
    spores: 0,
    amber: 0,
    workerRoles: {
      harvester: 6,
      breeder: 0,
      grower: 0,
      mason: 0
    },
    activeConstructions: [],
    buildQueue: [],
    honeyBoostTimer: 0,
    domeVentilation: 'open',
    queenDiet: 'standard',
    incubationMultiplier: 1,
    activeTab: 'colony',
    activeSubtabs: {
      colony: 'nursery',
      army: 'squad',
      evolution: 'mutations',
      workshop: 'forge',
      world: 'trading'
    },
    queenHealth: 100,
    maxQueenHealth: 100,
    day: 1,
    timeSeconds: 0,
    speed: 1,
    ants: {
      worker: 6,
      scout: 2,
      warrior: 2,
      tank: 1,
      nurse: 0
    },
    rooms: {
      queen: 1,
      granary: 1,
      dorm: 1,
      barricade: 0,
      fungus: 0,
      aphid_farm: 0,
      masonry_hall: 0
    },
    squad: {
      tank: 0,
      warrior: 0,
      scout: 0,
      doctrine: 'balanced'
    },
    royalDna: 0,
    stats: {
      totalAntsHatched: 0,
      totalRaidsDefeated: 0,
      totalBossesDefeated: 0,
      totalDaysSurvived: 0,
      totalFoodHarvested: 0,
      totalPheromonesEarned: 0,
      totalMutationsUnlocked: 0,
      winterSurvived: 0,
      highestPopReached: 11,
      prestigesCount: 0,
      totalRoyalDnaEarned: 0
    },
    achievements: {},
    mutations: {
      mandibules: false,
      carapace: false,
      acide: false,
      royal_exo: false,
      trophallaxis: false,
      mycology: false,
      preservation: false,
      antennae: false,
      thermal_brood: false,
      imperial_fervor: false
    },
    nextRaidTimer: 140,
    nextRaidFaction: 'fire_ants',
    nextEventTimer: 75,
    activeEvent: null,
    lastBattleReport: null,
    bossesDefeated: {
      mantis: false
    },
    settings: {
      screenShakeEnabled: true,
      particleDensity: 'normal',
      numberNotation: 'standard'
    },
    pinnedTarget: null,
    exploration: {
      currentRing: 1,
      unlockedRing: 1,
      ringSectorsCleared: {},
      ringGuardiansDefeated: {},
      abyssDepth: 0,
      maxAbyssDepth: 0,
      abyssGuardiansDefeated: {},
      activeHazard: null,
      livingBridges: {
        surfaceHarvest: false,
        activeBridgeWorkers: 0
      },
      relics: {
        queen_amber: 0,
        fossil_mandible: 0,
        eternal_spore: 0,
        solar_sap: 0
      }
    }
  },

  // --- ÉCONOMIE & CYCLE TEMPOREL ---
  ECONOMY: {
    dayDurationSeconds: 60,
    basePopCap: 15,
    baseFoodConsumptionPerAnt: 0.08,
    basePheromoneGain: 0.2,
    starvationMinQueenHealth: 0,
    starvationQueenDamagePerSec: 1.5,
    starvationLogChance: 0.12,
    queenHealRatePerSec: 0.5,
    autoSpawnMinFood: 15,
    autoSpawnFoodCost: 5,
    autoSpawnBaseChance: 0.05,
    autoSpawnQueenRoomBonusChance: 0.03,
    queenIncubationSpeedPerLevel: 0.20,
    maxOfflineSeconds: 28800,
    minOfflineReportSeconds: 15,
    offlineEfficiencyRatio: 0.75
  },

  // --- REGISTRE DE RESSOURCES GÉNÉRIQUE (Lots 3 & 5 - Économie Symbiotique) ---
  RESOURCES: {
    food: {
      id: 'food',
      icon: '🍃',
      tier: 0,
      i18nKey: 'res.food',
      hasCap: true,
      hudVisible: true,
      unlockCondition: null
    },
    pheromone: {
      id: 'pheromone',
      icon: '🧪',
      tier: 0,
      i18nKey: 'res.phero',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    },
    twigs: {
      id: 'twigs',
      icon: '🌿',
      tier: 1,
      i18nKey: 'res.twigs',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    },
    honeydew: {
      id: 'honeydew',
      icon: '🍯',
      tier: 1,
      i18nKey: 'res.honeydew',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    },
    chitin: {
      id: 'chitin',
      icon: '🪲',
      tier: 3,
      i18nKey: 'res.chitin',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    },
    spores: {
      id: 'spores',
      icon: '✨',
      tier: 3,
      i18nKey: 'res.spores',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    },
    amber: {
      id: 'amber',
      icon: '🟠',
      tier: 2,
      i18nKey: 'res.amber',
      hasCap: false,
      hudVisible: true,
      unlockCondition: null
    }
  },

  // --- FORMAT DES NOMBRES & NOTATION (Lot 3 - Grands Nombres AAA+) ---
  NUMBER_FORMAT: {
    suffixes: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'],
    scientificThreshold: 1e36,
    maxDecimals: 2
  },

  // --- BOUSSOLE D'OBJECTIFS DYNAMIQUE & CAP IMPÉRIAL (Lot 3) ---
  MILESTONE_GOALS: {
    shortTerm: [
      { id: 'first_ants', type: 'ants_total', target: 15, i18nKey: 'goal.short.first_ants' },
      { id: 'upgrade_barricade', type: 'room_level', room: 'barricade', target: 2, i18nKey: 'goal.short.upgrade_barricade' },
      { id: 'upgrade_fungus', type: 'room_level', room: 'fungus', target: 1, i18nKey: 'goal.short.upgrade_fungus' },
      { id: 'army_squad', type: 'squad_strength', target: { warrior: 3, tank: 1 }, i18nKey: 'goal.short.army_squad' },
      { id: 'stockpile_food', type: 'resource', resource: 'food', target: 150, i18nKey: 'goal.short.stockpile_food' }
    ],
    majorMilestones: [
      { id: 'act1_boss', type: 'boss', bossId: 'mantis', target: 1, i18nKey: 'goal.major.act1_boss' },
      { id: 'pop_milestone_50', type: 'ants_total', target: 50, i18nKey: 'goal.major.pop_50' },
      { id: 'nuptial_flight', type: 'prestige', target: 1, i18nKey: 'goal.major.nuptial_flight' }
    ]
  },

  // --- NAVIGATION PAR PANNEAUX & SOUS-ONGLETS (Lot 3 - UI Extensible) ---
  UI_PANELS: {
    colony: {
      id: 'colony',
      icon: '🐜',
      i18nKey: 'tab.colony',
      parent: null,
      order: 1,
      unlockCondition: null
    },
    army: {
      id: 'army',
      icon: '⚔️',
      i18nKey: 'tab.army',
      parent: null,
      order: 2,
      unlockCondition: null
    },
    evolution: {
      id: 'evolution',
      icon: '🧬',
      i18nKey: 'tab.evolution',
      parent: null,
      order: 3,
      unlockCondition: null
    },
    workshop: {
      id: 'workshop',
      icon: '🛠️',
      i18nKey: 'tab.workshop',
      parent: null,
      order: 4,
      unlockCondition: function (state) {
        return Boolean(state && state.rooms && state.rooms.workshop > 0);
      }
    },
    world: {
      id: 'world',
      icon: '🌍',
      i18nKey: 'tab.world',
      parent: null,
      order: 5,
      unlockCondition: function (state) {
        return Boolean(state && state.worldUnlocked);
      }
    },
    log: {
      id: 'log',
      icon: '📜',
      i18nKey: 'tab.log',
      parent: null,
      order: 6,
      unlockCondition: null
    },

    // Sous-onglets (enfants)
    nursery: {
      id: 'nursery',
      icon: '🥚',
      i18nKey: 'subtab.nursery',
      parent: 'colony',
      order: 1,
      unlockCondition: null
    },
    rooms: {
      id: 'rooms',
      icon: '🏛️',
      i18nKey: 'subtab.rooms',
      parent: 'colony',
      order: 2,
      unlockCondition: null
    },
    jobs: {
      id: 'jobs',
      icon: '🌾',
      i18nKey: 'subtab.jobs',
      parent: 'colony',
      order: 3,
      unlockCondition: function (state) {
        return Boolean(state && state.jobsUnlocked);
      }
    },
    squad: {
      id: 'squad',
      icon: '🛡️',
      i18nKey: 'subtab.squad',
      parent: 'army',
      order: 1,
      unlockCondition: null
    },
    battle_report: {
      id: 'battle_report',
      icon: '📊',
      i18nKey: 'subtab.battle_report',
      parent: 'army',
      order: 2,
      unlockCondition: function (state) {
        return Boolean(state && state.lastBattleReport);
      }
    },
    exploration: {
      id: 'exploration',
      icon: '🗺️',
      i18nKey: 'subtab.exploration',
      parent: 'army',
      order: 3,
      unlockCondition: function (state) {
        return Boolean(state && (state.abyssUnlocked || state.exploration || state.day >= 1));
      }
    },
    mutations: {
      id: 'mutations',
      icon: '🧬',
      i18nKey: 'subtab.mutations',
      parent: 'evolution',
      order: 1,
      unlockCondition: null
    },
    achievements: {
      id: 'achievements',
      icon: '🏆',
      i18nKey: 'subtab.achievements',
      parent: 'evolution',
      order: 2,
      unlockCondition: function (state) {
        return Boolean(state && state.achievementsUnlocked);
      }
    },
    dynasty: {
      id: 'dynasty',
      icon: '👑',
      i18nKey: 'subtab.dynasty',
      parent: 'evolution',
      order: 3,
      unlockCondition: function (state) {
        return Boolean(state && state.dynastyUnlocked);
      }
    }
  },

  // --- RACCOURCIS CLAVIER (Lot 3 - Commandes Rapides) ---
  KEYBINDINGS: {
    pause: ' ',
    speed1: '1',
    speed2: '2',
    speed3: '3',
    tabColony: 'Alt+1',
    tabArmy: 'Alt+2',
    tabEvolution: 'Alt+3',
    tabWorkshop: 'Alt+4',
    tabWorld: 'Alt+5',
    tabLog: 'Alt+6'
  },

  // --- MOTEUR AUDIO PROCÉDURAL WEBAUDIO (Lot 3) ---
  AUDIO: {
    enabled: true,
    masterVolume: 0.15,
    pitchJitter: 0.04,
    sfx: {
      click:     { type: 'sine', startFreq: 520, endFreq: 680, duration: 0.06, volume: 0.06 },
      harvest:   { type: 'triangle', startFreq: 280, endFreq: 520, duration: 0.08, volume: 0.08 },
      hatch:     { type: 'triangle', startFreq: 440, endFreq: 880, duration: 0.14, volume: 0.08 },
      upgrade:   { type: 'chord', notes: [523.25, 659.25, 783.99], duration: 0.28, volume: 0.08 },
      raid_alert:{ type: 'sawtooth', startFreq: 180, endFreq: 130, duration: 0.35, volume: 0.10 },
      victory:   { type: 'fanfare', notes: [440, 554.37, 659.25, 880], duration: 0.40, volume: 0.09 },
      defeat:    { type: 'sawtooth', startFreq: 300, endFreq: 110, duration: 0.45, volume: 0.10 }
    },
    ambience: {
      enabled: true,
      volume: 0.04,
      filterFreq: 180,
      layers: {
        undergroundDrone: { type: 'brown_noise', filterFreq: 180, volume: 0.04 },
        summerStridulations: { season: 'summer', freq: 4200, pulseRate: 8, volume: 0.02 },
        winterWind: { season: 'winter', filterFreq: 320, volume: 0.03 },
        raidWarDrums: { triggerSec: 20, tempoBpm: 120, volume: 0.08 }
      }
    }
  },

  // --- INTERACTION CANVAS & GAME FEEL (LOT 2) ---
  CANVAS_INTERACTION: {
    nodeHitRadius: 28,
    manualHarvestFood: 5,
    manualHarvestCooldownSeconds: 3,
    haloColor: 'rgba(246, 173, 85, 0.45)',
    haloHoverRadiusExtra: 8,
    screenShakeDuration: 18,
    screenShakeIntensity: 5.5,
    floatingTextDuration: 75,
    floatingTextSpeed: 0.65,
    pheromonePulseSpeed: 0.0035,
    pheromoneDotSpacing: 14,
    tooltip: {
      bg: 'rgba(20, 16, 12, 0.92)',
      border: '#f6ad55',
      titleColor: '#ecc94b',
      textColor: '#e2e8f0',
      hintColor: '#a0aec0',
      fontSizeTitle: 12,
      fontSizeText: 10,
      width: 170,
      padding: 10
    }
  },

  // --- SYSTÈME DES 4 SAISONS ---
  SEASONS: {
    daysPerSeason: 2,
    order: ['spring', 'summer', 'autumn', 'winter'],
    spring: {
      id: 'spring',
      icon: '🌸',
      workerFoodMultiplier: 1.0,
      incubationSpeedMultiplier: 1.30,
      lootMultiplier: 1.0,
      raidStrengthMultiplier: 1.0,
      grassDay: '#38a169',
      grassNight: '#22543d',
      grassBladeColor: '#68d391',
      leafDepositColor: '#68d391'
    },
    summer: {
      id: 'summer',
      icon: '☀️',
      workerFoodMultiplier: 1.25,
      incubationSpeedMultiplier: 1.0,
      lootMultiplier: 1.15,
      raidStrengthMultiplier: 1.0,
      grassDay: '#2f855a',
      grassNight: '#1c4532',
      grassBladeColor: '#48bb78',
      leafDepositColor: '#48bb78'
    },
    autumn: {
      id: 'autumn',
      icon: '🍂',
      workerFoodMultiplier: 0.90,
      incubationSpeedMultiplier: 1.0,
      lootMultiplier: 1.30,
      raidStrengthMultiplier: 1.15,
      grassDay: '#9c4221',
      grassNight: '#652b19',
      grassBladeColor: '#dd6b20',
      leafDepositColor: '#ed8936'
    },
    winter: {
      id: 'winter',
      icon: '❄️',
      workerFoodMultiplier: 0.45,
      incubationSpeedMultiplier: 0.85,
      lootMultiplier: 0.90,
      raidStrengthMultiplier: 0.85,
      grassDay: '#cbd5e0',
      grassNight: '#718096',
      grassBladeColor: '#e2e8f0',
      leafDepositColor: '#90cdf4'
    }
  },

  // --- CASTES DE FOURMIS (PALETTE 3D CGI STYLE FILM FOURMIZ / ANTZ) ---
  CASTES: {
    worker: {
      id: 'worker',
      icon: '🌾',
      cost: 10,
      incubationSeconds: 4,
      foodProd: 0.55,
      extraUpkeep: 0,
      pheroProd: 0,
      attackPower: 0,
      defensePower: 0,
      hp: 40,
      scale: 1.0,
      moveSpeed: 1.15,
      canvasColor: '#a85826',
      headColor: '#824018',
      highlightColor: '#ed9b5a',
      stripeColor: '#4a210a',
      eyeColor: '#fef3c7',
      pupilColor: '#261005'
    },
    scout: {
      id: 'scout',
      icon: '⚡',
      cost: 15,
      incubationSeconds: 6,
      foodProd: 0,
      extraUpkeep: 0,
      pheroProd: 0.35,
      attackPower: 14,
      defensePower: 5,
      hp: 55,
      scale: 0.94,
      moveSpeed: 1.85,
      canvasColor: '#d69e2e',
      headColor: '#b7791f',
      highlightColor: '#fef08a',
      stripeColor: '#78350f',
      eyeColor: '#fffbeb',
      pupilColor: '#451a03'
    },
    warrior: {
      id: 'warrior',
      icon: '⚔️',
      cost: 25,
      incubationSeconds: 9,
      foodProd: 0,
      extraUpkeep: 0.06,
      pheroProd: 0,
      attackPower: 36,
      defensePower: 20,
      hp: 110,
      scale: 1.25,
      moveSpeed: 1.3,
      canvasColor: '#9b2c2c',
      headColor: '#742a2a',
      highlightColor: '#f6ad55',
      armorColor: '#b7791f',
      stripeColor: '#450a0a',
      eyeColor: '#fde68a',
      pupilColor: '#450a0a'
    },
    tank: {
      id: 'tank',
      icon: '🛡️',
      cost: 40,
      incubationSeconds: 13,
      foodProd: 0,
      extraUpkeep: 0.12,
      pheroProd: 0,
      attackPower: 28,
      defensePower: 35,
      hp: 220,
      scale: 1.55,
      moveSpeed: 0.85,
      canvasColor: '#63171b',
      headColor: '#9b2c2c',
      highlightColor: '#ed8936',
      armorColor: '#d69e2e',
      stripeColor: '#2d080a',
      eyeColor: '#fbd38d',
      pupilColor: '#1a202c'
    },
    nurse: {
      id: 'nurse',
      icon: '🍼',
      cost: 12,
      incubationSeconds: 5,
      foodProd: 0,
      extraUpkeep: 0,
      pheroProd: 0,
      attackPower: 0,
      defensePower: 8,
      hp: 45,
      scale: 1.05,
      moveSpeed: 1.1,
      canvasColor: '#d97706',
      headColor: '#b45309',
      highlightColor: '#fde68a',
      honeyGlow: 'rgba(251, 191, 36, 0.65)',
      stripeColor: '#78350f',
      eyeColor: '#fef3c7',
      pupilColor: '#451a03',
      incubationBonusPerNurse: 0.03, // +3% par nourrice
      maxIncubationBonus: 0.60,      // Max +60%
      queenHealBonusPerNurse: 0.04,  // +0.04 PV/s par nourrice
      fungusBonusPerNurse: 0.05,     // +5% prod champignonnière par nourrice
      maxFungusBonus: 1.00           // Max +100%
    }
  },

  // --- SALLES & INFRASTRUCTURES ---
  ROOMS: {
    queen: {
      id: 'queen',
      icon: '👑',
      baseCost: 50,
      costPerLevel: 35,
      bonusPerLevel: 20,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    granary: {
      id: 'granary',
      icon: '🏺',
      baseCost: 40,
      costPerLevel: 25,
      storagePerLevel: 60,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    dorm: {
      id: 'dorm',
      icon: '🛏️',
      baseCost: 60,
      costPerLevel: 40,
      popCapPerLevel: 10,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    barricade: {
      id: 'barricade',
      icon: '🧱',
      baseCost: 45,
      costPerLevel: 30,
      defensePerLevel: 25,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    fungus: {
      id: 'fungus',
      icon: '🍄',
      baseCost: 55,
      costPerLevel: 35,
      foodPerLevel: 1.2,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    aphid_farm: {
      id: 'aphid_farm',
      icon: '🌿',
      baseCost: 60,
      costPerLevel: 40,
      honeydewPerLevel: 0.15,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    masonry_hall: {
      id: 'masonry_hall',
      icon: '🏛️',
      baseCost: 70,
      costPerLevel: 45,
      delayReductionPerLevel: 0.12,
      barricadeReinforcePerLevel: 15,
      cost: function(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    }
  },

  // --- PALIERS D'ÈRES ARCHITECTURALES DES SALLES (Lot 5 - Niveaux 1 à Infini) ---
  ROOM_MILESTONES: [
    { level: 10, id: 'excavation', i18nKey: 'milestone.room.10', efficiencyBonus: 0.25 },
    { level: 25, id: 'chitin_pillars', i18nKey: 'milestone.room.25', upkeepReduction: 0.20 },
    { level: 50, id: 'flint_crypt', i18nKey: 'milestone.room.50', relicSlotUnlocked: true },
    { level: 100, id: 'abyssal_architecture', i18nKey: 'milestone.room.100', multiplier: 2.0 },
    { level: 250, id: 'crystal_sanctuary', i18nKey: 'milestone.room.250', passiveAmberPerHour: 1 },
    { level: 500, id: 'primordial_wonder', i18nKey: 'milestone.room.500', primordialWonder: true }
  ],

  // --- ÉCONOMIE SYMBIOTIQUE, CHANTIERS BORNÉS & BIOLOGIE (Lot 5) ---
  SYMBIOSIS: {
    // Chantiers Asymptotiques Bornés (T <= 2h)
    constructionBaseSeconds: 30,
    constructionMaxSeconds: 7200,
    constructionAsymptoticK: 0.05,
    minConstructionSeconds: 5,

    // File d'attente selon le niveau de masonry_hall
    simultaneousBuildLimits: [
      { minHallLevel: 0, maxActive: 1, maxQueued: 1 },
      { minHallLevel: 1, maxActive: 1, maxQueued: 2 },
      { minHallLevel: 3, maxActive: 2, maxQueued: 4 },
      { minHallLevel: 5, maxActive: 3, maxQueued: Infinity }
    ],

    // Métiers d'ouvrières
    masonSpeedBonusPerStep: 0.10,
    masonStepSize: 5,
    maxMasonSpeedBonus: 1.50,

    // Taux de production de base des métiers (par ouvrière et par seconde)
    breederHoneydewProd: 0.08,
    growerSporesProd: 0.05,
    masonTwigsProd: 0.10,
    masonChitinProd: 0.02,

    // Coup de collier au Miellat (Trophallaxis d'Urgence)
    honeyBoostCost: 20,
    honeyBoostDurationSeconds: 300,
    honeyBoostSpeedMultiplier: 2.0,

    // Trophallaxie Royale & Régime de la Reine
    royalJellyHoneydewUpkeepPerSec: 0.15,
    goldenEggChance: 0.15,

    // Harmonie Symbiotique (Éleveuses, Cultivatrices, Nourrices)
    harmonyMaxIncubationBonus: 0.25,
    harmonyMaxOrganicBonus: 0.20,

    // Compostage Fongique de combat
    compostLossSpores: 1.5,
    compostLossChitin: 0.8,
    compostEnemyPowerChitinRatio: 0.10,
    compostEnemyPowerSporesRatio: 0.15
  },

  // --- DOCTRINES TACTIQUES ---
  DOCTRINES: {
    balanced: {
      id: 'balanced',
      powerMultiplier: 1.0,
      warriorLossChance: 0.6,
      tankLossChance: 0.4
    },
    turtle: {
      id: 'turtle',
      powerMultiplier: 0.9,
      warriorLossChance: 0.3,
      tankLossChance: 0.0
    },
    rush: {
      id: 'rush',
      powerMultiplier: 1.25,
      warriorLossChance: 0.75,
      tankLossChance: 0.5
    },
    acid: {
      id: 'acid',
      powerMultiplier: 1.15,
      warriorBonusPerUnit: 8,
      warriorLossChance: 0.4,
      tankLossChance: 0.35
    }
  },

  // --- MISSIONS D'EXPÉDITION (LOT 4) ---
  MISSIONS: {
    pucerons: {
      id: 'pucerons',
      cardId: 'mission1',
      duration: 8,
      difficulty: 25,
      faction: null,
      riskKey: 'risk.low',
      riskClass: 'risk-low',
      lootFood: 75,
      lootPhero: 6,
      bonusWorkers: 0
    },
    chenille: {
      id: 'chenille',
      cardId: 'mission2',
      duration: 14,
      difficulty: 65,
      faction: null,
      riskKey: 'risk.medium',
      riskClass: 'risk-medium',
      lootFood: 180,
      lootPhero: 18,
      bonusWorkers: 0
    },
    fourmis_rouges: {
      id: 'fourmis_rouges',
      cardId: 'mission3',
      duration: 20,
      difficulty: 110,
      faction: 'fire_ants',
      riskKey: 'risk.high',
      riskClass: 'risk-high',
      lootFood: 320,
      lootPhero: 40,
      bonusWorkers: 1
    },
    termites_bastion: {
      id: 'termites_bastion',
      cardId: 'mission4',
      duration: 30,
      difficulty: 210,
      faction: 'termites',
      riskKey: 'risk.extreme',
      riskClass: 'risk-extreme',
      lootFood: 550,
      lootPhero: 75,
      bonusWorkers: 2
    },
    mantis_boss: {
      id: 'mantis_boss',
      cardId: 'mission5',
      duration: 45,
      difficulty: 380,
      faction: 'wasps',
      isBoss: true,
      trophyKey: 'trophy.mantis',
      riskKey: 'risk.boss',
      riskClass: 'risk-boss',
      lootFood: 1100,
      lootPhero: 180,
      bonusWorkers: 3
    }
  },

  // --- FACTIONS ADVERSES & CONTRES TACTIQUES (LOT 4) ---
  FACTIONS: {
    fire_ants: {
      id: 'fire_ants',
      icon: '🔥',
      nameKey: 'faction.fire_ants.name',
      descKey: 'faction.fire_ants.desc',
      counterCaste: 'tank',
      counterDescKey: 'faction.fire_ants.counter',
      baseAttackMultiplier: 1.30,
      baseArmorMultiplier: 0.90,
      baseSpeedMultiplier: 1.00,
      counterEfficiencyBonus: 0.35 // Tanks absorbent +35% de dégâts
    },
    termites: {
      id: 'termites',
      icon: '🪨',
      nameKey: 'faction.termites.name',
      descKey: 'faction.termites.desc',
      counterCaste: 'warrior', // contre acide
      counterDescKey: 'faction.termites.counter',
      baseAttackMultiplier: 0.90,
      baseArmorMultiplier: 1.50,
      baseSpeedMultiplier: 0.80,
      acidDamageMultiplier: 1.50 // Perforation d'armure de +50% avec doctrine/mutation acide
    },
    wasps: {
      id: 'wasps',
      icon: '🐝',
      nameKey: 'faction.wasps.name',
      descKey: 'faction.wasps.desc',
      counterCaste: 'scout',
      counterDescKey: 'faction.wasps.counter',
      baseAttackMultiplier: 1.25,
      baseArmorMultiplier: 0.70,
      baseSpeedMultiplier: 1.50,
      scoutPerceptionBonus: 0.40 // Éclaireuses préviennent l'embuscade (+40% puissance)
    }
  },

  // --- ARCHÉTYPES D'ENNEMIS (LOT 4) ---
  ENEMY_ARCHETYPES: {
    raiders: {
      id: 'raiders',
      nameKey: 'enemy.raiders.name',
      faction: 'fire_ants',
      basePower: 50,
      powerPerDay: 15
    },
    termite_vanguard: {
      id: 'termite_vanguard',
      nameKey: 'enemy.termite_vanguard.name',
      faction: 'termites',
      basePower: 210,
      powerPerDay: 0
    },
    mantis_boss: {
      id: 'mantis_boss',
      nameKey: 'enemy.mantis_boss.name',
      faction: 'wasps',
      isBoss: true,
      trophyKey: 'trophy.mantis',
      basePower: 380,
      powerPerDay: 0
    }
  },

  // --- ÉVÉNEMENTS À CHOIX (LOT 4) ---
  EVENTS: {
    minIntervalSeconds: 65,
    randomIntervalSeconds: 45,
    eventDurationSeconds: 30,
    registry: {
      golden_sap: {
        id: 'golden_sap',
        icon: '🍯',
        titleKey: 'event.golden_sap.title',
        descKey: 'event.golden_sap.desc',
        minDay: 1,
        choices: [
          {
            id: 'harvest_all',
            labelKey: 'event.golden_sap.choice_a',
            outcomeKey: 'event.golden_sap.outcome_a',
            type: 'loot',
            effect: { foodGain: 90, riskLossWorkerChance: 0.15 }
          },
          {
            id: 'synthesize_phero',
            labelKey: 'event.golden_sap.choice_b',
            outcomeKey: 'event.golden_sap.outcome_b',
            type: 'phero',
            effect: { pheroGain: 15 }
          }
        ]
      },
      myrmecophile_beetle: {
        id: 'myrmecophile_beetle',
        icon: '🪲',
        titleKey: 'event.myrmecophile_beetle.title',
        descKey: 'event.myrmecophile_beetle.desc',
        minDay: 2,
        choices: [
          {
            id: 'welcome_guest',
            labelKey: 'event.myrmecophile_beetle.choice_a',
            outcomeKey: 'event.myrmecophile_beetle.outcome_a',
            type: 'bonus',
            effect: { pheroGain: 20, foodCost: 15 }
          },
          {
            id: 'chase_away',
            labelKey: 'event.myrmecophile_beetle.choice_b',
            outcomeKey: 'event.myrmecophile_beetle.outcome_b',
            type: 'loot',
            effect: { foodGain: 35 }
          }
        ]
      },
      heavy_rain: {
        id: 'heavy_rain',
        icon: '🌧️',
        titleKey: 'event.heavy_rain.title',
        descKey: 'event.heavy_rain.desc',
        minDay: 2,
        choices: [
          {
            id: 'reinforce_tunnels',
            labelKey: 'event.heavy_rain.choice_a',
            outcomeKey: 'event.heavy_rain.outcome_a',
            type: 'defense',
            effect: { pheroGain: 10, foodCost: 20 }
          },
          {
            id: 'brave_mud',
            labelKey: 'event.heavy_rain.choice_b',
            outcomeKey: 'event.heavy_rain.outcome_b',
            type: 'gamble',
            effect: { foodGain: 65, riskLossWorkerChance: 0.25 }
          }
        ]
      },
      aphid_swarm: {
        id: 'aphid_swarm',
        icon: '🌿',
        titleKey: 'event.aphid_swarm.title',
        descKey: 'event.aphid_swarm.desc',
        minDay: 1,
        choices: [
          {
            id: 'herd_aphids',
            labelKey: 'event.aphid_swarm.choice_a',
            outcomeKey: 'event.aphid_swarm.outcome_a',
            type: 'growth',
            effect: { foodGain: 40, pheroGain: 12 }
          },
          {
            id: 'immediate_feast',
            labelKey: 'event.aphid_swarm.choice_b',
            outcomeKey: 'event.aphid_swarm.outcome_b',
            type: 'loot',
            effect: { foodGain: 85 }
          }
        ]
      },
      lost_scouts: {
        id: 'lost_scouts',
        icon: '⚡',
        titleKey: 'event.lost_scouts.title',
        descKey: 'event.lost_scouts.desc',
        minDay: 3,
        choices: [
          {
            id: 'rescue_mission',
            labelKey: 'event.lost_scouts.choice_a',
            outcomeKey: 'event.lost_scouts.outcome_a',
            type: 'rescue',
            effect: { foodCost: 30, bonusScouts: 2 }
          },
          {
            id: 'secure_perimeter',
            labelKey: 'event.lost_scouts.choice_b',
            outcomeKey: 'event.lost_scouts.outcome_b',
            type: 'phero',
            effect: { pheroGain: 25 }
          }
        ]
      }
    }
  },

  // --- CIBLES D'ÉQUILIBRAGE (JALONS I & II - LOTS 4 & 6) ---
  BALANCE_TARGETS: {
    mantisBossTargetMinutes: { min: 25, max: 60 },
    nuptialFlightMinutes: { min: 45, max: 120 },
    expectedArmyPowerAtDay10: 150,
    expectedArmyPowerAtDay30: 400,
    maxNurseIncubationBonus: 0.60
  },

  // --- MUTATIONS GÉNÉTIQUES (ARBRE À 3 BRANCHES - LOT 6) ---
  MUTATIONS: {
    // ⚔️ BRANCHE BIOMÉCANIQUE (COMBAT)
    mandibules: {
      id: 'mandibules',
      branch: 'biomechanics',
      tier: 1,
      requires: null,
      btnId: 'btnMutMandibules',
      cost: 25,
      powerMultiplier: 1.30
    },
    carapace: {
      id: 'carapace',
      branch: 'biomechanics',
      tier: 2,
      requires: 'mandibules',
      btnId: 'btnMutCarapace',
      cost: 35,
      tankPowerBonus: 15,
      tankHpBonus: 40
    },
    acide: {
      id: 'acide',
      branch: 'biomechanics',
      tier: 3,
      requires: 'carapace',
      btnId: 'btnMutAcide',
      cost: 45,
      warriorPowerBonus: 12
    },
    royal_exo: {
      id: 'royal_exo',
      branch: 'biomechanics',
      tier: 3,
      requires: 'acide',
      btnId: 'btnMutRoyalExo',
      cost: 85,
      queenHpBonus: 50,
      squadPowerBonusPercent: 0.20
    },

    // 🍃 BRANCHE MÉTABOLISME (ÉCONOMIE)
    trophallaxis: {
      id: 'trophallaxis',
      branch: 'metabolism',
      tier: 1,
      requires: null,
      btnId: 'btnMutTrophallaxis',
      cost: 25,
      workerFoodMultiplier: 1.20
    },
    mycology: {
      id: 'mycology',
      branch: 'metabolism',
      tier: 2,
      requires: 'trophallaxis',
      btnId: 'btnMutMycology',
      cost: 45,
      fungusMultiplier: 1.35
    },
    preservation: {
      id: 'preservation',
      branch: 'metabolism',
      tier: 3,
      requires: 'mycology',
      btnId: 'btnMutPreservation',
      cost: 80,
      granaryCapacityMultiplier: 1.25,
      winterMitigation: 0.50
    },

    // 🧪 BRANCHE CHIMIE PHÉROMONALE (COUVAIN)
    antennae: {
      id: 'antennae',
      branch: 'pheromones',
      tier: 1,
      requires: null,
      btnId: 'btnMutAntennae',
      cost: 25,
      pheromoneMultiplier: 1.30
    },
    thermal_brood: {
      id: 'thermal_brood',
      branch: 'pheromones',
      tier: 2,
      requires: 'antennae',
      btnId: 'btnMutThermalBrood',
      cost: 45,
      incubationSpeedMultiplier: 1.25
    },
    imperial_fervor: {
      id: 'imperial_fervor',
      branch: 'pheromones',
      tier: 3,
      requires: 'thermal_brood',
      btnId: 'btnMutImperialFervor',
      cost: 80,
      autoSpawnCostMultiplier: 0.50,
      autoSpawnBonusChance: 0.05
    }
  },

  // --- HAUTS FAITS & ACCOMPLISSEMENTS (LOT 6) ---
  ACHIEVEMENTS: {
    first_hatch: {
      id: 'first_hatch',
      icon: '🐣',
      nameKey: 'ach.first_hatch.name',
      descKey: 'ach.first_hatch.desc',
      rewardPhero: 10,
      check: function (state) {
        return Boolean(state && state.stats && Number(state.stats.totalAntsHatched) >= 1);
      }
    },
    prosperous_colony: {
      id: 'prosperous_colony',
      icon: '🐜',
      nameKey: 'ach.prosperous_colony.name',
      descKey: 'ach.prosperous_colony.desc',
      rewardPhero: 25,
      check: function (state) {
        if (!state || !state.ants) return false;
        const total = (Number(state.ants.worker) || 0) + (Number(state.ants.scout) || 0) +
                      (Number(state.ants.warrior) || 0) + (Number(state.ants.tank) || 0) +
                      (Number(state.ants.nurse) || 0);
        return total >= 50;
      }
    },
    grand_architect: {
      id: 'grand_architect',
      icon: '🏛️',
      nameKey: 'ach.grand_architect.name',
      descKey: 'ach.grand_architect.desc',
      rewardPhero: 30,
      check: function (state) {
        if (!state || !state.rooms) return false;
        return (Number(state.rooms.queen) || 0) >= 3 &&
               (Number(state.rooms.granary) || 0) >= 3 &&
               (Number(state.rooms.dorm) || 0) >= 3;
      }
    },
    impenetrable_wall: {
      id: 'impenetrable_wall',
      icon: '🛡️',
      nameKey: 'ach.impenetrable_wall.name',
      descKey: 'ach.impenetrable_wall.desc',
      rewardPhero: 30,
      check: function (state) {
        return Boolean(state && state.stats && Number(state.stats.totalRaidsDefeated) >= 3);
      }
    },
    winter_survivor: {
      id: 'winter_survivor',
      icon: '❄️',
      nameKey: 'ach.winter_survivor.name',
      descKey: 'ach.winter_survivor.desc',
      rewardPhero: 35,
      check: function (state) {
        return Boolean(state && state.stats && Number(state.stats.winterSurvived) >= 1);
      }
    },
    mantis_slayer: {
      id: 'mantis_slayer',
      icon: '👑',
      nameKey: 'ach.mantis_slayer.name',
      descKey: 'ach.mantis_slayer.desc',
      rewardPhero: 50,
      check: function (state) {
        return Boolean(state && state.bossesDefeated && state.bossesDefeated.mantis);
      }
    },
    genetic_pioneer: {
      id: 'genetic_pioneer',
      icon: '🧬',
      nameKey: 'ach.genetic_pioneer.name',
      descKey: 'ach.genetic_pioneer.desc',
      rewardPhero: 20,
      check: function (state) {
        if (!state || !state.mutations) return false;
        return Object.values(state.mutations).filter(Boolean).length >= 3;
      }
    },
    myrmecologist: {
      id: 'myrmecologist',
      icon: '🔬',
      nameKey: 'ach.myrmecologist.name',
      descKey: 'ach.myrmecologist.desc',
      rewardPhero: 60,
      check: function (state) {
        if (!state || !state.mutations) return false;
        return Object.values(state.mutations).filter(Boolean).length >= 9;
      }
    },
    food_hoarder: {
      id: 'food_hoarder',
      icon: '🍃',
      nameKey: 'ach.food_hoarder.name',
      descKey: 'ach.food_hoarder.desc',
      rewardPhero: 25,
      check: function (state) {
        return Boolean(state && Number(state.food) >= 400);
      }
    },
    pheromone_master: {
      id: 'pheromone_master',
      icon: '🧪',
      nameKey: 'ach.pheromone_master.name',
      descKey: 'ach.pheromone_master.desc',
      rewardPhero: 30,
      check: function (state) {
        return Boolean(state && state.stats && Number(state.stats.totalPheromonesEarned) >= 100);
      }
    },
    dynasty_founder: {
      id: 'dynasty_founder',
      icon: '✨',
      nameKey: 'ach.dynasty_founder.name',
      descKey: 'ach.dynasty_founder.desc',
      rewardPhero: 50,
      check: function (state) {
        return Boolean(state && state.stats && Number(state.stats.prestigesCount) >= 1);
      }
    }
  },

  // --- PRESTIGE 1 : VOL NUPTIAL (LOT 6) ---
  PRESTIGE: {
    nuptialFlight: {
      requirements: {
        minQueenRoomLevel: 5,
        minPopulation: 50
      },
      bonusPerDna: 0.05 // +5% de bonus permanent par point d'ADN Royal
    }
  },

  // --- SYSTÈME D'EXPLORATION, ANNEAUX, ABÎMES & RELIQUES (LOT 7) ---
  get EXPLORATION() {
    if (this._exploration) return this._exploration;
    if (typeof require === 'function') {
      try {
        const wMod = require('./game-world.js');
        if (wMod && wMod.EXPLORATION_DEFAULTS) {
          this._exploration = wMod.EXPLORATION_DEFAULTS;
          return this._exploration;
        }
      } catch (e) {}
    }
    return (typeof globalThis !== 'undefined' && globalThis.EXPLORATION_DEFAULTS) || {};
  },
  set EXPLORATION(val) {
    this._exploration = val;
  },

  // --- SYSTÈME DE RAIDS ENNEMIS ---
  RAIDS: {
    alertThresholdSeconds: 20,
    visualWarningSeconds: 8,
    combatDurationFrames: 260,
    minIntervalSeconds: 120,
    randomIntervalSeconds: 60,
    baseStrength: 50,
    strengthPerDay: 15,
    victoryPheroReward: 15,
    minFoodStolen: 40,
    randomFoodStolen: 40
  },

  // --- PALETTE, RÉSEAU DE GALERIES & TOKENS DU CANVAS ---
  CANVAS_THEME: {
    maxVisualAntsPerCaste: {
      worker: 18,
      scout: 8,
      warrior: 10,
      tank: 6,
      nurse: 6
    },
    surfaceHeightRatio: 0.19,

    dayNight: {
      starCount: 28,
      snowCount: 30,
      daySkyTop: [56, 130, 196],
      daySkyBottom: [135, 194, 237],
      duskSkyTop: [45, 32, 74],
      duskSkyBottom: [214, 107, 68],
      nightSkyTop: [11, 15, 29],
      nightSkyBottom: [26, 34, 56],
      sunColor: '#f6e05e',
      sunGlow: 'rgba(246, 224, 94, 0.35)',
      moonColor: '#e2e8f0',
      moonGlow: 'rgba(226, 232, 240, 0.25)',
      starColor: '#ffffff',
      snowColor: 'rgba(255, 255, 255, 0.85)'
    },

    moundColor: '#7b341e',
    moundHighlight: '#9c4221',
    entranceColor: '#120d09',
    earthGradientTop: '#382516',
    earthGradientMid: '#26180e',
    earthGradientBottom: '#140c07',
    rockSpeckleColor: 'rgba(255, 235, 205, 0.04)',

    tunnelOuterColor: '#3d2817',
    tunnelColor: '#1e130b',
    tunnelWidth: 24,

    chamberStrokeColor: '#634328',
    chamberLabelColor: '#cbbba8',
    chamberSubLabelColor: '#f6ad55',

    seasonalParticles: {
      pollenCount: 22,
      pollenColor: 'rgba(236, 201, 75, 0.75)',
      fireflyCount: 16,
      fireflyGlow: 'rgba(250, 240, 137, 0.85)',
      leafCount: 18,
      leafColors: ['#dd6b20', '#c05621', '#9c4221', '#d69e2e'],
      sporeCount: 14,
      sporeGlow: 'rgba(183, 148, 244, 0.7)'
    },

    seasonalDetails: {
      springFlowerColors: ['#f687b3', '#fbb6ce', '#faf089', '#ffffff'],
      springFlowerCenterColor: '#ecc94b',
      springFlowerCount: 8,
      summerSunRayColor: 'rgba(254, 240, 138, 0.14)',
      summerSunRayCount: 6,
      summerSunRayLength: 48,
      winterMoundFrostColor: 'rgba(240, 248, 255, 0.75)',
      winterMoundFrostWidth: 2.5
    },

    nodes: {
      surface_left:  { xRatio: 0.12, yRatio: 0.175, isChamber: false, interaction: 'harvest', depositKey: 'left', labelKey: 'canvas.node.surface_left' },
      surface_right: { xRatio: 0.88, yRatio: 0.175, isChamber: false, interaction: 'harvest', depositKey: 'right', labelKey: 'canvas.node.surface_right' },
      entrance:      { xRatio: 0.50, yRatio: 0.185, isChamber: false, interaction: 'info', labelKey: 'canvas.node.entrance' },
      barricade:     { xRatio: 0.50, yRatio: 0.30,  isChamber: false, interaction: 'barricade', roomKey: 'barricade', labelKey: 'canvas.room.barricade' },
      aphid_farm:    { xRatio: 0.08, yRatio: 0.44,  isChamber: true, rx: 55, ry: 32, labelKey: 'canvas.room.aphid_farm', bg: '#2b3a28', roomKey: 'aphid_farm', interaction: 'room' },
      queen:         { xRatio: 0.50, yRatio: 0.46,  isChamber: true, rx: 76, ry: 42, labelKey: 'canvas.room.queen', bg: '#442e1b', roomKey: 'queen', interaction: 'room' },
      masonry_hall:  { xRatio: 0.22, yRatio: 0.65,  isChamber: true, rx: 58, ry: 34, labelKey: 'canvas.room.masonry_hall', bg: '#423326', roomKey: 'masonry_hall', interaction: 'room' },
      granary:       { xRatio: 0.20, yRatio: 0.62,  isChamber: true, rx: 62, ry: 36, labelKey: 'canvas.room.granary', bg: '#4a331c', roomKey: 'granary', interaction: 'room' },
      dorm:          { xRatio: 0.80, yRatio: 0.62,  isChamber: true, rx: 62, ry: 36, labelKey: 'canvas.room.dorm', bg: '#3f2818', roomKey: 'dorm', interaction: 'room' },
      fungus:        { xRatio: 0.22, yRatio: 0.84,  isChamber: true, rx: 60, ry: 35, labelKey: 'canvas.room.fungus', bg: '#2d3732', roomKey: 'fungus', interaction: 'room' },
      nursery:       { xRatio: 0.56, yRatio: 0.84,  isChamber: true, rx: 70, ry: 38, labelKey: 'canvas.room.nursery', bg: '#3a2517', roomKey: null, interaction: 'nursery' },
      abyss_shaft:   { xRatio: 0.40, yRatio: 0.95,  isChamber: true, rx: 56, ry: 32, labelKey: 'canvas.node.abyss_shaft', bg: '#1c1514', roomKey: null, interaction: 'abyss' }
    },

    edges: [
      ['surface_left', 'entrance'],
      ['surface_right', 'entrance'],
      ['entrance', 'barricade'],
      ['barricade', 'queen'],
      ['queen', 'granary'],
      ['queen', 'dorm'],
      ['queen', 'nursery'],
      ['aphid_farm', 'granary'],
      ['masonry_hall', 'granary'],
      ['masonry_hall', 'dorm'],
      ['granary', 'fungus'],
      ['fungus', 'nursery'],
      ['dorm', 'nursery'],
      ['nursery', 'abyss_shaft']
    ],

    barricadeVisual: {
      woodDark: '#5a381e',
      woodLight: '#8b5a2b',
      stoneColor: '#718096',
      shieldGlow: 'rgba(246, 173, 85, 0.35)',
      badgeBg: 'rgba(20, 16, 12, 0.85)',
      badgeBorder: '#dd6b20',
      badgeText: '#f6ad55'
    },

    chamberDetails: {
      seedColor: '#ecc94b',
      leafColor: '#48bb78',
      eggColor: '#fdfdfd',
      eggActiveColor: '#fefcbf',
      eggShadow: 'rgba(255, 255, 255, 0.25)',
      royalRugColor: 'rgba(214, 158, 46, 0.14)',
      dormBunkColor: '#543822',
      mushroomStem: '#e2e8f0',
      mushroomCap: '#9f7aea',
      mushroomGlow: 'rgba(183, 148, 244, 0.28)'
    },

    queen: {
      abdomen: '#9c4221',
      abdomenHighlight: '#f6ad55',
      abdomenStripe: '#5c220c',
      thorax: '#7b341e',
      head: '#d69e2e',
      antennae: '#ecc94b',
      eyeColor: '#fef3c7',
      pupilColor: '#261005'
    },

    antzStyle: {
      dropShadowColor: 'rgba(8, 5, 3, 0.48)',
      specularColor: 'rgba(255, 246, 224, 0.58)',
      rimLightColor: 'rgba(246, 173, 85, 0.42)',
      eyeCatchlight: '#ffffff',
      browColor: '#261408',
      mandibleSteel: '#e2e8f0',
      mandibleGold: '#ecc94b',
      petioleColor: '#3d1f0d',
      legJointColor: '#6b3b1e',
      queenCrownColor: '#f6e05e',
      queenCapeColor: 'rgba(254, 243, 199, 0.24)',
      queenAuraColor: 'rgba(236, 201, 75, 0.24)',
      trophyEmerald: '#38a169',
      trophyGold: '#ecc94b'
    },

    worldAAA: {
      godRayColor: 'rgba(254, 243, 199, 0.09)',
      bgGrassAlpha: 0.28,
      bgGrassScale: 2.1,
      strataLineColor: 'rgba(255, 215, 170, 0.04)',
      rootColor: 'rgba(139, 90, 43, 0.35)',
      tunnelShadowColor: 'rgba(5, 3, 2, 0.65)',
      tunnelHighlightColor: 'rgba(214, 158, 46, 0.08)',
      tunnelRibColor: 'rgba(99, 67, 40, 0.32)',
      chamberShadowColor: 'rgba(6, 4, 2, 0.72)',
      chamberInnerGlow: 'rgba(246, 173, 85, 0.14)',
      chamberBadgeBg: 'rgba(15, 11, 8, 0.88)',
      chamberBadgeBorder: 'rgba(214, 158, 46, 0.45)',
      cooldownRingBg: 'rgba(15, 12, 10, 0.65)',
      cooldownRingFg: '#f6ad55',
      readySparkleColor: 'rgba(246, 224, 94, 0.75)'
    },

    antLegColor: '#4a2a18',
    leafColor: '#48bb78',
    seedCarryColor: '#ecc94b',
    enemyAnt: {
      scale: 1.22,
      moveSpeed: 1.45,
      canvasColor: '#e53e3e',
      headColor: '#9b2c2c',
      highlightColor: '#feb2b2',
      stripeColor: '#450a0a',
      eyeColor: '#fef08a',
      pupilColor: '#742a2a',
      legColor: '#742a2a',
      glowColor: 'rgba(229, 62, 62, 0.4)'
    },

    combat: {
      sparkColor: '#f6e05e',
      bloodColor: '#fc8181',
      acidColor: '#68d391',
      clashRingColor: 'rgba(252, 129, 129, 0.5)'
    }
  },

  // --- TOKENS D'INTERNATIONALISATION (FRANÇAIS & ANGLAIS) ---
  // Dictionnaire bilingue extrait dans i18n.js selon les Standards d'Architecture Senior (< 2000 lignes)
  get I18N() {
    if (typeof I18N !== 'undefined') return I18N;
    if (typeof globalThis !== 'undefined' && globalThis.I18N) return globalThis.I18N;
    /* c8 ignore next 6 */
    if (typeof require === 'function') {
      try {
        const iMod = require('./i18n.js');
        return iMod.I18N || iMod;
      } catch (e) {}
    }
    return { fr: {}, en: {} };
  }
};

// Fonction utilitaire globale de traduction avec remplacement de variables {param}
function t(key, params = {}) {
  if (typeof globalThis.t === 'function' && globalThis.t !== t) {
    return globalThis.t(key, params);
  }
  const i18nDict = GAME_CONFIG.I18N || {};
  const activeLang = (globalThis.gameState && globalThis.gameState.lang) || (GAME_CONFIG.INITIAL_STATE && GAME_CONFIG.INITIAL_STATE.lang) || 'fr';
  const dict = i18nDict[activeLang] || i18nDict.fr || {};
  let str = dict[key] !== undefined ? dict[key] : ((i18nDict.fr && i18nDict.fr[key]) !== undefined ? i18nDict.fr[key] : key);

  if (params && typeof params === 'object') {
    Object.keys(params).forEach(function (k) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
  }
  return str;
}

globalThis.GAME_CONFIG = GAME_CONFIG;
if (typeof globalThis.t === 'undefined') {
  globalThis.t = t;
}
/* c8 ignore next 3 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_CONFIG, t };
}
