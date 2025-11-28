import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const RealWithdraw: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('orange_money');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CI'); // Pays par défaut
  const [fees, setFees] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const methods = [
    // Opérateurs Afrique de l'Ouest
    { 
      id: 'orange_money', 
      name: 'Orange Money', 
      icon: '🟠', 
      description: 'Côte d\'Ivoire, Sénégal, Cameroun, RDC, Burkina',
      countries: ['CI', 'SN', 'CM', 'CD', 'BF', 'MG', 'GN', 'ML', 'NE'],
      minAmount: 5
    },
    { 
      id: 'mtn_money', 
      name: 'MTN Mobile Money', 
      icon: '🟡', 
      description: 'Ghana, Côte d\'Ivoire, Cameroun, Ouganda',
      countries: ['CI', 'GH', 'CM', 'UG', 'RW', 'ZM'],
      minAmount: 5
    },
    
    // Opérateurs RDC & Afrique Centrale
    { 
      id: 'orange_cd', 
      name: 'Orange Money RDC', 
      icon: '🟠', 
      description: 'République Démocratique du Congo',
      countries: ['CD'],
      minAmount: 5
    },
    { 
      id: 'airtel_cd', 
      name: 'Airtel Money RDC', 
      icon: '🔴', 
      description: 'République Démocratique du Congo',
      countries: ['CD'],
      minAmount: 5
    },
    { 
      id: 'mpesa', 
      name: 'MPesa (Vodacom)', 
      icon: '🟢', 
      description: 'RDC, Kenya, Tanzanie',
      countries: ['CD', 'KE', 'TZ'],
      minAmount: 5
    },
    { 
      id: 'africell_money', 
      name: 'Africell Money', 
      icon: '🟣', 
      description: 'RDC, Ouganda, Gambie',
      countries: ['CD', 'UG', 'GM', 'SL'],
      minAmount: 5
    },
    
    // Opérateurs Afrique Australe & Orientale
    { 
      id: 'airtel_money', 
      name: 'Airtel Money', 
      icon: '🔴', 
      description: 'Kenya, Ouganda, Tanzanie, Rwanda',
      countries: ['KE', 'UG', 'TZ', 'RW', 'ZM', 'MG'],
      minAmount: 5
    },
    
    // Services internationaux
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: '🔵', 
      description: 'Monde entier',
      countries: ['ALL'],
      minAmount: 10
    },
    { 
      id: 'bank_card', 
      name: 'Carte Bancaire', 
      icon: '💳', 
      description: 'Visa/Mastercard - International',
      countries: ['ALL'],
      minAmount: 10
    },
    { 
      id: 'usdt', 
      name: 'USDT (Crypto)', 
      icon: '₿', 
      description: 'Cryptomonnaie stable - Monde entier',
      countries: ['ALL'],
      minAmount: 10
    }
  ];

  // Filtrer les méthodes disponibles selon le pays
  const availableMethods = methods.filter(m => 
    m.countries.includes(country) || m.countries.includes('ALL')
  );

  // Mettre à jour la méthode si la sélection actuelle n'est pas disponible pour le pays
  useEffect(() => {
    if (!availableMethods.some(m => m.id === method)) {
      setMethod(availableMethods[0]?.id || '');
    }
  }, [country, availableMethods]);

  // Calculate fees when amount or method changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFees(parseFloat(amount), method);
    }
  }, [amount, method]);

  const calculateFees = async (amount: number, method: string) => {
    try {
      const response = await paymentsAPI.calculateFees(amount, method);
      setFees(response.data);
    } catch (error) {
      console.error('Error calculating fees:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await paymentsAPI.processWithdrawal(user.id, parseFloat(amount), method, {
        phoneNumber: phone,
        email: user.email,
        country: country
      });
      
      alert(`✅ Retrait confirmé! 
      Montant reçu: ${response.data.withdrawal.netAmount}€
      Référence: ${response.data.withdrawal.reference}
      Délai: ${response.data.withdrawal.estimatedArrival}`);
      
      // Reset form
      setAmount('');
      setPhone('');
      setFees(null);
      
    } catch (error: any) {
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = methods.find(m => m.id === method);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">💸 Retirer mes gains</h2>
        <p className="text-gray-600 mb-6">Retraits rapides et sécurisés</p>

        {/* Country Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">🌍 Pays de réception</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl"
          >
            <option value="CI">Côte d'Ivoire</option>
            <option value="CD">République Démocratique du Congo</option>
            <option value="SN">Sénégal</option>
            <option value="CM">Cameroun</option>
            <option value="BF">Burkina Faso</option>
            <option value="GH">Ghana</option>
            <option value="KE">Kenya</option>
            <option value="UG">Ouganda</option>
            <option value="TZ">Tanzanie</option>
            <option value="RW">Rwanda</option>
            <option value="ZM">Zambie</option>
            <option value="MG">Madagascar</option>
            <option value="GN">Guinée</option>
            <option value="ML">Mali</option>
            <option value="OTHER">Autre pays</option>
          </select>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {availableMethods.map((m) => (
            <div
              key={m.id}
              className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${
                method === m.id 
                  ? 'border-purple-500 bg-purple-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMethod(m.id)}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="text-xs text-gray-500 mt-1">Min: {m.minAmount}€</div>
            </div>
          ))}
        </div>

        {/* Method Description */}
        {selectedMethod && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-800 text-center">
              {selectedMethod.description}
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Montant à retirer (€)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl text-lg font-semibold"
            placeholder={`Min: ${selectedMethod?.minAmount}€`}
            min={selectedMethod?.minAmount}
          />
        </div>

        {/* Recipient Details */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {method.includes('money') || method.includes('mpesa') ? '📱 Numéro de téléphone' : 
             method === 'usdt' ? '🔗 Adresse USDT (TRC20)' : '📧 Email'}
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl"
            placeholder={
              method.includes('money') || method.includes('mpesa') 
                ? 'Ex: +225 07 12 34 56 78' 
                : method === 'usdt'
                ? 'Ex: TAbc123...xyz'
                : 'votre@email.com'
            }
          />
        </div>

        {/* Fees Breakdown */}
        {fees && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold mb-3">📊 Détail du retrait</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Montant demandé:</span>
                <span className="font-semibold">{fees.grossAmount}€</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Frais de retrait ({fees.feePercentage}%):</span>
                <span>-{fees.feeAmount}€</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold">Montant reçu:</span>
                <span className="font-bold text-green-600 text-lg">{fees.netAmount}€</span>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={!amount || !phone || loading || parseFloat(amount) < (selectedMethod?.minAmount || 0)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Traitement...' : '💰 Confirmer le retrait'}
        </button>

        {/* Security Badges */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl">🔒</div>
            <div className="text-xs text-gray-600">Sécurisé</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⚡</div>
            <div className="text-xs text-gray-600">Rapide</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">🌍</div>
            <div className="text-xs text-gray-600">International</div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-3">🎯 Comment ça marche ?</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
            <div>
              <span className="font-semibold">Sélectionnez votre pays</span>
              <p className="text-gray-600">Choisissez votre pays pour voir les méthodes disponibles</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
            <div>
              <span className="font-semibold">Choisissez la méthode</span>
              <p className="text-gray-600">Sélectionnez votre opérateur mobile money ou service préféré</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
            <div>
              <span className="font-semibold">Recevez vos fonds</span>
              <p className="text-gray-600">Argent transféré sous 24h maximum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealWithdraw;