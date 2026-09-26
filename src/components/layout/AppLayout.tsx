import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  Clock, 
  FileText, 
  Pill, 
  Activity, 
  Apple, 
  Stethoscope, 
  Heart,
  Search,
  Bell,
  UploadCloud,
  RotateCcw,
  Check
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import { usePatientRecord } from '@/context/PatientRecordContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/graph', label: 'Health Graph', icon: GitBranch },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/ingest', label: 'Document Ingestion', icon: UploadCloud },
  { path: '/medications', label: 'Medications', icon: Pill },
  { path: '/symptoms', label: 'Symptoms', icon: Activity },
  { path: '/nutrition', label: 'Nutrition', icon: Apple },
  { path: '/doctor-mode', label: 'Doctor Mode', icon: Stethoscope },
  { path: '/senior-mode', label: 'Senior Mode', icon: Heart },
];

export default function AppLayout() {
  const location = useLocation();
  const currentNav = navItems.find(item => item.path === location.pathname) || navItems[0];
  const { patient, resetToBaseline } = usePatientRecord();
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [resetToast, setResetToast] = React.useState(false);

  const handleConfirmReset = () => {
    resetToBaseline();
    setShowResetConfirm(false);
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3500);
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col overflow-hidden relative">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0 sticky top-0">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-blue-600">CareGraph</h1>
            <p className="text-xs text-gray-500 mt-1">Your Medical History, Connected</p>
            <div className="mt-3">
              <span className="badge-amber">DEMO DATA</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {patient.name}
                </p>
                <p className="text-xs text-gray-500 truncate">Patient</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">{currentNav.label}</h2>
            </div>
            
            {/* Perspective / Role Mode Switcher & Demo Tools */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Standard View
                </NavLink>
                <NavLink
                  to="/doctor"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      isActive || location.pathname === '/doctor-mode'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  👨‍⚕️ Doctor Mode
                </NavLink>
                <NavLink
                  to="/senior"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      isActive || location.pathname === '/senior-mode'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  👵 Senior Mode
                </NavLink>
              </div>

              {/* Demo Reset Baseline Action */}
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Reset synthetic patient record to pristine baseline"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden xl:inline">Reset Patient Data</span>
              </button>

              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-gray-50"
                />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* MODAL: RESET DEMO BASELINE CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reset Demo Patient Record?</h3>
                <p className="text-xs text-gray-500">Restore baseline synthetic demonstration data</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border">
              This will restore <strong>{patient.name}</strong> to the original baseline record (2019–2026). Any uploaded documents in the Ingestion Hub, newly accepted clinical entities, and dynamic chart points will be reset.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST: RESET CONFIRMED */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-emerald-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Patient record restored to pristine baseline.</span>
        </div>
      )}
    </div>
  );
}
