/* eslint-disable no-unused-vars */
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  zIndex: theme.zIndex.drawer + 1,
  height: '64px',
  [theme.breakpoints.down('sm')]: {
    height: '56px',
  },
}));



const Navbar = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <StyledAppBar position="fixed">
      <Toolbar sx={{ 
        justifyContent: 'flex-start', 
        minHeight: { xs: 56, sm: 64 },
        px: { xs: 2, sm: 3 },
        py: { xs: 1, sm: 1.5 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <Box 
            component="img" 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='orange'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z'/%3E%3C/svg%3E"
            alt="Drill AI Logo"
            sx={{ 
              width: { xs: 20, sm: 24 }, 
              height: { xs: 20, sm: 24 }, 
              mr: { xs: 0.75, sm: 1 },
              flexShrink: 0
            }}
          />
          <Typography 
            variant={isSmallScreen ? "subtitle1" : "h6"} 
            sx={{ 
              fontWeight: 600,
              color: '#000',
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {isSmallScreen ? "Drill AI" : "Drill AI Intelligence Platform"}
          </Typography>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;