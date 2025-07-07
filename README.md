# SyndicApp - Gestion de Syndic

Une application complète de gestion de syndic pour la gestion des résidences, clients, charges et factures.

## 🚀 Fonctionnalités

### Dashboard
- **Tableau de bord interactif** avec statistiques en temps réel
- **Graphiques dynamiques** pour l'évolution des charges et revenus
- **Actualisation automatique** lors des modifications de données
- **Vue d'ensemble** des résidences, clients, charges et revenus

### Gestion des Clients
- **CRUD complet** pour les clients
- **Gestion des paiements** avec statuts (Payé/Non Payé)
- **Import/Export Excel** des données clients
- **Génération automatique de factures PDF**
- **Historique des paiements** par client
- **Opérations en masse** (marquer plusieurs clients comme payés)

### Gestion des Résidences
- **Gestion des résidences** avec informations détaillées
- **Association clients-résidences**
- **Statistiques par résidence**

### Gestion des Charges
- **Suivi des charges** par résidence
- **Catégorisation** des charges
- **Historique** des charges

### Facturation
- **Génération automatique** de factures PDF
- **Gestion des statuts** de paiement
- **Export PDF fusionné** pour plusieurs clients
- **Historique des factures** par client

### Notifications
- **Système de notifications** en temps réel
- **Notifications push** pour les mises à jour importantes

### Authentification et Autorisations
- **Système d'authentification** sécurisé
- **Gestion des rôles** et permissions
- **Interface d'administration** des utilisateurs

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Material-UI** pour l'interface utilisateur
- **Recharts** pour les graphiques
- **React Router** pour la navigation
- **Axios** pour les requêtes API
- **Vite** pour le build

### Backend
- **Node.js** avec Express
- **Sequelize** ORM
- **MySQL** base de données
- **JWT** pour l'authentification
- **PDFKit** pour la génération de PDF
- **Multer** pour l'upload de fichiers

## 📦 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- MySQL (v8.0 ou supérieur)
- npm ou yarn

### 1. Cloner le repository
```bash
git clone https://github.com/Adiboubadriss2020/syndicapp.git
cd syndicapp
```

### 2. Configuration de la base de données
```bash
# Créer une base de données MySQL
mysql -u root -p
CREATE DATABASE syndicapp;
```

### 3. Configuration du backend
```bash
cd backend
npm install

# Copier le fichier de configuration
cp config/config.json.example config/config.json

# Modifier config/config.json avec vos paramètres de base de données
{
  "development": {
    "username": "votre_username",
    "password": "votre_password",
    "database": "syndicapp",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}

# Exécuter les migrations
npx sequelize-cli db:migrate

# Créer un utilisateur administrateur
node scripts/createAdmin.js
```

### 4. Configuration du frontend
```bash
cd ../frontend
npm install
```

### 5. Variables d'environnement
Créer un fichier `.env` dans le dossier backend :
```env
JWT_SECRET=votre_secret_jwt_tres_securise
PORT=5050
```

## 🚀 Démarrage

### Développement
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production
```bash
# Build du frontend
cd frontend
npm run build

# Démarrage du backend en production
cd backend
npm start
```

## 📊 Fonctionnalités Avancées

### Actualisation Automatique du Dashboard
- Le dashboard se met à jour automatiquement lors des modifications de données
- Intégration avec le contexte React pour la gestion d'état global
- Déclenchement de refresh depuis n'importe quel composant

### Gestion des Paiements
- Calcul automatique des revenus incluant les balances clients
- Intégration des factures et balances dans les statistiques
- Graphiques en temps réel des revenus vs charges

### Export de Données
- Export Excel des données clients
- Génération de factures PDF individuelles et groupées
- Support des formats multiples

## 🔧 Scripts Utiles

```bash
# Créer un administrateur
node scripts/createAdmin.js

# Vérifier les permissions
node scripts/checkAdmin.js

# Mettre à jour les permissions
node scripts/updatePermissions.js
```

## 📁 Structure du Projet

```
syndicapp/
├── backend/                 # API Node.js/Express
│   ├── config/             # Configuration base de données
│   ├── controllers/        # Contrôleurs métier
│   ├── middleware/         # Middleware (auth, etc.)
│   ├── models/            # Modèles Sequelize
│   ├── routes/            # Routes API
│   ├── scripts/           # Scripts utilitaires
│   └── services/          # Services métier
├── frontend/              # Application React
│   ├── src/
│   │   ├── api/          # Services API
│   │   ├── components/   # Composants réutilisables
│   │   ├── context/      # Contextes React
│   │   ├── pages/        # Pages de l'application
│   │   └── utils/        # Utilitaires
│   └── public/           # Assets statiques
└── deployment/           # Configuration de déploiement
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Adibou Badriss** - [GitHub](https://github.com/Adiboubadriss2020)

## 🙏 Remerciements

- Material-UI pour les composants d'interface
- Recharts pour les graphiques
- Sequelize pour l'ORM
- PDFKit pour la génération de PDF 