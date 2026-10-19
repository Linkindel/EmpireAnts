/**
 * Empire Fourmi - Game Tokens, Configuration Centrale & Dictionnaire i18n (FR / EN)
 * Toutes les valeurs d'équilibrage, de coûts, de combats, de saisons, de thème Canvas et de traductions sont réunies ici.
 */

const GAME_CONFIG = {
  SAVE_KEY: 'ant_empire_save_v1',
  LANG_KEY: 'ant_empire_lang',

  // --- ÉTAT INITIAL ---
  INITIAL_STATE: {
    lang: 'fr',
    soundEnabled: true,
    food: 120,
    maxFood: 180,
    pheromone: 20,
    queenHealth: 100,
    maxQueenHealth: 100,
    day: 1,
    timeSeconds: 0,
    speed: 1,
    ants: {
      worker: 6,
      scout: 2,
      warrior: 2,
      tank: 1
    },
    rooms: {
      queen: 1,
      granary: 1,
      dorm: 1,
      barricade: 0,
      fungus: 0
    },
    squad: {
      tank: 0,
      warrior: 0,
      scout: 0,
      doctrine: 'balanced'
    },
    mutations: {
      mandibules: false,
      carapace: false,
      acide: false
    },
    nextRaidTimer: 140
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
    queenIncubationSpeedPerLevel: 0.20
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

  // --- CASTES DE FOURMIS ---
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
      canvasColor: '#3b2d23',
      headColor: '#261c15'
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
      scale: 0.92,
      moveSpeed: 1.85,
      canvasColor: '#d69e2e',
      headColor: '#b7791f'
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
      headColor: '#742a2a'
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
      headColor: '#9b2c2c'
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
      cost(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    granary: {
      id: 'granary',
      icon: '🏺',
      baseCost: 40,
      costPerLevel: 25,
      storagePerLevel: 60,
      cost(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    dorm: {
      id: 'dorm',
      icon: '🛏️',
      baseCost: 60,
      costPerLevel: 40,
      popCapPerLevel: 10,
      cost(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    barricade: {
      id: 'barricade',
      icon: '🧱',
      baseCost: 45,
      costPerLevel: 30,
      defensePerLevel: 25,
      cost(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    },
    fungus: {
      id: 'fungus',
      icon: '🍄',
      baseCost: 55,
      costPerLevel: 35,
      foodPerLevel: 1.2,
      cost(lvl) { return this.baseCost + lvl * this.costPerLevel; }
    }
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

  // --- MISSIONS D'EXPÉDITION ---
  MISSIONS: {
    pucerons: {
      id: 'pucerons',
      cardId: 'mission1',
      duration: 8,
      difficulty: 25,
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
      riskKey: 'risk.high',
      riskClass: 'risk-high',
      lootFood: 320,
      lootPhero: 40,
      bonusWorkers: 1
    }
  },

  // --- MUTATIONS GÉNÉTIQUES ---
  MUTATIONS: {
    mandibules: {
      id: 'mandibules',
      btnId: 'btnMutMandibules',
      cost: 25,
      powerMultiplier: 1.3
    },
    carapace: {
      id: 'carapace',
      btnId: 'btnMutCarapace',
      cost: 35,
      tankPowerBonus: 15
    },
    acide: {
      id: 'acide',
      btnId: 'btnMutAcide',
      cost: 45,
      warriorPowerBonus: 12
    }
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
      tank: 6
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

    nodes: {
      surface_left:  { xRatio: 0.12, yRatio: 0.175, isChamber: false },
      surface_right: { xRatio: 0.88, yRatio: 0.175, isChamber: false },
      entrance:      { xRatio: 0.50, yRatio: 0.185, isChamber: false },
      barricade:     { xRatio: 0.50, yRatio: 0.30,  isChamber: false },
      queen:         { xRatio: 0.50, yRatio: 0.46,  isChamber: true, rx: 76, ry: 42, labelKey: 'canvas.room.queen', bg: '#442e1b', roomKey: 'queen' },
      granary:       { xRatio: 0.20, yRatio: 0.62,  isChamber: true, rx: 62, ry: 36, labelKey: 'canvas.room.granary', bg: '#4a331c', roomKey: 'granary' },
      dorm:          { xRatio: 0.80, yRatio: 0.62,  isChamber: true, rx: 62, ry: 36, labelKey: 'canvas.room.dorm', bg: '#3f2818', roomKey: 'dorm' },
      fungus:        { xRatio: 0.22, yRatio: 0.84,  isChamber: true, rx: 60, ry: 35, labelKey: 'canvas.room.fungus', bg: '#2d3732', roomKey: 'fungus' },
      nursery:       { xRatio: 0.56, yRatio: 0.84,  isChamber: true, rx: 70, ry: 38, labelKey: 'canvas.room.nursery', bg: '#3a2517', roomKey: null }
    },

    edges: [
      ['surface_left', 'entrance'],
      ['surface_right', 'entrance'],
      ['entrance', 'barricade'],
      ['barricade', 'queen'],
      ['queen', 'granary'],
      ['queen', 'dorm'],
      ['queen', 'nursery'],
      ['granary', 'fungus'],
      ['fungus', 'nursery'],
      ['dorm', 'nursery']
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
      abdomen: '#8c3d19',
      abdomenStripe: '#b75525',
      thorax: '#5c220c',
      head: '#d69e2e',
      antennae: '#ecc94b'
    },

    antLegColor: '#382a21',
    leafColor: '#48bb78',
    seedCarryColor: '#ecc94b',
    enemyAnt: {
      scale: 1.22,
      moveSpeed: 1.45,
      canvasColor: '#e53e3e',
      headColor: '#9b2c2c',
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
  I18N: {
    fr: {
      'app.title': 'Empire Fourmi - Stratégie de Colonie',
      'brand.title': 'EMPIRE FOURMI',
      'brand.sub': 'Stratégie Souterraine',
      'res.food.title': 'Nourriture en stock (croissance et entretien)',
      'res.phero.title': 'Points de phéromones (recherche et doctrines)',
      'res.pop.title': 'Population actuelle (+ œufs) / Capacité maximale',
      'res.queen.title': 'Santé de la Reine',
      'speed.pause': 'Mettre en pause',
      'speed.1x': 'Vitesse normale',
      'speed.2x': 'Vitesse x2',
      'speed.3x': 'Vitesse x3',
      'lang.switch.title': 'Changer de langue (Français / Anglais)',
      'sound.toggle.title': 'Activer / Couper les effets sonores',
      'reset.btn.title': 'Réinitialiser la colonie (Nouvelle Partie)',
      'reset.confirm': 'Voulez-vous vraiment réinitialiser votre colonie et recommencer à zéro ?',

      // Overlay, Saisons & Temps
      'time.day': 'Jour',
      'time.dawn': 'Aube',
      'time.noon': 'Jour',
      'time.dusk': 'Crépuscule',
      'time.night': 'Nuit',
      'season.spring': 'Printemps',
      'season.summer': 'Été',
      'season.autumn': 'Automne',
      'season.winter': 'Hiver',
      'season.spring.desc': 'Ponte & Incubation +30%',
      'season.summer.desc': 'Récolte +25%, Butin +15%',
      'season.autumn.desc': 'Butin +30%, Raids +15%',
      'season.winter.desc': 'Froid : Récolte surface -55%',
      'alert.raid': '⚠️ ALERTE : Raid ennemi en approche dans {sec}s ! Préparez vos Tanks !',

      // Onglets
      'tab.nursery': 'Nurserie & Armée',
      'tab.rooms': 'Salles & Galeries',
      'tab.expeditions': 'Expéditions',
      'tab.mutations': 'Évolutions',
      'tab.logs': 'Journal',
      'tab.mobile.nursery': 'Armée',
      'tab.mobile.rooms': 'Salles',
      'tab.mobile.expeditions': 'Expéditions',
      'tab.mobile.mutations': 'Évolution',
      'tab.mobile.logs': 'Journal',

      // Nurserie & Castes
      'nursery.header.title': 'Incubation & Ratios de Castes',
      'nursery.header.desc': "Affectez vos œufs pour équilibrer l'économie, la reconnaissance et la puissance militaire.",
      'nursery.queue.title': '🥚 Couvain en Incubation',
      'nursery.queue.empty': 'Aucun œuf en incubation. Lancez une ponte ci-dessous.',
      'caste.worker.name': 'Fourmi Ouvrière',
      'caste.worker.short': 'Ouvrière',
      'caste.worker.desc': 'Récolte les denrées, creuse les salles et soigne la colonie.',
      'caste.worker.stat1': 'Production :',
      'caste.worker.stat2': 'Entretien :',
      'caste.worker.btn': 'Incuber Ouvrière',

      'caste.scout.name': 'Fourmi Éclaireuse',
      'caste.scout.short': 'Éclaireuse',
      'caste.scout.desc': 'Rapide et alerte. Découvre les expéditions et signale les prédateurs.',
      'caste.scout.stat1': 'Vitesse :',
      'caste.scout.stat1.val': 'Très Haute',
      'caste.scout.stat2': 'Phéromones :',
      'caste.scout.btn': 'Incuber Éclaireuse',

      'caste.warrior.name': 'Fourmi Guerrière',
      'caste.warrior.short': 'Guerrière',
      'caste.warrior.desc': "Mandibules tranchantes et tirs d'acide formique. Gros dégâts.",
      'caste.warrior.stat1': 'Attaque :',
      'caste.warrior.stat1.val': '36 Puissance',
      'caste.warrior.stat2': 'Défense :',
      'caste.warrior.stat2.val': '20 Rempart',
      'caste.warrior.btn': 'Incuber Guerrière',

      'caste.tank.name': 'Fourmi Tank (Major)',
      'caste.tank.short': 'Tank (Major)',
      'caste.tank.desc': "Tête renforcée en bouclier. Encaisse les chocs et protège l'armée.",
      'caste.tank.stat1': 'Points de Vie :',
      'caste.tank.stat1.val': '220 PV',
      'caste.tank.stat2': 'Défense :',
      'caste.tank.stat2.val': '35 Rempart',
      'caste.tank.btn': 'Incuber Tank',

      // Salles
      'rooms.header.title': 'Aménagement des Chambres',
      'rooms.header.desc': 'Améliorez les cavités pour accroître la population, stocker des surplus et produire sous terre.',
      'room.lvl': 'Niv.',
      'room.queen.name': 'Chambre Royale',
      'room.queen.desc': 'Nid douillet de la Reine. Accélère la ponte automatique et la vitesse du couvain.',
      'room.queen.stat': 'Vitesse couvain :',
      'room.queen.btn': 'Agrandir la Chambre',

      'room.granary.name': 'Grenier à Graines',
      'room.granary.desc': "Conserve le miellat et les feuilles récoltées à l'abri de l'humidité.",
      'room.granary.stat': 'Capacité maximale :',
      'room.granary.btn': 'Agrandir le Grenier',

      'room.dorm.name': 'Dortoirs de Colonie',
      'room.dorm.desc': 'Offre des galeries de repos pour augmenter le nombre total de fourmis.',
      'room.dorm.stat': 'Plafond de population :',
      'room.dorm.unit': 'Fourmis',
      'room.dorm.btn': 'Creuser Nouveaux Dortoirs',

      'room.barricade.name': "Barricade d'Entrée",
      'room.barricade.desc': 'Piège de terre et brindilles pour retenir les assauts de scarabées ou fourmis rouges.',
      'room.barricade.stat': 'Ralentissement ennemi :',
      'room.barricade.unit': 'Défense',
      'room.barricade.btn': "Renforcer l'Entrée",

      'room.fungus.name': 'Champignonnière Souterraine',
      'room.fungus.desc': "Culture de champignons symbiotiques. Produit de la nourriture même pendant le gel d'hiver.",
      'room.fungus.stat': 'Production constante :',
      'room.fungus.btn': 'Cultiver Champignons',

      // Expéditions
      'exp.header.title': 'Expéditions & Opérations Militaires',
      'exp.header.desc': 'Composez votre escouade, choisissez la doctrine de combat et lancez vos troupes à la conquête de la surface.',
      'exp.squad.title': "🛡️ Composition de l'Escouade",
      'exp.squad.mobilized': 'Forces :',
      'exp.squad.power': 'Puissance :',
      'exp.squad.tanks': '🛡️ Tanks',
      'exp.squad.warriors': '⚔️ Guerrières',
      'exp.squad.scouts': '⚡ Éclaireuses',
      'exp.doctrine.label': 'Doctrine Tactique :',
      'exp.active.title': '⚔️ Expédition en cours :',
      'exp.recall.btn': 'Rappeler',
      'doctrine.balanced.chip': '⚖️ Équilibrée',
      'doctrine.turtle.chip': '🛡️ Formation Tortue (Défense & Survie)',
      'doctrine.rush.chip': '⚡ Assaut Mandibules (Attaque Rapide)',
      'doctrine.acid.chip': '🧪 Bombardement Acide (Distance)',
      'doctrine.balanced.name': 'Équilibrée',
      'doctrine.turtle.name': 'Formation Tortue',
      'doctrine.rush.name': 'Assaut Mandibules',
      'doctrine.acid.name': 'Bombardement Acide',

      'risk.label': 'Difficulté :',
      'chance.label': 'Victoire :',
      'loot.label': 'Butin :',
      'risk.low': 'Faible',
      'risk.medium': 'Moyen',
      'risk.high': 'Élevé',
      'loot.larvae': '+{count} Larve(s)',
      'mission.deploy.btn': "Déployer l'Escouade",

      'mission.pucerons.name': 'Piller un Rosier à Pucerons',
      'mission.pucerons.short': 'Rosier à Pucerons',
      'mission.pucerons.desc': 'Gisement de miellat sucré gardé par de petites coccinelles.',
      'mission.chenille.name': 'Chasser une Chenille Égarée',
      'mission.chenille.short': 'Chasse à la Chenille',
      'mission.chenille.desc': 'Une proie massive et grasse. Nécessite des Tanks pour la maintenir au sol.',
      'mission.fourmis_rouges.name': 'Raid sur Avant-Poste Fourmis Rouges',
      'mission.fourmis_rouges.short': 'Raid Fourmis Rouges',
      'mission.fourmis_rouges.desc': 'Bataille territoriale sanglante contre une colonie rivale féroce.',

      // Mutations
      'mut.header.title': 'Arbre Génétique & Phéromones',
      'mut.header.desc': 'Dépensez vos phéromones pour doter vos castes de mutations permanentes.',
      'mut.unlock.btn': 'Débloquer',
      'mut.unlocked.btn': 'Débloqué ✔',
      'mut.mandibules.name': 'Mandibules de Titane',
      'mut.mandibules.desc': 'Renforce la dureté de la chitine. +30% de dégâts pour toutes les Guerrières.',
      'mut.carapace.name': 'Carapace de Chitine Lourde',
      'mut.carapace.desc': 'Augmente la résistance des Tanks de +40 PV et absorbe 15% de dégâts en plus.',
      'mut.acide.name': "Glandes d'Acide Formique Concentré",
      'mut.acide.desc': "Permet aux guerrières de dissoudre les armures d'insectes à mi-distance.",

      // Journal
      'logs.header.title': 'Journal de la Colonie',
      'logs.header.desc': 'Chroniques des batailles, des découvertes et de la vie souterraine.',
      'log.init': 'La Reine a fondé la colonie. 6 ouvrières, 2 éclaireuses et 2 guerrières sont prêtes.',
      'log.ready': "La Reine s'est établie. La colonie attend vos ordres stratégiques.",
      'log.new_day': '🌅 Le Jour {day} se lève ({name}).',
      'log.season_change': '🍃 CHANGEMENT DE SAISON : {name} commence ({desc}) !',
      'log.starvation': '⚠️ FAMINE : La colonie manque de nourriture ! La Reine faiblit.',
      'log.auto_spawn': '🥚 Ponte royale : Une nouvelle ouvrière a éclos.',
      'log.no_food_ant': 'Nourriture insuffisante pour incuber cette caste.',
      'log.pop_cap': 'Capacité maximale de population atteinte ! Agrandissez les dortoirs.',
      'log.egg_queued': '🥚 Œuf de {name} placé en incubation dans la Nurserie ({sec}s).',
      'log.incubated': "🐣 Éclosion : 1 {name} rejoint la colonie !",
      'log.no_food_room': 'Pas assez de nourriture pour améliorer cette salle ({cost} 🍃 requis).',
      'log.room_up': '🏛️ Travaux terminés : {name} atteint le niveau {lvl} !',
      'log.doctrine_set': 'Doctrine tactique définie sur : {name}',
      'log.empty_squad': "⚠️ Vous devez affecter au moins une fourmi dans l'escouade avant de partir !",
      'log.exp_busy': 'Une escouade est déjà en mission à la surface.',
      'log.exp_start': "⚔️ L'escouade quitte le nid pour la mission : {name} ({dur}s de marche).",
      'log.exp_recalled': "🏳️ L'escouade a été rappelée au nid avant la fin de la mission.",
      'log.exp_win': "🏆 VICTOIRE SUR L'OBJECTIF : {name} ! Butin rapporté : +{food} 🍃, +{phero} 🧪{bonus}",
      'log.exp_bonus_workers': ', +{count} Ouvrière(s) issue(s) des larves volées',
      'log.exp_loss': "❌ ÉCHEC DE MISSION : L'ennemi était trop puissant sur {name}. Pertes : {losses} fourmi(s).",
      'log.raid_start': '🚨 INVASION : Une colonne de fourmis rouges pillardes attaque les galeries !',
      'log.raid_barricade': "🧱 Vos barricades ont ralenti l'assaut ennemi (-{abs} force).",
      'log.raid_win': '🛡️ DÉFENSE HÉROÏQUE : Vos Tanks et Guerrières ont massacré les envahisseurs !',
      'log.raid_loss': "💥 BRÈCHE DANS LE NID : L'ennemi a pillé {food} 🍃 et blessé nos gardiennes !",
      'log.no_phero': 'Phéromones insuffisantes ({cost} 🧪 requis).',
      'log.mut_already': 'Cette mutation a déjà été synthétisée.',
      'log.mut_unlocked': '🧬 MUTATION ACQUISE : {name} renforce toute la colonie !',

      // Canvas
      'canvas.room.queen': 'Chambre Royale',
      'canvas.room.granary': 'Grenier à Graines',
      'canvas.room.dorm': 'Dortoirs & Soldats',
      'canvas.room.fungus': 'Champignonnière',
      'canvas.room.nursery': 'Nurserie (Couvain)',
      'canvas.lvl.short': 'Niv.',
      'canvas.unbuilt': 'Non creusée',
      'canvas.raid.win': '🛡️ ASSAUT ENNEMI REPOUSSÉ !',
      'canvas.raid.loss': '💥 BRÈCHE DANS LES GALERIES !',
      'canvas.exp.banner': '⚔️ Expédition : {name} ({sec}s)'
    },

    en: {
      'app.title': 'Ant Empire - Colony Strategy',
      'brand.title': 'ANT EMPIRE',
      'brand.sub': 'Underground Strategy',
      'res.food.title': 'Food in stock (growth and upkeep)',
      'res.phero.title': 'Pheromone points (research and doctrines)',
      'res.pop.title': 'Current population (+ eggs) / Maximum capacity',
      'res.queen.title': 'Queen Health',
      'speed.pause': 'Pause game',
      'speed.1x': 'Normal speed',
      'speed.2x': '2x Speed',
      'speed.3x': '3x Speed',
      'lang.switch.title': 'Switch language (French / English)',
      'sound.toggle.title': 'Toggle sound effects',
      'reset.btn.title': 'Reset colony (New Game)',
      'reset.confirm': 'Are you sure you want to reset your colony and start over?',

      // Overlay, Seasons & Time
      'time.day': 'Day',
      'time.dawn': 'Dawn',
      'time.noon': 'Day',
      'time.dusk': 'Dusk',
      'time.night': 'Night',
      'season.spring': 'Spring',
      'season.summer': 'Summer',
      'season.autumn': 'Autumn',
      'season.winter': 'Winter',
      'season.spring.desc': 'Brood & Laying +30%',
      'season.summer.desc': 'Harvest +25%, Loot +15%',
      'season.autumn.desc': 'Loot +30%, Raids +15%',
      'season.winter.desc': 'Frost: Surface harvest -55%',
      'alert.raid': '⚠️ WARNING: Enemy raid approaching in {sec}s! Prepare your Tanks!',

      // Tabs
      'tab.nursery': 'Nursery & Army',
      'tab.rooms': 'Rooms & Tunnels',
      'tab.expeditions': 'Expeditions',
      'tab.mutations': 'Evolutions',
      'tab.logs': 'Logbook',
      'tab.mobile.nursery': 'Army',
      'tab.mobile.rooms': 'Rooms',
      'tab.mobile.expeditions': 'Missions',
      'tab.mobile.mutations': 'Evolution',
      'tab.mobile.logs': 'Logs',

      // Nursery & Castes
      'nursery.header.title': 'Incubation & Caste Ratios',
      'nursery.header.desc': 'Assign your eggs to balance economy, scouting, and military might.',
      'nursery.queue.title': '🥚 Incubating Brood',
      'nursery.queue.empty': 'No eggs incubating. Start incubating a caste below.',
      'caste.worker.name': 'Worker Ant',
      'caste.worker.short': 'Worker',
      'caste.worker.desc': 'Harvests food, digs chambers, and tends to the colony.',
      'caste.worker.stat1': 'Production:',
      'caste.worker.stat2': 'Upkeep:',
      'caste.worker.btn': 'Incubate Worker',

      'caste.scout.name': 'Scout Ant',
      'caste.scout.short': 'Scout',
      'caste.scout.desc': 'Fast and alert. Discovers expeditions and spots predators early.',
      'caste.scout.stat1': 'Speed:',
      'caste.scout.stat1.val': 'Very High',
      'caste.scout.stat2': 'Pheromones:',
      'caste.scout.btn': 'Incubate Scout',

      'caste.warrior.name': 'Warrior Ant',
      'caste.warrior.short': 'Warrior',
      'caste.warrior.desc': 'Razor-sharp mandibles and formic acid sprays. High damage.',
      'caste.warrior.stat1': 'Attack:',
      'caste.warrior.stat1.val': '36 Power',
      'caste.warrior.stat2': 'Defense:',
      'caste.warrior.stat2.val': '20 Bulwark',
      'caste.warrior.btn': 'Incubate Warrior',

      'caste.tank.name': 'Tank Ant (Major)',
      'caste.tank.short': 'Tank (Major)',
      'caste.tank.desc': 'Armored shield head. Absorbs heavy blows and protects the army.',
      'caste.tank.stat1': 'Hit Points:',
      'caste.tank.stat1.val': '220 HP',
      'caste.tank.stat2': 'Defense:',
      'caste.tank.stat2.val': '35 Bulwark',
      'caste.tank.btn': 'Incubate Tank',

      // Rooms
      'rooms.header.title': 'Chamber Excavations',
      'rooms.header.desc': 'Upgrade underground cavities to increase population, store surplus, and farm underground.',
      'room.lvl': 'Lvl.',
      'room.queen.name': 'Royal Chamber',
      'room.queen.desc': "The Queen's sanctuary. Speeds up automatic laying and brood incubation.",
      'room.queen.stat': 'Brood speed:',
      'room.queen.btn': 'Expand Chamber',

      'room.granary.name': 'Seed Granary',
      'room.granary.desc': 'Preserves harvested honeydew, seeds, and leaves safe from moisture.',
      'room.granary.stat': 'Max capacity:',
      'room.granary.btn': 'Expand Granary',

      'room.dorm.name': 'Colony Dormitories',
      'room.dorm.desc': 'Provides resting galleries to increase the maximum ant population.',
      'room.dorm.stat': 'Population cap:',
      'room.dorm.unit': 'Ants',
      'room.dorm.btn': 'Dig New Dormitories',

      'room.barricade.name': 'Entrance Barricade',
      'room.barricade.desc': 'Earth and twig fortification to hold back beetle and red ant assaults.',
      'room.barricade.stat': 'Enemy slowdown:',
      'room.barricade.unit': 'Defense',
      'room.barricade.btn': 'Fortify Entrance',

      'room.fungus.name': 'Underground Fungus Farm',
      'room.fungus.desc': 'Symbiotic mushroom cultivation. Produces steady food even during winter frost.',
      'room.fungus.stat': 'Steady output:',
      'room.fungus.btn': 'Cultivate Fungus',

      // Expeditions
      'exp.header.title': 'Expeditions & Military Operations',
      'exp.header.desc': 'Assemble your squad, choose a combat doctrine, and march your troops to conquer the surface.',
      'exp.squad.title': '🛡️ Squad Composition',
      'exp.squad.mobilized': 'Forces:',
      'exp.squad.power': 'Power:',
      'exp.squad.tanks': '🛡️ Tanks',
      'exp.squad.warriors': '⚔️ Warriors',
      'exp.squad.scouts': '⚡ Scouts',
      'exp.doctrine.label': 'Tactical Doctrine:',
      'exp.active.title': '⚔️ Active Expedition:',
      'exp.recall.btn': 'Recall',
      'doctrine.balanced.chip': '⚖️ Balanced',
      'doctrine.turtle.chip': '🛡️ Turtle Formation (Defense & Survival)',
      'doctrine.rush.chip': '⚡ Mandible Rush (Fast Assault)',
      'doctrine.acid.chip': '🧪 Acid Barrage (Ranged)',
      'doctrine.balanced.name': 'Balanced',
      'doctrine.turtle.name': 'Turtle Formation',
      'doctrine.rush.name': 'Mandible Rush',
      'doctrine.acid.name': 'Acid Barrage',

      'risk.label': 'Difficulty:',
      'chance.label': 'Win Chance:',
      'loot.label': 'Loot:',
      'risk.low': 'Low',
      'risk.medium': 'Medium',
      'risk.high': 'High',
      'loot.larvae': '+{count} Larva(e)',
      'mission.deploy.btn': 'Deploy Squad',

      'mission.pucerons.name': 'Plunder Aphid Rosebush',
      'mission.pucerons.short': 'Aphid Rosebush',
      'mission.pucerons.desc': 'Rich deposit of sweet honeydew guarded by small ladybugs.',
      'mission.chenille.name': 'Hunt Stray Caterpillar',
      'mission.chenille.short': 'Caterpillar Hunt',
      'mission.chenille.desc': 'A massive, nutrient-rich prey. Requires Tanks to pin it down.',
      'mission.fourmis_rouges.name': 'Raid Red Ant Outpost',
      'mission.fourmis_rouges.short': 'Red Ant Raid',
      'mission.fourmis_rouges.desc': 'Fierce territorial battle against a ruthless rival colony.',

      // Mutations
      'mut.header.title': 'Genetic Tree & Pheromones',
      'mut.header.desc': 'Spend your pheromones to grant permanent genetic mutations to your castes.',
      'mut.unlock.btn': 'Unlock',
      'mut.unlocked.btn': 'Unlocked ✔',
      'mut.mandibules.name': 'Titanium Mandibles',
      'mut.mandibules.desc': 'Hardens chitin structure. +30% attack power for the entire army.',
      'mut.carapace.name': 'Heavy Chitin Carapace',
      'mut.carapace.desc': 'Increases Tank resilience by +40 HP and adds +15 combat power per Tank.',
      'mut.acide.name': 'Concentrated Formic Acid Glands',
      'mut.acide.desc': 'Allows Warriors to dissolve insect armor at mid-range (+12 power per Warrior).',

      // Logs
      'logs.header.title': 'Colony Logbook',
      'logs.header.desc': 'Chronicles of battles, discoveries, and underground life.',
      'log.init': 'The Queen founded the colony. 6 workers, 2 scouts, and 2 warriors are ready.',
      'log.ready': 'The Queen has settled in. The colony awaits your strategic orders.',
      'log.new_day': '🌅 Day {day} dawns ({name}).',
      'log.season_change': '🍃 SEASON CHANGE: {name} begins ({desc})!',
      'log.starvation': '⚠️ STARVATION: The colony is out of food! The Queen is weakening.',
      'log.auto_spawn': '🥚 Royal laying: A new worker has hatched.',
      'log.no_food_ant': 'Not enough food to incubate this caste.',
      'log.pop_cap': 'Maximum population capacity reached! Expand the dormitories.',
      'log.egg_queued': '🥚 {name} egg placed in Nursery incubation ({sec}s).',
      'log.incubated': '🐣 Hatching complete: 1 {name} joins the colony!',
      'log.no_food_room': 'Not enough food to upgrade this room ({cost} 🍃 required).',
      'log.room_up': '🏛️ Excavation complete: {name} reached level {lvl}!',
      'log.doctrine_set': 'Tactical doctrine set to: {name}',
      'log.empty_squad': '⚠️ You must assign at least one ant to the squad before departing!',
      'log.exp_busy': 'A squad is already on a surface expedition.',
      'log.exp_start': '⚔️ The squad leaves the nest for mission: {name} ({dur}s march).',
      'log.exp_recalled': '🏳️ The squad was recalled to the nest before completing the mission.',
      'log.exp_win': '🏆 OBJECTIVE CONQUERED: {name}! Loot brought back: +{food} 🍃, +{phero} 🧪{bonus}',
      'log.exp_bonus_workers': ', +{count} Worker(s) from captured larvae',
      'log.exp_loss': '❌ MISSION FAILED: The enemy was too strong at {name}. Losses: {losses} ant(s).',
      'log.raid_start': '🚨 INVASION: A column of marauding red ants is attacking the galleries!',
      'log.raid_barricade': '🧱 Your barricades slowed down the enemy assault (-{abs} strength).',
      'log.raid_win': '🛡️ HEROIC DEFENSE: Your Tanks and Warriors crushed the invaders!',
      'log.raid_loss': '💥 NEST BREACHED: The enemy plundered {food} 🍃 and wounded our guards!',
      'log.no_phero': 'Not enough pheromones ({cost} 🧪 required).',
      'log.mut_already': 'This mutation has already been synthesized.',
      'log.mut_unlocked': '🧬 MUTATION ACQUIRED: {name} strengthens the entire colony!',

      // Canvas
      'canvas.room.queen': 'Royal Chamber',
      'canvas.room.granary': 'Seed Granary',
      'canvas.room.dorm': 'Dorms & Soldiers',
      'canvas.room.fungus': 'Fungus Farm',
      'canvas.room.nursery': 'Nursery (Brood)',
      'canvas.lvl.short': 'Lvl.',
      'canvas.unbuilt': 'Unexcavated',
      'canvas.raid.win': '🛡️ ENEMY RAID REPELLED!',
      'canvas.raid.loss': '💥 GALLERIES BREACHED!',
      'canvas.exp.banner': '⚔️ Expedition: {name} ({sec}s)'
    }
  }
};

// Fonction utilitaire globale de traduction avec remplacement de variables {param}
window.t = function(key, params = {}) {
  const lang = (typeof gameState !== 'undefined' && gameState.lang) ? gameState.lang : GAME_CONFIG.INITIAL_STATE.lang;
  const dict = GAME_CONFIG.I18N[lang] || GAME_CONFIG.I18N.fr;
  let str = dict[key] !== undefined ? dict[key] : (GAME_CONFIG.I18N.fr[key] || key);

  Object.keys(params).forEach(k => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
  });
  return str;
};
