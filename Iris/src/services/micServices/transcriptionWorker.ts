import { pipeline } from '@xenova/transformers';

let recognizer: any = null;
let isTerminated = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Cache for better performance
const textCleanupRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
const multipleSpacesRegex = /\s{2,}/g;

// Initialize the recognizer
async function initializeRecognizer() {
    if (recognizer || isInitializing) return;
    
    isInitializing = true;
    
    try {
        // Use smaller, faster model with optimized settings
        recognizer = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny.en', // Use tiny model for speed
            {
                // @ts-ignore
                chunk_length_s: 2, // Smaller chunks for faster processing
                stride_length_s: 1, // Smaller stride for better accuracy
                language: 'english',
                task: 'transcribe',
                return_timestamps: false,
                max_new_tokens: 64, // Reduced for faster processing
                temperature: 0,
                condition_on_previous_text: false,
                no_speech_threshold: 0.6, // More aggressive filtering
                
                // Performance optimizations
                batch_size: 16,             // Larger batch size for better throughput
                num_workers: 4,             // Use multiple workers
                enable_cpu_offload: true,   // Enable CPU offload
                quantized: true,            // Use quantized model for speed
            }
        );
        
        // Warm up the model with a dummy input
        const dummyInput = new Float32Array(1600); // 100ms at 16kHz
        await recognizer(dummyInput);
        
        self.postMessage({ type: 'initialized' });
    } catch (error: any) {
        self.postMessage({ 
            type: 'error', 
            error: 'Failed to initialize: ' + error.message 
        });
    } finally {
        isInitializing = false;
    }
}

// Handle messages from main thread
self.onmessage = async (e) => {
    const { type, audioData, taskId } = e.data;

    // Check if terminated before processing any message
    if (isTerminated && type !== 'terminate') {
        return;
    }

    switch (type) {
        case 'terminate':
            isTerminated = true;
            // Clean up resources
            recognizer = null;
            self.postMessage({ type: 'terminated' });
            break;
            
        case 'init':
            // Initialize only once and reuse
            if (!initPromise) {
                initPromise = initializeRecognizer();
            }
            await initPromise;
            break;

        case 'transcribe':
            try {
                if (!recognizer) {
                    // Initialize if not already done
                    await initializeRecognizer();
                    if (!recognizer) {
                        throw new Error('Recognizer initialization failed');
                    }
                }
                
                // Skip processing for empty audio
                if (!audioData || audioData.length < 100) {
                    self.postMessage({
                        taskId,
                        result: ''
                    });
                    return;
                }
                
                // Process audio with explicit type casting to handle the Float64Array
                // @ts-ignore - Ignore type checking for the recognizer call
                const result = await recognizer(audioData);
                
                // Check if terminated during transcription
                if (isTerminated) return;
                
                // Optimize text cleaning with cached regex
                const cleanText = result.text
                    .toLowerCase()
                    .replace(textCleanupRegex, '')
                    .replace(multipleSpacesRegex, ' ')
                    .trim();
                
                self.postMessage({
                    taskId,
                    result: cleanText
                });
            } catch (error: any) {
                if (!isTerminated) {
                    self.postMessage({
                        taskId,
                        error: error.message
                    });
                }
            }
            break;
    }
};