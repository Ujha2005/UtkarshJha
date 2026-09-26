// Duplicate & Conflict Detection Engine for Medical Records

import { ExtractedEntity } from '@/types/ingestion';
import {
  demoLabTrends,
  demoLabTests,
  demoConditions,
  demoMedications
} from '@/data/patient';

export interface AuditResult {
  analyzedEntities: ExtractedEntity[];
  duplicateCount: number;
  conflictCount: number;
}

/**
 * Scans an array of extracted entities against the existing patient record
 * and annotates entities with potential duplicates or clinical conflicts.
 */
export function auditDuplicatesAndConflicts(
  incomingEntities: ExtractedEntity[]
): AuditResult {
  let duplicateCount = 0;
  let conflictCount = 0;

  const analyzed = incomingEntities.map(entity => {
    const updated = { ...entity };

    // 1. AUDIT LAB RESULTS
    if (entity.entityType === 'lab_result') {
      const paramName = entity.name.toLowerCase();
      const matchedTrend = demoLabTrends.find(
        t => t.parameter.toLowerCase() === paramName ||
             t.parameter.toLowerCase().includes(paramName) ||
             paramName.includes(t.parameter.toLowerCase())
      );

      if (matchedTrend) {
        // Check for exact date match
        const exactDateMatch = matchedTrend.data.find(d => d.date === entity.date);

        if (exactDateMatch) {
          const numValue = typeof entity.value === 'number' ? entity.value : parseFloat(String(entity.value));
          if (!isNaN(numValue) && Math.abs(numValue - exactDateMatch.value) < 0.01) {
            // EXACT DUPLICATE
            updated.duplicateOfId = `trend-${matchedTrend.parameter}-${exactDateMatch.date}`;
            updated.duplicateRationale = `Exact duplicate detected: Existing record already contains ${matchedTrend.parameter} = ${exactDateMatch.value} ${matchedTrend.unit} on ${exactDateMatch.date}.`;
            duplicateCount++;
          } else if (!isNaN(numValue)) {
            // CONFLICTING VALUE ON SAME DATE
            updated.conflictWithId = `trend-${matchedTrend.parameter}-${exactDateMatch.date}`;
            updated.conflictRationale = `Clinical conflict: Existing record has ${matchedTrend.parameter} = ${exactDateMatch.value} ${matchedTrend.unit} on ${exactDateMatch.date}, but this document states ${numValue} ${entity.unit || matchedTrend.unit}.`;
            conflictCount++;
          }
        }
      }
    }

    // 2. AUDIT MEDICATIONS
    if (entity.entityType === 'medication') {
      const medName = entity.name.toLowerCase();
      const existingMed = demoMedications.find(
        m => m.name.toLowerCase() === medName
      );

      if (existingMed) {
        // Compare dosage
        const incomingDose = String(entity.value || '').toLowerCase().replace(/\s+/g, '');
        const existingDose = existingMed.dose.toLowerCase().replace(/\s+/g, '');

        if (incomingDose && existingDose && incomingDose === existingDose) {
          updated.duplicateOfId = existingMed.id;
          updated.duplicateRationale = `Duplicate regimen: Patient is already actively prescribed ${existingMed.name} ${existingMed.dose} (${existingMed.frequency}).`;
          duplicateCount++;
        } else if (incomingDose && existingDose && incomingDose !== existingDose) {
          updated.conflictWithId = existingMed.id;
          updated.conflictRationale = `Dosage conflict: Active patient chart records ${existingMed.name} at ${existingMed.dose}, while uploaded document specifies ${entity.value}. Review whether a dose adjustment occurred.`;
          conflictCount++;
        }
      }
    }

    // 3. AUDIT CONDITIONS / DIAGNOSES
    if (entity.entityType === 'condition') {
      const condName = entity.name.toLowerCase();
      const existingCond = demoConditions.find(
        c => c.name.toLowerCase().includes(condName) || condName.includes(c.name.toLowerCase())
      );

      if (existingCond) {
        updated.duplicateOfId = existingCond.id;
        updated.duplicateRationale = `Known diagnosis: ${existingCond.name} is already documented in patient history since ${existingCond.diagnosedDate}.`;
        duplicateCount++;
      }
    }

    return updated;
  });

  return {
    analyzedEntities: analyzed,
    duplicateCount,
    conflictCount
  };
}
