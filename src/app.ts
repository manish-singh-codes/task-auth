import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { redis } from './config/redis';
import { errorHandler, notFound } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';

const app = express();

// needed so req.ip is the real client IP when running behind a proxy / load balancer
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', redis: redis.status });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
