// Reactive Patient Record Context for Dynamic Ingestion & Graph Synchronization
// Phase 9 Architecture: Consumes the ApiClient and Backend Provider abstraction.
// Zero direct dependencies on static demo data files.

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type {
  Patient,
  Condition,
  Medication,
  LabTrend,
  Report,
  HealthEvent,
  HealthGraph,
  GraphNode,
  GraphLink,
  NutritionEntry,
  Doctor,
  Allergy,
  Symptom,
} from '@/types';
import type {
  ExtractedEntity,
  IngestedDocument,
  EntityReviewStatus,
} from '@/types/ingestion';
import { apiClient } from '@/services/api/apiClient';
import { auditLog } from '@/services/auditLog';

export interface PatientRecordContextType {
  patient: Patient;
  conditions: Condition[];
  medications: Medication[];
  labTrends: LabTrend[];
  reports: Report[];
  healthEvents: HealthEvent[];
  nutritionEntries: NutritionEntry[];
  doctors: Doctor[];
  allergies: Allergy[];
  symptoms: Symptom[];
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
  isLoading: boolean;
}

const PatientRecordContext = createContext<PatientRecordContextType | undefined>(undefined);

export const PatientRecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state directly from the backend provider via ApiClient
  const initialBundle = useMemo(() => apiClient.patient.getInitialBundle('p1'), []);

  const [patient, setPatient] = useState<Patient>(initialBundle.patient);
  const [conditions, setConditions] = useState<Condition[]>(initialBundle.conditions);
  const [medications, setMedications] = useState<Medication[]>(initialBundle.medications);
  const [labTrends, setLabTrends] = useState<LabTrend[]>(initialBundle.labTrends);
  const [reports, setReports] = useState<Report[]>(initialBundle.reports);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>(initialBundle.healthEvents);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>(initialBundle.nutritionEntries);
  const [doctors, setDoctors] = useState<Doctor[]>(initialBundle.doctors);
  const [allergies, setAllergies] = useState<Allergy[]>(initialBundle.allergies);
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialBundle.symptoms);
  const [ingestedDocuments, setIngestedDocuments] = useState<IngestedDocument[]>(initialBundle.ingestedDocuments);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resetToBaseline = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshBundle = await apiClient.patient.resetToBaseline(patient.id || 'p1');
      setPatient(freshBundle.patient);
      setConditions(freshBundle.conditions);
      setMedications(freshBundle.medications);
      setLabTrends(freshBundle.labTrends);
      setReports(freshBundle.reports);
      setHealthEvents(freshBundle.healthEvents);
      setNutritionEntries(freshBundle.nutritionEntries);
      setDoctors(freshBundle.doctors);
      setAllergies(freshBundle.allergies);
      setSymptoms(freshBundle.symptoms);
      setIngestedDocuments([]);
    } catch (err) {
      console.error('Failed to reset patient data via API client:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patient.id]);

  // Dynamically compute health graph from current conditions & medications
  const healthGraph = useMemo<HealthGraph>(() => {
    const dynamicNodes: GraphNode[] = [
      { id: patient.id, label: patient.name, type: 'patient', color: '#2563eb' },
    ];
    const dynamicLinks: GraphLink[] = [];

    // Conditions
    conditions.forEach(c => {
      dynamicNodes.push({ id: c.id, label: c.name, type: 'condition', color: '#ef4444' });
      dynamicLinks.push({ source: patient.id, target: c.id, label: 'diagnosed with' });
    });

    // Medications
    medications.forEach(m => {
      dynamicNodes.push({
        id: m.id,
        label: m.status === 'discontinued' ? `${m.name} (Discontinued)` : m.name,
        type: 'medication',
        color: m.status === 'discontinued' ? '#94a3b8' : '#10b981',
      });
      dynamicLinks.push({ source: patient.id, target: m.id, label: 'prescribed' });
      if (m.relatedCondition) {
        dynamicLinks.push({ source: m.relatedCondition, target: m.id, label: 'treated with' });
      }
    });

    // Doctors
    doctors.forEach(d => {
      dynamicNodes.push({ id: d.id, label: d.name, type: 'doctor', color: '#6366f1' });
      dynamicLinks.push({ source: patient.id, target: d.id, label: 'cared for by' });
    });

    return { nodes: dynamicNodes, links: dynamicLinks };
  }, [patient, conditions, medications, doctors]);

  const addIngestedDocument = useCallback((doc: IngestedDocument) => {
    setIngestedDocuments(prev => [doc, ...prev]);

    // Forward to backend provider asynchronously
    apiClient.documents.upload(patient.id || 'p1', doc).catch(err => {
      console.warn('API document upload notice:', err);
    });

    auditLog.logAuditEvent({
      action: 'DOCUMENT_UPLOAD',
      userId: 'u1',
      userRole: 'PATIENT',
      userName: patient.name,
      targetResource: `Document/${doc.id}`,
      targetPatientId: patient.id,
      outcome: 'success',
      details: `Uploaded medical document "${doc.name}" for entity extraction (${doc.category})`,
    });
  }, [patient]);

  const updateEntityReviewStatus = useCallback(
    (docId: string, entityId: string, status: EntityReviewStatus) => {
      setIngestedDocuments(prev =>
        prev.map(doc => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            extractedEntities: doc.extractedEntities.map(e =>
              e.id === entityId ? { ...e, reviewStatus: status } : e
            ),
          };
        })
      );

      apiClient.documents.updateEntityStatus(docId, entityId, status).catch(console.warn);

      auditLog.logAuditEvent({
        action: status === 'rejected' ? 'ENTITY_REJECT' : 'ENTITY_ACCEPT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: patient.name,
        targetResource: `Entity/${entityId}`,
        targetPatientId: patient.id,
        outcome: 'success',
        details: `Updated extracted clinical entity review status to "${status}"`,
      });
    },
    [patient]
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
            ),
          };
        })
      );

      apiClient.documents.editEntity(docId, entityId, changes).catch(console.warn);

      auditLog.logAuditEvent({
        action: 'ENTITY_EDIT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: patient.name,
        targetResource: `Entity/${entityId}`,
        targetPatientId: patient.id,
        outcome: 'success',
        details: `Edited clinical entity attributes manually before commit`,
      });
    },
    [patient]
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
          const medId = `m-ingested-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          newMedIds.push(medId);
          findingsList.push(`Rx: ${med.name} ${med.value || ''} (Prescribed)`);

          const newMed: Medication = {
            id: medId,
            name: med.name,
            dose: String(med.value || '10mg'),
            frequency: 'once daily',
            route: 'Oral',
            startDate: med.date,
            prescribedBy: 'd2',
            relatedCondition: 'c2',
            status: 'active',
            notes: `Ingested from ${doc.name} (Verified ${new Date().toLocaleDateString()})`,
          };

          setMedications(prevMeds => {
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
        status: 'final',
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
        sourceReportId: newReportId,
      };

      setHealthEvents(prev => [newTimelineEvent, ...prev]);

      // 5. UPDATE INGESTED DOCUMENT STATUS
      setIngestedDocuments(prev =>
        prev.map(d => (d.id === docId ? { ...d, status: 'committed' as const } : d))
      );

      // Async backend notification
      apiClient.documents.commitAcceptedEntities(docId).catch(console.warn);

      auditLog.logAuditEvent({
        action: 'DOCUMENT_COMMIT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: patient.name,
        targetResource: `Document/${docId}`,
        targetPatientId: patient.id,
        outcome: 'success',
        details: `Committed ${acceptedEntities.length} verified clinical entities into primary record. Sourced report: ${newReportId}`,
      });

      return {
        committedCount: acceptedEntities.length,
        createdReportId: newReportId,
      };
    },
    [ingestedDocuments, patient]
  );

  return (
    <PatientRecordContext.Provider
      value={{
        patient,
        conditions,
        medications,
        labTrends,
        reports,
        healthEvents,
        nutritionEntries,
        doctors,
        allergies,
        symptoms,
        healthGraph,
        ingestedDocuments,
        addIngestedDocument,
        updateEntityReviewStatus,
        editEntity,
        commitAcceptedEntities,
        resetToBaseline,
        isLoading,
      }}
    >
      {children}
    </PatientRecordContext.Provider>
  );
};

export const usePatientRecord = () => {
  const context = useContext(PatientRecordContext);
  if (!context) {
    throw new Error('usePatientRecord must be used within a PatientRecordProvider');
  }
  return context;
};
