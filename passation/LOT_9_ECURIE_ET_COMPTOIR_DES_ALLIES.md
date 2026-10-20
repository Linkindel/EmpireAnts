# 🐞 Lot 9 : Insectes Alliés — Écurie des Montures, Synergies & Comptoir de Troc

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 7 et 8 terminés  
> **Fusion de :** ancien Lot 15 (Domptage & Montures) + ancien Lot 16 (PNJ & Boutique, hors Lore → Lot 12)  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 9
Introduire les **autres insectes** comme partenaires de la colonie, selon deux relations crédibles en myrmécologie : la **domestication** (comme les fourmis éleveuses de pucerons) et le **commerce symbiotique**. Tout repose sur les systèmes existants : `resolveCombat`, `RECIPES`, `RESOURCES.amber`, `computeModifiers` et les Presets du Lot 8.

---

## 📋 Spécifications Détaillées

### 1. Écurie Impériale (`stables`) & Domptage
- Nouvelle salle dans `ROOMS` et nouveau nœud Canvas (position réservée `0.86, 0.86`). Le niveau fixe `maxMounts` et réduit l'entretien en Miellat.
- Recettes ajoutées au registre `RECIPES` (Lot 8) : **Filet de Soie**, **Appât Phéromonal**, **Selle de Chitine**.
- Après une victoire en exploration (Lot 7) avec un filet équipé : chance de capture, calculée par une fonction pure `computeCaptureChance(state, sector)` (bonus d'éclaireuses et d'appâts).

### 2. Bestiaire (`GAME_CONFIG.MOUNTS`), Synergies d'Équipement & Presets
| Monture | Caste | Effet (via `computeModifiers`) | Synergie avec Selles/Équipement (Lot 8) |
| :--- | :--- | :--- | :--- |
| Coccinelle Blindée 🐞 | Éclaireuse | Expéditions +50 % plus rapides, butin rare +30 % | + *Ailes de libellule* : esquive d'embuscade +25 % |
| Cloporte Cuirassé 🪨 | Ouvrière | Récolte et forage accrus | + *Chariot d'Écorce* : capacité de transport +40 % |
| Araignée-Loup 🕷️ | Guerrière | Attaque ennemie −25 % (toiles), venin | + *Mandibules d'Obsidienne* : dégâts critiques sur cibles entoilées |
| Scarabée Rhinocéros 🪲 | Tank | PV massifs, perce l'armure des Gardiens | + *Pavois de Chitine* : bonus Brise-Carapace contre les Gardiens |
| Bourdon Royal 🐝 | Nourrice | Pollinisation : nourriture +X % au printemps et en été | + *Sacoche de Soie* : Harmonie Symbiotique (Lot 5) +20 % |
- Intégration automatique des montures équipées dans les **Presets d'Escouade** (`equipmentPresets` du Lot 8).
- XP et niveau 1 → ∞ ; fusion de deux montures identiques → **rang étoilé ★** (les montures étoilées sont **conservées au Vol Nuptial**).
- Rendu Canvas : montures dans les enclos de l'écurie et fourmis montées pendant les raids.

### 3. Comptoir des Insectes Marchands (`GAME_CONFIG.MERCHANTS`)
- Monnaie : **Ambre 🟠 uniquement** (Lot 7). Pas de nouvelle monnaie.
- Vente des surplus de ressources contre de l'Ambre (taux décroissant anti-abus, token `sellRateDecay`).
- 4 marchands avec réputation (Novice → Maître) et offres débloquées par rang :
  - **Barnabé le Scarabée Doré** — ressources et extensions de stockage.
  - **Tisse-Lune l'Araignée** — soie, plans de recettes, filets et selles.
  - **Professeur Bombus** — cartes révélant des secteurs secrets (anneaux).
  - **Lumina la Luciole** — élixirs temporaires (récolte ×2, bouclier royal…).
- Fonction pure `executeTrade(state, merchantId, offerId)`.
- Sous-panneaux **Atelier › Écurie** et **Monde › Comptoir**.

### 4. Colporteur Cigale (Canvas)
- Apparition périodique en surface (`GAME_CONFIG.PEDDLER`), cliquable via `hitTestNode` (Lot 2) : 3 offres flash.
- SFX `tame`, `trade`, `peddler_arrive`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Capture, élevage, synergies équipement/monture et fusion étoilée fonctionnels et testés ; montures étoilées conservées au prestige.
- [ ] Comptoir fonctionnel en Ambre uniquement ; `executeTrade` pur et testé (solde insuffisant, rang insuffisant).
- [ ] Colporteur visible et interactif sur le Canvas.
- [ ] **Jalon d'équilibrage III** : l'Ambre a des sources et des puits équilibrés (simulation sans accumulation infinie inutile).
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).

## 🚫 Hors Périmètre (Idées reportées)
- Histoire, tablettes et Portail ancien (Lot 12, intégrés au Codex).
