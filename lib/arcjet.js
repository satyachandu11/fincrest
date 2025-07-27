import arcjet, { tokenBucket } from '@arcjet/next';

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ["userId"], // Track based on Clerk user ID 
    rules: [
        tokenBucket({
            mode:"LIVE",
            refillRate: 10, // 10 tokens per second
            interval: 3600, // Refill every second
            capacity: 10, 
        })
    ]
})

export default aj;