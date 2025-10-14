/**
 * Speech Analysis Service
 * Uses OpenAI Whisper API for transcription and analyzes fluency metrics
 * Includes comprehensive error handling for mobile network conditions
 */

// Types and interfaces
export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface FluencyMetrics {
  wordsPerMinute: number;
  totalWords: number;
  totalDuration: number;
  repetitions: RepetitionAnalysis[];
  pauses: PauseAnalysis[];
  speakingTime: number;
  silenceTime: number;
  fluencyScore: number; // 0-100
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
}

export interface RepetitionAnalysis {
  word: string;
  count: number;
  positions: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface PauseAnalysis {
  startTime: number;
  endTime: number;
  duration: number;
  severity: 'short' | 'medium' | 'long';
  position: 'word' | 'phrase' | 'sentence';
}

export interface SpeechAnalysisResult {
  transcription: TranscriptionResult;
  fluency: FluencyMetrics;
  recommendations: string[];
  timestamp: Date;
  processingTime: number;
}

export interface SpeechAnalysisConfig {
  apiKey: string;
  model?: 'whisper-1';
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
  enableOfflineMode?: boolean;
  cacheResults?: boolean;
  maxRetries?: number;
  timeout?: number;
  chunkSize?: number; // For large files
}

export interface NetworkError extends Error {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'FILE_TOO_LARGE';
  retryable: boolean;
  retryAfter?: number;
}

export interface CacheEntry {
  id: string;
  result: SpeechAnalysisResult;
  timestamp: Date;
  expiresAt: Date;
}

// Default configuration
const DEFAULT_CONFIG: Required<SpeechAnalysisConfig> = {
  apiKey: '',
  model: 'whisper-1',
  language: 'en',
  prompt: '',
  response_format: 'verbose_json',
  temperature: 0,
  enableOfflineMode: true,
  cacheResults: true,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  chunkSize: 25 * 1024 * 1024, // 25MB
};

class SpeechAnalysisService {
  private config: Required<SpeechAnalysisConfig>;
  private cache: Map<string, CacheEntry> = new Map();
  private offlineQueue: Array<{audioBlob: Blob; config: Partial<SpeechAnalysisConfig>; resolve: Function; reject: Function}> = [];

  constructor(config: SpeechAnalysisConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for offline support
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && this.config.enableOfflineMode) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Speech analysis service worker registered');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Analyze speech from audio blob
   */
  async analyzeSpeech(
    audioBlob: Blob,
    options: Partial<SpeechAnalysisConfig> = {}
  ): Promise<SpeechAnalysisResult> {
    const startTime = Date.now();
    const cacheKey = await this.generateCacheKey(audioBlob, options);

    // Check cache first
    if (this.config.cacheResults) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check network connectivity
    const isOnline = navigator.onLine;
    if (!isOnline && this.config.enableOfflineMode) {
      return this.handleOfflineMode(audioBlob, options, cacheKey);
    }

    try {
      // Transcribe audio using Whisper API
      const transcription = await this.transcribeAudio(audioBlob, options);
      
      // Analyze fluency metrics
      const fluency = await this.analyzeFluency(transcription);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(fluency);
      
      const result: SpeechAnalysisResult = {
        transcription,
        fluency,
        recommendations,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };

      // Cache result
      if (this.config.cacheResults) {
        this.saveToCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      const networkError = this.handleNetworkError(error);
      
      if (networkError.retryable && options.retryCount !== undefined && options.retryCount < this.config.maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, options.retryCount || 0) * 1000;
        await this.delay(delay);
        return this.analyzeSpeech(audioBlob, { ...options, retryCount: (options.retryCount || 0) + 1 });
      }
      
      throw networkError;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeAudio(
    audioBlob: Blob,
    options: Partial<SpeechAnalysisConfig> = {}
  ): Promise<TranscriptionResult> {
    const config = { ...this.config, ...options };
    
    // Validate audio blob
    this.validateAudioBlob(audioBlob);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', config.model);
    formData.append('response_format', config.response_format);
    formData.append('temperature', config.temperature.toString());
    
    if (config.language) {
      formData.append('language', config.language);
    }
    
    if (config.prompt) {
      formData.append('prompt', config.prompt);
    }

    // Make API request with timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return this.parseTranscriptionResult(result, audioBlob);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw this.createNetworkError('TIMEOUT', 'Request timed out', true);
      }
      
      throw error;
    }
  }

  /**
   * Parse Whisper API response
   */
  private parseTranscriptionResult(apiResult: any, audioBlob: Blob): TranscriptionResult {
    if (this.config.response_format === 'verbose_json') {
      return {
        text: apiResult.text || '',
        language: apiResult.language || this.config.language,
        duration: apiResult.duration || 0,
        segments: apiResult.segments || [],
      };
    } else {
      return {
        text: apiResult.text || apiResult,
        language: this.config.language,
        duration: 0,
      };
    }
  }

  /**
   * Analyze fluency metrics from transcription
   */
  private async analyzeFluency(transcription: TranscriptionResult): Promise<FluencyMetrics> {
    const text = transcription.text.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;
    const totalDuration = transcription.duration || 0;
    
    // Calculate words per minute
    const wordsPerMinute = totalDuration > 0 ? (totalWords / (totalDuration / 60)) : 0;
    
    // Analyze repetitions
    const repetitions = this.analyzeRepetitions(words);
    
    // Analyze pauses
    const pauses = this.analyzePauses(transcription.segments || []);
    
    // Calculate speaking time vs silence time
    const speakingTime = this.calculateSpeakingTime(transcription.segments || []);
    const silenceTime = Math.max(0, totalDuration - speakingTime);
    
    // Calculate scores
    const fluencyScore = this.calculateFluencyScore(wordsPerMinute, repetitions, pauses);
    const clarityScore = this.calculateClarityScore(transcription);
    const confidenceScore = this.calculateConfidenceScore(transcription);
    
    return {
      wordsPerMinute: Math.round(wordsPerMinute * 100) / 100,
      totalWords,
      totalDuration,
      repetitions,
      pauses,
      speakingTime,
      silenceTime,
      fluencyScore,
      clarityScore,
      confidenceScore,
    };
  }

  /**
   * Analyze word repetitions
   */
  private analyzeRepetitions(words: string[]): RepetitionAnalysis[] {
    const wordCount = new Map<string, { count: number; positions: number[] }>();
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) { // Only analyze words longer than 2 characters
        if (!wordCount.has(cleanWord)) {
          wordCount.set(cleanWord, { count: 0, positions: [] });
        }
        const entry = wordCount.get(cleanWord)!;
        entry.count++;
        entry.positions.push(index);
      }
    });
    
    const repetitions: RepetitionAnalysis[] = [];
    
    wordCount.forEach((data, word) => {
      if (data.count > 2) { // Only flag words repeated more than twice
        const severity = data.count > 5 ? 'high' : data.count > 3 ? 'medium' : 'low';
        repetitions.push({
          word,
          count: data.count,
          positions: data.positions,
          severity,
        });
      }
    });
    
    return repetitions.sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze pauses in speech
   */
  private analyzePauses(segments: TranscriptionSegment[]): PauseAnalysis[] {
    const pauses: PauseAnalysis[] = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i];
      const nextSegment = segments[i + 1];
      
      const pauseDuration = nextSegment.start - currentSegment.end;
      
      if (pauseDuration > 0.5) { // Only analyze pauses longer than 0.5 seconds
        let severity: 'short' | 'medium' | 'long';
        let position: 'word' | 'phrase' | 'sentence';
        
        if (pauseDuration > 3) {
          severity = 'long';
          position = 'sentence';
        } else if (pauseDuration > 1.5) {
          severity = 'medium';
          position = 'phrase';
        } else {
          severity = 'short';
          position = 'word';
        }
        
        pauses.push({
          startTime: currentSegment.end,
          endTime: nextSegment.start,
          duration: pauseDuration,
          severity,
          position,
        });
      }
    }
    
    return pauses;
  }

  /**
   * Calculate total speaking time
   */
  private calculateSpeakingTime(segments: TranscriptionSegment[]): number {
    return segments.reduce((total, segment) => total + (segment.end - segment.start), 0);
  }

  /**
   * Calculate fluency score (0-100)
   */
  private calculateFluencyScore(wpm: number, repetitions: RepetitionAnalysis[], pauses: PauseAnalysis[]): number {
    let score = 100;
    
    // Penalize for inappropriate WPM
    if (wpm < 80) score -= 20;
    else if (wpm > 200) score -= 20;
    
    // Penalize for repetitions
    repetitions.forEach(repetition => {
      if (repetition.severity === 'high') score -= 15;
      else if (repetition.severity === 'medium') score -= 10;
      else score -= 5;
    });
    
    // Penalize for long pauses
    const longPauses = pauses.filter(pause => pause.severity === 'long');
    score -= longPauses.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate clarity score based on transcription quality
   */
  private calculateClarityScore(transcription: TranscriptionResult): number {
    if (!transcription.segments) return 85; // Default score if no segments
    
    const avgConfidence = transcription.segments.reduce((sum, segment) => {
      return sum + (1 - segment.no_speech_prob);
    }, 0) / transcription.segments.length;
    
    return Math.round(avgConfidence * 100);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(transcription: TranscriptionResult): number {
    if (!transcription.segments) return 80; // Default score
    
    const avgLogProb = transcription.segments.reduce((sum, segment) => {
      return sum + segment.avg_logprob;
    }, 0) / transcription.segments.length;
    
    // Convert log probability to percentage (rough approximation)
    const confidence = Math.max(0, Math.min(100, (avgLogProb + 1) * 50));
    return Math.round(confidence);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(fluency: FluencyMetrics): string[] {
    const recommendations: string[] = [];
    
    if (fluency.wordsPerMinute < 80) {
      recommendations.push('Try speaking a bit faster to improve flow');
    } else if (fluency.wordsPerMinute > 200) {
      recommendations.push('Consider slowing down for better clarity');
    }
    
    if (fluency.repetitions.length > 0) {
      const topRepetition = fluency.repetitions[0];
      recommendations.push(`Try to reduce repetition of "${topRepetition.word}"`);
    }
    
    const longPauses = fluency.pauses.filter(pause => pause.severity === 'long');
    if (longPauses.length > 0) {
      recommendations.push('Work on reducing long pauses between sentences');
    }
    
    if (fluency.silenceTime > fluency.speakingTime * 0.3) {
      recommendations.push('Try to minimize silence time between words');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job! Your speech fluency is excellent');
    }
    
    return recommendations;
  }

  /**
   * Handle offline mode
   */
  private async handleOfflineMode(
    audioBlob: Blob,
    options: Partial<SpeechAnalysisConfig>,
    cacheKey: string
  ): Promise<SpeechAnalysisResult> {
    // Queue for processing when online
    return new Promise((resolve, reject) => {
      this.offlineQueue.push({
        audioBlob,
        config: options,
        resolve,
        reject,
      });
      
      // Try to process queued items when online
      window.addEventListener('online', () => {
        this.processOfflineQueue();
      });
      
      // Reject after 24 hours
      setTimeout(() => {
        reject(this.createNetworkError('NETWORK_ERROR', 'Offline for too long', false));
      }, 24 * 60 * 60 * 1000);
    });
  }

  /**
   * Process queued offline requests
   */
  private async processOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      const item = this.offlineQueue.shift();
      if (item) {
        try {
          const result = await this.analyzeSpeech(item.audioBlob, item.config);
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        }
      }
    }
  }

  /**
   * Cache management
   */
  private async generateCacheKey(audioBlob: Blob, options: Partial<SpeechAnalysisConfig>): Promise<string> {
    const hash = await this.hashBlob(audioBlob);
    const optionsHash = btoa(JSON.stringify(options));
    return `${hash}-${optionsHash}`;
  }

  private getFromCache(key: string): SpeechAnalysisResult | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > new Date()) {
      return entry.result;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private saveToCache(key: string, result: SpeechAnalysisResult): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours
    
    this.cache.set(key, {
      id: key,
      result,
      timestamp: new Date(),
      expiresAt,
    });
    
    // Clean up expired entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Utility functions
   */
  private async hashBlob(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateAudioBlob(blob: Blob): void {
    if (!blob || blob.size === 0) {
      throw new Error('Invalid audio blob');
    }
    
    if (blob.size > this.config.chunkSize) {
      throw this.createNetworkError('FILE_TOO_LARGE', 'Audio file too large', false);
    }
    
    const validTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
    if (!validTypes.includes(blob.type)) {
      throw new Error(`Unsupported audio type: ${blob.type}`);
    }
  }

  private handleNetworkError(error: any): NetworkError {
    if (error.code) return error; // Already a NetworkError
    
    if (error.name === 'AbortError') {
      return this.createNetworkError('TIMEOUT', 'Request timed out', true);
    }
    
    if (error.message.includes('Failed to fetch')) {
      return this.createNetworkError('NETWORK_ERROR', 'Network connection failed', true);
    }
    
    if (error.message.includes('401')) {
      return this.createNetworkError('AUTH_ERROR', 'Invalid API key', false);
    }
    
    if (error.message.includes('429')) {
      return this.createNetworkError('RATE_LIMITED', 'Rate limit exceeded', true, 60000);
    }
    
    if (error.message.includes('quota')) {
      return this.createNetworkError('QUOTA_EXCEEDED', 'API quota exceeded', false);
    }
    
    return this.createNetworkError('NETWORK_ERROR', error.message, true);
  }

  private createNetworkError(
    code: NetworkError['code'],
    message: string,
    retryable: boolean,
    retryAfter?: number
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.code = code;
    error.retryable = retryable;
    if (retryAfter) error.retryAfter = retryAfter;
    return error;
  }

  /**
   * Public methods for configuration and management
   */
  updateConfig(newConfig: Partial<SpeechAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }
}

// Export singleton instance
export const speechAnalysisService = new SpeechAnalysisService({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  enableOfflineMode: true,
  cacheResults: true,
  maxRetries: 3,
  timeout: 30000,
});

export default SpeechAnalysisService;
