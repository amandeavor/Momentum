import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'MOMENTUM_STORAGE';

export const saveData = async <T>(data: T): Promise<void> => {
    try {
        const jsonData = JSON.stringify(data);
        await AsyncStorage.setItem(STORAGE_KEY, jsonData);
    } catch (error) {
        console.error('Error saving data', error);
    }
};

export const loadData = async <T>(): Promise<T | null> => {
    try {
        const jsonData = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonData != null ? JSON.parse(jsonData) : null;
    } catch (error) {
        console.error('Error loading data', error);
        return null;
    }
};

export const clearData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing data', error);
    }
};

// Generic key-value storage
export const setItem = async <T>(key: string, value: T): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key}`, error);
    }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error loading ${key}`, error);
        return null;
    }
};

export const removeItem = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing ${key}`, error);
    }
};