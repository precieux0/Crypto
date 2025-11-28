// Fichier: backend/src/config/fees.ts
export const WITHDRAWAL_FEES = {
  // Opérateurs Mobile Money - Afrique de l'Ouest
  orange_money: { percentage: 2, fixed: 0, minAmount: 5 },
  mtn_money: { percentage: 2, fixed: 0, minAmount: 5 },
  
  // Opérateurs Mobile Money - Afrique Centrale & Australe
  airtel_money: { percentage: 2, fixed: 0, minAmount: 5 },
  mpesa: { percentage: 2, fixed: 0, minAmount: 5 }, // Vodacom MPesa
  africell_money: { percentage: 2, fixed: 0, minAmount: 5 },
  
  // Opérateurs Mobile Money - RDC spécifique
  orange_cd: { percentage: 2, fixed: 0, minAmount: 5 }, // Orange RDC
  airtel_cd: { percentage: 2, fixed: 0, minAmount: 5 }, // Airtel RDC
  
  // Services internationaux
  paypal: { percentage: 3, fixed: 0.3, minAmount: 10 },
  bank_card: { percentage: 2.5, fixed: 0.5, minAmount: 10 },
  bank_transfer: { percentage: 1, fixed: 2, minAmount: 20 },
  
  // Cryptomonnaies
  usdt: { percentage: 1, fixed: 1, minAmount: 10 },
  bitcoin: { percentage: 1.5, fixed: 2, minAmount: 20 }
};

export function calculateWithdrawalFees(amount: number, method: string) {
  const fees = WITHDRAWAL_FEES[method as keyof typeof WITHDRAWAL_FEES];
  
  if (!fees) {
    throw new Error(`Méthode de retrait non supportée: ${method}`);
  }
  
  const feeAmount = (amount * fees.percentage / 100) + fees.fixed;
  const netAmount = amount - feeAmount;
  
  return {
    grossAmount: amount,
    feePercentage: fees.percentage,
    feeFixed: fees.fixed,
    feeAmount: Math.max(feeAmount, 0.1), // Minimum 0.1€ de frais
    netAmount: Math.max(netAmount, 0.1), // Minimum 0.1€ reçu
    minAmount: fees.minAmount
  };
}

// Fonction utilitaire pour obtenir les méthodes par pays
export function getAvailableMethodsForCountry(countryCode: string) {
  const methodsByCountry: { [key: string]: string[] } = {
    // RDC - République Démocratique du Congo
    'CD': ['orange_cd', 'airtel_cd', 'mpesa', 'africell_money', 'paypal', 'bank_card', 'usdt'],
    
    // Côte d'Ivoire
    'CI': ['orange_money', 'mtn_money', 'paypal', 'bank_card'],
    
    // Sénégal
    'SN': ['orange_money', 'paypal', 'bank_card'],
    
    // Cameroun
    'CM': ['orange_money', 'mtn_money', 'paypal', 'bank_card'],
    
    // Burkina Faso
    'BF': ['orange_money', 'paypal', 'bank_card'],
    
    // Kenya
    'KE': ['mpesa', 'airtel_money', 'paypal', 'bank_card'],
    
    // Tanzanie
    'TZ': ['mpesa', 'airtel_money', 'paypal', 'bank_card'],
    
    // Ouganda
    'UG': ['mtn_money', 'airtel_money', 'paypal', 'bank_card'],
    
    // Ghana
    'GH': ['mtn_money', 'paypal', 'bank_card'],
    
    // Rwanda
    'RW': ['mtn_money', 'airtel_money', 'paypal', 'bank_card'],
    
    // Zambie
    'ZM': ['mtn_money', 'airtel_money', 'paypal', 'bank_card'],
    
    // Madagascar
    'MG': ['orange_money', 'airtel_money', 'paypal', 'bank_card'],
    
    // Gabon
    'GA': ['orange_money', 'paypal', 'bank_card'],
    
    // Bénin
    'BJ': ['orange_money', 'mtn_money', 'paypal', 'bank_card'],
    
    // Togo
    'TG': ['orange_money', 'mtn_money', 'paypal', 'bank_card'],
    
    // Mali
    'ML': ['orange_money', 'paypal', 'bank_card'],
    
    // Niger
    'NE': ['orange_money', 'paypal', 'bank_card'],
    
    // Guinée
    'GN': ['orange_money', 'mtn_money', 'paypal', 'bank_card'],
    
    // Autres pays
    'ALL': ['paypal', 'bank_card', 'bank_transfer', 'usdt', 'bitcoin']
  };

  return methodsByCountry[countryCode] || methodsByCountry['ALL'];
}