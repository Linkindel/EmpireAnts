# ⛏️ Lot 8 : Atelier de Chitine — Artisanat, Outils d'Architecture & Équipement des Castes

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 5 et 7 terminés  
> **Fusion de :** ancien Lot 13 (Crafting) + ancien Lot 14 (Armurerie) + Atelier de Chitine de l'ancien Lot 7  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 8
Un **seul système d'objets** (*items*) pour l'artisanat, les outils d'exploration, les **outils d'architecture (réduction permanente des chantiers)** et l'équipement des castes, ancré dans l'univers des fourmis : les ouvrières façonnent épines, silex, chitine et obsidienne dans l'**Atelier de Chitine**. Les matériaux utilisés sont **exclusivement** ceux du registre `RESOURCES` (Lots 5 et 7), avec **Presets d'équipement** pour changer de configuration en un clic.

---

## 📋 Spécifications Détaillées

### 1. Salle « Atelier de Chitine » (`chitin_forge`)
- Nouvelle salle dans `ROOMS` et nouveau nœud Canvas (position réservée `0.92, 0.44`, relié à `dorm`). Son niveau débloque les Tiers de recettes (niv. 1 = T1 … niv. 5 = T5).
- Sous-panneau **Atelier › Forge** (registre `UI_PANELS`).

### 2. Recettes (`GAME_CONFIG.RECIPES`) & Matériaux par Tiers
- Matériaux = ressources existantes : T1 Brindilles/Miellat, T2 Silex, T3 Chitine/Spores, T4 Obsidienne, **T5 Cœur de Gardien 💠** (ajouté ici au registre, butin rare des Gardiens du Lot 7).
- Fonction pure `craftItem(state, recipeId)` → `{ ok, state, reason }`.

### 3. Outils d'Architecture & d'Exploration
- **Outils d'Architecture (Écosystème de Construction Infinie)** :
  - **Truelles de Chitine** : réduit les coûts en matériaux de tous les futurs chantiers de $15\%$.
  - **Cordages de Soie & Échafaudages Légers** : réduit la durée de base des chantiers de $20\%$.
  - **Pics de Silex Renforcés** : accélère le forage des Strates des Abîmes et l'excavation des grandes salles de $25\%$.
- **Outils d'Exploration (verrous & contre-aléas)** :
  - **Pioches de Mineuse** (Épine → Silex → Chitine → Obsidienne → Mythique) : **active le verrou `requiredToolTier`** des strates (Lot 7).
  - **Ponts de Soie** : franchissement des secteurs « crevasse » et neutralisation de l'aléa *Faille Crevassée* (Lot 7).
  - **Lanternes à Spores** : suppriment la pénalité d'exploration de nuit et convertissent l'aléa *Obscurité Abyssale* en bonus de butin (+15 %).
  - **Chariots d'Écorce** : multiplicateur de butin d'expédition.

### 4. Équipement des Castes (`gameState.equipment`) & Presets (`gameState.equipmentPresets`)
- 3 emplacements par caste (`weapon`, `armor`, `accessory`) pour `worker`, `scout`, `warrior`, `tank`, `nurse`. L'équipement s'applique **à toute la caste**.
- Panoplies (`GAME_CONFIG.EQUIPMENT`) : Faucille d'épine/silex (ouvrière), Prothèses mandibulaires en quartz/obsidienne (guerrière), Pavois d'écorce / Heaume de lucane (tank), Ailes de libellule (éclaireuse), Sacoche de soie (nourrice)…
- **Presets d'Équipement (`saveEquipmentPreset`, `applyEquipmentPreset`)** : 3 emplacements de profils rapides (*Exploration Éclair*, *Siège de Gardien*, *Récolte Lourde*).
- Amélioration +1 → +∞ (coût exponentiel). Tous les bonus passent par `computeModifiers`.

### 5. Rendu Canvas
- `drawAnt` affiche des détails visibles selon l'équipement de la caste.
- SFX `craft` et `upgrade_item` ajoutés au registre `AUDIO`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `craftItem`, `equipItem`, `upgradeEquipment`, `saveEquipmentPreset` et `applyEquipmentPreset` purs et testés.
- [ ] Outils d'architecture fonctionnels (réduction mesurée des coûts et temps de chantier dans `computeConstructionTime`).
- [ ] Verrou de pioche des strates et neutralisation des aléas actifs.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
