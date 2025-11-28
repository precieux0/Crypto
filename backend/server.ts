import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createAdminUser } from './verifications.js';

config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json());

// Routes
app.use('/api/auth', (await import('./src/routes/auth.js')).default);
app.use('/api/games', (await import('./src/routes/games.js')).default);
app.use('/api/payments', (await import('./src/routes/payments.js')).default);
app.use('/api/admin', (await import('./src/routes/admin.js')).default);
app.use('/api/ads', (await import('./src/routes/ads.js')).default);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize admin user
createAdminUser();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Admin email: ${process.env.ADMIN_EMAIL}`);
});