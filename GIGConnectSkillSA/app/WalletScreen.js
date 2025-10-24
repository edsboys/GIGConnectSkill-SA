import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, List, Divider } from 'react-native-paper';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const currentUserUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!currentUserUid) return;

      // Fetch user's balance
      const userRef = doc(db, "users", currentUserUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBalance(userSnap.data().walletBalance);
      }

      // Fetch user's transactions
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef,
        where("from", "==", currentUserUid)
        // Note: Firestore doesn't support 'OR' queries in this way.
        // For a real app, you might structure data differently or do two separate queries.
        // We will do a second query and merge for this MVP.
      );
      const q2 = query(transactionsRef, where("to", "==", currentUserUid));

      const fromSnapshot = await getDocs(q);
      const toSnapshot = await getDocs(q2);

      const userTransactions = [];
      fromSnapshot.forEach((doc) => userTransactions.push({ id: doc.id, ...doc.data() }));
      toSnapshot.forEach((doc) => userTransactions.push({ id: doc.id, ...doc.data() }));

      // A more robust solution would sort by a timestamp server-side
      setTransactions(userTransactions);
    };

    fetchWalletData();
  }, [currentUserUid]);

  const renderTransaction = ({ item }) => (
    <List.Item
      title={`Job: ${item.jobId}`}
      description={`From: ${item.from}\nTo: ${item.to}`}
      right={() => <Paragraph>R{item.amount.toFixed(2)}</Paragraph>}
    />
  );

  return (
    <View style={styles.container}>
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Title>Current Balance</Title>
          <Paragraph style={styles.balanceText}>R{balance.toFixed(2)}</Paragraph>
        </Card.Content>
      </Card>

      <Title style={styles.transactionTitle}>Recent Transactions</Title>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  balanceCard: {
    marginBottom: 20,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  transactionTitle: {
      fontSize: 20,
      marginBottom: 10,
  }
});

export default WalletScreen;
