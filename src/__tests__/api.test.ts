import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '@/services/api/apiClient';
import { MockBackendProvider } from '@/services/api/mockBackend';

describe('CAREGRAPH API Client & Backend Provider', () => {
  beforeEach(() => {
    apiClient.setProvider(new MockBackendProvider());
  });

  it('runs in demo mode by default', () => {
    expect(apiClient.mode).toBe('demo');
    expect(apiClient.getProvider().mode).toBe('demo');
  });

  it('provides synchronous initial bundle for immediate React hydration', () => {
    const bundle = apiClient.patient.getInitialBundle('p1');
    expect(bundle.patient.id).toBe('p1');
    expect(bundle.patient.name).toBe('Rajesh Kumar Sharma');
    expect(bundle.conditions.length).toBeGreaterThan(0);
    expect(bundle.medications.length).toBeGreaterThan(0);
    expect(bundle.labTrends.length).toBeGreaterThan(0);
    expect(bundle.doctors.length).toBeGreaterThan(0);
    expect(bundle.allergies.length).toBeGreaterThan(0);
    expect(bundle.healthGraph.nodes.length).toBeGreaterThan(0);
  });

  it('fetches patient records via async API call', async () => {
    const bundle = await apiClient.patient.getRecords('p1');
    expect(bundle.patient.id).toBe('p1');
    expect(bundle.conditions).toBeDefined();
    expect(bundle.reports).toBeDefined();
  });

  it('throws ApiError on non-existent patient', async () => {
    await expect(apiClient.patient.get('nonexistent-999')).rejects.toThrow();
  });

  it('authenticates demo accounts via API client', async () => {
    const user = await apiClient.auth.login({
      username: 'doctor.demo',
      password: 'demo123',
    });
    expect(user.role).toBe('DOCTOR');
    expect(user.displayName).toBe('Dr. Rajan Mehta');
  });

  it('fetches clinical entities via records namespace', async () => {
    const conditions = await apiClient.records.getConditions('p1');
    const medications = await apiClient.records.getMedications('p1');
    const doctors = await apiClient.records.getDoctors();
    const allergies = await apiClient.records.getAllergies('p1');

    expect(conditions.length).toBeGreaterThan(0);
    expect(medications.length).toBeGreaterThan(0);
    expect(doctors.length).toBeGreaterThan(0);
    expect(allergies.length).toBeGreaterThan(0);
  });

  it('resets patient state to baseline via API client', async () => {
    const bundle = await apiClient.patient.resetToBaseline('p1');
    expect(bundle.patient.id).toBe('p1');
    expect(bundle.ingestedDocuments).toHaveLength(0);
  });
});
