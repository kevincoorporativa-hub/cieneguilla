import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
