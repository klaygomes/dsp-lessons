# The Whine on Line Two

## A new complaint

Your phone line works. You fixed the whistle in the last lesson: tones above 4,000 Hz now get filtered out before the line samples them, so nothing comes back at the wrong pitch. Customers are happy.

For about a week.

Then the support tickets start. "There's a thin, high whine on every call." "It sounds like an old TV left on in the next room." You listen to a recording, and they're right. Under every voice there's a steady, piercing tone. You put it through a frequency meter: 4,000 Hz, exactly the limit. A cheap clock chip somewhere in the line leaks its tick into the audio, and the tick lands right on the highest tone your line can carry.

You can't replace the chip this month. So today's question is a software question. You have the samples, 8,000 numbers every second. Can you write a few lines of code that remove the whine and leave the voice alone?

Let's start with the laziest idea that could possibly work.

## The laziest idea

Average each sample with the one before it. That's the whole program.

```
output[n] = (input[n] + input[n - 1]) / 2
```

A rule like this, one that builds each output sample from input samples, is called a **filter**. This one is about as simple as filters get. Before you read on, make a guess. What will it do to the whine? Make it a bit quieter? Half as loud? Nothing?

Let's compute it, sample by sample. A 4,000 Hz tone at 8,000 samples per second completes one full cycle every two samples. You met this tone in the last lesson: it's the fastest one the line can store, and its samples simply flip, up, down, up, down.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| whine in | +1 | −1 | +1 | −1 | +1 | −1 | +1 | −1 |
| average of this and the one before | | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Every single average is zero. Each sample is cancelled exactly by its neighbor, because the neighbor always sits on the opposite side. The whine is gone.

Before celebrating, make sure it doesn't also wreck the voice. Start with the dullest possible sound, a 0 Hz tone: just a constant, 1, 1, 1, 1. Every average is 1. Nothing changes, so 100% of it gets out.

Now a real voice tone, 500 Hz. It moves slowly, so neighboring samples are close to each other. (Where these exact numbers come from is the next section.)

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| 500 Hz in | 1.00 | 0.92 | 0.71 | 0.38 | 0.00 | −0.38 | −0.71 | −0.92 | −1.00 |
| average | | 0.96 | 0.82 | 0.54 | 0.19 | −0.19 | −0.54 | −0.82 | −0.96 |

Read the second row against the first. It's the same wave, a touch smaller and running half a sample late. In the table it peaks at 0.96, but only because its true peak now falls between two samples; the real wave inside is 98% as tall as the original, and we'll get that 98% from a picture soon. The average **passes** almost all of this tone.

So that's the trick. When you average two numbers that are almost equal, you get almost the same number back. When they're opposites, you get zero. Slow tones pass, and the fastest one is **removed** completely.


## Every tone turns a wheel

Why would a filter this lazy pass slow tones and wipe out the fast one? To see it, you need a picture of what a tone is.

A tone repeats, over and over, and the simplest thing that repeats is something going round. So picture a dot on the rim of a wheel with radius 1, and watch only how far left or right it sits. Far right reads +1, far left reads −1. Now look at the whine's samples again: +1, −1, +1, −1. So the whine is a dot that jumps halfway around the wheel, 180°, with every sample.

A slower tone turns the dot less each time. At 8,000 samples per second, a 2,000 Hz tone completes a cycle every four samples, so each sample is a quarter of a full turn, 360° ÷ 4 = 90°: right, top, left, bottom, right again. Read the left-right position at each stop and you get 1, 0, −1, 0. Those are exactly that tone's samples. A 1,000 Hz tone turns 45° per sample and takes eight samples to go around. A 0 Hz tone doesn't turn at all: the dot sits still, and every sample reads the same.

[[diagram:wheel]]

| tone | turn per sample |
|---|---|
| 0 Hz | 0° |
| 1,000 Hz | 45° |
| 2,000 Hz | 90° |
| 4,000 Hz | 180°, a flip |

So a tone's pitch is simply how far it turns the wheel between two samples: 360° × tone ÷ 8,000, which is 45° for every 1,000 Hz. This also explains the first table. The whine flips the dot straight across every sample, so each sample and the one before it sit on opposite sides of the wheel, and their average lands in the middle: zero. A slow tone barely moves between samples, so its average lands almost where the samples are.

The wheel also explains the limit from lesson one. A 5,000 Hz tone would turn the dot 225° per sample, more than half a turn. Turning 225° one way lands the dot exactly where turning 135° the other way would (360° − 225° = 135°), and 135° is a 3,000 Hz tone. Same dots, same samples: that's the whistle coming out at 3,000 Hz.

In the lab, every tone is drawn as one point on this wheel: the spot its dot reaches after one sample. 0 Hz sits at the right, and the point walks counter-clockwise as the tone rises, until 4,000 Hz arrives at the far left.

Now go and play with it. Move the tone from 0 Hz up to 4,000 Hz and watch how much passes.

[[lab]]

## A circle that holds every tone

You've now seen three numbers: 100% of 0 Hz passes, about 98% of 500 Hz, and 0% of 4,000 Hz. If you dragged the slider, you saw a smooth curve between them. You can get that whole curve from one picture, without computing a table for every tone.

Take the wheel and put every tone on it at once, each at the spot its dot reaches after one sample, as the lab does. A wheel of radius 1 used this way is called the **unit circle**. We'll only use its top half for now. The bottom half has a job too, and we'll get to it.

Our averaging filter has one special point in this picture, at the far left. At that point the filter's output is zero, so the point is called a **zero** of the filter. It decides how much of every tone gets out:

> How much of a tone passes is its distance to the zero, compared with the same distance for 0 Hz.

Distance here means the straight line between the two points, cutting across the inside of the circle. 0 Hz sits at the right, two units from the zero, so every tone is compared against 2. Check the rule against what you computed. 4,000 Hz sits right on top of the zero: no distance at all, so nothing passes. 2,000 Hz, at the top of the circle, is one unit over and one unit up from the zero, so its distance is √2 ≈ 1.41 (a right triangle with two sides of 1), and 1.41 ÷ 2 gives 71%. And 500 Hz, turned 22.5° from the right, is 1.96 from the zero: 1.96 ÷ 2 is the 98% from the table.

[[diagram:zero]]

So "which tones does this filter remove?" has a geometric answer: the ones at its zeros. A tone on a zero is removed. A tone near a zero is weakened. A tone far away passes.

What does a distance on a circle have to do with averaging samples? We'll see exactly why in a moment. First, the line breaks again.

## The whine moves

You ship the averaging filter. The tickets stop. It holds until Thursday.

A technician replaces the cheap clock chip with a slightly less cheap one, and the whine comes back. Same piercing tone, different pitch. The meter now says 2,000 Hz.

Your filter is still running, so how much of a 2,000 Hz whine does the average pass? You already know: 2,000 Hz sits at the top of the circle, 1.41 from the zero, so 71% of the whine passes. That's barely a dent.

The circle shows the fix. You don't need a better average. You need a filter whose zero sits at the top of the circle, where 2,000 Hz lives. A 2,000 Hz tone completes a cycle every four samples:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 2,000 Hz whine | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |

Look at the pattern: every sample is the exact opposite of the sample two steps back. So instead of averaging neighbors, average each sample with the one two steps back:

```
output[n] = (input[n] + input[n - 2]) / 2
```

| n | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|
| (this + two back) / 2 | (−1 + 1) / 2 = 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Gone again. If the circle is telling the truth, this filter must have a zero at the top. It does, and the next section shows why.

## Why distance on a circle?

This is what chapter 4 of the book is about. Seven short steps, and you'll have it.

**Step one: a tone is a spinning arrow.** This is the wheel from before, written in numbers. Mark a point on the unit circle at angle \(\omega\). In complex numbers that point is written \(e^{j\omega} = \cos\omega + j\sin\omega\), where \(j\) is the square root of −1. That's Euler's formula, and all you need from it is this: \(e^{j\omega}\) is the point at angle \(\omega\) on the circle. The angle comes from the tone: \(\omega = 2\pi \times \text{tone} / 8000\), so 2,000 Hz is a quarter turn, \(\omega = \pi/2\). Now let the point turn by \(\omega\) once per sample:

\[ x[n] = z^n, \qquad z = e^{j\omega} \]

Multiplying points on the unit circle adds their angles, so \(z^n\) is just the point turned by \(\omega\), \(n\) times over. Watch only its horizontal position as it spins and you get \(\cos(\omega n)\): the very numbers in the tables above. The spinning arrow is the tone, and the cosine is its shadow.

**Step two: a delay is a multiplication.** Delay this tone by one sample:

\[ x[n-1] = z^{n-1} = z^{-1} \cdot z^n \]

Delaying a tone is the same as multiplying it by \(z^{-1}\). This is the move the whole chapter is built on. The book's **z-transform** turns a whole signal into a function of \(z\), and with it every delay in a filter becomes a power of \(z^{-1}\). Today we only need it for filters.

**Step three: the filter becomes a formula.** Feed the tone into the average:

\[ y[n] = \tfrac{1}{2}\left(z^n + z^{-1} z^n\right) = \underbrace{\tfrac{1}{2}\left(1 + z^{-1}\right)}_{H(z)} \cdot z^n \]

The same spinning arrow comes out, multiplied by a number that depends only on \(z\). The book calls that number the **system function**, \(H(z)\). For the average:

\[ H(z) = \frac{1 + z^{-1}}{2} = \frac{z + 1}{2z} \]

**Step four: the zero.** A tone is removed exactly when \(H(z) = 0\). The top of the fraction, \(z + 1\), is zero when \(z = -1\), the point at the far left of the circle: 4,000 Hz.

**Step five: the distance.** On the unit circle \(|z| = 1\), so the bottom of the fraction has size 2. The top, \(|z + 1| = |z - (-1)|\), is literally the distance from the tone's point \(z\) to the zero at \(-1\). So

\[ |H(z)| = \frac{\text{distance from } z \text{ to the zero}}{2} \]

and 2 is exactly the distance of 0 Hz. That's the rule you've been using. Try it on your 500 Hz row: its point is at \(\omega = \pi/8\), and \(|e^{j\pi/8} + 1| / 2 = \cos(\pi/16) \approx 0.98\). There's the 98%.

**Step six: real tones come in pairs.** A cosine is really two arrows: one at \(z\) spinning one way, and its mirror \(\bar z\) on the bottom half spinning the other way. Average them and the vertical parts cancel, leaving the horizontal shadow. That's the job of the bottom half: it holds every tone's mirror arrow. So a zero on the top arrow alone would remove only half of the tone. The mirror arrow would sail through, and you'd still hear the whine at half strength. To remove a real tone, a filter needs a pair of zeros, one on each arrow. The two exceptions are 0 Hz and 4,000 Hz: they sit on the horizontal line, so each is its own mirror. That's how the average gets away with a single zero.

**Step seven: a zero pair anywhere.** That's what the second filter has. Its system function is \(H(z) = \tfrac{1}{2}(1 + z^{-2})\), which is zero when \(z^2 = -1\): at \(z = j\), the top of the circle, and \(z = -j\), its mirror at the bottom. To put a zero pair at any angle \(\theta\), multiply the two factors that vanish there:

\[ \left(1 - e^{j\theta} z^{-1}\right)\left(1 - e^{-j\theta} z^{-1}\right) = 1 - 2\cos\theta\, z^{-1} + z^{-2} \]

Read back as a program, that's

\[ y[n] = x[n] - 2\cos\theta \; x[n-1] + x[n-2] \]

Pick the angle of the whine and you have a filter that removes it. For 2,000 Hz, \(\theta = 90°\), \(\cos\theta = 0\), and you get back \(x[n] + x[n-2]\), up to the factor of a half.

With two zeros, the rule grows in the obvious way: multiply the distances to all the zeros, and compare with the same product for 0 Hz.

## The voice gets dull

The 2,000 Hz filter goes out. The whine is gone. The next ticket reads: "Everyone sounds like they're talking through a sock."

What happened? Zeros don't only remove the tone they sit on. They weaken every tone near them. A voice has a lot going on around 1,500 Hz and 2,500 Hz, the tones that make consonants crisp, and those sit close to the top of the circle. Let's compute 1,500 Hz with the rule. Its point is 0.39 from the zero at the top and 1.96 from the zero at the bottom, a product of 0.77. For 0 Hz, both zeros are 1.41 away, a product of 2. So 1,500 Hz keeps 0.77 ÷ 2, just 38% of its strength. The filter removed the whine and most of the consonants with it.

To fix this, the filter needs a second kind of point: one that pushes the response back up.

## Poles: the filter listens to itself

So far every filter has only looked at its input. Now let it also look at its own past output. This is called **feedback**:

\[ y[n] = 0.905\left(x[n] + x[n-2]\right) - 0.81\, y[n-2] \]

(The 0.905 only sets the volume, so that 0 Hz comes out at exactly 100%.) Run the derivation again: put in \(x[n] = z^n\) and expect \(y[n] = H(z)\, z^n\) out.

\[ H(z)\, z^n = 0.905\left(z^n + z^{-2} z^n\right) - 0.81\, H(z)\, z^{-2} z^n \]

Divide both sides by \(z^n\) and collect the two \(H(z)\) terms on the left:

\[ H(z)\left(1 + 0.81\, z^{-2}\right) = 0.905\left(1 + z^{-2}\right) \quad\Rightarrow\quad H(z) = \frac{0.905\left(1 + z^{-2}\right)}{1 + 0.81\, z^{-2}} \]

The bottom of this fraction is zero at \(z = 0.9j\) and \(z = -0.9j\). Those points are called **poles**. Near a pole you divide by a number close to zero, so the response shoots up. These two poles sit just inside the circle, at 0.9 of the radius, in the same directions as the two zeros.

The rule simply gains a bottom line:

> Multiply the distances to the zeros, divide by the distances to the poles, and compare with the same number for 0 Hz.

[[machine]]

Here's why that saves the voice. Seen from far away, a zero and the pole beside it look like they're in the same place, so the tone's two distances are almost equal and cancel out of the fraction. The tone passes almost whole. Only a tone close to the top can tell the zero and the pole apart. Run the numbers for 1,500 Hz and it now keeps 97%, up from 38%. Only very close to the top does the zero win: at 2,000 Hz the distance to the zero is exactly 0, so the whine is still removed. A filter with this shape, one narrow gap in an otherwise flat response, is called a **notch**.

[[diagram:notch]]

Move the poles closer to the circle and the notch gets narrower. With poles at 0.9, a tone at 1,900 Hz, only 100 Hz from the whine, keeps 60%. Move them to 0.98 and it keeps 97%. So why not put the poles right on the circle, or beyond it?

Feedback means each output is built from earlier outputs, so anything that gets in keeps echoing. Tap the filter with a single click and watch the feedback term alone: the echo comes back two samples later times −0.81, then two samples after that times −0.81 again. And 0.81 is 0.9 × 0.9. So the echo shrinks by 0.9 per sample on average, and 0.9 is exactly the poles' distance from the center. That's what a pole's radius means: how much of an echo survives each sample. After 50 samples, about 6 milliseconds, a 0.9 echo is down to half a percent.

Put the poles exactly on the circle and the echo never shrinks: one click, and the filter rings at 2,000 Hz forever. Push them out to 1.1 and it's worse. Each sample of the echo is 1.1 times the last, so after 50 samples it's 117 times louder than the click that started it, and it keeps growing. A filter whose poles all sit strictly inside the unit circle is called **stable**: its echoes always die out.

## Your turn

Now you fix the line. In the lab, a new whine is waiting at a pitch you don't know yet. Your job:

1. Listen, find the whine, and move the zero pair onto it until the whine is removed.
2. Bring in the poles to give the voice its edge back, without letting the filter blow up.

You're done when the meter shows the whine at 0% and the voice above 90%.

[[lab-act2]]

## What people get wrong

It's natural to picture the filter hunting for the whine: detecting it, then subtracting it. It does nothing of the kind. The filter never looks for anything. It treats every tone the same way, by where its point sits on the circle, whether a whine is there or not. So if a customer happens to sing a perfect 2,000 Hz note, your notch removes that too. A filter is a property of tones, not a detector of noises.

## Recap

- A **filter** builds each output sample from input samples, and with **feedback** also from its own earlier outputs.
- Every tone is a point on the **unit circle**: 0 Hz at the right, 4,000 Hz at the left, its mirror arrow on the bottom half.
- A **zero** is a point where the filter's output vanishes. A **pole** is a point where it shoots up.
- How much of a tone passes: multiply its distances to the zeros, divide by its distances to the poles, compare with 0 Hz.
- A zero pair on the whine plus a pole pair just inside beside it makes a **notch**.
- A pole's radius is how much an echo keeps per sample, so every pole must stay inside the circle.

## Next on the line

The notch works. The whine is gone and the voice is crisp. Then someone notices something odd: every time a call clicks on, there's a faint ring left behind at exactly 2,000 Hz, like a bell after you strike it. You've just learned where echoes come from. Where does this one come from, and how long will it last? That's the next bug.
