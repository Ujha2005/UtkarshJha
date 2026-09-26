import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  FlaskConical,
  Eye,
  X,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  UploadCloud
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { usePatientRecord } from '@/context/PatientRecordContext';
import {
  demoDoctors,
  demoConditions,
  demoMedications,
  demoHealthEvents
} from '@/data/patient';
import type { Report, LabTrend } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getDoctorName(id: string): string {
  return demoDoctors.find(d => d.id === id)?.name || 'Dr. Attending Physician';
}

function getDoctorSpec(id: string): string {
  return demoDoctors.find(d => d.id === id)?.specialization || 'Clinical Specialist';
}

function getConditionName(id: string): string {
  return demoConditions.find(c => c.id === id)?.name || id;
}

function getMedicationName(id: string): string {
  return demoMedications.find(m => m.id === id)?.name || id;
}

const REPORT_TYPE_CONFIG: Record<
  Report['type'],
  { label: string; badge: string; icon: React.ElementType }
> = {
  blood_test: { label: 'Blood Test', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: FlaskConical },
  imaging: { label: 'Imaging', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Layers },
  procedure: { label: 'Procedure', badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: Activity },
  doctor_note: { label: 'Doctor Note', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
  other: { label: 'Other Record', badge: 'bg-gray-50 text-gray-700 border-gray-200', icon: FileText }
};

export default function ReportsPage() {
  const { reports, labTrends } = usePatientRecord();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab: 'reports' or 'trends'
  const activeTab = searchParams.get('tab') === 'trends' ? 'trends' : 'reports';
  const paramFromQuery = searchParams.get('param');
  const reportIdFromQuery = searchParams.get('reportId');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Selected Lab Trend parameter
  const [selectedParam, setSelectedParam] = useState<string>(paramFromQuery || 'HbA1c');
  const [selectedResultPoint, setSelectedResultPoint] = useState<{
    date: string;
    value: number;
    index: number;
  } | null>(null);

  // Sync state if query parameters change
  useEffect(() => {
    if (paramFromQuery) {
      setSelectedParam(paramFromQuery);
    }
  }, [paramFromQuery]);

  useEffect(() => {
    if (reportIdFromQuery) {
      const found = reports.find(r => r.id === reportIdFromQuery);
      if (found) {
        setSelectedReport(found);
      }
    }
  }, [reportIdFromQuery, reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesCategory =
        selectedCategory === 'all' || report.type === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const doctorName = getDoctorName(report.doctor).toLowerCase();
      const matchesSearch =
        report.title.toLowerCase().includes(query) ||
        report.summary.toLowerCase().includes(query) ||
        report.facility.toLowerCase().includes(query) ||
        doctorName.includes(query) ||
        report.findings.some(f => f.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, reports]);

  // Active trend object
  const activeTrend = useMemo(() => {
    return (
      labTrends.find(
        t => t.parameter.toLowerCase() === selectedParam.toLowerCase() ||
             t.parameter.toLowerCase().includes(selectedParam.toLowerCase())
      ) || labTrends[0]
    );
  }, [selectedParam, labTrends]);

  // Notable summary descriptions (neutral, non-diagnostic)
  const trendInsight = useMemo(() => {
    switch (activeTrend.parameter) {
      case 'HbA1c':
        return {
          title: 'Glycemic Trend Observation',
          description:
            'HbA1c levels decreased from an initial 8.1% (Mar 2019) to 6.7% (Aug 2026), reflecting longitudinal response to diabetes management.',
          status: 'Trending favorable',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      case 'Creatinine':
        return {
          title: 'Renal Biomarker Observation',
          description:
            'Serum creatinine increased from 1.0 mg/dL (Jun 2020) to 1.4 mg/dL (Aug 2026). Corresponds to established CKD Stage 2 monitoring plan.',
          status: 'Requires clinician review',
          color: 'text-amber-800 bg-amber-50 border-amber-200'
        };
      case 'Systolic BP':
        return {
          title: 'Blood Pressure Observation',
          description:
            'Systolic blood pressure decreased from 152 mmHg (Jun 2020) to 130 mmHg (Aug 2026) following anti-hypertensive regimen initiation.',
          status: 'Within target range',
          color: 'text-blue-700 bg-blue-50 border-blue-200'
        };
      case 'Hemoglobin':
        return {
          title: 'Complete Blood Count Observation',
          description:
            'Hemoglobin shifted from 14.2 g/dL (Mar 2020) to 12.4 g/dL (Aug 2026). Mildly below the standard male reference threshold (13.0 g/dL).',
          status: 'Mildly reduced',
          color: 'text-amber-800 bg-amber-50 border-amber-200'
        };
      case 'Total Cholesterol':
        return {
          title: 'Lipid Profile Observation',
          description:
            'Total cholesterol lowered from 242 mg/dL (Jun 2020) to 192 mg/dL (Aug 2026), reaching the recommended clinical target of <200 mg/dL.',
          status: 'Normal range achieved',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      case 'LDL Cholesterol':
        return {
          title: 'LDL Cholesterol Observation',
          description:
            'LDL cholesterol decreased from 158 mg/dL (Jun 2020) to 112 mg/dL (Aug 2026) with statin therapy. Continued lifestyle and medical management noted.',
          status: 'Improved control',
          color: 'text-blue-700 bg-blue-50 border-blue-200'
        };
      default:
        return {
          title: 'Biomarker Summary',
          description: `Longitudinal values for ${activeTrend.parameter} across available health records.`,
          status: 'Informational',
          color: 'text-gray-700 bg-gray-50 border-gray-200'
        };
    }
  }, [activeTrend]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="card p-6 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-sm border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                Medical Records & Biomarkers
              </span>
              <span className="text-xs text-blue-300">
                {reports.length} Synthetic Reports • {labTrends.length} Tracked Trends
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Diagnostic Reports & Lab Trends
            </h1>
            <p className="text-sm text-blue-200 mt-1 max-w-2xl">
              Access chronological clinical documentation, imaging reports, procedure summaries, and longitudinal biomarker curves connected to your health graph.
            </p>
          </div>

          <div className="flex bg-blue-950/60 p-1.5 rounded-xl border border-blue-700/50 self-start md:self-auto">
            <button
              onClick={() => setSearchParams({ tab: 'reports' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Medical Reports ({reports.length})
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'trends' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'trends'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Lab Trends & Analytics
            </button>
            <button
              onClick={() => navigate('/ingest')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Ingest Document
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MEDICAL REPORTS BROWSER */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls: Search & Category Filters */}
          <div className="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports by title, key findings, clinic, or physician..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Records', count: reports.length },
                { id: 'blood_test', label: 'Blood Tests', count: reports.filter(r => r.type === 'blood_test').length },
                { id: 'imaging', label: 'Imaging', count: reports.filter(r => r.type === 'imaging').length },
                { id: 'procedure', label: 'Procedures', count: reports.filter(r => r.type === 'procedure').length },
                { id: 'doctor_note', label: 'Doctor Notes', count: reports.filter(r => r.type === 'doctor_note').length }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map(report => {
              const config = REPORT_TYPE_CONFIG[report.type] || REPORT_TYPE_CONFIG.other;
              const TypeIcon = config.icon;

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="card card-hover p-5 cursor-pointer flex flex-col justify-between group border border-gray-200 hover:border-blue-400"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`}>
                        <TypeIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(report.date)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1 mb-1">
                      {report.title}
                    </h3>

                    <div className="text-xs text-gray-500 flex items-center gap-2 mb-3">
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <User className="w-3 h-3 text-gray-400" />
                        {getDoctorName(report.doctor)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate text-gray-500">
                        <Building className="w-3 h-3 text-gray-400" />
                        {report.facility}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {report.summary}
                    </p>

                    {/* Key Findings List */}
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Key Findings Preview
                      </div>
                      {report.findings.slice(0, 2).map((finding, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{finding}</span>
                        </div>
                      ))}
                      {report.findings.length > 2 && (
                        <div className="text-[11px] text-gray-400 pl-5">
                          +{report.findings.length - 2} additional measurements recorded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer / Connectors */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        Status: {report.status.toUpperCase()}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Inspect Record <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <div className="card p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No reports matched your criteria</h3>
              <p className="text-sm">Try broadening your search query or reset category filters.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="btn-secondary mt-4 text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LAB TRENDS & BIOMARKERS VIEW */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Parameter Picker Bar */}
          <div className="card p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Select Biomarker or Vital Parameter
            </div>
            <div className="flex flex-wrap gap-2">
              {labTrends.map(trend => {
                const isSelected =
                  trend.parameter.toLowerCase() === activeTrend.parameter.toLowerCase();
                const latestVal = trend.data[trend.data.length - 1];
                const isOutOfRange =
                  latestVal.value > trend.referenceMax ||
                  latestVal.value < trend.referenceMin;

                return (
                  <button
                    key={trend.parameter}
                    onClick={() => {
                      setSelectedParam(trend.parameter);
                      setSelectedResultPoint(null);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                        : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span>{trend.parameter}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : isOutOfRange
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <div
                        className={`text-xs ${
                          isSelected ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        Latest: {latestVal.value} {trend.unit}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Trend Visualization & Insight Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area (2 Cols) */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeTrend.parameter} Historical Trajectory
                    </h2>
                    <span className="badge-blue text-xs font-medium">
                      {activeTrend.data.length} Longitudinal Points
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Standard reference interval: {activeTrend.referenceMin} -{' '}
                    {activeTrend.referenceMax} {activeTrend.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Recorded Value
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Normal Reference
                  </span>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeTrend.data}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    onClick={state => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const payload = state.activePayload[0].payload;
                        const idx = activeTrend.data.findIndex(d => d.date === payload.date);
                        setSelectedResultPoint({ date: payload.date, value: payload.value, index: idx });
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => {
                        const date = new Date(d);
                        return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                      }}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis
                      domain={[
                        (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.85)),
                        (dataMax: number) => Math.ceil(dataMax * 1.15)
                      ]}
                      stroke="#94a3b8"
                      fontSize={11}
                      unit={` ${activeTrend.unit}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const isHigh = item.value > activeTrend.referenceMax;
                          const isLow = item.value < activeTrend.referenceMin;
                          return (
                            <div className="bg-gray-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                              <p className="text-gray-400 font-medium">{formatDate(item.date)}</p>
                              <p className="text-base font-bold text-white">
                                {item.value} <span className="text-xs font-normal text-blue-300">{activeTrend.unit}</span>
                              </p>
                              <div className="pt-1 border-t border-gray-800">
                                {isHigh ? (
                                  <span className="text-amber-400 font-medium">Above reference max ({activeTrend.referenceMax})</span>
                                ) : isLow ? (
                                  <span className="text-blue-400 font-medium">Below reference min ({activeTrend.referenceMin})</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">Within reference range</span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400">Click data point to inspect detail</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Normal Range Reference Lines */}
                    <ReferenceLine
                      y={activeTrend.referenceMax}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: `Max: ${activeTrend.referenceMax}`, position: 'top', fill: '#10b981', fontSize: 10 }}
                    />
                    {activeTrend.referenceMin > 0 && (
                      <ReferenceLine
                        y={activeTrend.referenceMin}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        label={{ value: `Min: ${activeTrend.referenceMin}`, position: 'bottom', fill: '#10b981', fontSize: 10 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                      activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2, fill: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-center text-gray-400 mt-2">
                Tip: Click any data point on the graph or table below to inspect comparative changes and associated source records.
              </p>
            </div>

            {/* Insight & Summary Panel (1 Col) */}
            <div className="space-y-4">
              {/* Neutral Clinical Observation Card */}
              <div className={`card p-5 border ${trendInsight.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {trendInsight.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-700 mb-3">
                  {trendInsight.description}
                </p>
                <div className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-white/70 border border-gray-200">
                  Clinical status: {trendInsight.status}
                </div>
              </div>

              {/* Informational Disclaimer Box */}
              <div className="card p-4 bg-gray-50 border-gray-200">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">Neutral Decision-Support Guidance</p>
                    <p>
                      Biomarker trajectories summarize documented lab values and do not constitute an independent clinical diagnosis. Factors such as hydration, medication timing, and laboratory methodology influence individual results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Jump to Graph or Timeline */}
              <div className="card p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-700">Interconnected Navigation</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/graph')}
                    className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
                  >
                    View in Graph <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate('/timeline')}
                    className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
                  >
                    View Timeline <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Measurements Table with Delta Comparison */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              Historical Records for {activeTrend.parameter}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Test Date</th>
                    <th className="px-4 py-3 font-semibold">Measured Value</th>
                    <th className="px-4 py-3 font-semibold">Delta vs. Previous</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Source Report</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...activeTrend.data].reverse().map((item, reverseIdx) => {
                    const originalIdx = activeTrend.data.length - 1 - reverseIdx;
                    const prevItem = originalIdx > 0 ? activeTrend.data[originalIdx - 1] : null;
                    const delta = prevItem ? +(item.value - prevItem.value).toFixed(2) : null;
                    const pctChange = prevItem && prevItem.value !== 0 ? +((delta! / prevItem.value) * 100).toFixed(1) : null;

                    const isOutOfRange =
                      item.value > activeTrend.referenceMax ||
                      item.value < activeTrend.referenceMin;

                    // Locate matched report if any
                    const matchedReport = reports.find(
                      r => r.date === item.date && r.type === 'blood_test'
                    ) || reports.find(r => r.date === item.date);

                    return (
                      <tr
                        key={item.date}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          selectedResultPoint?.date === item.date ? 'bg-blue-50 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-semibold text-sm">
                          {item.value} <span className="text-xs font-normal text-gray-500">{activeTrend.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          {delta !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                delta > 0
                                  ? 'text-amber-600'
                                  : delta < 0
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {delta > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : delta < 0 ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : null}
                              {delta > 0 ? `+${delta}` : delta} {activeTrend.unit}
                              {pctChange !== null && ` (${pctChange > 0 ? '+' : ''}${pctChange}%)`}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Baseline record</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isOutOfRange
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOutOfRange ? 'Out of Range' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {matchedReport ? (
                            <button
                              onClick={() => setSelectedReport(matchedReport)}
                              className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-xs"
                            >
                              <FileText className="w-3 h-3" /> {matchedReport.title}
                            </button>
                          ) : (
                            <span className="text-gray-400">Diagnostic Panel</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setSelectedResultPoint({
                                date: item.date,
                                value: item.value,
                                index: originalIdx
                              })
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Inspect Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Result Point Detail Drawer / Card */}
          {selectedResultPoint && (
            <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900 text-base">
                    Laboratory Result Detail: {activeTrend.parameter} on {formatDate(selectedResultPoint.date)}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedResultPoint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="text-gray-400">Measured Value</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedResultPoint.value} {activeTrend.unit}
                  </div>
                  <div className="text-gray-500">Ref: {activeTrend.referenceMin} - {activeTrend.referenceMax}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="text-gray-400">Prior Measurement</div>
                  {selectedResultPoint.index > 0 ? (
                    <>
                      <div className="text-sm font-semibold text-gray-800">
                        {activeTrend.data[selectedResultPoint.index - 1].value} {activeTrend.unit}
                      </div>
                      <div className="text-gray-500">
                        On {formatDate(activeTrend.data[selectedResultPoint.index - 1].date)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 italic">No prior data point</div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="text-gray-400">Subsequent Measurement</div>
                  {selectedResultPoint.index < activeTrend.data.length - 1 ? (
                    <>
                      <div className="text-sm font-semibold text-gray-800">
                        {activeTrend.data[selectedResultPoint.index + 1].value} {activeTrend.unit}
                      </div>
                      <div className="text-gray-500">
                        On {formatDate(activeTrend.data[selectedResultPoint.index + 1].date)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 italic">Most recent recorded point</div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-blue-100 flex flex-col justify-between">
                  <div className="text-gray-400">Traceable Evidence</div>
                  <div className="text-xs font-medium text-gray-800">
                    Central Diagnostics Laboratory
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold mt-1">
                    Verified Synthetic Health Record
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORT DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      REPORT_TYPE_CONFIG[selectedReport.type]?.badge || 'bg-gray-100'
                    }`}
                  >
                    {REPORT_TYPE_CONFIG[selectedReport.type]?.label || 'Medical Record'}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selectedReport.date)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Report ID: {selectedReport.id.toUpperCase()} • Status: {selectedReport.status.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Doctor & Facility */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                <div>
                  <div className="text-gray-400">Ordering / Attending Clinician</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{getDoctorName(selectedReport.doctor)}</div>
                  <div className="text-gray-500">{getDoctorSpec(selectedReport.doctor)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Facility / Laboratory</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{selectedReport.facility}</div>
                  <div className="text-gray-500">Accredited Clinical Diagnostic Facility</div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Clinical Summary
                </h4>
                <p className="text-sm text-gray-700 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Findings */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Documented Key Findings & Results
                </h4>
                <div className="space-y-2">
                  {selectedReport.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-100 text-xs text-gray-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Connected Entities */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Health Graph Connections
                </h4>

                {selectedReport.relatedConditions.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-28 shrink-0">Related Condition:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReport.relatedConditions.map(cid => (
                        <span key={cid} className="px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-medium">
                          {getConditionName(cid)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.relatedMedications.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-28 shrink-0">Related Medication:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReport.relatedMedications.map(mid => (
                        <span key={mid} className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {getMedicationName(mid)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.relatedEventId && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-28 shrink-0">Timeline Event:</span>
                    <button
                      onClick={() => {
                        setSelectedReport(null);
                        navigate('/timeline');
                      }}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Clock className="w-3 h-3" /> View Event #{selectedReport.relatedEventId} in Timeline
                    </button>
                  </div>
                )}
              </div>

              {/* Synthetic Data Traceability Notice */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Demonstration Traceability: </span>
                  This medical record reflects synthetic diagnostic data mapped to the patient longitudinal graph. In clinical deployment, this links directly to verified FHIR DocumentReference or original signed clinical PDFs.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
              {selectedReport.type === 'blood_test' ? (
                <button
                  onClick={() => {
                    const firstCond = selectedReport.relatedConditions[0];
                    const paramTarget = firstCond === 'c1' ? 'HbA1c' : firstCond === 'c3' ? 'Creatinine' : 'Total Cholesterol';
                    setSelectedReport(null);
                    setSearchParams({ tab: 'trends', param: paramTarget });
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> View Related Lab Trends
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    navigate('/graph');
                  }}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Relationships in Graph
                </button>
              )}

              <button
                onClick={() => setSelectedReport(null)}
                className="btn-secondary text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
