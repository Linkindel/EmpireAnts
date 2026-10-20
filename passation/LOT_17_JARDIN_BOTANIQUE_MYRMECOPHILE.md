# 🌿 Lot 17 : Jardin Botanique Symbiotique & Plantes Myrmécophiles en Surface

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 2, 5, 10 et 15 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-ui.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-ui.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 17
Ancrer l'expansion de la colonie à la surface grâce à la **botanique myrmécophile réelle** (*Acacia à cornes*, *Myrmecodia*, *Passiflore à nectaires*) : faire pousser directement **au-dessus du dôme sur le Canvas** un **Grand Arbre Symbiotique** qui évolue visuellement sur 5 stades, soutient la logistique de la Super-Colonie et protège le nid contre les cataclysmes.

---

## 📋 Spécifications Détaillées

### 1. Registre des Plantes Myrmécophiles (`GAME_CONFIG.MYRMECOPHYTES`)
- Le joueur choisit et fait grandir une espèce végétale symbiotique (niveaux 1 → ∞, 5 stades visuels majeurs : *Germe*, *Pousse Épineuse*, *Arbuste à Domaties*, *Arbre Nectifère*, *Canopée Impériale*) irriguée en **Nourriture 🍃**, **Brindilles 🌿** et **Spores ✨** :
  1. **Acacia Cornigera (*Acacia à Cornes de Taureau*)** : ses épines creuses (*domaties*) augmentent `popCap` et ses épines défensives infligent des dégâts d'attrition aux raids et aux Léviathans avant même la Barricade.
  2. **Myrmecodia (*Plante-Fourmilière Tubéreuse*)** : ses cavités spongieuses amplifient la **Galerie à Pucerons** (+60 % Miellat 🍯) et l'**Harmonie Symbiotique** (Lot 5).
  3. **Passiflore Royale à Nectaires Extrafloraux** : sécrète un nectar riche qui réduit de 40 % l'**Entretien Logistique d'Empire** (`computeEmpireUpkeep` du Lot 5) et nourrit les Montures (Lot 9).

### 2. Réseau Racinaire Souterrain & Rendu Canvas (`renderer.js` / `renderer-effects.js`)
- Nouveau nœud interactif `symbiotic_tree` au sommet du dôme (`0.50, 0.14`) détecté par `hitTestNode` (Lot 2).
- **Rendu Canvas évolutif** :
  - En surface : tronc, épines, fleurs et feuillage qui grandissent selon le stade et réagissent au vent et aux saisons.
  - Sous terre : **racines vivantes** qui descendent encadrer les chambres souterraines (`queen`, `granary`, `aphid_farm`), réduisant de 35 % l'impact des **Grands Cataclysmes** (Mousson et Séisme du Lot 15).
- Sous-panneau **Colonie › Jardin Myrmécophile** (`UI_PANELS`).
- SFX `tree_grow` ajouté au registre `AUDIO`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Fonctions pures `plantMyrmecophyte(state, plantId)` et `upgradeMyrmecophyte(state)` testées et intégrées à `computeModifiers`.
- [ ] Nœud `symbiotic_tree` interactif via `hitTestNode` et rendu sur ses 5 stades visuels sans erreur.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
