import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../reference/oil_drilling_interview_dummy_number.xlsx'));

// Get the first worksheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel data structure:');
console.log('Total rows:', jsonData.length);
if (jsonData.length > 0) {
  console.log('Sample row:', jsonData[0]);
  console.log('Column names:', Object.keys(jsonData[0]));
}

// Process and format the data for our application
const processedData = jsonData.map((row, index) => {
  // Determine rock composition based on highest percentage
  const shalePercent = parseFloat(row['%SH'] || 0);
  const sandstonePercent = parseFloat(row['%SS'] || 0);
  const limestonePercent = parseFloat(row['%LS'] || 0);
  
  let rockComposition = 'Shale'; // default
  if (sandstonePercent > shalePercent && sandstonePercent > limestonePercent) {
    rockComposition = 'Sandstone';
  } else if (limestonePercent > shalePercent && limestonePercent > sandstonePercent) {
    rockComposition = 'Limestone';
  }
  
  return {
    id: index + 1,
    depth: parseFloat(row.DEPTH || 0),
    DT: parseFloat(row.DT || 0),
    GR: parseFloat(row.GR || 0),
    rockComposition: rockComposition,
    shalePercent: shalePercent,
    sandstonePercent: sandstonePercent,
    limestonePercent: limestonePercent
  };
});

// Group data by wells (assuming we need to create multiple wells)
const wellsData = {
  'Well A': processedData.slice(0, Math.floor(processedData.length / 4)),
  'Well AA': processedData.slice(Math.floor(processedData.length / 4), Math.floor(processedData.length / 2)),
  'Well AAA': processedData.slice(Math.floor(processedData.length / 2), Math.floor(processedData.length * 3 / 4)),
  'Well B': processedData.slice(Math.floor(processedData.length * 3 / 4))
};

// Generate the mock data file content
const mockDataContent = `// Mock data generated from Excel file
export const wellsData = ${JSON.stringify(wellsData, null, 2)};

export const wells = [
  { id: 1, name: 'Well A', depth: ${Math.max(...wellsData['Well A'].map(d => d.depth))} },
  { id: 2, name: 'Well AA', depth: ${Math.max(...wellsData['Well AA'].map(d => d.depth))} },
  { id: 3, name: 'Well AAA', depth: ${Math.max(...wellsData['Well AAA'].map(d => d.depth))} },
  { id: 4, name: 'Well B', depth: ${Math.max(...wellsData['Well B'].map(d => d.depth))} }
];
`;

// Write the processed data to the mock data file
fs.writeFileSync(path.join(__dirname, '../src/data/mockData.js'), mockDataContent);

console.log('\nMock data generated successfully!');
console.log('Wells created:');
Object.keys(wellsData).forEach(wellName => {
  console.log(`- ${wellName}: ${wellsData[wellName].length} data points`);
});