import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const LOCAL_KEY = 'default_music_prompt';

const MyModelPromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedPrompt = localStorage.getItem(LOCAL_KEY) || '';
    setPrompt(savedPrompt);
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(LOCAL_KEY, prompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    setSaving(false);
  };

  return (
    <Box>
      <TextField
        label="Default music type prompt (e.g. ambient, jazz, cinematic...)"
        fullWidth
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {saved && (
        <Typography variant="body2" color="success.main" sx={{ ml: 2, display: 'inline' }}>
          Saved!
        </Typography>
      )}
    </Box>
  );
};

export default MyModelPromptInput; 