'use client';
import { useEffect } from 'react';

export default function DemoAgentPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = "https://agent.d-id.com/v2/index.js";
    script.setAttribute('data-mode', 'full');
    script.setAttribute('data-client-key', 'Z29vZ2xlLWh9dXR0mnwxMDU2NzkzNzAxNDc5MTI');
    script.setAttribute('data-agent-id', 'v2_agt_Y4OPERLW');
    script.setAttribute('data-name', 'did-agent');
    script.setAttribute('data-monitor', 'true');
    script.setAttribute('data-target-id', 'agent-container');
    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        backgroundColor: '#f9f9f9',
        flexDirection: 'column',
      }}
    >
      <h1 style={{ marginBottom: '1rem', fontSize: '2rem', textAlign: 'center' }}>
        Meet Our AI Agent
      </h1>
      <div
        id="agent-container"
        style={{
          width: '100%',
          height: '75vh',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#fff',
        }}
      />
    </div>
  );
}
