import Web3 from 'web3';
import { pool } from './src/config/database.js';

const web3 = new Web3(process.env.BSC_NETWORK || 'https://bsc-dataseed.binance.org/');

export class WalletService {
  // Generate new wallet for user
  static async createWallet(userId: number) {
    try {
      const account = web3.eth.accounts.create();
      
      await pool.query(
        'INSERT INTO wallets (user_id, address, private_key_encrypted) VALUES ($1, $2, $3)',
        [userId, account.address, this.encryptPrivateKey(account.privateKey)]
      );
      
      return account.address;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Encrypt private key (in production, use proper encryption)
  private static encryptPrivateKey(privateKey: string): string {
    // TODO: Implement proper encryption
    return Buffer.from(privateKey).toString('base64');
  }

  // Get user wallet balance
  static async getBalance(userId: number) {
    const result = await pool.query(
      'SELECT balance, bonus_balance FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0];
  }

  // Update user balance with admin commission
  static async updateBalanceWithCommission(userId: number, amount: number, type: string) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Calculate admin commission (10%)
      const adminCommission = amount * 0.1;
      const userAmount = amount * 0.9;

      // Update user balance
      await client.query(
        'UPDATE users SET balance = balance + $1, total_earnings = total_earnings + $1 WHERE id = $2',
        [userAmount, userId]
      );

      // Update admin earnings
      await client.query(
        `UPDATE admin_earnings 
         SET total_commission = total_commission + $1,
             total_earnings = total_earnings + $1
         WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
        [adminCommission]
      );

      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, admin_commission)
         VALUES ($1, $2, $3, 'completed', $4)`,
        [userId, userAmount, type, adminCommission]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}