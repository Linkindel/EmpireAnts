# 🧪 Lot 14 : Chimie des Phéromones & Pistes Interactives sur Canvas

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 2, 3, 5 et 6 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-ui.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-ui.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 14
Sublimer l'interactivité du **Canvas « Living World »** (Lot 2) en permettant au joueur de **connecter les chambres souterraines par des Pistes de Phéromones Bioluminescentes** (glisser-déposer d'un nœud à un autre ou sélection via le sous-panneau **Colonie › Laboratoire Phéromonal**).

---

## 📋 Spécifications Détaillées

### 1. Registre d'Alchimie Phéromonale (`GAME_CONFIG.PHEROMONE_TRAILS`)
- Chaque piste relie deux nœuds du graphe `CANVAS_THEME.nodes` (coût en Phéromones 🧪 et Spores ✨, durée configurable ou maintien automatique par l'Esprit de Ruche du Lot 11) :
  1. **Piste Royale Nourricière** (`queen` ↔ `nursery`) : +35 % vitesse d'incubation et ponte accélérée.
  2. **Piste Mycologique** (`granary` ↔ `fungus`) : +40 % rendement de la Champignonnière et des Spores.
  3. **Piste de Miellat Doré** (`granary` ↔ `aphid_farm`) : +40 % production de Miellat et +15 % Harmonie Symbiotique (Lot 5).
  4. **Piste de Garde Blindée** (`dorm` ↔ `barricade`) : +35 % régénération de barricade et +20 % défense lors des raids.
  5. **Piste des Foreuses** (`chitin_forge` ↔ `abyss_shaft`) : +30 % vitesse de forage des Abîmes (Lot 7).
- Tous les bonus passent **exclusivement** par `computeModifiers(state)` (Lot 4).

### 2. Tracé Interactif sur Canvas & Sous-Panneau Laboratoire
- Fonction pure `createPheromoneTrail(state, fromNodeId, toNodeId, trailType)` validant la connexion, le stock de Phéromones/Spores et le plafond de pistes actives (`maxActiveTrails`, augmenté par la branche génétique *Chimie Phéromonale* du Lot 6).
- **Interaction directe Canvas** : maintenir et glisser d'une chambre à une autre (souris ou tactile) ou cliquer depuis le sous-panneau **Colonie › Laboratoire Phéromonal** active la piste correspondante.
- **Rendu Visuel (`renderer-effects.js`)** : rubans lumineux animés le long des galeries reliant les deux chambres, avec particules colorées selon l'essence chimique et accélération visible des fourmis qui les empruntent.
- SFX `trail_cast` ajouté au registre `AUDIO`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `createPheromoneTrail` et l'expiration des pistes dans `gameTick` sont purs et testés.
- [ ] Bonus injectés dans `computeModifiers` et visibles dans `getEconomyBreakdown`.
- [ ] Rendu des pistes lumineuses sur le Canvas sans erreur (testé avec mock Canvas 2D).
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
