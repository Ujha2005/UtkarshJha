import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  FileText,
  Activity,
  Apple,
  AlertTriangle,
  Info,
  Activity as ActivityIcon,
  ChevronRight,
  User,
  Phone,
  Droplet
} from 'lucide-react';
import { usePatientRecord } from '@/context/PatientRecordContext';
import {
  demoAllergies,
  demoDoctors
} from '@/data/patient';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDoctorName(id: string): string {
  return demoDoctors.find(d => d.id === id)?.name || 'Unknown';
}

function getSeverityBadge(severity: string) {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'severe':
      return 'badge-red';
    case 'medium':
    case 'moderate':
      return 'badge-amber';
    case 'low':
    case 'mild':
      return 'badge-green';
    default:
      return 'badge-blue';
  }
}

function getEventColor(type: string) {
  switch (type) {
    case 'diagnosis': return 'bg-red-500';
    case 'lab_test': return 'bg-amber-500';
    case 'medication': return 'bg-green-500';
    case 'procedure': return 'bg-teal-500';
    case 'symptom': return 'bg-purple-500';
    case 'visit': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

const Sparkline = ({ data }: { data: any[] }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { patient, conditions, medications, labTrends, healthEvents } = usePatientRecord();

  const metrics = [
    { name: 'HbA1c', data: labTrends.find(t => t.parameter.toLowerCase().includes('hba1c')) || labTrends[0], latest: (labTrends.find(t => t.parameter.toLowerCase().includes('hba1c')) || labTrends[0])?.data.slice(-1)[0] },
    { name: 'Systolic BP', data: labTrends.find(t => t.parameter.toLowerCase().includes('systolic')) || labTrends[2], latest: (labTrends.find(t => t.parameter.toLowerCase().includes('systolic')) || labTrends[2])?.data.slice(-1)[0] },
    { name: 'Creatinine', data: labTrends.find(t => t.parameter.toLowerCase().includes('creatinine')) || labTrends[1], latest: (labTrends.find(t => t.parameter.toLowerCase().includes('creatinine')) || labTrends[1])?.data.slice(-1)[0] },
    { name: 'Hemoglobin', data: labTrends.find(t => t.parameter.toLowerCase().includes('hemoglobin')) || labTrends[3], latest: (labTrends.find(t => t.parameter.toLowerCase().includes('hemoglobin')) || labTrends[3])?.data.slice(-1)[0] },
    { name: 'Cholesterol', data: labTrends.find(t => t.parameter.toLowerCase().includes('cholesterol') || t.parameter.toLowerCase().includes('ldl')) || labTrends[4], latest: (labTrends.find(t => t.parameter.toLowerCase().includes('cholesterol') || t.parameter.toLowerCase().includes('ldl')) || labTrends[4])?.data.slice(-1)[0] },
  ];

  const activeConditions = conditions.filter(c => c.status !== 'resolved');
  const activeMedications = medications.filter(m => m.status === 'active');
  const recentEvents = [...healthEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* 1. PATIENT HEADER */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <span className="badge-blue flex items-center gap-1"><User className="w-3 h-3" /> {patient.age} yrs • {patient.gender}</span>
            <span className="badge-red flex items-center gap-1"><Droplet className="w-3 h-3" /> {patient.bloodGroup}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
            <span>Primary Doctor: {getDoctorName(patient.primaryDoctor)}</span>
          </p>
          <p className="text-xs text-amber-600 mt-1 italic">Synthetic demonstration data — not a real patient</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/graph')} className="btn-secondary flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> View Health Graph
          </button>
          <button onClick={() => navigate('/timeline')} className="btn-primary flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" /> View Timeline
          </button>
        </div>
      </div>

      {/* 2. HEALTH AT A GLANCE */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Health at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric, i) => {
            if (!metric.data || !metric.latest) return null;
            const isOutOfRange = metric.latest.value > metric.data.referenceMax || metric.latest.value < metric.data.referenceMin;
            
            return (
              <div 
                key={i} 
                onClick={() => navigate(`/reports?tab=trends&param=${encodeURIComponent(metric.name)}`)}
                className="card card-hover p-4 relative cursor-pointer group hover:border-blue-400 transition-all"
                title={`Click to explore ${metric.name} longitudinal trend`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">{metric.name}</span>
                  <div className={`w-2 h-2 rounded-full ${isOutOfRange ? 'bg-amber-500' : 'bg-green-500'}`} title={isOutOfRange ? 'Out of Reference Range' : 'Normal'} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{metric.latest.value}</span>
                  <span className="text-xs text-gray-500">{metric.data.unit}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 mb-2">
                  Range: {metric.data.referenceMin}-{metric.data.referenceMax}
                </div>
                <Sparkline data={metric.data.data.slice(-5)} />
                <div className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-1">
                  Explore Trend →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-hover p-5 cursor-pointer" onClick={() => navigate('/timeline')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Active Conditions</h3>
            <span className="badge-blue">{activeConditions.length}</span>
          </div>
          <div className="space-y-3">
            {activeConditions.slice(0, 4).map(c => (
              <div key={c.id} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-medium text-sm text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500">{formatDate(c.diagnosedDate)}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getSeverityBadge(c.severity)}`}>
                  {c.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-hover p-5 cursor-pointer" onClick={() => navigate('/medications')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Current Medications</h3>
            <span className="badge-green">{activeMedications.length}</span>
          </div>
          <div className="space-y-3">
            {activeMedications.slice(0, 4).map(m => (
              <div key={m.id} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-medium text-sm text-gray-800">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.dose} • {m.frequency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-hover p-5 cursor-pointer" onClick={() => navigate('/timeline')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Allergies</h3>
            <span className="badge-red">{demoAllergies.length}</span>
          </div>
          <div className="space-y-3">
            {demoAllergies.map(a => (
              <div key={a.id} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-medium text-sm text-gray-800">{a.allergen}</div>
                  <div className="text-xs text-gray-500">{a.reaction}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getSeverityBadge(a.severity)}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4. NEEDS ATTENTION */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Needs Attention</h2>
          
          <div className="card p-4 border-l-4 border-l-amber-500">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm text-gray-800">Creatinine levels trending above reference range (1.4 mg/dL). Latest result from Aug 2026. Discuss with your nephrologist.</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> This is informational only — consult your healthcare provider.</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4 border-l-4 border-l-blue-500">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm text-gray-800">Upcoming medication review due for Telmisartan (started Sep 2024). Consider scheduling with Dr. Arvind Rao.</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> This is informational only — consult your healthcare provider.</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4 border-l-4 border-l-purple-500">
            <div className="flex gap-3">
              <ActivityIcon className="w-5 h-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm text-gray-800">Numbness in feet reported (Dec 2024) — currently under investigation. Follow up with your endocrinologist.</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> This is informational only — consult your healthcare provider.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. RECENT ACTIVITY */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          </div>
          <div className="card p-5">
            <div className="space-y-6">
              {recentEvents.map(event => (
                <div 
                  key={event.id} 
                  onClick={() => navigate('/timeline')}
                  className="flex gap-4 relative cursor-pointer hover:bg-gray-50/80 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                  title="Click to view in Health Timeline"
                >
                  <div className="w-24 shrink-0 text-sm text-gray-500 pt-0.5 text-right">
                    {formatDate(event.date)}
                  </div>
                  <div className="relative z-10 flex items-start justify-center pt-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getEventColor(event.type)}`} />
                  </div>
                  <div className="flex-1 pb-1">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                      <span>{event.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => navigate('/timeline')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View Full Timeline <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. QUICK ACCESS */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card card-hover p-4 flex flex-col items-center justify-center text-center cursor-pointer gap-2" onClick={() => navigate('/graph')}>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">Health Graph</span>
          </div>
          
          <div className="card card-hover p-4 flex flex-col items-center justify-center text-center cursor-pointer gap-2" onClick={() => navigate('/reports')}>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">Lab Reports</span>
          </div>
          
          <div className="card card-hover p-4 flex flex-col items-center justify-center text-center cursor-pointer gap-2" onClick={() => navigate('/symptoms')}>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">Symptoms</span>
          </div>
          
          <div className="card card-hover p-4 flex flex-col items-center justify-center text-center cursor-pointer gap-2" onClick={() => navigate('/nutrition')}>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Apple className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-800">Nutrition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
