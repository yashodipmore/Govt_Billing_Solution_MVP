import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isPlatform } from "@ionic/react";
import * as AppGeneral from "../components/socialcalc/index.js";
import { APP_NAME } from "../app-data.js";

export interface ExportResult {
  success: boolean;
  message: string;
}

/**
 * Optimize canvas for smaller PDF size
 * @param canvas - The canvas element to optimize
 * @param maxWidth - Maximum width for the optimized canvas
 * @returns Optimized canvas data URL
 */
const optimizeCanvasForPDF = (canvas: HTMLCanvasElement, maxWidth: number = 1200): string => {
  // Create an optimized canvas if the original is too large
  if (canvas.width > maxWidth) {
    const ratio = maxWidth / canvas.width;
    const optimizedCanvas = document.createElement('canvas');
    const ctx = optimizedCanvas.getContext('2d');
    
    optimizedCanvas.width = maxWidth;
    optimizedCanvas.height = canvas.height * ratio;
    
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, optimizedCanvas.width, optimizedCanvas.height);
      return optimizedCanvas.toDataURL('image/jpeg', 0.7); // 70% quality for smaller size
    }
  }
  
  return canvas.toDataURL('image/jpeg', 0.8); // 80% quality
};

/**
 * Export spreadsheet data as CSV
 * @param filename - The name of the file (without extension)
 * @returns Promise<ExportResult>
 */
export const exportAsCsv = async (filename: string): Promise<ExportResult> => {
  try {
    const csvContent = AppGeneral.getCSVContent();
    const csvFilename = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Calculate CSV size in KB
    const sizeInKB = Math.round(new Blob([csvContent]).size / 1024);
    
    if (isPlatform("hybrid")) {
      // For mobile devices, save to filesystem
      await Filesystem.writeFile({
        path: csvFilename,
        data: csvContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return { success: true, message: `CSV exported successfully to Documents folder! (Size: ${sizeInKB} KB)` };
    } else {
      // For web, trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", csvFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, message: `CSV exported successfully! (Size: ${sizeInKB} KB)` };
    }
  } catch (error: any) {
    return { success: false, message: `Failed to export CSV: ${error.message}` };
  }
};

/**
 * Convert HTML content to PDF
 * @param htmlContent - The HTML content to convert
 * @param filename - The name of the file (without extension)
 * @param option - 'download' or 'share'
 * @returns Promise<ExportResult>
 */
export const exportAsPDF = async (
  filename: string, 
  option: 'download' | 'share' = 'download'
): Promise<ExportResult> => {
  try {
    const htmlContent = AppGeneral.getCurrentHTMLContent();
    
    // Create a temporary div to render HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.color = 'black';
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas with optimized settings for smaller file size
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Reduced scale for smaller file size
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF with compression
    const imgData = optimizeCanvasForPDF(canvas, 1200); // Optimize canvas for smaller size
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true // Enable PDF compression
    });
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST'); // Use JPEG compression
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const pdfFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Calculate PDF size in KB
    const pdfBlob = pdf.output('blob');
    const sizeInKB = Math.round(pdfBlob.size / 1024);

    if (isPlatform("hybrid")) {
      // For mobile devices, save to filesystem
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const base64 = base64Data.split(',')[1]; // Remove data:application/pdf;base64, prefix
            
            await Filesystem.writeFile({
              path: pdfFilename,
              data: base64,
              directory: Directory.Documents,
            });
            
            if (option === 'share') {
              // Get the file URI for sharing
              const fileUri = await Filesystem.getUri({
                directory: Directory.Documents,
                path: pdfFilename
              });
              
              await Share.share({
                title: `${APP_NAME} - ${filename}`,
                text: 'Sharing PDF document',
                url: fileUri.uri,
                dialogTitle: 'Share PDF'
              });
              
              resolve({ success: true, message: `PDF shared successfully! (Size: ${sizeInKB} KB)` });
            } else {
              resolve({ success: true, message: `PDF exported successfully to Documents folder! (Size: ${sizeInKB} KB)` });
            }
          } catch (error: any) {
            resolve({ success: false, message: `Failed to save PDF: ${error.message}` });
          }
        };
        reader.readAsDataURL(pdfBlob);
      });
    } else {
      // For web, trigger download
      if (option === 'share' && navigator.share) {
        // Use Web Share API if available
        const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
        
        try {
          await navigator.share({
            title: `${APP_NAME} - ${filename}`,
            text: 'Sharing PDF document',
            files: [file]
          });
          return { success: true, message: `PDF shared successfully! (Size: ${sizeInKB} KB)` };
        } catch (shareError: any) {
          // Fallback to download if sharing fails
          pdf.save(pdfFilename);
          return { success: true, message: `PDF downloaded (sharing not supported in this browser)! (Size: ${sizeInKB} KB)` };
        }
      } else {
        // Regular download
        pdf.save(pdfFilename);
        return { success: true, message: `PDF exported successfully! (Size: ${sizeInKB} KB)` };
      }
    }
  } catch (error: any) {
    return { success: false, message: `Failed to export PDF: ${error.message}` };
  }
};

/**
 * Share PDF document
 * @param filename - The name of the file (without extension)
 * @returns Promise<ExportResult>
 */
export const sharePDF = async (filename: string): Promise<ExportResult> => {
  return await exportAsPDF(filename, 'share');
};
