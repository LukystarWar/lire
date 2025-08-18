import { useState, useEffect, useCallback, useRef } from 'react'
import { FilePicker } from './components/FilePicker'
import { Reader } from './components/Reader'
import { Controls } from './components/Controls'
import { createChunkerWorker } from './lib/chunker'
import { saveSettings, loadSettings, saveProgress, loadProgress } from './lib/storage'
import type { 
  EpubData, 
  ReaderSettings, 
  AppState 
} from './types'
import type { ChunkerMessage, ChunkerResponse } from './workers/chunker.worker'
import './app.css'

export default function App() {
  const [state, setState] = useState<AppState>({
    epubData: null,
    chunks: [],
    currentChunkIndex: 0,
    isPlaying: false,
    settings: {
      wpm: 250,
      fontSize: 24,
      theme: 'dark'
    },
    progress: {
      currentChapterIndex: 0,
      currentChunkIndex: 0,
      totalChunks: 0
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize settings and worker
  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings()
      setState(prev => ({ ...prev, settings }))
      
      const chunkerWorker = createChunkerWorker()
      setWorker(chunkerWorker)
      
      return () => chunkerWorker.terminate()
    }
    
    init()
  }, [])

  // Load saved progress when chunks are available
  useEffect(() => {
    if (state.chunks.length > 0) {
      loadProgress().then(progress => {
        if (progress) {
          setState(prev => ({
            ...prev,
            currentChunkIndex: progress.currentChunkIndex,
            progress: {
              ...progress,
              totalChunks: state.chunks.length
            }
          }))
        }
      })
    }
  }, [state.chunks.length])

  // Save settings when they change
  useEffect(() => {
    saveSettings(state.settings)
  }, [state.settings])

  const handleFileLoaded = useCallback((epubData: EpubData) => {
    console.log('📚 EPUB loaded:', epubData.title, 'by', epubData.author)
    console.log('📖 Chapters:', epubData.chapters.length)
    
    if (!worker) {
      console.error('❌ Worker not available')
      setError('Worker not initialized')
      return
    }
    
    setLoading(true)
    setError(null)
    setState(prev => ({ 
      ...prev, 
      epubData,
      currentChunkIndex: 0,
      isPlaying: false
    }))

    const message: ChunkerMessage = {
      type: 'PROCESS_CHAPTERS',
      payload: {
        chapters: epubData.chapters,
        timingConfig: {
          wpm: state.settings.wpm,
          minDuration: 900,
          maxDuration: 6000
        }
      }
    }

    const handleWorkerMessage = (event: MessageEvent<ChunkerResponse | any>) => {
      console.log('📨 Worker message:', event.data)
      const { type, payload } = event.data
      
      if (type === 'CHUNKS_PROCESSED') {
        const chunks = payload.chunks
        console.log('✅ Chunks processed:', chunks.length)
        console.log('✅ First chunk sample:', chunks[0]?.text?.substring(0, 100))
        console.log('✅ Chunks durations:', chunks.slice(0, 3).map((c: any) => c.duration))
        setState(prev => ({
          ...prev,
          chunks,
          progress: {
            currentChapterIndex: 0,
            currentChunkIndex: 0,
            totalChunks: chunks.length
          }
        }))
        setLoading(false)
        worker.removeEventListener('message', handleWorkerMessage)
        worker.removeEventListener('error', handleWorkerError)
      } else if (type === 'ERROR') {
        console.error('❌ Worker error:', payload.error)
        setError(payload.error)
        setLoading(false)
        worker.removeEventListener('message', handleWorkerMessage)
        worker.removeEventListener('error', handleWorkerError)
      }
    }

    const handleWorkerError = (error: ErrorEvent) => {
      console.error('❌ Worker error event:', error)
      setError(`Worker error: ${error.message}`)
      setLoading(false)
      worker.removeEventListener('message', handleWorkerMessage)
      worker.removeEventListener('error', handleWorkerError)
    }

    console.log('🚀 Starting chunking process...')
    worker.addEventListener('message', handleWorkerMessage)
    worker.addEventListener('error', handleWorkerError)
    worker.postMessage(message)
  }, [worker, state.settings.wpm])

  // Auto-hide header logic
  const resetHeaderTimer = useCallback(() => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current)
    }
    
    setHeaderVisible(true)
    
    if (state.isPlaying && state.epubData) {
      headerTimeoutRef.current = setTimeout(() => {
        setHeaderVisible(false)
      }, 3000) // Hide after 3 seconds
    }
  }, [state.isPlaying, state.epubData])

  // Reset timer when playing state changes or user interacts
  useEffect(() => {
    resetHeaderTimer()
    return () => {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current)
      }
    }
  }, [resetHeaderTimer])

  const handlePlayPause = useCallback(() => {
    setState(prev => {
      const newPlaying = !prev.isPlaying
      console.log('🎮 Play/Pause clicked. New state:', newPlaying)
      console.log('🎮 Current chunk index:', prev.currentChunkIndex)
      console.log('🎮 Total chunks:', prev.chunks.length)
      return { ...prev, isPlaying: newPlaying }
    })
  }, [])

  const handleChunkComplete = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentChunkIndex + 1
      const newChunk = prev.chunks[nextIndex]
      
      if (nextIndex >= prev.chunks.length) {
        // End of book
        return { ...prev, isPlaying: false }
      }
      
      const newProgress = {
        currentChapterIndex: newChunk?.chapterIndex || 0,
        currentChunkIndex: nextIndex,
        totalChunks: prev.chunks.length
      }
      
      // Save progress
      saveProgress(newProgress)
      
      return {
        ...prev,
        currentChunkIndex: nextIndex,
        progress: newProgress
      }
    })
  }, [])

  const handleSettingsChange = useCallback((settings: ReaderSettings) => {
    setState(prev => ({ ...prev, settings }))
  }, [])

  const handlePreviousChunk = useCallback(() => {
    setState(prev => {
      const prevIndex = Math.max(0, prev.currentChunkIndex - 1)
      const chunk = prev.chunks[prevIndex]
      
      const newProgress = {
        currentChapterIndex: chunk?.chapterIndex || 0,
        currentChunkIndex: prevIndex,
        totalChunks: prev.chunks.length
      }
      
      saveProgress(newProgress)
      
      return {
        ...prev,
        currentChunkIndex: prevIndex,
        progress: newProgress,
        isPlaying: false
      }
    })
  }, [])

  const handleNextChunk = useCallback(() => {
    setState(prev => {
      const nextIndex = Math.min(prev.chunks.length - 1, prev.currentChunkIndex + 1)
      const chunk = prev.chunks[nextIndex]
      
      const newProgress = {
        currentChapterIndex: chunk?.chapterIndex || 0,
        currentChunkIndex: nextIndex,
        totalChunks: prev.chunks.length
      }
      
      saveProgress(newProgress)
      
      return {
        ...prev,
        currentChunkIndex: nextIndex,
        progress: newProgress,
        isPlaying: false
      }
    })
  }, [])

  const currentChunk = state.chunks[state.currentChunkIndex]

  return (
    <div className="app" onClick={resetHeaderTimer}>
      <header className={`header ${!headerVisible ? 'hidden' : ''}`}>
        <h1>lire</h1>
        {state.epubData && (
          <div className="book-info">
            <h2>{state.epubData.title}</h2>
            <p>by {state.epubData.author}</p>
          </div>
        )}
      </header>

      <main className="main">
        {error && (
          <div className="error-message">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Try Again</button>
          </div>
        )}
        
        {!state.epubData ? (
          <FilePicker onFileLoaded={handleFileLoaded} loading={loading} />
        ) : (
          <>
            <Reader
              chunks={state.chunks}
              currentChunkIndex={state.currentChunkIndex}
              fontSize={state.settings.fontSize}
              isPlaying={state.isPlaying}
              onChunkComplete={handleChunkComplete}
            />
            
            <Controls
              isPlaying={state.isPlaying}
              settings={state.settings}
              progress={state.progress}
              currentChunkText={currentChunk?.text}
              onPlayPause={handlePlayPause}
              onSettingsChange={handleSettingsChange}
              onPreviousChunk={handlePreviousChunk}
              onNextChunk={handleNextChunk}
            />
          </>
        )}
      </main>

      <footer className="footer">
        <p>Processing happens entirely in your browser</p>
      </footer>
    </div>
  )
}