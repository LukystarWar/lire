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
    console.log('📺 Reader effect - chunk:', currentChunk?.id, 'playing:', isPlaying)
    console.log('📺 Chunk text:', currentChunk?.text)
    
    if (!currentChunk || !isPlaying) {
      console.log('📺 Hiding subtitle - no chunk or not playing')
      setIsVisible(false)
      return
    }

    console.log('📺 Showing chunk:', currentChunk.text.substring(0, 50), '... for', currentChunk.duration, 'ms')
    setDisplayText(currentChunk.text)
    setIsVisible(true)

    const timer = setTimeout(() => {
      console.log('📺 Chunk timer finished, hiding')
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