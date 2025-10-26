import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';

// --- COLORS ---
// This palette EXACTLY matches the picture
const COLORS = {
    background: '#F8F9FC',     // Light gray background from the picture
    cardBackground: '#FFFFFF', // White for the cards as in the picture
    text: '#1A202C',           // Very dark text for titles
    textSecondary: '#6B7085',  // Medium gray for subtitles
    primary: '#7F56D9',        // Purple for Client card text & icon
    primaryLight: '#F9F5FF',   // Light purple background for Client icon
    orange: '#F79009',         // Orange for Worker card text & icon
    orangeLight: '#FFFBEB',    // Light yellow-orange background for Worker icon
    white: '#FFFFFF',          // Standard white
    logoPurple: '#7F56D9',     // Main logo purple
    logoOrange: '#F79909',     // Main logo orange
    borderColor: '#EAECF0',    // Very light border/shadow color for cards
};

const RoleSelectionLoginScreen = ({ navigation }) => {

    // Navigate directly on role selection
    const handleSelectRole = (roleValue) => {
        navigation.navigate('Login', { selectedRole: roleValue });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Content Container - holds everything centered */}
            <View style={styles.contentWrapper}>

                {/* Logo - Recreated for pixel-perfect match */}
                <View style={styles.logoContainer}>
                    {/* Outer orange ring */}
                    <Icon name="circle" type="font-awesome-5" color={COLORS.logoOrange} size={32} solid style={styles.logoOuter} />
                    {/* Inner purple ring */}
                    <Icon name="circle" type="font-awesome-5" color={COLORS.logoPurple} size={32} solid style={styles.logoInner} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Join as a Client or a Worker</Text>

                {/* Option Cards */}
                <View style={styles.optionsContainer}>
                    {/* Client Card */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleSelectRole('client')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.optionContent}>
                            {/* Icon Background View */}
                            <View style={[styles.iconBackground, styles.clientIconBg]}>
                                <Icon name="briefcase" type="font-awesome-5" color={COLORS.primary} size={28} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, styles.clientTitle]}>Client</Text>
                                <Text style={styles.optionSubtitle}>Find talent & get projects done</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Worker Card */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleSelectRole('worker')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.optionContent}>
                            {/* Icon Background View */}
                            <View style={[styles.iconBackground, styles.workerIconBg]}>
                                <Icon name="cogs" type="font-awesome-5" color={COLORS.orange} size={28} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, styles.workerTitle]}>Worker</Text>
                                <Text style={styles.optionSubtitle}>Find work & grow your career</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Set to the light gray from the picture
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    contentWrapper: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: COLORS.cardBackground, // White background for the main content area
        borderRadius: 16,
        padding: Platform.OS === 'web' ? 40 : 32,
        alignItems: 'center',
        shadowColor: 'rgba(0,0,0,0.05)', // Subtle shadow matching the picture
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5, // Android shadow
        position: 'relative',
    },
    logoContainer: {
        width: 52,
        height: 32,
        marginBottom: 32,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInner: { // Purple ring
        position: 'absolute',
        left: 0,
        top: 0,
    },
    logoOuter: { // Orange ring
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 40,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        maxWidth: 380,
    },
    optionCard: {
        width: '100%',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        backgroundColor: COLORS.cardBackground,
        shadowColor: 'rgba(0,0,0,0.05)', // Subtle shadow matching the picture
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 2, // Android shadow
        borderWidth: 1,
        borderColor: COLORS.borderColor, // Very light border to mimic separation
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBackground: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    clientIconBg: {
        backgroundColor: COLORS.primaryLight,
    },
    workerIconBg: {
        backgroundColor: COLORS.orangeLight,
    },
    optionTextContainer: {
        flex: 1,
    },
    // --- THIS IS THE FIX ---
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    clientTitle: {
        color: COLORS.primary,
    },
    workerTitle: {
        color: COLORS.orange,
    },
    optionSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});

export default RoleSelectionLoginScreen;

