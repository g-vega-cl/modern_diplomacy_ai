
# Migration Plan: Diplomacy Web Application

This document outlines the phased approach to migrate the existing React application at `diplomacy-ai/diplomacy/web` to a new Create React App project located at `modern_diplomacy_ai/diplomacy/web`. The new application will leverage modern web technologies including Create React App, Tanstack libraries (e.g., React Query, React Router, React Table), and shadcn/ui for component styling.

## 1. Project Initialization

**Objective:** Set up the foundational new project structure.

**Steps:**
1.  Initialize a new Create React App project within the `./modern_diplomacy_ai/diplomacy/web` directory. We will use TypeScript for this project.
    ```bash
    npx create-react-app modern_diplomacy_ai/diplomacy/web --template typescript
    ```
2.  Navigate into the newly created project directory.
    ```bash
    cd modern_diplomacy_ai/diplomacy/web
    ```

## 2. Integrate Core Libraries (Tanstack & shadcn/ui)

**Objective:** Install and configure Tanstack libraries and shadcn/ui.

**Steps:**
1.  **Install Tanstack Libraries:** Install the specific Tanstack libraries that will be used. Based on common React app needs, we will start with:
    *   `@tanstack/react-query`: For robust data fetching, caching, and state management.
    *   `@tanstack/react-router`: For type-safe routing.
    *   `@tanstack/react-table`: If tabular data display is a significant part of the application.
    ```bash
    npm install @tanstack/react-query @tanstack/react-router @tanstack/react-table
    ```
2.  **Integrate shadcn/ui:** Follow the official shadcn/ui installation guide. This typically involves:
    *   Installing Tailwind CSS and its peer dependencies.
    *   Initializing shadcn/ui components (`npx shadcn-ui@latest init`). This command will guide through configuring `tailwind.config.js` and `components.json`.
    *   Adding a few initial components (e.g., Button, Dialog) to verify the setup and ensure proper styling integration.

## 3. Code Migration - Phased Approach

**Objective:** Systematically migrate functionality from the old application to the new framework.

**Steps:**
1.  **Analyze Existing Components:** Review the existing `diplomacy-ai/diplomacy/web` codebase to understand its current architecture, components (e.g., `Button`, `Table`, `Forms`, `Navigation`, map components like `SvgAncMed`, `SvgModern`, `SvgPure`, `SvgStandard`), state management, and interactions.
2.  **Identify Core Functionality Modules:** Group related functionalities into modules (e.g., authentication, game lobby, game board, chat, user profiles).
3.  **Prioritize Migration:** Start with foundational UI elements and shared utilities, then move to core application logic.
4.  **Component-by-Component Rewrite/Adaptation:** For each module:
    *   **UI Components:** Rewrite existing Bootstrap-dependent components using shadcn/ui components and Tailwind CSS for styling. For custom components, implement them using React best practices (functional components, hooks).
    *   **State Management:** Adapt local component state to React Hooks (`useState`, `useReducer`). Migrate global state to Tanstack Query for server state and React Context/Zustand/Jotai for client state.
    *   **Data Fetching:** Replace existing AJAX calls or data fetching logic with Tanstack Query's `useQuery` and `useMutation` hooks.
    *   **Routing:** Migrate existing routing logic to `tanstack/react-router` for type-safe and efficient navigation.
5.  **Backend Communication:** Ensure the new frontend correctly communicates with the existing backend API, adapting any changes in request/response formats if necessary.
6.  **Map Components:** The SVG map components (`SvgAncMed`, `SvgModern`, `SvgPure`, `SvgStandard`) are critical. These will likely require careful re-evaluation to ensure they integrate seamlessly with React's rendering and event handling, and potentially update their styling to align with Tailwind/shadcn/ui.

## 4. Testing

**Objective:** Ensure the new application functions correctly and meets all requirements.

**Steps:**
1.  **Unit Tests:** Implement unit tests for all new and rewritten components and utility functions.
2.  **Integration Tests:** Develop integration tests to verify the interaction between different parts of the application and with the backend.
3.  **End-to-End Tests:** Set up end-to-end tests to simulate user flows and ensure the complete application works as expected.

## 5. Deployment

**Objective:** Prepare the new application for deployment.

**Steps:**
1.  **Build Configuration:** Configure the Create React App build process for production.
2.  **Environment Variables:** Manage environment variables for different deployment environments.
3.  **Deployment Pipeline:** Integrate the new application into the existing or a new deployment pipeline.
