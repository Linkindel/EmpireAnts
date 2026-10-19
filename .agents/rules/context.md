---
trigger: always_on
---

# Règle de Priorité et de Maintenance du Fichier de Contexte (`CONTEXT.md`)

Cette règle impose la consultation prioritaire et la mise à jour continue du fichier `CONTEXT.md` à la racine du projet.

## 1. Consultation Prioritaire au Démarrage (Zéro Lecture Intempestive)
- **Point d'entrée unique** : Au début de chaque tâche ou demande, **toujours consulter en priorité le fichier `CONTEXT.md`** à la racine avant de lire ou parcourir l'ensemble du projet.
- **Économie de contexte** : S'appuyer sur la synthèse de `CONTEXT.md` pour identifier les seuls fichiers spécifiques à inspecter, sans recharger ou scanner inutilement l'intégralité des fichiers de code.

## 2. Emplacement et Rôle
- Le fichier `CONTEXT.md` à la racine sert de référence vivante résumant :
  - L'état d'avancement actuel du projet.
  - La cartographie des fichiers et modules clés.
  - Les règles et standards techniques en vigueur.
  - Le journal chronologique des modifications apportées.

## 3. Obligation de Mise à Jour Systématique
- À **chaque fin d'intervention sur le code** (création de fichier, refactorisation, ajout de fonctionnalité ou correction de bug) :
  - Mettre à jour la date/heure de dernière modification dans `CONTEXT.md`.
  - Mettre à jour la section appropriée (architecture, nouveaux modules, équilibrage).
  - Ajouter une entrée concise et datée dans la section « Journal des Dernières Modifications ».
