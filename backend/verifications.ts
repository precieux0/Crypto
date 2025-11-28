import bcrypt from 'bcryptjs';
import { pool } from './src/config/database.js';

export async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if admin already exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [adminEmail, 'admin']
    );

    if (result.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword!, 12);
      
      await pool.query(
        `INSERT INTO users (email, password, role, is_verified, balance, bonus_balance, total_earnings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [adminEmail, hashedPassword, 'admin', true, 1000000, 500000, 0]
      );

      console.log('✅ Admin user created successfully');
      
      // Create admin earnings record
      await pool.query(
        `INSERT INTO admin_earnings (admin_id, total_commission, referral_earnings, ad_revenue, game_commission, total_earnings)
         VALUES ((SELECT id FROM users WHERE email = $1), 0, 0, 0, 0, 0)`,
        [adminEmail]
      );
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}