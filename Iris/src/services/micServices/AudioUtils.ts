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
        let cleanText = text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s{2,}/g, '')
            .trim();

        cleanText = cleanText
            .replace(/\bires\b/g, 'iris')
            .replace(/\biris\b/g, 'iris')
            .replace(/\birs\b/g, 'iris')
            .replace(/\bi r i s\b/g, 'iris')
            .replace(/\bhey i r i s\b/g, 'iris')

            .replace('i am a virus', 'iris')

        cleanText = cleanText
            .replace('on mute', 'unmute')
            .replace('deafin', 'deafen')
            .replace('deafened', 'deafen')
            .replace('i am a virus', 'iris')


        return cleanText;

    }
}
