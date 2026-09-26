import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { usePatientRecord } from '@/context/PatientRecordContext';
import { 
  buildHealthGraph, 
  demoPatient, 
  demoConditions, 
  demoMedications, 
  demoLabTests, 
  demoProcedures, 
  demoDoctors, 
  demoSymptoms, 
  demoLabTrends,
  demoReports,
  demoHealthEvents
} from '@/data/patient';
import { 
  X, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Clock, 
  Pill, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  User,
  Building
} from 'lucide-react';

const NODE_TYPES = [
  { id: 'patient', label: 'Patient', color: '#3b82f6' },
  { id: 'condition', label: 'Condition', color: '#ef4444' },
  { id: 'medication', label: 'Medication', color: '#10b981' },
  { id: 'test', label: 'Test', color: '#f59e0b' },
  { id: 'symptom', label: 'Symptom', color: '#8b5cf6' },
  { id: 'procedure', label: 'Procedure', color: '#14b8a6' },
  { id: 'doctor', label: 'Doctor', color: '#6366f1' }
];

export default function HealthGraphPage() {
  const { healthGraph: fullGraph, conditions, medications, reports, healthEvents } = usePatientRecord();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(NODE_TYPES.map(t => t.id)));

  const graphData = useMemo(() => {
    const nodes = fullGraph.nodes.filter(n => visibleTypes.has(n.type));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = fullGraph.links.filter(l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string));
    return { nodes, links };
  }, [fullGraph, visibleTypes]);

  useEffect(() => {
    const observeDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    observeDimensions();
    window.addEventListener('resize', observeDimensions);
    return () => window.removeEventListener('resize', observeDimensions);
  }, []);

  const toggleType = (typeId: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const resetView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  };

  const renderNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode?.id === node.id;
    const radius = node.type === 'patient' ? 12 : 8;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#999';
    ctx.fill();

    if (isSelected) {
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = '#000';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
      ctx.lineWidth = 1 / globalScale;
      ctx.strokeStyle = '#666';
      ctx.stroke();
    }

    const label = node.label;
    const fontSize = 10 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#333';
    ctx.fillText(label, node.x, node.y + radius + 2);
  }, [selectedNode]);

  const navigate = useNavigate();

  const renderDetailPanel = () => {
    if (!selectedNode) return null;

    let details = null;
    
    if (selectedNode.type === 'patient') {
      details = (
        <div className="space-y-4 text-xs mt-4">
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Full Name:</span> {demoPatient.name}</p>
            <p><span className="font-semibold text-gray-700">Age:</span> {demoPatient.age} years • {demoPatient.gender}</p>
            <p><span className="font-semibold text-gray-700">Blood Group:</span> {demoPatient.bloodGroup}</p>
            <p><span className="font-semibold text-gray-700">Primary Doctor:</span> {demoDoctors.find(d => d.id === demoPatient.primaryDoctor)?.name || 'Unknown'}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
          >
            Open Patient Dashboard <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    } else if (selectedNode.type === 'condition') {
      const cond = demoConditions.find(c => c.id === selectedNode.id);
      const meds = demoMedications.filter(m => m.relatedCondition === selectedNode.id);
      const doc = demoDoctors.find(d => d.id === cond?.diagnosedBy);
      const linkedReports = demoReports.filter(r => r.relatedConditions.includes(selectedNode.id));
      const linkedEvents = demoHealthEvents.filter(e => e.relatedEntityId === selectedNode.id);

      details = cond ? (
        <div className="space-y-4 text-xs mt-4">
          <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Diagnosed:</span> {cond.diagnosedDate}</p>
            <p><span className="font-semibold text-gray-700">Status:</span> <span className="capitalize font-bold text-red-700">{cond.status}</span></p>
            <p><span className="font-semibold text-gray-700">Severity:</span> <span className="capitalize">{cond.severity}</span></p>
            <p><span className="font-semibold text-gray-700">Diagnosing MD:</span> Dr. {doc?.name.replace('Dr. ', '') || 'Attending'}</p>
            {cond.notes && <p className="text-gray-600 mt-1 italic">{cond.notes}</p>}
          </div>
          
          {/* Related Medications */}
          {meds.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-emerald-600" /> Related Prescriptions
              </h4>
              <div className="space-y-1.5">
                {meds.map(m => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/medications?med=${m.id}`)}
                    className="w-full text-left p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-emerald-900">{m.name}</div>
                      <div className="text-[11px] text-emerald-700">{m.dose} • {m.frequency}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Reports */}
          {linkedReports.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" /> Diagnostic Reports ({linkedReports.length})
              </h4>
              <div className="space-y-1">
                {linkedReports.slice(0, 3).map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/reports?reportId=${r.id}`)}
                    className="w-full text-left text-blue-600 hover:underline truncate block"
                  >
                    • {r.title} ({r.date})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t flex flex-col gap-2">
            <button
              onClick={() => navigate('/timeline')}
              className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2"
            >
              <Clock className="w-3.5 h-3.5" /> View Timeline Progression
            </button>
          </div>
        </div>
      ) : <p className="text-sm mt-4 text-gray-500">Condition details not found.</p>;
    } else if (selectedNode.type === 'medication') {
      const med = medications.find(m => m.id === selectedNode.id) || demoMedications.find(m => m.id === selectedNode.id);
      const cond = conditions.find(c => c.id === med?.relatedCondition) || demoConditions.find(c => c.id === med?.relatedCondition);
      const doc = demoDoctors.find(d => d.id === med?.prescribedBy);

      // Related biomarker
      let linkedTrendName = '';
      if (med?.name === 'Metformin' || med?.name === 'Glimepiride') linkedTrendName = 'HbA1c';
      else if (med?.name === 'Amlodipine' || med?.name === 'Lisinopril' || med?.name === 'Telmisartan') linkedTrendName = 'Systolic BP';
      else if (med?.name.toLowerCase().includes('statin')) linkedTrendName = 'Total Cholesterol';

      // Related reports
      const linkedReports = reports.filter(r =>
        r.relatedMedications.includes(selectedNode.id) ||
        (cond && r.relatedConditions.includes(cond.id))
      );

      // Related timeline events
      const linkedEvents = healthEvents.filter(e =>
        e.relatedEntityId === selectedNode.id ||
        (med && e.type === 'medication' && e.title.toLowerCase().includes(med.name.toLowerCase()))
      );

      details = med ? (
        <div className="space-y-4 text-xs mt-4">
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${med.status === 'active' ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-800'}`}>
                {med.status}
              </span>
            </div>
            <p><span className="font-semibold text-gray-700">Dose & Route:</span> {med.dose} • {med.route || 'Oral'}</p>
            <p><span className="font-semibold text-gray-700">Frequency:</span> {med.frequency}</p>
            <p><span className="font-semibold text-gray-700">Start Date:</span> {med.startDate}</p>
            {med.endDate && <p><span className="font-semibold text-gray-700">Discontinued:</span> {med.endDate}</p>}
            <p><span className="font-semibold text-gray-700">Prescribing MD:</span> Dr. {doc?.name.replace('Dr. ', '') || 'Physician'}</p>
          </div>

          {/* Related Condition */}
          {cond && (
            <div className="border-t pt-3">
              <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-red-500" /> Target Indication
              </div>
              <div className="p-2.5 bg-red-50/70 rounded-lg border border-red-200/60 text-red-900 font-medium">
                {cond.name} ({cond.status})
              </div>
            </div>
          )}

          {/* Monitored Biomarker */}
          {linkedTrendName && (
            <div className="border-t pt-3">
              <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Monitored Biomarker
              </div>
              <button
                onClick={() => navigate(`/reports?tab=trends&param=${linkedTrendName}`)}
                className="w-full text-left p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-between text-blue-800 font-medium"
              >
                <span>{linkedTrendName} Trajectory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Connected Reports */}
          {linkedReports.length > 0 && (
            <div className="border-t pt-3">
              <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" /> Associated Clinical Reports
              </div>
              <div className="space-y-1">
                {linkedReports.slice(0, 2).map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/reports?reportId=${r.id}`)}
                    className="block text-blue-600 hover:underline truncate text-left"
                  >
                    • {r.title} ({r.date})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 border-t flex flex-col gap-2">
            <button
              onClick={() => navigate('/medications')}
              className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2"
            >
              <Pill className="w-3.5 h-3.5" /> Open in Medications Module
            </button>
          </div>
        </div>
      ) : <p className="text-sm mt-4 text-gray-500">Medication details not found.</p>;
    } else if (selectedNode.type === 'doctor') {
      const doc = demoDoctors.find(d => d.id === selectedNode.id);
      const managedConds = demoConditions.filter(c => c.diagnosedBy === selectedNode.id);
      const prescribedMeds = demoMedications.filter(m => m.prescribedBy === selectedNode.id);

      details = doc ? (
        <div className="space-y-3 text-xs mt-4">
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Specialization:</span> {doc.specialization}</p>
            <p><span className="font-semibold text-gray-700">Hospital:</span> {doc.hospital}</p>
            <p><span className="font-semibold text-gray-700">Last Encounter:</span> {doc.lastVisit}</p>
          </div>
          
          {managedConds.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-800 mb-2">Diagnosed Conditions</h4>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {managedConds.map(c => <li key={c.id}>{c.name}</li>)}
              </ul>
            </div>
          )}

          {prescribedMeds.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-800 mb-2">Prescribed Regimens</h4>
              <div className="space-y-1 text-gray-700">
                {prescribedMeds.map(m => (
                  <div key={m.id} className="p-1.5 bg-gray-50 rounded border text-[11px]">
                    <strong>{m.name}</strong> ({m.dose})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : <p className="text-sm mt-4 text-gray-500">Doctor details not found.</p>;
    } else if (selectedNode.type === 'test') {
      // Find matching trend by label
      const trendMatch = demoLabTrends.find(t => 
        selectedNode.label.toLowerCase().includes(t.parameter.toLowerCase().split(' ')[0])
      );
      const latestPoint = trendMatch ? trendMatch.data[trendMatch.data.length - 1] : null;

      // Find matching reports
      const matchingReports = demoReports.filter(r => 
        r.type === 'blood_test' &&
        (trendMatch ? r.findings.some(f => f.toLowerCase().includes(trendMatch.parameter.toLowerCase().split(' ')[0])) : false)
      );

      details = (
        <div className="space-y-4 text-xs mt-4">
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Test Category:</span> {selectedNode.label}</p>
            {trendMatch && latestPoint && (
              <>
                <p><span className="font-semibold text-gray-700">Latest Recorded Value:</span> <strong className="text-amber-900 text-sm">{latestPoint.value} {trendMatch.unit}</strong></p>
                <p className="text-gray-500">Reference: {trendMatch.referenceMin} - {trendMatch.referenceMax} {trendMatch.unit}</p>
                <p className="text-gray-500">Last Date: {latestPoint.date}</p>
              </>
            )}
          </div>

          {matchingReports.length > 0 && (
            <div className="border-t pt-3">
              <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Sourced in Reports ({matchingReports.length})
              </div>
              <div className="space-y-1">
                {matchingReports.slice(0, 3).map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/reports?reportId=${r.id}`)}
                    className="block text-blue-600 hover:underline truncate text-left"
                  >
                    • {r.title} ({r.date})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t flex flex-col gap-2">
            {trendMatch && (
              <button
                onClick={() => navigate(`/reports?tab=trends&param=${trendMatch.parameter}`)}
                className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Open Longitudinal Trend Chart
              </button>
            )}
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
            >
              <FileText className="w-3.5 h-3.5" /> Browse All Lab Reports
            </button>
          </div>
        </div>
      );
    } else if (selectedNode.type === 'procedure') {
      const proc = demoProcedures.find(p => p.id === selectedNode.id);
      const linkedReport = demoReports.find(r => r.type === 'procedure' && r.relatedConditions.includes(proc?.relatedCondition || ''));

      details = proc ? (
        <div className="space-y-3 text-xs mt-4">
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/70 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Date:</span> {proc.date}</p>
            <p><span className="font-semibold text-gray-700">Facility:</span> {proc.hospital}</p>
            <p><span className="font-semibold text-gray-700">Specialist:</span> Dr. {demoDoctors.find(d => d.id === proc.performedBy)?.name || 'Surgeon'}</p>
            <p><span className="font-semibold text-gray-700">Clinical Outcome:</span> <span className="capitalize font-medium text-teal-800">{proc.outcome}</span></p>
          </div>

          {linkedReport && (
            <div className="border-t pt-3">
              <div className="font-semibold text-gray-800 mb-1.5">Documentation:</div>
              <button
                onClick={() => navigate(`/reports?reportId=${linkedReport.id}`)}
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> View {linkedReport.title}
              </button>
            </div>
          )}
        </div>
      ) : <p className="text-sm mt-4 text-gray-500">Procedure details not found.</p>;
    } else if (selectedNode.type === 'symptom') {
      const symp = demoSymptoms.find(s => s.id === selectedNode.id);
      const relatedConds = demoConditions.filter(c => symp?.relatedConditions?.includes(c.id));
      details = symp ? (
        <div className="space-y-3 text-xs mt-4">
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/70 space-y-1.5">
            <p><span className="font-semibold text-gray-700">Reported Date:</span> {symp.reportedDate}</p>
            <p><span className="font-semibold text-gray-700">Severity:</span> <span className="capitalize font-medium">{symp.severity}</span></p>
            <p><span className="font-semibold text-gray-700">Status:</span> <span className="capitalize font-medium text-purple-800">{symp.status}</span></p>
          </div>
          
          {relatedConds.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-semibold text-gray-800 mb-2">Connected Etiologies:</h4>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {relatedConds.map(c => <li key={c.id}>{c.name}</li>)}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t">
            <button
              onClick={() => navigate('/symptoms')}
              className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5 py-2"
            >
              Open Symptoms Module <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : <p className="text-sm mt-4 text-gray-500">Symptom details not found.</p>;
    }

    return (
      <div className="absolute top-0 right-0 h-full w-full sm:w-80 md:w-96 bg-white shadow-2xl border-l flex flex-col z-10 transition-transform">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedNode.color || '#999' }} 
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {selectedNode.type} Record
            </span>
          </div>
          <button 
            onClick={() => setSelectedNode(null)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedNode.label}</h2>
          {details}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Graph</h1>
          <p className="text-sm text-gray-500">Interactive visualization of your medical record relationships</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Stats</span>
            <span className="text-sm font-medium text-gray-700">{graphData.nodes.length} Nodes &middot; {graphData.links.length} Edges</span>
          </div>
          <button 
            onClick={resetView}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reset View
          </button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-sm font-semibold text-gray-700 mr-2">Filters:</span>
        {NODE_TYPES.map(type => (
          <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="sr-only"
              checked={visibleTypes.has(type.id)}
              onChange={() => toggleType(type.id)}
            />
            <span 
              className={`w-3 h-3 rounded-full transition-opacity ${visibleTypes.has(type.id) ? 'opacity-100' : 'opacity-30'}`}
              style={{ backgroundColor: type.color }}
            />
            <span className={`text-sm transition-colors ${visibleTypes.has(type.id) ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
              {type.label}
            </span>
          </label>
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="" 
          nodeCanvasObject={renderNode}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const radius = node.type === 'patient' ? 12 : 8;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          onNodeClick={handleNodeClick}
          linkColor={() => '#cbd5e1'}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          backgroundColor="#f8fafc"
        />

        {renderDetailPanel()}
      </div>
    </div>
  );
}
