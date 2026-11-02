# Storyboard: Sampling and Aliasing (67.7 s, 1920x1080, 30 fps)

**Problem:** a phone stores a different tone than the one you whistle. **Audience:** software engineers, no signal processing background. **Goal:** the viewer can predict the stored tone with "fold around half the sampling rate". **Emotion:** surprise, then "of course".

Accent (magenta) means one thing: what the phone stores. Motion grammar: crisp hard steps (dots appear on the frame they are measured), slow scale drift on held scenes. Voice-led, cut on line boundaries.

| # | Time | Purpose | Composition | Motion | Narration | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0:00-0:06.3 | hook | full-width scope: faint 5,000 Hz wave, held samples, dots | wave already drawing on frame 0; dots step in; magenta 3,000 Hz wave sweeps through the same dots | "Whistle at five thousand hertz into a phone, and the phone stores three thousand." | `5,000 Hz`, `3,000 Hz` | voice | hard cut | viewer sees two different waves share every dot |
| 2 | 0:06.3-0:13.1 | familiar situation | two 8-spoke wheels side by side | left turns smoothly forward; right is the same rotation sampled every 6 frames, so it steps backwards | "You have seen this before. On video, a fast wheel can seem to turn backwards." | `real`, `on video`, two direction arrows | voice | hard cut | viewer connects sampling with something they have seen |
| 3 | 0:13.1-0:21.2 | visible problem | slow 1,000 Hz wave on the scope | a dashed sweep line crosses left to right; each dot appears as it passes; the wave fades out | "A phone cannot store a wave. It measures the wave eight thousand times per second, and keeps only those dots." | `8,000 per second` | voice | continuous | viewer sees that only dots survive |
| 4 | 0:21.2-0:28.1 | mechanism | same dots | a shaded gap with "?" between two dots; then the slowest wave draws through all dots | "Between two dots, it knows nothing. So it draws the slowest wave that fits them." | `?`, `slowest fit` | voice | hard cut | viewer knows how the gaps are filled |
| 5 | 0:28.1-0:36.9 | mechanism, two states | two scopes stacked: 1,000 Hz above, 5,000 Hz below | top: stored wave lands on the true wave; bottom: magenta 3,000 Hz wave lands on the fast wave's dots | "For a slow tone, the slowest fit is the true tone. For a fast tone, a slower wave fits the same dots." | `1,000 Hz`, `stored 1,000`, `5,000 Hz`, `stored 3,000` | voice | hard cut | viewer compares the safe and the folded case |
| 6 | 0:36.9-0:50.2 | discovery (hero at 0:48) | fold chart: true tone across, stored tone up | axes, limit line, safe line rises; fold line whips down; 5,000 dot; `+1,000` bracket; magenta mirror line to the 3,000 dot | "The limit is half the sampling rate: four thousand hertz. Above it, a tone folds back, like a mirror. Five thousand is one thousand above, so it lands one thousand below." | `limit 4,000 Hz`, `5,000`, `+1,000`, `3,000 Hz`, axis ticks | voice | hard cut | viewer can state the rule |
| 7 | 0:50.2-0:56.3 | consequence | two columns of sample values, 3,000 Hz and 5,000 Hz | rows step in; `=` signs land on "same numbers" | "After sampling, the true tone and the false one give the same numbers. You cannot undo it." | column heads, six values each, `=` | voice | hard cut | viewer sees there is nothing left to tell them apart |
| 7b | 0:56.3-1:01.3 | consequence: the fix | tone axis 0 to 8,000 with a voice dot and a whistle dot | filter wall at 3,400 Hz reveals; whistle dot fades; `removed` | "So the phone network removes high tones before it samples." | `filter 3,400 Hz`, `voice 1,000`, `whistle 5,000`, `removed` | voice | hard cut | viewer knows why filters come first |
| 8 | 1:01.3-1:07.7 | recap | fold chart again, slightly zoomed out | safe and fold lines redraw; a filter wall covers everything above 3,400 Hz; slow drift until the last frame | "Sampling sees only dots. Stay below half the sampling rate, or filter first." | `limit 4,000 Hz`, `filter first` | voice | end hold 1.33 s | viewer leaves with the rule and the fix |

## Motion and sound notes

- Picture follows voice. Line start times come from `schedule.json`; word onset frames from `vo132/vo.words.json` (estimated by `say`, off by about 100-200 ms, so text leads by 2-3 frames and no hit is frame-exact on a word).
- The macOS voice ignores most of `say -r`, so pacing comes from 1.4-1.8 s pauses between lines: 157 words in 67.7 s, about 139 words per minute.
- No music or SFX: they need an ElevenLabs key. The pauses are silent on purpose. Intended tempo if music is added later: slow, about 70 BPM, ducked under the voice.

## Gates (final.mp4)

- G0 render exists: PASS, 67.70 s, audio present.
- G2 no empty frame: PASS.
- G3 end hold: PASS, 1.33 s.
- G1, G4 by eye on `look/sheet.jpg`: each frame has one readable object and one hero.
- G5 page chrome lint: flags the chart axis labels (`0`, `8,000`, `TRUE TONE (Hz)`). Kept on purpose: in a lesson, axis labels are content.
- Motion metric: 0.3/255 mean frame change, below the promo-film band. Expected for a lesson that holds a chart while the voice explains it.

## Export specs

`final.mp4`: H.264 1920x1080, 30 fps, AAC 48 kHz stereo, 67.7 s, about 9.8 MB, mixed to -13.9 LUFS, true peak -1.5 dBFS. Captions: `final.vtt` (one cue per narration line).
