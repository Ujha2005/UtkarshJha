// Synthetic Sample Medical Documents for Phase 5 Ingestion Testing
// Note: All patient details and clinical documentation represent synthetic demonstration data.

import { DocumentCategory } from '@/types/ingestion';

export interface SampleMedicalDocument {
  id: string;
  title: string;
  fileName: string;
  category: DocumentCategory;
  facility: string;
  doctorName: string;
  date: string;
  fileSize: number; // in bytes
  summary: string;
  rawText: string;
}

export const SAMPLE_DOCUMENTS: SampleMedicalDocument[] = [
  {
    id: 'sample-lab-1',
    title: 'Central Diagnostics - Repeat Metabolic Panel',
    fileName: 'Central_Diagnostics_Metabolic_Sep2026.pdf',
    category: 'lab_report',
    facility: 'Central Diagnostics Laboratory',
    doctorName: 'Dr. Meera Patel',
    date: '2026-09-18',
    fileSize: 148200,
    summary: 'Routine 4-week follow-up metabolic panel assessing HbA1c and renal parameters.',
    rawText: `CENTRAL DIAGNOSTICS LABORATORY
Accredited Medical Testing Facility • Reg #CDL-94821
PATIENT DEMOGRAPHICS
Name: Sharma, Rajesh Kumar
Age: 58 Yrs / Male | UHID: CG-8891024
Referring Physician: Dr. Meera Patel (Endocrinology)
Specimen Collected: 18-Sep-2026 08:30 AM
Report Verified: 18-Sep-2026 02:45 PM

============================================================
BIOCHEMISTRY & METABOLIC INVESTIGATIONS
============================================================
Test Parameter                Observed Value    Ref. Interval    Units      Status
----------------------------------------------------------------------------------
Glycated Hemoglobin (HbA1c)   6.6               4.0 - 5.6        %          HIGH
Estimated Avg Glucose (eAG)   143               70 - 120         mg/dL      HIGH
Serum Creatinine              1.3               0.7 - 1.3        mg/dL      NORMAL
Estimated GFR (CKD-EPI)       62                > 60             mL/min     NORMAL
Serum Urea Nitrogen (BUN)     22                7 - 20           mg/dL      HIGH
Total Cholesterol             186               < 200            mg/dL      DESIRABLE
Triglycerides                 164               < 150            mg/dL      BORDERLINE
Serum Potassium               4.4               3.5 - 5.1        mmol/L     NORMAL
Serum Sodium                  140               135 - 145        mmol/L     NORMAL

CLINICAL IMPRESSION:
Improved glycemic control noted with HbA1c down to 6.6% compared to August value of 6.7%.
Serum creatinine stable at 1.3 mg/dL. Renal indices reflect preserved filtration under ARB therapy.
Verification: Dr. S. K. Gupta, MD (Pathology)`
  },
  {
    id: 'sample-rx-1',
    title: 'Heart Care Center - Pharmacotherapy Update',
    fileName: 'HeartCare_Cardiology_Prescription_Sep2026.pdf',
    category: 'prescription',
    facility: 'Heart Care Center Cardiology OPD',
    doctorName: 'Dr. Arvind Rao',
    date: '2026-09-22',
    fileSize: 94600,
    summary: 'Cardiology prescription switching statin therapy to Rosuvastatin 10mg once daily.',
    rawText: `HEART CARE CENTER
Department of Interventional & Preventative Cardiology
Physician: Dr. Arvind Rao, MD, DM (Cardiology) • Reg #DMC-44912
PATIENT: Rajesh Kumar Sharma | Age: 58 | Sex: M
Date of Encounter: 22-Sep-2026

DIAGNOSIS & CLINICAL ASSESSMENT:
Primary Essential Hypertension (Controlled)
Mild Coronary Atherosclerosis (Post-Angiography 2024, medical management)
Target BP: < 130/80 mmHg | Present BP: 126/80 mmHg

MEDICATION PRESCRIPTION (Rx):
1. Tab. Telmisartan 40 mg
   Sig: 1 tablet Once Daily (Morning after breakfast)
   Route: Oral | Duration: 90 days | Refills: 2
   Indication: Hypertension & Renoprotection

2. Tab. Rosuvastatin 10 mg (NEW REGIMEN - Replaces Atorvastatin 10mg)
   Sig: 1 tablet Once Daily at Bedtime
   Route: Oral | Duration: 90 days | Refills: 2
   Indication: Atherosclerotic plaque stabilization & LDL target < 70 mg/dL

3. Tab. Amlodipine 5 mg
   Sig: 1 tablet Once Daily (Morning)
   Route: Oral | Duration: 90 days

COUNSELING & PRECAUTIONS:
Discontinue Atorvastatin upon starting Rosuvastatin. Avoid concurrent grapefruit juice.
Follow-up lipid profile in 12 weeks.
Clinician Signature: Dr. Arvind Rao`
  },
  {
    id: 'sample-note-1',
    title: 'Nephrology Follow-up Consultation Note',
    fileName: 'Nephrology_Consult_DrDeshmukh_Sep2026.pdf',
    category: 'doctor_note',
    facility: 'Kidney & Urology Institute',
    doctorName: 'Dr. Sunita Deshmukh',
    date: '2026-09-24',
    fileSize: 112400,
    summary: 'Clinical consultation note reviewing renal stability and blood pressure control.',
    rawText: `KIDNEY & UROLOGY INSTITUTE
Department of Nephrology & Renal Transplantation
Consultant: Dr. Sunita Deshmukh, MD, DNB (Nephrology)
Patient: Rajesh Kumar Sharma (58M) | Date: 24-Sep-2026 | Visit: Follow-up

SUBJECTIVE:
Patient presents for routine CKD Stage 2 quarterly review.
Reports mild ankle fullness toward end of day, no gross pitting edema.
No dysuria, hematuria, flank pain, or nocturia. Tolerating Telmisartan well.

OBJECTIVE / VITALS:
Blood Pressure: 128/82 mmHg (Sitting, right arm)
Pulse: 72 bpm, regular | Weight: 74.2 kg (stable)
Bilateral lower extremities: Trace non-pitting ankle fullness, pedal pulses palpable 2+.
Review of Systems: Cardiovascular and respiratory exams clear.

ASSESSMENT:
1. Chronic Kidney Disease Stage 2 (Secondary to vascular/hypertensive etiology)
   - eGFR estimated at 60-62 mL/min. Creatinine stable (1.3-1.4 range).
2. Essential Hypertension - well-controlled on current ARB/CCB regimen.
3. Type 2 Diabetes Mellitus - under endocrine follow-up.

PLAN & ORDERS:
- Continue Tab. Telmisartan 40 mg daily.
- Repeat spot urine Albumin-to-Creatinine Ratio (uACR) in 3 months.
- Maintain daily fluid intake ~2 to 2.5 Liters; avoid NSAID analgesics.
- Return to clinic in December 2026 or sooner if edema acutely increases.`
  },
  {
    id: 'sample-imaging-1',
    title: 'City Care Radiology - Renal Doppler Ultrasound',
    fileName: 'Renal_Ultrasound_Doppler_Oct2026.pdf',
    category: 'imaging_report',
    facility: 'City Care Imaging Center',
    doctorName: 'Dr. Vikram Singh',
    date: '2026-10-02',
    fileSize: 205400,
    summary: 'Comprehensive bilateral renal duplex sonogram showing normal renal architecture.',
    rawText: `CITY CARE IMAGING & RADIOLOGY SERVICES
ULTRASONOGRAPHY REPORT: RENAL & RETROPERITONEUM
Patient Name: Rajesh Kumar Sharma | Age/Gender: 58Y / Male
Referring Clinician: Dr. Sunita Deshmukh / Dr. Vikram Singh
Date of Examination: 02-Oct-2026

CLINICAL INDICATION:
Evaluation of renal parenchyma and resistive indices in patient with CKD Stage 2 and prior 2022 nephrolithiasis.

FINDINGS:
RIGHT KIDNEY:
- Measures 10.4 cm in bipolar length with normal cortical thickness (1.4 cm).
- Corticomedullary differentiation is well preserved.
- No focal parenchymal masses, hydronephrosis, or recurrent calculi visualized.
- Prior lithotripsy site shows normal acoustic architecture.
- Main renal artery Doppler: Peak systolic velocity 88 cm/s, Resistive Index (RI) 0.64 (Normal < 0.70).

LEFT KIDNEY:
- Measures 10.6 cm in bipolar length with normal parenchymal echogenicity.
- No calculi, hydronephrosis, or perinephric fluid collection.
- Main renal artery Doppler: Peak systolic velocity 92 cm/s, Resistive Index (RI) 0.65.

URINARY BLADDER:
- Well distended with smooth mucosal margins. No luminal masses or calculus.
- Post-void residual volume: 18 mL (Physiologically insignificant).

IMPRESSION:
1. Bilateral normal-sized kidneys with preserved cortical thickness and normal resistive indices.
2. No evidence of recurrent nephrolithiasis or obstructive uropathy.
3. Findings consistent with stable non-progressive CKD Stage 2 architecture.
Radiologist: Dr. P. N. Murthy, MD (Radiodiagnosis)`
  },
  {
    id: 'sample-discharge-1',
    title: 'City Hospital - Observation Discharge Summary',
    fileName: 'CityHospital_Observation_Discharge_Aug2026.pdf',
    category: 'discharge_summary',
    facility: 'City Hospital Emergency & Acute Observation Unit',
    doctorName: 'Dr. Rajan Mehta',
    date: '2026-08-28',
    fileSize: 182300,
    summary: '24-hour observation stay ruling out acute coronary syndrome following brief dizziness.',
    rawText: `CITY HOSPITAL HEALTHCARE NETWORK
CLINICAL DISCHARGE SUMMARY
Admission Date: 27-Aug-2026 | Discharge Date: 28-Aug-2026
Patient: Sharma, Rajesh Kumar | Age: 58 | Sex: M | UHID: CH-2026-99120
Attending Physician: Dr. Rajan Mehta, MD (Internal Medicine)

REASON FOR ADMISSION:
Brief episode of postural lightheadedness and presyncope during outdoor walking on a warm afternoon.

HOSPITAL COURSE & WORKUP:
- Serial 12-lead ECGs: Normal sinus rhythm, rate 74 bpm, no acute ST-T wave abnormalities.
- High-sensitivity Troponin I: Negative at 0 and 6 hours (< 0.01 ng/mL).
- Basic Metabolic Panel: Sodium 138 mmol/L, Potassium 4.1 mmol/L, Creatinine 1.4 mg/dL.
- Orthostatic Vitals: Supine 128/80 mmHg, Standing 122/76 mmHg. Mild volume depletion diagnosed.
- Treated with 1000 mL intravenous normal saline with rapid resolution of symptoms.

FINAL DIAGNOSES:
1. Transient Orthostatic Dizziness secondary to mild environmental dehydration.
2. Background History: Type 2 Diabetes, Controlled Hypertension, CKD Stage 2.

DISCHARGE MEDICATIONS:
- Resume regular home regimen: Metformin 500mg BD, Glimepiride 2mg OD, Telmisartan 40mg OD, Amlodipine 5mg OD, Atorvastatin 10mg OD.

INSTRUCTIONS:
Maintain adequate hydration during summer months. Avoid abrupt transitions from supine to standing.
Physician: Dr. Rajan Mehta, MD`
  }
];
