import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Alert,
} from 'react-native';
import {
    TextInput,
    Button,
    Title,
    Provider as PaperProvider,
    DefaultTheme,
    Card,
    ActivityIndicator,
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// --- Customized Color Palette (Matching previous screens) ---
const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316', // Orange (for active stars)
    primaryLight: '#FFF7ED',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    success: '#10B981',
    darkText: '#0F172A',
    confirmButton: '#4F46E5', // Purple for Submit button
    sidebarActive: '#5b21b6', // Deep purple for sidebar BG
    sidebarLight: '#6D28D9', // Slightly lighter purple for active link background
    starEmpty: '#E2E8F0',
};

// Theme
const theme = {
    ...DefaultTheme,
    roundness: 8,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        accent: COLORS.primary,
        background: COLORS.background,
        surface: COLORS.cardBackground,
        text: COLORS.text,
        placeholder: COLORS.textSecondary,
        onSurface: COLORS.text,
        outline: COLORS.border,
    },
};

// --- Star Rating Component ---
const StarRating = ({ rating, onRate }) => {
    return (
        <View style={starStyles.container}>
            {[1, 2, 3, 4, 5].map((starValue) => (
                <TouchableOpacity key={starValue} onPress={() => onRate(starValue)}>
                    <Icon
                        name={starValue <= rating ? 'star' : 'star-outline'}
                        type="ionicon"
                        size={40}
                        color={starValue <= rating ? COLORS.primary : COLORS.starEmpty}
                        style={starStyles.star}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

// --- Sidebar Navigation Item Component (Reused from previous screen) ---
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.cardBackground : COLORS.border} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);


// --- RatingScreen Component ---
const RatingScreen = ({ route, navigation }) => {
    // Note: Assuming route.params contains jobId, workerId, and clientId
    const { jobId, workerId, clientId } = route.params || {};

    // --- State ---
    const [activeScreen, setActiveScreen] = useState('My Jobs'); // Matches the active sidebar item in the image
    const [currentUser, setCurrentUser] = useState({ name: 'Client', email: '', avatarInitial: 'C', uid: null });
    const [workerDetails, setWorkerDetails] = useState({ name: 'Worker Name', avatarUrl: null });
    const [loading, setLoading] = useState(false);

    // Rating Form State
    const [rating, setRating] = useState(0); // Start at 0, forcing selection
    const [comment, setComment] = useState('');

    // --- Fetch Worker Details Effect ---
    useEffect(() => {
        if (workerId) {
            const workerRef = doc(db, "users", workerId);
            getDoc(workerRef).then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    setWorkerDetails({
                        name: data.name || 'Worker Name',
                        avatarUrl: data.avatarUrl || null,
                    });
                }
            }).catch(error => {
                console.error("Error fetching worker data:", error);
            });
        }

        // Mock Auth check to populate currentUser
        if (auth.currentUser) {
            setCurrentUser({
                ...currentUser,
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
            });
        }
    }, [workerId]);


    // --- Backend Logic: Submit Rating ---
    const handleSubmitRating = async () => {
        if (!workerId || !clientId || !jobId) {
            Alert.alert("Error", "Missing job or user details.");
            return;
        }

        if (rating === 0) {
            Alert.alert("Validation Error", "Please select a star rating before submitting.");
            return;
        }

        setLoading(true);
        try {
            // 1. Add rating to 'ratings' collection
            await addDoc(collection(db, "ratings"), {
                jobId,
                workerId,
                clientId,
                rating,
                comment: comment || 'No comment provided.',
                timestamp: new Date(),
            });

            // 2. Update worker's reputation in 'users' collection
            const workerRef = doc(db, "users", workerId);
            const workerSnap = await getDoc(workerRef);

            if (workerSnap.exists()) {
                const workerData = workerSnap.data();
                const currentReputation = workerData.reputation || 0;
                const completedJobs = workerData.completedJobs || 0;

                // Calculate new weighted average
                const newReputation = ((currentReputation * completedJobs) + rating) / (completedJobs + 1);
                const newCompletedJobs = completedJobs + 1;

                await updateDoc(workerRef, {
                    reputation: newReputation,
                    completedJobs: newCompletedJobs,
                });
            } else {
                // If worker doesn't exist, log an error but proceed (rating is still saved)
                console.warn(`Worker document not found for ID: ${workerId}`);
            }

            Alert.alert("Success", "Rating submitted successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error("Error submitting rating: ", error);
            Alert.alert("Error", "Failed to submit rating. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Mock Navigation Handlers ---
    const handleSidebarNav = (screenName) => {
        setActiveScreen(screenName);
        // In a real app: navigation.navigate(screenName);
    };

    const handleSignOut = async () => {
        try { await signOut(auth); } catch (error) { Alert.alert('Error', 'Could not sign out.'); }
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Sidebar --- */}
                <View style={styles.sidebar}>
                    <Text style={styles.appIdText}>77FES&JP</Text>
                    <View style={styles.sidebarNav}>
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => handleSidebarNav('Post Job')}/>
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => handleSidebarNav('Wallet')}/>
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => handleSidebarNav('Profile')}/>
                        <SidebarNavItem icon="trophy" label="Leaderboard" active={activeScreen === 'Leaderboard'} onPress={() => handleSidebarNav('Leaderboard')}/>
                    </View>
                    {/* Sign out button can be here too, but sticking to the simple sidebar shown */}
                </View>

                {/* --- Main Content --- */}
                <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent}>
                    <Card style={styles.ratingCard}>
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large" />
                                <Text style={styles.loadingText}>Submitting Rating...</Text>
                            </View>
                        )}
                        <Title style={styles.cardTitle}>Rate Your Experience</Title>

                        {/* Worker Profile Info */}
                        <View style={styles.workerProfile}>
                            {/* Avatar Placeholder */}
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="person" type="ionicon" size={40} color={COLORS.textSecondary}/>
                            </View>
                            <Text style={styles.workerName}>{workerDetails.name}</Text>
                        </View>

                        {/* Star Rating */}
                        <StarRating rating={rating} onRate={setRating} />

                        {/* Comment Section */}
                        <View style={styles.commentSection}>
                            <Text style={styles.commentLabel}>Leave a comment (optional)</Text>
                            <TextInput
                                value={comment}
                                onChangeText={setComment}
                                style={styles.commentInput}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleSubmitRating}
                            style={styles.submitButton}
                            labelStyle={styles.submitButtonLabel}
                            disabled={loading || rating === 0}
                        >
                            {loading ? "Submitting..." : "Submit Rating"}
                        </Button>
                    </Card>
                </ScrollView>
            </View>
        </PaperProvider>
    );
};


// --- Styles ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.background,
    },
    // --- Sidebar Styles ---
    sidebar: {
        width: 260,
        backgroundColor: COLORS.sidebarActive,
        padding: 20,
        paddingTop: 40,
        height: '100%',
    },
    appIdText: {
        fontSize: 12,
        color: COLORS.border,
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    sidebarNav: {
        flex: 1,
        marginTop: 20
    },
    sidebarNavItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginBottom: 4
    },
    sidebarNavItemActive: {
        backgroundColor: COLORS.sidebarLight
    },
    sidebarNavIcon: {
        width: 25,
        marginRight: 12
    },
    sidebarNavLink: {
        fontSize: 15,
        color: COLORS.border,
        fontWeight: '500'
    },
    sidebarNavLinkActive: {
        color: COLORS.cardBackground,
        fontWeight: '600'
    },

    // --- Main Content Styles ---
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80, // Add vertical padding for desktop look
    },
    ratingCard: {
        width: '60%', // Center the card, making it wide but not full screen
        maxWidth: 600,
        padding: 40,
        borderRadius: 12,
        elevation: 3,
        alignItems: 'center', // Center content horizontally inside the card
        position: 'relative',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 12,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.darkText,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 30,
    },

    // Worker Profile
    workerProfile: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    workerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },

    // Comment Section
    commentSection: {
        width: '100%',
        marginTop: 30,
        alignItems: 'center',
    },
    commentLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 10,
        textAlign: 'center',
    },
    commentInput: {
        width: '100%',
        minHeight: 120,
        textAlignVertical: 'top',
        backgroundColor: COLORS.background, // Light background for the input area
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
    },

    // Submit Button
    submitButton: {
        marginTop: 30,
        paddingVertical: 8,
        width: '100%',
        maxWidth: 250, // Constrain button width to be centered and not too wide
        backgroundColor: COLORS.confirmButton,
        borderRadius: 6,
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.cardBackground,
    }
});

const starStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    star: {
        marginHorizontal: 5,
    },
});

export default RatingScreen;
