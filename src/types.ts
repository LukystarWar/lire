export interface EpubChapter {
  title: string
  content: string
  href: string
}

export interface TextChunk {
  id: string
  text: string
  chapterIndex: number
  chunkIndex: number
  duration: number
}

export interface ReaderSettings {
  wpm: number
  fontSize: number
  theme: 'dark' | 'light'
}

export interface ReadingProgress {
  currentChapterIndex: number
  currentChunkIndex: number
  totalChunks: number
}

export interface EpubData {
  title: string
  author: string
  chapters: EpubChapter[]
}

export interface AppState {
  epubData: EpubData | null
  chunks: TextChunk[]
  currentChunkIndex: number
  isPlaying: boolean
  settings: ReaderSettings
  progress: ReadingProgress
}