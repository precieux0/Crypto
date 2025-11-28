import express from 'express';
import { pool } from '../config/database.js';
import { WalletService } from '../../wallets.js';

const router = express.Router();

// Play slot game
router.post('/slots', async (req, res) => {
  try {
    const { userId, betAmount } = req.body;

    // Verify user balance
    const userResult = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].balance < betAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Simulate slot game
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎'];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Calculate win
    let winAmount = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      // Jackpot - 10x
      winAmount = betAmount * 10;
    } else if (result[0] === result[1] || result[1] === result[2]) {
      // Small win - 2x
      winAmount = betAmount * 2;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (winAmount > 0) {
        // User wins
        const adminCommission = winAmount * 0.15; // 15% for admin
        
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [winAmount - adminCommission, userId]
        );

        // Update admin earnings
        await client.query(
          `UPDATE admin_earnings 
           SET game_commission = game_commission + $1,
               total_earnings = total_earnings + $1
           WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
          [adminCommission]
        );

        // Record game with admin commission
        await client.query(
          `INSERT INTO games (user_id, game_type, bet_amount, win_amount, result, admin_commission)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'slots', betAmount, winAmount - adminCommission, 'win', adminCommission]
        );

      } else {
        // User loses - admin gets 20% of the bet
        const adminCommission = betAmount * 0.2;
        
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [betAmount, userId]
        );

        // Update admin earnings
        await client.query(
          `UPDATE admin_earnings 
           SET game_commission = game_commission + $1,
               total_earnings = total_earnings + $1
           WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
          [adminCommission]
        );

        // Record game
        await client.query(
          `INSERT INTO games (user_id, game_type, bet_amount, win_amount, result, admin_commission)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'slots', betAmount, 0, 'loss', adminCommission]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        result,
        winAmount: winAmount > 0 ? winAmount - (winAmount * 0.15) : 0,
        balance: userResult.rows[0].balance + (winAmount > 0 ? winAmount - (winAmount * 0.15) : -betAmount)
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Slot game error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Play dice game
router.post('/dice', async (req, res) => {
  try {
    const { userId, betAmount, prediction } = req.body;

    const userResult = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].balance < betAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Roll dice
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const win = diceRoll === prediction;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (win) {
        const winAmount = betAmount * 5; // 5x for correct prediction
        const adminCommission = winAmount * 0.15; // 15% for admin

        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [winAmount - adminCommission, userId]
        );

        // Update admin earnings
        await client.query(
          `UPDATE admin_earnings 
           SET game_commission = game_commission + $1,
               total_earnings = total_earnings + $1
           WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
          [adminCommission]
        );

        await client.query(
          `INSERT INTO games (user_id, game_type, bet_amount, win_amount, result, admin_commission)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'dice', betAmount, winAmount - adminCommission, 'win', adminCommission]
        );

      } else {
        const adminCommission = betAmount * 0.2; // 20% for admin

        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [betAmount, userId]
        );

        await client.query(
          `UPDATE admin_earnings 
           SET game_commission = game_commission + $1,
               total_earnings = total_earnings + $1
           WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
          [adminCommission]
        );

        await client.query(
          `INSERT INTO games (user_id, game_type, bet_amount, win_amount, result, admin_commission)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'dice', betAmount, 0, 'loss', adminCommission]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        diceRoll,
        win,
        winAmount: win ? betAmount * 5 - (betAmount * 5 * 0.15) : 0,
        balance: userResult.rows[0].balance + (win ? betAmount * 5 - (betAmount * 5 * 0.15) : -betAmount)
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Dice game error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user game history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const history = await pool.query(
      `SELECT game_type, bet_amount, win_amount, result, created_at 
       FROM games 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const total = await pool.query('SELECT COUNT(*) FROM games WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      games: history.rows,
      total: parseInt(total.rows[0].count),
      page: Number(page),
      totalPages: Math.ceil(parseInt(total.rows[0].count) / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;