import express from 'express';
import { pool } from '../config/database.js';
import { PaymentService } from '../../payments.js';

const router = express.Router();

// Process deposit
router.post('/deposit', async (req, res) => {
  try {
    const { userId, amount, method, paymentDetails } = req.body;

    const depositAmount = await PaymentService.processDeposit(userId, amount, method);

    res.json({
      success: true,
      message: 'Deposit processed successfully',
      amount: depositAmount,
      newBalance: await getuserBalance(userId)
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Request withdrawal
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, amount, method, details } = req.body;

    const withdrawal = await PaymentService.processWithdrawal(userId, amount, method, details);

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      status: withdrawal.status
    });

  } catch (error: any) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get withdrawal methods
router.get('/withdrawal-methods', async (req, res) => {
  try {
    const methods = [
      {
        id: 'orange_money',
        name: 'Orange Money',
        countries: ['CI', 'SN', 'CM', 'BF', 'CD', 'MG'], // RDC ajoutée
        minAmount: 5,
        maxAmount: 1000,
        fees: 0.02
      },
      {
        id: 'airtel_money',
        name: 'Airtel Money',
        countries: ['KE', 'UG', 'TZ', 'RW', 'CD', 'ZM', 'MG'], // RDC ajoutée
        minAmount: 5,
        maxAmount: 1000,
        fees: 0.02
      },
      {
        id: 'mpesa',
        name: 'MPesa (Vodacom)',
        countries: ['CD', 'TZ', 'KE'], // Vodacom MPesa principal en RDC
        minAmount: 5,
        maxAmount: 1000,
        fees: 0.02
      },
      {
        id: 'africell_money',
        name: 'Africell Money',
        countries: ['CD', 'UG', 'GM', 'SL'], // Africell présent en RDC
        minAmount: 5,
        maxAmount: 1000,
        fees: 0.02
      },
      {
        id: 'mtn_money',
        name: 'MTN Mobile Money',
        countries: ['CI', 'GH', 'CM', 'UG', 'RW', 'ZA'], // MTN pas en RDC
        minAmount: 5,
        maxAmount: 1000,
        fees: 0.02
      },
      {
        id: 'paypal',
        name: 'PayPal',
        countries: ['ALL'],
        minAmount: 10,
        maxAmount: 5000,
        fees: 0.03
      },
      {
        id: 'bank_card',
        name: 'Carte Bancaire',
        countries: ['ALL'],
        minAmount: 10,
        maxAmount: 5000,
        fees: 0.025
      }
    ];

    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user transactions
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT amount, type, status, created_at FROM transactions WHERE user_id = $1`;
    let countQuery = `SELECT COUNT(*) FROM transactions WHERE user_id = $1`;
    const params: any[] = [userId];

    if (type) {
      query += ` AND type = $2`;
      countQuery += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const transactions = await pool.query(query, params);
    const total = await pool.query(countQuery, [userId, ...(type ? [type] : [])]);

    res.json({
      success: true,
      transactions: transactions.rows,
      total: parseInt(total.rows[0].count),
      page: Number(page),
      totalPages: Math.ceil(parseInt(total.rows[0].count) / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

async function getuserBalance(userId: number) {
  const result = await pool.query(
    'SELECT balance FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0].balance;
}

export default router;