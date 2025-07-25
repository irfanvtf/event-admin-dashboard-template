# Event Admin Dashboard

A modern admin dashboard application built with React, TypeScript, and Firebase, designed for event management.

## Project Overview

This admin dashboard provides a user interface for managing events. It features user authentication via Firebase, a responsive layout with collapsible sidebar, and a clean, modern UI built with Tailwind CSS.

## Technology Stack

- **Frontend**: React 18, TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Build Tool**: Vite

## Project Structure

```
event-admin-dashboard-template/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API and service integrations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── .eslintrc.js            # ESLint configuration
├── package.json            # Project dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/event-admin-dashboard.git
   cd event-admin-dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:

   - Create a `.env` file in the root of the project and add the following environment variables:

   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   - For local development, no additional configuration is needed

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Authentication

The application uses Firebase Authentication for user management. The authentication flow is handled by the `AuthContext` provider, which manages user state and provides login/logout functionality.

Login credentials should be valid Firebase Authentication accounts (email/password).

## Development Guidelines

### Adding New Pages

1. Create a new page component in the `src/pages` directory
2. Add the route in `App.tsx` within the appropriate route structure
3. Update the sidebar navigation in `src/components/layout/Sidebar.tsx` if needed

### Styling

This project uses Tailwind CSS for styling. The configuration can be found in `tailwind.config.js`.

### State Management

- React Context API is used for global state management
- Firebase Firestore is used for data persistence

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

The application can be deployed to any static hosting service that supports single-page applications:

1. Build the application
2. Deploy the contents of the `dist/` directory
