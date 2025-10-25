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
    KeyboardAvoidingView
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
    TextInput,
    HelperText
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { db, auth } from '../firebaseConfig';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';


const COLORS = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#F97316',
    primaryLight: '#FFF7ED',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    star: '#FBBF24',
    online: '#10B981',
    error: '#EF4444',
};


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
        error: COLORS.error,
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
    const [activeScreen, setActiveScreen] = useState('Post Job');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '', avatarInitial: '', uid: null });

    const [jobTitle, setJobTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [skills, setSkills] = useState('');
    const [category, setCategory] = useState('');
    const [jobType, setJobType] = useState('Full-time');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);


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
                            uid: user.uid,
                            name: userData.name || 'User',
                            email: userData.email || '',
                            avatarInitial: userData.name ? userData.name.charAt(0).toUpperCase() : 'U'
                        });

                        if (userData.role !== 'client') {
                            Alert.alert("Access Denied", "Only clients can post jobs.");
                            navigation.navigate('Home');
                        }
                    } else {
                        console.log("No such user document!");
                        setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                        navigation.navigate('Login');
                    }
                } else {
                    console.log("No user logged in");
                    setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                    navigation.navigate('Login');
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                setCurrentUser({ uid: null, name: 'User', email: '', avatarInitial: 'U' });
                navigation.navigate('Login');
            }
        };

        fetchUserData();
    }, [navigation]);


    const validateForm = () => {
        const newErrors = {};
        if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
        if (!description.trim()) newErrors.description = 'Description is required';
        if (!location.trim()) newErrors.location = 'Location is required';
        if (!price.trim() || isNaN(price) || parseFloat(price) <= 0) newErrors.price = 'Valid price is required';
        if (!category.trim()) newErrors.category = 'Category is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handlePostJob = async () => {
        if (!validateForm()) return;

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
                skills: skills.split(',').map(s => s.trim()).filter(s => s),
                category: category.trim(),
                jobType: jobType.trim(),
                clientId: currentUser.uid,
                clientName: currentUser.name,
                postedDate: serverTimestamp(),
                status: 'open',
            });

            Alert.alert("Success", "Job posted successfully!");

            setJobTitle('');
            setDescription('');
            setLocation('');
            setPrice('');
            setSkills('');
            setCategory('');
            setJobType('Full-time');
            setErrors({});
            navigation.navigate('Home');

        } catch (error) {
            console.error("Error posting job: ", error);
            Alert.alert("Error", "Could not post job. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    const handleSidebarNav = (screenName) => {
        setActiveScreen(screenName);
        let targetScreen = 'Home';
        if (screenName === 'My Jobs') targetScreen = 'MyJobs';
        else if (screenName === 'Profile') targetScreen = 'Profile';
        else if (screenName === 'Post Job') return;
        navigation.navigate(targetScreen);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out successfully');

        } catch (error) {
            console.error("Error signing out: ", error);
            Alert.alert('Error', 'Could not sign out.');
        }
    };


    return (
        <PaperProvider theme={theme}>
            <View style={styles.root}>

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
                        <SidebarNavItem icon="plus-circle" label="Post Job" active={activeScreen === 'Post Job'} onPress={() => { }}/>
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


                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView style={styles.mainContent}>

                        <View style={styles.mainHeader}>

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


                        <View style={styles.formGrid}>
                            <Card style={styles.formCard}>
                                <Card.Content>
                                    <Subheading style={styles.formSectionTitle}>Job Details</Subheading>


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


                                    <TextInput
                                        mode="outlined"
                                        label="Price/Budget (R)"
                                        value={price}
                                        onChangeText={setPrice}
                                        style={styles.input}
                                        keyboardType="numeric"
                                        left={<TextInput.Icon icon="currency-usd" color={COLORS.textSecondary}/>}
                                        error={!!errors.price}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.price}>{errors.price}</HelperText>


                                    <TextInput
                                        mode="outlined"
                                        label="Required Skills (comma-separated)"
                                        value={skills}
                                        onChangeText={setSkills}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="tools" color={COLORS.textSecondary}/>}
                                        error={!!errors.skills}
                                        disabled={loading}
                                    />
                                    <HelperText type="info">e.g., Plumbing, Wiring, Painting</HelperText>


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


                                    <TextInput
                                        mode="outlined"
                                        label="Job Type"
                                        placeholder="e.g., Full-time, Part-time, Contract, Once-off"
                                        value={jobType}
                                        onChangeText={setJobType}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="clock-time-four-outline" color={COLORS.textSecondary}/>}
                                        error={!!errors.jobType}
                                        disabled={loading}
                                    />
                                    <HelperText type="error" visible={!!errors.jobType}>{errors.jobType}</HelperText>


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


const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.background,
    },

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
    formGrid: {
        padding: 30,
    },

    formCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 30,
    },
    formSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.cardBackground,
        marginBottom: 0,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        marginBottom: 16,
        marginTop: 4,
        fontSize: 12,
        color: COLORS.textSecondary,

    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        paddingVertical: 8,
        marginTop: 24,
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },


});

export default PostJobScreen;

