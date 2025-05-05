import { AudioUtils } from './AudioUtils.ts';
import { AudioProcessor } from './AudioProcessor.ts';
import { TranscriptionManager } from './TranscriptionManager.ts';
import { executeCommand } from './commands/commands.ts';

let pipeline: any;
let read_audio: any;
let intervalId: number;

async function initializeTransformers() {
    const { pipeline: pipelineImport } = await import('@xenova/transformers');
    pipeline = pipelineImport;

    return pipeline;
}

async function initializeUtils() {
    const { read_audio: read_audioImport } = await import('@xenova/transformers');
    read_audio = read_audioImport

    return read_audio;

}

class SpeechRecognitionService {
    private isInitialized: boolean = false;
    private mediaRecorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private isWakeWordDetected: boolean = false;
    private isListening: boolean = false;
    private commandTimeout: NodeJS.Timeout | null = null;
    private isSpeaking: boolean = false;
    private transcriptionManager: TranscriptionManager | undefined | null;
    private activeRecordings: Map<string, {
        chunks: Blob[],
        startTime: number
    }> = new Map();
    private currentRecordingId: string | null = null;  // Track current active recording
    public intervalId: number | null = null;

    constructor() {
    }

    async initialize() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000, // Set fixed sample rate
            latencyHint: 'interactive'
        });
        this.transcriptionManager = new TranscriptionManager();
        if (!this.isInitialized) {
            try {
                pipeline = await initializeTransformers();

                read_audio = await initializeUtils();



                this.isInitialized = true;
                console.log('Speech recognition initialized successfully');
            } catch (error) {
                console.error('Failed to initialize speech recognition:', error);
                throw error;
            }
        }
    }

    private async handleSpeechStart(): Promise<void> {
        const recordingId = crypto.randomUUID();
        this.currentRecordingId = recordingId;  // Set current recording ID

        this.activeRecordings.set(recordingId, {
            chunks: [],
            startTime: Date.now()
        });

        this.isSpeaking = true;
        this.mediaRecorder?.start(100);


        console.log('Speech started', recordingId);
    }

    private async handleSpeechEnd(): Promise<void> {
        if (!this.isSpeaking) return;

        this.isSpeaking = false;
        console.log('Speech ended');

        this.mediaRecorder?.stop();

        // Process the current recording
        const recordingToProcess = this.currentRecordingId;
        this.currentRecordingId = null;
        if (recordingToProcess) {
            const recording = this.activeRecordings.get(recordingToProcess);
            if (recording) {
                // Process the recording asynchronously without awaiting
                this.processRecording(recordingToProcess, recording.chunks)

                // Clean up this recording from active recordings
                this.activeRecordings.delete(recordingToProcess);
            }
        }

        // Clear current recording ID immediately so new recordings can start
    }


    private async processRecording(recordingId: string, chunks: Blob[]): Promise<void> {
        try {

            // Process audio data
            const float64Data = await AudioProcessor.processAudio(chunks, this.audioContext!) ?? new Float64Array;

            // Start transcription immediately
            this.transcribeAudio(float64Data, recordingId);

        } catch (error) {
            console.error('Error processing recording:', error, recordingId);
        }
    }

    private calculateWeightedAverage(dataArray: Uint8Array): number {
        // Focus on frequencies between 85Hz and 255Hz (where most speech occurs)
        const speechStart = Math.floor(85 * dataArray.length / (this.audioContext!.sampleRate / 2));
        const speechEnd = Math.floor(255 * dataArray.length / (this.audioContext!.sampleRate / 2));

        let weightedSum = 0;
        let weightSum = 0;

        for (let i = speechStart; i < speechEnd; i++) {
            const weight = 1 - Math.abs(i - (speechStart + speechEnd) / 2) / (speechEnd - speechStart);
            weightedSum += dataArray[i] * weight;
            weightSum += weight;
        }

        // Get the raw average
        const rawAverage = weightedSum / weightSum;

        // Scale to 0-100 range
        return this.scaleToRange(rawAverage, 0, 255, 0, 100);
    }

    private scaleToRange(
        value: number,
        oldMin: number,
        oldMax: number,
        newMin: number,
        newMax: number
    ): number {
        // Ensure value is within the old range
        const clampedValue = Math.max(oldMin, Math.min(oldMax, value));

        // Calculate scaling
        const scale = (newMax - newMin) / (oldMax - oldMin);
        const scaledValue = newMin + (clampedValue - oldMin) * scale;

        // Round to 2 decimal places and ensure within 0-100
        return Math.min(100, Math.max(0, Math.round(scaledValue * 100) / 100));
    }



    async startListening(sensitivityMin: number, deviceId: string): Promise<void> {
        if (this.isListening) return;

        // Reset state
        this.isListening = true;
        this.isWakeWordDetected = false;
        // Create a custom event target for signaling
        const eventTarget = new EventTarget();
        const stopEvent = new Event('stop');
        let intervalId: number | null = null;
        this.transcriptionManager?.init()

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId,
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 24,
                    noiseSuppression: true,
                    autoGainControl: true,
                    echoCancellation: true,
                }
            });

            // Create audio processing pipeline
            const sourceNode = this.audioContext!.createMediaStreamSource(stream);
            const analyser = this.audioContext!.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.1;
            sourceNode.connect(analyser);

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm',
                audioBitsPerSecond: 16000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.currentRecordingId) {
                    const currentRecording = this.activeRecordings.get(this.currentRecordingId);
                    if (currentRecording) {
                        currentRecording.chunks.push(event.data);
                        this.activeRecordings.set(this.currentRecordingId, currentRecording);
                    }
                }
            };

            // Set up voice activity detection
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            let silenceStart = Date.now();

            // Define the audio check function as a class method to maintain proper scope
            let lastFrameTime = 0;
            const frameInterval = 100; // Process audio every 100ms instead of every frame

            const intervalHandler = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = this.calculateWeightedAverage(dataArray);

                if (average > sensitivityMin) {
                    if (!this.currentRecordingId) {
                        this.handleSpeechStart();
                    }
                    silenceStart = Date.now();
                } else if (this.currentRecordingId && Date.now() - silenceStart > 500) {
                    this.handleSpeechEnd();
                }
            };

            this.intervalId = window.setInterval(intervalHandler, 5);
            console.log('Interval set:', this.intervalId); // Add this line
            
        } catch (error) {
            this.isListening = false;
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    async stopListening(): Promise<void> {
        console.log('Stopping speech recognition...');
        console.log('stopListening called, timeoutId:', this.intervalId);

        // Set isListening to false first to prevent new frames from being scheduled
        this.isListening = false;

        // Cancel the animation frame
        if (this.intervalId !== null) {
            console.log('Clearing interval:', this.intervalId);
            window.clearInterval(this.intervalId);
            this.intervalId = null; // Set to null AFTER clearing the interval
        } else {
            console.log('No interval to clear');
        }        

        this.isWakeWordDetected = false;
        this.isSpeaking = false;

        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try {
                this.mediaRecorder.stop();
            } catch (e) {
                console.warn('Error stopping media recorder:', e);
            }
        }

        // Stop all media tracks
        if (this.mediaRecorder && this.mediaRecorder.stream) {
            const tracks = this.mediaRecorder.stream.getTracks();
            console.log('Stopping', tracks.length, 'media tracks');
            tracks.forEach(track => {
                try {
                    track.stop();
                    console.log('Stopped track:', track.kind, track.id);
                } catch (e) {
                    console.warn('Error stopping media track:', e);
                }
            });
        }

        // Clean up transcription manager
        if (this.transcriptionManager) {
            this.transcriptionManager.cleanup();
        }

        // Clear any pending recordings
        this.activeRecordings.clear();
        this.currentRecordingId = null;

        console.log('Speech recognition stopped completely');
    }

    private async handleTranscription(text: string): Promise<void> {
        const normalizedText = await AudioUtils.cleanTranscription(text);
        console.log('Transcribed:', normalizedText);

        if (!this.isWakeWordDetected) {
            if (normalizedText.includes('iris')) {
                console.log('Wake word detected!');
                this.isWakeWordDetected = true;

                normalizedText.replace('iris', '')

                await this.processCommand(normalizedText)
                if (this.commandTimeout) {
                    clearTimeout(this.commandTimeout);
                }
                this.commandTimeout = setTimeout(() => {
                    this.isWakeWordDetected = false;
                    console.log('Listening timeout. Waiting for wake word...');
                }, 10000);
            }
        } else {
            console.log('Processing command:', normalizedText);
            if (this.commandTimeout) {
                clearTimeout(this.commandTimeout);
            }
            this.commandTimeout = setTimeout(() => {
                this.isWakeWordDetected = false;
                console.log('Command timeout. Waiting for wake word...');
            }, 10000);

            await this.processCommand(normalizedText);
        }
    }

    private async processCommand(command: string): Promise<void> {
        if (command === 'stop listening') {
            this.stopListening();
            return;
        }

        // Use the commands.ts executeCommand function to process the command
        const commandExecuted = executeCommand(command);

        if (commandExecuted) {
            console.log(`Command "${command}" executed successfully`);
        } else {
            console.log(`Unknown command: "${command}"`);
            // Optionally handle unknown commands here
        }
    }

    private transcribeAudio(audioData: Float64Array, recordingId: string): void {
        // Fire and forget - don't await the transcription
        this.transcriptionManager?.transcribe(audioData)
            .then(text => {
                // Handle the transcription result when it's ready
                return this.handleTranscription(text);
            })
            .then(() => {
                console.log('Transcription completed for:', recordingId);
            })
            .catch(error => {
                console.error('Transcription error:', error, recordingId);
            });
    }




    cleanup() {
        this.stopListening();

        // Close audio context
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            this.audioContext = null;
        }

        // Reset all state
        this.isInitialized = false;
        this.mediaRecorder = null;
        this.isWakeWordDetected = false;
        this.isListening = false;
        this.commandTimeout = null;
        this.isSpeaking = false;
        this.activeRecordings = new Map();
        this.currentRecordingId = null;
        this.intervalId = null;

        console.log('Speech recognition service cleaned up');
    }
}

const speech = new SpeechRecognitionService()
export default speech;