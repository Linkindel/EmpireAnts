# ⚔️ Lot 4 : Caste Nourrice, Événements, Moteur de Combat Unifié & Difficulté Adaptative

> **Statut :** ✅ TERMINÉ (Socle livré — Enrichissements Difficulté Adaptative, Phéromones Tactiques & Simulateur intégrés)  
> **Date de complétion :** 20/10/2026  
> **Modèle :** 🧠 Gemini 4 Argon (High)  
> **Fichiers modifiés :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/combat.test.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/combat.test.js), [`tests/config.test.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/config.test.js), [`tests/game.test.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/game.test.js), [`tests/tests.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/tests.html).

---

## 🎯 Objectifs du Lot 4
Donner sa profondeur tactique au jeu avec **un seul moteur de combat** réutilisé par tous les lots suivants, couplé à un **Moteur de Difficulté Adaptative (`computeThreatIndex`)** garantissant que la montée en puissance de la colonie s'accompagne toujours d'une opposition stimulante sans jamais devenir triviale.

---

## 📋 Spécifications Détaillées

### 1. Moteur de Combat Unifié (`resolveCombat`) & Simulateur Prévisionnel (`previewCombatOdds`)
- Fonction **pure** `resolveCombat({ allies, enemy, doctrine, modifiers, rng })` → `{ victory, alliedPower, enemyPower, breakdown, losses, loot, biomassGenerated }`.
- Les raids (`triggerEnemyRaid`) et les expéditions (`resolveExpedition`) passent exclusivement par `resolveCombat`.
- **Simulateur de Chances de Victoire (`previewCombatOdds(state, missionOrEnemy)`)** : utilise `resolveCombat` en mode déterministe pour retourner le ratio de puissance, le contre de faction actif et l'évaluation du risque (`assured`, `balanced`, `risky`, `suicidal`) avant d'envoyer l'escouade.
- Agrégateur unique `computeModifiers(state)` dans [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js).

### 2. Difficulté Adaptative & Jauge d'Hostilité de l'Écosystème (`GAME_CONFIG.ADAPTIVE_DIFFICULTY`, `computeThreatIndex`)
- **Indice de Pression Écologique (`computeThreatIndex(state)`)** :
  - Calcule la menace réelle non pas uniquement sur le jour `day`, mais en fonction de la **puissance économique et militaire réelle de la colonie** (population, niveaux de salles, mutations, anneaux/strates conquis, prestiges).
  - Formule : $\text{Threat} = \text{Base}(day) \times (1 + \alpha \cdot \text{EmpirePower}^{\beta})$.
- **Échelons d'Hostilité Dynamique (`gameState.ecosystemAggro` : échelons 0 à 10)** :
  - Si le joueur repousse **3 raids consécutifs sans perte** (*Anti-Snowball*), `ecosystemAggro` augmente de `+1` : les raids suivants débloquent des **Prédateurs d'Élite** (*Carapace Renforcée*, *Essaim Furtif*, *Garde Royale Ennemie*) qui exigent d'adapter sa doctrine et ses contres, tout en offrant **+35 % de butin et de Biomasse par échelon**.
  - Si la colonie subit une défaite (*Amortisseur anti-blocage*), `ecosystemAggro` redescend de `-2` pour laisser le joueur se reconstruire sans spirale punitive.

### 3. Factions & Contres Tactiques (`GAME_CONFIG.FACTIONS`, `ENEMY_ARCHETYPES`)
- 3 factions ennemies, chacune avec un profil et une faiblesse :
  - **Fourmis de Feu** (attaque élevée) → contrées par les **Tanks** (+35% absorption).
  - **Termites Blindés** (armure élevée) → contrés par l'**Acide** des Guerrières (+50% perforation).
  - **Guêpes Chasseuses** (vitesse) → contrées par les **Éclaireuses** (+70% anti-embuscade).

### 4. Phéromones Tactiques d'Urgence (`GAME_CONFIG.TACTICAL_PHEROMONES`)
- Permet de dépenser une salve de **Phéromones 🧪** avant un raid ou une expédition (`activateTacticalPheromone(state, burstId)`) avec temps de recharge :
  - **Phéromone d'Alarme (`alarm_burst`)** : mobilise temporairement les ouvrières pour renforcer l'absorption de la Barricade (+40 % défense pendant le raid).
  - **Piste de Frénésie (`frenzy_burst`)** : stimule les mandibules des Guerrières et Tanks (+25 % puissance d'attaque temporaire).

### 5. Caste Nourrice (`nurse`), Événements à Choix & Rapport de Bataille
- Caste `nurse` : vitesse d'incubation +3% par nourrice (max +60%), soin de la Reine (+0.04 PV/s), synergie avec la Champignonnière (+5% par nourrice, max +100%).
- Registre `GAME_CONFIG.EVENTS` (5 événements bilingues à 2 choix, résolus par `resolveEventChoice`).
- Boss **Repaire de la Mante Royale** (`mantis_boss` → `trophy.mantis`) et panneau **Rapport de Bataille** (`#battleReportSection`).

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] Raids, missions et boss passent tous par `resolveCombat` (vérifié par test).
- [x] Contres de factions testés (avantage mesurable avec la bonne composition).
- [x] Caste `nurse` jouable, visible et intégrée à `computeModifiers`.
- [x] Événements à choix fonctionnels et 100 % bilingues.
- [x] **Jalon d'équilibrage I** : test de simulation montrant qu'un joueur actif peut battre la Mante en 30 à 60 min de jeu.
- [x] Couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
