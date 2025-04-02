declare module 'react-secure-storage' {
    const secureStorage: {
      getItem(key: string): string | null;
      setItem(key: string, value: string): void;
      removeItem(key: string): void;
      clear(): void;
    };
    export default secureStorage;
  }
      