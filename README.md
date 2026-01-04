# Roboadvisor App

A modern, cross-platform investment advisory mobile application built with React Native. This app provides automated financial guidance to help users make informed investment decisions on both iOS and Android platforms.

## Features

- 📱 **Cross-Platform Support**: Native iOS and Android applications
- 🎯 **Automated Investment Advice**: Algorithm-driven investment recommendations
- 🎨 **Modern UI**: Built with Tailwind CSS and NativeWind for consistent styling
- ⚡ **High Performance**: React Native with optimized animations using Reanimated
- 🧪 **Fully Tested**: Comprehensive test suite with Jest
- 📱 **Responsive Design**: Adapts seamlessly to all device sizes
- 🔒 **Type Safe**: Full TypeScript support

## Tech Stack

### Frontend Framework
- **React Native**: v0.82.1
- **React**: v19.1.1
- **TypeScript**: v5.8.3

### Styling & UI
- **Tailwind CSS**: v3.4.18
- **NativeWind**: v4.2.1 (Tailwind for React Native)
- **React Native Reanimated**: v4.1.3 (Smooth animations)

### Development Tools
- **Babel**: v7.25.2
- **Metro**: React Native bundler
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Testing
- **Jest**: v29.6.3
- **React Test Renderer**: v19.1.1

## Prerequisites

- **Node.js**: v20 or higher
- **npm** or **yarn**: Package manager
- **Xcode**: v14+ (for iOS development)
- **Android Studio**: Latest version (for Android development)
- **Ruby**: v2.7+ (for iOS dependencies)
- **CocoaPods**: For iOS dependency management

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd robo_advisor
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Install iOS Pods (macOS only)
```bash
cd ios && pod install && cd ..
```

## Development

### Start the Development Server
```bash
npm start
# or
yarn start
```

### Run on iOS
```bash
npm run ios
# or
yarn ios
```

**Requirements**:
- macOS with Xcode installed
- Connected iPhone or iOS Simulator

### Run on Android
```bash
npm run android
# or
yarn android
```

**Requirements**:
- Android SDK installed
- Android Emulator or connected Android device
- `ANDROID_HOME` environment variable configured

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the React Native development server |
| `npm run ios` | Build and run the app on iOS Simulator or device |
| `npm run android` | Build and run the app on Android Emulator or device |
| `npm run lint` | Run ESLint to check code quality |
| `npm test` | Run Jest test suite |

## Project Structure

```
.
├── App.tsx                 # Main App component
├── index.js               # App entry point
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── __tests__/             # Test files
├── android/               # Android native code
│   └── app/
│       └── src/main/      # Android app source
├── ios/                   # iOS native code
│   ├── roboadvisor/    # App source
│   └── Podfile            # iOS dependencies
└── global.css             # Global styles
```

## Configuration

### Tailwind CSS
Configure your design system in `tailwind.config.js`:
```javascript
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './<custom-folder>/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### TypeScript
Edit `tsconfig.json` to customize TypeScript settings.

## Testing

Run the test suite:
```bash
npm test
```

Watch mode:
```bash
npm test -- --watch
```

## Linting

Check code quality:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint -- --fix
```

## Troubleshooting

### iOS Issues
- **Pod install fails**: Try `pod repo update && pod install`
- **Build fails**: Clean with `xcode-select --reset` and retry
- **Simulator not starting**: Try `xcrun simctl erase all` to reset simulators

### Android Issues
- **Build fails**: Run `./gradlew clean` in the android directory
- **Device not detected**: Check `adb devices` and enable USB debugging
- **Gradle issues**: Update `ANDROID_HOME` environment variable

### General Issues
- **Port 8081 in use**: `lsof -i :8081` to find process, then `kill -9 <PID>`
- **Dependencies issue**: Delete `node_modules` and `package-lock.json`, then reinstall

## Performance Tips

- Use React DevTools to profile components
- Enable Hermes engine in Android for faster startup
- Optimize images and use appropriate resolution for devices
- Use React.memo for expensive component re-renders
- Monitor app size with Bundle Analyzer

## Security Considerations

- Keep dependencies updated: `npm audit`
- Never commit sensitive data (API keys, tokens)
- Use environment variables for configuration
- Enable code obfuscation for production builds
- Implement secure authentication and data storage

## Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit a pull request

## Building for Production

### iOS
```bash
cd ios
xcodebuild -workspace roboadvisor.xcworkspace \
  -scheme roboadvisor \
  -configuration Release \
  -derivedDataPath build
```

### Android
```bash
cd android
./gradlew assembleRelease
```

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team or create an issue in the repository.


