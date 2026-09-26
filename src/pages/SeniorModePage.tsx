import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Heart,
  Activity,
  FileText,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Printer,
  X,
  Stethoscope,
  Smile,
  ShieldAlert
} from 'lucide-react';
import { usePatientRecord } from '@/context/PatientRecordContext';
import { generateSeniorMedicineSchedulePDF } from '@/services/pdfGenerator';
import { demoDoctors } from '@/data/patient';

function formatDateReadable(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function SeniorModePage() {
  const navigate = useNavigate();
  const {
    patient,
    conditions,
    medications,
    labTrends,
    reports,
    ingestedDocuments
  } = usePatientRecord();

  // Active medications only for senior display
  const activeMeds = medications.filter(m => m.status === 'active');
  const recentReport = reports[0];

  // Printable medicine list modal
  const [showMedicineListModal, setShowMedicineListModal] = useState<boolean>(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<any | null>(null);

  // Plain-English medication explanations
  const getPlainMedReason = (medName: string): { why: string; when: string } => {
    const lower = medName.toLowerCase();
    if (lower.includes('metformin')) {
      return {
        why: 'Helps keep your blood sugar in a safe, healthy range.',
        when: 'Take twice a day — once with breakfast and once with dinner.'
      };
    } else if (lower.includes('glimepiride')) {
      return {
        why: 'Helps your body release insulin after meals.',
        when: 'Take once a day in the morning before your first meal.'
      };
    } else if (lower.includes('telmisartan')) {
      return {
        why: 'Protects your kidneys and keeps your blood pressure steady.',
        when: 'Take once a day in the morning with a glass of water.'
      };
    } else if (lower.includes('amlodipine')) {
      return {
        why: 'Relaxes your blood vessels to keep blood pressure normal.',
        when: 'Take once a day in the morning.'
      };
    } else if (lower.includes('atorvastatin') || lower.includes('rosuvastatin')) {
      return {
        why: 'Lowers cholesterol and keeps your heart and arteries healthy.',
        when: 'Take once a day at bedtime.'
      };
    }
    return {
      why: 'Prescribed by your doctor for your ongoing health care.',
      when: 'Take exactly as labeled on your bottle.'
    };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      {/* 1. SIMPLE, LARGE-FONT WELCOME HEADER */}
      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-sm font-bold tracking-wide">
              SENIOR & CAREGIVER VIEW
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Hello, {patient.name.split(' ')[0]}!
            </h1>
            <p className="text-lg text-gray-700 font-medium">
              Here is your easy-to-read health summary. Everything is up to date.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-center shadow-sm shrink-0">
            <div className="text-xs text-gray-500 font-semibold uppercase">Current Date</div>
            <div className="text-xl font-bold text-gray-900">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-1">✓ Records Verified</div>
          </div>
        </div>

        {/* Ingestion Notification in Plain Language */}
        {ingestedDocuments.length > 0 && (
          <div className="mt-5 p-4 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-950">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div className="text-base font-semibold">
              Good news: A new medical document was recently added to your file and confirmed by your care team.
            </div>
          </div>
        )}
      </div>

      {/* 2. IMPORTANT EMERGENCY SAFETY BOX (Clear & Calm) */}
      <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-950">
              When to Get Immediate Help
            </h2>
            <p className="text-base text-red-900 mt-0.5 leading-relaxed">
              If you feel sudden chest pain, trouble breathing, or feel very weak, call <strong>911</strong> or ask someone to take you to the hospital right away.
            </p>
          </div>
        </div>

        <a
          href="tel:911"
          className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl transition-colors shadow-md text-center shrink-0"
        >
          Call 911 for Help
        </a>
      </div>

      {/* 3. CAREGIVER QUICK-ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowMedicineListModal(true)}
          className="p-5 bg-white hover:bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-sm transition-all text-left group flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-800">
              Show My Medicine List
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Print or show this to your doctor
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <a
          href={`tel:${patient.emergencyContact.phone}`}
          className="p-5 bg-white hover:bg-blue-50 border-2 border-blue-300 rounded-3xl shadow-sm transition-all text-left group flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-800">
              Call {patient.emergencyContact.name}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {patient.emergencyContact.relationship} • {patient.emergencyContact.phone}
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </a>

        <a
          href="tel:1234567893"
          className="p-5 bg-white hover:bg-purple-50 border-2 border-purple-300 rounded-3xl shadow-sm transition-all text-left group flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-800">
              Call Dr. Rajan Mehta
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Your Primary Family Doctor
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* 4. MY MEDICINES (Big Readable Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              💊
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Medicines ({activeMeds.length} Active)
            </h2>
          </div>
          <span className="text-base text-gray-500 font-medium">
            Take only as prescribed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeMeds.map(med => {
            const { why, when } = getPlainMedReason(med.name);

            return (
              <div
                key={med.id}
                className="bg-white border-2 border-gray-200 hover:border-emerald-500 rounded-3xl p-6 shadow-sm space-y-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900">
                      {med.name}
                    </h3>
                    <div className="text-base font-bold text-emerald-800 mt-0.5">
                      Dose: {med.dose} ({med.route || 'By mouth'})
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-sm font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-2 text-base text-gray-800 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <strong className="text-gray-900">When to take: </strong>
                    {when}
                  </div>
                  <div>
                    <strong className="text-gray-900">Why you take it: </strong>
                    {why}
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-1 flex justify-between">
                  <span>Prescribed by: Dr. {demoDoctors.find(d => d.id === med.prescribedBy)?.name.replace('Dr. ', '') || 'Physician'}</span>
                  <span>Started: {formatDateReadable(med.startDate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MY RECENT TESTS (Simplified, Non-Diagnostic) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            🧪
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            My Recent Tests & Checks
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* HbA1c */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              Blood Sugar Average
            </span>
            <div className="text-3xl font-extrabold text-gray-900">
              6.6% <span className="text-sm font-normal text-gray-500">HbA1c</span>
            </div>
            <div className="text-sm text-gray-600">
              Last checked: <strong>18 September 2026</strong>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-xl text-xs text-blue-900 font-medium leading-relaxed">
              Your doctor can explain what this result means for you.
            </div>
          </div>

          {/* Creatinine */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
              Kidney Health Check
            </span>
            <div className="text-3xl font-extrabold text-gray-900">
              1.3 <span className="text-sm font-normal text-gray-500">mg/dL Creatinine</span>
            </div>
            <div className="text-sm text-gray-600">
              Last checked: <strong>18 September 2026</strong>
            </div>
            <div className="p-3 bg-teal-50/70 rounded-xl text-xs text-teal-900 font-medium leading-relaxed">
              Your doctor can explain what this result means for you.
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              Blood Pressure
            </span>
            <div className="text-3xl font-extrabold text-gray-900">
              128 / 82 <span className="text-sm font-normal text-gray-500">mmHg</span>
            </div>
            <div className="text-sm text-gray-600">
              Last checked: <strong>24 September 2026</strong>
            </div>
            <div className="p-3 bg-purple-50/70 rounded-xl text-xs text-purple-900 font-medium leading-relaxed">
              Your doctor can explain what this result means for you.
            </div>
          </div>
        </div>
      </div>

      {/* 6. MY DOCTORS (Your Care Team) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            👨‍⚕️
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            My Doctors & Care Team
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoDoctors.slice(0, 4).map(doc => (
            <div
              key={doc.id}
              className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-sm space-y-2"
            >
              <div className="font-extrabold text-gray-900 text-lg">
                {doc.name}
              </div>
              <div className="text-sm font-bold text-indigo-700">
                {doc.specialization}
              </div>
              <div className="text-xs text-gray-500">
                {doc.hospital}
              </div>
              <div className="pt-2 border-t text-xs text-gray-600">
                Last visit: {formatDateReadable(doc.lastVisit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. RECENT MEDICAL REPORTS (Simple View) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold">
              📄
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Recent Medical Reports
            </h2>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="text-base font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            See All Reports →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reports.slice(0, 3).map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedReportDetail(r)}
              className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-3xl p-5 shadow-sm cursor-pointer transition-colors space-y-2"
            >
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                {r.type === 'blood_test' ? 'Blood Test' : r.type === 'imaging' ? 'Imaging / Scan' : 'Doctor Note'}
              </span>
              <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                {r.title}
              </h3>
              <p className="text-xs text-gray-500">
                Date: {formatDateReadable(r.date)} • {r.facility}
              </p>
              <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                Tap to read details →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. DAILY FOOD & WATER HABITS */}
      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xl">
              🥗
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Daily Food & Water Habits
              </h2>
              <p className="text-sm text-gray-700">
                Easy guide for healthy meals and staying hydrated
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/nutrition')}
            className="px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors self-start sm:self-auto"
          >
            View Full Meal Diary →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-amber-200 space-y-2">
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">Water Intake</span>
            <div className="text-2xl font-extrabold text-gray-900">1.8 Liters</div>
            <p className="text-xs text-gray-600">
              Drink 8 to 10 glasses of clean water every day. Good hydration keeps your kidneys clean and prevents stones.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 space-y-2">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Balanced Meals</span>
            <div className="text-2xl font-extrabold text-gray-900">5 Small Meals</div>
            <p className="text-xs text-gray-600">
              Idli, dal, roti, vegetables, and chicken. Eating smaller meals on time keeps blood sugar steady.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 space-y-2">
            <span className="text-xs font-bold uppercase text-purple-800 tracking-wider">Salt & Sugar</span>
            <div className="text-2xl font-extrabold text-gray-900">Low & Controlled</div>
            <p className="text-xs text-gray-600">
              Keep salt low to protect your blood pressure. High-fiber foods like apples and green vegetables protect your heart.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: PRINTABLE / SHAREABLE MEDICINE LIST */}
      {showMedicineListModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 space-y-6 border-2 border-gray-300">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-sm font-bold uppercase text-emerald-700 tracking-wider">
                  PRINTABLE MEDICINE LIST
                </span>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                  {patient.name}'s Medicines
                </h3>
                <p className="text-sm text-gray-600">
                  Show this sheet to your doctor or pharmacist at your appointments.
                </p>
              </div>
              <button
                onClick={() => setShowMedicineListModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {activeMeds.map(m => (
                <div key={m.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">{m.name}</span>
                    <span className="text-base font-extrabold text-emerald-800">{m.dose}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Schedule: </strong> {m.frequency} ({m.route || 'Oral'})
                  </div>
                  <div className="text-xs text-gray-500">
                    Why: {getPlainMedReason(m.name).why}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-gray-500">
                Verified from CAREGRAPH records on {new Date().toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => generateSeniorMedicineSchedulePDF(patient.name, activeMeds)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-amber-600 text-white font-bold text-sm rounded-xl hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Download PDF Schedule
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-5 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  Print View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIMPLE REPORT DETAIL */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-4 border-2 border-gray-300">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-blue-700">
                  {selectedReportDetail.type.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                  {selectedReportDetail.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Date: {formatDateReadable(selectedReportDetail.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-sm text-gray-800 bg-gray-50 p-4 rounded-2xl border leading-relaxed">
              {selectedReportDetail.summary}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700 uppercase">Main Points:</div>
              {selectedReportDetail.findings.map((f: string, i: number) => (
                <div key={i} className="text-sm text-gray-800 flex items-start gap-2 bg-white p-2.5 rounded-xl border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
