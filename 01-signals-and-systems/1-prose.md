# The Buzz on Loud Calls

## Opening day

Welcome to the phone company. Your company is building a digital phone line. Your part turns a voice into numbers, moves the numbers across the country, and turns them back into a voice at the other end. By the end of this course you'll have fixed sixteen real bugs on this line, and each one will teach you a piece of signal processing.

Here's the first bug. The line went live last week, and the support tickets split neatly into two piles. Quiet callers are fine: "Clear as a bell." Loud callers are not: "There's a harsh, raspy buzz on top of my voice." "My boss sounds like he's yelling through a kazoo." You play a recording of a loud caller and wince. Under the voice there's a gritty edge, like a cheap speaker turned up too far.

Strange, isn't it? The line runs exactly the same code for everybody. Why would loudness, of all things, change what a voice sounds like? Louder should just be louder.

To find out, we need to look at what the line carries, and then at what it does to it.

## A call is a list of numbers

A microphone turns your voice into a voltage that wobbles up and down as the air pressure does. The line measures that voltage 8,000 times every second and writes each measurement down as a number. Each of those numbers is called a **sample**: one measurement of the sound at one moment. How the measuring works, and what it can and can't capture, is a whole lesson of its own (lesson 4). For today, all you need is the result: a call is a list of numbers, 8,000 of them per second.

In the next figure, watch the smooth voltage get measured at evenly spaced moments. When the curve fades, only the dots are left. Keep that picture: the samples are dots on a smooth wave, and the wave carries on between them.

[[diagram:samples]]

A list of numbers like that, one per moment, is called a **signal**. We'll name the number at position n as x[n], so x[0] is the first sample, x[1] the next, and so on. One second of call is x[0] up to x[7999].

The simplest sound there is, the one a tuning fork makes, is a **tone**: a steady wave that repeats at a fixed rate. The rate is counted in hertz (Hz), repeats per second, and it's what your ear hears as **pitch**: the faster the repeat, the higher the sound. A 1,000 Hz tone repeats 1,000 times a second. The line takes 8,000 samples a second, so the pattern comes round every 8 samples. (At this rate the line can carry tones up to 4,000 Hz. Lesson 4 explains why.)

Where do a tone's numbers come from? From the cosine function. Start at an angle of 0° and step the angle forward by 360° × the tone's pitch in Hz ÷ 8,000 every sample. For 1,000 Hz that's 45° per sample, so the samples are cos 0°, cos 45°, cos 90°, and onward. The figure below drops each one from the cosine curve onto its own stem as the angle steps.

[[diagram:tone-steps]]

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| angle | 0° | 45° | 90° | 135° | 180° | 225° | 270° | 315° | 360° |
| 1,000 Hz tone | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 | 0.00 | 0.71 | 1.00 |

At n = 8 the angle has gone all the way round to 360° and the pattern starts over. A quiet tone is the same list multiplied by a small number, its size. A tone of size 0.2 is 0.20, 0.14, 0.00, −0.14, and so on.

A real voice is far messier than this. But a voice turns out to be many tones of different pitches added together, so tones are the right thing to test with. (Lesson 3 builds on this and lesson 12 shows it. Take it on trust for now.)

## What happens to the numbers

Between the microphone and the far earpiece, a chain of programs works on these numbers. Each program takes in one signal and gives back another. Any rule like that, a signal in and a signal out, is called a **system**.

[[diagram:system]]

"Multiply every sample by 4" is a system. "Average each sample with the one before" is a system. "Wait 2,000 samples, then send" is a system. The whole phone line, end to end, is a system too, built out of smaller ones.

The textbook behind this course, Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), covers all this in its chapter 2. It writes a system as T and its output as y[n] = T{x[n]}. T is the rule, x is what goes in, and y is what comes out.

## The booster

The microphone in a cheap handset delivers small numbers. Most callers are quiet. The loudest your test calls ever recorded is 0.5, and that includes speakerphones, where two people talk into one microphone at once. So early in the chain sits a system we'll call the booster. Its rule is one line of code:

```
output[n] = 4 * input[n]
```

There's a catch, though, and it's not in that line. The chip that carries the numbers onward stores each sample as a 16-bit whole number. The biggest number it can hold stands for +1 and the smallest for −1, so there is simply no code for anything beyond them. Hand it a number past +1 and it writes down +1, the nearest value it has. Anything outside the range gets flattened to the edge. That flattening is called **clipping**, and the chip does it silently, on every sample, for every caller. So the booster's real rule is "multiply by 4, then clip to the range."

Before reading on, make a prediction. A quiet caller speaks a 1,000 Hz tone at size 0.2. A loud caller speaks the same tone at size 0.5. Which one comes out as a clean 1,000 Hz tone?

[[predict-clean]]

Let's run both, sample by sample.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| quiet caller in | 0.20 | 0.14 | 0.00 | −0.14 | −0.20 | −0.14 | 0.00 | 0.14 |
| × 4 | 0.80 | 0.57 | 0.00 | −0.57 | −0.80 | −0.57 | 0.00 | 0.57 |
| after clipping | 0.80 | 0.57 | 0.00 | −0.57 | −0.80 | −0.57 | 0.00 | 0.57 |

Nothing ever leaves the range, so clipping never acts. Out comes the same tone, four times bigger. Now the loud caller:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| loud caller in | 0.50 | 0.35 | 0.00 | −0.35 | −0.50 | −0.35 | 0.00 | 0.35 |
| × 4 | 2.00 | 1.41 | 0.00 | −1.41 | −2.00 | −1.41 | 0.00 | 1.41 |
| after clipping | 1.00 | 1.00 | 0.00 | −1.00 | −1.00 | −1.00 | 0.00 | 1.00 |

The next figure plays both callers growing by 4 inside the shaded band from −1 to +1. Watch the loud one's stems cross the band's edge and get pushed back onto it.

[[diagram:clip]]

Look at the last row. It still repeats every 8 samples, so it still "feels" like 1,000 Hz. But its rounded top has been sliced off flat: 1, 1, 0, −1, −1, −1, 0, 1. It's flat on top and flat on the bottom, closer to what's called a square wave than to a tone.

Is a squared-off tone just a slightly uglier 1,000 Hz tone, or is it something else? Here's a test you can do with a pencil. Every tone links each sample to its two neighbors: add the sample before and the sample after, and you always get the middle sample times a fixed number. For a 1,000 Hz tone that number is 1.414, which is 2 × cos 45°. That's not a coincidence of this table. It holds for every tone, each with its own number, and we'll prove it later. Let's call it the **neighbor rule** of the tone. The figure stacks the two neighbors against the scaled middle, first on the clean tone, then on the clipped one.

[[diagram:neighbor-rule]]

| n | which list | neighbors | their sum | 1.414 × middle | match? |
|---|---|---|---|---|---|
| 1 | clean tone | 1.00 and 0.00 | 1.00 | 1.414 × 0.71 = 1.00 | yes |
| 4 | clean tone | −0.71 and −0.71 | −1.41 | 1.414 × −1.00 = −1.41 | yes |
| 1 | clipped | 1 and 0 | 1 | 1.414 × 1 = 1.414 | no |
| 4 | clipped | −1 and −1 | −2 | 1.414 × −1 = −1.414 | no |

The clean tone passes at every n. The clipped output fails. Whatever it is, it is not a pure 1,000 Hz tone.

So what is it? Here's the surprise: it's two tones. The clipped list is exactly a 1,000 Hz tone of size 1.207 minus a 3,000 Hz tone of size 0.207. The 3,000 Hz tone steps 135° per sample. Check the first two samples:

| n | 1,000 Hz part | 3,000 Hz part | 1,000 Hz part − 3,000 Hz part |
|---|---|---|---|
| 0 | 1.207 × cos 0° = 1.207 | 0.207 × cos 0° = 0.207 | 1.00 |
| 1 | 1.207 × cos 45° = 0.854 | 0.207 × cos 135° = −0.146 | 1.00 |

The figure does all eight samples at once. It draws the big 1,000 Hz wave and the small 3,000 Hz wave, subtracts one from the other, and the result lands exactly on the flat clipped stems.

[[diagram:two-tones]]

That 3,000 Hz tone is the buzz. Nobody said it into the phone. The booster made it, out of nothing, at about a sixth of the voice's size. The quiet caller never triggers clipping, so they never get one.

In the lab you'll play both callers through the booster. The plot shows the loud one's samples flattening at the edge, and the speaker plays the voice with the buzz on top.

[[lab]]

## What the booster breaks

What does the booster lose when it clips? Two properties, and it's worth naming both.

The first: a system is **linear** when doubling the input doubles the output, and two inputs added give their outputs added. The book writes that as one line, the principle of superposition. Take any two signals, \(x_1\) and \(x_2\), and any two numbers, a and b:

\[ T\{a\,x_1[n] + b\,x_2[n]\} = a\,T\{x_1[n]\} + b\,T\{x_2[n]\} \]

The figure runs both sides of this equation as two paths: scale and add first, then the system, against the system first, then scale and add.

[[diagram:superposition]]

So is the booster linear? No. Linearity has to hold for every input, and the booster breaks it as soon as an output would cross the edge. A sample of 0.2 becomes 0.8. Double it to 0.4 and linearity says it should become 1.6, but the chip writes 1.0. The real booster is not linear. It only behaves like the linear ×4 while its outputs stay inside the range.

The second: a system is **time-invariant** when delaying the input only delays the output: the rule works the same at every moment. If x[n] gives y[n], then x shifted by \(n_0\) samples gives y shifted by \(n_0\) samples:

\[ x[n - n_0] \;\to\; y[n - n_0] \]

Here \(n_0\) can be any whole number. Positive means later, and negative means earlier. The booster does the same thing on sample 5 as on sample 5,000, so it is time-invariant. In the figure, a blip shifted three samples later comes out of the booster three samples later, and otherwise unchanged.

[[diagram:time-invariance]]

Systems with both properties get a short nickname, LTI, for linear time-invariant. You're about to see what makes them special.

## Testing systems by hand

Let's put four systems through the tests, with real numbers.

**The booster, on a speakerphone.** Two quiet people share one speakerphone, each at size 0.2, one at 1,000 Hz and one at 500 Hz. Run each voice through the booster alone and nothing clips: at n = 0 each comes out as 0.8. Linearity predicts the booster on their sum should give 0.8 + 0.8 = 1.6 there. But the sum going in is 0.4, times 4 is 1.6, and the chip writes 1.0.

| n | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| booster on each voice, then added | 1.60 | 1.31 | 0.57 | −0.26 |
| booster on the two voices added | 1.00 | 1.00 | 0.57 | −0.26 |

Watch the figure: each boosted voice sits safely inside the band, then the two slide together, and their sum pokes out and is cut flat.

[[diagram:speakerphone]]

Two voices, each fine on its own, buzz together. And here's the trap it sets. It's tempting to test a system one input at a time: one quiet caller, fine; another, fine; a hundred, fine every time. So it's linear, isn't it? No. Linearity is a promise about sums, and you never tested a sum. A system can pass every single input you try and still fail the first time two of them arrive together.

**The smoother.** Average each sample with the one before:

```
output[n] = (input[n] + input[n - 1]) / 2
```

Is it linear? Double every input and both terms in the average double, so the output doubles. Add two inputs and the average of the sums is the sum of the averages. Yes. Is it time-invariant? It uses the same recipe at every n. Yes again. So it's LTI. Here's what it does to our 1,000 Hz tone. The cell at n = 0 is blank, because that average would need input[−1], a sample from before the call started.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| tone in | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 | 0.00 | 0.71 | 1.00 |
| average with the one before | | 0.85 | 0.35 | −0.35 | −0.85 | −0.85 | −0.35 | 0.35 | 0.85 |

That doesn't look like the tone that went in: the peak is 0.85 instead of 1.00, and the numbers have slid along. Did the smoother make a new tone? Use the neighbor rule. At n = 2 the neighbors 0.85 and −0.35 sum to 0.50, and 1.414 × 0.35 is 0.50. At n = 4 the neighbors −0.35 and −0.85 sum to −1.21, and 1.414 × −0.85 is −1.21. It holds at every n from 2 on. The output is a pure 1,000 Hz tone.

How big, and where? Remember that samples are dots on a smooth wave. The next figure draws the smooth wave through the output's dots, next to the input's wave.

[[diagram:smoother]]

The output wave has the same shape as the input wave, just smaller. Its top reaches 0.92, at a point halfway between two dots, which is why no single sample shows it. And each of its peaks comes half a sample after the input wave's peak. So the output is the same tone, a bit smaller and half a sample late.

**The fader.** This one turns the volume up over the first 8 samples of a call:

```
output[n] = min(n / 8.0, 1.0) * input[n]
```

It's linear: double the input and you double the output, at every n. But it isn't time-invariant: sample 1 is multiplied by 1/8 and sample 8 by 1. Feed it the 1,000 Hz tone and you get 0, 0.09, 0, −0.27, −0.50, −0.44, 0, 0.62, 1.00. At n = 1 the neighbors sum to 0, but 1.414 × 0.09 is 0.13. Not a pure tone. The figure shows the ramp multiplying the tone, and the same blip coming out bigger when it arrives later.

[[diagram:fader]]

**Adding a constant.** "Add 0.1 to every sample" sounds harmless. A good first test for any system: does silence come out as silence? Scale any input by 0 and a linear system's output scales by 0 too. This one turns silence into 0.1, 0.1, 0.1, so it isn't linear. On the tone, it lifts the whole wave 0.1 off the zero line, as the figure shows. That lift is a constant, and a constant is a 0 Hz tone that nobody said.

[[diagram:constant]]

So the one system that was both linear and time-invariant left the tone a tone, and the other three broke it. Is that luck, or a law?

## Why an LTI system can't invent a tone

It's a law, and you already hold every piece of the proof. For the proof, picture a tone that has been playing forever, so there's no first sample to worry about. (A real call starts somewhere, and the very first output samples can differ, like the smoother's blank at n = 0. After that, the result holds.) The figure below shows the whole chain; follow it as you read.

[[diagram:proof]]

**Step one: a tone obeys its neighbor rule.** A tone is \(x[n] = \cos(\omega_0 n)\), where \(\omega_0\) is the angle step per sample. A standard trigonometry identity, \(\cos(A + B) + \cos(A - B) = 2\cos A \cos B\), gives

\[ x[n+1] + x[n-1] = c\,x[n], \qquad c = 2\cos\omega_0 \]

For 1,000 Hz, \(\omega_0 = 45°\) and \(c = 1.414\). For 2,000 Hz, \(c = 0\). Each pitch has its own c.

**Step two: make silence out of the tone.** Move everything to one side: \(w[n] = x[n+1] + x[n-1] - c\,x[n]\), which is 0 for every n. Three copies of the tone, two shifted and one scaled, add up to perfect silence.

**Step three: time-invariance.** Call the output for the tone y[n]. With \(n_0 = -1\), the shift \(x[n - n_0]\) is \(x[n + 1]\), the tone one sample earlier. With \(n_0 = 1\) it's \(x[n - 1]\). Each comes out as y shifted the same way:

\[ T\{x[n+1]\} = y[n+1], \qquad T\{x[n-1]\} = y[n-1] \]

**Step four: linearity.** w is a sum of scaled signals, so its output is the same sum of their outputs: \(y[n+1] + y[n-1] - c\,y[n]\).

**Step five: silence in, silence out.** w is all zeros, and a linear system turns all zeros into all zeros:

\[ y[n+1] + y[n-1] = c\,y[n] \]

The output obeys the tone's neighbor rule, with the same c.

**Step six: only that pitch obeys that rule.** Rearranged, the rule says y[n+1] = c·y[n] − y[n−1]. Each sample is built from the two before it, so two starting numbers fix the whole list. Try it on the smoother's output, starting from 0.854 and 0.354, and watch the figure build the row like falling dominoes:

| step | c × latest − one before | result | in the smoother's table |
|---|---|---|---|
| 1 | 1.414 × 0.354 − 0.854 | −0.354 | −0.35 |
| 2 | 1.414 × −0.354 − 0.354 | −0.854 | −0.85 |
| 3 | 1.414 × −0.854 − (−0.354) | −0.854 | −0.85 |

[[diagram:chain]]

Now, a tone of that pitch has two knobs: its size A, and where in its cycle it starts, an angle φ. Written out, it's \(A\cos(\omega_0 n + \varphi)\). Every setting of the two knobs obeys the same neighbor rule, because the identity in step one works for any starting angle. And two knobs can always be set to hit any two starting numbers. Why that's always possible is easiest to see with a picture lesson 3 builds, so take it on trust for now. Here's one case working. For the smoother, size 0.924 and start −22.5° give 0.854 at n = 1 and 0.354 at n = 2. The figure turns the two knobs until the wave passes through both dots.

[[diagram:size-and-start]]

Put the two together. Some tone of the same pitch matches y's first two numbers, and the rule then builds every later number of both lists identically. So y is that tone, \(y[n] = A\cos(\omega_0 n + \varphi)\). A tone goes into an LTI system and the same pitch comes out, maybe bigger or smaller, maybe shifted in time. A voice is a sum of tones, and linearity runs each one through on its own. So an LTI system never adds a tone that wasn't in its input.

(Two tones escape this argument: 0 Hz and 4,000 Hz. At those two, sliding the start doesn't give a new shape, it only changes the size, so the two knobs act like one. They need a separate argument, which we'll skip.)

The proof needs both properties, and each experiment showed one failing. The booster is time-invariant, so step three works, but it isn't linear, so step four fails. The fader is linear, so step four works, but step three fails. Drop either one and new tones get in.

## Where the buzz lives

Now you can see the bug for what it is. The real booster is not linear. While its outputs stay inside the range it behaves like the linear ×4, and that can't invent tones. The moment an output would cross the edge, it stops behaving that way, and new tones get in.

For a single tone, they land in a tidy place. A clipped 1,000 Hz tone still repeats exactly every 8 samples, just like the original. A tone can only fit a pattern that repeats every 8 samples if it makes a whole number of turns in those 8 samples, so the new tones sit at whole multiples of the pitch: three times, five times, and so on. (That every repeating list is built from such tones, take on trust for now; lesson 12 shows it.) (The even multiples come out at exactly zero. That's because the clipped wave's bottom half is an upside-down copy of its top half.) But the line can't store anything above 4,000 Hz. Multiples beyond that fold back below it, which is lesson 4's story. That's why the clipped 1,000 Hz tone showed only one new tone, at 3,000 Hz. A 500 Hz vowel at size 0.5, boosted by 4 and clipped, has room for more:

| tone | size in the clipped output | compared with the voice |
|---|---|---|
| 500 Hz (the voice) | 1.212 | 100% |
| 1,500 Hz | 0.266 | 22% |
| 2,500 Hz | 0.059 | 5% |
| 3,500 Hz | 0.005 | under 1% |

A real voice is worse, because it's several tones at once. The speakerphone already showed that clipping a sum is not the sum of the clipped parts. Clip two tones together, 1,000 Hz and 1,500 Hz at size 0.25 each (a peak of 0.5), and new tones appear that belong to neither:

| new tone | size | where it comes from |
|---|---|---|
| 500 Hz | 0.085 | 2 × 1,000 − 1,500 |
| 2,000 Hz | 0.125 | 2 × 1,500 − 1,000 |
| 3,500 Hz | 0.165 | 2 × 1,000 + 1,500 |
| 4,000 Hz | 0.130 | 2 × 1,500 + 1,000 |

In the figure, compare the clean voice's single bar with the clipped bars. Look at the two-tone chart: the hatched bars sit between and above the voice's own tones. That scatter is what your ear hears as rough.

[[diagram:buzz-bars]]

And once the buzz is in the samples, it's tangled in among the voice's own tones. A 1,500 Hz tone from clipping is exactly the same as a 1,500 Hz tone the caller really said. The figure draws the two side by side, and there's nothing to tell them apart. You can't reliably pull the buzz back out. You have to stop it from being made.

[[diagram:tangled]]

## Your turn

The fix follows from everything above: keep every output inside the range, so the booster always behaves like the linear ×4. The speakerphone told you what to measure: not the loudest single voice, but the loudest input the booster ever sees, sums included. On your line that's the 0.5 your test calls recorded.

Multiply 0.5 by 4 and you're at 2.0, past the edge. Multiply by 2 and you land exactly on 1.0. That's the very edge, with no margin at all: the first caller at 0.51 would clip again. Real lines leave headroom, room for someone louder than anyone you've measured. Keep the loudest peak at 0.8, a fifth below the edge: the booster multiplies by 0.8 ÷ 0.5 = 1.6. A caller can then reach 0.625 before anything clips, a quarter louder than the loudest you've seen.

[[diagram:fix]]

In the lab, a second exchange comes first. Then you're back on your own line, with the loud caller, the quiet caller and the speakerphone pair. Your job:

1. Play each one through the booster and listen for the buzz. Watch for samples flattening at the edge.
2. Turn the booster down until the loudest input lands at 0.8. Watch the buzz meter, which shows the size of every tone in the output that wasn't in the input.

You're done when the buzz meter reads 0% for all three and the quiet caller is still clearly audible.

[[lab-act2]]

You'll notice the trade. At ×1.6 the quiet caller comes out at 0.32 instead of 0.8, and the speakerphone pair at 0.64. Quieter, but clean. A buzz, once made, can't be taken back out.

## Recap

- A **sample** is one measurement of the sound at one moment, 8,000 per second on this line.
- A **signal** is a list of numbers, one per moment. A call is a signal.
- A **system** is a rule that takes in one signal and gives back another.
- **Linear**: doubling the input doubles the output, and two inputs added give their outputs added. It has to hold for every input, sums included.
- **Time-invariant**: delaying the input only delays the output; the rule works the same at every moment.
- A tone that goes into a linear, time-invariant system comes out as the same pitch, only bigger or smaller and shifted. No new tones, ever.
- The real booster is not linear; it only behaves like the linear ×4 while inputs stay in range. Size it for the loudest input, sums included, and leave headroom.

## Next on the line

The buzz is gone. Loud callers sound like loud people again. A day later, a new ticket comes in, and it's eerie: "I can hear myself. Every word I say comes back to me, faint, about a quarter of a second later." You ring a test line, say "hello", and there it is: "...hello". Your own voice, returned to you like an echo off a canyon wall. Somewhere out on the line, part of your voice is bouncing back. You can't see where. But you now know the line is linear and time-invariant, and that turns out to be enough to catch the echo with a single click.
