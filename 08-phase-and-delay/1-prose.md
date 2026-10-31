# The Fax That Smears

## A fax that won't go through

The tink is gone. Since last lesson your notch has its poles at radius 0.85, so the ring after every click drops below 1% inside four milliseconds. The rule running on the line is

```
output[n] = 0.861 × (input[n] + input[n - 2]) - 0.7225 × output[n - 2]
```

which is lesson 6's notch with the poles pulled in a little: 0.85 × 0.85 = 0.7225. The 0.861 is (1 + 0.7225) ÷ 2, the volume that keeps 0 Hz at 100%.

Then a business customer plugs in a fax machine. The fax doesn't go through. Not once.

You check the obvious thing first. This fax modem talks in a band of tones from 1,000 Hz to 1,800 Hz, safely below your notch at 2,000 Hz. Every tone in that band gets out: 1,000 Hz keeps 98.7% of its strength, 1,500 Hz keeps 93%, and even 1,800 Hz, the one closest to the notch, keeps 70%. The fax doesn't mind 70%. Nothing is too quiet.

So you read the fax's manual, and one line stands out. The fax sends its page as short bursts of tone, one after another. It needs every tone in its band to arrive within 1.5 samples of every other, about 0.19 milliseconds. Then you record what arrives at the far end. The bursts went in crisp and evenly spaced, each one starting and stopping cleanly. They come out shuffled in time. The bursts near the bottom of the band arrive almost on time, but the ones near the top arrive late, and each late burst slides into the one after it. Where neighbors overlap, the receiving machine can't tell where one burst ends and the next begins. That's the smear.

The picture below shows the bursts as sent and as received, with the fax's 1.5-sample window drawn beside them. The 1,000 Hz bursts barely move. The 1,800 Hz bursts move about three samples, twice what the window allows, and run into their neighbors.

[[diagram:smear]]

If every tone is loud enough, what could possibly be wrong? Lesson 3 gave you the answer in one line. A linear, time-invariant line does two things to each tone: it scales it and it delays it. We checked the scaling. Nobody checked the delay.

## Phase, on the wheel

You have the tool for delay from lesson 3. A tone is a dot turning counter-clockwise, 360° × tone ÷ 8,000 per sample, and the sample is its left-right position. That's 45° for every 1,000 Hz, so 1,800 Hz turns 81° per sample.

A filter sends the same tone back out, turning at the same speed, with two changes. The first is the **gain**: how much a system scales one tone, output size divided by input size. It may shrink the wheel. The second is the **phase**: how many degrees the output's dot trails the input's. It sets the output's dot back clockwise, the way older copies always sit clockwise behind the fresh one. The figure shows the two dots for 1,800 Hz, with the gap between them marked.

[[diagram:wheel-phase]]

A gap of one sample's worth of turning means one sample late. So for a steady tone,

> samples late = phase ÷ turn per sample.

A 2,000 Hz tone with a phase of 90° is one sample late. A 1,000 Hz tone with the same 90° is two samples late, because it turns only 45° per sample. Hold on to that rule. It's correct, and soon it will give a completely wrong answer about the fax.

## Worked example 1: delays you can trust

Start with the simplest filter there is: wait three samples, `output[n] = input[n - 3]`. During those three samples, each tone's dot moves on three steps. So the output trails by three steps' worth of turning:

| tone | turn per sample | phase | phase ÷ turn |
|---|---|---|---|
| 500 Hz | 22.5° | 67.5° | 3 |
| 1,000 Hz | 45° | 135° | 3 |
| 2,000 Hz | 90° | 270° | 3 |

The phase isn't the same for every tone. Double the tone, double the phase. That's what "everyone three samples late" looks like on the wheels.

Now a filter you've met. Lesson 6 started with the two-point average, `(input[n] + input[n - 1]) / 2`, and noticed that the 500 Hz tone came out "running half a sample late". Computed from the filter, its phase is 11.25° at 500 Hz, which turns 22.5° per sample. At 1,500 Hz (67.5° per sample) it's 33.75°, and at 3,000 Hz (135° per sample) it's 67.5°. Each time the phase is exactly half the turn.

Half a sample, for every tone. Plot the phase against the tone and you get a straight line through zero.

A filter with **linear phase** has a phase that grows in proportion to the tone. That's the same as saying it delays every tone by the same number of samples. It can still change gains (the average certainly does), but it never pulls tones apart in time.

Now your notch. Here there's no counting of steps to do, so we need a way to get the phase from the filter itself.

## Phase from the lines

Lesson 6 gave you the gain from a picture: draw lines from the tone's point on the unit circle to every zero and every pole, and compare their lengths. The same lines also give the phase. This time you use their directions instead of their lengths.

Measure each line's direction the usual way, counter-clockwise from pointing right, standing on the pole or zero and looking at the tone's point. Then

> phase = the pole lines' directions added up, minus the zero lines' directions added up.

Poles count with a plus sign, zeros with a minus. (For the notch and the all-pass, that's the whole rule. The pure delay and the average need extra lines from the center of the circle, which this lesson doesn't use.) The figure draws the four lines for your notch at 1,000 Hz.

[[diagram:phase-lines]]

Check it on 1,000 Hz, whose point sits at 45°. The notch has poles at 0.85 straight up and straight down, and zeros at the top and bottom of the circle.

| line from | its direction | adds to the phase |
|---|---|---|
| the pole at 0.85, straight up | −11.4° | −11.4° |
| the pole at 0.85, straight down | +65.6° | +65.6° |
| the zero at the top of the circle | −22.5° | +22.5° |
| the zero at the bottom of the circle | +67.5° | −67.5° |
| phase | | 9.2° |

The 1,000 Hz tone trails by 9.2°. Do the same for each tone in the fax band and you get the notch's whole phase table:

| tone | turn per sample | phase | phase ÷ turn |
|---|---|---|---|
| 1,000 Hz | 45° | 9.2° | 0.20 |
| 1,250 Hz | 56.25° | 13.6° | 0.24 |
| 1,500 Hz | 67.5° | 21.3° | 0.31 |
| 1,650 Hz | 74.25° | 29.7° | 0.40 |
| 1,750 Hz | 78.75° | 39.0° | 0.50 |
| 1,800 Hz | 81° | 45.5° | 0.56 |

The figure plots all three filters' phase against the tone. The delay and the average are straight lines. The notch creeps along and then bends sharply upward near 2,000 Hz.

[[diagram:linear-phase]]

So the notch isn't linear phase, and tones near 2,000 Hz trail more. But look at the size of it. In the last column, the 1,000 Hz row says 0.20 samples and the 1,800 Hz row says 0.56. A difference of about a third of a sample, 0.045 milliseconds. Could that really wreck a fax?

In the lab, send one burst at a time through the notch and watch when it arrives. Before you press the button, write down how late you expect a burst at 1,650 Hz to be.

[[lab]]

## The burst arrives later than its tone

If you tried it, you saw something the table didn't predict. A burst at 1,000 Hz comes out 0.31 samples late, a little later than the table's 0.20. A burst at 1,800 Hz comes out 3.24 samples late. Not 0.56. More than three.

So which is it? Is 1,800 Hz half a sample late, or three?

Both. The wiggle inside the burst really is only 0.56 samples behind. But a burst also has a shape: it swells up, holds, and dies away. The fax reads that shape to know where each burst starts and stops, and the shape arrives at a different time from the wiggles inside it.

A tone that goes on forever is one dot on one wheel. A tone that starts and stops is not. In a moment you'll add two neighboring tones and watch them make a swell, a sound that rises and dies away. Turn that around: a sound that rises and dies away is made of neighboring tones. Switching a tone on and off adds in its neighbors, tones a little above it and a little below, and the shorter the burst, the further they spread. The figure shows one fax burst beside the cluster of tones it's made of.

[[diagram:burst-tones]]

So every burst is made of many tones close together, and each of them goes through the notch with its own phase. To see how the shape travels, start with the smallest possible burst: just two tones.

## Worked example 2: two tones and their swell

Play 1,700 Hz and 1,800 Hz together. You've heard this if you've ever tuned a guitar: sometimes the two tones line up and add, sometimes they're opposite and cancel, so the sum swells and fades. The swells come 100 times a second, the difference between the two tones, so every 80 samples. That swell is the smallest burst there is: a shape riding on top of the wiggles.

On the wheels it's a chase. The 1,700 Hz dot turns 76.5° per sample, and the 1,800 Hz dot turns 81°. So every sample, the faster dot gains 4.5° on the slower one. When the two dots point the same way, the tones add: the top of a swell. After 80 samples the faster dot has gained a full lap, 80 × 4.5° = 360°, and they line up again. Pick one of those moments, say sample 1,600, the 21st swell counting the one at sample 0.

The animation shows the chase: two dots, the faster one catching up, and the sum wave underneath swelling each time they meet. Then it runs the same tones through the notch.

[[diagram:catch-up]]

Through the notch, each tone comes out trailing its input by its own phase:

| | 1,700 Hz | 1,800 Hz |
|---|---|---|
| turn per sample | 76.5° | 81° |
| phase through the notch | 33.9° | 45.5° |
| the wave is late by (phase ÷ turn) | 0.44 samples | 0.56 samples |

Here's the thing to notice. At sample 1,600, where the input dots line up, the output's 1,800 Hz dot is set back 11.6° more than its 1,700 Hz dot (45.5° − 33.9°). The two output dots no longer point the same way. The faster one has to catch up those 11.6° first, and it gains only 4.5° per sample:

\[ 11.6° \div 4.5° \text{ per sample} = 2.58 \text{ samples} \]

So the top of the swell arrives 2.58 samples late, while each wave inside it is only about half a sample late. Running the filter sample by sample confirms it: the swell's peak lands 2.58 samples after sample 1,600.

Do the same far from the notch, with 1,000 Hz and 1,100 Hz. Their phases are 9.2° and 10.7°, a difference of 1.5°, and the faster dot again gains 4.5° per sample. The swell is a third of a sample late (0.34). Low tones keep their shape on time. Tones near the notch don't.

## Group delay: the slope of the phase

Look at what we actually computed: a difference in phase divided by a difference in turn. For the pair 1,700 and 1,800 Hz, that's how fast the phase climbs between them. Now picture the notch's phase curve from the figure above. Draw a straight line between its points at 1,700 and 1,800 Hz. Slide the two tones closer together, and the line tilts until it just touches the curve at one tone. Its steepness there is the number we want.

The **group delay** of a filter at one tone is how many samples late a burst made of tones near it arrives. It equals how steeply the phase climbs there: the phase difference between two very close tones, divided by their turn difference.

The figure shows the notch's phase curve with that straight line, first through 1,700 and 1,800 Hz, then tilting as the two tones close in until it touches the curve. A second line near 1,000 Hz stays almost flat: little delay there.

[[diagram:group-delay]]

> **Optional: the same argument in symbols.** Write \(\omega\) for a tone's turn per sample and \(\varphi(\omega)\) for its phase. Lesson 6 measured \(\omega\) in radians, with π meaning 4,000 Hz, but degrees work just as well here. Two tones \(\omega_1\) and \(\omega_2\) line up at sample \(n\) when their dots point the same way. After the filter, each dot is set back by its phase, so they line up when
> \[ \omega_2 n - \varphi_2 = \omega_1 n - \varphi_1 \quad\text{(up to whole laps)} \]
> Call the extra samples the swell needs \(\tau\) and solve for it:
> \[ \tau = \frac{\varphi_2 - \varphi_1}{\omega_2 - \omega_1} \]
> That's 11.6° ÷ 4.5°. As the two tones move together, this ratio becomes the steepness of the phase curve at one tone. Calculus writes that steepness as a derivative:
> \[ \tau_g(\omega) = \frac{d\varphi}{d\omega} \]
> That's the group delay in Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), chapter 5. The book measures the angle the other way round, so it writes a minus sign in front. For a pure delay of \(D\) samples, \(\varphi = D\omega\), and the group delay is \(D\) for every tone. That's linear phase.

Here's the notch's group delay across the fax band:

| tone | 1,000 Hz | 1,250 Hz | 1,500 Hz | 1,650 Hz | 1,800 Hz |
|---|---|---|---|---|---|
| gain | 98.7% | 97.2% | 93.2% | 86.8% | 70.1% |
| group delay | 0.31 | 0.49 | 0.96 | 1.65 | 3.24 samples |

The bursts near 1,800 Hz arrive about 3 samples after the bursts near 1,000 Hz. Measured finely across the whole band, the earliest and latest tones are 2.92 samples apart, 0.37 milliseconds. The fax allows 1.5 samples. That's the smear. The gains were never the problem.

## Fix one: build it with linear phase

If linear phase delays every tone equally, can a notch have it? Yes, and you've built one. Lesson 6's first 2,000 Hz notch was `(input[n] + input[n - 2]) / 2`. Its coefficients are 1/2, 0, 1/2: the same read forwards and backwards. The figure draws the three coefficients as stems around the middle one, with arrows pairing each outside stem with its partner, and the two partners' dots on one wheel.

[[diagram:symmetry]]

Pair each outside sample with its partner on the other side of the middle one. For any tone, one partner is set back and the other set forward by the same angle around the middle sample. Together they act like a tone sitting exactly at the middle. The middle is one sample back, so every tone is one sample late. Group delay: exactly 1, everywhere.

The trouble is the gains. That little notch keeps 71% of 1,000 Hz, 38% of 1,500 Hz and 16% of 1,800 Hz. The fax would be on time and inaudible.

A symmetric notch can be as sharp as you like, but only by being longer. One that keeps 1,800 Hz at 90% needs about 65 coefficients. Its middle sits 32 samples back, so it holds every tone back by 32 samples. That's 4 ms, for everything. It works, at about 65 multiplications per sample against the pole notch's two. (Lesson 10 builds filters like this.)

Is there a way to keep the cheap notch and just fix its delays?

## Fix two: a filter that only delays

What we want sounds strange: a filter that leaves every tone at exactly 100% and changes only its phase.

Lesson 6's rule says how much a tone passes. Multiply its distances to the zeros, divide by its distances to the poles, and compare with the same number for 0 Hz. So we need a zero and a pole whose distances to every point on the unit circle keep the same ratio. If the ratio never changes, the comparison with 0 Hz always gives 100%.

**One pole and one zero.** Put a pole inside the circle at radius 0.65, at the angle of 1,200 Hz: 360° × 1,200 ÷ 8,000 = 54°. (Why 1,200 Hz comes later.) Put a zero on the same line from the center, outside, at radius 1 ÷ 0.65 = 1.54. Now walk a tone's point around the circle and measure its two distances. The figure does it for you, and it also draws the two triangles the next paragraph uses, shaded.

[[diagram:all-pass]]

The distance to the zero is always 1.54 times the distance to the pole. Why? Look at two triangles. One has corners at the center, the pole and the tone's point. The other has corners at the center, the tone's point and the zero. They share the angle at the center. In the first, the side to the pole is 0.65 and the side to the tone is 1. In the second, the side to the tone is 1 and the side to the zero is 1.54. Both pairs are in the ratio 0.65 to 1, so the two triangles have the same shape, one scaled up by 1.54. Their third sides, the two distances, are in that ratio too.

**Now the pair.** A real tone is two arrows, the top one and its mirror on the bottom half (lesson 6). So, like a notch, this filter uses a pole pair. One pole sits at +54° and its mirror at −54°, each with its own zero at radius 1.54 on its own line. Each pole and zero keeps its own ratio of 1.54. Multiply the two ratios and you still get the same number for every tone. Every tone passes 100%.

A filter that passes every tone at 100% and changes only its phase is called an **all-pass**. Each of its poles sits inside the unit circle with a zero on the same line from the center, at one over the pole's radius, outside.

As a program, the pair is

```
output[n] = 0.4225 × input[n] - 0.764 × input[n - 1] + input[n - 2]
          + 0.764 × output[n - 1] - 0.4225 × output[n - 2]
```

The numbers come from lesson 6's recipe for a pair of points, \(1 - 2\cos\theta\, z^{-1} + z^{-2}\), with the points pulled in to radius \(r\): \(1 - 2r\cos\theta\, z^{-1} + r^2 z^{-2}\). So 0.4225 = 0.65 × 0.65 and 0.764 = 2 × 0.65 × cos 54°. Read the input side of the program: 0.4225, −0.764, 1. Now the feedback side, as the bottom of the system function: 1, −0.764, 0.4225. (In the program those feedback numbers show with flipped signs, because they sit on the other side of the equals sign.) Same numbers, read backwards: that's the all-pass's fingerprint.

## Where an all-pass holds tones back

The gains don't change. So what does an all-pass do to the phase? Use the rule from "Phase from the lines": pole lines count plus, zero lines count minus.

Watch the line from the pole to the tone's point as the tone rises. Far from the pole, the line barely swings: the tone moves, but the line keeps pointing roughly the same way. Close to the pole, it sweeps round quickly. Stand at the roadside and watch a car drive past. When it's far off, your head hardly turns. When it passes right in front of you, your head whips round. The pole is you, and the tone's point is the car. The zero, outside the circle, sees the car pass on its other side, so its line swings the opposite way. (Far from a pole and zero pair, the two lines swing about the same and mostly cancel. That's why the mirror pair's row in the table is small.) Since zero lines count with a minus sign, an opposite swing adds to the phase as well. The figure shows the lines and how fast they swing.

[[diagram:swing]]

Here are the numbers, per 100 Hz of tone:

| line | its swing near 1,200 Hz | adds to the phase | its swing near 1,800 Hz | adds to the phase |
|---|---|---|---|---|
| the pole at +54° | +12.8° | +12.8° | +7.2° | +7.2° |
| the zero at +54° | −8.3° | +8.3° | −2.7° | +2.7° |
| the mirror pole at −54° | +3.0° | +3.0° | +2.8° | +2.8° |
| the mirror zero at −54° | +1.5° | −1.5° | +1.7° | −1.7° |
| phase climb per 100 Hz | | 22.6° | | 11.0° |
| ÷ 4.5° = group delay | | 5.0 samples | | 2.4 samples |

So an all-pass holds back the tones near its pole's angle most. Your notch does the same near its own poles. That's what we need. The notch held back the top of the fax band. Put the all-pass's bump at the bottom, and the two even out.

Why 1,200 Hz and 0.65? The angle picks where the bump sits. The radius picks its shape: a pole closer to the circle makes the bump taller and narrower. Try a few, with the angle at 1,200 Hz:

| all-pass pole radius | its delay at 1,000 Hz | its delay at 1,800 Hz | spread of the whole line |
|---|---|---|---|
| 0.5 | 3.39 | 2.47 | 2.00 samples |
| 0.65 | 4.52 | 2.43 | 0.95 samples |
| 0.8 | 6.22 | 1.81 | 5.25 samples |

At 0.5 the bump is too flat to undo the notch. At 0.8 it's so tall it creates a new smear of its own. Moving the angle away from 1,200 Hz makes things worse in either direction (a spread of 1.88 at 900 Hz, 3.89 at 1,500 Hz). Around 1,200 Hz and 0.65 sits the sweet spot.

Here is the whole line with that all-pass added:

| tone | 1,000 Hz | 1,200 Hz | 1,500 Hz | 1,600 Hz | 1,650 Hz | 1,800 Hz |
|---|---|---|---|---|---|---|
| all-pass group delay | 4.52 | 5.03 | 3.92 | 3.37 | 3.11 | 2.43 |
| notch group delay | 0.31 | 0.44 | 0.96 | 1.35 | 1.65 | 3.24 |
| both together | 4.84 | 5.48 | 4.88 | 4.72 | 4.76 | 5.67 samples |

The figure draws the three curves across the fax band, with the fax's 1.5-sample window. The combined curve fits inside it.

[[diagram:delay-fix]]

Every tone from 1,000 to 1,800 Hz now arrives between 4.72 samples late (near 1,600 Hz) and 5.67 (at 1,800 Hz). That's a spread of 0.95 samples, inside the fax's 1.5. Not a single gain changed.

There's a price, and you can see it in the bottom row. Everything now arrives about five samples late. Before, the low tones were nearly on time. We didn't remove the notch's extra delay. We gave the same amount to everyone else.

## Minimum phase: the earliest a filter can be

Every filter that evens out delays pays that price. To see why, take two tiny filters:

```
A:  output[n] = input[n] - 0.5 × input[n - 1]
B:  output[n] = -0.5 × input[n] + input[n - 1]
```

Filter A has a zero at 0.5, inside the circle. Filter B has a zero at 2, outside, on the same line. Compute their gains and you get the same number for every tone: 0.5 at 0 Hz, 1.118 at 2,000 Hz, 1.5 at 4,000 Hz. Measured tone by tone, A and B are the same filter.

They aren't. Send one click through each. A answers 1, then −0.5: the big part first. B answers −0.5, then 1: the big part late. In fact B is exactly A followed by an all-pass with a pole at 0.5 and a zero at 2. That all-pass holds a slow burst near 0 Hz back by 3 more samples, and one near 4,000 Hz by a third of a sample more. Those are group delays of bursts. The click holds every tone at once, so its big part just moves one sample later. The figure puts the two click responses side by side over their shared gain curve: same gains, but A's sound comes first.

[[diagram:minimum-phase]]

A filter whose poles and zeros all sit inside the unit circle is called **minimum phase**. Of all the filters that give every tone the same gain, it delays the least. Every other filter with those gains is the minimum-phase one followed by some all-pass.

And a stable all-pass only ever holds tones back. The one in your fax fix delays every tone by about half a sample or more. Your notch has its poles inside, but its zeros sit right on the circle, neither inside nor out. Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), the book this course follows, still counts such a filter as minimum phase. The reason: flipping a zero on the circle to one over its radius leaves it where it was, so there's no later version to compare with. So for its gains, your notch was already as early as a filter can be. To make the fax happy, we gave that up on purpose. We couldn't make the late tones earlier, so we made the early tones later.

## Your turn

Now you fix a fax yourself: a second customer's machine, with a band of its own. The lab shows the line's group delay across the fax band, with the 1.5-sample window. Beside it are a gain meter for the same band and a test page that the fax at the far end tries to print.

1. Turn on the all-pass and watch the group delay curve of the whole line.
2. Drag the all-pass pole. Its angle sets which tones it holds back most. Its radius sets how hard and how narrowly.
3. You're done when the curve fits inside the window, the gain meter hasn't moved, and the test page prints clean.

[[lab-act2]]

## What people get wrong

The natural instinct is to speed the late tones up instead: build the opposite filter. It can't work. Speeding a tone up without touching its gain means running an all-pass backwards, which swaps its poles and zeros. The zero outside the circle at 1.54 becomes a pole outside the circle, and lesson 6 showed what that does: every echo grows. The thumbnail below is that picture again.

[[diagram:inverse]]

On a live line you can't play a tone before it has arrived. You can only make everyone else wait.

## Recap

- A filter does two things to each tone: the **gain** scales it, and the **phase** sets its dot back.
- A steady wave is late by phase ÷ turn per sample. A burst is made of many neighboring tones, and its shape is late by the **group delay**: how steeply the phase climbs from one tone to the next.
- **Linear phase**: the phase grows in proportion to the tone, so every tone is delayed the same. Symmetric coefficients give it, and a sharp symmetric notch is long.
- An **all-pass** passes every tone at 100% and only changes phase: a pole inside, a zero at one over its radius outside, the same numbers read backwards. It holds back the tones near its pole most.
- A **minimum-phase** filter, with every pole and zero inside, is the earliest a filter with its gains can be. To even out delays, you hold back the early tones.

## Next on the line

The fax goes through, and the company orders ten thousand cheap 8-bit chips to run your filters in every exchange. Meanwhile, the clock chip's whine has started hopping between 1,900, 2,000 and 2,100 Hz. The team builds three narrow notches, one per whine, and multiplies them into a single rule. On the laptop it's perfect.

On the 8-bit chip, the same rule hums. The hum gets louder, and louder, until the line is nothing but noise. Same rule, same numbers. Or are they? That's the next bug.
