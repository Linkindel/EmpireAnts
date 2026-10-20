# 🍄 Lot 16 : Immunité Sociale, Parasitologie & Domestication du Cordyceps

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 4, 5, 6, 7 et 14 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 16
Introduire l'un des phénomènes les plus fascinants de la myrmécologie réelle : la **lutte contre les parasites fongiques (*Ophiocordyceps*) et les acariens**, la réponse collective d'**Immunité Sociale** (toilettage par les Nourrices, désinfection à l'acide formique et à la résine) et la **Domestication du Cordyceps** pour retourner les assaillants ennemis contre leur propre camp.

---

## 📋 Spécifications Détaillées

### 1. Pression Parasitaire Adaptative (`GAME_CONFIG.PARASITOLOGY`, `computeParasitePressure`)
- Plus l'exploration descend profondément dans les **Strates des Abîmes** (Lot 7) et plus l'Indice de Menace (`computeThreatIndex`) est élevé, plus la colonie est exposée à une **Pression Parasitaire** (`parasitePressure` de $0\%$ à $100\%$) :
  - *Acariens Phorétiques* : alourdissent les ouvrières et éclaireuses ($-15\%$ vitesse si non nettoyés).
  - *Spores Sauvages d'Ophiocordyceps* : réduisent l'efficacité de la Nurserie et des Soldats si l'immunité est inférieure à la pression.

### 2. Système d'Immunité Sociale (`computeSocialImmunity`)
- Fonction pure `computeSocialImmunity(state)` calculant le bouclier sanitaire de la colonie à partir des systèmes existants :
  - **Toilettage des Nourrices (`nurse`)** : chaque nourrice dissipe une part de la charge parasitaire.
  - **Prophylaxie à l'Acide Formique** (mutation `acide` + Guerrières) et **Résine de Brindilles** (`twigs` du Lot 5) : désinfectent l'entrée du dôme.
  - Si `socialImmunity >= parasitePressure`, la colonie bénéficie du statut **Pureté Sanitaire** ($+20\%$ vitesse d'éclosion et $+15\%$ longévité/défense via `computeModifiers`).

### 3. Domestication du Cordyceps & Arme Biologique (`cultivateCordycepsStrain`)
- Dans le sous-panneau **Colonie › Laboratoire Phéromonal & Immunité** (étendant le Lot 14), le joueur peut investir des **Spores ✨** (Lot 5) et de la **Biomasse de Compost** (Lot 5) pour sélectionner une **Souche Domestiquée d'Ophiocordyceps** (`cordycepsStrainLevel`) :
  - Dans `resolveCombat` (`combat.js`), un pourcentage de la puissance ennemie vaincue ou exposée aux spores ($5\%$ à $30\%$ selon le niveau de souche) est **zombifié / retourné contre l'essaim ennemi** pendant la bataille (`cordycepsConvertedPower`).
- Rendu Canvas : filaments bioluminescents violets/cyan sur les ennemis infectés lors des raids.
- SFX `cordyceps_burst` ajouté au registre `AUDIO`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `computeParasitePressure`, `computeSocialImmunity` et la conversion `cordycepsConvertedPower` dans `resolveCombat` sont purs, déterministes et testés.
- [ ] Équilibre vérifié : la pression parasitaire freine le snowball en profondeur mais se transforme en puissant levier tactique dès que les Nourrices et le Laboratoire sont investis.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
