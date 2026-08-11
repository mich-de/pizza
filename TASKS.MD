# Project Tasks Roadmap

This file tracks the status of all backend, frontend, and deployment tasks for the Pizza Penisola project.

---

## Completed Tasks

* [x] **[DEVOPS]** Configure environment variables in `docker-compose.yaml` (`HOST=0.0.0.0`, `PORT=3000`, `TRUST_PROXY=1`) for reverse proxy setup.
* [x] **[BACKEND]** Enable `trust proxy` in Express application setup.
* [x] **[BACKEND]** Update `seedAdmin` to dynamically sync the admin username and password from environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH`).
* [x] **[BACKEND]** Add forced password change (`mustChangePassword: true`) when admin credentials are seeded or changed.
* [x] **[BACKEND]** Return `mustChangePassword` status during login API and admin state fetches.
* [x] **[BACKEND]** Add logic to clear `mustChangePassword` when `/api/auth/change-password` succeeds.
* [x] **[FRONTEND]** Implement inline password reset form in `Login.jsx` when the server requires a password change.
* [x] **[FRONTEND]** Remove insecure inline login form from `AdminPanel.jsx` and enforce secure redirection to `/login` for unauthenticated admin sessions.
* [x] **[FRONTEND]** Design and style upgrades (brutalist aesthetics, responsive mobile grid layouts, card hover effects, custom keyframe transitions).
* [x] **[TESTS]** Fix vitest integration suite by dynamically loading the application index after setting mock environment variables to prevent HTTP server startup conflicts.
* [x] **[TESTS]** Ensure linting, unit/integration testing, and production Vite compilation succeed.
* [x] **[TESTS]** Resolve all ESLint issues, ensuring `npm run lint` passes with zero errors.
* [x] **[TESTS]** Resolve Vitest worker-thread lockups and connection timeouts by configuring the forks pool option in `vite.config.js`.


---

## Next Steps & Future Enhancements

* [ ] **[DEVOPS]** Set up CI/CD GitHub Action configuration for automatic image build and deployment on Coolify.
* [ ] **[SECURITY]** Audit all API controllers for proper CSRF verification.
* [ ] **[FRONTEND]** Enhance i18n translation keys mapping to ensure coverage for all new password update prompt labels in Italian (`it.json`) and English (`en.json`).
