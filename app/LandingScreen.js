import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';

const LandingScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.title}>GIG Connect</Text>
        <Text style={styles.subtitle}>
          Empowering South Africa’s informal workers to find jobs, get verified, and receive secure digital payments.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionText}>
          1. Workers create a profile and showcase their skills.{"\n"}
          2. Clients post jobs and browse available workers.{"\n"}
          3. Work is submitted, verified, and securely paid via our wallet system.
        </Text>
      </View>

      {/* Benefits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose GIG Connect?</Text>
        <Text style={styles.sectionText}>
          • Verified workers for reliable service.{"\n"}
          • Secure digital payments with escrow.{"\n"}
          • Track ratings and reputation for accountability.{"\n"}
          • Easy-to-use mobile and web platform.
        </Text>
      </View>

      {/* Optional Illustration */}
      <Image
        source={{ uri: 'https://i.ibb.co/7Ww0h1t/gig-connect-illustration.png' }}
        style={styles.illustration}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f8' },
  hero: { alignItems: 'center', padding: 40, backgroundColor: '#6200ee' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: { color: '#6200ee', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: '#fff', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  secondaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  sectionText: { fontSize: 16, color: '#555', lineHeight: 24 },
  illustration: { width: '100%', height: 200, resizeMode: 'contain', marginTop: 20 },
});

export default LandingScreen;
