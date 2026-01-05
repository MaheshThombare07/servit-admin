import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import servicesRouter from './routes/services.js';
import partnersRouter from './routes/partners.js';
import usersRouter from './routes/users.js';
import bookingsRouter from './routes/bookings.js';
import { ensureFirebaseInitialized } from './lib/firebase.js';

dotenv.config();

ensureFirebaseInitialized();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

app.use('/api', servicesRouter);
app.use('/api', partnersRouter);
app.use('/api', usersRouter);
app.use('/api', bookingsRouter);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Global error handler (last)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[error]', err?.message || err);
  const status = err?.status || 500;
  res.status(status).json({
    ok: false,
    error: err?.message || 'Internal Server Error',
  });
});
