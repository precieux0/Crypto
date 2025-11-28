import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Wallet from './Wallet';
import Games from './Games';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-4xl font-bold mb-2">Bienvenue, {user.email}!</h1>
        <p className="text-purple-100 mb-6">Gagnez des cryptos gratuitement et retirez via Mobile Money, PayPal ou carte bancaire</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm opacity-90">Solde Principal</p>
            <p className="text-3xl font-bold">${user.balance.toFixed(2)}</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm opacity-90">Bonus</p>
            <p className="text-3xl font-bold">${user.bonus_balance.toFixed(2)}</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm opacity-90">Total Gagné</p>
            <p className="text-3xl font-bold">${user.total_earnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-2xl shadow-sm mb-8">
        <div className="flex space-x-1 p-2">
          {[
            { id: 'overview', name: 'Aperçu', icon: '📊' },
            { id: 'wallet', name: 'Portefeuille', icon: '💰' },
            { id: 'games', name: 'Jeux', icon: '🎮' },
            { id: 'ads', name: 'Publicités', icon: '📺' },
            { id: 'referral', name: 'Parrainage', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && <OverviewTab user={user} />}
        {activeTab === 'wallet' && <Wallet user={user} />}
        {activeTab === 'games' && <Games user={user} />}
        {activeTab === 'ads' && <AdsTab user={user} />}
        {activeTab === 'referral' && <ReferralTab user={user} />}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold mb-6">Actions Rapides</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all">
            🎮 Jouer
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all">
            📺 Publicités
          </button>
          <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all">
            💳 Déposer
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all">
            🏦 Retirer
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold mb-6">Activité Récente</h3>
        <div className="space-y-4">
          {[
            { type: 'game', text: 'Machine à sous - Gain $5.00', time: '2 min ago', positive: true },
            { type: 'ad', text: 'Vidéo publicitaire - $0.10', time: '15 min ago', positive: true },
            { type: 'withdrawal', text: 'Retrait Orange Money - $20.00', time: '1 hour ago', positive: false }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                activity.positive ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="flex-1">
                <p className="font-medium">{activity.text}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdsTab: React.FC<{ user: any }> = ({ user }) => {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await adsAPI.getAvailableAds();
      setAds(response.data.ads);
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const watchAd = async (ad: any) => {
    try {
      const response = await adsAPI.watchAd(user.id, ad.type);
      alert(`Vous avez gagné $${response.data.reward}!`);
      window.location.reload();
    } catch (error) {
      console.error('Error watching ad:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-2xl font-bold mb-6">Gagnez de l'Argent avec les Publicités</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
            <div className="text-4xl mb-4">📺</div>
            <h4 className="font-bold text-lg mb-2">{ad.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{ad.description}</p>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">Durée: {ad.duration}s</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                +${ad.reward}
              </span>
            </div>
            
            <button
              onClick={() => watchAd(ad)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Commencer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReferralTab: React.FC<{ user: any }> = ({ user }) => {
  const referralLink = `${window.location.origin}/register?ref=${user.referral_code}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Lien de parrainage copié!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-2xl font-bold mb-6">Programme de Parrainage</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
          <h4 className="text-xl font-bold mb-4">Gagnez 10$ par filleul!</h4>
          <p className="mb-6">Partagez votre lien de parrainage et gagnez 10$ pour chaque ami qui s'inscrit et dépose au moins 5$.</p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
            <p className="text-sm opacity-90">Votre lien de parrainage</p>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-white/10 border-none text-white rounded px-3 py-2 text-sm"
              />
              <button
                onClick={copyReferralLink}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Copier
              </button>
            </div>
          </div>
          
          <p className="text-sm opacity-90">Votre code: <strong>{user.referral_code}</strong></p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h5 className="font-bold text-lg mb-4">Comment ça marche?</h5>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center space-x-3">
                <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                <span>Partagez votre lien de parrainage</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                <span>Vos amis s'inscrivent avec votre lien</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                <span>Ils reçoivent 5$ de bonus à l'inscription</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                <span>Vous gagnez 10$ quand ils déposent 5$+</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;