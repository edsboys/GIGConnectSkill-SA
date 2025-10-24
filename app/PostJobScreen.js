import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const PostJobScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  const handlePostJob = async () => {
    await addDoc(collection(db, "jobs"), {
      title,
      description,
      location,
      price: parseFloat(price),
      status: 'pending',
      clientId: auth.currentUser.uid,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Title>Post a New Job</Title>
      <TextInput
        label="Job Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Job Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />
      <TextInput
        label="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />
      <TextInput
        label="Price"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button mode="contained" onPress={handlePostJob} style={styles.button}>
        Post Job
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
});

export default PostJobScreen;
