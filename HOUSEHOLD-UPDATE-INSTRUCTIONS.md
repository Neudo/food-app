# Instructions pour mettre à jour household.tsx

## 1. Ajouter les handlers manquants

Après la fonction `handleCreateHousehold`, ajouter:

```typescript
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
```

## 2. Ajouter le modal "Rejoindre" après le modal "Créer"

Après le modal "Créer un foyer", ajouter:

```typescript
      {/* Modal Rejoindre un foyer */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Rejoindre un foyer
            </Text>
            <Text style={[styles.modalDescription, { color: colors.tabIconDefault }]}>
              Saisissez le code du foyer que vous souhaitez rejoindre
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Code du foyer (ex: EYN5S2)"
              placeholderTextColor={colors.tabIconDefault}
              value={householdCode}
              onChangeText={setHouseholdCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.icon + "20" }]}
                onPress={() => {
                  setShowJoinModal(false);
                  setHouseholdCode("");
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleJoinHousehold}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Rejoindre
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
```

## 3. Ajouter les styles manquants

Dans la fonction `createStyles`, ajouter:

```typescript
  // Styles pour le code du foyer
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
  codeText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  codeHint: {
    fontSize: 11,
    textAlign: "center",
  },
  
  // Styles pour l'état vide
  emptyButtons: {
    width: "100%",
    gap: 12,
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
```

## 4. Corriger la fermeture du View dans l'état vide

Remplacer:

```typescript
              </TouchableOpacity>
          </>
        )}
```

Par:

```typescript
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
```

## Résumé des changements

1. ✅ Migration SQL: Ajout de la colonne `code` à `households`
2. ✅ Types: Ajout du champ `code` dans `Household`
3. ✅ Service: Fonctions `generateHouseholdCode()` et `joinHouseholdByCode()`
4. ⏳ Interface: Ajouter handler, modal et styles (suivre les instructions ci-dessus)

Une fois ces modifications appliquées:
1. Réexécuter la migration SQL dans Supabase
2. Tester la création d'un foyer → Devrait générer un code
3. Tester la jointure avec le code → Devrait fonctionner
