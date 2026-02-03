const mongoose = require('mongoose');

const entropySchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    price: { type: Number, required: true },
    hash: { type: String, required: true },
    isRepaired: { type: Boolean, default: false },
    meta: {
        severity: { type: String, enum: ['LOW', 'CRITICAL'], default: 'LOW' }
    }
});

// --- THE TRAP: THE ODD TIMESTAMP KILLER ---
// "Middleware" that runs before every Save.
// If the timestamp is ODD, we throw an error and refuse to save.
entropySchema.pre('save', function(next) {
    if (this.timestamp % 2 !== 0) {
        // This is the silent killer. It stops 50% of data.
        const err = new Error('BLOCKCHAIN_REJECTION: Odd Timestamp Detected.');
        return next(err);
    }
    next();
});

module.exports = mongoose.model('EntropyData', entropySchema);