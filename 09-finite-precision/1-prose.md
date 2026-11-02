# The Chip That Hums

## Perfect on the laptop

The fax goes through, and the company orders ten thousand cheap chips, one for every exchange. The catch is printed on the box: it's an 8-bit chip. It can only store a few hundred different numbers, where your laptop stores almost any decimal you like.

Meanwhile, the clock chip's whine has learned a new trick. It no longer sits politely at 2,000 Hz. It hops: depending on how warm the clock chip runs, it whines at 1,900 Hz, at 2,000 Hz or at 2,100 Hz. One notch can't cover all three. So the team builds three narrow notches, one on each whine, each with its pole pair at radius 0.98 so the voice beside it stays crisp. The picture shows what the three do together: three narrow dips in an otherwise flat line.

[[diagram:three-notches]]

To keep the chip's job simple, the team multiplies the three notches together into a single rule:

```
output[n] = 0.9418 × input[n] + 2.8021 × input[n - 2] + 2.8021 × input[n - 4] + 0.9418 × input[n - 6]
          - 2.8576 × output[n - 2] - 2.7444 × output[n - 4] - 0.8858 × output[n - 6]
```

One recurrence, one loop. Where these numbers come from is worth a section of its own, and it gets one below. On the laptop the rule is beautiful. The whine is removed at 1,900, 2,000 and 2,100 Hz, a voice tone at 1,500 Hz keeps 99.6%, and a click dies away as fast as it should.

Then it's loaded onto the chip, and the first test call is a disaster. A hum starts the moment anything gets in: a click, a breath, the first syllable. The figure shows the output after a single click, on the laptop and on the chip. On the laptop it dies away. On the chip it grows sample by sample until it slams into the largest numbers the chip can hold, positive and negative. From then on it swings from one limit to the other and back, at full volume, for as long as the call lasts.

[[diagram:hum]]

Same rule. Same numbers. Or are they?

## What the chip can store

Every number in that rule, the 0.9418, the 2.8576 and the rest, is a **coefficient**: a fixed number in a filter's rule that a sample is multiplied by. The figure takes lesson 6's notch apart to show its coefficients: each one sits on its own wire, multiplying one sample on its way to the output.

[[diagram:coefficients]]

A filter is its coefficients. Change one and you have a different filter.

Your laptop stores each coefficient with about sixteen digits. The chip gives each one 8 bits, and 8 bits can hold only 256 different whole numbers, from −128 to 127. So to store 0.81, the chip picks a step, say 1/128. It stores the whole number of steps that comes closest. Here 0.81 × 128 = 103.68, so it stores 104, which stands for 104/128 = 0.8125.

Rounding a number to the nearest value the chip can store is called **quantization**. The stored value is always within half a step of the real one, but almost never equal to it. The figure shows the chip's tick marks, and a coefficient snapping to the nearest one.

[[diagram:chip-steps]]

The chip rounds one more thing: the result of every multiplication it does, because that has to fit back into 8 bits too. That adds a tiny noise to every sample. This lesson is about the coefficients, but keep the noise in mind: it matters once, near the end.

There's a catch with the step. A step of 1/128 only reaches up to 127/128, just under 1. To store a bigger coefficient, the chip has to use a bigger step: 1/64 reaches up to 1.98, and 1/32 reaches up to 3.97. And the chip uses one step for the whole rule. So the biggest coefficient decides how coarsely every coefficient gets rounded. Keep an eye on that.

## Worked example 1: lesson 6's notch survives

Before we hunt the hum, let's put a filter we trust on the chip. Here is lesson 6's notch:

```
output[n] = 0.905 × (input[n] + input[n - 2]) - 0.81 × output[n - 2]
```

Its biggest coefficient is 0.905, under 1, so the chip can use the fine step of 1/128.

| coefficient | × 128 | stored whole number | stored value | error |
|---|---|---|---|---|
| 0.905 | 115.84 | 116 | 0.90625 | +0.00125 |
| 0.81 | 103.68 | 104 | 0.8125 | +0.0025 |

So the chip runs a slightly different filter, with 0.90625 and 0.8125. Where are its poles now?

Recall lesson 6's **system function H(z)**: the number a tone \(z^n\) is multiplied by when it passes through the filter. For a filter like this one, it's a fraction. The top comes from the input side, the bottom from the feedback side. One sign needs care. The program subtracts `0.81 × output[n - 2]`. Move that term to the left of the equals sign and it becomes `output[n] + 0.81 × output[n - 2] = 0.905 × (...)`. So a minus in the program is a plus in the bottom:

\[ H(z) = \frac{0.905\,(1 + z^{-2})}{1 + 0.81\, z^{-2}} \]

The poles sit where the bottom is zero. In lesson 6 that was at \(z^2 = -0.81\): radius \(\sqrt{0.81} = 0.9\), straight up and straight down. On the chip the bottom is \(1 + 0.8125\, z^{-2}\), so the poles sit at radius \(\sqrt{0.8125} = 0.9014\), still straight up and down. They moved outward by 0.0014. That's all.

And the zeros? Both input coefficients were rounded the same way, so the top is still \(0.90625\,(1 + z^{-2})\). It's zero exactly at the top and bottom of the circle, so the whine is still removed completely. The voice hardly notices: 1,500 Hz kept 96.9% on the laptop and keeps 97.0% on the chip, and 1,900 Hz goes from 60.0% to 60.5%.

What about 0 Hz? Here's a handy shortcut. On the unit circle, 0 Hz is the point \(z = 1\), and every power of 1 is 1. So the gain at 0 Hz is just the sum of the top's coefficients divided by the sum of the bottom's. On the chip that's (0.90625 + 0.90625) ÷ (1 + 0.8125) = 1.8125 ÷ 1.8125 = 1. Still exactly 100%.

That's the job of the 0.905 in front of the input side. Call it the notch's **volume factor**: the number in front of a filter's input side, chosen so that 0 Hz comes out at exactly 100%. Lesson 6 got the same number from its distance rule.

The notch your line runs today, lesson 7's version with poles at 0.85, fares just as well: its poles land at 0.848.

In the lab, you can be the chip. Pick a step, watch each coefficient snap to its tick, and see where the poles go. Try to make lesson 6's notch fail. Before you start, guess: how coarse must the step be before it goes unstable?

(Spoiler, for readers without the lab: it never crosses the rim. Only at a step of 1/2 does 0.81 round up to 1, and that puts the poles exactly on the circle.)

[[lab]]

So why does the three-notch rule fall over?

## Worked example 2: the three-notch rule on the chip

Let's round the three-notch rule the way the chip does. Its biggest coefficient is 2.8576. A step of 1/64 only reaches 1.98, so the chip is forced to the step of 1/32, four times coarser than the notch above got. Here are the feedback coefficients, the ones that make the poles:

| laptop | × 32 | stored whole number | stored on the chip | error |
|---|---|---|---|---|
| 2.8576 | 91.44 | 91 | 2.84375 | −0.0138 |
| 2.7444 | 87.82 | 88 | 2.75 | +0.0056 |
| 0.8858 | 28.35 | 28 | 0.875 | −0.0108 |

Each is off by about a hundredth. Small, you'd think.

[[predict-drift]]

The input side is rounded too, and something odd happens there. 0.9418 becomes 30/32 = 0.9375, and 2.8021 becomes 90/32 = 2.8125. Divide the second by the first: exactly 3. So the stored input side is \(0.9375\,(1 + 3z^{-2} + 3z^{-4} + z^{-6})\), which is \(0.9375\,(1 + z^{-2})^3\): lesson 6's 2,000 Hz notch, three times over. All three zero pairs have collapsed onto 2,000 Hz. The whine at 1,900 or 2,100 Hz now gets through at 12.9%. The rounding has quietly thrown away two of your three notches.

But the zeros aren't what makes the hum. Find the points where the bottom of the stored rule's system function is zero. With the minus signs turned to plus as in worked example 1, it's \(1 + 2.84375\, z^{-2} + 2.75\, z^{-4} + 0.875\, z^{-6}\). That's a polynomial of degree six, so this step is for the computer.

| | on the laptop | on the chip |
|---|---|---|
| pole pair near 1,900 Hz | radius 0.98, at 1,900 Hz | radius **1.0567**, at 1,817 Hz |
| pole pair at 2,000 Hz | radius 0.98, at 2,000 Hz | radius 0.8378, at 2,000 Hz |
| pole pair near 2,100 Hz | radius 0.98, at 2,100 Hz | radius **1.0567**, at 2,183 Hz |

The figure draws both sets of poles on the unit circle. Watch the two outer pairs cross the rim.

[[diagram:pole-drift]]

Two pole pairs have jumped outside the unit circle. You know what that means from lesson 6. A pole's radius is how much an echo keeps per sample, and a pole at 1.0567 keeps more than all of it. The echo of a single click grows by 5.7% every sample. After 50 samples, about 6 ms, it's 15.8 times bigger. Over 400 samples, 50 ms, the growth is a factor of nearly four billion.

The chip can't hold numbers like that. The figure's click, of size 0.1, makes the echo hit the chip's limits after 76 samples, 9.5 ms, and even a click a hundred times smaller gets there within about 20 ms, ringing at the poles' tones, 1,817 and 2,183 Hz, as it grows. From then on every sample that would go past a limit is clipped, the same clipping that gave loud callers their harsh buzz in lesson 1. The clipped echo can't die, because the feedback keeps feeding it back. So the output swings from the top limit to the bottom one and back again, forever: a harsh, full-volume hum. (The clipping even moves its pitch: after a click, the pinned pattern repeats every 6 samples, so the hum sits near 1,333 Hz and its double.)

That's the bug. The rule on the chip isn't your rule. It's a neighbor of your rule, and that neighbor isn't stable.

But why? Lesson 6's notch had rounding errors too, and its poles barely moved. Here the errors are only about five times bigger. Yet the poles moved by 0.10 to 0.14, seventy to a hundred times as far as lesson 6's, and two pairs crossed the circle. Notice too that the middle pair moved inward while its neighbors moved out. Something about this rule amplifies its errors enormously, and gives each pole its own direction.

## Where the big numbers come from

Short version first: multiplying three tidy notches together makes the numbers big, and makes them stop meaning anything you can see. The animation multiplies the three notches one at a time and shows the coefficients piling up.

[[diagram:pile-up]]

Now the pencil version. In lesson 6, the 2,000 Hz notch had the input side \(1 + z^{-2}\), and lesson 6's zero-pair recipe covered a zero pair at any angle \(\theta\): \(1 - 2\cos\theta\, z^{-1} + z^{-2}\). A pole pair works the same way with the radius \(r\) put in, as lesson 8 showed: \(1 - 2r\cos\theta\, z^{-1} + r^2 z^{-2}\). With \(r = 0.98\), the three feedback sides are

| notch | angle | \(2r\cos\theta\) | \(r^2\) | feedback side |
|---|---|---|---|---|
| 1,900 Hz | 85.5° | 0.1538 | 0.9604 | \(1 - 0.1538\, z^{-1} + 0.9604\, z^{-2}\) |
| 2,000 Hz | 90° | 0 | 0.9604 | \(1 + 0.9604\, z^{-2}\) |
| 2,100 Hz | 94.5° | −0.1538 | 0.9604 | \(1 + 0.1538\, z^{-1} + 0.9604\, z^{-2}\) |

Each one is tidy: the 0.9604 is the radius squared, the 0.1538 says the angle, and all of them are under 1.

Now multiply the first and the last. The \(z^{-1}\) terms cancel (−0.1538 + 0.1538), and so do the \(z^{-3}\) terms. What's left is

\[ 1 + (2 \times 0.9604 - 0.1538^2)\, z^{-2} + 0.9604^2\, z^{-4} = 1 + 1.8972\, z^{-2} + 0.9224\, z^{-4} \]

Multiply in the middle one, \(1 + 0.9604\, z^{-2}\):

\[ 1 + 2.8576\, z^{-2} + 2.7444\, z^{-4} + 0.8858\, z^{-6} \]

That's the feedback side of the laptop rule. (The program writes these with minus signs, because it moves them to the other side of the equals sign. More on that in a moment.) That cancelling is also why only even delays appear in the rule.

The input side comes from the zero pairs in the same way. The zeros sit on the circle, so they use \(2\cos\theta\) without the radius: 0.1569 at 1,900 Hz. Multiplied out, the three zero pairs give \(1 + 2.9754\, z^{-2} + 2.9754\, z^{-4} + z^{-6}\). Each notch also carries a volume factor, worked out by the 0 Hz shortcut from worked example 1. For each notch that factor is 0.9802, and three of them make 0.9802³ = 0.9418. That's the rule's first number, and 0.9418 × 2.9754 = 2.8021 is its second.

Two things happened. The numbers grew. Multiplying three things that are each close to 1 piles them up, like the 1, 3, 3, 1 you get when you multiply out \((1 + x)^3\). (On the input side that pile-up is what the chip rounded to exactly 1, 3, 3, 1.) That's why the chip needed the coarse step. And the numbers stopped meaning anything you can see. No single coefficient is "the radius" or "the angle" of any pole any more. Each one is a blend of all six poles, so a rounding error in any coefficient tugs on all of them at once.

## Why crowded poles jump

Here's the derivation, from chapter 6 of Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989). It uses one idea from calculus, the slope of a curve at a point, and the figures draw it instead of assuming it.

**Step one: switch to positive powers.** As in worked example 1, the program's minus signs become plus signs in the bottom, which reads \(1 + 2.8576\, z^{-2} + 2.7444\, z^{-4} + 0.8858\, z^{-6}\). Multiply the top and the bottom of the fraction by \(z^6\). That doesn't change \(H(z)\), and the bottom becomes a plain polynomial:

\[ P(z) = z^6 + 2.8576\, z^4 + 2.7444\, z^2 + 0.8858 \]

**Step two: the poles are its roots.** With the six poles called \(p_1\) to \(p_6\), the polynomial is the product of six factors, one per pole:

\[ P(z) = (z - p_1)(z - p_2)(z - p_3)(z - p_4)(z - p_5)(z - p_6) \]

**Step three: rounding nudges the curve.** Quantization changes one coefficient by a small error \(\varepsilon\). For the first feedback coefficient, that adds \(\varepsilon\, z^4\) to \(P\). Near a pole, \(z^4\) has a size close to 1 (0.98⁴ = 0.92). So near the pole, the error lifts the polynomial by about \(\varepsilon\).

**Step four: a lifted curve moves its crossing.** The figure shows a curve crossing zero at a root, with a straight line touching it there: its tangent. Close to the root, the curve and its tangent are the same thing. Lift the curve by \(\varepsilon\), and the crossing slides sideways by \(\varepsilon\) divided by the tangent's steepness. A steep curve barely moves its crossing. A flat one moves it a long way.

[[diagram:tangent]]

So a pole slides by about the error divided by the steepness of \(P\) at the pole. (The poles are complex numbers, and so is the steepness, but the rule works the same way.)

**Step five: the steepness is a product of arrows.** Take the factor for pole \(p_1\) out in front: \(P(z) = (z - p_1) \times\) (the other five factors). Close to \(p_1\), the first factor is tiny and changing fast, while the other five barely change. They're about \((p_1 - p_2)(p_1 - p_3)\cdots(p_1 - p_6)\): one arrow from \(p_1\) to every other pole, multiplied together. So near the pole, \(P\) behaves like \((z - p_1)\) times that fixed product, and the product is the steepness. The figure draws those five arrows.

[[diagram:crowd]]

**Step six: put it together.** Call a pole's distances to the five other poles \(d_1\) to \(d_5\). A pole moves by about

\[ \text{its move} \approx \frac{\text{the error}}{d_1 \times d_2 \times d_3 \times d_4 \times d_5} \]

One over that product is the pole's multiplier: the error times the multiplier is the size of the move.

Now look at the numbers. Lesson 6's notch has two poles, 1.8 apart, so its multiplier is 1 ÷ 1.8 = 0.56. The error shrinks: 0.0025 × 0.56 = 0.0014, exactly the move you computed. A lone pole is calm.

The three-notch rule has six poles, and three of them are crammed together near the top of the circle. Take the one at 2,000 Hz. Its neighbors at 1,900 and 2,100 Hz are only 0.077 away on each side. (That's the straight-line distance between two points at radius 0.98 that are 4.5° apart: 2 × 0.98 × sin 2.25° = 0.077.) Its three mirror poles on the bottom half are about 1.96 away. The product of all five distances is

\[ 0.077 \times 0.077 \times 1.96 \times 1.96 \times 1.96 = 0.045 \]

so its multiplier is 1 ÷ 0.045 = 22. For the poles at 1,900 and 2,100 Hz, whose product is 0.089, the multiplier is 11. A lone pole pair, with only its mirror 1.96 away, has a multiplier of 0.5. So these crowded poles feel every rounding error 22 or 11 times over, where a lone pair would feel half of it.

Each coefficient's error gives its own push, and the pushes add up like arrows, so a push has a direction as well as a size.

Work one out by hand, for the 2,000 Hz pole at the very top of the circle, \(z = 0.98j\). Each rounded coefficient lifts \(P\) by its error times \(z^4\), \(z^2\) or 1. At the top of the circle those powers are plain numbers: \(z^2 = -0.96\) and \(z^4 = +0.92\).

| coefficient, and the power of z it multiplies | error | lift: error × power |
|---|---|---|
| 2.8576, times \(z^4 = +0.92\) | −0.0138 | −0.0127 |
| 2.7444, times \(z^2 = -0.96\) | +0.0056 | −0.0054 |
| 0.8858, times 1 | −0.0108 | −0.0108 |

All three lifts are negative: every error pulls the curve the same way. In step four's figure the curve rises through its crossing, and lifting it slid the crossing backward, so each slide is minus the lift divided by the steepness. That makes three positive numbers, 0.0127, 0.0054 and 0.0108, each divided by the steepness. The steepness is step five's product \((p_1 - p_2)\cdots(p_1 - p_6)\), and for the top pole it has size 0.045 and points straight up, like \(j\). (Lesson 6: multiplying points adds their angles. The two short arrows, from the neighbors to the top pole, point left and right, 180° and 0°. The three long ones, from the bottom half, each point straight up, 90°. In all 450°, a full turn and 90° more: straight up.) Dividing takes that angle away again: a positive number, at 0°, divided by something at 90° ends up at −90°, pointing straight down. So all three pushes point down, toward the middle of the circle, with sizes of about 0.0127 ÷ 0.045 = 0.28, then 0.12 and 0.24. (The figure, which uses the unrounded product 0.0445, reads 0.286, 0.121 and 0.244.)

The other poles work the same way, with tilted arrows instead of straight ones.

The figure draws every push as an arrow on the circle, starting from the laptop pole.

[[diagram:push]]

The 1,900 Hz pole gets pushes of 0.143, 0.061 and 0.122, all pointing outward, for 0.32 in total. The 2,000 Hz pole gets twice as much, 0.65, all pointing inward. That's why the middle pair went in and its neighbors went out. Those totals are the straight-line rule of step four, and here it overshoots: the computer's real moves, from worked example 2, are 0.10 to 0.14, about a tenth. A move that big is far outside the "close to the root" picture, so the exact positions need the computer. But the rule gets the directions right, and its warning is right: these poles are nowhere near where you put them.

## The fix: keep each pair alone

So don't multiply them out. Build one notch at a time, the way lesson 6 did.

A **second-order section** is a filter that reaches back at most two samples on its input and its output. That means it holds one pole pair and one zero pair. Lesson 6's notch is one. So is lesson 8's all-pass. Here's the 1,900 Hz one, built from scratch:

- **The zero pair** sits on the circle at 85.5°, right on the whine. Lesson 6's recipe gives the input side \(1 - 2\cos 85.5°\, z^{-1} + z^{-2}\), which is \(1 - 0.1569\, z^{-1} + z^{-2}\).
- **The pole pair** sits just inside, at radius 0.98 and the same angle. The feedback side is \(1 - 0.1538\, z^{-1} + 0.9604\, z^{-2}\).
- **The volume factor** sets 0 Hz to 100%. Without it, the 0 Hz gain would be the top's sum over the bottom's:

\[ \frac{1 - 0.1569 + 1}{1 - 0.1538 + 0.9604} = \frac{1.8431}{1.8066} \]

  So the factor is the inverse, 1.8066 ÷ 1.8431 = 0.9802.

As a program, with the feedback moved back across the equals sign so its signs flip:

```
output[n] = 0.9802 × (input[n] - 0.1569 × input[n - 1] + input[n - 2])
          + 0.1538 × output[n - 1] - 0.9604 × output[n - 2]
```

The figure labels each of these numbers with what it controls. The 0.1569 sets the zeros' angle, the 1s keep them on the circle, the 0.9604 is the poles' radius squared, the 0.1538 sets their angle, and the 0.9802 sets the volume.

[[diagram:section]]

Then run the three sections one after another, the output of the first feeding the input of the second, and so on. Filters run one after another, each one's output feeding the next one's input, are called a **cascade**. The figure shows the three sections in a row, each with its own little circle.

[[diagram:cascade]]

On paper a cascade is the same filter as the multiplied-out rule, since the system functions multiply either way. On the chip it's different, because each section's coefficients are stored and rounded on their own.

Keep each volume factor out of its section for now. Then every section's biggest number is 1, so the chip can use a step of 1/64. (You could fold the 0.9802 into the input side instead, so that every number is under 1 and the step is 1/128. That works too: the poles land at 0.9803. Keeping the factors apart has one advantage, which comes up below.) Here is the 1,900 Hz section before and after:

| | input side | feedback side |
|---|---|---|
| on the laptop | 1, −0.1569, 1 | −0.1538, 0.9604 |
| stored, step 1/64 | 1, −0.15625, 1 | −0.15625, 0.953125 |
| as whole numbers | 64, −10, 64 | −10, 61 |

The 2,000 Hz section has 0 in place of ∓0.15625, and the 2,100 Hz section has the signs flipped. Where do the poles land?

| section | pole on the laptop | pole on the chip |
|---|---|---|
| 1,900 Hz | radius 0.98, 1,900 Hz | radius 0.9763, 1,898 Hz |
| 2,000 Hz | radius 0.98, 2,000 Hz | radius 0.9763, 2,000 Hz |
| 2,100 Hz | radius 0.98, 2,100 Hz | radius 0.9763, 2,102 Hz |

Every pole moved by less than 0.004, and inward. Check it against the derivation. The 0.9604 was rounded down by 0.0073, and a lone pair's multiplier is 1 ÷ 1.96, so the rule predicts a move of 0.0037. The real move is 0.0037. When a pole is alone, the simple rule matches to four decimal places.

The zeros barely move either. They land at 1,900.4, 2,000 and 2,099.6 Hz, still on the circle. The whine at 2,000 Hz is removed completely, and the whines at 1,900 or 2,100 Hz keep only 1.3%. For the rounded sections, the three volume factors combine into one number, 0.931, stored once as 119/128 = 0.9297. With that, the voice keeps 99.5% at 1,500 Hz and 95.3% at 1,800 Hz, and 0 Hz comes out at 99.85%.

Two questions the book asks about any cascade: does the order of the sections matter, and can the signal grow too big between them? Without its volume factor, each section boosts its loudest tone by up to 2.8%, two sections in a row by up to 5.1%, whichever two come first. That's where the separate factors pay off. Put the combined 0.9297 at the very front of the cascade. Then nothing inside the cascade ever gets bigger than 0.9297 × 1.051 = 0.98 times the input's size, so a steady tone never outgrows the chip between sections, in any order. (A sudden worst-case input can briefly reach about twice its size between sections, which is why real chips leave a little headroom.)

## Would more bits save it?

The obvious objection: buy a better chip with more bits. That works, eventually. But look at how long it takes. The chart puts the multiplied-out rule on chips with more and more bits per coefficient. Across the bottom are the bits, from 8 to 16. Up the side is the largest pole radius, with a line at 1 for the unit circle.

[[diagram:bits]]

| bits per coefficient | step | where the poles land |
|---|---|---|
| 8 | 1/32 | two pairs outside, at 1.0567: the hum |
| 9 to 12 | 1/64 to 1/512 | one pair exactly on the circle at 2,000 Hz |
| 13 | 1/1,024 | all three pairs between 0.9797 and 0.9805 |
| 16 | 1/8,192 | all three pairs between 0.9798 and 0.9805 |

From 9 to 12 bits, the rule is balanced on the edge. One pole pair lands exactly on the unit circle at 2,000 Hz: a ring that never dies. In exact arithmetic it would stay silent, because one of the zeros sits on exactly the same spot and cancels it. But remember the other rounding, of every product the chip computes. That tiny noise enters the feedback loop after the zeros have done their work, and nothing cancels it there. So on a real chip the pole on the circle would ring forever. The zeros aren't right either. At 8 bits they had collapsed onto 2,000 Hz; at 9 bits they've come back only to 1,917.8 and 2,082.2 Hz, so the whines at 1,900 and 2,100 Hz still get through. Only at 13 bits do all six poles come back close to where you put them, and even then the improvement isn't steady: at 14 bits two of them wander off again before 15 bits settles them.

Each extra bit doubles the number of values a coefficient can take, and costs chip area and power in every multiplier. A sharper filter, with poles crowded closer, would demand even more. The cascade fixes the cause instead: it stops crowding the poles into one polynomial, and it's happy at 8 bits.

## Your turn

Now you put the filter on the chip yourself. The lab's exchange runs a hotter clock chip than yours, so its whine hops between three pitches of its own. Find them on the lab's chart of how strong each tone in the call is: zoom in until you can read each pitch to within a few hertz.

1. Load the multiplied-out rule onto the 8-bit chip and play a call. Watch the poles cross the rim, and hear the hum build.
2. Switch to a cascade of three second-order sections. For each one, place its zero pair on a whine and its pole pair just inside at the same angle, the way you built the 1,900 Hz section above. The lab computes the volume factors and lets the chip round everything.
3. You're done when all three of these hold on the chip:
   - every pole is inside the unit circle;
   - the whine is under 2% at each of its three pitches;
   - the voice at 1,500 Hz is above 95%.

[[lab-act2]]

## What people get wrong

It's natural to think that tiny rounding errors can only cause tiny trouble: the chip is off in the third decimal place, so the filter should be too. That's what happened to lesson 6's notch. But the size of the damage isn't the size of the error. A pole moves by the error times one over the product of its distances to the other poles. For a lone pair that multiplier is 0.5. For these crowded poles it's 11 and 22. And the damage isn't smooth. A pole at 0.98 and a pole at 1.0567 aren't slightly different filters: one rings and dies, the other hums forever. Stability is a line, and a small push in the wrong place carries you across it.

## Recap

- A **coefficient** is a fixed number in a filter's rule that a sample is multiplied by. The filter is its coefficients.
- **Quantization** rounds each one to the nearest value the chip can store. With 8 bits, that's a whole number from −128 to 127 times a step, and one big coefficient forces a coarse step on all of them.
- A pole moves by the rounding error times one over the product of its distances to the other poles. That multiplier is 0.5 for a lone pair, and 11 to 22 for crowded ones.
- Multiplying notches into one rule makes the coefficients big and the poles crowded. On the 8-bit chip, two pole pairs land outside the circle: the hum.
- A **cascade** of **second-order sections** is the same filter, built so each pole pair is rounded alone, and it survives the chip.

## Next on the line

The chips go out, every exchange runs the cascade, and the whine is gone for good. Then the wideband line from lesson 5 starts to misbehave. Its anti-aliasing filter is supposed to stop everything above the limit before the rate drops. Instead it lets a faint ripple of high tones leak through: a test sweep above 4,000 Hz comes out as a ghost gliding down through the voices, and the top of every wideband voice arrives a little too loud. You can't simply make it stricter: on paper, it's already ideal. What's wrong with ideal? That's the next bug.
