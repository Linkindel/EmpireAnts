# Contexte du Projet - Empire Fourmi

> **Dernière mise à jour :** 20/10/2026 01:20  
> **Statut global :** Prêt pour développement (Architecture Senior SOLID / Vanilla JS / Canvas / i18n / Node.js LTS & Git configurés)  
> **Dépôt GitHub :** `https://github.com/Linkindel/EmpireAnts.git` (branche `main`)

---

## 1. Vue d'Ensemble du Projet
Jeu incrémental / stratégie de colonie de fourmis (**Empire Fourmi**) développé en HTML5/CSS3/JavaScript pur, sans dépendances lourdes, optimisé pour Desktop et Mobile.

---

## 2. Architecture & Modules Principaux
- [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html) : Structure sémantique du DOM, navigation par onglets (Desktop `#desktopTabs` & Mobile `#mobileNav`), conteneur Canvas et journal d'événements.
- [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css) : Design tokens CSS `:root` (palette de couleurs, espacements, typographie, ombres), styles responsifs et composants de jeu.
- [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js) : Source unique de vérité (`GAME_CONFIG`) pour tous les game tokens :
  - Castes d'ouvrières, guerrières, éclaireuses, nourrices
  - Bâtiments et chambres souterraines
  - Missions d'exploration, combats, doctrines et mutations
  - Système de saisons et événements de raid
  - Dictionnaire bilingue complet `GAME_CONFIG.I18N` (`fr` et `en`)
- [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js) : Moteur de simulation :
  - Modèle de données central `gameState`
  - Boucle de jeu `gameTick` et calculs de production/consommation
  - Mécaniques d'incubation, amélioration de salles, expéditions
  - Synchronisation de l'UI (`updateUI`) et gestion de la persistance (`localStorage`)
- [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js) : Moteur graphique Canvas 2D affichant la fourmilière, ses galeries, les salles actives et les fourmis en déplacement avec rendu interactif.
- [`.gitignore`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.gitignore) : Exclusions Git standard (`node_modules/`, `coverage/`, fichiers système et IDE).

---

## 3. Règles et Standards Actifs
Toutes les règles détaillées sont documentées dans `.agents/rules/` :
1. **Priorité de Contexte & Mise à jour** ([`context.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/context.md)) : Consulter obligatoirement `CONTEXT.md` au début de chaque tâche ; mise à jour systématique à chaque fin de code.
2. **Architecture & Zero Magic Number** ([`architecture.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/architecture.md)) : Aucune valeur brute en dur dans la logique métier ; centralisation intégrale dans `GAME_CONFIG`.
3. **Qualité & Robustesse du Code** ([`quality.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/quality.md)) :
   - *Flux unidirectionnel* : Seul `game.js` mute `gameState` ; `renderer.js` est en lecture seule.
   - *Persistance défensive* : Gestion de version de schéma (`schemaVersion`) et fusion par défaut (*Deep Merge*) pour préserver les sauvegardes des joueurs sans crash.
   - *Séparation stricte des responsabilités (SoC)* : config (données pures), game (moteur & état), renderer (dessin Canvas).
   - *Déterminisme temporel* : Progression indexée sur $\Delta t$ réel avec plafond de sécurité hors-ligne.
   - *Programmation défensive* : Contrôle strict contre les divisions par zéro, `NaN` et débordements.
4. **Internationalisation Bilingue Stricte (FR / EN)** ([`i18n.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/i18n.md)) : Tout libellé ou notification doit être présent simultanément en français et en anglais dans `GAME_CONFIG.I18N`.
5. **Couverture de Tests Minimale ≥ 80%** ([`tests.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/tests.md)) : Toute logique métier, calcul d'équilibrage et persistance doit être validée à hauteur d'au moins 80%.

---

## 4. Journal des Dernières Modifications
- **20/10/2026** :
  - Création des règles globales et locales d'internationalisation bilingue FR/EN (`.agents/rules/i18n.md`, `.gemini/config/rules/i18n.md`).
  - Création des règles globales et locales de couverture de tests ≥ 80% (`.agents/rules/tests.md`, `.gemini/config/rules/tests.md`).
  - Création de la règle de priorité au démarrage et de mise à jour systématique du contexte (`.agents/rules/context.md`, `.gemini/config/rules/context.md`).
  - Formalisation de la règle de robustesse et de qualité de code ([`.agents/rules/quality.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/quality.md)) et intégration dans la section 3 de [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
  - Installation réussie de Node.js v24.20.0 (LTS) et npm 11.19.0 pour l'exécution d'un runner de tests automatisé et le calcul de couverture (≥ 80%).
  - Refonte des standards d'architecture logicielle de niveau Senior (SOLID, SoC, flux unidirectionnel, fonctions pures, programmation défensive) dans [`.agents/rules/architecture.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.agents/rules/architecture.md) et [`.gemini/config/rules/architecture.md`](file:///C:/Users/Lebrun%20David/.gemini/config/rules/architecture.md).
  - Installation de Git (v2.55.0), création de [`.gitignore`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/.gitignore), initialisation du dépôt local (`main`) et liaison avec le dépôt distant `https://github.com/Linkindel/EmpireAnts.git`.
