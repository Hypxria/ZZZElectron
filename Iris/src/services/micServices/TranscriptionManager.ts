export class TranscriptionManager {
    private workers: Map<string, Worker> = new Map();
    private isShutdown: boolean = false;
    private workerPool: Worker[] = [];
    private maxWorkers: number = 2; // Limit concurrent workers for better performance
    private taskQueue: Array<{
        taskId: string,
        audioData: Float64Array,
        resolve: (result: string) => void,
        reject: (error: Error) => void
    }> = [];
    private processingTasks: Set<string> = new Set();

    constructor() {
        // Pre-initialize worker pool if needed
        this.initWorkerPool();
    }

    private initWorkerPool() {
        // Create a small pool of workers that can be reused
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = this.createWorker();
            this.workerPool.push(worker);
        }
    }

    private createWorker(): Worker {
        const worker = new Worker(
            new URL('./transcriptionWorker.ts', import.meta.url),
            { type: 'module' }
        );
        
        // Initialize the worker immediately
        worker.postMessage({ type: 'init' });
        
        return worker;
    }

    public async init() {
        this.isShutdown = false;
        
        // Make sure worker pool is initialized
        if (this.workerPool.length === 0) {
            this.initWorkerPool();
        }
    }

    public async transcribe(audioData: Float64Array): Promise<string> {
        if (this.isShutdown) {
            return Promise.reject(new Error("TranscriptionManager has been shut down"));
        }
        
        // Skip processing for very small audio chunks (likely noise)
        if (audioData.length < 1000) {
            return Promise.resolve("");
        }
        
        // Generate a unique ID for this transcription task
        const taskId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            // Add task to queue
            this.taskQueue.push({ taskId, audioData, resolve, reject });
            
            // Process queue
            this.processQueue();
        });
    }

    private processQueue() {
        // Don't process if shutdown
        if (this.isShutdown) return;
        
        // Process as many tasks as we have available workers
        while (this.taskQueue.length > 0 && this.processingTasks.size < this.maxWorkers) {
            const task = this.taskQueue.shift();
            if (!task) continue;
            
            const { taskId, audioData, resolve, reject } = task;
            
            // Get an available worker from the pool or create a new one
            let worker: Worker;
            if (this.workerPool.length > 0) {
                worker = this.workerPool.pop()!;
            } else {
                worker = this.createWorker();
            }
            
            // Mark task as processing
            this.processingTasks.add(taskId);
            this.workers.set(taskId, worker);
            
            // Set up message handler
            worker.onmessage = (e) => {
                if (e.data.type === 'initialized') {
                    // Send the transcription task
                    worker.postMessage({
                        type: 'transcribe',
                        audioData,
                        taskId
                    });
                    
                    // Update message handler for results
                    worker.onmessage = (e) => {
                        const { taskId: resultTaskId, result, error } = e.data;
                        
                        if (error) {
                            this.finishTask(resultTaskId, worker);
                            reject(new Error(error));
                            return;
                        }

                        if (result) {
                            this.finishTask(resultTaskId, worker);
                            resolve(result);
                        }
                    };
                } else if (e.data.type === 'error') {
                    this.finishTask(taskId, worker);
                    reject(new Error(e.data.error));
                }
            };
            
            // Handle worker errors - convert ErrorEvent to Error
            worker.onerror = (errorEvent: ErrorEvent) => {
                this.finishTask(taskId, worker);
                // Create a proper Error object from the ErrorEvent
                const error = new Error(errorEvent.message || 'Worker error');
                reject(error);
            };
        }
    }

    private finishTask(taskId: string, worker: Worker) {
        // Remove from processing tasks
        this.processingTasks.delete(taskId);
        this.workers.delete(taskId);
        
        // Return worker to pool if not shutdown
        if (!this.isShutdown) {
            this.workerPool.push(worker);
        } else {
            this.terminateWorker(worker);
        }
        
        // Process next task in queue
        this.processQueue();
    }

    private terminateWorker(worker: Worker) {
        // Send terminate message before actually terminating
        worker.postMessage({ type: 'terminate' });
        
        // Give the worker a small time to clean up
        setTimeout(() => {
            worker.terminate();
        }, 50);
    }

    public cleanup() {
        console.log('Cleaning up TranscriptionManager');
        this.isShutdown = true;
        
        // Clear task queue
        for (const task of this.taskQueue) {
            task.reject(new Error('TranscriptionManager shutdown'));
        }
        this.taskQueue = [];
        
        // Terminate all active workers
        for (const [taskId, worker] of this.workers) {
            this.terminateWorker(worker);
        }
        this.workers.clear();
        
        // Terminate worker pool
        for (const worker of this.workerPool) {
            this.terminateWorker(worker);
        }
        this.workerPool = [];
        
        this.processingTasks.clear();
    }

    public getActiveTranscriptionCount(): number {
        return this.processingTasks.size;
    }
}