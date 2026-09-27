// Reactive Patient Record Context for Dynamic Ingestion & Graph Synchronization

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  Condition,
  Medication,
  LabTrend,
  Report,
  HealthEvent,
  HealthGraph,
  GraphNode,
  GraphLink,
  NutritionEntry
} from '@/types';
import {
  ExtractedEntity,
  IngestedDocument,
  EntityReviewStatus
} from '@/types/ingestion';
import {
  demoPatient,
  demoConditions,
  demoMedications,
  demoLabTrends,
  demoReports,
  demoHealthEvents,
  demoNutritionEntries,
  demoDoctors,
  buildHealthGraph
} from '@/data/patient';
import { auditLog } from '@/services/auditLog';

interface PatientRecordContextType {
  patient: typeof demoPatient;
  conditions: Condition[];
  medications: Medication[];
  labTrends: LabTrend[];
  reports: Report[];
  healthEvents: HealthEvent[];
  nutritionEntries: NutritionEntry[];
  healthGraph: HealthGraph;
  ingestedDocuments: IngestedDocument[];
  addIngestedDocument: (doc: IngestedDocument) => void;
  updateEntityReviewStatus: (
    docId: string,
    entityId: string,
    status: EntityReviewStatus
  ) => void;
  editEntity: (
    docId: string,
    entityId: string,
    changes: Partial<ExtractedEntity>
  ) => void;
  commitAcceptedEntities: (docId: string) => {
    committedCount: number;
    createdReportId: string;
  };
  resetToBaseline: () => void;
}

const PatientRecordContext = createContext<PatientRecordContextType | undefined>(undefined);

export const PatientRecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conditions, setConditions] = useState<Condition[]>(() => JSON.parse(JSON.stringify(demoConditions)));
  const [medications, setMedications] = useState<Medication[]>(() => JSON.parse(JSON.stringify(demoMedications)));
  const [labTrends, setLabTrends] = useState<LabTrend[]>(() => JSON.parse(JSON.stringify(demoLabTrends)));
  const [reports, setReports] = useState<Report[]>(() => JSON.parse(JSON.stringify(demoReports)));
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>(() => JSON.parse(JSON.stringify(demoHealthEvents)));
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>(() => JSON.parse(JSON.stringify(demoNutritionEntries)));
  const [ingestedDocuments, setIngestedDocuments] = useState<IngestedDocument[]>([]);

  const resetToBaseline = useCallback(() => {
    setConditions(JSON.parse(JSON.stringify(demoConditions)));
    setMedications(JSON.parse(JSON.stringify(demoMedications)));
    setLabTrends(JSON.parse(JSON.stringify(demoLabTrends)));
    setReports(JSON.parse(JSON.stringify(demoReports)));
    setHealthEvents(JSON.parse(JSON.stringify(demoHealthEvents)));
    setNutritionEntries(JSON.parse(JSON.stringify(demoNutritionEntries)));
    setIngestedDocuments([]);
  }, []);

  // Dynamically compute health graph from current conditions & medications
  const healthGraph = useMemo<HealthGraph>(() => {
    const base = buildHealthGraph();
    const dynamicNodes: GraphNode[] = [...base.nodes];
    const dynamicLinks: GraphLink[] = [...base.links];

    // Check if new medications exist not in base
    medications.forEach(m => {
      if (!dynamicNodes.some(n => n.id === m.id)) {
        dynamicNodes.push({
          id: m.id,
          label: `${m.name} (Ingested)`,
          type: 'medication',
          color: '#10b981'
        });
        if (m.relatedCondition) {
          dynamicLinks.push({
            source: m.relatedCondition,
            target: m.id,
            label: 'treated with'
          });
        }
      }
    });

    return { nodes: dynamicNodes, links: dynamicLinks };
  }, [medications, conditions]);

  const addIngestedDocument = useCallback((doc: IngestedDocument) => {
    setIngestedDocuments(prev => [doc, ...prev]);
    auditLog.logAuditEvent({
      action: 'DOCUMENT_UPLOAD',
      userId: 'u1',
      userRole: 'PATIENT',
      userName: 'Rajesh Kumar Sharma',
      targetResource: `Document/${doc.id}`,
      targetPatientId: 'p1',
      outcome: 'success',
      details: `Uploaded medical document "${doc.name}" for entity extraction (${doc.category})`
    });
  }, []);

  const updateEntityReviewStatus = useCallback(
    (docId: string, entityId: string, status: EntityReviewStatus) => {
      setIngestedDocuments(prev =>
        prev.map(doc => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            extractedEntities: doc.extractedEntities.map(e =>
              e.id === entityId ? { ...e, reviewStatus: status } : e
            )
          };
        })
      );

      auditLog.logAuditEvent({
        action: status === 'rejected' ? 'ENTITY_REJECT' : 'ENTITY_ACCEPT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: `Entity/${entityId}`,
        targetPatientId: 'p1',
        outcome: 'success',
        details: `Updated extracted clinical entity review status to "${status}"`
      });
    },
    []
  );

  const editEntity = useCallback(
    (docId: string, entityId: string, changes: Partial<ExtractedEntity>) => {
      setIngestedDocuments(prev =>
        prev.map(doc => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            extractedEntities: doc.extractedEntities.map(e =>
              e.id === entityId ? { ...e, ...changes, userEdited: true } : e
            )
          };
        })
      );

      auditLog.logAuditEvent({
        action: 'ENTITY_EDIT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: `Entity/${entityId}`,
        targetPatientId: 'p1',
        outcome: 'success',
        details: `Edited clinical entity attributes manually before commit`
      });
    },
    []
  );

  const commitAcceptedEntities = useCallback(
    (docId: string) => {
      const doc = ingestedDocuments.find(d => d.id === docId);
      if (!doc) return { committedCount: 0, createdReportId: '' };

      const acceptedEntities = doc.extractedEntities.filter(
        e => e.reviewStatus === 'user_confirmed' || e.reviewStatus === 'clinician_verified'
      );

      if (acceptedEntities.length === 0) {
        return { committedCount: 0, createdReportId: '' };
      }

      const newReportId = `rpt-ingested-${Date.now()}`;
      const findingsList: string[] = [];
      const newMedIds: string[] = [];

      // 1. COMMIT LAB RESULTS TO LAB TRENDS
      acceptedEntities
        .filter(e => e.entityType === 'lab_result')
        .forEach(lab => {
          const numVal = typeof lab.value === 'number' ? lab.value : parseFloat(String(lab.value));
          if (!isNaN(numVal)) {
            findingsList.push(`${lab.name}: ${numVal} ${lab.unit || ''} (Verified Ingestion)`);

            setLabTrends(prevTrends =>
              prevTrends.map(trend => {
                if (
                  trend.parameter.toLowerCase() === lab.name.toLowerCase() ||
                  trend.parameter.toLowerCase().includes(lab.name.toLowerCase()) ||
                  lab.name.toLowerCase().includes(trend.parameter.toLowerCase().split(' ')[0])
                ) {
                  // Append new point sorted by date
                  const newData = [...trend.data, { date: lab.date, value: numVal }].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                  return { ...trend, data: newData };
                }
                return trend;
              })
            );
          }
        });

      // 2. COMMIT MEDICATIONS
      acceptedEntities
        .filter(e => e.entityType === 'medication')
        .forEach(med => {
          const medId = `m-ingested-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          newMedIds.push(medId);
          findingsList.push(`Rx: ${med.name} ${med.value || ''} (Prescribed)`);

          const newMed: Medication = {
            id: medId,
            name: med.name,
            dose: String(med.value || '10mg'),
            frequency: 'once daily',
            route: 'Oral',
            startDate: med.date,
            prescribedBy: 'd2', // Cardiology
            relatedCondition: 'c2', // Hypertension/Cardio
            status: 'active',
            notes: `Ingested from ${doc.name} (Verified ${new Date().toLocaleDateString()})`
          };

          setMedications(prevMeds => {
            // If replacing a statin like Rosuvastatin replaces Atorvastatin:
            if (med.name.toLowerCase().includes('rosuvastatin')) {
              return prevMeds.map(m =>
                m.name.toLowerCase().includes('atorvastatin')
                  ? { ...m, status: 'discontinued' as const, endDate: med.date, notes: 'Replaced by Rosuvastatin' }
                  : m
              ).concat(newMed);
            }
            return [...prevMeds, newMed];
          });
        });

      // 3. CREATE NEW SOURCED REPORT
      const newReport: Report = {
        id: newReportId,
        title: `${doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`,
        date: doc.extractedEntities[0]?.date || new Date().toISOString().split('T')[0],
        type: doc.category === 'prescription' ? 'doctor_note' : doc.category === 'imaging_report' ? 'imaging' : 'blood_test',
        doctor: 'd2',
        facility: doc.facility || 'Verified Diagnostic Facility',
        summary: `Ingested from uploaded document "${doc.name}". ${acceptedEntities.length} clinical entities verified and committed to patient record.`,
        findings: findingsList.length > 0 ? findingsList : ['Extracted medical documentation confirmed.'],
        relatedConditions: ['c2', 'c3'],
        relatedMedications: newMedIds,
        relatedLabTests: [],
        status: 'final'
      };

      setReports(prev => [newReport, ...prev]);

      // 4. CREATE TIMELINE EVENT
      const newTimelineEvent: HealthEvent = {
        id: `e-ingested-${Date.now()}`,
        date: newReport.date,
        type: doc.category === 'prescription' ? 'medication' : 'lab_test',
        title: `Ingested: ${doc.name.replace(/\.[^/.]+$/, '')}`,
        description: `Verified document ingestion with ${acceptedEntities.length} committed entities from ${doc.facility}.`,
        relatedEntityId: newReportId,
        doctor: 'd2',
        sourceReportId: newReportId
      };

      setHealthEvents(prev => [newTimelineEvent, ...prev]);

      // 5. UPDATE INGESTED DOCUMENT STATUS
      setIngestedDocuments(prev =>
        prev.map(d => (d.id === docId ? { ...d, status: 'committed' as const } : d))
      );

      // Audit log commit action
      auditLog.logAuditEvent({
        action: 'DOCUMENT_COMMIT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: `Document/${docId}`,
        targetPatientId: 'p1',
        outcome: 'success',
        details: `Committed ${acceptedEntities.length} verified clinical entities into primary record. Sourced report: ${newReportId}`
      });

      return {
        committedCount: acceptedEntities.length,
        createdReportId: newReportId
      };
    },
    [ingestedDocuments]
  );

  return (
    <PatientRecordContext.Provider
      value={{
        patient: demoPatient,
        conditions,
        medications,
        labTrends,
        reports,
        healthEvents,
        nutritionEntries,
        healthGraph,
        ingestedDocuments,
        addIngestedDocument,
        updateEntityReviewStatus,
        editEntity,
        commitAcceptedEntities,
        resetToBaseline
      }}
    >
      {children}
    </PatientRecordContext.Provider>
  );
};

export function usePatientRecord() {
  const context = useContext(PatientRecordContext);
  if (!context) {
    throw new Error('usePatientRecord must be used within a PatientRecordProvider');
  }
  return context;
}
