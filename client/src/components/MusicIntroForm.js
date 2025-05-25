import React, { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MusicIntroForm = ({ user, onSaved }) => {
  const [intro, setIntro] = useState(user?.musicIntro || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(!user?.musicIntro); // 没有内容时直接编辑
  const { login } = useAuth(); // 用于刷新user

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch('/api/auth/me', { musicIntro: intro });
      const res = await axios.get('/api/auth/me');
      if (onSaved) onSaved(res.data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      // 错误处理
    } finally {
      setSaving(false);
    }
  };

  // 如果有内容且未处于编辑状态，直接展示内容和edit按钮
  if (user?.musicIntro && !editing) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', flex: 1 }}>{user.musicIntro}</Typography>
          <IconButton size="small" onClick={() => { setIntro(user.musicIntro); setEditing(true); }} sx={{ ml: 1 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // 编辑状态或无内容时显示输入框
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