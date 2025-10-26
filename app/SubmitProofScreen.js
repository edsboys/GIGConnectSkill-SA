import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Alert,
    Image, // Necessary for displaying the captured image
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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db, auth } from '../firebaseConfig'; // Assuming '../firebaseConfig' is set up
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// --- Customized Color Palette (Consistent with application theme) ---
const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316', // Orange (used for accents/icons)
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    darkText: '#0F172A',
    confirmButton: '#4F46E5', // Purple for Submit button
    sidebarActive: '#5b21b6', // Deep purple for sidebar BG
    sidebarLight: '#6D28D9', // Slightly lighter purple for active link background
    placeholderBorder: '#D0D0D0', // Dotted border color
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

// --- Sidebar Navigation Item Component (Reused for consistent layout) ---
const SidebarNavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[appStyles.sidebarNavItem, active && appStyles.sidebarNavItemActive]}
        onPress={onPress}
    >
        <Icon name={icon} type="font-awesome-5" size={18} color={active ? COLORS.cardBackground : COLORS.border} style={appStyles.sidebarNavIcon}/>
        <Text style={[appStyles.sidebarNavLink, active && appStyles.sidebarNavLinkActive]}>{label}</Text>
    </TouchableOpacity>
);

// --- Submit Proof Screen Component ---
const SubmitProofScreen = ({ route, navigation }) => {
    const { jobId } = route.params || {};

    // --- State ---
    const [activeScreen, setActiveScreen] = useState('My Jobs'); // Matches the active sidebar item in the image
    const [image, setImage] = useState(null); // Stores image URI
    const [description, setDescription] = useState(''); // New state for description input
    const [location, setLocation] = useState(null); // Stores location object
    const [uploading, setUploading] = useState(false); // Loading state for submission

    // --- Permission & Initial Setup Effect ---
    useEffect(() => {
        (async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status !== 'granted') {
                Alert.alert('Permission Required', 'We need camera access to capture proof photos.');
            }
            const locationStatus = await Location.requestForegroundPermissionsAsync();
            if (locationStatus.status !== 'granted') {
                Alert.alert('Permission Required', 'We need access to your location for job proof.');
            }
        })();
    }, []);

    // --- Handlers ---
    const takePicture = async () => {
        // Ensure permissions are granted before launch
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Error', 'Please enable camera permissions in settings.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const getLocation = async () => {
        // Ensure permissions are granted before getting location
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Error', 'Please enable location permissions in settings.');
            return;
        }

        try {
            let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(currentLocation);
            Alert.alert("Location Captured", `Latitude: ${currentLocation.coords.latitude.toFixed(4)}\nLongitude: ${currentLocation.coords.longitude.toFixed(4)}`);
        } catch (e) {
            Alert.alert("Location Error", "Could not get your current location. Please try again.");
            console.error(e);
        }
    }

    // --- Backend Logic: Submit Proof ---
    const handleSubmitProof = async () => {
        if (!jobId) {
            Alert.alert('Error', 'Missing job identifier.');
            return;
        }
        if (!image || !location) {
            Alert.alert('Incomplete Proof', 'Please provide both a photo and the current geolocation.');
            return;
        }

        setUploading(true);
        // NOTE: In a production app, the 'image' URI would be uploaded to Firebase Storage
        // or another service first, and the resulting public URL would be saved below.
        // For this example, we save the local URI as a placeholder.

        const jobRef = doc(db, 'jobs', jobId);
        try {
            await updateDoc(jobRef, {
                status: 'awaiting_approval', // Change job status
                proof: {
                    imageUrl: image, // Placeholder for actual storage URL
                    description: description.trim(), // Save the worker's description
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    timestamp: new Date(),
                    workerId: auth.currentUser.uid, // Record which worker submitted
                },
            });

            setUploading(false);
            Alert.alert('Proof Submitted!', 'The client will be notified to review and approve the job.', [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            setUploading(false);
            Alert.alert('Error', 'Could not submit proof. Please check your network and Firebase rules.');
            console.error("Error submitting proof: ", error);
        }
    };

    // --- Mock Navigation Handlers ---
    const handleSidebarNav = (screenName) => {
        setActiveScreen(screenName);
        // In a real app: navigation.navigate(screenName);
    };


    return (
        <PaperProvider theme={theme}>
            <View style={appStyles.root}>
                {/* --- Sidebar --- */}
                <View style={appStyles.sidebar}>
                    <Text style={appStyles.logoText}>Marketplace</Text>
                    <View style={appStyles.sidebarNav}>
                        <SidebarNavItem icon="home" label="Home" active={activeScreen === 'Home'} onPress={() => handleSidebarNav('Home')}/>
                        <SidebarNavItem icon="briefcase" label="My Jobs" active={activeScreen === 'My Jobs'} onPress={() => handleSidebarNav('My Jobs')}/>
                        <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => handleSidebarNav('Post Job')}/>
                        <SidebarNavItem icon="wallet" label="Wallet" active={activeScreen === 'Wallet'} onPress={() => handleSidebarNav('Wallet')}/>
                        <SidebarNavItem icon="trophy" label="Leaderboard" active={activeScreen === 'Leaderboard'} onPress={() => handleSidebarNav('Leaderboard')}/>
                        <SidebarNavItem icon="user" label="Profile" active={activeScreen === 'Profile'} onPress={() => handleSidebarNav('Profile')}/>
                    </View>
                </View>

                {/* --- Main Content --- */}
                <ScrollView style={appStyles.mainContent} contentContainerStyle={appStyles.scrollContent}>
                    <Title style={appStyles.mainTitle}>Submit Proof of Work</Title>

                    <View style={appStyles.contentArea}>
                        {/* LEFT COLUMN: Proof Photos */}
                        <View style={appStyles.leftColumn}>
                            <View style={appStyles.proofStepContainer}>
                                <Text style={appStyles.proofStepText}>Submit Proof</Text>
                            </View>

                            <TouchableOpacity
                                style={[appStyles.uploadBox, image && appStyles.uploadBoxFilled]}
                                onPress={takePicture}
                                disabled={uploading}
                            >
                                {image ? (
                                    <Image source={{ uri: image }} style={appStyles.fullImage} />
                                ) : (
                                    <>
                                        <Icon name="camera" type="font-awesome" size={30} color={COLORS.primary} />
                                        <Text style={appStyles.uploadBoxText}>Click or Tap to Upload Photos</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <Text style={appStyles.sectionHeader}>Work Evidence Photos</Text>
                            {/* Mock thumbnails matching the image - displays the currently selected image if available */}
                            <View style={appStyles.thumbnailContainer}>
                                {image ? (
                                    <Image source={{ uri: image }} style={appStyles.thumbnailImage} />
                                ) : (
                                    <View style={appStyles.thumbnailPlaceholder}><Icon name="image" type="font-awesome" size={20} color={COLORS.textSecondary} /></View>
                                )}
                                <View style={appStyles.thumbnailPlaceholder}><Icon name="image" type="font-awesome" size={20} color={COLORS.textSecondary} /></View>
                                <View style={appStyles.thumbnailPlaceholder}><Icon name="image" type="font-awesome" size={20} color={COLORS.textSecondary} /></View>
                            </View>
                        </View>

                        {/* RIGHT COLUMN: Description and Location */}
                        <View style={appStyles.rightColumn}>
                            <View style={appStyles.proofStepContainer}>
                                <Text style={appStyles.proofStepText}>Description & Location</Text>
                            </View>

                            <Text style={appStyles.sectionHeader}>Description of Work Performed</Text>
                            <TextInput
                                placeholder="Describe the work done..."
                                value={description}
                                onChangeText={setDescription}
                                style={appStyles.descriptionInput}
                                mode="outlined"
                                multiline
                                numberOfLines={5}
                                disabled={uploading}
                            />

                            <Text style={appStyles.sectionHeader}>Capture Location</Text>
                            <TouchableOpacity
                                style={[appStyles.mapPlaceholder, location && appStyles.mapPlaceholderActive]}
                                onPress={getLocation}
                                disabled={uploading}
                            >
                                <Icon
                                    name={location ? "check-circle" : "map-marker-alt"}
                                    type="font-awesome-5"
                                    size={30}
                                    color={location ? COLORS.success : COLORS.textSecondary}
                                />
                                <Text style={[appStyles.mapText, {color: location ? COLORS.success : COLORS.textSecondary}]}>
                                    {location ? 'Location Captured' : 'Click to Capture Geolocation'}
                                </Text>
                                {location && (
                                    <Text style={appStyles.locationCoords}>
                                        Lat: {location.coords.latitude.toFixed(4)}, Lon: {location.coords.longitude.toFixed(4)}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <Button
                                mode="contained"
                                onPress={handleSubmitProof}
                                style={appStyles.submitButton}
                                labelStyle={appStyles.submitButtonLabel}
                                disabled={!image || !location || uploading}
                            >
                                {uploading ? <ActivityIndicator animating={true} color={COLORS.cardBackground} /> : 'Submit Proof'}
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </PaperProvider>
    );
};


// --- Styles ---
const appStyles = StyleSheet.create({
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
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
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

    // --- Main Content Styles ---
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 40,
    },
    scrollContent: {
        flexGrow: 1,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginBottom: 30,
    },
    contentArea: {
        flexDirection: 'row',
        flex: 1,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 40,
        elevation: 2,
    },
    leftColumn: {
        flex: 0.45,
        paddingRight: 40,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    rightColumn: {
        flex: 0.55,
        paddingLeft: 40,
    },

    // Proof Steps (The orange dots/line)
    proofStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    proofStepText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 8,
    },

    // Upload Box
    uploadBox: {
        height: 150,
        borderWidth: 2,
        borderColor: COLORS.placeholderBorder,
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORS.iconBg,
        overflow: 'hidden',
    },
    uploadBoxFilled: {
        borderStyle: 'solid',
        borderColor: COLORS.primary,
    },
    uploadBoxText: {
        color: COLORS.textSecondary,
        marginTop: 10,
        fontSize: 12,
    },
    fullImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    // Work Evidence Photos (Thumbnails)
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.darkText,
        marginBottom: 10,
    },
    thumbnailContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        justifyContent: 'flex-start',
    },
    thumbnailImage: {
        width: 70,
        height: 70,
        borderRadius: 6,
        marginRight: 10,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    thumbnailPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 6,
        marginRight: 10,
        backgroundColor: COLORS.iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Description Input
    descriptionInput: {
        backgroundColor: COLORS.background,
        marginBottom: 20,
    },

    // Map Placeholder (Geolocation)
    mapPlaceholder: {
        height: 150,
        backgroundColor: COLORS.iconBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderActive: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.primaryLight,
    },
    mapText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    locationCoords: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },

    // Submit Button
    submitButton: {
        marginTop: 40, // Increased margin to push it down
        paddingVertical: 8,
        width: '100%',
        maxWidth: 250,
        backgroundColor: COLORS.confirmButton,
        borderRadius: 6,
        alignSelf: 'flex-start', // Align button to the start of the right column
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.cardBackground,
    }
});

export default SubmitProofScreen;
