# The Wall on the Line

## A voice through a wall

The echo is gone. In the last lesson you sent one click down the line and recorded what came back. Then you subtracted the copy of every voice that used to return a quarter of a second late. Nobody hears themselves anymore. You were rather proud of that.

Then the company opens a new route to the east, through old cable and a little smoothing circuit fitted years ago to hide the crackle of an exchange since retired. Calls on that route work. Nothing drops, nothing buzzes, nothing echoes. And yet the tickets roll in. "My mother sounds like she's calling from inside a cupboard." "It's like the other person is talking through a wall." You listen to a recording and wince. The voice is all there, every word, but its edges are gone. An "s" sounds like an "f". "Sixty" and "fifty" are hard to tell apart.

Your first instinct might be the volume knob. Hold that thought. We'll test it properly once we know what the route actually does to a voice.

Here's what you already have. Your line keeps 8,000 samples every second. The new route passes lesson 1's checks: it's linear and time-invariant. And lesson 2 told you how to question a system like that. Send one click and listen.

## The click test

You send a single click into the east route: one sample of 1, then silence. Here's what comes back.

| sample after the click | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| what returns | 0.15 | 0.70 | 0.15 | 0 | 0 |

[[diagram:click]]

That's the route's impulse response. The click comes back smeared across three samples: a little of it at once, most of it one sample late, and a little more two samples late. The smoothing circuit blends each sample with its neighbors.

Lesson 2 told you what this buys: the output is a convolution. Each output sample is 0.15 of the current input sample, plus 0.70 of the one before, plus 0.15 of the one before that.

```
output[n] = 0.15 * input[n] + 0.70 * input[n - 1] + 0.15 * input[n - 2]
```

[[diagram:convolution]]

So you can predict the output for any call. But nowhere among 0.15, 0.70, 0.15 is the word "muffled", or a hint of what to turn up. We need a different question.

## Worked example 1: one pure tone

A voice is complicated, so let's feed the route the simplest sound there is: one steady tone. Take 2,000 Hz, which is two thousand cycles every second. At 8,000 samples per second, one cycle spans four samples. Start the tone at the top of its swing and the samples go 1, 0, −1, 0 and repeat.

The route blends neighbors, so you might expect some mushy mixture to come out, or even silence.

Let's do it with a pencil. Assume the tone has been playing for a while, so the samples just before n = 0 exist too (they're 0 and −1, continuing the same pattern backwards).

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 2,000 Hz in | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |
| route out | 0 | 0.70 | 0 | −0.70 | 0 | 0.70 | 0 | −0.70 |

Here are three of those outputs, done in full:

- n = 1: 0.15 × 0 + 0.70 × 1 + 0.15 × 0 = 0.70
- n = 2: 0.15 × (−1) + 0.70 × 0 + 0.15 × 1 = 0
- n = 3: 0.15 × 0 + 0.70 × (−1) + 0.15 × 0 = −0.70

Now read the bottom row against the top one. It's the same pattern, 1, 0, −1, 0, shrunk to 70% and shifted by one sample. No mush. No new pattern. The route took a 2,000 Hz tone and handed back a 2,000 Hz tone.

[[diagram:tone-in-out]]

Try one more tone before trusting it. The dullest tone of all is 0 Hz, a tone that never wiggles: a constant, 1, 1, 1, 1. Every output is 0.15 + 0.70 + 0.15 = 1, unchanged. So the slow tone keeps 100%, and the 2,000 Hz tone keeps 70%. You can already feel the muffle forming.

What we just saw needs two words. How much a system scales one tone is its **gain**: output size divided by input size. The route's gain at 2,000 Hz is 0.70, or 70%, and at 0 Hz it's 1. How far behind the output tone sits is its **phase**. What does "how far behind" mean for a tone? And why does a tone come out as the same tone at all? For both, we need a picture of what a tone is.

## Every tone turns a wheel

A tone repeats, over and over, and the simplest thing that repeats is something going round. So picture a dot on the rim of a wheel with radius 1, and watch only how far left or right it sits. Far right reads +1, far left reads −1. Now look at our 2,000 Hz samples again: 1, 0, −1, 0. Start the dot at the right, which reads 1. Move it to the top, which reads 0, then to the left (−1), then to the bottom (0 again), and back to the right. So the 2,000 Hz tone is a dot that turns a quarter of a full turn, 360° ÷ 4 = 90°, with every sample.

(The samples can't actually tell the top from the bottom, so we choose: dots turn counter-clockwise. Hold on to that small choice. Next lesson, it bites.)

A slower tone turns the dot less each time. A 1,000 Hz tone takes eight samples to go around and turns 45° per sample. A 0 Hz tone doesn't turn at all: the dot sits still, and every sample reads the same. A 4,000 Hz tone turns 180°, half a turn. Its dot jumps straight across the wheel every sample, and its samples simply flip, +1, −1, +1, −1.

[[diagram:wheel]]

| tone | turn per sample |
|---|---|
| 0 Hz | 0° |
| 1,000 Hz | 45° |
| 2,000 Hz | 90° |
| 3,000 Hz | 135° |
| 4,000 Hz | 180°, a flip |

So a tone's pitch is simply how far it turns the wheel between two samples: 360° × tone ÷ 8,000, which is 45° for every 1,000 Hz. We'll lean on this picture for the rest of the course, so it deserves a name: the **tone as a wheel**. A dot turns 360° × tone ÷ 8,000 per sample, and its left-right position is the sample.

Why a wheel, and not the wavy line you'd draw on paper? Because the wheel makes "later" easy to see. A tone that runs one sample late is the same dot, turning at the same speed, just one sample's worth of turn behind. For 2,000 Hz, one sample behind is 90° behind. That's what phase measures: how many degrees the output's dot trails the input's. So the route's phase at 2,000 Hz is 90°.

[[diagram:phase]]

Now a reason to expect the route's trick to work for every tone, not just 2,000 Hz. The route's output blends three copies of the input. There is the fresh one, the one-sample-old one and the two-sample-old one. Each copy of a tone is the same wheel, turning at the same speed, merely set back by some angle. Since dots turn counter-clockwise, an older copy sits *clockwise* behind the fresh one: at 1,000 Hz, the one-sample-old dot is 45° clockwise behind, the two-sample-old dot 90°. Draw each copy as an arrow from the center to its dot, scaled by its weight, and add the three arrows tip to tail. As the wheel turns, all three arrows turn together, so their sum turns with them, at the same speed. The sum can be longer or shorter than the original, and it can trail it, but it cannot turn at a different speed.

[[diagram:arrows-turning]]

And a different speed would be a different tone. So a linear, time-invariant system can't invent new tones: it only adds shifted, scaled copies, and copies of a turning wheel turn together.

Now go and see it move. In the lab, pick a tone and watch two wheels: the one going into the route and the one coming out. Before you touch anything, predict: at 4,000 Hz, where the dot flips every sample, will the route keep more or less than at 2,000 Hz?

[[lab]]

## The frequency response

The answer is less: 40% at 4,000 Hz, against 70% at 2,000 Hz. Drag the tone from 0 up to 4,000 Hz and the output wheel shrinks steadily, from 100% to 40%, while its dot falls further behind. Those two readings, for every tone, are the most useful thing you can know about a linear, time-invariant system. The book's word for a tone's pitch in Hz is frequency, and that's where the pair gets its name. The **frequency response** is, for every tone, how much the system scales it and how far it delays it.

Here is the east route's frequency response, read off at a few tones:

| tone | gain | phase |
|---|---|---|
| 0 Hz | 1.000 (100%) | 0° |
| 500 Hz | 0.977 (98%) | 22.5° |
| 1,000 Hz | 0.912 (91%) | 45° |
| 2,000 Hz | 0.700 (70%) | 90° |
| 3,000 Hz | 0.488 (49%) | 135° |
| 4,000 Hz | 0.400 (40%) | 180° |

(At 4,000 Hz, 180° behind and 180° ahead are the same spot. We count it as behind, like the rest of the column, since nothing from the route arrives before the click that caused it.)

[[diagram:response]]

There's the wall. Low tones walk through almost untouched; high tones lose half their strength or more. A real wall does the same, which is why music through a wall is all bass. Phone lines carry the voice from about 300 to 3,400 Hz (why 3,400 and not 4,000 is next lesson's story). The crisp edges of consonants live at the top of that range, which is exactly where the route takes the most. Much of an "s" lies above what any phone line carries, so the little that's left, around 3,000 Hz, is what tells "sixty" from "fifty". The route cuts that to half strength while the vowel sails through.

Look at the phase column too. It climbs by 45° for every 1,000 Hz, exactly as fast as the wheel's turn per sample. That's the signature of a plain one-sample delay for every tone. It comes from the click's shape: 0.15, 0.70, 0.15 is symmetric around sample 1, so the route behaves like a pure smear centered one sample late. One sample of delay is one sample's worth of turn, whatever the tone: 45° for a 1,000 Hz dot, 90° for a 2,000 Hz dot. Same delay in time, more degrees for faster dots.

[[diagram:same-delay]]

In lesson 8 you'll meet a line that delays some tones more than others, and that one is much harder to live with.

## Worked example 2: two tones at once

A voice is many tones at once. Does the frequency response still tell you what happens when tones arrive together? Let's push it with a crude two-tone "voice", added sample by sample. A 500 Hz tone plays the swell of a vowel, and a 3,000 Hz tone plays the edge of a consonant. Each is half size, 0.5, so even where they add up the voice stays inside the line's range, −1 to +1.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 500 Hz | 0.50 | 0.46 | 0.35 | 0.19 | 0.00 | −0.19 | −0.35 | −0.46 | −0.50 | −0.46 |
| 3,000 Hz | 0.50 | −0.35 | 0.00 | 0.35 | −0.50 | 0.35 | 0.00 | −0.35 | 0.50 | −0.35 |
| sum in | 1.00 | 0.11 | 0.35 | 0.54 | −0.50 | 0.16 | −0.35 | −0.82 | 0.00 | −0.82 |

First, run the sum through the route the hard way, with the click rule. Each output needs the two samples before it, so the table lets us start at n = 2. There, 0.15 × 0.35 + 0.70 × 0.11 + 0.15 × 1.00 = 0.28. Do the same for every column from 2 to 9 and you get the first output row below. That row uses the unrounded samples, so it carries a third digit: 0.279 here.

Now do it the easy way, with the frequency response. The 500 Hz part keeps 0.977 and runs one sample late. The 3,000 Hz part keeps 0.488 and runs one sample late. So the prediction is 0.977 times the 500 Hz row shifted one step, plus 0.488 times the 3,000 Hz row shifted one step.

| n | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|
| click rule | 0.279 | 0.345 | 0.359 | −0.244 | −0.014 | −0.345 | −0.624 | −0.245 |
| 500 Hz part, × 0.977, one late | 0.451 | 0.345 | 0.187 | 0.000 | −0.187 | −0.345 | −0.451 | −0.489 |
| 3,000 Hz part, × 0.488, one late | −0.172 | 0.000 | 0.172 | −0.244 | 0.172 | 0.000 | −0.172 | 0.244 |

Add the two parts in any column and you get the click rule's number, up to rounding in the third digit. At n = 2, 0.451 − 0.172 = 0.279, exactly the click rule's 0.279. The figure overlays the two predicted parts, their sum, and the click rule's output, and the last two lines lie exactly on top of each other.

[[diagram:parts-sum]]

They match, column for column. Linear means you may split the voice into its tones, send each through on its own, and add the results back up.

Now compare the output with the input, lined up fairly: the output one sample later. Two columns make the point. At n = 6 the 3,000 Hz part is 0, so the input there is pure vowel: −0.35. One sample later the output is −0.345, barely changed. At n = 4 the 500 Hz part is 0, so the input is pure consonant: −0.50. One sample later the output is −0.244, cut in half. The slow swell survives; the quick edge riding on it is shaved in half.

[[diagram:two-tones]]

That's the muffle in miniature. Think of the voice as a recipe of one part 500 Hz and one part 3,000 Hz. After the route it's 0.977 parts to 0.488, so the consonant is only half as strong as the vowel (0.488 ÷ 0.977 = 0.50). Nothing new went in. The proportions changed.

Now you can test the volume knob properly. Turn the whole route up by a factor of two. 500 Hz comes out at 1.95 times its input and 3,000 Hz at 0.98 times. Louder, but 3,000 Hz is still half as strong as 500 Hz (0.98 ÷ 1.95 = 0.50). Same recipe, same wall. Worse, the knob makes the whole call bigger than the caller ever made it. Remember lesson 1's clipping: any sample pushed past the top of the line's range gets cut off flat. So the loudest callers get the harsh buzz back. The muffle is tones scaled by *different* amounts, and one knob can't fix that.

[[diagram:volume]]

## Why every tone comes out as itself

Chapter 2 of Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), turns the turning-arrows argument into a formula. Six steps, and the payoff is a way to compute any row of the table straight from the click.

**Step one: a tone goes in.** Write the turn per sample as \(\omega\). The book measures it in radians, where a full turn is \(2\pi\), so \(\omega = 2\pi \times \text{tone} / 8000\), and 1,000 Hz is \(\omega = \pi/4\), our 45°. The tone's samples are the dot's left-right position, which is what trigonometry calls the cosine of its angle:

\[ x[n] = \cos(\omega n) \]

**Step two: the system convolves.** This is lesson 2's rule, with \(h[k]\) the impulse response. The \(\sum_k\) means "add up over every \(k\)", here \(k = 0, 1, 2\):

\[ y[n] = \sum_k h[k]\, x[n-k] \]

**Step three: put the tone in.** The copy from \(k\) samples ago is the same wheel set back by \(\omega k\):

\[ y[n] = \sum_k h[k] \cos(\omega n - \omega k) \]

**Step four: split each cosine.** The sine is the dot's other reading, its up-down position, just as the cosine is its left-right one. A standard trigonometry identity links the two:

\[ \cos(a - b) = \cos a \cos b + \sin a \sin b \]

Applied to each copy, it separates the part that depends on \(n\) from the part that doesn't:

\[ y[n] = \underbrace{\Big(\sum_k h[k] \cos \omega k\Big)}_{A} \cos(\omega n) + \underbrace{\Big(\sum_k h[k] \sin \omega k\Big)}_{B} \sin(\omega n) \]

Here's the heart of it: \(A\) and \(B\) don't depend on \(n\). They're two fixed numbers, set by the system and the tone.

**Step five: fold it back into one tone.** Here's where the arrows come back. Each copy is an arrow of length \(h[k]\), pointing \(\omega k\) *clockwise* from the right, because that's how far behind the fresh dot it sits. Lay the arrows tip to tail. The left-right parts add up to \(A\), and the up-down parts add up to \(-B\) (clockwise means downward), so the chain ends at the point \((A, -B)\).

Call that point's distance from the center \(G\), and how far clockwise from the right it sits \(\varphi\). Then \(A = G\cos\varphi\) and \(B = G\sin\varphi\), so

\[ G = \sqrt{A^2 + B^2}, \qquad \varphi = \text{how far clockwise the end point } (A, -B) \text{ sits} \]

Now expand \(G \cos(\omega n - \varphi)\) with the same identity. You get \(G\cos\varphi \cos(\omega n) + G \sin\varphi \sin(\omega n)\). That's exactly \(A \cos(\omega n) + B \sin(\omega n)\), so the mix is a single cosine, turning at the same \(\omega\).

The figure draws the chain of arrows for 1,000 Hz and 3,000 Hz, with the end point, its distance \(G\) and its clockwise angle \(\varphi\) marked. Read the angle off the point, not off a formula. A shortcut that only divides \(B\) by \(A\) can't tell the upper right from the lower left, and it breaks down when \(A = 0\).

[[diagram:point]]

**Step six: read off the answer.**

\[ y[n] = G \cos(\omega n - \varphi) \]

The same tone, scaled by \(G\), its dot set back by \(\varphi\). \(G\) is the gain, and \(\varphi\) is the phase.

Try it where the shortcut would fail, at 3,000 Hz. Each copy is 135° further behind than the last. So the arrows are 0.15 at the right, 0.70 pointing 135° clockwise (down and to the left), and 0.15 pointing 270° clockwise (straight up).

- \(A = 0.15 + 0.70 \cos 135° + 0.15 \cos 270° = 0.15 - 0.495 + 0 = -0.345\)
- \(B = 0.15 \sin 0° + 0.70 \sin 135° + 0.15 \sin 270° = 0 + 0.495 - 0.15 = 0.345\)
- The chain ends at \((A, -B) = (-0.345, -0.345)\), in the lower left. Its distance is \(\sqrt{0.345^2 + 0.345^2} = 0.488\), and it sits 135° clockwise from the right.

Gain 0.488, phase 135°: the table's row. The strip below runs the same chain at 0, 1,000, 2,000, 3,000 and 4,000 Hz. The strip shows it curl round as the tone rises, its end point shrinking from 1 to 0.4 and swinging round to 180°. At 2,000 Hz the two small arrows cancel head to head, and the 0.70 arrow points straight down: worked example 1, drawn.

[[diagram:arrows]]

The book packs \(A\) and \(B\) into a single complex number, a way of writing a point as one number. In it, \(j\) marks the up-down part (lesson 6 explains it). The book writes the frequency response as

\[ H(e^{j\omega}) = \sum_k h[k]\, e^{-j\omega k} \]

Its size is the gain. Its angle is minus the phase: the book measures angles counter-clockwise, so an end point \(\varphi\) clockwise from the right has angle \(-\varphi\). That minus sign in \(e^{-j\omega k}\) is the clockwise of our arrows. Lesson 6 unpacks \(e^{j\omega}\); for today, the arrows say everything it says.

## Boosting what the wall took

For each tone, the east route multiplies by the gain and delays by the phase. The delay is one sample for every tone, an eighth of a millisecond, far too short for any ear to notice. So the delay can stay. The gain is the wall.

The fix falls straight out of the frequency response. If the route keeps 70% of 2,000 Hz, follow it with something that multiplies 2,000 Hz by 1 ÷ 0.70 = 1.43. Then 2,000 Hz gets out at 0.70 × 1.43, which is 100%. Do that for every tone, each with its own boost, and the two together keep everything at full strength.

Why do the gains multiply? The route scales a tone and hands on the same tone; the boost scales it again. Two scalings in a row make one scaling by the product.

[[diagram:cascade]]

You won't set a boost for every single tone. You'll set it per **band**: a stretch of neighboring tones that share one boost, named by the tone at its middle. The lab has seven bands, centered on 500, 1,000, 1,500, 2,000, 2,500, 3,000 and 3,400 Hz.

| band | route's gain | boost needed | together |
|---|---|---|---|
| 500 Hz | 0.977 | × 1.02 | 100% |
| 1,000 Hz | 0.912 | × 1.10 | 100% |
| 1,500 Hz | 0.815 | × 1.23 | 100% |
| 2,000 Hz | 0.700 | × 1.43 | 100% |
| 2,500 Hz | 0.585 | × 1.71 | 100% |
| 3,000 Hz | 0.488 | × 2.05 | 100% |
| 3,400 Hz | 0.433 | × 2.31 | 100% |

[[diagram:bands]]

Wait. A boost of × 2.31 is bigger than the × 2 volume knob that brought back the buzz. Won't this clip too? Not in the same way, and the reason is the whole point. The volume knob made the call twice as big as the caller made it. The boost only puts back what the route took away. If the boost undid the route exactly, every tone would come out at 100%. The call would be the caller's own, one sample late, no bigger than it went in.

Your boost won't be exact: seven knobs, and the lab accepts each band anywhere from 95% to 105%. So a tone can come out up to about 5% bigger than it went in. A real boost also adds small delays of its own, which can reshape the peaks a little. Lines leave a little headroom below the top of the range for exactly this. A few percent fits in it. Doubling everything doesn't.

The boost has one honest cost. It puts back *everything* the route took at those tones, crackle included. Here the crackle's source, the old exchange, is retired. On a noisy cable, you'd trade crisp consonants for crisp noise.

How do you build a boost like this out of samples? That's the job of what the book calls a filter, and lessons 6 and 10 build them from scratch. Today the lab hands you one with a knob per band.

## Your turn

A second route has the same complaint: the west route, opened last month, whose smoothing circuit nobody documented. Its impulse response is hidden, and its gains are not the east route's, so the table above won't help you. In the lab:

1. Send test tones down the route, one at a time. The meter shows how much comes out as a percentage: that's the gain, band by band. You're measuring the frequency response by hand.
2. Each band's knob sets a multiplier, like × 1.20. Set each one so that route and boost together keep that band at full strength.

You're done when every band comes out between 95% and 105%, and the caller on the speaker sounds like they've stepped out from behind the wall.

[[lab-act2]]

## What people get wrong

A muffled voice sounds damaged, so it's natural to believe the route blurred it or smeared new sound across it. It didn't. A linear, time-invariant system only scales and delays each tone. Every tone that comes out went in. Every tone that went in comes out, perhaps weaker, perhaps later. You can test the belief: send the route a single tone and look for any other tone in what comes back. You'll find none. The figure draws a voice as one bar per tone, before and after the route: the same bars, in the same places, only the high ones shorter.

[[diagram:tone-bars]]

A system that hands you a tone you didn't put in isn't linear and time-invariant. Lesson 1's clipping did exactly that, which is why it buzzed.

## Recap

- A **tone as a wheel**: a dot turning 360° × tone ÷ 8,000 per sample, whose left-right position is the sample. 45° for every 1,000 Hz.
- A linear, time-invariant system hands back the same tone, because copies of a turning wheel turn together.
- **Gain** is how much the system scales one tone. **Phase** is how many degrees the output's dot trails the input's.
- The **frequency response** is the gain and phase for every tone. Get it by sending test tones, or by adding arrows from the impulse response.
- A muffled line is one whose gain falls for high tones. Boost each band by one over the gain, and the voice comes back at about the size it went in.

## Next on the line

The east route sounds crisp again. Then a hearing clinic that runs check-ups over the phone files a ticket. They play a pure test whistle at 5,000 Hz, and patients report a clear, steady tone at 3,000 Hz. Not a fuzzy 5,000. Not a quiet 5,000. A clean, wrong 3,000. You might have noticed that our wheel table stopped at 4,000 Hz, the flip. What happens to a tone whose dot wants to turn more than half a turn per sample? That's the next bug.
