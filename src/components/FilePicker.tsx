import { useRef } from 'react'
import type { EpubData } from '../types'
import { parseEpub } from '../lib/epub'

interface FilePickerProps {
  onFileLoaded: (epubData: EpubData) => void
  loading: boolean
}

export function FilePicker({ onFileLoaded, loading }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert('Please select an EPUB file')
      return
    }

    try {
      const epubData = await parseEpub(file)
      onFileLoaded(epubData)
    } catch (error) {
      console.error('Error parsing EPUB:', error)
      alert('Failed to load EPUB file. Please make sure it\'s a valid EPUB without DRM.')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="file-picker">
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div className="drop-zone" onClick={handleClick}>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing EPUB...</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📚</div>
            <h2>Choose an EPUB file</h2>
            <p>Click here to select an EPUB file from your device</p>
            <p className="note">Processing happens entirely in your browser</p>
          </div>
        )}
      </div>
    </div>
  )
}