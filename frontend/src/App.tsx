import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TrialsPage } from './pages/TrialsPage';
import { CreateTrialPage } from './pages/CreateTrialPage';
import { TrialDetailPage } from './pages/TrialDetailPage';
import { EditTrialPage } from './pages/EditTrialPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { ParticipantScreeningPage } from './pages/ParticipantScreeningPage';
import { ParticipantDetailPage } from './pages/ParticipantDetailPage';
import { EthicsRegulatoryPage } from './pages/EthicsRegulatoryPage';
import { SafetyPage } from './pages/SafetyPage';
import { SafetyDetailPage } from './pages/SafetyDetailPage';
import { InteroperabilityPage } from './pages/InteroperabilityPage';
import { AccessDeniedPage, NotFoundPage } from './pages/AccessDeniedPage';

// Login route handler redirecting to dashboard if already authenticated
const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<PublicLoginRoute />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Phase 2: Clinical Trial Management Routes */}
            <Route path="/trials" element={<TrialsPage />} />
            <Route
              path="/trials/new"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'PRINCIPAL_INVESTIGATOR']}>
                  <CreateTrialPage />
                </RoleGuard>
              }
            />
            <Route path="/trials/:id" element={<TrialDetailPage />} />
            <Route
              path="/trials/:id/edit"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'PRINCIPAL_INVESTIGATOR', 'STUDY_COORDINATOR']}>
                  <EditTrialPage />
                </RoleGuard>
              }
            />

            {/* Phase 3: Participant Lifecycle Management Routes */}
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route
              path="/participants/screen"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'PRINCIPAL_INVESTIGATOR', 'STUDY_COORDINATOR']}>
                  <ParticipantScreeningPage />
                </RoleGuard>
              }
            />
            <Route path="/participants/:id" element={<ParticipantDetailPage />} />

            {/* Phase 4: Ethics, CTRI & Regulatory Routes */}
            <Route path="/ethics-regulatory" element={<EthicsRegulatoryPage />} />

            {/* Phase 5: Adverse Events & Pharmacovigilance Routes */}
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/safety/:id" element={<SafetyDetailPage />} />

            {/* Phase 7: HL7 FHIR R4 & CDISC SDTM Interoperability */}
            <Route path="/interoperability" element={<InteroperabilityPage />} />

            {/* Admin Only Route */}
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <UsersPage />
                </RoleGuard>
              }
            />

            {/* Admin & Regulator Only Route */}
            <Route
              path="/audit-logs"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'REGULATOR']}>
                  <AuditLogsPage />
                </RoleGuard>
              }
            />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
