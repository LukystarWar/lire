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
  const { type, payload } = event.data
  
  if (type === 'PROCESS_CHAPTERS') {
    try {
      const chunks = processChapters(payload.chapters, payload.timingConfig)
      
      const response: ChunkerResponse = {
        type: 'CHUNKS_PROCESSED',
        payload: { chunks }
      }
      
      self.postMessage(response)
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }
})

export {}