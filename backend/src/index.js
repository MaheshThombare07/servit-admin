import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import servicesRouter from './routes/services.js';
import partnersRouter from './routes/partners.js';
import usersRouter from './routes/users.js';
import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

import { requireAuth } from './middleware/auth.js';
import { ensureFirebaseInitialized } from './lib/firebase.js';

dotenv.config();

const app = express();

/* -------------------- Firebase -------------------- */
ensureFirebaseInitialized();

/* -------------------- CORS (FINAL, STABLE) -------------------- */
/*
  - Works with Vercel frontend
  - Works with Render backend
  - Passes OPTIONS preflight
  - Supports credentials
  - Do NOT change this
*/
app.use(cors({
  origin: true,          // reflect request origin
  credentials: true,
}));

app.options('*', cors({
  origin: true,
  credentials: true,
}));

/* -------------------- Middleware -------------------- */
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

/* -------------------- Health Check -------------------- */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

/* -------------------- Public Routes -------------------- */
app.use('/api', authRouter);

/* -------------------- Protected Routes -------------------- */
app.use('/api', requireAuth);
app.use('/api', servicesRouter);
app.use('/api', partnersRouter);
app.use('/api', usersRouter);
app.use('/api', bookingsRouter);
app.use('/api', adminRouter);

/* -------------------- Server -------------------- */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

/* -------------------- Global Error Handler -------------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err?.message || err);
  const status = err?.status || 500;
  res.status(status).json({
    ok: false,
    error: err?.message || 'Internal Server Error',
  });
});
