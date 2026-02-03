// frontend/src/mathUtils.js

/**
 * LINEAR REGRESSION PREDICTOR
 * Calculates the best-fit line (y = mx + c) for the given history
 * and predicts the next value.
 * * @param {Array} history - Array of valid numbers (e.g., [120, 122, 121...])
 * @returns {Number} - The predicted next value
 */
export function predictNextValue(history) {
    const n = history.length;
    if (n < 2) return 100; // Not enough data? Return base line.

    let sumX = 0; // Sum of indices (time)
    let sumY = 0; // Sum of prices
    let sumXY = 0;
    let sumXX = 0;

    // We treat the index (0, 1, 2...) as X (Time)
    // We treat the price as Y (Value)
    for (let x = 0; x < n; x++) {
        const y = history[x];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    // Calculate Slope (m)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate Intercept (c)
    const intercept = (sumY - slope * sumX) / n;

    // Predict for the NEXT index (which is 'n')
    // y = mx + c
    return (slope * n) + intercept;
}

/**
 * STRING REPAIR
 * Fixes the "Missing Pipe" corruption (e.g., "17066...120.45")
 */
export function repairMergedPacket(badString) {
    // We know Timestamp is usually 13 digits (milliseconds)
    const timestamp = badString.substring(0, 13);
    const price = badString.substring(13); // The rest is the price
    return {
        timestamp: parseInt(timestamp),
        price: parseFloat(price)
    };
}