# CareIQ Lite: Intelligent Care, Personalised Health

CareIQ is an AI-powered health consultation assistant designed to revolutionize healthcare delivery. It provides intelligent, personalized health experiences by leveraging AI agents, real-time data, and predictive analytics.

## Vision

To create an AI-powered, real-time health monitoring ecosystem that revolutionizes healthcare delivery through intelligent care agents, continuous health surveillance, and seamless integration of wearable technology data - delivering truly personalized health experiences.

## Core Features (Current & Planned)

-   **AI Symptom Analysis**: Describe your symptoms in natural language and get a list of suggested specialiststo consult.
-   **Dynamic Follow-up Questions**: The AI generates relevant follow-up questions to gather more information about your condition.
-   **Care History Summary**: Get an AI-powered summary of your past consultations to track your health journey.
-   **AI-Powered Online Consultation System ("CareConsult")**: A priority feature that will include intelligent booking, pre-consultation preparation, and a rich live consultation experience.
-   **Connected Device Integration ("CareSync")**: Planned integration with smartwatches and other health devices for real-time monitoring.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```sh
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```sh
    cd <project-directory>
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```
4. Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Application

This project uses Genkit for its AI capabilities, which runs as a separate process alongside the Next.js development server.

1.  **Start the Genkit server**:
    Open a terminal and run the following command to start the Genkit development server.
    ```sh
    npm run genkit:dev
    ```
    This will start the AI flows and make them available to the application.

2.  **Start the Next.js development server**:
    In a second terminal, run the following command to start the Next.js frontend.
    ```sh
    npm run dev
    ```

3.  Open your browser and navigate to `http://localhost:9002` to see the application in action.

## Technology Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **AI/ML**: [Google Genkit](https://firebase.google.com/docs/genkit)
