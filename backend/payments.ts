import { pool } from './src/config/database.js';
import { WalletService } from './wallets.js';

export class PaymentService {
  // Process withdrawal request
  static async processWithdrawal(userId: number, amount: number, method: string, details: any) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check user balance
      const userResult = await client.query(
        'SELECT balance, bonus_balance FROM users WHERE id = $1',
        [userId]
      );
      
      const user = userResult.rows[0];
      if (user.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from user balance
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amount, userId]
      );

      // Calculate admin commission (2% on withdrawals)
      const adminCommission = amount * 0.02;
      const userAmount = amount * 0.98;

      // Record withdrawal
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (user_id, amount, method, details, status, admin_commission)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING *`,
        [userId, userAmount, method, details, adminCommission]
      );

      // Update admin earnings
      await client.query(
        `UPDATE admin_earnings 
         SET total_commission = total_commission + $1,
             total_earnings = total_earnings + $1
         WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
        [adminCommission]
      );

      await client.query('COMMIT');
      return withdrawalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Process deposit
  static async processDeposit(userId: number, amount: number, method: string) {
    await WalletService.updateBalanceWithCommission(userId, amount, 'deposit');
    
    // Record deposit with admin commission
    const depositAmount = amount * 0.9; // User gets 90%
    const adminCommission = amount * 0.1; // Admin gets 10%
    
    await pool.query(
      `INSERT INTO transactions (user_id, amount, type, status, admin_commission)
       VALUES ($1, $2, 'deposit', 'completed', $3)`,
      [userId, depositAmount, adminCommission]
    );

    return depositAmount;
  }
}