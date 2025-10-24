import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const SubmitProofScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
      }
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      if (locationStatus.status !== 'granted') {
        Alert.alert('Sorry, we need location permissions to make this work!');
      }
    })();
  }, []);

  const takePicture = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
  }

  const handleSubmitProof = async () => {
    if (!image || !location) {
      Alert.alert('Please provide a photo and location as proof.');
      return;
    }
    setUploading(true);
    // In a real app, you'd upload the image to a service like Firebase Storage
    // and save the URL. For this hackathon MVP, we'll save the local URI and location.
    const jobRef = doc(db, 'jobs', jobId);
    try {
      await updateDoc(jobRef, {
        status: 'awaiting_approval',
        proof: {
          imageUrl: image, // Placeholder for actual storage URL
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          timestamp: new Date(),
        },
      });
      setUploading(false);
      Alert.alert('Proof submitted!', 'The client will be notified to approve the job.');
      navigation.goBack();
    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Could not submit proof. Please try again.');
      console.error("Error submitting proof: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Proof of Work</Text>
      <Button icon="camera" mode="outlined" onPress={takePicture} style={styles.button}>
        Take a Photo
      </Button>
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <Button icon="map-marker" mode="outlined" onPress={getLocation} style={styles.button}>
        Capture Geolocation
      </Button>
      {location && (
        <Text style={styles.locationText}>
          Location Captured: Lat {location.coords.latitude.toFixed(3)}, Lon {location.coords.longitude.toFixed(3)}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmitProof}
        style={styles.submitButton}
        disabled={!image || !location || uploading}
      >
        {uploading ? <ActivityIndicator animating={true} color={"#fff"} /> : 'Submit for Approval'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    marginBottom: 15,
  },
  submitButton: {
    width: '100%',
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    marginTop: 5,
    fontStyle: 'italic',
  }
});

export default SubmitProofScreen;
