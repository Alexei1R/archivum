export type StorageValue = string | number | boolean | object | null;

class SafeStorage {
    private isAvailable(): boolean {
        try {
            const test = "__storage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    get<T extends StorageValue>(key: string, defaultValue: T): T {
        if (!this.isAvailable()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    set<T extends StorageValue>(key: string, value: T): boolean {
        if (!this.isAvailable()) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    remove(key: string): boolean {
        if (!this.isAvailable()) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
}

export const storage = new SafeStorage();
