/**
 * Utility functions for speech analysis service
 * Helper functions for audio processing, metrics calculation, and mobile optimization
 */

import { FluencyMetrics, RepetitionAnalysis, PauseAnalysis, TranscriptionResult } from './speechAnalysis';

/**
 * Audio processing utilities
 */
export class AudioProcessor {
  /**
   * Convert audio blob to different formats for mobile compatibility
   */
  static async convertAudioFormat(
    audioBlob: Blob,
    targetFormat: 'webm' | 'mp4' | 'wav' = 'webm'
  ): Promise<Blob> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create new audio context for conversion
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = newAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create media stream destination
      const destination = newAudioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Record the converted audio
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: this.getMimeType(targetFormat),
      });
      
      return new Promise((resolve, reject) => {
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const convertedBlob = new Blob(chunks, { type: this.getMimeType(targetFormat) });
          resolve(convertedBlob);
          newAudioContext.close();
        };
        
        mediaRecorder.onerror = (error) => {
          reject(error);
          newAudioContext.close();
        };
        
        mediaRecorder.start();
        source.start();
        
        // Stop recording after the duration
        setTimeout(() => {
          mediaRecorder.stop();
        }, audioBuffer.duration * 1000);
      });
    } catch (error) {
      console.warn('Audio conversion failed, returning original blob:', error);
      return audioBlob;
    }
  }

  /**
   * Get MIME type for audio format
   */
  private static getMimeType(format: string): string {
    const mimeTypes = {
      webm: 'audio/webm;codecs=opus',
      mp4: 'audio/mp4',
      wav: 'audio/wav',
    };
    return mimeTypes[format] || 'audio/webm';
  }

  /**
   * Compress audio for mobile upload
   */
  static async compressAudio(audioBlob: Blob, quality: number = 0.7): Promise<Blob> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create compressed version
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: Math.floor(128000 * quality),
      });
      
      return new Promise((resolve, reject) => {
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          resolve(compressedBlob);
          audioContext.close();
        };
        
        mediaRecorder.onerror = (error) => {
          reject(error);
          audioContext.close();
        };
        
        mediaRecorder.start();
        source.start();
        
        setTimeout(() => {
          mediaRecorder.stop();
        }, audioBuffer.duration * 1000);
      });
    } catch (error) {
      console.warn('Audio compression failed, returning original blob:', error);
      return audioBlob;
    }
  }

  /**
   * Get audio duration from blob
   */
  static async getAudioDuration(audioBlob: Blob): Promise<number> {
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(audio.duration);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load audio metadata'));
        };
        
        audio.src = url;
      });
    } catch (error) {
      console.warn('Failed to get audio duration:', error);
      return 0;
    }
  }

  /**
   * Validate audio quality for mobile
   */
  static validateAudioQuality(audioBlob: Blob): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check file size
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxSize) {
      issues.push('File size too large for mobile upload');
      recommendations.push('Compress audio or reduce recording duration');
    }
    
    // Check duration
    if (audioBlob.size > 0) {
      const estimatedDuration = audioBlob.size / (128 * 1024 / 8); // Rough estimate
      if (estimatedDuration > 600) { // 10 minutes
        issues.push('Recording duration too long');
        recommendations.push('Keep recordings under 10 minutes');
      }
    }
    
    // Check MIME type
    const supportedTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
    if (!supportedTypes.includes(audioBlob.type)) {
      issues.push('Unsupported audio format');
      recommendations.push('Use WebM, MP4, WAV, or MP3 format');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

/**
 * Fluency metrics calculator
 */
export class FluencyCalculator {
  /**
   * Calculate advanced fluency metrics
   */
  static calculateAdvancedMetrics(
    transcription: TranscriptionResult,
    customTargets?: {
      targetWPM?: number;
      targetPauseThreshold?: number;
      targetRepetitionThreshold?: number;
    }
  ): FluencyMetrics {
    const text = transcription.text.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;
    const totalDuration = transcription.duration || 0;
    
    // Calculate basic metrics
    const wordsPerMinute = totalDuration > 0 ? (totalWords / (totalDuration / 60)) : 0;
    
    // Analyze repetitions with advanced algorithms
    const repetitions = this.analyzeAdvancedRepetitions(words);
    
    // Analyze pauses with context
    const pauses = this.analyzeContextualPauses(transcription.segments || []);
    
    // Calculate speaking efficiency
    const speakingTime = this.calculateSpeakingTime(transcription.segments || []);
    const silenceTime = Math.max(0, totalDuration - speakingTime);
    
    // Calculate scores with custom targets
    const fluencyScore = this.calculateAdvancedFluencyScore(
      wordsPerMinute,
      repetitions,
      pauses,
      customTargets
    );
    
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
   * Advanced repetition analysis with pattern detection
   */
  private static analyzeAdvancedRepetitions(words: string[]): RepetitionAnalysis[] {
    const wordCount = new Map<string, { count: number; positions: number[]; contexts: string[] }>();
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 2) {
        if (!wordCount.has(cleanWord)) {
          wordCount.set(cleanWord, { count: 0, positions: [], contexts: [] });
        }
        const entry = wordCount.get(cleanWord)!;
        entry.count++;
        entry.positions.push(index);
        
        // Get context (words before and after)
        const context = [
          words[index - 1] || '',
          cleanWord,
          words[index + 1] || '',
        ].join(' ');
        entry.contexts.push(context);
      }
    });
    
    const repetitions: RepetitionAnalysis[] = [];
    
    wordCount.forEach((data, word) => {
      if (data.count > 2) {
        // Analyze repetition patterns
        const severity = this.calculateRepetitionSeverity(data);
        
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
   * Calculate repetition severity based on context and frequency
   */
  private static calculateRepetitionSeverity(data: {
    count: number;
    positions: number[];
    contexts: string[];
  }): 'low' | 'medium' | 'high' {
    const { count, positions } = data;
    
    // Check for clustered repetitions (worse than scattered)
    let clusteredRepetitions = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      if (positions[i + 1] - positions[i] <= 3) {
        clusteredRepetitions++;
      }
    }
    
    const clusteredRatio = clusteredRepetitions / count;
    
    if (count > 8 || clusteredRatio > 0.6) return 'high';
    if (count > 4 || clusteredRatio > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Analyze pauses with contextual information
   */
  private static analyzeContextualPauses(segments: any[]): PauseAnalysis[] {
    const pauses: PauseAnalysis[] = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i];
      const nextSegment = segments[i + 1];
      
      const pauseDuration = nextSegment.start - currentSegment.end;
      
      if (pauseDuration > 0.3) { // Lower threshold for more sensitive analysis
        const severity = this.calculatePauseSeverity(pauseDuration, currentSegment, nextSegment);
        const position = this.determinePausePosition(currentSegment, nextSegment);
        
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
   * Calculate pause severity with context
   */
  private static calculatePauseSeverity(
    duration: number,
    beforeSegment: any,
    afterSegment: any
  ): 'short' | 'medium' | 'long' {
    // Consider content length and complexity
    const beforeLength = beforeSegment.text?.length || 0;
    const afterLength = afterSegment.text?.length || 0;
    
    // Adjust thresholds based on content complexity
    const complexityFactor = (beforeLength + afterLength) / 20;
    const adjustedThresholds = {
      short: 0.5 + complexityFactor * 0.2,
      medium: 1.5 + complexityFactor * 0.5,
      long: 3.0 + complexityFactor * 1.0,
    };
    
    if (duration > adjustedThresholds.long) return 'long';
    if (duration > adjustedThresholds.medium) return 'medium';
    return 'short';
  }

  /**
   * Determine pause position context
   */
  private static determinePausePosition(beforeSegment: any, afterSegment: any): 'word' | 'phrase' | 'sentence' {
    const beforeText = beforeSegment.text || '';
    const afterText = afterSegment.text || '';
    
    // Check for sentence boundaries
    if (beforeText.match(/[.!?]$/) || afterText.match(/^[A-Z]/)) {
      return 'sentence';
    }
    
    // Check for phrase boundaries (commas, conjunctions)
    if (beforeText.match(/[,;]$/) || beforeText.match(/\b(and|but|or|so)\b$/i)) {
      return 'phrase';
    }
    
    return 'word';
  }

  /**
   * Calculate speaking time from segments
   */
  private static calculateSpeakingTime(segments: any[]): number {
    return segments.reduce((total, segment) => {
      return total + (segment.end - segment.start);
    }, 0);
  }

  /**
   * Calculate advanced fluency score
   */
  private static calculateAdvancedFluencyScore(
    wpm: number,
    repetitions: RepetitionAnalysis[],
    pauses: PauseAnalysis[],
    targets?: {
      targetWPM?: number;
      targetPauseThreshold?: number;
      targetRepetitionThreshold?: number;
    }
  ): number {
    let score = 100;
    
    const targetWPM = targets?.targetWPM || 150;
    const targetPauseThreshold = targets?.targetPauseThreshold || 1.5;
    const targetRepetitionThreshold = targets?.targetRepetitionThreshold || 2;
    
    // WPM scoring with target-based calculation
    const wpmDeviation = Math.abs(wpm - targetWPM) / targetWPM;
    score -= Math.min(30, wpmDeviation * 100);
    
    // Repetition scoring with severity weighting
    repetitions.forEach(repetition => {
      const severityWeight = {
        low: 5,
        medium: 10,
        high: 20,
      };
      score -= severityWeight[repetition.severity] * (repetition.count / targetRepetitionThreshold);
    });
    
    // Pause scoring with context consideration
    const problematicPauses = pauses.filter(pause => 
      pause.duration > targetPauseThreshold || pause.severity === 'long'
    );
    score -= problematicPauses.length * 8;
    
    // Bonus for good rhythm (consistent pace)
    const paceVariation = this.calculatePaceVariation(pauses);
    if (paceVariation < 0.3) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate pace variation
   */
  private static calculatePaceVariation(pauses: PauseAnalysis[]): number {
    if (pauses.length < 2) return 0;
    
    const durations = pauses.map(pause => pause.duration);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    
    return Math.sqrt(variance) / mean;
  }

  /**
   * Calculate clarity score
   */
  private static calculateClarityScore(transcription: TranscriptionResult): number {
    if (!transcription.segments) return 85;
    
    const avgConfidence = transcription.segments.reduce((sum, segment) => {
      return sum + (1 - segment.no_speech_prob);
    }, 0) / transcription.segments.length;
    
    return Math.round(avgConfidence * 100);
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidenceScore(transcription: TranscriptionResult): number {
    if (!transcription.segments) return 80;
    
    const avgLogProb = transcription.segments.reduce((sum, segment) => {
      return sum + segment.avg_logprob;
    }, 0) / transcription.segments.length;
    
    const confidence = Math.max(0, Math.min(100, (avgLogProb + 1) * 50));
    return Math.round(confidence);
  }
}

/**
 * Mobile network utilities
 */
export class NetworkUtils {
  /**
   * Check network connectivity and quality
   */
  static async checkNetworkStatus(): Promise<{
    isOnline: boolean;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  }> {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
  }

  /**
   * Estimate upload time for audio blob
   */
  static estimateUploadTime(audioBlob: Blob, networkStatus: any): number {
    const sizeInMB = audioBlob.size / (1024 * 1024);
    
    // Estimate upload speed based on connection type
    const speedMap: { [key: string]: number } = {
      'slow-2g': 0.05, // 50 KB/s
      '2g': 0.25,      // 250 KB/s
      '3g': 1,         // 1 MB/s
      '4g': 10,        // 10 MB/s
      '5g': 100,       // 100 MB/s
    };
    
    const estimatedSpeed = speedMap[networkStatus.effectiveType] || 1;
    const timeInSeconds = (sizeInMB / estimatedSpeed);
    
    return Math.ceil(timeInSeconds);
  }

  /**
   * Get retry strategy based on network conditions
   */
  static getRetryStrategy(networkStatus: any): {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  } {
    const isSlowConnection = networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g';
    
    if (isSlowConnection) {
      return {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 30000,
      };
    }
    
    return {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  /**
   * Start performance measurement
   */
  static startTiming(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }

  /**
   * End performance measurement
   */
  static endTiming(label: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      const duration = measure.duration;
      
      // Store metric for analysis
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      // Clean up
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
      
      return duration;
    }
    return 0;
  }

  /**
   * Get performance statistics
   */
  static getStats(label: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const average = values.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const median = count % 2 === 0 
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
    
    return { count, average, min, max, median };
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }
}

export default {
  AudioProcessor,
  FluencyCalculator,
  NetworkUtils,
  PerformanceMonitor,
};
