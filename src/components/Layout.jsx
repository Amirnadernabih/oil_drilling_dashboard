/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme, Drawer, IconButton } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';

const LayoutContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
  width: '100vw',
  overflowX: 'hidden',
}));

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  marginTop: '64px',
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  [theme.breakpoints.down('sm')]: {
    marginTop: '56px',
  },
  position: 'relative',
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  flexShrink: 0,
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e0e0e0',
  [theme.breakpoints.down('md')]: {
    display: 'none', // Hide on mobile/tablet, use drawer instead
  },
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0, // Prevent flex item from overflowing
  [theme.breakpoints.down('lg')]: {
    marginRight: 0, // Remove chatbot margin on smaller screens
  },
}));

const ChatbotContainer = styled(Box)(({ theme }) => ({
  width: '400px',
  flexShrink: 0,
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e0e0e0',
  [theme.breakpoints.down('lg')]: {
    display: 'none', // Hide chatbot on tablets and mobile
  },
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  // Align with the right side of the top navbar on mobile
  top: '12px',
  right: '12px',
  // Ensure button sits above Navbar (Navbar sets zIndex to drawer + 1)
  zIndex: theme.zIndex.drawer + 10,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  width: 40,
  height: 40,
  padding: 6,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MobileChatbotButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: theme.zIndex.fab,
  backgroundColor: theme.palette.secondary.main,
  color: 'white',
  width: '56px',
  height: '56px',
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
  [theme.breakpoints.up('lg')]: {
    display: 'none',
  },
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '280px',
    marginTop: '56px',
    height: 'calc(100vh - 56px)',
    [theme.breakpoints.up('sm')]: {
      marginTop: '64px',
      height: 'calc(100vh - 64px)',
    },
  },
}));

const ChatbotDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '100%',
    maxWidth: '400px',
    height: '100vh',
  },
}));

const Layout = ({ children, selectedWell, onWellSelect, uploadedData, uploadedWells, onUpload }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [chatbotDrawerOpen, setChatbotDrawerOpen] = useState(false);

  const handleWellSelect = (well) => {
    onWellSelect(well);
    if (isMobile) {
      setMobileDrawerOpen(false); // Close drawer after selection on mobile
    }
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const toggleChatbotDrawer = () => {
    setChatbotDrawerOpen(!chatbotDrawerOpen);
  };

  return (
    <LayoutContainer>
      {/* Top Navbar */}
      <Navbar />
      
      {/* Mobile Menu Button */}
      <MobileMenuButton onClick={toggleMobileDrawer}>
        <MenuIcon />
      </MobileMenuButton>

      {/* Mobile Chatbot Button */}
      <MobileChatbotButton onClick={toggleChatbotDrawer}>
        💬
      </MobileChatbotButton>
      
      {/* Main Content Area */}
      <MainContainer>
        {/* Desktop Sidebar */}
        <SidebarContainer>
          <Sidebar 
            selectedWell={selectedWell}
            onWellSelect={handleWellSelect}
            isMobile={false}
            uploadedWells={uploadedWells}
          />
        </SidebarContainer>

        {/* Mobile Sidebar Drawer */}
        <MobileDrawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          variant="temporary"
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setMobileDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Sidebar 
            selectedWell={selectedWell}
            onWellSelect={handleWellSelect}
            isMobile={true}
            uploadedWells={uploadedWells}
          />
        </MobileDrawer>

        {/* Content Area */}
        <ContentArea>
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 0, // Removed padding for edge-to-edge dashboard layout
            display: 'flex',
            flexDirection: 'column',
            gap: 0 // Removed gap for tighter layout
          }}>
            {children}
          </Box>
        </ContentArea>

        {/* Desktop Chatbot */}
        <ChatbotContainer>
          <Chatbot 
            selectedWell={selectedWell}
            uploadedData={uploadedData}
            onUpload={onUpload}
          />
        </ChatbotContainer>

        {/* Mobile/Tablet Chatbot Drawer */}
        <ChatbotDrawer
          anchor="right"
          open={chatbotDrawerOpen}
          onClose={() => setChatbotDrawerOpen(false)}
          variant="temporary"
        >
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <IconButton onClick={() => setChatbotDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Chatbot 
            selectedWell={selectedWell}
            uploadedData={uploadedData}
            onUpload={onUpload}
            onClose={() => setChatbotDrawerOpen(false)}
          />
        </ChatbotDrawer>
      </MainContainer>
    </LayoutContainer>
  );
};

export default Layout;