import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import UserDashboard from './components/User/Dashboard';
import Header from './components/Shared/Header';
import Sidebar from './components/Shared/Sidebar';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {user && <Header />}
        
        <div className="flex">
          {user && user.role === 'admin' && <Sidebar />}
          
          <main className={`flex-1 ${user ? 'p-6' : ''}`}>
            <Routes>
              {!user ? (
                <>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<Navigate to="/login" />} />
                </>
              ) : user.role === 'admin' ? (
                <>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </>
              ) : (
                <>
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;