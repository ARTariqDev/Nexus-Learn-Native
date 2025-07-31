# Nexus-Learn-Native

A comprehensive mobile learning platform built with React Native, designed to provide fre resourcesFor O?A level Students as well as the SAT.

## Features

- **Progress Tracking** - Real-time learning analytics and progress visualization for yearly past papers
- **Offline Mode** - Learn anywhere, anytime with offline content access (using cached files)
- **Free Resources** - Books? Notes Past Papers? All available for free!

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: React Navigation v7
- **Database**: Mongo DB
- **Backend**: Node.js (I have a Next.js web app deployment where I access user data from)

## Prerequisites

Before running this project, make sure you have the following installed:

- Node.js
- npm or yarn
- React Native/Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Java Development Kit (JDK)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nexus-learn-native.git
   cd nexus-learn-native
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration values in the `.env` file.

5. **Start Metro bundler**
   ```bash
   npx expo start
   ```

6. **Run the application**

   For Android:
   ```bash
   npm run android
   # or
   yarn android
   ```

   For iOS:
   ```bash
   npm run ios
   # or
   yarn ios
   ```

## Project Structure

```
nexus-learn-native/
├── components/              # Reusable UI components
├── pages/                   # Application screens and pages
│   ├── Alevel/             # A-Level resources and screens
│   │   └── [Subjects]/     # Subject-specific resources with JSON files
│   │       └── [SubjectPage.tsx]
│   ├── Olevel/             # O-Level resources and screens
│   │   └── [Subjects]/     # Subject-specific resources
│   │       └── [SubjectPage.tsx]
│   ├── IGCSE/              # IGCSE resources and screens
│   │   └── [Subjects]/     # Subject-specific resources
│   │       └── [SubjectPage.tsx]
│   ├── SAT/
│   │   └── Sat.tsx         # SAT resources and preparation
│   ├── Updates/            # App updates and content notifications
│   ├── Guides/             # FAQ and app usage tutorials
│   ├── Contribute.tsx      # User feedback and bug reporting
│   ├── Home.tsx            # Main navigation page
│   ├── LandingPage.tsx     # Initial landing and authentication redirect
│   ├── Login.tsx           # User authentication
│   ├── Signup.tsx          # User registration
│   └── Stats.tsx           # User performance analytics with time series 
└── Scraper.py



## Configuration

## Contributing

---

**Made with ❤️ by ARTariqDev Team**