import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Subheading, TextInput, Title } from 'react-native-paper';
import { auth } from '../firebaseConfig';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(email)) {
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

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({ email: '', password: '' });
      
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation handled by auth state listener in App.js
      
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          setErrors({ ...errors, email: errorMessage });
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          setErrors({ ...errors, password: errorMessage });
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          setErrors({ ...errors, email: errorMessage });
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          Alert.alert('Account Disabled', errorMessage);
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          Alert.alert('Too Many Attempts', errorMessage);
          break;
        default:
          Alert.alert('Login Error', errorMessage);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Icon Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color="#6200ee" />
          </View>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Welcome Back!</Title>
          <Subheading style={styles.subtitle}>Log in to continue to GIGConnect</Subheading>
        </View>

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
            left={<TextInput.Icon icon="email-outline" />}
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
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
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

          {/* Forgot Password Link */}
          <Button 
            mode="text" 
            onPress={() => Alert.alert('Coming Soon', 'Password reset functionality will be available soon.')}
            style={styles.forgotButton}
            labelStyle={styles.forgotButtonLabel}
            disabled={loading}
          >
            Forgot Password?
          </Button>

          {/* Login Button */}
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
            loading={loading}
            disabled={loading}
            icon="login"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Subheading style={styles.dividerText}>OR</Subheading>
            <Divider style={styles.divider} />
          </View>

          {/* Sign Up Link */}
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupButton}
            contentStyle={styles.signupButtonContent}
            labelStyle={styles.signupButtonLabel}
            icon="account-plus"
            disabled={loading}
          >
            Create New Account
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  helperText: {
    marginBottom: 8,
    marginTop: -4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
  },
  forgotButtonLabel: {
    fontSize: 14,
    color: '#6200ee',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: '#6200ee',
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  signupButton: {
    borderColor: '#6200ee',
    borderWidth: 2,
    borderRadius: 8,
  },
  signupButtonContent: {
    paddingVertical: 8,
  },
  signupButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
});

export default LoginScreen;
