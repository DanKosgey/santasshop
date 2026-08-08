// Utility functions for exporting trade journal data

// Function to convert trade data to CSV format
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV content
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        let field = row[fieldName];
        if (typeof field === 'object' && field !== null) {
          field = JSON.stringify(field);
        }
        // Escape double quotes and wrap in quotes if contains comma, newline or quote
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          field = `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    )
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to convert trade data to a format suitable for PDF export
export const prepareDataForPDF = (data: any[], columns: { header: string; dataKey: string }[]) => {
  return data.map(row => {
    const formattedRow: any = {};
    columns.forEach(col => {
      let value = row[col.dataKey];
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      formattedRow[col.header] = value;
    });
    return formattedRow;
  });
};

// Function to generate a PDF report
export const exportToPDF = async (
  data: any[], 
  columns: { header: string; dataKey: string }[], 
  title: string,
  filename: string
) => {
  try {
    // Dynamically import jsPDF and autoTable to avoid issues with server-side rendering
    let jsPDFModule;
    let autoTableModule;
    
    try {
      jsPDFModule = await import('jspdf');
      autoTableModule = await import('jspdf-autotable');
    } catch (importError) {
      console.warn('PDF export dependencies not available. Please install jspdf and jspdf-autotable.');
      throw new Error('PDF export functionality requires additional dependencies. Please contact support.');
    }
    
    const { jsPDF } = jsPDFModule;
    
    // Create a new jsPDF instance
    const doc = new jsPDF() as any;
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add table
    (doc as any).autoTable({
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => {
        let value = row[col.dataKey];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      })),
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [0, 255, 148], // Trade neon green
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report: ' + (error as Error).message);
  }
};

// Function to export trade journal entries
export const exportTradeJournal = async (
  entries: any[], 
  format: 'csv' | 'pdf', 
  filename: string = 'trade-journal'
) => {
  // Define columns for export
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Pair', dataKey: 'pair' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Entry Price', dataKey: 'entryPrice' },
    { header: 'Stop Loss', dataKey: 'stopLoss' },
    { header: 'Take Profit', dataKey: 'takeProfit' },
    { header: 'Status', dataKey: 'status' },
    { header: 'P&L', dataKey: 'pnl' },
    { header: 'Strategy', dataKey: 'strategy' },
    { header: 'Time Frame', dataKey: 'timeFrame' },
    { header: 'Confidence', dataKey: 'confidenceLevel' },
    { header: 'Notes', dataKey: 'notes' }
  ];

  if (format === 'csv') {
    // Prepare data for CSV export
    const csvData = entries.map(entry => {
      const csvEntry: any = {};
      columns.forEach(col => {
        csvEntry[col.dataKey] = entry[col.dataKey];
      });
      return csvEntry;
    });
    
    exportToCSV(csvData, filename);
  } else if (format === 'pdf') {
    // Prepare data for PDF export
    const pdfData = prepareDataForPDF(entries, columns);
    
    // Generate PDF
    await exportToPDF(pdfData, columns, 'Trade Journal Report', filename);
  }
};