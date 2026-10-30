# Discrete-Time Signal Processing, the phone line series

Source: Alan V. Oppenheim and Ronald W. Schafer, *Discrete-Time Signal Processing*, Prentice Hall, first edition (1989, ISBN 0-13-216771-9). Chapter numbers follow this edition: 3 sampling, 4 the z-transform, 5 transform analysis of LTI systems.
Audience: software engineers with no signal processing background.
Language: English.

## The world

You are building a digital phone line. It takes 8,000 samples per second, so it can carry tones up to 4,000 Hz. Every lesson opens on a bug that real customers hear on your line, and ends when you fix it yourself.

## Lessons

| # | Lesson | Bug | Fix | Page | Status |
|---|---|---|---|---|---|
| 1 | Sampling and aliasing (ch. 3) | a 5,000 Hz whistle comes out at 3,000 Hz | filter out tones above the limit before sampling | https://claude.ai/artifact/KLXCrvTjDcctneMDYmWSRZ | built under the old rules; rebuild after lesson 2 |
| 2 | Zeros and poles (ch. 4) | calls carry a whine, first at 4,000 Hz, then at 2,000 Hz | put zeros on the whine, then poles beside them to save the voice | https://claude.ai/artifact/UhaTxWAQoa1nquvj9aVcYf | built; waiting for review |

## Glossary

- sample: one measurement of the sound at one moment (lesson 1)
- sampling rate: the number of samples in one second, here 8,000 (lesson 1)
- the limit: half the sampling rate, here 4,000 Hz; the fastest tone the line can store (lesson 1)
- alias: a lower, false tone that gives the same samples as a higher, true one (lesson 1)
- the true tone: the sound that went into the phone, before sampling (lesson 1)
- stores: what the phone keeps after sampling (lesson 1)
- filter: a rule that builds each output sample from input samples, and with feedback also from its own earlier outputs (lesson 2)
- passes / removes: how much of a tone gets out of a filter, and a tone that gets out at 0% (lesson 2)
- unit circle: one point per tone, 0 Hz at the right, 4,000 Hz at the left, the bottom half holding each tone's mirror arrow (lesson 2)
- zero: a point where the filter's output vanishes (lesson 2)
- pole: a point where the response shoots up; comes from feedback; its radius is how much an echo keeps per sample (lesson 2)
- notch: a filter that removes one narrow band of tones and passes the rest (lesson 2)
- stable: every pole strictly inside the unit circle, so echoes die out (lesson 2)
- system function H(z): the number a tone z^n is multiplied by when it passes through the filter (lesson 2)

## Next bug

After lesson 2: every time a call starts, a faint ring is left behind at exactly 2,000 Hz, like a bell after you strike it. Where does it come from, and how long does it last? (impulse response, chapter 5)
