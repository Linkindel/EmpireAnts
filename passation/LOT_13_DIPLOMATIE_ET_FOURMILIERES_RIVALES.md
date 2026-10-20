# 🏴 Lot 13 : Diplomatie & Guerres de Fourmilières Rivales

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 7, 11 et 12 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 13
Donner vie aux territoires extérieurs en peuplant les Anneaux de **Fourmilières et Citadelles d'Insectes Rivales** dynamiques. Tout s'appuie sur les systèmes existants (`FACTIONS`, `resolveCombat`, `OUTPOSTS`, `RESOURCES`, `computeModifiers`), sans créer de moteur de combat ni de monnaie parallèle.

---

## 📋 Spécifications Détaillées

### 1. Registre des Colonies Rivales (`GAME_CONFIG.RIVAL_COLONIES`)
- 4 Empires rivaux majeurs associés aux factions du Lot 4 :
  1. **Hégémonie Solenopsis** (*Fourmis de Feu* — agressive, riche en Silex et Obsidienne).
  2. **Ziggourat Macrotermes** (*Termites Blindés* — défensive, riche en Brindilles et Chitine).
  3. **Conclave Acromyrmex** (*Coupe-Feuilles* — symbiotique, riche en Spores et Miellat).
  4. **Essaim Vespula** (*Guêpes Chasseuses* — pillard aérien, riche en Ambre et Phéromones).
- État persisté dans `gameState.rivals[rivalId]` : `{ relation: -100..+100, status: 'hostile' | 'neutral' | 'tributary' | 'allied' | 'annexed', strengthLevel }`.

### 2. Actions Diplomatiques & Militaires (`executeDiplomacyAction`)
- Fonction pure `executeDiplomacyAction(state, rivalId, actionType)` dans `game-world.js` :
  - **Émissaire Phéromonal** (coût en Phéromones 🧪 et Miellat 🍯) : augmente la relation (`+15`) et réduit la probabilité de raid de cette faction.
  - **Pacte Symbiotique** (si `relation >= 60`) : ouvre une route d'échange passive générant un bonus dans `getEconomyBreakdown` et `computeModifiers`.
  - **Raid Punitif / Siège de Fourmilière** : résolu par `resolveCombat` (Lot 4). En cas de victoire :
    - Option 1 — **Tribut Impérial** (`tributary`) : la colonie rivale verse un tribut périodique en ressources sans occuper de slot d'avant-poste.
    - Option 2 — **Guerre d'Annexion** (`annexed`) : convertit la capitale rivale en **Super-Avant-Poste** (Lot 11) doublant les caravanes de cet anneau.

### 3. Interface & Rendu
- Sous-panneau **Armée › Diplomatie** (`UI_PANELS` du Lot 3).
- Sur la Carte des Anneaux (Lot 7), les bastions rivaux affichent leur blason, leur jauge de relation et les chances de victoire (`previewCombatOdds`).
- SFX `treaty_signed` et `rival_conquered` ajoutés au registre `AUDIO`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `executeDiplomacyAction` pur et testé (bornes de relation `-100..+100`, coûts, résolution via `resolveCombat`).
- [ ] Tributs et pactes intégrés à `getEconomyBreakdown`, `computeModifiers` et au hors-ligne (`computeOfflineProgress`).
- [ ] Sauvegardes migrées proprement (`SCHEMA_VERSION`).
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
