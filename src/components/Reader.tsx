import { useEffect, useState } from 'react'
import type { TextChunk } from '../types'

interface ReaderProps {
  chunks: TextChunk[]
  currentChunkIndex: number
  fontSize: number
  isPlaying: boolean
  onChunkComplete: () => void
}

export function Reader({ 
  chunks, 
  currentChunkIndex, 
  fontSize, 
  isPlaying, 
  onChunkComplete 
}: ReaderProps) {
  const [displayText, setDisplayText] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const currentChunk = chunks[currentChunkIndex]

  useEffect(() => {
    if (!currentChunk || !isPlaying) {
      setIsVisible(false)
      return
    }

    setDisplayText(currentChunk.text)
    setIsVisible(true)

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onChunkComplete()
      }, 200) // Small delay for fade out
    }, currentChunk.duration)

    return () => clearTimeout(timer)
  }, [currentChunk, isPlaying, onChunkComplete])

  if (!currentChunk) {
    return null
  }

  return (
    <div className="reader">
      <div 
        className={`subtitle ${isVisible ? 'visible' : ''}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="subtitle-text">
          {displayText}
        </div>
      </div>
    </div>
  )
}