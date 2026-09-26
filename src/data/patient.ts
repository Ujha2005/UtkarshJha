import type {
  Patient, Condition, Medication, LabTest, Procedure, Doctor,
  Symptom, Allergy, HealthEvent, NutritionEntry, LabTrend, HealthGraph, GraphNode, GraphLink, Report
} from '../types';

export const demoPatient: Patient = {
  id: 'p1',
  name: 'Rajesh Kumar Sharma',
  dateOfBirth: '1968-04-15',
  age: 58,
  gender: 'Male',
  bloodGroup: 'B+',
  phone: '+91 9876543210',
  email: 'rajesh.sharma@example.com',
  emergencyContact: {
    name: 'Anita Sharma',
    relationship: 'Wife',
    phone: '+91 9876543211'
  },
  primaryDoctor: 'd4',
  insuranceId: 'INS-987654321'
};

export const demoDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Meera Patel', specialization: 'Endocrinologist', hospital: 'City Care Hospital', phone: '1234567890', lastVisit: '2026-08-15' },
  { id: 'd2', name: 'Dr. Arvind Rao', specialization: 'Cardiologist', hospital: 'Heart Care Center', phone: '1234567891', lastVisit: '2026-08-10' },
  { id: 'd3', name: 'Dr. Sunita Deshmukh', specialization: 'Nephrologist', hospital: 'Kidney & Urology Institute', phone: '1234567892', lastVisit: '2026-09-01' },
  { id: 'd4', name: 'Dr. Rajan Mehta', specialization: 'General Physician', hospital: 'Family Clinic', phone: '1234567893', lastVisit: '2026-09-20' },
  { id: 'd5', name: 'Dr. Vikram Singh', specialization: 'Urologist', hospital: 'City Hospital', phone: '1234567894', lastVisit: '2022-08-10' }
];

export const demoConditions: Condition[] = [
  { id: 'c1', name: 'Type 2 Diabetes', diagnosedDate: '2019-03-10', status: 'managed', severity: 'moderate', diagnosedBy: 'd1', notes: 'Diagnosed with elevated HbA1c.' },
  { id: 'c2', name: 'Hypertension', diagnosedDate: '2020-06-15', status: 'managed', severity: 'moderate', diagnosedBy: 'd2', notes: 'Started on medication to control BP.' },
  { id: 'c3', name: 'Chronic Kidney Disease Stage 2', diagnosedDate: '2024-03-20', status: 'active', severity: 'mild', diagnosedBy: 'd3', notes: 'Monitored due to slight elevation in creatinine and history of diabetes/hypertension.' },
  { id: 'c4', name: 'Kidney stone', diagnosedDate: '2022-07-05', status: 'resolved', severity: 'moderate', diagnosedBy: 'd5', notes: 'Treated with lithotripsy.' }
];

export const demoAllergies: Allergy[] = [
  { id: 'a1', allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate', diagnosedDate: '2005-04-12' },
  { id: 'a2', allergen: 'Sulfa drugs', reaction: 'Nausea', severity: 'mild', diagnosedDate: '2010-09-22' }
];

export const demoMedications: Medication[] = [
  { id: 'm1', name: 'Metformin', dose: '500mg', frequency: 'twice daily', startDate: '2019-03-15', prescribedBy: 'd1', relatedCondition: 'c1', status: 'active', route: 'Oral' },
  { id: 'm2', name: 'Glimepiride', dose: '2mg', frequency: 'once daily', startDate: '2021-01-10', prescribedBy: 'd1', relatedCondition: 'c1', status: 'active', route: 'Oral' },
  { id: 'm3', name: 'Amlodipine', dose: '5mg', frequency: 'once daily', startDate: '2020-06-15', prescribedBy: 'd2', relatedCondition: 'c2', status: 'active', route: 'Oral' },
  { id: 'm4', name: 'Lisinopril', dose: '10mg', frequency: 'once daily', startDate: '2020-06-15', endDate: '2024-09-01', prescribedBy: 'd2', relatedCondition: 'c2', status: 'discontinued', notes: 'Replaced by Telmisartan', route: 'Oral' },
  { id: 'm5', name: 'Atorvastatin', dose: '10mg', frequency: 'once daily', startDate: '2020-06-15', prescribedBy: 'd2', relatedCondition: 'c2', status: 'active', route: 'Oral' },
  { id: 'm6', name: 'Telmisartan', dose: '40mg', frequency: 'once daily', startDate: '2024-09-01', prescribedBy: 'd2', relatedCondition: 'c2', status: 'active', route: 'Oral' } // Used for c2 & c3
];

const hba1cData = [
  { date: '2019-03-12', value: 8.1 }, { date: '2019-09-15', value: 7.4 }, { date: '2020-03-10', value: 7.0 },
  { date: '2020-09-12', value: 6.8 }, { date: '2021-03-15', value: 7.2 }, { date: '2021-09-10', value: 6.9 },
  { date: '2022-03-12', value: 6.7 }, { date: '2022-09-15', value: 6.5 }, { date: '2023-03-10', value: 6.8 },
  { date: '2023-09-12', value: 7.1 }, { date: '2024-03-15', value: 7.3 }, { date: '2024-09-10', value: 6.9 },
  { date: '2025-03-12', value: 6.6 }, { date: '2025-09-15', value: 6.4 }, { date: '2026-03-10', value: 6.5 },
  { date: '2026-08-12', value: 6.7 }
];

const creatinineData = [
  { date: '2020-06-12', value: 1.0 }, { date: '2021-03-15', value: 1.0 }, { date: '2021-09-10', value: 1.1 },
  { date: '2022-03-12', value: 1.1 }, { date: '2022-09-15', value: 1.0 }, { date: '2023-03-10', value: 1.2 },
  { date: '2023-09-12', value: 1.2 }, { date: '2024-03-15', value: 1.3 }, { date: '2024-09-10', value: 1.3 },
  { date: '2025-03-12', value: 1.4 }, { date: '2025-09-15', value: 1.3 }, { date: '2026-03-10', value: 1.4 },
  { date: '2026-08-12', value: 1.4 }
];

const bpSystolicData = [
  { date: '2020-06-12', value: 152 }, { date: '2020-09-12', value: 144 }, { date: '2021-03-15', value: 138 },
  { date: '2021-09-10', value: 134 }, { date: '2022-03-12', value: 130 }, { date: '2022-09-15', value: 128 },
  { date: '2023-03-10', value: 132 }, { date: '2023-09-12', value: 136 }, { date: '2024-03-15', value: 134 },
  { date: '2024-09-10', value: 130 }, { date: '2025-03-12', value: 128 }, { date: '2025-09-15', value: 126 },
  { date: '2026-03-10', value: 128 }, { date: '2026-08-12', value: 130 }
];

const hemoglobinData = [
  { date: '2020-03-10', value: 14.2 }, { date: '2021-03-15', value: 13.8 }, { date: '2022-03-12', value: 13.5 },
  { date: '2023-03-10', value: 13.2 }, { date: '2023-09-12', value: 12.9 }, { date: '2024-03-15', value: 12.6 },
  { date: '2024-09-10', value: 12.8 }, { date: '2025-03-12', value: 12.5 }, { date: '2026-03-10', value: 12.3 },
  { date: '2026-08-12', value: 12.4 }
];

const cholesterolData = [
  { date: '2020-06-12', value: 242 }, { date: '2020-09-12', value: 228 }, { date: '2021-03-15', value: 210 },
  { date: '2021-09-10', value: 198 }, { date: '2022-03-12', value: 195 }, { date: '2022-09-15', value: 188 },
  { date: '2023-03-10', value: 192 }, { date: '2023-09-12', value: 205 }, { date: '2024-03-15', value: 198 },
  { date: '2024-09-10', value: 190 }, { date: '2025-03-12', value: 185 }, { date: '2026-03-10', value: 188 },
  { date: '2026-08-12', value: 192 }
];

const ldlData = [
  { date: '2020-06-12', value: 158 }, { date: '2020-09-12', value: 142 }, { date: '2021-03-15', value: 130 },
  { date: '2021-09-10', value: 118 }, { date: '2022-03-12', value: 115 }, { date: '2022-09-15', value: 108 },
  { date: '2023-03-10', value: 112 }, { date: '2023-09-12', value: 124 }, { date: '2024-03-15', value: 116 },
  { date: '2024-09-10', value: 110 }, { date: '2025-03-12', value: 104 }, { date: '2026-03-10', value: 108 },
  { date: '2026-08-12', value: 112 }
];

export const demoLabTrends: LabTrend[] = [
  { parameter: 'HbA1c', unit: '%', data: hba1cData, referenceMin: 4.0, referenceMax: 5.6 },
  { parameter: 'Creatinine', unit: 'mg/dL', data: creatinineData, referenceMin: 0.7, referenceMax: 1.3 },
  { parameter: 'Systolic BP', unit: 'mmHg', data: bpSystolicData, referenceMin: 90, referenceMax: 130 },
  { parameter: 'Hemoglobin', unit: 'g/dL', data: hemoglobinData, referenceMin: 13.0, referenceMax: 17.0 },
  { parameter: 'Total Cholesterol', unit: 'mg/dL', data: cholesterolData, referenceMin: 0, referenceMax: 200 },
  { parameter: 'LDL Cholesterol', unit: 'mg/dL', data: ldlData, referenceMin: 0, referenceMax: 100 }
];

export const demoLabTests: LabTest[] = hba1cData.map((d, i) => ({
  id: `lt_hba1c_${i}`,
  name: 'HbA1c Test',
  date: d.date,
  results: [
    { parameter: 'HbA1c', value: d.value, unit: '%', referenceRange: '4.0-5.6', status: (d.value > 5.6 ? 'high' : 'normal') as 'normal' | 'high' }
  ],
  orderedBy: 'd1',
  labName: 'Central Diagnostics',
  reportId: `RPT-A1C-${i}`
}));

// Also merge other tests as HealthEvents later
demoLabTests.push(...creatinineData.map((d, i) => ({
  id: `lt_creat_${i}`,
  name: 'Kidney Function Test',
  date: d.date,
  results: [
    { parameter: 'Creatinine', value: d.value, unit: 'mg/dL', referenceRange: '0.7-1.3', status: (d.value > 1.3 ? 'high' : 'normal') as 'normal' | 'high' }
  ],
  orderedBy: 'd3',
  labName: 'Central Diagnostics',
  reportId: `RPT-KFT-${i}`
})));

demoLabTests.push(...hemoglobinData.map((d, i) => ({
  id: `lt_hb_${i}`,
  name: 'Complete Blood Count',
  date: d.date,
  results: [
    { parameter: 'Hemoglobin', value: d.value, unit: 'g/dL', referenceRange: '13.0-17.0', status: (d.value < 13.0 ? 'low' : 'normal') as 'normal' | 'low' }
  ],
  orderedBy: 'd4',
  labName: 'Central Diagnostics',
  reportId: `RPT-CBC-${i}`
})));

demoLabTests.push(...cholesterolData.map((d, i) => ({
  id: `lt_chol_${i}`,
  name: 'Lipid Profile',
  date: d.date,
  results: [
    { parameter: 'Total Cholesterol', value: d.value, unit: 'mg/dL', referenceRange: '<200', status: (d.value > 200 ? 'high' : 'normal') as 'normal' | 'high' }
  ],
  orderedBy: 'd2',
  labName: 'Central Diagnostics',
  reportId: `RPT-LIPID-${i}`
})));


export const demoProcedures: Procedure[] = [
  { id: 'pr1', name: 'Extracorporeal Shock Wave Lithotripsy (ESWL)', date: '2022-07-15', performedBy: 'd5', hospital: 'City Hospital', relatedCondition: 'c4', outcome: 'successful', notes: 'Fragmented kidney stone successfully.' },
  { id: 'pr2', name: 'Coronary Angiography', date: '2024-02-10', performedBy: 'd2', hospital: 'Heart Care Center', relatedCondition: 'c2', outcome: 'mild blockage noted, managed medically', notes: 'Investigated chest discomfort.' }
];

export const demoSymptoms: Symptom[] = [
  { id: 's1', description: 'Fatigue', reportedDate: '2023-05-10', severity: 'moderate', relatedConditions: ['c1', 'c3'], status: 'resolved' },
  { id: 's2', description: 'Occasional headaches', reportedDate: '2020-08-05', severity: 'mild', relatedConditions: ['c2'], status: 'resolved' },
  { id: 's3', description: 'Swelling in ankles', reportedDate: '2024-07-20', severity: 'moderate', relatedConditions: ['c3', 'c2'], status: 'active' },
  { id: 's4', description: 'Numbness in feet', reportedDate: '2024-12-05', severity: 'mild', relatedConditions: ['c1'], status: 'investigating' }
];

export const demoHealthEvents: HealthEvent[] = [
  { id: 'e1', date: '2019-03-10', type: 'diagnosis', title: 'Diagnosed with Type 2 Diabetes', description: 'Patient presented with elevated blood sugar.', relatedEntityId: 'c1', doctor: 'd1' },
  { id: 'e2', date: '2019-03-12', type: 'lab_test', title: 'HbA1c Test Result: 8.1%', description: 'Initial diagnosis confirmation.', relatedEntityId: 'lt_hba1c_0' },
  { id: 'e3', date: '2019-03-15', type: 'medication', title: 'Started Metformin', description: 'Prescribed 500mg twice daily.', relatedEntityId: 'm1', doctor: 'd1' },
  { id: 'e4', date: '2019-09-15', type: 'lab_test', title: 'HbA1c Test Result: 7.4%', description: 'Follow-up lab test.', relatedEntityId: 'lt_hba1c_1' },
  { id: 'e5', date: '2020-03-10', type: 'lab_test', title: 'HbA1c Test Result: 7.0%', description: 'Follow-up lab test.', relatedEntityId: 'lt_hba1c_2' },
  { id: 'e6', date: '2020-06-12', type: 'lab_test', title: 'Lipid Profile & Creatinine', description: 'Routine checkup. High BP noted.', relatedEntityId: 'lt_chol_0' },
  { id: 'e7', date: '2020-06-15', type: 'diagnosis', title: 'Diagnosed with Hypertension', description: 'Blood pressure elevated at 152 mmHg systolic.', relatedEntityId: 'c2', doctor: 'd2' },
  { id: 'e8', date: '2020-06-15', type: 'medication', title: 'Started Anti-hypertensives & Statins', description: 'Amlodipine, Lisinopril, Atorvastatin prescribed.', doctor: 'd2' },
  { id: 'e9', date: '2020-08-05', type: 'symptom', title: 'Reported Occasional headaches', description: 'Mild headaches, related to hypertension.', relatedEntityId: 's2' },
  { id: 'e10', date: '2021-01-10', type: 'medication', title: 'Added Glimepiride', description: 'Prescribed 2mg once daily for better glycemic control.', relatedEntityId: 'm2', doctor: 'd1' },
  { id: 'e11', date: '2021-09-10', type: 'lab_test', title: 'Routine Labs', description: 'HbA1c 6.9%, Creatinine 1.1', relatedEntityId: 'lt_hba1c_5' },
  { id: 'e12', date: '2022-07-05', type: 'diagnosis', title: 'Diagnosed with Kidney stone', description: 'Patient presented with severe flank pain.', relatedEntityId: 'c4', doctor: 'd5' },
  { id: 'e13', date: '2022-07-15', type: 'procedure', title: 'Underwent ESWL', description: 'Extracorporeal Shock Wave Lithotripsy performed.', relatedEntityId: 'pr1', doctor: 'd5' },
  { id: 'e14', date: '2022-09-15', type: 'visit', title: 'Follow-up post Lithotripsy', description: 'Patient recovered well. Stone fragmented.', doctor: 'd5' },
  { id: 'e15', date: '2023-05-10', type: 'symptom', title: 'Reported Fatigue', description: 'Moderate fatigue reported by patient.', relatedEntityId: 's1' },
  { id: 'e16', date: '2023-09-12', type: 'lab_test', title: 'Routine Labs', description: 'HbA1c 7.1%, Creatinine 1.2', relatedEntityId: 'lt_hba1c_9' },
  { id: 'e17', date: '2024-02-10', type: 'procedure', title: 'Coronary Angiography', description: 'Investigated chest discomfort. Mild blockage noted.', relatedEntityId: 'pr2', doctor: 'd2' },
  { id: 'e18', date: '2024-03-20', type: 'diagnosis', title: 'Diagnosed with CKD Stage 2', description: 'Chronic Kidney Disease Stage 2 noted from rising creatinine.', relatedEntityId: 'c3', doctor: 'd3' },
  { id: 'e19', date: '2024-07-20', type: 'symptom', title: 'Reported Swelling in ankles', description: 'Moderate swelling noted.', relatedEntityId: 's3' },
  { id: 'e20', date: '2024-09-01', type: 'medication', title: 'Medication Change', description: 'Stopped Lisinopril, started Telmisartan 40mg.', relatedEntityId: 'm6', doctor: 'd2' },
  { id: 'e21', date: '2024-12-05', type: 'symptom', title: 'Reported Numbness in feet', description: 'Mild numbness, possible neuropathy.', relatedEntityId: 's4' },
  { id: 'e22', date: '2025-03-12', type: 'lab_test', title: 'Kidney & Diabetes Follow-up', description: 'Creatinine 1.4, HbA1c 6.6%', relatedEntityId: 'lt_creat_9' },
  { id: 'e23', date: '2025-09-15', type: 'lab_test', title: 'Kidney & Diabetes Follow-up', description: 'Creatinine 1.3, HbA1c 6.4%', relatedEntityId: 'lt_creat_10' },
  { id: 'e24', date: '2026-03-10', type: 'lab_test', title: 'Routine Labs', description: 'Creatinine 1.4, HbA1c 6.5%', relatedEntityId: 'lt_hba1c_14' },
  { id: 'e25', date: '2026-08-12', type: 'lab_test', title: 'Latest Labs', description: 'Creatinine 1.4, HbA1c 6.7%, Total Cholesterol 192.', relatedEntityId: 'lt_hba1c_15' }
];

export const demoNutritionEntries: NutritionEntry[] = [
  { id: 'n1', date: '2026-09-26', mealType: 'breakfast', food: '2 Idli with Sambar', quantity: '2 idlis, 1 bowl sambar', calories: 280, protein: 8, carbs: 48, fat: 5, fiber: 4 },
  { id: 'n2', date: '2026-09-26', mealType: 'snack', food: 'Green tea + 5 almonds', quantity: '1 cup tea, 5 almonds', calories: 45, protein: 2, carbs: 2, fat: 3, fiber: 1 },
  { id: 'n3', date: '2026-09-26', mealType: 'lunch', food: '2 Roti + Dal + Sabzi + Curd', quantity: '2 roti, 1 bowl each dal/sabzi/curd', calories: 520, protein: 18, carbs: 68, fat: 16, fiber: 8 },
  { id: 'n4', date: '2026-09-26', mealType: 'snack', food: '1 Apple', quantity: '1 medium apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4 },
  { id: 'n5', date: '2026-09-26', mealType: 'dinner', food: 'Brown rice + Grilled chicken + Salad', quantity: '1 cup rice, 150g chicken, 1 bowl salad', calories: 480, protein: 32, carbs: 52, fat: 12, fiber: 5 }
];

export const demoReports: Report[] = [
  {
    id: 'rpt-1', title: 'Initial Diabetes Workup', date: '2019-03-12', type: 'blood_test',
    doctor: 'd1', facility: 'Central Diagnostics',
    summary: 'Comprehensive metabolic panel confirming Type 2 Diabetes. HbA1c elevated at 8.1%.',
    findings: ['HbA1c: 8.1% (High)', 'Fasting glucose: 186 mg/dL (High)', 'Lipid panel within acceptable limits'],
    relatedConditions: ['c1'], relatedMedications: ['m1'], relatedLabTests: ['lt_hba1c_0'],
    relatedEventId: 'e2', status: 'final'
  },
  {
    id: 'rpt-2', title: 'Cardiac & Metabolic Assessment', date: '2020-06-12', type: 'blood_test',
    doctor: 'd2', facility: 'Heart Care Center',
    summary: 'Elevated blood pressure and cholesterol. Lipid profile and kidney function assessed.',
    findings: ['Blood pressure: 152/94 mmHg (High)', 'Total cholesterol: 242 mg/dL (High)', 'LDL: 158 mg/dL (High)', 'Creatinine: 1.0 mg/dL (Normal)'],
    relatedConditions: ['c2'], relatedMedications: ['m3', 'm5'], relatedLabTests: ['lt_chol_0', 'lt_creat_0'],
    relatedEventId: 'e6', status: 'final'
  },
  {
    id: 'rpt-3', title: 'ESWL Procedure Report', date: '2022-07-15', type: 'procedure',
    doctor: 'd5', facility: 'City Hospital',
    summary: 'Extracorporeal Shock Wave Lithotripsy performed for right renal calculus. Procedure successful.',
    findings: ['Stone fragmented successfully', 'No significant residual fragments on post-procedure imaging', 'Patient tolerated procedure well', 'Recommended follow-up ultrasound in 6 weeks'],
    relatedConditions: ['c4'], relatedMedications: [], relatedLabTests: [],
    relatedEventId: 'e13', status: 'final'
  },
  {
    id: 'rpt-4', title: 'Kidney Ultrasound', date: '2022-09-10', type: 'imaging',
    doctor: 'd5', facility: 'City Hospital',
    summary: 'Follow-up renal ultrasound after lithotripsy. No residual calculi.',
    findings: ['Right kidney: Normal size, no residual calculi', 'Left kidney: Normal, no abnormalities', 'Bladder: Normal', 'No hydronephrosis'],
    relatedConditions: ['c4'], relatedMedications: [], relatedLabTests: [],
    status: 'final'
  },
  {
    id: 'rpt-5', title: 'Routine Diabetes & Kidney Follow-up', date: '2023-09-12', type: 'blood_test',
    doctor: 'd1', facility: 'Central Diagnostics',
    summary: 'HbA1c shows slight increase to 7.1%. Creatinine trending up at 1.2 mg/dL.',
    findings: ['HbA1c: 7.1% (High)', 'Creatinine: 1.2 mg/dL (Normal-High)', 'eGFR: 68 mL/min (Mildly decreased)', 'Fasting glucose: 142 mg/dL'],
    relatedConditions: ['c1', 'c3'], relatedMedications: ['m1', 'm2'], relatedLabTests: ['lt_hba1c_9', 'lt_creat_6'],
    relatedEventId: 'e16', status: 'final'
  },
  {
    id: 'rpt-6', title: 'Coronary Angiography Report', date: '2024-02-10', type: 'procedure',
    doctor: 'd2', facility: 'Heart Care Center',
    summary: 'Diagnostic coronary angiography for chest discomfort. Mild blockage in LAD. Medical management recommended.',
    findings: ['Mild stenosis (~30%) in mid-LAD', 'No significant blockage in RCA or LCx', 'LVEF: 55% (Normal)', 'No intervention required at this time', 'Continue anti-hypertensive and statin therapy'],
    relatedConditions: ['c2'], relatedMedications: ['m3', 'm5'], relatedLabTests: [],
    relatedEventId: 'e17', status: 'final'
  },
  {
    id: 'rpt-7', title: 'Nephrology Consultation Note', date: '2024-03-20', type: 'doctor_note',
    doctor: 'd3', facility: 'Kidney & Urology Institute',
    summary: 'CKD Stage 2 diagnosed based on rising creatinine and reduced eGFR. Monitoring plan established.',
    findings: ['Creatinine: 1.3 mg/dL (High)', 'eGFR: 62 mL/min', 'Urine albumin-to-creatinine ratio: 42 mg/g (Mildly elevated)', 'Diagnosis: CKD Stage 2', 'Recommend switching from Lisinopril to Telmisartan for renal protection'],
    relatedConditions: ['c3'], relatedMedications: ['m4', 'm6'], relatedLabTests: ['lt_creat_7'],
    relatedEventId: 'e18', status: 'final'
  },
  {
    id: 'rpt-8', title: 'Comprehensive Annual Checkup', date: '2025-03-12', type: 'blood_test',
    doctor: 'd4', facility: 'Central Diagnostics',
    summary: 'Annual metabolic panel. Diabetes control improving. Kidney function stable but creatinine elevated.',
    findings: ['HbA1c: 6.6% (Improved)', 'Creatinine: 1.4 mg/dL (High)', 'eGFR: 58 mL/min', 'Hemoglobin: 12.5 g/dL (Mildly low)', 'Total cholesterol: 185 mg/dL (Normal)', 'BP: 128/82 mmHg (Controlled)'],
    relatedConditions: ['c1', 'c2', 'c3'], relatedMedications: ['m1', 'm2', 'm6'], relatedLabTests: ['lt_hba1c_12', 'lt_creat_9', 'lt_hb_7'],
    relatedEventId: 'e22', status: 'final'
  },
  {
    id: 'rpt-9', title: 'Latest Metabolic Panel', date: '2026-08-12', type: 'blood_test',
    doctor: 'd1', facility: 'Central Diagnostics',
    summary: 'Most recent labs. HbA1c 6.7%, creatinine stable at 1.4 mg/dL, cholesterol 192 mg/dL.',
    findings: ['HbA1c: 6.7% (High)', 'Creatinine: 1.4 mg/dL (High)', 'eGFR: 56 mL/min', 'Hemoglobin: 12.4 g/dL (Low)', 'Total cholesterol: 192 mg/dL (Normal)', 'BP: 130/84 mmHg', 'Triglycerides: 168 mg/dL'],
    relatedConditions: ['c1', 'c2', 'c3'], relatedMedications: ['m1', 'm2', 'm3', 'm6', 'm5'], relatedLabTests: ['lt_hba1c_15', 'lt_creat_12', 'lt_hb_9', 'lt_chol_12'],
    relatedEventId: 'e25', status: 'final'
  },
  {
    id: 'rpt-10', title: 'Endocrinology Visit Note', date: '2024-12-05', type: 'doctor_note',
    doctor: 'd1', facility: 'City Care Hospital',
    summary: 'Patient reports numbness in feet. Possible peripheral neuropathy related to diabetes. Nerve conduction study recommended.',
    findings: ['Bilateral numbness in toes/feet', 'Reduced sensation on monofilament testing', 'Pedal pulses present', 'Recommend nerve conduction velocity (NCV) study', 'Consider adding Pregabalin if NCV confirms neuropathy'],
    relatedConditions: ['c1'], relatedMedications: ['m1', 'm2'], relatedLabTests: [],
    relatedEventId: 'e21', status: 'final'
  },
  {
    id: 'rpt-11', title: 'Chest X-Ray', date: '2024-01-28', type: 'imaging',
    doctor: 'd2', facility: 'Heart Care Center',
    summary: 'Pre-angiography chest X-ray. No acute findings.',
    findings: ['Heart size: Normal', 'Lungs: Clear, no infiltrates', 'No pleural effusion', 'Mediastinum: Normal'],
    relatedConditions: ['c2'], relatedMedications: [], relatedLabTests: [],
    status: 'final'
  },
  {
    id: 'rpt-12', title: 'Follow-up Kidney Function', date: '2025-09-15', type: 'blood_test',
    doctor: 'd3', facility: 'Central Diagnostics',
    summary: 'Kidney function follow-up. Creatinine slightly improved at 1.3 mg/dL. HbA1c excellent at 6.4%.',
    findings: ['Creatinine: 1.3 mg/dL (High)', 'eGFR: 60 mL/min', 'HbA1c: 6.4% (Controlled)', 'Urine albumin: 38 mg/g (Mildly elevated)'],
    relatedConditions: ['c1', 'c3'], relatedMedications: ['m6'], relatedLabTests: ['lt_creat_10', 'lt_hba1c_13'],
    relatedEventId: 'e23', status: 'final'
  }
];

export function buildHealthGraph(): HealthGraph {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Patient Node
  nodes.push({ id: demoPatient.id, label: demoPatient.name, type: 'patient', color: '#3b82f6' });

  // Doctors
  demoDoctors.forEach(doc => {
    nodes.push({ id: doc.id, label: doc.name, type: 'doctor', color: '#6366f1' });
    links.push({ source: demoPatient.id, target: doc.id, label: 'treated by' });
  });

  // Conditions
  demoConditions.forEach(cond => {
    nodes.push({ id: cond.id, label: cond.name, type: 'condition', color: '#ef4444' });
    links.push({ source: demoPatient.id, target: cond.id, label: 'has condition' });
    if (cond.diagnosedBy) {
      links.push({ source: cond.diagnosedBy, target: cond.id, label: 'diagnosed' });
    }
  });

  // Medications
  demoMedications.forEach(med => {
    nodes.push({ id: med.id, label: med.name, type: 'medication', color: '#10b981' });
    if (med.relatedCondition) {
      links.push({ source: med.relatedCondition, target: med.id, label: 'treated with' });
    }
    if (med.prescribedBy) {
      links.push({ source: med.prescribedBy, target: med.id, label: 'prescribed' });
    }
  });

  // Unique Tests linked to conditions
  nodes.push({ id: 'test_hba1c', label: 'HbA1c Trend', type: 'test', color: '#f59e0b' });
  links.push({ source: 'c1', target: 'test_hba1c', label: 'monitored by' });

  nodes.push({ id: 'test_creat', label: 'Creatinine Trend', type: 'test', color: '#f59e0b' });
  links.push({ source: 'c3', target: 'test_creat', label: 'monitored by' });

  nodes.push({ id: 'test_bp', label: 'Blood Pressure Trend', type: 'test', color: '#f59e0b' });
  links.push({ source: 'c2', target: 'test_bp', label: 'monitored by' });

  nodes.push({ id: 'test_lipid', label: 'Lipid Profile & LDL', type: 'test', color: '#f59e0b' });
  links.push({ source: 'c2', target: 'test_lipid', label: 'monitored by' });

  nodes.push({ id: 'test_hb', label: 'Hemoglobin Trend', type: 'test', color: '#f59e0b' });
  links.push({ source: 'c3', target: 'test_hb', label: 'monitored by' });

  // Procedures
  demoProcedures.forEach(proc => {
    nodes.push({ id: proc.id, label: proc.name, type: 'procedure', color: '#14b8a6' });
    if (proc.relatedCondition) {
      links.push({ source: proc.relatedCondition, target: proc.id, label: 'requires' });
    }
  });

  // Symptoms
  demoSymptoms.forEach(symp => {
    nodes.push({ id: symp.id, label: symp.description, type: 'symptom', color: '#8b5cf6' });
    symp.relatedConditions.forEach(rc => {
      links.push({ source: rc, target: symp.id, label: 'causes' });
    });
  });

  return { nodes, links };
}
