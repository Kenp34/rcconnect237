import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Message from './pages/Message';
import Directory from './pages/Directory';
import Group from './pages/Group';
import GroupChat from './pages/GroupChat';


// Ajouter dans les route

import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/feed" replace />} />

          <Route path="/feed" element={
            <ProtectedRoute>
              <Layout>
                <Feed />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile/me" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Layout>
                <Message />
              </Layout>
            </ProtectedRoute>
          } />



          <Route path="/annuaire" element={
            <ProtectedRoute>
              <Layout>
                <Directory />
              </Layout>
            </ProtectedRoute>
          } />

          {/* 👥 ROUTES POUR LES GROUPES */}
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout>
                <Group />
              </Layout>
            </ProtectedRoute>
          } />
          
         {/* 👥 ROUTES POUR LES GROUPES */}
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <Layout>
                <GroupChat />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Redirection 404 */}
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>


         
      </BrowserRouter>
    </AuthProvider>
  );
}


/*!SECTION


import Notifications from './pages/Notifications';
import GroupPage     from './pages/GroupPage';
import Groups        from './pages/Groups';

// Dans les Routes
<Route path="/notifications" element={
  <ProtectedRoute>
    <Layout><Notifications /></Layout>
  </ProtectedRoute>
} />

<Route path="/groups" element={
  <ProtectedRoute>
    <Layout><Groups /></Layout>
  </ProtectedRoute>
} />

<Route path="/groups/:id" element={
  <ProtectedRoute>
    <Layout><GroupPage /></Layout>
  </ProtectedRoute>
} />
*/