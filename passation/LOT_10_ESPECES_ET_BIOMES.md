# 🐜 Lot 10 : Espèces Jouables Asymétriques, Biomes, Météo de Biome & Maîtrise d'Espèce

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 6 et 9 terminés  
> **Origine :** ancien Lot 9 (déplacé après l'exploration, l'atelier et les montures pour que chaque espèce puisse exploiter **tous** les systèmes existants)  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 10
Rendre chaque **Vol Nuptial** différent : le joueur choisit une **espèce** (style de jeu et trait signature) et un **biome** (règles d'environnement et ambiance climatique Canvas). Les espèces et biomes sont de **simples jeux de modificateurs** injectés dans `computeModifiers`, plus des palettes Canvas : aucun moteur parallèle.

---

## 📋 Spécifications Détaillées

### 1. Quatre Espèces (`GAME_CONFIG.SPECIES`) & Traits Signatures
| Espèce | Style | Systèmes exploités & Trait Signature |
| :--- | :--- | :--- |
| *Lasius niger* (Fourmi noire) | Équilibrée, polyvalente | Tous (+10 % général) ; *Résilience Urbaine* : coûts des salles −10 % |
| *Atta cephalotes* (Coupe-feuilles) | Symbiose fongique | Champignonnière et Spores +150 %, métier Cultivatrice ; *Jardin Royal* : les Spores nourrissent le couvain |
| *Eciton burchellii* (Légionnaire) | Conquête nomade | Guerrières/Tanks −25 % de coût, anneaux ×2 plus rapides, butin +50 % ; *Bivouac de Guerre* : pertes réduites de 30 % |
| *Myrmecocystus* (Pot-de-miel) | Abondance & Réserves | Grenier ×2, Miellat +100 %, hiver adouci, montures nourries à moitié prix ; *Citernes Vivantes* : zéro famine tant que Miellat > 0 |
- Palette Canvas des fourmis adaptée à l'espèce (`SPECIES[x].palette`).
- *Lasius niger* est l'espèce par défaut (migration : les sauvegardes existantes deviennent *Lasius*).

### 2. Quatre Biomes (`GAME_CONFIG.BIOMES`) & Ambiances Visuelles Canvas
- **Prairie tempérée** (standard), **Jungle humide** (printemps/été renforcés, moussons, raids plus fréquents), **Désert d'ocre** (peu de feuilles, tempêtes de sable doré, strates riches en Silex/Obsidienne), **Taïga boréale** (hivers longs, aurores boréales nocturnes, ADN Royal et butin +50 %).
- Chaque biome fournit : modificateurs de saisons, palette de ciel/sol/herbe, effets météo dédiés dans `renderer-effects.js` et poids des factions dans `generateZone` (Lot 7).

### 3. Maîtrise d'Espèce (`gameState.speciesMastery`)
- Atteindre des jalons (anneau N, strate N) avec une espèce augmente son niveau de maîtrise (1 → ∞).
- Bonus passif **conservé entre les vies et partagé entre espèces** (fraction configurable).

### 4. Intégration au Vol Nuptial
- La modale de prestige (Lot 6) devient un assistant en 2 étapes : *Espèce* → *Biome*, avec un aperçu des modificateurs et des synergies conseillées.
- Le sous-panneau **Évolution › Dynastie** affiche la maîtrise de chaque espèce.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Espèces et biomes injectés **uniquement** via `computeModifiers` et `generateZone` (vérifié par test).
- [ ] Palettes Canvas et effets météo de biome appliqués dynamiquement.
- [ ] Maîtrise persistée et conservée au prestige.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).

## 🚫 Hors Périmètre (Idées reportées)
- Espèces supplémentaires : à ajouter plus tard comme simples entrées du registre `SPECIES`.
