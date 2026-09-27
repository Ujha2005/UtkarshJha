# CAREGRAPH — FHIR R4 Interoperability Architecture

> **Notice**:
> - `[IMPLEMENTED]`: Bidirectional conversion functions in `src/services/api/mappers/fhirMapper.ts` and automated unit tests in `src/__tests__/fhirMapper.test.ts`
> - `[REQUIRES PRODUCTION BACKEND]`: Live FHIR REST server endpoint (`/fhir/r4/Patient`, etc.) with SMART on FHIR OAuth 2.0 authorization

---

## 1. Interoperability Goal

CAREGRAPH’s internal data structures are optimized for reactive user interfaces, timeline visualizers, and health relationship graph networks. To enable seamless interoperability with institutional Electronic Health Record (EHR) systems (such as Epic, Cerner, or Ayushman Bharat Digital Mission / ABDM), CAREGRAPH implements an explicit bidirectional mapping layer adhering to **HL7 FHIR Release 4**.

```
+---------------------------+        +---------------------------+        +--------------------------+
|  CAREGRAPH Internal Model | <----> | src/services/api/mappers/ | <----> | External FHIR R4 Server  |
|  (UI & Graph Optimized)   |        | fhirMapper.ts             |        | (Epic, Cerner, ABDM)    |
+---------------------------+        +---------------------------+        +--------------------------+
```

---

## 2. Resource Mapping Dictionary

### 2.1 Patient Resource [IMPLEMENTED]
- **Internal**: `Patient` (`id`, `name`, `dateOfBirth`, `gender`, `emergencyContact`, `primaryDoctor`)
- **FHIR**: `Patient`
- **Mapping Specifications**:
  - `Patient.id` -> `Patient.id`
  - `Patient.name` -> `Patient.name[0].text`, split into `family` and `given`
  - `Patient.gender` -> `Patient.gender` (`male`, `female`, `other`)
  - `Patient.dateOfBirth` -> `Patient.birthDate`
  - `Patient.emergencyContact` -> `Patient.contact[0]` with `relationship`
  - `Patient.primaryDoctor` -> `Patient.generalPractitioner[0].reference = "Practitioner/{id}"`

### 2.2 Condition Resource [IMPLEMENTED]
- **Internal**: `Condition` (`id`, `name`, `diagnosedDate`, `status`, `severity`, `diagnosedBy`, `notes`)
- **FHIR**: `Condition`
- **Mapping Specifications**:
  - `Condition.status` -> `Condition.clinicalStatus.coding` (system: `http://terminology.hl7.org/CodeSystem/condition-clinical`, code: `active` or `resolved`)
  - `Condition.severity` -> `Condition.severity.coding` (system: `http://snomed.info/sct`, codes: `255604002` [mild], `6736007` [moderate], `24484000` [severe])
  - `Condition.diagnosedBy` -> `Condition.recorder.reference = "Practitioner/{id}"`
  - `Condition.notes` -> `Condition.note[0].text`

### 2.3 Lab Observation Resource [IMPLEMENTED]
- **Internal**: `LabResult` within `LabTest` (`parameter`, `value`, `unit`, `referenceRange`, `status`)
- **FHIR**: `Observation`
- **Mapping Specifications**:
  - `LabResult.parameter` -> `Observation.code.text`
  - `LabResult.value` & `unit` -> `Observation.valueQuantity` (system: `http://unitsofmeasure.org`)
  - `LabResult.referenceRange` -> `Observation.referenceRange[0].text`
  - `LabResult.status` -> `Observation.interpretation[0].coding` (`N` [normal], `L` [low], `H` [high], `A` [critical])
  - Category tagged with `http://terminology.hl7.org/CodeSystem/observation-category` = `laboratory`

### 2.4 Medication Resource [IMPLEMENTED]
- **Internal**: `Medication` (`id`, `name`, `dose`, `frequency`, `route`, `startDate`, `status`)
- **FHIR**: `MedicationRequest` / `MedicationStatement`
- **Mapping Specifications**:
  - `Medication.name` -> `MedicationRequest.medicationCodeableConcept.text`
  - `Medication.status` -> `MedicationRequest.status` (`active`, `completed`, `stopped`)
  - `Medication.dose` & `frequency` -> `MedicationRequest.dosageInstruction[0].text`
  - `Medication.route` -> `MedicationRequest.dosageInstruction[0].route.text`
  - `Medication.prescribedBy` -> `MedicationRequest.requester.reference = "Practitioner/{id}"`

### 2.5 DiagnosticReport Resource [IMPLEMENTED]
- **Internal**: `Report` (`id`, `title`, `date`, `type`, `summary`, `findings`, `facility`)
- **FHIR**: `DiagnosticReport`
- **Mapping Specifications**:
  - `Report.title` -> `DiagnosticReport.code.text`
  - `Report.date` -> `DiagnosticReport.effectiveDateTime`
  - `Report.summary` & `findings` -> `DiagnosticReport.conclusion`
  - `Report.facility` -> `DiagnosticReport.performer[0].display`

### 2.6 DocumentReference Resource [IMPLEMENTED]
- **Internal**: `IngestedDocument` (`id`, `name`, `fileSize`, `fileType`, `uploadedAt`, `category`)
- **FHIR**: `DocumentReference`
- **Mapping Specifications**:
  - `IngestedDocument.id` -> `DocumentReference.id`
  - `IngestedDocument.fileType` -> `DocumentReference.content[0].attachment.contentType`
  - `IngestedDocument.name` -> `DocumentReference.content[0].attachment.title`
  - `IngestedDocument.category` -> `DocumentReference.type.text`

### 2.7 AllergyIntolerance Resource [IMPLEMENTED]
- **Internal**: `Allergy` (`id`, `allergen`, `reaction`, `severity`, `diagnosedDate`)
- **FHIR**: `AllergyIntolerance`
- **Mapping Specifications**:
  - `Allergy.allergen` -> `AllergyIntolerance.code.text`
  - `Allergy.reaction` -> `AllergyIntolerance.reaction[0].manifest[0].text`
  - `Allergy.severity` -> `AllergyIntolerance.criticality` (`low`, `high`)
  - `Allergy.diagnosedDate` -> `AllergyIntolerance.recordedDate`

---

## 3. Production Deployment Plan [REQUIRES PRODUCTION BACKEND]

In a production environment:
1. **SMART on FHIR Gateway**: Deployed as an API route exposing OAuth 2.0 endpoints with scope-based authorization (e.g. `patient/*.read`, `launch/patient`).
2. **FHIR Bundle Export**: Bulk FHIR ($export) protocol allowing patients to transfer their complete medical history into any certified personal health app.
