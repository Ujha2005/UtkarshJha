import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PatientRecordProvider } from './context/PatientRecordContext';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import HealthGraphPage from './pages/HealthGraphPage';
import TimelinePage from './pages/TimelinePage';
import ReportsPage from './pages/ReportsPage';
import MedicationsPage from './pages/MedicationsPage';
import SymptomsPage from './pages/SymptomsPage';
import NutritionPage from './pages/NutritionPage';
import DoctorModePage from './pages/DoctorModePage';
import SeniorModePage from './pages/SeniorModePage';
import DocumentIngestionPage from './pages/DocumentIngestionPage';
import PrivacyPage from './pages/PrivacyPage';
import AuditLogPage from './pages/AuditLogPage';

export default function App() {
  return (
    <AuthProvider>
      <PatientRecordProvider>
        <Routes>
          {/* Public route: Login page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes: require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="graph" element={<HealthGraphPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="symptoms" element={<SymptomsPage />} />
              <Route path="ingest" element={<DocumentIngestionPage />} />
              <Route path="nutrition" element={<NutritionPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="doctor-mode" element={<DoctorModePage />} />
              <Route path="doctor" element={<DoctorModePage />} />
              <Route path="senior-mode" element={<SeniorModePage />} />
              <Route path="senior" element={<SeniorModePage />} />
            </Route>
          </Route>
        </Routes>
      </PatientRecordProvider>
    </AuthProvider>
  );
}
