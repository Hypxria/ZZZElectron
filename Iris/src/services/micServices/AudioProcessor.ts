import { AudioUtils } from './AudioUtils.ts';

export class AudioProcessor {
    // Cache for audio context to avoid recreating it
    private static audioContextCache: AudioContext | null = null;

    // Process audio more efficiently with optimized memory usage
    static async processAudio(audioChunks: Blob[], audioContext: AudioContext) {
        try {
            if (audioChunks.length === 0) {
                return new Float64Array();
            }

            // Create a single blob from all chunks to reduce overhead
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Skip processing for very small audio chunks (likely noise)
            if (audioBlob.size < 1000) {
                console.log('Skipping small audio chunk:', audioBlob.size);
                return new Float64Array();
            }
            
            // Use a shared buffer for better memory efficiency
            const audioArrayBuffer = await audioBlob.arrayBuffer();
            
            // Decode audio data with proper error handling
            const audioData = await this.decodeAudioData(audioContext, audioArrayBuffer);
            if (!audioData) {
                return new Float64Array();
            }
            
            // Process audio in a pipeline for better efficiency
            const monoData = AudioUtils.convertToMono(audioData);
            
            // Use optimized resampling for better performance
            const resampledData = await AudioUtils.resampleAudio(
                monoData, 
                audioData.sampleRate, 
                16000
            );
            
            // Convert to Float64Array for compatibility with existing code
            return new Float64Array(resampledData);
        } catch (error) {
            console.error('Error in processAudio:', error);
            
            // Attempt to resume AudioContext if it's suspended
            if (audioContext?.state === 'suspended') {
                try {
                    await audioContext.resume();
                } catch (resumeError) {
                    console.error('Failed to resume AudioContext:', resumeError);
                }
            }
            
            // Return empty array on error to prevent crashes
            return new Float64Array();
        }
    }
    
    // Helper method to decode audio data with proper promise handling
    private static decodeAudioData(audioContext: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            audioContext.decodeAudioData(
                buffer,
                (decodedData) => resolve(decodedData),
                (error) => reject(new Error(`Decoding failed: ${error?.message || 'Unknown error'}`))
            );
        });
    }
}