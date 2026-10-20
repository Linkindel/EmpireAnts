# 🧠 Lot 11 : Super-Colonie — Esprit de Ruche, Auto-Architecte, Avant-Postes & Merveilles

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 7 et 10 terminés  
> **Fusion de :** ancien Lot 10 (Automatisation & Merveilles) + Avant-Postes de l'ancien Lot 8  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 11
Faire passer le joueur de la micro-gestion à la **macro-stratégie** quand l'échelle devient immense : automatiser les gestes répétitifs grâce à l'**Esprit de Ruche** (dont l'**Auto-Architecte** qui alimente la file de chantiers en temps réel `buildQueue`), rentabiliser les territoires conquis avec des **Caravanes visuelles** et investir dans des projets géants qui consomment **toutes** les ressources du registre.

---

## 📋 Spécifications Détaillées

### 1. Esprit de Ruche (`GAME_CONFIG.HIVE_MIND`, `gameState.hiveMind`)
Modules débloqués avec de l'ADN Royal, chacun avec un interrupteur ON/OFF :
- **Auto-Incubateur** : maintient des ratios de castes cibles (y compris `nurse`) en gardant une réserve de nourriture de sécurité.
- **Auto-Architecte (`autoArchitect`)** : gère intelligemment la file d'attente de construction (`buildQueue`) : dès qu'un chantier s'achève et que les stocks dépassent un seuil de sécurité configurable, il lance automatiquement l'amélioration de la salle prioritaire choisie par le joueur (sans gaspillage de ressources).
- **Auto-Métiers** : rééquilibre les métiers des ouvrières (Lot 5) selon des priorités (et maintient l'*Harmonie Symbiotique*).
- **Patrouilles** : relance le dernier secteur gagné si la victoire est quasi certaine (`previewCombatOdds`) et qu'aucun raid n'est imminent.
- Tous les automates sont des **fonctions pures** `runAutomation(state, moduleId)` appelées par `gameTick` ; aucun ne peut provoquer de famine (garde-fou testé).

### 2. Avant-Postes (`GAME_CONFIG.OUTPOSTS`) & Caravanes Visuelles sur Canvas
- Sur chaque secteur conquis (anneaux, Lot 7) : **Avant-Poste de Récolte** ou **Tour de Guet**.
- Coût en Nourriture, Silex et Chitine ; affichage sur la Carte (**Armée › Carte**).
- **Caravanes d'Avant-Postes (Canvas)** : colonnes de fourmis porteuses chargées de ballots colorés (Feuilles, Silex, Chitine, Ambre) entrant périodiquement par le dôme.
- Les revenus des avant-postes sont inclus dans la progression hors-ligne (`computeOfflineProgress`).

### 3. Merveilles Souterraines (`GAME_CONFIG.WONDERS`)
Projets multi-paliers (niveaux $\infty$) consommant des ressources de **tous les Tiers** avec chantiers en temps réel bornés :
1. **Dôme Impérial de Chitine** (surface, position réservée `0.30, 0.15`) : défense globale.
2. **Arbre Fongique Bioluminescent** (surface, `0.70, 0.15`) : flux exponentiel de nourriture et de spores.
3. **Nexus Phéromonal** : renforce l'Esprit de Ruche et la vitesse globale de construction.
- Visibles et interactives sur le Canvas (`hitTestNode`), SFX `wonder_complete`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Auto-Architecte fonctionnel : approvisionne `buildQueue` sans jamais vider les stocks de sécurité (testé).
- [ ] Avant-postes intégrés au tick, au hors-ligne et représentés par des caravanes sur le Canvas.
- [ ] Merveilles constructibles par paliers avec timers bornés et rendues sur le Canvas.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
