import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, Clock, User, Filter, 
  AlertTriangle, Check, X, Eye, Activity, Search,
  Download, RefreshCw, Trash2, CheckCircle2, Lock, ArrowUpDown
} from 'lucide-react';
import { auditLog, type AuditEntry, type AuditAction } from '@/services/auditLog';
import { useAuth } from '@/auth/AuthProvider';

export default function AuditLogPage() {
  const { authState } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadLogs = () => {
    const fetched = auditLog.getAuditLog();
    setLogs(fetched);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getOutcomeBadge = (outcome: AuditEntry['outcome']) => {
    switch(outcome) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="h-3 w-3" /> Success
          </span>
        );
      case 'failure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <X className="h-3 w-3" /> Failure
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3 w-3" /> Access Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {outcome}
          </span>
        );
    }
  };

  const getActionBadge = (action: AuditAction) => {
    const colorMap: Record<string, string> = {
      LOGIN: 'bg-blue-50 text-blue-700 border-blue-200',
      LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200',
      LOGIN_FAILED: 'bg-red-50 text-red-700 border-red-200',
      ACCESS_DENIED: 'bg-amber-50 text-amber-800 border-amber-300',
      PATIENT_RECORD_VIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      DOCUMENT_UPLOAD: 'bg-teal-50 text-teal-700 border-teal-200',
      DOCUMENT_COMMIT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CONSENT_GRANT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      CONSENT_REVOKE: 'bg-rose-50 text-rose-700 border-rose-200',
      DATA_EXPORT: 'bg-purple-50 text-purple-700 border-purple-200',
      PDF_GENERATE: 'bg-sky-50 text-sky-700 border-sky-200',
      PATIENT_DATA_RESET: 'bg-orange-50 text-orange-800 border-orange-200',
      MODE_SWITCH: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const cls = colorMap[action] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${cls}`}>
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (outcomeFilter !== 'ALL' && log.outcome !== outcomeFilter) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        log.userName.toLowerCase().includes(q) ||
        log.userRole.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.targetResource && log.targetResource.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q));
      if (!match) return false;
    }
    
    if (dateFilter !== 'ALL') {
      const logTime = new Date(log.timestamp).getTime();
      const now = Date.now();
      const diffHours = (now - logTime) / (1000 * 60 * 60);
      
      if (dateFilter === 'TODAY' && diffHours > 24) return false;
      if (dateFilter === '7DAYS' && diffHours > 24 * 7) return false;
      if (dateFilter === '30DAYS' && diffHours > 24 * 30) return false;
    }
    
    return true;
  });

  const totalEvents = logs.length;
  const uniqueUsers = new Set(logs.map(l => l.userName)).size;
  const deniedEvents = logs.filter(l => l.outcome === 'denied').length;
  const last24hEvents = logs.filter(l => {
    const diff = Date.now() - new Date(l.timestamp).getTime();
    return diff <= 24 * 60 * 60 * 1000;
  }).length;

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `caregraph_audit_trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClear = () => {
    auditLog.clearAuditLog();
    loadLogs();
    setShowClearConfirm(false);
  };

  const handleSeedDemo = () => {
    auditLog.seedDemoLogs();
    loadLogs();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-amber">SECURITY AUDIT ENGINE</span>
          <span className="text-xs text-gray-500">• Append-Only Immutable Ledger Simulation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-indigo-600" />
              System Audit & Access Log
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive chronological trail of authentication events, patient record views, clinical document ingestion, consent updates, and data exports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
              title="Export filtered log to JSON"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              Export Audit Trail
            </button>
            <button
              onClick={handleSeedDemo}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
              title="Refresh / Restore synthetic demo logs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
              Refresh Events
            </button>
            {authState.user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                title="Admin: Clear logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Synthetic Disclaimer Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 flex items-start gap-3 text-xs border border-slate-800">
        <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Cryptographic Provenance & Real-World SIEM Architecture</p>
          <p className="mt-0.5 leading-relaxed text-slate-300">
            In production healthcare deployments, all audit events are cryptographically signed with SHA-256 digests and streamed to an append-only, tamper-evident SIEM repository (e.g. AWS CloudTrail, Google Cloud Audit Logs, or Datadog Healthcare). The records shown here demonstrate the exact data schema and event granularity required for HIPAA Security Rule (§ 164.312(b)) and GDPR Article 30 compliance.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalEvents}</div>
          <p className="text-[11px] text-gray-400 mt-1">Recorded audit entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Actors</span>
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{uniqueUsers}</div>
          <p className="text-[11px] text-gray-400 mt-1">Users & system agents</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Denials</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{deniedEvents}</div>
          <p className="text-[11px] text-gray-400 mt-1">Blocked access attempts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recent Activity</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{last24hEvents}</div>
          <p className="text-[11px] text-gray-400 mt-1">Events in past 24 hours</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, action, resource, or details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="PATIENT_RECORD_VIEW">PATIENT_RECORD_VIEW</option>
            <option value="REPORT_VIEW">REPORT_VIEW</option>
            <option value="LAB_TREND_VIEW">LAB_TREND_VIEW</option>
            <option value="MEDICATION_VIEW">MEDICATION_VIEW</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_COMMIT">DOCUMENT_COMMIT</option>
            <option value="CONSENT_GRANT">CONSENT_GRANT</option>
            <option value="CONSENT_REVOKE">CONSENT_REVOKE</option>
            <option value="DATA_EXPORT">DATA_EXPORT</option>
            <option value="PDF_GENERATE">PDF_GENERATE</option>
            <option value="PATIENT_DATA_RESET">PATIENT_DATA_RESET</option>
            <option value="MODE_SWITCH">MODE_SWITCH</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
          >
            <option value="ALL">All Outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="denied">Access Denied</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Last 24 Hours</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor (User / Role)</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No audit log events match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{log.userName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-mono text-[11px]">
                      {log.targetResource || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getOutcomeBadge(log.outcome)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredLogs.length} of {logs.length} logged event{logs.length !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[11px]">CareGraph Audit Engine • Ring Buffer (1000 max)</span>
        </div>
      </div>

      {/* MODAL: CLEAR CONFIRMATION */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Clear Audit Trail?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border leading-relaxed">
              In a certified production environment, audit logs are <strong>append-only and cannot be purged</strong>. In demo mode, this resets the current session log buffer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
