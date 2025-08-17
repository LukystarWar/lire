import ePub from 'epubjs'
import type { EpubData, EpubChapter } from '../types'

export async function parseEpub(file: File): Promise<EpubData> {
  console.log('📖 Starting EPUB parsing for:', file.name, file.size, 'bytes')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        console.log('📖 File loaded, creating EPUB object...')
        const arrayBuffer = e.target?.result as ArrayBuffer
        const book = ePub(arrayBuffer)
        
        await book.ready
        console.log('📖 EPUB ready, extracting metadata...')
        
        const metadata = (book as any).package?.metadata || {}
        const title = metadata.title || 'Unknown Title'
        const author = metadata.creator || 'Unknown Author'
        console.log('📖 Book:', title, 'by', author)
        
        const chapters: EpubChapter[] = []
        
        const spine = (book.spine as any).spineItems || []
        console.log('📖 Found', spine.length, 'spine items')
        
        for (const item of spine) {
          try {
            const section = book.section(item.href)
            const content = await section.load((book as any).load.bind(book))
            console.log('📄 Raw content type:', typeof content, 'constructor:', content?.constructor?.name)
            
            // Extract text content from HTML - handle different content types
            let textContent = ''
            
            if (typeof content === 'string') {
              console.log('📄 Content is string, length:', (content as string).length)
              // If content is already a string (HTML)
              const parser = new DOMParser()
              const doc = parser.parseFromString(content, 'text/html')
              textContent = doc.body?.textContent || doc.documentElement?.textContent || ''
            } else if (content && typeof content === 'object') {
              const contentAny = content as any
              console.log('📄 Content is object, has textContent:', !!contentAny.textContent, 'has innerText:', !!contentAny.innerText)
              // If content is a DOM element or Document
              if (contentAny.textContent) {
                textContent = contentAny.textContent
                console.log('📄 Used textContent')
              } else if (contentAny.innerText) {
                textContent = contentAny.innerText
                console.log('📄 Used innerText')
              } else if (contentAny.outerHTML) {
                console.log('📄 Using outerHTML')
                // Parse the HTML string
                const parser = new DOMParser()
                const doc = parser.parseFromString(contentAny.outerHTML, 'text/html')
                textContent = doc.body?.textContent || doc.documentElement?.textContent || ''
              } else {
                console.log('📄 Fallback: converting object to string')
                // Try to convert to string and parse
                const parser = new DOMParser()
                const doc = parser.parseFromString(String(content), 'text/html')
                textContent = doc.body?.textContent || doc.documentElement?.textContent || ''
              }
            } else {
              console.log('📄 Using final fallback')
              // Fallback: convert to string
              const parser = new DOMParser()
              const doc = parser.parseFromString(String(content), 'text/html')
              textContent = doc.body?.textContent || doc.documentElement?.textContent || ''
            }
            console.log('📄 Chapter content length:', textContent.length, 'preview:', textContent.substring(0, 100))
            
            if (textContent.trim()) {
              chapters.push({
                title: item.title || `Chapter ${chapters.length + 1}`,
                content: textContent.trim(),
                href: item.href
              })
              console.log('✅ Added chapter:', item.title || `Chapter ${chapters.length}`)
            } else {
              console.log('⚠️ Empty chapter skipped:', item.href)
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