'use client';

import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

export default function DemoAgentPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.setAttribute('data-mode', 'full');
    script.setAttribute(
      'data-client-key',
      'Z29vZ2xlLW9hdXRoMnwxMDU2NzkzNzAxNDc5MTU5NDI5OTk6SUwtUTYtcmdGclRaenMxSzctWFl3'
    );
    script.setAttribute('data-agent-id', 'v2_agt_oBb8zgZN');
    script.setAttribute('data-name', 'did-agent');
    script.setAttribute('data-monitor', 'true');
    script.setAttribute('data-target-id', 'agent-container');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); 
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Typography
        variant="h4"
        align="center"
        sx={{ mb: 3 }}
      >
        Meet Our AI Agent
      </Typography>

      <Box
        id="agent-container"
        sx={{
          width: '100%',
          maxWidth: '90vw',
          height: '75vh',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: '#fff',
        }}
      />
    </Box>
  );
}
