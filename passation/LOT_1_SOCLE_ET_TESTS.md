# 🛠️ Lot 1 : Socle Senior SOLID, Temps Réel ($\Delta t$ + Hors-Ligne) & Suite de Tests ($\ge 80\%$)

> **Statut :** ✅ TERMINÉ (20/10/2026)  
> **Prérequis :** Aucun (Lot fondateur)  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css) + création du dossier `tests/`.

---

## 🎯 Objectifs du Lot 1
Asseoir les fondations techniques de niveau **Senior SOLID** exigées par [`architecture.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/architecture.md), [`quality.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/quality.md) et [`tests.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/tests.md) avant d'ajouter les nouvelles mécaniques visuelles et de gameplay des lots suivants.

---

## 📋 Spécifications Détaillées

### 1. Isolation des Fonctions Métier Pures & Exportabilité (`config.js` & `game.js`)
- Rendre `GAME_CONFIG` et les fonctions de calcul métier (`getTotalPop`, `getReservedPop`, `getPopCap`, `getNetFoodPerSec`, `getPheromoneGainPerSec`, `getIncubationSpeedMultiplier`, `calculateSquadPower`, `sanitizeGameState`, `computeOfflineProgress`, etc.) compatibles à la fois avec le navigateur (`window`) et avec l'environnement de test Node.js (`if (typeof module !== 'undefined' && module.exports)`).
- S'assurer qu'aucune fonction de calcul métier ne dépend en dur du DOM sans garde-fou (`if (typeof document === 'undefined') return`).

### 2. Persistance Défensive, `schemaVersion` & Import/Export (`game.js` & `config.js`)
- Ajouter `SCHEMA_VERSION: 2` dans `GAME_CONFIG` et `schemaVersion` + `lastSavedAt` (timestamp `Date.now()`) dans `gameState` et le payload de sauvegarde.
- Créer une fonction pure `sanitizeGameState(rawData, initialState)` qui réalise un **Deep Merge** sécurisé :
  - Conserve toutes les nouvelles clés introduites dans `INITIAL_STATE` si une ancienne sauvegarde est chargée.
  - Protège chaque valeur numérique contre `NaN`, `null`, `undefined`, `Infinity` ou les nombres négatifs invalides.
  - Garantit que l'escouade (`squad`) ne dépasse jamais les effectifs réels (`ants`).
- Ajouter dans l'interface (modale ou boutons dans l'en-tête / journal) :
  - **Exporter la sauvegarde** (copie dans le presse-papier ou modale d'export Base64/JSON).
  - **Importer une sauvegarde** (validation stricte du schéma avant écrasement, avec message d'erreur bilingue si le code est invalide).

### 3. Déterminisme Temporel ($\Delta t$) & Progression Hors-Ligne (*Offline Catch-up*)
- Ajouter dans `GAME_CONFIG.ECONOMY` :
  - `maxOfflineSeconds: 28800` (plafond de 8 heures hors-ligne).
  - `minOfflineReportSeconds: 15` (seuil minimum d'absence pour afficher un rapport de retour).
  - `offlineEfficiencyRatio: 0.75` (75 % d'efficacité de récolte hors-ligne).
- Au chargement (`loadGame`) ou au retour sur l'onglet (`visibilitychange`), calculer l'écart $\Delta t = \min(\text{maxOfflineSeconds}, \lfloor(\text{now} - \text{lastSavedAt}) / 1000\rfloor)$.
- Simuler proprement les gains passifs hors-ligne (nourriture nette positive, phéromones, avancement des œufs en incubation sans déclencher de raid destructeur en l'absence du joueur).
- Afficher une **bannière ou modale de Rapport Hors-Ligne** bilingue FR/EN indiquant le temps d'absence et les ressources produites.

### 4. Suite de Tests Automatisée Node.js ($\ge 80\%$ de couverture)
- Utiliser le runner de test natif de Node.js (`node --test` et `node --experimental-test-coverage` disponibles sous Node v24.20.0) ou un script de test dans `tests/game.test.js` et `package.json` (`npm test`).
- Couvrir à **$\ge 80\%$** :
  - Parité stricte du dictionnaire `GAME_CONFIG.I18N.fr` et `GAME_CONFIG.I18N.en` (test automatisé vérifiant que 100 % des clés FR existent en EN et inversement).
  - Tous les calculs économiques, coûts de salles, saisons, puissance d'escouade, doctrines, mutations, incubation, résolution d'expédition et de raid, `sanitizeGameState`, et progression hors-ligne.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] `npm test` s'exécute sans erreur et affiche une couverture $\ge 80\%$ sur la logique métier et la configuration (Atteint : `config.js` 100% lignes / 83.33% branches / 100% fonctions ; `game.js` 96.52% lignes / 84.30% branches / 95.51% fonctions).
- [x] Test automatique de parité `I18N.fr` == `I18N.en` au vert à 100 %.
- [x] Sauvegarde résiliente avec `schemaVersion`, Import/Export fonctionnel et Rapport Hors-Ligne opérationnel.
- [x] Mise à jour de [`passation/ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) (Lot 1 $\rightarrow$ `✅ TERMINÉ`, Lot 2 $\rightarrow$ Prochain Lot) et de [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
