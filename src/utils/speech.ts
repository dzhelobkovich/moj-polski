
export type SpeechRate = 0.6 | 0.85 | 1;

const SPEED_KEY = 'moj-polski-speech-rate';

export function loadSpeechRate(): SpeechRate {
  try {
    const saved = Number(
      localStorage.getItem(SPEED_KEY)
    );

    if (saved === 0.6 || saved === 0.85 || saved === 1) {
      return saved;
    }
  } catch {
    // Используем стандартную скорость
  }

  return 0.85;
}

export function saveSpeechRate(rate: SpeechRate): void {
  try {
    localStorage.setItem(SPEED_KEY, String(rate));
  } catch {
    // Настройка останется доступной до закрытия приложения
  }
}

export function speakPolish(
  text: string,
  rate: SpeechRate = loadSpeechRate()
): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  if (!text.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = 'pl-PL';
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const polishVoices = voices.filter(
    voice => voice.lang.toLowerCase().startsWith('pl')
  );

  const polishVoice =
    polishVoices.find(voice => voice.localService) ||
    polishVoices[0];

  if (polishVoice) {
    utterance.voice = polishVoice;
  }

  window.speechSynthesis.speak(utterance);

  return true;
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
