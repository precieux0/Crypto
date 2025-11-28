import { pool } from '../config/database.js';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  bonus_balance: number;
  total_earnings: number;
  referral_code: string;
  referred_by: number;
  is_verified: boolean;
  created_at: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async create(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password, role, balance, bonus_balance, total_earnings, referral_code, referred_by, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userData.email,
        userData.password,
        userData.role,
        userData.balance,
        userData.bonus_balance,
        userData.total_earnings,
        userData.referral_code,
        userData.referred_by,
        userData.is_verified
      ]
    );
    return result.rows[0];
  }

  static async updateBalance(userId: number, amount: number): Promise<void> {
    await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [amount, userId]
    );
  }
}