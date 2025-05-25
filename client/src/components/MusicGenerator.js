import React, { useState } from 'react';

const MusicGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setGeneratedAudio(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('prompt', prompt);
      formData.append('duration', duration);
      formData.append('output_format', outputFormat);
      formData.append('steps', steps);
      formData.append('cfg_scale', cfgScale);
      formData.append('strength', strength);
      if (seed) {
        formData.append('seed', seed);
      }

      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate music');
      }

      const data = await response.json();
      setGeneratedAudio(data.audioUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedAudio) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: prompt,
          description: `Generated music with prompt: ${prompt}`,
          audioUrl: generatedAudio,
          isPublic: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save music');
      }

      // 显示成功消息
      alert('Music saved to your library successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="music-generator">
      <h2>Generate Music</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleGenerate}>
        {/* ... existing form fields ... */}
        
        <button type="submit" disabled={isGenerating || !audioFile}>
          {isGenerating ? 'Generating...' : 'Generate Music'}
        </button>
      </form>

      {generatedAudio && (
        <div className="generated-audio">
          <h3>Generated Music</h3>
          <audio controls src={generatedAudio} />
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="save-button"
          >
            {isSaving ? 'Saving...' : 'Save to Library'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicGenerator; 