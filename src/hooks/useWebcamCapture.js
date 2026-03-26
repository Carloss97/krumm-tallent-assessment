import { useEffect, useRef } from 'react';
import WebcamCapture from '../utils/webcamCapture';

export const useWebcamCapture = ({ isActive, shouldCapture, onFrameCapture }) => {
  const videoRef = useRef(null);
  const captureRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    if (!isActive || !shouldCapture) {
      return undefined;
    }

    const initializeCapture = async () => {
      if (!videoRef.current || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      captureRef.current = new WebcamCapture(onFrameCapture);
      const initialized = await captureRef.current.initialize(videoRef.current);

      if (!isMounted || !initialized) {
        captureRef.current?.cleanup();
        captureRef.current = null;
        return;
      }

      captureRef.current.startCapture();
    };

    initializeCapture();

    return () => {
      isMounted = false;
      captureRef.current?.cleanup();
      captureRef.current = null;
    };
  }, [isActive, shouldCapture, onFrameCapture]);

  return videoRef;
};

export default useWebcamCapture;