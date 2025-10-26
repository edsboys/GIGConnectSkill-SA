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
    FlatList,
} from 'react-native';
import {
    Card,
    Title,
    Paragraph,
    Button,
    Provider as PaperProvider,
    DefaultTheme,
    Subheading,
    Divider,
    ActivityIndicator,
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
// Import your Firebase configuration
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Color Palette
const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316',
    primaryLight: '#FFF7ED',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    success: '#10B981',
    danger: '#EF4444',
    white: '#FFFFFF',
    darkText: '#0F172A',
    linkBlue: '#3B82F6',
    confirmButton: '#4F46E5',
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

// --- Sidebar Navigation Item Component ---
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.primary : COLORS.textSecondary} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

// --- Render Transaction Item ---
const renderTransactionItemDesktop = ({ item }) => {
    // Determine if the transaction is a credit (money received) or debit (money sent/withdrawal)
    let isCredit = item.type === 'received';
    let amountColor = isCredit ? COLORS.success : COLORS.danger;
    let amountPrefix = isCredit ? '+' : '-';

    const refDisplay = item.refNumber || '384330113203334407';

    return (
        <View style={styles.transactionListItem}>
            <View style={styles.transactionLeft}>
                <Icon
                    name={isCredit ? 'check-circle' : 'minus-circle'}
                    type="font-awesome-5"
                    color={isCredit ? COLORS.success : COLORS.danger}
                    size={18}
                    solid={true}
                    style={styles.transactionStatusIcon}
                />
                <Text style={styles.transactionLabel}>{item.description || 'Transaction'}</Text>
                <Text style={styles.transactionRef}>{refDisplay}</Text>
            </View>
            {/* Displaying in R (South African Rand) as per previous context */}
            <Text style={[styles.transactionAmountDesktop, { color: amountColor }]}>
                {amountPrefix} R{(item.amount || 0).toFixed(2)}
            </Text>
        </View>
    );
};


// --- WalletScreen Component (UPDATED FOR FIREBASE & FUNCTIONALITY) ---
const WalletScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Wallet');
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null, role: '' });
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Withdrawal Form State ---
    const [withdrawDetails, setWithdrawDetails] = useState({
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        routingNumber: '',
        amount: '',
    });

    // --- Fetch User Data and Wallet Data Effect (CONNECTED TO FIREBASE) ---
    useEffect(() => {
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
            console.log("No user logged in. Authentication required.");
            setLoading(false);
            return;
        }

        const currentUserUid = user.uid;

        const fetchWalletData = async () => {
            try {
                // 1. Fetch current user's data (balance and profile info)
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

                    setBalance(userData.balance || 0);

                } else {
                    Alert.alert("Error", "User profile not found.");
                }

                // 2. Fetch transaction history
                const transactionsRef = collection(db, "transactions");

                const q = query(
                    transactionsRef,
                    where("userId", "==", currentUserUid),
                    orderBy("timestamp", "desc"),
                    limit(20)
                );

                const querySnapshot = await getDocs(q);
                const transactionsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    amount: doc.data().amount || 0,
                    description: doc.data().description || 'Unspecified Transaction',
                    type: doc.data().type || 'sent',
                    refNumber: doc.data().refNumber || doc.id.substring(0, 15).toUpperCase(),
                }));

                setTransactions(transactionsList);

            } catch (error) {
                console.error("Error fetching wallet data: ", error);
                Alert.alert("Data Error", "Could not load wallet data. Check your connection or Firebase rules.");
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchWalletData();
            }
        });

        return () => unsubscribe();
    }, [navigation]);

    // --- Withdrawal Handler (Core Backend Logic) ---
    const handleWithdrawal = async () => {
        const currentUserUid = auth.currentUser?.uid;
        if (!currentUserUid) {
            Alert.alert("Error", "You must be logged in to perform a withdrawal.");
            return;
        }

        const amount = parseFloat(withdrawDetails.amount);
        const { bankName, accountNumber } = withdrawDetails;

        if (!amount || amount <= 0 || isNaN(amount)) {
            Alert.alert("Validation Error", "Please enter a valid amount.");
            return;
        }
        if (amount > balance) {
            Alert.alert("Validation Error", `Insufficient funds. Available: R${balance.toFixed(2)}.`);
            return;
        }
        if (!bankName || !accountNumber) {
            Alert.alert("Validation Error", "Please fill in all bank details.");
            return;
        }

        // Confirmation (Using simple Alert for this non-native environment)
        Alert.alert(
            "Confirm Withdrawal",
            `Are you sure you want to withdraw R${amount.toFixed(2)} to account ${accountNumber}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: async () => {
                        setLoading(true);
                        try {
                            // 1. Update User Balance (Deduct)
                            const userRef = doc(db, "users", currentUserUid);
                            const newBalance = balance - amount;

                            await updateDoc(userRef, {
                                balance: newBalance,
                            });

                            // 2. Record Transaction (Debit)
                            const transactionsRef = collection(db, "transactions");
                            const transactionDoc = await addDoc(transactionsRef, {
                                userId: currentUserUid,
                                amount: amount,
                                description: `Withdrawal to ${bankName}`,
                                type: 'sent',
                                timestamp: new Date(),
                                refNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
                                status: 'Pending',
                            });

                            // 3. Update local state
                            setBalance(newBalance);
                            setWithdrawDetails({
                                bankName: '',
                                accountHolderName: '',
                                accountNumber: '',
                                routingNumber: '',
                                amount: '',
                            });

                            // Manually push the new transaction to the front of the local list
                            setTransactions(prev => [{
                                id: transactionDoc.id,
                                amount: amount,
                                description: `Withdrawal to ${bankName}`,
                                type: 'sent',
                                refNumber: transactionDoc.id.substring(0, 15).toUpperCase(),
                            }, ...prev.slice(0, 19)]);


                            Alert.alert("Success", `R${amount.toFixed(2)} successfully withdrawn.`);

                        } catch (error) {
                            console.error("Withdrawal failed: ", error);
                            // Re-fetch data on failure to ensure balance state is correct
                            Alert.alert("Error", "Withdrawal failed. Please try again.");
                        } finally {
                            setLoading(false);
                        }
                    }},
            ]
        );
    };

    // Helper for updating form state
    const handleChange = (name, value) => {
        setWithdrawDetails(prev => ({ ...prev, [name]: value }));
    };

    // --- Navigation Handlers ---
    const handleSidebarNav = (screenName) => {
        if (screenName === activeScreen) return;
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = currentUser.role === 'client' ? 'ClientJobs' : 'WorkerJobs';
        else if (screenName === 'Post Job') targetScreen = 'PostJob';
        else if (screenName === 'Home') targetScreen = 'Home';
        else if (screenName === 'Profile') targetScreen = 'Profile';
        else if (screenName === 'Wallet') return;

        setActiveScreen(screenName);
        // navigation.navigate(targetScreen); // Disabled for single file context
    };

    const handleSignOut = async () => {
        try { await signOut(auth); } catch (error) { Alert.alert('Error', 'Could not sign out.'); }
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
                            <Text style={styles.sidebarTitle}>WalletScreen</Text>
                            <Text style={styles.sidebarSubtitle}>Studiomate</Text>
                        </View>
                    </View>
                    <View style={styles.sidebarNav}>
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        {currentUser.role === 'client' && (
                            <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => handleSidebarNav('Post Job')}/>
                        )}
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => {}}/>
                        <SidebarNavItem icon="trophy" label="Leaderboard" active={activeScreen === 'Leaderboard'} onPress={() => handleSidebarNav('Leaderboard')}/>
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
                    {/* Header: Clean app header (Browser bar removed) */}
                    <View style={styles.cleanHeader}>
                        <Title style={styles.headerTitle}>Wallet Dashboard</Title>
                    </View>


                    {/* Wallet Content - Two-Column Layout */}
                    <View style={styles.walletContentContainer}>
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large"/>
                                <Paragraph style={{ marginTop: 10, color: COLORS.textSecondary }}>Processing transaction or loading data...</Paragraph>
                            </View>
                        )}
                        {!loading && (
                            <>
                                {/* Left Column: Financial Overview + Transactions */}
                                <View style={styles.walletColumnLeft}>
                                    {/* Financial Overview */}
                                    <View style={styles.financialOverview}>
                                        <Text style={styles.financialTitle}>Financial Overview</Text>
                                        <Text style={styles.currentBalanceAmount}>R{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                        <Text style={styles.availableForWithdrawal}>Available for Withdrawal</Text>

                                        {/* Action Buttons */}
                                        <View style={styles.financialActions}>
                                            <TouchableOpacity
                                                style={[styles.desktopActionButton, styles.depositButton]}
                                                onPress={() => Alert.alert("Deposit", "Deposit functionality coming soon.")}>
                                                <Text style={styles.desktopButtonText}>Deposit Funds</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.desktopActionButton, styles.withdrawButton]}
                                                onPress={() => Alert.alert("Withdraw", "Fill in the form on the right to proceed.")}>
                                                <Text style={styles.desktopButtonText}>Withdraw Funds</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Transaction History */}
                                    <View style={styles.transactionHistory}>
                                        <Text style={styles.historyTitle}>Transaction History</Text>
                                        {transactions.length > 0 ? (
                                            <FlatList
                                                data={transactions}
                                                keyExtractor={item => item.id}
                                                renderItem={renderTransactionItemDesktop}
                                                scrollEnabled={false}
                                                ListFooterComponent={() => <Divider style={styles.transactionDivider} />}
                                            />
                                        ) : (
                                            <Text style={styles.noTransactionsText}>No transactions found.</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Right Column: Withdraw to Bank Form (Interactive) */}
                                <View style={styles.walletColumnRight}>
                                    <View style={styles.withdrawFormContainer}>
                                        <Text style={styles.withdrawFormTitle}>Withdraw to Bank Account</Text>

                                        <View style={styles.formRow}>
                                            <View style={styles.formField}>
                                                <Text style={styles.formLabel}>Bank Name</Text>
                                                <TextInputMock
                                                    value={withdrawDetails.bankName}
                                                    onChangeText={(text) => handleChange('bankName', text)}
                                                    placeholder="e.g., FNB"
                                                />
                                            </View>
                                            <View style={styles.formField}>
                                                <Text style={styles.formLabel}>Account Holder Name</Text>
                                                <TextInputMock
                                                    value={withdrawDetails.accountHolderName}
                                                    onChangeText={(text) => handleChange('accountHolderName', text)}
                                                    placeholder={currentUser.name}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.formRow}>
                                            <View style={styles.formField}>
                                                <Text style={styles.formLabel}>Account Number</Text>
                                                <TextInputMock
                                                    value={withdrawDetails.accountNumber}
                                                    onChangeText={(text) => handleChange('accountNumber', text)}
                                                    placeholder="00000000000"
                                                />
                                            </View>
                                            <View style={styles.formField}>
                                                <Text style={styles.formLabel}>Routing/Branch Number</Text>
                                                <TextInputMock
                                                    value={withdrawDetails.routingNumber}
                                                    onChangeText={(text) => handleChange('routingNumber', text)}
                                                    placeholder="000000"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.formRow}>
                                            <View style={styles.formFieldFull}>
                                                <Text style={styles.formLabel}>Withdrawal Amount (R)</Text>
                                                <TextInputMock
                                                    value={withdrawDetails.amount}
                                                    onChangeText={(text) => handleChange('amount', text.replace(/[^0-9.]/g, ''))}
                                                    placeholder={`Max: R${balance.toFixed(2)}`}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                                            onPress={handleWithdrawal}
                                            disabled={loading}
                                        >
                                            <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.withdrawalNote}>Please double-check all details before submitting.</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </PaperProvider>
    );
};

// --- Mock TextInput Component for Web Preview ---
// Since this environment doesn't perfectly support RN TextInput, we create a mock wrapper
// to ensure the component looks correct but uses a standard web input for functionality.
// If the full React Native app were deployed, this would be replaced with RN's TextInput.
const TextInputMock = ({ value, onChangeText, placeholder, keyboardType = 'default' }) => (
    <View style={styles.textInputDesktop}>
        <input
            style={{
                borderWidth: 0,
                backgroundColor: 'transparent',
                outline: 'none',
                flex: 1,
                fontSize: 14,
                color: COLORS.text,
            }}
            value={value}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={placeholder}
            type={keyboardType === 'numeric' ? 'number' : 'text'}
        />
    </View>
);

// --- Styles ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.background,
    },
    // Sidebar Styles
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
    avatarImage: { width: '100%', height: '100%' },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 150 },
    userEmail: { fontSize: 12, color: COLORS.textSecondary, maxWidth: 150 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    signOutText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', marginLeft: 12 + 25 },

    // Main Content Styles
    mainContent: { flex: 1, backgroundColor: COLORS.cardBackground },

    // Clean App Header (Replaces mock browser bar)
    cleanHeader: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.darkText,
    },

    // Wallet Specific Styles
    walletContentContainer: {
        flexDirection: 'row',
        padding: 40,
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
    },

    walletColumnLeft: {
        flex: 3,
        marginRight: 40,
    },
    walletColumnRight: {
        flex: 2,
        paddingLeft: 40,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },

    // Financial Overview Styles
    financialOverview: {
        marginBottom: 30,
    },
    financialTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 20,
    },
    currentBalanceAmount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 5,
    },
    availableForWithdrawal: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 25,
    },
    financialActions: {
        flexDirection: 'row',
    },
    desktopActionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginRight: 15,
        alignItems: 'center',
    },
    depositButton: {
        backgroundColor: COLORS.primary,
    },
    withdrawButton: {
        backgroundColor: COLORS.primary,
    },
    desktopButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },

    // Transaction History Styles
    transactionHistory: {},
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 20,
    },
    transactionListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 0,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    noTransactionsText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        paddingVertical: 20,
        textAlign: 'center',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionStatusIcon: {
        marginRight: 10,
        width: 18,
    },
    transactionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
        marginRight: 10,
    },
    transactionRef: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    transactionAmountDesktop: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    transactionDivider: {
        backgroundColor: COLORS.border,
        height: 1,
    },

    // Withdraw Form Styles
    withdrawFormContainer: {
        padding: 0,
    },
    withdrawFormTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 30,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    formField: {
        flex: 1,
        marginRight: 20,
    },
    formFieldFull: {
        flex: 1,
    },
    formLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    textInputDesktop: {
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        backgroundColor: COLORS.cardBackground,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    confirmButton: {
        marginTop: 40,
        paddingVertical: 12,
        backgroundColor: COLORS.confirmButton,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        opacity: 0.7,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
    withdrawalNote: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 10,
    }
});

export default WalletScreen;