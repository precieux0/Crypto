// Route pour voir tous les retraits
router.get('/withdrawals', adminAuth, async (req, res) => {
  const { status, page = 1 } = req.query;
  
  const withdrawals = await pool.query(`
    SELECT w.*, u.email, u.balance 
    FROM withdrawals w 
    JOIN users u ON w.user_id = u.id 
    ${status ? 'WHERE w.status = $1' : ''}
    ORDER BY w.created_at DESC 
    LIMIT 20 OFFSET $2
  `, status ? [status, (page - 1) * 20] : [(page - 1) * 20]);

  // Statistiques des frais pour l'admin
  const feesStats = await pool.query(`
    SELECT 
      SUM(fee_amount) as total_fees,
      COUNT(*) as total_withdrawals,
      SUM(net_amount) as total_paid
    FROM withdrawals 
    WHERE status = 'completed'
  `);

  res.json({
    success: true,
    withdrawals: withdrawals.rows,
    stats: feesStats.rows[0]
  });
});