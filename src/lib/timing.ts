export interface TimingConfig {
  wpm: number
  minDuration: number
  maxDuration: number
}

export function calculateChunkDuration(text: string, config: TimingConfig): number {
  const { wpm, minDuration, maxDuration } = config
  
  // Base calculation: words per minute to milliseconds per word
  const wordsPerSecond = wpm / 60
  const wordCount = text.trim().split(/\s+/).length
  let baseDuration = (wordCount / wordsPerSecond) * 1000
  
  // Heuristics for punctuation pauses
  let pauseMultiplier = 1
  
  // Add extra time for punctuation
  if (text.includes('...') || text.includes('…')) {
    pauseMultiplier += 0.3
  } else if (text.includes('.') || text.includes('!') || text.includes('?')) {
    pauseMultiplier += 0.2
  } else if (text.includes(',') || text.includes(';') || text.includes(':')) {
    pauseMultiplier += 0.1
  }
  
  // Add extra time for em-dashes (dialogue)
  if (text.includes('—') || text.includes('–')) {
    pauseMultiplier += 0.15
  }
  
  // Add extra time for quotation marks (dialogue)
  if (text.includes('"') || text.includes('"') || text.includes('"')) {
    pauseMultiplier += 0.1
  }
  
  // Apply multiplier
  baseDuration *= pauseMultiplier
  
  // Enforce minimum and maximum duration
  return Math.max(minDuration, Math.min(maxDuration, baseDuration))
}