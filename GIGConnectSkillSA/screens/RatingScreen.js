import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Title, RadioButton, Text } from 'react-native-paper';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

const RatingScreen = ({ route, navigation }) => {
  const { jobId, workerId, clientId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmitRating = async () => {
    // Add rating to ratings collection
    await addDoc(collection(db, "ratings"), {
      jobId,
      workerId,
      clientId,
      rating,
      comment,
      timestamp: new Date(),
    });

    // Update worker's reputation
    const workerRef = doc(db, "users", workerId);
    const workerSnap = await getDoc(workerRef);
    if (workerSnap.exists()) {
      const workerData = workerSnap.data();
      const newReputation = ((workerData.reputation * (workerData.completedJobs || 0)) + rating) / ((workerData.completedJobs || 0) + 1);
      const completedJobs = (workerData.completedJobs || 0) + 1;
      await updateDoc(workerRef, {
          reputation: newReputation,
          completedJobs: completedJobs,
        });
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Title>Rate the Worker</Title>
      <View style={styles.radioContainer}>
        <Text>Rating: </Text>
        {[1, 2, 3, 4, 5].map(r => (
          <View key={r} style={styles.radioButton}>
            <Text>{r}</Text>
            <RadioButton value={r} status={rating === r ? 'checked' : 'unchecked'} onPress={() => setRating(r)} />
          </View>
        ))}
      </View>
      <TextInput
        label="Comment"
        value={comment}
        onChangeText={setComment}
        style={styles.input}
        multiline
      />
      <Button mode="contained" onPress={handleSubmitRating} style={styles.button}>
        Submit Rating
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  }
});

export default RatingScreen;
