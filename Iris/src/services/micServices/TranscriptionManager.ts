export class TranscriptionManager {
    private workers: Map<string, Worker> = new Map();
    private taskQueue: string[] = [];
    private isProcessing: boolean = false;
    private isShutdown: boolean = false;

    constructor() {
        // Constructor remains minimal - we'll create workers on demand
    }

    public async transcribe(audioData: Float64Array): Promise<string> {
        if (this.isShutdown) {
            return Promise.reject(new Error("TranscriptionManager has been shut down"));
        }
        
        // Generate a unique ID for this transcription task
        const taskId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            // Create a new worker for this task
            const worker = new Worker(
                new URL('./transcriptionWorker.ts', import.meta.url),
                { type: 'module' }
            );

            // Store the worker with its taskId
            this.workers.set(taskId, worker);

            // Set up message handler for this specific worker
            worker.onmessage = (e) => {
                const { type, result, error } = e.data;
                
                if (error) {
                    this.cleanupWorker(taskId);
                    reject(new Error(error));
                    return;
                }

                if (result) {
                    this.cleanupWorker(taskId);
                    resolve(result);
                }
            };

            // Handle worker errors
            worker.onerror = (error) => {
                this.cleanupWorker(taskId);
                reject(error);
            };

            // Initialize the worker
            worker.postMessage({ type: 'init' });

            // Send the transcription task once worker is initialized
            worker.onmessage = (e) => {
                if (e.data.type === 'initialized') {
                    // Send the actual transcription task
                    worker.postMessage({
                        type: 'transcribe',
                        audioData,
                        taskId
                    });

                    // Reset onmessage handler to the one that handles results
                    worker.onmessage = (e) => {
                        const { taskId, result, error } = e.data;
                        
                        if (error) {
                            this.cleanupWorker(taskId);
                            reject(new Error(error));
                            return;
                        }

                        if (result) {
                            this.cleanupWorker(taskId);
                            resolve(result);
                        }
                    };
                } else if (e.data.type === 'error') {
                    this.cleanupWorker(taskId);
                    reject(new Error(e.data.error));
                }
            };
        });
    }

    private cleanupWorker(taskId: string) {
        const worker = this.workers.get(taskId);
        if (worker) {
            // Send terminate message before actually terminating
            worker.postMessage({ type: 'terminate' });
            
            // Give the worker a small time to clean up
            setTimeout(() => {
                worker.terminate();
                this.workers.delete(taskId);
            }, 100);
        }
    }

    public cleanup() {
        this.isShutdown = true;
        
        // Terminate all workers
        for (const [taskId, worker] of this.workers) {
            // Send terminate message before actually terminating
            worker.postMessage({ type: 'terminate' });
            
            // Give the worker a small time to clean up
            setTimeout(() => {
                worker.terminate();
            }, 100);
        }
        this.workers.clear();
    }

    public getActiveTranscriptionCount(): number {
        return this.workers.size;
    }
}
