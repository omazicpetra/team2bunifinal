// Each recording plays once when its matching scene has arrived.
// To replace a voice-over, put the new MP3 in assets and update its file path here.
// start: 0 plays from the beginning; end: null plays through to the file's end.
const voiceoverConfig = {
  segments: [
    { file: 'assets/intotheblend1.mp3', start: 0, end: null }, // Slide 1 — cellar
    { file: 'assets/intotheblend2.mp3', start: 0, end: null }, // Slide 2 — barrels
    { file: 'assets/intotheblend3.mp3', start: 0, end: null }, // Slide 3 — vanilla
    { file: 'assets/intotheblend4.mp3', start: 0, end: null }  // Slide 4 — final glass
  ]
};
