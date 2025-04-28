import { AudioUtils } from './AudioUtils.ts';

export class AudioProcessor {
    static async processAudio(audioChunks:Blob[], audioContext: AudioContext) {
        try {
            // Create a promise that resolves when the MediaRecorder stops

            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioArrayBuffer = await audioBlob.arrayBuffer();
    
                // Add more detailed logging
                console.log('Audio blob size:', audioBlob.size);
                console.log('ArrayBuffer length:', audioArrayBuffer.byteLength);
    
                // Wrap the decodeAudioData in a proper promise
                const audioData = await new Promise<AudioBuffer>((resolve, reject) => {
                    audioContext!.decodeAudioData(
                        audioArrayBuffer,
                        (decodedData) => resolve(decodedData),
                        (error) => reject(new Error(`Decoding failed: ${error.message}`))
                    );
                });
    
                const monoData = AudioUtils.convertToMono(audioData);
                const resampledData = await AudioUtils.resampleAudio(monoData, audioData.sampleRate, 16000);
                const float64Data = new Float64Array(resampledData);

                return float64Data
    
                console.log('Audio successfully decoded and processed');
                // const text = await this.transcribeAudio(float64Data);
                // await this.handleTranscription(text);
            } else {
                return new Float64Array();
            }
        } catch (error) {
            console.error('Detailed error in handleSpeechEnd:', {
                error,
                chunksLength: audioChunks.length,
                audioContextState: audioContext?.state
            });
    
            // Attempt to resume AudioContext if it's suspended
            if (audioContext?.state === 'suspended') {
                try {
                    await audioContext.resume();
                    console.log('AudioContext resumed');
                } catch (resumeError) {
                    console.error('Failed to resume AudioContext:', resumeError);
                }
            }
        }
    }
}
