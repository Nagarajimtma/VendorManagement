import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Utility functions for PDF generation
 */

/**
 * Convert image URL to base64
 * @param url Image URL
 * @returns Promise<string> Base64 string
 */
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log(`Image loaded: ${url} (${img.width}x${img.height}px)`);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        console.log(`Image converted to base64, size: ${Math.round(dataURL.length / 1024)}KB`);
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error(`Failed to load image: ${url}`, error);
      reject(`Could not load image: ${url}`);
    };
    
    console.log(`Loading image: ${url}`);
    img.src = url;
  });
};

/**
 * Load and cache logos
 */
let cachedLogos: { biec?: string; imtma?: string } = {};

/**
 * Clear logo cache to force reload
 */
export const clearLogoCache = (): void => {
  cachedLogos = {};
  console.log('Logo cache cleared');
};

/**
 * Preload logos for faster PDF generation
 */
export const preloadLogos = async (): Promise<void> => {
  try {
    console.log('Starting logo preload...');
    const promises = [];
    
    if (!cachedLogos.biec) {
      console.log('Loading BIEC logo from local file...');
      promises.push(
        imageToBase64('/images/BIEC.png')
          .then(base64 => {
            cachedLogos.biec = base64;
            console.log('BIEC logo preloaded successfully from local file');
          })
          .catch(error => console.warn('Could not preload BIEC logo from local file:', error))
      );
    } else {
      console.log('BIEC logo already cached');
    }
    
    if (!cachedLogos.imtma) {
      console.log('Loading IMTMA logo...');
      promises.push(
        imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png')
          .then(base64 => {
            cachedLogos.imtma = base64;
            console.log('IMTMA logo preloaded successfully');
          })
          .catch(error => console.warn('Could not preload IMTMA logo:', error))
      );
    } else {
      console.log('IMTMA logo already cached');
    }
    
    await Promise.all(promises);
    console.log('Logo preload completed. Cache status:', {
      biec: !!cachedLogos.biec,
      imtma: !!cachedLogos.imtma
    });
  } catch (error) {
    console.warn('Error preloading logos:', error);
  }
};

interface DocumentData {
  title: string;
  documentType: string;
  submissionDate: string;
  status: string;
  remarks?: string;
}

interface VendorData {
  name: string;
  company: string;
  email: string;
}

/**
 * Generate a document verification report PDF
 * 
 * @param vendorData - Vendor information
 * @param documents - List of approved documents
 * @param title - Report title
 * @returns The generated PDF document
 */
export const generateVerificationReport = async (
  vendorData: VendorData,
  documents: DocumentData[],
  title: string = 'Document Verification Report'
): Promise<jsPDF> => {
  // Create new PDF document
  const pdf = new jsPDF();
  
  try {
    // Load logos if not cached
    if (!cachedLogos.biec) {
      try {
        console.log('Loading BIEC logo from local file in PDF generation...');
        cachedLogos.biec = await imageToBase64('/images/BIEC.png');
        console.log('BIEC logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load BIEC logo from local file:', error);
      }
    }
    
    if (!cachedLogos.imtma) {
      try {
        console.log('Loading IMTMA logo from external URL...');
        cachedLogos.imtma = await imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png');
        console.log('IMTMA logo loaded successfully from external URL');
      } catch (error) {
        console.warn('Could not load IMTMA logo:', error);
      }
    }
    
    // Add IMTMA logo (Left side)
    console.log('VERIFICATION REPORT - IMTMA logo available:', !!cachedLogos.imtma);
    if (cachedLogos.imtma) {
      console.log('VERIFICATION REPORT - Adding IMTMA logo to PDF at position (15, 15)');
      pdf.addImage(cachedLogos.imtma, 'PNG', 15, 15, 50, 25);
      console.log('VERIFICATION REPORT - IMTMA logo added successfully');
    } else {
      console.log('VERIFICATION REPORT - Using IMTMA fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(220, 53, 69);
      pdf.rect(15, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('IMTMA', 30, 30);
    }
    
    // Add BIEC logo (Right side)
    console.log('VERIFICATION REPORT - BIEC logo available:', !!cachedLogos.biec);
    if (cachedLogos.biec) {
      console.log('VERIFICATION REPORT - Adding BIEC logo to PDF at position (145, 15)');
      pdf.addImage(cachedLogos.biec, 'PNG', 145, 15, 50, 25);
      console.log('VERIFICATION REPORT - BIEC logo added successfully');
    } else {
      console.log('VERIFICATION REPORT - Using BIEC fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(0, 123, 255);
      pdf.rect(145, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('BIEC', 162, 30);
    }
    
  } catch (error) {
    console.warn('Error loading logos, using fallback design:', error);
    // Fallback to original colored rectangles
    pdf.setFillColor(0, 123, 255);
    pdf.rect(15, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('BIEC', 25, 24);
    
    pdf.setFillColor(220, 53, 69);
    pdf.rect(165, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('IMTMA', 173, 24);
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Add title (moved down to avoid logo overlap - logos end at Y=40)
  pdf.setFontSize(18);
  pdf.text(title, 105, 55, { align: 'center' });
  
  // Add vendor information (moved down with proper spacing)
  pdf.setFontSize(12);
  pdf.text(`Vendor: ${vendorData.name || 'Unknown'}`, 15, 70);
  pdf.text(`Company: ${vendorData.company || 'Unknown'}`, 15, 77);
  pdf.text(`Email: ${vendorData.email || 'Unknown'}`, 15, 84);
  pdf.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 15, 91);
  
  // Add document table
  const tableData = documents.map(doc => [
    doc.title,
    doc.documentType,
    typeof doc.submissionDate === 'string' ? format(new Date(doc.submissionDate), 'dd/MM/yyyy') : 'Unknown',
    doc.status,
    doc.remarks && doc.remarks.trim() ? doc.remarks.trim() : 'No remarks provided'
  ]);
  
  autoTable(pdf, {
    head: [['Document Title', 'Document Type', 'Submission Date', 'Status', 'Remarks']],
    body: tableData,
    startY: 105,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Document Title
      1: { cellWidth: 30 }, // Document Type  
      2: { cellWidth: 25 }, // Submission Date
      3: { cellWidth: 20 }, // Status
      4: { cellWidth: 'auto' } // Remarks - auto width to use remaining space
    },
    styles: {
      cellPadding: 3,
      fontSize: 9,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    }
  });
  
  // Add verification statement
  const finalY = (pdf as any).lastAutoTable.finalY || 150;
  pdf.text('This is to certify that the above documents have been verified and approved.', 15, finalY + 15);
  
  // Add signature line
  pdf.line(15, finalY + 40, 85, finalY + 40);
  pdf.text('Consultant Signature', 15, finalY + 45);
  
  pdf.line(120, finalY + 40, 190, finalY + 40);
  pdf.text('Date', 120, finalY + 45);
  
  return pdf;
};

/**
 * Generate a compliance report PDF
 * 
 * @param vendorData - Vendor information
 * @param complianceData - Compliance data
 * @param title - Report title
 * @returns The generated PDF document
 */
export const generateComplianceReport = async (
  vendorData: VendorData,
  complianceData: any,
  title: string = 'Compliance Report'
): Promise<jsPDF> => {
  // Create new PDF document
  const pdf = new jsPDF();
  
  try {
    // Load logos if not cached
    if (!cachedLogos.biec) {
      try {
        console.log('Loading BIEC logo from local file in compliance report...');
        cachedLogos.biec = await imageToBase64('/images/BIEC.png');
        console.log('BIEC logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load BIEC logo from local file:', error);
      }
    }
    
    if (!cachedLogos.imtma) {
      try {
        console.log('Loading IMTMA logo from external URL...');
        cachedLogos.imtma = await imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png');
        console.log('IMTMA logo loaded successfully from external URL');
      } catch (error) {
        console.warn('Could not load IMTMA logo:', error);
      }
    }
    
    // Add IMTMA logo (Left side)
    console.log('COMPLIANCE REPORT - IMTMA logo available:', !!cachedLogos.imtma);
    if (cachedLogos.imtma) {
      console.log('COMPLIANCE REPORT - Adding IMTMA logo to PDF at position (15, 15)');
      pdf.addImage(cachedLogos.imtma, 'PNG', 15, 15, 50, 25);
      console.log('COMPLIANCE REPORT - IMTMA logo added successfully');
    } else {
      console.log('COMPLIANCE REPORT - Using IMTMA fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(220, 53, 69);
      pdf.rect(15, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('IMTMA', 30, 30);
    }
    
    // Add BIEC logo (Right side)
    console.log('COMPLIANCE REPORT - BIEC logo available:', !!cachedLogos.biec);
    if (cachedLogos.biec) {
      console.log('COMPLIANCE REPORT - Adding BIEC logo to PDF at position (145, 15)');
      pdf.addImage(cachedLogos.biec, 'PNG', 145, 15, 50, 25);
      console.log('COMPLIANCE REPORT - BIEC logo added successfully');
    } else {
      console.log('COMPLIANCE REPORT - Using BIEC fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(0, 123, 255);
      pdf.rect(145, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('BIEC', 162, 30);
    }
    
  } catch (error) {
    console.warn('Error loading logos, using fallback design:', error);
    // Fallback to original colored rectangles
    pdf.setFillColor(0, 123, 255);
    pdf.rect(15, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('BIEC', 25, 24);
    
    pdf.setFillColor(220, 53, 69);
    pdf.rect(165, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('IMTMA', 173, 24);
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Add title (moved down to avoid logo overlap - logos end at Y=40)
  pdf.setFontSize(18);
  pdf.text(title, 105, 55, { align: 'center' });
  
  // Add vendor information (moved down with proper spacing)
  pdf.setFontSize(12);
  pdf.text(`Vendor: ${vendorData.name || 'Unknown'}`, 15, 70);
  pdf.text(`Company: ${vendorData.company || 'Unknown'}`, 15, 77);
  pdf.text(`Email: ${vendorData.email || 'Unknown'}`, 15, 84);
  pdf.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 15, 91);
  
  // Add compliance data (moved down with proper spacing)
  // This would be customized based on the specific compliance data structure
  
  return pdf;
};

export default {
  generateVerificationReport,
  generateComplianceReport,
  preloadLogos,
  clearLogoCache
};