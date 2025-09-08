/* eslint-disable no-prototype-builtins */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';

const UploadContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    borderRadius: '8px',
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1.5),
    margin: theme.spacing(0.5),
  },
}));

const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragOver',
})(({ theme, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : '#ccc'}`,
  borderRadius: '8px',
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: isDragOver ? '#f3f4f6' : '#fafafa',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '120px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: '#f3f4f6',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    minHeight: '100px',
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(2),
    minHeight: '80px',
  },
}));

const HiddenInput = styled('input')({
  display: 'none',
});

// Helper function to extract well information from Excel data
const extractWellsFromData = (jsonData, fileName) => {
  const wells = [];
  const wellColumns = ['Well', 'Well Name', 'WellName', 'WELL', 'well', 'Well_Name'];
  
  // Check if any well-related columns exist
  const firstRow = jsonData[0] || {};
  const wellColumn = wellColumns.find(col => firstRow.hasOwnProperty(col));
  
  if (wellColumn) {
    // Extract unique well names
    const uniqueWells = [...new Set(jsonData.map(row => row[wellColumn]).filter(Boolean))];
    
    uniqueWells.forEach((wellName, index) => {
      const wellData = jsonData.filter(row => row[wellColumn] === wellName);
      const maxDepth = Math.max(...wellData.map(row => {
        const depth = row.Depth || row.depth || row.DEPTH || 0;
        return typeof depth === 'number' ? depth : parseFloat(depth) || 0;
      }));
      
      wells.push({
        id: Date.now() + index,
        name: String(wellName).trim(),
        depth: maxDepth,
        displayDepth: `${maxDepth} ft`,
        status: 'active',
        source: fileName,
        uploadDate: new Date().toISOString()
      });
    });
  } else {
    // If no well column found, create a well based on the file name
    const wellName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const maxDepth = Math.max(...jsonData.map(row => {
      const depth = row.Depth || row.depth || row.DEPTH || 0;
      return typeof depth === 'number' ? depth : parseFloat(depth) || 0;
    }));
    
    if (maxDepth > 0) {
      wells.push({
        id: Date.now(),
        name: wellName,
        depth: maxDepth,
        displayDepth: `${maxDepth} ft`,
        status: 'active',
        source: fileName,
        uploadDate: new Date().toISOString()
      });
    }
  }
  
  return wells;
};

// Helper function to save data to localStorage
const saveToLocalStorage = (uploadData) => {
  try {
    const existingUploads = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const updatedUploads = [...existingUploads, uploadData];
    localStorage.setItem('uploadedFiles', JSON.stringify(updatedUploads));
    
    // Also save wells separately for easy access
    if (uploadData.wells && uploadData.wells.length > 0) {
      const existingWells = JSON.parse(localStorage.getItem('uploadedWells') || '[]');
      const updatedWells = [...existingWells, ...uploadData.wells];
      localStorage.setItem('uploadedWells', JSON.stringify(updatedWells));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const Upload = ({ onDataUpload, onWellsFound }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [foundWells, setFoundWells] = useState([]);

  const processExcelFile = useCallback((file) => {
    console.log('Processing Excel file:', file.name);
    setUploadStatus('uploading');
    setUploadMessage('Processing Excel file...');
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          throw new Error('No data found in the Excel file');
        }

        // Process and normalize the data
        const processedData = jsonData.map((row, index) => {
          // Handle different possible column names
          const depth = row.Depth || row.depth || row.DEPTH || index * 100;
          const rockComposition = row['Rock Composition'] || row.rockComposition || row.ROCK_COMPOSITION || row.Rock || 'Unknown';
          const DT = parseFloat(row.DT || row.dt || row.Delta_T || row['Delta T'] || 0);
          const GR = parseFloat(row.GR || row.gr || row.Gamma_Ray || row['Gamma Ray'] || 0);

          return {
            depth: typeof depth === 'number' ? depth : parseFloat(depth) || index * 100,
            rockComposition: String(rockComposition),
            DT: isNaN(DT) ? 0 : DT,
            GR: isNaN(GR) ? 0 : GR,
          };
        });

        // Sort by depth
        processedData.sort((a, b) => a.depth - b.depth);

        // Extract well information from the data
        const detectedWells = extractWellsFromData(jsonData, file.name);
        
        // Save to localStorage
        const uploadData = {
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          data: processedData,
          wells: detectedWells
        };
        saveToLocalStorage(uploadData);
        
        setFoundWells(detectedWells);
        setUploadStatus('success');
        setUploadMessage(`Successfully uploaded ${processedData.length} data points from ${file.name}${detectedWells.length > 0 ? ` and found ${detectedWells.length} well(s)` : ''}`);
        
        console.log('Processed data:', processedData.length, 'points');
        console.log('Detected wells:', detectedWells);
        
        // Pass the processed data and wells to parent component
        onDataUpload(processedData);
        if (onWellsFound && detectedWells.length > 0) {
          console.log('Calling onWellsFound with:', detectedWells);
          onWellsFound(detectedWells);
        }
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setUploadStatus('error');
        setUploadMessage(`Error processing file: ${error.message}`);
      }
    };

    reader.onerror = () => {
      setUploadStatus('error');
      setUploadMessage('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  }, [onDataUpload]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );

    if (!isValidType) {
      setUploadStatus('error');
      setUploadMessage('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage('File size must be less than 10MB');
      return;
    }

    processExcelFile(file);
  }, [processExcelFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const clearUpload = useCallback(() => {
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadedFileName('');
    setFoundWells([]);
    onDataUpload(null);
  }, [onDataUpload]);

  return (
    <UploadContainer>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 600, 
          mb: 2,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Upload Drilling Data
      </Typography>
      
      <DropZone
        isDragOver={isDragOver}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        <CloudUploadIcon sx={{ 
          fontSize: { xs: 36, sm: 48 }, 
          color: 'primary.main', 
          mb: { xs: 1, sm: 2 } 
        }} />
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            textAlign: 'center',
            px: { xs: 1, sm: 0 }
          }}
        >
          Drop Excel file here or click to browse
        </Typography>
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            textAlign: 'center',
            px: { xs: 1, sm: 0 }
          }}
        >
          Supports .xlsx and .xls files (max 10MB)
        </Typography>
        <Button 
          variant="contained" 
          component="span" 
          startIcon={<CloudUploadIcon />}
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          Choose File
        </Button>
      </DropZone>

      <HiddenInput
        id="file-input"
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleInputChange}
      />

      {uploadStatus === 'uploading' && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {uploadMessage}
          </Typography>
        </Box>
      )}

      {uploadStatus === 'success' && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          icon={<CheckCircleIcon />}
          action={
            <IconButton size="small" onClick={clearUpload}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="body2">{uploadMessage}</Typography>
            {uploadedFileName && (
              <Chip 
                label={uploadedFileName} 
                size="small" 
                sx={{ 
                  mt: 1, 
                  mr: 1,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  maxWidth: { xs: '200px', sm: 'none' },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 }
                  }
                }}
                color="success"
                variant="outlined"
              />
            )}
            {foundWells.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Wells found:
                </Typography>
                {foundWells.map((well, index) => (
                  <Chip 
                    key={index}
                    label={`${well.name} (${well.displayDepth})`}
                    size="small"
                    sx={{ 
                      mt: 0.5, 
                      mr: 0.5,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      maxWidth: { xs: '180px', sm: 'none' },
                      '& .MuiChip-label': {
                        px: { xs: 0.75, sm: 1 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {uploadStatus === 'error' && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          icon={<ErrorIcon />}
          action={
            <IconButton size="small" onClick={() => setUploadStatus('idle')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {uploadMessage}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="textSecondary">
          Expected columns: Depth, Rock Composition, DT, GR
        </Typography>
      </Box>
    </UploadContainer>
  );
};

export default Upload;