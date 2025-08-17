import type { EpubChapter, TextChunk } from '../types'
import { calculateChunkDuration, type TimingConfig } from './timing'

export function createChunkerWorker(): Worker {
  return new Worker(new URL('../workers/chunker.worker.ts', import.meta.url), {
    type: 'module'
  })
}

export function chunkText(text: string, maxLength: number = 120): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit
    if (currentChunk && (currentChunk + ' ' + sentence).length > maxLength) {
      // If current chunk has content, push it and start new one
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = sentence
    } else {
      // Add to current chunk
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  // If no sentences found, split by commas or other delimiters
  if (chunks.length === 0) {
    const parts = text.split(/[,;:]\s+/)
    let current = ''
    
    for (const part of parts) {
      if (current && (current + ', ' + part).length > maxLength) {
        if (current.trim()) {
          chunks.push(current.trim())
        }
        current = part
      } else {
        current = current ? current + ', ' + part : part
      }
    }
    
    if (current.trim()) {
      chunks.push(current.trim())
    }
  }
  
  // Final fallback: split by words if still too long
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= maxLength) {
      finalChunks.push(chunk)
    } else {
      const words = chunk.split(' ')
      let wordChunk = ''
      
      for (const word of words) {
        if (wordChunk && (wordChunk + ' ' + word).length > maxLength) {
          if (wordChunk.trim()) {
            finalChunks.push(wordChunk.trim())
          }
          wordChunk = word
        } else {
          wordChunk = wordChunk ? wordChunk + ' ' + word : word
        }
      }
      
      if (wordChunk.trim()) {
        finalChunks.push(wordChunk.trim())
      }
    }
  }
  
  return finalChunks.filter(chunk => chunk.trim().length > 0)
}

export function processChapters(
  chapters: EpubChapter[], 
  timingConfig: TimingConfig
): TextChunk[] {
  console.log('🔧 Processing chapters:', chapters.length)
  const allChunks: TextChunk[] = []
  let globalChunkIndex = 0
  
  chapters.forEach((chapter, chapterIndex) => {
    console.log(`🔧 Chapter ${chapterIndex}: ${chapter.title}, content length: ${chapter.content.length}`)
    const textChunks = chunkText(chapter.content)
    console.log(`🔧 Generated ${textChunks.length} chunks for chapter ${chapterIndex}`)
    
    textChunks.forEach((text, chunkIndex) => {
      const duration = calculateChunkDuration(text, timingConfig)
      console.log(`🔧 Chunk ${globalChunkIndex}: "${text.substring(0, 50)}..." (${text.length} chars, ${duration}ms)`)
      
      allChunks.push({
        id: `${chapterIndex}-${chunkIndex}`,
        text,
        chapterIndex,
        chunkIndex,
        duration
      })
      
      globalChunkIndex++
    })
  })
  
  console.log('🔧 Total chunks created:', allChunks.length)
  return allChunks
}