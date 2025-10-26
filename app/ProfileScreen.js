
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Platform,
    Image, // Added for image preview
    Alert, // Added for feedback
} from 'react-native';
import {
    Button,
    Provider as PaperProvider,
    DefaultTheme,
    TextInput,
    ActivityIndicator, // Added for loading
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker'; // Added for image picking
import { db, auth, storage } from '../firebaseConfig'; // Assuming storage is exported from your config
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// --- Color Palette Based on Image ---
const COLORS = {
    sidebarBg: '#2D2F50',       // Dark purple sidebar
    mainBg: '#E5E7EB',          // Light gray main content area
    formBg: '#FFFFFF',          // White form card
    textLight: '#FFFFFF',
    textDark: '#1E293B',        // Dark text for title
    textLabel: '#64748B',
    textMuted: '#CBD5E1',       // Inactive sidebar text
    primaryOrange: '#F97316',   // Active sidebar item
    primaryPurple: '#5C599C',   // Button and tags color (a close match)
    border: '#E0E0E0',
    iconBg: '#F1F5F9',          // Camera icon background
};

// --- Theme ---
const theme = {
    ...DefaultTheme,
    roundness: 8,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primaryPurple,
        accent: COLORS.primaryOrange,
        background: COLORS.mainBg,
        surface: COLORS.formBg,
        text: COLORS.textDark,
        placeholder: COLORS.textLabel,
        onSurface: COLORS.textDark,
        outline: COLORS.border,
    },
};

// --- Sidebar Navigation Item Component ---
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon
            name={icon}
            type="material-community"
            size={22}
            color={active ? COLORS.primaryOrange : COLORS.textMuted}
            style={styles.sidebarNavIcon}
        />
        <Text style={[styles.sidebarNavLink, active && styles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

// --- Skill Tag Component ---
const SkillTag = ({ label }) => (
    <View style={styles.skillTag}>
        <Text style={styles.skillTagText}>{label}</Text>
    </View>
);

// --- Form Input Component (with label above) ---
const FormInput = ({ label, value, onChangeText, placeholder, ...props }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            mode="outlined"
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primaryPurple}
            placeholderTextColor={COLORS.textLabel}
            theme={{ colors: { background: COLORS.formBg } }} // Ensure input bg is white
            {...props}
        />
    </View>
);

// --- EditProfileScreen Component ---
const EditProfileScreen = ({ navigation }) => {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('Pro7/3'); // From image

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');

    // Image and loading state
    const [imageUri, setImageUri] = useState(null); // New local image URI
    const [avatarUrl, setAvatarUrl] = useState(null); // Current avatar URL from Firebase
    const [loading, setLoading] = useState(true); // Initial data fetch
    const [uploading, setUploading] = useState(false); // Save/upload process

    // --- Fetch User Data on Load ---
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) {
                    Alert.alert("Error", "No user found, please log in.");
                    navigation.goBack(); // Or navigate to Login
                    return;
                }

                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFullName(data.name || '');
                    setEmail(data.email || ''); // Email might not be in profile doc
                    setPhoneNumber(data.phone || '');
                    setBio(data.bio || '');
                    setLocation(data.location || '');
                    setSkills(data.skills || []);
                    setAvatarUrl(data.avatarUrl || null);
                } else {
                    console.log("No user data found in Firestore, using auth email.");
                    setEmail(user.email || '');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                Alert.alert("Error", "Could not load your profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []); // Runs once on mount


    // --- Handlers ---
    const handleSidebarNav = (screenName) => {
        setActiveScreen(screenName);
        // Add navigation logic here if needed
        // e.g., navigation.navigate(screenName);
    };

    const handleAddSkill = () => {
        if (newSkill.trim() !== '') {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    // --- Image Picker Handler ---
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri); // Set new local URI
            setAvatarUrl(result.assets[0].uri); // Update preview immediately
        }
    };

    // --- Save Changes Handler ---
    const handleSaveChanges = async () => {
        if (uploading) return;
        setUploading(true);

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error", "No user found.");
            setUploading(false);
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        let newAvatarDownloadUrl = avatarUrl; // Start with current URL (or local URI)

        try {
            // If a new image was picked (imageUri is not null)
            if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();

                const storageRef = ref(storage, `avatars/${user.uid}/profile_${Date.now()}`);
                const uploadTask = await uploadBytesResumable(storageRef, blob);

                newAvatarDownloadUrl = await getDownloadURL(uploadTask.ref);
            }

            // Data to update in Firestore
            const dataToUpdate = {
                name: fullName,
                phone: phoneNumber,
                bio,
                location,
                skills,
                avatarUrl: newAvatarDownloadUrl, // Save the final URL
            };

            await updateDoc(userDocRef, dataToUpdate);

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack(); // Go back to the profile view

        } catch (error) {
            console.error("Error updating profile: ", error);
            Alert.alert('Error', 'Failed to update profile.');
        } finally {
            setUploading(false);
        }
    };

    // Show main loading spinner
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryPurple} />
                <Text style={{color: COLORS.textLabel, marginTop: 10}}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>
                {/* --- Left Column: Sidebar (from image) --- */}
                <View style={styles.sidebar}>
                    <View>
                        <View style={styles.sidebarHeader}>
                            <View style={[styles.sidebarLogoBg, { backgroundColor: COLORS.primaryOrange }]}>
                                <Text style={styles.sidebarLogoText}>7</Text>
                            </View>
                            <Text style={styles.sidebarTitle}>77F5600P</Text>
                        </View>
                        <View style={styles.sidebarNav}>
                            <SidebarNavItem icon="home-outline" label="Home" active={activeScreen === 'Landing'} onPress={() => handleSidebarNav('Landing')}/>
                            <SidebarNavItem icon="briefcase-outline" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                            <SidebarNavItem icon="plus-circle-outline" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => handleSidebarNav('Post Job')}/>
                            <SidebarNavItem icon="wallet-outline" label="Wallet" active={activeScreen === 'Wallet1'} onPress={() => handleSidebarNav('Wallet')}/>
                            <SidebarNavItem icon="account-circle-outline" label="Pro7/3" active={activeScreen === 'Pro7/3'} onPress={() => handleSidebarNav('Profile')}/>
                            <SidebarNavItem icon="chart-bar" label="LeaderBoard" active={activeScreen === 'LeaderBoard'} onPress={() => handleSidebarNav('LeaderBoard')}/>
                        </View>
                    </View>
                    <View />
                </View>

                {/* --- Right Column: Main Content (Edit Profile Form) --- */}
                <ScrollView style={styles.mainContent}>
                    <View style={styles.mainHeader}>
                        <TouchableOpacity style={styles.closeIcon} onPress={() => navigation.goBack()}>
                            <Icon name="close" type="material-community" size={24} color={COLORS.textLabel}/>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Edit Profile</Text>

                        {/* Updated Avatar Uploader */}
                        <TouchableOpacity style={styles.avatarUploader} onPress={handlePickImage}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Icon name="camera" type="material-community" size={24} color={COLORS.textLabel}/>
                            )}
                        </TouchableOpacity>

                        {/* Form Fields Grid */}
                        <View style={styles.formRow}>
                            <FormInput
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                            />
                            <FormInput
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                disabled // Typically email is not editable
                                style={{backgroundColor: '#f4f4f5'}}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <FormInput
                                label="Phone Number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                            />
                            <FormInput
                                label="Location"
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Enter your location"
                            />
                        </View>

                        <FormInput
                            label="Bio"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself"
                            multiline
                            numberOfLines={3}
                            style={styles.bioInput}
                        />

                        {/* Skills Section */}
                        <View style={styles.skillsSection}>
                            <Text style={styles.inputLabel}>Skills</Text>
                            <View style={styles.skillsContainer}>
                                {skills.map((skill, index) => (
                                    <SkillTag key={index} label={skill} />
                                ))}
                            </View>
                            <View style={styles.addSkillRow}>
                                <TextInput
                                    style={styles.skillInput}
                                    value={newSkill}
                                    onChangeText={setNewSkill}
                                    placeholder="Add a new skill"
                                    mode="outlined"
                                    outlineColor={COLORS.border}
                                    activeOutlineColor={COLORS.primaryPurple}
                                    placeholderTextColor={COLORS.textLabel}
                                    theme={{ colors: { background: COLORS.formBg } }}
                                />
                                <TouchableOpacity style={styles.addSkillButton} onPress={handleAddSkill}>
                                    <Icon name="plus" type="material-community" size={24} color={COLORS.textLabel}/>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Updated Save Button */}
                        <Button
                            mode="contained"
                            style={styles.saveButton}
                            labelStyle={styles.saveButtonText}
                            onPress={handleSaveChanges}
                            disabled={uploading}
                            loading={uploading}
                        >
                            {uploading ? 'Saving...' : 'Save Changes'}
                        </Button>
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
        backgroundColor: COLORS.mainBg,
    },
    // --- Loading Container ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.mainBg,
    },
    // --- Sidebar Styles ---
    sidebar: {
        width: 240,
        backgroundColor: COLORS.sidebarBg,
        padding: 20,
        justifyContent: 'space-between',
        height: '100vh',
        position: 'fixed', // Fix sidebar on web
        left: 0,
        top: 0,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingLeft: 10,
    },
    sidebarLogoBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sidebarLogoText: {
        color: COLORS.textLight,
        fontSize: 18,
        fontWeight: 'bold',
    },
    sidebarTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight,
    },
    sidebarNav: {
        marginTop: 20,
    },
    sidebarNavItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginBottom: 8,
    },
    sidebarNavItemActive: {
        backgroundColor: COLORS.primaryOrange,
    },
    sidebarNavIcon: {
        width: 25,
        marginRight: 12,
    },
    sidebarNavLink: {
        fontSize: 15,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    sidebarNavLinkActive: {
        color: COLORS.textLight,
        fontWeight: '600',
    },

    // --- Main Content Styles ---
    mainContent: {
        flex: 1,
        marginLeft: 240, // Offset for the fixed sidebar
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        alignItems: 'center',
    },
    closeIcon: {
        padding: 8,
    },
    formContainer: {
        maxWidth: 960,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: COLORS.formBg,
        borderRadius: 12,
        padding: Platform.OS === 'web' ? 40 : 20,
        margin: 20,
        marginTop: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 20,
    },
    avatarUploader: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden', // To contain the image
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    formRow: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 20,
        marginBottom: 20,
    },
    inputContainer: {
        flex: 1,
        minWidth: 200,
        marginBottom: Platform.OS === 'web' ? 0 : 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textLabel,
        marginBottom: 8,
    },
    input: {
        fontSize: 15,
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    skillsSection: {
        marginTop: 10,
        marginBottom: 20,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 15,
        minHeight: 20,
    },
    skillTag: {
        backgroundColor: COLORS.primaryPurple,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    skillTagText: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    addSkillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    skillInput: {
        flex: 1,
    },
    addSkillButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
    },
    saveButton: {
        marginTop: 30,
        paddingVertical: 8,
        backgroundColor: COLORS.primaryPurple,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight,
        paddingHorizontal: 10,
    },
});

export default EditProfileScreen;
