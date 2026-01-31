# Chronus AI

A smart daily planner with AI-powered task scheduling.

## Project Structure

- **frontend/**: React + TypeScript + Vite application.
- **backend/**: Spring Boot application (Java 17).

## Setup & Run

### Frontend

1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

### Backend

1. Navigate to `backend` directory.
2. Ensure you have Java 17 and Maven installed.
3. Configure `AI_API_KEY` in `src/main/resources/application.properties` or environment variables.
4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

## Features

- **Mode Switcher**: Toggle between Todo, Study, and Final modes.
- **Chat Feed**: Interact with AI to generate tasks.
- **Draft Slot**: Review and commit AI-suggested tasks.
- **Calendar View**: Drag and drop tasks to reschedule.
- **Real AI Integration**: Connects to OpenAI API (configurable).

## Configuration

Edit `.env` in the root directory or `backend/src/main/resources/application.properties` to set your API keys.
