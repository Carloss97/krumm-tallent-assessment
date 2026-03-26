/**
 * Webcam Capture Utility v2
 * 
 * Captura de video con análisis de:
 * - Presencia de rostro
 * - Parpadeo (blink rate, duration)
 * - Postura de cabeza (yaw, pitch, roll)
 * - Calidad de señal (luminancia, contraste)
 * 
 * Quality gates automáticos para evitar inferencias falsas
 */

export class WebcamCapture {
  constructor(onFrameCapture = null) {
    this.videoElement = null;
    this.canvasElement = null;
    this.stream = null;
    this.isCapturing = false;
    this.onFrameCapture = onFrameCapture;
    
    // Almacenar historial para análisis
    this.frameHistory = [];
    this.maxHistoryFrames = 60; // 2 segundos a 30fps

    // Estadísticas
    this.stats = {
      totalFrames: 0,
      faceDetectedFrames: 0,
      avgQualityScore: 0,
      blinkRate: 0,
      avgBlinkDuration: 0,
      headPoseDrift: null
    };
  }

  /**
   * Inicializar captura de webcam
   */
  async initialize(videoElement) {
    try {
      this.videoElement = videoElement;
      
      // Solicitar acceso a cámara
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;

      // Esperar a que el video esté listo
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Webcam initialization failed:', error);
      return false;
    }
  }

  /**
   * Iniciar captura de frames
   */
  startCapture() {
    if (!this.videoElement) return false;
    
    this.isCapturing = true;
    this.frameHistory = [];
    this.stats = {
      totalFrames: 0,
      faceDetectedFrames: 0,
      avgQualityScore: 0,
      blinkRate: 0,
      avgBlinkDuration: 0,
      headPoseDrift: null
    };

    this.captureFrame();
    return true;
  }

  /**
   * Parar captura
   */
  stopCapture() {
    this.isCapturing = false;
  }

  /**
   * Frame by frame capture con análisis
   */
  async captureFrame() {
    if (!this.isCapturing || !this.videoElement) return;

    try {
      // Crear canvas para análisis
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
      }

      const ctx = this.canvasElement.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

      // Análisis de frame
      const frameAnalysis = {
        timestamp: Date.now(),
        qualityScore: this.analyzeQuality(imageData),
        faceDetected: this.detectFacePresence(imageData),
        blinkDetected: this.detectBlink(imageData),
        headPose: this.estimateHeadPose(imageData),
      };

      // Mantener historial
      this.frameHistory.push(frameAnalysis);
      if (this.frameHistory.length > this.maxHistoryFrames) {
        this.frameHistory.shift();
      }

      // Actualizar estadísticas
      this.updateStats();

      // Callback si está suscrito
      if (this.onFrameCapture) {
        this.onFrameCapture(frameAnalysis);
      }

      // Siguiente frame (~30fps)
      setTimeout(() => this.captureFrame(), 33);
    } catch (error) {
      console.error('Frame capture error:', error);
    }
  }

  /**
   * Analizar calidad de frame (luminancia y contraste)
   */
  analyzeQuality(imageData) {
    const data = imageData.data;
    let sum = 0;
    let variance = 0;

    // Calcular promedio de luminancia
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += luminance;
    }
    const mean = sum / (data.length / 4);

    // Calcular varianza (contraste)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      variance += Math.pow(luminance - mean, 2);
    }
    variance = variance / (data.length / 4);

    // Score: luminancia [50-200] ideal, contraste [50-150] ideal
    const luminanceScore = Math.min(100, Math.max(0, 100 - Math.abs(mean - 125) / 2));
    const contrastScore = Math.min(100, Math.sqrt(variance));

    // Ponderado
    return Math.round((luminanceScore * 0.6 + contrastScore * 0.4));
  }

  /**
   * Detectar presencia de rostro (simple: detectar región con piel)
   */
  detectFacePresence(imageData) {
    const data = imageData.data;
    let skinPixels = 0;

    // Heurística simple de color de piel (rango RGB aproximado)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Rango aproximado de piel (puede variar por iluminación)
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15) {
        skinPixels++;
      }
    }

    // Si >10% de píxeles son piel, asumir rostro presente
    return (skinPixels / (data.length / 4)) > 0.1;
  }

  /**
   * Detectar parpadeo (cambio rápido de brillo en región ocular superior)
   */
  detectBlink(imageData) {
    // Simplificación: si luminancia cae significativamente en última captura
    // (real eyes.js o similar daría mejor precisión)
    const height = this.canvasElement.height;
    const width = this.canvasElement.width;
    const data = imageData.data;

    // Analizar región superior (ojos)
    let eyeRegionBrightness = 0;
    const eyeRegionPixels = 0.1 * width * height;
    for (let y = 0; y < height * 0.15; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        eyeRegionBrightness += lum;
      }
    }

    eyeRegionBrightness /= eyeRegionPixels;

    // Comparar con histórico
    if (this.frameHistory.length > 5) {
      const prevGoodFrames = this.frameHistory.slice(-5, -1);
      const avgPrevBrightness = prevGoodFrames.reduce((sum, f) => {
        return sum + (f.eyeRegionBrightness || 0);
      }, 0) / prevGoodFrames.length;

      // Blink si caída >20%
      return eyeRegionBrightness < avgPrevBrightness * 0.8;
    }

    return false;
  }

  /**
   * Estimar postura de cabeza (yaw, pitch, roll)
   * Nota: Versión simplificada. Para mejor precisión usar ml5.js o face-api
   */
  estimateHeadPose(imageData) {
    // Placeholder: retornar estimado simple
    // En producción, usar librería especial

    const width = this.canvasElement.width;
    const height = this.canvasElement.height;
    const data = imageData.data;

    // Buscar punto más brillante (nariz aproximada)
    let maxBrightness = 0;
    let noseX = width / 2;
    let noseY = height / 2;

    for (let y = height * 0.2; y < height * 0.6; y++) {
      for (let x = width * 0.3; x < width * 0.7; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          noseX = x;
          noseY = y;
        }
      }
    }

    // Calcular ángulos (muy simplificado)
    const centerX = width / 2;
    const centerY = height / 2;
    const yaw = ((noseX - centerX) / width) * 45; // -45 to +45 deg
    const pitch = ((noseY - centerY) / height) * 30; // -30 to +30 deg
    const roll = 0; // Sin cálculo especial por ahora

    return {
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
      confidence: 0.5 // Baja confianza sin ML
    };
  }

  /**
   * Actualizar estadísticas globales
   */
  updateStats() {
    if (this.frameHistory.length === 0) return;

    this.stats.totalFrames = this.frameHistory.length;
    this.stats.faceDetectedFrames = this.frameHistory.filter(f => f.faceDetected).length;

    // Promedio de calidad
    this.stats.avgQualityScore = Math.round(
      this.frameHistory.reduce((sum, f) => sum + f.qualityScore, 0) / this.frameHistory.length
    );

    // Detectar blinks
    let blinkCount = 0;
    let blinkDurations = [];
    let inBlink = false;
    let blinkStart = 0;

    for (const frame of this.frameHistory) {
      if (frame.blinkDetected && !inBlink) {
        inBlink = true;
        blinkStart = frame.timestamp;
        blinkCount++;
      } else if (!frame.blinkDetected && inBlink) {
        inBlink = false;
        blinkDurations.push(frame.timestamp - blinkStart);
      }
    }

    const durationMs = this.frameHistory[this.frameHistory.length - 1].timestamp - this.frameHistory[0].timestamp;
    this.stats.blinkRate = durationMs > 0 ? Math.round((blinkCount / durationMs) * 60000) : 0;
    this.stats.avgBlinkDuration = blinkDurations.length > 0 
      ? Math.round(blinkDurations.reduce((a, b) => a + b) / blinkDurations.length)
      : 0;
  }

  /**
   * Obtener quality gate status
   * @param {number} threshold Umbral mínimo de calidad (0-100)
   * @returns {boolean} true si pasa quality gate, false si debe descartarse
   */
  passesQualityGate(threshold = 60) {
    return this.stats.avgQualityScore >= threshold && 
           this.stats.faceDetectedFrames > (this.stats.totalFrames * 0.7);
  }

  /**
   * Obtener reporte de telemetría para enviar a backend
   */
  getTelemetryReport() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      qualityGatePassed: this.passesQualityGate(),
      frameCount: this.frameHistory.length,
      avgHeadPose: this.getAverageHeadPose()
    };
  }

  /**
   * Calcular postura promedio de cabeza
   */
  getAverageHeadPose() {
    if (this.frameHistory.length === 0) return null;

    const avgYaw = Math.round(
      this.frameHistory.reduce((sum, f) => sum + (f.headPose?.yaw || 0), 0) / this.frameHistory.length
    );
    const avgPitch = Math.round(
      this.frameHistory.reduce((sum, f) => sum + (f.headPose?.pitch || 0), 0) / this.frameHistory.length
    );

    return { yaw: avgYaw, pitch: avgPitch };
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.stopCapture();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.frameHistory = [];
  }
}

export default WebcamCapture;
