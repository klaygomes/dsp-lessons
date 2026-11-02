# The Whine on Line Two

## A new complaint

The bridge to the wideband line is clean. Lesson 5's low-pass filters cleared the ghosts, and lesson 4's filter in front of the sampler still keeps every whistle honest. Customers are happy.

For about a week.

Then the tickets start. "There's a thin, high whine on every call." "It sounds like an old TV left on in the next room." You put it on the frequency meter: exactly 4,000 Hz, the limit. A cheap clock chip is leaking its tick into the audio.

Lesson 4's filter can't touch it: that filter works on the smooth sound before the sampler, and this whine gets in afterwards. It's inside your samples, mixed in with the voice. You can't replace the chip this month, so today's question is a software question. Can you write a few lines of code that remove the whine and leave the voice alone?

Let's start with the laziest idea that could possibly work.

## The laziest idea

Average each sample with the one before it. That's the whole program.

```
output[n] = (input[n] + input[n - 1]) / 2
```

Before you read on, make a guess. What will it do to the whine? Make it a bit quieter? Half as loud? Nothing?

Let's compute it, sample by sample. A 4,000 Hz tone completes one full cycle every two samples. This chip's tick peaks right on the sample moments, so its samples simply flip, up, down, up, down.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| whine in | +1 | −1 | +1 | −1 | +1 | −1 | +1 | −1 |
| average of this and the one before | | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Every single average is zero. Each sample is cancelled exactly by its neighbor. The whine is gone.

[[diagram:average]]

Watch each pair of neighbors collapse into one output stem.

Before celebrating, check the voice. Start with the dullest possible sound, a 0 Hz tone: just a constant, 1, 1, 1, 1. Every average is 1. Nothing changes, so the gain at 0 Hz is 1, or 100%.

Now a real voice tone, 500 Hz. It moves slowly, so neighboring samples are close to each other.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| 500 Hz in | 1.00 | 0.92 | 0.71 | 0.38 | 0.00 | −0.38 | −0.71 | −0.92 | −1.00 |
| average | | 0.96 | 0.82 | 0.54 | 0.19 | −0.19 | −0.54 | −0.82 | −0.96 |

Read the second row against the first. It's the same tone, a touch smaller and running half a sample late. Its true peak falls between samples; the wheel will find it.

You've said "filter" loosely since lesson 4. Here's the exact meaning. A **filter** is a rule that builds each output sample from input samples, and with feedback also from its own earlier outputs. Lesson 5's weighted sums were filters, and so is this one: a convolution with the impulse response ½, ½. Feedback comes later today.

Two more words. How much of a tone a filter **passes** is its gain, as a percentage, and a tone that gets out at 0% is **removed**.

## Every tone turns a wheel

Why would a filter this lazy pass slow tones and remove the fast one? You already own the picture that answers it: lesson 3's tone as a wheel. A tone is a dot on the rim of a wheel with radius 1, turning counter-clockwise 360° × tone ÷ 8,000 per sample. Its left-right position is the sample. That's 45° for every 1,000 Hz.

[[diagram:wheel]]

Lessons 4 and 5 added one more fact: a dot turning backwards, clockwise, casts the same left-right shadow as one turning forwards. Hold on to that backwards dot.

Now the first table makes sense. The whine turns the dot 180°, a flip. So each sample and the one before it sit on opposite sides of the wheel, and their average lands in the middle: zero. A 500 Hz dot turns only 22.5° between samples, so the fresh dot and the one before sit close together. Their average lands halfway between them, just inside the rim: 11.25° behind the fresh dot, which is the phase, and 0.98 from the center. There's the true peak. The average passes 98% of 500 Hz.

[[diagram:midpoint]]

The picture zooms in on those two dots and their midpoint. The short step inward is the 2% the average loses.

In the lab, every tone is drawn as one point on this wheel: the spot its dot reaches after one sample. A slider moves the tone from 0 Hz to 4,000 Hz, and a curve traces how much passes: tone across, percentage up. Before you drag it, guess the shape.

[[lab]]

## A circle that holds every tone

The curve starts flat at 100%, bends down gently (92% at 1,000 Hz, 71% at 2,000 Hz, 38% at 3,000 Hz) and falls to 0 at 4,000 Hz. You can get that whole curve from one picture.

Take the wheel and put every tone on it at once, each at the spot its dot reaches after one sample. A wheel of radius 1 used this way is called the **unit circle**. It has one point per tone: 0 Hz at the right, 2,000 Hz at the top, 4,000 Hz at the left. We'll only use its top half for now. The bottom half matters too, and we'll get to it.

The book labels these points by angle, but not in degrees. It uses **radians**, which measure a turn by the walk along the rim. Walk once around a wheel of radius 1 and you've walked 2π, about 6.28. So a full turn is 2π, half a turn is π, a quarter turn is π/2.

[[diagram:radians]]

Watch the thread unroll along a ruler as the dot walks the rim.

The book calls a tone's turn per sample ω, the Greek letter omega:

\[ \omega = 2\pi \times \frac{\text{tone}}{8000} \]

That's the wheel's 360° × tone ÷ 8,000 with 360° swapped for 2π. So π means 4,000 Hz, the flip. 2,000 Hz is π/2, 1,000 Hz is π/4, and 500 Hz is π/8.

[[diagram:unit-circle]]

Watch one dot sweep the top half, leaving a fixed home for a tone every 1,000 Hz.

Our averaging filter has one special point on this circle, at the far left. At that point the filter's output is zero, so the point is called a **zero** of the filter. It decides how much of every tone gets out:

> How much of a tone passes is its distance to the zero, compared with the same distance for 0 Hz.

Distance here means the straight line between the two points, cutting across the inside of the circle. 0 Hz sits at the right, two units from the zero, so every tone is compared against 2. Check the rule. 4,000 Hz sits right on the zero, so nothing passes. 2,000 Hz is one unit over and one unit up from the zero. That's a right triangle with two sides of 1, so the distance is √2 ≈ 1.41, and 1.41 ÷ 2 gives 71%. And 500 Hz is 1.96 from the zero: 1.96 ÷ 2 is the 98%.

[[diagram:zero]]

So "which tones does this filter remove?" has a geometric answer: the ones at its zeros. A tone on a zero is removed. A tone near a zero is weakened. A tone far away passes. Why distance? There's a clean answer, but first the line breaks again.

## The whine moves

You ship the averaging filter. The whine tickets stop. A few new ones say calls sound "a bit muffled, but much better". The rule says why: the average keeps 56% at 2,500 Hz and 38% at 3,000 Hz, so the very top of the voice is shaved (a voice's tones run from about 300 to 3,400 Hz). Customers can live with it for now, and you make a note. It holds until Thursday.

A technician replaces the cheap clock chip with a slightly less cheap one, and the whine comes back. Same piercing tone, different pitch. The meter now says 2,000 Hz.

How much of it does the average pass? 2,000 Hz sits at the top of the circle, 1.41 from the zero, so 71% gets through. The whine is still almost three quarters as loud.

The circle shows the fix. You don't need a better average. You need a filter whose zero sits at the top of the circle, where 2,000 Hz lives. On the wheel, 2,000 Hz turns 90° per sample, so two samples make 180°: every sample sits opposite the one two steps back.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 2,000 Hz whine | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |

So instead of averaging neighbors, average each sample with the one two steps back:

```
output[n] = (input[n] + input[n - 2]) / 2
```

At n = 2 that's (−1 + 1) / 2 = 0, and every later sample cancels the same way. Samples 0 and 1 have nothing two steps back yet, so they stay blank.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| (this + two back) / 2 | | | 0 | 0 | 0 | 0 | 0 | 0 |

Gone again. If the circle is telling the truth, this filter must have a zero at the top. To check, we need a name for that point, and the name is j.

Think of the plain number 1 as an arrow from the center to the right-hand edge of the wheel. Now invent a number, j, that means "a quarter turn counter-clockwise". Multiply 1 by j and the arrow points straight up: that's the point j, at the top of the wheel. Multiply by j again and it points left, which is −1. So j × j = −1. That's the whole mystery of the "imaginary" number: it's a quarter turn, and two quarter turns make a flip.

[[diagram:j-turn]]

With j you can name any point: how far right it is, plus j times how far up it is. The point 45° up the rim is 0.71 + 0.71j. The bottom of the circle is −j.

## Why distance on a circle?

Here's the clean answer, from chapter 4 of Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989). One fact about j first, then six steps.

**Multiplying points.** The general rule is a picture too: multiplying two points multiplies their sizes (a point's size is its distance from the center) and adds their angles. Try it on the point 45° up the rim, 0.71 + 0.71j, times itself. Multiply it out, using j × j = −1: 0.5 + 0.5j + 0.5j + 0.5 × (−1) = j. (With the unrounded 0.7071 it's exactly j.) Size 1 × 1 = 1, angle 45° + 45° = 90°: the top of the circle. A point of size 0.9 at 90° works the same way: (0.9j) × (0.9j) has size 0.81 and angle 180°, so it's −0.81. Remember that one; it comes back later today.

[[diagram:multiply]]

Watch the angles stack end to end while the lengths multiply.

**Step one: the dot as a number.** Write θ for any angle on the rim (ω is the special angle a tone turns per sample). The point at angle θ is cos θ + j sin θ: its left-right position, plus j times its up-down position. The book writes that point as \(e^{j\theta}\). Why an exponential? Because multiplying points adds their angles, just as multiplying powers adds exponents. (That's Euler's formula, and we'll take it on trust.)

Call z the point one sample's turn reaches: the tone's spot on the unit circle, at angle ω. After n samples the dot has been turned by z, n times over, so the tone is

\[ x[n] = e^{j\omega n} = z^n, \qquad z = e^{j\omega} \]

Its left-right part, \(\cos(\omega n)\), is the very sample you've read off the wheel since lesson 3.

[[diagram:spinning-arrow]]

Watch the arrow's shadow write the samples beside it.

**Step two: a delay is a multiplication.** Delay this tone by one sample:

\[ x[n-1] = z^{n-1} = z^{-1} \cdot z^n \]

In wheel terms, the copy one sample old sits ω clockwise behind the fresh dot. Older is clockwise, as with lesson 3's phase. So multiplying by \(z^{-1}\) turns a point ω clockwise, and a minus sign in the exponent always means clockwise. This is the move the whole chapter is built on: every delay in a filter becomes a power of \(z^{-1}\).

[[diagram:delay]]

Watch the older dot trail the fresh one by the same arc.

**Step three: the filter becomes a formula.** Feed the tone into the average:

\[ y[n] = \tfrac{1}{2}\left(z^n + z^{-1} z^n\right) = \underbrace{\tfrac{1}{2}\left(1 + z^{-1}\right)}_{H(z)} \cdot z^n \]

The same turning dot comes out, multiplied by a number that depends only on z. The book calls it the **system function**, \(H(z)\): the number a tone \(z^n\) is multiplied by when it passes through the filter. Multiplying a dot by a number scales it and turns it, as you just saw. So the size of \(H(z)\) is the gain, and its angle is how far the output dot sits behind the input dot: lesson 3's phase, with clockwise counted as minus. For the average:

\[ H(z) = \frac{1 + z^{-1}}{2} = \frac{z + 1}{2z} \]

(The second form multiplies top and bottom by \(z\).)

At 500 Hz, \(1 + z^{-1}\) adds the fresh dot and the one 22.5° clockwise behind it, and halving gives their midpoint: size 0.98, 11.25° clockwise. The wheel's arrow, now as a number.

**Step four: the zero.** A tone is removed exactly when \(H(z) = 0\). The top of the fraction, \(z + 1\), is zero when \(z = -1\), the point at the far left of the circle: ω = π, 4,000 Hz.

**Step five: the distance.** Write \(|a|\) for the size of a number a: its distance from the center. Then \(|a - b|\) is the distance between two points: \(a - b\) is the arrow from b to a, and its size is that arrow's length. And multiplying numbers multiplies their sizes. On the unit circle \(|z| = 1\), so the bottom of the fraction has size \(|2z| = 2\). The top, \(|z + 1| = |z - (-1)|\), is literally the distance from the tone's point z to the zero at −1. So

\[ |H(z)| = \frac{\text{distance from } z \text{ to the zero}}{2} \]

and 2 is exactly the distance of 0 Hz. That's the rule you've been using.

**Step six: the mirror arrow.** Here's a snag. The dot \(e^{j\omega n}\) has an up-down part, and a real tone on your line doesn't: it's just the left-right numbers. Remember the backwards dot. Take a second arrow, \(e^{-j\omega n}\), that turns the same ω per sample but clockwise, so it sits on the bottom half wherever the first sits on the top. Give each arrow half size and add them. Their up-down parts cancel, and their left-right parts add up to the sample:

\[ \cos(\omega n) = \tfrac{1}{2} e^{j\omega n} + \tfrac{1}{2} e^{-j\omega n} \]

At 1,000 Hz after one sample: half of 0.71 + 0.71j plus half of 0.71 − 0.71j is 0.71, the sample. So a real tone is two half-size arrows turning opposite ways, and the second one is its **mirror arrow**. The bottom half of the circle holds every tone's mirror arrow.

[[diagram:mirror-arrow]]

Now look what this means for zeros. The filter is linear (lesson 1), so it handles the two arrows separately, each multiplied by \(H\) at its own point. A zero at the top arrow's point sends that arrow to 0, but the mirror arrow sails through at half strength. To remove a real tone, a filter needs a pair of zeros, one on each arrow. The two exceptions are 0 Hz and 4,000 Hz: they sit on the horizontal line, so each is its own mirror. That's how the average gets away with a single zero.

## The voice gets dull

That leaves the second filter. Its system function is \(H(z) = \tfrac{1}{2}(1 + z^{-2})\), which is zero when \(z^2 = -1\). Which points, multiplied by themselves, make −1? Angles add, so a quarter turn either way: \(z = j\) at the top, and \(z = -j\), its mirror. A zero pair, as step six said a real tone needs. With two zeros, the rule grows in the obvious way: multiply the distances to all the zeros, and compare with the same product for 0 Hz.

The 2,000 Hz filter goes out. The whine is gone. The next ticket reads: "Everyone sounds like they're talking through a sock." The average had only shaved the top of the voice. This one bites into the middle.

What happened? Zeros don't only remove the tone they sit on. They weaken every tone near them, and the tones that make consonants crisp, around 1,500 Hz and 2,500 Hz, sit close to the top of the circle. Compute 1,500 Hz with the rule. Its point is 0.39 from the zero at j and 1.96 from the zero at −j, a product of 0.77. For 0 Hz, both zeros are 1.41 away, a product of 2. So 1,500 Hz keeps 0.77 ÷ 2, just 38% of its strength.

[[diagram:dull]]

The figure draws those four lines. The filter removed the whine and most of the consonants with it.

One more tool before the fix, because the next whine could be anywhere. To put a zero at any point p, use the factor \(1 - p\, z^{-1}\). It vanishes at \(z = p\), because there \(p\, z^{-1} = p / z = 1\). A pair at angle θ and its mirror multiply out like this, with the middle term from step six's identity \(e^{j\theta} + e^{-j\theta} = 2\cos\theta\):

\[ \left(1 - e^{j\theta} z^{-1}\right)\left(1 - e^{-j\theta} z^{-1}\right) = 1 - 2\cos\theta\, z^{-1} + z^{-2} \]

The last term is a plain \(z^{-2}\) because the two factors' angles cancel: \(e^{j\theta} e^{-j\theta} = 1\). Read back as a program, each \(z^{-1}\) is one sample older:

\[ y[n] = x[n] - 2\cos\theta \; x[n-1] + x[n-2] \]

The ½ of the two-back filter only set the volume, so from here on the pair leaves it out.

[[diagram:zero-pair]]

The figure shows the pair at a few angles, each with its middle weight. At θ = π/2 the weight is 0: \(x[n] + x[n-2]\), the two-back filter without its ½.

Zeros alone can't save the consonants, though. The filter needs a second kind of point: one that pushes the response back up.

## Off the rim

\(H(z)\) is just arithmetic, so you can plug in any point z at all: on the rim, inside it, outside it. Tones only ever visit the rim, because a tone's z always has size 1. Picture the size of \(H\) as a landscape over the whole plane, with each tone a walker on the rim reading the height under its feet. A zero is a pit where the height is 0. Today's new point is the opposite: a spike. Put it just inside the rim and no tone ever stands on it, but every tone walking past nearby gets lifted.

And a point inside the rim means something too. Raise z = 0.9j to the powers 1, 2, 3 and so on: each step turns a quarter turn and shrinks to 0.9 of its size. That's a dot spiraling inward, a 2,000 Hz turn that fades. Keep that spiral in mind.

[[diagram:z-plane]]

The figure is a 3D relief: two pits on the rim, two spikes just inside, and a walker whose height bar dips only near 2,000 Hz. The small inset draws the spiral.

## Poles: the filter listens to itself

So far every filter has only looked at its input. Now let it also look at its own past output. This is called **feedback**:

\[ y[n] = 0.905\left(x[n] + x[n-2]\right) - 0.81\, y[n-2] \]

The 0.81 is 0.9 × 0.9, and the 0.905 only sets the volume. Both come out of the algebra in a moment.

[[diagram:feedback]]

Follow the loop: back two samples, times −0.81, into the next sum.

Run the derivation again: put in \(x[n] = z^n\) and expect \(y[n] = H(z)\, z^n\) out.

\[ H(z)\, z^n = 0.905\left(z^n + z^{-2} z^n\right) - 0.81\, H(z)\, z^{-2} z^n \]

Divide both sides by \(z^n\) and collect the two \(H(z)\) terms on the left:

\[ H(z) = \frac{0.905\left(1 + z^{-2}\right)}{1 + 0.81\, z^{-2}} \]

Now factor the bottom into pole factors, the way the zero pair factored the top. Since \((0.9j)^2 = -0.81\),

\[ 1 + 0.81\, z^{-2} = \left(1 - 0.9j\, z^{-1}\right)\left(1 + 0.9j\, z^{-1}\right) \]

and multiplying top and bottom by \(z^2\) gives

\[ H(z) = 0.905 \cdot \frac{(z - j)(z + j)}{(z - 0.9j)(z + 0.9j)} \]

Each factor \(z - p\) has size equal to the distance from z to p, as in step five. The top factors are the distances to the zeros at ±j. The bottom factors vanish at \(z = 0.9j\) and \(z = -0.9j\): a quarter turn up and down, but only 0.9 of the way out. Those points are called **poles**. Near a pole you divide by a number close to zero, so the response shoots up: the spikes in the landscape. So the rule gains a bottom line:

> Multiply the distances to the zeros, divide by the distances to the poles, and compare with the same number for 0 Hz.

Here's the 0.905. For 0 Hz the zero distances multiply to 2 and the pole distances to 1.81, so 0.905 × 2 ÷ 1.81 = 1, exactly 100%.

On the test bench below, a stylus rides the top half of the circle as the tone. Cords run from it to the zero at 2,000 Hz and to the pole inside, whose distance from the center, its radius, is written r. A gauge reads the share that passes. Drag the tone, and slide the pole in and out.

[[machine]]

Here's why that saves the voice. Seen from far away, a zero and the pole beside it look like they're in the same place. So a distant tone's two distances are almost equal, and they cancel out of the fraction. Only a tone close to the top can tell the zero and the pole apart. At 1,500 Hz the zero is 0.39 away and the pole 0.38, so 1,500 Hz now keeps 97%, up from 38%. Right at 2,000 Hz the distance to the zero is exactly 0, so the whine is still removed. A filter with this shape, one narrow gap in an otherwise flat response, is called a **notch**.

[[diagram:notch]]

Beside the zoomed-in notch, today's three gain curves show how narrow its dip is.

[[diagram:gain-curves]]

Move the poles closer to the circle and the notch gets narrower. With poles at 0.9, a tone at 1,900 Hz, only 100 Hz from the whine, keeps 60%. Move them to 0.98 and it keeps 97%. So why not put the poles right on the circle, or beyond it?

Look at the feedback loop on its own, \(y[n] = x[n] - 0.81\, y[n-2]\), and send it a single click. Two samples later it comes back times −0.81, and two samples after that, times −0.81 again: 1, 0, −0.81, 0, 0.66, 0, −0.53. That's the shadow of the spiral from before: a 2,000 Hz turn shrinking by 0.9 per sample. And 0.9 is exactly the poles' distance from the center. That's what a pole's radius means: how much of an echo survives each sample. After 50 samples, about 6 milliseconds, a 0.9 echo is down to half a percent.

Put the poles exactly on the circle, \(y[n] = x[n] - y[n-2]\), and the loop's echo never shrinks: 1, 0, −1, 0, 1, forever, a ring at 2,000 Hz. Push them out to 1.1 and it's worse. The spiral grows to 1.1 times its size every sample, so after 50 samples it is 117 times the click, and still growing.

[[diagram:echo]]

The three rows show the echo fading, holding, and running off the scale. (In the full notch, poles at exactly 1 would land on the zeros and cancel them.) A filter whose poles all sit strictly inside the unit circle is called **stable**: its echoes always die out.

## Your turn

Now you fix the line. In the lab, a new whine is waiting at a pitch you don't know yet. Your job:

1. Listen, find the whine, and move the zero pair onto it until the whine is removed.
2. Move the poles out from the center toward the rim to give the voice its edge back, without letting the filter blow up.

The voice meter averages how much of each tone from 300 to 3,400 Hz passes. You're done when the meter shows the whine at 0% and the voice above 90%.

[[lab-act2]]

## What people get wrong

It's natural to picture the filter hunting for the whine: detecting it, then subtracting it. It does nothing of the kind. It treats every tone by where its point sits on the circle, whether a whine is there or not. So if a customer happens to sing a perfect 2,000 Hz note, your notch removes that too.

## Recap

- A **filter** builds each output sample from input samples, and with **feedback** from its own earlier outputs.
- ω = 2π × tone ÷ 8,000, so π means 4,000 Hz. j is a quarter turn; multiplying points multiplies sizes and adds angles. A delay is \(z^{-1}\): older is clockwise.
- Every tone is a point on the **unit circle**, its mirror arrow on the bottom half. \(H(z)\) covers the whole plane; tones only walk the rim.
- How much of a tone passes: multiply its distances to the **zeros**, divide by its distances to the **poles**, compare with 0 Hz.
- A zero pair on the whine plus a pole pair just inside makes a **notch**. A pole's radius is how much an echo keeps per sample, so a **stable** filter keeps every pole inside the circle.

## Next on the line

The notch works. The whine is gone and the voice is crisp. Then someone notices something odd: every time a call starts, a faint ring is left behind at exactly 2,000 Hz, like a bell after you strike it. You know now that a pole's radius is how much of an echo survives each sample. So how long does this ring last, and can you shorten it without losing the notch? That's the next bug.
