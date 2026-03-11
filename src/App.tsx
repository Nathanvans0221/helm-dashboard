import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Fab, Tooltip,
  CircularProgress, Button, Chip, ThemeProvider, CssBaseline,
} from '@mui/material';
import {
  Search, Refresh, SmartToy, Logout, FilterList, LightMode, DarkMode,
} from '@mui/icons-material';
import { initClient, clearAuth, getStoredAuth, refreshAccessToken } from './services/helmApi';
import { useProjects, useDashboardStats } from './hooks/useHelmData';
import { getTheme, BRAND } from './theme/theme';
import AuthGate from './components/AuthGate';
import StatsCards from './components/StatsCards';
import StatusChart from './components/StatusChart';
import ProjectCard from './components/ProjectCard';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import AskAgent from './components/AskAgent';

function getStoredMode(): 'light' | 'dark' {
  const stored = localStorage.getItem('helm_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(getStoredMode);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('helm_theme', next);
  };

  const { projects, loading, error, load } = useProjects();
  const stats = useDashboardStats(projects);

  const scheduleRefresh = useCallback(() => {
    const auth = getStoredAuth();
    if (!auth?.refreshToken || !auth.expiresAt) return;
    const msUntilExpiry = auth.expiresAt - Date.now() - 120_000;
    if (msUntilExpiry <= 0) {
      refreshAccessToken(auth.refreshToken).then((session) => {
        if (session) initClient(session.accessToken);
        else { clearAuth(); setAuthed(false); }
      });
      return;
    }
    const timer = setTimeout(() => {
      refreshAccessToken(auth.refreshToken).then((session) => {
        if (session) {
          initClient(session.accessToken);
          scheduleRefresh();
        } else {
          clearAuth();
          setAuthed(false);
        }
      });
    }, msUntilExpiry);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authed) {
      const cleanup = scheduleRefresh();
      return cleanup;
    }
  }, [authed, scheduleRefresh]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const handleLogout = () => {
    clearAuth();
    setAuthed(false);
  };

  if (!authed) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthGate onAuth={() => setAuthed(true)} />
      </ThemeProvider>
    );
  }

  const filtered = projects.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const match = p.projectName?.toLowerCase().includes(q) ||
        p.techLeadEmail?.toLowerCase().includes(q) ||
        p.productLeadEmail?.toLowerCase().includes(q) ||
        p.tasks.some((t) => t.title?.toLowerCase().includes(q) || t.repo?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter) {
      return p.tasks.some((t) => t.status === statusFilter);
    }
    return true;
  });

  const isDark = mode === 'dark';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Header */}
        <Box sx={{
          px: 3, py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: 'background.paper',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box component="img" src="/icon.svg" sx={{ height: 32, width: 32 }} alt="Silver Fern" />
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                AI Helm
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Silver Fern
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            placeholder="Search projects, tasks, repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              },
            }}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': { borderColor: BRAND.fern },
              },
            }}
          />
          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggleMode} sx={{ color: 'text.secondary' }}>
              {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => load()} disabled={loading} sx={{ color: 'text.secondary' }}>
              {loading ? <CircularProgress size={20} sx={{ color: BRAND.fern }} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: 'text.secondary' }}>
              <Logout sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          {error && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(186,54,54,0.1)', borderRadius: 2, border: '1px solid rgba(186,54,54,0.3)' }}>
              <Typography color="error" variant="body2">{error}</Typography>
              <Button size="small" onClick={() => load()} sx={{ mt: 1, color: BRAND.spring }}>Retry</Button>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <StatsCards {...stats} />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1, bgcolor: 'background.paper', borderRadius: 2, p: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Task Status Breakdown</Typography>
              <StatusChart counts={stats.statusBreakdown} total={stats.totalTasks} />
            </Box>
            <Box sx={{ width: 280, bgcolor: 'background.paper', borderRadius: 2, p: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FilterList sx={{ fontSize: 16 }} /> Filter by Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {['IN_PROGRESS', 'READY', 'PENDING', 'INITIALIZED', 'COMPLETED', 'DENIED'].map((s) => (
                  <Chip
                    key={s}
                    label={s.replace('_', ' ')}
                    size="small"
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    variant={statusFilter === s ? 'filled' : 'outlined'}
                    sx={{
                      justifyContent: 'flex-start',
                      ...(statusFilter === s && { bgcolor: BRAND.fern, color: 'white' }),
                    }}
                  />
                ))}
                {statusFilter && (
                  <Button size="small" onClick={() => setStatusFilter(null)} sx={{ mt: 0.5, color: BRAND.spring }}>
                    Clear filter
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Projects</Typography>
            <Chip label={filtered.length} size="small" sx={{ bgcolor: 'action.hover', color: BRAND.fern }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {loading && projects.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: BRAND.fern }} /></Box>
            ) : filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {search || statusFilter ? 'No projects match your filters' : 'No projects found'}
              </Typography>
            ) : (
              filtered.map((p) => (
                <ProjectCard key={p.id} project={p} onTaskClick={setSelectedTaskId} />
              ))
            )}
          </Box>
        </Box>

        <TaskDetailDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

        <Tooltip title="Ask Helm Agent">
          <Fab
            onClick={() => setAskOpen(!askOpen)}
            sx={{
              position: 'fixed',
              bottom: askOpen ? 'calc(60vh + 24px)' : 16,
              right: 16,
              transition: 'bottom 0.3s',
              bgcolor: BRAND.fern,
              color: 'white',
              '&:hover': { bgcolor: BRAND.fernDark },
            }}
          >
            <SmartToy />
          </Fab>
        </Tooltip>
        <AskAgent projects={projects} open={askOpen} onClose={() => setAskOpen(false)} />
      </Box>
    </ThemeProvider>
  );
}
