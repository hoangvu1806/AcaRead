# AcaRead Frontend

The modern, responsive web interface for AcaRead, built using Next.js 15+ and React 19. It provides an intuitive, distraction-free environment for users to upload documents, configure exams, and view detailed performance analytics.

## Overview

Unlike traditional reading practice tools, AcaRead offers a real-time exam simulation that closely mimics official testing conditions. The frontend orchestrates the complex workflow of document processing, exam configuration, and interactive feedback using a seamless client-side experience.

## Key Features

- **Interactive Exam Creation**: Drag-and-drop PDF upload with intelligent parsing and configuration options.
- **Real-Time Simulation**: Dedicated exam interface with countdown timers, split-view document navigation, and auto-scrolling questions.
- **Comprehensive Question Support**: 
  - Multiple Choice (MCQ)
  - True/False/Not Given
  - Matching Headings (Drag-and-Drop)
  - Diagram Labeling
- **Detailed Analytics Dashboard**: Visualize historical performance, track progress over time, and receive AI-generated explanations for every answer.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile viewing with smooth animations.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS v3.4, Framer Motion
- **State Management**: React Context, SWR (Client-side Data Fetching)
- **PDF Viewing**: React PDF / Custom viewer integration
- **Authentication**: NextAuth.js (Google OAuth)

## Setup and Installation

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hoangvu1806/AcaRead.git
   cd AcaRead/frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Access Application**:
   Open http://localhost:3000 in your browser.

## Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## Project Structure

- `src/app/`: Next.js App Router pages and layouts (e.g., `/create`, `/exam/[id]`).
- `src/components/`: Reusable UI components for navigation, exam interface, and dashboards.
- `src/hooks/`: Custom React hooks for authentication and data fetching.
- `src/lib/`: Utility functions, API helpers, and constants.
- `public/`: Static assets and images.

## License

This project is licensed under the MIT License.
