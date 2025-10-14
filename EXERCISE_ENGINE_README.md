# Mobile Exercise Engine

A comprehensive, mobile-first exercise engine for SpeechGym AI that handles different exercise types with consistent UI, audio recording, and results collection.

## 🚀 Features

### 📱 Mobile-First Design
- **Large Touch Targets** - All interactive elements are 44px+ for optimal mobile interaction
- **Swipe Gestures** - Navigate through exercise steps with intuitive swipe gestures
- **Safe Area Support** - Handles iOS notches and Android navigation bars
- **Responsive Layout** - Adapts to different screen sizes and orientations

### 🎯 Exercise Types Supported
- **Breathing Exercises** - Controlled breathing practice for speech stamina
- **Pacing Exercises** - Practice speaking at controlled, steady rates
- **Repetition Drills** - Repeat words/phrases for clarity and muscle memory
- **Free Speech** - Spontaneous speech practice with real-time feedback

### 🎤 Audio Integration
- **Real-time Recording** - High-quality audio recording with MediaRecorder API
- **Audio Level Visualization** - Visual feedback of recording levels
- **Recording Controls** - Start, pause, resume, and stop recording
- **Permission Handling** - Graceful microphone permission management

### 📊 Results & Analytics
- **Speech Analysis** - Integration with OpenAI Whisper for transcription
- **Fluency Metrics** - Words per minute, repetitions, pauses analysis
- **Progress Tracking** - Automatic saving to user progress
- **Visual Feedback** - Clear results display with scores and recommendations

## 🏗️ Architecture

### Core Components

#### `ExerciseEngine.tsx`
The main exercise engine component that orchestrates the entire exercise experience.

**Key Features:**
- Step-by-step exercise progression
- Audio recording integration
- Results processing and display
- Swipe gesture handling
- Error handling and recovery

#### `useSwipeGesture` Hook
Custom hook for handling touch gestures:
- **Swipe Left** - Progress to next step
- **Swipe Right** - Go back or cancel exercise
- **Touch Threshold** - Configurable sensitivity (default: 50px)

### Exercise Flow

1. **Instruction Step** - Display exercise instructions and preparation
2. **Countdown** - 3-second countdown before recording begins
3. **Recording** - Active recording with real-time feedback
4. **Processing** - Speech analysis and results generation
5. **Completion** - Display results and collect feedback

## 🎮 Usage

### Basic Implementation

```tsx
import ExerciseEngine from '@/components/Exercise/ExerciseEngine';
import { createBreathingExercise } from '@/types';

const exercise = createBreathingExercise({
  id: 'breathing-1',
  name: 'Deep Breathing Practice',
  description: 'Practice controlled breathing for better speech stamina.',
  duration: 30, // seconds
  repetitions: 5,
  // ... other properties
});

function MyExercisePage() {
  const handleComplete = (result) => {
    console.log('Exercise completed:', result);
    // Handle completion
  };

  const handleCancel = () => {
    // Handle cancellation
  };

  return (
    <ExerciseEngine
      exercise={exercise}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
```

### Advanced Configuration

```tsx
<ExerciseEngine
  exercise={exercise}
  onComplete={handleComplete}
  onCancel={handleCancel}
  onStepChange={(stepIndex) => {
    // Handle step changes
    console.log('Current step:', stepIndex);
  }}
  className="custom-exercise-styles"
/>
```

## 🎯 Exercise Types

### Breathing Exercises
```typescript
const breathingExercise = createBreathingExercise({
  id: 'breathing-1',
  name: 'Deep Breathing Practice',
  description: 'Practice controlled breathing for better speech stamina.',
  instructions: [
    'Inhale slowly for 4 counts',
    'Hold your breath for 4 counts',
    'Exhale slowly for 6 counts',
    'Repeat this cycle 5 times'
  ],
  duration: 30, // seconds
  repetitions: 5,
  difficulty: 'beginner',
  category: 'breathing',
  tags: ['relaxation', 'stamina', 'tension'],
});
```

### Pacing Exercises
```typescript
const pacingExercise = createPacingExercise({
  id: 'pacing-1',
  name: 'Slow Pacing Drill',
  description: 'Practice speaking at a controlled, steady pace.',
  instructions: [
    'Read the text below at a steady pace',
    'Pause at commas and periods',
    'Focus on clear articulation'
  ],
  text: 'The quick brown fox, jumps over the lazy dog...',
  duration: 60, // seconds
  targetPace: 120, // words per minute
  difficulty: 'intermediate',
  category: 'pacing',
  tags: ['clarity', 'pace', 'articulation'],
});
```

### Repetition Exercises
```typescript
const repetitionExercise = createRepetitionExercise({
  id: 'repetition-1',
  name: 'Word Repetition',
  description: 'Practice repeating words clearly to improve pronunciation.',
  instructions: [
    'Repeat each word clearly 3 times',
    'Focus on proper pronunciation',
    'Maintain consistent volume'
  ],
  words: ['apple', 'banana', 'cat', 'dog', 'elephant'],
  repetitions: 3,
  duration: 45, // seconds
  difficulty: 'beginner',
  category: 'repetition',
  tags: ['pronunciation', 'clarity', 'memory'],
});
```

### Free Speech Exercises
```typescript
const freeSpeechExercise = createFreeSpeechExercise({
  id: 'free-speech-1',
  name: 'Daily Reflection',
  description: 'Practice spontaneous speech by talking about your day.',
  instructions: [
    'Speak naturally about your day',
    'Try to speak for at least 30 seconds',
    'Focus on natural flow and clarity'
  ],
  prompt: 'Tell me about your favorite hobby and why you enjoy it.',
  duration: 60, // seconds
  difficulty: 'intermediate',
  category: 'freeSpeech',
  tags: ['spontaneous', 'flow', 'natural'],
});
```

## 📊 Results Structure

### ExerciseResult Interface
```typescript
interface ExerciseResult {
  exerciseId: string;
  exerciseType: ExerciseType;
  completedAt: Date;
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  audioBlob?: Blob;
  audioUrl?: string;
  metrics: {
    fluencyScore: number;
    clarityScore: number;
    confidenceScore: number;
    wordsPerMinute?: number;
    repetitions?: number;
    pauses?: number;
  };
  feedback: string[];
  notes?: string;
}
```

### Metrics Explained
- **Fluency Score** - Overall speech fluency (0-100%)
- **Clarity Score** - Speech clarity and articulation (0-100%)
- **Confidence Score** - Speaking confidence level (0-100%)
- **Words Per Minute** - Speaking rate analysis
- **Repetitions** - Count of repeated words/phrases
- **Pauses** - Analysis of speech pauses and breaks

## 🎨 UI Components

### Step Types

#### Instruction Step
- Large emoji icon
- Clear title and description
- "Start Exercise" button

#### Countdown Step
- Large animated countdown
- Preparation instructions
- Auto-advance after 3 seconds

#### Recording Step
- Recording status indicator
- Audio level visualization
- Recording controls (Start/Pause/Stop)
- Duration display
- Text display for pacing/repetition exercises

#### Feedback Step
- Loading spinner
- Processing message
- Auto-advance after analysis

#### Completion Step
- Success celebration
- Results display with scores
- Feedback recommendations
- "Finish Exercise" button

### Mobile Optimizations

#### Touch Targets
- Minimum 44px touch targets
- Large buttons with clear labels
- Spacious layout for thumb navigation

#### Swipe Gestures
- **Swipe Left** - Next step
- **Swipe Right** - Previous step or cancel
- Visual hints at bottom of screen

#### Safe Areas
- iOS notch handling
- Android navigation bar support
- Responsive padding adjustments

## 🔧 Customization

### Styling
All components use Tailwind CSS classes and can be customized:

```tsx
<ExerciseEngine
  className="custom-exercise-styles"
  // ... other props
/>
```

### Exercise Configuration
Exercises can be customized with various properties:
- Duration and timing
- Difficulty levels
- Instructions and prompts
- Target metrics
- Tags and categories

### Audio Settings
Recording can be configured via the `useSpeechRecognition` hook:
- Maximum duration
- Audio level thresholds
- Real-time processing
- Error handling

## 🚀 Demo Page

Access the demo at `/exercise-engine-demo` to test all exercise types:

1. **Breathing Exercise** - Test controlled breathing practice
2. **Pacing Exercise** - Test steady pace speaking
3. **Repetition Exercise** - Test word repetition drills
4. **Free Speech** - Test spontaneous speech practice

### Demo Features
- Exercise type selection
- Full exercise flow testing
- Results display
- Error handling demonstration
- Mobile gesture testing

## 🔒 Error Handling

### Graceful Degradation
- Microphone permission handling
- Network error recovery
- Audio recording failures
- Analysis service unavailability

### User Feedback
- Clear error messages
- Retry mechanisms
- Fallback options
- Progress preservation

## 📱 Mobile Testing

### Recommended Testing
- **iOS Safari** - Full feature support
- **Android Chrome** - Complete functionality
- **Touch Devices** - Gesture testing
- **Different Screen Sizes** - Responsive testing

### Performance Considerations
- Optimized for mobile networks
- Efficient audio processing
- Minimal memory usage
- Fast loading times

## 🎯 Integration

### With Authentication
- User-specific progress tracking
- Personalized exercise recommendations
- Session management
- Data persistence

### With Progress Tracking
- Automatic session recording
- Progress analytics
- Streak calculation
- Goal tracking

### With Speech Analysis
- Real-time transcription
- Fluency analysis
- Recommendations generation
- Performance metrics

## 🚀 Future Enhancements

### Planned Features
- **Voice Commands** - Hands-free navigation
- **Offline Mode** - Work without internet
- **Custom Exercises** - User-created content
- **Social Features** - Share progress and achievements
- **Advanced Analytics** - Detailed performance insights

### Technical Improvements
- **WebAssembly** - Faster audio processing
- **Service Workers** - Offline functionality
- **Push Notifications** - Exercise reminders
- **Accessibility** - Screen reader support

## 📞 Support

### Common Issues
1. **Microphone Permission** - Grant browser permissions
2. **Audio Quality** - Check device microphone
3. **Network Issues** - Ensure stable connection
4. **Performance** - Close other apps for best experience

### Getting Help
- Check browser console for errors
- Verify microphone permissions
- Test with demo exercises
- Review mobile optimization settings

The Mobile Exercise Engine provides a comprehensive, user-friendly platform for speech therapy exercises with professional-grade features and mobile-first design! 🎉
