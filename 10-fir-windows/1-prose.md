# The Ghost in the Sweep

## A ghost on the wideband line

Remember lesson 5's wideband line? Its phones take 16,000 samples per second, and to join their calls to yours you downsample, keeping every second sample. That folds every tone above 4,000 Hz back into your line. So you put a low-pass filter in front of it first, a filter that passes low tones and removes high ones. Lesson 5 handed you a ready-made one, 31 numbers long, with a note: "passes everything below 4,000 Hz, removes everything above."

Today a test engineer from the wideband line calls. On the wideband side she plays a slow sweep, one pure tone gliding from 4,000 Hz up to 8,000 Hz over ten seconds. Every tone is above 4,000 Hz, so she expects silence.

Here's what she hears. Right at the start there's a tone near the top of your line, loud at first, half the sweep's strength, gone within a second. She shrugs that off as the edge of the line. But then the ghost keeps coming, gliding downward from the top of your line into the range where voices live. It swells, fades to nothing, and swells again, a little more than a second apart, like a siren heard through a door that keeps opening. The biggest swell is 9% of the sweep's strength, heard at 3,500 Hz, near the top of your line. Down at 3,000 Hz, where voices live, the swells are still 5%, and even at 1,000 Hz they're 2%. And on real calls, the top of a wideband voice, around 3,500 Hz, comes out a little louder on your side than it went in. Not quieter. Louder.

You can already explain the direction: lesson 5 showed that downsampling turns a tone between 4,000 and 8,000 Hz into an alias at 8,000 minus that frequency, so the rising sweep comes out falling. The real questions are different. Why does anything get through the filter at all? Why does it come and go in waves? And how can a filter that only multiplies and adds make a tone louder than it was?

To answer them, we'll rebuild lesson 5's filter from scratch.

## The wheel, twice as fast

In lesson 3, a tone is a dot on a wheel, turning 360° × tone ÷ 8,000 per sample. Lesson 6 marked every tone on that wheel at once and called it the unit circle. On the wideband side only the count changes. There are 16,000 samples per second, so the dot turns half as far between two samples: 360° × tone ÷ 16,000. So 4,000 Hz is a quarter turn, 90°, at the top. 8,000 Hz, the wideband limit, is a flip, 180°, at the far left.

The picture below is that wheel. The top-right quarter, 0° to 90°, is shaded "pass". The top-left quarter, 90° to 180°, is shaded "remove". The bottom half is greyed out. Remember lesson 6's mirror arrow: a real tone is two half-size arrows turning opposite ways, one in the top half and its mirror in the bottom half. The bottom half holds only those mirrors, so it adds nothing new. On an inner dotted ring, a 4,000 Hz tone steps around sample by sample; the small numbers there count samples, with n = 0 for the first sample, n = 1 for the next, and so on.

[[diagram:wheel16k]]

Now lesson 3's frequency response, drawn as a curve. Tones run along the bottom from 0 Hz to 8,000 Hz, and the height is the gain, how much of each tone gets out. A gain of 1 means the tone passes whole, 0 means it's removed. The filter we want has a curve shaped like a step: flat at 1 up to 4,000 Hz, a sheer cliff down to 0, then flat at 0. Lesson 4 called the tone where a filter switches from keeping to removing its **cutoff**. For this lesson's filters we measure it where the gain is half, halfway down the cliff. Ours is 4,000 Hz. The next picture is exactly that step, with the cliff labeled.

[[diagram:cutoff]]

## The perfect filter

Imagine a low-pass with no compromise at all: gain exactly 1 for every tone below the cutoff, exactly 0 for every tone above it. That's the **ideal low-pass**, and it's what lesson 5's note promised. What would it look like as a program?

Without feedback, a filter is just a list of numbers. Multiply the current sample by the first, the one before by the second, and so on, then add it all up. Those fixed numbers are the filter's coefficients. We'll write them h[0], h[1], h[2] and so on: h[n] is the coefficient that multiplies the sample from n samples ago. Lesson 2 gives them a second meaning. Send in a single click, a 1 followed by zeros, and what comes out, sample by sample, is the coefficient list itself. So the coefficients are the impulse response. Such a filter is an **FIR filter**, for finite impulse response: it has no feedback, so its impulse response is its coefficient list, and then it stops. The picture below shows a click going in and the list coming out, one number per sample, then nothing.

[[diagram:fir]]

The picture counts the list from its first number, h[0] to h[4], with the middle one at h[2]. From here on we number the list from its middle instead: the middle coefficient is h[0], the ones after it h[1], h[2], and the ones before it get negative numbers, h[−1], h[−2]. Same list, just counted from the centre.

So what is the ideal low-pass's coefficient list? Here it is, for a cutoff of 4,000 Hz at 16,000 samples per second. We'll derive the formula later. It counts angles in lesson 6's radians, where a full turn is 2π, so π/2 is the quarter turn, 90°, that 4,000 Hz makes on this wheel. And sin, the sine, is the height of a dot on the wheel after turning by that angle: 0 at no turn, 1 at a quarter turn, 0 again at a half turn.

\[ h[n] = \frac{\sin(\pi n / 2)}{\pi n}, \qquad h[0] = \tfrac{1}{2} \]

At n = 0 the formula would read 0 ÷ 0, so the middle gets its own value: one half, the average height of the step, since half the tones pass.

The list runs both ways from the middle, so there's an h[−1] as well as an h[1], and they're equal. The table shows each value once for both signs.

| n | 0 | ±1 | ±2 | ±3 | ±4 | ±5 | ±6 | ±7 | ±9 | ±15 |
|---|---|---|---|---|---|---|---|---|---|---|
| h[n] | 0.5 | 0.3183 | 0 | −0.1061 | 0 | 0.0637 | 0 | −0.0455 | 0.0354 | −0.0212 |

The next picture draws the list as stems, from n = −15 to 15, with arrows at both ends saying "continues forever", beside the step it produces.

[[diagram:ideal]]

Notice three things. Every even coefficient except the middle one is zero. The list runs in both directions, so the ideal filter wants to hear the future. And, the real problem, the list never ends. The odd coefficients shrink slowly, like 1 ÷ n. At n = 15 it's still 0.0212, at n = 101 it's 0.0032, at n = 1,001 it's 0.0003.

## Cutting it short

So you do what lesson 5's filter did. Keep the 31 coefficients in the middle, n from −15 to 15, and throw the rest away. That's **truncation**: keeping only part of a filter's coefficient list and setting the rest to zero. Then delay the whole thing by 15 samples so it never needs the future. The output arrives about 0.94 milliseconds late, and because the list is symmetric, every tone is delayed by the same 15 samples. That's lesson 8's linear phase, which comes free with any symmetric list.

How good is the cut filter? Start with 0 Hz, a constant: feed in 1, 1, 1, 1 and every output is the sum of the coefficients. The ideal list adds up to exactly 1; ours adds only the ones we kept. Begin with the middle coefficient, then add the next nonzero pair, h[1] and h[−1], then h[3] and h[−3], and watch the total. Before you look, a prediction.

[[predict-zero]]

| coefficients kept | pair added | running total = gain at 0 Hz |
|---|---|---|
| 1 (n = 0) | | 0.5000 |
| 3 (up to ±1) | +0.6366 | 1.1366 |
| 7 (up to ±3) | −0.2122 | 0.9244 |
| 11 (up to ±5) | +0.1273 | 1.0517 |
| 15 (up to ±7) | −0.0909 | 0.9608 |
| 19 (up to ±9) | +0.0707 | 1.0315 |
| 23 (up to ±11) | −0.0579 | 0.9737 |
| 27 (up to ±13) | +0.0490 | 1.0226 |
| 31 (up to ±15) | −0.0424 | 0.9802 |

(The totals are summed before rounding.) It doesn't climb. It overshoots to 114%, dives to 92%, and then swings around 1, each swing a bit smaller. With 31 coefficients, 0 Hz comes out at 98%. The next picture draws this as a staircase that overshoots and settles, with the kept stems solid and the dropped ones faded.

[[diagram:truncation]]

What about other tones? Here's the step that makes every tone easy. A tone is a spinning arrow that turns by the same angle every sample; call that angle the turn. On this wheel 4,000 Hz has a turn of 90°, and 2,000 Hz a turn of 45°. The coefficient h[m] works on the input from m samples ago, which is the arrow turned back by m steps. Its partner h[−m] works on the input from m samples ahead, the arrow turned forward by m steps. The two coefficients are equal, so the pair adds an arrow and its mirror. That's lesson 6's trick. Their up-and-down parts cancel, and what's left lies flat, 2 cos(m × turn) long. Here cos, the cosine, is sin's partner: the dot's left-right position on the wheel after that turn, 1 at no turn, 0 at a quarter turn, −1 at a half turn.

So each pair contributes 2 h[m] cos(m × turn), a plain real number that can be positive or negative. The animation below shows the two arrows turning opposite ways, with their sum sliding along the flat line. It ends on one frozen frame, the arrows at 30° with their flat sum marked.

[[diagram:pair-cosine]]

The gain at any tone is h[0] plus all those pair contributions. Try the cutoff, 4,000 Hz, a turn of 90° per sample. Every pair has odd m, and cos(90° × m) is zero for odd m. Only the middle coefficient survives, so the gain is exactly 0.5 at any length. Every cut filter passes half of the cutoff tone, sitting halfway down the cliff. That's the tone she heard right at the start of the sweep.

The trouble lives on either side of the cliff. In the lab you get the plain cut and one slider, its length, from 7 to 255 coefficients. It moves in steps of four, one new nonzero pair at a time: the even coefficients are zero, so a step of two would change nothing every other time. The curve shows the gain at every tone. Drag the slider and watch the bump just left of the cliff and the wiggles just right of it. Below the curve, a strip draws the engineer's sweep as it comes out on your side, thicker where the ghost is louder. "Play the sweep" lets you hear it: the ten-second sweep runs through the filter and the downsampler, over and over until you stop it. "Filter on" switches the filter out, so you can hear what the downsampler alone does to the sweep.

[[lab]]

## Above one and below zero

You saw the curve bump above 1 just before the cliff, and dip below 0 just after. A gain below zero sounds impossible, but you just saw where it comes from: a sum of cosines can be negative. A gain of −0.09 means 9% of the tone gets out, flipped upside down. Here's the 31-coefficient filter near its cutoff, with where each input tone lands on your side:

| tone in | 3,500 | 4,000 | 4,500 | 5,000 | 7,000 |
|---|---|---|---|---|---|
| gain | 1.090 | 0.500 | −0.090 | 0.050 | 0.021 |
| heard at | 3,500 | 4,000 | 3,500 | 3,000 | 1,000 |

Those are the bug's numbers. To see a negative gain built from its parts, take 4,500 Hz, a turn of 101.25° per sample. The picture below is a bar for each pair's contribution: 0.5 for the middle, then −0.124, −0.118, −0.106, and on down to −0.008. Every pair pulls down, and together they land on −0.090.

[[diagram:pair-bars]]

Between the swells the gain crosses zero, near 4,306, 4,778 and 5,267 Hz, every 500 Hz or so. The sweep climbs 400 Hz each second, so it takes a little over a second to cross each ripple. The picture below lines up the two sides in time. On top, the sweep rises from 4,000 to 8,000 Hz. Below, the ghost falls from 4,000 to 0, drawn thicker where it's louder.

[[diagram:sweep-ghost]]

Now the natural fix, the one you tried in the lab: use more coefficients. The 0 Hz table got better with every pair, but the bump never shrinks. It slides closer to the cutoff and gets narrower, but its height is stuck near 9%. The leak on the far side does the same, mirrored. This stubborn overshoot is the **Gibbs phenomenon**: a cut-short sum of wiggles overshoots a cliff by about 9% of its height, no matter how many wiggles you keep. Josiah Willard Gibbs described it in 1899, and Maxime Bôcher analysed it in 1906 and named it after Gibbs. The exact number is 8.95%. The next picture overlays the curves for 15, 63 and 255 coefficients, with a guide line at 1.09 that every peak touches.

[[diagram:gibbs]]

People who design filters usually say decibels rather than percent. A gain in **decibels** (dB) is 20 × log10 of the gain, where log10 of a number is the power of ten that makes it: log10 of 100 is 2, log10 of 0.01 is −2. It turns factors of ten into steps of 20: 10% is −20 dB, 1% is −40 dB, 0.1% is −60 dB. The Gibbs leak, 9%, is about −21 dB. The picture below is that ladder, with the 9% leak marked at −21 dB and 1% at −40 dB.

[[diagram:decibels]]

## Where the coefficients come from

Before explaining the 9%, where does the formula come from? This is where chapter 7 of Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), the book this course follows, begins. The short version: the gain curve is a sum of cosine wiggles across the tones, one per coefficient pair, and each coefficient is the average of the gain times its own wiggle. The proof takes four steps, no new tools, and a pencil check; open it if you want it, or skip ahead.

**Step one: the curve is a sum of wiggles.** The gain at a tone is h[0] plus 2 h[1] cos(turn) plus 2 h[2] cos(2 × turn), and so on. Each term is a wiggle across the tones. From 0 to 8,000 Hz the turn goes from 0° to 180°, so cos(turn) makes one half-swing, falling from 1 to −1. cos(2 × turn) makes two half-swings, down and back up. cos(15 × turn) makes fifteen. Each coefficient sets one wiggle's size. The picture below stacks the first three odd wiggles above their running sum, which already leans toward the step.

[[diagram:wiggles]]

**Step two: wiggles ignore each other.** Multiply two different wiggles and average over every tone from 0 to 8,000 Hz, and you get zero. Here's why. The product of two cosines is half the sum of two other cosines, cos(a) cos(b) = ½ cos(a − b) + ½ cos(a + b). Each of those is a whole number of half-swings, and every half-swing, from a peak to a trough, sits half above zero and half below. So each averages to zero. Multiply a wiggle by itself, though, and the a − b part is cos(0) = 1, so the average is one half. The picture below shows one such product, with its running average settling on zero.

[[diagram:average]]

**Step three: run it backward.** So multiply the curve by one coefficient's wiggle and average: every other wiggle averages away, leaving 2 h[m] × one half, which is h[m]:

\[ h[m] = \text{average over all tones of } \big(\text{gain} \times \cos(m \times \text{turn})\big), \qquad h[0] = \text{average gain} \]

**Step four: the ideal low-pass.** Its gain is 1 on the first half of the tones and 0 on the rest, so h[0], the average gain, is one half. For the others, check with a pencil using eight tones, at turns of 11.25°, 33.75°, and so on up to 168.75°, the middles of eight equal slices of 0° to 180°. The first four pass, so they contribute their cosines, and the last four contribute nothing:

\[ h[1] \approx \tfrac{1}{8}\left(\cos 11.25° + \cos 33.75° + \cos 56.25° + \cos 78.75°\right) = \tfrac{1}{8}(0.9808 + 0.8315 + 0.5556 + 0.1951) = 0.3204 \]

The true value is 0.3183. For h[2], the passing tones give cos 22.5° + cos 67.5° + cos 112.5° + cos 157.5° = 0. Exactly the zero in the table. With a thousand tones instead of eight, the averages land on 0.5, 0.3183, 0, −0.1061, 0, 0.0637: the table, to four places. With every tone, the book shows, the average is exactly sin(πm/2) ÷ (πm).

So a cliff needs wiggles of every speed, forever, and truncation keeps the slow ones and drops the fast ones all at once. The animation below adds the pairs one at a time. The overshoot appears with the first pair and never drops below about 1.09. It only gets narrower. To see why its height is fixed, we need one more picture.

[[diagram:gibbs-build]]

## The cut has sharp edges

Cutting the list to 31 coefficients is the same as multiplying the ideal list, number by number, by a second list: 1 for every coefficient you keep, 0 for every one you throw away. That second list is the **window**: the list of weights you multiply the ideal coefficients by to keep a finite piece of them. The plain cut uses the bluntest window there is, a rectangle: full weight, full weight, then nothing. The picture below shows the three rows, ideal list, rectangle, and their product, multiplied stem by stem.

[[diagram:window]]

A window is a list of numbers, so it has a frequency response of its own. The rectangle's response, drawn in the still picture below, is a tall central hump with smaller side humps on each side. The first side hump on each side is negative, about 22% as tall as the main one, and they alternate after that, shrinking slowly. These side humps are called side lobes, and they come from the rectangle's sharp edges. Beside it is a window of the same length, 31, with soft edges instead: its weights fade smoothly from 1 in the middle to almost 0 at the ends, instead of stopping dead. A window that fades out like that is called a **taper**. This one is the Hamming window, and we'll build it in a moment. At the same length its response has a hump about twice as wide, and side lobes too small to see.

[[diagram:rect-response]]

Now the key fact, which the book proves and we'll take on trust. Multiplying the coefficient lists does something specific to the response. Take the window's response curve, slide it along the ideal step, and at each position multiply the two curves and add up the result. That slide-multiply-add is lesson 2's convolution, done on curves over the tones instead of lists of samples. The cut filter's response is exactly that: the ideal step, convolved with the window's response. Because every point of the step gets spread out into the window's shape, people say the step is smeared.

So here's the 9%, concretely. Slide the hump toward the cliff from the pass side. At each position, the result is the share of the hump's area still on the pass side. Whatever has slid past the cliff counts for nothing. Far from the cliff, the whole area counts, and the result is 1. Now stop when the main hump sits fully on the pass side, just touching the cliff. Past the cliff lie the first negative side lobe and all the lobes after it. Those left-out lobes add up to about −9% of the total. Leave out a part worth −9% and what remains is 109%. That's the bump.

And why doesn't length help? A longer rectangle has a narrower response, but the same shape: every lobe shrinks in width by the same factor, so every lobe's share of the area stays the same. The left-out part is still −9%. The animation below slides the rectangle's hump across the cliff, drawing the 9% bump, then slides the Hamming hump and draws a gentle slope instead.

[[diagram:smear]]

So the cure is not a longer window but one without sharp edges.

## Where the slope is allowed to live

A smooth window trades the cliff for a slope, so some tones just above 4,000 Hz will leak. Is that acceptable? It depends on where they land. Phone lines promise to carry voices up to 3,400 Hz. Lesson 3 called the phone range 300 to 3,400 Hz, but this job holds everything below 3,400 Hz, down to 0 Hz, to the 1% standard, so here the voice band means 0 to 3,400 Hz. The strip from 3,400 to 4,000 Hz at the top of your line is a margin that phone systems leave empty on purpose, for exactly this kind of slope.

Now follow the aliasing. An input tone between 4,000 and 4,600 Hz lands between 4,000 and 3,400 Hz on your side, inside the empty margin. An input tone above 4,600 Hz lands below 3,400 Hz, inside the voice band. So the honest job is:

1. Pass every tone from 0 to 3,400 Hz within 1%.
2. Remove every tone above 4,600 Hz to below 1%, that is, below −40 dB.
3. Let the slope live between 3,400 and 4,600 Hz, centered on the cutoff.

The picture below draws this job on the frequency axis. A shaded "pass" strip runs from 0 to 3,400 Hz, a striped "remove" strip from 4,600 Hz up, and a plain "slope" sits between. Arrows show where each band lands after downsampling.

[[diagram:spec]]

The plain cut can meet this job, but only by brute force. Trying every length, the shortest rectangle that works has 271 coefficients. It passes the voice band within 0.93%, and its slope runs from 3,408 to 4,592 Hz. Your chip can afford 47: the bridge has since moved to a faster chip than lesson 5's, which could afford only 31.

## A window with soft edges

Fade the list out instead of chopping it: use a taper. The popular one, the one in the last two pictures, is the Hamming window. For 31 coefficients, n from −15 to 15:

\[ w[n] = 0.54 + 0.46\cos\!\left(\frac{2\pi n}{30}\right) \]

The 30 makes the cosine reach a half turn exactly at the ends, n = ±15. The 0.54 and 0.46 are Richard Hamming's tuning: 1 in the middle, 0.08 at the ends, and the smallest first side lobe. The picture below draws this bell shape over the 31 ideal stems.

[[diagram:taper]]

Let's build the new filter with a pencil, multiplying each ideal coefficient by its weight:

| n | ideal h[n] | window w[n] | new coefficient |
|---|---|---|---|
| 0 | 0.5000 | 1.000 | 0.5000 |
| ±1 | 0.3183 | 0.990 | 0.3151 |
| ±3 | −0.1061 | 0.912 | −0.0968 |
| ±5 | 0.0637 | 0.770 | 0.0490 |
| ±7 | −0.0455 | 0.588 | −0.0267 |
| ±9 | 0.0354 | 0.398 | 0.0141 |
| ±11 | −0.0289 | 0.232 | −0.0067 |
| ±13 | 0.0245 | 0.120 | 0.0029 |
| ±15 | −0.0212 | 0.080 | −0.0017 |

The taper barely touches the big middle coefficients and squashes the small outer ones, whose abrupt disappearance caused the trouble. To be fair, compare a Hamming filter with a plain cut of the same length:

| tone in | 1,000 | 3,000 | 3,400 | 3,500 | 4,000 | 4,300 | 4,500 | 4,600 | 4,700 | 5,000 |
|---|---|---|---|---|---|---|---|---|---|---|
| plain cut, 45 | 0.989 | 1.023 | 0.982 | 1.039 | 0.500 | −0.073 | −0.039 | 0.018 | 0.048 | −0.023 |
| Hamming, 45 | 0.999 | 1.001 | 0.998 | 0.981 | 0.500 | 0.125 | 0.019 | 0.002 | −0.002 | −0.001 |

The plain cut still wobbles by up to 5% in the voice band and leaks 5% above 4,600 Hz. The Hamming filter keeps the voice band within 0.24% and leaks at most 0.24% above 4,600 Hz, which is −52 dB. Past 4,700 Hz its ripple stays below −54 dB; the −52 dB at 4,600 Hz is just the end of the slope. That ripple floor shifts a little with length: at 31 coefficients it sits near −51 dB.

But look at one tone just past the cutoff, 4,300 Hz. At 31 coefficients the Hamming filter passes 22% there, where the plain cut passes almost nothing, 0.6%. The tapered window's hump is wider, so the cliff becomes a slope.

Why 45 and not fewer? A Hamming window of 31 is too short for this job: it passes only 94.7% at 3,400 Hz and leaks 5.3% at 4,600 Hz. At 41 it scrapes through with 0.93%, too close for comfort. At 45 there's room to spare.

That slope deserves a name. The **transition band** is the stretch of tones between the last tone a filter passes within 1% and the first tone it removes to below 1%. Take the Hamming filter of 31 coefficients, the one in the earlier pictures: its transition band runs from 3,191 Hz to 4,809 Hz, about 1,600 Hz wide. Make it nearly three times as long, 89, and it narrows to 3,729 through 4,271 Hz, about 540 Hz. The plain cut of 31 has no transition band by this definition, because its ripples never settle within 1%. The picture below shades the Hamming band, with thin 1% strips around 1 and around 0.

[[diagram:transition-band]]

So here's the trade every window designer makes: the window's shape sets the ripple height, and its length sets the transition band's width. The next picture puts the rectangle and Hamming weights, both 31 long, on top and their two responses in dB below. Their ripple levels are marked: −21 dB for the rectangle, −51 dB for Hamming.

[[diagram:trade]]

The sweep's first moment still leaks, fading below 1% by 4,542 Hz, but it all lands in the empty margin. The top of a wideband voice changes level too: 3,500 Hz now comes out at 98% instead of 109%, a touch quieter instead of louder, also in the margin.

## Your turn

The lab gives you a chip that can afford at most 47 coefficients. You choose a window and a length, and the engineer's sweep plays through your filter and out the downsampler. A meter shows two bars: how far any voice-band tone strays from whole, and the loudest leak from any tone above 4,600 Hz. The two bars always show the same number: with every even coefficient but the middle one at zero, this kind of filter treats both sides of the cutoff the same way, so each tone that strays in the band has a mirror tone above the cutoff that leaks by exactly as much. Your job:

1. Keep the voice-band bar within 1%.
2. Keep the ghost bar below 1%, that is, below −40 dB.
3. Use no more than 47 coefficients.

You're done when both bars show a tick and the sweep leaves no ghost anywhere in the voice band. But first the lab hands you a different line, the loading-dock intercom, which prints its own job: its limits and its chip are not yours, so think before you reach for a window. Then it's your own line's turn. The length moves in steps of two here, because a Hamming window changes at every odd length; a plain cut only changes every four, and the readout tells you when two lengths give the same filter.

[[lab-act2]]

The picture below is what done looks like: the Hamming 45 curve lying inside the pass and remove parts of the job, its slope crossing the plain gap between them.

[[diagram:done]]

## What people get wrong

The tempting belief is that a longer filter is always a better copy of the ideal one, so the overshoot must shrink too. It doesn't. Length only squeezes the ripples toward the cliff. Their height is set by the window's shape, because a longer window's response keeps the same shape, just narrower. Only a smoother shape lowers the ripple.

## Recap

- The **ideal low-pass** passes every tone below its **cutoff** whole and removes every tone above. Its coefficients never end.
- An **FIR filter** has no feedback, so its coefficient list is its impulse response, and it ends.
- **Truncation** keeps a finite piece of the ideal list. A plain cut overshoots the cliff by about 9%, about −21 dB, at any length: the **Gibbs phenomenon**.
- A **window** is the list of weights that keeps a finite piece. Tapering it lowers the ripple and widens the **transition band**. Length narrows the band; shape sets the ripple.
- A gain in **decibels** is 20 × log10 of the gain: 10% is −20 dB, 1% is −40 dB.

## Next on the line

The ghost is gone from the voice band. Meanwhile the old analog exchange in the basement is being retired, the one with the filter every customer was used to. Your boss wants the new digital line to sound exactly like it. Easy, you think: the exchange's manual lists its filter, cutoff 3,400 Hz, and a textbook recipe turns an analog filter into a digital one. You run the recipe, and the technician's test says the new filter's cutoff sits at 2,363 Hz. You copied the filter exactly. How did its cutoff move by a thousand hertz? That's the next bug.
