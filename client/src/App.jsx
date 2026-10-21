import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Feature Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { AccountDetailPage } from './pages/accounts/AccountDetailPage';
import { ResourcesPage } from './pages/resources/ResourcesPage';
import { ResourceDetailPage } from './pages/resources/ResourceDetailPage';
import { ImportConfigPage } from './pages/resources/ImportConfigPage';
import { ScansPage } from './pages/scans/ScansPage';
import { ScanDetailPage } from './pages/scans/ScanDetailPage';
import { FindingsPage } from './pages/findings/FindingsPage';
import { FindingDetailPage } from './pages/findings/FindingDetailPage';
import { CompliancePage } from './pages/compliance/CompliancePage';
import { ControlDetailPage } from './pages/compliance/ControlDetailPage';
import { DriftHistoryPage } from './pages/drift/DriftHistoryPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { RulesPage } from './pages/rules/RulesPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/import" element={<ImportConfigPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/scans/:id" element={<ScanDetailPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/findings/:id" element={<FindingDetailPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/compliance/controls/:id" element={<ControlDetailPage />} />
          <Route path="/drift" element={<DriftHistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
