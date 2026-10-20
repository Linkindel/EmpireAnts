# 📋 Dossier de Passation Multi-Lots — Empire Fourmi (Roadmap v4.1 — 18 Lots)

> **Objectif :** Faire évoluer **Empire Fourmi** en **18 conversations distinctes (1 conversation = 1 Lot)** selon un ordre strictement guidé par les **dépendances techniques**, la **cohérence myrmécologique**, une **Difficulté Adaptative Anti-Snowball** et un **Écosystème de Chantiers Infinis aux Timers Bornés ($T \le 2\text{h}$)**, sans doublons ni systèmes parallèles.
>
> **Refonte v4.1 (20/10/2026) :** intégration des **Chantiers en Temps Réel Bornés** ($1 \to \infty$ avec plafond strict de 2h réductible par les Maçonnes et le Miellat), de la **Chambre des Bâtisseuses** (`masonry_hall`), des **Paliers d'Ères Architecturales** (tous les 25 niveaux), de la **Difficulté Adaptative (`computeThreatIndex`, `ecosystemAggro`, `getNextMilestoneGoal`)** et de l'**Acte VI (Lots 16 à 18 : Immunité Sociale & Cordyceps, Jardin Botanique Myrmécophile & Réseau des Cités-Sœurs / Léviathans)**.

---

## 🚀 Dual-Track Multi-Modèles : Lancer une Conversation pour un Lot

La roadmap est **séparée en 2 voies complémentaires** pour tirer parti de la force de chaque modèle :

1. 🧠 **Voie Haute Complexité (Gemini 4 Argon High)** :
   Réservée aux cœurs de simulation, calculs matriciels, formules exponentielles, difficulté adaptative, arbres génétiques, diplomatie IA, parasitologie, cataclysmes et Léviathans.
   * **Lots assignés** : **Lot 1**, **Lot 4**, **Lot 6**, **Lot 7**, **Lot 10**, **Lot 11**, **Lot 12**, **Lot 13**, **Lot 15**, **Lot 16**, **Lot 18**.
   * **Prompt à copier-coller dans une conversation avec Gemini 4 Argon (High)** :
     > **« Tu es configuré avec Gemini 4 Argon (High). Consulte CONTEXT.md et passation/ROADMAP_PASSATION.md. Identifie le prochain lot complexe assigné à Argon dont les dépendances sont prêtes, et exécute-le jusqu'à validation complète (zéro dette, aucun fichier >= 2000 lignes avec découpage modulaire si > 1500 lignes, tests >= 80%, parité FR/EN, mise à jour des documents). »**

2. ⚡ **Voie UI, Ergonomie & Immersion (Gemini 3.8 Flash High)** :
   Réservée au rendu Canvas interactif, chantiers temporels, paysage sonore WebAudio, gestion des sous-onglets, composants DOM, symbiose, recettes d'artisanat, pistes phéromonales et jardin botanique.
   * **Lots assignés** : **Lot 2**, **Lot 3**, **Lot 5**, **Lot 8**, **Lot 9**, **Lot 14**, **Lot 17**.
   * **Prompt à copier-coller dans une conversation avec Gemini 3.8 Flash (High)** :
     > **« Tu es configuré avec Gemini 3.8 Flash (High). Consulte CONTEXT.md et passation/ROADMAP_PASSATION.md. Identifie le prochain lot UI/ergonomie assigné à Flash dont les dépendances sont prêtes, et exécute-le jusqu'à validation complète (zéro dette, aucun fichier >= 2000 lignes avec découpage modulaire si > 1500 lignes, tests >= 80%, parité FR/EN, mise à jour des documents). »**

---

## 🧭 1. Vision du Jeu, Piliers & Chantiers Infinis Bornés

**Pitch :** *Vous êtes l'esprit d'une colonie de fourmis. Faites-la grandir sous terre, défendez-la, bâtissez des mégastructures aux niveaux infinis, maîtrisez la biologie souterraine, explorez un écosystème vivant qui réagit à votre puissance et fondez une confédération continentale de dynasties.*

| Pilier | Ce que cela signifie | Test de cohérence d'une nouvelle idée |
| :--- | :--- | :--- |
| 🐜 **Myrmécologie crédible** | Tout est vu à l'échelle d'une fourmi (insectes, champignons, plantes myrmécophiles, prédateurs). | *« Est-ce qu'une fourmi pourrait le faire / le vivre ? »* Sinon → rejet ou adaptation. |
| 🔁 **Boucle incrémentale claire** | Récolter → Bâtir → Défendre/Explorer → Évoluer → Prestige. | La fonctionnalité alimente-t-elle une étape de la boucle ? |
| 🏗️ **Chantiers infinis & Plafond temporel** | Niveaux infinis ($1 \to \infty$) mais **temps de chantier borné (max 2h-3h)**, réductible par les Maçonnes et le Miellat. | Le chantier dépasse-t-il 2h ? Si oui $\to$ formule asymptotique obligatoire ! |
| ⚖️ **Difficulté adaptative & Cap clair** | Le jeu ne devient jamais trop facile (*anti-snowball*) et affiche toujours le prochain objectif. | La montée en puissance du joueur est-elle équilibrée par une pression écologique et un palier suivant ? |

### 🏗️ L'Écosystème de Construction Infinie & Plafond Asymptotique
Pour garantir des **années de durée de vie** sans jamais tomber dans le piège mobile des chantiers de 7 jours :
1. **Courbe Asymptotique Bornée (`computeConstructionTime` — Lot 3)** :
   - $T(lvl) = T_{\text{base}} + (T_{\text{max}} - T_{\text{base}}) \times (1 - e^{-k \cdot lvl})$.
   - *Niveau 1* : 30s ; *Niveau 5* : 5m ; *Niveau 20* : 45m ; **Plafond absolu à 2h (7200s) au niveau 1000+**.
   - Réductible à **15-30 minutes** grâce aux Maçonnes (Lot 5), à la Chambre des Bâtisseuses et aux boosts au Miellat 🍯.
2. **Paliers d'Ères Architecturales (`ROOM_MILESTONES` — Lot 5)** :
   - Niveaux $1 \to \infty$ jalonnés de récompenses majeures tous les 25 niveaux :
     - *Palier 10* : $+25\%$ efficacité.
     - *Palier 25* : $-20\%$ entretien d'Empire.
     - *Palier 50* : Emplacement de relique dédié.
     - *Palier 100* : Multiplicateur $\times 2$.
     - *Palier 250* : Génération passive d'Ambre 🟠.
     - *Palier 500+* : Merveille Primordiale.
3. **Progression Hors-Ligne Intégrée (`computeOfflineProgress` — Lot 3)** :
   - Les chantiers continuent de creuser pendant l'absence et se concluent fièrement au retour du joueur.
4. **Vitesse de Reconstruction Décuplée par les Prestiges (Lots 6, 12)** :
   - L'ADN Royal et l'Essence de Gaïa permettent de reconstruire les 50 premiers niveaux en quelques minutes à chaque nouvelle vie pour repousser son record toujours plus loin.

---

## 📊 2. Tableau de Bord des 18 Lots

### Acte I — Fondations, Game Feel & Combat Adaptatif (Lots 1 à 4)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 1** | [`LOT_1_SOCLE_ET_TESTS.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_1_SOCLE_ET_TESTS.md) | 🧠 **Gemini 4 Argon (High)** | Architecture SOLID, $\Delta t$ réel + Hors-Ligne, Sauvegarde `schemaVersion` + Import/Export, Tests Node.js | `config.js`, `game.js`, `index.html`, `style.css`, `tests/` | ✅ TERMINÉ |
| **Lot 2** | [`LOT_2_CANVAS_LIVING_WORLD.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_2_CANVAS_LIVING_WORLD.md) | ⚡ **Gemini 3.8 Flash (High)** | Canvas interactif générique (`hitTestNode`), récolte manuelle, phéromones lumineuses, météo saisonnière, textes flottants & screen shake | `config.js`, `renderer.js`, `game.js` | ✅ TERMINÉ |
| **Lot 3** | [`LOT_3_UX_SOCLE_EXTENSIBLE_ET_AUDIO.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_3_UX_SOCLE_EXTENSIBLE_ET_AUDIO.md) | ⚡ **Gemini 3.8 Flash (High)** | **Infrastructure & Chantiers Réels Bornés (`i18n.js`, `game-ui.js`)** : registre `RESOURCES`, `formatLargeNumber`, `activeConstructions` & `buildQueue` ($T \le 2\text{h}$), sous-onglets `UI_PANELS`, HUD prédictif ETA + **Boussole (`getNextMilestoneGoal`)**, **Paysage Sonore Adaptatif WebAudio** | `config.js`, `i18n.js`, `game.js`, `game-ui.js`, `index.html`, `style.css` | ✅ TERMINÉ |
| **Lot 4** | [`LOT_4_CASTES_EVENEMENTS_ET_COMBAT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_4_CASTES_EVENEMENTS_ET_COMBAT.md) | 🧠 **Gemini 4 Argon (High)** | Caste `nurse`, événements à choix, **moteur de combat unifié** (`resolveCombat` dans `combat.js`), **Difficulté Adaptative (`computeThreatIndex`, `ecosystemAggro`)**, contres de factions, Boss Mante, simulateur & phéromones tactiques | `config.js`, `combat.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ✅ TERMINÉ |

### Acte II — Économie Biologique Profonde & Premier Prestige (Lots 5 à 6)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 5** | [`LOT_5_ECONOMIE_SYMBIOTIQUE.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_5_ECONOMIE_SYMBIOTIQUE.md) | ⚡ **Gemini 3.8 Flash (High)** | Ressources (6 ressources), **Chambre des Bâtisseuses (`masonry_hall`)**, ouvrières Maçonnes, **Paliers d'Ères Architecturales (1 à $\infty$)**, boost Miellat, Galerie à Pucerons, **Harmonie Symbiotique**, **Compostage**, **Thermorégulation** & **Trophallaxie Royale** | `config.js`, `symbiosis.js`, `combat.js`, `game-ui.js`, `game.js`, `renderer.js`, `index.html`, `style.css`, `tests/symbiosis.test.js` | ✅ TERMINÉ |
| **Lot 6** | [`LOT_6_GENETIQUE_HAUTS_FAITS_ET_VOL_NUPTIAL.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_6_GENETIQUE_HAUTS_FAITS_ET_VOL_NUPTIAL.md) | 🧠 **Gemini 4 Argon (High)** | Arbre génétique 3 branches, Hauts Faits, **Prestige 1 : Vol Nuptial (ADN Royal)** + **Planificateur de paliers** + jalon « v1.0 jouable » | `config.js`, `i18n.js`, `evolution.js`, `game-ui.js`, `game.js`, `combat.js`, `index.html`, `style.css`, `tests/` | ✅ TERMINÉ |

### Acte III — Exploration Infinie, Scaling Anti-Snowball & Artisanat (Lots 7 à 9)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 7** | [`LOT_7_EXPLORATION_INFINIE_ANNEAUX_ET_ABIMES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_7_EXPLORATION_INFINIE_ANNEAUX_ET_ABIMES.md) | 🧠 **Gemini 4 Argon (High)** | Générateur procédural (`game-world.js`) : **Anneaux** + **Strates des Abîmes**, **Tier Gates super-exponentiels**, **Ponts Vivants d'Ouvrières**, **Aléas de strates**, Gardiens, **Ambre** & Reliques | `config.js`, `game-world.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ✅ TERMINÉ |
| **Lot 8** | [`LOT_8_ATELIER_CRAFTING_ET_EQUIPEMENT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_8_ATELIER_CRAFTING_ET_EQUIPEMENT.md) | ⚡ **Gemini 3.8 Flash (High)** | Salle **Atelier de Chitine**, matériaux par Tiers, **Outils d'Architecture (réduction permanente des chantiers)**, recettes, équipement des castes (3 slots) + **Presets rapides** | `config.js`, `game-world.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ⏳ À FAIRE |
| **Lot 9** | [`LOT_9_ECURIE_ET_COMPTOIR_DES_ALLIES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_9_ECURIE_ET_COMPTOIR_DES_ALLIES.md) | ⚡ **Gemini 3.8 Flash (High)** | **Insectes alliés** : Écurie & montures domptées + **Synergies Monture/Équipement** + Comptoir des marchands (troc en Ambre) & Colporteur Cigale | `config.js`, `game-world.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ⏳ À FAIRE |

### Acte IV — Méta-Progression & Super-Colonie (Lots 10 à 12)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 10** | [`LOT_10_ESPECES_ET_BIOMES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_10_ESPECES_ET_BIOMES.md) | 🧠 **Gemini 4 Argon (High)** | 4 Espèces asymétriques (+ traits signatures) + 4 Biomes (+ météo de biome Canvas) choisis au Vol Nuptial, Maîtrise d'Espèce | `config.js`, `game.js`, `renderer.js`, `renderer-effects.js`, `index.html`, `style.css` | ⏳ À FAIRE |
| **Lot 11** | [`LOT_11_SUPERCOLONIE_AUTOMATISATION_ET_MERVEILLES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_11_SUPERCOLONIE_AUTOMATISATION_ET_MERVEILLES.md) | 🧠 **Gemini 4 Argon (High)** | Esprit de Ruche (**Auto-Architecte** de chantiers), Avant-Postes + **Caravanes visuelles Canvas**, Merveilles souterraines | `config.js`, `game-world.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ⏳ À FAIRE |
| **Lot 12** | [`LOT_12_DEFIS_TRANSCENDANCE_CODEX_ET_LORE.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_12_DEFIS_TRANSCENDANCE_CODEX_ET_LORE.md) | 🧠 **Gemini 4 Argon (High)** | Défis à paliers, **Prestige 2 : Transcendance** + **Carte Céleste interactive**, Codex & Panthéon, Lore optionnel + Portail ancien | `config.js`, `game-world.js`, `game.js`, `renderer.js`, `index.html`, `style.css` | ⏳ À FAIRE |

### Acte V — Diplomatie, Alchimie Phéromonale & Cataclysmes (Lots 13 à 15)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 13** | [`LOT_13_DIPLOMATIE_ET_FOURMILIERES_RIVALES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_13_DIPLOMATIE_ET_FOURMILIERES_RIVALES.md) | 🧠 **Gemini 4 Argon (High)** | **Fourmilières et Citadelles rivales** sur les Anneaux : Diplomatie, Pactes de troc, Tributs impériaux et Guerres d'annexion (`resolveCombat`) | `config.js`, `game-world.js`, `combat.js`, `game.js`, `renderer.js` | ⏳ À FAIRE |
| **Lot 14** | [`LOT_14_CHIMIE_PHEROMONES_ET_PISTES_CANVAS.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_14_CHIMIE_PHEROMONES_ET_PISTES_CANVAS.md) | ⚡ **Gemini 3.8 Flash (High)** | **Laboratoire Phéromonal & Pistes lumineuses sur Canvas** : relier les chambres souterraines par des flux chimiques spécialisés | `config.js`, `game.js`, `game-ui.js`, `renderer.js`, `renderer-effects.js` | ⏳ À FAIRE |
| **Lot 15** | [`LOT_15_CATACLYSMES_ET_ECOSYSTEME_VIVANT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_15_CATACLYSMES_ET_ECOSYSTEME_VIVANT.md) | 🧠 **Gemini 4 Argon (High)** | **Grands Cataclysmes climatiques** (Mousson, Fournaise, Gel, Séisme) indexés sur `computeThreatIndex`, bouclier de préparation & Bénédictions de Gaïa | `config.js`, `game-world.js`, `game.js`, `renderer-effects.js`, `tests/` | ⏳ À FAIRE |

### Acte VI — L'Apogée de l'Écosystème : Cordyceps, Botanique & Léviathans (Lots 16 à 18)

| Lot | Fichier de Spécification | Modèle Recommandé | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 16** | [`LOT_16_IMMUNITE_SOCIALE_ET_CORDYCEPS.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_16_IMMUNITE_SOCIALE_ET_CORDYCEPS.md) | 🧠 **Gemini 4 Argon (High)** | **Parasitologie & Immunité Sociale** : pression parasitaire des Abîmes, toilettage des Nourrices et **Domestication du Cordyceps** (retournement d'ennemis en combat) | `config.js`, `game-world.js`, `combat.js`, `game.js`, `renderer.js` | ⏳ À FAIRE |
| **Lot 17** | [`LOT_17_JARDIN_BOTANIQUE_MYRMECOPHILE.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_17_JARDIN_BOTANIQUE_MYRMECOPHILE.md) | ⚡ **Gemini 3.8 Flash (High)** | **Jardin Botanique Symbiotique en Surface** : plantes myrmécophiles géantes (*Acacia*, *Myrmecodia*, *Passiflore*) sur 5 stades visuels Canvas et racines protectrices | `config.js`, `game.js`, `game-ui.js`, `renderer.js`, `renderer-effects.js` | ⏳ À FAIRE |
| **Lot 18** | [`LOT_18_CITES_SOEURS_ET_LEVIATHANS.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_18_CITES_SOEURS_ET_LEVIATHANS.md) | 🧠 **Gemini 4 Argon (High)** | **Réseau Continental des Cités-Sœurs** (mémoire des Vols Nuptiaux) & **Chasse aux Léviathans** à difficulté adaptative infinie (*Crapaud Cornu*, *Centipède Empereur*, *Pic-Vert*, *Grand Fourmilier*) + Audit final des 18 lots | `config.js`, `game-world.js`, `combat.js`, `game.js`, `renderer.js`, `tests/` | ⏳ À FAIRE |

---

## 🗂️ 3. Registre des Systèmes Partagés (Source Unique par Concept)

| Concept | Lot propriétaire | Token `GAME_CONFIG` / API | Étendu par |
| :--- | :--- | :--- | :--- |
| Interaction Canvas (hit-test des nœuds) | Lot 2 | `CANVAS_THEME.nodes`, `hitTestNode()` | 5 (bâtisseuses, pucerons), 7 (abîmes), 8 (atelier), 9 (écurie), 11 (merveilles), 14 (pistes), 17 (arbre) |
| Textes flottants / juice | Lot 2 | `spawnCanvasFloatingText()` | Tous |
| Registre de ressources | Lot 3 | `RESOURCES` (`food`, `pheromone`…) | 5 (miellat, chitine, spores, brindilles), 7 (ambre, silex, obsidienne), 8 (mythique) |
| Chantiers en temps réel bornés ($T \le 2\text{h}$) | Lot 3 | `activeConstructions`, `computeConstructionTime()` | 5 (`masonry_hall`, `ROOM_MILESTONES`), 8 (outils d'architecture), 11 (`autoArchitect`) |
| Formatage des nombres | Lot 3 | `NUMBER_FORMAT`, `formatLargeNumber()` | Tous |
| Navigation par panneaux | Lot 3 | `UI_PANELS` (onglets + sous-onglets) | Tous les lots ajoutant une vue |
| HUD Analytique, ETA & Boussole | Lot 3 | `getEconomyBreakdown()`, `getNextMilestoneGoal()` | Tous (nouveaux jalons d'objectifs) |
| Audio & Paysage Sonore Adaptatif | Lot 3 | `AUDIO`, `playSfx(id)`, `updateAmbientSoundscape()` | Tous |
| Combat, Prévision & Difficulté Adaptative | Lot 4 | `resolveCombat()`, `computeThreatIndex()`, `ecosystemAggro` | 7 (Tier Gates), 8, 9, 13 (rivaux), 15 (cataclysmes), 16 (Cordyceps), 18 (Léviathans) |
| Événements à choix | Lot 4 | `EVENTS` | 5, 7, 9, 10, 15, 16 |
| Bonus / multiplicateurs | Lot 4 | `computeModifiers(state)` (agrégateur unique) | 5 à 18 |
| Matériaux par Tiers | Lot 5 (T1-T3) | `RESOURCES[x].tier` | 7 (T2-T4), 8 (T5) |
| Ambre 🟠 (monnaie unique) | Lot 7 | `RESOURCES.amber` | 9 (troc), 12 (constellations), 13 (tributs), 15 (cataclysmes), 18 (Léviathans) |
| Hauts faits & Statistiques | Lot 6 | `ACHIEVEMENTS`, `gameState.stats` | Tous (alimente le Codex du Lot 12 et les Cités-Sœurs du Lot 18) |

---

## 🗺️ 5. Plan d'Implantation des Chambres (Canvas)

Positions réservées pour éviter les chevauchements quand les lots ajoutent des salles :

| Nœud | Lot | Position cible (`xRatio`, `yRatio`) | Reliée à |
| :--- | :--- | :--- | :--- |
| `queen`, `granary`, `dorm`, `fungus`, `nursery`, `barricade` | Existant | Inchangées | — |
| `aphid_farm` (Galerie à Pucerons) | 5 | (0.08, 0.44) | `granary` |
| `masonry_hall` (Chambre des Bâtisseuses) | 5 | (0.22, 0.65) | `dorm`, `granary` |
| `chitin_forge` (Atelier de Chitine) | 8 | (0.92, 0.44) | `dorm` |
| `stables` (Écurie) | 9 | (0.86, 0.86) | `dorm`, `nursery` |
| `abyss_shaft` (Puits des Abîmes) | 7 | (0.40, 0.95) | `nursery` |
| Merveilles (surface / profondeur) | 11 | Surface (0.30, 0.15) et (0.70, 0.15) | `entrance` |
| `symbiotic_tree` (Grand Arbre Myrmécophile) | 17 | Surface centrale (0.50, 0.14) | `entrance`, `aphid_farm` |

---

## 🔄 6. État de Passation Actuel (Handoff Rapide)

- **Lots terminés :** **Lot 1** ✅, **Lot 2** ✅, **Lot 3** ✅, **Lot 4** ✅ (`combat.js`), **Lot 5** ✅ (`symbiosis.js`), **Lot 6** ✅ (`evolution.js`), **Lot 7** ✅ (`game-world.js`).
- **Prochains lots à engager :** **Lot 8** ([`LOT_8_ATELIER_CRAFTING_ET_EQUIPEMENT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_8_ATELIER_CRAFTING_ET_EQUIPEMENT.md)) — ⚡ **Gemini 3.8 Flash (High)** (Atelier de Chitine & Équipement) ou **Lot 10** ([`LOT_10_ESPECES_ET_BIOMES.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/LOT_10_ESPECES_ET_BIOMES.md)) — 🧠 **Gemini 4 Argon (High)** (Espèces & Biomes Asymétriques).
