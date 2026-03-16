# ITECH-SK Habit Tracker

A Django + vanilla JS habit tracking app.

## Project structure

- `backend/` Django API + auth/session handling
- `frontend/` static UI pages and JS
- `.env.example` environment variable template for local/dev/deploy configs

## 1) Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy environment variables from project root:

```bash
cp ../.env.example .env
```

Then run backend:

```bash
python manage.py migrate
python manage.py runserver
```

## 2) Frontend setup

Serve the `frontend/` folder using any static server, for example:

```bash
cd frontend
python -m http.server 5500
```

Open:
- `http://127.0.0.1:5500/login.html`
- `http://127.0.0.1:5500/register.html`
- `http://127.0.0.1:5500/index.html`

## 3) Run tests

```bash
cd backend
python manage.py test
```

## Configuration notes

- All backend security/deployment-sensitive values are env-driven (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`).
- **Frontend API URL:** The frontend automatically determines the backend URL (see `frontend/config.js`):
  - **Production:** Uses a same-origin empty prefix via Netlify `_redirects` proxy to bypass CORS and iOS ITP strict third-party cookie blocking.
  - **Local Development:** Fallbacks to `http://127.0.0.1:8000`. No manual URL changes are needed for local testing.