import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    TouchableOpacity,
    Alert,
    StatusBar,
    Text,
    TextInput,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from "firebase/firestore";
import { Icon } from 'react-native-elements';

// 1. Define the color palette from the image
const COLORS = {
    background: '#F4F7FC',
    container: '#FFFFFF',
    primary: '#5851DB',
    text: '#333333',
    label: '#555555',
    textSecondary: '#888888',
    inputBg: '#F8F9FA',
    inputBorder: '#E0E0E0',
    roleSelectedBg: 'rgba(88, 81, 219, 0.1)',
    roleSelectedBorder: '#5851DB',
    error: '#D32F2F',
};

// 2. Removed the react-native-paper theme

const SignupScreen = ({ navigation }) => {
    // 3. Adapted state to match the image's form
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('client');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({ fullName: '', email: '', password: '', confirm: '', agree: '' });

    // 4. Validation logic updated for new 'fullName' field
    const validateInputs = () => {
        let valid = true;
        const newErrors = { fullName: '', email: '', password: '', confirm: '', agree: '' };

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
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
            newErrors.agree = 'You must agree to the terms and conditions';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    // 5. Updated handleSignup to use 'fullName'
    const handleSignup = () => {
        if (!validateInputs()) return;

        setLoading(true);
        createUserWithEmailAndPassword(auth, email.trim(), password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: fullName.trim(),
                    email: email.trim(),
                    role: role,
                    walletBalance: role === 'client' ? 1000 : 0,
                    ...(role === 'worker' && { skills: [], reputation: 0, jobsCompleted: 0 })
                });
            })
            .catch((error) => {
                setLoading(false);
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    setErrors({ ...errors, email: 'This email is already registered.' });
                } else {
                    Alert.alert('Signup Error', errorMessage);
                }
            });
    };

    // --- New JSX styled like the image ---
    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.container}>
                        <View style={styles.logoPlaceholder}>
                            <Icon name="infinite" type="ionicon" color={COLORS.primary} size={30} />
                        </View>

                        <Text style={styles.title}>Join Our Community!</Text>

                        <View style={styles.formContainer}>
                            {/* Full Name */}
                            <View style={styles.inputRow}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    // --- STYLE RENAMED ---
                                    style={styles.inputRowField}
                                    placeholder="Guest"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        if (errors.fullName) setErrors({ ...errors, fullName: '' });
                                    }}
                                    editable={!loading}
                                />
                            </View>
                            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

                            {/* Email Address */}
                            <View style={styles.inputRow}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    // --- STYLE RENAMED ---
                                    style={styles.inputRowField}
                                    placeholder="you@example.com"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                            {/* Password Fields Row */}
                            <View style={styles.row}>
                                {/* Password */}
                                <View style={[styles.inputContainer, styles.inputHalf]}>
                                    <Text style={styles.label}>Password</Text>
                                    <TextInput
                                        // --- STYLE RENAMED ---
                                        style={styles.inputField}
                                        placeholder="••••••••"
                                        placeholderTextColor={COLORS.textSecondary}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) setErrors({ ...errors, password: '' });
                                        }}
                                        editable={!loading}
                                    />
                                </View>

                                {/* Confirm Password */}
                                <View style={[styles.inputContainer, styles.inputHalf]}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <TextInput
                                        // --- STYLE RENAMED ---
                                        style={styles.inputField}
                                        placeholder="••••••••"
                                        placeholderTextColor={COLORS.textSecondary}
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (errors.confirm) setErrors({ ...errors, confirm: '' });
                                        }}
                                        editable={!loading}
                                    />
                                </View>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                            {errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}


                            {/* Role Selector */}
                            <Text style={styles.roleTitle}>Select Your Role</Text>
                            <View style={styles.roleContainer}>
                                <TouchableOpacity
                                    style={[styles.roleBox, role === 'client' && styles.roleBoxSelected]}
                                    onPress={() => setRole('client')}
                                    disabled={loading}
                                >
                                    <Icon
                                        name="briefcase"
                                        type="font-awesome-5"
                                        color={role === 'client' ? COLORS.primary : COLORS.textSecondary}
                                        size={24}
                                    />
                                    <Text style={[styles.roleText, role === 'client' && styles.roleTextSelected]}>
                                        Client
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.roleBox, role === 'worker' && styles.roleBoxSelected]}
                                    onPress={() => setRole('worker')}
                                    disabled={loading}
                                >
                                    <Icon
                                        name="cog"
                                        type="font-awesome-5"
                                        color={role === 'worker' ? COLORS.primary : COLORS.textSecondary}
                                        size={24}
                                    />
                                    <Text style={[styles.roleText, role === 'worker' && styles.roleTextSelected]}>
                                        Worker
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Agreement Checkbox */}
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setAgree(!agree);
                                        if (errors.agree) setErrors({...errors, agree: ''});
                                    }}
                                    style={styles.checkboxTouchTarget}
                                    disabled={loading}
                                >
                                    <Icon
                                        name={agree ? 'check-square' : 'square'}
                                        type="font-awesome"
                                        color={agree ? COLORS.primary : COLORS.textSecondary}
                                        size={22}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>I agree to Terms and Conditions</Text>
                            </View>
                            {errors.agree ? <Text style={styles.errorTextCenter}>{errors.agree}</Text> : null}


                            {/* Sign Up Button */}
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                </Text>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.footerLink}>Log in</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// --- Styles updated to fix duplicate key ---
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    container: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: COLORS.container,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    logoPlaceholder: {
        width: 60,
        height: 30,
        alignSelf: 'center',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 5,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.inputBorder,
        paddingBottom: 8,
        marginBottom: 5,
    },
    label: {
        fontSize: 14,
        color: COLORS.label,
        fontWeight: '500',
    },
    // --- RENAMED: This is the first 'input' style ---
    inputRowField: {
        flex: 1,
        textAlign: 'right',
        fontSize: 14,
        color: COLORS.text,
        marginLeft: 16,
        height: 40,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: -6,
    },
    inputHalf: {
        flex: 1,
        marginHorizontal: 6,
        flexDirection: 'column',
        alignItems: 'stretch',
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    // --- RENAMED: This is the second 'input' style ---
    inputField: {
        backgroundColor: COLORS.container,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.inputBorder,
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'left',
        height: 40,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 4,
    },
    errorTextCenter: {
        color: COLORS.error,
        fontSize: 12,
        marginBottom: 10,
        textAlign: 'center',
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
        marginTop: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    roleBox: {
        borderWidth: 2,
        borderColor: COLORS.inputBorder,
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingVertical: 20,
        alignItems: 'center',
        width: '47%',
    },
    roleBoxSelected: {
        borderColor: COLORS.roleSelectedBorder,
        backgroundColor: COLORS.roleSelectedBg,
    },
    roleText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    roleTextSelected: {
        color: COLORS.primary,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        justifyContent: 'center',
    },
    checkboxTouchTarget: {
        padding: 5,
        marginRight: 8,
    },
    checkboxLabel: {
        fontSize: 14,
        color: COLORS.label,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default SignupScreen;