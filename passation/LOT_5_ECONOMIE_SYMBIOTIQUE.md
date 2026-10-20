# 🍯 Lot 5 : Économie Symbiotique, Chambre des Bâtisseuses, Chantiers Infinis & Paliers d'Ères

> **Statut :** ✅ TERMINÉ  
> **Modèle Recommandé :** ⚡ Gemini 3.8 Flash (High)  
> **Prérequis :** Lots 1 à 4 terminés  
> **Origine :** ancien Lot 7 + Profondeur Biologique + Écosystème des Bâtisseuses  
> **Fichiers modifiés :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`symbiosis.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/symbiosis.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-ui.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-ui.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`tests/symbiosis.test.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests/symbiosis.test.js).

---

## 🎯 Objectifs du Lot 5
Faire passer l'économie de 2 à 6 ressources, et déployer l'**Écosystème de Construction Infinie** : la nouvelle salle **Chambre des Bâtisseuses** (`masonry_hall`), l'accélération des chantiers par les ouvrières **Maçonnes**, le turbo au **Miellat**, les **Paliers d'Ères Architecturales** (niveaux 1 à $\infty$) ainsi que la **Thermorégulation du Dôme**, le **Compostage Fongique** et la **Trophallaxie Royale (Œufs Dorés)**.

---

## 📋 Spécifications Détaillées

### 1. Nouvelles Ressources (entrées du registre `RESOURCES`)
| Ressource | Tier | Source | Usages (ce lot → lots futurs) |
| :--- | :--- | :--- | :--- |
| Brindilles 🌿 `twigs` | T1 | Ouvrières maçonnes | Chantiers de salles, thermorégulation du dôme → recettes T1 (Lot 8), digues (Lot 15) |
| Miellat 🍯 `honeydew` | T1 | Galerie à Pucerons | Coup de collier aux chantiers, Trophallaxie Royale → génétique (Lot 6), montures (Lot 9) |
| Chitine 🪲 `chitin` | T3 | Maçonnes + Compostage de combat | Salles avancées, échafaudages → équipement (Lot 8), avant-postes (Lot 11) |
| Spores ✨ `spores` | T3 | Cultivatrices + Compostage fongique | Trophallaxie Royale → Mutations Tier III (Lot 6), pistes (Lot 14), Cordyceps (Lot 16) |

> ⚠️ La Chitine est définie **ici et uniquement ici**. Les Lots 8, 11 et 13 la consomment, sans la redéfinir.

### 2. Nouvelle Salle : « Chambre des Bâtisseuses » (`masonry_hall`) & Chantiers Simultanés
- Nouvelle salle dans `ROOMS` et nouveau nœud Canvas (position réservée `0.22, 0.65`, reliée à `dorm` et `granary`).
- Rôle central dans l'écosystème de construction infinie :
  - **Réduction des Délais** : $-12\%$ de temps de chantier par niveau ($T = T_0 \times 0.88^{\text{lvl}}$).
  - **Extension de la File d'Attente (`buildQueue`)** :
    - *Niveau 1* : 1 chantier actif + 2 en attente.
    - *Niveau 3* : **2 chantiers actifs simultanés** + 4 en attente.
    - *Niveau 5* : **3 chantiers actifs simultanés** + file infinie.
  - **Renfort Structurel** : augmente l'absorption de la Barricade contre les effondrements lors des raids.

### 3. Paliers Majeurs des Salles (« Ères Architecturales » — Niveaux 1 $\to$ $\infty$)
Chaque salle progresse sans plafond de niveau, avec des **bonus majeurs franchis à chaque palier** (`GAME_CONFIG.ROOM_MILESTONES`) :
- **Palier 10 (Excavation Maçonnée)** : $+25\%$ efficacité de base de la salle.
- **Palier 25 (Piliers de Chitine)** : Réduit de $20\%$ le coût d'entretien de la colonie.
- **Palier 50 (Crypte de Silex)** : Débloque un emplacement de Relique / Gemme locale.
- **Palier 100 (Architecture Abyssale)** : Multiplicateur $\times 2$ sur la production / capacité de la salle.
- **Palier 250 (Sanctuaire Cristallin)** : Génère passivement de l'Ambre 🟠 par heure.
- **Palier 500+ (Merveille Primordiale)** : Multiplicateur exponentiel global.

### 4. Métier « Maçonne » & Accélération Biologique
- Répartition des ouvrières : **Récolteuses** (nourriture), **Éleveuses** (miellat), **Cultivatrices** (spores et compostage), **Maçonnes** (brindilles, chitine et accélération des chantiers).
- **Accélération Dynamique des Chantiers** : chaque tranche de 5 ouvrières assignées au métier Maçonne augmente la vitesse de creusement des chantiers en cours de $+10\%$ (plafonné à $+150\%$).
- **Coup de Collier au Miellat (« Trophallaxis d'Urgence » — `boostConstructionWithHoney`)** : dépenser du Miellat 🍯 pour doubler la vitesse des chantiers pendant 5 minutes.

### 5. Galerie à Pucerons (`aphid_farm`) & Harmonie Symbiotique (`computeSymbiosisHarmony`)
- Nouvelle salle Canvas (`0.08, 0.44`, reliée à `granary`).
- Fonction pure `computeSymbiosisHarmony(state)` évaluant l'équilibre entre **Éleveuses**, **Cultivatrices** et **Nourrices** : octroie jusqu'à $+25\%$ vitesse d'incubation et $+20\%$ production organique.

### 6. Profondeur Biologique : Compostage, Thermorégulation & Trophallaxie
- **Compostage Fongique (`recycleCombatBiomass`)** : cadavres d'ennemis et pertes alliées convertis en Spores et Chitine.
- **Thermorégulation du Dôme (`setDomeVentilation` : `'open' | 'sealed'`)** : gestion du froid en hiver vs vitesse en été.
- **Trophallaxie Royale (`setQueenDiet`)** : Gelée de Miellat $\to$ chance d'**Œufs Dorés** (double éclosion).

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] Chambre des Bâtisseuses opérationnelle, avec réduction de délai et déblocage de chantiers simultanés (testé).
- [x] Paliers d'ères des salles (10, 25, 50, 100) testés et fonctionnels sans plafond de niveau.
- [x] Accélération par les Maçonnes et boost au Miellat purs et testés.
- [x] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
