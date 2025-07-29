### Project Name
**CareIQ Lite**

### Video Demo Link
*Link to your video demo will go here.*

### Live Application Link
[https://care-iq.vercel.app/](https://care-iq.vercel.app/)

### GitHub Repository Link
[https://github.com/nkosi-ncube/CareIQ](https://github.com/nkosi-ncube/CareIQ)

---

### Project Summary

CareIQ Lite is an innovative, full-stack web application designed to revolutionize the initial stages of healthcare consultation. Built with Next.js, it serves as an intelligent bridge between patients and healthcare professionals (HCPs). The platform leverages the power of generative AI to analyze patient-reported symptoms (`CareAssess`), provide instant follow-up questions, and match patients with the most suitable specialists. This not only streamlines the booking process but also equips doctors with AI-powered tools during live consultations to assist with diagnosis (`CareAdvise`) and prescription (`CareDocument`), ensuring a higher quality of care. Our vision is to create a more efficient, accessible, and intelligent healthcare experience for everyone.

### Key Implemented Features

-   **AI-Powered Symptom Analysis (`CareAssess`)**: Patients can describe their symptoms via text or voice and upload a photo. The AI analyzes this input to suggest relevant specialist types, assess urgency, and ask intelligent follow-up questions.
-   **Intelligent HCP Matching & Booking**: Based on the AI analysis, the system presents a list of suitable and available HCPs, allowing the patient to book an instant consultation.
-   **Real-time Waiting Room (`CareWait`)**: A dynamic waiting room experience that keeps the patient informed and automatically updates when the HCP starts the consultation.
-   **Live Consultation Experience (`CareLive`)**: A functional live video consultation interface where the HCP can take notes and interact with AI tools.
-   **AI-Assisted Diagnosis (`CareAdvise`)**: During the consultation, the HCP can use an AI assistant to generate a potential diagnosis based on the patient's symptoms and the HCP's live notes. The HCP maintains full control, selecting the final diagnosis from a list of AI-generated possibilities.
-   **AI-Assisted Prescriptions (`CareDocument`)**: Based on the doctor's confirmed diagnosis, the AI can suggest a prescription, which the HCP must review, edit, and approve—enforcing a critical human-in-the-loop safety measure.
-   **Multi-Language Support**: Consultation summaries and key information can be translated into several South African languages using the Lelapa AI API.

### Future Roadmap

The current application lays the foundation for a much broader vision. Future development will focus on:
-   **Connected Device Integration (`CareSync`)**: Integrating with smartwatches (Apple Watch, Fitbit, etc.) for real-time vital sign monitoring during consultations.
-   **Predictive Health Alerts (`CareAlert`)**: Implementing a multi-tier alert system that uses AI to analyze trends and predict health risks before they become critical.
-   **Full WebRTC Video**: Building out a complete, peer-to-peer WebRTC connection for the live video consultations.

---

### Hackathon-Specific Deliverables

The project meets and exceeds all the hackathon's required deliverables.

#### 1. Stack & Architecture
-   **Stack**: The application is built on a modern, full-stack **Next.js** framework with **React** for the UI, **MongoDB** as the NoSQL database, and **Google's Genkit** for orchestrating AI flows.
-   **Architecture**: We've followed a clear separation of concerns. The Next.js App Router handles frontend rendering (both server and client components) and API-like functionality through Server Actions, providing a seamless full-stack experience in a single codebase.

#### 2. Authentication & Authorization
-   **Implementation**: A secure, JWT-based authentication system has been implemented. Users can register as either a "Patient" or a "Healthcare Professional," with distinct roles.
-   **Route Protection**: All core feature routes are protected and require authentication.

#### 3. Database Connection & Health-Check
-   **Database**: The application is connected to a **MongoDB** database.
-   **Health-Check Endpoint**: A dedicated endpoint at `/api/health` verifies the database connection status.

#### 4. Required Common Features

-   **User Profile & Preferences**:
    -   Both Patient and HCP users can navigate to a "Profile" tab to **view and edit their name and email**.
    -   Patients have additional preferences: **Enable/Disable Notifications** and set a **Preferred Language**.
    -   Changes are persisted to the database via the `updateUserProfile` server action.

-   **Alerts / Notifications Dashboard**:
    -   An "Alerts" tab on the Patient Dashboard displays a list of alert records from the database.
    -   Each alert correctly displays a **timestamp, title, and status**.

-   **Entity CRUD List Page (DiagnosticTest)**:
    -   A full-stack CRUD interface for a `DiagnosticTest` entity is implemented under the "Tests" tab on the Patient Dashboard, allowing users to **Create, Read, Update, and Delete** test records.

#### 5. Testing Requirements
-   **Frameworks**: The project uses **Jest** and **React Testing Library**.
-   **Coverage**:
    -   **Authentication**: The UI for the `AuthButton` component is tested.
    -   **Database CRUD**: An integration test file (`src/components/__tests__/Actions.test.tsx`) covers the server actions for the `DiagnosticTest` CRUD functionality.
-   **Running Tests**: The test suite can be executed by running `npm run test`, as documented in the `README.md`.
-   **Test Results**: A `test-results.txt` file containing the output from the test runner has been committed to the repository.