# CareIQ Lite: Intelligent Care, Personalised Health

CareIQ is an AI-powered health consultation assistant designed to revolutionize healthcare delivery. It provides intelligent, personalized health experiences by leveraging AI agents, real-time data, and predictive analytics.

## Vision

To create an AI-powered, real-time health monitoring ecosystem that revolutionizes healthcare delivery through intelligent care agents, continuous health surveillance, and seamless integration of wearable technology data - delivering truly personalized health experiences.

## Project Status

This project is a functional prototype demonstrating the core "CareConsult" flow. Below is a summary of what is currently implemented and what is planned for the future based on the [Product Requirements Document (PRD)](./tasks.md).

### Key Implemented Features
*   **User Authentication**: Separate registration and login flows for Patients and Healthcare Professionals (HCPs).
*   **Role-Based Dashboards**:
    *   **Patient Dashboard**: A central hub for patients to initiate consultations, view their care history, and see approved prescriptions.
    *   **HCP Dashboard**: A portal for doctors to manage their patient queue and professional profile.
*   **AI Symptom Analysis (`CareAssess`)**: Patients can describe their symptoms (via text or voice-to-text) and upload an optional photo. The AI analyzes this input to suggest relevant specialist types.
*   **Intelligent HCP Matching & Booking**: After AI analysis, the system displays a list of registered HCPs. Patients can book an instant consultation.
*   **Real-time Waiting Room (`CareWait`)**: After booking, the patient enters a waiting room. The HCP sees the patient appear in their "Patient Queue" in real-time.
*   **Live Consultation (`CareLive`)**: When the HCP starts the meeting, both users are directed to a live consultation page with functional video and microphone controls. The HCP can end the call, which completes the consultation.
*   **AI-Powered Diagnosis (`CareAdvise`)**: During the call, the HCP can write notes and use an AI assistant to generate a potential diagnosis based on the initial symptoms and live notes. This diagnosis can be saved to the consultation record.
*   **AI-Assisted Prescriptions (`CareDocument`)**: Based on the AI diagnosis, the HCP can generate a suggested prescription. The HCP must review and approve this prescription, emphasizing the principle of human-in-the-loop.
*   **Prescription Viewing**: Patients can view their approved prescriptions on their dashboard.

### Future Roadmap & Planned Features
The current implementation lays the groundwork for the full vision outlined in the PRD. Key areas for future development include:

*   **Full WebRTC Integration**: Implementing a complete peer-to-peer video connection between the patient and HCP.
*   **Connected Device Integration (`CareSync`)**: Integrating with smartwatches and health devices (Apple Health, Google Fit) for real-time health monitoring during and between consultations.
*   **Predictive Health Alerts (`CareAlert`)**: A multi-tier alert system based on real-time data to predict and prevent health risks.
*   **Advanced AI Agents**: Building out the full suite of AI agents described in the PRD, including `CareWatch` for monitoring and `CarePredict` for health trajectory modeling.
*   **Payment Integration**: Adding a real payment flow for consultations (Paystack).
*   **Enhanced Profile Management**: Allowing users to edit their profiles and manage notification preferences.
*   **Full "CareHistory"**: Building out a comprehensive and interactive view of a patient's past consultations and health journey.

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
    MONGO_URI=your_mongodb_connection_string
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
-   **Database**: [MongoDB](https://www.mongodb.com/)
-   **AI/ML**: [Google Genkit](https://firebase.google.com/docs/genkit)
