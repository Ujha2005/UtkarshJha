import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  FlaskConical,
  Pill,
  Scissors,
  Activity,
  User,
  Search,
  X,
  Calendar,
  ChevronRight,
  Clock,
  UserRound,
  FileText
} from 'lucide-react';

import { usePatientRecord } from '@/context/PatientRecordContext';
import {
  demoHealthEvents,
  demoConditions,
  demoMedications,
  demoLabTests,
  demoProcedures,
  demoDoctors,
  demoSymptoms,
  demoReports
} from '@/data/patient';

import type {
  HealthEvent,
  Condition,
  Medication,
  LabTest,
  Procedure,
  Doctor,
  Symptom
} from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDoctorName(id: string): string {
  return demoDoctors.find(d => d.id === id)?.name || '';
}

function getDoctorById(id: string): Doctor | undefined {
  return demoDoctors.find(d => d.id === id);
}

const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string; badgeClass: string; icon: any }> = {
  diagnosis: { label: 'Diagnosis', color: 'text-red-500', bgColor: 'bg-red-50', badgeClass: 'badge-red', icon: Stethoscope },
  lab_test: { label: 'Lab Test', color: 'text-amber-500', bgColor: 'bg-amber-50', badgeClass: 'badge-amber', icon: FlaskConical },
  medication: { label: 'Medication', color: 'text-emerald-500', bgColor: 'bg-emerald-50', badgeClass: 'badge-green', icon: Pill },
  procedure: { label: 'Procedure', color: 'text-teal-500', bgColor: 'bg-teal-50', badgeClass: 'badge-blue', icon: Scissors },
  symptom: { label: 'Symptom', color: 'text-purple-500', bgColor: 'bg-purple-50', badgeClass: 'badge-purple', icon: Activity },
  visit: { label: 'Visit', color: 'text-blue-500', bgColor: 'bg-blue-50', badgeClass: 'badge-blue', icon: User }
};

export default function TimelinePage() {
  const navigate = useNavigate();
  const { healthEvents, conditions, medications } = usePatientRecord();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<HealthEvent | null>(null);

  const filteredEvents = useMemo(() => {
    let events = [...healthEvents];
    
    if (filterType !== 'all') {
      events = events.filter(e => e.type === filterType);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q)
      );
    }
    
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filterType, searchQuery, healthEvents]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, HealthEvent[]> = {};
    filteredEvents.forEach(event => {
      const year = new Date(event.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const years = Object.keys(groupedEvents).sort((a, b) => Number(b) - Number(a));

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'diagnosis', label: 'Diagnoses' },
    { id: 'lab_test', label: 'Lab Tests' },
    { id: 'medication', label: 'Medications' },
    { id: 'procedure', label: 'Procedures' },
    { id: 'symptom', label: 'Symptoms' },
    { id: 'visit', label: 'Visits' }
  ];

  const getRelatedEntityDetails = (event: HealthEvent) => {
    if (!event.relatedEntityId) return null;
    const id = event.relatedEntityId;
    if (id.startsWith('c')) return { type: 'Condition', data: conditions.find(c => c.id === id) || demoConditions.find(c => c.id === id) };
    if (id.startsWith('m')) return { type: 'Medication', data: medications.find(m => m.id === id) || demoMedications.find(m => m.id === id) };
    if (id.startsWith('lt_')) return { type: 'Lab Test', data: demoLabTests.find(l => l.id === id) };
    if (id.startsWith('pr')) return { type: 'Procedure', data: demoProcedures.find(p => p.id === id) };
    if (id.startsWith('s')) return { type: 'Symptom', data: demoSymptoms.find(s => s.id === id) };
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative overflow-x-hidden">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Health Timeline</h1>
          <p className="text-slate-500 mt-2">Chronological view of your medical history from 2019 to present</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-slate-700">{healthEvents.length}</span>
          <span className="text-slate-500 text-sm">Total Events</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(opt => {
            const count = opt.id === 'all' 
              ? healthEvents.length 
              : healthEvents.filter(e => e.type === opt.id).length;
            
            return (
              <button
                key={opt.id}
                onClick={() => setFilterType(opt.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterType === opt.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filterType === opt.id ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TIMELINE */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No events found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-8 relative">
          <div className="absolute top-0 bottom-0 left-8 md:left-[120px] w-0.5 bg-slate-200 -z-10"></div>
          
          {years.map((year) => (
            <div key={year} className="relative">
              <div className="flex items-center mb-6">
                <div className="w-16 md:w-[120px] pr-4 md:pr-8 text-right">
                  <span className="text-lg font-bold text-slate-800 bg-white py-1 px-2 rounded-md shadow-sm border">{year}</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-slate-300 border-4 border-white shadow-sm absolute left-[26px] md:left-[114px]"></div>
              </div>

              <div className="space-y-6">
                {groupedEvents[year].map((event) => {
                  const config = eventTypeConfig[event.type] || eventTypeConfig.visit;
                  const Icon = config.icon;
                  const doctor = event.doctor ? getDoctorById(event.doctor) : null;
                  
                  return (
                    <div key={event.id} className="relative flex group">
                      <div className="w-16 md:w-[120px] pt-1 pr-4 md:pr-8 text-right shrink-0">
                        <span className="text-sm font-medium text-slate-500">{formatDate(event.date).split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm absolute left-5 md:left-[106px] z-10 ${config.bgColor} ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="pl-10 md:pl-12 flex-1">
                        <div className="card card-hover bg-white p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${config.badgeClass}`}>
                              {config.label}
                            </span>
                            {doctor && (
                              <div className="flex items-center text-sm text-slate-500">
                                <UserRound className="w-3.5 h-3.5 mr-1" />
                                {doctor.name}
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                          <p className="text-slate-600 line-clamp-2 text-sm mb-4">{event.description}</p>
                          
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedEvent(null)}
          ></div>
          
          <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            <div className="p-6 bg-white border-b flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${eventTypeConfig[selectedEvent.type]?.badgeClass || 'badge-blue'}`}>
                  {eventTypeConfig[selectedEvent.type]?.label || 'Visit'}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedEvent.title}</h2>
                <div className="flex items-center text-slate-500 text-sm mt-2">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {formatDate(selectedEvent.date)}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-slate-700 leading-relaxed text-sm">{selectedEvent.description}</p>
              </div>

              {selectedEvent.doctor && (
                <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <UserRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{getDoctorName(selectedEvent.doctor)}</h4>
                    <p className="text-xs text-slate-500">{getDoctorById(selectedEvent.doctor)?.specialization || 'Doctor'}</p>
                  </div>
                </div>
              )}

              {selectedEvent.relatedEntityId && (() => {
                const entity = getRelatedEntityDetails(selectedEvent);
                if (!entity || !entity.data) return null;

                return (
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Related {entity.type}</h4>
                    
                    {entity.type === 'Lab Test' ? (
                      <div className="space-y-3">
                        <h5 className="font-medium text-slate-900 text-sm">{(entity.data as LabTest).name}</h5>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Parameter</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Result</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {(entity.data as LabTest).results.map((res: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 text-xs text-slate-900">{res.parameter}</td>
                                  <td className="px-3 py-2 text-xs text-slate-900 font-medium">
                                    {res.value} <span className="text-slate-500 font-normal">{res.unit}</span>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full ${
                                      res.status === 'normal' ? 'bg-green-100 text-green-700' :
                                      res.status === 'high' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {res.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                        {(entity.data as any).name || (entity.data as any).title || (entity.data as any).medicationName || 'Details available in respective module.'}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 bg-white border-t flex items-center gap-3">
              {(() => {
                const matchedReport = demoReports.find(
                  r => r.relatedEventId === selectedEvent.id || r.date === selectedEvent.date
                );
                if (matchedReport) {
                  return (
                    <button
                      onClick={() => {
                        const targetId = matchedReport.id;
                        setSelectedEvent(null);
                        navigate(`/reports?reportId=${targetId}`);
                      }}
                      className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Sourced Report
                    </button>
                  );
                }
                return null;
              })()}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
