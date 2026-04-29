# Project Veracity - Frontend

A comprehensive frontend prototype for the Project Veracity software defect prediction system.

## Features

- **Authentication**: Login, registration, and OAuth integration (GitHub, Google, Microsoft) - Mock implementation
- **Dashboard**: Main dashboard with analytics and metrics
- **Project Management**: Create and manage code analysis projects
- **Code Analysis**: Analyze Python code for defect prediction with SHAP visualizations
- **Chatbot**: Rule-based conversational interface for mitigation advice
- **Reports**: Generate reports in JSON, XML, and PDF formats (Pro feature)
- **Admin Dashboard**: Administrative interface for DBA and Project Managers
- **RBAC**: Role-based access control with three roles (DBA, Project Manager, Standard User)

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Icons** - Icon library
- **Zustand** - State management (for auth context)

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

- **Admin**: admin@veracity.com / password
- **Project Manager**: pm@veracity.com / password
- **Standard User**: user@veracity.com / password

## Project Structure

```
frontend/
├── app/
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard pages
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/         # Reusable components
├── contexts/          # React contexts
└── public/            # Static assets
```

## Notes

This is a **frontend prototype** with mock data. Backend integration and ML model will be added later.
