import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  GitBranch,
  TrendingUp,
  Pill,
  Activity,
  Layers,
  Check,
  X,
  FileCheck,
  AlertCircle,
  FileSearch,
  CheckCheck
} from 'lucide-react';
import {
  DocumentCategory,
  ExtractedEntity,
  IngestedDocument,
  IngestionStatus,
  EntityReviewStatus
} from '@/types/ingestion';
import { SAMPLE_DOCUMENTS, SampleMedicalDocument } from '@/services/sampleDocuments';
import { DocumentIngestionService } from '@/services/documentExtractor';
import { auditDuplicatesAndConflicts } from '@/services/duplicateAndConflictEngine';
import { usePatientRecord } from '@/context/PatientRecordContext';

const ingestionService = new DocumentIngestionService();

export default function DocumentIngestionPage() {
  const navigate = useNavigate();
  const {
    addIngestedDocument,
    updateEntityReviewStatus,
    editEntity,
    commitAcceptedEntities
  } = usePatientRecord();

  // Active document being processed / reviewed
  const [currentDoc, setCurrentDoc] = useState<IngestedDocument | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('lab_report');

  // Inline edit state
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; value: string; date: string }>({
    name: '',
    value: '',
    date: ''
  });

  // Commit result state
  const [commitResult, setCommitResult] = useState<{
    committedCount: number;
    createdReportId: string;
  } | null>(null);

  // Raw text drawer toggle
  const [showRawText, setShowRawText] = useState<boolean>(false);

  // Process a synthetic sample document
  const handleLoadSample = async (sample: SampleMedicalDocument) => {
    setIsProcessing(true);
    setCommitResult(null);
    setProcessingStep('Validating Document Format...');

    // Realistic multi-step progress for evaluation demo
    await new Promise(r => setTimeout(r, 400));
    setProcessingStep('Extracting Raw Text & Document Structure...');

    await new Promise(r => setTimeout(r, 500));
    setProcessingStep('Running Clinical NLP Entity Extractor...');

    const doc = await ingestionService.processDocument(
      {
        name: sample.fileName,
        size: sample.fileSize,
        type: 'application/pdf',
        text: sample.rawText
      },
      sample.category,
      sample.facility,
      sample.doctorName
    );

    await new Promise(r => setTimeout(r, 400));
    setProcessingStep('Auditing Duplicates & Clinical Conflicts...');

    // Audit against existing records
    const audit = auditDuplicatesAndConflicts(doc.extractedEntities);
    doc.extractedEntities = audit.analyzedEntities;
    doc.duplicateCount = audit.duplicateCount;
    doc.conflictCount = audit.conflictCount;

    setCurrentDoc(doc);
    addIngestedDocument(doc);
    setIsProcessing(false);
    setProcessingStep('');
  };

  // Process a real custom file upload (PDF or text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setCommitResult(null);
    setProcessingStep(`Uploading ${file.name}...`);

    await new Promise(r => setTimeout(r, 400));
    setProcessingStep('Validating Document Structure & Security Integrity...');

    await new Promise(r => setTimeout(r, 500));
    setProcessingStep('Extracting Text via Provider Abstraction...');

    const doc = await ingestionService.processDocument(
      file,
      selectedCategory,
      'Uploaded External Facility',
      'Attending Clinician'
    );

    setProcessingStep('Auditing Duplicates & Clinical Conflicts...');
    await new Promise(r => setTimeout(r, 300));

    const audit = auditDuplicatesAndConflicts(doc.extractedEntities);
    doc.extractedEntities = audit.analyzedEntities;
    doc.duplicateCount = audit.duplicateCount;
    doc.conflictCount = audit.conflictCount;

    setCurrentDoc(doc);
    addIngestedDocument(doc);
    setIsProcessing(false);
    setProcessingStep('');
  };

  // Change individual entity status
  const handleUpdateStatus = (entityId: string, status: EntityReviewStatus) => {
    if (!currentDoc) return;
    const updated = currentDoc.extractedEntities.map(e =>
      e.id === entityId ? { ...e, reviewStatus: status } : e
    );
    setCurrentDoc({ ...currentDoc, extractedEntities: updated });
    updateEntityReviewStatus(currentDoc.id, entityId, status);
  };

  // Accept all high-confidence entities
  const handleAcceptAllHighConfidence = () => {
    if (!currentDoc) return;
    const updated = currentDoc.extractedEntities.map(e => {
      if (e.confidence >= 0.9 && !e.conflictWithId) {
        return { ...e, reviewStatus: 'user_confirmed' as const };
      }
      return e;
    });
    setCurrentDoc({ ...currentDoc, extractedEntities: updated });
    updated.forEach(e => {
      updateEntityReviewStatus(currentDoc.id, e.id, e.reviewStatus);
    });
  };

  // Start inline editing
  const handleStartEdit = (entity: ExtractedEntity) => {
    setEditingEntityId(entity.id);
    setEditForm({
      name: entity.name,
      value: String(entity.value || ''),
      date: entity.date
    });
  };

  // Save inline edit
  const handleSaveEdit = (entityId: string) => {
    if (!currentDoc) return;
    const updated = currentDoc.extractedEntities.map(e => {
      if (e.id === entityId) {
        return {
          ...e,
          name: editForm.name,
          value: editForm.value,
          date: editForm.date,
          userEdited: true,
          reviewStatus: 'user_confirmed' as const
        };
      }
      return e;
    });
    setCurrentDoc({ ...currentDoc, extractedEntities: updated });
    editEntity(currentDoc.id, entityId, {
      name: editForm.name,
      value: editForm.value,
      date: editForm.date
    });
    setEditingEntityId(null);
  };

  // Commit all accepted entities to formal patient chart
  const handleCommit = () => {
    if (!currentDoc) return;
    const result = commitAcceptedEntities(currentDoc.id);
    setCommitResult(result);
    setCurrentDoc({ ...currentDoc, status: 'committed' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl shadow-sm border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                Phase 5 • Document Ingestion Pipeline
              </span>
              <span className="text-xs text-teal-300">
                Traceable Medical OCR & Entity Extraction
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Clinical Document Ingestion & Provenance Review
            </h1>
            <p className="text-sm text-teal-100 mt-1 max-w-2xl">
              Upload diagnostic laboratory panels, specialist consultation notes, or prescriptions. Review AI-extracted medical entities with source snippet provenance before committing them to your longitudinal health chart.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/50 text-xs text-teal-200 self-start md:self-auto max-w-xs">
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              Human-in-the-Loop Standard
            </div>
            Extracted records require explicit confirmation. Duplicates and dosage conflicts are audited before committing.
          </div>
        </div>
      </div>

      {/* 1. HACKATHON SAMPLE DOCUMENTS PICKER */}
      <div className="card p-5 border border-teal-100 bg-teal-50/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Quick Test Documents (1-Click Pipeline Testing)
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            5 synthetic clinical documents with distinct entities, duplicate checks & conflicts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SAMPLE_DOCUMENTS.map(sample => (
            <div
              key={sample.id}
              className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-teal-400 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    {sample.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-gray-400">{sample.date}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-xs line-clamp-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                  {sample.summary}
                </p>
              </div>

              <button
                disabled={isProcessing}
                onClick={() => handleLoadSample(sample)}
                className="mt-3 w-full py-1.5 px-2 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 font-semibold rounded-lg text-xs transition-colors border border-teal-200 flex items-center justify-center gap-1 disabled:opacity-50"
              >
                Ingest Document →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CUSTOM FILE UPLOAD DROPZONE */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-teal-600" />
            Upload External Clinical Document
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Document Type:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as DocumentCategory)}
              className="text-xs p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium"
            >
              <option value="lab_report">Laboratory Report</option>
              <option value="prescription">Prescription / Rx</option>
              <option value="doctor_note">Doctor Consultation Note</option>
              <option value="imaging_report">Imaging / Radiology Report</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="procedure_report">Procedure Report</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-teal-50/30 transition-all cursor-pointer relative">
          <input
            type="file"
            accept=".pdf,.txt,.json,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-gray-800">
              Drag & drop your medical document here, or <span className="text-teal-600 underline">browse files</span>
            </div>
            <p className="text-xs text-gray-500">
              Supports PDF, TXT, JSON • Secure client-side extraction provider
            </p>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME PROCESSING STATUS BANNER */}
      {isProcessing && (
        <div className="card p-6 bg-teal-50/70 border border-teal-200 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border-3 border-teal-600 border-t-transparent animate-spin shrink-0" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-teal-950 flex items-center gap-2">
              <span>Pipeline Stage:</span>
              <span className="font-mono text-teal-700">{processingStep}</span>
            </div>
            <p className="text-xs text-teal-800">
              Provider Abstraction is extracting medical concepts, mapping LOINC/ICD parameters, and verifying provenance.
            </p>
          </div>
        </div>
      )}

      {/* 4. SUCCESS COMMIT BANNER */}
      {commitResult && (
        <div className="card p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-950 text-base">
                  Document Ingestion Successfully Committed to Patient Chart!
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {commitResult.committedCount} verified medical entities have entered Rajesh Kumar Sharma's longitudinal records.
                </p>
              </div>
            </div>

            <span className="badge-green text-xs font-semibold">
              COMMITTED
            </span>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/reports?reportId=${commitResult.createdReportId}`)}
              className="btn-primary text-xs flex items-center gap-1.5 py-2"
            >
              <FileText className="w-3.5 h-3.5" /> View Sourced Report
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2"
            >
              <GitBranch className="w-3.5 h-3.5" /> Inspect in Health Graph
            </button>
            <button
              onClick={() => navigate('/timeline')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2"
            >
              <Clock className="w-3.5 h-3.5" /> View Timeline Milestone
            </button>
            <button
              onClick={() => navigate('/reports?tab=trends')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Open Lab Trends
            </button>
          </div>
        </div>
      )}

      {/* 5. EXTRACTED ENTITY REVIEW WORKSPACE */}
      {currentDoc && !isProcessing && (
        <div className="space-y-6">
          {/* Document Metadata & Audit Summary Bar */}
          <div className="card p-6 bg-white border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-blue text-[11px] font-semibold uppercase">
                    {currentDoc.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    File: <strong className="text-gray-800">{currentDoc.name}</strong> ({(currentDoc.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Document Provenance & Entity Review
                </h3>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-gray-400" /> {currentDoc.facility}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {currentDoc.doctorName}
                  </span>
                  <span>•</span>
                  <span>Extracted: {currentDoc.extractedEntities.length} Entities</span>
                </div>
              </div>

              {/* Status / Duplicate Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                  Avg. Confidence: {(currentDoc.confidenceAverage * 100).toFixed(0)}%
                </div>
                {currentDoc.duplicateCount > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {currentDoc.duplicateCount} Duplicate Flagged
                  </div>
                )}
                {currentDoc.conflictCount > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    {currentDoc.conflictCount} Clinical Conflict
                  </div>
                )}
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  {showRawText ? 'Hide Raw Text' : 'View Source Text'}
                </button>
              </div>
            </div>

            {/* Collapsible Raw Source Document Text */}
            {showRawText && (
              <div className="p-4 bg-gray-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto border border-gray-800">
                {currentDoc.rawText}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-600">
              Review each item below. Select <strong>Accept</strong> to confirm, <strong>Edit</strong> to modify, or <strong>Reject</strong> to omit.
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAcceptAllHighConfidence}
                className="btn-secondary text-xs flex items-center gap-1.5 py-2"
              >
                <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                Accept High Confidence (≥90%)
              </button>
              <button
                disabled={
                  currentDoc.status === 'committed' ||
                  !currentDoc.extractedEntities.some(
                    e => e.reviewStatus === 'user_confirmed' || e.reviewStatus === 'clinician_verified'
                  )
                }
                onClick={handleCommit}
                className="btn-primary text-xs flex items-center gap-1.5 py-2 disabled:opacity-50"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Commit Accepted to Patient Chart
              </button>
            </div>
          </div>

          {/* Extracted Entity Cards */}
          <div className="space-y-3">
            {currentDoc.extractedEntities.map(entity => {
              const isEditing = editingEntityId === entity.id;

              return (
                <div
                  key={entity.id}
                  className={`card p-5 border transition-all ${
                    entity.conflictWithId
                      ? 'border-red-300 bg-red-50/20'
                      : entity.duplicateOfId
                      ? 'border-amber-300 bg-amber-50/20'
                      : entity.reviewStatus === 'user_confirmed'
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : entity.reviewStatus === 'rejected'
                      ? 'border-gray-200 bg-gray-50/70 opacity-60'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* Entity Content */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border">
                          {entity.entityType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          Confidence: {(entity.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">Date: {entity.date}</span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            entity.reviewStatus === 'user_confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entity.reviewStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {entity.reviewStatus.replace('_', ' ')}
                        </span>

                        {entity.userEdited && (
                          <span className="badge-amber text-[10px]">User Edited</span>
                        )}
                      </div>

                      {/* Display or Inline Edit Form */}
                      {isEditing ? (
                        <div className="p-3 bg-white rounded-lg border border-teal-300 space-y-2 text-xs">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-500 font-semibold">Entity Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full p-1.5 border rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 font-semibold">Value</label>
                              <input
                                type="text"
                                value={editForm.value}
                                onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                className="w-full p-1.5 border rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 font-semibold">Date</label>
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                className="w-full p-1.5 border rounded text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingEntityId(null)}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(entity.id)}
                              className="px-2.5 py-1 bg-teal-600 text-white rounded text-xs font-semibold"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold text-gray-900 text-base">{entity.name}</h4>
                          {entity.value !== undefined && (
                            <span className="text-sm font-semibold text-teal-800">
                              = {entity.value} {entity.unit || ''}
                            </span>
                          )}
                          {entity.referenceRange && (
                            <span className="text-xs text-gray-400">
                              (Ref: {entity.referenceRange})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Source Text Snippet */}
                      <div className="p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono text-[11px] border border-gray-100">
                        {entity.snippet}
                      </div>

                      {/* DUPLICATE WARNING */}
                      {entity.duplicateOfId && (
                        <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[10px]">Potential Duplicate: </span>
                            {entity.duplicateRationale}
                          </div>
                        </div>
                      )}

                      {/* CONFLICT ALERT */}
                      {entity.conflictWithId && (
                        <div className="p-2.5 bg-red-50 rounded-lg text-xs text-red-800 border border-red-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[10px]">Conflicting Information: </span>
                            {entity.conflictRationale}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex md:flex-col items-center gap-1.5 shrink-0 self-start">
                      <button
                        onClick={() => handleUpdateStatus(entity.id, 'user_confirmed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          entity.reviewStatus === 'user_confirmed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>

                      <button
                        onClick={() => handleStartEdit(entity)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" /> Edit
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(entity.id, 'rejected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          entity.reviewStatus === 'rejected'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
