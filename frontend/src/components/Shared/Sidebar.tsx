import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: '📊', path: '/admin' },
    { id: 'users', name: 'Utilisateurs', icon: '👥', path: '/admin/users' },
    { id: 'transactions', name: 'Transactions', icon: '💳', path: '/admin/transactions' },
    { id: 'withdrawals', name: 'Retraits', icon: '🏦', path: '/admin/withdrawals' },
    { id: 'reports', name: 'Rapports', icon: '📈', path: '/admin/reports' },
    { id: 'settings', name: 'Paramètres', icon: '⚙️', path: '/admin/settings' }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800">Administration</h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
              location.pathname === item.path
                ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
      
      {/* Admin Stats */}
      <div className="mt-8 mx-6 p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white">
        <p className="text-sm opacity-90">Revenus Totaux</p>
        <p className="text-2xl font-bold">$12,458.00</p>
        <p className="text-xs opacity-90 mt-2">+24% ce mois</p>
      </div>
    </div>
  );
};

export default Sidebar;