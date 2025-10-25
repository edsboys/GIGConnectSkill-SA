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
    Divider, // Added Divider
    ActivityIndicator, // Added for loading
    List // Added for transactions
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig'; // Assuming firebaseConfig is correct
// Updated imports for querying transactions
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
    success: '#10B981', // Green for incoming
    danger: '#EF4444', // Red for outgoing
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

// --- *** NEW: WalletScreen Component *** ---
const WalletScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Wallet'); // Set initial active screen
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null, role: '' });
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Fetch User Data and Wallet Data Effect ---
    useEffect(() => {
        setLoading(true);
        const currentUserUid = auth.currentUser?.uid;

        if (!currentUserUid) {
            console.log("No user logged in for wallet");
            navigation.navigate('Login'); // Redirect if no user
            setLoading(false);
            return;
        }

        const fetchWalletData = async () => {
            try {
                // --- Fetch user's basic info and balance ---
                const userRef = doc(db, "users", currentUserUid);
                const userSnap = await getDoc(userRef);
                let userRole = ''; // Variable to store role

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setBalance(userData.walletBalance || 0); // Set balance
                    userRole = userData.role || ''; // Get role
                    // Set current user state for sidebar display
                    setCurrentUser({
                        uid: currentUserUid,
                        name: userData.name || 'User',
                        email: userData.email || '',
                        avatarInitial: userData.name ? userData.name.charAt(0).toUpperCase() : 'U',
                        role: userRole,
                        avatarUrl: userData.avatarUrl || null,
                    });
                } else {
                    console.log("No such user document!");
                    Alert.alert("Error", "Could not load user profile.");
                    setCurrentUser({ uid: currentUserUid, name: 'User', email: '', avatarInitial: 'U', role: '' });
                }

                // --- Fetch user's transactions (using your logic) ---
                const transactionsRef = collection(db, "transactions");
                // Query for transactions where user is the sender OR receiver, order by timestamp
                const qSent = query(transactionsRef,
                    where("fromUid", "==", currentUserUid), // Assuming field is 'fromUid'
                    orderBy("timestamp", "desc"), // Assuming you have a 'timestamp' field
                    limit(20) // Limit results
                );
                const qReceived = query(transactionsRef,
                    where("toUid", "==", currentUserUid), // Assuming field is 'toUid'
                    orderBy("timestamp", "desc"),
                    limit(20)
                );

                const [sentSnapshot, receivedSnapshot] = await Promise.all([
                    getDocs(qSent),
                    getDocs(qReceived)
                ]);

                const userTransactions = [];
                sentSnapshot.forEach((doc) => userTransactions.push({ id: doc.id, ...doc.data(), type: 'sent' }));
                receivedSnapshot.forEach((doc) => userTransactions.push({ id: doc.id, ...doc.data(), type: 'received' }));

                // Sort merged transactions by timestamp (client-side sort)
                userTransactions.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

                setTransactions(userTransactions.slice(0, 20)); // Limit again after merging/sorting

            } catch (error) {
                console.error("Error fetching wallet data: ", error);
                Alert.alert("Error", "Could not load wallet data.");
            } finally {
                setLoading(false); // Stop loading
            }
        };

        // Listener for auth changes
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user && user.uid === currentUserUid) {
                fetchWalletData(); // Refetch if the same user is confirmed
            } else if (!user) {
                navigation.navigate('Login'); // Redirect if user logs out
            }
            // If user changes, the effect will re-run due to dependency array if needed,
            // but usually AppNavigator handles user changes.
        });

        fetchWalletData(); // Initial fetch

        // Cleanup listener on unmount
        return () => unsubscribe();

    }, [navigation]); // Dependency array includes navigation

    // --- Navigation Handlers --- (same as before)
    const handleSidebarNav = (screenName) => {
        if (screenName === activeScreen) return;
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = currentUser.role === 'client' ? 'ClientJobs' : 'WorkerJobs';
        else if (screenName === 'Post Job') targetScreen = 'PostJob';
        else if (screenName === 'Home') targetScreen = 'Home';
        else if (screenName === 'Profile') targetScreen = 'Profile';
        else if (screenName === 'Wallet') return; // Already here

        setActiveScreen(screenName);
        navigation.navigate(targetScreen);
    };

    const handleSignOut = async () => {
        try { await signOut(auth); } catch (error) { Alert.alert('Error', 'Could not sign out.'); }
    };

    // --- Render Transaction Item ---
    const renderTransactionItem = ({ item }) => {
        const isReceived = item.type === 'received';
        const amountColor = isReceived ? COLORS.success : COLORS.danger;
        const amountPrefix = isReceived ? '+' : '-';
        const description = `Job: ${item.jobTitle || item.jobId || 'N/A'}`; // Use jobTitle if available
        const date = item.timestamp?.toDate() ? item.timestamp.toDate().toLocaleDateString('en-ZA') : 'N/A';

        return (
            <List.Item
                title={`R ${item.amount?.toFixed(2) || '0.00'}`}
                description={`${description}\nDate: ${date}`}
                titleStyle={[styles.transactionAmount, { color: amountColor }]}
                descriptionStyle={styles.transactionDescription}
                left={() => (
                    <View style={[styles.transactionIconContainer, { backgroundColor: isReceived ? COLORS.success + '1A' : COLORS.danger + '1A' }]}>
                        <Icon
                            name={isReceived ? 'arrow-down' : 'arrow-up'}
                            type="font-awesome-5"
                            color={amountColor}
                            size={16}
                        />
                    </View>
                )}
                style={styles.transactionItem}
                descriptionNumberOfLines={2} // Allow description to wrap
            />
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
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => {}}/>
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

                {/* --- Main Content (Wallet) --- */}
                <ScrollView style={styles.mainContent}>
                    {/* Header */}
                    <View style={styles.mainHeader}>
                        <Title style={styles.mainTitle}>My Wallet</Title>
                        <View style={styles.headerActions}>
                            {/* Add actions like "Add Funds" or "Settings" if needed */}
                            <TouchableOpacity style={styles.actionIcon}>
                                <Icon name="bell" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Wallet Content */}
                    <View style={styles.walletGrid}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large"/>
                                <Paragraph style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading wallet...</Paragraph>
                            </View>
                        ) : (
                            <>
                                {/* Balance Card */}
                                <Card style={styles.balanceCard}>
                                    <Card.Content>
                                        <View style={styles.balanceHeader}>
                                            <View style={styles.balanceTitleContainer}>
                                                <Icon name="wallet" type="font-awesome-5" size={18} color={COLORS.textSecondary} style={{marginRight: 8}}/>
                                                <Text style={styles.balanceTitle}>Available Balance</Text>
                                            </View>
                                            {/* Options like settings or history link */}
                                            <TouchableOpacity>
                                                <Icon name="ellipsis-h" type="font-awesome-5" size={16} color={COLORS.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.balanceAmount}>R {balance.toFixed(2)}</Text>
                                        <Paragraph style={styles.balanceSubtitle}>Manage your earnings and payments securely.</Paragraph>
                                        <View style={styles.balanceActions}>
                                            <Button
                                                mode="contained"
                                                icon="arrow-down"
                                                style={styles.actionButton}
                                                labelStyle={styles.actionButtonLabel}
                                                onPress={() => Alert.alert("Withdraw", "Withdraw functionality coming soon.")}
                                            >
                                                Withdraw
                                            </Button>
                                            <Button
                                                mode="outlined"
                                                icon="plus"
                                                style={[styles.actionButton, styles.outlineButton]}
                                                labelStyle={[styles.actionButtonLabel, styles.outlineButtonLabel]}
                                                onPress={() => Alert.alert("Deposit", "Deposit functionality coming soon.")}
                                            >
                                                Deposit
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>

                                {/* Recent Transactions */}
                                <Subheading style={styles.transactionTitle}>Recent Transactions</Subheading>
                                <Card style={styles.transactionsCard}>
                                    {transactions.length > 0 ? (
                                        <FlatList
                                            data={transactions}
                                            keyExtractor={item => item.id}
                                            renderItem={renderTransactionItem}
                                            ItemSeparatorComponent={() => <Divider style={styles.transactionDivider} />}
                                            // nestedScrollEnabled // May not be needed if ScrollView is parent
                                        />
                                    ) : (
                                        <Paragraph style={styles.noTransactionsText}>No transactions found.</Paragraph>
                                    )}
                                </Card>
                            </>
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
    // Sidebar Styles (copied from ProfileScreen)
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

    // Wallet Specific Styles
    walletGrid: { padding: 30 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    balanceCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 30,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    balanceTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceTitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    balanceSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    balanceActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1, // Make buttons take equal width
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    actionButtonLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    outlineButton: {
        backgroundColor: COLORS.cardBackground, // White background
        borderColor: COLORS.border,
        borderWidth: 1,
    },
    outlineButtonLabel: {
        color: COLORS.text, // Dark text
    },
    transactionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    transactionsCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        // Remove default padding if List.Item has its own
        // padding: 0,
    },
    transactionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    transactionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16, // Circular
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    transactionDivider: {
        backgroundColor: COLORS.border,
        // Remove margin if List.Item handles spacing
        // marginHorizontal: 16,
    },
    noTransactionsText: {
        textAlign: 'center',
        paddingVertical: 30,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    // Copied avatar styles for sidebar consistency
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInitial: { fontSize: 16, fontWeight: 'bold' },
});

export default WalletScreen;
