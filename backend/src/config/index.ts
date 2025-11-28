import { config } from 'dotenv';

config();

export const CONFIG = {
  // Database
  database: {
    url: process.env.DATABASE_URL!
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!
  },
  
  // Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!
  },
  
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID!,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
    mode: process.env.PAYPAL_MODE || 'sandbox'
  },
  
  flutterwave: {
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY!,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY!
  },
  
  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    withdrawalFeePercentage: parseFloat(process.env.ADMIN_WITHDRAWAL_FEE_PERCENTAGE || '70')
  },
  
  // App
  app: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL!
  }
};

// Validation des variables obligatoires
const required = [
  'DATABASE_URL', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD',
  'STRIPE_SECRET_KEY', 'PAYPAL_CLIENT_ID'
];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  Variable manquante: ${key}`);
  }
}