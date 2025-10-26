import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Image,
    Alert,
    Platform, // Added
    KeyboardAvoidingView // Added
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
    TextInput, // Added
    HelperText // Added
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
// Updated imports for adding data and getting server timestamp
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
    error: '#EF4444', // For validation errors
};

// Theme (same as before)
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
        error: COLORS.error, // Add error color
    },
};
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.primary : COLORS.textSecondary} style={styles.sidebarNavIcon}/>
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);


const PostJobScreen = ({ navigation }) => {
    // --- State for Sidebar and User ---
    const [activeScreen, setActiveScreen] = useState('Post Job'); // Set initial active screen
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null }); // Added uid

    // --- State for Form ---
    const [jobTitle, setJobTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [skills, setSkills] = useState(''); // Simple comma-separated string for now
    const [category, setCategory] = useState(''); // Example categories
    const [jobType, setJobType] = useState('Full-time'); // Example job types
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // --- Fetch User Data Effect --- (Mostly unchanged)
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUser({
                            uid: user.uid, // Store UID
                            name: userData.name || 'User',
                            email: userData.email || '',
                            avatarInitial: userData.name ? userData.name.charAt(0).toUpperCase() : 'U'
                        });
                        // Redirect if user is not a client? Optional.
                        // if (userData.role !== 'client') {
                        //    Alert.alert("Access Denied", "Only clients can post jobs.");
                        //    navigation.navigate('Home'); // Or appropriate screen
                        // }
                    } else {
                        console.log("No such user document!");
                        setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                        // navigation.navigate('Login'); // Redirect if no user doc
                    }
                } else {
                    console.log("No user logged in");
                    setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                    navigation.navigate('Login'); // Redirect if no user logged in
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                // navigation.navigate('Login');
            }
        };

        fetchUserData();
    }, [navigation]);

    // --- Form Validation ---
    const validateForm = () => {
        const newErrors = {};
        if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
        if (!description.trim()) newErrors.description = 'Description is required';
        if (!location.trim()) newErrors.location = 'Location is required';
        if (!price.trim() || isNaN(price) || parseFloat(price) <= 0) newErrors.price = 'Valid price is required';
        if (!category.trim()) newErrors.category = 'Category is required'; // Basic check
        // Add more validation as needed (e.g., skills format)
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Return true if no errors
    };

    // --- Handle Job Posting ---
    const handlePostJob = async () => {
        if (!validateForm()) return; // Stop if validation fails

        if (!currentUser.uid) {
            Alert.alert("Error", "User not identified. Please log in again.");
            return;
        }

        setLoading(true);
        try {
            const jobsCollectionRef = collection(db, "jobs");
            await addDoc(jobsCollectionRef, {
                title: jobTitle.trim(),
                description: description.trim(),
                location: location.trim(),
                price: parseFloat(price),
                skills: skills.split(',').map(s => s.trim()).filter(s => s), // Split comma-separated skills
                category: category.trim(),
                jobType: jobType.trim(),
                clientId: currentUser.uid, // Link job to the client
                clientName: currentUser.name, // Store client name for display
                postedDate: serverTimestamp(), // Use server timestamp
                status: 'open', // Initial status
                // Add companyName if available from user profile or another field
                // companyName: currentUser.company || 'Unknown Client',
            });

            Alert.alert("Success", "Job posted successfully!");
            // Optionally clear form and navigate away
            setJobTitle('');
            setDescription('');
            setLocation('');
            setPrice('');
            setSkills('');
            setCategory('');
            setJobType('Full-time');
            setErrors({});
            navigation.navigate('Home'); // Navigate back home or to a "My Postings" screen

        } catch (error) {
            console.error("Error posting job: ", error);
            Alert.alert("Error", "Could not post job. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Navigation Handlers --- (same as before)
    const handleSidebarNav = (screenName) => {
        setActiveScreen(screenName);
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = 'MyJobs'; // Or 'ClientJobs'
        else if (screenName === 'Profile') targetScreen = 'Profile';
        // Add mapping for 'Post Job' if you want it clickable again
        else if (screenName === 'Post Job') return; // Already here
        navigation.navigate(targetScreen);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out successfully');
            // Auth listener should handle navigation to Login
        } catch (error) {
            console.error("Error signing out: ", error);
            Alert.alert('Error', 'Could not sign out.');
        }
    };

    // --- Form UI ---
    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Left Column: Sidebar --- (Adapted active state) */}
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
                        {/* Make sure screen names match your navigator */}
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => { /* Already here */ }}/>
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => handleSidebarNav('Profile')}/>
                    </View>
                    <View style={styles.sidebarFooter}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatarPlaceholder, styles.userAvatar]}>
                                <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{currentUser.avatarInitial}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{currentUser.name}</Text>
                                <Text style={styles.userEmail}>{currentUser.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                            <Icon name="sign-out-alt" type="font-awesome-5" size={16} color={COLORS.textSecondary}/>
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Right Column: Main Content (Form) --- */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }} // Take remaining space
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView style={styles.mainContent}>
                        {/* Header inside Main Content */}
                        <View style={styles.mainHeader}>
                            {/* Removed Searchbar, Title instead */}
                            <Title style={styles.mainTitle}>Post a New Job</Title>
                            <View style={styles.headerActions}>
                                <TouchableOpacity style={styles.actionIcon}>
                                    <Icon name="bell" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIcon}>
                                    <Icon name="cog" type="font-awesome-5" size={20} color={COLORS.textSecondary}/>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* --- *** Form Content *** --- */}
                        <View style={styles.formGrid}>
                            <Card style={styles.formCard}>
                                <Card.Content>
                                    <Subheading style={styles.formSectionTitle}>Job Details</Subheading>

                                    {/* Job Title */}
                                    <TextInput
                                        mode="outlined"
                                        label="Job Title"
                                        value={jobTitle}
                                        onChangeText={setJobTitle}
                                        style={styles.input}
                                        error={!!errors.jobTitle}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.jobTitle}>{errors.jobTitle}</HelperText>

                                    {/* Description */}
                                    <TextInput
                                        mode="outlined"
                                        label="Description"
                                        value={description}
                                        onChangeText={setDescription}
                                        style={[styles.input, styles.multilineInput]}
                                        multiline
                                        numberOfLines={4}
                                        error={!!errors.description}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.description}>{errors.description}</HelperText>

                                    {/* Location */}
                                    <TextInput
                                        mode="outlined"
                                        label="Location (e.g., Sandton, Johannesburg)"
                                        value={location}
                                        onChangeText={setLocation}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="map-marker-outline" color={COLORS.textSecondary}/>}
                                        error={!!errors.location}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.location}>{errors.location}</HelperText>

                                    {/* Price */}
                                    <TextInput
                                        mode="outlined"
                                        label="Price/Budget (R)"
                                        value={price}
                                        onChangeText={setPrice}
                                        style={styles.input}
                                        keyboardType="numeric"
                                        left={<TextInput.Icon icon="currency-usd" color={COLORS.textSecondary}/>} // using usd icon as placeholder
                                        error={!!errors.price}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.price}>{errors.price}</HelperText>

                                    {/* Skills */}
                                    <TextInput
                                        mode="outlined"
                                        label="Required Skills (comma-separated)"
                                        value={skills}
                                        onChangeText={setSkills}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="tools" color={COLORS.textSecondary}/>}
                                        error={!!errors.skills} // Add validation if needed
                                        disabled={loading}
                                    />
                                    <HelperText type="info">e.g., Plumbing, Wiring, Painting</HelperText>

                                    {/* Category (Using TextInput for now, replace with Picker if needed) */}
                                    <TextInput
                                        mode="outlined"
                                        label="Category"
                                        placeholder="e.g., Home Maintenance, Electrical, Gardening"
                                        value={category}
                                        onChangeText={setCategory}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="tag-outline" color={COLORS.textSecondary}/>}
                                        error={!!errors.category}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.category}>{errors.category}</HelperText>

                                    {/* Job Type (Using TextInput for now, replace with Picker if needed) */}
                                    <TextInput
                                        mode="outlined"
                                        label="Job Type"
                                        placeholder="e.g., Full-time, Part-time, Contract, Once-off"
                                        value={jobType}
                                        onChangeText={setJobType}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="clock-time-four-outline" color={COLORS.textSecondary}/>}
                                        error={!!errors.jobType} // Add validation if needed
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.jobType}>{errors.jobType}</HelperText>

                                    {/* Submit Button */}
                                    <Button
                                        mode="contained"
                                        onPress={handlePostJob}
                                        style={styles.submitButton}
                                        labelStyle={styles.submitButtonLabel}
                                        loading={loading}
                                        disabled={loading}
                                        icon="send"
                                    >
                                        Post Job Now
                                    </Button>

                                </Card.Content>
                            </Card>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    // Sidebar Styles (mostly unchanged)
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
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    userEmail: {
        fontSize: 12,
        color: COLORS.textSecondary,
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
        justifyContent: 'space-between', // Adjust alignment
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    mainTitle: { // Style for the title replacing searchbar
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        // Removed marginLeft
    },
    actionIcon: {
        padding: 8,
    },
    formGrid: { // Renamed from dashboardGrid
        padding: 30,
    },
    // --- Styles for Post Job Form ---
    formCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 30, // Space at the bottom
    },
    formSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.cardBackground, // Inputs have white background inside card
        marginBottom: 0, // Remove default margin bottom from input
    },
    multilineInput: {
        height: 100, // Specific height for multiline
        textAlignVertical: 'top', // Start text from top
    },
    helperText: {
        marginBottom: 16, // Space below helper text
        marginTop: 4,     // Space above helper text
        fontSize: 12,
        color: COLORS.textSecondary, // Default info color
        // Error color is handled by theme
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        paddingVertical: 8,
        marginTop: 24, // Space above button
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },


});

export default PostJobScreen; // Renamed component export
