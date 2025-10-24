import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const JobFeed = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const fetchJobsAndUserRole = async () => {
      // Fetch jobs
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsList);

      // Fetch user role
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'client') {
          setIsClient(true);
        }
      }
    };

    fetchJobsAndUserRole();
  }, []);

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.description}</Paragraph>
        <Paragraph>Location: {item.location}</Paragraph>
        <Paragraph>Price: R{item.price}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}>
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {isClient && (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('PostJob')}
          style={styles.postJobButton}
        >
          Post a New Job
        </Button>
      )}
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  postJobButton: {
    marginBottom: 10,
  }
});

export default JobFeed;
