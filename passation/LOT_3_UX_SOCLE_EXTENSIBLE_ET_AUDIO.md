# 🖥️ Lot 3 : UX « Command Center », Socle Extensible, Chantiers en Temps Réel & Audio

> **Statut :** ✅ TERMINÉ  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 1 et 2 terminés (Validés)  
> **Fusion de :** ancien Lot 5 (UX) + ancien Lot 6 (Audio) + formateur de grands nombres + socle de chantiers temporels & découpage modulaire  
> **Fichiers créés/modifiés :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-ui.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-ui.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/lot3.test.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/lot3.test.js), [`tests.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests.html).

---

## 🎯 Objectifs du Lot 3
Poser **l'infrastructure transverse** dont dépendent tous les lots suivants : découpage modulaire strict (`< 2000 lignes`), registre de ressources, nombres lisibles à l'infini, navigation extensible, HUD analytique prédictif (ETA & Boussole d'Objectifs), **Socle des Chantiers en Temps Réel avec Plafond Asymptotique** (rattrapage hors-ligne intégré) et **Paysage Sonore Adaptatif WebAudio**.

---

## 📋 Spécifications Détaillées

### 0. Découpage Modulaire Proactif (`< 2000 lignes/fichier`)
- Maintenir **`i18n.js`** (dictionnaires bilingues `GAME_CONFIG.I18N.fr` et `GAME_CONFIG.I18N.en`) et extraire **`game-ui.js`** depuis [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js) : y loger la synchronisation DOM (`updateUI`), la navigation par panneaux (`UI_PANELS`), les raccourcis clavier (`KEYBINDINGS`) et le moteur WebAudio (`playSfx`, `updateAmbientSoundscape`).

### 1. Registre de Ressources Générique (`GAME_CONFIG.RESOURCES`)
- Déclarer chaque ressource comme une entrée de registre : `{ id, icon, tier, i18nKey, hasCap, hudVisible, unlockCondition }`.
- Migrer `food` et `pheromone` vers ce registre (avec synchronisation `gameState.resources`, rétrocompatibilité via `sanitizeGameState` + incrément de `SCHEMA_VERSION: 4`).
- Le HUD est **généré depuis le registre** : une ressource ajoutée aux Lots 5, 7 ou 8 apparaît automatiquement dès qu'elle est débloquée.

### 2. Formateur de Grands Nombres (`formatLargeNumber`)
- Fonction pure `formatLargeNumber(value, lang, notationMode)` consommant `GAME_CONFIG.NUMBER_FORMAT` (`K`, `M`, `B`, `T`, `Qa`, `Qi`, `Sx`, `Sp`, `Oc`, `No`, `Dc` puis notation scientifique `1.25e36`).
- Séparateur décimal selon la langue (FR : virgule, EN : point). Gestion de `NaN`, `Infinity` et des valeurs négatives.
- Appliqué à **tous** les compteurs, coûts et infobulles existants.

### 3. Socle des Chantiers en Temps Réel & Formule Asymptotique (`GAME_CONFIG.CONSTRUCTION`)
- Les salles ont désormais des niveaux progressifs construits via des chantiers en temps réel (`gameState.activeConstructions` et `gameState.buildQueue`) :
  - **Formule Asymptotique Bornée (`computeConstructionTime(roomKey, targetLvl, state)`)** :
    - $T(lvl) = T_{\text{base}} + (T_{\text{max}} - T_{\text{base}}) \times (1 - e^{-k \cdot lvl})$.
    - Plafond strict à 2h (7200s) pour ne jamais bloquer le joueur.
  - **Progression & Rattrapage Hors-Ligne Intégré (`computeOfflineProgress`)** : les chantiers progressent en temps réel pendant l'absence du joueur et s'achèvent sans perte.

### 4. Navigation Extensible par Panneaux (`GAME_CONFIG.UI_PANELS`)
- Registre `{ id, icon, i18nKey, parent, unlockCondition, order }` supportant des **sous-onglets** :
  - **Colonie** : Nurserie, Salles, Métiers & Bâtisseuses (Lot 5), Laboratoire Phéromonal & Immunité (Lot 14/16), Jardin Myrmécophile (Lot 17)
  - **Armée** : Escouade, Rapport de bataille (Lot 4), Carte & Abîmes (Lot 7), Diplomatie & Cités-Sœurs (Lot 13/18)
  - **Évolution** : Génétique, Hauts Faits, Dynastie
  - **Atelier** : Forge & Équipement (Lot 8), Écurie (Lot 9)
  - **Monde** : Comptoir (Lot 9), Codex & Cataclysmes (Lot 12/15)
  - **Journal**

### 5. HUD Analytique Prédictif (ETA), Boussole d'Objectifs (`getNextMilestoneGoal`) & Commandes Rapides
- Fonction pure `getEconomyBreakdown(state)` avec ETA (`timeToFull` / `timeToEmpty`).
- **Boussole d'Objectifs Dynamique (« Cap Impérial Actif » — `getNextMilestoneGoal(state)`)** :
  - Affiche en permanence **1 objectif court terme** et **1 défi majeur d'Acte** avec progression en %.
- **Épinglage d'Objectif (*Pin Target* — `gameState.pinnedTarget`)** : compte à rebours dynamique dans le HUD (`computeTargetEta`).
- Sélecteur d'incubation **×1 / ×5 / Max** et badges de notification (`computeTabBadges(state)`).
- Raccourcis clavier (`GAME_CONFIG.KEYBINDINGS`).

### 6. Options de Confort & Accessibilité (`gameState.settings`)
- `screenShakeEnabled`, `particleDensity` (`low` / `normal` / `high`), `numberNotation` (`standard` / `scientific`).

### 7. Moteur Audio Procédural & Paysage Sonore Adaptatif WebAudio (`GAME_CONFIG.AUDIO`)
- `playSfx(id)` avec variation de hauteur (*pitch jitter* ±4 %). SFX initiaux : `click`, `harvest`, `hatch`, `upgrade`, `raid_alert`, `victory`, `defeat`.
- **Paysage Sonore Adaptatif (`updateAmbientSoundscape(state)`)** : bourdonnement souterrain (bruit brun filtré passe-bas), modulation saisonnière et alertes de raids imminents.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] Aucun fichier du projet ne dépasse 2 000 lignes (`i18n.js`, `game-ui.js`, `renderer-effects.js` isolés).
- [x] `RESOURCES`, `UI_PANELS`, `NUMBER_FORMAT`, `MILESTONE_GOALS`, `KEYBINDINGS` et `AUDIO` sont des registres déclaratifs dans `GAME_CONFIG`.
- [x] `formatLargeNumber` testé de 0 à $10^{100}$, avec négatifs, `NaN`, `Infinity` et parité FR (virgule) / EN (point).
- [x] `getEconomyBreakdown` pur et testé avec assertion stricte `breakdown.food.net === getNetFoodPerSec(state)`.
- [x] `getNextMilestoneGoal`, `computeTargetEta` et `computeTabBadges` purs et testés.
- [x] Paysage sonore adaptatif WebAudio et `playSfx` testés.
- [x] Parité FR/EN complète (100%) et couverture de tests ≥ 80%.
- [x] Mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
