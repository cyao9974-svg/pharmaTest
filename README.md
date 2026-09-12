# 🏥 PharmaGuard Bingerville

Application professionnelle de recherche, collecte responsable, nettoyage, déduplication, vérification et exportation des informations publiques concernant les **pharmacies de garde à Bingerville, Côte d’Ivoire**.

---

## 📋 Table des Matières
- [Présentation & Objectifs](#-présentation--objectifs)
- [Architecture Technique](#-architecture-technique)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Scraping Responsable & Éthique](#-scraping-responsable--éthique)
- [Installation & Lancement](#-installation--lancement)
- [Configuration (.env)](#-configuration-env)
- [Génération de Documents PDF & Exports](#-génération-de-documents-pdf--exports)
- [Base de Données & Persistance](#-base-de-données--persistance)
- [Suite de Tests Automatisés](#-suite-de-tests-automatisés)

---

## 🎯 Présentation & Objectifs

PharmaGuard Bingerville permet aux professionnels, régulateurs de santé et résidents de Bingerville de :
1. **Rechercher et collecter** les pharmacies de Bingerville et leurs tours de garde sur des sources publiques autorisées.
2. **Nettoyer et normaliser** les données (numéros de téléphone au format ivoirien `+225 XX XX XX XX XX`, adresses e-mail, validation rigoureuse des coordonnées GPS).
3. **Dédupliquer intelligemment** les entrées issues de sources multiples grâce à des algorithmes de similarité textuelle et de proximité géographique.
4. **Distinguer rigoureusement** les pharmacies répertoriées des tours de garde confirmés avec avertissement si non certifiés.
5. **Vérifier manuellement** chaque établissement (statuts : *Vérifiée*, *À vérifier*, *Non vérifiée*, *Informations incomplètes*).
6. **Visualiser sur carte interactive** les officines géolocalisées dans la commune de Bingerville.
7. **Générer et exporter des rapports PDF professionnels** (PDF résumé tabulaire et PDF détaillé sous forme de fiches), ainsi que des exports CSV et JSON.

---

## 🏗 Architecture Technique

L'application est conçue selon une architecture full-stack modulaire et propre :

```
├── backend/
│   ├── src/
│   │   ├── controllers/      # Contrôleurs Express (PharmacyController)
│   │   ├── database/         # Abstraction DB (PostgreSQL avec fallback In-Memory)
│   │   ├── parsers/          # Extraction sémantique (Cheerio, Regex CI)
│   │   ├── pdf/              # Moteur de génération PDF (PDFKit)
│   │   ├── routes/           # Routes de l'API REST (/api/*)
│   │   ├── scrapers/         # Scrapers éthiques (OSM Overpass, Annuaires Santé CI, Portails)
│   │   ├── services/         # Moteur de déduplication, recherche, cache, demo data
│   │   ├── tests/            # Suite de tests unitaires et d'intégration
│   │   ├── types/            # Définitions TypeScript
│   │   └── utils/            # Normaliseurs (téléphone CI, emails, coordonnées GPS, rate-limiter)
├── database/
│   └── migrations/           # Schémas SQL PostgreSQL (001_initial_schema.sql)
├── src/                      # Frontend React 18 + Vite + Tailwind CSS
│   ├── components/           # Header, StatsCards, SearchPanel, FilterBar, Table, Modal, Map, Toasts
│   ├── services/             # Client API REST (fetch)
│   └── types.ts              # Types TypeScript frontend
├── server.ts                 # Point d'entrée serveur (Express + Vite middleware)
└── package.json
```

---

## ✨ Fonctionnalités Principales

### 1. Dashboard & Métriques
- Total des pharmacies répertoriées.
- Nombre d'officines vérifiées et pourcentage.
- Compteurs de couverture : avec téléphone, avec email, avec coordonnées GPS, de garde confirmée.

### 2. Moteur de Scraping Responsable & Progression en Temps Réel
- Collecte exécutée **exclusivement côté serveur** (aucune requête de scraping dans le navigateur).
- Progression étape par étape affichée en direct à l'utilisateur.
- Fallback intelligent en mode Démo pour tester l'application sans solliciter les serveurs distants.

### 3. Déduplication et Fusion
- Détection des doublons sur :
  - Identité phonétique / normalisée du nom d'officine.
  - Correspondance du numéro de téléphone principal.
  - Proximité géographique (< 120 mètres).
- Fusion intelligente pour conserver le jeu de données le plus complet (e-mail, adresse la plus descriptive, géolocalisation la plus précise).

### 4. Filtrage & Recherche Instantanée
- Recherche textuelle plein-texte sur le nom, téléphone, adresse et email.
- Filtres par complétude, disponibilité de localisation GPS, statut de vérification, statut de garde et source.
- Bascule fluide entre vue **Tableau** et vue **Carte GPS Interactive OpenStreetMap**.

### 5. Fiche Complète & Modification
- Consultation détaillée de chaque officine.
- Modification des données en direct avec persistance en base.
- Bouton de vérification rapide en 1 clic.
- Liens directs vers Google Maps et vers la source d'origine.

---

## 🛡 Scraping Responsable & Éthique

PharmaGuard applique des règles strictes de scraping éthique :
- Respect des fichiers `robots.txt` et des entêtes `User-Agent` explicites (`PharmaGuardBingerville/1.0 (+https://bingerville.sante.ci)`).
- Limitation de débit (*Rate Limiting*) avec délai minimum de 500 ms entre les requêtes.
- Pas de contournement de CAPTCHA, ni d'accès à des zones protégées par mot de passe.
- Système de cache automatique pour éviter les requêtes redondantes vers les serveurs publics.
- **Règle absolue** : aucune adresse e-mail ou téléphone n'est jamais inventé s'il n'est pas publiquement disponible.

---

## 🚀 Installation & Lancement

### Prérequis
- Node.js version 18 ou supérieure.
- npm ou yarn.
- Optionnel : Une instance PostgreSQL (si absente, le mode In-Memory prend automatiquement le relais sans erreur).

### 1. Cloner et installer les dépendances
```bash
npm install
```

### 2. Démarrage en mode Développement
```bash
npm run dev
```
L'application est immédiatement accessible sur [http://localhost:3000](http://localhost:3000).

### 3. Compilation pour la Production
```bash
npm run build
npm start
```

---

## ⚙️ Configuration (.env)

Créez un fichier `.env` à la racine (ou inspirez-vous de `.env.example`) :

```env
# Port d'écoute (par défaut 3000)
PORT=3000

# Environnement
NODE_ENV=development

# URL de connexion PostgreSQL (optionnelle)
# Si non renseignée ou inaccessible, l'application bascule automatiquement
# sur le stockage In-Memory sans planter.
DATABASE_URL=postgresql://user:password@localhost:5432/pharmaguard_bingerville
```

---

## 📄 Génération de Documents PDF & Exports

Le système intègre un moteur PDF natif propulsé par **PDFKit** côté serveur :
- **PDF Résumé** (`/api/export/pdf?type=summary`) :
  - En-tête professionnel aux couleurs de la République de Côte d'Ivoire.
  - Statistiques clés et tableau récapitulatif avec nom, contact, statut de garde, adresse et statut de vérification.
  - Numérotation des pages et mentions légales d'usage.
- **PDF Détaillé** (`/api/export/pdf?type=detailed`) :
  - Présentation sous forme de fiches individuelles complètes.
  - Détail des coordonnées GPS, historique des sources, dates de collecte et avertissements de garde.
- **Export CSV** (`/api/export/csv`) : Compatible Excel, LibreOffice et Google Sheets.
- **Export JSON** (`/api/export/json`) : Données brutes structurées avec métadonnées de collecte.

---

## 🗄 Base de Données & Persistance

L'application supporte deux modes de stockage transparents :
1. **Mode PostgreSQL** : Schéma relationnel complet avec clés primaires UUID, tables `pharmacies`, `pharmacy_sources`, `search_history`, contraintes d'intégrité et index sur la ville de Bingerville.
2. **Mode In-Memory Fallback** : Activé automatiquement si PostgreSQL n'est pas configuré. Maintient l'état en mémoire vive avec support complet du CRUD, du filtrage et des relations.

---

## 🧪 Suite de Tests Automatisés

Une suite de tests automatisée valide l'intégrité des composants sensibles (normalisation de téléphone ivoirien, extraction d'email, calcul de similarité, validation GPS, déduplication et génération de PDF).

Pour exécuter les tests :
```bash
npx tsx backend/src/tests/runTests.ts
```

Résultat des tests :
```text
🧪 Running PharmaGuard Bingerville Test Suite...
  ✓ PASS: Standard 10-digit CI mobile format preserved
  ✓ PASS: Multi-phone string extracted into primary and secondary
  ✓ PASS: Landline number cleaned and formatted
  ✓ PASS: Null phone returns null (no invention)
  ✓ PASS: Email trimmed and lowercased
  ✓ PASS: Email extracted from unstructured text
  ✓ PASS: Invalid email returns null (no placeholder)
  ✓ PASS: Case insensitivity and accent stripping produce identical tokens
  ✓ PASS: Fuzzy substring detection works
  ✓ PASS: Valid Bingerville coordinates rounded to precision
  ✓ PASS: Out-of-bound coordinates rejected
  ✓ PASS: Null coordinates preserved as null
  ✓ PASS: Duplicate detected between uppercase and lowercase entries with identical phone
  ✓ PASS: Merged into a single record
  ✓ PASS: Enriched email retained during merge
  ✓ PASS: Longer descriptive address retained
  ✓ PASS: Summary PDF buffer generated successfully
  ✓ PASS: Detailed PDF buffer generated successfully
========================================
Results: 18 passed, 0 failed.
========================================
```

---

## ⚖️ Mentions Légales
Les données collectées proviennent d'annuaires publics et du projet collaboratif OpenStreetMap. PharmaGuard Bingerville est un outil d'aide à la décision et de centralisation citoyenne et médicale. En cas d'urgence médicale vitale, veuillez contacter immédiatement les services d'urgence ou le SAMU Côte d'Ivoire (185 / 180).
