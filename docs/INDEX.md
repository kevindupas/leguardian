# LeGuardian - Documentation Index

Bienvenue dans le projet LeGuardian ! Voici l'index complet de la documentation.

## 🚀 Démarrage rapide

**Tu as 5 minutes ?** → Lire [QUICK_START.md](QUICK_START.md)

**Tu veux tout d'un coup ?** → Lire ce fichier

## 📚 Documentation par thème

### 1️⃣ Démarrage du projet

| Document | Durée | Contenu |
|----------|-------|---------|
| [QUICK_START.md](QUICK_START.md) | 5 min | Comment lancer frontend + backend, tester connexion |
| [SETUP_FRONTEND.md](SETUP_FRONTEND.md) | 15 min | Setup détaillé du frontend React |
| [leguardian-backend/README.md](leguardian-backend/README.md) | 10 min | Setup et docs backend Laravel |
| [leguardian-frontend/README.md](leguardian-frontend/README.md) | 10 min | Architecture et doc frontend |

### 2️⃣ Spécifications et Status

| Document | Contenu |
|----------|---------|
| [PROJET_BRACELET_CONNECTE.md](PROJET_BRACELET_CONNECTE.md) | Spec complète du projet (24 KB) |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Status actuel : backend ✅, frontend ✅, mobile 📋 |
| [FILES_CREATED.md](FILES_CREATED.md) | Liste détaillée des fichiers créés |

### 3️⃣ Développement

| Document | Contenu |
|----------|---------|
| [TODO_DEVELOPMENT.md](TODO_DEVELOPMENT.md) | Roadmap détaillée + todo par phase |

## 🎯 Par cas d'usage

### "Je viens de cloner le repo"
1. Lire [QUICK_START.md](QUICK_START.md) (5 min)
2. Lancer `npm install && npm run dev` dans frontend
3. Lancer `php artisan serve` dans backend
4. Ouvrir http://localhost:5173

### "Je veux comprendre l'architecture"
1. Lire [PROJECT_STATUS.md](PROJECT_STATUS.md) (overview tech stack)
2. Lire [leguardian-frontend/README.md](leguardian-frontend/README.md) (archi frontend)
3. Lancer le dev server et explorer le code

### "Je veux développer une nouvelle feature"
1. Lire [TODO_DEVELOPMENT.md](TODO_DEVELOPMENT.md) (voir ce qui reste à faire)
2. Créer une branche git
3. Implémenter selon la spec dans [PROJET_BRACELET_CONNECTE.md](PROJET_BRACELET_CONNECTE.md)

### "J'ai une question spécifique"
1. **Sur le frontend** → Voir [leguardian-frontend/README.md](leguardian-frontend/README.md)
2. **Sur le backend** → Voir [leguardian-backend/README.md](leguardian-backend/README.md)
3. **Sur le projet entier** → Voir [PROJECT_STATUS.md](PROJECT_STATUS.md)
4. **Sur les specs métier** → Voir [PROJET_BRACELET_CONNECTE.md](PROJET_BRACELET_CONNECTE.md)

### "Où est mon fichier ?"
→ Voir [FILES_CREATED.md](FILES_CREATED.md)

## 📂 Structure globale du repo

```
leguardian/
│
├── 📄 INDEX.md                         ← Tu es ici !
├── 📄 QUICK_START.md                   ← Lire en premier (5 min)
├── 📄 SETUP_FRONTEND.md                ← Guide frontend détaillé
├── 📄 PROJECT_STATUS.md                ← Status du projet
├── 📄 TODO_DEVELOPMENT.md              ← Roadmap + todo
├── 📄 FILES_CREATED.md                 ← Liste des fichiers
├── 📄 PROJET_BRACELET_CONNECTE.md      ← Spec métier complète
│
├── 📁 leguardian-backend/              ← Backend Laravel
│   ├── README.md
│   ├── composer.json
│   ├── .env.example
│   └── ... (app, config, database, routes, etc)
│
└── 📁 leguardian-frontend/             ← Frontend React
    ├── README.md
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.local
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── services/
        ├── stores/
        ├── types/
        ├── utils/
        ├── App.tsx
        └── index.css
```

## 🔑 Fichiers importants

### Frontend
```
leguardian-frontend/
├── src/App.tsx                    ← Routing principal
├── src/pages/LoginPage.tsx        ← Page login
├── src/pages/DashboardPage.tsx    ← Page dashboard
├── src/services/api.ts            ← Client HTTP
├── src/stores/authStore.ts        ← State auth
└── .env.local                     ← Variables env
```

### Backend
```
leguardian-backend/
├── routes/api.php                 ← Définition routes API
├── app/Models/Bracelet.ts         ← Model bracelet
├── app/Http/Controllers/          ← Controllers
└── .env                           ← Variables env
```

## 🚀 Commandes essentielles

### Frontend
```bash
cd leguardian-frontend

npm install         # Installation (1x)
npm run dev         # Dev server (http://localhost:5173)
npm run build       # Production build
npm run lint        # Check ESLint
```

### Backend
```bash
cd leguardian-backend

composer install    # Installation (1x)
php artisan serve   # Dev server (http://localhost:8000)
php artisan migrate # Run migrations
```

## 📋 Checklist avant de coder

- [ ] Lire QUICK_START.md
- [ ] `npm install` dans frontend
- [ ] `composer install` dans backend
- [ ] `.env.local` configuré (frontend)
- [ ] `.env` configuré (backend)
- [ ] `npm run dev` lancé (frontend)
- [ ] `php artisan serve` lancé (backend)
- [ ] Accès à http://localhost:5173 ✅
- [ ] Accès à http://localhost:8000 ✅

## 🎓 Stack technology

| Couche | Tech | Docs |
|--------|------|------|
| Frontend | React 19 + TypeScript + Vite | [README](leguardian-frontend/README.md) |
| Styling | TailwindCSS 4 | [Docs Tailwind](https://tailwindcss.com) |
| State | Zustand | [Docs Zustand](https://github.com/pmndrs/zustand) |
| HTTP | Axios | [Docs Axios](https://axios-http.com) |
| Routing | React Router 7 | [Docs RR](https://reactrouter.com) |
| Backend | Laravel 11 | [README](leguardian-backend/README.md) |
| Admin | Filament 4 | [Docs Filament](https://filamentphp.com) |
| Maps | Leaflet | [Docs Leaflet](https://leafletjs.com) |
| Mobile | Expo (à créer) | [Docs Expo](https://docs.expo.dev) |

## 🔗 Liens utiles

### Documentation officielle
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Laravel](https://laravel.com/docs)
- [Tailwind](https://tailwindcss.com)

### Outils
- [VSCode](https://code.visualstudio.com) - IDE
- [Git](https://git-scm.com) - Version control
- [Postman](https://postman.com) - API testing
- [DevTools](https://developer.chrome.com/docs/devtools) - Browser debugging

## 📞 Support / Questions

### Si tu as une question sur...

**Frontend**
→ Voir [leguardian-frontend/README.md](leguardian-frontend/README.md)

**Backend**
→ Voir [leguardian-backend/README.md](leguardian-backend/README.md)

**Specs métier**
→ Voir [PROJET_BRACELET_CONNECTE.md](PROJET_BRACELET_CONNECTE.md)

**Erreurs**
→ Voir section "Erreurs communes" dans [QUICK_START.md](QUICK_START.md)

**Architecture**
→ Lire [PROJECT_STATUS.md](PROJECT_STATUS.md)

## ✅ Status du projet

| Composant | Status | Docs |
|-----------|--------|------|
| Backend Laravel | ✅ Installé | [README](leguardian-backend/README.md) |
| Frontend React | ✅ Installé | [README](leguardian-frontend/README.md) |
| Mobile Expo | 📋 À créer | [TODO](TODO_DEVELOPMENT.md) |
| Spec complète | ✅ Validée | [Spec](PROJET_BRACELET_CONNECTE.md) |
| Documentation | ✅ Complète | Ce fichier |

## 🎯 Prochaines étapes

1. ✅ **Frontend installé** - Lancer `npm run dev`
2. ✅ **Backend installé** - Lancer `php artisan serve`
3. ⏳ **Tester connexion** - Créer un compte
4. ⏳ **Créer pages** - BraceletDetail, Events, Map
5. ⏳ **Intégrer maps** - Leaflet
6. ⏳ **Scanner QR** - Enregistrement bracelet
7. ⏳ **App mobile** - Expo + React Native

Voir [TODO_DEVELOPMENT.md](TODO_DEVELOPMENT.md) pour le roadmap détaillé.

## 📝 Notes

- **Tous les fichiers importants ont des README**
- **Configuration en variables d'environnement** (.env.local pour frontend, .env pour backend)
- **TypeScript strict** partout - type safety garantie
- **ESLint** configuré - code propre
- **TailwindCSS 4** - styling moderne
- **Zustand** pour state - simple et performant

## 🎓 Bon à savoir

1. **Imports** : Utiliser chemins relatifs (`../`) plutôt que alias (moins de config)
2. **Dev server** : Garde les 2 (frontend + backend) lancés en parallèle
3. **Git** : Committer régulièrement avec messages clairs
4. **Docs** : Lire la spec complète avant de coder une feature
5. **Testing** : Tester sur http://localhost:5173 en local avant de deployer

---

**Dernière mise à jour** : Novembre 2025
**Statut** : ✅ Setup complet, prêt à développer
**Version documentation** : 1.0

**Bon développement ! 🚀**
