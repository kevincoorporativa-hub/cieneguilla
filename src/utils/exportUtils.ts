import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  subtitle?: string;
}

export const exportToExcel = (data: ExportData, filename: string) => {
  const ws = XLSX.utils.aoa_to_sheet([
    [data.title],
    data.subtitle ? [data.subtitle] : [],
    [],
    data.headers,
    ...data.rows
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data: ExportData, filename: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 14, 20);
  
  // Subtitle
  if (data.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(data.subtitle, 14, 28);
  }

  // Table
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: data.subtitle ? 35 : 30,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado: ${new Date().toLocaleString('es-PE')} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

export const exportMultipleToPDF = (dataList: ExportData[], filename: string) => {
  const doc = new jsPDF();
  
  dataList.forEach((data, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 14, 20);
    
    // Subtitle
    if (data.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(data.subtitle, 14, 28);
    }

    // Table
    autoTable(doc, {
      head: [data.headers],
      body: data.rows,
      startY: data.subtitle ? 35 : 30,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  });

  // Footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado: ${new Date().toLocaleString('es-PE')} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

export const exportChartsToPDF = async (
  containerSelector: string,
  title: string,
  subtitle?: string,
  filename?: string
) => {
  const container = document.querySelector(containerSelector) as HTMLElement;
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }

  try {
    // Capture the container as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate PDF dimensions
    const doc = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'mm',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const headerSpace = subtitle ? 40 : 35;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 20);

    // Subtitle
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 28);
    }

    // Calculate image size to fit page
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - headerSpace - 20; // 20 for footer
    
    const ratio = Math.min(
      availableWidth / (imgWidth / 2), // Divide by scale factor
      availableHeight / (imgHeight / 2)
    );

    const finalWidth = (imgWidth / 2) * ratio;
    const finalHeight = (imgHeight / 2) * ratio;

    // Center the image horizontally
    const xOffset = (pageWidth - finalWidth) / 2;

    doc.addImage(imgData, 'PNG', xOffset, headerSpace, finalWidth, finalHeight);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado: ${new Date().toLocaleString('es-PE')}`,
      margin,
      pageHeight - 10
    );

    doc.save(`${filename || 'graficos'}.pdf`);
  } catch (error) {
    console.error('Error exporting charts to PDF:', error);
  }
};
