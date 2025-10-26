import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Dialog, Paragraph, Portal } from 'react-native-paper';
import { auth, db } from '../firebaseConfig'; // Make sure this path is correct

// Sidebar navigation items data (static, as in the image)
const navItems = [
    { name: 'Home', icon: 'home-outline' },
    { name: 'My Jobs', icon: 'briefcase-outline' },
    { name: 'Post Job', icon: 'add-circle-outline' },
    { name: 'Wallet', icon: 'wallet-outline' },
    { name: 'Leaderboard', icon: 'trophy-outline' },
    { name: 'Profile', icon: 'person-outline' },
];

// --- Helper Component for Progress Tracker ---
const ProgressTracker = ({ status }) => {
    const isActive = (stepStatus) =>
        (status === 'pending' && stepStatus === 'pending') ||
        (status === 'in_progress' && stepStatus === 'pending') ||
        (status === 'awaiting_approval' && stepStatus === 'pending') ||
        (status === 'completed' && stepStatus === 'pending');

    const isMiddleActive = (stepStatus) =>
        (status === 'in_progress' && stepStatus === 'in_progress') ||
        (status === 'awaiting_approval' && stepStatus === 'in_progress') ||
        (status === 'completed' && stepStatus === 'in_progress');

    const isCompleted = (stepStatus) =>
        status === 'completed' && stepStatus === 'completed';

    // A simple logic to show progress
    const pendingActive = ['pending', 'in_progress', 'awaiting_approval', 'completed'].includes(status);
    const inProgressActive = ['in_progress', 'awaiting_approval', 'completed'].includes(status);
    const completedActive = ['completed'].includes(status);

    return (
        <View style={styles.progressTracker}>
            {/* Step 1: Pending */}
            <View style={styles.progressStep}>
                <View style={[ styles.progressCircle, pendingActive && styles.progressCircleActive ]}>
                    <View style={[ styles.progressCircleInner, pendingActive && styles.progressCircleInnerActive ]} />
                </View>
                <Text style={[ styles.progressText, pendingActive && styles.progressTextActive ]}>
                    Pending
                </Text>
            </View>

            <View style={[styles.progressLine, inProgressActive && styles.progressLineActive]} />

            {/* Step 2: In Progress (no text) */}
            <View style={styles.progressStep}>
                <View style={[ styles.progressCircle, inProgressActive && styles.progressCircleActive ]} />
            </View>

            <View style={[styles.progressLine, completedActive && styles.progressLineActive]} />

            {/* Step 3: Completed */}
            <View style={styles.progressStep}>
                <View style={[ styles.progressCircle, completedActive && styles.progressCircleActive ]} />
                <Text style={[ styles.progressText, completedActive && styles.progressTextActive ]}>
                    Completed
                </Text>
            </View>
        </View>
    );
};


// --- Main JobDetail Component ---
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
                } else {
                    Alert.alert('Error', 'Job not found');
                    navigation.goBack();
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

            // Simulate payment
            const clientRef = doc(db, "users", auth.currentUser.uid);
            const workerRef = doc(db, "users", job.workerId);
            const clientSnap = await getDoc(clientRef);
            const workerSnap = await getDoc(workerRef);

            if (clientSnap.exists() && workerSnap.exists()) {
                const clientData = clientSnap.data();
                const workerData = workerSnap.data();
                await updateDoc(clientRef, {
                    walletBalance: clientData.walletBalance - (job.price || 0),
                });
                await updateDoc(workerRef, {
                    walletBalance: workerData.walletBalance + (job.price || 0),
                });
            }

            Alert.alert('Success', 'Job approved and payment processed!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to approve job');
        } finally {
            setProcessing(false);
        }
    };

    // --- Render Action Buttons Based on Job Status ---
    const renderActions = () => {
        if (!job) return null;
        const { status, workerId, clientId } = job;
        const currentUserId = auth.currentUser.uid;

        if (status === 'pending') {
            return (
                <Button
                    mode="contained"
                    onPress={handleAcceptJob}
                    disabled={processing}
                    loading={processing}
                    icon="hand-okay"
                    style={styles.actionButton}
                    labelStyle={styles.actionButtonText}
                >
                    Accept Job
                </Button>
            );
        }

        if (status === 'in_progress' && workerId === currentUserId) {
            return (
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('SubmitProof', { jobId: job.id })}
                    icon="file-upload"
                    style={styles.actionButton}
                    labelStyle={styles.actionButtonText}
                >
                    Submit Proof
                </Button>
            );
        }

        if (status === 'awaiting_approval' && clientId === currentUserId) {
            return (
                <Button
                    mode="contained"
                    onPress={() => setShowApproveDialog(true)}
                    disabled={processing}
                    icon="check-circle"
                    style={[styles.actionButton, styles.successButton]}
                    labelStyle={styles.actionButtonText}
                >
                    Approve & Pay
                </Button>
            );
        }

        if (status === 'completed' && clientId === currentUserId) {
            return (
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Rating', {
                        jobId: job.id,
                        workerId: job.workerId,
                        clientId: job.clientId
                    })}
                    icon="star"
                    style={[styles.actionButton, styles.ratingButton]}
                    labelStyle={styles.actionButtonText}
                >
                    Rate Worker
                </Button>
            );
        }

        return null; // No actions for other states
    };

    // --- Loading State ---
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5026C8" />
                <Paragraph style={styles.loadingText}>Loading job details...</Paragraph>
            </View>
        );
    }

    // --- Main Render ---
    return (
        <View style={styles.container}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                <View style={styles.sidebarHeader}>
                    <Ionicons name="menu" size={26} color="white" />
                    <Text style={styles.sidebarTitle}>Job Detail</Text>
                </View>
                <View style={styles.navList}>
                    {navItems.map((item) => (
                        <View
                            key={item.name}
                            style={[
                                styles.navItem,
                                item.name === 'Home' && styles.navItemActive,
                            ]}
                        >
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={item.name === 'Home' ? '#673AB7' : 'white'}
                            />
                            <Text
                                style={[
                                    styles.navText,
                                    item.name === 'Home' && styles.navTextActive,
                                ]}
                            >
                                {item.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Main Content */}
            <ScrollView style={styles.mainContentWrapper}>
                <View style={styles.mainContent}>

                    <Text style={styles.title}>{job.title}</Text>

                    <ProgressTracker status={job.status} />

                    <Text style={styles.description}>
                        {job.description || 'No description provided.'}
                    </Text>

                    {/* Client & Location Row (Static as per image) */}
                    <View style={styles.infoRow}>
                        <View style={[styles.infoBox, styles.clientBox]}>
                            <Avatar.Image
                                size={40}
                                source={{ uri: 'https://i.pravatar.cc/150?img=5' }} // Placeholder
                            />
                            <View style={styles.infoDetails}>
                                <Text style={styles.infoLabel}>About the Client</Text>
                                <View style={styles.clientRating}>
                                    <Text style={styles.clientName}>Rensilon...</Text>
                                    <MaterialCommunityIcons name="star" color="#FFC107" size={16} />
                                    <MaterialCommunityIcons name="star" color="#FFC107" size={16} />
                                    <MaterialCommunityIcons name="star" color="#FFC107" size={16} />
                                    <MaterialCommunityIcons name="star" color="#FFC107" size={16} />
                                    <MaterialCommunityIcons name="star" color="#FFC107" size={16} />
                                </View>
                            </View>
                        </View>

                        <View style={[styles.infoBox, styles.locationBox]}>
                            <Ionicons name="location-outline" size={28} color="#673AB7" />
                            <View style={styles.infoDetails}>
                                <Text style={styles.infoLabel}>Location:</Text>
                                <Text style={styles.locationText}>{job.location || 'Not set'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Skills (Static as per image, as this wasn't in your original job data) */}
                    <Text style={styles.sectionTitle}>Skills Required:</Text>
                    <View style={styles.skillsContainer}>
                        {['React', 'Nodejs', 'MongoDB'].map((skill) => (
                            <View key={skill} style={styles.skillChip}>
                                <Text style={styles.skillText}>{skill}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.budget}>
                        Budget: ${job.price?.toFixed(2) || '0.00'}
                    </Text>

                    {/* --- DYNAMIC ACTION BUTTONS --- */}
                    <View style={styles.actionButtonContainer}>
                        {renderActions()}
                    </View>

                </View>
            </ScrollView>

            {/* Approval Confirmation Dialog */}
            <Portal>
                <Dialog visible={showApproveDialog} onDismiss={() => setShowApproveDialog(false)}>
                    <Dialog.Title>Approve Job?</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>
                            You are about to approve this job and pay ${job?.price?.toFixed(2)}.
                            This action cannot be undone.
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowApproveDialog(false)}>Cancel</Button>
                        <Button onPress={handleApproveJob} loading={processing}>Confirm</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F4F7FC',
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
    // Sidebar Styles
    sidebar: {
        width: 280,
        backgroundColor: '#5026C8',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingLeft: 10,
    },
    sidebarTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    navList: {
        flex: 1,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    navItemActive: {
        backgroundColor: 'white',
    },
    navText: {
        color: '#E0D8F5',
        fontSize: 16,
        marginLeft: 16,
    },
    navTextActive: {
        color: '#5026C8',
        fontWeight: '600',
    },
    // Main Content Styles
    mainContentWrapper: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        backgroundColor: 'white',
        margin: 24,
        borderRadius: 12,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 32,
    },
    // Progress Tracker
    progressTracker: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    progressStep: {
        alignItems: 'center',
        flex: 0,
    },
    progressCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: '#E5E7EB',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCircleActive: {
        borderColor: '#673AB7',
        backgroundColor: '#673AB7',
    },
    progressCircleInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E5E7EB',
    },
    progressCircleInnerActive: {
        backgroundColor: 'white',
    },
    progressText: {
        marginTop: 8,
        color: '#6B7280',
        fontSize: 14,
    },
    progressTextActive: {
        color: '#673AB7',
        fontWeight: '600',
    },
    progressLine: {
        flex: 1,
        height: 3,
        backgroundColor: '#E5E7EB',
        marginTop: 12.5,
        marginHorizontal: -10,
    },
    progressLineActive: {
        backgroundColor: '#673AB7',
    },
    // Description
    description: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 32,
    },
    // Info Row (Client/Location)
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 20,
    },
    infoBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 10,
    },
    clientBox: {},
    locationBox: {
        maxWidth: '40%',
    },
    infoDetails: {
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    clientRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginRight: 4,
    },
    locationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    // Skills
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    skillChip: {
        backgroundColor: '#EDE9FE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 12,
        marginBottom: 12,
    },
    skillText: {
        color: '#5B21B6',
        fontWeight: '500',
        fontSize: 14,
    },
    // Budget
    budget: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 32,
    },
    // Button
    actionButtonContainer: {
        alignItems: 'flex-start', // Aligns button to the left
    },
    actionButton: {
        backgroundColor: '#673AB7',
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 150,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'none',
    },
    successButton: {
        backgroundColor: '#4CAF50',
    },
    ratingButton: {
        backgroundColor: '#FF9800',
    },
});

export default JobDetail;