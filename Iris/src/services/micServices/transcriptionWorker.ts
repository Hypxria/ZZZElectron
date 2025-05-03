import { pipeline } from '@xenova/transformers';

let recognizer: any = null;
let isTerminated = false;

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
            try {
                recognizer = await pipeline(
                    'automatic-speech-recognition',
                    'Xenova/whisper-tiny.en',
                    {
                        // @ts-ignore
                        chunk_length_s: 3,
                        stride_length_s: 1.5,
                        language: 'english',
                        task: 'transcribe',
                        return_timestamps: false,
                        max_new_tokens: 128,
                        temperature: 0,
                        condition_on_previous_text: false,
                        no_speech_threshold: 0.8,

                        batch_size: 8,              // Increase batch size for parallel processing
                        num_workers: 4,             // Use multiple workers for processing
                        enable_cpu_offload: true,   // Enable CPU offload for larger models
                        quantized: true,            // Use quantized model if available
                    }
                );
                self.postMessage({ type: 'initialized' });
            } catch (error) {
                self.postMessage({ 
                    type: 'error', 
                    error: 'Failed to initialize: ' + error.message 
                });
            }
            break;

        case 'transcribe':
            try {
                if (!recognizer) {
                    throw new Error('Recognizer not initialized');
                }
                
                const result = await recognizer(audioData);
                
                // Check if terminated during transcription
                if (isTerminated) return;
                
                const cleanText = result.text
                    .toLowerCase()
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
                
                self.postMessage({
                    taskId,
                    result: cleanText
                });
            } catch (error) {
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
