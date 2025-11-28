import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { WalletService } from '../../wallets.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, referral_code } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate referral code
    const userReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    let referredBy = null;
    
    // Check referral code
    if (referral_code) {
      const referrer = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referral_code]);
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id;
        
        // Give bonus to referrer
        await pool.query(
          'UPDATE users SET bonus_balance = bonus_balance + 10 WHERE id = $1',
          [referredBy]
        );
      }
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, referral_code, referred_by, balance, bonus_balance) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, role, balance, bonus_balance, referral_code`,
      [email, hashedPassword, userReferralCode, referredBy, 5, 5] // 5$ bonus for registration
    );

    const user = result.rows[0];

    // Create wallet for user
    await WalletService.createWallet(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // ADMIN COMMISSION: 50% du bonus d'inscription
    await pool.query(
      `UPDATE admin_earnings 
       SET referral_earnings = referral_earnings + 2.5,
           total_earnings = total_earnings + 2.5
       WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
        bonus_balance: user.bonus_balance,
        referral_code: user.referral_code
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        balance: user.balance,
        bonus_balance: user.bonus_balance,
        total_earnings: user.total_earnings
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const result = await pool.query(
      'SELECT id, email, role, balance, bonus_balance, total_earnings, referral_code, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;