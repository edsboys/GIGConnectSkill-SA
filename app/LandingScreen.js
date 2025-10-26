import React, { useState } from 'react';

import {

    View,

    Text,

    StyleSheet,

    Image,

    TouchableOpacity,

    ScrollView,

    StatusBar,

    Platform,

    Alert // Kept for navigation warnings

} from 'react-native';

import { Icon } from 'react-native-elements';

import { LinearGradient } from 'expo-linear-gradient';



// Define your color palette based on the screenshots

const COLORS = {

    primary: '#7F56D9', // Main purple

    primaryLight: '#F9F5FF', // Light purple background

    orange: '#F79009', // ADDED: Orange for button and badge from picture

    white: '#FFFFFF',

    black: '#101828', // Dark text

    gray: '#667085', // Lighter text

    lightGray: '#EAECF0', // Borders

    footerBlack: '#101828', // Dark footer background

    footerLinkTitle: '#98A2B3', // ADDED: From picture's footer style

    footerBorder: '#344054', // ADDED: From picture's footer style

};



// --- NEW Helper Components from Picture Layout ---



// Helper component for Platform Overview cards - ADDED

const OverviewCard = ({ icon, title, text, onPress }) => (

    <TouchableOpacity style={styles.overviewCard} onPress={onPress} activeOpacity={0.7}>

        <View style={styles.overviewIconContainer}>

            <Icon name={icon} type="font-awesome-5" color={COLORS.primary} size={20} />

        </View>

        <Text style={styles.overviewCardTitle}>{title}</Text>

        <Text style={styles.overviewCardText}>{text}</Text>

    </TouchableOpacity>

);



// Helper component for Trusted stats - ADDED

const TrustStat = ({ number, label, onPress }) => (

    <TouchableOpacity style={styles.trustStatItem} onPress={onPress} activeOpacity={0.7}>

        <Text style={styles.trustStatNumber}>{number}</Text>

        <Text style={styles.trustStatLabel}>{label}</Text>

    </TouchableOpacity>

);



// --- End of NEW Helper Components ---





const LandingScreen = ({ navigation }) => {

// State for active navigation tab - FIXED BUG HERE

    const [activeTab, setActiveTab] = useState('Home');



// --- ADDED: Central Navigation Handler ---

// This function manages all navigation from this screen

    const handleNavigation = (screenName, directParams = null) => {

        setActiveTab(screenName); // Keep track of active tab conceptually if needed



// If directParams are provided, navigate directly

        if (directParams && directParams.screen) {

            navigation.navigate(directParams.screen, directParams.params);

            return; // Stop further processing in this function

        }



// Switch case for specific intended screens

        switch(screenName) {

            case 'Home':

// Already on home, just scroll to top

                break;

            case 'Find Jobs':

// Navigate to job feed or role selection for workers

                navigation.navigate('RoleSelectionLoginScreen', { intendedScreen: 'JobFeed' });

                break;

            case 'Post Jobs':

// Navigate to role selection for clients

                navigation.navigate('RoleSelectionLoginScreen', { intendedScreen: 'PostJob' });

                break;

            case 'Wallet':

// Navigate to wallet (requires login)

                navigation.navigate('RoleSelectionLoginScreen', { intendedScreen: 'Wallet' });

                break;

            case 'Leaderboard':

// Navigate to leaderboard (requires login)

                navigation.navigate('RoleSelectionLoginScreen', { intendedScreen: 'Leaderboard' });

                break;

            case 'RoleSelectionLogin':

                navigation.navigate('RoleSelectionLoginScreen');

                break;

            default:

// Fallback for unknown screen names

                console.warn(`Unhandled navigation screen name: ${screenName}`);

                break;

        }

    };



// --- End of Added Navigation Handler ---





// Helper component for navigation links

    const NavItem = ({ title }) => (

        <TouchableOpacity onPress={() => handleNavigation(title)}>

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

// --- IMPROVED: Made clickable and added CTA button ---

    const PlaceholderSection = ({ preTitle, title, subtitle, iconName, screenName }) => {

        const handleSectionPress = () => {

            if (screenName) {

                handleNavigation(screenName); // Use the main handleNavigation

            }

        };



        return (

            <View style={styles.section}>

                <Text style={styles.sectionPreTitle}>{preTitle}</Text>

                <Text style={styles.sectionTitle}>{title}</Text>

                <Text style={styles.sectionSubtitle}>{subtitle}</Text>

                <TouchableOpacity

                    style={styles.placeholderBox}

                    onPress={handleSectionPress}

                    activeOpacity={0.7}

                >

                    <Icon name={iconName} type="font-awesome-5" color={COLORS.primary} size={32} containerStyle={styles.placeholderIconBg} />

                    <Text style={styles.placeholderTitle}>

                        {title.startsWith('Available') ? 'Find Your Perfect Job' : title}

                    </Text>

                    <Text style={styles.placeholderText}>

                        {iconName === 'search'

                            ? 'Browse through thousands of verified job opportunities that match your skills and experience.'

                            : iconName === 'briefcase'

                                ? 'Reach thousands of skilled workers and find the perfect match for your project.'

                                : 'Track your earnings, manage withdrawals, and view transaction history.'

                        }

                    </Text>

                    {/* --- ADDED CTA Button to Placeholder --- */}

                    <View style={styles.ctaButton}>

                        <Text style={styles.ctaButtonText}>

                            {iconName === 'search' ? 'Browse Jobs' :

                                iconName === 'briefcase' ? 'Post a Job' :

                                    'View Wallet'}

                        </Text>

                        <Icon name="arrow-right" type="font-awesome-5" color={COLORS.primary} size={14} />

                    </View>

                </TouchableOpacity>

            </View>

        );

    };





    return (

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />



            {/* Header - MODIFIED to match picture */}

            <View style={styles.header}>

                <View style={styles.logoContainer}>

                    {/* --- MODIFIED Logo --- */}

                    <Image

                        // IMPORTANT: Make sure this path is correct for your project

                        source={require('../assets/images/logo-map.png')}

                        style={styles.logoImage} // Added style for image

                    />

                    <Text style={styles.logoText}>GIGConnectSkillSA</Text>

                </View>



                {/* --- HIDDEN NavLinks t --- */}

                {/* <View style={styles.navLinks}>

<NavItem title="Home" />

<NavItem title="Find Jobs" />

<NavItem title="Post Jobs" />

<NavItem title="Wallet" />

<NavItem title="Leaderboard" />

</View>

*/}



                <View style={styles.authButtons}>

                    <TouchableOpacity

                        style={styles.logInButton}

                        // --- 1. LOGIN BUTTON FIXED ---

                        onPress={() => navigation.navigate('Login')}

                    >

                        <Text style={styles.logInText}>Login</Text>

                    </TouchableOpacity>

                    <TouchableOpacity

                        style={styles.signUpButton}

                        // --- 2. SIGN UP BUTTON FIXED ---

                        onPress={() => navigation.navigate('Signup')}

                    >

                        <Text style={styles.signUpText}>Sign Up</Text>

                    </TouchableOpacity>

                </View>

            </View>



            {/* Hero Section - MODIFIED to match picture */}

            <View style={styles.heroSection}>

                <View style={styles.heroTextContainer}>



                    <Text style={styles.heroTitle}>

                        {/* --- MODIFIED Text --- */}

                        Unlock Your Potential. Find Work. Get Projects Done

                    </Text>

                    <Text style={styles.heroSubtitle}>

                        {/* --- MODIFIED Text --- */}

                        Connect with clients, get verified, and receive secure digital payments. Join the platform that&#39;s transforming the gig economy.

                    </Text>

                    <View style={styles.heroButtonContainer}>

                        <TouchableOpacity

                            style={styles.heroPrimaryButton}

                            onPress={() => handleNavigation('Post Jobs')} // Links to "Find Talent"

                        >

                            <Text style={styles.heroPrimaryButtonText}>Find Talent</Text>

                        </TouchableOpacity>

                        <TouchableOpacity

                            style={styles.heroSecondaryButton}

                            onPress={() => handleNavigation('Find Jobs')} // Links to "Find Work"

                        >

                            <Text style={styles.heroSecondaryButtonText}>Find Work</Text>

                        </TouchableOpacity>

                    </View>

                </View>

                <View style={styles.heroImageContainer}>

                    <Image

                        source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1740&auto=format&fit=crop' }}

                        style={styles.heroImage}

                        resizeMode="cover" // ADDED resizeMode

                    />

                </View>

            </View>



            {/* --- ADDED Platform Overview Section from Picture --- */}

            <View style={styles.platformOverview}>

                <Text style={styles.sectionTitle}>Platform Overview</Text>

                <View style={styles.overviewCardContainer}>

                    <OverviewCard

                        icon="wrench"

                        title="Workers"

                        text="Find opportunities that match your skills."

                        onPress={() => handleNavigation('Find Jobs')}

                    />

                    <OverviewCard

                        icon="briefcase"

                        title="Clients"

                        text="Post jobs and connect with verified talent."

                        onPress={() => handleNavigation('Post Jobs')}

                    />

                    <OverviewCard

                        icon="cog"

                        title="Efficiency"

                        text="Streamline your workflow and payments."

                        onPress={() => handleNavigation('RoleSelectionLogin')} // Generic login

                    />

                </View>

            </View>



            {/* Stats Section - REPLACED with "Trusted by Millions" from Picture */}

            <View style={styles.trustedSection}>

                <Text style={styles.sectionTitle}>Trusted by Millions</Text>

                <View style={styles.trustedStatsContainer}>

                    <TrustStat

                        number="500K+"

                        label="Successful Projects"

                        onPress={() => handleNavigation('Leaderboard')}

                    />

                    <TrustStat

                        number="1M+"

                        label="Freelancers Joined"

                        onPress={() => handleNavigation('Leaderboard')}

                    />

                    <TrustStat

                        number="98%"

                        label="Customer Satisfaction"

                        onPress={() => handleNavigation('Leaderboard')}

                    />

                    {/* --- ADDED Orange Badge from Picture --- */}

                    <View style={styles.trustBadge}>

                        <Text style={styles.trustBadgeText}>Top Rated Platform 2024</Text>

                    </View>

                </View>

            </View>





            {/* Find Jobs Section (Kept from original) */}

            <PlaceholderSection

                preTitle="FIND OPPORTUNITIES"

                title="Available Jobs"

                subtitle="Browse through hundreds of verified job opportunities"

                iconName="search"

                screenName="Find Jobs" // ADDED screenName prop

            />



            {/* Post Jobs Section (Kept from original) */}

            <PlaceholderSection

                preTitle="HIRE TALENT"

                title="Post a Job"

                subtitle="Find the perfect candidate for your project or business needs"

                iconName="briefcase"

                screenName="Post Jobs" // ADDED screenName prop

            />



            {/* Wallet Section (Kept from original) */}

            <PlaceholderSection

                preTitle="FINANCES"

                title="Your Wallet"

                subtitle="Manage your earnings and payments securely"

                iconName="wallet"

                screenName="Wallet" // ADDED screenName prop

            />





            {/* CTA Section (Kept from original) */}

            <LinearGradient

                colors={[COLORS.primary, '#6941C6']}

                style={styles.ctaSection}

            >

                <Text style={styles.ctaPreTitle}>READY TO START?</Text>

                <Text style={styles.ctaTitle}>Join South Africa&#39;s Fastest Growing Gig Platform</Text>

                <Text style={styles.ctaSubtitle}>

                    Thousands of workers and businesses trust GIGConnectSkillSA for secure, reliable, and professional gig services.

                </Text>

                <View style={styles.ctaButtonContainer}>

                    <TouchableOpacity

                        style={styles.ctaPrimaryButton}

                        onPress={() => handleNavigation('RoleSelectionLogin')} // Made clickable

                    >

                        <Text style={styles.ctaPrimaryButtonText}>Start Free Trial</Text>

                        <Icon name="rocket" type="font-awesome-5" color={COLORS.primary} size={14} />

                    </TouchableOpacity>

                </View>

                <Text style={styles.ctaFooterText}>No credit card required • 30-day free trial</Text>

            </LinearGradient>



            {/* Footer (Kept from original, IMPROVED with TouchableOpacity) */}

            <View style={styles.footer}>

                <View style={styles.footerTop}>

                    <View style={styles.footerBrand}>

                        <View style={styles.logoContainer}>

                            {/* --- MODIFIED Logo --- */}

                            <Image

                                // IMPORTANT: Make sure this path is correct

                                source={require('../assets/images/logo-map.png')}

                                style={styles.logoImage}

                            />

                            <Text style={[styles.logoText, {color: COLORS.white}]}>GIGConnectSkillSA</Text>

                        </View>

                        <Text style={styles.footerTagline}>Empowering South Africa&#39;s workforce through innovation and technology.</Text>

                        <View style={styles.socialIcons}>

                            {/* --- Made icons clickable --- */}

                            <TouchableOpacity><Icon name="twitter" type="font-awesome-5" color={COLORS.gray} size={20} /></TouchableOpacity>

                            <TouchableOpacity><Icon name="linkedin" type="font-awesome-5" color={COLORS.gray} size={20} /></TouchableOpacity>

                            <TouchableOpacity><Icon name="facebook" type="font-awesome-5" color={COLORS.gray} size={20} /></TouchableOpacity>

                            <TouchableOpacity><Icon name="instagram" type="font-awesome-5" color={COLORS.gray} size={20} /></TouchableOpacity>

                        </View>

                    </View>

                    <View style={styles.footerLinksContainer}>

                        <View style={styles.footerLinkColumn}>

                            <Text style={styles.footerLinkTitle}>Platform</Text>

                            {/* --- Made links clickable --- */}

                            <TouchableOpacity onPress={() => handleNavigation('Find Jobs')}><Text style={styles.footerLink}>Find Work</Text></TouchableOpacity>

                            <TouchableOpacity onPress={() => handleNavigation('Post Jobs')}><Text style={styles.footerLink}>Post Jobs</Text></TouchableOpacity>

                            <TouchableOpacity><Text style={styles.footerLink}>How It Works</Text></TouchableOpacity>

                            <TouchableOpacity><Text style={styles.footerLink}>Pricing</Text></TouchableOpacity>

                        </View>

                        <View style={styles.footerLinkColumn}>

                            <Text style={styles.footerLinkTitle}>Company</Text>

                            <TouchableOpacity><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>

                            <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>

                            <TouchableOpacity><Text style={styles.footerLink}>Press</Text></TouchableOpacity>

                            <TouchableOpacity><Text style={styles.footerLink}>Partners</Text></TouchableOpacity>

                        </View>

                    </View>

                </View>

                <View style={styles.footerBottom}>

                    <Text style={styles.footerCopy}>© 2024 GIGConnectSkillSA. All rights reserved.</Text>

                    <View style={styles.footerLegalLinks}>

                        {/* --- Made links clickable --- */}

                        <TouchableOpacity><Text style={styles.footerLegalLink}>Privacy Policy</Text></TouchableOpacity>

                        <TouchableOpacity><Text style={styles.footerLegalLink}>Terms of Service</Text></TouchableOpacity>

                        <TouchableOpacity><Text style={styles.footerLegalLink}>Cookie Policy</Text></TouchableOpacity>

                    </View>

                </View>

            </View>



        </ScrollView>

    );

};



// --- STYLES: Merged from Original + Picture-based Styles ---

const styles = StyleSheet.create({

    container: {

        backgroundColor: COLORS.white,

        ...(Platform.OS === 'web' ? {

            height: '100vh'

        } : {

            flex: 1

        })

    },

    header: {

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        paddingVertical: 16,

        paddingHorizontal: 40,

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

    logoImage: { // ADDED for logo

        width: 32,

        height: 32,

        marginRight: 8,

        resizeMode: 'contain',

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

        borderWidth: 1, // MODIFIED: Added border

        borderColor: COLORS.lightGray, // MODIFIED: Added border

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

        backgroundColor: COLORS.white, // MODIFIED: White background

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

        fontSize: 48,

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

        backgroundColor: COLORS.orange, // MODIFIED: Orange button

        paddingVertical: 14,

        paddingHorizontal: 24,

        borderRadius: 8,

        borderWidth: 1,

        borderColor: COLORS.orange, // MODIFIED: Orange border

    },

    heroSecondaryButtonText: {

        color: COLORS.white, // MODIFIED: White text

        fontSize: 16,

        fontWeight: '600',

    },

    trustBadges: {

        flexDirection: 'row',

        gap: 24,

    },

    trustBadgeText: {

        color: COLORS.gray,

        fontWeight: '500',

    },

    heroImageContainer: {

        flex: 1, // MODIFIED: Changed from 0.8

    },

    heroImage: {

        width: '100%',

        height: 400,

        borderRadius: 16,

    },



// --- ADDED: Platform Overview Styles ---

    platformOverview: {

        paddingVertical: 80,

        paddingHorizontal: 40,

        backgroundColor: COLORS.white,

        alignItems: 'center',

    },

    overviewCardContainer: {

        flexDirection: 'row',

        justifyContent: 'space-between',

        gap: 24,

        width: '100%',

    },

    overviewCard: {

        flex: 1,

        backgroundColor: COLORS.primaryLight,

        borderRadius: 16,

        padding: 24,

        alignItems: 'center',

        borderWidth: 1,

        borderColor: '#E9D7FE',

        shadowColor: '#101828',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.05,

        shadowRadius: 8,

        elevation: 1,

    },

    overviewIconContainer: {

        width: 48,

        height: 48,

        borderRadius: 24,

        backgroundColor: COLORS.white,

        justifyContent: 'center',

        alignItems: 'center',

        marginBottom: 16,

    },

    overviewCardTitle: {

        fontSize: 20,

        fontWeight: '600',

        color: COLORS.black,

        marginBottom: 8,

    },

    overviewCardText: {

        fontSize: 14,

        color: COLORS.gray,

        textAlign: 'center',

    },



// --- RE-STYLED: "Stats Section" to "Trusted Section" ---

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

    trustedSection: { // ADDED: New parent style

        paddingVertical: 80,

        paddingHorizontal: 40,

        backgroundColor: COLORS.primaryLight,

        alignItems: 'center',

    },

    trustedStatsContainer: { // ADDED: New container style

        flexDirection: 'row',

        justifyContent: 'space-around',

        alignItems: 'center',

        width: '100%',

        backgroundColor: COLORS.white,

        paddingVertical: 40,

        paddingHorizontal: 24,

        borderRadius: 16,

        shadowColor: '#101828',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.05,

        shadowRadius: 8,

        elevation: 1,

    },

    trustStatItem: { // ADDED: New stat item style

        alignItems: 'center',

        flex: 1,

    },

    trustStatNumber: { // ADDED: New stat number style

        fontSize: 36,

        fontWeight: 'bold',

        color: COLORS.primary,

        marginBottom: 4,

    },

    trustStatLabel: { // ADDED: New stat label style

        fontSize: 16,

        color: COLORS.gray,

    },

    trustBadge: { // ADDED: Orange badge style

        backgroundColor: COLORS.orange,

        borderRadius: 16,

        paddingVertical: 24,

        paddingHorizontal: 16,

        alignItems: 'center',

        justifyContent: 'center',

    },




// Placeholder Section (Kept from original, styles improved)

    section: {

        paddingVertical: 80,

        paddingHorizontal: 40,

        alignItems: 'center',

        backgroundColor: '#FDFBFF',

    },

    sectionPreTitle: {

        fontSize: 14,

        fontWeight: '600',

        color: COLORS.primary,

        marginBottom: 12,

    },

    sectionTitle: {

        fontSize: 32, // MODIFIED: Made smaller than hero

        fontWeight: 'bold',

        color: COLORS.black,

        marginBottom: 16,

        textAlign: 'center', // ADDED

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

        width: '60%',

        borderWidth: 1,

        borderColor: COLORS.lightGray,

        shadowColor: '#101828', // ADDED Shadow

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.05,

        shadowRadius: 8,

        elevation: 1,

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

        marginBottom: 20, // ADDED margin

    },

    ctaButton: { // ADDED Style for button inside placeholder

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: COLORS.primaryLight,

        paddingHorizontal: 16,

        paddingVertical: 8,

        borderRadius: 8,

        gap: 8,

    },

    ctaButtonText: { // ADDED Style for button text

        color: COLORS.primary,

        fontWeight: '600',

        fontSize: 14,

    },



// CTA Section (Kept from original)

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

        color: '#E9D7FE',

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



// Footer (Kept from original, styles improved)

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

        borderBottomColor: COLORS.footerBorder, // Use color from palette

    },

    footerBrand: {

        flex: 2, // MODIFIED: Gave brand more space

        paddingRight: 20, // ADDED

    },

    footerTagline: {

        fontSize: 16,

        color: COLORS.gray,

        lineHeight: 24,

        marginTop: 16,

        maxWidth: 320, // ADDED

    },

    socialIcons: {

        flexDirection: 'row',

        gap: 24, // MODIFIED: Increased gap

        marginTop: 24, // ADDED

    },

    footerLinksContainer: {

        flex: 1, // MODIFIED

        flexDirection: 'row',

        justifyContent: 'space-between', // MODIFIED

        gap: 32,

    },

    footerLinkColumn: {

        gap: 12, // ADDED

    },

    footerLinkTitle: {

        fontSize: 14,

        fontWeight: '600',

        color: COLORS.footerLinkTitle, // Use color from palette

        marginBottom: 4, // MODIFIED

    },

    footerLink: {

        fontSize: 16,

        fontWeight: '500',

        color: COLORS.white,

    },

    footerBottom: {

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        paddingTop: 32,

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