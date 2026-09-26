// Core entity types for CareGraph

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  primaryDoctor: string;
  insuranceId?: string;
}

export interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'managed';
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedBy: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route?: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  relatedCondition: string;
  status: 'active' | 'discontinued' | 'completed';
  notes?: string;
}

export interface LabTest {
  id: string;
  name: string;
  date: string;
  results: LabResult[];
  orderedBy: string;
  labName: string;
  reportId: string;
}

export interface LabResult {
  parameter: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
}

export interface Procedure {
  id: string;
  name: string;
  date: string;
  performedBy: string;
  hospital: string;
  relatedCondition: string;
  outcome: string;
  notes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  lastVisit: string;
}

export interface Symptom {
  id: string;
  description: string;
  reportedDate: string;
  severity: 'mild' | 'moderate' | 'severe';
  relatedConditions: string[];
  status: 'active' | 'resolved' | 'investigating';
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedDate: string;
}

export interface HealthEvent {
  id: string;
  date: string;
  type: 'diagnosis' | 'lab_test' | 'medication' | 'procedure' | 'symptom' | 'visit' | 'report';
  title: string;
  description: string;
  relatedEntityId?: string;
  doctor?: string;
  sourceReportId?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  type: 'blood_test' | 'imaging' | 'procedure' | 'doctor_note' | 'other';
  doctor: string;
  facility: string;
  summary: string;
  findings: string[];
  relatedConditions: string[];
  relatedMedications: string[];
  relatedLabTests: string[];
  relatedEventId?: string;
  status: 'final' | 'preliminary' | 'amended';
}

export interface Evidence {
  id: string;
  sourceType: 'lab_report' | 'diagnosis' | 'medication' | 'procedure' | 'visit_note';
  sourceTitle: string;
  sourceDate: string;
  content: string;
  reportReference: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SymptomAnalysis {
  symptom: string;
  relevantConditions: Condition[];
  relevantMedications: Medication[];
  relevantTests: LabTest[];
  relevantEvents: HealthEvent[];
  evidence: Evidence[];
  safetyFlags: string[];
  response: string;
  disclaimer: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'patient' | 'condition' | 'medication' | 'test' | 'symptom' | 'procedure' | 'doctor';
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface HealthGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface LabTrend {
  parameter: string;
  unit: string;
  data: { date: string; value: number }[];
  referenceMin: number;
  referenceMax: number;
}
