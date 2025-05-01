import { AudioUtils } from './AudioUtils.ts';
import { AudioProcessor } from './AudioProcessor.ts';
import { TranscriptionManager } from './TranscriptionManager.ts';

let pipeline: any;
let read_audio: any;

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

export class SpeechRecognitionService {
    private isInitialized: boolean = false;
    private mediaRecorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private isWakeWordDetected: boolean = false;
    private isListening: boolean = false;
    private commandTimeout: NodeJS.Timeout | null = null;
    private silenceTimeout: NodeJS.Timeout | null = null;
    private isSpeaking: boolean = false;
    private transcriptionManager: TranscriptionManager;
    private activeRecordings: Map<string, {
        chunks: Blob[],
        startTime: number
    }> = new Map();
    private currentRecordingId: string | null = null;  // Track current active recording

   

    constructor() {
        this.transcriptionManager = new TranscriptionManager();
        // Initialize transformers when service is created
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000, // Set fixed sample rate
            latencyHint: 'interactive'
        });
    }

    async initialize() {
        if (!this.isInitialized) {
            try {
                pipeline = await initializeTransformers();

                read_audio = await initializeUtils();

                // Initialize transformers when service is created
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000, // Set fixed sample rate
                    latencyHint: 'interactive'
                });

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
        this.isListening = true;
        this.isWakeWordDetected = false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId,
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16,
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

            const checkAudioLevel = () => {
                if (!this.isListening) return;

                analyser.getByteFrequencyData(dataArray);
                const average = this.calculateWeightedAverage(dataArray);
                // console.log(average)

                if (average > sensitivityMin) { // Adjust threshold as needed
                    if (!this.currentRecordingId) { // Check currentRecordingId instead of isSpeaking
                        this.handleSpeechStart();
                    }
                    silenceStart = Date.now();
                } else if (this.currentRecordingId && Date.now() - silenceStart > 250) {
                    this.handleSpeechEnd();
                }
            };

            const runAudioCheck = () => {
                // console.log('ran animation')
                checkAudioLevel();

                // Always schedule next frame while listening
                requestAnimationFrame(runAudioCheck);
            };

            requestAnimationFrame(() => {
                runAudioCheck();
            });


            console.log('Started listening for wake word...');
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    stopListening(): void {
        this.isListening = false;
        this.isWakeWordDetected = false;
        this.isSpeaking = false;

        if (this.commandTimeout) {
            clearTimeout(this.commandTimeout);
        }

        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            const tracks = this.mediaRecorder.stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        console.log('Stopped listening');
    }


    private async handleTranscription(text: string): Promise<void> {
        const normalizedText = await AudioUtils.cleanTranscription(text);
        console.log('Transcribed:', normalizedText);

        if (!this.isWakeWordDetected) {
            if (normalizedText.includes('hey iris')) {
                console.log('Wake word detected!');
                this.isWakeWordDetected = true;
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
        if (command.includes('stop listening')) {
            this.stopListening();
        } else {
            console.log('Command received:', command);
        }
    }

    private transcribeAudio(audioData: Float64Array, recordingId: string): void {
        // Fire and forget - don't await the transcription
        this.transcriptionManager.transcribe(audioData)
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
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

