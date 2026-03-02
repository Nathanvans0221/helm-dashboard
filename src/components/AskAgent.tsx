import { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, Typography, Paper, CircularProgress, IconButton,
} from '@mui/material';
import { Send, SmartToy, Close } from '@mui/icons-material';
import { BRAND } from '../theme/theme';
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

// Simple markdown renderer — handles **bold**, `code`, - lists, and \n
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <Box sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
      {lines.map((line, i) => {
        const isBullet = line.startsWith('- ');
        const content = isBullet ? line.slice(2) : line;

        // Parse inline markdown: **bold** and `code`
        const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <Box
                key={j}
                component="code"
                sx={{
                  bgcolor: 'rgba(200,200,200,0.1)',
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                }}
              >
                {part.slice(1, -1)}
              </Box>
            );
          }
          return <span key={j}>{part}</span>;
        });

        if (isBullet) {
          return (
            <Box key={i} sx={{ display: 'flex', gap: 0.5, pl: 0.5, mt: i > 0 ? 0.25 : 0 }}>
              <Box component="span" sx={{ color: 'text.secondary', flexShrink: 0 }}>&#8226;</Box>
              <Box component="span">{rendered}</Box>
            </Box>
          );
        }

        // Blank lines become spacing
        if (line.trim() === '') {
          return <Box key={i} sx={{ height: 6 }} />;
        }

        return (
          <Box key={i} sx={{ mt: i > 0 && !lines[i - 1]?.startsWith('- ') ? 0.25 : 0 }}>
            {rendered}
          </Box>
        );
      })}
    </Box>
  );
}

function analyzeLocally(question: string, projects: ProjectWithTasks[]): string {
  const q = question.toLowerCase();

  // Greeting / identity
  if (q.match(/^(hi|hey|hello|sup|yo)\b/) || q.match(/who are you|what are you|what can you do|help me/)) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    return `Hey! I'm the Helm assistant. I have access to **${projects.length} projects** with **${total} tasks** right now.\n\nI can help with:\n- Project details — ask about any project by name\n- Task status — what's active, blocked, ready, or done\n- Progress — completion rates across projects\n- Overview — get a quick summary of everything\n\nJust ask away!`;
  }

  // Status queries
  if (q.includes('active') || q.includes('in progress')) {
    const active = projects.flatMap((p) =>
      p.tasks.filter((t) => t.status === 'IN_PROGRESS').map((t) => ({ project: p.projectName, ...t }))
    );
    if (active.length === 0) return 'No tasks are currently in progress.';
    return `**${active.length} active task(s):**\n${active.map((t) => `- **${t.title}** (${t.project}) in \`${t.repo}\`${t.assignee ? ` — @${t.assignee.split('@')[0]}` : ''}`).join('\n')}`;
  }

  if (q.includes('blocked')) {
    const blocked = projects.flatMap((p) =>
      p.tasks.filter((t) => t.blockedBy.length > 0).map((t) => ({ project: p.projectName, ...t }))
    );
    if (blocked.length === 0) return 'No tasks are currently blocked.';
    if (blocked.length > 10) {
      const byProject = new Map<string, number>();
      blocked.forEach((t) => byProject.set(t.project, (byProject.get(t.project) ?? 0) + 1));
      return `**${blocked.length} blocked tasks** across ${byProject.size} projects:\n${[...byProject.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => `- **${name}** — ${count} blocked`).join('\n')}\n\nAsk about a specific project for details.`;
    }
    return `**${blocked.length} blocked task(s):**\n${blocked.map((t) => `- **${t.title}** (${t.project}) — blocked by ${t.blockedBy.length} task(s)`).join('\n')}`;
  }

  if (q.includes('ready') || q.includes('pick up') || q.includes('available')) {
    const ready = projects.flatMap((p) =>
      p.tasks.filter((t) => t.status === 'READY' && t.blockedBy.length === 0).map((t) => ({ project: p.projectName, ...t }))
    );
    if (ready.length === 0) return 'No tasks are ready to be picked up right now.';
    return `**${ready.length} task(s) ready for pickup:**\n${ready.map((t) => `- **${t.title}** (${t.project}) in \`${t.repo}\`${t.priority && t.priority !== 'NORMAL' ? ` [${t.priority}]` : ''}`).join('\n')}`;
  }

  if (q.includes('complete') || q.includes('done') || q.includes('finished')) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    const completed = projects.reduce((s, p) => s + (p.statusCounts?.completed ?? 0), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return `**Overall: ${completed}/${total} tasks done (${pct}%)**\n\n${projects.filter((p) => p.tasks.length > 0).map((p) => {
      const done = p.statusCounts?.completed ?? 0;
      const t = p.tasks.length;
      return `- **${p.projectName}**: ${done}/${t} (${t > 0 ? Math.round((done / t) * 100) : 0}%)`;
    }).join('\n')}`;
  }

  if (q.includes('summary') || q.includes('overview') || q.match(/^status\??$/)) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    const active = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'IN_PROGRESS').length, 0);
    const ready = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'READY').length, 0);
    const completed = projects.reduce((s, p) => s + (p.statusCounts?.completed ?? 0), 0);
    const blocked = projects.reduce((s, p) => s + p.tasks.filter((t) => t.blockedBy.length > 0).length, 0);
    return `**AI Helm Overview**\n- **${projects.length}** projects, **${total}** total tasks\n- **${active}** in progress, **${ready}** ready, **${completed}** completed\n- **${blocked}** blocked\n\n${projects.filter((p) => p.tasks.length > 0).sort((a, b) => b.tasks.length - a.tasks.length).map((p) => `- **${p.projectName}** — ${p.tasks.length} tasks (${p.statusCounts?.completed ?? 0} done)`).join('\n')}`;
  }

  // Count-type questions
  if (q.match(/how many (projects|tasks)/)) {
    const total = projects.reduce((s, p) => s + p.tasks.length, 0);
    if (q.includes('project')) return `There are **${projects.length} projects** in AI Helm.`;
    return `There are **${total} tasks** across **${projects.length} projects**.`;
  }

  // Project-specific — try matching project name
  const matchedProject = projects.find((p) => q.includes(p.projectName.toLowerCase()));
  if (matchedProject) {
    const p = matchedProject;
    const counts = p.statusCounts;
    const active = p.tasks.filter((t) => t.status === 'IN_PROGRESS');
    const blocked = p.tasks.filter((t) => t.blockedBy.length > 0);
    let response = `**${p.projectName}**\n- Tech Lead: ${p.techLeadEmail.split('@')[0]}\n- Product Lead: ${p.productLeadEmail.split('@')[0]}\n- Tasks: ${p.tasks.length}`;
    if (counts) {
      response += `\n- Init: ${counts.initialized}, Ready: ${counts.ready}, Active: ${counts.inProgress}, Pending: ${counts.pending}, Done: ${counts.completed}`;
    }
    if (active.length > 0) {
      response += `\n\n**Active:**\n${active.map((t) => `- **${t.title}** in \`${t.repo}\`${t.assignee ? ` (@${t.assignee.split('@')[0]})` : ''}`).join('\n')}`;
    }
    if (blocked.length > 0) {
      response += `\n\n**Blocked (${blocked.length}):**\n${blocked.slice(0, 5).map((t) => `- **${t.title}** — ${t.blockedBy.length} blocker(s)`).join('\n')}`;
      if (blocked.length > 5) response += `\n- ...and ${blocked.length - 5} more`;
    }
    response += `\n\n${p.tasks.filter((t) => t.status !== 'IN_PROGRESS' && t.blockedBy.length === 0).slice(0, 8).map((t) => `- [${t.status}] **${t.title}** (\`${t.repo}\`)`).join('\n')}`;
    return response;
  }

  // Repo-specific
  const repoMatch = q.match(/\b(worksuite-pwa|wsapi|sf-[\w-]+)\b/);
  if (repoMatch) {
    const repo = repoMatch[1];
    const tasks = projects.flatMap((p) =>
      p.tasks.filter((t) => t.repo.toLowerCase().includes(repo)).map((t) => ({ project: p.projectName, ...t }))
    );
    if (tasks.length === 0) return `No tasks found in repo \`${repo}\`.`;
    return `**${tasks.length} task(s) in \`${repo}\`:**\n${tasks.map((t) => `- [${t.status}] **${t.title}** (${t.project})`).join('\n')}`;
  }

  // Person-specific
  const personMatch = q.match(/@?(\w+)'?s?\s*tasks?/i) || q.match(/what(?:'s| is) (\w+) working on/i);
  if (personMatch) {
    const name = personMatch[1].toLowerCase();
    const tasks = projects.flatMap((p) =>
      p.tasks.filter((t) => t.assignee?.toLowerCase().includes(name)).map((t) => ({ project: p.projectName, ...t }))
    );
    if (tasks.length === 0) return `No tasks assigned to anyone matching "${name}".`;
    return `**${tasks.length} task(s) for ${name}:**\n${tasks.map((t) => `- [${t.status}] **${t.title}** (${t.project}) in \`${t.repo}\``).join('\n')}`;
  }

  // Fallback — try fuzzy matching on task titles
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    const taskMatches = projects.flatMap((p) =>
      p.tasks.filter((t) =>
        words.some((w) => t.title.toLowerCase().includes(w))
      ).map((t) => ({ project: p.projectName, ...t }))
    );
    if (taskMatches.length > 0 && taskMatches.length <= 15) {
      return `Found **${taskMatches.length} task(s)** matching your query:\n${taskMatches.map((t) => `- [${t.status}] **${t.title}** (${t.project}) in \`${t.repo}\``).join('\n')}`;
    }
  }

  return `I'm not sure what you're asking about. Try:\n- A project name (e.g. "tell me about Order Allocation")\n- A status query ("what's active?", "what's blocked?")\n- A person ("what is kennedy working on?")\n- "summary" for a full overview`;
}

export default function AskAgent({ projects, open, onClose }: AskAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const response = analyzeLocally(userMsg, projects);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Paper
      sx={{
        position: 'fixed', bottom: 16, right: 16, width: 420, maxHeight: '60vh',
        display: 'flex', flexDirection: 'column', zIndex: 1300,
        border: '1px solid rgba(200,200,200,0.12)', overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 1.5, bgcolor: 'rgba(200,200,200,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy sx={{ color: BRAND.fern, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>Ask Helm</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: BRAND.stirling }}><Close sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 350 }}>
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
              bgcolor: msg.role === 'user' ? BRAND.fern : 'rgba(200,200,200,0.06)',
              color: msg.role === 'user' ? 'white' : 'text.primary',
              px: 1.5, py: 1, borderRadius: 2, maxWidth: '90%',
            }}
          >
            {msg.role === 'user' ? (
              <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                {msg.content}
              </Typography>
            ) : (
              <MarkdownText text={msg.content} />
            )}
          </Box>
        ))}
        {loading && <CircularProgress size={20} sx={{ alignSelf: 'center', color: BRAND.fern }} />}
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid rgba(200,200,200,0.08)', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask about projects, tasks, status..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.85rem',
              '&.Mui-focused fieldset': { borderColor: BRAND.fern },
            },
          }}
        />
        <IconButton onClick={handleSend} disabled={loading || !input.trim()} sx={{ color: BRAND.fern }}>
          <Send sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Paper>
  );
}
