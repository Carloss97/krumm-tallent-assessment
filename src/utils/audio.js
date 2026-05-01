// Initialize AudioContext safely (may not be available in jsdom test environment)
let audioCtx = null;
try {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass && typeof AudioContextClass === 'function') {
    audioCtx = new AudioContextClass();
  }
} catch (err) {
  // AudioContext not available (e.g., in jsdom test environment)
  if (typeof console !== 'undefined' && import.meta?.env?.DEV) {
    console.debug('AudioContext unavailable:', err.message);
  }
}

const DEBUG_AUDIO = Boolean(import.meta?.env?.DEV || import.meta?.env?.VITE_DEBUG_MODE);

const playTone = (freq, type, duration, vol=0.1, freqSlide=null) => {
  if (!audioCtx) return; // Skip if AudioContext not available
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (freqSlide) {
      osc.frequency.exponentialRampToValueAtTime(freqSlide, audioCtx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    // Ignore audio errors if user hasn't interacted with document (autoplay policy)
    if (typeof console !== 'undefined' && DEBUG_AUDIO) {
      console.debug('Audio playback unavailable:', err.message);
    }
  }
};

export const playMemoryFlash = () => playTone(523.25, 'sine', 0.3, 0.03); // C5 soft
export const playMemoryClick = () => playTone(659.25, 'sine', 0.15, 0.03); // E5 soft click

export const playBalloonPump = () => playTone(200, 'triangle', 0.15, 0.05, 300); // Low pitch sliding up
export const playBalloonPop = () => {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // lowpass filter for a "pop/thud" instead of sharp static
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  } catch (err) {
    // Ignore audio errors caused by autoplay/browser restrictions
    if (typeof console !== 'undefined' && DEBUG_AUDIO) {
      console.debug('Balloon pop audio unavailable:', err.message);
    }
  }
};
