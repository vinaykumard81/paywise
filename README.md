# EZYBIZ - Pay Overview

## Description

PayWise is a comprehensive dashboard application designed to help businesses manage client payments, track financial health, and predict transaction outcomes using GenAI. It offers features like insightful dashboards, client management, streamlined payment requests, and real-time transaction predictions.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Environment Variables

Create a `.env` file in the root of your project and add the following environment variables. Replace the placeholder values with your actual credentials.

```env
# Twilio Configuration (for SMS notifications)
# Obtain these from your Twilio console: https://www.twilio.com/console
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number_with_country_code # e.g., +1234567890

# Elastic Email Configuration (for Email notifications)
# Obtain these from your Elastic Email dashboard: https://elasticemail.com/
# Ensure your ELASTIC_EMAIL_FROM_EMAIL is a verified sender in Elastic Email.
ELASTIC_EMAIL_API_KEY=your_elastic_email_api_key
ELASTIC_EMAIL_FROM_EMAIL=your_verified_sender_email_address # e.g., noreply@yourdomain.com

# Google AI / Genkit Configuration
# Obtain this from Google AI Studio or Google Cloud Console for Gemini API access.
GOOGLE_API_KEY=your_google_api_key_for_gemini
```

**Note:**
- For SMS functionality with Twilio, ensure your `TWILIO_PHONE_NUMBER` is E.164 formatted (e.g., `+1234567890`).
- For Email functionality with Elastic Email, ensure `ELASTIC_EMAIL_FROM_EMAIL` is registered and verified as a sender in your Elastic Email account.
- If you do not provide credentials for Twilio or Elastic Email, the respective SMS/Email functionalities will be mocked (logged to the console instead of actually sending).

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd ezybiz-pay-overview
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

1.  **Run the Genkit development server (for AI flows):**
    Open a terminal and run:
    ```bash
    npm run genkit:dev
    # or use watch mode for automatic restarts on AI flow changes
    # npm run genkit:watch
    ```
    This will typically start the Genkit server on `http://localhost:4000`.

2.  **Run the Next.js application:**
    Open another terminal and run:
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, usually on `http://localhost:9002` (as per `package.json`).

Open [http://localhost:9002](http://localhost:9002) with your browser to see the application.

## Project Structure

-   `src/app/`: Contains the Next.js App Router pages and layouts.
    -   `(app)/`: Authenticated routes (dashboard, clients, payments).
    -   `(auth)/`: Authentication routes (login, signup).
    -   `layout.tsx`: Root layout for the application.
    -   `page.tsx`: Landing page.
-   `src/ai/`: Contains Genkit AI flows and configuration.
    -   `flows/`: Specific AI flows (e.g., payment prediction, summary).
    -   `genkit.ts`: Genkit initialization.
    -   `dev.ts`: Genkit development server entry point.
-   `src/components/`: Reusable UI components.
    -   `ui/`: ShadCN UI components.
-   `src/contexts/`: React Context providers (e.g., `AppContext.tsx`).
-   `src/hooks/`: Custom React hooks.
-   `src/lib/`: Utility functions.
-   `src/services/`: External service integrations (e.g., payment gateway, SMS, email).
-   `src/types/`: TypeScript type definitions.
-   `public/`: Static assets.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `components.json`: ShadCN UI configuration.

## Key Features

-   **Dashboard Overview:** Visualizes total income, expenses, pending dues, and average client prediction scores. Includes charts for monthly income/expenses and client risk distribution.
-   **Client Management:** Add, view, edit, and delete client information. Each client detail page shows contact info, AI-powered prediction scores, risk factors, payment summary, transaction history, and payment request history.
-   **Payment Management:** Request payments from clients by sending payment links via SMS and/or Email. View payment history with filtering by status. Simulate payment completion (paid/failed).
-   **AI-Powered Insights:**
    -   **Payment Prediction:** Calculates a risk score (0-100) for clients defaulting on payments.
    -   **Payment Summary:** Generates a textual summary of a client's payment history, highlighting trends and potential issues.
-   **Authentication:** Basic mock login and signup functionality.
-   **Responsive Design:** Adapts to different screen sizes.
-   **Dark/Light Theme:** Toggable theme preference stored in local storage.

## Technologies Used

-   Next.js (App Router)
-   React
-   TypeScript
-   Tailwind CSS
-   ShadCN UI (for components)
-   Genkit (for AI flows with Google Gemini)
-   Recharts (for charts)
-   Lucide React (for icons)
-   Twilio (for SMS - mocked if not configured)
-   Elastic Email (for Email - mocked if not configured)

## Available Scripts

-   `npm run dev`: Starts the Next.js development server (usually on port 9002).
-   `npm run genkit:dev`: Starts the Genkit development server.
-   `npm run genkit:watch`: Starts the Genkit development server in watch mode.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase.
-   `npm run typecheck`: Runs TypeScript type checking.

## Mocking External Services

-   **Payment Gateway (`src/services/payment-gateway.ts`):** Currently returns a mock payment link (`https://example.com/payment-link`). You would replace this with actual API calls to your chosen payment gateway.
-   **SMS Service (`src/services/sms.ts`):** Uses Twilio. If `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are not set in `.env`, SMS sending is mocked (logged to console).
-   **Email Service (`src/services/email.ts`):** Uses Elastic Email. If `ELASTIC_EMAIL_API_KEY` and `ELASTIC_EMAIL_FROM_EMAIL` are not set in `.env`, email sending is mocked (logged to console).

Remember to replace placeholders in the `.env` file with your actual service credentials to enable live functionality.
