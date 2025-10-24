import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Dialog, Divider, Paragraph, Portal, Title } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';

const JobDetail = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleAcceptJob = async () => {
    try {
      setProcessing(true);
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, {
        status: 'in_progress',
        workerId: auth.currentUser.uid,
        acceptedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Job accepted successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept job');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveJob = async () => {
    try {
      setProcessing(true);
      setShowApproveDialog(false);
      
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Simulate payment (should be backend in production)
      const clientRef = doc(db, "users", auth.currentUser.uid);
      const workerRef = doc(db, "users", job.workerId);

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

      Alert.alert('Success', 'Job approved and payment processed!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve job');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA726',
      in_progress: '#42A5F5',
      awaiting_approval: '#AB47BC',
      completed: '#66BB6A',
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'clock-outline',
      in_progress: 'progress-clock',
      awaiting_approval: 'eye-check-outline',
      completed: 'check-circle',
    };
    return icons[status] || 'information';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Paragraph style={styles.loadingText}>Loading job details...</Paragraph>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Job not found</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          {/* Status Chip */}
          <View style={styles.statusContainer}>
            <Chip 
              icon={() => <MaterialCommunityIcons name={getStatusIcon(job.status)} size={18} color="white" />}
              style={[styles.statusChip, { backgroundColor: getStatusColor(job.status) }]}
              textStyle={styles.statusText}
            >
              {job.status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          {/* Job Title */}
          <Title style={styles.title}>{job.title}</Title>
          
          <Divider style={styles.divider} />

          {/* Job Details */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="text-box-outline" size={24} color="#6200ee" />
            <Paragraph style={styles.detailText}>{job.description}</Paragraph>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#6200ee" />
            <Paragraph style={styles.detailText}>{job.location}</Paragraph>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
            <Paragraph style={[styles.detailText, styles.priceText]}>
              R{job.price?.toFixed(2) || '0.00'}
            </Paragraph>
          </View>

          {/* Worker Info (if assigned) */}
          {job.workerId && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.workerInfo}>
                <Avatar.Icon size={40} icon="account" style={styles.avatar} />
                <Paragraph style={styles.workerText}>
                  Worker ID: {job.workerId.substring(0, 8)}...
                </Paragraph>
              </View>
            </>
          )}
        </Card.Content>

        {/* Action Buttons */}
        <Card.Actions style={styles.actions}>
          {job.status === 'pending' && (
            <Button 
              mode="contained" 
              onPress={handleAcceptJob}
              disabled={processing}
              loading={processing}
              icon="hand-okay"
              style={styles.primaryButton}
              labelStyle={styles.buttonLabel}
            >
              Accept Job
            </Button>
          )}
          
          {job.status === 'in_progress' && job.workerId === auth.currentUser.uid && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('SubmitProof', { jobId: job.id })}
              icon="file-upload"
              style={styles.primaryButton}
              labelStyle={styles.buttonLabel}
            >
              Submit Proof
            </Button>
          )}
          
          {job.status === 'awaiting_approval' && job.clientId === auth.currentUser.uid && (
            <Button 
              mode="contained" 
              onPress={() => setShowApproveDialog(true)}
              disabled={processing}
              icon="check-circle"
              style={styles.successButton}
              labelStyle={styles.buttonLabel}
            >
              Approve & Pay
            </Button>
          )}
          
          {job.status === 'completed' && job.clientId === auth.currentUser.uid && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Rating', { 
                jobId: job.id, 
                workerId: job.workerId, 
                clientId: job.clientId 
              })}
              icon="star"
              style={styles.ratingButton}
              labelStyle={styles.buttonLabel}
            >
              Rate Worker
            </Button>
          )}
        </Card.Actions>
      </Card>

      {/* Approval Confirmation Dialog */}
      <Portal>
        <Dialog visible={showApproveDialog} onDismiss={() => setShowApproveDialog(false)}>
          <Dialog.Title>Approve Job?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              You are about to approve this job and pay R{job.price?.toFixed(2)}.
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onPress={handleApproveJob} loading={processing}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  statusContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#424242',
    flex: 1,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  workerText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  actions: {
    padding: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6200ee',
    paddingVertical: 4,
  },
  successButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
  },
  ratingButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JobDetail;
