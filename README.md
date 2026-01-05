# Servite Admin Panel

A minimal full‑stack admin panel to manage services in Firestore.

- Backend: Node.js + Express + Firebase Admin SDK (`backend/`)
- Frontend: React + Vite (no Tailwind, simple CSS) (`frontend/`)

Your Firestore structure (as per screenshots):

- Collection: `services`
  - Doc: `menservices` | `womenservices`
    - Fields: `category` ("men"|"women"), `isActive` (bool), `createdAt` (ms)
    - Sub-collection: `serviceList`
      - Doc: Service name (e.g., `AC Repair`, `Hair Styling`)
        - Fields: `name`, `description`, `icon`, `isActive`, `subServices` (array of objects)
        - Each subService: `{ id, name, description, unit, minPrice, maxPrice }`

## 1) Backend setup

1. Go to the Firebase Console → Project Settings → Service accounts → Generate new private key.
2. Copy the JSON values into environment variables. Duplicate `backend/.env.example` as `backend/.env` and fill:

```
PORT=5050
CORS_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=serveit-1f333
FIREBASE_CLIENT_EMAIL=your-service-account@serveit-1f333.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n
```

Note: In `.env`, keep `\n` for line breaks in the private key.

3. Install and run:

```
cd backend
npm install
npm run dev
```

Server runs at: `http://localhost:5050` → health: `GET /api/health`

### Backend API

- `GET /api/categories` → list existing categories
- `POST /api/categories` body `{ category: "men" | "women" }`
- `PATCH /api/categories/:categoryId` body `{ isActive?: boolean, category?: 'men'|'women' }`
- `DELETE /api/categories/:categoryId`

- `GET /api/categories/:categoryId/services`
- `POST /api/categories/:categoryId/services` body `{ name, description?, icon?, isActive?, subServices? }`
- `GET /api/categories/:categoryId/services/:serviceId`
- `PATCH /api/categories/:categoryId/services/:serviceId`
- `DELETE /api/categories/:categoryId/services/:serviceId`

- `POST /api/categories/:categoryId/services/:serviceId/subservices` body `{ name, description?, unit?, minPrice?, maxPrice? }`
- `PATCH /api/categories/:categoryId/services/:serviceId/subservices/:subId`
- `DELETE /api/categories/:categoryId/services/:serviceId/subservices/:subId`

## 2) Frontend setup

1. Create `frontend/.env` from the example and set API URL (leave default if using ports above):

```
VITE_API_URL=http://localhost:5050/api
```

2. Install and run:

```
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`.

## 3) Notes

- The UI is intentionally simple and clean without Tailwind. CSS is in `frontend/src/styles.css`.
- Document IDs for services are kept readable (`name` with spaces) to match your screenshots.
- You can create categories with the buttons, add services, and manage sub‑services in the service detail page.

## 4) Troubleshooting

- If you see Firebase admin credential errors, re-check `.env` values and that private key uses `\\n` for newlines.
- CORS: ensure `CORS_ORIGIN` includes the frontend origin (comma‑separated for multiple origins).
