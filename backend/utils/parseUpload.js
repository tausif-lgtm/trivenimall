const XLSX = require('xlsx');

/**
 * Parse uploaded file buffer (CSV or Excel) into array of row arrays.
 * Returns: [ [col1, col2, col3, ...], ... ]
 */
function parseUploadedFile(buffer, mimetype, originalname) {
  const ext = (originalname || '').toLowerCase().split('.').pop();
  const isExcel = ext === 'xlsx' || ext === 'xls' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel';

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // raw:false formats cells; dateNF forces dates to YYYY-MM-DD string (no timezone conversion)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
  return rows;
}

module.exports = { parseUploadedFile };
