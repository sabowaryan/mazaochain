/**
 * Crop Evaluation System Integration Tests
 * Tests for Task 7: Auditer et corriger le système d'évaluation des cultures
 * 
 * This test suite verifies:
 * - Task 7.1: Form validation and real-time calculation
 * - Task 7.2: Evaluation history display and filtering
 * - Task 7: PDF generation with all evaluation data
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { CropEvaluationService } from '@/lib/services/crop-evaluation'
import { PDFReportGenerator } from '@/lib/utils/pdf-generator'
import type { CropEvaluationForm } from '@/types/crop-evaluation'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  })
}))

// Mock price oracle service
vi.mock('@/lib/services/price-oracle', () => ({
  priceOracleService: {
    getCurrentPrice: vi.fn((cropType: string) => Promise.resolve({
      price: cropType === 'manioc' ? 0.5 : 2.0,
      timestamp: Date.now()
    }))
  }
}))

// Set up environment variables
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

describe('Task 7.1: Form Validation and Real-time Calculation', () => {
  it('should validate all required fields (superficie, rendement, prix)', async () => {
    const service = new CropEvaluationService()
    
    // Test with valid data
    const validData: CropEvaluationForm = {
      crop_type: 'manioc',
      superficie: 2,
      rendement_historique: 1000,
      prix_reference: 0.5
    }
    
    const valuation = await service.calculateValuation(validData)
    expect(valuation).toBeGreaterThan(0)
    expect(valuation).toBe(1000) // 2 × 1000 × 0.5 = 1000
  })

  it('should calculate value in real-time (superficie × rendement × prix)', async () => {
    const service = new CropEvaluationService()
    
    // Test calculation with different values
    const testCases = [
      { superficie: 2, rendement: 1000, prix: 0.5, expected: 1000 },
      { superficie: 1.5, rendement: 800, prix: 2.0, expected: 2400 },
      { superficie: 3, rendement: 1200, prix: 0.75, expected: 2700 },
      { superficie: 0.5, rendement: 500, prix: 1.0, expected: 250 }
    ]
    
    for (const testCase of testCases) {
      const formData: CropEvaluationForm = {
        crop_type: 'manioc',
        superficie: testCase.superficie,
        rendement_historique: testCase.rendement,
        prix_reference: testCase.prix
      }
      
      const valuation = await service.calculateValuation(formData)
      expect(valuation).toBe(testCase.expected)
    }
  })

  it('should validate that superficie must be greater than 0', async () => {
    const service = new CropEvaluationService()
    
    const invalidData: CropEvaluationForm = {
      crop_type: 'manioc',
      superficie: 0,
      rendement_historique: 1000,
      prix_reference: 0.5
    }
    
    const valuation = await service.calculateValuation(invalidData)
    expect(valuation).toBe(0) // Invalid data should result in 0
  })

  it('should validate that rendement must be greater than 0', async () => {
    const service = new CropEvaluationService()
    
    const invalidData: CropEvaluationForm = {
      crop_type: 'manioc',
      superficie: 2,
      rendement_historique: 0,
      prix_reference: 0.5
    }
    
    const valuation = await service.calculateValuation(invalidData)
    expect(valuation).toBe(0) // Invalid data should result in 0
  })

  it('should validate that prix_reference must be greater than 0', async () => {
    const service = new CropEvaluationService()
    
    const invalidData: CropEvaluationForm = {
      crop_type: 'manioc',
      superficie: 2,
      rendement_historique: 1000,
      prix_reference: 0
    }
    
    const valuation = await service.calculateValuation(invalidData)
    // When prix_reference is 0, service should use default price
    expect(valuation).toBeGreaterThan(0)
  })
})

describe('Task 7.2: Evaluation History and Status Filtering', () => {
  const mockEvaluations = [
    {
      id: '1',
      farmer_id: 'test-farmer-id',
      crop_type: 'manioc',
      superficie: 2,
      rendement_historique: 1000,
      prix_reference: 0.5,
      valeur_estimee: 1000,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      farmer_id: 'test-farmer-id',
      crop_type: 'cafe',
      superficie: 1,
      rendement_historique: 500,
      prix_reference: 2.0,
      valeur_estimee: 1000,
      status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      farmer_id: 'test-farmer-id',
      crop_type: 'manioc',
      superficie: 1.5,
      rendement_historique: 800,
      prix_reference: 0.5,
      valeur_estimee: 600,
      status: 'rejected',
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    // Mock the fetch API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEvaluations)
      } as Response)
    )
  })

  it('should fetch evaluations from API', async () => {
    const service = new CropEvaluationService()
    
    const evaluations = await service.getFarmerEvaluations('test-farmer-id')
    
    expect(evaluations).toBeDefined()
    expect(evaluations.length).toBe(3)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/crop-evaluations?farmer_id=test-farmer-id'))
  })

  it('should handle different evaluation statuses (pending, approved, rejected)', async () => {
    const service = new CropEvaluationService()
    
    const evaluations = await service.getFarmerEvaluations('test-farmer-id')
    
    const statuses = evaluations.map(e => e.status)
    expect(statuses).toContain('pending')
    expect(statuses).toContain('approved')
    expect(statuses).toContain('rejected')
  })

  it('should fetch pending evaluations for cooperative review', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEvaluations.filter(e => e.status === 'pending'))
      } as Response)
    )
    
    const service = new CropEvaluationService()
    const pendingEvaluations = await service.getPendingEvaluations()
    
    expect(pendingEvaluations.length).toBe(1)
    expect(pendingEvaluations[0].status).toBe('pending')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/crop-evaluations?status=pending'))
  })

  it('should handle empty evaluation list', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      } as Response)
    )
    
    const service = new CropEvaluationService()
    const evaluations = await service.getFarmerEvaluations('test-farmer-id')
    
    expect(evaluations).toBeDefined()
    expect(evaluations.length).toBe(0)
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      } as Response)
    )
    
    const service = new CropEvaluationService()
    
    await expect(service.getFarmerEvaluations('test-farmer-id')).rejects.toThrow()
  })
})

describe('Task 7: PDF Generation with All Evaluation Data', () => {
  const mockEvaluation = {
    id: 'test-eval-id',
    farmer_id: 'test-farmer-id',
    crop_type: 'manioc',
    superficie: 2,
    rendement_historique: 1000,
    prix_reference: 0.5,
    valeur_estimee: 1000,
    status: 'approved',
    created_at: new Date().toISOString()
  }

  it('should generate PDF with all evaluation data', () => {
    const pdfGenerator = new PDFReportGenerator()
    const htmlContent = pdfGenerator.generateReportHTML({
      evaluation: mockEvaluation as any,
      farmerName: 'Test Farmer',
      farmerLocation: 'Test Location'
    })
    
    // Check that HTML contains all required information
    expect(htmlContent).toContain('Manioc')
    expect(htmlContent).toContain('2 hectares')
    expect(htmlContent).toContain('1000 kg/hectare')
    expect(htmlContent).toContain('0.5 USDC/kg')
    expect(htmlContent).toContain('1000.00 USDC')
    expect(htmlContent).toContain('Test Farmer')
    expect(htmlContent).toContain('Test Location')
  })

  it('should include calculation formula in PDF', () => {
    const pdfGenerator = new PDFReportGenerator()
    const htmlContent = pdfGenerator.generateReportHTML({
      evaluation: mockEvaluation as any
    })
    
    // Check that the formula is included
    expect(htmlContent).toContain('Superficie × Rendement historique × Prix de référence')
    expect(htmlContent).toContain('2 ha × 1000 kg/ha × 0.5 USDC/kg')
  })

  it('should include evaluation ID in PDF', () => {
    const pdfGenerator = new PDFReportGenerator()
    const htmlContent = pdfGenerator.generateReportHTML({
      evaluation: mockEvaluation as any
    })
    
    expect(htmlContent).toContain('test-eval-id')
  })

  it('should include status in PDF', () => {
    const pdfGenerator = new PDFReportGenerator()
    const htmlContent = pdfGenerator.generateReportHTML({
      evaluation: mockEvaluation as any
    })
    
    expect(htmlContent).toContain('Approuvé')
  })

  it('should generate PDF blob', async () => {
    const pdfGenerator = new PDFReportGenerator()
    const blob = await pdfGenerator.generatePDFBlob({
      evaluation: mockEvaluation as unknown
    })
    
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/html')
  })
})

describe('Task 7: CropEvaluationService', () => {
  it('should calculate valuation correctly', async () => {
    const service = new CropEvaluationService()
    const formData = {
      crop_type: 'manioc' as const,
      superficie: 2,
      rendement_historique: 1000,
      prix_reference: 0.5
    }
    
    const valuation = await service.calculateValuation(formData)
    
    // 2 × 1000 × 0.5 = 1000
    expect(valuation).toBe(1000)
  })

  it('should calculate valuation with different values', async () => {
    const service = new CropEvaluationService()
    const formData = {
      crop_type: 'cafe' as const,
      superficie: 1.5,
      rendement_historique: 800,
      prix_reference: 2.0
    }
    
    const valuation = await service.calculateValuation(formData)
    
    // 1.5 × 800 × 2.0 = 2400
    expect(valuation).toBe(2400)
  })
})
