# Sampling and aliasing

**Objective:** after this, you can predict which frequency a computer stores when it samples a wave, and say why it must sample faster than twice the highest frequency.

You already know a video of a car wheel. Sometimes the wheel looks like it turns backwards. The camera did not lie about one frame. It took too few frames.

A computer has the same problem with sound. It cannot store a continuous wave. It measures the wave at fixed moments. Each measurement is a **sample**. The number of samples in one second is the **sampling rate**.

Between two samples, the computer knows nothing. So it connects the dots with the slowest wave that fits them. If the wave moves slowly, compared with the sampling rate, the slowest fit is the true wave. If the wave moves fast, a slower wave fits the same dots. The computer stores that slower wave. This false wave is an **alias**.

The limit is half the sampling rate. A wave below that limit is safe. A wave above it folds back below it, like a mirror. At 8,000 samples per second, a 5,000 Hz tone is stored as 3,000 Hz.

You cannot fix an alias after sampling. The dots of the true wave and the false wave are identical. So systems remove high frequencies before they sample.

## Five facts
1. A sampled signal is a list of numbers taken at equal time steps.
2. Half the sampling rate is the highest frequency that sampling keeps correctly.
3. A frequency above that limit is stored as a lower frequency, mirrored around the limit.
4. After sampling, the true wave and its alias give the same numbers.
5. A low-pass filter before the sampler removes the frequencies that would alias.

## Three terms
- **sample**: one measurement of the wave at one moment.
- **sampling rate**: the number of samples in one second, in hertz (Hz).
- **alias**: a lower, false frequency that gives the same samples as a higher, true one.

## Misconception
"More samples of a fast wave only add detail; too few only lose detail." This is wrong. Too few samples do not make the wave blurry. They make a different wave, and it looks exactly as clean as a real one.

## Example
Telephone audio samples at 8,000 Hz, so the limit is 4,000 Hz. A 5,000 Hz whistle is 1,000 Hz above the limit. It folds to 4,000 - 1,000 = 3,000 Hz. The phone network filters out everything above about 3,400 Hz before sampling, so the whistle is removed instead of changed.

## Recap
Sampling sees only dots. Below half the sampling rate, the dots describe the true wave. Above it, they describe a slower false wave, so filter first.

## Assumptions
- Topic: chapter 3 of Oppenheim and Schafer, "Sampling of Continuous-Time Signals". The whole book does not fit one lesson.
- Audience: software engineers with no signal processing background.
- "Slowest wave that fits" stands for ideal band-limited reconstruction. The book's sinc interpolation is not needed for this objective.
