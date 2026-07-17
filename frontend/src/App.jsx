import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './guards/ProtectedRoute';
import RoleBasedRoute from './guards/RoleBasedRoute';
import Layout from './components/layout/Layout';
import PageErrorBoundary from './components/ui/PageErrorBoundary';

// Pages d'authentification
import { Login, Register } from './pages/auth';

// Pages communes
import { NotFound, AccessDenied, Profile } from './pages/common';
import NotificationsPage from './pages/common/NotificationsPage';

// Pages utilisateur
import { 
  Dashboard as UtilisateurDashboard,
  CreateDemande,
  MesDemandes,
  DemandeDetail
} from './pages/utilisateur';

// Pages technicien
import {
  Dashboard as TechnicienDashboard,
  MesInterventions,
  InterventionDetail,
  HistoriqueInterventions
} from './pages/technicien';

// Pages gestionnaire
import {
  Dashboard as GestionnaireDashboard,
  GestionDemandes,
  GestionUtilisateurs,
  GestionMateriel,
  Rapports
} from './pages/gestionnaire';

import { ROLES } from './utils/constants';

/**
 * Sélectionne le bon dashboard selon le rôle de l'utilisateur connecté
 */
const DashboardRouter = () => {
  const { user } = useAuth();

  // Nettoyer l'URL pour s'assurer qu'on est sur /dashboard
  const currentPath = window.location.pathname;
  if (currentPath !== '/dashboard') {
    window.history.replaceState({}, '', '/dashboard');
  }

  switch (user?.type_personne) {
    case ROLES.GESTIONNAIRE:
      return <GestionnaireDashboard />;
    case ROLES.TECHNICIEN:
      return <TechnicienDashboard />;
    case ROLES.UTILISATEUR:
    default:
      return <UtilisateurDashboard />;
  }
};

/**
 * Composant App principal avec routing complet
 */
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* ——— Routes publiques ——— */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<AccessDenied />} />

          {/* ——— Routes protégées (avec Layout) ——— */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Racine → dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Communes (tous les rôles) */}
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Dashboard adaptatif */}
            <Route path="dashboard" element={<DashboardRouter />} />

            {/* UTILISATEUR */}
            <Route
              path="demandes"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.UTILISATEUR, ROLES.GESTIONNAIRE]}>
                  <MesDemandes />
                </RoleBasedRoute>
              }
            />
            <Route
              path="demandes/create"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.UTILISATEUR, ROLES.GESTIONNAIRE]}>
                  <CreateDemande />
                </RoleBasedRoute>
              }
            />
            <Route
              path="demandes/:id"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.UTILISATEUR, ROLES.GESTIONNAIRE]}>
                  <DemandeDetail />
                </RoleBasedRoute>
              }
            />

            {/* TECHNICIEN */}
            <Route
              path="interventions"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.TECHNICIEN, ROLES.GESTIONNAIRE]}>
                  <MesInterventions />
                </RoleBasedRoute>
              }
            />
            <Route
              path="interventions/history"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.TECHNICIEN]}>
                  <HistoriqueInterventions />
                </RoleBasedRoute>
              }
            />
            <Route
              path="interventions/:id"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.TECHNICIEN, ROLES.GESTIONNAIRE]}>
                  <InterventionDetail />
                </RoleBasedRoute>
              }
            />

            {/* GESTIONNAIRE */}
            <Route
              path="gestionnaire/demandes"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <GestionDemandes />
                </RoleBasedRoute>
              }
            />
            <Route
              path="gestionnaire/demandes/:id"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <DemandeDetail />
                </RoleBasedRoute>
              }
            />
            <Route
              path="gestionnaire/interventions"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <MesInterventions />
                </RoleBasedRoute>
              }
            />
            <Route
              path="gestionnaire/interventions/:id"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <InterventionDetail />
                </RoleBasedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <GestionUtilisateurs />
                </RoleBasedRoute>
              }
            />
            <Route
              path="materiel"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.TECHNICIEN, ROLES.GESTIONNAIRE]}>
                  <GestionMateriel />
                </RoleBasedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.GESTIONNAIRE]} redirectTo="/unauthorized">
                  <PageErrorBoundary>
                    <Rapports />
                  </PageErrorBoundary>
                </RoleBasedRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
