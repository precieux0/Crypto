import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user is admin
    const user = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND role = $2',
      [decoded.userId, 'admin']
    );

    if (!user.rows[0]) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    (req as any).user = user.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};