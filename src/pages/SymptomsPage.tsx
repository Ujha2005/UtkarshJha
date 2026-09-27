import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  TrendingUp,
  Pill,
  GitBranch,
  Clock,
  Sparkles,
  Info,
  Calendar,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Stethoscope,
  RefreshCw,
  Search,
  ArrowRight,
  Send,
  AlertCircle
} from 'lucide-react';
import {
  findRelevantHistory,
  SYMPTOM_PRESETS,
  SymptomPreset,
  SymptomRetrievalResult,
  EvidenceCategory
} from '@/services/symptomRetrieval';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const CATEGORY_STYLES: Record<
  EvidenceCategory,
  { label: string; badge: string; border: string }
> = {
  documented_fact: {
    label: 'Documented Fact',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-l-emerald-500'
  },
  historical_association: {
    label: 'Historical Association',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    border: 'border-l-blue-500'
  },
  possible_relevance: {
    label: 'Possible Relevance',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    border: 'border-l-purple-500'
  },
  missing_information: {
    label: 'Missing Information',
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    border: 'border-l-gray-400'
  }
};

export default function SymptomsPage() {
  const navigate = useNavigate();

  // Form State
  const [symptomName, setSymptomName] = useState(SYMPTOM_PRESETS[0].symptom);
  const [description, setDescription] = useState(SYMPTOM_PRESETS[0].description);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [onsetDate, setOnsetDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('Constant');
  const [additionalNotes, setAdditionalNotes] = useState(SYMPTOM_PRESETS[0].notes);

  // Active selected preset ID
  const [activePresetId, setActivePresetId] = useState<string>('strong_diabetes');

  // Retrieval evaluation state
  const [analysisResult, setAnalysisResult] = useState<SymptomRetrievalResult>(() =>
    findRelevantHistory(
      SYMPTOM_PRESETS[0].symptom,
      SYMPTOM_PRESETS[0].description,
      SYMPTOM_PRESETS[0].severity,
      new Date().toISOString().split('T')[0],
      SYMPTOM_PRESETS[0].frequency
    )
  );

  // Selected evidence category filter tab
  const [selectedEvidenceFilter, setSelectedEvidenceFilter] = useState<'all' | EvidenceCategory>('all');

  const handleApplyPreset = (preset: SymptomPreset) => {
    setActivePresetId(preset.id);
    setSymptomName(preset.symptom);
    setDescription(preset.description);
    setSeverity(preset.severity);
    setFrequency(preset.frequency);
    setAdditionalNotes(preset.notes);

    // Auto-run evaluation
    const result = findRelevantHistory(
      preset.symptom,
      preset.description,
      preset.severity,
      onsetDate,
      preset.frequency
    );
    setAnalysisResult(result);
  };

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomName.trim()) return;

    const result = findRelevantHistory(
      symptomName,
      description,
      severity,
      onsetDate,
      frequency
    );
    setAnalysisResult(result);
  };

  const filteredEvidence = useMemo(() => {
    if (!analysisResult) return [];
    if (selectedEvidenceFilter === 'all') return analysisResult.evidenceChain;
    return analysisResult.evidenceChain.filter(
      item => item.category === selectedEvidenceFilter
    );
  }, [analysisResult, selectedEvidenceFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl shadow-sm border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                Deterministic Retrieval & Traceability
              </span>
              <span className="text-xs text-purple-300">
                Transparent Health History Synthesis
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              New Symptom Contextualization Engine
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Describe a newly emerging symptom to retrieve relevant historical diagnoses, active pharmacotherapy, biomarker trends, and verified clinical reports.
            </p>
          </div>

          <div className="bg-purple-950/60 p-3 rounded-xl border border-purple-700/50 text-xs text-purple-200 self-start md:self-auto max-w-xs">
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-purple-400 shrink-0" /> Safety-First Standard
            </div>
            Outputs provide historical evidence retrieval for clinician evaluation. Never presented as an autonomous diagnosis.
          </div>
        </div>
      </div>

      {/* 1-Click Demonstration Presets Bar */}
      <div className="card p-5 border border-purple-100 bg-purple-50/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Hackathon Demonstration Presets (Click to Test)
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            Select a pre-configured synthetic case to test system retrieval
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SYMPTOM_PRESETS.map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-white hover:bg-purple-50 text-gray-800 border-gray-200'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                    {preset.badge}
                  </div>
                  <div className="text-xs font-semibold line-clamp-2">
                    {preset.name.replace(/^\d+\.\s*/, '')}
                  </div>
                </div>
                <div className={`text-[10px] mt-2 font-medium ${isSelected ? 'text-purple-200' : 'text-purple-600'}`}>
                  Load Case →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Live Retrieval Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Symptom Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                Describe New Symptom
              </h2>
              <span className="badge-purple text-[11px]">Interactive</span>
            </div>

            <form onSubmit={handleRunAnalysis} className="space-y-4 text-xs">
              {/* Symptom Title */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Primary Symptom or Manifestation *
                </label>
                <input
                  type="text"
                  required
                  value={symptomName}
                  onChange={e => {
                    setSymptomName(e.target.value);
                    setActivePresetId('');
                  }}
                  placeholder="e.g. Increased thirst, ankle swelling, headache..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Detailed Narrative */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Detailed Clinical Description / Narrative
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setActivePresetId('');
                  }}
                  placeholder="Describe location, onset context, aggravating or relieving factors..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {/* Severity & Frequency Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="mild">Mild (Noticeable)</option>
                    <option value="moderate">Moderate (Impacts Activity)</option>
                    <option value="severe">Severe (Significant Distress)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Pattern / Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Constant">Constant</option>
                    <option value="Intermittent">Intermittent</option>
                    <option value="Rare">Occasional / Rare</option>
                  </select>
                </div>
              </div>

              {/* Onset Date */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Estimated Onset Date
                </label>
                <input
                  type="date"
                  value={onsetDate}
                  onChange={e => setOnsetDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Pertinent Negatives or Notes
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. No fever, no chest pain, no rash..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
              >
                <Send className="w-4 h-4" />
                Scan Patient History & Retrieve Evidence
              </button>
            </form>
          </div>

          {/* Session Context Banner */}
          <div className="card p-4 bg-gray-50 border-gray-200 text-xs text-gray-600 space-y-2">
            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              Temporary Evaluation Context
            </div>
            <p>
              This symptom is evaluated in your active session. It highlights intersections with your documented record without permanently modifying formal medical charts unless verified by clinical staff.
            </p>
          </div>
        </div>

        {/* Right Column: Evidence Retrieval & Synthesis Display */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult && (
            <>
              {/* 1. SAFETY ALERT LAYER */}
              <div
                className={`card p-5 border-l-4 shadow-sm ${
                  analysisResult.safetyCheck.isEmergency
                    ? 'border-l-red-600 bg-red-50/70 border-red-200'
                    : analysisResult.safetyCheck.urgencyLevel === 'urgent_clinical'
                    ? 'border-l-amber-500 bg-amber-50/70 border-amber-200'
                    : 'border-l-blue-500 bg-blue-50/40 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {analysisResult.safetyCheck.isEmergency ? (
                    <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                  ) : analysisResult.safetyCheck.urgencyLevel === 'urgent_clinical' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold uppercase tracking-wider ${
                          analysisResult.safetyCheck.isEmergency
                            ? 'text-red-900'
                            : analysisResult.safetyCheck.urgencyLevel === 'urgent_clinical'
                            ? 'text-amber-900'
                            : 'text-blue-900'
                        }`}
                      >
                        {analysisResult.safetyCheck.alertTitle}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          analysisResult.safetyCheck.isEmergency
                            ? 'bg-red-200 text-red-900'
                            : analysisResult.safetyCheck.urgencyLevel === 'urgent_clinical'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        Level: {analysisResult.safetyCheck.urgencyLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      {analysisResult.safetyCheck.alertMessage}
                    </p>

                    <div className="pt-2 text-xs font-semibold text-gray-900">
                      Recommended Action: {analysisResult.safetyCheck.recommendedAction}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. EXPLAINABLE CLINICAL RESPONSE */}
              <div className="card p-6 bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900 text-base">
                      Contextual History Synthesis
                    </h3>
                  </div>
                  <span className="badge-purple text-[11px] font-semibold">
                    Decision-Support Only
                  </span>
                </div>

                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-xs text-gray-800 leading-relaxed space-y-2">
                  <p className="font-medium text-purple-950">
                    {analysisResult.clinicalResponse}
                  </p>
                  <p className="text-[11px] text-gray-500 italic">
                    Medical Disclaimer: This information summarizes historical associations and is not a medical diagnosis. Clinician review is recommended to determine clinical significance.
                  </p>
                </div>

                {/* "Why Am I Seeing This?" Section */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    Why Am I Seeing These Connections?
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    {analysisResult.whyRetrievedBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. EVIDENCE CHAIN PANEL (Categorized Tiered Evidence) */}
              <div className="card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Inspectable Evidence Chain ({analysisResult.evidenceChain.length})
                    </h3>
                    <p className="text-xs text-gray-500">
                      Every statement is anchored to verified historical records with date and source
                    </p>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedEvidenceFilter('all')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        selectedEvidenceFilter === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All ({analysisResult.evidenceChain.length})
                    </button>
                    {(
                      [
                        'documented_fact',
                        'historical_association',
                        'possible_relevance',
                        'missing_information'
                      ] as EvidenceCategory[]
                    ).map(cat => {
                      const count = analysisResult.evidenceChain.filter(
                        e => e.category === cat
                      ).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedEvidenceFilter(cat)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            selectedEvidenceFilter === cat
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {CATEGORY_STYLES[cat].label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Evidence Cards List */}
                <div className="space-y-3">
                  {filteredEvidence.map(item => {
                    const style = CATEGORY_STYLES[item.category];

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border border-gray-200 border-l-4 ${style.border} bg-white shadow-sm space-y-2`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500 capitalize">
                              {item.entityType.replace('_', ' ')}
                            </span>
                          </div>

                          {item.date && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.date)}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-gray-900 text-sm">
                          {item.title}
                        </div>

                        {item.findingSnippet && (
                          <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[11px]">
                            {item.findingSnippet}
                          </div>
                        )}

                        <div className="text-xs text-gray-600 leading-relaxed">
                          <strong className="text-gray-700">Relevance: </strong>
                          {item.relevanceRationale}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-gray-500 truncate max-w-xs">
                            Source: {item.sourceReference}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.reportId && (
                              <button
                                onClick={() => navigate(`/reports?reportId=${item.reportId}`)}
                                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                View Report <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {item.entityType === 'condition' && (
                              <button
                                onClick={() => navigate('/graph')}
                                className="text-purple-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                View in Graph <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {item.entityType === 'medication' && (
                              <button
                                onClick={() => navigate('/medications')}
                                className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                View Regimen <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. CLINICIAN DISCUSSION GUIDE */}
              {analysisResult.clinicianDiscussionPoints.length > 0 && (
                <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Clinician Discussion Checklist
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Bring these specific documented points to your consultation with your physician:
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-800">
                    {analysisResult.clinicianDiscussionPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-blue-100">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. DIRECT MODULE JUMPS */}
              <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-700">
                  Explore Connected Records in Other Views:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/graph')}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" /> Open Health Graph
                  </button>
                  <button
                    onClick={() => navigate('/timeline')}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" /> Open Timeline
                  </button>
                  <button
                    onClick={() => navigate('/reports?tab=trends')}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Open Lab Trends
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
