/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react';
import { wellsData } from '../data/mockData.js';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { styled } from '@mui/material/styles';

const DashboardContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
}));

const ChartCard = styled(Card)(({ theme }) => ({
  height: '500px',
  marginTop: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    height: '600px',
    marginTop: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    height: '700px',
  },
  [theme.breakpoints.up('lg')]: {
    height: '800px',
  },
}));

const DashboardNavbar = styled(Box)(({ theme }) => ({
  backgroundColor: '#FFF',
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '48px',
  padding: theme.spacing(0, 1),
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(2),
    minHeight: '56px',
    padding: theme.spacing(0, 2),
    flexWrap: 'nowrap',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    minWidth: 80,
    fontWeight: 500,
    color: '#000',
    fontSize: '0.75rem',
    padding: theme.spacing(0.5, 1),
    [theme.breakpoints.up('sm')]: {
      minWidth: 100,
      fontSize: '0.875rem',
      padding: theme.spacing(1, 2),
    },
    [theme.breakpoints.up('md')]: {
      minWidth: 120,
      fontSize: '0.875rem',
    },
    '&.Mui-selected': {
      color: '#000',
      fontWeight: 600,
    },
  },
  '& .MuiTabs-indicator': {
    backgroundColor: '#000',
    height: 3,
  },
  '& .MuiTabs-scrollButtons': {
    '&.Mui-disabled': {
      opacity: 0.3,
    },
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: '#000',
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
}));

// Get mock drilling data from Excel file based on selected well
const getMockDrillingData = (wellName) => {
  return wellsData[wellName] || wellsData['Well A'];
};

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label, dataKey }) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload;
    return (
      <Box sx={{ 
        backgroundColor: 'rgba(53, 53, 53, 0.95)', 
        p: 1.5, 
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5, fontSize: '11px' }}>
          Depth: {data.depth}
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          SH: {(data.shalePercent * 100).toFixed(0)}%
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          SS: {(data.sandstonePercent * 100).toFixed(0)}%
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          LS: {(data.limestonePercent * 100).toFixed(0)}%
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          DOL: 0
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px', mt: 0.5 }}>
          Coal: 0
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFB74D', fontSize: '10px', mt: 0.5 }}>
          DT: {data.DT.toFixed(2)}
        </Typography>
        <Typography variant="body2" sx={{ color: '#4FC3F7', fontSize: '10px' }}>
          GR: {data.GR.toFixed(2)}
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px', mt: 0.5 }}>
          MINERAL: 2
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          UCS: 10814.522s
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          FA: 47.0449
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px', mt: 0.5 }}>
          PAT: 1
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFF', fontSize: '10px' }}>
          ROP: 27.07700759
        </Typography>
      </Box>
    );
  }
  return null;
};

const Dashboard = ({ 
  selectedWell, 
  uploadedData, 
  activeTab, 
  onTabChange, 
  onZoomIn, 
  onZoomOut, 
  onUpload, 
  onFilter,
  zoomLevel = 100,
  onDataUpload,
  onWellsFound
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [openTabs, setOpenTabs] = useState([
    { label: 'Drilling Monitoring', value: 'drilling' },
    { label: 'Offset Wells Map', value: 'wells' },
    { label: 'Bit Summary', value: 'bits' },
  ]);

  const handleCloseTab = (tabValue) => {
    setOpenTabs(prev => prev.filter(tab => tab.value !== tabValue));
    // If closing the active tab, switch to the first remaining tab
    if (activeTab === tabValue && openTabs.length > 1) {
      const remainingTabs = openTabs.filter(tab => tab.value !== tabValue);
      if (remainingTabs.length > 0) {
        onTabChange(remainingTabs[0].value);
      }
    }
  };

  const handleFilterClick = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterSelect = (filterType) => {
    onFilter && onFilter(filterType);
    handleFilterClose();
  };

  // Use uploaded data if available, otherwise use mock data for selected well
  const mockDrillingData = getMockDrillingData(selectedWell?.name || 'Well A');
  const displayData = uploadedData && uploadedData.length > 0 ? uploadedData : mockDrillingData;
  
  // Sort data by depth for proper visualization
  const sortedData = useMemo(() => {
    return [...displayData].sort((a, b) => a.depth - b.depth);
  }, [displayData]);
  
  // Calculate depth range
  const minDepth = sortedData.length > 0 ? Math.min(...sortedData.map(d => d.depth)) : 0;
  const maxDepth = sortedData.length > 0 ? Math.max(...sortedData.map(d => d.depth)) : 0;
  
  // Color mapping for rock types
  const getRockColor = (item) => {
    // Use percentage-based coloring
    const shalePercent = item.shalePercent || 0;
    const sandstonePercent = item.sandstonePercent || 0;
    const limestonePercent = item.limestonePercent || 0;
    
    // If shale dominant
    if (shalePercent > 0.6) {
      return '#4FC3F7'; // Blue
    }
    // If sandstone dominant
    if (sandstonePercent > 0.6) {
      return '#FF6B9D'; // Pink
    }
    // If limestone present
    if (limestonePercent > 0.3) {
      return '#FFD93D'; // Yellow
    }
    // Mixed composition
    if (shalePercent > sandstonePercent) {
      return '#4FC3F7'; // Blue
    }
    return '#FF6B9D'; // Pink
  };

  // Create legend items
  const legendItems = [
    { color: '#FF6B9D', label: 'SH' },
    { color: '#4FC3F7', label: 'ANH' },
    { color: '#90EE90', label: 'SS' },
    { color: '#FFD93D', label: 'LS' },
    { color: '#87CEEB', label: 'DOL' },
    { color: '#808080', label: 'Coal' },
    { color: '#DDA0DD', label: 'Salt' }
  ];

  return (
    <DashboardContainer>
      {/* Dashboard Navbar */}
      <DashboardNavbar>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1, 
          overflow: 'hidden',
          width: '100%'
        }}>
          <StyledTabs
            value={activeTab}
            onChange={(e, newValue) => onTabChange && onTabChange(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              minWidth: 0, 
              flex: 1,
              '& .MuiTabs-scrollButtons': {
                display: { xs: 'flex', sm: 'flex' }
              }
            }}
          >
            {openTabs.map((tab) => (
              <Tab 
                key={tab.value} 
                value={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <span>{isSmallScreen ? tab.label.split(' ')[0] : tab.label}</span>
                    {!isSmallScreen && (
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTab(tab.value);
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#666',
                          '&:hover': {
                            color: '#000',
                          },
                        }}
                      >
                        ×
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </StyledTabs>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          flexShrink: 0
        }}>
          {/* Zoom Controls - Compact on mobile */}
          {!isSmallScreen ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <ActionButton onClick={onZoomOut} title="Zoom Out" size="small">
                  <ZoomOutIcon fontSize="small" />
                </ActionButton>
                <Typography variant="body2" sx={{ mx: 0.5, minWidth: '40px', textAlign: 'center', fontSize: '0.75rem' }}>
                  {zoomLevel}%
                </Typography>
                <ActionButton onClick={onZoomIn} title="Zoom In" size="small">
                  <ZoomInIcon fontSize="small" />
                </ActionButton>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(0,0,0,0.1)', mx: 0.5 }} />
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ActionButton onClick={onZoomOut} title="Zoom Out" size="small">
                <ZoomOutIcon fontSize="small" />
              </ActionButton>
              <ActionButton onClick={onZoomIn} title="Zoom In" size="small">
                <ZoomInIcon fontSize="small" />
              </ActionButton>
            </Box>
          )}

          {/* Upload Button - Always icon on mobile */}
          {!isSmallScreen ? (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={onUpload}
              size="small"
              sx={{
                backgroundColor: 'green',
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: '#45a049',
                },
              }}
            >
              Upload
            </Button>
          ) : (
            <ActionButton onClick={onUpload} title="Upload" size="small">
              <UploadIcon fontSize="small" />
            </ActionButton>
          )}

          {/* Filter Button - Responsive */}
          {!isSmallScreen ? (
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              size="small"
              sx={{
                backgroundColor: '#2196F3',
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: '#1976D2',
                },
              }}
            >
              Filter
            </Button>
          ) : (
            <ActionButton onClick={handleFilterClick} title="Filter" size="small">
              <FilterIcon fontSize="small" />
            </ActionButton>
          )}
        </Box>
      </DashboardNavbar>

      {selectedWell ? (
        <>
          <Typography 
            variant={isSmallScreen ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 600, 
              color: '#333', 
              mb: { xs: 1, sm: 2 },
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              textAlign: { xs: 'center', sm: 'left' },
              px: { xs: 1, sm: 0 }
            }}
          >
            {isSmallScreen ? selectedWell.name : `${selectedWell.name} - Well Log Visualization`}
          </Typography>
          
          {/* Main Well Log Chart */}
          <ChartCard>
            <CardContent sx={{ height: '100%', p: 0, overflow: 'auto' }}>
              {/* Chart Header */}
              <Box sx={{ 
                display: 'flex', 
                borderBottom: '2px solid #e0e0e0',
                backgroundColor: '#fff',
              }}>
                <Box sx={{ 
                  width: '33.33%', 
                  p: 2, 
                  textAlign: 'center', 
                  borderRight: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                    Rock Composition
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '33.33%', 
                  p: 2, 
                  textAlign: 'center', 
                  borderRight: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                    DT
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '33.33%', 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: '#fafafa'
                }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                    GR
                  </Typography>
                </Box>
              </Box>
              
              {/* Chart Content */}
              <Box sx={{ 
                display: 'flex', 
                height: `calc((100% - 56px) * ${zoomLevel / 100})`,
                backgroundColor: '#fff',
                overflow: 'auto'
              }}>
                {/* Rock Composition Column */}
                <Box sx={{ 
                  width: '33.33%', 
                  height: '100%',
                  borderRight: '1px solid #e0e0e0',
                  position: 'relative',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Legend at top */}
                  <Box sx={{ 
                    p: 1,
                    display: 'flex',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    borderBottom: '1px solid #e0e0e0',
                    width:'50%',
                    margin:'0 auto'
                  }}>
                    {legendItems.map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 20, 
                          height: 8, 
                          backgroundColor: item.color,
                          border: '0.5px solid rgba(0,0,0,0.2)',
                          mr: 0.3
                        }} />
                        <Typography sx={{ fontSize: '8px', color: '#333' }}>{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Chart area */}
                  <Box sx={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden' }}>
                    {/* Rock composition continuous bands */}
                    <Box sx={{ 
                      position: 'relative',
                      width: '100%',
                      height: `${zoomLevel}%`,
                      minHeight: '100%'
                    }}>
                      {sortedData.map((item, index) => {
                        const nextItem = sortedData[index + 1];
                        const currentDepth = item.depth;
                        const nextDepth = nextItem ? nextItem.depth : maxDepth;
                        
                        const yPosition = ((currentDepth - minDepth) / (maxDepth - minDepth)) * 100;
                        const height = ((nextDepth - currentDepth) / (maxDepth - minDepth)) * 100;
                        
                        return (
                          <Box
                            key={index}
                            sx={{
                              position: 'absolute',
                              left: 0,
                              width: '50%',
                              top: `${yPosition}%`,
                              height: `${height}%`,
                              backgroundColor: getRockColor(item),
                              borderTop: index === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.2)',
                            }}
                          />
                        );
                      })}
                      
                      {/* Right side - alternating pattern */}
                      {sortedData.map((item, index) => {
                        const nextItem = sortedData[index + 1];
                        const currentDepth = item.depth;
                        const nextDepth = nextItem ? nextItem.depth : maxDepth;
                        
                        const yPosition = ((currentDepth - minDepth) / (maxDepth - minDepth)) * 100;
                        const height = ((nextDepth - currentDepth) / (maxDepth - minDepth)) * 100;
                        
                        // Alternate color for right side
                        const rightColor = getRockColor(item) === '#FF6B9D' ? '#4FC3F7' : '#FF6B9D';
                        
                        return (
                          <Box
                            key={`right-${index}`}
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              width: '50%',
                              top: `${yPosition}%`,
                              height: `${height}%`,
                              backgroundColor: index % 3 === 0 ? rightColor : getRockColor(item),
                              borderTop: index === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.2)',
                            }}
                          />
                        );
                      })}
                      
                      {/* Depth labels on the left */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: '100%',
                        pointerEvents: 'none'
                      }}>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percent) => {
                          const depth = minDepth + (maxDepth - minDepth) * (percent / 100);
                          return (
                            <React.Fragment key={percent}>
                              <Typography
                                sx={{
                                  position: 'absolute',
                                  top: `${percent}%`,
                                  left: '4px',
                                  fontSize: '10px',
                                  color: '#fff',
                                  fontWeight: 500,
                                  textShadow: '0 0 3px rgba(0,0,0,0.5)',
                                  zIndex: 10
                                }}
                              >
                                {Math.round(depth)}
                              </Typography>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: `${percent}%`,
                                  left: 0,
                                  right: 0,
                                  height: '1px',
                                  backgroundColor: 'rgba(255,255,255,0.3)',
                                }}
                              />
                            </React.Fragment>
                          );
                        })}
                      </Box>
                    </Box>

                  </Box>
                </Box>
                
                {/* DT Column - ZIGZAG Pattern */}
                <Box sx={{ 
                  width: '33.33%', 
                  height: '100%',
                  borderRight: '1px solid #e0e0e0',
                  position: 'relative',
                  backgroundColor: '#fff'
                }}>
                  {/* Top axis labels */}
                  <Box sx={{ 
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1,
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    {(() => {
                      const minDT = Math.min(...sortedData.map(d => d.DT));
                      const maxDT = Math.max(...sortedData.map(d => d.DT));
                      const range = maxDT - minDT;
                      const ticks = [];
                      for (let i = 0; i <= 7; i++) {
                        ticks.push(Math.round(minDT + (range * i / 7)));
                      }
                      return ticks.map((tick) => (
                        <Typography key={tick} sx={{ fontSize: '10px', color: '#666' }}>
                          {tick}
                        </Typography>
                      ));
                    })()}
                  </Box>
                  
                  {/* Zigzag chart area */}
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: `calc((100% - 40px) * ${zoomLevel / 100})`,
                    minHeight: 'calc(100% - 40px)',
                    overflow: 'hidden'
                  }}>
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      {/* Create zigzag path */}
                      <path
                        d={sortedData.map((item, index) => {
                          const yPos = ((item.depth - minDepth) / (maxDepth - minDepth)) * 100;
                          // Normalize DT values to fit the chart width (0-100)
                          const minDT = Math.min(...sortedData.map(d => d.DT));
                          const maxDT = Math.max(...sortedData.map(d => d.DT));
                          const xPos = ((item.DT - minDT) / (maxDT - minDT)) * 100;
                          return `${index === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
                        }).join(' ')}
                        stroke="#FF6B9D"
                        strokeWidth="0.5"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </Box>
                  
                  {/* DT Label */}
                  <Typography sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    right: 10,
                    fontSize: '10px',
                    color: '#FF6B9D',
                    fontWeight: 600
                  }}>
                    DT
                  </Typography>
                </Box>
                
                {/* GR Column - ZIGZAG Pattern */}
                <Box sx={{ 
                  width: '33.33%', 
                  height: '100%',
                  position: 'relative',
                  backgroundColor: '#fff'
                }}>
                  {/* Top axis labels */}
                  <Box sx={{ 
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1,
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    {(() => {
                      const minGR = Math.min(...sortedData.map(d => d.GR));
                      const maxGR = Math.max(...sortedData.map(d => d.GR));
                      const range = maxGR - minGR;
                      const ticks = [];
                      for (let i = 0; i <= 6; i++) {
                        ticks.push(Math.round(minGR + (range * i / 6)));
                      }
                      return ticks.map((tick) => (
                        <Typography key={tick} sx={{ fontSize: '10px', color: '#666' }}>
                          {tick}
                        </Typography>
                      ));
                    })()}
                  </Box>
                  
                  {/* Zigzag chart area */}
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: `calc((100% - 40px) * ${zoomLevel / 100})`,
                    minHeight: 'calc(100% - 40px)',
                    overflow: 'hidden'
                  }}>
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      {/* Create zigzag path */}
                      <path
                        d={sortedData.map((item, index) => {
                          const yPos = ((item.depth - minDepth) / (maxDepth - minDepth)) * 100;
                          // Normalize GR values to fit the chart width (0-100)
                          const minGR = Math.min(...sortedData.map(d => d.GR));
                          const maxGR = Math.max(...sortedData.map(d => d.GR));
                          const xPos = ((item.GR - minGR) / (maxGR - minGR)) * 100;
                          return `${index === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
                        }).join(' ')}
                        stroke="#4FC3F7"
                        strokeWidth="0.5"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </Box>
                  
                  {/* GR Label */}
                  <Typography sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    right: 10,
                    fontSize: '10px',
                    color: '#4FC3F7',
                    fontWeight: 600
                  }}>
                    GR
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </ChartCard>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Select a well to view drilling data
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Choose any well from the list to see the well log visualization
        </Typography>
      </Box>
    )}

    {/* Filter Menu */}
    <Menu
      anchorEl={filterMenuAnchor}
      open={Boolean(filterMenuAnchor)}
      onClose={handleFilterClose}
      PaperProps={{
        sx: { mt: 1, minWidth: 200 },
      }}
    >
      <MenuItem onClick={() => handleFilterSelect('well-type')}>Filter by Well Type</MenuItem>
      <MenuItem onClick={() => handleFilterSelect('date-range')}>Filter by Date Range</MenuItem>
      <MenuItem onClick={() => handleFilterSelect('depth-range')}>Filter by Depth Range</MenuItem>
      <MenuItem onClick={() => handleFilterSelect('rock-type')}>Filter by Rock Type</MenuItem>
      <Divider />
      <MenuItem onClick={() => handleFilterSelect('clear')}>Clear All Filters</MenuItem>
    </Menu>
  </DashboardContainer>
);
};

export default Dashboard;