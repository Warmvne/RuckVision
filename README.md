# RuckVision

**RuckVision** est une application d'analyse vidéo de matchs de rugby avec IA. Elle permet de découper automatiquement les séquences de jeu, de les annoter, et de visualiser les statistiques du match et des équipes.

---

## Fonctionnalités

### Import & traitement vidéo
- Import de n'importe quel format vidéo (MP4, MKV, AVI, MOV, WebM, etc.)
- Conversion automatique en HLS pour lecture fluide dans le navigateur
- Génération automatique d'une miniature du match
- Support FFmpeg natif — aucune limite de codec ou de résolution

### Analyse IA automatique
- **Détection de joueurs et du ballon** via YOLOv8 (analyse frame par frame)
- **Découpe automatique** des séquences de jeu par détection de changements de scène
- **Classification automatique** des phases : Ruck · Mêlée · Touche · Jeu ouvert · Essai · Pénalité · Coup d'envoi
- **Score de confiance** affiché pour chaque segment proposé par l'IA
- **Tracking précis** via SAM 2.1 (Meta) pour le suivi des joueurs dans un segment

### Interface de revue humaine
- Lecteur vidéo intégré (Video.js) avec contrôles complets
- **Timeline interactive** des segments colorés par phase
- Navigation rapide entre les segments (précédent / suivant)
- Pour chaque segment proposé par l'IA :
  - ✅ Valider
  - ✗ Rejeter
  - ✂️ Couper au point de lecture (split)
  - ✏️ Éditer : type de phase, équipe en possession, zone du terrain, étiquette libre, notes
- Création manuelle de segments
- Indicateur visuel du statut : `IA proposé` · `Validé` · `Édité` · `Rejeté`

### Dashboard statistiques
- Nombre de segments par type de phase (graphique en barres)
- Durée totale par phase (secondes)
- Possession du ballon par équipe (graphique en camembert)
- KPIs : durée du match, phase dominante, équipe dominante

### Statistiques équipes
- Vue par équipe avec historique multi-matchs
- Possession moyenne par match
- Répartition des phases jouées

---

## Prérequis

### Système
- **OS** : Windows 10/11, macOS 12+, Linux Ubuntu 20.04+
- **RAM** : 8 Go minimum (16 Go recommandé pour les modèles IA)
- **GPU** : optionnel mais fortement recommandé pour YOLOv8 et SAM 2.1 (NVIDIA CUDA 11.8+)

### Logiciels à installer

#### 1. Python 3.10 ou 3.11
```
https://www.python.org/downloads/
```
Vérifier : `python --version`

#### 2. Node.js 18+
```
https://nodejs.org/
```
Vérifier : `node --version`

#### 3. FFmpeg
- **Windows** : Télécharger sur https://ffmpeg.org/download.html, extraire et ajouter le dossier `bin/` au PATH système
- **macOS** : `brew install ffmpeg`
- **Linux** : `sudo apt install ffmpeg`

Vérifier : `ffmpeg -version`

---

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/Warmvne/RuckVision.git
cd RuckVision
```

### 2. Backend Python
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. SAM 2.1 (Meta) — optionnel pour le tracking précis
```bash
git clone https://github.com/facebookresearch/sam2.git
cd sam2 && pip install -e . && cd ..

# Télécharger le checkpoint (224 Mo)
mkdir -p models
# Depuis le repo SAM 2 :
bash scripts/download_ckpts.sh
cp checkpoints/sam2.1_hiera_large.pt models/
```

### 4. Frontend
```bash
cd frontend
npm install
```

---

## Démarrage

**Terminal 1 — Backend :**
```bash
cd backend
.venv\Scripts\activate   # ou source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend :**
```bash
cd frontend
npm run dev
```

Ouvrir **http://localhost:5173** dans le navigateur.

API disponible sur **http://localhost:8000/docs** (Swagger UI).

---

## Interface

### Page Matchs
Liste de tous les matchs importés avec leur statut de traitement (`en attente`, `en cours`, `prêt`, `erreur`). Permet d'importer une nouvelle vidéo via drag & drop ou sélecteur de fichier, de lancer l'analyse IA, et d'accéder à la revue ou au dashboard.

### Page Revue
Interface principale de l'analyste vidéo :
- Lecteur vidéo en grand format à gauche
- Timeline des segments en bas du lecteur, cliquable pour naviguer
- Panneau de segments à droite avec statut IA et filtres
- Panneau d'édition inline pour modifier un segment sélectionné

### Dashboard
Visualisations statistiques du match sélectionné : phases, possession, durée. Accessible depuis chaque match une fois l'analyse IA réalisée.

### Équipes
Vue agrégée des statistiques par équipe sur l'ensemble des matchs importés.

---

## Architecture

```
RuckVision/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── db/                  # SQLite + modèles SQLAlchemy
│   ├── video/               # Traitement FFmpeg (HLS, thumbnail, clip)
│   ├── ai/                  # YOLOv8 + SAM 2.1 + segmentation auto
│   ├── stats/               # Calcul statistiques
│   └── routers/             # API REST : /matches /segments /stats
├── frontend/
│   └── src/
│       ├── pages/           # MatchList · ReviewPage · Dashboard · Teams
│       ├── components/      # VideoPlayer · SegmentTimeline
│       └── api/             # Client HTTP FastAPI
└── data/                    # Vidéos, HLS, thumbnails, rugby.db (gitignored)
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Lecteur vidéo | Video.js + HLS.js |
| Charts | Recharts |
| Backend | FastAPI + Python 3.11 |
| Base de données | SQLite via SQLAlchemy |
| Détection | YOLOv8 (Ultralytics) |
| Segmentation/Tracking | SAM 2.1 (Meta) |
| Conversion vidéo | FFmpeg |

---

## License

MIT
