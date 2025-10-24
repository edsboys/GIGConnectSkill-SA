# GIGConnectSkill SA - FNB App of the Year Hackathon

## 1. Project Overview

GIGConnectSkill SA is a mobile-first digital marketplace designed to connect South Africa’s informal workers with potential clients. The platform aims to formalize the informal sector by providing a trusted environment for job postings, worker verification, and secure digital payments.

This prototype was developed for the FNB App of the Year Hackathon.

## 2. Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication and Firestore)
- **UI**: React Native Paper

## 3. Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd GIGConnectSkillSA
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable Email/Password authentication in the "Authentication" section.
    - Create a Firestore database.
    - Copy your Firebase project's configuration object into `firebaseConfig.js`.

4.  **Seed the database:**
    - Run the following command to populate the database with initial data:
      ```bash
      node seed.js
      ```

5.  **Run the app:**
    - Start the Expo development server:
      ```bash
      npm start
      ```
    - Use the Expo Go app on your mobile device to scan the QR code and run the app.

## 4. Demo Script

### Scene 1: Client Registration and Job Posting

1.  Launch the app.
2.  From the Login screen, tap "Don't have an account? Sign up".
3.  Enter the details for a new client (e.g., name, email, password) and select the "Client" role.
4.  Tap "Sign Up". You will be logged in and taken to the Job Feed.
5.  Tap the "Post a New Job" button at the top of the Job Feed.
6.  Fill in the job details (e.g., "Garden Cleanup", "Tidy up the front yard", "123 Green Street", "150").
7.  Tap "Post Job". The new job will be added to the Job Feed.

### Scene 2: Worker Accepts and Completes Job

1.  Log out and register a new "Worker" account.
2.  From the Job Feed, find the "Garden Cleanup" job and tap "View Details".
3.  Tap "Accept Job". The job's status will change to "in_progress".
4.  Navigate back to the job details. A "Submit Proof" button will now be visible.
5.  Tap "Submit Proof". Use the device's camera to take a photo and capture the current location.
6.  Tap "Submit for Approval".

### Scene 3: Client Approves and Pays

1.  Log out and log back in with the client's account.
2.  Navigate to the "Garden Cleanup" job details. The status will be "awaiting_approval".
3.  Tap "Approve Job".
    - The job's status will change to "completed".
    - The payment will be transferred from the client's wallet to the worker's wallet.

### Scene 4: Worker Receives Payment and Rating

1.  Log in as the worker.
2.  Go to the "Wallet" tab. The new balance will be reflected.
3.  Log in as the client.
4.  Go to the "Garden Cleanup" job details. Tap "Rate Worker".
5.  Select a star rating, add a comment, and tap "Submit Rating".
6.  Navigate to the "Leaderboard" tab. The worker's completed jobs and reputation will be updated.
