import { IBackendProvider } from './apiTypes';
import { MockBackendProvider } from './mockBackend';

// Uses MockBackendProvider by default
// Could be swapped for production HTTP client
class ApiClient {
  private provider: IBackendProvider;

  constructor(provider: IBackendProvider) {
    this.provider = provider;
  }

  get auth() {
    return {
      login: (username: string, password: string) => this.provider.authenticate(username, password),
      logout: (sessionId: string) => this.provider.logout(sessionId)
    };
  }

  get patient() {
    return {
      get: (patientId: string) => this.provider.getPatient(patientId),
      getRecords: (patientId: string) => this.provider.getPatientRecords(patientId)
    };
  }

  get documents() {
    return {
      upload: (patientId: string, document: any) => this.provider.uploadDocument(patientId, document)
    };
  }

  get audit() {
    return {
      getLogs: (filters?: any) => this.provider.getAuditLog(filters)
    };
  }
}

export const apiClient = new ApiClient(new MockBackendProvider());
