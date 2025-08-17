import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ReaderSettings, ReadingProgress } from '../types'

interface LireDB extends DBSchema {
  settings: {
    key: string
    value: ReaderSettings
  }
  progress: {
    key: string
    value: ReadingProgress
  }
  books: {
    key: string
    value: {
      id: string
      title: string
      author: string
      lastRead: number
      progress: ReadingProgress
    }
  }
}

let db: IDBPDatabase<LireDB> | null = null

export async function initDB(): Promise<IDBPDatabase<LireDB>> {
  if (db) return db
  
  db = await openDB<LireDB>('LireDB', 1, {
    upgrade(db) {
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
      
      // Progress store
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress')
      }
      
      // Books store
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books')
      }
    },
  })
  
  return db
}

export async function saveSettings(settings: ReaderSettings): Promise<void> {
  const database = await initDB()
  await database.put('settings', settings, 'default')
}

export async function loadSettings(): Promise<ReaderSettings> {
  const database = await initDB()
  const settings = await database.get('settings', 'default')
  
  return settings || {
    wpm: 250,
    fontSize: 24,
    theme: 'dark'
  }
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  const database = await initDB()
  await database.put('progress', progress, 'current')
}

export async function loadProgress(): Promise<ReadingProgress | null> {
  const database = await initDB()
  return await database.get('progress', 'current') || null
}

export async function saveBookInfo(
  bookId: string, 
  title: string, 
  author: string, 
  progress: ReadingProgress
): Promise<void> {
  const database = await initDB()
  await database.put('books', {
    id: bookId,
    title,
    author,
    lastRead: Date.now(),
    progress
  }, bookId)
}

export async function clearProgress(): Promise<void> {
  const database = await initDB()
  await database.delete('progress', 'current')
}