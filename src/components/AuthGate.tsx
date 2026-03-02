import { useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, RocketLaunch } from '@mui/icons-material';
import { initClient } from '../services/helmApi';

interface AuthGateProps {
  onAuth: () => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [token, setToken] = useState(() => localStorage.getItem('helm_token') ?? '');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = token.trim();
    if (!trimmed) { setError('Token is required'); return; }
    try {
      initClient(trimmed);
      // Quick validation — try listing projects
      const { searchProjects } = await import('../services/helmApi');
      await searchProjects();
      localStorage.setItem('helm_token', trimmed);
      onAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid token or API unreachable');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <RocketLaunch sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>AI Helm Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Paste your FusionAuth bearer token to connect
        </Typography>
        <TextField
          fullWidth
          label="Bearer Token"
          value={token}
          onChange={(e) => { setToken(e.target.value); setError(''); }}
          type={showToken ? 'text' : 'password'}
          error={!!error}
          helperText={error || 'Get your token from: claude → helm_authenticate'}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                    {showToken ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" fullWidth size="large" onClick={handleSubmit}>
          Connect
        </Button>
      </Paper>
    </Box>
  );
}
