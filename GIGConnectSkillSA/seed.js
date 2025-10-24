const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, addDoc } = require("firebase/firestore");

// IMPORTANT: Replace with your actual Firebase configuration
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
    // Seed Users (using email as document ID for simplicity in seeding)
    const users = [
      { uid: 'worker1@test.com', email: 'worker1@test.com', name: 'John Doe', role: 'worker', skill: 'Plumber', reputation: 4.5, completedJobs: 10, walletBalance: 150.00 },
      { uid: 'worker2@test.com', email: 'worker2@test.com', name: 'Jane Smith', role: 'worker', skill: 'Gardener', reputation: 4.8, completedJobs: 15, walletBalance: 250.50 },
      { uid: 'worker3@test.com', email: 'worker3@test.com', name: 'Peter Jones', role: 'worker', skill: 'Domestic Helper', reputation: 4.2, completedJobs: 5, walletBalance: 100.00 },
      { uid: 'client1@test.com', email: 'client1@test.com', name: 'Alice Williams', role: 'client', walletBalance: 500.00 },
      { uid: 'client2@test.com', email: 'client2@test.com', name: 'Bob Brown', role: 'client', walletBalance: 750.00 },
    ];

    for (const user of users) {
      await setDoc(doc(db, "users", user.uid), user);
    }
    console.log('Users seeded successfully');

    // Seed Jobs
    const jobs = [
      { title: 'Fix leaky faucet', description: 'My kitchen faucet is dripping constantly.', location: '123 Main St, Johannesburg', price: 150.00, status: 'pending', clientId: 'client1@test.com' },
      { title: 'Garden cleanup', description: 'Need someone to tidy up my garden.', location: '456 Oak Ave, Pretoria', price: 200.00, status: 'pending', clientId: 'client1@test.com' },
      { title: 'House cleaning', description: 'Deep clean of a 2-bedroom apartment.', location: '789 Pine Rd, Cape Town', price: 250.00, status: 'completed', clientId: 'client2@test.com', workerId: 'worker3@test.com' },
      { title: 'Unclog drain', description: 'My shower drain is clogged.', location: '101 Maple Dr, Durban', price: 100.00, status: 'in_progress', clientId: 'client2@test.com', workerId: 'worker1@test.com' },
      { title: 'Mow lawn', description: 'Need my front lawn mowed.', location: '212 Cherry Ln, Sandton', price: 120.00, status: 'pending', clientId: 'client1@test.com' },
    ];

    for (const job of jobs) {
      await addDoc(collection(db, "jobs"), job); // addDoc is fine here since we don't need to know the job ID beforehand
    }
    console.log('Jobs seeded successfully');

    // Seed Ratings - In a real app, you would link this to a specific job ID
    const ratings = [
        { workerId: 'worker3@test.com', clientId: 'client2@test.com', rating: 5, comment: 'Excellent work!' },
    ];

    for (const rating of ratings) {
        await addDoc(collection(db, "ratings"), rating);
    }
    console.log('Ratings seeded successfully');

    // Seed Transactions - In a real app, you would link this to a specific job ID
    const transactions = [
        { amount: 250.00, from: 'client2@test.com', to: 'worker3@test.com', status: 'completed' },
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
