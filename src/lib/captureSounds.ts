type CountdownTone = 1 | 2 | 3 | 4 | 5 | 10

let audioContextPromise: Promise<AudioContext | null> | null = null

async function getAudioContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') {
    return null
  }

  if (!audioContextPromise) {
    audioContextPromise = (async () => {
      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext

      if (!AudioContextCtor) {
        return null
      }

      const context = new AudioContextCtor()

      if (context.state === 'suspended') {
        await context.resume().catch(() => undefined)
      }

      return context
    })()
  }

  const context = await audioContextPromise

  if (context?.state === 'suspended') {
    await context.resume().catch(() => undefined)
  }

  return context
}

function scheduleTone(
  context: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(120, frequency * 1.08),
    startAt + duration,
  )

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.03)
}

function scheduleNoiseBurst(
  context: AudioContext,
  startAt: number,
  duration: number,
  volume: number,
): void {
  const buffer = context.createBuffer(
    1,
    Math.max(1, Math.round(context.sampleRate * duration)),
    context.sampleRate,
  )
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < channel.length; index += 1) {
    const fade = 1 - index / channel.length
    channel[index] = (Math.random() * 2 - 1) * fade
  }

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  source.buffer = buffer
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(1600, startAt)

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)

  source.start(startAt)
  source.stop(startAt + duration + 0.02)
}

const COUNTDOWN_CHORDS: Record<CountdownTone, number[]> = {
  1: [880, 1174.66],
  2: [783.99, 1046.5],
  3: [698.46, 932.33],
  4: [659.25, 880],
  5: [587.33, 783.99],
  10: [523.25, 698.46],
}

export async function playCountdownCue(tick: number): Promise<void> {
  const context = await getAudioContext()

  if (!context) {
    return
  }

  const chord = COUNTDOWN_CHORDS[tick as CountdownTone] ?? [659.25, 987.77]
  const startAt = context.currentTime + 0.01

  scheduleTone(context, startAt, chord[0], 0.16, 0.05, 'triangle')
  scheduleTone(context, startAt + 0.02, chord[1], 0.18, 0.035, 'sine')
}

export async function playShutterCue(): Promise<void> {
  const context = await getAudioContext()

  if (!context) {
    return
  }

  const startAt = context.currentTime + 0.01

  scheduleTone(context, startAt, 940, 0.06, 0.06, 'square')
  scheduleTone(context, startAt + 0.045, 620, 0.11, 0.05, 'triangle')
  scheduleNoiseBurst(context, startAt + 0.01, 0.09, 0.03)
}
