import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Image,
    Alert,
    Platform,
    FlatList // Added FlatList
} from 'react-native';
import {
    Card,
    Title,
    Paragraph,
    Button,
    Provider as PaperProvider,
    DefaultTheme,
    Subheading,
    Searchbar,
    Divider,
    ActivityIndicator,
    Avatar // Added Avatar for leaderboard list
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
// Updated imports for querying users
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Color Palette (same as previous dashboard screens)
const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316', // Orange accent
    primaryLight: '#FFF7ED',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    star: '#FBBF24', // Yellow star color
    online: '#10B981', // Green online indicator (Might use for top ranks?)
    gold: '#FBBF24',
    silver: '#94A3B8',
    bronze: '#F59E0B', // Using primary orange as bronze substitute
};

// Theme (same as previous dashboard screens)
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

// --- Sidebar Navigation Item Component --- (same as before)
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.primary : COLORS.textSecondary} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

// --- *** NEW: LeaderboardScreen Component *** ---
const LeaderboardScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Leaderboard'); // Set initial active screen
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null, role: '' });
    const [workers, setWorkers] = useState([]); // State for leaderboard workers
    const [loading, setLoading] = useState(true);

    // --- Fetch User Data and Leaderboard Data Effect ---
    useEffect(() => {
        setLoading(true);
        const currentUserUid = auth.currentUser?.uid;

        if (!currentUserUid) {
            navigation.navigate('Login');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch current user's basic info for sidebar
                const userRef = doc(db, "users", currentUserUid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setCurrentUser({
                        uid: currentUserUid,
                        name: userData.name || 'User',
                        email: userData.email || '',
                        avatarInitial: userData.name ? userData.name.charAt(0).toUpperCase() : 'U',
                        role: userData.role || '',
                        avatarUrl: userData.avatarUrl || null,
                    });
                } else {
                    setCurrentUser({ uid: currentUserUid, name: 'User', email: '', avatarInitial: 'U', role: '' });
                }

                // Fetch workers for leaderboard, ordered by reputation
                const workersRef = collection(db, "users");
                // Query where role is 'worker', order by 'reputation' descending, limit to top e.g., 50
                const q = query(
                    workersRef,
                    where("role", "==", "worker"),
                    orderBy("reputation", "desc"), // Order by reputation score
                    limit(50) // Limit the number of workers shown
                );
                const querySnapshot = await getDocs(q);
                const workersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Ensure necessary fields exist with defaults
                    reputation: doc.data().reputation || 0,
                    jobsCompleted: doc.data().jobsCompleted || 0,
                    name: doc.data().name || 'Unnamed Worker',
                }));
                setWorkers(workersList);

            } catch (error) {
                console.error("Error fetching data: ", error);
                Alert.alert("Error", "Could not load leaderboard data.");
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user && user.uid === currentUserUid) {
                fetchData();
            } else if (!user) {
                navigation.navigate('Login');
            }
        });

        fetchData(); // Initial fetch

        return () => unsubscribe(); // Cleanup listener

    }, [navigation]);

    // --- Navigation Handlers --- (same as before)
    const handleSidebarNav = (screenName) => {
        if (screenName === activeScreen) return;
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = currentUser.role === 'client' ? 'ClientJobs' : 'WorkerJobs';
        else if (screenName === 'Post Job') targetScreen = 'PostJob';
        else if (screenName === 'Home') targetScreen = 'Home';
        else if (screenName === 'Profile') targetScreen = 'Profile';
        else if (screenName === 'Wallet') targetScreen = 'Wallet'; // Added Wallet navigation
        else if (screenName === 'Leaderboard') return; // Already here

        setActiveScreen(screenName);
        navigation.navigate(targetScreen);
    };

    const handleSignOut = async () => {
        try { await signOut(auth); } catch (error) { Alert.alert('Error', 'Could not sign out.'); }
    };

    // --- Render Leaderboard Item ---
    const renderWorkerItem = ({ item, index }) => {
        const rank = index + 1;
        let rankColor = COLORS.textSecondary;
        let rankIcon = null;
        if (rank === 1) { rankColor = COLORS.gold; rankIcon = 'trophy'; }
        else if (rank === 2) { rankColor = COLORS.silver; rankIcon = 'medal'; }
        else if (rank === 3) { rankColor = COLORS.bronze; rankIcon = 'award';}

        const avatarLabel = item.name ? item.name.charAt(0).toUpperCase() : '?';
        const avatarUrl = item.avatarUrl || null; // Assuming you store avatarUrl

        return (
            <Card style={styles.workerCard}>
                <Card.Content style={styles.workerCardContent}>
                    {/* Rank */}
                    <View style={styles.rankContainer}>
                        {rankIcon ? (
                            <Icon name={rankIcon} type="font-awesome-5" size={20} color={rankColor} />
                        ) : (
                            <Text style={[styles.rankNumber, { color: rankColor }]}>{rank}</Text>
                        )}
                    </View>

                    {/* Avatar */}
                    <View style={[styles.avatarPlaceholder, styles.listAvatar]}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImageSmall} />
                        ) : (
                            <Text style={[styles.avatarInitialSmall, { color: COLORS.primary }]}>{avatarLabel}</Text>
                        )}
                    </View>

                    {/* Worker Info */}
                    <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{item.name}</Text>
                        <View style={styles.workerStats}>
                            <Icon name="star" type="font-awesome-5" solid color={COLORS.star} size={12} style={{marginRight: 4}}/>
                            <Text style={styles.workerStatText}>{item.reputation.toFixed(1)} Reputation</Text>
                            <Text style={styles.statSeparator}>•</Text>
                            <Icon name="check-circle" type="font-awesome-5" color={COLORS.textSecondary} size={12} style={{marginRight: 4}}/>
                            <Text style={styles.workerStatText}>{item.jobsCompleted} Jobs</Text>
                        </View>
                    </View>

                    {/* View Profile Button */}
                    <Button
                        mode="outlined" // Use outlined for secondary action
                        style={styles.viewProfileButton}
                        labelStyle={styles.viewProfileButtonLabel}
                        onPress={() => { /* navigation.navigate('WorkerProfile', { workerId: item.id }) */ }}
                    >
                        View
                    </Button>
                </Card.Content>
            </Card>
        );
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Sidebar --- */}
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <View style={[styles.sidebarLogoBg, { backgroundColor: COLORS.primaryLight }]}>
                            <Icon name="briefcase" type="font-awesome-5" color={COLORS.primary} size={22} />
                        </View>
                        <View>
                            <Text style={styles.sidebarTitle}>GIGConnect</Text>
                            <Text style={styles.sidebarSubtitle}>Skills Marketplace</Text>
                        </View>
                    </View>
                    <View style={styles.sidebarNav}>
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        {currentUser.role === 'client' && (
                            <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => handleSidebarNav('Post Job')}/>
                        )}
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => handleSidebarNav('Wallet')}/>
                        <SidebarNavItem icon="trophy" label="Leaderboard" active={activeScreen === 'Leaderboard'} onPress={() => {}}/>
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => handleSidebarNav('Profile')}/>
                    </View>
                    <View style={styles.sidebarFooter}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatarPlaceholder, styles.userAvatar]}>
                                {currentUser.avatarUrl ? (
                                    <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{currentUser.avatarInitial}</Text>
                                )}
                            </View>
                            <View>
                                <Text style={styles.userName} numberOfLines={1}>{currentUser.name}</Text>
                                <Text style={styles.userEmail} numberOfLines={1}>{currentUser.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                            <Icon name="sign-out-alt" type="font-awesome-5" size={16} color={COLORS.textSecondary}/>
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Main Content (Leaderboard) --- */}
                <ScrollView style={styles.mainContent}>
                    {/* Header */}
                    <View style={styles.mainHeader}>
                        <Title style={styles.mainTitle}>Worker Leaderboard</Title>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionIcon}>
                                <Icon name="bell" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Leaderboard Content */}
                    <View style={styles.leaderboardGrid}>
                        <Subheading style={styles.leaderboardSubtitle}>Top workers based on reputation score</Subheading>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large"/>
                                <Paragraph style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading leaderboard...</Paragraph>
                            </View>
                        ) : workers.length > 0 ? (
                            <FlatList
                                data={workers}
                                keyExtractor={item => item.id}
                                renderItem={renderWorkerItem}
                                // nestedScrollEnabled // May not be needed
                                contentContainerStyle={{ paddingBottom: 20 }} // Add padding at bottom
                            />
                        ) : (
                            <View style={styles.emptyStateCard}>
                                <Icon name="users-slash" type="font-awesome-5" color={COLORS.textSecondary} size={40}/>
                                <Text style={styles.emptyStateTitle}>No Workers Found</Text>
                                <Text style={styles.emptyStateText}>Worker rankings will appear here once data is available.</Text>
                            </View>
                        )}
                    </View>
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
    // Sidebar Styles (copied)
    sidebar: { width: 260, backgroundColor: COLORS.cardBackground, borderRightWidth: 1, borderRightColor: COLORS.border, padding: 20, justifyContent: 'space-between' },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingLeft: 10 },
    sidebarLogoBg: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sidebarTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    sidebarSubtitle: { fontSize: 12, color: COLORS.textSecondary },
    sidebarNav: { flex: 1, marginTop: 20 },
    sidebarNavItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6, marginBottom: 4 },
    sidebarNavItemActive: { backgroundColor: COLORS.primaryLight },
    sidebarNavIcon: { width: 25, marginRight: 12 },
    sidebarNavLink: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
    sidebarNavLinkActive: { color: COLORS.primary, fontWeight: '600' },
    sidebarFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 150 },
    userEmail: { fontSize: 12, color: COLORS.textSecondary, maxWidth: 150 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    signOutText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', marginLeft: 12 + 25 },

    // Main Content Styles
    mainContent: { flex: 1, backgroundColor: COLORS.background },
    mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    actionIcon: { padding: 8 },

    // Leaderboard Specific Styles
    leaderboardGrid: { padding: 30 },
    leaderboardSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    workerCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        elevation: 1,
    },
    workerCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    rankContainer: {
        width: 40, // Fixed width for rank/icon
        alignItems: 'center',
        marginRight: 16,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listAvatar: { // Use avatarPlaceholder styles but make slightly smaller
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImageSmall: { // Specific style if using image in list
        width: '100%',
        height: '100%',
    },
    avatarInitialSmall: { // Specific style for initial in list
        fontSize: 18,
        fontWeight: 'bold',
    },
    workerInfo: {
        flex: 1, // Take remaining space
        marginRight: 16,
    },
    workerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    workerStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    workerStatText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 2, // Small space after icon
    },
    statSeparator: {
        marginHorizontal: 8,
        color: COLORS.textSecondary,
    },
    viewProfileButton: {
        borderColor: COLORS.border, // Use border color for outlined
        borderRadius: 6,
        borderWidth: 1, // Ensure border shows
    },
    viewProfileButtonLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text, // Use primary text color
        marginHorizontal: 10,
        marginVertical: 4,
    },
    emptyStateCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        marginTop: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    // Shared avatar styles
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInitial: { fontWeight: 'bold' },

});

export default LeaderboardScreen;
