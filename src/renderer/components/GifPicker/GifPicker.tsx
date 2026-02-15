import React, { useState } from 'react';
import {
  Popover,
  TextField,
  Box,
  ImageListItemBar,
  ImageList,
  ImageListItem,
  CircularProgress,
  Typography,
} from '@mui/material';

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  onGifSelect: (gifUrl: string) => void;
}

interface TenorGif {
  id: string;
  media: Array<{ 
    gif: { url: string };
    tinygif?: { url: string };
    nanogif?: { url: string };
  }>;
  title: string;
}

const GifPicker: React.FC<GifPickerProps> = ({ open, onClose, anchorEl, onGifSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs([]);
      setNoResults(false);
      return;
    }

    setLoading(true);
    setNoResults(false);

    try {
      // Using public Tenor API (free tier)
      const apiKey = 'LIVDSRZULELA'; // Free public key for Tenor
      const response = await fetch(
        `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=20&media_filter=gif`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch GIFs');
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setGifs(data.results);
        setNoResults(false);
      } else {
        setGifs([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifs([]);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchGifs(query);
  };

  const handleGifSelect = (gifUrl: string) => {
    onGifSelect(gifUrl);
    setSearchQuery('');
    setGifs([]);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: 400,
          maxHeight: 500,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {noResults && !loading && (
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
            No GIFs found
          </Typography>
        )}

        {gifs.length > 0 && (
          <ImageList sx={{ width: '100%', maxHeight: 350 }} cols={2} rowHeight={120}>
            {gifs.map((gif) => (
              <ImageListItem
                key={gif.id}
                onClick={() => {
                  // Використовуємо tinygif для відправки (менший розмір)
                  const gifUrl = gif.media[0].tinygif?.url || gif.media[0].gif.url;
                  handleGifSelect(gifUrl);
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <img
                  src={gif.media[0].gif.url}
                  alt={gif.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <ImageListItemBar
                  title={gif.title}
                  sx={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </Box>
    </Popover>
  );
};

export default GifPicker;
