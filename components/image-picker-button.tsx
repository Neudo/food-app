import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ImagePickerButtonProps {
  imageUri?: string;
  onImageSelected: (uri: string) => void;
}

export function ImagePickerButton({ imageUri, onImageSelected }: ImagePickerButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Nous avons besoin de votre permission pour accéder à la caméra et à la galerie.'
        );
        return false;
      }
    }
    return true;
  };

  const showImageOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: takePhoto,
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: pickImage,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Photo de la recette</ThemedText>
      
      {imageUri ? (
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={showImageOptions}
          disabled={isLoading}
        >
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.overlay}>
            <ThemedText style={styles.overlayText}>
              {isLoading ? 'Chargement...' : 'Modifier'}
            </ThemedText>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.placeholderContainer, { borderColor: colors.tint }]}
          onPress={showImageOptions}
          disabled={isLoading}
        >
          <ThemedText style={styles.placeholderIcon}>📷</ThemedText>
          <ThemedText style={[styles.placeholderText, { color: colors.tint }]}>
            {isLoading ? 'Chargement...' : 'Ajouter une photo'}
          </ThemedText>
          <ThemedText style={styles.placeholderSubtext}>
            Depuis la caméra ou la galerie
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    imageContainer: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0,
    },
    overlayText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    placeholderContainer: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    placeholderIcon: {
      fontSize: 48,
      marginBottom: 8,
    },
    placeholderText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    placeholderSubtext: {
      fontSize: 13,
      opacity: 0.6,
    },
  });
