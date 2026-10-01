import { EventEmitter } from 'node:events';

class AppEventEmitter extends EventEmitter {}

// Global event emitter instance
export const appEvents = new AppEventEmitter();
appEvents.setMaxListeners(20); // Increase the max listeners to avoid memory leak warnings
