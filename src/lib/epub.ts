import ePub from 'epubjs'
import type { EpubData, EpubChapter } from '../types'

export async function parseEpub(file: File): Promise<EpubData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const book = ePub(arrayBuffer)
        
        await book.ready
        
        const metadata = (book as any).package?.metadata || {}
        const title = metadata.title || 'Unknown Title'
        const author = metadata.creator || 'Unknown Author'
        
        const chapters: EpubChapter[] = []
        
        const spine = (book.spine as any).spineItems || []
        
        for (const item of spine) {
          try {
            const section = book.section(item.href)
            const content = await section.load((book as any).load.bind(book))
            
            // Extract text content from HTML
            const parser = new DOMParser()
            const doc = parser.parseFromString(String(content), 'text/html')
            const textContent = doc.body?.textContent || ''
            
            if (textContent.trim()) {
              chapters.push({
                title: item.title || `Chapter ${chapters.length + 1}`,
                content: textContent.trim(),
                href: item.href
              })
            }
          } catch (error) {
            console.warn(`Failed to load chapter ${item.href}:`, error)
          }
        }
        
        resolve({
          title,
          author,
          chapters
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}