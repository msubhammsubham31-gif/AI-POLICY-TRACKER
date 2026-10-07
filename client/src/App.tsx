import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Protected / Main Application Pages
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { RegulationsPage } from './pages/RegulationsPage';
import { RegulationDetailPage } from './pages/RegulationDetailPage';
import { ChangesPage } from './pages/ChangesPage';
import { ChangeDetailPage } from './pages/ChangeDetailPage';
import { TimelinePage } from './pages/TimelinePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { FacilityDetailPage } from './pages/FacilityDetailPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierDetailPage } from './pages/SupplierDetailPage';
import { RisksPage } from './pages/RisksPage';
import { ActionsPage } from './pages/ActionsPage';
import { ActionDetailPage } from './pages/ActionDetailPage';
import { DeadlinesPage } from './pages/DeadlinesPage';
import { AlertsPage } from './pages/AlertsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AssistantPage } from './pages/AssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Application Core Routes wrapped in AppShell */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          
          {/* Regulations & Changes */}
          <Route path="regulations" element={<RegulationsPage />} />
          <Route path="regulations/:id" element={<RegulationDetailPage />} />
          <Route path="changes" element={<ChangesPage />} />
          <Route path="changes/:id" element={<ChangeDetailPage />} />
          <Route path="timeline" element={<TimelinePage />} />

          {/* Company Asset Graph */}
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="facilities/:id" element={<FacilityDetailPage />} />
          <Route path="processes" element={<ProcessesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />

          {/* Risk & Action Management */}
          <Route path="risks" element={<RisksPage />} />
          <Route path="actions" element={<ActionsPage />} />
          <Route path="actions/:id" element={<ActionDetailPage />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="documents" element={<DocumentsPage />} />

          {/* AI & Governance */}
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
