// Mock Backend Provider — Simulates server responses using local demo data.
// In production, this class would be replaced by a real HTTP backend client
// that communicates with a secured API server over TLS.

import { IBackendProvider, ApiResponse } from './apiTypes';
import {
  demoPatient,
  demoConditions,
  demoMedications,
  demoLabTests,
  demoHealthEvents,
} from '@/data/patient';
import { auditLog } from '../auditLog';

export class MockBackendProvider implements IBackendProvider {
  /** Simulates network latency for realistic demo behavior */
  private simulateDelay<T>(data: T, delay: number = 300): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
  }

  private successResponse<T>(data: T): ApiResponse<T> {
    return { success: true, data, statusCode: 200 };
  }

  // --- Auth ---
  public async authenticate(username: string, _password: string): Promise<ApiResponse<any>> {
    // In production: POST /api/auth/login with hashed credentials
    return this.simulateDelay(this.successResponse({
      id: 'usr-1',
      username,
      role: 'doctor',
      token: 'mock-jwt-token-not-real',
    }), 400);
  }

  public async logout(_sessionId: string): Promise<ApiResponse<void>> {
    // In production: POST /api/auth/logout to invalidate server-side session
    return this.simulateDelay(this.successResponse(undefined), 200);
  }

  // --- Patient ---
  public async getPatient(patientId: string): Promise<ApiResponse<any>> {
    // In production: GET /api/patients/:id with authorization header
    if (patientId === demoPatient.id || patientId === 'p1') {
      return this.simulateDelay(this.successResponse(demoPatient));
    }
    return this.simulateDelay({ success: false, error: 'Patient not found', statusCode: 404 }, 200);
  }

  public async getPatientRecords(patientId: string): Promise<ApiResponse<any>> {
    // In production: GET /api/patients/:id/records with RBAC check
    if (patientId === demoPatient.id || patientId === 'p1') {
      return this.simulateDelay(this.successResponse({
        conditions: demoConditions,
        medications: demoMedications,
        labResults: demoLabTests,
        healthEvents: demoHealthEvents,
      }));
    }
    return this.simulateDelay({ success: false, error: 'Patient not found', statusCode: 404 }, 200);
  }

  // --- Documents ---
  public async uploadDocument(_patientId: string, _document: any): Promise<ApiResponse<any>> {
    // In production: POST /api/documents/upload with multipart form data
    return this.simulateDelay(this.successResponse({
      documentId: 'doc-' + crypto.randomUUID(),
      status: 'processed',
    }), 500);
  }

  // --- Audit ---
  public async getAuditLog(filters?: any): Promise<ApiResponse<any[]>> {
    // In production: GET /api/audit with admin-only authorization
    const logs = auditLog.getAuditLog(filters);
    return this.simulateDelay(this.successResponse(logs), 200);
  }
}
