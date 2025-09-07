/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  AttachFile as AttachFileIcon,
  Stop as StopIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { styled } from '@mui/material/styles';
import { getChatbotResponse } from '../api/chatbot';

const ChatContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: { xs: '8px', sm: '12px' },
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[4],
  [theme.breakpoints.down('sm')]: {
    borderRadius: '0',
    border: 'none',
    boxShadow: 'none',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '64px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5),
    minHeight: '56px',
  },
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  minHeight: 0, // Ensures proper flex behavior
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[300],
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})(({ isUser, theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[50],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  maxWidth: '85%',
  wordWrap: 'break-word',
  boxShadow: isUser ? theme.shadows[2] : theme.shadows[1],
  border: isUser ? 'none' : `1px solid ${theme.palette.grey[200]}`,
  fontSize: '0.875rem',
  lineHeight: 1.5,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(1),
  transition: theme.transitions.create(['box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '90%',
    padding: theme.spacing(1.25, 1.5),
    fontSize: '0.8rem',
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  },
  [theme.breakpoints.down('xs')]: {
    maxWidth: '95%',
    padding: theme.spacing(1, 1.25),
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(1),
    gap: theme.spacing(0.5),
  },
}));

const Chatbot = ({ selectedWell, uploadedData }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your drilling data assistant. I can help you analyze well data, explain drilling parameters, and answer questions about your uploaded data. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    // Check if this is a voice message
    const isVoiceMessage = inputValue.includes('Voice message') || audioBlob;

    // Process files if any are selected
    let processedFiles = [];
    if (selectedFiles.length > 0) {
      processedFiles = await processFiles(selectedFiles);
    }

    const userMessage = {
      id: Date.now(),
      text: inputValue || 'File(s) uploaded',
      isUser: true,
      timestamp: new Date(),
      files: processedFiles.length > 0 ? selectedFiles.map(file => ({ name: file.name, size: file.size })) : undefined,
      isVoice: isVoiceMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedFiles([]);
    setAudioBlob(null);
    setIsLoading(true);

    try {
      // Prepare context for the chatbot
      const context = {
        selectedWell,
        uploadedData,
        hasUploadedData: uploadedData && uploadedData.length > 0,
        dataPoints: uploadedData ? uploadedData.length : 0,
      };

      // Add file contents to context if available
      if (processedFiles.length > 0) {
        context.attachedFiles = processedFiles;
      }

      // Prepare the message for the API
      let messageForAPI = userMessage.text;
      if (processedFiles.length > 0) {
        messageForAPI += `\n\n[User has attached ${processedFiles.length} file(s): ${processedFiles.map(f => f.name).join(', ')}]`;
      }
      if (isVoiceMessage) {
        messageForAPI += ' [This message was sent via voice input]';
      }

      const response = await getChatbotResponse(messageForAPI, context);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later or check if your API key is configured correctly.",
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice recording functions with real-time speech recognition
  const startRecording = async () => {
    try {
      // Check if browser supports Web Speech API for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setInputValue(finalTranscript + interimTranscript);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        setMediaRecorder(recognition);
        recognition.start();
        setIsRecording(true);
      } else {
        // Fallback to audio recording if speech recognition is not supported
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          setAudioBlob(audioBlob);
          
          // Show placeholder since we can't transcribe without speech recognition
          setInputValue('Voice message recorded (Speech recognition not supported)');
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      if (mediaRecorder.stop) {
        mediaRecorder.stop(); // For MediaRecorder
      } else if (mediaRecorder.abort) {
        mediaRecorder.abort(); // For SpeechRecognition
      }
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    return new Promise((resolve, reject) => {
      // Check if browser supports Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported, using placeholder');
        resolve('Voice message recorded (Speech recognition not supported in this browser)');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        resolve('Voice message recorded (Could not transcribe audio)');
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
      };
      
      // For real-time transcription, we'd need to convert the audioBlob to audio stream
      // For now, we'll use a simpler approach with live recognition
      try {
        recognition.start();
        
        // Stop recognition after 10 seconds if no result
        setTimeout(() => {
          recognition.stop();
          resolve('Voice message recorded (Transcription timeout)');
        }, 10000);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        resolve('Voice message recorded (Speech recognition error)');
      }
    });
  };

  // SpeedDial actions
  const speedDialActions = [
    {
      icon: <AttachFileIcon />,
      name: 'Attach File',
      onClick: () => document.getElementById('file-input').click()
    },
    {
      icon: isRecording ? <MicOffIcon /> : <MicIcon />,
      name: isRecording ? 'Stop Recording' : 'Voice Recording',
      onClick: isRecording ? stopRecording : startRecording
    }
  ];

  // File upload functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const validTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      
      if (!validTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported. Please upload PDF, DOC, TXT, CSV, Excel, or image files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    event.target.value = ''; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async (files) => {
    setIsProcessingFiles(true);
    const fileContents = [];
    
    for (const file of files) {
      try {
        let content = '';
        
        if (file.type.startsWith('text/')) {
          content = await file.text();
        } else if (file.type === 'application/pdf') {
          // For PDF files, you'd typically use a library like pdf-parse or PDF.js
          content = `[PDF File: ${file.name} - ${(file.size / 1024).toFixed(1)}KB]`;
        } else if (file.type.startsWith('image/')) {
          // For images, you might want to use OCR or just show file info
          content = `[Image File: ${file.name} - ${(file.size / 1024).toFixed(1)}KB]`;
        } else {
          content = `[File: ${file.name} - ${(file.size / 1024).toFixed(1)}KB]`;
        }
        
        fileContents.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileContents.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: `[Error reading file: ${file.name}]`
        });
      }
    }
    
    setIsProcessingFiles(false);
    return fileContents;
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (selectedWell) {
      suggestions.push(`Tell me about ${selectedWell.name}`);
    }
    
    if (uploadedData && uploadedData.length > 0) {
      suggestions.push('Analyze my uploaded data');
      suggestions.push('What rock types are in my data?');
    }
    
    suggestions.push('Explain DT and GR parameters');
    suggestions.push('What is drilling analysis?');
    
    return suggestions;
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setMessages([]);
    setSelectedFiles([]);
    setInputValue('');
    setAudioBlob(null);
  };

  return (
    <ChatContainer elevation={8}>
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Assistant
            </Typography>
          </Box>
          <IconButton
            onClick={clearHistory}
            size="small"
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#f0f0f0',
                color: '#1976d2',
              },
            }}
            title="Clear History"
          >
            <ClearAllIcon fontSize="small" />
          </IconButton>
        </Box>
      </ChatHeader>


          <MessagesContainer>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
              {messages.map((message) => (
                <Box 
                  key={message.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 1, 
                    width: '100%', 
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  {!message.isUser && (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: message.isError ? 'error.main' : 'primary.main',
                        flexShrink: 0
                      }}
                    >
                      <BotIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                  <MessageBubble isUser={message.isUser}>
                    {/* Display file attachments if present */}
                    {message.files && message.files.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        {message.files.map((file, fileIndex) => (
                          <Box key={fileIndex} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 0.5,
                            p: 1,
                            backgroundColor: message.isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}>
                            <AttachFileIcon sx={{ mr: 1, fontSize: '14px', opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ flexGrow: 1 }}>
                              {file.name} ({(file.size / 1024).toFixed(1)}KB)
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {/* Display voice message indicator if present */}
                    {message.isVoice && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        p: 1,
                        backgroundColor: message.isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '8px'
                      }}>
                        <MicIcon sx={{ mr: 1, fontSize: '14px', opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                          Voice message
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        lineHeight: 1.5,
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.text}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: '0.75rem'
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </MessageBubble>
                  {message.isUser && (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: 'grey.500',
                        flexShrink: 0
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                </Box>
              ))}
              
              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', flexShrink: 0 }}>
                    <BotIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <MessageBubble isUser={false}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} color="primary" />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Thinking...</Typography>
                    </Box>
                  </MessageBubble>
                </Box>
              )}
            </Box>
            
            {messages.length === 1 && (
              <Box sx={{ mt: 2, p: 2 }}>
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  sx={{ 
                    mb: 1.5, 
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.8rem'
                  }}
                >
                  💡 Try asking:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {getSuggestions().slice(0, 4).map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      variant="outlined"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{ 
                        cursor: 'pointer', 
                        fontSize: '0.75rem',
                        justifyContent: 'flex-start',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          borderColor: 'primary.main'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <Divider />
          
          {/* File attachments display */}
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Attached Files ({selectedFiles.length}):
              </Typography>
              {selectedFiles.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon sx={{ mr: 1, color: '#1976d2', fontSize: '16px' }} />
                  <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '14px' }}>
                    {file.name} ({(file.size / 1024).toFixed(1)}KB)
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeFile(index)}
                    sx={{ ml: 1, color: '#f44336' }}
                  >
                    ×
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <InputContainer>
            {/* Hidden file input */}
            <input
              id="file-input"
              type="file"
              ref={(ref) => (window.fileInputRef = ref)}
              style={{ display: 'none' }}
              multiple
              accept=".txt,.pdf,.doc,.docx,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileSelect}
            />

            {/* SpeedDial for actions */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              mr: 1, 
              height: 48,
              [theme.breakpoints.down('xs')]: {
                mr: 0.5,
                height: 44,
              }
            }}>
              <SpeedDial
                ariaLabel="Chat actions"
                sx={{
                  position: 'static',
                  height: 48,
                  '& .MuiSpeedDial-fab': {
                    width: 40,
                    height: 40,
                    minHeight: 40,
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                    [theme.breakpoints.down('xs')]: {
                      width: 36,
                      height: 36,
                      minHeight: 36,
                    },
                  },
                  [theme.breakpoints.down('xs')]: {
                    height: 44,
                  },
                }}
                icon={<SpeedDialIcon />}
                direction="up"
                hidden={isLoading || isProcessingFiles}
              >
                {speedDialActions.map((action) => (
                  <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={action.onClick}
                    sx={{
                      '& .MuiSpeedDialAction-fab': {
                        backgroundColor: action.name.includes('Recording') && isRecording ? '#f44336' : '#fff',
                        color: action.name.includes('Recording') && isRecording ? '#fff' : '#666',
                        '&:hover': {
                          backgroundColor: action.name.includes('Recording') && isRecording ? '#d32f2f' : '#f0f0f0',
                        },
                      },
                    }}
                  />
                ))}
              </SpeedDial>
            </Box>

            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder={isRecording ? 'Listening...' : (selectedWell ? `Ask about ${selectedWell.name} data...` : "Ask about drilling data...")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isRecording}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: isRecording ? '#ffebee' : 'background.default',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontSize: '1rem',
                  [theme.breakpoints.down('xs')]: {
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading || isRecording}
              sx={{ 
                borderRadius: '50%',
                width: 48,
                height: 48,
                minWidth: 48,
                minHeight: 48,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                },
                transition: 'all 0.2s ease-in-out',
                ml: 1,
                [theme.breakpoints.down('xs')]: {
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  minHeight: 44,
                  ml: 0.5,
                }
              }}
            >
              <SendIcon sx={{ 
                fontSize: 20,
                [theme.breakpoints.down('xs')]: {
                  fontSize: 18,
                }
              }} />
            </IconButton>
          </InputContainer>
    </ChatContainer>
  );
};

export default Chatbot;