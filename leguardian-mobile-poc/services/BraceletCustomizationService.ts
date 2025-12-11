import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BraceletCustomization {
  braceletId: number;
  color: string;
  photoUri?: string;
  updatedAt: number;
}

const CUSTOMIZATION_KEY_PREFIX = 'bracelet_customization_';
const DEFAULT_COLORS = ['#2196F3', '#F44336', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#000000', '#808080'];

class BraceletCustomizationServiceClass {
  async getCustomization(braceletId: number): Promise<BraceletCustomization | null> {
    try {
      const data = await AsyncStorage.getItem(`${CUSTOMIZATION_KEY_PREFIX}${braceletId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error fetching customization:', error);
      return null;
    }
  }

  async saveCustomization(braceletId: number, customization: Partial<BraceletCustomization>): Promise<void> {
    try {
      const existing = await this.getCustomization(braceletId) || { braceletId, color: '#2196F3' };
      const updated: BraceletCustomization = {
        ...existing,
        ...customization,
        braceletId,
        updatedAt: Date.now(),
      };
      await AsyncStorage.setItem(`${CUSTOMIZATION_KEY_PREFIX}${braceletId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  }

  async deleteCustomization(braceletId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CUSTOMIZATION_KEY_PREFIX}${braceletId}`);
    } catch (error) {
      console.error('Error deleting customization:', error);
      throw error;
    }
  }

  getDefaultColors(): string[] {
    return DEFAULT_COLORS;
  }
}

export const braceletCustomizationService = new BraceletCustomizationServiceClass();
