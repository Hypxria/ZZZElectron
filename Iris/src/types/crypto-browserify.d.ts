declare module 'crypto-browserify' {
    export interface RSAKeyPairOptions<T extends 'public' | 'private'> {
        key: string;
        padding?: number;
        encoding?: string;
    }

    export function publicEncrypt(
        key: RSAKeyPairOptions<'public'>,
        buffer: Buffer
    ): Buffer;

    export const constants: {
        RSA_PKCS1_PADDING: number;
        RSA_PKCS1_OAEP_PADDING: number;
    };

    // Add other methods you need from crypto-browserify
}
