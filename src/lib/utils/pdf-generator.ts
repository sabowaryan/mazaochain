import type { Tables } from '@/lib/supabase/database.types'
import { CROP_TYPES } from '@/types/crop-evaluation'

export interface PDFReportData {
  evaluation: Tables<'crop_evaluations'>
  farmerName?: string
  farmerLocation?: string
}

/**
 * Generate PDF report content for crop evaluation
 * This is a simplified implementation that generates HTML content
 * In a production environment, you would use a proper PDF library like jsPDF or Puppeteer
 */
export class PDFReportGenerator {
  
  /**
   * Generate HTML content for the PDF report
   */
  generateReportHTML(data: PDFReportData): string {
    const { evaluation, farmerName, farmerLocation } = data
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const evaluationDate = evaluation.created_at 
      ? new Date(evaluation.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : currentDate

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'Évaluation de Récolte - ${evaluation.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 20px;
            margin: 10px 0;
          }
          .report-id {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            display: block;
            margin-bottom: 5px;
          }
          .info-value {
            color: #1f2937;
          }
          .calculation-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .calculation-title {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
          }
          .calculation-formula {
            font-family: monospace;
            background-color: #white;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            border: 1px solid #d1d5db;
          }
          .result {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            text-align: center;
            padding: 15px;
            background-color: #ecfdf5;
            border-radius: 8px;
            margin: 20px 0;
          }
          .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-approved {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">MazaoChain</div>
          <div class="report-title">Rapport d'Évaluation de Récolte</div>
          <div class="report-id">ID: ${evaluation.id}</div>
        </div>

        <div class="section">
          <div class="section-title">Informations Générales</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Date d'évaluation:</span>
              <span class="info-value">${evaluationDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Statut:</span>
              <span class="status status-${evaluation.status || 'pending'}">
                ${evaluation.status === 'approved' ? 'Approuvé' : 
                  evaluation.status === 'rejected' ? 'Rejeté' : 'En attente'}
              </span>
            </div>
            ${farmerName ? `
            <div class="info-item">
              <span class="info-label">Agriculteur:</span>
              <span class="info-value">${farmerName}</span>
            </div>
            ` : ''}
            ${farmerLocation ? `
            <div class="info-item">
              <span class="info-label">Localisation:</span>
              <span class="info-value">${farmerLocation}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détails de la Récolte</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Type de culture:</span>
              <span class="info-value">${CROP_TYPES[evaluation.crop_type as keyof typeof CROP_TYPES]}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Superficie:</span>
              <span class="info-value">${evaluation.superficie} hectares</span>
            </div>
            <div class="info-item">
              <span class="info-label">Rendement historique:</span>
              <span class="info-value">${evaluation.rendement_historique} kg/hectare</span>
            </div>
            <div class="info-item">
              <span class="info-label">Prix de référence:</span>
              <span class="info-value">${evaluation.prix_reference} USDC/kg</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Calcul de la Valeur</div>
          <div class="calculation-box">
            <div class="calculation-title">Formule de calcul:</div>
            <div class="calculation-formula">
              Valeur estimée = Superficie × Rendement historique × Prix de référence
            </div>
            <div class="calculation-formula">
              Valeur estimée = ${evaluation.superficie} ha × ${evaluation.rendement_historique} kg/ha × ${evaluation.prix_reference} USDC/kg
            </div>
            <div class="result">
              Valeur estimée: ${evaluation.valeur_estimee.toFixed(2)} USDC
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Ce rapport a été généré automatiquement par MazaoChain le ${currentDate}</p>
          <p>Plateforme de prêts décentralisés basée sur la tokenisation des récoltes</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate and download PDF report
   * In a real implementation, this would use a proper PDF library
   */
  async generateAndDownloadPDF(data: PDFReportData): Promise<void> {
    const htmlContent = this.generateReportHTML(data)
    
    // Create a new window with the HTML content for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  /**
   * Get PDF content as blob (for future implementation with proper PDF library)
   */
  async generatePDFBlob(data: PDFReportData): Promise<Blob> {
    const htmlContent = this.generateReportHTML(data)
    return new Blob([htmlContent], { type: 'text/html' })
  }
}