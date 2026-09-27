import React, { useState, useEffect } from 'react';
import { 
  Shield, Eye, UserCheck, Download, AlertTriangle, 
  Lock, Unlock, FileText, Users, Heart, Brain, 
  Ambulance, Check, X, Plus, Clock, ExternalLink, Info, CheckCircle2, RefreshCw
} from 'lucide-react';
import { usePatientRecord } from '@/context/PatientRecordContext';
import { useAuth } from '@/auth/AuthProvider';
import { consentService, type AccessGrant, type ConsentRecord } from '@/services/consentService';
import { dataExport, type ExportOptions } from '@/services/dataExport';

export default function PrivacyPage() {
  const { patient, conditions, medications, labTrends, healthEvents, nutritionEntries } = usePatientRecord();
  const { authState } = useAuth();
  
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showAddGrantModal, setShowAddGrantModal] = useState(false);
  
  // Add grant form state
  const [newGrantName, setNewGrantName] = useState('');
  const [newGrantRole, setNewGrantRole] = useState('Specialist Physician');
  const [newGrantLevel, setNewGrantLevel] = useState<'full' | 'read_only' | 'emergency_only'>('read_only');
  const [newGrantReason, setNewGrantReason] = useState('');

  // Export options state
  const [exportOpts, setExportOpts] = useState<ExportOptions>({
    includeDemographics: true,
    includeConditions: true,
    includeMedications: true,
    includeLabs: true,
    includeEvents: true,
    includeNutrition: true,
  });

  const refreshData = () => {
    setGrants(consentService.getAccessGrants(patient.id || 'p1'));
    setConsents(consentService.getConsentRecords(patient.id || 'p1'));
  };

  useEffect(() => {
    refreshData();
  }, [patient.id]);

  const handleToggleConsent = (consentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'granted' ? 'revoked' : 'granted';
    consentService.updateConsent(
      consentId, 
      newStatus,
      authState.user?.id || 'u1',
      authState.user?.displayName || patient.name
    );
    refreshData();
  };

  const handleRevokeGrant = (grantId: string) => {
    consentService.revokeAccess(
      grantId,
      authState.user?.id || 'u1',
      authState.user?.displayName || patient.name
    );
    refreshData();
  };

  const handleAddGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrantName.trim()) return;

    consentService.grantAccess({
      grantedTo: {
        userId: `usr-${Date.now()}`,
        name: newGrantName.trim(),
        role: newGrantRole,
      },
      grantedBy: {
        userId: authState.user?.id || 'u1',
        name: authState.user?.displayName || patient.name,
      },
      patientId: patient.id || 'p1',
      accessLevel: newGrantLevel,
      reason: newGrantReason.trim() || 'Clinical Consultation',
    });

    setNewGrantName('');
    setNewGrantReason('');
    setShowAddGrantModal(false);
    refreshData();
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload = dataExport.exportHealthData(
        patient.id || 'p1',
        exportOpts,
        {
          userId: authState.user?.id || 'u1',
          userName: authState.user?.displayName || patient.name,
          role: authState.user?.role || 'PATIENT',
        }
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `caregraph_export_${patient.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.json`;
      
      dataExport.downloadAsJSON(exportPayload, filename);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getConsentIcon = (type: ConsentRecord['consentType']) => {
    switch (type) {
      case 'data_sharing':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'research_participation':
        return <Brain className="w-5 h-5 text-purple-600" />;
      case 'ai_analysis':
        return <Brain className="w-5 h-5 text-indigo-600" />;
      case 'emergency_access':
        return <Ambulance className="w-5 h-5 text-red-600" />;
      case 'caregiver_access':
        return <Heart className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getConsentTitle = (type: ConsentRecord['consentType']) => {
    switch (type) {
      case 'data_sharing':
        return 'Healthcare Provider Data Sharing';
      case 'research_participation':
        return 'Anonymized Research Participation';
      case 'ai_analysis':
        return 'AI-Assisted Clinical Insights & OCR';
      case 'emergency_access':
        return 'Emergency Break-Glass Protocol';
      case 'caregiver_access':
        return 'Authorized Family Caregiver Access';
      default:
        return type;
    }
  };

  const getAccessLevelBadge = (level: AccessGrant['accessLevel']) => {
    switch (level) {
      case 'full':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Full Clinical Access</span>;
      case 'read_only':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Read-Only</span>;
      case 'emergency_only':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Emergency Only</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-amber">SECURITY & PRIVACY HUB</span>
          <span className="text-xs text-gray-500">• Phase 8 Real-World Architecture</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-blue-600" />
              Privacy, Consent & Data Governance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage record authorization grants, dynamic patient consent directives, and encrypted data exports for <span className="font-semibold text-gray-700">{patient.name}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddGrantModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Grant Record Access
            </button>
          </div>
        </div>
      </div>

      {/* Synthetic Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">Demonstration Architecture Notice</p>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            CareGraph is operating in local demonstration mode with synthetic health records. The consent toggles, access grants, and audit trails below model how a real-world zero-trust health platform functions. <strong>This implementation does not constitute legal certification under HIPAA, GDPR, or India's DPDP Act</strong> without production deployment with hardware security modules, enterprise IdP, and certified cloud infrastructure.
          </p>
        </div>
      </div>

      {/* Grid Layout: Access Grants & Consents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Access Grants */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-gray-900">Who Can Access My Records?</h2>
              </div>
              <span className="text-xs text-gray-500">
                {grants.filter(g => g.isActive).length} active grant{grants.filter(g => g.isActive).length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {grants.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No access grants configured.
                </div>
              ) : (
                grants.map((grant) => (
                  <div key={grant.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        grant.isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {grant.grantedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${grant.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            {grant.grantedTo.name}
                          </p>
                          {getAccessLevelBadge(grant.accessLevel)}
                          {grant.isActive ? (
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">Active</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium">Revoked</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{grant.grantedTo.role} • {grant.reason}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Granted: {new Date(grant.grantedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {grant.expiresAt && ` • Revoked: ${new Date(grant.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {grant.isActive ? (
                      <button
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-center"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic self-start sm:self-center">Access Inactive</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Consent Directives */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">Patient Consent Directives</h2>
              </div>
              <span className="text-xs text-gray-500">Fine-grained patient control</span>
            </div>

            <p className="text-xs text-gray-500 mt-3 mb-4">
              Under modern digital healthcare standards (such as FHIR Consent resources and the DPDP Act), patients maintain continuous sovereignty to grant or revoke specific processing purposes at any time.
            </p>

            <div className="space-y-3">
              {consents.map((consent) => {
                const isGranted = consent.status === 'granted';
                return (
                  <div 
                    key={consent.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      isGranted ? 'bg-white border-gray-200 hover:border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 mt-0.5">
                        {getConsentIcon(consent.consentType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {getConsentTitle(consent.consentType)}
                          </h3>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isGranted 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isGranted ? 'CONSENT GRANTED' : 'CONSENT REVOKED'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {consent.description}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last modified: {new Date(consent.grantedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleConsent(consent.id, consent.status)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                        isGranted
                          ? 'bg-white border-red-300 text-red-700 hover:bg-red-50'
                          : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isGranted ? 'Revoke Consent' : 'Grant Consent'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Data Export & Privacy Specifications */}
        <div className="space-y-6">
          
          {/* Data Export Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <Download className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Export My Health Data</h2>
            </div>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              Download a complete, structured JSON bundle of your longitudinal health record for portability across medical providers or personal health vaults.
            </p>

            {/* Checklist options */}
            <div className="mt-4 space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Include in Export:</p>
              
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeDemographics} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeDemographics: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Demographics & Contact Details</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeConditions} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeConditions: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Active & Resolved Conditions ({conditions.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeMedications} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeMedications: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Medication History & Regimen ({medications.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeLabs} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeLabs: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Lab Test Trends ({labTrends.length} Biomarkers)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeEvents} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeEvents: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Timeline Milestones ({healthEvents.length} Events)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportOpts.includeNutrition} 
                  onChange={e => setExportOpts(prev => ({ ...prev, includeNutrition: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span>Nutrition & Diet Logs ({nutritionEntries.length} Records)</span>
              </label>
            </div>

            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating JSON Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Health Record (JSON)
                </>
              )}
            </button>

            {exportSuccess && (
              <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Export generated & downloaded. Event logged to Audit Trail.</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-400">
              <span className="font-semibold text-gray-600">Roadmap:</span> Production will support standardized HL7 FHIR R4 Bundle and Continuity of Care Document (CCD) formats.
            </div>
          </div>

          {/* Privacy & Governance Notice */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Data Protection Architecture</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Zero-Storage Client Model:</strong> Demonstration session data resides strictly in volatile memory. No cookies or trackers.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>No Browser AI Keys:</strong> All LLM/OCR operations are designed to execute behind a backend proxy gateway.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Role-Based Enclosure:</strong> Patient, Doctor, Caregiver, and Admin views enforce separation of privilege.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Immutable Audit Log:</strong> Every access, consent modification, and export event is logged in sequence.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Security Version 8.0</span>
              <span className="text-blue-400 font-medium">CareGraph Core</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: ADD ACCESS GRANT */}
      {showAddGrantModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Grant Clinical Access</h3>
              </div>
              <button 
                onClick={() => setShowAddGrantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGrantSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Provider or Caregiver Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Sunita Deshmukh"
                  value={newGrantName}
                  onChange={e => setNewGrantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Professional Role / Relation</label>
                <select
                  value={newGrantRole}
                  onChange={e => setNewGrantRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Specialist Physician">Specialist Physician</option>
                  <option value="Consulting Cardiologist">Consulting Cardiologist</option>
                  <option value="Nephrologist">Nephrologist</option>
                  <option value="Family Caregiver">Family Caregiver</option>
                  <option value="Emergency Responder">Emergency Responder</option>
                  <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Access Level Permission</label>
                <select
                  value={newGrantLevel}
                  onChange={e => setNewGrantLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="read_only">Read-Only (View medical history, labs & medications)</option>
                  <option value="full">Full Clinical (Reconcile medications & add clinical notes)</option>
                  <option value="emergency_only">Emergency Only (Critical allergies and active meds only)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Clinical Purpose / Reason</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chronic Kidney Disease follow-up"
                  value={newGrantReason}
                  onChange={e => setNewGrantReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddGrantModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  Confirm & Issue Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
