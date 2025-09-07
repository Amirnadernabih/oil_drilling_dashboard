/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

const SidebarContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: 0,
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #e0e0e0',
}));

const WellListItem = styled(ListItemButton)(({ theme, selected }) => ({
  margin: '2px 0',
  borderRadius: '8px',
  backgroundColor: selected ? '#E3F2FD' : 'transparent',
  color: selected ? '#1976D2' : '#333',
  borderLeft: selected ? '4px solid #1976D2' : '4px solid transparent',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  minHeight: '56px', // Touch-friendly minimum height
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: selected ? '#E3F2FD' : '#F5F5F5',
    transform: 'translateX(2px)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  // Mobile-specific styles
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
    minHeight: '64px', // Larger touch target on mobile
    fontSize: '1rem',
  },
}));

// Mock well data matching the design
const mockWells = [
  { id: 1, name: 'Well A', depth: 5000, displayDepth: '5000 ft', status: 'active' },
  { id: 2, name: 'Well AA', depth: 4500, displayDepth: '4500 ft', status: 'active' },
  { id: 3, name: 'Well AAA', depth: 5200, displayDepth: '5200 ft', status: 'active' },
  { id: 4, name: 'Well B', depth: 4800, displayDepth: '4800 ft', status: 'active' },
];

const Sidebar = ({ selectedWell, onWellSelect, isMobile = false, uploadedWells = [] }) => {
  const [allWells, setAllWells] = useState(mockWells);

  // Load wells from localStorage and combine with mock wells
  useEffect(() => {
    try {
      const storedWells = JSON.parse(localStorage.getItem('uploadedWells') || '[]');
      const combinedWells = [...mockWells, ...storedWells, ...uploadedWells];
      
      // Remove duplicates based on name and source
      const uniqueWells = combinedWells.filter((well, index, self) => 
        index === self.findIndex(w => w.name === well.name && (w.source || 'mock') === (well.source || 'mock'))
      );
      
      setAllWells(uniqueWells);
    } catch (error) {
      console.error('Error loading wells from localStorage:', error);
      setAllWells([...mockWells, ...uploadedWells]);
    }
  }, [uploadedWells]);

  return (
    <SidebarContainer elevation={3}>
      <Box sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        borderBottom: '1px solid #e0e0e0', 
        backgroundColor: '#FAFAFA',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          component="h2" 
          sx={{ 
            fontWeight: 600, 
            color: '#333', 
            fontSize: { xs: '1rem', sm: '1.1rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Well List
        </Typography>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a8a8a8',
        },
      }}>
        <List sx={{ p: { xs: 0.5, sm: 0 } }}>
          {allWells.map((well) => (
            <ListItem key={`${well.id}-${well.source || 'mock'}`} disablePadding>
              <WellListItem
                selected={selectedWell?.id === well.id}
                onClick={() => onWellSelect(well)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.5, sm: 1 },
                      flexWrap: 'wrap'
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: { xs: '0.9rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {well.name}
                      </Typography>
                      {well.source && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            backgroundColor: '#e3f2fd', 
                            color: '#1976d2', 
                            px: { xs: 0.5, sm: 0.75 }, 
                            py: 0.25, 
                            borderRadius: 0.5,
                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                            fontWeight: 500
                          }}
                        >
                          uploaded
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        lineHeight: 1.2,
                        mt: 0.5
                      }}
                    >
                      Depth: {well.displayDepth}
                    </Typography>
                  }
                />
              </WellListItem>
            </ListItem>
          ))}
        </List>
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar;