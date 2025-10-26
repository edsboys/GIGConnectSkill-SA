import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform // --- ADD THIS IMPORT ---
} from 'react-native';
import { Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';


// Define your color palette based on the screenshots
const COLORS = {
    primary: '#7F56D9', // Main purple
    primaryLight: '#F9F5FF', // Light purple background
    white: '#FFFFFF',
    black: '#101828', // Dark text
    gray: '#667085', // Lighter text
    lightGray: '#EAECF0', // Borders
    footerBlack: '#101828', // Dark footer background
};

const LandingScreen = ({ navigation }) => {
    // State for active navigation tab
    const [activeTab, setActiveTab] = useState('Home');


    // Helper component for navigation links
    const NavItem = ({ title }) => (
        <TouchableOpacity onPress={() => setActiveTab(title)}>
            <Text style={[styles.navLink, activeTab === title && styles.navLinkActive]}>
                {title}
            </Text>
            {activeTab === title && <View style={styles.navIndicator} />}
        </TouchableOpacity>
    );

    // Helper component for stat items
    const StatItem = ({ icon, number, label }) => (
        <View style={styles.statItem}>
            <Icon name={icon} type="font-awesome-5" color={COLORS.primary} size={24} containerStyle={styles.statIcon} />
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    // Helper component for placeholder content sections
    const PlaceholderSection = ({ preTitle, title, subtitle, iconName }) => (
        <View style={styles.section}>
            <Text style={styles.sectionPreTitle}>{preTitle}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            <View style={styles.placeholderBox}>
                <Icon name={iconName} type="font-awesome-5" color={COLORS.primary} size={32} containerStyle={styles.placeholderIconBg} />
                <Text style={styles.placeholderTitle}>{title.startsWith('Available') ? 'Find Your Perfect Job' : title}</Text>
                <Text style={styles.placeholderText}>
                    {iconName === 'search'
                        ? 'Browse through thousands of verified job opportunities that match your skills and experience.'
                        : iconName === 'briefcase'
                            ? 'Reach thousands of skilled workers and find the perfect match for your project.'
                            : 'Track your earnings, manage withdrawals, and view transaction history.'
                    }
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Icon name="briefcase" type="font-awesome-5" color={COLORS.primary} size={24} style={styles.logoIcon} />
                    <Text style={styles.logoText}>GIG Connect</Text>
                </View>
                <View style={styles.navLinks}>
                    <NavItem title="Home" />
                    <NavItem title="Find Jobs" />
                    <NavItem title="Post Jobs" />
                    <NavItem title="Wallet" />
                    <NavItem title="Leaderboard" />
                </View>
                <View style={styles.authButtons}>
                    <TouchableOpacity
                        style={styles.logInButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.logInText}>Log In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.signUpText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroTextContainer}>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>Trusted by 10,000+ Workers</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        Empowering South Africa's <Text style={{ color: COLORS.primary }}>Informal Workers</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Connect with clients, get verified, and receive secure digital payments. Join the platform that's transforming the gig economy.
                    </Text>
                    <View style={styles.heroButtonContainer}>
                        <TouchableOpacity
                            style={styles.heroPrimaryButton}
                            onPress={() => navigation.navigate('Signup')}
                        >
                            <Text style={styles.heroPrimaryButtonText}>Get Started Free</Text>
                            <Icon name="arrow-right" type="font-awesome-5" color={COLORS.white} size={14} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.heroSecondaryButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.heroSecondaryButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.trustBadges}>
                        <View style={styles.trustBadge}>
                            <Icon name="check-circle" type="font-awesome-5" color={COLORS.primary} size={16} />
                            <Text style={styles.trustBadgeText}>Verified Workers</Text>
                        </View>
                        <View style={styles.trustBadge}>
                            <Icon name="check-circle" type="font-awesome-5" color={COLORS.primary} size={16} />
                            <Text style={styles.trustBadgeText}>Secure Platform</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.heroImageContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D' }} // Replace with a more fitting image if you have one
                        style={styles.heroImage}
                    />
                </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                <StatItem icon="users" number="2.9M" label="Informal Workers in SA" />
                <StatItem icon="shopping-bag" number="18%" label="Of Total Employment" />
                <StatItem icon="mobile-alt" number="25%" label="Use Digital Platforms" />
                <StatItem icon="coins" number="R3,500–R5,000" label="Average Monthly Income" />
            </View>


            {/* Find Jobs Section */}
            <PlaceholderSection
                preTitle="FIND OPPORTUNITIES"
                title="Available Jobs"
                subtitle="Browse through hundreds of verified job opportunities"
                iconName="search"
            />

            {/* Post Jobs Section */}
            <PlaceholderSection
                preTitle="HIRE TALENT"
                title="Post a Job"
                subtitle="Find the perfect candidate for your project or business needs"
                iconName="briefcase"
            />

            {/* Wallet Section */}
            <PlaceholderSection
                preTitle="FINANCES"
                title="Your Wallet"
                subtitle="Manage your earnings and payments securely"
                iconName="wallet"
            />

            {/* CTA Section */}
            <LinearGradient
                colors={[COLORS.primary, '#6941C6']} // A nice purple gradient
                style={styles.ctaSection}
            >
                <Text style={styles.ctaPreTitle}>READY TO START?</Text>
                <Text style={styles.ctaTitle}>Join South Africa's Fastest Growing Gig Platform</Text>
                <Text style={styles.ctaSubtitle}>
                    Thousands of workers and businesses trust GIG Connect for secure, reliable, and professional gig services.
                </Text>
                <View style={styles.ctaButtonContainer}>
                    <TouchableOpacity style={styles.ctaPrimaryButton}>
                        <Text style={styles.ctaPrimaryButtonText}>Start Free Trial</Text>
                        <Icon name="rocket" type="font-awesome-5" color={COLORS.primary} size={14} />
                    </TouchableOpacity>
                    {/* You can add a secondary button here if needed */}
                </View>
                <Text style={styles.ctaFooterText}>No credit card required • 30-day free trial</Text>
            </LinearGradient>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerTop}>
                    <View style={styles.footerBrand}>
                        <View style={styles.logoContainer}>
                            <Icon name="briefcase" type="font-awesome-5" color={COLORS.primary} size={24} style={styles.logoIcon} />
                            <Text style={[styles.logoText, { color: COLORS.white }]}>GIG Connect</Text>
                        </View>
                        <Text style={styles.footerTagline}>Empowering South Africa's workforce through innovation and technology.</Text>
                        <View style={styles.socialIcons}>
                            <Icon name="twitter" type="font-awesome-5" color={COLORS.gray} size={20} />
                            <Icon name="linkedin" type="font-awesome-5" color={COLORS.gray} size={20} />
                            <Icon name="facebook" type="font-awesome-5" color={COLORS.gray} size={20} />
                            <Icon name="instagram" type="font-awesome-5" color={COLORS.gray} size={20} />
                        </View>
                    </View>
                    <View style={styles.footerLinksContainer}>
                        <View style={styles.footerLinkColumn}>
                            <Text style={styles.footerLinkTitle}>Platform</Text>
                            <Text style={styles.footerLink}>Find Work</Text>
                            <Text style={styles.footerLink}>Post Jobs</Text>
                            <Text style={styles.footerLink}>How It Works</Text>
                            <Text style={styles.footerLink}>Pricing</Text>
                        </View>
                        <View style={styles.footerLinkColumn}>
                            <Text style={styles.footerLinkTitle}>Company</Text>
                            <Text style={styles.footerLink}>About Us</Text>
                            <Text style={styles.footerLink}>Careers</Text>
                            <Text style={styles.footerLink}>Press</Text>
                            <Text style={styles.footerLink}>Partners</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.footerBottom}>
                    <Text style={styles.footerCopy}>© 2024 GIG Connect. All rights reserved.</Text>
                    <View style={styles.footerLegalLinks}>
                        <Text style={styles.footerLegalLink}>Privacy Policy</Text>
                        <Text style={styles.footerLegalLink}>Terms of Service</Text>
                        <Text style={styles.footerLegalLink}>Cookie Policy</Text>
                    </View>
                </View>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // --- THIS IS THE MODIFIED STYLE ---
    container: {
        backgroundColor: COLORS.white,
        ...(Platform.OS === 'web' ? {
            height: '100vh' // Use 100% of viewport height for web
        } : {
            flex: 1 // Use flex: 1 for mobile
        })
    },
    // --- END OF MODIFIED STYLE ---

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 40, // More padding for web-like feel
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        marginRight: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    navLinks: {
        flexDirection: 'row',
        gap: 32,
    },
    navLink: {
        fontSize: 16,
        color: COLORS.gray,
        fontWeight: '500',
    },
    navLinkActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    navIndicator: {
        height: 2,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    authButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logInButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    logInText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray,
    },
    signUpButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    signUpText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Hero Section
    heroSection: {
        flexDirection: 'row',
        paddingHorizontal: 40,
        paddingVertical: 80,
        alignItems: 'center',
        backgroundColor: '#FDFBFF', // Very light purple/white
    },
    heroTextContainer: {
        flex: 1,
        paddingRight: 40,
    },
    heroBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    heroBadgeText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    heroTitle: {
        fontSize: 48, // Large title
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 20,
        lineHeight: 60,
    },
    heroSubtitle: {
        fontSize: 18,
        color: COLORS.gray,
        lineHeight: 28,
        marginBottom: 32,
    },
    heroButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    heroPrimaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroPrimaryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    heroSecondaryButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    heroSecondaryButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: '600',
    },
    trustBadges: {
        flexDirection: 'row',
        gap: 24,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustBadgeText: {
        color: COLORS.gray,
        fontWeight: '500',
    },
    heroImageContainer: {
        flex: 0.8,
    },
    heroImage: {
        width: '100%',
        height: 400,
        borderRadius: 16,
    },
    // Stats Section
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 60,
        paddingHorizontal: 40,
        backgroundColor: COLORS.white,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        marginBottom: 16,
    },
    statNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        color: COLORS.gray,
    },
    // Placeholder Section
    section: {
        paddingVertical: 80,
        paddingHorizontal: 40,
        alignItems: 'center',
        backgroundColor: '#FDFBFF', // Match hero light bg
    },
    sectionPreTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 18,
        color: COLORS.gray,
        marginBottom: 40,
        textAlign: 'center',
        maxWidth: 600,
    },
    placeholderBox: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        width: '60%', // Make the box narrower
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    placeholderIconBg: {
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 50,
        marginBottom: 20,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 12,
    },
    placeholderText: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 24,
    },
    // CTA Section
    ctaSection: {
        paddingVertical: 80,
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    ctaPreTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primaryLight,
        marginBottom: 12,
    },
    ctaTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 20,
        maxWidth: 600,
    },
    ctaSubtitle: {
        fontSize: 18,
        color: '#E9D7FE', // Lighter purple/white
        textAlign: 'center',
        marginBottom: 32,
        maxWidth: 600,
        lineHeight: 28,
    },
    ctaButtonContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    ctaPrimaryButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ctaPrimaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    ctaFooterText: {
        color: '#E9D7FE',
        fontSize: 14,
    },
    // Footer
    footer: {
        backgroundColor: COLORS.footerBlack,
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    footerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#344054', // Dark border
    },
    footerBrand: {
        flex: 1,
    },
    footerTagline: {
        fontSize: 16,
        color: COLORS.gray,
        lineHeight: 24,
        marginTop: 16,
        marginBottom: 24,
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 20,
    },
    footerLinksContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 60,
    },
    footerLinkColumn: {
        //
    },
    footerLinkTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#98A2B3', // Lighter gray for title
        marginBottom: 16,
    },
    footerLink: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.white,
        marginBottom: 12,
    },
    footerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 32,
        alignItems: 'center',
    },
    footerCopy: {
        fontSize: 14,
        color: COLORS.gray,
    },
    footerLegalLinks: {
        flexDirection: 'row',
        gap: 24,
    },
    footerLegalLink: {
        fontSize: 14,
        color: COLORS.gray,
    },
});

export default LandingScreen;