import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Pill,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  GitBranch,
  TrendingUp,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldAlert,
  ArrowRight,
  Activity,
  History,
  X,
  Stethoscope
} from 'lucide-react';
import { usePatientRecord } from '@/context/PatientRecordContext';
import {
  demoConditions,
  demoDoctors,
  demoLabTrends,
  demoReports,
  demoHealthEvents
} from '@/data/patient';
import type { Medication, HealthEvent } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getDoctor(id: string) {
  return demoDoctors.find(d => d.id === id);
}

function getCondition(id: string) {
  return demoConditions.find(c => c.id === id);
}

// Structured medication history milestones
interface MedicationMilestone {
  date: string;
  action: 'started' | 'adjusted' | 'continued' | 'discontinued';
  medicationName: string;
  details: string;
  conditionName: string;
  prescribedBy: string;
  eventId?: string;
}

const MEDICATION_HISTORY: MedicationMilestone[] = [
  {
    date: '2019-03-15',
    action: 'started',
    medicationName: 'Metformin',
    details: 'Initiated at 500mg twice daily following Type 2 Diabetes diagnosis.',
    conditionName: 'Type 2 Diabetes',
    prescribedBy: 'd1',
    eventId: 'e3'
  },
  {
    date: '2020-06-15',
    action: 'started',
    medicationName: 'Amlodipine, Lisinopril, Atorvastatin',
    details: 'Triple therapy initiated: Amlodipine 5mg (CCB), Lisinopril 10mg (ACEi), Atorvastatin 10mg (Statin) for hypertension & cardiovascular risk.',
    conditionName: 'Hypertension',
    prescribedBy: 'd2',
    eventId: 'e8'
  },
  {
    date: '2021-01-10',
    action: 'started',
    medicationName: 'Glimepiride',
    details: 'Added Glimepiride 2mg once daily as dual-therapy to achieve target HbA1c control (<7.0%).',
    conditionName: 'Type 2 Diabetes',
    prescribedBy: 'd1',
    eventId: 'e10'
  },
  {
    date: '2024-09-01',
    action: 'discontinued',
    medicationName: 'Lisinopril',
    details: 'Discontinued after 4 years of therapy due to renal optimization regimen.',
    conditionName: 'Hypertension',
    prescribedBy: 'd2',
    eventId: 'e20'
  },
  {
    date: '2024-09-01',
    action: 'started',
    medicationName: 'Telmisartan',
    details: 'Switched to Telmisartan 40mg once daily (ARB) for renoprotective benefits in CKD Stage 2.',
    conditionName: 'Hypertension & CKD Stage 2',
    prescribedBy: 'd2',
    eventId: 'e20'
  }
];

export default function MedicationsPage() {
  const navigate = useNavigate();
  const { medications, conditions } = usePatientRecord();
  const [searchParams] = useSearchParams();
  const selectedMedParam = searchParams.get('med');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'discontinued'>('all');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  useEffect(() => {
    if (selectedMedParam) {
      const found = medications.find(m => m.id === selectedMedParam);
      if (found) setSelectedMed(found);
    }
  }, [selectedMedParam, medications]);

  const activeMedications = useMemo(
    () => medications.filter(m => m.status === 'active'),
    [medications]
  );
  const historicalMedications = useMemo(
    () => medications.filter(m => m.status !== 'active'),
    [medications]
  );

  const filteredMeds = useMemo(() => {
    return medications.filter(med => {
      const matchesStatus =
        statusFilter === 'all' ? true : med.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus;

      const condition = (conditions.find(c => c.id === med.relatedCondition) || demoConditions.find(c => c.id === med.relatedCondition))?.name.toLowerCase() || '';
      const doctor = getDoctor(med.prescribedBy)?.name.toLowerCase() || '';
      const matchesQuery =
        med.name.toLowerCase().includes(query) ||
        med.dose.toLowerCase().includes(query) ||
        condition.includes(query) ||
        doctor.includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [medications, conditions, statusFilter, searchQuery]);

  // Connected relationships for selected medication
  const medRelationships = useMemo(() => {
    if (!selectedMed) return null;

    const condition = getCondition(selectedMed.relatedCondition);
    const doctor = getDoctor(selectedMed.prescribedBy);

    // Linked biomarker trends
    let relatedTrends: string[] = [];
    if (selectedMed.name === 'Metformin' || selectedMed.name === 'Glimepiride') {
      relatedTrends = ['HbA1c'];
    } else if (
      selectedMed.name === 'Amlodipine' ||
      selectedMed.name === 'Lisinopril' ||
      selectedMed.name === 'Telmisartan'
    ) {
      relatedTrends = ['Systolic BP', 'Creatinine'];
    } else if (selectedMed.name === 'Atorvastatin') {
      relatedTrends = ['Total Cholesterol', 'LDL Cholesterol'];
    }

    // Linked reports
    const relatedReports = demoReports.filter(r =>
      r.relatedMedications.includes(selectedMed.id) ||
      (condition && r.relatedConditions.includes(condition.id))
    );

    // Linked timeline events
    const relatedEvents = demoHealthEvents.filter(e =>
      e.relatedEntityId === selectedMed.id ||
      (e.type === 'medication' && e.title.toLowerCase().includes(selectedMed.name.toLowerCase()))
    );

    return {
      condition,
      doctor,
      relatedTrends,
      relatedReports,
      relatedEvents
    };
  }, [selectedMed]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl shadow-sm border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Pharmacotherapy Management
              </span>
              <span className="text-xs text-emerald-300">
                {activeMedications.length} Active Prescriptions • {historicalMedications.length} Discontinued
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Medication Profile & Longitudinal History
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-2xl">
              Track active dosages, administration schedules, prescribing clinicians, and the clinical evolution of your drug therapy connected to condition markers.
            </p>
          </div>

          <div className="flex bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/50 self-start md:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Pill className="w-4 h-4" />
              Medication Overview
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Medication Timeline
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MEDICATIONS OVERVIEW (CARDS/TABLE) */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medication, dosage, condition, or prescriber..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({medications.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Current Active ({activeMedications.length})
              </button>
              <button
                onClick={() => setStatusFilter('discontinued')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'discontinued'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Historical ({historicalMedications.length})
              </button>
            </div>
          </div>

          {/* Section 1: CURRENT ACTIVE MEDICATIONS */}
          {(statusFilter === 'all' || statusFilter === 'active') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-bold text-gray-900">
                    Current Active Regimen ({activeMedications.length})
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  Prescriptions actively dispensed and taken
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeMedications
                  .filter(m => filteredMeds.some(fm => fm.id === m.id))
                  .map(med => {
                    const doc = getDoctor(med.prescribedBy);
                    const cond = getCondition(med.relatedCondition);

                    return (
                      <div
                        key={med.id}
                        onClick={() => setSelectedMed(med)}
                        className="card card-hover p-5 cursor-pointer border border-gray-200 hover:border-emerald-500 group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                <Pill className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-base">
                                  {med.name}
                                </h3>
                                <div className="text-xs text-emerald-700 font-semibold">
                                  {med.dose} • {med.frequency}
                                </div>
                              </div>
                            </div>

                            <span className="badge-green text-[11px] font-semibold">
                              ACTIVE
                            </span>
                          </div>

                          <div className="space-y-2 mt-4 text-xs text-gray-600 border-t border-gray-100 pt-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Administration:</span>
                              <span className="font-medium text-gray-700">{med.route || 'Oral'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Started On:</span>
                              <span className="font-medium text-gray-700">{formatDate(med.startDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Prescribing MD:</span>
                              <span className="font-medium text-gray-700">{doc?.name || 'Physician'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-gray-400">Target Indication:</span>
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium text-[11px]">
                                {cond?.name || 'Condition'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-4">
                          <span className="text-[11px] text-gray-400">
                            Dr. {doc?.name.replace('Dr. ', '')} ({doc?.specialization.split(' ')[0]})
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Inspect Connections <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 2: HISTORICAL / DISCONTINUED MEDICATIONS */}
          {(statusFilter === 'all' || statusFilter === 'discontinued') && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <h2 className="text-base font-bold text-gray-700">
                    Discontinued / Historical Medications ({historicalMedications.length})
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  Prescriptions modified or stopped during longitudinal care
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {historicalMedications
                  .filter(m => filteredMeds.some(fm => fm.id === m.id))
                  .map(med => {
                    const doc = getDoctor(med.prescribedBy);
                    const cond = getCondition(med.relatedCondition);

                    return (
                      <div
                        key={med.id}
                        onClick={() => setSelectedMed(med)}
                        className="card card-hover p-5 cursor-pointer border border-gray-200 hover:border-gray-400 group bg-gray-50/60"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-base line-through">
                                {med.name}
                              </h3>
                              <div className="text-xs text-gray-500 font-medium">
                                {med.dose} • {med.frequency}
                              </div>
                            </div>
                          </div>

                          <span className="badge text-[11px] font-semibold bg-gray-200 text-gray-700">
                            STOPPED
                          </span>
                        </div>

                        <div className="space-y-2 mt-4 text-xs text-gray-600 border-t border-gray-200 pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Duration:</span>
                            <span className="font-medium text-gray-700">
                              {formatDate(med.startDate)} → {med.endDate ? formatDate(med.endDate) : 'End'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Prescribing MD:</span>
                            <span className="font-medium text-gray-700">{doc?.name || 'Physician'}</span>
                          </div>
                          {med.notes && (
                            <div className="p-2 bg-amber-50/80 rounded border border-amber-200 text-amber-800 text-[11px] mt-1">
                              <span className="font-semibold">Reason: </span>
                              {med.notes}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-200 flex items-center justify-between mt-4">
                          <span className="text-[11px] text-gray-500">
                            Replaced by Telmisartan 40mg
                          </span>
                          <span className="text-xs font-medium text-gray-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Inspect History <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: LONGITUDINAL MEDICATION TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Longitudinal Medication Timeline (2019 - Present)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chronological trajectory of medication introductions, dose adjustments, and therapeutic transitions.
              </p>
            </div>
            <span className="badge-blue text-xs">
              {MEDICATION_HISTORY.length} Documented Transitions
            </span>
          </div>

          {/* Timeline List */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {MEDICATION_HISTORY.map((item, idx) => {
              const isDiscontinued = item.action === 'discontinued';
              const doctor = getDoctor(item.prescribedBy);

              return (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                      isDiscontinued ? 'bg-red-500 ring-2 ring-red-100' : 'bg-emerald-500 ring-2 ring-emerald-100'
                    }`}
                  />

                  <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-400 transition-colors shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">
                          {formatDate(item.date)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isDiscontinued
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.action}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                          {item.medicationName}
                        </span>
                      </div>

                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {doctor?.name || 'Physician'} ({doctor?.specialization})
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {item.details}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                      <span className="text-gray-500">
                        Indication: <strong className="text-gray-800">{item.conditionName}</strong>
                      </span>

                      {item.eventId && (
                        <button
                          onClick={() => navigate('/timeline')}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Clock className="w-3 h-3" /> View in Health Timeline
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MEDICATION DETAIL PANEL / MODAL */}
      {selectedMed && medRelationships && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        selectedMed.status === 'active' ? 'badge-green' : 'badge-amber'
                      }`}
                    >
                      {selectedMed.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      Rx ID: {selectedMed.id.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMed.name}</h2>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {selectedMed.dose} • {selectedMed.frequency} • {selectedMed.route || 'Oral'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMed(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Prescriber & Schedule */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                <div>
                  <div className="text-gray-400">Prescribing Clinician</div>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">
                    {medRelationships.doctor?.name || 'Physician'}
                  </div>
                  <div className="text-gray-500">{medRelationships.doctor?.specialization}</div>
                  <div className="text-gray-400 mt-1">{medRelationships.doctor?.hospital}</div>
                </div>

                <div>
                  <div className="text-gray-400">Administration & Duration</div>
                  <div className="font-semibold text-gray-800 mt-0.5">
                    {selectedMed.dose} ({selectedMed.frequency})
                  </div>
                  <div className="text-gray-500">Route: {selectedMed.route || 'Oral'}</div>
                  <div className="text-gray-500 mt-1">
                    Started: {formatDate(selectedMed.startDate)}
                    {selectedMed.endDate && ` • Stopped: ${formatDate(selectedMed.endDate)}`}
                  </div>
                </div>
              </div>

              {/* Connected Clinical Relationship Tree */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Longitudinal Health Graph Relationships
                </h4>

                <div className="space-y-3 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs">
                  {/* 1. Condition */}
                  <div className="flex items-center gap-3">
                    <span className="w-32 text-gray-500 font-medium shrink-0 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      Related Condition:
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMed(null);
                        navigate('/graph');
                      }}
                      className="px-2.5 py-1 rounded bg-red-100/70 text-red-800 font-semibold hover:bg-red-200 transition-colors flex items-center gap-1"
                    >
                      {medRelationships.condition?.name || 'Clinical Indication'}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 2. Monitored Biomarkers */}
                  <div className="flex items-center gap-3">
                    <span className="w-32 text-gray-500 font-medium shrink-0 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      Monitored Biomarkers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {medRelationships.relatedTrends.map(trend => (
                        <button
                          key={trend}
                          onClick={() => {
                            setSelectedMed(null);
                            navigate(`/reports?tab=trends&param=${trend}`);
                          }}
                          className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          {trend} Trend <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Linked Reports */}
                  {medRelationships.relatedReports.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="w-32 text-gray-500 font-medium shrink-0 pt-0.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        Linked Reports:
                      </span>
                      <div className="space-y-1">
                        {medRelationships.relatedReports.slice(0, 3).map(rpt => (
                          <button
                            key={rpt.id}
                            onClick={() => {
                              setSelectedMed(null);
                              navigate(`/reports?reportId=${rpt.id}`);
                            }}
                            className="block text-blue-700 hover:underline text-left truncate max-w-xs"
                          >
                            • {rpt.title} ({formatDate(rpt.date)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informational Guidance */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p>
                  Medication records shown here reflect prescribed longitudinal regimens. Never modify or discontinue prescribed doses without consulting your treating physician.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => {
                  setSelectedMed(null);
                  navigate('/graph');
                }}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" /> View in Health Graph
              </button>

              <button
                onClick={() => setSelectedMed(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
