import { exportService } from './export';
import { UserRole } from './auth';

export interface PDFExportOptions {
  title: string;
  includeCharts: boolean;
  includeMetadata: boolean;
  dateRange?: { start: Date; end: Date };
}

export class PDFExportService {
  private async generatePDFContent(
    data: any[],
    summary: any,
    options: PDFExportOptions
  ): Promise<string> {
    // Generate HTML content for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${options.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .data-table th { background-color: #f2f2f2; }
          .metadata { font-size: 12px; color: #666; margin-top: 30px; }
          .chart-placeholder { background: #f9f9f9; padding: 20px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${options.title}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          ${options.dateRange ? `<p>Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}</p>` : ''}
        </div>
        
        <div class="summary">
          <h2>Summary</h2>
          ${this.generateSummaryHTML(summary)}
        </div>
        
        ${options.includeCharts ? this.generateChartsHTML(summary) : ''}
        
        <div class="data-section">
          <h2>Detailed Data</h2>
          ${this.generateTableHTML(data)}
        </div>
        
        ${options.includeMetadata ? this.generateMetadataHTML() : ''}
      </body>
      </html>
    `;
    
    return htmlContent;
  }

  private generateSummaryHTML(summary: any): string {
    return Object.entries(summary)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `
            <div>
              <strong>${this.formatKey(key)}:</strong>
              <ul>
                ${Object.entries(value as Record<string, any>)
                  .map(([subKey, subValue]) => `<li>${this.formatKey(subKey)}: ${subValue}</li>`)
                  .join('')}
              </ul>
            </div>
          `;
        }
        return `<p><strong>${this.formatKey(key)}:</strong> ${value}</p>`;
      })
      .join('');
  }

  private generateChartsHTML(summary: any): string {
    return `
      <div class="charts-section">
        <h2>Visual Summary</h2>
        <div class="chart-placeholder">
          <p>Chart visualization would be rendered here</p>
          <p>Summary data: ${JSON.stringify(summary, null, 2)}</p>
        </div>
      </div>
    `;
  }

  private generateTableHTML(data: any[]): string {
    if (!data.length) return '<p>No data available</p>';
    
    const headers = Object.keys(data[0]).filter(key => key !== 'id');
    
    return `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(header => `<th>${this.formatKey(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${this.formatValue(row[header])}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private generateMetadataHTML(): string {
    return `
      <div class="metadata">
        <h3>Export Metadata</h3>
        <p>Export Time: ${new Date().toISOString()}</p>
        <p>System: Office OFM App</p>
        <p>Version: 1.0.0</p>
      </div>
    `;
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  async exportTasksToPDF(
    userRole: UserRole, 
    userId: string, 
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const tasks = await exportService.getTasks(userRole, userId);
    const summary = await exportService.generateTasksSummary(userRole, userId);
    
    const pdfOptions: PDFExportOptions = {
      title: 'Tasks Report',
      includeCharts: false,
      includeMetadata: true,
      ...options
    };

    const htmlContent = await this.generatePDFContent(tasks, summary, pdfOptions);
    return this.convertHTMLToPDF(htmlContent);
  }

  async exportReceiptsToPDF(
    userRole: UserRole, 
    userId: string, 
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const receipts = await exportService.getReceipts(userRole, userId);
    const summary = await exportService.generateReceiptsSummary(userRole, userId);
    
    const pdfOptions: PDFExportOptions = {
      title: 'Receipts Report',
      includeCharts: true,
      includeMetadata: true,
      ...options
    };

    const htmlContent = await this.generatePDFContent(receipts, summary, pdfOptions);
    return this.convertHTMLToPDF(htmlContent);
  }

  private async convertHTMLToPDF(htmlContent: string): Promise<Blob> {
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    // For now, we'll create a simple text-based PDF placeholder
    
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${htmlContent.length}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${htmlContent.replace(/[<>]/g, '').substring(0, 1000)}...) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${300 + htmlContent.length}
%%EOF
    `;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const pdfExportService = new PDFExportService();