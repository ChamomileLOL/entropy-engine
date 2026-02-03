// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const EntropyData = require('./models/EntropyData');

// --- 1. INITIALIZATION ---
const app = express();
const server = http.createServer(app);

// MIDDLEWARE (Must be before routes)
app.use(cors());
app.use(express.json()); // Critical for parsing POST body

// SECRETS
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'xavier-secret-eth-key-v1';

// --- 2. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected: The Vault is Open'))
    .catch(err => console.error('DB Connection Error:', err));

// --- 3. THE CHAOS GENERATOR (WebSocket) ---
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client Connected. INITIATING CHAOS STREAM...');
    
    // Handshake
    ws.send('PROTOCOL_INIT|V1|ENTROPY_ENGINE');

    // The Heartbeat (1 Second Tick)
    const intervalId = setInterval(() => {
        // A. Generate Stock Data
        const timestamp = Date.now();
        const basePrice = 100 + Math.sin(timestamp / 1000) * 50;
        const randomNoise = (Math.random() * 10) - 5;
        let price = (basePrice + randomNoise).toFixed(2);
        
        // B. Generate Mock Security Hash
        const hash = Math.random().toString(36).substring(7);

        // C. INJECT CHAOS (The Poison)
        const chance = Math.random();
        let payload = '';

        if (chance < 0.10) {
            console.log(`[CHAOS] Injecting Poison Packet at ${timestamp}`);
            payload = `${timestamp}${price}|${hash}`; // ERROR: Missing Pipe
        } else if (chance < 0.15) {
             console.log(`[CHAOS] Rotting Data at ${timestamp}`);
             payload = `${timestamp}|NaN|${hash}`; // ERROR: NaN Price
        } else {
            payload = `${timestamp}|${price}|${hash}`; // CLEAN
        }

        ws.send(payload);
    }, 1000);

    ws.on('close', () => {
        console.log('Client disconnected.');
        clearInterval(intervalId);
    });
});

// --- 4. THE INGESTION PORT (With Web3 Signing) ---
app.post('/api/record', async (req, res) => {
    try {
        const { timestamp, price, hash, isRepaired } = req.body;

        // A. CRYPTO SIGNING (The Web3 Requirement)
        // We assume the device has a private key and signs the payload
        const payload = `${timestamp}:${price}:${hash}`;
        const signature = crypto
            .createHmac('sha256', PRIVATE_KEY)
            .update(payload)
            .digest('hex');

        // B. PREPARE DOCUMENT
        const newData = new EntropyData({
            timestamp,
            price,
            hash,
            isRepaired,
            signature // Store the proof
        });

        // C. SAVE TO VAULT (The "Odd Timestamp" Trap activates here)
        await newData.save();

        console.log(`[BLOCKCHAIN] Signed & Saved: ${signature.substring(0, 10)}...`);
        res.status(201).json({ success: true, signature });

    } catch (error) {
        // This handles the "Odd Timestamp" rejection from the Model
        console.warn(`[DB REJECTED] ${error.message}`);
        res.status(400).json({ error: 'Data Rejected by Protocol' });
    }
});

// --- 5. START ENGINE ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`ENTROPY ENGINE BACKEND running on port ${PORT}`);
});