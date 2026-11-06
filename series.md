# Discrete-Time Signal Processing, the phone line series

Source: Alan V. Oppenheim and Ronald W. Schafer, *Discrete-Time Signal Processing*, Prentice Hall, first edition (1989, ISBN 0-13-216771-9). Chapter numbers follow this edition: 2 discrete-time signals and systems, 3 sampling, 4 the z-transform, 5 transform analysis of LTI systems, 6 structures, 7 filter design, 8 the DFT, 9 the FFT, 10 Fourier analysis with the DFT, 11 Hilbert transforms, 12 the cepstrum.
Audience: software engineers with no signal processing background.
Language: English.

## The world

You are building a digital phone line. It takes 8,000 samples per second, so it can carry tones below 4,000 Hz. Every lesson opens on a bug that real customers hear on your line, and ends when you fix it yourself.

## Lessons

The course follows the book in order. Each lesson assumes only the lessons before it.

| # | Lesson | Bug | Fix | New terms | Page | Status |
|---|---|---|---|---|---|---|
| 1 | Signals and systems (ch. 2) | loud callers come out with a harsh buzz, quiet callers are fine | the booster clips; a linear, time-invariant system never adds new tones, so turn the booster down to ×1.6 so the loudest input lands at 0.8 with headroom | sample, signal, tone, pitch, system, clipping, neighbor rule, linear, time-invariant | 01-signals-and-systems/3-page/3-page.html | page ready; video ready |
| 2 | Impulse response and convolution (ch. 2) | callers hear their own voice come back 0.25 s later | send one click, record what returns, and every call is a sum of shifted, scaled copies of that answer; subtract the echo | impulse, impulse response, convolution | 02-impulse-response/3-page/3-page.html | page ready; video ready |
| 3 | Frequency response (ch. 2) | calls sound muffled, as if through a wall | a linear time-invariant line only scales and delays each tone; measure that per tone and boost what it lost | tone as a wheel, frequency response, gain, phase, band | 03-frequency-response/3-page/3-page.html | page ready; video ready |
| 4 | Sampling and aliasing (ch. 3) | a 5,000 Hz whistle comes out at 3,000 Hz | filter out tones above the limit before sampling | sampling rate, the limit, alias, the true tone, stores, cutoff | 04-sampling-aliasing/3-page/3-page.html | page ready; video ready |
| 5 | Changing the sampling rate (ch. 3) | joining a 16,000 samples/s wideband line puts ghost copies of every voice above 4,000 Hz | upsampling inserts zeros that make mirror images; filter them away, and filter before downsampling | upsample, downsample, image | 05-changing-the-rate/3-page/3-page.html | page ready; video ready |
| 6 | Zeros and poles (ch. 4) | calls carry a whine, first at 4,000 Hz, then at 2,000 Hz | put zeros on the whine, then poles beside them to save the voice | filter, passes / removes, unit circle, radians, j, zero, mirror arrow, feedback, pole, notch, stable, H(z) | 06-zeros-and-poles/3-page/3-page.html | page ready; video ready |
| 7 | How long a filter rings (ch. 5) | every time a call starts, a faint ring at 2,000 Hz is left behind like a bell | a pole's radius sets how fast its echo dies; trade notch width against ring time | shadow, decay time, bandwidth | 07-ringing/3-page/3-page.html | page ready; video ready |
| 8 | Phase and delay (ch. 5) | a fax modem's tones arrive smeared (delays spread 2.9 samples across its band) though every tone is loud enough | the filter delays some tones more than others; use a linear-phase filter or an all-pass to even the delay | group delay, linear phase, all-pass, minimum phase | 08-phase-and-delay/3-page/3-page.html | page ready; video ready |
| 9 | Finite precision (ch. 6) | the whine hops between 1,900, 2,000 and 2,100 Hz; three notches multiplied into one rule work on the laptop but hum and blow up on the cheap 8-bit chip | rounded coefficients move the poles; build the filter as a cascade of second-order sections | coefficient, quantization, volume factor, cascade, second-order section | 09-finite-precision/3-page/3-page.html | page ready; video to build |
| 10 | FIR design by windows (ch. 7) | the anti-aliasing filter from lesson 5 lets a ripple of high tones through: a 4,000 to 8,000 Hz sweep comes out as a ghost gliding down the voice band | the ideal filter is infinitely long; cutting it rings (Gibbs); taper the cut with a window | low-pass, cutoff, ideal low-pass, FIR filter, truncation, Gibbs phenomenon, decibels, window, side lobe, transition band, voice band | 10-fir-windows/3-page/3-page.html | page ready; video to build |
| 11 | IIR design by the bilinear transform (ch. 7) | copying the old analog exchange filter puts its cutoff at the wrong frequency | the bilinear transform squeezes all analog frequencies into the circle; prewarp the cutoff | analog filter, analog prototype, bilinear transform, warping, prewarp | 11-bilinear-transform/3-page/3-page.html | page ready; video to build |
| 12 | The DFT (ch. 8) | the line must tell which keypad key was pressed from its two tones | compare the recording with N wheels; each match is one DFT bin; a key counts when exactly one row and one column clear the bar | DTMF, test tone, match, test wheel, bin, DFT, frequency resolution, bar | 12-dft/3-page/3-page.html | page ready; video to build |
| 13 | The FFT (ch. 9) | the key detector is too slow to run live on the chip | split the DFT into even and odd samples again and again: N log N instead of N squared | butterfly, FFT, Goertzel | 13-fft/3-page/3-page.html | page ready; video to build |
| 14 | Spectrum analysis with windows (ch. 10) | the detector sometimes rejects a 4 as two keys at once and misses faint keys | a short recording leaks each tone into its neighbors; choose window and length for the keys you must tell apart | leakage, main lobe, side lobe, zero padding | 14-spectrum-windows/3-page/3-page.html | page ready; video to build |
| 15 | The Hilbert transform (ch. 11) | shifting every call up 300 Hz to disguise tip-line callers also creates a ghost voice 300 Hz below the original | build the analytic signal, which has no negative tones, then shift it | negative tone, analytic signal, Hilbert transformer, single sideband | 15-hilbert/3-page/3-page.html | page ready; video to build |
| 16 | The cepstrum (ch. 12) | an echo of unknown delay; lesson 2's fix needs the delay | an echo is a ripple in the log spectrum; read delay and strength from the cepstrum peak, then cancel with feedback | strength, ripple, log spectrum, cepstrum, quefrency | 16-cepstrum/3-page/3-page.html | page ready; video ready |

## Conventions every lesson keeps

- The wheel (lesson 3): a tone is a dot turning counter-clockwise, 360° x tone / 8,000 per sample. Its left-right position is the sample; its up-down position is the sine.
- Older is clockwise: a copy k samples old sits 360° x tone x k / 8,000 clockwise behind the fresh dot. Phase is how far behind.
- Degrees first. Lessons 3 to 5 may write one full turn as 2π inside a derivation, saying so in words. Lesson 6 teaches radians properly: ω = 2π x tone / 8,000, so π means 4,000 Hz. Later lessons restate this in one line the first time they use ω.
- "Mirror" is one geometry seen three ways: lesson 4's mirror spots across the horizontal line, lesson 5's mirror line at 4,000 Hz, lesson 6's mirror arrow. Each later use names which.
- j (lesson 6) is a quarter turn counter-clockwise, so j x j = -1, and e^{jωn} is the dot itself. Later lessons recap it in one line before using it.
- The mirror arrow (lesson 6): a real tone is two half-size arrows turning opposite ways; the bottom half of the circle holds the mirrors.
- The book is Oppenheim and Schafer, Discrete-Time Signal Processing (1989); name it in full the first time a lesson cites it.

## Glossary

- sample: one measurement of the sound at one moment (lesson 1)
- signal: a list of numbers, one per moment; a call is a signal (lesson 1)
- tone: a steady wave that repeats at a fixed rate (lesson 1)
- pitch: what your ear hears of a tone's rate, counted in hertz (Hz), repeats per second: the faster the repeat, the higher the sound (lesson 1)
- system: a rule that takes in one signal and gives back another (lesson 1)
- clipping: flattening anything outside the range, −1 to +1, to the edge (lesson 1)
- neighbor rule: add a tone's sample before and sample after, and you always get the middle sample times a fixed number, 2 × cos of the tone's step (1.414 for 1,000 Hz) (lesson 1)
- linear: doubling the input doubles the output, and two inputs added give their outputs added; it has to hold for every input, sums included (lesson 1)
- time-invariant: delaying the input only delays the output; the rule works the same at every moment (lesson 1)
- impulse: a signal that is 1 at n = 0 and 0 everywhere else, written δ[n]: a single click (lesson 2)
- impulse response: what a system gives back when the input is the impulse, written h[n] (lesson 2)
- convolution: building the output as a sum of shifted copies of the impulse response, each scaled by one input sample, written x * h (lesson 2)
- gain: how much a system scales one tone: output size divided by input size (lesson 3)
- phase: how many degrees the output's dot trails the input's (lesson 3)
- tone as a wheel: a dot turning counter-clockwise 360° × tone ÷ 8,000 per sample, whose left-right position is the sample; 45° for every 1,000 Hz (lesson 3)
- frequency response: for every tone, how much the system scales it and how far it delays it (lesson 3)
- band: a stretch of neighboring tones that share one boost, named by the tone at its middle (lesson 3)
- the true tone: the sound that went into the phone, before sampling (lesson 4)
- sampling rate: the number of samples in one second, here 8,000 (lesson 4)
- stores: what the phone keeps after sampling, the list of samples; nothing else survives sampling (lesson 4)
- the limit: half the sampling rate, here 4,000 Hz; tones safely below it are stored truthfully, and the limit itself is a knife edge (lesson 4)
- alias: a lower, false tone that gives the same samples as a higher, true one (lesson 4)
- cutoff: the tone where a filter switches from keeping to removing (lesson 4); lesson 10 measures it, for its filters, where the gain is half, and lesson 11, for the exchange's kind of filter, where it passes 71%
- upsample: to upsample by 2 is to put one zero between every two samples, so 8,000 samples per second become 16,000 (lesson 5)
- downsample: to downsample by 2 is to keep every other sample and drop the rest, so 16,000 samples per second become 8,000 (lesson 5)
- image: a copy of a tone that upsampling creates at the mirror pitch, 8,000 Hz minus the tone (lesson 5)
- filter: a rule that builds each output sample from input samples, and with feedback also from its own earlier outputs (lesson 6)
- passes / removes: how much of a tone a filter passes is its gain, as a percentage, and a tone that gets out at 0% is removed (lesson 6)
- unit circle: a wheel of radius 1 with every tone on it at once, each at the spot its dot reaches after one sample: 0 Hz at the right, 2,000 Hz at the top, 4,000 Hz at the left; the bottom half holds every tone's mirror arrow (lesson 6)
- radians: a turn measured by the walk along the rim of a radius-1 wheel; a full turn is 2π, so ω = 2π × tone ÷ 8,000 and π means 4,000 Hz (lesson 6)
- j: a number that means "a quarter turn counter-clockwise", so j × j = −1; the point at angle θ is cos θ + j sin θ, written e^{jθ} (lesson 6)
- zero: a point where the filter's output is zero; a tone on a zero is removed (lesson 6)
- system function H(z): the number a tone z^n is multiplied by when it passes through the filter (lesson 6)
- mirror arrow: a real tone is two half-size arrows turning opposite ways, and the second one, turning clockwise on the bottom half of the circle, is its mirror arrow (lesson 6)
- feedback: a filter also looking at its own past output (lesson 6)
- pole: a point where the bottom of H(z) is zero, so near it the response shoots up; comes from feedback; its radius is how much an echo keeps per sample (lesson 6)
- notch: a filter with one narrow gap in an otherwise flat response (lesson 6)
- stable: a filter whose poles all sit strictly inside the unit circle: its echoes always die out (lesson 6)
- shadow: where a line dropped from the dot lands on the horizontal axis, its left-right position; R cos θ for a dot at angle θ and distance R from the center (lesson 7)
- decay time: how long the ring takes to shrink to 1% of where it started (lesson 7)
- bandwidth: the width of the notch, in Hz, between the two tones on either side of it that the notch passes at 71% (lesson 7)
- linear phase: a phase that grows in proportion to the tone, which is the same as delaying every tone by the same number of samples (lesson 8)
- group delay: how many samples late a burst made of tones near one tone arrives; it equals how steeply the phase climbs there, the phase difference between two very close tones divided by their turn difference (lesson 8)
- all-pass: a filter that passes every tone at 100% and changes only its phase; each of its poles sits inside the unit circle with a zero on the same line from the center, at one over the pole's radius, outside (lesson 8)
- minimum phase: a filter whose poles and zeros all sit inside the unit circle; of all the filters that give every tone the same gain, it delays the least (lesson 8)
- coefficient: a fixed number in a filter's rule that a sample is multiplied by (lesson 9)
- quantization: rounding a number to the nearest value the chip can store (lesson 9)
- volume factor: the number in front of a filter's input side, chosen so that 0 Hz comes out at exactly 100% (lesson 9)
- second-order section: a filter that reaches back at most two samples on its input and its output, so it holds one pole pair and one zero pair (lesson 9)
- cascade: filters run one after another, each one's output feeding the next one's input (lesson 9)
- low-pass: a filter that passes low tones and removes high ones (lesson 10)
- ideal low-pass: a low-pass with gain exactly 1 for every tone below the cutoff and exactly 0 for every tone above it (lesson 10)
- FIR filter: a filter with no feedback, so its impulse response is its coefficient list, and then it stops (finite impulse response) (lesson 10)
- truncation: keeping only part of a filter's coefficient list and setting the rest to zero (lesson 10)
- Gibbs phenomenon: a cut-short sum of wiggles overshoots a cliff by about 9% of its height, no matter how many wiggles you keep (lesson 10)
- decibels (dB): 20 × log10 of a gain; 10% is −20 dB, 1% is −40 dB, 0.1% is −60 dB (lesson 10)
- window: the list of weights you multiply the ideal coefficients by to keep a finite piece of them (lesson 10)
- side lobe: one of the smaller humps on each side of a window response's tall central hump (lesson 10); lesson 14 restates it as a smaller hump beyond the main lobe, carrying leakage to bins far from the tone
- transition band: the stretch of tones between the last tone a filter passes within 1% and the first tone it removes to below 1% (lesson 10)
- voice band: 0 to 3,400 Hz, what a phone line promises to carry; 3,400 to 4,000 Hz is a margin left empty (lesson 10)
- analog filter: a filter that works on the smooth voltage itself, with no samples; it has a response at every frequency in Hz, from 0 to infinity (lesson 11)
- analog prototype: the analog filter you start from, the one whose response you want to copy into a digital filter (lesson 11)
- bilinear transform: a substitution, s = 2 × 8,000 × (1 − z^−1)/(1 + z^−1), that turns an analog filter's formula into a digital filter's and squeezes all analog frequencies, from 0 to infinity, onto the digital tones from 0 to 4,000 Hz (lesson 11)
- warping: the uneven squeeze of analog frequencies onto digital tones, gentle at the bottom and ever tighter toward 4,000 Hz (lesson 11)
- prewarping: choosing the prototype's cutoff by running the warping formula backward from the digital tone you want (lesson 11)
- DTMF (dual-tone multi-frequency): the keypad's two-tone scheme, where a key plays the tone of its row and the tone of its column together (lesson 12)
- left-right shadow: the dot's position as seen by a lamp straight above the wheel; its height, seen on a wall beside the wheel, is its up-down shadow (lesson 12)
- test tone: your own copy of the tone you're looking for, multiplied with the recording sample by sample and summed (lesson 12)
- match: how strongly the recording agrees with the test tone, whatever the phase: the length of the walk of samples turned by the test wheel (lesson 12)
- test wheel: a wheel turning backward, clockwise, at the test tone's speed (lesson 12)
- bin: a numbered slot; bin k holds the wheel that makes k turns in N samples, at the tone k × 8,000 ÷ N Hz, and the match the recording gets against it (lesson 12)
- DFT (discrete Fourier transform): the list of the matches of all N bins, one match per bin (lesson 12)
- frequency resolution: the spacing between neighboring bins, 8,000 ÷ N Hz (lesson 12)
- bar: the match a bin must clear for its tone to count; a key counts only when exactly one row tone and exactly one column tone clear it (lesson 12)
- multiplication: one number times another, the one cost unit the chip cares about; a sample turned into an arrow costs two, an arrow turned by an arrow costs four (lesson 13)
- even part / odd part: the turned even samples added up once, and the turned odd samples added up once (lesson 13)
- butterfly: takes the odd result and turns it by one arrow of the test wheel, then adds the turned result to the even result for bin k and subtracts it for bin k + N ÷ 2; four multiplications (lesson 13)
- layer: all the butterflies that combine small DFTs of one size into DFTs twice that size (lesson 13)
- position: one of the N places the numbers sit in between layers (lesson 13)
- FFT (fast Fourier transform): the DFT split into even and odd samples again and again until only butterflies are left; (N ÷ 2) × log₂ N butterflies (lesson 13)
- Goertzel: a filter with a pole pair on the unit circle at one bin's point, run for N samples, whose last two outputs give that one bin (lesson 13)
- leakage: the part of a tone that shows up in bins beyond the one or two nearest it; it happens because the block ends partway through a turn (lesson 14)
- main lobe: the hump of matches around a tone, out to the first zero on each side (lesson 14)
- zero padding: adding zeros to the end of a block before the DFT, which puts its bins closer together (lesson 14)
- negative tone: a dot turning clockwise; −1,000 Hz turns −45° per sample, and its shadow sounds exactly like +1,000 Hz (lesson 15)
- analytic signal: a version of the signal made only of positive tones, with every mirror arrow removed (lesson 15)
- Hilbert transformer: an all-pass filter that turns every positive tone back a quarter turn and every negative tone forward a quarter turn (lesson 15)
- single sideband: a shift that keeps only one of the two sidebands, the two copies a plain multiplication makes either side of each call tone (lesson 15)
- strength: how big the copy is compared with the original (lesson 16)
- ripple: the gain rises and falls in a regular pattern as you walk up through the tones (lesson 16)
- log spectrum: the logarithm of the size of every bin of the spectrum (lesson 16)
- cepstrum: the FFT of the log spectrum; it shows which periods the log spectrum repeats with, and a peak at position D means an echo D samples late (lesson 16)
- quefrency: a position in the cepstrum, counted in samples or in seconds (lesson 16)

## Next bug

Each lesson ends on the next lesson's bug, as listed above. Lesson 16 ends the series.
