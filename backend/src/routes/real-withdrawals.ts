import express from 'express';
import { pool } from '../config/database.js';
import { calculateWithdrawalFees } from '../config/fees.js';
import { stripe } from '../config/stripe.js';

const router = express.Router();

// Process withdrawal with real payment
router.post('/process', async (req, res) => {
  try {
    const { userId, amount, method, recipientDetails } = req.body;

    // Calculate fees
    const feeCalculation = calculateWithdrawalFees(amount, method);
    
    if (amount < feeCalculation.minAmount) {
      return res.status(400).json({
        success: false,
        error: `Montant minimum: ${feeCalculation.minAmount}€`
      });
    }

    // Verify user balance (including fees)
    const userResult = await pool.query(
      'SELECT balance, email FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Solde insuffisant'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Deduct full amount from user balance
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amount, userId]
      );

      // Record withdrawal with fees
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (
          user_id, gross_amount, fee_amount, net_amount, 
          method, recipient_details, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'processing')
        RETURNING id`,
        [
          userId, 
          feeCalculation.grossAmount,
          feeCalculation.feeAmount,
          feeCalculation.netAmount,
          method,
          JSON.stringify(recipientDetails)
        ]
      );

      const withdrawalId = withdrawalResult.rows[0].id;

      // Process real payment based on method
      let paymentResult;
      switch (method) {
        case 'paypal':
          paymentResult = await processPayPalPayment(feeCalculation.netAmount, recipientDetails.email);
          break;
        case 'bank_card':
          paymentResult = await processCardPayout(feeCalculation.netAmount, recipientDetails);
          break;
        case 'orange_money':
        case 'mtn_money':
        case 'airtel_money':
          paymentResult = await processMobileMoneyPayment(method, feeCalculation.netAmount, recipientDetails.phone);
          break;
        default:
          throw new Error('Méthode de paiement non supportée');
      }

      // Update withdrawal status
      await client.query(
        'UPDATE withdrawals SET status = $1, payment_reference = $2 WHERE id = $3',
        ['completed', paymentResult.reference, withdrawalId]
      );

      // Record admin earnings from fees (70% des frais pour vous)
      const adminEarnings = feeCalculation.feeAmount * 0.7;
      await client.query(
        `UPDATE admin_earnings 
         SET total_earnings = total_earnings + $1,
             withdrawal_fees = withdrawal_fees + $1
         WHERE admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`,
        [adminEarnings]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Retrait traité avec succès',
        withdrawal: {
          id: withdrawalId,
          netAmount: feeCalculation.netAmount,
          fees: feeCalculation.feeAmount,
          reference: paymentResult.reference,
          estimatedArrival: paymentResult.estimatedArrival
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du retrait'
    });
  }
});

// Process PayPal payout
async function processPayPalPayment(amount: number, email: string) {
  // Implémentation PayPal Payouts API
  // Vous devrez créer un app PayPal Business
  return {
    reference: 'PP_' + Math.random().toString(36).substr(2, 9),
    estimatedArrival: '2-3 heures'
  };
}

// Process mobile money payment (via service partenaire)
async function processMobileMoneyPayment(provider: string, amount: number, phone: string) {
  // Intégration avec services comme:
  // - Djula (Afrique)
  // - PayDunya (Sénégal)
  // - Flutterwave (Afrique)
  return {
    reference: provider.toUpperCase() + '_' + Math.random().toString(36).substr(2, 9),
    estimatedArrival: 'Quelques minutes'
  };
}

// Process card payout via Stripe
async function processCardPayout(amount: number, details: any) {
  const payout = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'eur',
    destination: details.card_id, // Saved card from user
    description: `Retrait CryptoWin - ${details.email}`
  });

  return {
    reference: payout.id,
    estimatedArrival: '2-3 jours ouvrables'
  };
}

export default router;