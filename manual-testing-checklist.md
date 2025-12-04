# Manual Testing Checklist - Task 2 (Audio System & Polish)

## Audio System Testing

### Desktop Testing

- [ ] **Jump Sound**: Press Space/J - hear 8-bit jump sound (rising pitch)
- [ ] **Collect Sound**: Collect items - hear C-E-G arpeggio
- [ ] **Game Over Sound**: Hit obstacle - hear descending pitch sequence
- [ ] **Volume Control**: Test volume slider/prefs affect sound levels
- [ ] **Mute/Unmute**: Toggle mute - verify unmute callback fires
- [ ] **Audio Context**: Verify audio resumes after first user interaction
- [ ] **Graceful Fallback**: Test in browser without Web Audio API support

### Mobile Testing

- [ ] **Touch Jump**: Tap canvas - hear jump sound
- [ ] **Touch Collect**: Collect items via touch - hear collect sound
- [ ] **Mobile Audio**: Verify audio works on mobile browsers
- [ ] **Touch Mute**: Test mute/unmute via touch controls

## Scoring System Testing

### Score Mechanics

- [ ] **Initial Score**: Game starts with 0 points
- [ ] **Collect Points**: Collect commit (10 pts) and star (25 pts)
- [ ] **Score Display**: Score updates correctly in UI
- [ ] **Score Callbacks**: `setScoreChangeCallback()` fires on all changes
- [ ] **Score Events**: 'score' events emitted with correct data
- [ ] **Programmatic Score**: `setScore()` triggers callbacks and events

### High Score Persistence

- [ ] **High Score Save**: New high scores save to localStorage
- [ ] **High Score Display**: High score shows correctly on load
- [ ] **High Score Update**: Score > current high updates properly
- [ ] **High Score Reset**: `resetHighScore()` clears stored value
- [ ] **Storage Errors**: Graceful handling when localStorage unavailable

## Difficulty Progression Testing

### Speed Increases

- [ ] **Initial Speed**: Game starts at configured speed (4)
- [ ] **Speed Trigger**: Speed increases every 50 points
- [ ] **Speed Cap**: Maximum speed limited (12)
- [ ] **Smooth Transitions**: Speed changes don't cause jarring gameplay
- [ ] **Difficulty Feel**: Game becomes progressively more challenging

## Visual Polish Testing

### Game Over Effects

- [ ] **Flash Effect**: Screen flashes on game over
- [ ] **Flash Color**: Correct color (#306230) and duration (0.6s)
- [ ] **Particle Effects**: Game over particles spawn correctly
- [ ] **Visual Feedback**: Clear indication of game state changes

### UI Integration

- [ ] **Score UI**: Score updates in real-time
- [ ] **High Score UI**: High score displays correctly
- [ ] **Audio Controls**: Mute/unmute buttons work
- [ ] **Responsive Design**: UI scales correctly on mobile

## Cross-Browser Testing

### Desktop Browsers

- [ ] **Chrome 80+**: All features work correctly
- [ ] **Firefox 75+**: Audio and scoring functional
- [ ] **Safari 13+**: Compatibility verified
- [ ] **Edge 80+**: Full functionality confirmed

### Mobile Browsers

- [ ] **iOS Safari**: Touch controls and audio work
- [ ] **Chrome Mobile**: Full feature support
- [ ] **Samsung Internet**: Basic functionality verified

## Performance Testing

### Desktop Performance

- [ ] **60 FPS Target**: Game maintains 60fps on desktop
- [ ] **Memory Usage**: No memory leaks during extended play
- [ ] **Audio Latency**: Sound effects play without delay
- [ ] **Smooth Scrolling**: Background and entities move smoothly

### Mobile Performance

- [ ] **Mobile FPS**: Acceptable framerate on mobile devices
- [ ] **Touch Response**: Immediate response to touch input
- [ ] **Battery Usage**: Reasonable battery consumption
- [ ] **Thermal Management**: No overheating during extended play

## Accessibility Testing

### Keyboard Navigation

- [ ] **Keyboard Controls**: All game functions accessible via keyboard
- [ ] **Focus Management**: Canvas receives focus properly
- [ ] **Screen Reader**: Basic screen reader compatibility

### Visual Accessibility

- [ ] **High Contrast**: Game visible in high contrast mode
- [ ] **Color Blind**: Game playable with color blindness
- [ ] **Text Size**: UI text readable at various sizes

## Error Handling Testing

### Audio Errors

- [ ] **Missing Web Audio**: Graceful fallback when API unavailable
- [ ] **Audio Context Suspended**: Proper handling of suspended context
- [ ] **Permission Denied**: Handles audio permission issues

### Storage Errors

- [ ] **localStorage Full**: Graceful handling when storage full
- [ ] **Privacy Mode**: Works in browser privacy/incognito mode
- [ ] **Storage Corruption**: Handles corrupted localStorage data

## Integration Testing

### Astro Integration

- [ ] **SSR Compatibility**: No server-side rendering errors
- [ ] **Dynamic Imports**: Game loads correctly via dynamic import
- [ ] **Component Lifecycle**: Proper cleanup on component unmount

### Event System

- [ ] **Custom Events**: Game events fire correctly
- [ ] **Event Listeners**: External listeners receive events
- [ ] **Event Cleanup**: No memory leaks from event listeners

## Regression Testing

### Previous Features

- [ ] **Basic Gameplay**: Core game mechanics unchanged
- [ ] **Save/Load**: Existing save system works
- [ ] **Settings**: Game settings persist correctly
- [ ] **Achievements**: Existing achievement system functional

## Test Results Documentation

### Pass/Fail Criteria

- **PASS**: All functionality works as specified
- **FAIL**: Critical issue preventing normal gameplay
- **PARTIAL**: Minor issues that don't break core gameplay

### Bug Reporting Format

```
Bug Title: [Brief description]
Steps to Reproduce: [Detailed steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Browser/Device: [Testing environment]
Severity: [Critical/High/Medium/Low]
```

### Test Environment

- **Desktop**: Chrome 120, Firefox 121, Safari 17, Edge 120
- **Mobile**: iOS Safari 17, Chrome Mobile 120
- **Devices**: Desktop, Tablet, Mobile
- **Network**: WiFi, 4G, Offline

## Acceptance Criteria Verification

### Task 2 Requirements

- [ ] **AudioManager Methods**: All methods behave as specified
- [ ] **Score Increments**: Score increases correctly on collect
- [ ] **Difficulty Progression**: Speed increases trigger and affect obstacle speed
- [ ] **High Score Persistence**: High scores persist to localStorage
- [ ] **getHighScore()/resetHighScore()**: Methods work correctly
- [ ] **Events/Callbacks**: All events and callbacks fire properly
- [ ] **All Unit Tests Pass**: Test suite shows 100% pass rate
- [ ] **TypeScript Compilation**: No type errors or warnings

### Final Sign-off

- **QA Engineer**: [Name] - [Date]
- **Test Coverage**: [Percentage]% of features tested
- **Critical Issues**: [Number] remaining
- **Ready for Production**: [Yes/No]

---

## Notes for QA Team

1. **Audio Context**: Some browsers require user interaction before audio works
2. **Mobile Testing**: Test on both iOS and Android devices
3. **Performance**: Monitor memory usage during extended play sessions
4. **Browser Cache**: Clear cache between test runs for accurate results
5. **Network Conditions**: Test offline functionality for localStorage features
