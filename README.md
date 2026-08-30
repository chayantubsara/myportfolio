# Chayon Tubsoro - Network Engineering Portfolio

A deployable personal portfolio and CMS built with React, Vite, TypeScript, Google Apps Script, Google Sheets, and Google Drive.

## Privacy defaults

- The residential address and phone number from the source resume are not committed or seeded.
- The source resume is not copied into `public/`.
- Resume and certificate documents start with `visibility: private` and `publicDocument: false`.
- The backend verifies both flags before returning any document.
- GitHub, LinkedIn, and portfolio links stay empty until added in Admin.

## Local frontend

```bash
pnpm install
copy .env.example .env.local
pnpm dev
pnpm build
```

Set `VITE_GAS_API_URL` in `.env.local` after deploying Apps Script. Without it, the frontend uses the privacy-safe Resume-derived fallback content.

## Google Sheet and Drive setup

1. Create a blank Google Sheet.
2. Copy its ID from the URL.
3. Open [Google Apps Script](https://script.google.com/) and create a project.
4. Copy `gas/Code.gs` and `gas/appsscript.json` into the Apps Script project.
5. In **Project Settings > Script Properties**, add:
   - `SPREADSHEET_ID`: the Sheet ID
   - `ADMIN_USERNAME`: initial username or email
   - `ADMIN_INITIAL_PASSWORD`: a strong temporary password
   - `SESSION_SECRET`: a long random secret
   - `DRIVE_FOLDER_ID`: optional; setup creates a folder if omitted
6. Run `setupPortfolioSystem()` once and authorize Sheets/Drive access.
7. Review the execution log. It lists the created sheets and setup result.
8. Deploy as **Web app**, execute as yourself, and allow access to anyone. Public calls are read-only; mutations require a valid expiring session.
9. Copy the `/exec` deployment URL into `VITE_GAS_API_URL`.
10. Sign in at `/#/admin` and change the initial password.

## Sheets created automatically

`settings`, `admins`, `profile`, `education`, `experience`, `skills`, `projects`, `project_images`, `certifications`, `awards`, `social_links`, `documents`, and `audit_logs`.

All records use IDs, timestamps, visibility, and sort order. Audit logs are read-only from Admin.

## Documents

Supported uploads are PDF, JPG, JPEG, PNG, and WEBP up to 8 MB. Files are private by default. For larger files, upload to the configured Drive folder and enter the Drive File ID in Admin.

Before making a resume public, upload a reviewed/redacted PDF, then explicitly set both `visibility` to `public` and `publicDocument` to `true`. PDF.js loads the file only after the visitor clicks View.

## GitHub Pages deployment

1. Push this project to a repository named `chayon-network-portfolio`.
2. In repository **Settings > Pages**, select **GitHub Actions**.
3. Add repository variables `VITE_GAS_API_URL` and `VITE_SITE_URL`.
4. Push to `main` or run the workflow manually.

Hash routing (`/#/projects/:id` and `/#/admin`) avoids GitHub Pages refresh 404 errors.

## Security notes

- No passwords, password hashes, Sheet IDs, Drive folder IDs, or session secrets are sent to the frontend.
- Passwords use a per-admin salt plus SHA-256 and the server-side session secret.
- Login attempts are rate-limited; repeated failures cause a temporary lockout.
- Admin sessions expire after six hours and are stored in Apps Script cache.
- Public responses omit phone, address, Drive IDs, and private document IDs.
- Inputs are schema-limited and basic HTML delimiters are stripped server-side.
- Every login and mutation is recorded in `audit_logs`.

## Source map

- `src/`: readable React application source
- `gas/`: Google Apps Script backend and manifest
- `design/`: generated visual concepts used as the implementation reference
- `dist/`: generated production output; do not edit directly
