import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MenuScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  const menuItems = [
    {
      icon: "account-circle",
      title: "Mon profil",
      subtitle: user?.email || "Non connecté",
      onPress: () => Alert.alert("À venir", "Fonctionnalité en développement"),
    },
    {
      icon: "bell",
      title: "Notifications",
      subtitle: "Gérer vos notifications",
      onPress: () => Alert.alert("À venir", "Fonctionnalité en développement"),
      badge: "Bientôt",
    },
    {
      icon: "cog",
      title: "Paramètres",
      subtitle: "Préférences de l'application",
      onPress: () => Alert.alert("À venir", "Fonctionnalité en développement"),
    },
    {
      icon: "information",
      title: "À propos",
      subtitle: "Version 1.0.0",
      onPress: () => Alert.alert("Recipe App", "Version 1.0.0\n\nApplication de gestion de recettes"),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Menu</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Compte */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Compte</ThemedText>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + "20" }]}>
                  <Icon name={item.icon} size={24} color={colors.tint} />
                </View>
                <View style={styles.menuItemText}>
                  <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                  <ThemedText style={styles.menuItemSubtitle}>{item.subtitle}</ThemedText>
                </View>
              </View>
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <ThemedText style={styles.badgeText}>{item.badge}</ThemedText>
                </View>
              )}
              <Icon name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuItem, styles.signOutButton, { backgroundColor: "#ef444420" }]}
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: "#ef444430" }]}>
                <Icon name="logout" size={24} color="#ef4444" />
              </View>
              <ThemedText style={[styles.menuItemTitle, { color: "#ef4444" }]}>
                Déconnexion
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingBottom: 16,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      opacity: 0.6,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    menuItemText: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    menuItemSubtitle: {
      fontSize: 14,
      opacity: 0.6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 8,
    },
    badgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    signOutButton: {
      borderWidth: 1,
      borderColor: "#ef444440",
    },
  });
