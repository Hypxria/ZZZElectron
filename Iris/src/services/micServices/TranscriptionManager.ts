// services/TranscriptionManager.ts
import path from 'path';

interface TranscriptionTask {
    id: string;
    audioData: Float64Array;
    timestamp: number;
}

export class TranscriptionManager {
    private recognizerPool: any[] = [];
    private poolSize: number = 3; // Number of concurrent transcriptions possible
    private activeTranscriptions: Set<string> = new Set();
    private pipeline: any
    private worker: Worker;
    private transcriptionCallbacks: Map<string, { 
        resolve: (value: string) => void, 
        reject: (reason?: any) => void 
    }> = new Map();


    constructor() {
        const workerUrl = new URL('./transcriptionWorker.ts', window.location.origin + '/src/services/micServices/').href;

        this.worker = new Worker(workerUrl, {
            type: 'module'
        });

        this.worker.onmessage = (event) => {
            const { taskId, result, error } = event.data;

            if (error) {
                const callback = this.transcriptionCallbacks.get(taskId);
                if (callback) {
                    callback.reject(error);
                    this.transcriptionCallbacks.delete(taskId);
                    this.activeTranscriptions.delete(taskId);
                }
            } else {
                const callback = this.transcriptionCallbacks.get(taskId);
                if (callback) {
                    callback.resolve(result);
                    this.transcriptionCallbacks.delete(taskId);
                    this.activeTranscriptions.delete(taskId);
                }
            }
        };

        // Initialize the worker
        this.worker.postMessage({ type: 'init' });
    }

    async initialize() {
        try {
            this.setupWorkerHandlers();
        } catch (error) {
            console.error('Failed to initialize worker:', error);
            throw error;
        }
    }

    private setupWorkerHandlers() {
        if (!this.worker) return;

        this.worker.onmessage = (event) => {
            const { taskId, result, error } = event.data;
            
            if (error) {
                const callback = this.transcriptionCallbacks.get(taskId);
                if (callback) {
                    callback.reject(error);
                    this.transcriptionCallbacks.delete(taskId);
                    this.activeTranscriptions.delete(taskId);
                }
            } else {
                const callback = this.transcriptionCallbacks.get(taskId);
                if (callback) {
                    callback.resolve(result);
                    this.transcriptionCallbacks.delete(taskId);
                    this.activeTranscriptions.delete(taskId);
                }
            }
        };

        // Initialize the worker
        this.worker.postMessage({ type: 'init' });
    }


    async transcribe(audioData: Float64Array): Promise<string> {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }

        return new Promise((resolve, reject) => {
            const taskId = crypto.randomUUID();
            this.activeTranscriptions.add(taskId);
            this.transcriptionCallbacks.set(taskId, { resolve, reject });

            this.worker!.postMessage({
                type: 'transcribe',
                taskId,
                audioData
            }, [audioData.buffer]); // Transfer the buffer for better performance
        });
    }


    getActiveTranscriptions() {
        return this.activeTranscriptions;
    }
}
