const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, addDoc } = require("firebase/firestore");

// IMPORTANT: Replace with your actual Firebase configuration before running the script
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedDatabase = async () => {
  try {
    // Seed Users with consistent, fake UIDs
    const users = [
      { uid: 'seed_worker_1', email: 'worker1@test.com', name: 'John Doe', role: 'worker', skill: 'Plumber', reputation: 4.5, completedJobs: 10, walletBalance: 150.00 },
      { uid: 'seed_worker_2', email: 'worker2@test.com', name: 'Jane Smith', role: 'worker', skill: 'Gardener', reputation: 4.8, completedJobs: 15, walletBalance: 250.50 },
      { uid: 'seed_worker_3', email: 'worker3@test.com', name: 'Peter Jones', role: 'worker', skill: 'Domestic Helper', reputation: 4.2, completedJobs: 5, walletBalance: 100.00 },
      { uid: 'seed_client_1', email: 'client1@test.com', name: 'Alice Williams', role: 'client', walletBalance: 500.00 },
      { uid: 'seed_client_2', email: 'client2@test.com', name: 'Bob Brown', role: 'client', walletBalance: 750.00 },
    ];

    for (const user of users) {
      await setDoc(doc(db, "users", user.uid), user);
    }
    console.log('Users seeded successfully');

    // Seed Jobs, referencing the consistent fake UIDs
    const jobs = [
      { title: 'Fix leaky faucet', description: 'My kitchen faucet is dripping constantly.', location: '123 Main St, Johannesburg', price: 150.00, status: 'pending', clientId: 'seed_client_1' },
      { title: 'Garden cleanup', description: 'Need someone to tidy up my garden.', location: '456 Oak Ave, Pretoria', price: 200.00, status: 'pending', clientId: 'seed_client_1' },
      { title: 'House cleaning', description: 'Deep clean of a 2-bedroom apartment.', location: '789 Pine Rd, Cape Town', price: 250.00, status: 'completed', clientId: 'seed_client_2', workerId: 'seed_worker_3' },
      { title: 'Unclog drain', description: 'My shower drain is clogged.', location: '101 Maple Dr, Durban', price: 100.00, status: 'in_progress', clientId: 'seed_client_2', workerId: 'seed_worker_1' },
      { title: 'Mow lawn', description: 'Need my front lawn mowed.', location: '212 Cherry Ln, Sandton', price: 120.00, status: 'pending', clientId: 'seed_client_1' },
    ];

    for (const job of jobs) {
      await addDoc(collection(db, "jobs"), job);
    }
    console.log('Jobs seeded successfully');

    // Seed Ratings
    const ratings = [
        { workerId: 'seed_worker_3', clientId: 'seed_client_2', rating: 5, comment: 'Excellent work!' },
    ];

    for (const rating of ratings) {
        await addDoc(collection(db, "ratings"), rating);
    }
    console.log('Ratings seeded successfully');

    // Seed Transactions
    const transactions = [
        { amount: 250.00, from: 'seed_client_2', to: 'seed_worker_3', status: 'completed' },
    ];

    for (const transaction of transactions) {
        await addDoc(collection(db, "transactions"), transaction);
    }
    console.log('Transactions seeded successfully');


  } catch (error) {
    console.error("Error seeding database: ", error);
  }
};

seedDatabase();
