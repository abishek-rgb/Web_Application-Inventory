const xlsx = require('xlsx');

const filePath = 'C:\\Users\\Admin\\Downloads\\Resistor pack.xlsx';

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  console.log('Columns:', Object.keys(data[0] || {}));
  console.log('First 5 rows:');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  console.log('Total rows:', data.length);
} catch (error) {
  console.error('Error reading Excel file:', error);
}
