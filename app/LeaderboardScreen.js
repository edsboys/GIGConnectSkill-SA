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
    FlatList
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
    Avatar
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
// Using the necessary Firebase imports
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// --- Customized Color Palette ---
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
    gold: '#FBBF24',
    silver: '#94A3B8',
    bronze: '#F59E0B',
    darkText: '#0F172A',
    lightGray: '#F1F5F9',
    primaryBlue: '#3B82F6',
    blackBadge: '#0F172A',
};

// Theme (retained)
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

// --- Sidebar Navigation Item Component (retained) ---
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.primary : COLORS.textSecondary} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

/**
 * Render Worker Card - Mobile list view with R currency.
 */
const renderWorkerCard = ({ item, index }) => {
    // Determine the rank display: use '#' for top 2
    const rank = index + 1;
    const rankDisplay = rank <= 2 ? `#${rank}` : `${rank}`;
    let rankBadgeStyle = rank === 1 || rank === 2 ? styles.rankBadgeGold : styles.rankBadgeNormal;

    // Fallback/Formatted data
    const workerName = item.name || 'Unnamed Worker';
    const workerReputation = (item.reputation || 0).toFixed(1);
    const workerJobsCompleted = item.jobsCompleted || 0;
    const workerPrice = item.price || `R${(Math.floor(Math.random() * 500) + 300)}/hr`; // Placeholder for price
    const workerDescription = item.description || 'Skilled Worker Profile'; // Placeholder for description
    const isTopRated = workerReputation >= 4.5;
    const avatarInitial = workerName.charAt(0).toUpperCase();

    return (
        <Card style={styles.workerCardMobile}>
            <Card.Content style={styles.workerCardContentMobile}>

                {/* Top Section: Rank and Price Badge */}
                <View style={styles.workerGridHeader}>
                    <View style={[styles.rankBadge, rankBadgeStyle]}>
                        <Text style={[styles.rankBadgeText, rank > 2 && {color: COLORS.text}]}>{rankDisplay}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>{workerPrice}</Text> {/* Using R for Rand */}
                    </View>
                </View>

                {/* Avatar and Name */}
                <View style={styles.workerGridProfile}>
                    <View style={[styles.avatarPlaceholder, styles.workerGridAvatar]}>
                        {item.avatarUrl ? (
                            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={[styles.avatarInitialLarge, { color: COLORS.darkText }]}>{avatarInitial}</Text>
                        )}
                    </View>
                    <Text style={styles.workerGridName}>{workerName}</Text>
                    <Text style={styles.workerGridDescription}>{workerDescription}</Text>
                </View>

                {/* Footer Section: Stats and Top Rated Badge */}
                <View style={styles.workerGridFooterMobile}>
                    <View style={styles.workerGridStatRow}>
                        <Icon name="star" type="font-awesome-5" solid color={COLORS.star} size={14} style={{marginRight: 6}}/>
                        <Text style={styles.workerGridStatText}>{workerReputation} Reputation</Text>
                    </View>
                    <View style={styles.workerGridStatRow}>
                        <Icon name="briefcase" type="font-awesome-5" color={COLORS.textSecondary} size={14} style={{marginRight: 6}}/>
                        <Text style={styles.workerGridStatText}>{workerJobsCompleted} Jobs Completed</Text>
                    </View>
                    {isTopRated && (
                        <View style={styles.topRatedBadge}>
                            <Icon name="medal" type="font-awesome-5" size={12} color={COLORS.gold}/>
                            <Text style={styles.topRatedText}>Top Rated</Text>
                        </View>
                    )}
                </View>

                {/* View Profile Button */}
                <Button
                    mode="contained"
                    style={styles.viewProfileButtonGrid}
                    labelStyle={styles.viewProfileButtonLabelGrid}
                    onPress={() => { /* navigation.navigate('WorkerProfile', { workerId: item.id }) */ }}
                >
                    View Profile
                </Button>

            </Card.Content>
        </Card>
    );
};


// --- LeaderboardScreen Component ---
const LeaderboardScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Leaderboard');
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null, role: '' });
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Reputation');

    // --- Fetch User Data and Leaderboard Data Effect (UPDATED FOR FIREBASE) ---
    useEffect(() => {
        setLoading(true);
        const currentUserUid = auth.currentUser?.uid;

        if (!currentUserUid) {
            // navigation.navigate('Login'); // Use this in production
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch current user's basic info for sidebar
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

                // 2. Fetch workers for leaderboard, ordered by reputation (or the active tab criteria)
                const workersRef = collection(db, "users");

                // Determine the field to order by based on the activeTab state
                const orderByField = activeTab === 'Reputation' ? 'reputation' : 'jobsCompleted';

                const q = query(
                    workersRef,
                    where("role", "==", "worker"),
                    orderBy(orderByField, "desc"), // Order by 'reputation' or 'jobsCompleted'
                    limit(50)
                );

                const querySnapshot = await getDocs(q);
                const workersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Ensure necessary fields exist with defaults
                    reputation: doc.data().reputation || 0,
                    jobsCompleted: doc.data().jobsCompleted || 0,
                    name: doc.data().name || 'Unnamed Worker',
                    description: doc.data().skill || doc.data().bio || 'Skilled Worker', // Use skill/bio from DB if available
                    price: doc.data().rate ? `R${doc.data().rate}/hr` : `R${(Math.floor(Math.random() * 500) + 300)}/hr`, // Use rate from DB, or placeholder
                    avatarUrl: doc.data().avatarUrl || null,
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
                // navigation.navigate('Login'); // Use this in production
            }
        });

        fetchData();

        return () => unsubscribe();

    }, [navigation, activeTab]); // Re-run effect when activeTab changes

    // --- Navigation Handlers (retained) ---
    const handleSidebarNav = (screenName) => {
        if (screenName === activeScreen) return;
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = currentUser.role === 'client' ? 'ClientJobs' : 'WorkerJobs';
        else if (screenName === 'Post Job') targetScreen = 'PostJob';
        else if (screenName === 'Home') targetScreen = 'Home';
        else if (screenName === 'Profile') targetScreen = 'Profile';
        else if (screenName === 'Wallet') targetScreen = 'Wallet';
        else if (screenName === 'Leaderboard') return;

        setActiveScreen(screenName);
        navigation.navigate(targetScreen);
    };

    const handleSignOut = async () => {
        try { await signOut(auth); } catch (error) { Alert.alert('Error', 'Could not sign out.'); }
    };

    // Filter Workers based on search query (sorting is now handled in the useEffect by Firebase)
    const filteredWorkers = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (worker.description && worker.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Handle tab change and re-fetch data
    const handleTabChange = (tabName) => {
        setWorkers([]); // Clear current workers while fetching
        setLoading(true);
        setActiveTab(tabName);
        // The useEffect dependency array will trigger fetchData() automatically
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Sidebar (Kept) --- */}
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

                {/* --- Main Content (Mobile-style Header and Content) --- */}
                <ScrollView style={styles.mainContent}>

                    {/* Header: App Header (No desktop bar) */}
                    <View style={styles.mainHeader}>
                        <Title style={styles.mainTitle}>Worker Leaderboard</Title>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionIcon}>
                                <Icon name="bell" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Leaderboard Main Area */}
                    <View style={styles.leaderboardMainAreaMobile}>

                        <Subheading style={styles.leaderboardSubtitle}>Top workers based on reputation score</Subheading>

                        <Searchbar
                            placeholder="Search for workers..."
                            onChangeText={setSearchQuery}
                            value={searchQuery}
                            style={styles.searchbarMobile}
                            inputStyle={styles.searchbarInput}
                            iconColor={COLORS.textSecondary}
                        />

                        {/* Filter Tabs */}
                        <View style={styles.filterTabs}>
                            <TouchableOpacity
                                style={activeTab === 'Reputation' ? styles.filterTabActive : styles.filterTab}
                                onPress={() => handleTabChange('Reputation')}
                            >
                                <Text style={activeTab === 'Reputation' ? styles.filterTabTextActive : styles.filterTabText}>Reputation</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={activeTab === 'Jobs Completed' ? styles.filterTabActive : styles.filterTab}
                                onPress={() => handleTabChange('Jobs Completed')}
                            >
                                <Text style={activeTab === 'Jobs Completed' ? styles.filterTabTextActive : styles.filterTabText}>Jobs Completed</Text>
                            </TouchableOpacity>
                        </View>


                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large"/>
                                <Paragraph style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading leaderboard...</Paragraph>
                            </View>
                        ) : filteredWorkers.length > 0 ? (
                            <FlatList
                                data={filteredWorkers}
                                keyExtractor={item => item.id}
                                renderItem={renderWorkerCard}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        ) : (
                            <View style={styles.emptyStateCard}>
                                <Icon name="users-slash" type="font-awesome-5" color={COLORS.textSecondary} size={40}/>
                                <Text style={styles.emptyStateTitle}>No Workers Found</Text>
                                <Text style={styles.emptyStateText}>No workers match your current filters or search query.</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </PaperProvider>
    );
};

// --- Styles (Retained Mobile Layout + Card Design) ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.cardBackground,
    },
    // --- Sidebar Styles (Retained) ---
    sidebar: { width: 260, backgroundColor: COLORS.cardBackground, borderRightWidth: 1, borderRightColor: COLORS.border, padding: 20, justifyContent: 'space-between' },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingLeft: 10 },
    sidebarLogoBg: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: COLORS.primaryLight },
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
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 150 },
    userEmail: { fontSize: 12, color: COLORS.textSecondary, maxWidth: 150 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    signOutText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', marginLeft: 12 + 25 },

    // --- Main Content Styles (Mobile) ---
    mainContent: { flex: 1, backgroundColor: COLORS.background },

    // Header (App Header)
    mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    actionIcon: { padding: 8 },

    leaderboardMainAreaMobile: {
        padding: 20,
        flex: 1,
        backgroundColor: COLORS.background,
    },
    leaderboardSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 15,
    },
    searchbarMobile: {
        marginBottom: 20,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        elevation: 1,
        height: 48,
    },
    searchbarInput: {
        fontSize: 15,
        color: COLORS.text,
    },

    // Filter Tabs
    filterTabs: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterTab: {
        paddingBottom: 10,
        marginRight: 20,
    },
    filterTabActive: {
        paddingBottom: 10,
        marginRight: 20,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primaryBlue,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    filterTabTextActive: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primaryBlue,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },

    // --- Mobile Card Styles (Worker Card Design) ---
    workerCardMobile: {
        width: '100%',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: 15,
        position: 'relative',
    },
    workerCardContentMobile: {
        padding: 20,
    },
    workerGridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    rankBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        alignItems: 'center',
    },
    rankBadgeGold: {
        backgroundColor: COLORS.gold,
    },
    rankBadgeNormal: {
        backgroundColor: COLORS.lightGray,
    },
    rankBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.darkText,
    },
    priceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: COLORS.blackBadge,
    },
    priceBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.cardBackground,
    },
    workerGridProfile: {
        alignItems: 'center',
        marginBottom: 15,
    },
    workerGridAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10,
        backgroundColor: COLORS.lightGray,
        overflow: 'hidden',
    },
    avatarInitialLarge: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.darkText,
    },
    workerGridName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkText,
        textAlign: 'center',
    },
    workerGridDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        maxWidth: '90%',
    },
    workerGridFooterMobile: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 15,
        marginBottom: 50,
    },
    workerGridStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    workerGridStatText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    topRatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 10,
        borderColor: COLORS.gold,
        borderWidth: 1,
    },
    topRatedText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.gold,
        marginLeft: 6,
    },
    viewProfileButtonGrid: {
        position: 'absolute',
        bottom: 10,
        right: 15,
        backgroundColor: COLORS.primaryBlue,
        borderRadius: 6,
        elevation: 2,
    },
    viewProfileButtonLabelGrid: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.cardBackground,
        marginHorizontal: 5,
        marginVertical: 4,
    },
    // Shared avatar styles
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInitial: { fontWeight: 'bold' },
});

export default LeaderboardScreen;