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
    TextInput,
    Button,
    Title,
    Provider as PaperProvider,
    DefaultTheme,
    Subheading,
    Card,
    ActivityIndicator, // Added ActivityIndicator for loading overlay
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// --- Customized Color Palette ---
const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316', // Orange accent (used for radio buttons, avatars)
    primaryLight: '#FFF7ED',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    success: '#10B981',
    darkText: '#0F172A',
    confirmButton: '#4F46E5', // Darker purple/blue (for POST JOB button)
    sidebarActive: '#5b21b6', // Deep purple for sidebar BG
    sidebarLight: '#6D28D9', // Slightly lighter purple for active link background
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
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.cardBackground : COLORS.border} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

// --- Custom Checkbox/Radio Component (Mimicking the image) ---
const CategoryOption = ({ label, selected, onPress }) => (
    <TouchableOpacity style={styles.categoryOption} onPress={onPress}>
        <View style={[styles.radioDot, selected && styles.radioDotActive]}>
            <View style={selected ? styles.radioInnerDot : null} />
        </View>
        <Text style={styles.categoryLabel}>{label}</Text>
    </TouchableOpacity>
);


// --- PostJobScreen Component ---
const PostJobScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Post Job');
    const [currentUser, setCurrentUser] = useState({ name: 'User', email: '', avatarInitial: 'U', uid: null, role: 'client' });
    const [loading, setLoading] = useState(false);

    // --- Job Form State ---
    const [title, setTitle] = useState('');
    const [webDescription, setWebDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [fileCount, setFileCount] = useState(0);

    const categories = ['Retroles', 'Web Development', 'Graphics Design', 'Content', 'Proposals']; // Added Retroles to match image

    // --- Fetch User Data Effect ---
    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, "users", user.uid);
            getDoc(userRef).then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    setCurrentUser({
                        uid: user.uid,
                        name: data.name || 'Client',
                        email: data.email || user.email,
                        avatarInitial: data.name ? data.name.charAt(0).toUpperCase() : 'C',
                        role: data.role || 'client',
                    });
                }
            }).catch(error => {
                console.error("Error fetching user data:", error);
            });
        }
    }, []);


    // --- Post Job Handler (Backend Logic) ---
    const handlePostJob = async () => {
        if (!auth.currentUser || !currentUser.uid) {
            Alert.alert("Error", "You must be logged in to post a job.");
            return;
        }

        if (!title.trim() || !webDescription.trim() || !category || !budget.trim()) {
            Alert.alert("Validation Error", "Please fill in all required fields (Title, Description, Category, Budget).");
            return;
        }

        setLoading(true);
        try {
            const jobData = {
                title: title.trim(),
                description: webDescription.trim(),
                category: category,
                budget: parseFloat(budget.replace(/[^0-9.]/g, '') || 0),
                status: 'Open',
                clientId: currentUser.uid,
                clientName: currentUser.name,
                filesAttached: fileCount,
                postedAt: new Date(),
            };

            await addDoc(collection(db, "jobs"), jobData);

            Alert.alert("Success", "Your new job has been posted successfully!", [
                { text: "OK", onPress: () => {
                        setTitle('');
                        setWebDescription('');
                        setBudget('');
                        setFileCount(0);
                        // navigation.navigate('MyJobs');
                    }}
            ]);

        } catch (error) {
            console.error("Error posting job: ", error);
            Alert.alert("Error", "Failed to post job. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Navigation Handlers ---
    const handleSidebarNav = (screenName) => {
        if (screenName === activeScreen) return;
        // In a real app, this would handle screen navigation
        setActiveScreen(screenName);
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
                        <View style={[styles.sidebarLogoBg, { backgroundColor: COLORS.cardBackground }]}>
                            <Icon name="plus" type="font-awesome-5" color={COLORS.primary} size={22} />
                        </View>
                        <View>
                            <Text style={styles.sidebarTitle}>Post Job</Text>
                            <Text style={styles.sidebarSubtitle}>Studiomate</Text>
                        </View>
                    </View>
                    <View style={styles.sidebarNav}>
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => {}}/>
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => handleSidebarNav('Wallet')}/>
                        <SidebarNavItem icon="trophy" label="Leaderboard" active={activeScreen === 'Leaderboard'} onPress={() => handleSidebarNav('Leaderboard')}/>
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => handleSidebarNav('Profile')}/>
                    </View>
                    <View style={styles.sidebarFooter}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatarPlaceholder, styles.userAvatar]}>
                                <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{currentUser.avatarInitial}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName} numberOfLines={1}>{currentUser.name}</Text>
                                <Text style={styles.userEmail} numberOfLines={1}>{currentUser.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                            <Icon name="sign-out-alt" type="font-awesome-5" size={16} color={COLORS.border}/> {/* Icon should be light to stand out */}
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Main Content --- */}
                <ScrollView style={styles.mainContent}>
                    <View style={styles.contentHeader}>
                        <Title style={styles.contentTitle}>Create a New Job</Title>
                    </View>

                    {/* Job Form Container (Two Columns) */}
                    <Card style={styles.jobFormCard}>
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator animating={true} color={COLORS.primary} size="large" />
                                <Text style={styles.loadingText}>Posting Job...</Text>
                            </View>
                        )}
                        <View style={styles.jobFormGrid}>

                            {/* Left Column: Job Title & Category Selection */}
                            <View style={styles.columnLeft}>
                                <View style={styles.formGroup}>
                                    {/* Swapping Job Title to match alignment of "Job Details" with the second column's "Web Description" header */}
                                    <Text style={styles.columnTitle}>Job Details</Text>
                                    <Text style={styles.formLabel}>Job Title</Text>
                                    <TextInput
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="swesifican" // Mock text from image
                                        style={styles.textInput}
                                        mode="outlined"
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Category</Text>
                                    <View style={styles.categoryContainer}>
                                        {categories.map(cat => (
                                            <CategoryOption
                                                key={cat}
                                                label={cat}
                                                selected={category === cat}
                                                onPress={() => setCategory(cat)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column: Description, Budget & File Upload */}
                            <View style={styles.columnRight}>
                                <Text style={styles.columnTitle}>Web Description</Text>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Web Description</Text>
                                    <TextInput
                                        value={webDescription}
                                        onChangeText={setWebDescription}
                                        placeholder="Your description text here..." // Simplified placeholder
                                        style={[styles.textInput, styles.descriptionInput]}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={5}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Budget</Text>
                                    <TextInput
                                        value={budget}
                                        onChangeText={text => setBudget(text.replace(/[^0-9.]/g, ''))}
                                        placeholder="Web Development" // Mock text from image
                                        style={styles.textInput}
                                        mode="outlined"
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.budgetSuffix}>$ Swapi</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Upload Files</Text>
                                    <TouchableOpacity style={styles.uploadButton} onPress={() => {setFileCount(1); Alert.alert("Upload", "Mock upload function. 1 file attached.")}}>
                                        <Icon name="upload" type="font-awesome-5" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }}/>
                                        <Text style={styles.uploadButtonText}>Upload Files</Text>
                                    </TouchableOpacity>
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={handlePostJob}
                                    style={styles.postButton}
                                    labelStyle={styles.postButtonLabel}
                                    disabled={loading}
                                >
                                    {loading ? "Posting..." : "Post Job"}
                                </Button>
                            </View>
                        </View>
                    </Card>
                </ScrollView>
            </View>
        </PaperProvider>
    );
};

// --- Styles (Optimized for closer match) ---
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
        justifyContent: 'space-between'
    },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingLeft: 10 },
    sidebarLogoBg: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: COLORS.cardBackground },
    sidebarTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.cardBackground },
    sidebarSubtitle: { fontSize: 12, color: COLORS.border },
    sidebarNav: { flex: 1, marginTop: 20 },
    sidebarNavItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6, marginBottom: 4 },
    sidebarNavItemActive: { backgroundColor: COLORS.sidebarLight }, // Slightly different shade of purple
    sidebarNavIcon: { width: 25, marginRight: 12 },
    sidebarNavLink: { fontSize: 15, color: COLORS.border, fontWeight: '500' },
    sidebarNavLinkActive: { color: COLORS.cardBackground, fontWeight: '600' },
    sidebarFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInitial: { fontWeight: 'bold', color: COLORS.primary },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.cardBackground, maxWidth: 150 },
    userEmail: { fontSize: 12, color: COLORS.border, maxWidth: 150 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    signOutText: { fontSize: 15, color: COLORS.border, fontWeight: '500', marginLeft: 12 + 25 },

    // --- Main Content Styles ---
    mainContent: { flex: 1, backgroundColor: COLORS.background },
    contentHeader: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contentTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.darkText,
    },
    jobFormCard: {
        margin: 40,
        padding: 40,
        borderRadius: 12,
        elevation: 3,
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

    // --- Grid Layout ---
    jobFormGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    columnLeft: {
        flex: 1,
        marginRight: 40,
    },
    columnRight: {
        flex: 1,
    },
    columnTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 20, // Reduced margin to match image flow
    },

    // --- Form Elements ---
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: COLORS.cardBackground,
        fontSize: 14,
    },
    descriptionInput: {
        minHeight: 150,
        textAlignVertical: 'top',
    },
    budgetSuffix: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 5,
        alignSelf: 'flex-end', // Aligns the $ Swapi text to the right
        marginRight: 10,
    },

    // --- Category/Radio Mimic ---
    categoryContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5, // Slightly less padding for tighter look
    },
    radioDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    radioDotActive: {
        borderColor: COLORS.primary,
    },
    radioInnerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    categoryLabel: {
        fontSize: 14,
        color: COLORS.text,
    },

    // --- Upload Button Mimic ---
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        padding: 15,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    uploadButtonText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    // --- Post Button ---
    postButton: {
        marginTop: 30,
        paddingVertical: 8,
        backgroundColor: COLORS.confirmButton,
        borderRadius: 6,
    },
    postButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    }
});

export default PostJobScreen;