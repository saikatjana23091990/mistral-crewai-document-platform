import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slider,
  CircularProgress,
  Divider,
  Avatar,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import axios from 'axios';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import PaletteIcon from '@mui/icons-material/Palette';
import { useThemeContext } from '../ThemeContext';

const PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: 'https://openrouter.ai/favicon.ico',
    description: 'Unified gateway to multiple models through a single API.',
    badge: '200+ models',
    recommendedTag: 'Most Flexible',
    models: [
      { id: 'openai/gpt-4o', name: 'openai/gpt-4o', context: '128K Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'anthropic/claude-sonnet-4', name: 'anthropic/claude-sonnet-4', context: '200K Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'google/gemini-2.5-pro', name: 'google/gemini-2.5-pro', context: '1M Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'deepseek/deepseek-r1', name: 'deepseek/deepseek-r1', context: '128K Context', speed: 'Slow (Deep)', cost: 'Low', tools: true },
      { id: 'meta-llama/llama-4-maverick', name: 'meta-llama/llama-4-maverick', context: '128K Context', speed: 'Fast', cost: 'Low', tools: false }
    ],
    capabilities: [
      { label: 'Large Context', icon: '📚' },
      { label: 'Tool Calling', icon: '🔧' },
      { label: 'Streaming', icon: '🌊' }
    ]
  },
  {
    id: 'groq',
    name: 'GroqCloud',
    logo: '/groq-logo.svg',
    description: 'Ultra-fast inference for low-latency document interactions.',
    badge: 'LPU Speed',
    recommendedTag: 'Fastest Responses',
    models: [
      { id: 'llama-4-scout', name: 'llama-4-scout', context: '128K Context', speed: 'Lightning', cost: 'Free/Low', tools: true },
      { id: 'llama-4-maverick', name: 'llama-4-maverick', context: '128K Context', speed: 'Lightning', cost: 'Low', tools: true },
      { id: 'deepseek-r1-distill', name: 'deepseek-r1-distill', context: '32K Context', speed: 'Fast', cost: 'Low', tools: true }
    ],
    capabilities: [
      { label: 'Fast Inference', icon: '⚡' },
      { label: 'Tool Calling', icon: '🔧' },
      { label: 'Streaming', icon: '🌊' }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    logo: 'https://mistral.ai/favicon.ico',
    description: 'High-quality open models optimized for enterprise use.',
    badge: 'Enterprise',
    recommendedTag: 'Cost Efficient',
    models: [
      { id: 'mistral-large-latest', name: 'mistral-large-latest', context: '128K Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'mistral-medium-latest', name: 'mistral-medium-latest', context: '32K Context', speed: 'Fast', cost: 'Medium', tools: true },
      { id: 'ministral-8b', name: 'ministral-8b', context: '128K Context', speed: 'Fast', cost: 'Low', tools: false }
    ],
    capabilities: [
      { label: 'Large Context', icon: '📚' },
      { label: 'Enterprise Security', icon: '🔒' }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    description: 'Large context windows for complex document understanding.',
    badge: '1M+ Context',
    recommendedTag: 'Best Context Length',
    models: [
      { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro', context: '1M Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', context: '1M Context', speed: 'Fast', cost: 'Low', tools: true }
    ],
    capabilities: [
      { label: 'Large Context', icon: '📚' },
      { label: 'Multimodal', icon: '🖼️' },
      { label: 'Tool Calling', icon: '🔧' }
    ]
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    logo: '/bedrock-logo.svg',
    description: 'Access foundation models through your AWS environment.',
    badge: 'Secure VPC',
    recommendedTag: 'Enterprise Ready',
    models: [
      { id: 'anthropic.claude-sonnet-4', name: 'anthropic.claude-sonnet-4', context: '200K Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'anthropic.claude-opus-4', name: 'anthropic.claude-opus-4', context: '200K Context', speed: 'Slow', cost: 'High', tools: true },
      { id: 'amazon.nova-pro', name: 'amazon.nova-pro', context: '128K Context', speed: 'Balanced', cost: 'Medium', tools: true },
      { id: 'meta.llama3-70b-instruct', name: 'meta.llama3-70b-instruct', context: '8K Context', speed: 'Fast', cost: 'Low', tools: true }
    ],
    capabilities: [
      { label: 'Enterprise Security', icon: '🔒' },
      { label: 'Tool Calling', icon: '🔧' }
    ]
  }
];

const PRESETS = {
  accurate: { name: 'Accurate', temp: 0.2, desc: 'Focused, factual, and less creative.' },
  balanced: { name: 'Balanced', temp: 0.5, desc: 'Good balance of accuracy and creativity.' },
  creative: { name: 'Creative', temp: 0.9, desc: 'More creative, diverse, and imaginative.' }
};

const Settings = () => {
  const theme = useTheme();
  const { themeColor, setThemeColor } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'groq',
    model: 'llama-4-maverick',
    temperature: 0.5,
    reasoningDepth: 'fast',
    memoryEnabled: true,
    streamResponses: true,
    includeCitations: true,
    explainConflicts: true,
    showConfidenceScores: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:8000/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('http://localhost:8000/settings', settings);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'provider') {
        const p = PROVIDERS.find(p => p.id === value);
        if (p && p.models.length > 0) {
          next.model = p.models[0].id;
        }
      }
      return next;
    });
  };

  const currentProvider = PROVIDERS.find(p => p.id === settings.provider) || PROVIDERS[0];
  const currentModel = currentProvider.models.find(m => m.id === settings.model) || currentProvider.models[0];

  const getStyleForTemp = (temp) => {
    if (temp <= 0.3) return 'accurate';
    if (temp >= 0.8) return 'creative';
    return 'balanced';
  };

  const currentStyle = getStyleForTemp(settings.temperature);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, px: 2 }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, pb: 8 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon sx={{ color: 'primary.main' }} /> Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage your AI preferences and document processing configurations.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" sx={{ borderRadius: 2 }} onClick={fetchSettings}>
              Restore Defaults
            </Button>
            <Button 
              variant="contained" 
              sx={{ borderRadius: 2 }} 
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
            >
              Save Settings
            </Button>
          </Box>
        </Box>

        {/* Card 1 & 2 Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>1. Select LLM Provider</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the AI provider to power your conversations and document understanding.
              </Typography>
              <Grid container spacing={2}>
                {PROVIDERS.map(p => {
                  const isSelected = settings.provider === p.id;
                  return (
                    <Grid item xs={6} md={4} key={p.id}>
                      <Box
                        onClick={() => updateSetting('provider', p.id)}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': { borderColor: isSelected ? 'primary.main' : 'primary.light' }
                        }}
                      >
                        {isSelected && (
                          <CheckCircleOutlineIcon sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', fontSize: 18 }} />
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar src={p.logo} alt={p.name} sx={{ width: 28, height: 28, bgcolor: 'transparent', '& img': { objectFit: 'contain' } }}>
                            {p.name.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{p.name}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, flex: 1 }}>
                          {p.description}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), px: 1, py: 0.2, borderRadius: 1 }}>
                            {p.badge}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>2. Select Model</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pick the specific model for conversations and reasoning.
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={settings.model}
                  label="Model"
                  onChange={(e) => updateSetting('model', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {currentProvider.models.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentModel && (
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 2, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Context Window</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentModel.context}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Latency</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentModel.speed}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Cost</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentModel.cost}</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {currentProvider.capabilities.map((cap, i) => (
                      <Typography key={i} variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        {cap.icon} {cap.label}
                      </Typography>
                    ))}
                    {currentModel.tools && (
                       <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }}/> Tool Calling
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Card 3 & 4 Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>3. Response Style (Temperature)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control randomness in AI responses.
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {Object.entries(PRESETS).map(([key, p]) => {
                  const isSelected = currentStyle === key;
                  return (
                    <Grid item xs={4} key={key}>
                      <Box
                        onClick={() => updateSetting('temperature', p.temp)}
                        sx={{
                          p: 1.5, borderRadius: 2, border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          cursor: 'pointer', textAlign: 'center',
                          position: 'relative'
                        }}
                      >
                         {isSelected && <CheckCircleOutlineIcon sx={{ position: 'absolute', top: 4, right: 4, color: 'primary.main', fontSize: 16 }} />}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.2 }}>{p.desc}</Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Temp: {p.temp}</Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>

              <Box sx={{ px: 2 }}>
                <Slider 
                  value={settings.temperature} 
                  onChange={(e, val) => updateSetting('temperature', val)} 
                  min={0.0} max={1.0} step={0.1}
                  valueLabelDisplay="auto"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">0.0 (Accurate)</Typography>
                  <Typography variant="caption" color="text.secondary">1.0 (Creative)</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>4. Reasoning Depth</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control computational effort for complex multi-document reasoning.
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {[{ id: 'fast', label: 'Fast', desc: 'Lower latency, best for simple Q&A.', icon: <BoltIcon /> },
                  { id: 'deep', label: 'Deep', desc: 'Better reasoning & conflict resolution.', icon: <LayersOutlinedIcon /> }
                ].map(opt => {
                  const isSelected = settings.reasoningDepth === opt.id;
                  return (
                    <Grid item xs={6} key={opt.id}>
                      <Box
                        onClick={() => updateSetting('reasoningDepth', opt.id)}
                        sx={{
                          p: 1.5, borderRadius: 2, border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                          {opt.icon}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{opt.label}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>{opt.desc}</Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
              <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(76,175,80,0.1)', p: 1, borderRadius: 1 }}>
                 <CheckCircleOutlineIcon fontSize="small"/> Deep reasoning improves multi-document analysis and conflict detection.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Card 5, 6, 7 Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>5. Memory & Context</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage how conversations are remembered.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Enable conversation memory</Typography>
                  <Typography variant="caption" color="text.secondary">Remember chats across sessions.</Typography>
                </Box>
                <Switch checked={settings.memoryEnabled} onChange={(e) => updateSetting('memoryEnabled', e.target.checked)} color="primary" />
              </Box>

               <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', bgcolor: 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2 }}>
                When enabled, DocuGen AI remembers information from previous conversations and uploaded documents to provide more relevant answers.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
             <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>6. Response Preferences</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customize how AI responses are generated.
              </Typography>

              {[
                { id: 'streamResponses', label: 'Stream responses', desc: 'Display responses as they are generated.' },
                { id: 'includeCitations', label: 'Include citations', desc: 'Show source references in AI replies.' },
                { id: 'explainConflicts', label: 'Explain conflict resolutions', desc: 'Provide reasoning for conflict decisions.' },
                { id: 'showConfidenceScores', label: 'Show confidence scores', desc: 'Display confidence for extracted information.' }
              ].map(opt => (
                <Box key={opt.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                  </Box>
                  <Switch checked={settings[opt.id]} onChange={(e) => updateSetting(opt.id, e.target.checked)} color="primary" size="small" />
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>7. Configuration Preview</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review your current AI settings.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Provider', value: currentProvider.name },
                  { label: 'Model', value: currentModel?.id },
                  { label: 'Style', value: `${PRESETS[currentStyle].name} (${settings.temperature})` },
                  { label: 'Reasoning', value: settings.reasoningDepth === 'deep' ? 'Deep' : 'Fast' },
                  { label: 'Memory', value: settings.memoryEnabled ? 'Enabled' : 'Disabled' },
                  { label: 'Streaming', value: settings.streamResponses ? 'Enabled' : 'Disabled' },
                  { label: 'Citations', value: settings.includeCitations ? 'Enabled' : 'Disabled' }
                ].map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < 6 ? '1px solid rgba(0,0,0,0.05)' : 'none', pb: i < 6 ? 1 : 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{row.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Card 8 - Appearance */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Appearance</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose your preferred color accent for the application.
              </Typography>

              <Grid container spacing={2}>
                {[
                  { id: 'purple', label: 'Purple', desc: 'Modern, professional and trustworthy.', hex: '#7C3AED' },
                  { id: 'pink', label: 'Pink', desc: 'Energetic, friendly and vibrant.', hex: '#EC4899' },
                  { id: 'yellow', label: 'Yellow', desc: 'Bright, optimistic and warm.', hex: '#EAB308' },
                  { id: 'orange', label: 'Orange', desc: 'Bold, creative and confident.', hex: '#F97316' }
                ].map(opt => {
                  const isSelected = themeColor === opt.id;
                  return (
                    <Grid item xs={12} sm={6} md={3} key={opt.id}>
                      <Box
                        onClick={() => setThemeColor(opt.id)}
                        sx={{
                          p: 1.5, borderRadius: 2, border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          cursor: 'pointer', position: 'relative',
                          display: 'flex', gap: 2, alignItems: 'center'
                        }}
                      >
                        {isSelected && <CheckCircleOutlineIcon sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', fontSize: 16 }} />}
                        
                        {/* Mini Theme Preview Graphic */}
                        <Box sx={{ width: 48, height: 48, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                           <Box sx={{ height: 10, width: '100%', bgcolor: opt.hex, borderRadius: 0.5 }} />
                           <Box sx={{ display: 'flex', gap: 0.5 }}>
                             <Box sx={{ flex: 1, height: 20, bgcolor: alpha(opt.hex, 0.1), borderRadius: 0.5 }} />
                             <Box sx={{ flex: 2, height: 20, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 0.5 }} />
                           </Box>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1, display: 'block' }}>{opt.desc}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Preview</Typography>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EC4899' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EAB308' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F97316' }} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  This will change the accent color across buttons, highlights, and interactive elements.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
};

export default Settings;
