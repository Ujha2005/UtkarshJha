// Professional Medical Summary PDF Generator for CareGraph
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DoctorSummaryObject } from '@/pages/DoctorModePage';
import type { Medication } from '@/types';

export function generateDoctorSummaryPDF(summary: DoctorSummaryObject): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // --- HEADER SECTION ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CAREGRAPH', margin + 6, currentY + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('LONGITUDINAL HEALTH RECORD & CLINICAL RECONCILIATION SUMMARY', margin + 6, currentY + 16);

  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFontSize(8);
  const genDateStr = `Generated: ${new Date(summary.generatedAt).toLocaleString('en-IN')}`;
  doc.text(genDateStr, pageWidth - margin - 6 - doc.getTextWidth(genDateStr), currentY + 9);

  const statusStr = 'SYNTHETIC DEMO RECORD';
  doc.setTextColor(251, 191, 36); // amber-400
  doc.setFont('helvetica', 'bold');
  doc.text(statusStr, pageWidth - margin - 6 - doc.getTextWidth(statusStr), currentY + 16);

  currentY += 26;

  // --- SYNTHETIC DISCLAIMER BANNER ---
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'FD');

  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const disclaimerText = 'DECISION SUPPORT ONLY — All patient data shown is synthetic and created for evaluation/demonstration. Not a diagnosis.';
  doc.text(disclaimerText, margin + 4, currentY + 5.5);

  currentY += 12;

  // --- PATIENT DEMOGRAPHICS CARD ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(summary.patient.name, margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Age / Gender: ${summary.patient.age} Y / ${summary.patient.gender}`, margin + 5, currentY + 11);
  doc.text(`Blood Group: ${summary.patient.bloodGroup}`, margin + 5, currentY + 16);

  doc.text(`Patient ID: ${summary.patient.id}`, margin + 65, currentY + 6);
  doc.text(`Phone: ${summary.patient.phone}`, margin + 65, currentY + 11);
  doc.text(`Primary Doctor: ${summary.patient.primaryDoctor === 'd1' ? 'Dr. Sarah Jenkins' : 'Dr. Attending'}`, margin + 65, currentY + 16);

  doc.text(`Emergency: ${summary.patient.emergencyContact.name} (${summary.patient.emergencyContact.relationship})`, margin + 120, currentY + 11);
  doc.text(`Contact: ${summary.patient.emergencyContact.phone}`, margin + 120, currentY + 16);

  currentY += 24;

  // --- DOCUMENTED ALLERGIES & ADVERSE REACTIONS ---
  if (summary.allergies && summary.allergies.length > 0) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(239, 68, 68); // red-500
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 1.5, 1.5, 'FD');

    doc.setTextColor(185, 28, 28); // red-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DOCUMENTED DRUG ALLERGIES & CONTRAINDICATIONS:', margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29); // red-900
    const allergyList = summary.allergies
      .map(a => `${a.allergen.toUpperCase()}: ${a.reaction} (${a.severity.toUpperCase()} severity)`)
      .join('  |  ');
    doc.text(allergyList, margin + 4, currentY + 9.5);

    currentY += 16;
  }

  // --- CLINICAL CONFLICTS / SAFETY FLAGS ---
  if (summary.clinicalConflicts && summary.clinicalConflicts.length > 0) {
    doc.setFillColor(255, 241, 242); // rose-50
    doc.setDrawColor(225, 29, 72); // rose-600
    doc.setLineWidth(0.4);
    const boxHeight = 6 + summary.clinicalConflicts.length * 4.5;
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxHeight, 1.5, 1.5, 'FD');

    doc.setTextColor(159, 18, 57); // rose-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PHARMACOTHERAPY SAFETY & RECONCILIATION ALERTS:', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(136, 19, 55);
    summary.clinicalConflicts.forEach((conflict, idx) => {
      doc.text(`* ${conflict}`, margin + 6, currentY + 9 + idx * 4.5);
    });

    currentY += boxHeight + 4;
  }

  // --- ACTIVE CLINICAL DIAGNOSES TABLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. Longitudinal Diagnoses & Chronic Conditions', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Condition / Diagnosis', 'Diagnosed Date', 'Severity', 'Clinical Status', 'Attending Specialist']],
    body: summary.activeConditions.map(c => [
      c.name,
      c.diagnosedDate,
      c.severity.toUpperCase(),
      c.status.toUpperCase(),
      c.diagnosedBy === 'd1' ? 'Dr. Sarah Jenkins' : c.diagnosedBy === 'd2' ? 'Dr. Arvind Rao' : 'Specialist'
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // --- CURRENT MEDICATIONS TABLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. Active Pharmacotherapy (Medication Reconciliation)', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Medication Name', 'Dosage', 'Frequency', 'Route', 'Initiation Date', 'Clinical Indication', 'Status']],
    body: summary.currentMedications.map(m => [
      m.name,
      m.dose,
      m.frequency,
      m.route || 'Oral',
      m.startDate,
      m.relatedCondition ? m.relatedCondition.toUpperCase() : 'General',
      m.status.toUpperCase()
    ]),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' }, // teal-700
    alternateRowStyles: { fillColor: [240, 253, 250] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Check if we need a new page for Biomarkers
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 16;
  }

  // --- RECENT BIOMARKERS & LAB TRENDS TABLE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. Longitudinal Biomarkers & Laboratory Trajectory', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Biomarker Parameter', 'Latest Result', 'Unit', 'Measured Date', 'Reference Interval', 'Trajectory / Longitudinal Note']],
    body: summary.recentBiomarkers.map(b => [
      b.parameter,
      String(b.latest),
      b.unit,
      b.date,
      b.refRange,
      b.trendNote
    ]),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' }, // blue-900
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Check if we need a new page for Reports & Milestones
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  // --- RECENT REPORTS & SOURCED EVIDENCE ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('4. Recent Clinical Encounters & Sourced Diagnostic Reports', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Report Title', 'Date', 'Type', 'Facility', 'Key Documented Findings']],
    body: summary.recentReports.map(r => [
      r.title,
      r.date,
      r.type.toUpperCase(),
      r.facility,
      r.findings.slice(0, 2).join('; ')
    ]),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' }, // slate-600
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin }
  });

  // --- ADD PAGE NUMBERS AND FOOTER TO ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('CareGraph Privacy-Conscious Longitudinal Health Record Platform • Demo Evaluation', margin, pageHeight - 7);

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  }

  // Save the PDF
  const sanitizedName = summary.patient.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`CareGraph_Clinical_Summary_${sanitizedName}_${dateStr}.pdf`);
}

export function generateSeniorMedicineSchedulePDF(patientName: string, medications: Medication[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let currentY = 16;

  // Header
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(margin, currentY, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DAILY MEDICINE SCHEDULE', margin + 6, currentY + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient: ${patientName} • Keep this near your medicine box`, margin + 6, currentY + 16);

  currentY += 28;

  // Friendly Note
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Important Friendly Advice:', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Take your medicines with a glass of water at the times listed below. Do not skip doses without doctor guidance.', margin + 4, currentY + 10);

  currentY += 20;

  // Table with large readable font
  autoTable(doc, {
    startY: currentY,
    head: [['Medicine Name', 'How Much', 'When to Take', 'Why You Take It']],
    body: medications.filter(m => m.status === 'active').map(m => {
      let why = 'For overall health';
      let when = 'Morning with meal';
      const lower = m.name.toLowerCase();
      if (lower.includes('metformin')) {
        why = 'Keeps blood sugar balanced';
        when = 'Morning & Night after meals';
      } else if (lower.includes('telmisartan')) {
        why = 'Maintains blood pressure & kidney health';
        when = 'Every morning with breakfast';
      } else if (lower.includes('atorvastatin') || lower.includes('rosuvastatin')) {
        why = 'Protects heart & balances cholesterol';
        when = 'At bedtime';
      } else if (lower.includes('aspirin')) {
        why = 'Keeps blood flowing smoothly';
        when = 'Morning after food';
      }
      return [m.name, m.dose, when, why];
    }),
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: margin, right: margin }
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('CareGraph Senior Care • Synthetic Demonstration Schedule', margin, pageHeight - 10);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Medicine_Schedule_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.pdf`);
}
