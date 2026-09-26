import type {
  Condition,
  Medication,
  LabTest,
  Report,
  HealthEvent,
  Symptom,
  Evidence
} from '../types';
import {
  demoConditions,
  demoMedications,
  demoLabTrends,
  demoLabTests,
  demoReports,
  demoHealthEvents,
  demoSymptoms,
  demoDoctors
} from '../data/patient.ts';

export type EvidenceCategory =
  | 'documented_fact'
  | 'historical_association'
  | 'possible_relevance'
  | 'missing_information';

export interface RetrievedEvidenceItem {
  id: string;
  category: EvidenceCategory;
  entityType: 'condition' | 'medication' | 'lab_test' | 'report' | 'procedure' | 'symptom';
  title: string;
  date?: string;
  sourceReference: string;
  reportId?: string;
  findingSnippet?: string;
  confidence: 'high' | 'medium' | 'low';
  relevanceRationale: string;
}

export interface SafetyAlert {
  isEmergency: boolean;
  urgencyLevel: 'emergency' | 'urgent_clinical' | 'routine_evaluation';
  alertTitle: string;
  alertMessage: string;
  recommendedAction: string;
}

export interface SymptomRetrievalResult {
  querySymptom: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetDate: string;
  frequency: string;
  matchedEntities: {
    conditions: Condition[];
    medications: Medication[];
    labTests: LabTest[];
    reports: Report[];
    events: HealthEvent[];
    pastSymptoms: Symptom[];
    labTrends: { parameter: string; latestValue: number; unit: string; trendDescription: string }[];
  };
  evidenceChain: RetrievedEvidenceItem[];
  safetyCheck: SafetyAlert;
  clinicalResponse: string;
  whyRetrievedBullets: string[];
  missingInformation: string[];
  clinicianDiscussionPoints: string[];
}

export interface SymptomPreset {
  id: string;
  name: string;
  badge: string;
  symptom: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: string;
  notes: string;
}

export const SYMPTOM_PRESETS: SymptomPreset[] = [
  {
    id: 'strong_diabetes',
    name: '1. Strong Historical Match (Diabetes)',
    badge: 'High Relevance',
    symptom: 'Increased thirst and frequent urination',
    description: 'Feeling unusually thirsty over the past 3 days and having to wake up 2-3 times at night to urinate. Mild midday fatigue noted.',
    severity: 'moderate',
    frequency: 'Constant',
    notes: 'Patient notes no fever or dysuria.'
  },
  {
    id: 'lab_med_renal',
    name: '2. Lab & Medication Relevance (Kidney / Edema)',
    badge: 'Biomarker Connection',
    symptom: 'Noticeable swelling in both legs and ankles',
    description: 'Bilateral lower extremity edema that worsens toward evening. Socks leave deep impressions. No calf tenderness.',
    severity: 'moderate',
    frequency: 'Intermittent',
    notes: 'Active on Telmisartan and Amlodipine.'
  },
  {
    id: 'neuropathy_symptom',
    name: '3. Neurological Association (Neuropathy)',
    badge: 'Documented History',
    symptom: 'Pins and needles sensation with numbness in feet',
    description: 'Bilateral tingling and loss of fine sensation in toes, especially noticeable at rest in bed.',
    severity: 'mild',
    frequency: 'Intermittent',
    notes: 'Reported in December 2024; pending specialist follow-up.'
  },
  {
    id: 'emergency_red_flag',
    name: '4. Emergency Red-Flag (Chest Angina)',
    badge: 'Urgent Safety Trigger',
    symptom: 'Sudden crushing chest pressure radiating to left arm and jaw',
    description: 'Acute onset substernal heaviness accompanied by cold sweating and shortness of breath while seated.',
    severity: 'severe',
    frequency: 'Constant',
    notes: 'Prior history of coronary angiography showing mild LAD stenosis.'
  },
  {
    id: 'weak_indirect',
    name: '5. Weak / Indirect Relevance (Joints)',
    badge: 'Indirect Relevance',
    symptom: 'Mild morning stiffness in finger joints',
    description: 'Fingers feel stiff for about 10 minutes after waking. Loosens up with warm water.',
    severity: 'mild',
    frequency: 'Intermittent',
    notes: 'No prior rheumatologic history on file.'
  },
  {
    id: 'no_match',
    name: '6. No Matching History (Tinnitus)',
    badge: 'No Match Found',
    symptom: 'Ringing sound in left ear',
    description: 'High-pitched ringing in the left ear following loud environment exposure yesterday.',
    severity: 'mild',
    frequency: 'Constant',
    notes: 'No ENT disorders or acoustic trauma recorded.'
  }
];

// Helper to inspect doctor name
function getDocName(id: string): string {
  return demoDoctors.find(d => d.id === id)?.name || 'Physician';
}

/**
 * Evaluates text for emergency symptom red flags.
 */
export function evaluateSafetyFlags(symptomText: string, description: string): SafetyAlert {
  const combined = (symptomText + ' ' + description).toLowerCase();

  const emergencyPatterns = [
    /chest\s*(pressure|pain|crushing|tightness|heaviness)/i,
    /radiat(ing|es?)\s*(to|down)\s*(left\s*)?(arm|jaw|neck|back)/i,
    /shortness\s*of\s*breath.*(sudden|severe|crushing)/i,
    /sudden\s*(weakness|numbness|paralysis|droop)/i,
    /slurred\s*speech|inability\s*to\s*speak/i,
    /coughing\s*(up\s*)?blood/i,
    /loss\s*of\s*consciousness|fainted|passed\s*out/i
  ];

  for (const pattern of emergencyPatterns) {
    if (pattern.test(combined)) {
      return {
        isEmergency: true,
        urgencyLevel: 'emergency',
        alertTitle: 'POTENTIAL EMERGENCY MEDICAL SYMPTOM DETECTED',
        alertMessage:
          'Symptoms matching patterns of acute cardiopulmonary or neurological events (such as sudden crushing chest pressure, radiation to the arm/jaw, or acute shortness of breath) require immediate medical attention.',
        recommendedAction:
          'Immediately contact emergency services (dial 911 or local emergency dispatcher) or proceed to the nearest emergency department. Do not rely on this software for emergency diagnosis.'
      };
    }
  }

  // Moderate urgency: rapidly worsening fluid retention or severe acute distress
  const urgentPatterns = [
    /rapid\s*(weight\s*gain|swelling)/i,
    /severe\s*(headache|dizziness)/i,
    /blood\s*in\s*urine/i,
    /difficulty\s*breathing/i
  ];

  for (const pattern of urgentPatterns) {
    if (pattern.test(combined)) {
      return {
        isEmergency: false,
        urgencyLevel: 'urgent_clinical',
        alertTitle: 'Clinical Attention Recommended',
        alertMessage:
          'Your reported symptom pattern may warrant timely clinical review by your physician or on-call healthcare provider within 24 to 48 hours.',
        recommendedAction:
          'Contact your primary care physician, treating nephrologist, or urgent care facility to schedule an evaluation.'
      };
    }
  }

  return {
    isEmergency: false,
    urgencyLevel: 'routine_evaluation',
    alertTitle: 'Standard Decision-Support Overview',
    alertMessage:
      'Information retrieved from your historical records provides contextual background. It does not replace individualized clinical judgment.',
    recommendedAction:
      'Discuss these historical factors with your clinician at your next scheduled visit or if symptoms persist.'
  };
}

/**
 * Core Retrieval Engine:
 * Analyzes the new symptom, scans the synthetic longitudinal medical records,
 * and extracts relevant conditions, medications, tests, reports, and events.
 */
export function findRelevantHistory(
  symptomName: string,
  description: string,
  severity: 'mild' | 'moderate' | 'severe' = 'mild',
  onsetDate: string = new Date().toISOString().split('T')[0],
  frequency: string = 'Intermittent'
): SymptomRetrievalResult {
  const query = `${symptomName} ${description}`.toLowerCase();
  const safetyCheck = evaluateSafetyFlags(symptomName, description);

  // Define keyword clusters
  const isDiabetesRelated = /(thirst|polydipsia|urinat|polyuria|sugar|glucose|diabet|hba1c|sweet|fatigue|hunger|weight\s*loss|neuropath|numb|tingl)/i.test(query);
  const isRenalRelated = /(swell|edema|puff|ankle|leg|feet|fluid|water|creatinin|kidney|renal|flank|stone|gfr|protein|albumin)/i.test(query);
  const isCardioRelated = /(chest|angina|heart|pressure|hypertens|blood\s*pressure|systol|palpitat|dizzi|headache|cholesterol|lipid|lad|artery)/i.test(query);
  const isNeuropathyRelated = /(numb|tingl|burn|feet|toes|pin|needle|neuropath|sensat)/i.test(query);

  const matchedConditions: Condition[] = [];
  const matchedMedications: Medication[] = [];
  const matchedLabTests: LabTest[] = [];
  const matchedReports: Report[] = [];
  const matchedEvents: HealthEvent[] = [];
  const matchedPastSymptoms: Symptom[] = [];
  const matchedTrends: { parameter: string; latestValue: number; unit: string; trendDescription: string }[] = [];

  const evidenceChain: RetrievedEvidenceItem[] = [];
  const whyRetrievedBullets: string[] = [];
  const missingInformation: string[] = [];
  const clinicianDiscussionPoints: string[] = [];

  // 1. DIABETES CLUSTER
  if (isDiabetesRelated) {
    const c1 = demoConditions.find(c => c.id === 'c1');
    if (c1) {
      matchedConditions.push(c1);
      evidenceChain.push({
        id: 'ev-c1',
        category: 'documented_fact',
        entityType: 'condition',
        title: `${c1.name} (Diagnosed ${c1.diagnosedDate})`,
        date: c1.diagnosedDate,
        sourceReference: `Diagnosed by ${getDocName(c1.diagnosedBy)} • City Care Hospital`,
        findingSnippet: 'Documented Type 2 Diabetes on active management regimen.',
        confidence: 'high',
        relevanceRationale: 'Symptoms such as polyuria and polydipsia are classic clinical manifestations of glycemic fluctuation.'
      });
      whyRetrievedBullets.push(`Your records document a formal diagnosis of ${c1.name} (10 Mar 2019 by ${getDocName(c1.diagnosedBy)}).`);
      clinicianDiscussionPoints.push('Evaluate recent home blood glucose logs (fasting and post-prandial).');
    }

    // Related medications: Metformin, Glimepiride
    const meds = demoMedications.filter(m => m.relatedCondition === 'c1' && m.status === 'active');
    meds.forEach(m => {
      matchedMedications.push(m);
      evidenceChain.push({
        id: `ev-med-${m.id}`,
        category: 'possible_relevance',
        entityType: 'medication',
        title: `${m.name} ${m.dose} (${m.frequency})`,
        date: m.startDate,
        sourceReference: `Prescribed by ${getDocName(m.prescribedBy)} on ${m.startDate}`,
        findingSnippet: `Active anti-diabetic medication: ${m.dose} ${m.frequency} via ${m.route || 'Oral'}.`,
        confidence: 'high',
        relevanceRationale: 'Current pharmacotherapy for glycemic control; clinician may assess medication adherence or dosing.'
      });
      whyRetrievedBullets.push(`You are actively prescribed ${m.name} ${m.dose} (${m.frequency}) for diabetes management.`);
    });

    // Related lab trend: HbA1c
    const hba1cTrend = demoLabTrends.find(t => t.parameter === 'HbA1c');
    if (hba1cTrend) {
      const latest = hba1cTrend.data[hba1cTrend.data.length - 1];
      matchedTrends.push({
        parameter: 'HbA1c',
        latestValue: latest.value,
        unit: hba1cTrend.unit,
        trendDescription: `Latest recorded HbA1c is ${latest.value}% (${latest.date}). Prior initial diagnosis level was 8.1% (Mar 2019).`
      });
      evidenceChain.push({
        id: 'ev-trend-hba1c',
        category: 'documented_fact',
        entityType: 'lab_test',
        title: `HbA1c Biomarker Trend: ${latest.value}%`,
        date: latest.date,
        sourceReference: 'Report #RPT-9 (12 Aug 2026) • Central Diagnostics',
        reportId: 'rpt-9',
        findingSnippet: `HbA1c: ${latest.value}% (Normal reference range: 4.0 - 5.6%).`,
        confidence: 'high',
        relevanceRationale: 'HbA1c reflects 3-month average blood glucose control and provides baseline context for glycemic symptoms.'
      });
      whyRetrievedBullets.push(`Most recent HbA1c recorded on 12 Aug 2026 was ${latest.value}% (Ref: 4.0 - 5.6%).`);
      clinicianDiscussionPoints.push('Check whether updated HbA1c or continuous glucose monitoring is warranted.');
    }

    // Reports: rpt-1, rpt-5, rpt-9
    const diabeReports = demoReports.filter(r => ['rpt-1', 'rpt-5', 'rpt-9'].includes(r.id));
    diabeReports.forEach(r => {
      matchedReports.push(r);
      evidenceChain.push({
        id: `ev-rpt-${r.id}`,
        category: 'documented_fact',
        entityType: 'report',
        title: r.title,
        date: r.date,
        sourceReference: `${r.facility} • Dr. ${getDocName(r.doctor)}`,
        reportId: r.id,
        findingSnippet: r.findings.join('; '),
        confidence: 'high',
        relevanceRationale: 'Clinical report containing documented laboratory values relevant to diabetes.'
      });
    });

    // Timeline events
    const diabeEvents = demoHealthEvents.filter(e => ['e1', 'e2', 'e3', 'e10', 'e25'].includes(e.id));
    matchedEvents.push(...diabeEvents);

    missingInformation.push('No capillary blood glucose test recorded in the past 30 days.');
    missingInformation.push('No recent urine ketone assessment on file.');
  }

  // 2. RENAL & EDEMA CLUSTER
  if (isRenalRelated) {
    const c3 = demoConditions.find(c => c.id === 'c3');
    if (c3) {
      matchedConditions.push(c3);
      evidenceChain.push({
        id: 'ev-c3',
        category: 'documented_fact',
        entityType: 'condition',
        title: `${c3.name} (Diagnosed ${c3.diagnosedDate})`,
        date: c3.diagnosedDate,
        sourceReference: `Diagnosed by ${getDocName(c3.diagnosedBy)} • Kidney & Urology Institute`,
        findingSnippet: 'CKD Stage 2 monitored due to elevated creatinine and reduced filtration rate.',
        confidence: 'high',
        relevanceRationale: 'Reduced renal clearance can contribute to salt and water retention, potentially manifesting as peripheral edema.'
      });
      whyRetrievedBullets.push(`You have a documented diagnosis of ${c3.name} (20 Mar 2024 by ${getDocName(c3.diagnosedBy)}).`);
      clinicianDiscussionPoints.push('Review fluid balance, daily weights, and sodium intake with your nephrologist.');
    }

    const c4 = demoConditions.find(c => c.id === 'c4');
    if (c4) {
      matchedConditions.push(c4);
      evidenceChain.push({
        id: 'ev-c4',
        category: 'historical_association',
        entityType: 'condition',
        title: `${c4.name} (Resolved 2022)`,
        date: c4.diagnosedDate,
        sourceReference: 'City Hospital Urology Service',
        findingSnippet: 'Renal calculus treated with extracorporeal shock wave lithotripsy (ESWL) in Jul 2022; resolved on follow-up ultrasound.',
        confidence: 'medium',
        relevanceRationale: 'Prior urological history on the right kidney provides anatomical baseline context.'
      });
    }

    // Medications: Telmisartan, Amlodipine, Lisinopril
    const renalMeds = demoMedications.filter(m => ['m6', 'm3', 'm4'].includes(m.id));
    renalMeds.forEach(m => {
      matchedMedications.push(m);
      evidenceChain.push({
        id: `ev-med-${m.id}`,
        category: m.status === 'active' ? 'possible_relevance' : 'historical_association',
        entityType: 'medication',
        title: `${m.name} ${m.dose} (${m.status.toUpperCase()})`,
        date: m.startDate,
        sourceReference: `Prescribed by ${getDocName(m.prescribedBy)}`,
        findingSnippet: m.notes ? `${m.dose} • ${m.notes}` : `${m.dose} • ${m.frequency}`,
        confidence: 'high',
        relevanceRationale: m.name === 'Amlodipine'
          ? 'Calcium channel blockers like Amlodipine are known to sometimes induce dependent peripheral ankle edema.'
          : m.name === 'Telmisartan'
          ? 'Telmisartan was prescribed for renoprotection in CKD Stage 2.'
          : 'Lisinopril was previously discontinued in Sep 2024 and replaced by Telmisartan.'
      });
      if (m.status === 'active') {
        whyRetrievedBullets.push(`You are taking ${m.name} ${m.dose}, which may have physiological relevance to fluid balance.`);
      }
    });

    // Creatinine Trend
    const creatTrend = demoLabTrends.find(t => t.parameter === 'Creatinine');
    if (creatTrend) {
      const latest = creatTrend.data[creatTrend.data.length - 1];
      matchedTrends.push({
        parameter: 'Creatinine',
        latestValue: latest.value,
        unit: creatTrend.unit,
        trendDescription: `Creatinine increased from 1.0 mg/dL (Jun 2020) to ${latest.value} mg/dL (Aug 2026), sitting above standard reference ceiling (1.3 mg/dL).`
      });
      evidenceChain.push({
        id: 'ev-trend-creat',
        category: 'documented_fact',
        entityType: 'lab_test',
        title: `Serum Creatinine Trend: ${latest.value} mg/dL`,
        date: latest.date,
        sourceReference: 'Report #RPT-9 • Central Diagnostics',
        reportId: 'rpt-9',
        findingSnippet: `Creatinine: ${latest.value} mg/dL (Ref: 0.7 - 1.3 mg/dL). eGFR: ~56 mL/min.`,
        confidence: 'high',
        relevanceRationale: 'Elevated creatinine reflects mild reduction in glomerular filtration rate.'
      });
      whyRetrievedBullets.push(`Your latest recorded creatinine is ${latest.value} mg/dL on 12 Aug 2026 (above normal range 0.7 - 1.3 mg/dL).`);
      clinicianDiscussionPoints.push('Discuss repeat serum creatinine, eGFR, and spot urine albumin-to-creatinine ratio (uACR).');
    }

    // Past symptom: Swelling in ankles
    const s3 = demoSymptoms.find(s => s.id === 's3');
    if (s3) {
      matchedPastSymptoms.push(s3);
      evidenceChain.push({
        id: 'ev-s3',
        category: 'historical_association',
        entityType: 'symptom',
        title: `Prior Documented Symptom: ${s3.description}`,
        date: s3.reportedDate,
        sourceReference: 'Clinical Chart Note (20 Jul 2024)',
        findingSnippet: 'Moderate ankle edema previously reported and documented in patient timeline.',
        confidence: 'high',
        relevanceRationale: 'This establishes that lower limb swelling has occurred historically in your documented records.'
      });
      whyRetrievedBullets.push(`Similar symptom was previously documented on ${s3.reportedDate} (Ankle swelling).`);
    }

    // Reports: rpt-7, rpt-9, rpt-12
    const renalReports = demoReports.filter(r => ['rpt-7', 'rpt-9', 'rpt-12'].includes(r.id));
    renalReports.forEach(r => {
      matchedReports.push(r);
      evidenceChain.push({
        id: `ev-rpt-${r.id}`,
        category: 'documented_fact',
        entityType: 'report',
        title: r.title,
        date: r.date,
        sourceReference: `${r.facility} • ${getDocName(r.doctor)}`,
        reportId: r.id,
        findingSnippet: r.findings.join('; '),
        confidence: 'high',
        relevanceRationale: 'Documents renal laboratory measurements and consultation notes.'
      });
    });

    const renalEvents = demoHealthEvents.filter(e => ['e12', 'e13', 'e18', 'e19', 'e20', 'e25'].includes(e.id));
    matchedEvents.push(...renalEvents);

    missingInformation.push('No 24-hour urine protein or fractional sodium excretion measured recently.');
    missingInformation.push('No recent lower extremity venous duplex ultrasound on file.');
  }

  // 3. CARDIOVASCULAR & HYPERTENSION CLUSTER
  if (isCardioRelated) {
    const c2 = demoConditions.find(c => c.id === 'c2');
    if (c2) {
      matchedConditions.push(c2);
      evidenceChain.push({
        id: 'ev-c2',
        category: 'documented_fact',
        entityType: 'condition',
        title: `${c2.name} (Diagnosed ${c2.diagnosedDate})`,
        date: c2.diagnosedDate,
        sourceReference: `Diagnosed by ${getDocName(c2.diagnosedBy)} • Heart Care Center`,
        findingSnippet: 'Diagnosed with elevated systolic BP (152 mmHg). On antihypertensive therapy.',
        confidence: 'high',
        relevanceRationale: 'Cardiovascular history is a key determinant for chest, blood pressure, and vascular symptoms.'
      });
      whyRetrievedBullets.push(`You have a documented diagnosis of ${c2.name} (15 Jun 2020 by ${getDocName(c2.diagnosedBy)}).`);
    }

    // Procedure: Coronary Angiography
    const pr2 = demoHealthEvents.find(e => e.id === 'e17');
    if (pr2) {
      matchedEvents.push(pr2);
      evidenceChain.push({
        id: 'ev-pr2',
        category: 'historical_association',
        entityType: 'procedure',
        title: 'Coronary Angiography (10 Feb 2024)',
        date: '2024-02-10',
        sourceReference: 'Report #RPT-6 • Heart Care Center • Dr. Arvind Rao',
        reportId: 'rpt-6',
        findingSnippet: 'Mild stenosis (~30%) in mid-LAD. LVEF 55% (Normal). Managed medically without stenting.',
        confidence: 'high',
        relevanceRationale: 'Documented anatomical coronary status from prior evaluation for chest discomfort.'
      });
      whyRetrievedBullets.push('Underwent coronary angiography in Feb 2024 showing mild non-obstructive LAD stenosis.');
      clinicianDiscussionPoints.push('Compare current symptom characteristics with sensations experienced prior to Feb 2024 angiogram.');
    }

    // BP Trend & Cholesterol Trend
    const bpTrend = demoLabTrends.find(t => t.parameter === 'Systolic BP');
    if (bpTrend) {
      const latest = bpTrend.data[bpTrend.data.length - 1];
      matchedTrends.push({
        parameter: 'Systolic BP',
        latestValue: latest.value,
        unit: bpTrend.unit,
        trendDescription: `Systolic BP controlled at ${latest.value} mmHg (Aug 2026), improved from 152 mmHg initial diagnosis.`
      });
    }

    const cardioReports = demoReports.filter(r => ['rpt-2', 'rpt-6'].includes(r.id));
    cardioReports.forEach(r => matchedReports.push(r));
  }

  // 4. NEUROPATHY CLUSTER
  if (isNeuropathyRelated && !isDiabetesRelated) {
    const s4 = demoSymptoms.find(s => s.id === 's4');
    if (s4) {
      matchedPastSymptoms.push(s4);
      evidenceChain.push({
        id: 'ev-s4',
        category: 'historical_association',
        entityType: 'symptom',
        title: `Prior Documented Symptom: ${s4.description}`,
        date: s4.reportedDate,
        sourceReference: 'Report #RPT-10 (05 Dec 2024) • Dr. Meera Patel',
        reportId: 'rpt-10',
        findingSnippet: 'Bilateral numbness in toes/feet reported; monofilament exam noted reduced sensation; NCV study recommended.',
        confidence: 'high',
        relevanceRationale: 'Peripheral sensory disturbances in diabetic patients require ongoing tracking.'
      });
      whyRetrievedBullets.push(`Numbness in feet was previously reported on ${s4.reportedDate} and noted as investigating.`);
      clinicianDiscussionPoints.push('Inquire whether recommended nerve conduction study (NCV) was completed.');
    }
  }

  // 5. WEAK / INDIRECT MATCH (Joints / Aches / Stiffness without overt match)
  const isWeakJoints = /(joint|stiff|finger|wrist|knee|ache|muscl)/i.test(query);
  if (!isDiabetesRelated && !isRenalRelated && !isCardioRelated && isWeakJoints) {
    whyRetrievedBullets.push('No inflammatory arthropathy, rheumatoid arthritis, or gout is documented in your medical history.');
    missingInformation.push('No rheumatoid factor (RF), anti-CCP, or ESR/CRP inflammatory markers on file.');
    evidenceChain.push({
      id: 'ev-no-joint-hx',
      category: 'possible_relevance',
      entityType: 'condition',
      title: 'Absence of Documented Rheumatologic History',
      sourceReference: 'CareGraph Longitudinal Health Graph (2019-2026)',
      findingSnippet: 'No primary arthritis diagnoses recorded across 12 diagnostic reports and 25 timeline encounters.',
      confidence: 'medium',
      relevanceRationale: 'Absence of baseline joint disorder documentation is clinically informative for differential triage.'
    });
    clinicianDiscussionPoints.push('Discuss duration and symmetry of joint stiffness to determine whether basic inflammatory panels are warranted.');
  }

  // 6. ZERO MATCH (Unrelated symptom like tinnitus, ear ringing, etc.)
  const hasMatches =
    matchedConditions.length > 0 ||
    matchedMedications.length > 0 ||
    matchedTrends.length > 0 ||
    matchedPastSymptoms.length > 0;

  if (!hasMatches) {
    whyRetrievedBullets.push('No directly relevant information was found in the available history.');
    missingInformation.push('No audiology, ENT, or acoustic evaluation recorded in your synthetic records.');
    evidenceChain.push({
      id: 'ev-unmatched',
      category: 'missing_information',
      entityType: 'report',
      title: 'No Directly Relevant Historical Documentation',
      sourceReference: 'CareGraph Synthetic Patient Record Base',
      findingSnippet: 'Query terms did not intersect with documented diabetes, cardiovascular, renal, or procedural records.',
      confidence: 'high',
      relevanceRationale: 'Transparent absence of matching data prevents hallucinated or false-positive medical assertions.'
    });
    clinicianDiscussionPoints.push('Provide a fresh clinical description to an ENT or primary physician, as no prior baseline exists in file.');
  }

  // Construct structured non-diagnostic response
  let clinicalResponse = '';
  if (safetyCheck.isEmergency) {
    clinicalResponse = `CRITICAL ALERT: Your reported symptom ("${symptomName}") matches clinical red-flag patterns for acute medical emergencies. Immediately seek emergency medical attention (dial 911 or visit the nearest emergency department). Although your records document cardiovascular history (Hypertension, 2020; Coronary Angiography, 2024), this software does not diagnose or manage emergency conditions.`;
  } else if (!hasMatches) {
    clinicalResponse = `No directly relevant information was found in your available health records for "${symptomName}". Your documented profile primarily covers Type 2 Diabetes, Hypertension, and CKD Stage 2. Because this symptom does not match historical records, we recommend discussing it directly with a clinician for an independent clinical assessment.`;
  } else {
    const condNames = matchedConditions.map(c => c.name).join(', ');
    const medNames = matchedMedications.map(m => m.name).join(', ');
    const trendNames = matchedTrends.map(t => `${t.parameter} (latest: ${t.latestValue} ${t.unit})`).join(', ');

    clinicalResponse = `Some parts of your medical history may be relevant to this symptom ("${symptomName}"). Your records contain documented history of ${condNames || 'established health factors'}${medNames ? `, active prescriptions for ${medNames}` : ''}${trendNames ? `, and recent lab trends including ${trendNames}` : ''}. These documented factors may be useful context to discuss with your healthcare provider. This platform provides historical record synthesis and does not establish a medical diagnosis.`;
  }

  return {
    querySymptom: symptomName,
    description,
    severity,
    onsetDate,
    frequency,
    matchedEntities: {
      conditions: matchedConditions,
      medications: matchedMedications,
      labTests: matchedLabTests,
      reports: matchedReports,
      events: matchedEvents,
      pastSymptoms: matchedPastSymptoms,
      labTrends: matchedTrends
    },
    evidenceChain,
    safetyCheck,
    clinicalResponse,
    whyRetrievedBullets,
    missingInformation,
    clinicianDiscussionPoints
  };
}
