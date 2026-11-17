// Audio paths and optional clip boundaries are configured in audio-config.js.
class StoryAudio {
  constructor(music, button, config) {
    this.music = music;
    this.button = button;
    this.config = config;
    this.context = null;
    this.gain = null;
    this.recordings = new Map();
    this.activeVoice = null;
    this.request = 0;
    this.started = false;
    this.muted = false;
    this.music.volume = .12;
    this.button.addEventListener('click', () => this.toggleMute());
    this.updateButton();
  }

  start() {
    if (this.started) return;
    this.started = true;
    // The entry click unlocks audio before asynchronous loading or transitions.
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.context = new AudioContextClass();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.muted ? 0 : 1;
      this.gain.connect(this.context.destination);
      this.context.resume().catch(error => console.warn('Voice-over audio could not start.', error));
      // Cache all four files so subsequent scenes can speak as soon as they arrive.
      for (const segment of this.config.segments) {
        const file = segment.file || this.config.file;
        if (file) this.loadRecording(file).catch(error => console.warn('Voice-over preload failed.', error));
      }
    }
    this.music.play().catch(error => console.warn('Music could not start.', error));
  }

  loadRecording(file) {
    if (!this.recordings.has(file)) {
      const recording = fetch(file)
        .then(response => {
          if (!response.ok) throw new Error(`${file} returned ${response.status}`);
          return response.arrayBuffer();
        })
        .then(bytes => this.context.decodeAudioData(bytes))
        .catch(error => {
          this.recordings.delete(file);
          throw error;
        });
      this.recordings.set(file, recording);
    }
    return this.recordings.get(file);
  }

  stopNarration() {
    // Cancel late downloads as well as playing audio when the scene changes.
    this.request += 1;
    const voice = this.activeVoice;
    this.activeVoice = null;
    if (!voice) return;
    const now = this.context.currentTime;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
    voice.envelope.gain.linearRampToValueAtTime(0, now + .025);
    voice.source.stop(now + .025);
  }

  async playScene(index) {
    this.stopNarration();
    if (!this.started || !this.context) return;
    const request = this.request;
    const segment = this.config.segments[index];
    if (!segment || !Number.isFinite(segment.start) || segment.start < 0) return;
    const file = segment.file || this.config.file;
    if (!file) return;
    try {
      const buffer = await this.loadRecording(file);
      if (request !== this.request) return;
      const end = segment.end === null ? buffer.duration : Math.min(segment.end, buffer.duration);
      if (!Number.isFinite(end) || end <= segment.start) {
        console.warn(`Check the voice-over times for slide ${index + 1} in audio-config.js.`);
        return;
      }
      const duration = end - segment.start;
      const fade = Math.min(.025, duration / 4);
      const now = this.context.currentTime;
      const source = this.context.createBufferSource();
      const envelope = this.context.createGain();
      source.buffer = buffer;
      source.connect(envelope);
      envelope.connect(this.gain);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + fade);
      envelope.gain.setValueAtTime(1, now + duration - fade);
      envelope.gain.linearRampToValueAtTime(0, now + duration);
      const voice = { source, envelope };
      source.onended = () => {
        source.disconnect();
        envelope.disconnect();
        if (this.activeVoice === voice) this.activeVoice = null;
      };
      this.activeVoice = voice;
      // Play once. The next scene is always controlled by the visitor.
      source.start(now, segment.start, duration);
    } catch (error) {
      console.warn('Check the MP3 path in audio-config.js and preview through a local server.', error);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.music.muted = this.muted;
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 1;
    this.updateButton();
  }

  updateButton() {
    const label = this.muted ? 'Unmute music and voice-over' : 'Mute music and voice-over';
    this.button.setAttribute('aria-label', label);
    this.button.setAttribute('aria-pressed', String(this.muted));
    this.button.title = label;
    this.button.classList.toggle('muted', this.muted);
  }
}
