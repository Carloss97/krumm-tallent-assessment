# Project Overview

This is a web-based cognitive assessment platform built with React and Vite. The application administers a series of 14 scientifically-validated games to evaluate various cognitive abilities, including working memory, planning, cognitive flexibility, and more. After the user completes the games, the platform uses Google's Gemini AI to generate a comprehensive performance report.

## Key Technologies

*   **Frontend**: React, Vite, React Router, Framer Motion, Recharts
*   **AI**: `@google/generative-ai` (Gemini)
*   **Testing**: Vitest, React Testing Library
*   **Backend**: Express.js (for serving the application and handling API requests)
*   **Database**: `better-sqlite3` (likely for local session/telemetry data)

## Project Structure

*   `src/`: Contains the main frontend application code.
*   `src/games/`: Each of the 14 assessment games is a separate React component in this directory.
*   `src/services/aiReportService.js`: This service is responsible for communicating with the Google Generative AI API to generate the assessment report. It includes a fallback to a heuristic-based report if the AI service is unavailable.
*   `src/components/`: Reusable React components used throughout the application.
*   `src/App.jsx`: The main application component that handles routing and the overall layout.
*   `server/`: Contains the Express.js backend code.

# Building and Running

## Prerequisites

*   Node.js and npm

## Installation

1.  Install the dependencies:
    ```bash
    npm install
    ```

2.  Create a `.env` file in the root of the project and add your Google API key:
    ```
    VITE_GOOGLE_API_KEY=your_api_key_here
    ```

## Development

To start the development server, run:

```bash
npm run dev
```

This will start the Vite development server, and you can access the application at `http://localhost:5173`.

## Building for Production

To create a production build of the application, run:

```bash
npm run build
```

The production-ready files will be located in the `dist/` directory.

## Testing

To run the test suite, use the following command:

```bash
npm run test
```

To run the tests in watch mode, use:

```bash
npm run test:watch
```

To generate a test coverage report, run:
```bash
npm run test:coverage
```

# Development Conventions

*   **Linting**: The project uses ESLint for code quality. You can run the linter with `npm run lint`.
*   **Styling**: The project uses a combination of global CSS (`src/index.css`, `src/App.css`) and component-specific styles. It appears to follow a modern, clean aesthetic with "glass" panel effects and gradient text.
*   **Components**: New features should be implemented as reusable components where possible.
*   **State Management**: The application uses React's built-in state management (`useState`, `useContext`) and a custom `TelemetryProvider` for managing game state and telemetry data.
*   **AI Integration**: All interactions with the Gemini API are centralized in `src/services/aiReportService.js`. When adding new AI-powered features, this is the place to integrate them.
