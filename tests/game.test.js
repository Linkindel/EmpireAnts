/**
 * Tests Unitaires & Intégration - game.js
 * Couverture de la logique métier, cycle de vie, calculs économiques, incubation,
 * aménagement des salles, escouades, combats, expéditions, raids et sauvegarde
 */

describe('Moteur de Jeu - État Initial & Fonctions d\'Aide', function() {
  it('doit pouvoir créer un état initial propre via createFreshGameState()', function() {
    const fresh = createFreshGameState();
    assertNotNull(fresh);
    assertEqual(fresh.food, GAME_CONFIG.INITIAL_STATE.food);
    assertEqual(fresh.pheromone, GAME_CONFIG.INITIAL_STATE.pheromone);
    assertEqual(fresh.queenHealth, 100);
    assertEqual(fresh.ants.worker, 6);
    assertEqual(fresh.eggs.length, 0);
    assertFalse(fresh.raidActive);
  });

  it('doit calculer la population totale avec getTotalPop()', function() {
    const origAnts = { ...gameState.ants };
    gameState.ants = { worker: 10, scout: 3, warrior: 4, tank: 2 };

    assertEqual(getTotalPop(), 19);

    gameState.ants = { worker: 0, scout: 0, warrior: 0, tank: 0 };
    assertEqual(getTotalPop(), 0);

    gameState.ants = origAnts;
  });

  it('doit calculer le plafond de population getPopCap() selon les dortoirs', function() {
    const origDorm = gameState.rooms.dorm;
    gameState.rooms.dorm = 0;
    assertEqual(getPopCap(), GAME_CONFIG.ECONOMY.basePopCap);

    gameState.rooms.dorm = 2;
    assertEqual(getPopCap(), GAME_CONFIG.ECONOMY.basePopCap + 2 * GAME_CONFIG.ROOMS.dorm.popCapPerLevel);

    gameState.rooms.dorm = origDorm;
  });

  it('doit calculer la population réservée getReservedPop() incluant les œufs', function() {
    const origAnts = { ...gameState.ants };
    const origEggs = [...gameState.eggs];

    gameState.ants = { worker: 5, scout: 1, warrior: 1, tank: 1 };
    gameState.eggs = [{ caste: 'worker' }, { caste: 'warrior' }];

    assertEqual(getReservedPop(), 8 + 2);

    gameState.ants = origAnts;
    gameState.eggs = origEggs;
  });
});

describe('Moteur de Jeu - Économie & Calculs de Ressources', function() {
  it('doit calculer getNetFoodPerSec() en fonction des ouvrières, des salles et des castes', function() {
    const origAnts = { ...gameState.ants };
    const origRooms = { ...gameState.rooms };
    const origDay = gameState.day;

    // Jour 1 = Printemps (workerFoodMultiplier = 1.0)
    gameState.day = 1;
    gameState.ants = { worker: 10, scout: 0, warrior: 0, tank: 0 };
    gameState.rooms = { queen: 1, granary: 1, dorm: 1, barricade: 0, fungus: 0 };

    // Prod: 10 * 0.55 = 5.5. Conso: 10 * 0.08 = 0.8. Net: 4.7
    const netFood = getNetFoodPerSec();
    assertAlmostEqual(netFood, 4.7, 0.01);

    // Ajout d'une champignonnière niveau 2 (+2.4 food/s)
    gameState.rooms.fungus = 2;
    assertAlmostEqual(getNetFoodPerSec(), 4.7 + 2.4, 0.01);

    // Ajout d'un tank (conso pop 0.08 + extraUpkeep 0.12 = 0.20)
    gameState.ants.tank = 1;
    assertAlmostEqual(getNetFoodPerSec(), 7.1 - 0.20, 0.01);

    gameState.ants = origAnts;
    gameState.rooms = origRooms;
    gameState.day = origDay;
  });

  it('doit calculer le gain de phéromones getPheromoneGainPerSec()', function() {
    const origAnts = { ...gameState.ants };
    gameState.ants = { worker: 0, scout: 2, warrior: 0, tank: 0 };

    const expectedGain = GAME_CONFIG.ECONOMY.basePheromoneGain + (2 * GAME_CONFIG.CASTES.scout.pheroProd);
    assertAlmostEqual(getPheromoneGainPerSec(), expectedGain, 0.001);

    gameState.ants = origAnts;
  });

  it('doit calculer le multiplicateur de vitesse d\'incubation getIncubationSpeedMultiplier()', function() {
    const origRooms = { ...gameState.rooms };
    const origDay = gameState.day;

    gameState.day = 1; // Printemps (incubationSpeedMultiplier = 1.30)
    gameState.rooms.queen = 1; // Reine niv 1 -> bonus 0% -> queenBonus = 1
    assertAlmostEqual(getIncubationSpeedMultiplier(), 1.30, 0.001);

    gameState.rooms.queen = 3; // (3 - 1) * 0.20 = +0.40 -> queenBonus = 1.40 -> 1.40 * 1.30 = 1.82
    assertAlmostEqual(getIncubationSpeedMultiplier(), 1.82, 0.001);

    gameState.rooms = origRooms;
    gameState.day = origDay;
  });
});

describe('Moteur de Jeu - Puissance Militaire & Mutations', function() {
  it('doit calculer calculateSquadPower() sans mutations', function() {
    const squad = { tank: 1, warrior: 2, scout: 1, doctrine: 'balanced' };
    const origMutations = { ...gameState.mutations };
    gameState.mutations = { mandibules: false, carapace: false, acide: false };

    // tank: 28, warrior: 2 * 36 = 72, scout: 14 -> Total = 114
    const power = calculateSquadPower(squad);
    assertEqual(power, 114);

    gameState.mutations = origMutations;
  });

  it('doit appliquer les bonus des mutations sur la puissance de l\'escouade', function() {
    const squad = { tank: 1, warrior: 2, scout: 1, doctrine: 'balanced' };
    const origMutations = { ...gameState.mutations };

    // Mandibules (* 1.3)
    gameState.mutations = { mandibules: true, carapace: false, acide: false };
    // 114 * 1.3 = 148.2 -> arrondi 148
    assertEqual(calculateSquadPower(squad), 148);

    // Carapace (+15 par Tank)
    gameState.mutations = { mandibules: false, carapace: true, acide: false };
    assertEqual(calculateSquadPower(squad), 114 + 15);

    // Acide (+12 par Guerrière)
    gameState.mutations = { mandibules: false, carapace: false, acide: true };
    assertEqual(calculateSquadPower(squad), 114 + (2 * 12));

    gameState.mutations = origMutations;
  });

  it('doit appliquer les multiplicateurs de doctrine de combat', function() {
    const squad = { tank: 1, warrior: 2, scout: 0, doctrine: 'rush' };
    const origMutations = { ...gameState.mutations };
    gameState.mutations = { mandibules: false, carapace: false, acide: false };

    // Base: 28 + 72 = 100. Rush: * 1.25 -> 125
    assertEqual(calculateSquadPower(squad), 125);

    // Doctrine Acide: * 1.15 + (warriors * 8) -> 100 * 1.15 = 115 + 16 = 131
    squad.doctrine = 'acid';
    assertEqual(calculateSquadPower(squad), 131);

    gameState.mutations = origMutations;
  });
});

describe('Moteur de Jeu - Logique d\'Incubation & File d\'Œufs', function() {
  it('doit refuser l\'incubation si la nourriture est insuffisante', function() {
    const origFood = gameState.food;
    const origEggs = [...gameState.eggs];

    gameState.food = 2; // Prix min = 10 (worker)
    window.incubateAnt('worker');
    assertEqual(gameState.eggs.length, origEggs.length);
    assertEqual(gameState.food, 2);

    gameState.food = origFood;
    gameState.eggs = origEggs;
  });

  it('doit refuser l\'incubation si le plafond de population est atteint', function() {
    const origAnts = { ...gameState.ants };
    const origRooms = { ...gameState.rooms };
    const origFood = gameState.food;
    const origEggs = [...gameState.eggs];

    gameState.food = 200;
    gameState.rooms.dorm = 0; // Cap = 15
    gameState.ants = { worker: 15, scout: 0, warrior: 0, tank: 0 };
    gameState.eggs = [];

    window.incubateAnt('worker');
    assertEqual(gameState.eggs.length, 0);

    gameState.ants = origAnts;
    gameState.rooms = origRooms;
    gameState.food = origFood;
    gameState.eggs = origEggs;
  });

  it('doit ajouter un œuf à la file d\'incubation et déduire la nourriture', function() {
    const origFood = gameState.food;
    const origEggs = [...gameState.eggs];
    const origAnts = { ...gameState.ants };
    const origRooms = { ...gameState.rooms };

    gameState.food = 100;
    gameState.rooms.dorm = 3;
    gameState.ants = { worker: 2, scout: 1, warrior: 1, tank: 0 };
    gameState.eggs = [];

    window.incubateAnt('scout'); // coût 15
    assertEqual(gameState.food, 85);
    assertEqual(gameState.eggs.length, 1);
    assertEqual(gameState.eggs[0].caste, 'scout');
    assertEqual(gameState.eggs[0].totalTime, GAME_CONFIG.CASTES.scout.incubationSeconds);

    gameState.food = origFood;
    gameState.eggs = origEggs;
    gameState.ants = origAnts;
    gameState.rooms = origRooms;
  });
});

describe('Moteur de Jeu - Amélioration des Salles & Sauvegarde', function() {
  it('doit refuser l\'amélioration de salle si pas assez de nourriture', function() {
    const origFood = gameState.food;
    const origLvl = gameState.rooms.granary;

    gameState.food = 5;
    window.upgradeRoom('granary');
    assertEqual(gameState.rooms.granary, origLvl);

    gameState.food = origFood;
  });

  it('doit améliorer une salle, déduire le coût et appliquer les effets associés', function() {
    const origFood = gameState.food;
    const origMaxFood = gameState.maxFood;
    const origLvl = gameState.rooms.granary;

    gameState.food = 150;
    const expectedCost = GAME_CONFIG.ROOMS.granary.cost(origLvl);

    window.upgradeRoom('granary');
    assertEqual(gameState.rooms.granary, origLvl + 1);
    assertEqual(gameState.food, 150 - expectedCost);
    assertEqual(gameState.maxFood, origMaxFood + GAME_CONFIG.ROOMS.granary.storagePerLevel);

    gameState.food = origFood;
    gameState.maxFood = origMaxFood;
    gameState.rooms.granary = origLvl;
  });

  it('doit sauvegarder et restaurer l\'état sans altération', function() {
    gameState.food = 142;
    gameState.pheromone = 33;
    saveGame();

    // Modifier gameState
    gameState.food = 10;
    gameState.pheromone = 2;

    loadGame();
    assertEqual(gameState.food, 142);
    assertEqual(gameState.pheromone, 33);
  });
});

describe('Moteur de Jeu - Gestion de l\'Escouade & Doctrines', function() {
  it('doit ajuster les troupes de l\'escouade dans les limites disponibles', function() {
    gameState.ants.warrior = 5;
    gameState.squad.warrior = 0;

    window.adjustSquad('warrior', 1);
    assertEqual(gameState.squad.warrior, 1);

    window.adjustSquad('warrior', 4);
    assertEqual(gameState.squad.warrior, 5);

    // Ne doit pas dépasser le nombre de guerrières
    window.adjustSquad('warrior', 1);
    assertEqual(gameState.squad.warrior, 5);

    // Ne doit pas être négatif
    window.adjustSquad('warrior', -10);
    assertEqual(gameState.squad.warrior, 0);
  });

  it('doit changer la doctrine de combat', function() {
    window.setDoctrine('turtle');
    assertEqual(gameState.squad.doctrine, 'turtle');

    window.setDoctrine('acid');
    assertEqual(gameState.squad.doctrine, 'acid');
  });
});

describe('Moteur de Jeu - Expéditions & Résolution', function() {
  it('doit refuser le lancement d\'expédition avec une escouade vide', function() {
    gameState.squad = { tank: 0, warrior: 0, scout: 0, doctrine: 'balanced' };
    gameState.activeExpedition = null;

    window.launchExpedition('pucerons');
    assertEqual(gameState.activeExpedition, null);
  });

  it('doit lancer une expédition valide et permettre son rappel', function() {
    gameState.squad = { tank: 1, warrior: 2, scout: 1, doctrine: 'balanced' };
    gameState.activeExpedition = null;

    window.launchExpedition('pucerons');
    assertNotNull(gameState.activeExpedition);
    assertEqual(gameState.activeExpedition.id, 'pucerons');

    // Rappel d'expédition
    window.recallExpedition();
    assertEqual(gameState.activeExpedition, null);
  });

  it('doit résoudre victorieusement une expédition quand l\'armée est suffisante', function() {
    const origFood = gameState.food;
    const origPhero = gameState.pheromone;

    gameState.activeExpedition = {
      ...GAME_CONFIG.MISSIONS.pucerons,
      timer: 0,
      squadSnapshot: { tank: 2, warrior: 3, scout: 1, doctrine: 'balanced' }
    };

    resolveExpedition();
    assertEqual(gameState.activeExpedition, null);
    assertTrue(gameState.food > origFood, "La nourriture doit avoir augmenté grâce au butin");
    assertTrue(gameState.pheromone > origPhero, "Les phéromones doivent avoir augmenté");

    gameState.food = origFood;
    gameState.pheromone = origPhero;
  });
});

describe('Moteur de Jeu - Recherche de Mutations', function() {
  it('doit refuser la recherche si phéromones insuffisantes', function() {
    gameState.pheromone = 5;
    gameState.mutations.mandibules = false;

    window.researchMutation('mandibules'); // coût 25
    assertFalse(gameState.mutations.mandibules);
  });

  it('doit débloquer la mutation lorsque les ressources sont suffisantes', function() {
    gameState.pheromone = 50;
    gameState.mutations.mandibules = false;

    window.researchMutation('mandibules');
    assertTrue(gameState.mutations.mandibules);
    assertEqual(gameState.pheromone, 25);
  });
});

describe('Moteur de Jeu - Simulation du Temps & gameTick()', function() {
  it('doit progresser le temps et les ressources lors d\'un tick de jeu', function() {
    const prevTime = gameState.timeSeconds;
    const prevFood = gameState.food;
    gameState.speed = 1;

    gameTick();

    assertEqual(gameState.timeSeconds, prevTime + 1);
  });

  it('doit faire éclore les œufs dans la file d\'incubation', function() {
    const prevWorkers = gameState.ants.worker;
    gameState.eggs = [{ caste: 'worker', elapsed: 10, totalTime: 4 }];

    gameTick();

    assertEqual(gameState.ants.worker, prevWorkers + 1);
    assertEqual(gameState.eggs.length, 0);
  });
});
