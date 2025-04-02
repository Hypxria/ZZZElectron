// services/hoyoServices/dsTypes.ts
export interface DSGenerator {
    generateDynamicSecret: (salt?: string) => Promise<string>;
    generateCnDynamicSecret: (body?: any, query?: any, salt?: string) => Promise<string>;
}
