import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress, Link,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import {
  startDeviceAuth, pollDeviceToken, initClient, storeAuth,
  getStoredAuth, refreshAccessToken,
} from '../services/helmApi';
import { BRAND } from '../theme/theme';

interface AuthGateProps {
  onAuth: () => void;
}

type AuthStep = 'idle' | 'loading' | 'waiting' | 'error';

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [step, setStep] = useState<AuthStep>('idle');
  const [userCode, setUserCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [error, setError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceCodeRef = useRef('');

  // On mount, try to restore session
  useEffect(() => {
    const tryRestore = async () => {
      const auth = getStoredAuth();
      if (!auth) return;

      // Token still valid
      if (auth.expiresAt > Date.now() + 60_000) {
        initClient(auth.accessToken);
        onAuth();
        return;
      }

      // Try refresh
      if (auth.refreshToken) {
        setStep('loading');
        const refreshed = await refreshAccessToken(auth.refreshToken);
        if (refreshed) {
          initClient(refreshed.accessToken);
          onAuth();
          return;
        }
      }
      setStep('idle');
    };
    tryRestore();
  }, [onAuth]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleLogin = async () => {
    setStep('loading');
    setError('');
    try {
      const data = await startDeviceAuth();
      setUserCode(data.user_code);
      setVerifyUrl(data.verification_uri_complete || data.verification_uri);
      deviceCodeRef.current = data.device_code;
      setStep('waiting');

      // Open the verification URL
      window.open(data.verification_uri_complete || data.verification_uri, '_blank');

      // Start polling
      const interval = (data.interval || 5) * 1000;
      pollingRef.current = setInterval(async () => {
        try {
          const result = await pollDeviceToken(deviceCodeRef.current);
          if (result.access_token) {
            // Success
            if (pollingRef.current) clearInterval(pollingRef.current);
            const session = {
              accessToken: result.access_token,
              refreshToken: result.refresh_token ?? '',
              expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
            };
            storeAuth(session);
            initClient(session.accessToken);
            onAuth();
          } else if (result.error && result.error !== 'authorization_pending') {
            // Fatal error (not just "still waiting")
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError(result.error === 'slow_down' ? 'Too many requests, try again' : `Auth failed: ${result.error}`);
            setStep('error');
          }
          // authorization_pending = keep polling
        } catch {
          // Network error during poll, keep trying
        }
      }, interval);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start login');
      setStep('error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <Box component="img" src="/icon.svg" sx={{ height: 56, width: 56, mb: 2 }} alt="Silver Fern" />
        <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700, color: BRAND.lightSilver }}>
          AI Helm
        </Typography>
        <Typography variant="caption" sx={{
          display: 'block', mb: 3, color: BRAND.stirling,
          fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Silver Fern
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in with your Silver Fern account
        </Typography>

        {step === 'idle' && (
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleLogin}
            sx={{ py: 1.5, bgcolor: BRAND.fern, '&:hover': { bgcolor: BRAND.fernDark } }}
          >
            Login with Silver Fern
          </Button>
        )}

        {step === 'loading' && (
          <Box sx={{ py: 2 }}>
            <CircularProgress size={32} sx={{ color: BRAND.fern }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Connecting...
            </Typography>
          </Box>
        )}

        {step === 'waiting' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A login page has been opened. If it didn't open, click below:
            </Typography>
            <Link
              href={verifyUrl}
              target="_blank"
              rel="noopener"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, fontSize: '0.95rem', color: BRAND.spring }}
            >
              Open Login Page <OpenInNew sx={{ fontSize: 16 }} />
            </Link>

            <Box sx={{
              my: 2, py: 2, px: 3, bgcolor: 'rgba(200,200,200,0.06)',
              borderRadius: 2, border: '1px solid rgba(200,200,200,0.12)',
            }}>
              <Typography variant="caption" color="text.secondary">Your code</Typography>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 4, color: BRAND.fern }}>
                {userCode}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} sx={{ color: BRAND.fern }} />
              <Typography variant="body2" color="text.secondary">
                Waiting for you to sign in...
              </Typography>
            </Box>

            <Button
              variant="text"
              size="small"
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setStep('idle');
              }}
              sx={{ mt: 2, color: BRAND.stirling }}
            >
              Cancel
            </Button>
          </Box>
        )}

        {step === 'error' && (
          <Box>
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{ bgcolor: BRAND.fern, '&:hover': { bgcolor: BRAND.fernDark } }}
            >
              Try Again
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
