/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Upload from './components/Upload';
import * as XLSX from 'xlsx';

const mockWells = [
  { id: 1, name: 'Well A', depth: 5000, displayDepth: '5000 ft', status: 'active' },
  { id: 2, name: 'Well AA', depth: 4500, displayDepth: '4500 ft', status: 'active' },
  { id: 3, name: 'Well AAA', depth: 5200, displayDepth: '5200 ft', status: 'active' },
  { id: 4, name: 'Well B', depth: 4800, displayDepth: '4800 ft', status: 'active' },
];

const LITHO_KEYS = ['SH','SI','BSS','LSS','LS','DOL','ANH','Coal','Sat'];

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35',
    },
    secondary: {
      main: '#2196F3',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
      },
    },
  },
});

function App() {
  const [selectedWell, setSelectedWell] = useState(mockWells[0]);
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedWells, setUploadedWells] = useState([]);
  const [activeTab, setActiveTab] = useState('drilling');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const loadReferenceExcel = async () => {
      try {
        const excelUrl = new URL('../reference/oil_drilling_interview_dummy_number.xlsx', import.meta.url).href;
        const res = await fetch(excelUrl);
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) return;

        const normalize = (row, index) => {
          const depthVal = row.Depth ?? row.DEPTH ?? row.depth ?? row['Depth(ft)'] ?? row['Depth (ft)'] ?? (index * 10 + 1200);
          const rockVal = row['Rock Composition'] ?? row['Rock Type'] ?? row.rockComposition ?? row.ROCK_TYPE ?? row.Rock ?? 'Unknown';
          const dtVal = row.DT ?? row.dt ?? row['Delta T'] ?? row.Delta_T ?? row['DT(us/ft)'] ?? row['DT (us/ft)'] ?? 0;
          const grVal = row.GR ?? row.gr ?? row['Gamma Ray'] ?? row.Gamma_Ray ?? row['GR(API)'] ?? row['GR (API)'] ?? 0;

          const toNum = (v, fallback = 0) => {
            const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,\s]/g, ''));
            return Number.isFinite(n) ? n : fallback;
          };

          const out = {
            depth: toNum(depthVal, index * 10 + 1200),
            rockComposition: String(rockVal).trim() || 'Unknown',
            DT: toNum(dtVal, 0),
            GR: toNum(grVal, 0),
          };

          LITHO_KEYS.forEach((k) => {
            if (row[k] !== undefined) {
              out[k] = toNum(row[k], 0);
            }
          });

          return out;
        };

        const processed = json.map(normalize).filter(r => Number.isFinite(r.depth));
        processed.sort((a, b) => a.depth - b.depth);

        setUploadedData(processed);
      } catch (e) {
        console.error('Failed to load reference excel:', e);
      }
    };

    loadReferenceExcel();
  }, []);

  const handleWellSelect = (well) => {
    setSelectedWell(well);
  };

  // Only update state if we have valid data, don't clear existing data on null/undefined
  const handleDataUpload = (data) => {
    console.log('handleDataUpload called with:', data ? data.length + ' data points' : 'null');
    if (data && Array.isArray(data) && data.length > 0) {
      setUploadedData(data);
    } else if (data === null) {
      setUploadedData(null);
    }
  };

  const handleWellsFound = (wells) => {
    console.log('handleWellsFound called with:', wells);
    setUploadedWells(prev => {
      const combined = [...prev, ...wells];
      // Remove duplicates based on name and source
      const result = combined.filter((well, index, self) => 
        index === self.findIndex(w => w.name === well.name && w.source === well.source)
      );
      console.log('Updated uploadedWells:', result);
      return result;
    });
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleUpload = (files) => {
    console.log('Upload button clicked - opening modal');
    setShowUploadModal(true);
    if (files && files.length > 0) {
      sessionStorage.setItem('pendingUploadFiles', JSON.stringify({
        timestamp: Date.now(),
        fileNames: files.map(file => file.name)
      }));
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  const handleFilter = (filterType) => {
    console.log('Filter applied:', filterType);
  };

  const navbarProps = {
    activeTab,
    onTabChange: handleTabChange,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onUpload: handleUpload,
    onFilter: handleFilter,
    onChatbotToggle: () => {},
    zoomLevel,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout 
        selectedWell={selectedWell}
        onWellSelect={handleWellSelect}
        uploadedData={uploadedData}
        uploadedWells={uploadedWells}
        onUpload={handleUpload}
      >
        <Dashboard
          selectedWell={selectedWell}
          uploadedData={uploadedData}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onUpload={handleUpload}
          onFilter={handleFilter}
          zoomLevel={zoomLevel}
          onDataUpload={handleDataUpload}
          onWellsFound={handleWellsFound}
        />
      </Layout>
      
      <Dialog 
        open={showUploadModal} 
        onClose={handleCloseUploadModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Excel File</DialogTitle>
        <DialogContent>
          <Upload 
            onDataUpload={handleDataUpload}
            onWellsFound={handleWellsFound}
          />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
