/**
 * Web Audio & MediaRecorder client for elenchus.ai.
 * Captures microphone stream, calculates real-time RMS energy,
 * and encodes recorded samples into standard 16-bit PCM WAV format
 * compatible with Gnani Prisma STT.
 */

export interface AudioRecorderOptions {
  onVolumeChange?: (rms: number) => void; // 0.0 - 1.0
  sampleRate?: number; // default 16000
}

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private recordedSamples: Float32Array[] = [];
  private totalSampleCount = 0;
  private isRecording = false;
  private animFrameId: number | null = null;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: 16000,
      ...options,
    };
  }

  /**
   * Request mic permissions and begin recording.
   */
  async start(): Promise<void> {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    this.audioContext = new AudioContextClass({
      sampleRate: this.options.sampleRate,
    });

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.3;

    // Use ScriptProcessor for low-latency Float32 sample gathering
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.recordedSamples = [];
    this.totalSampleCount = 0;
    this.isRecording = true;

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(inputData.length);
      copy.set(inputData);
      this.recordedSamples.push(copy);
      this.totalSampleCount += copy.length;
    };

    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.startVolumeMonitoring();
  }

  /**
   * Continuously calculate RMS volume and emit callback.
   */
  private startVolumeMonitoring() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      const scaledRms = Math.min(1, Math.max(0, rms * 3.5)); // Scale for visual punch

      if (this.options.onVolumeChange) {
        this.options.onVolumeChange(scaledRms);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  /**
   * Stop recording and return a 16-bit PCM WAV Blob.
   */
  async stop(): Promise<Blob> {
    this.isRecording = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.options.onVolumeChange) {
      this.options.onVolumeChange(0);
    }

    // Clean up nodes
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Merge Float32 samples
    const merged = new Float32Array(this.totalSampleCount);
    let offset = 0;
    for (const chunk of this.recordedSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Encode to 16-bit mono PCM WAV
    const sampleRate = this.options.sampleRate || 16000;
    const wavBlob = this.encodeWAV(merged, sampleRate);
    return wavBlob;
  }

  /**
   * Encode 1-channel Float32 PCM samples into a valid RIFF WAV Blob.
   */
  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeString(view, 8, "WAVE");

    // "fmt " sub-chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16-bit)

    // "data" sub-chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    // Write 16-bit PCM samples
    let index = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      index += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
