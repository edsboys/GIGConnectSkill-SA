import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { auth, db } from '../firebaseConfig'; // Make sure db is Firestore instance

const COLORS = {
    primary: '#7B68EE',
    accent: '#FF8C42',
    background: '#F9F9F9',
    cardBackground: '#FFFFFF',
    text: '#333',
    textSecondary: '#666',
    inputBackground: '#FFF',
    inputBorder: '#DDD',
};

const HomeScreen = ({ navigation }) => {
    const [currentUser, setCurrentUser] = useState({
        uid: null,
        name: 'Guest',
        avatarInitial: 'G',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser({
                    uid: user.uid,
                    name: user.displayName || 'User',
                    avatarInitial: user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U',
                });
            } else {
                setCurrentUser({
                    uid: null,
                    name: 'Guest',
                    avatarInitial: 'G',
                });
            }
        });

        fetchWorkers(); // Fetch workers on mount

        return () => unsubscribeAuth();
    }, []);

    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'workers')); // Your workers collection
            const querySnapshot = await getDocs(q);
            const workerList = [];
            querySnapshot.forEach((doc) => {
                workerList.push({ id: doc.id, ...doc.data() });
            });
            setWorkers(workerList);
        } catch (error) {
            console.error('Error fetching workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleSearch = async (queryText) => {
        setSearchQuery(queryText);
        try {
            setLoading(true);
            const q = query(
                collection(db, 'workers'),
                where('skill', '>=', queryText),
                where('skill', '<=', queryText + '\uf8ff')
            );
            const querySnapshot = await getDocs(q);
            const filtered = [];
            querySnapshot.forEach((doc) => filtered.push({ id: doc.id, ...doc.data() }));
            setWorkers(filtered);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderWorker = ({ item }) => (
        <View style={styles.workerCard}>
            <Text style={styles.workerName}>{item.name}</Text>
            <Text style={styles.workerSkill}>{item.skill}</Text>
            <Text style={styles.workerRate}>{item.rate || 'R0/hr'}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Hello, {currentUser.name}!</Text>
            <Text style={styles.subtitle}>Find reliable informal workers quickly</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search" type="font-awesome-5" size={16} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Find a worker for your task..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Workers List */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Workers</Text>
                {workers.length > 0 ? (
                    <FlatList
                        data={workers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderWorker}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 10 }}
                    />
                ) : (
                    <Text style={[styles.infoText, { fontStyle: 'italic' }]}>No workers found</Text>
                )}
            </View>

            {/* Sign In / Sign Out */}
            {currentUser.uid ? (
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Icon name="sign-out-alt" type="font-awesome-5" size={18} color="#FFF" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.signOutButton, { backgroundColor: COLORS.textSecondary }]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.signOutText}>Sign In</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 15,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 15,
        width: '100%',
    },
    searchInput: {
        flex: 1,
        height: 40,
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.text,
    },
    infoCard: {
        width: '100%',
        backgroundColor: COLORS.cardBackground,
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: COLORS.primary },
    infoText: { fontSize: 14, color: COLORS.textSecondary },
    workerCard: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        width: 180,
        marginRight: 10,
    },
    workerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    workerSkill: { fontSize: 14, color: COLORS.textSecondary },
    workerRate: { fontSize: 14, color: COLORS.accent, marginTop: 5 },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
    },
    signOutText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});

export default HomeScreen;
