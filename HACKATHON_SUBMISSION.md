### Project Name
**CareIQ Lite**

### Live Application Link
[https://care-iq.vercel.app/](https://care-iq.vercel.app/)

### GitHub Repository Link
[https://github.com/nkosi-ncube/CareIQ](https://github.com/nkosi-ncube/CareIQ)

---

### Project Summary

CareIQ Lite is an innovative, full-stack web application designed to revolutionize the initial stages of healthcare consultation. Built with Next.js, it serves as an intelligent bridge between patients and healthcare professionals (HCPs). The platform leverages the power of generative AI to analyze patient-reported symptoms, provide instant follow-up questions, and match patients with the most suitable specialists. This not only streamlines the booking process but also equips doctors with AI-powered tools during live consultations to assist with diagnosis and prescription, ensuring a higher quality of care. Our vision is to create a more efficient, accessible, and intelligent healthcare experience for everyone.

### Core Features & Hackathon Deliverables

This project was built from the ground up to meet and exceed the hackathon's requirements, demonstrating a complete, well-tested, and thoughtfully architected full-stack application.

#### 1. Stack & Architecture
-   **Stack**: The application is built on a modern, full-stack **Next.js** framework with **React** for the UI, **MongoDB** as the NoSQL database, and **Google's Genkit** for orchestrating AI flows.
-   **Architecture**: We've followed a clear separation of concerns. The Next.js App Router handles frontend rendering (both server and client components) and API-like functionality through Server Actions, providing a seamless full-stack experience in a single codebase. The database models and business logic are clearly separated in the `src/models` and `src/lib` directories.

#### 2. Authentication & Authorization
-   **Implementation**: A secure, JWT-based authentication system has been implemented. Users can register as either a "Patient" or a "Healthcare Professional," with distinct roles and dashboard experiences.
-   **Route Protection**: All sensitive routes and features are protected. Core functionalities like booking a consultation, viewing care history, or accessing the HCP queue are only available to authenticated users with the correct role.

#### 3. Database Connection & Health-Check
-   **Database**: The application is connected to a **MongoDB** database, handling all user data, consultations, alerts, and diagnostic records.
-   **Health-Check Endpoint**: A dedicated endpoint at `/api/health` has been implemented to verify the database connection status, fulfilling the health-check requirement.

#### 4. Required Common Features

All three required common features have been implemented and integrated into the user dashboards.

-   **User Profile & Preferences**:
    -   Both Patient and HCP users can navigate to a "Profile" tab within their respective dashboards.
    -   Users can view and **edit their name and email**.
    -   Patients have additional preferences they can edit: **Enable/Disable Notifications** (toggle switch) and set a **Preferred Language** (dropdown).
    -   All changes are persisted to the MongoDB database via a dedicated `updateUserProfile` server action.

-   **Alerts / Notifications Dashboard**:
    -   A new "Alerts" tab is available on the Patient Dashboard.
    -   This tab fetches and displays a list of alert records from the `alerts` collection in the database.
    -   Each alert correctly displays a **timestamp, title, and status** (e.g., 'read', 'unread').
    -   A function to seed the database with sample alerts for demonstration purposes is included.

-   **Entity CRUD List Page (DiagnosticTest)**:
    -   A full-stack CRUD interface for a `DiagnosticTest` entity is implemented under the "Tests" tab on the Patient Dashboard.
    -   **Create**: Users can add a new test record via a dialog form.
    -   **Read**: All existing tests for the logged-in user are listed.
    -   **Update**: Users can edit existing test records.
    -   **Delete**: Users can delete test records with a confirmation prompt.
    -   This is all handled through a suite of robust server actions (`createDiagnosticTest`, `getDiagnosticTests`, `updateDiagnosticTest`, `deleteDiagnosticTest`).

#### 5. Testing Requirements
-   **Frameworks**: The project uses **Jest** and **React Testing Library** for automated testing.
-   **Coverage**:
    -   **Authentication**: The UI for the `AuthButton` component is tested to ensure it renders correctly for both logged-in and logged-out states.
    -   **Database CRUD**: A dedicated integration test file (`src/components/__tests__/Actions.test.tsx`) covers the server actions for the `DiagnosticTest` CRUD functionality, ensuring the database logic is sound.
-   **Running Tests**: The test suite can be executed by running `npm run test` from the project root, as documented in the `README.md`.
-   **Test Results**: A `test-results.txt` file containing the output from the test runner has been committed to the repository.