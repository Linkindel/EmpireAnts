/**
 * Tests Unitaires & Robustesse - renderer.js
 * Couverture de l'initialisation Canvas, synchronisation des fourmis visuelles,
 * rendu des particules, scènes de raid, calculs de trajectoires et géométrie souterraine
 */

describe('Moteur Graphique - Initialisation Canvas & Environnement', function() {
  it('doit initialiser le Canvas et les éléments environnementaux', function() {
    initCanvas();
    assertNotNull(canvas, "canvas doit être défini");
    assertNotNull(ctx, "contexte 2D doit être disponible");
    assertTrue(stars.length > 0, "Les étoiles doivent être générées");
    assertTrue(snowflakes.length > 0, "Les flocons doivent être générés");
  });

  it('doit redimensionner le Canvas sans erreur via resizeCanvas()', function() {
    resizeCanvas();
    assertTrue(canvas.width > 0);
    assertTrue(canvas.height > 0);
  });
});

describe('Moteur Graphique - Fourmis Visuelles & Synchronisation', function() {
  it('doit synchroniser visualAnts avec la colonie via syncVisualAntsWithColony()', function() {
    gameState.ants = { worker: 8, scout: 2, warrior: 3, tank: 1 };
    syncVisualAntsWithColony();

    assertTrue(visualAnts.length > 0, "visualAnts doit contenir des entités");

    const counts = { worker: 0, scout: 0, warrior: 0, tank: 0 };
    visualAnts.forEach(function(a) {
      if (counts[a.caste] !== undefined) counts[a.caste]++;
    });

    assertTrue(counts.worker > 0);
    assertTrue(counts.scout > 0);
    assertTrue(counts.warrior > 0);
    assertTrue(counts.tank > 0);
  });

  it('doit borner le nombre maximal de fourmis visuelles selon GAME_CONFIG.CANVAS_THEME', function() {
    const maxWorker = GAME_CONFIG.CANVAS_THEME.maxVisualAntsPerCaste.worker;
    gameState.ants.worker = 100; // bien au-dessus de la limite visuelle
    syncVisualAntsWithColony();

    const visualWorkerCount = visualAnts.filter(function(a) { return a.caste === 'worker'; }).length;
    assertTrue(visualWorkerCount <= maxWorker, "Le nombre visuel d'ouvrières ne doit pas dépasser le plafond défini dans le thème");
  });
});

describe('Moteur Graphique - Particules & Effets Visuels', function() {
  it('doit générer des particules de combat via triggerCombatParticles()', function() {
    const prevCount = combatParticles.length;
    triggerCombatParticles(100, 100, 'red');

    assertTrue(combatParticles.length > prevCount, "Des particules de combat doivent avoir été ajoutées");
    const last = combatParticles[combatParticles.length - 1];
    assertNotNull(last);
    assertTrue(last.life > 0);
  });

  it('doit déclencher l\'effet visuel de ponte via triggerAntSpawnEffect()', function() {
    triggerAntSpawnEffect('worker');
    assertTrue(combatParticles.length > 0);
  });

  it('doit initialiser la scène visuelle de raid via triggerRaidVisuals()', function() {
    triggerRaidVisuals(true);
    assertTrue(raidScene.active, "La scène de raid doit être active");
    assertTrue(raidScene.victory, "La victoire doit être enregistrée");
    assertTrue(raidScene.enemies.length > 0, "Des ennemis doivent être créés");
  });
});

describe('Moteur Graphique - Boucle de Rendu & Robustesse du Dessin', function() {
  it('doit exécuter drawColonyScene() sans exception', function() {
    let errorThrown = false;
    try {
      drawColonyScene();
    } catch (e) {
      errorThrown = true;
    }
    assertFalse(errorThrown, "drawColonyScene() doit s'exécuter sans aucune erreur");
  });

  it('doit exécuter drawTunnelsAndChambers() et drawForegroundDetails() sans plantage', function() {
    let errorThrown = false;
    try {
      drawTunnelsAndChambers();
      drawForegroundDetails();
    } catch (e) {
      errorThrown = true;
    }
    assertFalse(errorThrown, "Les fonctions de dessin des galeries et détails doivent s'exécuter proprement");
  });
});
