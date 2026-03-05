# Task Management

A web-based task management application with support for recurring tasks, categories, dependencies, and statistics. Built with TypeScript, Vite, and Tailwind CSS.

## Features

- **Task Management** - Create, read, update, and delete tasks with priorities, statuses, and due dates
- **Categories** - Organize tasks into multiple categories (many-to-many relationship)
- **Task Dependencies** - Define dependencies between tasks with automatic blocking when prerequisites aren't met
- **Recurring Tasks** - Set up tasks that repeat daily, weekly, monthly, or with custom recurrence patterns
- **Statistics** - View task completion metrics and productivity insights

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework
- **LocalStorage** - Browser-based data persistence

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Testing

Run all tests:

```bash
npm run test
```

Run tests once (without watch mode):

```bash
npm run test:run
```

Run tests with coverage report:

```bash
npm run test:coverage
```

## Project Structure

```
src/
├── bll/                    # Business Logic Layer
│   ├── interfaces/         # Service interfaces and DTOs
│   └── services/           # Service implementations
├── data/                   # Data Access Layer
│   ├── adapters/           # Storage adapters (LocalStorage)
│   ├── query/              # Query builder for filtering
│   ├── repositories/       # Repository implementations
│   └── unit-of-work/       # Unit of Work pattern
├── domain/                 # Domain models and business rules
├── enums/                  # TypeScript enumerations
├── interfaces/             # Core interfaces and types
├── ui/                     # User Interface
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── scripts/            # Client-side routing
│   ├── services/           # UI-bridge services
│   └── styles/             # CSS stylesheets
└── utils/                   # Utility functions
```

## Architecture

The application follows a layered architecture:

1. **UI Layer** - Handles user interaction and display
2. **BLL Layer** - Contains business logic and orchestrates operations
3. **DAL Layer** - Manages data access and persistence
4. **Domain Layer** - Defines core business entities and rules

Data is persisted in the browser's LocalStorage using the Repository pattern with Unit of Work for transactional operations.
