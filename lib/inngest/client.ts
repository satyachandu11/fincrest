import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "fincrest",
    name: "FinCrest",
    retryFunction: async (attempt: number) => ({
        delay: Math.pow(2, attempt) * 1000, // Exponential backoff delay
        maxAttempts: 2, // Retry up to 5 times
    })
});