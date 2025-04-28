// utils/AudioProcessor.ts
export class AudioUtils {
    static convertToMono(audioBuffer: AudioBuffer): Float32Array {
        if (audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }

        const samples = audioBuffer.length;
        const monoData = new Float32Array(samples);
        const channels = audioBuffer.numberOfChannels;

        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let channel = 0; channel < channels; channel++) {
                sum += audioBuffer.getChannelData(channel)[i];
            }
            monoData[i] = sum / channels;
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
        const step = fromSampleRate / toSampleRate;
        
        for (let i = 0; i < newLength; i++) {
            result[i] = audioData[Math.floor(i * step)];
        }

        return result;
    }

    static async cleanTranscription(text: string) {
        const cleanText = text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s{2,}/g, '')
            .trim();

        return cleanText;

    }
}
