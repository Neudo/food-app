export type HouseholdRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Household {
  id: string;
  name: string;
  code: string; // Code unique pour rejoindre le foyer (ex: "EYN5S2")
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: HouseholdRole;
  joinedAt: Date;
  // Données utilisateur (jointure)
  userEmail?: string;
  userName?: string;
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  invitedBy: string;
  invitedEmail: string;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  // Données du foyer (jointure)
  householdName?: string;
  inviterEmail?: string;
}
