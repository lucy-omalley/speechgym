# SpeechGym AI

A mobile-first speech therapy platform with real-time analysis and progress tracking.

## Features

- 🎤 **Speech Recognition** - Real-time audio recording with mobile optimization
- 🏃‍♂️ **Exercise Player** - Full-screen exercises with countdown timers and feedback
- 📊 **Progress Tracking** - Streaks, goals, and comprehensive analytics
- 🤖 **AI Analysis** - OpenAI Whisper integration for fluency metrics
- 📱 **Mobile-First Design** - Touch-friendly interface with safe areas

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional, for speech analysis)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Application Structure

### Pages

- **Home** (`/`) - Dashboard with quick stats and recent activity
- **Exercises** (`/exercises`) - Speech therapy exercises with AI analysis
- **Progress** (`/progress`) - Detailed progress tracking and goal setting

### Core Components

- **MobileExercisePlayer** - Full-screen exercise interface
- **Navigation** - Bottom navigation for mobile-first experience
- **Progress Tracking** - LocalStorage-based progress persistence

### Hooks

- **useSpeechRecognition** - Audio recording with MediaRecorder API
- **useProgress** - Progress tracking with streaks and analytics

### Services

- **SpeechAnalysisService** - OpenAI Whisper integration for speech analysis
- **AudioProcessor** - Audio compression and optimization utilities

## Usage

### Starting an Exercise

1. Navigate to the **Exercises** page
2. Choose from available exercise types:
   - Breathing exercises
   - Pacing practice
   - Repetition drills
   - Free speech practice
3. Follow the on-screen instructions
4. Complete the exercise to see AI analysis results

### Tracking Progress

1. Visit the **Progress** page to view:
   - Current streak and statistics
   - Goal progress
   - Recent session history
   - Improvement trends
2. Set custom goals for weekly sessions and fluency targets
3. Export your data for backup

## Technology Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **OpenAI Whisper** - Speech transcription and analysis
- **MediaRecorder API** - Browser audio recording

## Browser Support

- ✅ Chrome 60+ (Desktop & Mobile)
- ✅ Firefox 55+ (Desktop & Mobile)
- ✅ Safari 12+ (Desktop & Mobile)
- ✅ Edge 79+ (Desktop & Mobile)

## Mobile Optimization

- Touch-friendly interface with 44px+ touch targets
- Safe area handling for iOS devices
- Bottom navigation for thumb accessibility
- Responsive design for all screen sizes
- Offline support with localStorage persistence

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API and utility services
├── types/              # TypeScript type definitions
└── lib/                # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.