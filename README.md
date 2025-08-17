# Lire - EPUB Speed Reader

A progressive web app for speed reading EPUB files with subtitle-style display.

## Features

- 📚 Upload and process EPUB files (DRM-free) entirely client-side
- ⚡ Speed reading with customizable WPM (Words Per Minute)
- 🎬 Movie subtitle-style text display
- 🎛️ Adjustable font size and reading speed
- 💾 Automatic progress saving with IndexedDB
- 📱 Mobile-friendly PWA design
- 🌙 Dark, minimalist interface
- 🔄 Offline support with service worker

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **EPUB Processing**: epub.js (client-side)
- **Storage**: IndexedDB via idb library
- **Text Processing**: Web Workers for chunking
- **PWA**: Vite PWA plugin with service worker
- **Deployment**: Netlify-ready

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Deploy to Netlify

1. Push to GitHub
2. Connect repository to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

The `netlify.toml` file is already configured.

## Usage

1. Click to upload an EPUB file
2. Wait for processing (happens in browser)
3. Use play/pause controls
4. Adjust WPM and font size as needed
5. Progress is automatically saved

## Features Details

### Text Chunking
- Intelligently splits text into 1-2 line chunks (~120 chars max)
- Processes in Web Worker to avoid UI blocking
- Respects sentence boundaries and punctuation

### Timing Heuristics
- Base timing calculated from WPM
- Extra pauses for punctuation (commas, periods, etc.)
- Special handling for dialogue and em-dashes
- Minimum 0.9s, maximum 6s per chunk

### Progressive Web App
- Works offline after first load
- Installable on mobile devices
- Dark theme optimized for reading

## Browser Support

Modern browsers with ES2020+ support. Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Privacy

All processing happens entirely in your browser. No data is sent to any server.