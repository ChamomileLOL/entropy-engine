import { useState, useEffect, useRef } from 'react';
import './App.css';
import { predictNextValue, repairMergedPacket } from './mathUtils';

function App() {
  const [dataPoints, setDataPoints] = useState([]); // Stores objects: { time, price, isRepaired }
  const [status, setStatus] = useState('DISCONNECTED');
  const ws = useRef(null);
  
  // We keep a "Clean History" just for the Math Engine to learn from
  const historyRef = useRef([]); 

  // --- THE VAULT TRANSMITTER ---
  // Sends data to MongoDB via the Backend API
  const saveToBackend = async (packet) => {
    try {
      await fetch('http://localhost:4000/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      });
      // Note: We don't log success here to avoid console spam, 
      // but the backend will log [BLOCKCHAIN] Signed & Saved
    } catch (err) {
      console.error("Save Failed (Offline?):", err);
    }
  };

  useEffect(() => {
    // 1. ESTABLISH CONNECTION
    ws.current = new WebSocket('ws://localhost:4000');

    ws.current.onopen = () => setStatus('CONNECTED: ENTROPY ENGINE ONLINE');
    
    // 2. THE CHAOS LISTENER
    ws.current.onmessage = (event) => {
      const raw = event.data;
      if (raw.includes('PROTOCOL_INIT')) return;

      let timestamp, price, hash, isRepaired = false;
      const parts = raw.split('|');

      // --- THE DEFENSE LOGIC ---
      
      // CASE 1: HEALTHY PACKET
      if (parts.length === 3 && !isNaN(parts[1])) {
        timestamp = parseInt(parts[0]);
        price = parseFloat(parts[1]);
        hash = parts[2];
      } 
      
      // CASE 2: DATA ROT (NaN) -> EXECUTE REGRESSION
      else if (parts.length === 3 && parts[1] === 'NaN') {
        console.warn('⚠️ DETECTED NaN. Autopilot engaging...');
        timestamp = parseInt(parts[0]);
        hash = parts[2];
        
        // PREDICT the price based on history
        price = predictNextValue(historyRef.current);
        isRepaired = true;
      } 
      
      // CASE 3: MERGED STRING (Missing Pipe) -> EXECUTE SURGERY
      else if (parts.length === 2) {
        // parts[0] is the messy "1706...120.45" blob
        console.warn('⚠️ DETECTED MERGED PACKET. Performing surgery...');
        const fixed = repairMergedPacket(parts[0]);
        timestamp = fixed.timestamp;
        price = fixed.price;
        hash = parts[1];
        isRepaired = true;
      }

      // Update History (Keep last 20 for the math engine)
      if (!isNaN(price)) {
        historyRef.current = [...historyRef.current, price].slice(-20);
      }

      // Prepare the final packet
      const packet = { timestamp, price, hash, isRepaired };

      // A. Update UI
      const uiData = { ...packet, raw };
      setDataPoints(prev => [uiData, ...prev].slice(0, 10));

      // B. SEND TO VAULT (MongoDB)
      saveToBackend(packet);
    };

    return () => ws.current && ws.current.close();
  }, []);

  return (
    <div className="container">
      <h1>THE ENTROPY ENGINE</h1>
      <div className={`status ${status.includes('CONNECTED') ? 'live' : 'dead'}`}>
        {status}
      </div>

      <div className="stream-log">
        <h3>LIVE RECOVERY STREAM</h3>
        <div className="header-row">
          <span>TIME</span>
          <span>PRICE</span>
          <span>STATUS</span>
        </div>
        
        {dataPoints.map((pt, i) => (
          <div key={i} className={`packet ${pt.isRepaired ? 'repaired' : 'clean'}`}>
            <span>{pt.timestamp || 'ERR'}</span>
            <span>{Number(pt.price).toFixed(2)}</span>
            <span>
              {pt.isRepaired ? '🔧 REPAIRED' : '✓ VALID'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;