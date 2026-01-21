import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { GuestView } from './pages/GuestView';
import { Login } from './pages/Login';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useWedding();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const MainRouter = () => {
  const { isAuthenticated } = useWedding();

  return (
    <Routes>
      {/* Root path: If logged in -> Admin, else -> Login */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/admin" /> : <Login />} />
      
      {/* Protected Admin Route */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />

      {/* Dynamic Guest Route (e.g., /kasun) */}
      {/* We place this last to avoid intercepting /admin if it matched */}
      <Route path="/:slug" element={<GuestView />} />
      
      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <WeddingProvider>
      <HashRouter>
        <MainRouter />
      </HashRouter>
    </WeddingProvider>
  );
};

export default App;