## ADDED Requirements

### Requirement: Multi-stage Dockerfile for production
The system SHALL use a multi-stage Dockerfile to create optimized production images.

#### Scenario: Build production image
- **WHEN** Docker build is executed
- **THEN** system creates a multi-stage build with builder and production stages
- **AND** final image contains only production dependencies
- **AND** final image excludes development tools and source code

#### Scenario: Builder stage
- **WHEN** builder stage runs
- **THEN** system installs all dependencies including devDependencies
- **AND** system compiles TypeScript to JavaScript
- **AND** system copies compiled output to production stage

#### Scenario: Production stage
- **WHEN** production stage runs
- **THEN** system installs only production dependencies
- **AND** system uses Node.js production mode (NODE_ENV=production)
- **AND** system runs as non-root user for security

### Requirement: Docker Compose for development
The system SHALL provide docker-compose.yml for local development with PostgreSQL.

#### Scenario: Start development environment
- **WHEN** docker-compose up is executed
- **THEN** system starts the NestJS application container
- **AND** system starts a PostgreSQL database container
- **AND** containers are networked together

#### Scenario: Environment variables in Docker Compose
- **WHEN** docker-compose starts containers
- **THEN** system reads database configuration from docker-compose environment
- **AND** system passes these as environment variables to the application

### Requirement: Health check endpoint
The application SHALL provide a health check endpoint for container orchestration.

#### Scenario: Health endpoint available
- **WHEN** container orchestrator requests /health
- **THEN** system returns HTTP 200 with health status
- **AND** response includes database connection status

#### Scenario: Health check in Dockerfile
- **WHEN** Docker container is configured
- **THEN** system configures HEALTHCHECK instruction
- **AND** it uses the /health endpoint

### Requirement: .dockerignore configured
The system SHALL have a .dockerignore file to exclude unnecessary files from Docker context.

#### Scenario: Docker ignore file
- **WHEN** Docker build is executed
- **THEN** system excludes node_modules, .git, dist, and other development files
- **AND** build context is smaller and faster

### Requirement: Environment variables example
The system SHALL provide .env.example with all required configuration.

#### Scenario: Environment template
- **WHEN** developer clones the repository
- **THEN** they can copy .env.example to .env
- **AND** all required variables are documented with comments
