# The Voice Underneath

## A new complaint

A newspaper wants a tip line. People will call in with stories they shouldn't be telling, so the paper wants every caller's voice disguised before a reporter hears it. Their engineer has a simple plan: move every tone in the call up by 300 Hz. A voice shifted like that keeps its words but loses its owner. It sounds thin and slightly robotic, nobody you'd recognise.

You know how to move a tone. A tone is a wheel, and to make a wheel turn faster, you multiply by another wheel. So you multiply every sample of the call by a 300 Hz tone, and ship it.

The reporters call back within the hour. "It works, sort of. But there's a second voice under every caller. Just as loud, a little lower, mumbling the same words in step with the disguise." You listen. They're right. There's the disguised voice, up where it should be, and underneath it a ghost of the same speech, sitting lower than the original.

Where did a second voice come from? You only multiplied.

## One tone, eight samples

Let's do the multiplication by hand on a single tone, 1,000 Hz. The 300 Hz tone turns its dot 13.5° per sample (lesson 3's wheel: a tone is a dot going round a circle; more on it below), and the 1,000 Hz tone turns 45° per sample. Here are eight samples of each, and their product.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 1,000 Hz | 1.000 | 0.707 | 0.000 | −0.707 | −1.000 | −0.707 | 0.000 | 0.707 |
| 300 Hz | 1.000 | 0.972 | 0.891 | 0.760 | 0.588 | 0.383 | 0.156 | −0.078 |
| product | 1.000 | 0.688 | 0.000 | −0.538 | −0.588 | −0.271 | 0.000 | −0.055 |

[[predict-split]]

Test it. Take half of a 1,300 Hz tone and half of a 700 Hz tone, and add them:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| ½ (1,300 Hz + 700 Hz) | 1.000 | 0.688 | 0.000 | −0.538 | −0.588 | −0.271 | 0.000 | −0.055 |

Every sample matches. Multiplying by a 300 Hz tone didn't move the 1,000 Hz tone. It split it in two: half went up 300 Hz, to 1,300, and half went down 300 Hz, to 700. Do that to every tone of a voice and you get two voices. One is the voice you wanted. The other is a copy 300 Hz below the original, 600 Hz below the wanted copy. That's the ghost.

Could you just filter the ghost away afterwards? A voice on the phone runs from about 300 to 3,400 Hz. The wanted copy runs from 600 to 3,700 Hz, and the ghost from 0 to 3,100 Hz. They overlap almost everywhere. The ghost of a 2,000 Hz tone sits at 1,700 Hz, right where the wanted copy of a 1,400 Hz tone lives. And remember lesson 6: a filter treats tones by where they sit, not by where they came from. No filter can tell those two 1,700 Hz tones apart.

[[diagram:split]]

The ghost has to be stopped before it's made. To stop it, you need to see where it comes from.

## Every tone is two arrows

A quick recap of two pictures you already own. Lesson 3's wheel: a tone is a dot turning counter-clockwise, 45° per sample for every 1,000 Hz. The line from the centre to the dot is the tone's arrow, and the phone stores only its left-right position, the arrow's shadow.

Lesson 6's mirror arrow: a real tone, the cosine on the line, is two half-size arrows. One turns counter-clockwise on top; its mirror, reflected across the horizontal line, turns clockwise below. Their up-down parts cancel, and their shadows add up to the cosine.

It helps to give the mirror its own name. A **negative tone** is a dot turning clockwise: −1,000 Hz turns −45° per sample, and its shadow sounds exactly like +1,000 Hz. So every real tone on the line is a positive tone and its negative tone, travelling together.

[[diagram:negative-tone]]

Now watch the multiplication again, in arrows. Multiplying two arrows adds their turns, the way lesson 6 multiplied points on the circle. The 300 Hz tone is also two arrows, +300 and −300. So the four products are:

| 1,000 Hz arrow | × 300 Hz arrow | turns per sample | tone |
|---|---|---|---|
| +45° | +13.5° | +58.5° | +1,300 Hz |
| +45° | −13.5° | +31.5° | +700 Hz |
| −45° | +13.5° | −31.5° | −700 Hz |
| −45° | −13.5° | −58.5° | −1,300 Hz |

Four arrows, two real tones: 1,300 Hz and 700 Hz, each a positive tone with its mirror. That's the table you checked by hand.

Here's the question that matters: what if the multiplier had no mirror? Suppose you had a perfect multiplier, a single arrow turning +300 Hz. Could the chip even use one? Yes. Inside the chip you can keep two numbers per sample, an arrow's left-right and up-down parts, and multiply whole arrows. Only what goes out on the line has to be a shadow, a real signal. (How to turn the line's one number into an arrow's two is the next section's job.)

[[diagram:chip-boundary]]

So would a single-arrow multiplier fix it?

[[predict-one-arrow]]

Try it. The top arrow goes from +1,000 to +1,300 Hz. Lovely. The mirror arrow goes from −1,000 to −700 Hz. And the shadow of −700 Hz sounds at 700 Hz. The ghost is still there.

So the ghost doesn't come from the 300 Hz tone. It comes from the call itself. Every tone in the voice carries a mirror arrow. The shift adds 13.5° per sample to every arrow. A mirror arrow turns clockwise, so the extra counter-clockwise turn slows it down: −1,000 Hz becomes −700 Hz. Its shadow lands 300 Hz below the original tone. The mirror arrows are the ghost.

[[diagram:ghost-arrows]]

Try it in the lab before going on. It opens with one question; answer it and the controls are yours. The lab's wheel draws one arrow for each row of the arrow table above, four of them, each a quarter size, half times half, and the call's own two arrows stay faintly behind them. Put a tone on the wheel and drag the shift. Watch the mirror arrow slow down as the top arrow speeds up, and watch its shadow, the ghost, slide down the spectrum.

[[lab]]

## A signal with no mirror

If the mirror arrows make the ghost, get rid of them. Build a version of the call that has only the top arrows. Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989) calls this the **analytic signal**: a version of the signal made only of positive tones, with every mirror arrow removed.

What does that look like in samples? For one tone, the top arrow on its own is a full-size dot turning counter-clockwise. You already store its left-right shadow, the cosine. The other half of the arrow is its up-down position, the sine. So the analytic signal of a 1,000 Hz tone is a pair of numbers per sample: the cosine you have, and the sine you'd need to rebuild the arrow.

Two one-line reminders from lesson 6. In radians, the turn per sample is \(\omega = 2\pi \times \text{tone} / 8000\), so \(\pi\) means 4,000 Hz. And \(j\) is a quarter turn counter-clockwise, so \(j \times j = -1\). Writing \(c + j\,s\) means an arrow whose left-right part is \(c\) and whose up-down part is \(s\). With that, the pair is one arrow:

\[ x_a[n] = \cos(\omega n) + j \sin(\omega n) = e^{j\omega n} \]

and \(e^{j\omega n}\) is the dot itself after \(n\) samples.

[[diagram:analytic]]

Where do you get the sine? Look at what it is. The sine is the dot's up-down position. It's also the left-right shadow of the same dot a quarter turn behind, because turning the dot 90° clockwise moves its up-down position onto the left-right axis. Older is clockwise, so "behind" means clockwise. Lesson 3 called how far behind a tone sits its phase. So we need a filter that keeps every tone's gain at 1 and puts its phase a quarter turn behind.

That filter is the **Hilbert transformer**: an all-pass filter that turns every positive tone back a quarter turn and every negative tone forward a quarter turn. "All-pass" is lesson 8's word: every tone gets out at full strength, and only its phase changes. Write \(\hat x\) for its output.

Why does the mirror turn the opposite way? Because the filter's output has to stay a real signal, something the line can carry. A real signal's two arrows are always reflections of each other. So whatever the filter does to the top arrow, it must do the reflected move to the mirror. The top arrow turns a quarter turn clockwise. Reflected across the horizontal line, a clockwise quarter turn becomes a counter-clockwise one. So the mirror arrow turns forward.

Now the arithmetic. Turning back a quarter turn is multiplying by \(-j\), and turning forward is multiplying by \(+j\). The analytic signal is the original plus \(j\) times the filter's output:

\[ x_a[n] = x[n] + j\,\hat x[n] \]

The extra \(j\) turns the filter's output one more quarter turn counter-clockwise, which puts the sine in the up-down place. Count each of the input's half-size arrows as 1, and follow them through:

- top arrow: \(1 + j \cdot (-j) = 1 + 1 = 2\), doubled
- mirror arrow: \(1 + j \cdot (+j) = 1 - 1 = 0\), gone

The top arrow comes back full size, and the mirror cancels exactly. That's the whole trick.

In the picture, follow the mirror arrow. The filter turns it a quarter turn forward, the \(j\) turns it another quarter turn forward, and it ends up exactly opposite where it started. Added to the original, it cancels.

[[diagram:hilbert]]

## What people get wrong

Because the sine is the cosine a quarter turn behind, it's tempting to think the Hilbert transformer is just a delay. Hold the signal back a quarter cycle and you're done, right?

But a quarter cycle is a different time for every tone. Delay a tone 2 samples, and 1,000 Hz falls 2 × 45° = 90° behind, a quarter turn. The same 2 samples put 2,000 Hz half a turn behind, and 500 Hz only an eighth of a turn. A delay turns each tone in proportion to its frequency. That's lesson 8's linear phase.

[[diagram:delay-vs-quarter-turn]]

The Hilbert transformer turns every tone by the same quarter turn, whatever its frequency. No delay can do that, which is why it needs its own filter.

## The shift, done right

Call the shift's turn \(\omega_0 = 2\pi \times 300 / 8000\), the 13.5° per sample of a 300 Hz tone.

Now shift the analytic signal. Multiply it by one arrow turning +300 Hz, \(\cos\omega_0 n + j \sin\omega_0 n\). Every top arrow turns 300 Hz faster, and there are no mirrors to turn slower. The line needs a real signal, so keep the shadow, the plain part of the product:

\[ y[n] = x[n]\cos\omega_0 n - \hat x[n]\sin\omega_0 n \]

Here is the multiplication that gives it, in two steps:

\[ (x + j\hat x)(\cos\omega_0 n + j\sin\omega_0 n) = x\cos\omega_0 n + j\,x\sin\omega_0 n + j\,\hat x\cos\omega_0 n + j \cdot j\,\hat x\sin\omega_0 n \]

The last term has \(j \times j = -1\). Gather the plain parts and the \(j\) parts:

\[ = \left(x\cos\omega_0 n - \hat x\sin\omega_0 n\right) + j\left(x\sin\omega_0 n + \hat x\cos\omega_0 n\right) \]

The plain part is the shadow, the line above.

That's two multiplications and a subtraction per sample. As a circuit it's two paths. The top path is the plain call times the 300 Hz cosine. The bottom path is the Hilbert output times the 300 Hz sine, and the bottom is subtracted from the top. The top path also has a delay box, which keeps it in step with the Hilbert transformer. We'll see why it matters soon.

[[diagram:shifter]]

Let's run it on the 1,000 Hz tone. Its Hilbert output is the sine, and you already have the top path, the product row from the first table.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| x̂ = Hilbert output | 0.000 | 0.707 | 1.000 | 0.707 | 0.000 | −0.707 | −1.000 | −0.707 |
| x̂ · sin 300 | 0.000 | 0.165 | 0.454 | 0.459 | 0.000 | −0.653 | −0.988 | −0.705 |
| y = product − x̂ · sin 300 | 1.000 | 0.522 | −0.454 | −0.997 | −0.588 | 0.383 | 0.988 | 0.649 |

The last row is a 1,300 Hz tone, digit for digit: the cosine of 58.5° × n. The old product was half the wanted tone plus half the ghost. The bottom path turns out to be half the ghost minus half the wanted tone. Subtract it, and the ghost cancels while the wanted tone comes back to full strength.

A plain multiplication makes two copies of every tone, one 300 Hz up and one 300 Hz down. They're called the two sidebands. They sit either side of the call tone they came from: 1,000 + 300 = 1,300 Hz above it, and 1,000 − 300 = 700 Hz below it. A shift that keeps only one of them is called **single sideband**. Here you kept the upper one.

[[diagram:sideband]]

## Building the Hilbert transformer

To run the Hilbert transformer on the chip, we need its coefficients, the samples you'd get back from one click (lesson 2's impulse response). In radians, its frequency response, written \(H(e^{j\omega})\) for what the filter does to a tone turning ω per sample, is \(-j\) for every positive tone and \(+j\) for every negative one:

\[ H(e^{j\omega}) = -j \ \text{ for } 0 < \omega < \pi, \qquad H(e^{j\omega}) = +j \ \text{ for } -\pi < \omega < 0 \]

[[diagram:hilbert-response]]

Notice the jump at 0 Hz, from \(+j\) straight to \(-j\). Hold on to it.

The coefficients turn out to be strikingly simple. Every even one is zero, and every odd one is 2 ÷ (πn):

\[ h[n] = \frac{2}{\pi n} \ \text{ for odd } n, \qquad h[n] = 0 \ \text{ for even } n \]

| n | 1 | 3 | 5 | 7 | 9 |
|---|---|---|---|---|---|
| h[n] | 0.637 | 0.212 | 0.127 | 0.091 | 0.071 |

The negative \(n\) have the same numbers with a minus sign.

Where do those numbers come from? In lesson 10 you got the ideal low-pass's coefficients by adding up every wheel it passes, each scaled by the response. Do the same here, and pair each positive tone with its mirror. The positive tone gets \(-j\) and the mirror gets \(+j\), and together they make \(-j\,e^{j\omega n} + j\,e^{-j\omega n} = 2\sin(\omega n)\). So, roughly speaking, each coefficient is an average of sine waves, one per tone. The words on the left say it all; the integral on the right is the same average written in calculus, and you can skip it:

\[ h[n] = \text{the average of } \sin(\omega n) \text{ over all tones from 0 to 4,000 Hz} = \frac{1}{\pi}\int_0^{\pi} \sin(\omega n)\, d\omega \]

As \(\omega\) runs from 0 to \(\pi\), \(\sin(\omega n)\) makes n half-waves, alternately up and down. For even n they cancel in pairs, so h[n] = 0. For odd n, one upward half-wave is left over. A half-wave of \(\sin(\omega n)\) has area 2 ÷ n, and averaging over a stretch of length \(\pi\) divides by \(\pi\): that's the 2 ÷ (πn) above.

[[diagram:h-sketch]]

Two problems jump out. These coefficients shrink like 1 ÷ n, slowly, and never stop. And they reach backwards, to negative n, so the ideal Hilbert transformer would need to hear the future. That's lesson 10 all over again: the ideal filter is infinitely long. Lesson 10's fix works here too. Keep n from −15 to 15, taper the coefficients with a window, and delay the whole thing 15 samples so nothing reaches the future. We'll use lesson 14's Hann window, stretched over the 31 coefficients and centred on n = 0:

\[ w[n] = \tfrac12 + \tfrac12\cos(\pi n / 16), \qquad n = -15, \dots, 15 \]

[[diagram:taps]]

That's 31 coefficients and a delay of 15 samples, under 2 milliseconds.

## The delay catch

The Hilbert path is now 15 samples late. So the plain path, \(x[n]\), must be delayed 15 samples too, before the two meet at the subtraction. That's the box marked "delay" on the top path of the circuit. Skip it, and what happens?

For a 1,000 Hz tone, 15 samples late is an extra 15 × 45° = 675° of turn on the Hilbert path. The mirror arrows no longer land exactly opposite each other, so they no longer cancel, and the ghost comes back at 41% of the wanted copy.

[[diagram:delay-catch]]

And it changes with the tone, because the extra turn does. At 500 Hz the ghost is 20%. At 2,000 Hz it's exactly as loud as the wanted copy. At 3,000 Hz it's the louder of the two. One missing box ruins the whole shifter.

Here is the arrow arithmetic behind those numbers. Call the extra turn θ, 675° at 1,000 Hz. The Hilbert output's top arrow sits θ further clockwise, and its mirror θ the other way. Two reminders first. Lesson 6 wrote a cosine as two mirror arrows. Lesson 14's chord is the straight-line distance between two points on the circle: two points an angle x apart are \(2\left|\sin(x/2)\right|\) apart. Now build the analytic signal again. The top arrow is

\[ 1 + e^{-j\theta} = e^{-j\theta/2}\left(e^{j\theta/2} + e^{-j\theta/2}\right) = 2\cos(\theta/2)\, e^{-j\theta/2} \]

which has length \(2\left|\cos(\theta/2)\right|\), by the cosine as two mirror arrows. The mirror arrow is \(1 - e^{j\theta}\), a chord, so its length is \(2\left|\sin(\theta/2)\right|\). Divide one length by the other, and the ghost is \(\left|\tan(\theta/2)\right|\) of the wanted copy, 41% for θ = 675°.

## The edges of the band

The tip line's target: the ghost must stay below 5% of the wanted copy for every tone from 300 to 3,400 Hz. How good is the 31-coefficient version? The same arrow arithmetic tells you. Say the Hilbert transformer gets a tone out at gain G instead of 1. The top arrow becomes \(1 + j \cdot (-jG) = 1 + G\), and the mirror \(1 + j \cdot (jG) = 1 - G\). So the ghost is left at \(|1 - G| / (1 + G)\) of the wanted copy. (The bars matter: G can overshoot 1.)

Here are the gains with the Hann window, and the ghost each one leaves.

| tone | 100 Hz | 300 Hz | 1,000 Hz | 3,400 Hz |
|---|---|---|---|---|
| Hilbert gain | 0.3866 | 0.9004 | 1.0016 | 1.0050 |
| ghost left | 44.2% | 5.24% | 0.08% | 0.25% |

[[diagram:edges]]

In the middle of the voice it's nearly perfect. Near 0 Hz it falls apart. Why? Remember the jump in the frequency response. Near 0 Hz, a top arrow and its mirror are almost the same arrow, barely turning, yet the filter must turn one back and the other forward. That's a jump at 0 Hz. Lesson 10 showed that only an infinitely long filter can make a sharp jump. A short one smooths it into a transition band, lesson 10's name for the stretch of tones where the gain ramps instead of jumping. The same thing happens near 4,000 Hz, but it doesn't matter here. The voice stops at 3,400 Hz, and the Hilbert transformer runs before the shift, so it never sees anything higher.

A phone voice starts at 300 Hz, so the transition band at the bottom only has to end there. With 31 coefficients it almost does. The ghost at 300 Hz is 5.24%, just missing the 5% target. A slightly longer filter pushes the transition band lower, and the lab will show you how much longer is enough.

Try it without the window, just the cut. At 1,000 Hz the gain is 0.9443 instead of 1.0016, and the ghost there jumps to 2.9%. At 300 Hz the gain overshoots to 1.1458, and the ghost is 6.79%, the plain cut's worst in the voice band. That fails the 5% target outright. The ripple is lesson 10's Gibbs phenomenon, the overshoot a plain cut always leaves next to a jump, now leaking ghost into the voice.

## Your turn

Now you build the shifter for the tip line. In the lab, a caller's voice is waiting. You wire the two-path circuit from "The shift, done right": the Hilbert transformer's length and window, the delay on the plain path, and the 300 Hz shift. A ghost meter shows how loud the ghost is, as a share of the wanted copy, at its worst tone between 300 and 3,400 Hz.

1. Wire the two paths and the shift so the disguised voice comes out without a ghost.
2. Keep the ghost below 5% of the voice across the whole band.

Start from the 31 coefficients above and see why they aren't quite enough. You're done when the meter stays under 5% and the ghost is gone to your ear.

[[lab-act2]]

## Recap

- A real tone is two arrows: a positive tone turning counter-clockwise, and its mirror, a **negative tone**, turning clockwise.
- Multiplying a call by a 300 Hz tone turns the positive tones faster and the negative tones slower. Their shadows split into a wanted copy 300 Hz above each tone and a ghost 300 Hz below it.
- The **analytic signal** keeps only the positive tones: \(x + j\hat x\).
- The **Hilbert transformer** makes \(\hat x\). It's an all-pass that turns positive tones back a quarter turn and negative tones forward a quarter turn, so the output stays real.
- Shifting the analytic signal and keeping the shadow, \(x\cos\omega_0 n - \hat x \sin\omega_0 n\), is **single sideband**: one copy, no ghost.
- A real Hilbert transformer is truncated and windowed, so it works in the voice band and fails near 0 Hz. Delay the plain path to match it, or the ghost comes back.

## Next on the line

The tip line is a hit. Then your line signs a deal with a partner network on the other side of the sea, and on calls through it every word has an echo. You know echoes. In lesson 2 you sent a click down the line and subtracted the echo you measured. But this echo happens inside the partner's network, and you can't send it a click. Every route through the partner has its own delay, and nobody tells you which one a call took. How do you find the delay of an echo you can't measure? That's the next bug.
