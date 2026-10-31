# The Bell After the Click

## A tiny bell

The notch from the last lesson is live on every call. The whine that the leaking clock chip puts on the line at 2,000 Hz is gone, and the voice is crisp. Here is the rule running on your line:

\[ y[n] = 0.905\left(x[n] + x[n-2]\right) - 0.81\, y[n-2] \]

A zero pair sits on the whine at the top of the unit circle, with a pole pair just inside at radius 0.9. The whine tickets have stopped.

New ones have started. "Every time a call connects, I hear a little *tink*, like someone tapped a tiny bell." "It's very faint, but it's there on every single call, right at the start."

You record a call as it connects. Calls on your line start with a click: the relay closes, and for one sample the line jumps and drops back. You put the moment right after the click on the frequency meter, the display from lesson 5 that shows how strong each tone is. A click should light up every tone a little, a flat line across the display. Instead the meter shows one thin spike. It is faint, it lasts a few milliseconds, and it sits at exactly 2,000 Hz.

[[diagram:meter]]

Read that again. The filter whose entire job is to remove 2,000 Hz is *making* a 2,000 Hz sound.

That looks like a bug in the code. It isn't. By the end of this lesson you'll see that you can't have the notch without it. You can only choose how long it lasts.

## One click, sample by sample

Do what lesson 2 taught: send one click, the impulse (one sample of 1, then zeros), and record what comes back, the notch's impulse response.

[[predict-ring]]

Each output is 0.905 times this input plus the input two samples back, minus 0.81 times the output two samples back. The odd samples never get anything, so they all stay at zero, and the table shows only the even ones.

| n | 0.905 (x[n] + x[n−2]) | − 0.81 y[n−2] | y[n] |
|---|---|---|---|
| 0 | 0.905 | 0 | 0.905 |
| 2 | 0.905 | −0.733 | 0.172 |
| 4 | 0 | −0.139 | −0.139 |
| 6 | 0 | +0.113 | 0.113 |
| 8 | 0 | −0.091 | −0.091 |
| 10 | 0 | +0.074 | 0.074 |
| 12 | 0 | −0.060 | −0.060 |

The click is over at n = 0, and the input part of the rule has nothing left after n = 2. Yet the output keeps going, never quite stopping. That's feedback: every output feeds a later one.

Sample 0 is the exception. It is two things added together: the click passing straight through, at a height of 1.1173, and the very start of the ring, at −0.2123. Together they make 1.1173 − 0.2123 = 0.905. Where those two numbers come from is the derivation's job; for now, take the split as given. From n = 2 on, the output is the ring alone.

[[diagram:split-zero]]

Now look at the ring's pattern. Counting every sample, odd ones included: up, nothing, down, nothing, up, nothing, down. That's 1, 0, −1, 0, the left-right positions of a dot turning 90° per sample. A tone is a dot turning 360° × tone ÷ 8,000 per sample, so 90° per sample is 2,000 Hz. There's your tink.

And the sizes? From n = 2 on, each one is −0.81 times the one two samples earlier: 0.172 × 0.81 = 0.139, and 0.139 × 0.81 = 0.113. Over two samples the ring keeps 0.81, and 0.81 is 0.9 × 0.9. So over each single sample it keeps 0.9, the poles' radius. The zero samples in between don't break that. A 2,000 Hz tone passes through the middle every other sample, so those samples read zero at any size. Lesson 6 said a pole's radius is how much an echo keeps per sample. Here is that echo, measured.

[[diagram:click-ring]]

## The spiral

To see why a pole makes exactly this sound, you need one new picture, built from two you already have.

Start with the wheel. A 2,000 Hz tone is a dot turning 90° per sample, and its samples are its left-right position. Now add the pole's radius: after every turn, the dot also moves inward, so its distance from the center is 0.9 of what it was. Turn 90°, shrink to 0.9. Turn 90°, shrink to 0.9 again. The dot no longer goes round the rim. It spirals in toward the center.

[[diagram:spiral]]

Read the spiral the way you read the wheel. Drop a line from the dot straight down (or up) to the horizontal axis; where it lands is the dot's left-right position, its **shadow** on that axis. For a dot at angle θ and distance R from the center, the shadow is R cos θ: that's what the cosine is. The spiral's shadow, sample by sample, has the shape of the ring you just computed: up, nothing, down, nothing, each swing smaller. The ring is that shadow flipped and scaled, −0.2123 times it; the derivation shows why. On the "nothing" samples the dot is straight above or below the center, which is why they read zero. The angle of each step sets the pitch of the ring. The shrink per step sets how fast it dies. And those two numbers are exactly where the pole sits: its angle on the unit circle, 90°, which is 2,000 Hz, and its radius, 0.9.

So the spiral is what a pole looks like in time. A point on the unit circle becomes a dot that turns by the pole's angle and shrinks by the pole's radius each sample. A pole on the circle, at radius 1, would be a dot going round the rim forever: a tone that never dies. A pole outside it would spiral outward, louder and louder, which is lesson 6's unstable filter.

## How long a ring lasts

The tink is faint and short. How short, exactly? To compare one ring with another, we need a fixed finish line, measured from the ring's start. Its starting height doesn't matter, because the ring shrinks by the same share every sample. The **decay time** is how long the ring takes to shrink to 1% of where it started.

[[diagram:decay-time]]

At radius 0.9, the ring keeps 0.9 per sample, so after n samples it has 0.9 to the power n left. We want the n where that reaches 0.01. Try a few: 0.9¹⁰ is 0.35, and 0.9²⁰ is 0.12. A logarithm solves it exactly: n = ln(0.01) ÷ ln(0.9) = 43.7 samples. At 8,000 samples per second, that's 5.5 ms, long enough for 11 swings of a 2,000 Hz tone. That's why you hear a pitch and not just a click.

Before you look at more radii, a prediction. Lesson 6 ended with poles at 0.98 looking like an upgrade: the voice at 1,900 Hz kept 97% instead of 60%. What will 0.98 do to the tink? Twice as long? Five times? Commit to a number.

| pole radius | decay time, samples | decay time, ms |
|---|---|---|
| 0.80 | 20.6 | 2.6 |
| 0.85 | 28.3 | 3.5 |
| 0.90 | 43.7 | 5.5 |
| 0.95 | 89.8 | 11.2 |
| 0.98 | 228 | 28.5 |
| 0.99 | 458 | 57.3 |

Five times as long, and a bit more. Every time the pole halves its distance to the circle, its gap 1 − r (0.1 to 0.05, or 0.02 to 0.01), the decay time doubles. At 0.99 it's a real bell, ringing for more than a twentieth of a second after every click.

[[diagram:pole-gaps]]

In the lab you get a pole-radius slider and a click button. Each click starts the spiral, draws the ring sample by sample, plays it, and reads out the decay time. Try 0.98 first, and check your prediction by ear.

[[lab]]

## When the whine switches on

A click isn't the only thing that rings the bell. The leaking chip powers up with the call, so its whine also starts suddenly, at the same moment as the click. The input is 1, 0, −1, 0, and so on from n = 0, with silence before it. A perfect notch would output nothing at all. Again only the even samples are shown; the odd ones are zero.

| n | x[n] | 0.905 (x[n] + x[n−2]) | − 0.81 y[n−2] | y[n] |
|---|---|---|---|---|
| 0 | 1 | 0.905 | 0 | 0.905 |
| 2 | −1 | 0 | −0.733 | −0.733 |
| 4 | 1 | 0 | +0.594 | 0.594 |
| 6 | −1 | 0 | −0.481 | −0.481 |
| 8 | 1 | 0 | +0.390 | 0.390 |
| 10 | −1 | 0 | −0.316 | −0.316 |

From n = 2 on, the zero pair is doing its job perfectly. Every whine sample is the opposite of the one two back, so x[n] + x[n − 2] is exactly zero. The input part of the rule removes the whine completely. And still the whine gets out: 0.905, −0.733, 0.594, −0.481, shrinking by 0.81 every two samples. It's the same spiral, started by the first whine sample, which had no "two samples back" to cancel against.

[[diagram:whine-on]]

So for the first few milliseconds of a call, the notch doesn't remove the whine. It lets it through and fades it out, over the decay time. A notch needs time to settle.

Which of the two is the tink in the tickets? Both, at once. The click and the whine's start arrive together, ring at the same pitch, and fade at the same rate, so the meter shows them as one spike. The leak starts at 0.905 of the whine's own height, which sounds like a lot. But the whine itself is a faint hum far below the click, so its share of the tink is faint too. Whatever we do to the decay time fixes both.

## How wide a notch is

The poles' radius has had two jobs all along, and they pull against each other. Lesson 6 showed one: poles closer to the circle make the notch narrower, so the voice near 2,000 Hz keeps more of its strength. You've just seen the other: poles closer to the circle make the ring last longer. To trade them, we need a number for the width too.

The **bandwidth** is the width of the notch, in Hz, between the two tones on either side of it that the notch passes at 71%.

[[diagram:bandwidth]]

Why 71%? It's the standard edge of a band. A tone at 71% of its height carries half its energy, because energy goes with the square of height: 0.71 × 0.71 = 0.5. You've met the number before, too: lesson 6's two-point average passed 2,000 Hz at 71%.

For your notch at radius 0.9, the tones at 71% are 1,867 Hz and 2,133 Hz, so the bandwidth is 266 Hz. Inside that band the dent is deep: 1,900 Hz keeps only 60%. At radius 0.98 the edges are 1,974 Hz and 2,026 Hz, a bandwidth of only 51 Hz.

Put bandwidth and decay time side by side, with the decay time in seconds. Hz is "per second", so their product has no units at all: it's just a number.

| pole radius | bandwidth, Hz | decay time, s | bandwidth × decay time |
|---|---|---|---|
| 0.80 | 550 | 0.00258 | 1.42 |
| 0.85 | 407 | 0.00354 | 1.44 |
| 0.90 | 266 | 0.00546 | 1.45 |
| 0.95 | 130 | 0.01122 | 1.46 |
| 0.98 | 51.4 | 0.02849 | 1.46 |
| 0.99 | 25.6 | 0.05728 | 1.47 |

Look at the last column. It hardly moves: between 1.42 and 1.47, close to 1.46 for every radius you'd actually use. A notch five times narrower rings five times longer. Plot bandwidth against decay time and every notch of this kind lands on one curve, falling steeply from short, wide notches to long, narrow ones. The radius only picks where on the curve you sit.

[[diagram:trade-off]]

## Why the ring is the notch

Two things are left to explain. Why does the product stay near 1.46? And how can a filter that removes 2,000 Hz produce 2,000 Hz? Chapter 5 of Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), the book this course follows, answers both. Here it is in four steps, with the phone line paused for a page.

**Step one: feedback after the input stops.** Once the input is over, the rule is just \(y[n] = -0.81\, y[n-2]\). Try the spiral's shadow as an answer. At sample n the dot sits at angle 90° × n and distance \(A\, r^n\) from the center. Here \(r = 0.9\) and \(A\) is the ring's starting height, so its shadow is \(y[n] = A\, r^n \cos(90° \cdot n)\). Two samples back, the dot was half a turn behind and a little farther out, so its shadow had the opposite sign: \(A\, r^{n-2} \cos(90° \cdot n - 180°) = -A\, r^{n-2} \cos(90° \cdot n)\).

[[diagram:half-turn]]

 Multiply by \(-0.81 = -r^2\):

\[ -r^2 \cdot \left(-A\, r^{n-2}\cos(90° \cdot n)\right) = A\, r^n \cos(90° \cdot n) = y[n] \]

It fits. The book shows the same for any pole pair: at radius \(r\) and angle \(\theta\), it adds a ring \(r^n \cos(\theta n + \text{a fixed shift})\) to the impulse response. Angle sets pitch, radius sets decay: the spiral.

**Step two: split the notch into a click and a ring.** The system function from lesson 6 can be rewritten as a constant minus a pure feedback part:

\[ H(z) = \frac{0.905\left(1 + z^{-2}\right)}{1 + 0.81\, z^{-2}} = 1.1173 - \frac{0.2123}{1 + 0.81\, z^{-2}} \]

(To check it, put the right side over one denominator: \(1.1173 \times 0.81 = 0.905\) and \(1.1173 - 0.2123 = 0.905\).) The book calls this kind of split a partial fraction expansion. Now turn each part back into a rule you could run. The constant is a click, scaled by 1.1173. The fraction is pure feedback, whose click response is 1, 0, −0.81, 0, 0.656, and so on: the spiral. So the impulse response is

\[ h[n] = 1.1173 \times (\text{the click}) - 0.2123 \times (\text{the spiral}) \]

At n = 0 that's 1.1173 − 0.2123 = 0.905: the exception from the first table, now explained. At n = 2 it's −0.2123 × (−0.81) = 0.172.

Now listen to it as sound. A click has every tone in it at the same strength: that's what makes it a flat line on the meter. The spiral on its own rings at 2,000 Hz, so its frequency response is a tall, narrow peak there. Subtract that peak from a flat line and you've taken a narrow bite out of it, right at 2,000 Hz. At 2,000 Hz, z is the tone's arrow, a quarter turn. Two quarter turns back make a half turn, so \(z^{-2} = -1\). The fraction is then \(0.2123 / 0.19 = 1.117\), the same height as the click's 1.1173 to the digits we kept, and the two cancel to zero. That bite is the notch. The ring isn't a side effect of the notch. The ring is *how* the notch removes 2,000 Hz. A narrow bite needs a narrow peak, and a narrow peak needs a long ring.

[[diagram:click-minus-ring]]

**Step three: the decay time from the radius.** The ring keeps \(r^n\), so it reaches 1% when \(n = \ln 100 \,/ (-\ln r)\). For a number just below 1, the logarithm is close to minus the gap: \(\ln 0.9 = -0.105\), close to \(-0.1\). So the decay time is about \(4.6 / (1 - r)\) samples. For radius 0.9 that's 46, against the exact 43.7. Only the pole's gap to the circle, \(1 - r\), matters.

**Step four: the bandwidth from the radius.** Here angles work better in radians, which lesson 6 used for \(\omega\): a full turn is \(2\pi\) radians, which on your line is 8,000 Hz. In radians, a small angle and the short arc of the unit circle it cuts are the same number.

Now lesson 6's rule, in full: multiply the distances to the zeros, divide by the distances to the poles, and compare with the same number for 0 Hz. Your notch has four points: a zero and a pole at the top, a zero and a pole at the bottom. Take a tone a small angle \(a\) past the whine. As \(a\) changes, only two of those distances change much: the ones to the top zero and the top pole. The bottom pair is far away, about 2 and 1.9 from the tone. Those two, together with the comparison to 0 Hz, come to a factor of about 0.95: (2 ÷ 1.9) ÷ (2 ÷ 1.81) = 1.053 ÷ 1.105. (The 0 Hz point sits √2 from each zero and √1.81 from each pole, since 1.81 = 1 + 0.9², so its number is (√2 × √2) ÷ (√1.81 × √1.81) = 2 ÷ 1.81.) Treat it as 1 for now, and the rule shrinks to one ratio:

\[ \frac{\text{distance to top zero}}{\text{distance to top pole}} \]

[[diagram:triangle]]

The tone sits on the rim, so its distance to the top zero is about the arc, \(a\). The pole sits \(1 - r\) straight below the zero. So the tone, the zero and the pole make a right triangle with short sides \(a\) and \(1 - r\). The distance to the pole is its long side:

\[ \frac{\text{distance to zero}}{\text{distance to pole}} \approx \frac{a}{\sqrt{(1-r)^2 + a^2}} \]

When \(a = 1 - r\), the two short sides are equal, and the ratio is \(1/\sqrt{2}\): 71%. So the 71% edges sit \(1 - r\) radians either side of the whine, and the notch is \(2(1 - r)\) radians wide. In Hz that's \(2(1 - r) \times 8000 / 2\pi = (1 - r) \times 8000 / \pi\). For radius 0.9 that's 255 Hz, close to the measured 266. The 0.95 we dropped is why the true edges sit a little farther out.

Now multiply. Decay time in seconds is about \(4.6 / (1 - r) / 8000\), bandwidth in Hz about \((1 - r) \times 8000 / \pi\). The \(1 - r\) cancels, the 8,000 cancels, and what's left is \(4.6 / \pi \approx 1.46\). That's the last column of the table.

## Bells, in general

This trade isn't special to phone lines. A good bell rings for seconds because it resonates in one narrow band of pitches; a clap is broad in pitch and over in an instant.

Here's the reason underneath. To treat two close tones differently, a filter has to be able to tell them apart, and that takes time. Two tones 50 Hz apart start in step and only fall half a cycle out of step after 10 ms, 80 samples. Before that, they look almost alike, so no filter can cleanly single one of them out. The next figure shows two wheels, at 2,000 Hz and 2,050 Hz, whose dots only visibly part after many turns. A filter can be sharp in pitch or quick in time, and buying more of one costs you the other.

[[diagram:drift]]

## Your turn

The support lead has a request: "Get rid of the tink. Our listening panel says that if the ring is under 1% within 4 ms, it blends into the relay click and nobody hears a pitch. And while you're at it, make the voice crisper: keep 1,800 Hz at 90% or more."

Can you? The curve speaks of bandwidth, measured at 71%, but the request speaks of 90%. You need one more number to connect them. Where, for this notch, does a tone get back to 90%? The triangle answers it: set \(a / \sqrt{(1-r)^2 + a^2} = 0.9\) and square both sides, \(a^2 = 0.81\left(a^2 + (1-r)^2\right)\), so \(a = (0.9 / \sqrt{0.19}) \times (1 - r)\): the ratio reaches 0.9 when \(a\) is about 2.06 × (1 − r). That's almost exactly twice the distance to the 71% edge, so about one whole bandwidth from the whine. Check it on real numbers. At radius 0.9, with a 266 Hz bandwidth, 90% is reached at 1,728 Hz, 272 Hz below the whine. At radius 0.95, with 130 Hz of bandwidth, it's 134 Hz below.

[[diagram:ninety]]

In the lab, you have the pole radius, the click, and meters for the decay time, for the gain at the voice tone you are asked to keep, and for the gain at 2,000 Hz.

1. Before you touch the slider, use the curve: the lab's first question asks what it says about this request.
2. Try to meet both requests anyway, and see what the lab says.
3. Take the result to the support lead.

You show the lead the curve: 1,800 Hz at 90% forces about 7.5 ms of ring, nearly twice the panel's limit. The lead looks at it for a while and settles: "Fine. Keep 1,500 Hz at 90%, and the ring under 4 ms."

4. Now meet that: ring under 1% within 4 ms, 1,500 Hz at 90% or more, and the whine still at 0%.

[[diagram:radius-strip]]

[[lab-act2]]

Any radius from 0.816 up to just under 0.866 meets it. You ship 0.85: the ring falls under 1% in 3.5 ms, and 1,500 Hz keeps 93%.

## What people get wrong

It's natural to think a filter that removes 2,000 Hz can't produce 2,000 Hz, so the tink must be a glitch to patch. No patch can remove it. The notch removes 2,000 Hz by subtracting a 2,000 Hz ring from everything that comes in. While a steady tone passes through, that ring cancels the tone and you never hear it. When something sudden happens, a click or a whine switching on, the ring has nothing to cancel against for a moment. Then you hear it alone. The only choice you have is its length, and a short ring costs a wide notch.

## Recap

- Click a notch and you get back a click plus a ring at the poles' pitch, here 2,000 Hz.
- In time, a pole pair is a spiral: each sample it turns by the pole's angle and shrinks by its radius.
- The ring's **decay time** is 5.5 ms at radius 0.9; the notch's **bandwidth** is 266 Hz. A tone keeps 90% about one bandwidth away.
- Their product stays near 1.46, so a narrower notch rings longer. The ring is how the notch works: you trade its length against the notch's width.

## Next on the line

The tink is still there, but it's now too short to hear, lost inside the relay's click. Your line carries voices cleanly, and now a business customer wants to send faxes over it.

The fax fails. You check the tones the fax modem sends: every one arrives, every one loud enough, not a single tone removed. Yet on the other end, the modem's crisp tone bursts arrive smeared into each other, and the receiving machine can't read them. Nothing is too quiet. Something is too *late*, and not by the same amount for every tone. That's the next bug.
