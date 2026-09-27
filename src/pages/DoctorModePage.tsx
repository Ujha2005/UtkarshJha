import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Pill,
  GitBranch,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  User,
  Building,
  ShieldCheck,
  Search,
  Filter,
  FileCheck,
  Layers,
  ArrowRight,
  ClipboardList,
  Printer,
  X,
  Sparkles,
  Apple,
  Utensils
} from 'lucide-react';
import { usePatientRecord } from '@/context/PatientRecordContext';
import { generateDoctorSummaryPDF } from '@/services/pdfGenerator';
import type { Condition, Medication, LabTrend, Report, HealthEvent, Patient, Allergy } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export interface DoctorSummaryObject {
  generatedAt: string;
  patient: Patient;
  allergies: Allergy[];
  activeConditions: Condition[];
  currentMedications: Medication[];
  historicalMedications: Medication[];
  recentBiomarkers: {
    parameter: string;
    latest: number;
    unit: string;
    date: string;
    refRange: string;
    trendNote: string;
  }[];
  recentReports: Report[];
  timelineMilestones: HealthEvent[];
  pendingReviewCount: number;
  clinicalConflicts: string[];
}

export default function DoctorModePage() {
  const navigate = useNavigate();
  const {
    patient,
    conditions,
    medications,
    labTrends,
    reports,
    healthEvents,
    nutritionEntries,
    ingestedDocuments,
    doctors,
    allergies
  } = usePatientRecord();

  const getDoctorName = (id: string) => doctors?.find(d => d.id === id)?.name || id;

  // Filters
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReportModal, setSelectedReportModal] = useState<Report | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Daily Nutrition Breakdown
  const dailyNutrition = useMemo(() => {
    return nutritionEntries.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + item.fiber
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [nutritionEntries]);

  // Active vs Discontinued Meds
  const activeMeds = useMemo(() => medications.filter(m => m.status === 'active'), [medications]);
  const historicalMeds = useMemo(() => medications.filter(m => m.status !== 'active'), [medications]);
  const activeConditions = useMemo(() => conditions.filter(c => c.status === 'active' || c.status === 'managed'), [conditions]);

  // Detected ingestion conflicts / pending reviews
  const pendingDocs = useMemo(() => ingestedDocuments.filter(d => d.status === 'review_required'), [ingestedDocuments]);
  const hasStatinConflict = useMemo(() => {
    return medications.some(m => m.name.toLowerCase().includes('rosuvastatin')) &&
           medications.some(m => m.name.toLowerCase().includes('atorvastatin'));
  }, [medications]);

  // Filtered timeline events
  const filteredTimeline = useMemo(() => {
    return healthEvents.filter(e => {
      const matchesType = timelineFilter === 'all' ? true : e.type === timelineFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;
      return matchesType && (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.date.includes(q)
      );
    });
  }, [healthEvents, timelineFilter, searchQuery]);

  // Generate structured Doctor Summary Object
  const doctorSummaryObject: DoctorSummaryObject = useMemo(() => {
    const conflicts: string[] = [];
    if (hasStatinConflict) {
      conflicts.push('Pharmacotherapy Conflict: Both Atorvastatin and Rosuvastatin detected in active records; clinical reconciliation required.');
    }
    ingestedDocuments.forEach(doc => {
      if (doc.conflictCount > 0) {
        conflicts.push(`Document "${doc.name}" contains ${doc.conflictCount} flagged clinical data conflicts.`);
      }
    });

    return {
      generatedAt: new Date().toISOString(),
      patient,
      allergies: allergies || [],
      activeConditions,
      currentMedications: activeMeds,
      historicalMedications: historicalMeds,
      recentBiomarkers: labTrends.map(t => {
        const latest = t.data[t.data.length - 1];
        const prev = t.data.length > 1 ? t.data[t.data.length - 2] : null;
        let trendNote = 'Stable baseline';
        if (prev) {
          if (latest.value > prev.value) trendNote = `Increase from previous measurement (${prev.value} -> ${latest.value} ${t.unit})`;
          else if (latest.value < prev.value) trendNote = `Decrease from previous measurement (${prev.value} -> ${latest.value} ${t.unit})`;
        }
        return {
          parameter: t.parameter,
          latest: latest.value,
          unit: t.unit,
          date: latest.date,
          refRange: `${t.referenceMin} - ${t.referenceMax}`,
          trendNote
        };
      }),
      recentReports: reports.slice(0, 5),
      timelineMilestones: healthEvents.slice(0, 8),
      pendingReviewCount: pendingDocs.length,
      clinicalConflicts: conflicts
    };
  }, [patient, activeConditions, activeMeds, historicalMeds, labTrends, reports, healthEvents, pendingDocs, hasStatinConflict, ingestedDocuments]);

  return (
    <div className="space-y-6">
      {/* 1. CLINICAL HEADER & DEMOGRAPHICS */}
      <div className="card p-6 bg-slate-900 text-white rounded-2xl shadow-md border-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                CLINICIAN ENCOUNTER VIEW
              </span>
              <span className="badge-amber text-xs font-semibold">
                SYNTHETIC DEMO DATA
              </span>
              <span className="text-xs text-slate-400">
                UHID: CG-8891024 • Record Continuity: 2019–2026 (98%)
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {patient.name}
              </h1>
              <span className="text-sm text-slate-300 font-medium">
                {patient.age} Yrs • {patient.gender} • Blood Group: <strong className="text-white">{patient.bloodGroup}</strong>
              </span>
            </div>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4">
              <span>
                Primary Attending: <strong>{getDoctorName(patient.primaryDoctor)}</strong> (Family Clinic)
              </span>
              <span>•</span>
              <span>Last Documented Update: <strong>{formatDate(reports[0]?.date || '2026-09-24')}</strong></span>
            </div>
          </div>

          {/* Quick Clinical Triage Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => generateDoctorSummaryPDF(doctorSummaryObject)}
              className="btn-primary text-xs flex items-center gap-1.5 py-2.5 px-4 shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Export PDF Summary
            </button>
            <button
              onClick={() => setShowSummaryModal(true)}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-4 bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 shadow-sm"
            >
              <ClipboardList className="w-4 h-4" />
              Preview Summary Object
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-4 bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700"
            >
              <GitBranch className="w-4 h-4 text-blue-400" />
              Inspect Health Graph
            </button>
            <button
              onClick={() => navigate('/ingest')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-4 bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700"
            >
              <FileCheck className="w-4 h-4 text-teal-400" />
              Ingestion Hub
            </button>
          </div>
        </div>

        {/* Clinical Tags Row: Allergies & Active Conditions */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
              Documented Allergies & Drug Adverse Reactions
            </span>
            <div className="flex flex-wrap gap-2">
              {(allergies || []).map(a => (
                <span
                  key={a.id}
                  className="px-2.5 py-1 rounded-md bg-red-950/80 border border-red-800 text-red-200 font-semibold flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  {a.allergen} ({a.reaction} • {a.severity})
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
              Active Longitudinal Diagnoses
            </span>
            <div className="flex flex-wrap gap-2">
              {activeConditions.map(c => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                >
                  {c.name} ({c.severity})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLINICAL ALERTS & CONFLICT MONITOR */}
      {(hasStatinConflict || pendingDocs.length > 0) && (
        <div className="space-y-3">
          {hasStatinConflict && (
            <div className="card p-4 bg-red-50 border-l-4 border-l-red-600 border-red-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-red-900 text-sm uppercase tracking-wider">
                    Potential Pharmacotherapy Conflict Requiring Reconciliation
                  </h4>
                  <p className="text-red-800 leading-relaxed">
                    Patient records contain active prescriptions for both <strong>Atorvastatin 10 mg</strong> (initiated 2020) and <strong>Rosuvastatin 10 mg</strong> (cardiologist prescription dated 22 Sep 2026). Ingestion notes recommend replacing Atorvastatin with Rosuvastatin for plaque stabilization.
                  </p>
                  <div className="text-[11px] font-semibold text-red-900 pt-1">
                    Action Required: Verify patient has stopped Atorvastatin before dispensing high-potency Rosuvastatin.
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/medications')}
                className="btn-secondary text-xs shrink-0 py-1.5 px-3 bg-white text-red-700 border-red-300 hover:bg-red-50"
              >
                Reconcile Meds →
              </button>
            </div>
          )}

          {pendingDocs.length > 0 && (
            <div className="card p-4 bg-amber-50 border-l-4 border-l-amber-500 border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">{pendingDocs.length} External Clinical Document(s)</span> are pending clinician review in the Ingestion Workspace.
                </div>
              </div>
              <button
                onClick={() => navigate('/ingest')}
                className="btn-secondary text-xs shrink-0 py-1.5 px-3 bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Open Ingestion Review →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DENSE CLINICAL SUMMARY (3 Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Conditions */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-600" /> Active Conditions ({activeConditions.length})
            </h3>
            <span className="text-[11px] text-slate-400">ICD Longitudinal</span>
          </div>
          <div className="space-y-2.5">
            {activeConditions.map(c => (
              <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                    {c.severity}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Diagnosed {c.diagnosedDate} by Dr. {getDoctorName(c.diagnosedBy).replace('Dr. ', '')}
                </div>
                {c.notes && <div className="text-slate-600 text-[11px] italic">{c.notes}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Current Active Regimen */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-600" /> Current Regimen ({activeMeds.length})
            </h3>
            <span className="text-[11px] text-slate-400">Rx Active</span>
          </div>
          <div className="space-y-2">
            {activeMeds.map(m => (
              <div key={m.id} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-emerald-950">{m.name}</div>
                  <div className="text-[11px] text-emerald-800">{m.dose} • {m.frequency} ({m.route || 'Oral'})</div>
                </div>
                <span className="text-[10px] text-slate-400">Since {m.startDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports & Encounter Provenance */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Recent Diagnostic Reports ({reports.length})
            </h3>
            <span className="text-[11px] text-slate-400">Verified Files</span>
          </div>
          <div className="space-y-2">
            {reports.slice(0, 4).map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedReportModal(r)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 text-xs cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate max-w-[200px]">
                    {r.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{r.date}</span>
                </div>
                <div className="text-slate-500 text-[11px] truncate mt-0.5">
                  {r.facility} • {r.findings.length} findings recorded
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. COMPACT CLINICIAN LABORATORY MATRIX */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Longitudinal Biomarker Matrix & Trajectory Overview
            </h3>
            <p className="text-xs text-slate-500">
              Descriptive historical trajectory based strictly on recorded laboratory measurements.
            </p>
          </div>
          <button
            onClick={() => navigate('/reports?tab=trends')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Explore Interactive Charts <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Biomarker</th>
                <th className="px-4 py-3 font-semibold">Latest Value</th>
                <th className="px-4 py-3 font-semibold">Previous Value</th>
                <th className="px-4 py-3 font-semibold">Reference Range</th>
                <th className="px-4 py-3 font-semibold">Trajectory Observation</th>
                <th className="px-4 py-3 font-semibold text-right">Source Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labTrends.map(trend => {
                const latest = trend.data[trend.data.length - 1];
                const prev = trend.data.length > 1 ? trend.data[trend.data.length - 2] : null;
                const delta = prev ? +(latest.value - prev.value).toFixed(2) : null;
                const isOutOfRange = latest.value > trend.referenceMax || latest.value < trend.referenceMin;

                let observation = 'Stable baseline measurement';
                if (delta !== null) {
                  if (delta > 0) {
                    observation = `Increase from previous measurement (+${delta} ${trend.unit})`;
                  } else if (delta < 0) {
                    observation = `Decrease from previous measurement (${delta} ${trend.unit})`;
                  }
                }
                if (isOutOfRange) {
                  observation += latest.value > trend.referenceMax
                    ? ' • Above displayed reference range'
                    : ' • Below displayed reference range';
                }

                return (
                  <tr key={trend.parameter} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOutOfRange ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {trend.parameter}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 text-sm">{latest.value}</span>{' '}
                      <span className="text-slate-500">{trend.unit}</span>
                      <span className="block text-[10px] text-slate-400">{formatDate(latest.date)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {prev ? (
                        <>
                          <span className="font-medium text-slate-700">{prev.value} {trend.unit}</span>
                          <span className="block text-[10px] text-slate-400">{formatDate(prev.date)}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Baseline</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {trend.referenceMin} - {trend.referenceMax} {trend.unit}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      <span className={`font-medium ${isOutOfRange ? 'text-amber-800' : 'text-slate-700'}`}>
                        {observation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/reports?tab=trends&param=${encodeURIComponent(trend.parameter)}`)}
                        className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 justify-end ml-auto"
                      >
                        Inspect Curve <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MEDICATION RECONCILIATION MATRIX */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Medication Reconciliation & Longitudinal Trajectory
            </h3>
            <p className="text-xs text-slate-500">
              Active regimens, discontinued transitions, and dosage changes with prescriber attributions.
            </p>
          </div>
          <button
            onClick={() => navigate('/medications')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            Open Medication Module <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Medication</th>
                <th className="px-4 py-3 font-semibold">Dose & Route</th>
                <th className="px-4 py-3 font-semibold">Frequency</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Start Date</th>
                <th className="px-4 py-3 font-semibold">Prescribing Clinician</th>
                <th className="px-4 py-3 font-semibold">Indication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medications.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${m.status !== 'active' ? 'bg-slate-50/60 opacity-70' : ''}`}>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {m.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {m.dose} ({m.route || 'Oral'})
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.frequency}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(m.startDate)}
                    {m.endDate && <span className="block text-[10px] text-red-600">Ended: {formatDate(m.endDate)}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {getDoctorName(m.prescribedBy)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.relatedCondition ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {conditions.find(c => c.id === m.relatedCondition)?.name || m.relatedCondition}
                      </span>
                    ) : 'General'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5.5 CLINICAL NUTRITION SNAPSHOT */}
      <div className="card p-6 bg-slate-900 text-white rounded-2xl shadow-md border-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Dietary & Cardiometabolic Nutrition Snapshot
              </h3>
              <p className="text-xs text-slate-400">
                Logged on 26 Sep 2026 ({nutritionEntries.length} meals documented)
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/nutrition')}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 text-emerald-300 hover:bg-slate-700 border-slate-700 shrink-0 self-start sm:self-auto"
          >
            Open Nutrition Module <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Energy Logged</span>
            <span className="text-lg font-bold text-white">{dailyNutrition.calories}</span>
            <span className="text-slate-400 text-[11px] block">kcal (Target: ~1,700)</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Protein</span>
            <span className="text-lg font-bold text-emerald-400">{dailyNutrition.protein}g</span>
            <span className="text-slate-400 text-[11px] block">~0.85 g/kg (Renal safe)</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Carbohydrates</span>
            <span className="text-lg font-bold text-blue-400">{dailyNutrition.carbs}g</span>
            <span className="text-slate-400 text-[11px] block">Paced across 5 meals</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dietary Fat</span>
            <span className="text-lg font-bold text-amber-400">{dailyNutrition.fat}g</span>
            <span className="text-slate-400 text-[11px] block">Low saturated fats</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fiber & Hydration</span>
            <span className="text-lg font-bold text-purple-400">{dailyNutrition.fiber}g / 1.8L</span>
            <span className="text-slate-400 text-[11px] block">Lithotripsy target: &ge;2.2L</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <strong className="text-emerald-400">Clinical Relevance:</strong> Protein pacing supports CKD Stage 2 without renal hyperfiltration. Fiber (22g) buffers glycemic fluctuations in coordination with Metformin + Glimepiride. Recommend patient maintain hydration &ge;2.2 L for lithotripsy stone prevention.
        </p>
      </div>

      {/* 6. CLINICAL ENCOUNTER TIMELINE */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Longitudinal Clinical Event Timeline ({filteredTimeline.length})
            </h3>
            <p className="text-xs text-slate-500">
              Filterable clinical chronology spanning diagnoses, procedures, and laboratory milestones.
            </p>
          </div>

          {/* Timeline Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'diagnosis', label: 'Diagnosis' },
              { id: 'medication', label: 'Medication' },
              { id: 'lab_test', label: 'Lab' },
              { id: 'procedure', label: 'Procedure' },
              { id: 'visit', label: 'Consult' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimelineFilter(f.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  timelineFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTimeline.slice(0, 8).map(event => (
            <div
              key={event.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-slate-500 w-24 shrink-0 pt-0.5">
                  {formatDate(event.date)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {event.type}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <button
                  onClick={() => navigate('/timeline')}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Inspect in Timeline <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: REPORT INSPECTOR */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">
                  {selectedReportModal.type}
                </span>
                <h3 className="font-bold text-slate-900 text-lg">{selectedReportModal.title}</h3>
                <span className="text-xs text-slate-500">{selectedReportModal.date} • {selectedReportModal.facility}</span>
              </div>
              <button onClick={() => setSelectedReportModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border">
              {selectedReportModal.summary}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Documented Findings:</span>
              {selectedReportModal.findings.map((f, i) => (
                <div key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-white p-2 rounded border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t flex justify-end">
              <button onClick={() => setSelectedReportModal(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STRUCTURED DOCTOR SUMMARY OBJECT PREVIEW */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="badge-blue text-xs font-semibold">Structured Doctor Summary Object</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Longitudinal Clinical Summary for {patient.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Pre-compiled structured payload ready for PDF export or EHR synchronization
                </span>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border space-y-1">
                <div className="font-bold text-slate-900">Summary Metadata</div>
                <div className="text-slate-600">Generated: {doctorSummaryObject.generatedAt}</div>
                <div className="text-slate-600">Patient: {doctorSummaryObject.patient.name}, {doctorSummaryObject.patient.age}Y, UHID: {doctorSummaryObject.patient.id}</div>
                <div className="text-slate-600">Active Conditions Count: {doctorSummaryObject.activeConditions.length}</div>
                <div className="text-slate-600">Active Medications Count: {doctorSummaryObject.currentMedications.length}</div>
                <div className="text-slate-600">Biomarkers Tracked: {doctorSummaryObject.recentBiomarkers.length}</div>
              </div>

              {doctorSummaryObject.clinicalConflicts.length > 0 && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-red-900 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Clinical Conflicts Flagged:
                  </div>
                  {doctorSummaryObject.clinicalConflicts.map((c, i) => (
                    <div key={i} className="text-xs pl-2">• {c}</div>
                  ))}
                </div>
              )}

              <div>
                <div className="font-bold text-slate-900 mb-1">JSON Payload Representation:</div>
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                  {JSON.stringify(doctorSummaryObject, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => generateDoctorSummaryPDF(doctorSummaryObject)}
                className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4 shadow-sm bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Download PDF Record
              </button>
              <button onClick={() => setShowSummaryModal(false)} className="btn-secondary text-xs">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
