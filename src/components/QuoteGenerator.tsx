"use client";

import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { checkGrammar, fetchImageAsBase64 } from '@/app/actions';

const VerifiedBadge = () => (
  <div style={{ 
    width: '20px', 
    height: '20px', 
    minWidth: '20px', 
    minHeight: '20px', 
    marginLeft: '6px', 
    backgroundColor: '#1DA1F2', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0
  }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </div>
);

export default function QuoteGenerator() {
  const [quote, setQuote] = useState('');
  const [theme, setTheme] = useState('black and white');
  const [name, setName] = useState('Aditya Dhandi');
  const [profilePic, setProfilePic] = useState('/aditya3.png');
  const [loading, setLoading] = useState(false);
  const [generatedState, setGeneratedState] = useState<{
    text: string;
    bgUrl: string;
  } | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      // Use Server Action to avoid Turnstile issues on client
      const correctedText = await checkGrammar(quote);

      // Generate Background Image directly using Server Action to get Base64 (solves CORS and output: export issues)
      const imagePrompt = `${theme} abstract background, atmospheric, no text, empty center, aesthetic`;
      const base64Url = await fetchImageAsBase64(imagePrompt);
      
      setGeneratedState({
        text: correctedText,
        bgUrl: base64Url
      });
    } catch (err) {
      console.error(err);
      alert('Error generating quote image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(captureRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'quote-image.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Error downloading image.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfilePic(ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="main-layout">
      <div className="sidebar" style={{ width: '350px' }}>
        <h2 className="mb-4">Quote Generator</h2>
        
        <div className="form-group">
          <label className="form-label">Your Quote</label>
          <textarea 
            className="form-input" 
            rows={4}
            value={quote} 
            onChange={e => setQuote(e.target.value)}
            placeholder="Enter your quote here..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Background Theme</label>
          <input 
            className="form-input" 
            value={theme} 
            onChange={e => setTheme(e.target.value)}
            placeholder="e.g. black and white, cyberpunk, serene nature"
          />
        </div>

        <div className="sidebar-section mt-1"></div>

        <div className="form-group mt-1">
          <label className="form-label">Author Name</label>
          <input 
            className="form-input" 
            value={name} 
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Profile Picture</label>
          <input 
            type="file"
            accept="image/*"
            className="form-input"
            onChange={handleImageUpload}
          />
          <small className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            Leave empty to use default (@aditya3.png)
          </small>
        </div>

        <button 
          className="btn btn-primary mt-1 w-100" 
          onClick={handleGenerate}
          disabled={loading || !quote}
        >
          {loading ? 'Generating...' : 'Enhance & Generate'}
        </button>

        {generatedState && (
          <button 
            className="btn w-100" 
            style={{ marginTop: '10px' }}
            onClick={handleDownload}
          >
            Download Image
          </button>
        )}
      </div>

      <div className="canvas-container">
        {generatedState ? (
          <div 
            ref={captureRef}
            style={{
              position: 'relative',
              width: '500px',
              height: '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#1c1f26'
            }}
          >
            {/* Background Image using img tag for better html-to-image compatibility */}
            <img 
              src={generatedState.bgUrl} 
              alt="background"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0
              }}
            />

            {/* Dark overlay for better text readability */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 1
            }} />

            {/* Quote Text */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '40px',
              textAlign: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 600,
              fontFamily: '"Georgia", serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              lineHeight: 1.4,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              "{generatedState.text}"
            </div>

            {/* Profile Info */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              padding: '20px 40px',
              width: '100%',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={profilePic} 
                alt={name} 
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  marginRight: '12px'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 600,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                }}>{name}</span>
                <VerifiedBadge />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-secondary text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>Enter a quote and click "Enhance & Generate"</p>
          </div>
        )}
      </div>
    </div>
  );
}
