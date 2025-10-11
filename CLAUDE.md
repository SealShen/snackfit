# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SnackFit MVP** is a React Native + Expo mobile application that delivers context-aware "exercise snacks" (short 1-3 minute exercise recommendations) to users throughout their day. The app uses location-based environment detection (home, office, gym, station, outdoor) and time-based rules to intelligently suggest appropriate exercises via push notifications.

**Key Concept**: "運動點心" (Exercise Snacks) - Brief, contextually appropriate physical activities triggered by location and time to encourage movement throughout the day.

## Development Commands

### Running the App
```bash
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run in web browser
```

### Project Structure
- No test suite configured
- No linting configured
- Uses TypeScript with `strict: false` in tsconfig.json
- Uses Expo SDK ~54.0.0 with React 19.1.0 and React Native 0.81.4

## Architecture

### Core Engine Pattern

The app uses a **passive notification engine** that runs on a 60-second tick cycle. This engine is bootstrapped in `App.tsx` via `src/services/engine.ts`:

1. **Engine Initialization** (`App.tsx:32-48`): Dynamically imports and starts `bootstrapSnacksEngine()` on mount
2. **Tick Cycle** (`engine.ts:88-123`): Every 60 seconds, checks time/cooldown constraints, infers environment, picks exercises, sends notification
3. **Dynamic Service Loading** (`engine.ts:37-43`): Gracefully falls back if services are missing (rules, location, notifications)
4. **Context Gate** (`engine.ts:161-190`): Intercepts `Notifications.scheduleNotificationAsync` to enforce time/location constraints before sending
5. **Content Composer** (`engine.ts:191-219`): Auto-populates notification content with exercise suggestions if not manually specified

### Environment Detection Flow

```
User Location → Location Service → Environment Type → Rules Engine → Exercise Pool → Notification
```

**Environment Types** (`src/types/config.ts:1`):
- `office`: Work environment (quiet, discreet exercises)
- `home`: Home environment (more freedom)
- `gym`: Gym environment (full intensity)
- `station`: Transit stations (minimal space)
- `outdoor`: Outdoor spaces (high mobility)

**Location Service** (`src/services/location.ts`):
- Requests foreground location permissions
- Currently has a stub `detectEnvironment()` function (MVP returns "office")
- Intended to be expanded with geofencing against user-defined places

**Places System** (`src/types/config.ts:10-16`, `src/services/storage.ts:18-26`):
- Users define locations with `{id, label, env, lat, lng, radiusM}`
- Engine matches current GPS coords against places within radius
- Falls back to null environment if no match

### Rules & Exercise Selection

**Rules Engine** (`src/services/rules.ts`):
- `pickSnacks(env, max)`: Returns 1-3 exercise suggestions filtered by environment
- Reads custom exercises from AsyncStorage key `@snackfit.customExercises`
- Falls back to built-in `FALLBACK` exercise pool (6 default exercises)
- Filters by `allowedEnvs` and `forbiddenEnvs` arrays
- Uses randomized sampling to avoid repetition

**Exercise Data Shape**:
```typescript
{
  name: string;
  durationSec: number;
  intensity: "hard" | "medium" | "easy" | "recovery";
  allowedEnvs: EnvType[];
  forbiddenEnvs: EnvType[];
}
```

### Preferences & Storage

**Storage Service** (`src/services/storage.ts`):
- Uses `@react-native-async-storage/async-storage`
- Keys: `@snackfit.prefs`, `@snackfit.places`, `@snackfit.customExercises`

**Preferences Schema** (`src/types/config.ts:4-8`):
```typescript
{
  frequencyMin: number;          // Cooldown between notifications (minutes)
  allowedHours: HourRange[];     // Time ranges like [{start:"09:30", end:"18:30"}]
  workdaysOnly: boolean;         // Only notify Monday-Friday
}
```

**Default Preferences** (`src/data/defaults.ts:3-7`):
- Frequency: 90 minutes
- Allowed hours: 09:30 - 18:30
- Workdays only: true

### Dynamic Cooldown System

The engine uses adaptive cooldown (`engine.ts:66-69`):
- **User completes exercise** (`DONE` action): Cooldown × 0.75 (min 20 minutes)
- **User ignores notification** (`LATER` action): Cooldown × 1.25 (max 2 hours)
- Initial cooldown: 60 minutes
- Adjusts based on user engagement patterns

### UI Architecture

**Navigation Structure** (`App.tsx:54-74`):
- Bottom Tab Navigator with 3 screens:
  1. **Snacks** (`SnackcerciseDashboard`): Main exercise interface
  2. **Stats** (`Stats`): Progress tracking
  3. **Settings** (`Settings`): Preferences and places management

**Theme System**:
- Dark theme defined in `App.tsx:14-24`
- Additional dark theme tokens in `src/theme/dark.ts`
- Primary color: `#A88CF5` (purple)
- Accent color: `#23C074` (green)
- Background: `#0E0E10` (near-black)

**Dashboard Component** (`src/screens/SnackcerciseDashboard.tsx`):
- Circular progress rings for day/week goals
- Horizontal swipe carousel for exercise cards
- Location chips for environment selection
- Play/Pause controls for exercise timers

**Settings Screen** (`src/screens/Settings.tsx`):
- Exercise preferences sub-screen: `Settings.SnackPrefs.tsx`
- Uses custom components: `TimeRangePicker`, `HourRangePicker`, `FrequencyPicker`, `PlaceForm`

## Important Implementation Notes

### Notification Handling

The engine wraps the native Expo Notifications API twice:
1. **First wrap** (Context Gate): Checks `getSnacksContext()` to validate time/location rules
2. **Second wrap** (Content Composer): Auto-generates exercise suggestions if content is empty

When working with notifications, be aware that `Notifications.scheduleNotificationAsync` has been monkey-patched. To bypass the engine, use the original reference stored in `__origScheduleSnackfit_v2`.

### Permissions Flow

Three permission types are required:
1. **Notifications**: Requested in `engine.ts:21-29` and `notifications.ts:12-23`
2. **Location (Foreground)**: Requested in `location.ts:6-7` and used for environment detection
3. **Location (Usage Description)**: Defined in `app.json:19-20` (Chinese text for iOS)

The app only uses **foreground location** - no background tracking is implemented in MVP.

### Context Gathering Pattern

When the engine needs to make a decision, it gathers context via `getSnacksContext()` (`engine.ts:135-160`):
1. Load user preferences (time ranges, workdays)
2. Check current time against allowed hours
3. Request GPS location
4. Match against user-defined places
5. Return `{allow: boolean, reason?: string, prefs, env}`

This pattern is reused by both the notification gate and any manual triggers.

### Custom Exercise Management

Users can add custom exercises via `CustomExerciseModal` component (`src/components/CustomExerciseModal.tsx`). These are stored in AsyncStorage and automatically picked up by the rules engine. The storage format matches the exercise data shape above.

## Design Artifacts

The `design/` folder contains HTML prototypes showing the evolution of the dashboard UI. These are reference materials only and not part of the runtime app.

## Code Comments & Language

- Code comments are primarily in **Traditional Chinese** (台灣繁體中文)
- User-facing text in the app is in Chinese
- Variable/function names are in English
- This is intentional for the target Taiwan market

## Platform Considerations

### iOS-Specific
- SafeAreaView used for Dynamic Island support (see recent commits)
- Location usage descriptions in Chinese in `app.json:18-21`
- iOS Info.plist configured for notifications and location

### Android-Specific
- Adaptive icon configured in `app.json:24-27`
- Uses foreground location only (no background service)

## Git Workflow

- Main branch: `main`
- Current working branch: `dev`
- Recent commits show UI refinements and Settings screen overhauls
- The Dashboard interface was recently cleaned up (備份/backup files were removed)
