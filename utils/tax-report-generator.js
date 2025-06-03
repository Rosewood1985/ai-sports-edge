// Tax Report Generator Utility
const fs = require('fs');
const path = require('path');

const stripeTaxService = require('../services/stripeTaxService');

// Generate a tax report
async function generateTaxReport(options) {
  try {
    const { startDate, endDate, format = 'json', outputPath } = options;

    // Validate inputs
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // Generate report
    const reportData = await stripeTaxService.generateTaxReport({
      startDate,
      endDate,
    });

    // Format report
    let formattedReport;
    switch (format.toLowerCase()) {
      case 'csv':
        formattedReport = formatAsCsv(reportData);
        break;
      case 'html':
        formattedReport = formatAsHtml(reportData);
        break;
      default:
        formattedReport = JSON.stringify(reportData, null, 2);
    }

    // Save to file if path provided
    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, formattedReport);
      return { success: true, filePath: outputPath };
    }

    return { success: true, data: reportData, formatted: formattedReport };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Format as CSV
function formatAsCsv(data) {
  let csv = 'Report ID,Total Taxable Amount,Total Tax Amount,Transaction Count\n';
  csv += `${data.report_id},${data.total_taxable_amount},${data.total_tax_amount},${data.transaction_count}\n\n`;

  csv += 'Jurisdiction,Country,State,Type,Taxable Amount,Tax Amount\n';
  data.jurisdictions.forEach(j => {
    csv += `${j.name},${j.country},${j.state || ''},${j.type},${j.taxable_amount},${j.tax_amount}\n`;
  });

  return csv;
}

// Format as HTML
function formatAsHtml(data) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Tax Report</title>
  <style>
    body { font-family: Arial; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Tax Report</h1>
  <p>Report ID: ${data.report_id}</p>
  <p>Total Taxable Amount: $${data.total_taxable_amount}</p>
  <p>Total Tax Amount: $${data.total_tax_amount}</p>
  <p>Transaction Count: ${data.transaction_count}</p>
  
  <h2>Jurisdictions</h2>
  <table>
    <tr>
      <th>Jurisdiction</th>
      <th>Country</th>
      <th>State</th>
      <th>Type</th>
      <th>Taxable Amount</th>
      <th>Tax Amount</th>
    </tr>
    ${data.jurisdictions
      .map(
        j => `
    <tr>
      <td>${j.name}</td>
      <td>${j.country}</td>
      <td>${j.state || ''}</td>
      <td>${j.type}</td>
      <td>$${j.taxable_amount}</td>
      <td>$${j.tax_amount}</td>
    </tr>`
      )
      .join('')}
  </table>
</body>
</html>`;
}

module.exports = { generateTaxReport };
