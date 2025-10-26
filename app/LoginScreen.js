import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    // Image, // Logo is still commented out to prevent crashing
    Text,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import {
    Button,
    HelperText,
    TextInput,
    Provider as PaperProvider,
    DefaultTheme,
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { auth } from '../firebaseConfig';

// --- Color Palette Based on Image ---
const LIGHT_COLORS = {
    background: '#FFFFFF',
    primary: '#7B68EE', // A purple matching the image
    text: '#333333',
    textSecondary: '#888888',
    inputBackground: '#F5F5F5',
    inputBorder: '#E0E0E0',
    white: '#FFFFFF',
    google: '#DB4437', // Google's brand red
    facebook: '#4267B2', // Facebook's brand blue
};

// --- Light Theme for React Native Paper ---
const theme = {
    ...DefaultTheme,
    dark: false, // Use light mode
    colors: {
        ...DefaultTheme.colors,
        primary: LIGHT_COLORS.primary,
        accent: LIGHT_COLORS.primary,
        background: LIGHT_COLORS.background,
        surface: LIGHT_COLORS.inputBackground, // Background for 'filled' TextInput
        text: LIGHT_COLORS.text,
        placeholder: LIGHT_COLORS.textSecondary,
        onSurface: LIGHT_COLORS.text,
        outline: 'transparent', // No border for 'filled' mode
    },
    roundness: 10, // Rounded corners for inputs
};

const LoginScreen = ({ navigation }) => {
    // --- State ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });

    // --- Validation and Login Logic (Unchanged) ---
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateInputs = () => {
        let valid = true;
        const newErrors = { email: '', password: '' };
        if (!email.trim()) { newErrors.email = 'Email is required'; valid = false; }
        else if (!validateEmail(email)) { newErrors.email = 'Please enter a valid email'; valid = false; }
        if (!password) { newErrors.password = 'Password is required'; valid = false; }
        else if (password.length < 6) { newErrors.password = 'Password must be at least 6 characters'; valid = false; }
        setErrors(newErrors);
        return valid;
    };

    const handleLogin = async () => {
        if (!validateInputs()) return;
        try {
            setLoading(true);
            setErrors({ email: '', password: '' });
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            // Successful login, navigation will be handled by your auth listener
        } catch (error) {
            setLoading(false);
            let errorMessage = 'Login failed. Please try again.';
            switch (error.code) {
                case 'auth/user-not-found': errorMessage = 'No account found with this email.'; setErrors({ ...errors, email: errorMessage }); break;
                case 'auth/wrong-password': errorMessage = 'Incorrect password.'; setErrors({ ...errors, password: errorMessage }); break;
                case 'auth/invalid-email': errorMessage = 'Invalid email address.'; setErrors({ ...errors, email: errorMessage }); break;
                default: Alert.alert('Login Error', errorMessage);
            }
        }
    };

    // --- Render Login Form ---
    return (
        <PaperProvider theme={theme}>
            <StatusBar barStyle="dark-content" backgroundColor={LIGHT_COLORS.background} />

            {/* --- NEW: Root container to center content --- */}
            <View style={styles.root}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* --- NEW: Back Button --- */}
                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" type="font-awesome-5" color={LIGHT_COLORS.textSecondary} size={20} />
                    </TouchableOpacity>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* --- Logo (Still Commented) --- */}
                        {/*
                        <Image
                            source={require('../assets/logo_placeholder.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        */}

                        {/* --- Title & Subtitle --- */}
                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Login to your account</Text>

                        {/* --- Input Fields --- */}
                        <View style={styles.formContainer}>
                            <TextInput
                                label="Email Address"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                style={styles.input}
                                mode="filled"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                error={!!errors.email}
                                disabled={loading}
                                accessibilityLabel="Email Address Input"
                            />
                            {errors.email ? (
                                <HelperText type="error" visible={!!errors.email} style={styles.helperText}>
                                    {errors.email}
                                </HelperText>
                            ) : null}

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                mode="filled"
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        color={LIGHT_COLORS.textSecondary}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                error={!!errors.password}
                                disabled={loading}
                                accessibilityLabel="Password Input"
                            />
                            {errors.password ? (
                                <HelperText type="error" visible={!!errors.password} style={styles.helperText}>
                                    {errors.password}
                                </HelperText>
                            ) : null}

                            {/* --- Forgot Password --- */}
                            <TouchableOpacity
                                onPress={() => Alert.alert('Forgot Password', 'Password reset flow not implemented.')}
                                style={styles.forgotContainer}
                            >
                                <Text style={styles.forgotLink}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* --- Login Button --- */}
                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                style={styles.button}
                                labelStyle={styles.buttonLabel}
                                loading={loading}
                                disabled={loading}
                                accessibilityLabel="Login Button"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>

                            {/* --- Social Login Prompt --- */}
                            <Text style={styles.socialPrompt}>Or login with</Text>

                            {/* --- Social Icons --- */}
                            <View style={styles.socialRow}>
                                <TouchableOpacity style={styles.socialButton} accessibilityLabel="Login with Google">
                                    <Icon name="google" type="font-awesome-5" color={LIGHT_COLORS.google} size={22} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton} accessibilityLabel="Login with Facebook">
                                    <Icon name="facebook-f" type="font-awesome-5" color={LIGHT_COLORS.facebook} size={22} />
                                </TouchableOpacity>
                            </View>

                            {/* --- Sign Up Link --- */}
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
                                    <Text style={styles.footerLink}>Signup</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </PaperProvider>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    // NEW: Root style to center the container
    root: {
        flex: 1,
        backgroundColor: LIGHT_COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // UPDATED: Container now has a max width
    container: {
        flex: 1,
        width: '100%',
        maxWidth: 450, // This centers the content on larger screens (web/tablet)
        backgroundColor: LIGHT_COLORS.background,
    },
    // NEW: Back button style
    goBackButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40, // Adjust for status bar
        left: 20,
        zIndex: 10, // Ensure it's on top of other content
        padding: 10, // Makes it easier to tap
    },
    // UPDATED: Scroll content needs padding at the top
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 30,
        paddingTop: 80, // Adds space so content doesn't start under the back button
    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: LIGHT_COLORS.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: LIGHT_COLORS.inputBackground,
        marginBottom: 10,
    },
    helperText: {
        marginBottom: 10,
        marginTop: -10,
        paddingHorizontal: 5,
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotLink: {
        fontSize: 14,
        color: LIGHT_COLORS.primary,
    },
    button: {
        backgroundColor: LIGHT_COLORS.primary,
        borderRadius: 10,
        paddingVertical: 8,
        marginTop: 10,
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LIGHT_COLORS.white,
    },
    socialPrompt: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        marginVertical: 30,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 40,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25, // Circular
        backgroundColor: LIGHT_COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.inputBorder,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
    },
    footerLink: {
        fontSize: 16,
        color: LIGHT_COLORS.primary,
        fontWeight: 'bold',
    },
});

export default LoginScreen;