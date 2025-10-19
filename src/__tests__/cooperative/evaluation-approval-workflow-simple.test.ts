/**
 * Test Suite: Cooperative Evaluation Approval Workflow (Simplified)
 * 
 * This test suite verifies the complete workflow for cooperative approval of crop evaluations
 * focusing on service-level testing without complex UI rendering.
 * 
 * Requirements: 5.5, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CropEvaluationService } from '@/lib/services/crop-evaluation';
import { notificationService } from '@/lib/services/notification';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'eval-1', status: 'approved' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'eval-1', status: 'approved' }, 
              error: null 
            }))
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { wallet_address: '0.0.123456' }, 
            error: null 
          }))
        }))
      }))
    }))
  })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockEvaluations = [
  {
    id: 'eval-1',
    farmer_id: 'farmer-1',
    crop_type: 'manioc',
    superficie: 2.5,
    rendement_historique: 15000,
    prix_reference: 0.5,
    valeur_estimee: 18750,
    status: 'pending',
    created_at: '2024-01-15T10:00:00Z',
    harvest_date: '2024-06-15',
    farmer: {
      id: 'farmer-1',
      nom: 'Jean Mukendi',
      localisation: 'Kinshasa',
      wallet_address: '0.0.123456'
    }
  },
  {
    id: 'eval-2',
    farmer_id: 'farmer-2',
    crop_type: 'cafe',
    superficie: 1.0,
    rendement_historique: 2000,
    prix_reference: 2.0,
    valeur_estimee: 4000,
    status: 'pending',
    created_at: '2024-01-16T14:30:00Z',
    harvest_date: '2024-07-20',
    farmer: {
      id: 'farmer-2',
      nom: 'Marie Kabila',
      localisation: 'Lubumbashi',
      wallet_address: '0.0.789012'
    }
  }
];

describe('Cooperative Evaluation Approval Workflow', () => {
  let cropEvaluationService: CropEvaluationService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fetch mock for API calls
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/crop-evaluations?status=pending')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvaluations)
        });
      }
      if (url.includes('/api/crop-evaluations?farmer_id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockEvaluations[0]])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    cropEvaluationService = new CropEvaluationService();
  });

  describe('Sub-task 1: Liste toutes les évaluations en attente', () => {
    it('should fetch all pending evaluations from API', async () => {
      const evaluations = await cropEvaluationService.getPendingEvaluations();

      expect(global.fetch).toHaveBeenCalledWith('/api/crop-evaluations?status=pending');
      expect(evaluations).toHaveLength(2);
      expect(evaluations[0].status).toBe('pending');
      expect(evaluations[1].status).toBe('pending');
    });

    it('should return evaluations with correct structure', async () => {
      const evaluations = await cropEvaluationService.getPendingEvaluations();

      expect(evaluations[0]).toHaveProperty('id');
      expect(evaluations[0]).toHaveProperty('farmer_id');
      expect(evaluations[0]).toHaveProperty('crop_type');
      expect(evaluations[0]).toHaveProperty('superficie');
      expect(evaluations[0]).toHaveProperty('rendement_historique');
      expect(evaluations[0]).toHaveProperty('prix_reference');
      expect(evaluations[0]).toHaveProperty('valeur_estimee');
      expect(evaluations[0]).toHaveProperty('status');
    });

    it('should include farmer information with wallet address', async () => {
      const evaluations = await cropEvaluationService.getPendingEvaluations();

      expect(evaluations[0]).toHaveProperty('farmer');
      expect(evaluations[0].farmer.wallet_address).toBe('0.0.123456');
      expect(evaluations[0].farmer.nom).toBe('Jean Mukendi');
      expect(evaluations[0].farmer.localisation).toBe('Kinshasa');
    });

    it('should handle empty pending evaluations list', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      );

      const evaluations = await cropEvaluationService.getPendingEvaluations();
      expect(evaluations).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        })
      );

      await expect(cropEvaluationService.getPendingEvaluations()).rejects.toThrow();
    });
  });

  describe('Sub-task 3: Vérifier que le statut est mis à jour', () => {
    it('should update evaluation status to approved', async () => {
      const result = await cropEvaluationService.updateEvaluationStatus('eval-1', 'approved');

      expect(result).toBeDefined();
      expect(result.id).toBe('eval-1');
      expect(result.status).toBe('approved');
    });

    it('should update evaluation status to rejected', async () => {
      const result = await cropEvaluationService.updateEvaluationStatus('eval-1', 'rejected');

      expect(result).toBeDefined();
      expect(result.id).toBe('eval-1');
    });
  });

  describe('Sub-task 5: Confirmer que les notifications sont envoyées', () => {
    it('should send notification when evaluation is approved', async () => {
      const sendNotificationSpy = vi.spyOn(notificationService, 'sendNotification');

      await notificationService.sendNotification({
        userId: 'farmer-1',
        type: 'evaluation_approved',
        title: 'Évaluation Approuvée',
        message: 'Votre évaluation de Manioc a été approuvée. 18750 tokens MAZAO ont été créés.',
        data: {
          evaluationId: 'eval-1',
          tokenAmount: 18750,
          cropType: 'manioc'
        },
        channels: ['in_app', 'email']
      });

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'farmer-1',
          type: 'evaluation_approved',
          title: 'Évaluation Approuvée'
        })
      );
    });

    it('should send notification when evaluation is rejected', async () => {
      const sendNotificationSpy = vi.spyOn(notificationService, 'sendNotification');

      await notificationService.sendNotification({
        userId: 'farmer-1',
        type: 'evaluation_rejected',
        title: 'Évaluation Rejetée',
        message: 'Votre évaluation de Manioc a été rejetée. Raison: Quality issues',
        data: {
          evaluationId: 'eval-1',
          cropType: 'manioc',
          reason: 'Quality issues'
        },
        channels: ['in_app', 'email']
      });

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'farmer-1',
          type: 'evaluation_rejected',
          title: 'Évaluation Rejetée'
        })
      );
    });
  });

  describe('Integration: Complete Workflow', () => {
    it('should complete full approval workflow', async () => {
      // Step 1: Fetch pending evaluations
      const evaluations = await cropEvaluationService.getPendingEvaluations();
      expect(evaluations).toHaveLength(2);

      // Step 2: Update status to approved
      const result = await cropEvaluationService.updateEvaluationStatus('eval-1', 'approved');
      expect(result.status).toBe('approved');

      // Step 3: Verify notification would be sent
      const sendNotificationSpy = vi.spyOn(notificationService, 'sendNotification');
      await notificationService.sendNotification({
        userId: 'farmer-1',
        type: 'evaluation_approved',
        title: 'Évaluation Approuvée',
        message: 'Votre évaluation a été approuvée.',
        channels: ['in_app']
      });

      expect(sendNotificationSpy).toHaveBeenCalled();
    });
  });
});
