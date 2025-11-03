import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as HouseholdService from "@/services/household-service";
import { Household, HouseholdMember, HouseholdInvitation } from "@/types/household";

export default function HouseholdScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [householdCode, setHouseholdCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadHousehold(),
      loadPendingInvitations(),
    ]);
    setLoading(false);
  };

  const loadHousehold = async () => {
    const { data, error } = await HouseholdService.getUserHousehold();
    if (error) {
      console.error("Error loading household:", error);
    } else {
      setHousehold(data);
      if (data) {
        loadMembers(data.id);
      }
    }
  };

  const loadMembers = async (householdId: string) => {
    const { data, error } = await HouseholdService.getHouseholdMembers(householdId);
    if (error) {
      console.error("Error loading members:", error);
    } else if (data) {
      setMembers(data);
    }
  };

  const loadPendingInvitations = async () => {
    const { data, error } = await HouseholdService.getPendingInvitations();
    if (error) {
      console.error("Error loading invitations:", error);
    } else if (data) {
      setPendingInvitations(data);
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour votre foyer");
      return;
    }

    const { data, error } = await HouseholdService.createHousehold(householdName.trim());
    if (error) {
      Alert.alert("Erreur", error.message);
    } else if (data) {
      setHousehold(data);
      setShowCreateModal(false);
      setHouseholdName("");
      loadMembers(data.id);
      Alert.alert("Succès", "Votre foyer a été créé !");
    }
  };

  const handleJoinHousehold = async () => {
    if (!householdCode.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un code");
      return;
    }

    const { data, error } = await HouseholdService.joinHouseholdByCode(householdCode);
    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      setHousehold(data);
      setShowJoinModal(false);
      setHouseholdCode("");
      Alert.alert("Succès", `Vous avez rejoint le foyer "${data?.name}"`);
      loadData();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email");
      return;
    }

    if (!household) return;

    const { error } = await HouseholdService.inviteToHousehold(household.id, inviteEmail.trim());
    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      setShowInviteModal(false);
      setInviteEmail("");
      Alert.alert("Succès", `Invitation envoyée à ${inviteEmail}`);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    const { error } = await HouseholdService.acceptInvitation(invitationId);
    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      Alert.alert("Succès", "Vous avez rejoint le foyer !");
      loadData();
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    const { error } = await HouseholdService.declineInvitation(invitationId);
    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      loadPendingInvitations();
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      "Quitter le foyer",
      "Êtes-vous sûr de vouloir quitter ce foyer ? Vous n'aurez plus accès aux recettes et plannings partagés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Quitter",
          style: "destructive",
          onPress: async () => {
            const { error } = await HouseholdService.leaveHousehold();
            if (error) {
              Alert.alert("Erreur", error.message);
            } else {
              setHousehold(null);
              setMembers([]);
              Alert.alert("Succès", "Vous avez quitté le foyer");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mon Foyer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Invitations en attente
            </Text>
            {pendingInvitations.map((invitation) => (
              <View
                key={invitation.id}
                style={[styles.invitationCard, { backgroundColor: colors.tint + "10" }]}
              >
                <View style={styles.invitationInfo}>
                  <Icon name="email" size={24} color={colors.tint} />
                  <View style={styles.invitationText}>
                    <Text style={[styles.invitationTitle, { color: colors.text }]}>
                      {invitation.householdName}
                    </Text>
                    <Text style={[styles.invitationSubtitle, { color: colors.tabIconDefault }]}>
                      Invitation à rejoindre ce foyer
                    </Text>
                  </View>
                </View>
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={[styles.invitationButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleAcceptInvitation(invitation.id)}
                  >
                    <Text style={styles.invitationButtonText}>Accepter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.invitationButton, { backgroundColor: colors.icon + "20" }]}
                    onPress={() => handleDeclineInvitation(invitation.id)}
                  >
                    <Text style={[styles.invitationButtonText, { color: colors.text }]}>
                      Refuser
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Foyer actuel */}
        {household ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Foyer actuel
              </Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.householdHeader}>
                  <Icon name="home-heart" size={32} color={colors.tint} />
                  <Text style={[styles.householdName, { color: colors.text }]}>
                    {household.name}
                  </Text>
                </View>
                <Text style={[styles.householdInfo, { color: colors.tabIconDefault }]}>
                  {members.length} membre{members.length > 1 ? "s" : ""}
                </Text>
                <TouchableOpacity
                  style={[styles.codeContainer, { backgroundColor: colors.tint + "10" }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(household.code);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.codeLabel, { color: colors.tabIconDefault }]}>Code du foyer</Text>
                  <View style={styles.codeRow}>
                    <Text style={[styles.codeText, { color: colors.tint }]}>{household.code}</Text>
                    <Icon name={codeCopied ? "check" : "content-copy"} size={20} color={colors.tint} />
                  </View>
                  <Text style={[styles.codeHint, { color: colors.tabIconDefault }]}>
                    {codeCopied ? "Code copié !" : "Toucher pour copier le code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Membres */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Membres
                </Text>
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: colors.tint }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <Icon name="plus" size={16} color="#fff" />
                  <Text style={styles.inviteButtonText}>Inviter</Text>
                </TouchableOpacity>
              </View>

              {members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.memberInfo}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: colors.tint + "20" },
                      ]}
                    >
                      <Icon name="account" size={24} color={colors.tint} />
                    </View>
                    <View style={styles.memberText}>
                      <Text style={[styles.memberEmail, { color: colors.text }]}>
                        {member.userEmail}
                      </Text>
                      <Text
                        style={[styles.memberRole, { color: colors.tabIconDefault }]}
                      >
                        {member.role === "owner"
                          ? "Propriétaire"
                          : member.role === "admin"
                          ? "Administrateur"
                          : "Membre"}
                      </Text>
                    </View>
                  </View>
                  {member.role === "owner" && (
                    <View
                      style={[styles.ownerBadge, { backgroundColor: colors.tint }]}
                    >
                      <Icon name="crown" size={16} color="#fff" />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.leaveButton, { backgroundColor: "#ef444420" }]}
                onPress={handleLeaveHousehold}
              >
                <Icon name="exit-to-app" size={20} color="#ef4444" />
                <Text style={[styles.leaveButtonText, { color: "#ef4444" }]}>
                  Quitter le foyer
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Pas de foyer */}
            <View style={styles.emptyState}>
              <Icon name="home-outline" size={64} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucun foyer
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.tabIconDefault }]}>
                Créez un foyer ou rejoignez-en un pour partager vos recettes,
                plannings et favoris avec vos proches
              </Text>
              <View style={styles.emptyButtons}>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.tint }]}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Icon name="plus" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Créer un foyer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: colors.card, borderColor: colors.tint }]}
                  onPress={() => setShowJoinModal(true)}
                >
                  <Icon name="login" size={20} color={colors.tint} />
                  <Text style={[styles.joinButtonText, { color: colors.tint }]}>Rejoindre un foyer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Créer un foyer */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Créer un foyer
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Nom du foyer
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.icon, backgroundColor: colors.card },
              ]}
              placeholder="Ex: Famille Dupont"
              placeholderTextColor={colors.icon}
              value={householdName}
              onChangeText={setHouseholdName}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleCreateHousehold}
            >
              <Text style={styles.modalButtonText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Rejoindre un foyer */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Rejoindre un foyer
            </Text>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Code du foyer
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.icon, backgroundColor: colors.card },
              ]}
              placeholder="Ex: EYN5S2"
              placeholderTextColor={colors.icon}
              value={householdCode}
              onChangeText={setHouseholdCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleJoinHousehold}
            >
              <Text style={styles.modalButtonText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Inviter */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Inviter un membre
            </Text>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Adresse email
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.icon, backgroundColor: colors.card },
              ]}
              placeholder="exemple@email.com"
              placeholderTextColor={colors.icon}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleInvite}
            >
              <Text style={styles.modalButtonText}>Envoyer l'invitation</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    card: {
      borderRadius: 16,
      padding: 20,
    },
    householdHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    householdName: {
      fontSize: 24,
      fontWeight: "700",
      marginLeft: 12,
    },
    householdInfo: {
      fontSize: 14,
    },
    inviteButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    inviteButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    memberCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    memberInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    memberText: {
      flex: 1,
    },
    memberEmail: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    memberRole: {
      fontSize: 14,
    },
    ownerBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    invitationCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    invitationInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    invitationText: {
      flex: 1,
      marginLeft: 12,
    },
    invitationTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    invitationSubtitle: {
      fontSize: 14,
    },
    invitationActions: {
      flexDirection: "row",
      gap: 8,
    },
    invitationButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    invitationButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    leaveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: "#ef444440",
    },
    leaveButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    codeContainer: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    codeLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    codeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    codeText: {
      fontSize: 24,
      fontWeight: "bold",
      letterSpacing: 2,
    },
    codeHint: {
      fontSize: 11,
      textAlign: "center",
    },
    emptyButtons: {
      width: "100%",
      gap: 12,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    createButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    joinButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      borderWidth: 2,
    },
    joinButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
    },
    modalContent: {
      padding: 20,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    modalInput: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 16,
      marginBottom: 20,
    },
    modalButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
