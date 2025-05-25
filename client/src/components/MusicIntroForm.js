import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const MusicIntroForm = ({ user }) => {
  // 这里暂时用本地state，后续可对接后端
  const [intro, setIntro] = useState(user?.musicIntro || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: 调用后端API保存
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  };

  return (
    <Box>
      <TextField
        label="Your music preferences or experience"
        multiline
        minRows={3}
        maxRows={8}
        fullWidth
        value={intro}
        onChange={e => setIntro(e.target.value)}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
      >
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

export default MusicIntroForm; 