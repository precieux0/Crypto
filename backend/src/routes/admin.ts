import express from 'express';
import { pool } from '../config/database.js';
import { adminAuth } from '../middleware/admin.js';

const router = express.Router();

// Get admin dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_today,
        (SELECT SUM(balance) FROM users) as total_balances,
        (SELECT SUM(amount) FROM transactions WHERE type = 'deposit') as total_deposits,
        (SELECT SUM(amount) FROM withdrawals WHERE status = 'completed') as total_withdrawals,
        (SELECT total_earnings FROM admin_earnings LIMIT 1) as admin_earnings
    `);

    const recentUsers = await pool.query(`
      SELECT email, balance, created_at 
      FROM users 
      WHERE role = 'user' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    const recentTransactions = await pool.query(`
      SELECT t.amount, t.type, t.created_at, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      recentUsers: recentUsers.rows,
      recentTransactions: recentTransactions.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const users = await pool.query(
      `SELECT id, email, balance, bonus_balance, total_earnings, created_at 
       FROM users 
       WHERE role = 'user' 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await pool.query('SELECT COUNT(*) FROM users WHERE role = "user"');

    res.json({
      success: true,
      users: users.rows,
      total: parseInt(total.rows[0].count),
      page: Number(page),
      totalPages: Math.ceil(parseInt(total.rows[0].count) / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update user balance (admin)
router.post('/users/:userId/balance', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type } = req.body;

    await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [amount, userId]
    );

    // Record admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [(req as any).user.userId, 'balance_update', userId, `Added ${amount} to balance`]
    );

    res.json({ success: true, message: 'Balance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get financial reports
router.get('/reports/financial', adminAuth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    const report = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(amount) as total_amount,
        SUM(admin_commission) as total_commission
      FROM transactions 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({ success: true, report: report.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;