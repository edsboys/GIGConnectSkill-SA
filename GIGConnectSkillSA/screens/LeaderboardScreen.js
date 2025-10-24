import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Avatar } from 'react-native-paper';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const LeaderboardScreen = () => {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      const workersRef = collection(db, "users");
      const q = query(workersRef, where("role", "==", "worker"), orderBy("completedJobs", "desc"));
      const querySnapshot = await getDocs(q);
      const workersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkers(workersList);
    };

    fetchWorkers();
  }, []);

  const renderWorker = ({ item, index }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Paragraph style={styles.rank}>{index + 1}</Paragraph>
        <Avatar.Text size={40} label={item.name.charAt(0)} />
        <View style={styles.workerInfo}>
            <Title>{item.name}</Title>
            <Paragraph>Completed Jobs: {item.completedJobs || 0}</Paragraph>
            <Paragraph>Reputation: {item.reputation ? item.reputation.toFixed(1) : 'N/A'}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Top Workers</Title>
      <FlatList
        data={workers}
        keyExtractor={item => item.id}
        renderItem={renderWorker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
      textAlign: 'center',
      fontSize: 24,
      marginBottom: 10,
  },
  card: {
    marginBottom: 10,
  },
  cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  rank: {
      fontSize: 20,
      marginRight: 15,
  },
  workerInfo: {
      marginLeft: 15,
  }
});

export default LeaderboardScreen;
