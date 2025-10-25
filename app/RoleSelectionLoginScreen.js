import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import {
    Button,
    Provider as PaperProvider,
    DefaultTheme,
    Card,
    Title,
    Subheading,
    Divider,
} from 'react-native-paper';
import { Icon } from 'react-native-elements';

// --- COLORS ---
const COLORS = {
    background: '#F4F6FA',
    cardBackground: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#005CA9', // FNB-style blue
    primaryLight: '#E0F2FE',
    border: '#CBD5E1',
    white: '#FFFFFF',
    hover: '#F1F5F9',
};

// --- THEME ---
const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        accent: COLORS.primary,
        background: COLORS.cardBackground,
        surface: COLORS.cardBackground,
        text: COLORS.text,
        placeholder: COLORS.textSecondary,
    },
    roundness: 10,
};

const RoleSelectionLoginScreen = ({ navigation }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const roleOptions = [
        { label: 'Client (I want to hire)', value: 'client', icon: 'user-tie' },
        { label: 'Worker (I’m looking for work)', value: 'worker', icon: 'hard-hat' },
    ];

    const handleContinue = () => {
        if (!selectedRole) {
            Alert.alert('Selection Required', 'Please select your role.');
            return;
        }
        navigation.navigate('Login', { selectedRole });
    };

    const handleSelectRole = (roleValue) => {
        setSelectedRole(roleValue);
        setIsDropdownVisible(false);
    };

    const selectedRoleLabel =
        roleOptions.find((option) => option.value === selectedRole)?.label ||
        'Select your role...';

    return (
        <PaperProvider theme={theme}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Card.Content style={styles.content}>
                        <View style={styles.logoContainer}>
                            <View style={[styles.logoBackground, { backgroundColor: COLORS.primaryLight }]}>
                                <Icon name="briefcase" type="font-awesome-5" color={COLORS.primary} size={30} />
                            </View>
                        </View>

                        <Title style={styles.title}>Login to GIG Connect</Title>
                        <Subheading style={styles.subtitle}>
                            Please select your role to continue
                        </Subheading>

                        {/* Dropdown */}
                        <View style={styles.dropdownWrapper}>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setIsDropdownVisible(!isDropdownVisible)}
                            >
                                <Text
                                    style={[
                                        styles.dropdownText,
                                        !selectedRole && { color: COLORS.textSecondary },
                                    ]}
                                >
                                    {selectedRoleLabel}
                                </Text>
                                <Icon
                                    name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
                                    type="font-awesome-5"
                                    color={COLORS.textSecondary}
                                    size={16}
                                />
                            </TouchableOpacity>

                            {isDropdownVisible && (
                                <View style={styles.dropdownMenu}>
                                    {roleOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.dropdownItem,
                                                selectedRole === option.value && {
                                                    backgroundColor: COLORS.primaryLight,
                                                },
                                            ]}
                                            onPress={() => handleSelectRole(option.value)}
                                        >
                                            <Icon
                                                name={option.icon}
                                                type="font-awesome-5"
                                                color={
                                                    selectedRole === option.value
                                                        ? COLORS.primary
                                                        : COLORS.textSecondary
                                                }
                                                size={18}
                                                style={{ marginRight: 12 }}
                                            />
                                            <Text
                                                style={[
                                                    styles.dropdownItemText,
                                                    selectedRole === option.value && { color: COLORS.primary },
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                            {selectedRole === option.value && (
                                                <Icon
                                                    name="check"
                                                    type="font-awesome-5"
                                                    color={COLORS.primary}
                                                    size={14}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Continue Button */}
                        <Button
                            mode="contained"
                            onPress={handleContinue}
                            style={styles.continueButton}
                            labelStyle={styles.continueLabel}
                            disabled={!selectedRole || loading}
                            loading={loading}
                        >
                            {loading ? 'Loading...' : 'Continue'}
                        </Button>

                        <Divider style={styles.divider} />

                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.link}>Register New Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert('Password Reset', 'Password reset feature coming soon.')
                            }
                        >
                            <Text style={styles.link}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </Card.Content>
                </Card>
            </View>
        </PaperProvider>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 16,
        backgroundColor: COLORS.cardBackground,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 36,
        alignItems: 'center',
    },
    logoContainer: { marginBottom: 24, alignItems: 'center' },
    logoBackground: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 28,
        textAlign: 'center',
    },
    dropdownWrapper: {
        width: '100%',
        marginBottom: 30,
        position: 'relative',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: COLORS.white,
    },
    dropdownText: {
        fontSize: 16,
        color: COLORS.text,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 58,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 5,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dropdownItemText: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        width: '100%',
        paddingVertical: 8,
    },
    continueLabel: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 28,
        backgroundColor: COLORS.border,
        width: '100%',
    },
    link: {
        color: COLORS.primary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '600',
    },
});

export default RoleSelectionLoginScreen;
