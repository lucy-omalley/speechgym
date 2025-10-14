/**
 * Real-time Speech Recognition Service
 * Provides accurate word counting and pacing analysis during recording
 */

import { useState, useEffect, useCallback } from 'react';

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  enablePunctuation?: boolean;
  enableCapitalization?: boolean;
  enableNumbers?: boolean;
  enableProfanityFilter?: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface RealTimeSpeechMetrics {
  wordCount: number;
  wordsPerMinute: number;
  averageWordLength: number;
  speakingTime: number;
  pauseTime: number;
  pauseCount: number;
  averagePauseDuration: number;
  paceVariation: number;
  rhythmScore: number;
  lastWordTimestamp: number;
  isSpeaking: boolean;
}

export interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  metrics: RealTimeSpeechMetrics;
}

export class RealTimeSpeechRecognitionService {
  private recognition: any = null;
  private config: Required<SpeechRecognitionConfig>;
  private state: SpeechRecognitionState;
  private listeners: Map<string, Function[]> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private lastSpeechTime: number = 0;
  private speechSegments: Array<{ start: number; end: number; text: string }> = [];
  private pauseThreshold: number = 1000; // 1 second
  private sessionStartTime: number = 0;

  constructor(config: SpeechRecognitionConfig = {}) {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      enablePunctuation: true,
      enableCapitalization: true,
      enableNumbers: true,
      enableProfanityFilter: false,
      ...config,
    };

    this.state = {
      isListening: false,
      isSupported: false,
      error: null,
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      metrics: {
        wordCount: 0,
        wordsPerMinute: 0,
        averageWordLength: 0,
        speakingTime: 0,
        pauseTime: 0,
        pauseCount: 0,
        averagePauseDuration: 0,
        paceVariation: 0,
        rhythmScore: 0,
        lastWordTimestamp: 0,
        isSpeaking: false,
      },
    };

    this.initializeRecognition();
  }

  /**
   * Initialize speech recognition
   */
  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition ||
                             (window as any).mozSpeechRecognition ||
                             (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      this.setState({ isSupported: false, error: 'Speech recognition not supported in this browser' });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.configureRecognition();
    this.setState({ isSupported: true });
  }

  /**
   * Configure speech recognition settings
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Set up event listeners
    this.recognition.onstart = this.handleStart.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
  }

  /**
   * Start speech recognition
   */
  public startListening(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('Attempting to start speech recognition...');
      if (!this.recognition) {
        console.error('Speech recognition not supported');
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.state.isListening) {
        console.log('Speech recognition already listening');
        resolve(true);
        return;
      }

      try {
        console.log('Starting speech recognition...');
        this.sessionStartTime = Date.now();
        this.lastSpeechTime = Date.now();
        this.speechSegments = [];
        this.resetMetrics();
        
        this.recognition.start();
        this.startMetricsCalculation();
        console.log('Speech recognition started successfully');
        resolve(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop speech recognition
   */
  public stopListening(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
    }
    this.stopMetricsCalculation();
  }

  /**
   * Pause speech recognition
   */
  public pauseListening(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
      this.setState({ isListening: false });
    }
  }

  /**
   * Resume speech recognition
   */
  public resumeListening(): void {
    if (this.recognition && !this.state.isListening) {
      this.startListening();
    }
  }

  /**
   * Reset recognition state
   */
  public reset(): void {
    this.stopListening();
    this.setState({
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      error: null,
    });
    this.resetMetrics();
    this.speechSegments = [];
  }

  /**
   * Get current state
   */
  public getState(): SpeechRecognitionState {
    return { ...this.state };
  }

  /**
   * Get current metrics
   */
  public getMetrics(): RealTimeSpeechMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Handle recognition start
   */
  private handleStart(): void {
    this.setState({ isListening: true, error: null });
    this.emit('start');
  }

  /**
   * Handle recognition results
   */
  private handleResult(event: any): void {
    const results = Array.from(event.results) as any[];
    let currentTranscript = '';
    let finalTranscript = '';
    let confidence = 0;

    results.forEach((result, index) => {
      const transcript = result[0].transcript;
      const resultConfidence = result[0].confidence || 0.8;

      if (result.isFinal) {
        finalTranscript += transcript;
        confidence = Math.max(confidence, resultConfidence);
        
        // Update speech segments
        this.updateSpeechSegments(transcript, Date.now());
        console.log('Final transcript added:', transcript);
      } else {
        currentTranscript += transcript;
      }
    });

    if (finalTranscript || currentTranscript) {
      console.log('Speech detected:', {
        current: currentTranscript,
        final: finalTranscript,
        totalFinal: this.state.finalTranscript + finalTranscript
      });
    }

    // Only add new final transcript to avoid duplication
    const newFinalTranscript = this.state.finalTranscript + finalTranscript;
    
    this.setState({
      currentTranscript,
      finalTranscript: newFinalTranscript,
      confidence,
    });

    // Update metrics
    this.updateMetrics();

    this.emit('result', {
      transcript: currentTranscript || finalTranscript,
      confidence,
      isFinal: results[results.length - 1]?.isFinal || false,
      alternatives: results.map(r => ({
        transcript: r[0].transcript,
        confidence: r[0].confidence || 0.8,
      })),
    });
  }

  /**
   * Handle recognition errors
   */
  private handleError(event: any): void {
    let errorMessage = 'Speech recognition error';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not accessible';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied';
        break;
      case 'network':
        errorMessage = 'Network error occurred';
        break;
      case 'aborted':
        errorMessage = 'Speech recognition aborted';
        break;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }

    this.setState({ error: errorMessage, isListening: false });
    this.emit('error', { error: event.error, message: errorMessage });
  }

  /**
   * Handle recognition end
   */
  private handleEnd(): void {
    this.setState({ isListening: false });
    this.stopMetricsCalculation();
    this.emit('end');
  }

  /**
   * Start metrics calculation interval
   */
  private startMetricsCalculation(): void {
    this.metricsInterval = setInterval(() => {
      this.calculateRealTimeMetrics();
    }, 500); // Update every 500ms
  }

  /**
   * Stop metrics calculation interval
   */
  private stopMetricsCalculation(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Update speech segments for pause detection
   */
  private updateSpeechSegments(transcript: string, timestamp: number): void {
    const words = transcript.trim().split(/\s+/);
    if (words.length === 0) return;

    const segmentStart = this.lastSpeechTime;
    const segmentEnd = timestamp;
    
    this.speechSegments.push({
      start: segmentStart,
      end: segmentEnd,
      text: transcript,
    });

    this.lastSpeechTime = timestamp;
  }

  /**
   * Calculate real-time metrics
   */
  private calculateRealTimeMetrics(): void {
    const currentTime = Date.now();
    const sessionDuration = (currentTime - this.sessionStartTime) / 1000; // seconds
    const fullTranscript = this.state.finalTranscript + this.state.currentTranscript;
    
    // Count words - use only final transcript to avoid duplication
    const words = this.countWords(this.state.finalTranscript);
    const wordCount = words.length;
    
    // Calculate WPM based on actual speaking time, not total session time
    // Use a minimum speaking time to avoid division by zero
    const actualSpeakingTime = Math.max(sessionDuration * 0.8, 1); // Assume 80% of time is speaking
    const speakingTimeMinutes = actualSpeakingTime / 60;
    const wordsPerMinute = wordCount / speakingTimeMinutes;
    
    // Calculate average word length
    const totalCharacters = words.join('').length;
    const averageWordLength = wordCount > 0 ? totalCharacters / wordCount : 0;
    
    // Calculate pause metrics
    const pauseMetrics = this.calculatePauseMetrics();
    
    // Calculate pace variation and rhythm score
    const paceVariation = this.calculatePaceVariation();
    const rhythmScore = this.calculateRhythmScore(pauseMetrics);
    
    // Determine if currently speaking
    const timeSinceLastSpeech = currentTime - this.lastSpeechTime;
    const isSpeaking = timeSinceLastSpeech < this.pauseThreshold;

    // Log metrics every 5 seconds to reduce console spam
    if (Math.floor(sessionDuration) % 5 === 0 && sessionDuration > 0) {
      console.log('Metrics update:', {
        wordCount,
        wordsPerMinute: Math.round(wordsPerMinute),
        sessionDuration: Math.round(sessionDuration)
      });
    }

    this.setState({
      metrics: {
        wordCount,
        wordsPerMinute: Math.round(wordsPerMinute),
        averageWordLength: Math.round(averageWordLength * 10) / 10,
        speakingTime: Math.round(sessionDuration * 100) / 100,
        pauseTime: pauseMetrics.totalPauseTime,
        pauseCount: pauseMetrics.pauseCount,
        averagePauseDuration: pauseMetrics.averagePauseDuration,
        paceVariation: Math.round(paceVariation * 100) / 100,
        rhythmScore: Math.round(rhythmScore),
        lastWordTimestamp: this.lastSpeechTime,
        isSpeaking,
      },
    });
  }

  /**
   * Count words from transcript
   */
  private countWords(transcript: string): string[] {
    return transcript
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Calculate pause metrics
   */
  private calculatePauseMetrics(): {
    totalPauseTime: number;
    pauseCount: number;
    averagePauseDuration: number;
  } {
    if (this.speechSegments.length < 2) {
      return { totalPauseTime: 0, pauseCount: 0, averagePauseDuration: 0 };
    }

    let totalPauseTime = 0;
    let pauseCount = 0;

    for (let i = 1; i < this.speechSegments.length; i++) {
      const pauseDuration = this.speechSegments[i].start - this.speechSegments[i - 1].end;
      if (pauseDuration > this.pauseThreshold) {
        totalPauseTime += pauseDuration;
        pauseCount++;
      }
    }

    const averagePauseDuration = pauseCount > 0 ? totalPauseTime / pauseCount : 0;

    return {
      totalPauseTime: Math.round(totalPauseTime),
      pauseCount,
      averagePauseDuration: Math.round(averagePauseDuration),
    };
  }

  /**
   * Calculate pace variation
   */
  private calculatePaceVariation(): number {
    if (this.speechSegments.length < 3) return 0;

    const wordRates: number[] = [];
    
    this.speechSegments.forEach(segment => {
      const words = this.countWords(segment.text);
      const duration = (segment.end - segment.start) / 1000; // seconds
      if (duration > 0 && words.length > 0) {
        wordRates.push(words.length / duration);
      }
    });

    if (wordRates.length < 2) return 0;

    const mean = wordRates.reduce((sum, rate) => sum + rate, 0) / wordRates.length;
    const variance = wordRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / wordRates.length;
    const standardDeviation = Math.sqrt(variance);

    return mean > 0 ? standardDeviation / mean : 0; // Coefficient of variation
  }

  /**
   * Calculate rhythm score (0-100)
   */
  private calculateRhythmScore(pauseMetrics: { totalPauseTime: number; pauseCount: number; averagePauseDuration: number }): number {
    let score = 100;

    // Penalize excessive pauses
    if (pauseMetrics.pauseCount > 10) {
      score -= Math.min(30, (pauseMetrics.pauseCount - 10) * 2);
    }

    // Penalize very long pauses
    if (pauseMetrics.averagePauseDuration > 3000) {
      score -= Math.min(25, (pauseMetrics.averagePauseDuration - 3000) / 100);
    }

    // Bonus for good rhythm (low pace variation)
    if (this.state.metrics.paceVariation < 0.2) {
      score += 10;
    } else if (this.state.metrics.paceVariation > 0.5) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.calculateRealTimeMetrics();
  }

  /**
   * Reset metrics
   */
  private resetMetrics(): void {
    this.setState({
      metrics: {
        wordCount: 0,
        wordsPerMinute: 0,
        averageWordLength: 0,
        speakingTime: 0,
        pauseTime: 0,
        pauseCount: 0,
        averagePauseDuration: 0,
        paceVariation: 0,
        rhythmScore: 0,
        lastWordTimestamp: 0,
        isSpeaking: false,
      },
    });
  }

  /**
   * Set state and notify listeners
   */
  private setState(updates: Partial<SpeechRecognitionState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

/**
 * Hook for using real-time speech recognition
 */
export function useRealTimeSpeechRecognition(config: SpeechRecognitionConfig = {}) {
  const [service] = useState(() => new RealTimeSpeechRecognitionService(config));
  const [state, setState] = useState<SpeechRecognitionState>(service.getState());
  const [metrics, setMetrics] = useState<RealTimeSpeechMetrics>(service.getMetrics());

  useEffect(() => {
    const handleStateChange = (newState: SpeechRecognitionState) => {
      setState(newState);
      setMetrics(newState.metrics);
    };

    service.addEventListener('stateChange', handleStateChange);

    return () => {
      service.removeEventListener('stateChange', handleStateChange);
      service.reset();
    };
  }, [service]);

  const startListening = useCallback(() => service.startListening(), [service]);
  const stopListening = useCallback(() => service.stopListening(), [service]);
  const pauseListening = useCallback(() => service.pauseListening(), [service]);
  const resumeListening = useCallback(() => service.resumeListening(), [service]);
  const reset = useCallback(() => service.reset(), [service]);

  return {
    ...state,
    metrics,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset,
  };
}

