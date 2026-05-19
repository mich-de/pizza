# PizzaRadar Sorrentum - Dynamic Roadmap

## [DEVOPS] Initial Setup
- [x] Clone repository
- [x] Analyze Docker/Coolify configuration
- [ ] Install dependencies (`npm install`)
- [ ] Setup environment variables (`.env`)

## [FRONTEND] Coolify Fix
- [x] Change Vite base path to `/` in `vite.config.js`
- [ ] Verify `index.html` asset paths in production build
- [ ] Test local production serving

## [BACKEND] Verification
- [ ] Verify Express server startup
- [ ] Check JSON file permissions/locking
- [ ] Test authentication flow (Login/JWT)

## [COOLIFY] Deployment
- [x] Fix CORS error during login (added 127.0.0.1 and dynamic local origin allowing in dev)
- [x] Advise user on setting `ALLOWED_ORIGINS` (improved logging provides this advice dynamically)
- [ ] Advise user on setting `VITE_BASE_PATH=/` (though now default)
