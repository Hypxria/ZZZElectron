import { pipeline } from '@xenova/transformers'

let recognizer: any = null;

// Handle messages from main thread
self.onmessage = async (e) => {
    const { type, audioData, taskId } = e.data;

    
    switch (type) {
        case 'init':
            try {
                recognizer = await pipeline(
                    'automatic-speech-recognition',
                    'Xenova/whisper-tiny.en',
                    {
                        //@ts-ignore
                        chunk_length_s: 3,
                        stride_length_s: 1.5,
                        language: 'english',
                        task: 'transcribe',
                        return_timestamps: false,
                        max_new_tokens: 128,
                        temperature: 0,
                        condition_on_previous_text: false,
                        no_speech_threshold: 0.8,
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
                self.postMessage({
                    taskId,
                    error: error.message
                });
            }
            break;
    }
};
