export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface IBackendProvider {
  // Auth
  authenticate(username: string, password: string): Promise<ApiResponse<any>>;
  logout(sessionId: string): Promise<ApiResponse<void>>;
  
  // Patient
  getPatient(patientId: string): Promise<ApiResponse<any>>;
  getPatientRecords(patientId: string): Promise<ApiResponse<any>>;
  
  // Documents
  uploadDocument(patientId: string, document: any): Promise<ApiResponse<any>>;
  
  // Audit
  getAuditLog(filters?: any): Promise<ApiResponse<any[]>>;
}
