import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    Image,
    Text,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import {
    Button,
    HelperText,
    TextInput,
    Title,
    Provider as PaperProvider,
    DefaultTheme,
    Checkbox
} from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { auth } from '../firebaseConfig';

// Color palette from refer.jpg
const COLORS = {
    background: '#1F1D2B',
    primary: '#E91E63',
    text: '#FFFFFF',
    textSecondary: '#9A9A9A',
    inputBorder: '#E91E63',
    inputBackground: '#2D2D3A',
};

// Dark theme
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

const LoginScreen = ({ navigation }) => {
    // --- State ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [roleSelection, setRoleSelection] = useState(null); // 'client', 'worker', or null

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
            // The roleSelection state is just for UI flow before login.
            // Firebase auth determines the actual user.
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            // Post-login navigation should ideally happen based on the user's
            // role fetched from Firestore in your AppNavigator/auth listener.
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

    // --- Render Role Selection View ---
    const renderRoleSelection = () => (
        <View style={styles.roleSelectionContainer}>
            <Title style={styles.roleTitle}>Log In As</Title>
            <TouchableOpacity
                style={styles.roleButton}
                onPress={() => setRoleSelection('client')}
                disabled={loading}
            >
                <Icon name="user-tie" type="font-awesome-5" color={COLORS.primary} size={40} />
                <Text style={styles.roleButtonText}>Client</Text>
                <Text style={styles.roleButtonSubtitle}>(I want to hire)</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.roleButton}
                onPress={() => setRoleSelection('worker')}
                disabled={loading}
            >
                <Icon name="hard-hat" type="font-awesome-5" color={COLORS.primary} size={40} />
                <Text style={styles.roleButtonText}>Worker</Text>
                <Text style={styles.roleButtonSubtitle}>(I'm looking for work)</Text>
            </TouchableOpacity>
            {/* Optional: Add Signup link here too if desired */}
            <View style={styles.footerContainerAlt}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
                    <Text style={styles.footerLink}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- Render Login Form View ---
    const renderLoginForm = () => (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* Go Back Button */}
            <TouchableOpacity style={styles.goBackButton} onPress={() => setRoleSelection(null)}>
                <Icon name="arrow-left" type="font-awesome-5" color={COLORS.textSecondary} size={16} />
                <Text style={styles.goBackText}>Choose Role</Text>
            </TouchableOpacity>

            <Title style={styles.title}>Log In as {roleSelection === 'client' ? 'Client' : 'Worker'}</Title>

            {/* Input Fields */}
            <View style={styles.formContainer}>
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    left={<TextInput.Icon icon="account" color={COLORS.textSecondary} />}
                    error={!!errors.email}
                    disabled={loading}
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
                {errors.password ? (
                    <HelperText type="error" visible={!!errors.password} style={styles.helperText}>
                        {errors.password}
                    </HelperText>
                ) : null}

                {/* Options Row */}
                <View style={styles.optionsRow}>
                    <Checkbox.Item
                        label="Remember me"
                        status={rememberMe ? 'checked' : 'unchecked'}
                        onPress={() => setRememberMe(!rememberMe)}
                        style={styles.checkboxContainer}
                        labelStyle={styles.checkboxLabel}
                        color={COLORS.primary}
                        uncheckedColor={COLORS.textSecondary}
                    />
                    <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon.')}>
                        <Text style={styles.forgotLink}>Forgot Password</Text>
                    </TouchableOpacity>
                </View>

                {/* Login Button */}
                <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    loading={loading}
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </Button>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or Sign in with</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Icons */}
                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialButton}>
                        <Icon name="facebook-f" type="font-awesome-5" color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Icon name="twitter" type="font-awesome-5" color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Icon name="google" type="font-awesome-5" color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Icon name="instagram" type="font-awesome-5" color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                </View>

                {/* Sign Up Link */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
                        <Text style={styles.footerLink}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <PaperProvider theme={theme}>
            <StatusBar barStyle="light-content" />
            <View style={styles.root}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Conditionally render Role Selection or Login Form */}
                    {roleSelection === null ? renderRoleSelection() : renderLoginForm()}
                </KeyboardAvoidingView>
            </View>
        </PaperProvider>
    );
};

// Styles (includes new styles for role selection)
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: 450,
        height: '100%',
        justifyContent: 'center', // Center content vertically for role selection
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 30,
    },
    // --- Role Selection Styles ---
    roleSelectionContainer: {
        padding: 30,
        alignItems: 'center', // Center items horizontally
    },
    roleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 40,
        textAlign: 'center',
    },
    roleButton: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        paddingVertical: 30,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    roleButtonText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 15,
    },
    roleButtonSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    footerContainerAlt: { // Style for signup link in role selection
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40, // More space after buttons
    },
    // --- Login Form Styles ---
    goBackButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40, // Adjust top position
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        zIndex: 1, // Ensure it's tappable
    },
    goBackText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 30,
        marginTop: 60, // Add margin to push title down from potential status bar overlap
        alignSelf: 'flex-start',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        marginBottom: 10,
    },
    helperText: {
        marginBottom: 10,
        marginTop: -10,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxContainer: {
        padding: 0,
        marginLeft: -12,
    },
    checkboxLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    forgotLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.textSecondary,
    },
    dividerText: {
        marginHorizontal: 10,
        color: COLORS.textSecondary,
        fontSize: 14,
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
        borderRadius: 12,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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

export default LoginScreen;

