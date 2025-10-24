import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const JobDetail = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      const docRef = doc(db, "jobs", jobId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() });
      }
    };

    fetchJob();
  }, [jobId]);

  const handleAcceptJob = async () => {
    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, {
      status: 'in_progress',
      workerId: auth.currentUser.uid,
    });
    navigation.goBack();
  };

  const handleApproveJob = async () => {
    // In a real app, you would have a cloud function to handle this transaction securely
    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, {
      status: 'completed',
    });

    // Simulate payment
    // This is a simplified version and should be handled by a backend in production
    const clientRef = doc(db, "users", auth.currentUser.uid);
    const workerRef = doc(db, "users", job.workerId);

    // This is not a secure way to handle transactions, but it's fine for a hackathon
    // In a real app, you would use Firestore transactions
    const clientSnap = await getDoc(clientRef);
    const workerSnap = await getDoc(workerRef);

    if (clientSnap.exists() && workerSnap.exists()) {
      const clientData = clientSnap.data();
      const workerData = workerSnap.data();

      await updateDoc(clientRef, {
        walletBalance: clientData.walletBalance - job.price,
      });

      await updateDoc(workerRef, {
        walletBalance: workerData.walletBalance + job.price,
      });
    }


    navigation.goBack();
  };

  if (!job) {
    return null; // Or a loading indicator
  }

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>{job.title}</Title>
          <Paragraph>{job.description}</Paragraph>
          <Paragraph>Location: {job.location}</Paragraph>
          <Paragraph>Price: R{job.price}</Paragraph>
          <Paragraph>Status: {job.status}</Paragraph>
        </Card.Content>
        {job.status === 'pending' && (
          <Card.Actions>
            <Button onPress={handleAcceptJob}>Accept Job</Button>
          </Card.Actions>
        )}
        {job.status === 'in_progress' && job.workerId === auth.currentUser.uid && (
          <Card.Actions>
            <Button onPress={() => navigation.navigate('SubmitProof', { jobId: job.id })}>Submit Proof</Button>
          </Card.Actions>
        )}
        {job.status === 'awaiting_approval' && job.clientId === auth.currentUser.uid && (
            <Card.Actions>
                <Button onPress={handleApproveJob}>Approve Job</Button>
            </Card.Actions>
        )}
        {job.status === 'completed' && job.clientId === auth.currentUser.uid && (
            <Card.Actions>
                <Button onPress={() => navigation.navigate('Rating', { jobId: job.id, workerId: job.workerId, clientId: job.clientId })}>Rate Worker</Button>
            </Card.Actions>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default JobDetail;
