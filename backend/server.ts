import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createAdminUser } from './verifications.js';

// Import des routes (STATIQUES au lieu de dynamiques)
import authRoutes from './src/routes/auth.js';
import gamesRoutes from './src/routes/games.js';
import paymentsRoutes from './src/routes/payments.js';
import adminRoutes from './src/routes/admin.js';
import adsRoutes from './src/routes/ads.js';

config();

const app = express();
const PORT = process.env.PORT || 10000; // Render utilise 10000

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['https://cryptowin-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(limiter);
app.use(express.json());

// Routes (IMPORTS STATIQUES)
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adsRoutes);

// Health check (ESSENTIEL pour Render)
app.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'OK', 
    message: 'CryptoWin Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req: any, res: any) => {
  res.json({ 
    success: true, 
    message: 'API is working!' 
  });
});

// Initialize admin user
createAdminUser();

app.listen(PORT, () => {
  console.log(`🚀 CryptoWin Backend running on port ${PORT}`);
});