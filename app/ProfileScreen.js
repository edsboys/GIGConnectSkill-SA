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
    ActivityIndicator // Added for loading state
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
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
    star: '#FBBF24',
    online: '#10B981',
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

// --- Profile Detail Row Component ---
const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
        {icon && <Icon name={icon} type="font-awesome-5" size={16} color={COLORS.textSecondary} style={styles.infoIcon}/>}
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value || 'Not Provided'}</Text>
    </View>
);

// --- ProfileScreen Component ---
const ProfileScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Profile');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState({
        name: 'Loading...',
        email: '',
        avatarInitial: '',
        uid: null,
        jobTitle: '',
        company: '',
        phone: '',
        role: '',
        skills: [],
        avatarUrl: null,
    });
    const [loading, setLoading] = useState(true);

    // --- Fetch User Data Effect ---
    useEffect(() => {
        setLoading(true);
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUser({
                            uid: user.uid,
                            name: userData.name || 'User',
                            email: userData.email || '',
                            avatarInitial: userData.name ? userData.name.charAt(0).toUpperCase() : 'U',
                            jobTitle: userData.jobTitle || 'N/A',
                            company: userData.company || 'N/A',
                            phone: userData.phone || 'N/A',
                            role: userData.role || 'N/A',
                            skills: userData.skills || [],
                            avatarUrl: userData.avatarUrl || null,
                        });
                    } else {
                        console.log("No such user document!");
                        setCurrentUser(prev => ({ ...prev, name: 'User', email: '', avatarInitial: 'U' }));
                        Alert.alert("Error", "Could not load profile details.");
                    }
                } else {
                    console.log("No user logged in");
                    navigation.navigate('Login');
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                Alert.alert("Error", "Could not load profile details.");
                setCurrentUser(prev => ({ ...prev, name: 'Error', email: '', avatarInitial: 'E' }));
            } finally {
                setLoading(false);
            }
        };

        // Listener for auth changes (optional but good practice)
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchUserData();
            } else {
                navigation.navigate('Login'); // Redirect if user logs out elsewhere
            }
        });

        // Cleanup listener on unmount
        return () => unsubscribe();

    }, [navigation]);

    // --- Navigation Handlers ---
    const handleSidebarNav = (screenName) => {
        // Prevent navigation if already on the screen
        if (screenName === activeScreen) return;

        let targetScreen = 'Home'; // Default target

        // Map labels to your actual screen names in AppNavigator
        if (screenName === 'My Jobs') {
            // Determine target based on role if needed
            targetScreen = currentUser.role === 'client' ? 'ClientJobs' : 'WorkerJobs'; // Example
            // Or use a generic 'MyJobs' if you handle role inside that screen
            // targetScreen = 'MyJobs';
        } else if (screenName === 'Post Job') {
            targetScreen = 'PostJob';
        } else if (screenName === 'Home') {
            targetScreen = 'Home'; // Or your main dashboard screen name
        } else if (screenName === 'Profile') {
            targetScreen = 'Profile'; // Should already be here, but for completeness
        }

        setActiveScreen(screenName); // Update UI state
        navigation.navigate(targetScreen); // Navigate
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out successfully');
            // Auth listener in AppNavigator/App.js should handle navigation to Login
        } catch (error) {
            console.error("Error signing out: ", error);
            Alert.alert('Error', 'Could not sign out.');
        }
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Left Column: Sidebar --- */}
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
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => {}}/>
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

                {/* --- Right Column: Main Content (Profile) --- */}
                <ScrollView style={styles.mainContent}>
                    {/* Header inside Main Content */}
                    <View style={styles.mainHeader}>
                        <Title style={styles.mainTitle}>My Profile</Title>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionIcon}>
                                <Icon name="bell" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionIcon}>
                                <Icon name="cog" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Content */}
                    <View style={styles.profileGrid}>
                        {loading ? (
                            // Use ActivityIndicator for a better loading visual
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large"/>
                                <Paragraph style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading profile...</Paragraph>
                            </View>
                        ) : (
                            <>
                                {/* Profile Header Card */}
                                <Card style={styles.profileCard}>
                                    <Card.Content style={styles.profileHeaderContent}>
                                        <View style={[styles.avatarPlaceholder, styles.profileAvatar]}>
                                            {currentUser.avatarUrl ? (
                                                <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImageLarge} />
                                            ) : (
                                                <Text style={[styles.avatarInitialLarge, { color: COLORS.primary }]}>{currentUser.avatarInitial}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.profileName}>{currentUser.name}</Text>
                                        <Text style={styles.profileJobTitle}>{`${currentUser.jobTitle || 'N/A'} at ${currentUser.company || 'N/A'}`}</Text>
                                        <Text style={styles.profileRole}>Role: {currentUser.role || 'N/A'}</Text>
                                        {/* Edit Button - Navigates to EditProfile */}
                                        <Button
                                            mode="contained"
                                            icon="pencil"
                                            style={styles.editButton}
                                            labelStyle={styles.editButtonLabel}
                                            onPress={() => navigation.navigate('EditProfile')} // <-- Updated onPress
                                        >
                                            Edit Profile
                                        </Button>
                                    </Card.Content>
                                </Card>

                                {/* Contact Information Card */}
                                <Card style={styles.profileCard}>
                                    <Card.Content>
                                        <Subheading style={styles.cardTitle}>Contact Information</Subheading>
                                        <Divider style={styles.divider} />
                                        <InfoRow label="Email" value={currentUser.email} icon="envelope"/>
                                        <InfoRow label="Phone" value={currentUser.phone} icon="phone"/>
                                        {/* <InfoRow label="Location" value={currentUser.location} icon="map-marker-alt"/> */}
                                    </Card.Content>
                                </Card>

                                {/* Skills Card (for Workers) */}
                                {currentUser.role === 'worker' && (
                                    <Card style={styles.profileCard}>
                                        <Card.Content>
                                            <Subheading style={styles.cardTitle}>Skills</Subheading>
                                            <Divider style={styles.divider} />
                                            {currentUser.skills && currentUser.skills.length > 0 ? (
                                                <View style={styles.skillsContainer}>
                                                    {currentUser.skills.map((skill, index) => (
                                                        <View key={index} style={styles.skillTag}>
                                                            <Text style={styles.skillTagText}>{skill}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <Paragraph style={{ color: COLORS.textSecondary }}>No skills added yet.</Paragraph>
                                            )}
                                        </Card.Content>
                                    </Card>
                                )}
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
    // Sidebar Styles
    sidebar: {
        width: 260,
        backgroundColor: COLORS.cardBackground,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        padding: 20,
        justifyContent: 'space-between',
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingLeft: 10,
    },
    sidebarLogoBg: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sidebarTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sidebarSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    sidebarNav: {
        flex: 1,
        marginTop: 20,
    },
    sidebarNavItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginBottom: 4,
    },
    sidebarNavItemActive: {
        backgroundColor: COLORS.primaryLight,
    },
    sidebarNavIcon: {
        width: 25,
        marginRight: 12,
    },
    sidebarNavLink: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    sidebarNavLinkActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    sidebarFooter: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        maxWidth: 150,
    },
    userEmail: {
        fontSize: 12,
        color: COLORS.textSecondary,
        maxWidth: 150,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    signOutText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: 12 + 25,
    },
    // Main Content Styles
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionIcon: {
        padding: 8,
    },
    profileGrid: {
        padding: 30,
    },
    loadingContainer: { // Style for loading indicator
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    // Profile Card Styles
    profileCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    profileHeaderContent: {
        alignItems: 'center',
        paddingVertical: 30, // Increased padding
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImageLarge: {
        width: '100%',
        height: '100%',
    },
    avatarInitialLarge: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    profileJobTitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    editButton: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    editButtonLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    // Info Card Styles
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    divider: {
        marginBottom: 8, // Reduced space after divider
        backgroundColor: COLORS.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        // Remove borderBottomWidth here, apply conditionally if needed
    },
    infoIcon: {
        width: 20,
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '500',
        width: 80,
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.text,
        flex: 1,
    },
    // Skills Card Styles
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 8, // Add some padding above skills
    },
    skillTag: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    skillTagText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '500',
    },
});

export default ProfileScreen;

