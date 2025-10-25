import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    // Added imports for new UI
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    TouchableOpacity,
    Alert,
    StatusBar
} from 'react-native';
import {
    TextInput,
    Button,
    Title,
    Subheading,
    RadioButton, // Kept this import
    Text,
    // Added imports for new UI
    Provider as PaperProvider,
    DefaultTheme,
    HelperText,
    Checkbox
} from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from "firebase/firestore";
import { Icon } from 'react-native-elements'; // Added

// 1. Define the color palette from refer.jpg
const COLORS = {
    background: '#1F1D2B', // Dark purple background
    primary: '#E91E63', // Bright pink accent
    text: '#FFFFFF',
    textSecondary: '#9A9A9A',
    inputBorder: '#E91E63',
    inputBackground: '#2D2D3A',
};

// 2. Create the dark theme for React Native Paper
const theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        accent: COLORS.primary,
        background: 'transparent',
        surface: COLORS.inputBackground,
        text: COLORS.text,
        placeholder: COLORS.textSecondary,
        onSurface: COLORS.text,
        outline: COLORS.inputBorder,
    },
    roundness: 12,
};

const SignupScreen = ({ navigation }) => {
    // 3. Adapted state to match the refer.jpg form
    const [firstName, setFirstName] = useState(''); // Changed from name
    const [lastName, setLastName] = useState('');   // Added
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Added
    const [role, setRole] = useState('client'); // Kept from original
    const [agree, setAgree] = useState(false); // Added
    const [loading, setLoading] = useState(false); // Added
    const [showPassword, setShowPassword] = useState(false); // Added
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Added
    const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '', agree: '' }); // Updated errors state

    // 4. Validation logic updated for new fields
    const validateInputs = () => {
        let valid = true;
        const newErrors = { name: '', email: '', password: '', confirm: '', agree: '' };

        if (!firstName.trim() || !lastName.trim()) {
            newErrors.name = 'First and Last name are required';
            valid = false;
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            valid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        if (password !== confirmPassword) {
            newErrors.confirm = 'Passwords do not match';
            valid = false;
        }

        if (!agree) {
            newErrors.agree = 'You must agree to the terms';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };


    // --- Your exact handleSignup function (updated for new fields) ---
    const handleSignup = () => {
        if (!validateInputs()) return; // Use new validation

        setLoading(true); // Set loading state
        createUserWithEmailAndPassword(auth, email.trim(), password) // Trim email
            .then(async (userCredential) => {
                const user = userCredential.user;
                // Add user to Firestore using combined first/last name
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: `${firstName.trim()} ${lastName.trim()}`, // Use combined name
                    email: email.trim(), // Use trimmed email
                    role: role,
                    walletBalance: role === 'client' ? 1000 : 0,
                    ...(role === 'worker' && { skills: [], reputation: 0, jobsCompleted: 0 }) // Updated worker fields
                });
                // Navigation should be handled by your auth state listener in AppNavigator/App.js
                // setLoading(false); // Usually not needed if navigating away
            })
            .catch((error) => {
                setLoading(false); // Stop loading on error
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    setErrors({ ...errors, email: 'This email is already registered.' });
                } else {
                    Alert.alert('Signup Error', errorMessage); // Show other errors
                }
            });
    };

    // --- New JSX styled like refer.jpg ---
    return (
        <PaperProvider theme={theme}>
            <StatusBar barStyle="light-content" />
            <View style={styles.root}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Title style={styles.title}>Sign Up</Title>

                        {/* Form Inputs */}
                        <View style={styles.formContainer}>
                            {/* First/Last Name Row */}
                            <View style={styles.row}>
                                <TextInput
                                    label="First Name"
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }}
                                    style={styles.inputHalf}
                                    mode="outlined"
                                    error={!!errors.name}
                                    disabled={loading}
                                />
                                <TextInput
                                    label="Last Name"
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }}
                                    style={styles.inputHalf}
                                    mode="outlined"
                                    error={!!errors.name}
                                    disabled={loading}
                                />
                            </View>
                            <HelperText type="error" visible={!!errors.name} style={styles.helperText}>
                                {errors.name}
                            </HelperText>

                            <TextInput
                                label="Email Address"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                style={styles.input}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                mode="outlined"
                                left={<TextInput.Icon icon="email" color={COLORS.textSecondary} />}
                                error={!!errors.email}
                                disabled={loading}
                            />
                            <HelperText type="error" visible={!!errors.email} style={styles.helperText}>
                                {errors.email}
                            </HelperText>

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                mode="outlined"
                                left={<TextInput.Icon icon="lock" color={COLORS.textSecondary} />}
                                right={
                                    <TextInput.Icon
                                        icon="eye"
                                        color={COLORS.textSecondary}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                error={!!errors.password}
                                disabled={loading}
                            />
                            <HelperText type="error" visible={!!errors.password} style={styles.helperText}>
                                {errors.password}
                            </HelperText>

                            <TextInput
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    if (errors.confirm) setErrors({ ...errors, confirm: '' });
                                }}
                                secureTextEntry={!showConfirmPassword}
                                style={styles.input}
                                mode="outlined"
                                left={<TextInput.Icon icon="lock-check" color={COLORS.textSecondary} />}
                                right={
                                    <TextInput.Icon
                                        icon="eye"
                                        color={COLORS.textSecondary}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                }
                                error={!!errors.confirm}
                                disabled={loading}
                            />
                            <HelperText type="error" visible={!!errors.confirm} style={styles.helperText}>
                                {errors.confirm}
                            </HelperText>

                            {/* Role Selector (Kept from your logic, simple style) */}
                            <Text style={styles.radioLabel}>I am a:</Text>
                            <RadioButton.Group onValueChange={newValue => setRole(newValue)} value={role}>
                                <View style={styles.radioContainer}>
                                    <View style={styles.radioButton}>
                                        <RadioButton value="client" color={COLORS.primary}/>
                                        <Text style={styles.radioText}>Client (I want to hire)</Text>
                                    </View>
                                    <View style={styles.radioButton}>
                                        <RadioButton value="worker" color={COLORS.primary}/>
                                        <Text style={styles.radioText}>Worker (Looking for work)</Text>
                                    </View>
                                </View>
                            </RadioButton.Group>

                            {/* Agreement Checkbox */}
                            <Checkbox.Item
                                label="I Agree with privacy and policy"
                                status={agree ? 'checked' : 'unchecked'}
                                onPress={() => {
                                    setAgree(!agree);
                                    if (errors.agree) setErrors({...errors, agree: ''});
                                }}
                                style={styles.checkboxContainer}
                                labelStyle={styles.checkboxLabel}
                                color={COLORS.primary}
                                uncheckedColor={COLORS.textSecondary}
                            />
                            <HelperText type="error" visible={!!errors.agree} style={styles.helperText}>
                                {errors.agree}
                            </HelperText>

                            {/* Sign Up Button */}
                            <Button
                                mode="contained"
                                onPress={handleSignup}
                                style={styles.button}
                                labelStyle={styles.buttonLabel}
                                loading={loading}
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Button>

                            {/* Login Link */}
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.footerLink}>Sign in</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </PaperProvider>
    );
};

// --- New styles to match refer.jpg and center the form ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center', // Centers vertically
        alignItems: 'center',     // Centers horizontally
    },
    container: {
        width: '100%',
        maxWidth: 450, // Max width of the form on large screens
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // Center content within ScrollView
        padding: 30,
        paddingVertical: 60, // Give more space
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 30,
        alignSelf: 'flex-start',
    },
    formContainer: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16, // Add gap between inputs
    },
    inputHalf: {
        flex: 1,
        backgroundColor: COLORS.inputBackground,
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        marginBottom: 4,
    },
    helperText: {
        marginBottom: 8,
        marginTop: -4, // Adjust spacing
    },
    radioLabel: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginTop: 10,
        marginBottom: 5,
    },
    radioContainer: {
        flexDirection: 'row', // Keep side-by-side
        justifyContent: 'flex-start', // Align left
        marginBottom: 10,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20, // Space between radio buttons
    },
    radioText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 0, // Let RadioButton handle spacing
    },
    checkboxContainer: {
        paddingVertical: 0,
        marginLeft: -12, // Align checkbox better
        marginTop: 10,
    },
    checkboxLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'left', // Ensure text aligns left
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 8,
        marginTop: 20,
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    footerText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default SignupScreen;
