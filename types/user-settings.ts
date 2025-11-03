export interface UserSettings {
  id: string;
  userId: string;
  showBreakfast: boolean;
  showLunch: boolean;
  showDinner: boolean;
  showSnack: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';
