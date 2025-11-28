import { pool } from '../config/database.js';

export interface AdminEarnings {
  id: number;
  admin_id: number;
  total_commission: number;
  referral_earnings: number;
  ad_revenue: number;
  game_commission: number;
  total_earnings: number;
  last_updated: Date;
}

export class AdminEarningsModel {
  static async getAdminStats(adminId: number): Promise<AdminEarnings> {
    const result = await pool.query(
      'SELECT * FROM admin_earnings WHERE admin_id = $1',
      [adminId]
    );
    return result.rows[0];
  }

  static async updateAdRevenue(adminId: number, amount: number): Promise<void> {
    await pool.query(
      `UPDATE admin_earnings 
       SET ad_revenue = ad_revenue + $1,
           total_earnings = total_earnings + $1,
           last_updated = NOW()
       WHERE admin_id = $2`,
      [amount, adminId]
    );
  }
}