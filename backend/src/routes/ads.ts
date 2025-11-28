import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Watch ad and earn rewards
router.post('/watch', async (req, res) => {
  try {
    const { userId, adType } = req.body;

    // Calculate reward based on ad type
    let reward = 0;
    let adminCommission = 0;

    switch (adType) {
      case 'short_video':
        reward = 0.10;
        adminCommission = reward * 0.3; // 30% for admin
        break;
      case 'survey':
        reward = 0.50;
        adminCommission = reward * 0.25; // 25% for admin
        break;
      case 'offer_wall':
        reward = 1.00;
        adminCommission = reward * 0.2; // 20% for admin
        break;
      default:
        reward = 0.05;
        adminCommission = reward * 0.3;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user balance
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [reward - adminCommission, userId]
      );

      // Update admin earnings
      await client.query(
        `UPDATE admin_earnings 
         SET ad_revenue = ad_revenue + $1,
             total_earnings = total_earnings + $1
         WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
        [adminCommission]
      );

      // Record ad view
      await client.query(
        `INSERT INTO ad_views (user_id, ad_type, reward, admin_commission)
         VALUES ($1, $2, $3, $4)`,
        [userId, adType, reward - adminCommission, adminCommission]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Ad reward credited',
        reward: reward - adminCommission,
        balance: await getuserBalance(userId)
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Ad reward error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get available ads
router.get('/available', async (req, res) => {
  try {
    const ads = [
      {
        id: 1,
        type: 'short_video',
        title: 'Regarder une vidéo courte',
        description: 'Regardez une vidéo de 30 secondes et gagnez des récompenses',
        reward: 0.07, // After admin commission
        duration: 30,
        category: 'entertainment'
      },
      {
        id: 2,
        type: 'survey',
        title: 'Répondre à un sondage',
        description: 'Participez à un sondage rapide',
        reward: 0.38, // After admin commission
        duration: 120,
        category: 'survey'
      },
      {
        id: 3,
        type: 'offer_wall',
        title: 'Tester une application',
        description: 'Téléchargez et testez une application',
        reward: 0.80, // After admin commission
        duration: 300,
        category: 'app_download'
      },
      {
        id: 4,
        type: 'short_video',
        title: 'Découvrir un nouveau produit',
        description: 'Vidéo publicitaire de 45 secondes',
        reward: 0.10,
        duration: 45,
        category: 'product_review'
      }
    ];

    res.json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user ad history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const history = await pool.query(
      `SELECT ad_type, reward, created_at 
       FROM ad_views 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const total = await pool.query('SELECT COUNT(*) FROM ad_views WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      ads: history.rows,
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