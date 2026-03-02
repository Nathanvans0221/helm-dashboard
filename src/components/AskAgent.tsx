import { useState } from 'react';
import {
  Box, TextField, Typography, Paper, CircularProgress, IconButton,
} from '@mui/material';
import { Send, SmartToy, Close } from '@mui/icons-material';
import type { ProjectWithTasks } from '../types/helm';

interface AskAgentProps {
  projects: ProjectWithTasks[];
  open: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function analyzeLocally(question: string, projects: ProjectWithTasks[]): string {
  const q = question.toLowerCase();

  // Status queries
  if (q.includes('active') || q.includes('in progress')) {
    const active = projects.flatMap((p) =>
      p.tasks.filter((t) => t.status === 'IN_PROGRESS').map((t) => ({ project: p.projectName, ...t }))
    );
    if (active.length === 0) return 'No tasks are currently in progress.';
    return `**${active.length} active task(s):**\n${active.map((t) => `- **${t.title}** (${t.project}) in ${t.repo}${t.assignee ? ` — @${t.assignee.split('@')[0]}` : ''}`).join('\n')}`;
  }

  if (q.includes('blocked')) {
    const blocked = projects.flatMap((p) =>
      p.tasks.filter((t) => t.blockedBy.length > 0).map((t) => ({ project: p.projectName, ...t }))
    );
    if (blocked.length === 0) return 'No tasks are currently blocked.';
    return `**${blocked.length} blocked task(s):**\n${blocked.map((t) => `- **${t.title}** (${t.project}) — blocked by ${t.blockedBy.length} task(s)`).join('\n')}`;
  }

  if (q.includes('ready') || q.includes('pick up') || q.includes('available')) {
    const ready = projects.flatMap((p) =>
      p.tasks.filter((t) => t.status === 'READY' && t.blockedBy.length === 0).map((t) => ({ project: p.projectName, ...t }))
    );
    if (ready.length === 0) return 'No tasks are ready to be picked up.';
    return `**${ready.length} task(s) ready for pickup:**\n${ready.map((t) => `- **${t.title}** (${t.project}) in ${t.repo}${t.priority !== 'NORMAL' ? ` [${t.priority}]` : ''}`).join('\n')}`;
  }

  if (q.includes('complete') || q.includes('done') || q.includes('finished')) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    const completed = projects.reduce((s, p) => s + (p.statusCounts?.completed ?? 0), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return `**Overall completion: ${completed}/${total} tasks (${pct}%)**\n\n${projects.filter((p) => p.tasks.length > 0).map((p) => {
      const done = p.statusCounts?.completed ?? 0;
      const t = p.tasks.length;
      return `- ${p.projectName}: ${done}/${t} (${t > 0 ? Math.round((done / t) * 100) : 0}%)`;
    }).join('\n')}`;
  }

  if (q.includes('summary') || q.includes('overview') || q.includes('status')) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    const active = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'IN_PROGRESS').length, 0);
    const ready = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'READY').length, 0);
    const completed = projects.reduce((s, p) => s + (p.statusCounts?.completed ?? 0), 0);
    return `**AI Helm Overview:**\n- **${projects.length}** projects, **${total}** total tasks\n- **${active}** in progress, **${ready}** ready, **${completed}** completed\n\n${projects.map((p) => `**${p.projectName}** — ${p.tasks.length} tasks (${p.statusCounts?.completed ?? 0} done)`).join('\n')}`;
  }

  // Project-specific
  const matchedProject = projects.find((p) => q.includes(p.projectName.toLowerCase()));
  if (matchedProject) {
    const p = matchedProject;
    const counts = p.statusCounts;
    return `**${p.projectName}:**\n- Tech Lead: ${p.techLeadEmail}\n- Product Lead: ${p.productLeadEmail}\n- Tasks: ${p.tasks.length}${counts ? `\n- Init: ${counts.initialized}, Ready: ${counts.ready}, Active: ${counts.inProgress}, Pending: ${counts.pending}, Done: ${counts.completed}` : ''}\n\n${p.tasks.map((t) => `- [${t.status}] **${t.title}** (${t.repo})`).join('\n')}`;
  }

  return `I can answer questions about your AI Helm projects and tasks. Try asking about:\n- "What's active?" or "What's in progress?"\n- "Any blocked tasks?"\n- "What's ready to pick up?"\n- "Overall completion status"\n- "Summary" for an overview\n- Or ask about a specific project by name`;
}

export default function AskAgent({ projects, open, onClose }: AskAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Local analysis (no external AI call needed for structured data queries)
    const response = analyzeLocally(userMsg, projects);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Paper
      sx={{
        position: 'fixed', bottom: 16, right: 16, width: 400, maxHeight: '60vh',
        display: 'flex', flexDirection: 'column', zIndex: 1300,
        border: '1px solid rgba(96,165,250,0.3)', overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 1.5, bgcolor: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>Ask Helm</Typography>
        <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 350 }}>
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Ask me about your projects and tasks
          </Typography>
        )}
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: msg.role === 'user' ? 'primary.main' : 'rgba(148,163,184,0.1)',
              color: msg.role === 'user' ? 'white' : 'text.primary',
              px: 1.5, py: 1, borderRadius: 2, maxWidth: '85%',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
              {msg.content}
            </Typography>
          </Box>
        ))}
        {loading && <CircularProgress size={20} sx={{ alignSelf: 'center' }} />}
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask about projects, tasks, status..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Paper>
  );
}
