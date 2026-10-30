import {
  useEffect,
  useRef,
  useState
} from 'react'

const STEPS = 16

const NOTE_SETS = {
  violin: ['C5', 'D5', 'E5', 'G5'],
  horn: ['C2', 'D2', 'F2', 'G2'],
  bells: ['C6', 'E6', 'G6', 'A6'],
  flute: ['C5', 'E5', 'G5', 'A5']
}

const INITIAL_PATTERNS = {
  violin: [
    0, null, 1, null,
    2, null, 3, null,
    2, null, 1, null,
    0, null, 2, null
  ],
  horn: [
    0, null, null, null,
    3, null, null, null,
    2, null, null, null,
    0, null, 3, null
  ],
  bells: [
    0, null, 2, null,
    null, 3, null, 2,
    0, null, 2, null,
    3, null, 2, null
  ],
  flute: [
    null, null, 0, null,
    null, 2, null, null,
    3, null, null, 2,
    null, 0, null, null
  ],
  kick: [
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0
  ],
  snare: [
    0, 0, 1, 0,
    0, 0, 1, 0,
    0, 0, 1, 0,
    0, 0, 1, 0
  ],
  hat: [
    1, 0, 1, 0,
    1, 0, 1, 0,
    1, 0, 1, 0,
    1, 0, 1, 0
  ]
}

const INSTRUMENTS = [
  {
    id: 'violin',
    title: 'СКРИПКА',
    presets: ['Мелодия_1', 'Мелодия_2']
  },
  {
    id: 'horn',
    title: 'ТРУБА',
    presets: ['Мелодия_1', 'Мелодия_2', 'Мелодия_3']
  },
  {
    id: 'bells',
    title: 'КОЛОКОЛЬЧИКИ',
    presets: ['Мелодия_1', 'Мелодия_2', 'Мелодия_3']
  },
  {
    id: 'flute',
    title: 'ФЛЕЙТА',
  }
]

const VIOLIN_MELODIES = {
  'Мелодия_1': [...INITIAL_PATTERNS.violin],
  'Мелодия_2': [
    2, null, 0, 1,
    0, null, 3, 2,
    3, null, 0, 1,
    0, null, 2, 2
  ]
}

const HORN_MELODIES = {
  'Мелодия_1': [...INITIAL_PATTERNS.horn],
  'Мелодия_2': [
    1, 1, 1, null,
    1, 1, 1, 3,
    1, 3, 1, null,
    1, 1, 1, null
  ],
  'Мелодия_3': [
    3, 2, 1, 0,
    1, 2, null, null,
    1, null, 3, null,
    1, null, null, 1
  ]
}

const BELLS_MELODIES = {
  'Мелодия_1': [...INITIAL_PATTERNS.bells],
  'Мелодия_2': [
    1, null, 1, null,
    1, null, 1, 2,
    3, 2, 1, null,
    1, null, 1, null
  ],
  'Мелодия_3': [
    3, 2, 1, 0,
    1, 2, null, null,
    1, null, 3, null,
    1, null, null, 1
  ]
}

const FLUTE_MELODIES = {
  'Мелодия_1': [...INITIAL_PATTERNS.flute],
  'Мелодия_2': [
    1, 1, 1, null,
    1, 1, 1, 3,
    1, 3, 1, null,
    1, 1, 1, null
  ]
}

const DRUM_MELODIES = {
  'Мелодия_1': {
    kick: [...INITIAL_PATTERNS.kick],
    snare: [...INITIAL_PATTERNS.snare],
    hat: [...INITIAL_PATTERNS.hat]
  },
  'Мелодия_2': {
    kick: [
      1, 0, 1, 0,
      1, 0, 1, 0,
      1, 1, 1, 0,
      1, 1, 1, 0
    ],
    snare: [
      1, 1, 1, 0,
      1, 1, 1, 0,
      1, 0, 1, 0,
      1, 0, 1, 0
    ],
    hat: [
      1, 0, 1, 0,
      1, 0, 1, 0,
      1, 1, 1, 0,
      1, 1, 1, 0
    ]
  }
}

function clonePatterns() {
  return JSON.parse(JSON.stringify(INITIAL_PATTERNS))
}

function App() {
  const ToneRef = useRef(null)
  const audio = useRef(null)
  const sequences = useRef({})
  const patterns = useRef(clonePatterns())
  const initialized = useRef(false)

  const enabledRef = useRef({
    violin: true,
    horn: true,
    bells: true,
    flute: true,
    drums: true
  })

  const [audioReady, setAudioReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  const [presets, setPresets] = useState({
    violin: 'Мелодия_1',
    horn: 'Мелодия_1',
    bells: 'Мелодия_1',
    flute: 'Мелодия_1',
    drums: 'Мелодия_1'
  })

  const [enabled, setEnabled] = useState({
    violin: true,
    horn: true,
    bells: true,
    flute: true,
    drums: true
  })

  const [speeds, setSpeeds] = useState({
    violin: 1,
    horn: 1,
    bells: 1,
    flute: 1,
    drums: 1
  })

  const [volumes, setVolumes] = useState({
    violin: 0.75,
    horn: 0.9,
    bells: 0.7,
    flute: 0.75,
    drums: 0.9
  })

  const [, forceUpdate] = useState(0)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  async function loadTone() {
    if (!ToneRef.current) {
      const module = await import('tone')
      ToneRef.current = module
    }
    return ToneRef.current
  }

  async function initializeAudio() {
    const Tone = await loadTone()

    if (initialized.current) {
      if (Tone.getContext().state !== 'running') {
        await Tone.start()
        await Tone.getContext().resume()
      }
      return
    }

    await Tone.start()

    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume()
    }

    Tone.getTransport().bpm.value = 96

    const master = new Tone.Volume(0)
    master.toDestination()

    const violinVolume = new Tone.Volume(-5)
    const violinFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 3500,
      rolloff: -12
    })
    const violin = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.04, decay: 0.12, sustain: 0.55, release: 0.45 }
    })
    violin.chain(violinFilter, violinVolume, master)

    const hornVolume = new Tone.Volume(-1)
    const horn = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.04, decay: 0.12, sustain: 0.7, release: 0.5 },
      filter: { type: 'lowpass', frequency: 1800, rolloff: -12 },
      filterEnvelope: {
        attack: 0.01, decay: 0.1, sustain: 0.55, release: 0.4,
        baseFrequency: 180, octaves: 3
      }
    })
    horn.chain(hornVolume, master)

    const bellsVolume = new Tone.Volume(-4)
    const bells = new Tone.MetalSynth({
      frequency: 320, harmonicity: 5.1, modulationIndex: 18, resonance: 3500, octaves: 1.5,
      envelope: { attack: 0.001, decay: 0.45, release: 0.65 }
    })
    bells.chain(bellsVolume, master)

    const fluteVolume = new Tone.Volume(-3)
    const flute = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.06, decay: 0.1, sustain: 0.7, release: 0.4 },
      filter: { type: 'lowpass', frequency: 3500, rolloff: -12 },
      filterEnvelope: {
        attack: 0.02, decay: 0.12, sustain: 0.45, release: 0.4,
        baseFrequency: 500, octaves: 2
      }
    })
    flute.chain(fluteVolume, master)

    const kickVolume = new Tone.Volume(-1)
    const snareVolume = new Tone.Volume(-2)
    const hatVolume = new Tone.Volume(-2)

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.04, octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0.04, release: 0.25 }
    })
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 }
    })
    const hat = new Tone.MetalSynth({
      frequency: 5000, harmonicity: 5.1, modulationIndex: 35, resonance: 5000, octaves: 1.5,
      envelope: { attack: 0.001, decay: 0.07, release: 0.04 }
    })

    kick.chain(kickVolume, master)
    snare.chain(snareVolume, master)
    hat.chain(hatVolume, master)

    audio.current = {
      master, violin, horn, bells, flute, kick, snare, hat,
      violinVolume, hornVolume, bellsVolume, fluteVolume,
      kickVolume, snareVolume, hatVolume
    }

    createMelodySequence('violin', violin, NOTE_SETS.violin, 0.7)
    createMelodySequence('horn', horn, NOTE_SETS.horn, 0.9)
    createMelodySequence('bells', bells, NOTE_SETS.bells, 0.8, true)
    createMelodySequence('flute', flute, NOTE_SETS.flute, 0.8)

    createDrumSequence('kick', kick, 'kick', 1)
    createDrumSequence('snare', snare, 'snare', 1)
    createDrumSequence('hat', hat, 'hat', 0.9)

    initialized.current = true
    setAudioReady(true)
  }

  function createMelodySequence(id, synth, notes, velocity, isMetal = false) {
    const Tone = ToneRef.current
    const sequence = new Tone.Sequence(
      (time, step) => {
        if (!enabledRef.current[id]) return

        const pattern = patterns.current[id]
        const noteIndex = pattern[step]

        if (noteIndex === null || noteIndex === undefined) return

        const note = notes[noteIndex]
        synth.triggerAttackRelease(note, isMetal ? '16n' : '8n', time, velocity)

        Tone.Draw.schedule(() => {
          setCurrentStep(step)
        }, time)
      },
      Array.from({ length: STEPS }, (_, index) => index),
      '16n'
    )

    sequence.start(0)
    sequences.current[id] = sequence
  }

  function createDrumSequence(id, synth, patternName, velocity) {
    const Tone = ToneRef.current
    const sequence = new Tone.Sequence(
      (time, step) => {
        if (!enabledRef.current.drums) return

        const pattern = patterns.current[patternName]
        if (!pattern[step]) return

        if (id === 'kick') synth.triggerAttackRelease('C1', '8n', time, velocity)
        if (id === 'snare') synth.triggerAttackRelease('16n', time, velocity)
        if (id === 'hat') synth.triggerAttackRelease('32n', time, velocity)
      },
      Array.from({ length: STEPS }, (_, index) => index),
      '16n'
    )

    sequence.start(0)
    sequences.current[id] = sequence
  }

  async function ensureAudio() {
    await initializeAudio()
    const Tone = ToneRef.current
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
      await Tone.getContext().resume()
    }
  }

  async function togglePlayback() {
    await ensureAudio()
    const Tone = ToneRef.current
    const transport = Tone.getTransport()

    if (transport.state === 'started') {
      transport.stop()
      transport.position = 0
      setPlaying(false)
      setCurrentStep(-1)
    } else {
      transport.start()
      setPlaying(true)
    }
  }

  async function toggleInstrument(id) {
    await ensureAudio()
    setEnabled(prev => {
      const next = { ...prev, [id]: !prev[id] }
      enabledRef.current = next
      return next
    })
  }

  function updateVolume(id, value) {
    if (!audio.current) return
    const normalized = Number(value)

    if (id === 'drums') {
      const base = -10 + normalized * 10
      audio.current.kickVolume.volume.value = base
      audio.current.snareVolume.volume.value = base - 1
      audio.current.hatVolume.volume.value = base - 1
      return
    }

    const volume = -10 + normalized * 10
    const node = audio.current[`${id}Volume`]
    if (node) node.volume.value = volume
  }

  function changeVolume(id, value) {
    const number = Number(value)
    setVolumes(prev => ({ ...prev, [id]: number }))
    updateVolume(id, number)
  }

  function changeSpeed(id, value) {
    const speed = Number(value)
    setSpeeds(prev => ({ ...prev, [id]: speed }))

    if (!initialized.current) return

    if (id === 'drums') {
      sequences.current.kick.playbackRate = speed
      sequences.current.snare.playbackRate = speed
      sequences.current.hat.playbackRate = speed
      return
    }

    if (sequences.current[id]) {
      sequences.current[id].playbackRate = speed
    }
  }

  function selectViolinMelody(melodyName) {
    setPresets(prev => ({ ...prev, violin: melodyName }))
    patterns.current.violin = [...VIOLIN_MELODIES[melodyName]]
    forceUpdate(value => value + 1)
  }

  function selectHornMelody(melodyName) {
    setPresets(prev => ({ ...prev, horn: melodyName }))
    patterns.current.horn = [...HORN_MELODIES[melodyName]]
    forceUpdate(value => value + 1)
  }

  function selectBellsMelody(melodyName) {
    setPresets(prev => ({ ...prev, bells: melodyName }))
    patterns.current.bells = [...BELLS_MELODIES[melodyName]]
    forceUpdate(value => value + 1)
  }

  function selectFluteMelody(melodyName) {
    setPresets(prev => ({ ...prev, flute: melodyName }))
    patterns.current.flute = [...FLUTE_MELODIES[melodyName]]
    forceUpdate(value => value + 1)
  }

  function selectDrumMelody(melodyName) {
    setPresets(prev => ({ ...prev, drums: melodyName }))
    const melody = DRUM_MELODIES[melodyName]
    patterns.current.kick = [...melody.kick]
    patterns.current.snare = [...melody.snare]
    patterns.current.hat = [...melody.hat]
    forceUpdate(value => value + 1)
  }

  function changeCell(id, row, step) {
    const pattern = [...patterns.current[id]]
    if (pattern[step] === row) {
      pattern[step] = null
    } else {
      pattern[step] = row
    }
    patterns.current[id] = pattern
    forceUpdate(value => value + 1)
  }

  function changeDrumCell(id, step) {
    const pattern = [...patterns.current[id]]
    pattern[step] = pattern[step] ? 0 : 1
    patterns.current[id] = pattern
    forceUpdate(value => value + 1)
  }

  function resetEverything() {
    patterns.current = clonePatterns()
    setPresets(prev => ({
      ...prev,
      violin: 'Мелодия_1',
      horn: 'Мелодия_1',
      bells: 'Мелодия_1',
      flute: 'Мелодия_1',
      drums: 'Мелодия_1'
    }))

    setPlaying(false)
    setCurrentStep(-1)
    setSpeeds({ violin: 1, horn: 1, bells: 1, flute: 1, drums: 1 })
    setVolumes({ violin: 0.75, horn: 0.9, bells: 0.7, flute: 0.75, drums: 0.9 })

    forceUpdate(value => value + 1)

    if (!initialized.current) return

    const Tone = ToneRef.current
    Tone.getTransport().stop()
    Tone.getTransport().position = 0

    Object.values(sequences.current).forEach(sequence => {
      sequence.playbackRate = 1
    })

    updateVolume('violin', 0.75)
    updateVolume('horn', 0.9)
    updateVolume('bells', 0.7)
    updateVolume('flute', 0.75)
    updateVolume('drums', 0.9)
  }

  useEffect(() => {
    return () => {
      if (initialized.current && ToneRef.current) {
        try {
          const Tone = ToneRef.current
          Tone.getTransport().stop()
          Tone.getTransport().cancel()
        } catch (error) {
          console.log(error)
        }
      }
    }
  }, [])

  return (
    <div className="app">
      <header className="header">
        <button className="reset-button" onClick={resetEverything}>
          ЗАНОВО
        </button>
        <div className="brand-block">
          <h1>ПИКСЕЛЬ-СИНТ</h1>
          <div className="audio-status">LET IT SNOW</div>
        </div>
        <button className="main-button" onClick={togglePlayback}>
          {playing ? 'СТОП' : 'СТАРТ'}
        </button>
      </header>

      <main>
        <section className="instrument-layout">
          {INSTRUMENTS.map(instrument => (
            <Instrument
              key={instrument.id}
              instrument={instrument}
              pattern={patterns.current[instrument.id]}
              preset={presets[instrument.id]}
              speed={speeds[instrument.id]}
              volume={volumes[instrument.id]}
              enabled={enabled[instrument.id]}
              currentStep={currentStep}
              onToggle={() => toggleInstrument(instrument.id)}
              onPresetChange={value => {
                if (instrument.id === 'violin') selectViolinMelody(value)
                else if (instrument.id === 'horn') selectHornMelody(value)
                else if (instrument.id === 'bells') selectBellsMelody(value)
                else if (instrument.id === 'flute') selectFluteMelody(value)
              }}
              onSpeedChange={value => changeSpeed(instrument.id, value)}
              onVolumeChange={value => changeVolume(instrument.id, value)}
              onCellClick={(row, step) => changeCell(instrument.id, row, step)}
            />
          ))}
        </section>

        <DrumMachine
          pattern={patterns.current}
          preset={presets.drums}
          onPresetChange={selectDrumMelody}
          speed={speeds.drums}
          volume={volumes.drums}
          enabled={enabled.drums}
          currentStep={currentStep}
          onToggle={() => toggleInstrument('drums')}
          onSpeedChange={value => changeSpeed('drums', value)}
          onVolumeChange={value => changeVolume('drums', value)}
          onCellClick={changeDrumCell}
        />
      </main>

      <footer className="footer">
        <span>Буракова Ольга</span>
        <span className="footer-line" aria-hidden="true" />
        <span>2026</span>
        <span className="footer-line" aria-hidden="true" />
        <span>БП25ДЗ12</span>
      </footer>
    </div>
  )
}

function Instrument({
  instrument,
  pattern,
  preset,
  speed,
  volume,
  enabled,
  currentStep,
  onToggle,
  onPresetChange,
  onSpeedChange,
  onVolumeChange,
  onCellClick
}) {
  return (
    <section className={`instrument ${enabled ? 'is-on' : 'is-off'}`}>
      <div className="instrument-topline">
        {instrument.id !== 'flute' && (
          <label className="melody-picker">
            <span className="melody-triangle" aria-hidden="true" />
            <select
              value={preset}
              aria-label={`${instrument.title}: выбор мелодии`}
              onChange={event => onPresetChange(event.target.value)}
            >
              {instrument.presets.map(option => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className={`power-button ${enabled ? 'active' : ''}`}
          onClick={onToggle}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <h2 className="instrument-name">{instrument.title}</h2>

      <div className={`instrument-controls ${instrument.id === 'flute' ? 'flute-controls' : ''}`}>
        <label className="slider-control speed-control">
          <span>СКОРОСТЬ</span>
          <div className="meter">
            <div className="meter-bars" aria-hidden="true">
              {Array.from({ length: 32 }, (_, i) => <i key={i} className={i < Math.round(((speed - 0.5) / 1) * 32) ? 'lit' : ''} />)}
            </div>
            <input type="range" min="0.5" max="1.5" step="0.05" value={speed} aria-label="Speed" onChange={event => onSpeedChange(event.target.value)} />
          </div>
        </label>

        <label className="slider-control volume-control">
          <span>ГРОМКОСТЬ</span>
          <div className="meter">
            <div className="meter-bars" aria-hidden="true">
              {Array.from({ length: 32 }, (_, i) => <i key={i} className={i < Math.round(volume * 32) ? 'lit' : ''} />)}
            </div>
            <input type="range" min="0" max="1" step="0.01" value={volume} aria-label="Volume" onChange={event => onVolumeChange(event.target.value)} />
          </div>
        </label>
      </div>

      {instrument.id === 'flute' ? (
        <div className="flute-wheel-wrap">
          <div className="flute-wheel">
            <div className="wheel-sector" />
            <div className="wheel-rings"><i /><i /><i /><i /></div>
            <div className="wheel-spokes">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 45}deg)` }} />)}</div>
            {[0, 1, 2, 3].map(row => Array.from({ length: STEPS }, (_, step) => {
              const angle = step * 22.5 - 90
              const radius = 18 + row * 8.5
              const x = 50 + Math.cos(angle * Math.PI / 180) * radius
              const y = 50 + Math.sin(angle * Math.PI / 180) * radius
              const active = pattern[step] === row
              return (
                <button
                  key={`${row}-${step}`}
                  className={`wheel-note ${active ? 'active' : ''} ${currentStep === step ? 'playing' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-label={`Нота ${row + 1}, шаг ${step + 1}`}
                  onClick={() => onCellClick(row, step)}
                >
                  {active && <span className="note-dot"><i /><i /><i /></span>}
                </button>
              )
            }))}
            <div className="wheel-center" />
          </div>
        </div>
      ) : (
        <div className="melody-grid">
          {[0, 1, 2, 3].map(row => (
            <div className="melody-row" key={row}>
              {Array.from({ length: STEPS }, (_, step) => {
                const active = pattern[step] === row
                const isPlaying = currentStep === step
                return (
                  <button
                    key={step}
                    aria-label={`Ряд ${row + 1}, шаг ${step + 1}`}
                    className={['cell', active ? 'active' : '', isPlaying ? 'playing' : ''].join(' ')}
                    onClick={() => onCellClick(row, step)}
                  >
                    {active && <span className="note-dot" aria-hidden="true"><i /><i /><i /></span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DrumMachine({
  pattern,
  preset,
  onPresetChange,
  speed,
  volume,
  enabled,
  currentStep,
  onToggle,
  onSpeedChange,
  onVolumeChange,
  onCellClick
}) {
  return (
    <section className={`drums ${enabled ? 'is-on' : 'is-off'}`}>
      <div className="drum-topline">
        <label className="melody-picker">
          <span className="melody-triangle" aria-hidden="true" />
          <select value={preset} aria-label="Выбор ритма барабанов" onChange={event => onPresetChange(event.target.value)}>
            <option value="Мелодия_1">Мелодия 1</option>
            <option value="Мелодия_2">Мелодия 2</option>
          </select>
        </label>
        <button className={`power-button ${enabled ? 'active' : ''}`} onClick={onToggle}>
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <h2 className="drum-instrument-name">БАРАБАНЫ</h2>

      <div className="drum-controls">
        <label className="slider-control speed-control">
          <span>СКОРОСТЬ</span>
          <div className="meter">
            <div className="meter-bars" aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <i key={i} className={i < Math.round(((speed - 0.5) / 1) * 32) ? 'lit' : ''} />)}</div>
            <input type="range" min="0.5" max="1.5" step="0.05" value={speed} aria-label="Drum speed" onChange={event => onSpeedChange(event.target.value)} />
          </div>
        </label>
        <label className="slider-control volume-control">
          <span>ГРОМКОСТЬ</span>
          <div className="meter">
            <div className="meter-bars" aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <i key={i} className={i < Math.round(volume * 32) ? 'lit' : ''} />)}</div>
            <input type="range" min="0" max="1" step="0.01" value={volume} aria-label="Drum volume" onChange={event => onVolumeChange(event.target.value)} />
          </div>
        </label>
      </div>

      <div className="drum-melody-grid">
        <DrumRow pattern={pattern.kick} currentStep={currentStep} onClick={step => onCellClick('kick', step)} />
        <DrumRow pattern={pattern.snare} currentStep={currentStep} onClick={step => onCellClick('snare', step)} />
        <DrumRow pattern={pattern.hat} currentStep={currentStep} onClick={step => onCellClick('hat', step)} />
      </div>
    </section>
  )
}

function DrumRow({ pattern, currentStep, onClick }) {
  return (
    <div className="drum-row">
      <div className="drum-grid">
        {Array.from({ length: STEPS }, (_, step) => (
          <button
            key={step}
            aria-label={`Ударный шаг ${step + 1}`}
            className={['drum-cell', pattern[step] ? 'active' : '', currentStep === step ? 'playing' : ''].join(' ')}
            onClick={() => onClick(step)}
          >
            {Boolean(pattern[step]) && <span className="note-dot drum-dot" aria-hidden="true"><i /><i /><i /></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App