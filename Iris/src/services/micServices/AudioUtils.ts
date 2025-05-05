// utils/AudioUtils.ts
export class AudioUtils {
    // Use TypedArray methods for better performance
    static convertToMono(audioBuffer: AudioBuffer): Float32Array {
        if (audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }

        const samples = audioBuffer.length;
        const monoData = new Float32Array(samples);
        const channels = audioBuffer.numberOfChannels;
        
        // Pre-fetch channel data for better performance with proper typing
        const channelData: Float32Array[] = [];
        for (let channel = 0; channel < channels; channel++) {
            channelData.push(audioBuffer.getChannelData(channel));
        }
        
        // Use a more efficient loop structure
        if (channels === 2) {
            // Optimized path for stereo (most common case)
            const left = channelData[0];
            const right = channelData[1];
            for (let i = 0; i < samples; i++) {
                monoData[i] = (left[i] + right[i]) * 0.5; // Multiply is faster than divide
            }
        } else {
            // General case for any number of channels
            for (let i = 0; i < samples; i++) {
                let sum = 0;
                for (let channel = 0; channel < channels; channel++) {
                    sum += channelData[channel][i];
                }
                monoData[i] = sum / channels;
            }
        }

        return monoData;
    }

    static async resampleAudio(
        audioData: Float32Array,
        fromSampleRate: number,
        toSampleRate: number
    ): Promise<Float32Array> {
        if (fromSampleRate === toSampleRate) {
            return audioData;
        }

        const ratio = toSampleRate / fromSampleRate;
        const newLength = Math.round(audioData.length * ratio);
        const result = new Float32Array(newLength);
        
        // Use a more efficient resampling algorithm with linear interpolation
        // This provides better quality than nearest-neighbor while still being fast
        const step = 1 / ratio;
        let offsetInput = 0;
        
        for (let i = 0; i < newLength; i++) {
            const indexInput = Math.floor(offsetInput);
            const fraction = offsetInput - indexInput;
            
            // Linear interpolation between samples
            if (indexInput < audioData.length - 1) {
                result[i] = audioData[indexInput] * (1 - fraction) + audioData[indexInput + 1] * fraction;
            } else {
                result[i] = audioData[indexInput];
            }
            
            offsetInput += step;
        }

        return result;
    }

    // Use a Map for common word replacements for better performance
    private static readonly wordReplacements = new Map([
        ['ires', 'iris'],
        ['iris', 'iris'],
        ['irs', 'iris'],
        ['i r i s', 'iris'],
        ['hey i r i s', 'iris'],
        ['i am a virus', 'iris'],
        ['on mute', 'unmute'],
        ['deafin', 'deafen'],
        ['deafened', 'deafen']
    ]);

    static async cleanTranscription(text: string): Promise<string> {
        // Do all string operations in a single pass where possible
        let cleanText = text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

        // Apply word replacements using the Map
        for (const [from, to] of AudioUtils.wordReplacements.entries()) {
            // Use a more efficient global replacement with word boundaries
            const regex = new RegExp(`\\b${from}\\b`, 'g');
            cleanText = cleanText.replace(regex, to);
        }

        return cleanText;
    }
}