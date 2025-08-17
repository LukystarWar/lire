import type { EpubChapter, TextChunk } from '../types'
import { processChapters } from '../lib/chunker'
import type { TimingConfig } from '../lib/timing'

export interface ChunkerMessage {
  type: 'PROCESS_CHAPTERS'
  payload: {
    chapters: EpubChapter[]
    timingConfig: TimingConfig
  }
}

export interface ChunkerResponse {
  type: 'CHUNKS_PROCESSED'
  payload: {
    chunks: TextChunk[]
  }
}

self.addEventListener('message', (event: MessageEvent<ChunkerMessage>) => {
  console.log('🔧 Worker received message:', event.data)
  
  const { type, payload } = event.data
  
  if (type === 'PROCESS_CHAPTERS') {
    try {
      console.log('🔧 Processing', payload.chapters.length, 'chapters...')
      const chunks = processChapters(payload.chapters, payload.timingConfig)
      console.log('🔧 Generated', chunks.length, 'chunks')
      
      const response: ChunkerResponse = {
        type: 'CHUNKS_PROCESSED',
        payload: { chunks }
      }
      
      console.log('🔧 Sending response to main thread')
      self.postMessage(response)
    } catch (error) {
      console.error('🔧 Worker error:', error)
      self.postMessage({
        type: 'ERROR',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }
})

export {}