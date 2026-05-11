# PRD: Dashboard CI/CD (GitHub Actions + Vercel)

## 1. Overview
Automate testing and deployment for Smart Office Dashboard. Ensure broken code never reaches production.

## 2. Scope
- **CI (Continuous Integration):** GitHub Actions.
- **CD (Continuous Deployment):** Vercel (Automatic).
- **Target:** `dashboard/` directory only. Firmware and GAS excluded.

## 3. Triggers
- Pull Request to `main` or `develop`.
- Push to `main` or `develop`.

## 4. Pipeline Steps (GitHub Actions)
1. **Checkout Code:** Fetch repository.
2. **Setup Node:** Use Node.js 20.
3. **Install Deps:** `npm ci` in `dashboard/`.
4. **Lint & Type Check:** `npm run lint` and `npx tsc --noEmit`.
5. **Test:** `npm test -- --run` (Vitest).
6. **Build:** `npm run build` (Vite).

## 5. Deployment (Vercel)
- Vercel app linked to GitHub repo.
- Vercel auto-deploys on push.
- **Vercel Settings:** Require GitHub Actions CI to pass before Vercel promotes to Production.

## 6. Secrets
- No secrets needed for CI (mock data in tests). Vercel holds `VITE_GAS_URL` and `VITE_SPREADSHEET_ID`.
