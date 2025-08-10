import arcjet, { tokenBucket } from '@arcjet/next';

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ["userId"], // Track based on Clerk user ID 
    rules: [
        tokenBucket({
            mode:"LIVE",
            refillRate: 80, // 10 tokens every hour
            interval: 3600, // Refill every hour
            capacity: 80, 
        })
    ]
})

export default aj;