# Mój Polski
Personal Polish vocabulary trainer, built with React, TypeScript, Vite and Supabase.

Features: CSV import, flashcards, writing, quizzes, dictation, listening comprehension, spaced repetition, learning statistics, JSON backups and version-checked cloud snapshots. Installable PWA with cached application assets.

## Local development
Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env.local`, configure the Supabase project URL and publishable key, then run `npm run dev`. The database requires `cloud-setup.sql` and a manually provisioned email/password account. Disable public and anonymous signups. Never use a secret or service-role key in the client.

## Deployment
Set repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Select GitHub Actions as the Pages source. Push to main. Open the deployed URL in Safari and add it to the Home Screen.

Offline use requires an initial online visit and cached session/data. Conflicting snapshots are not automatically merged; export local changes before resolving conflicts. Cloud sync is not a substitute for backups.
