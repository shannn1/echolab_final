import React, { useState, useEffect } from 'react';
import { Box, List, ListItemButton, ListItemText, Divider, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MusicIntroForm from '../components/MusicIntroForm';
import axios from 'axios';
import MyModelPromptInput from '../components/MyModelPromptInput';

const tabs = [
  { label: 'Account', value: 'account' },
  { label: 'Billing', value: 'billing' },
  { label: 'My Model', value: 'model' },
  { label: 'Logout', value: 'logout' },
];

const AccountPage = () => {
  const [selectedTab, setSelectedTab] = useState('account');
  const { user, logout } = useAuth();
  const [freshUser, setFreshUser] = useState(user);
  const navigate = useNavigate();

  useEffect(() => {
    // 每次进入页面都拉取一次user信息
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setFreshUser(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchUser();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'logout') {
      logout();
      navigate('/');
    } else {
      setSelectedTab(tab);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
      {/* 左侧导航栏 */}
      <Box sx={{ width: 220, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', pt: 4 }}>
        <List>
          {tabs.map((tab) => (
            <ListItemButton
              key={tab.value}
              selected={selectedTab === tab.value}
              onClick={() => handleTabClick(tab.value)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemText primary={tab.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      {/* 右侧内容区 */}
      <Box sx={{ flex: 1, p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Paper sx={{ width: '100%', maxWidth: 700, bgcolor: 'background.paper', p: 4 }} elevation={3}>
          {selectedTab === 'account' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  component="img"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(freshUser?.username || 'U')}&background=222&color=fff&size=64`}
                  alt="avatar"
                  sx={{ width: 64, height: 64, borderRadius: '50%', mr: 2 }}
                />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{freshUser?.username || 'User Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">{freshUser?.email || 'user@email.com'}</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ bgcolor: 'grey.900', color: 'grey.300', px: 1.5, py: 0.5, borderRadius: 1, fontFamily: 'monospace' }}>
                      {freshUser?.orgId || 'org-xxxxxxxxxxxxxxxx'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Music Preferences / Experience</Typography>
                <MusicIntroForm user={freshUser} onSaved={setFreshUser} />
              </Box>
              <Box sx={{ border: '1px solid #d32f2f', borderRadius: 2, p: 2, bgcolor: 'rgba(211,47,47,0.05)', display: 'flex', alignItems: 'center', mt: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" color="error" fontWeight={700}>Delete Account</Typography>
                  <Typography variant="body2" color="error">
                    This action is permanent and cannot be undone, and it will delete your EchoLab account.
                  </Typography>
                </Box>
                <Box>
                  <Box component="button" disabled sx={{ bgcolor: 'error.main', color: '#fff', px: 3, py: 1, borderRadius: 2, border: 'none', fontWeight: 700, fontSize: 16, cursor: 'not-allowed', ml: 2 }}>
                    Delete
                  </Box>
                </Box>
              </Box>
            </>
          )}
          {selectedTab === 'billing' && (
            <>
              <Typography variant="h5" gutterBottom>Credits</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>500</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Purchase credits for API usage and music generation.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box component="input" type="text" value="$ 10" disabled sx={{ bgcolor: 'background.default', color: 'text.primary', border: '1px solid #444', borderRadius: 1, px: 2, py: 1, mr: 1, width: 120 }} />
                <Box component="button" disabled sx={{ bgcolor: 'primary.main', color: '#fff', px: 3, py: 1, borderRadius: 2, border: 'none', fontWeight: 700, fontSize: 16, cursor: 'not-allowed' }}>
                  Buy
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Buying credits is not supported yet.
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Payments</Typography>
              <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', fontWeight: 700, mb: 1 }}>
                  <Box sx={{ flex: 1 }}>DATE</Box>
                  <Box sx={{ flex: 1 }}>CREDITS</Box>
                </Box>
                {/* 空内容，不显示假数据 */}
              </Box>
            </>
          )}
          {selectedTab === 'model' && (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 260,
                    height: 260,
                    background: '#222',
                    border: '12px solid #222',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <img src="/stableAudio.png" alt="Stable Audio 2.0" style={{ width: '90%', borderRadius: 4, marginBottom: 12 }} />
                  <Typography variant="h6" sx={{ color: '#222', fontWeight: 700, textAlign: 'center', mt: -6 }}>
                    Stable Audio 2.0
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Stable Audio 2.0</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                  Stable Audio 2.0 builds upon Stable Audio 1.0, redefining AI music creation by offering high-quality tracks up to three minutes long with its innovative audio-to-audio generation. Users can now upload audio samples and, using natural language prompts, transform these samples into a wide array of sounds.
                </Typography>
                <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Default Prompt</Typography>
                  <MyModelPromptInput />
                </Box>
                <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
                  Currently only Stable Audio 2.0 is supported.
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AccountPage; 