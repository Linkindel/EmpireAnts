# 🐜 Empire Fourmi (EmpireAnts)

> **Jeu incrémental et stratégique de colonie de fourmis à échelle biologique.**  
> Développé en HTML5, CSS3 et JavaScript pur (Zero-dependency), hautement modulaire, bilingue Français / Anglais (FR / EN) et optimisé Desktop & Mobile.

[![Build Status](https://img.shields.io/badge/tests-189%20passing-brightgreen.svg)](tests/)
[![Coverage](https://img.shields.io/badge/coverage-92.2%25-success.svg)](tests/)
[![Architecture](https://img.shields.io/badge/architecture-SOLID%20%2F%20%3C2000%20lines-blue.svg)](.agents/rules/architecture.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🌟 Points Forts du Jeu

- 🌍 **Monde Vivant & Rendu Canvas 2D "Mobile AAA"** :
  - Fourmis articulées en **3D CGI stylisé (*DreamWorks Antz*)** : pattes à démarche trépied réaliste, gastre segmenté aux reflets luisants, armures par caste, cape alaire royale pour la Reine.
  - Galeries souterraines organiques, Puits des Abîmes avec fumerolles géothermiques, brume saisonnière, chaîne vivante d'ouvrières en surface (*Living Bridges*).
- ⚙️ **Simulation Économique & Symbiotique Profonde** :
  - **7 Ressources** : Nourriture, Phéromones, Brindilles, Miellat 🍯, Chitine 🪲, Spores 🍄 et Ambre Ancestral 🟠.
  - Spécialisation des ouvrières par rôles (Récolteuses, Éleveuses de pucerons, Cultivatrices de champignons, Bâtisseuses).
  - Chantiers de construction asymptotiques bornés (de 30s jusqu'à un plafond strict de 2h au niveau 1000+).
  - Régulation thermique du dôme (ventilation vs opercule) et régime royal (*Trophallaxie & Œufs Dorés*).
- 🗺️ **Exploration Infinie & Puits des Abîmes** :
  - Double axe d'exploration procédurale : horizontal (**Anneaux 1 à $\infty$**) et vertical (**Strates des Abîmes 1 à $\infty$**).
  - Mécanique adaptative anti-snowball avec paliers super-exponentiels (*Tier Gates*).
  - Déploiement de Ponts Vivants d'ouvrières pour traverser les crevasses et booster la récolte.
  - Reliques Ancestrales forgées dans l'Ambre persistant au Vol Nuptial.
- ⚔️ **Système Tactique & Combats Unifiés** :
  - Expéditions, combats d'escarmouche, boss légendaires (Mante Royale, Gardiens de strates).
  - Compostage fongique des pertes et ennemis recyclés en Biomasse nutritive.
- 🧬 **Arbre Génétique & Prestige du Vol Nuptial** :
  - Mutations génétiques permanentes sur 3 branches distinctes.
  - Réincarnation avec conservation défensive des acquis majeurs.
- 🔊 **Ambiance Sonore WebAudio Procédurale** :
  - Synthèse sonore 100% procédurale (zéro fichier audio externe lourd).
  - Paysage sonore adaptatif réagissant aux saisons et alertes souterraines.

---

## 📂 Architecture Technique & Modularité

Le code source applique des **standards stricts d'architecture logicielle Senior** :
- **Plafond strict de taille** : Aucun fichier source ne dépasse 2000 lignes (vérifié par les tests automatisés).
- **Séparation stricte des responsabilités (SoC) & Flux Unidirectionnel** :
  - `config.js` : Constantes pures déclaratives et registres métier (`GAME_CONFIG`).
  - `i18n.js` : Dictionnaires de traduction bilingues FR/EN avec parité stricte à 100%.
  - `game.js` : Modèle d'état (`gameState`), boucle principale (`gameTick`) et persistance versionnée (`SCHEMA_VERSION: 5` avec *Deep Merge* défensif).
  - `game-ui.js` : Interface DOM, boussole d'objectifs, formateur de grands nombres, popover analytique et gestion audio.
  - `game-world.js` : Moteur pur de génération procédurale d'exploration, Abîmes et Reliques.
  - `symbiosis.js` : Moteur pur de calculs symbiotiques, métiers d'ouvrières et chantiers.
  - `combat.js` : Résolution de combats, modificateurs et synergies.
  - `evolution.js` : Arbre de mutations, prestige du Vol Nuptial et hauts faits.
  - `renderer.js` & `renderer-effects.js` : Moteur de rendu graphique Canvas 2D en lecture seule stricte.

---

## 🚀 Démarrage Rapide

### Jouer en direct
Ouvrez simplement [`index.html`](index.html) dans n'importe quel navigateur web moderne (Chrome, Firefox, Edge, Safari).  
Aucun serveur ni installation préalable n'est requis.

### Raccourcis Clavier en Jeu
| Touche | Action |
| :--- | :--- |
| `Espace` | Mettre en pause / Reprendre la simulation |
| `1` / `2` / `3` | Vitesse de simulation ($\times 1$, $\times 2$, $\times 5$) |
| `Alt + 1` à `6` | Navigation rapide entre les panneaux et onglets |

---

## 🧪 Tests Automatisés & Qualité de Code

Le projet intègre une suite de tests complète validant le moteur métier, la simulation, la persistance, l'i18n et les plafonds d'architecture.

### Exécuter les tests avec Node.js
```bash
npm test
```
- **189 tests automatisés** réussis à 100% (0 échec).
- **Couverture de code globale** : **> 92%** de lignes (seuil exigé : $\ge 80\%$).
- Vérification automatique de la taille des fichiers (`< 2000 lignes`).

### Banc d'essai autonome dans le navigateur
Vous pouvez également ouvrir [`tests.html`](tests.html) dans votre navigateur pour visualiser le rapport d'exécution et les métriques de conformité en direct.

---

## 🌐 Internationalisation (i18n)

Empire Fourmi est conçu dès l'origine pour une parité bilingue absolue :
- Bascule dynamique à la volée entre **Français (FR)** et **Anglais (EN)**.
- Toutes les notifications, descriptions d'unités, chambres, reliques et événements de combat sont traduits dans [`i18n.js`](i18n.js).

---

## 📄 Licence

Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus de détails.
