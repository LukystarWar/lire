import { useState } from 'react'
import type { ReaderSettings, ReadingProgress } from '../types'
import { clamp } from '../lib/utils'

interface ControlsProps {
  isPlaying: boolean
  settings: ReaderSettings
  progress: ReadingProgress
  onPlayPause: () => void
  onSettingsChange: (settings: ReaderSettings) => void
  onPreviousChunk: () => void
  onNextChunk: () => void
  currentChunkText?: string
}

export function Controls({
  isPlaying,
  settings,
  progress,
  onPlayPause,
  onSettingsChange,
  onPreviousChunk,
  onNextChunk,
  currentChunkText
}: ControlsProps) {
  const [showSettings, setShowSettings] = useState(false)
  const handleWpmChange = (delta: number) => {
    const newWpm = clamp(settings.wpm + delta, 100, 1000)
    onSettingsChange({ ...settings, wpm: newWpm })
  }

  const handleFontSizeChange = (delta: number) => {
    const newFontSize = clamp(settings.fontSize + delta, 16, 48)
    onSettingsChange({ ...settings, fontSize: newFontSize })
  }

  const progressPercentage = progress.totalChunks > 0 
    ? (progress.currentChunkIndex / progress.totalChunks) * 100 
    : 0

  return (
    <div className="controls">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="progress-info">
        <span>
          Chapter {progress.currentChapterIndex + 1} • 
          Chunk {progress.currentChunkIndex + 1} of {progress.totalChunks}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>

      {currentChunkText && (
        <div className="current-text-preview">
          {currentChunkText}
        </div>
      )}

      <div className="control-buttons">
        <button 
          className="control-btn"
          onClick={onPreviousChunk}
          disabled={progress.currentChunkIndex <= 0}
        >
          ⏮
        </button>
        
        <button 
          className="play-pause-btn"
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button 
          className="control-btn"
          onClick={onNextChunk}
          disabled={progress.currentChunkIndex >= progress.totalChunks - 1}
        >
          ⏭
        </button>
        
        <button 
          className="control-btn settings-toggle-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <div className={`settings-controls ${showSettings ? 'mobile-visible' : ''}`}>
        <div className="setting-group">
          <label>WPM</label>
          <div className="setting-buttons">
            <button 
              className="setting-btn"
              onClick={() => handleWpmChange(-25)}
            >
              -
            </button>
            <span className="setting-value">{settings.wpm}</span>
            <button 
              className="setting-btn"
              onClick={() => handleWpmChange(25)}
            >
              +
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Font Size</label>
          <div className="setting-buttons">
            <button 
              className="setting-btn"
              onClick={() => handleFontSizeChange(-2)}
            >
              -
            </button>
            <span className="setting-value">{settings.fontSize}px</span>
            <button 
              className="setting-btn"
              onClick={() => handleFontSizeChange(2)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}