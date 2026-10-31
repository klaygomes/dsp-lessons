# The Echo With No Address

## A new complaint

Remember the echo from lesson 2? Callers heard their own voice come back 0.25 s, or 2,000 samples, late. You held the caller's clean outgoing voice and you knew the delay, so you could predict the echo exactly, a shifted, scaled copy of that voice, and subtract it. Gone.

Then your line signs a deal with a partner network on the other side of the sea, and the tickets come back. "The person on the other end hears every word twice." "It's like calling from inside a cathedral."

You pull a recording: each word, then a ghost of it, about half as loud, a little later. And this time two things are different.

First, the echo happens inside the partner's network. What reaches you is already mixed: the far caller's voice with its own echo baked in. There's no clean copy to predict from. Second, calls through the partner take different routes, and every route has its own delay. One call echoes at 0.1 s, the next at 0.15 s, the next at something nobody wrote down. Your canceller has 2,000 samples baked in, so on a 1,200-sample echo it subtracts at the wrong moment and adds a second ghost.

You have one recording, voice and echo tangled together, and nobody will tell you the delay. Can the recording itself tell you?

It can. The trick looks strange the first time: you take the spectrum of the call, take its logarithm, and then take the spectrum of that. Let's build up to why, starting with an echo small enough to follow with a pencil.

## A tiny echo, sample by sample

Make the echo absurdly short: 4 samples late, half as strong. Every sample comes out, and 4 samples later half of it comes out again:

```
heard[n] = call[n] + 0.5 × call[n − 4]
```

The delay here is 4 samples. The echo's **strength** is 0.5: how big the copy is compared with the original. From lesson 3, a linear, time-invariant line can only scale and delay each tone. Let's see how much this one scales a few.

Before you look, guess. The echo adds half a copy of every tone. Does every tone come out 1.5 times as loud?

Start with 2,000 Hz, the tone that goes 1, 0, −1, 0 and repeats every four samples:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 2,000 Hz in | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |
| plus 0.5 × the sample 4 back | | | | | +0.5 | 0 | −0.5 | 0 |
| heard | 1 | 0 | −1 | 0 | 1.5 | 0 | −1.5 | 0 |

From sample 4 on, the echo lands right on top of the tone, and the tone comes out 1.5 times as tall. So far your guess holds.

Now 1,000 Hz, which takes eight samples to repeat:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| 1,000 Hz in | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 | 0 | 0.71 | 1 |
| plus 0.5 × the sample 4 back | | | | | +0.5 | +0.35 | 0 | −0.35 | −0.5 |
| heard | 1 | 0.71 | 0 | −0.71 | −0.5 | −0.35 | 0 | 0.35 | 0.5 |

Four samples back, this tone was on the opposite side, so the echo pulls against it, and from sample 4 on the tone comes out at half height. The figure puts the two cases side by side: each tone, its half-size copy shifted 4 samples, and the sum underneath.

[[diagram:echo-samples]]

Same echo, louder here, quieter there. A few more tones:

| tone | 0 Hz | 500 Hz | 1,000 Hz | 2,000 Hz | 3,000 Hz | 4,000 Hz |
|---|---|---|---|---|---|---|
| gain | 1.5 | 1.12 | 0.5 | 1.5 | 0.5 | 1.5 |

Up, down, up, down, with a peak every 2,000 Hz. Here it is as a curve, with the six table values as dots on it.

[[diagram:gain-ripple]]

An echo, seen tone by tone, is a **ripple**: the gain rises and falls in a regular pattern as you walk up through the tones.

## Why the echo ripples

Why every 2,000 Hz, and what does the 4 have to do with it? The wheel from lesson 3 answers it.

A tone is a dot on a wheel of radius 1, and its pitch is simply how far it turns the wheel between two samples: 360° × tone ÷ 8,000, which is 45° for every 1,000 Hz. The echo is the same dot, 4 samples behind, so it sits back by four of those per-sample steps. For 1,000 Hz that's 4 × 45° = 180°, the opposite side of the wheel. That's why the two pulled against each other and left 1 − 0.5 = 0.5.

At 2,000 Hz each step is 90°, so the echo sits 4 × 90° = 360° behind: a full lap, right back on top of the original. The two add, 1 + 0.5 = 1.5. At 500 Hz the echo sits 90° behind, at right angles. The two arrows then add up to a length of √(1² + 0.5²) ≈ 1.12, the 1.12 in the table.

Watch it move. In the figure, the original arrow stays put and the echo's half-size arrow hangs off its tip. As the tone rises, the echo arrow swings round, and the length of the sum traces the ripple.

[[diagram:echo-wheel]]

Every 1,000 Hz you climb adds 45° to each step, so it adds 4 × 45° = 180° to how far behind the echo sits. Every 2,000 Hz, the echo completes one more lap and the pattern starts over. So the ripple's period comes straight from the delay:

> An echo D samples late puts a ripple in the gain that repeats every 8,000 ÷ D Hz.

For our tiny echo, 8,000 ÷ 4 = 2,000 Hz. Make the delay 40 samples and the ripple repeats every 200 Hz, ten times tighter. For the lesson 2 echo, 2,000 samples late, it's 8,000 ÷ 2,000 = 4 Hz: a ripple so fine it peaks 1,000 times between 0 Hz and the limit.

The figure draws the 4-sample and 40-sample ripples on one axis: between 0 and 4,000 Hz, two wide humps against twenty narrow ones.

[[diagram:delay-vs-ripple]]

Notice which way that goes. A longer delay makes a finer ripple.

Go and play with it. Set a delay and a strength, and the lab plays a sweep through the echo. A sweep is one tone gliding from 0 Hz up to 4,000 Hz, so you hear the ripple as a wobble in loudness. Before you touch the delay slider, predict: if you double the delay, do the peaks get further apart or closer together?

[[lab]]

## The voice gets in the way

So the delay hides in the ripple's period: D = 8,000 ÷ period. Easy, if you could see the ripple.

But you never see the echo by itself. You see the spectrum of the call: the size of every DFT bin, as in lessons 12 and 14. And a voice's spectrum is anything but flat.

Say the voice is loud around 700 Hz, size 100, and quiet around 3,000 Hz, size 1. The echo scales each tone by its gain, so it multiplies the voice's spectrum by the ripple. Near 700 Hz the spectrum swings between 150 and 50, a swing of 100. Near 3,000 Hz it swings between 1.5 and 0.5, a swing of 1. Same ripple, a hundredfold difference in height.

What you want is an operation that changes "multiplied by" into "plus", so the ripple rides on top of the voice instead of being stretched by it. You already own one. It's the logarithm:

\[ \log(a \times b) = \log a + \log b \]

Here log means the natural logarithm, `math.log` in Python. Apply it to every bin, and the new list gets a name, the **log spectrum**: the logarithm of the size of every bin of the spectrum. Watch what it does. Near 700 Hz the swing runs from log 150 = 5.01 to log 50 = 3.91. Near 3,000 Hz it runs from log 1.5 = 0.41 to log 0.5 = −0.69. Both swings are 1.10. In the log spectrum, the voice's shape and the echo's ripple simply add, and the ripple has the same height everywhere.

The figure shows both. On top, the spectrum of an echoed voice: a big wobble on the loud hump at 700 Hz, a tiny one in the quiet valley at 3,000 Hz. Below, the same spectrum after the log: the same wobble, the same height, all the way across.

[[diagram:log-spectrum]]

## A spectrum of a spectrum

Back to the tiny echo, on its own, with no voice. Write down its gain at 16 tones, 500 Hz apart, all the way round lesson 6's unit circle: 0 Hz up to 7,500 Hz. These are the 16 bins a 16-point DFT would use. The tones above 4,000 Hz sit on the bottom half of the circle, the mirror arrows. 4,500 Hz sits opposite 3,500 Hz and has the same gain, 5,000 Hz matches 3,000 Hz, and so on. The figure puts the 16 tones as dots round the circle, each labelled in Hz, with every mirror pair joined.

[[diagram:tone-circle]]

Here is the log of the gain at the first nine:

| tone (Hz) | 0 | 500 | 1,000 | 1,500 | 2,000 | 2,500 | 3,000 | 3,500 | 4,000 |
|---|---|---|---|---|---|---|---|---|---|
| log of gain | 0.41 | 0.11 | −0.69 | 0.11 | 0.41 | 0.11 | −0.69 | 0.11 | 0.41 |

And the last seven mirror the ones before 4,000 Hz. It's a list that repeats: 0.41, 0.11, −0.69, 0.11, and again. You have a list that repeats, and you want to know how often. Have you seen that problem before?

You have. It's lesson 12. The DFT compares a list with N wheels, and the wheel that matches tells you how many times the pattern goes round across the whole list. Here the pattern repeats every 4 entries, so across all 16 it goes round 4 times. The match is bin 4.

And 4 is the delay.

Run the list through the FFT and divide by 16, so each bin reads as an average rather than a sum. (A plain FFT gives 4.39 at bin 4, which is 16 × 0.27.) Three bins light up, not one. Bin 4 is about 0.27. Bin 12 is the same 0.27, and it's bin 4's mirror, 16 − 4: a list that is its own mirror has a DFT that is its own mirror too. Read only the first half. Bin 8 is smaller and negative, about −0.13. Hold that thought: "The lopsided ripple" explains why it exists, and step five of the derivation explains its size.

[[diagram:list-dft]]

Why must the match land on the delay? Walk the tone once round the whole circle, from 0 Hz up to 8,000 Hz. The echo sits back by D per-sample steps, and each step grows by 45° per 1,000 Hz, so over the walk the echo falls back by 8 × 45° = 360° for every sample of delay: one lap each. A 4-sample delay means 4 laps, so 4 ripples round the circle, so bin 4. The figure animates exactly that: the tone's dot goes once round, the echo's dot laps it 4 times, and beside them the log ripple draws itself, 4 bumps for 4 laps.

[[diagram:lapping-echo]]

An echo D samples late puts D ripples round the circle and lights up bin D. The bin number is the delay in samples.

That's the whole method, and it has a name. The **cepstrum** is the FFT of the log spectrum. It shows which periods the log spectrum repeats with: a **peak** at position D means an echo D samples late.

The positions need a name too, because they aren't frequencies. **Quefrency** is a position in the cepstrum, counted in samples or in seconds. A peak at quefrency 1,200 samples means something in the call repeats 1,200 samples, or 0.15 s, later. It's measured in time, because what it finds is a delay.

[[diagram:cepstrum]]

The figure is the whole recipe in three panels: a call with an echo, its log spectrum with a fine ripple, and the cepstrum with one peak at the delay. The first arrow is "FFT, then log". The second is "FFT".

The names are an old joke. In 1963, Bogert, Healy and Tukey did exactly this to find echoes in seismic recordings, and since they were treating a spectrum like a signal, they reversed spec into ceps and shuffled frequency into quefrency.

## The real call

Now the ticket's call. Say this route delays the echo by 0.15 s, which is 0.15 × 8,000 = 1,200 samples, at strength 0.5. You don't know that yet, of course.

The ripple's period is 8,000 ÷ 1,200 ≈ 6.67 Hz. That's 600 peaks below the limit, so the whole spectrum just looks fuzzy. Zoom in from 1,000 Hz to 1,006.67 Hz and you find the tiny echo's four gains again, 1.5, 1.12, 0.5, 1.12, squeezed into 6.67 Hz instead of 2,000 Hz.

A ripple that fine brings a new demand on the record. The bins are samples of the ripple, and lesson 4 told you what sampling needs: more than two samples per cycle, or you get an alias. Here that means more than two bins per ripple. Bins sit 8,000 ÷ N Hz apart and the ripple repeats every 8,000 ÷ D Hz, so the bins per ripple are (8,000 ÷ D) ÷ (8,000 ÷ N) = N ÷ D. More than two means N ÷ D > 2:

> The record must hold more than 2D samples: N > 2D.

For our echo, that's more than 2,400 samples. Break it and even a pure echo, with no voice at all, puts its peak at a false quefrency, like lesson 4's whistle. Take N = 1,024. The bins sit 7.8 Hz apart, coarser than the ripple itself. The peak shows up at 176, which is 1,200 − 1,024: it wrapped round the cepstrum. Take N = 2,048. The bins sit 3.9 Hz apart, finer than the ripple but only 1.7 per ripple. The peak shows up at 848, which is 2,048 − 1,200: the mirror of the true one. The figure lays the three bin spacings, 7.8, 3.9 and 0.98 Hz, as tick marks over the same stretch of ripple, with the peak each one produces: 176, 848, 1,200.

[[diagram:bins-vs-ripple]]

With a real voice, 2D is only the minimum. The ripple comes only from sound the record holds twice, as a word and as its echo 1,200 samples later. The window from lesson 14 fades both ends of the record, so pairs near the ends count for little, and a longer record holds more pairs well inside. At N = 4,096 the peak does sit at 1,200, but at 0.11 it's no taller than the voice's own bumps. So take N = 8,192 samples, about one second, with that window, which also stops the voice's strong tones leaking across the ripple. Then:

1. FFT the 8,192 samples: the spectrum.
2. Take the log of each bin's size: the log spectrum.
3. FFT that, and divide by 8,192: the cepstrum.
4. Skip the quefrencies below 100, where the voice itself lives (more on that below), and find the tallest peak.

On a voice with this echo, the tallest peak sits at exactly 1,200 samples, height 0.20, and nothing else passes about 0.08. The recording tells you plainly: 1,200 samples, 0.15 s.

What are those smaller bumps, and why skip below 100? They're the voice. Its broad shape, one hump and one valley across the whole spectrum, is a very slow wobble. By the rule you already have, the slower the ripple the smaller the quefrency, so that shape lands near quefrency 0. A voice also buzzes at a pitch. Take that on trust for now: this one buzzed at 125 Hz, and a buzz gives the spectrum a ripple of its own, one peak every 125 Hz. By the same rule, that ripple puts a peak at quefrency 8,000 ÷ 125 = 64 samples, 8 ms, with smaller bumps at multiples of 64. Luckily, voices buzz with periods of a few milliseconds, and echoes arrive tenths of a second late, far out in the cepstrum.

The figure is that cepstrum from 0 to 2,500 samples, with each region labelled: the voice's shape near 0, the pitch at 64 and its multiples, the cutoff at 100, the echo's peak at 1,200 and its dip at 2,400.

[[diagram:real-cepstrum]]

## Why the cepstrum puts a peak at the delay

Now let's see why it has to work, in the notation of the book this course follows, Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989). Keep D for the delay, and call the strength \(\alpha\).

First, one link to the wheel. The book measures a tone's turn per sample in radians, \(\omega\), instead of degrees. A full lap, 360°, is \(2\pi\), so \(\omega = 2\pi \times \text{tone} / 8000\). For 1,000 Hz that's \(\pi/4\), our 45°. And lesson 6's \(j\) is a quarter turn counter-clockwise, so \(j \times j = -1\), and \(e^{j\theta}\) is the point at angle \(\theta\) on the unit circle.

**Step one: the echo multiplies the spectrum.** What you hear is \(y[n] = x[n] + \alpha\, x[n - D]\). From lesson 6, delaying a tone \(D\) samples multiplies it by \(z^{-D}\), and on the unit circle \(z = e^{j\omega}\). So each tone of the voice is multiplied by

\[ H(e^{j\omega}) = 1 + \alpha\, e^{-j\omega D}, \qquad Y(e^{j\omega}) = X(e^{j\omega})\, H(e^{j\omega}) \]

The 1 is the original arrow. The second term is the echo's arrow, shorter by \(\alpha\) and set back by \(\omega D\). That's the wheel reasoning from "Why the echo ripples": for \(D = 4\) at 1,000 Hz, the echo sits 4 × 45° = 180° behind, and in radians \(4 \times \pi/4 = \pi\).

**Step two: the log makes times into plus.**

\[ \log|Y| = \log|X| + \log|H| \]

**Step three: the log of an arrow.** You've never taken the log of a complex number, so let's do it once. Any complex number is a size times a point on the circle, \(r e^{j\theta}\): lesson 6's arrow, stretched to length \(r\). Its log splits in two, because the log of a product is the sum of the logs, and the log of \(e^{j\theta}\) is just \(j\theta\):

\[ \log\left(r e^{j\theta}\right) = \log r + j\theta \]

So the real part of the log is the log of the size. Check it on the 500 Hz case: \(1 + 0.5 e^{-j\pi/2} = 1 - 0.5j\), size 1.118. Its log is \(0.112 - 0.464j\), and 0.112 is log 1.118.

**Step four: unpack the echo's log.** For any \(u\) smaller than 1 in size, the log has a famous series:

\[ \log(1 + u) = u - \frac{u^2}{2} + \frac{u^3}{3} - \cdots \]

Check it with \(u = 0.5\): 0.5 − 0.125 + 0.042 − 0.016 + ... comes to 0.41, which is log 1.5. Now put in \(u = \alpha\, e^{-j\omega D}\), whose size is \(\alpha < 1\), and keep the real part. Each \(e^{-jk\omega D}\) becomes its horizontal shadow, \(\cos(k\omega D)\), like the spinning arrow in lesson 6:

\[ \log|H| = \alpha \cos(\omega D) - \frac{\alpha^2}{2}\cos(2\omega D) + \frac{\alpha^3}{3}\cos(3\omega D) - \cdots \]

**Step five: read off the periods.** As \(\omega\) goes once round the circle, \(\cos(\omega D)\) goes round \(D\) times. That's the ripple, and the DFT puts it in bin \(D\). The next term goes round \(2D\) times, the next \(3D\). So the cepstrum of the echo is a row of spikes:

\[ c[D] = \frac{\alpha}{2}, \qquad c[2D] = -\frac{\alpha^2}{4}, \qquad c[3D] = \frac{\alpha^3}{6}, \ \ldots \]

Where do the halves come from? A cosine is two arrows, one spinning each way, and each takes half. In the cepstrum, the second arrow is the mirror spike at \(N - D\): that's the bin 12 you saw light up in the 16-bin list. With \(\alpha = 0.5\) the spikes are 0.25, then −0.0625, then 0.021. Run a finer, 64-bin version of the tiny echo and those exact numbers come out at quefrencies 4, 8 and 12. (With only 16 bins they crowd into each other, which is why you saw 0.27 and −0.13.)

The voice's \(\log|X|\) adds its own cepstrum on top, mostly near quefrency 0 and at its pitch. That's why the real call's peak came out at 0.20 rather than a clean 0.25. Its position didn't budge.

One note for when you open the book. Its chapter 12 (in the first edition, 1989) takes the inverse DFT where we took the FFT: the same wheels, spun the other way, with the result divided by N. A log spectrum is its own mirror, and for such a list spinning the wheels the other way changes nothing. So our FFT, divided by N, gives exactly the book's cepstrum.

## The lopsided ripple

Step five hides a twist. Why are there spikes at \(2D\) and \(3D\) at all? There's only one echo.

Look back at the log of the gain: 0.41 at the peaks, −0.69 in the dips. The log squashes big numbers and stretches small ones, so the dips are deeper than the peaks are high, and the ripple isn't a pure cosine. Describing a lopsided ripple takes a few faster cosines added on, and those are the smaller spikes. The figure shows the log ripple beside a pure cosine, then the first three terms of the series adding up to the lopsided shape.

[[diagram:lopsided-log]]

Those smaller spikes are not more echoes. So when you scan a cepstrum, the tallest spike is the echo. The little ones at double and triple its quefrency, shrinking and flipping sign, belong to it. Don't chase them as extra echoes. The negative one is a handy check, too: if you think you've found an echo at 1,200, look for a dip at 2,400. In the real call it's there, at −0.04.

## Your turn

Now you fix the line. In the lab, a call from the partner network is waiting, with an echo whose delay and strength you don't know. Your job:

1. Compute its cepstrum and find the peak. Read off its quefrency: that's the delay, in samples and in seconds.
2. Set the canceller to that delay. For a first guess at the strength, double the peak's height. The voice pulls the peak down a little, so the guess runs low: 0.20 doubled gives 0.40 for a true 0.5. Slide the strength up until the peak in the cepstrum disappears.

There's one change from lesson 2's canceller. Back then you had the clean outgoing voice, so you subtracted a shifted copy of it. Here the only recording is the mixed one. Subtract a shifted copy of that, and you remove the echo but leave the echo's own echo behind, a quarter as strong, twice as late. The only clean voice you can get is the one you're cleaning, so the canceller subtracts a shifted copy of its own output:

```
clean[n] = heard[n] − strength × clean[n − D]
```

Why is that exact? Run lesson 6's derivation on it: \(\text{Clean}(z)\,(1 + \alpha z^{-D}) = \text{Heard}(z)\), so the canceller's system function is \(1 / (1 + \alpha z^{-D})\), the exact inverse of the echo's \(1 + \alpha z^{-D}\). Multiply the two and you get 1. Its poles sit at radius \(\alpha^{1/D}\), about 0.9994 for 0.5 and 1,200, just inside the circle, so it's stable. The raw-copy canceller multiplies instead by \((1 - \alpha z^{-D})(1 + \alpha z^{-D}) = 1 - \alpha^2 z^{-2D}\): that's the leftover echo, \(\alpha^2 = 0.25\) strong, at 2D. The figure shows both cancellers, and what each leaves behind after a single click.

[[diagram:canceller]]

You're done when the echo is gone to your ears and the cepstrum is flat where the peak was.

[[lab-act2]]

## What people get wrong

"Long" sounds like "slow", so it feels natural that a long echo should make a long, lazy ripple. It's the other way round. The tiny 4-sample echo rippled every 2,000 Hz, the partner's 0.15 s echo every 6.67 Hz, and lesson 2's 0.25 s echo every 4 Hz. A long echo is a fast ripple. And the tighter the ripple, the further out its cepstrum peak, right at the delay.

## Recap

- An echo D samples late at strength \(\alpha\) multiplies each tone by \(1 + \alpha e^{-j\omega D}\): a **ripple** in the gain that repeats every 8,000 ÷ D Hz.
- The echo multiplies the voice's spectrum. The **log spectrum** makes that a sum, so the ripple has the same height everywhere.
- The **cepstrum** is the FFT of the log spectrum. Its positions are **quefrencies**, measured in time.
- An echo puts a **peak** at quefrency D, about \(\alpha / 2\) tall, with smaller spikes at 2D and 3D, and a mirror at N − D.
- Read the delay off the peak, set the canceller, and subtract its own shifted output.

## The line you built

That's the last bug. Before you hang up, look back, because you built this line yourself.

It began with one click sent down the wire, and the answer that came back told you everything the line would ever do to a call. Then a tone became a dot on a wheel, and the wheel never left. It caught the whistle at the wrong pitch, held the zeros that silenced the whine, and showed you where every ring and smear came from. Later you laid N wheels against a recording to hear which key was pressed. And today you took the spectrum of a spectrum, and an echo nobody could locate told you its own address.

The next time a real line buzzes, rings or echoes, you won't need a lesson to tell you where to look.
