# 🎨 Lot 2 : Rendu Canvas "Living World" & Interactivité Directe ("Game Feel")

> **Statut :** ✅ TERMINÉ  
> **Prérequis :** Lot 1 terminé  
> **Fichiers modifiés :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests.html), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 2
Transformer le Canvas 2D ([`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js)) d'une simple vitrine passive en un **monde vivant, organique et directement interactif** à la souris et au tactile, tout en respectant le flux unidirectionnel (`renderer.js` ne mute jamais directement `gameState`, il appelle des actions exposées par `game.js`).

---

## 📋 Spécifications Détaillées

### 1. Interactivité Directe sur le Canvas (Hover Tooltips & Clics)
- **Détection de survol (*Hit-testing*) générique des Nœuds** :
  - Implémenter une fonction **pure** `hitTestNode(px, py, nodes, canvasSize)` (testable sans DOM) qui parcourt **tout le registre** `GAME_CONFIG.CANVAS_THEME.nodes` (ellipse `rx/ry` pour les chambres, rayon `GAME_CONFIG.CANVAS_INTERACTION.nodeHitRadius` pour les autres nœuds). Aucune liste de salles codée en dur : les salles ajoutées aux Lots 5, 8, 9 et 11 deviendront interactives automatiquement.
  - Chaque nœud interactif déclare dans le registre son comportement (`interaction: 'room' | 'harvest' | 'info'`) et sa clé d'infobulle.
  - Détecter la position du curseur sur les chambres souterraines (`queen`, `granary`, `dorm`, `fungus`, `nursery`), la `barricade` et les zones de récolte en surface (`surface_left`, `surface_right`).
  - Dessiner un halo de sélection organique autour de la salle survolée et afficher un **panneau d'infobulle graphique Canvas** bilingue (Nom de la salle, Niveau actuel, Production/Effet, Coût d'amélioration et indication *"Clic : Améliorer / Ouvrir"*).
- **Actions au Clic sur le Canvas** :
  - Cliquer sur une chambre souterraine déclenche une action dédiée dans `game.js` (ex: bascule vers l'onglet correspondant et met en évidence la carte de la salle, ou l'améliore si le joueur maintient `Shift` / double-clique).
  - **Récolte Manuelle Active en Surface** : Cliquer sur les dépôts de feuilles en surface (`surface_left` ou `surface_right`) appelle une action `harvestSurfaceDeposit()` dans `game.js` qui accorde un petit bonus de nourriture (`GAME_CONFIG.ECONOMY.manualHarvestFood`), avec un temps de recharge visuel, un son dédié et une gerbe de particules.

### 2. Pistes de Phéromones Bioluminescentes & Atmosphère Souterraine
- Dessiner dans les galeries (`edges`) des **flux de phéromones lumineux** (particules ou pointillés sinusoïdaux doux) dont la densité et l'éclat dépendent du nombre d'éclaireuses et d'ouvrières actives.
- Ajouter des spores flottantes bioluminescentes dans la Champignonnière lorsqu'elle est débloquée (`rooms.fungus > 0`).

### 3. Météo Saisonnière Dynamique sur la Surface
- **Printemps (`spring`)** : Grains de pollen dorés flottants dans l'air et fleurs sauvages sur l'herbe.
- **Été (`summer`)** : Lucioles scintillantes à la tombée de la nuit et rayons de soleil chauds le jour.
- **Automne (`autumn`)** : Feuilles mortes orangées qui tombent en tourbillonnant avec le vent.
- **Hiver (`winter`)** : Couche de givre sur le dôme de la fourmilière et flocons de neige existants enrichis.

### 4. Feedback Visuel "Juice" (Textes Flottants & Screen Shake)
- Système de **Textes Flottants (`floatingTexts`)** dans `renderer.js` (déclenchable via `window.spawnCanvasFloatingText(nodeId, text, color)`) :
  - Affiche `+X 🍃` sur le grenier ou en surface, `+1 🐜` sur la nurserie à l'éclosion, `+Niv. X` lors d'une amélioration de salle, et les dégâts/absorptions sur la barricade lors d'un raid.
- **Screen Shake contrôlé** : Léger tremblement d'impact amorti (15-20 frames) lorsque les fourmis rouges percutent la barricade ou la chambre royale lors d'un raid.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] Survol et clic fonctionnels sur toutes les chambres et dépôts de surface du Canvas (Desktop & Mobile touch).
- [x] `hitTestNode` pur, piloté par le registre de nœuds, testé unitairement (intérieur/extérieur d'ellipse, nœud non construit, canvas de taille nulle).
- [x] Tous les nouveaux tokens visuels et de récolte manuelle sont dans `GAME_CONFIG` (zéro nombre magique).
- [x] Parité FR/EN complète pour les infobulles Canvas et messages de récolte.
- [x] Nouveaux tests unitaires ajoutés (ex: `harvestSurfaceDeposit`, hit-testing mathématique) avec couverture globale $\ge 80\%$.
- [x] Mise à jour de [`passation/ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).

---

## 🚫 Hors Périmètre (Idées reportées)
- Sons dédiés : le son de récolte utilise le synthétiseur existant ; le moteur audio complet (`GAME_CONFIG.AUDIO`) arrive au **Lot 3**.
- Nouvelles chambres Canvas : réservées aux Lots 5, 8, 9 et 11 (voir le plan d'implantation dans la roadmap).
