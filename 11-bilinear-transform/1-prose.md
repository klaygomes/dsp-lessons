# The Exchange That Moved

## A copy that came out wrong

In the basement sits the old analog exchange, racks of relays, coils and capacitors, older than anyone who works there. This month it's being switched off. Before it goes, your boss has one request. Every customer is used to how calls through the exchange sound, and the new digital line should sound exactly the same.

The part that shapes the sound is the exchange's line filter, a low-pass. Its manual is still in a drawer, and it describes the filter in full: a "second-order Butterworth" with a cutoff of 3,400 Hz. A colleague has a script that turns an analog filter into a digital one, the textbook recipe. You give it the manual's numbers, it hands back five coefficients, and you install the result on your line.

The next morning a technician runs the standard test. She plays pure tones through the old exchange, which is still connected for one more week, and through your new filter. Then she writes down how much of each gets out.

| tone | 1,000 Hz | 2,000 Hz | 3,000 Hz | 3,400 Hz |
|---|---|---|---|---|
| old exchange | 99.6% | 94.5% | 78.9% | 70.7% |
| your copy | 99.5% | 87.2% | 29.2% | 10.2% |

At 1,000 Hz the copy is perfect. Higher up it falls apart: at 3,400 Hz, the exchange passes 71% and your copy passes 10%. Callers on the new line sound dull, as if the top of every voice had been shaved off.

She sweeps a tone slowly upward to find where your copy passes 71%, the point the manual calls the cutoff. It's 2,363 Hz. Not 3,400. And the damage isn't even. The low tones are nearly right, the high tones are dragged down, and the higher a tone, the further it's dragged. The picture below draws her two rows as curves, with a line at 71% that the exchange crosses at 3,400 Hz and the copy at 2,363 Hz.

[[diagram:overlay-bug]]

The script did exactly what the recipe says. So what does the recipe do to frequencies?

## A filter without samples

To answer that, we need a new kind of filter. Every filter so far has worked on samples: lists of numbers, 8,000 of them per second. The exchange never sampled anything. Its sound is a voltage in a wire, changing smoothly, every instant. Its filter is a circuit of capacitors and coils that this voltage flows through. A filter like that, which works on the smooth voltage itself with no samples at all, is an **analog filter**.

The next picture puts the two side by side: a smooth voltage through a box of capacitors and coils, and lesson 4's dots through a digital filter. The digital frequency axis stops at 4,000 Hz; the analog one runs off the page.

[[diagram:analog]]

Without samples, there's no wheel, because there is no "per sample". And so there's no limit either. An analog filter has a response to 1,000 Hz, to 4,000 Hz, to 10,000 Hz, to a million hertz: every frequency from 0 all the way up exists for it.

For this lesson you need only one fact about analog filters. It's the same fact lesson 3 taught you about our line: an analog filter is completely described by its response at each frequency in Hz. We'll write analog frequencies with a capital F, to keep them apart from the digital tones, which we'll keep writing as lowercase f.

The exchange's manual gives the gain of its filter as a formula:

\[ \text{gain}(F) = \frac{1}{\sqrt{1 + (F / 3400)^4}} \]

Let's read it at a few frequencies. At F = 0 the fraction is 1: the filter passes 0 Hz whole. At F = 3,400 Hz the bottom is \(\sqrt{2}\), so the gain is 0.707, 71%. That's where the manual puts the cutoff. Lesson 4 called the cutoff the tone where a filter switches from keeping to removing, and for the exchange's kind of filter, the cutoff is where it passes 71%. (In lesson 10's units, 71% is −3 dB.) Above the cutoff the fourth power takes over and the gain falls fast. That fourth power is what "second-order" buys. A filter's order counts the capacitors and coils that store energy in its circuit, here two, and a Butterworth's gain has the frequency raised to twice its order.

| F (Hz) | 0 | 1,000 | 2,000 | 3,000 | 3,400 | 5,000 | 10,000 |
|---|---|---|---|---|---|---|---|
| exchange gain | 1.000 | 0.996 | 0.945 | 0.789 | 0.707 | 0.420 | 0.115 |

There's the first row of the technician's table. The analog filter you start from, the one whose response you want to copy into a digital filter, is the **analog prototype**. Here it's the exchange's filter. The next picture is its gain curve from 0 to 10,000 Hz, with a wall at 4,000 Hz where your line stops. The curve sails straight past the wall.

[[diagram:prototype]]

Why copy an analog filter at all? Because a century of engineers left behind a catalog of them. Butterworth, the name in the manual, is one family: as flat as possible below the cutoff. Pick a proven design, then translate it.

## A ruler and half a circle

Now picture the mismatch. Analog frequencies live on a ruler: 0 at one end, and then on forever, 1,000, 10,000, a million.

Digital tones live on half a circle. It's the wheel from lesson 3, where a tone is a dot turning 360° × tone ÷ 8,000 per sample. Lesson 6 marked every tone on that wheel at once and called it the unit circle, so it's one and the same picture. 0 Hz sits at the right, 2,000 Hz at the top, and 4,000 Hz, the limit, at the far left. Every digital filter you've built is a fraction in z, and its response at a tone is read off at that tone's point on the circle.

So copying an analog filter means deciding where on the half circle each mark of the infinite ruler goes.

One way fails, and you know it from lesson 4. If you simply sample the analog filter's response at the line's sample moments, the ruler gets wrapped around the circle again and again. 5,000 Hz lands where 3,000 Hz is. That's aliasing.

The other way is to squeeze. Near 0 Hz, lay the ruler on the circle almost one for one: 500 Hz on the ruler lands very close to the circle's 500 Hz point. Further along, compress the ruler more and more. The whole infinite rest of it crowds into the last stretch before 4,000 Hz, and infinity itself lands exactly on 4,000 Hz. Nothing wraps, so nothing aliases. That's what the textbook recipe does.

The picture below shows both ways at once. On the left, the ruler wrapped around and around the circle, with 5,000 Hz landing on top of 3,000 Hz. On the right, the same ruler bent onto the half circle once, its ticks evenly spaced near 0 Hz and bunching tighter and tighter toward 4,000 Hz.

[[diagram:wrap-vs-squeeze]]

## The squeeze, in numbers

The textbook recipe is called the **bilinear transform**. It's a substitution that turns an analog filter's formula into a digital filter's. Along the way, it squeezes all analog frequencies, from 0 to infinity, onto the digital tones from 0 to 4,000 Hz. First, what it does to frequencies, because that's the bug.

An analog frequency F lands on the digital tone

\[ f = \frac{8000}{\pi}\arctan\!\left(\frac{\pi F}{8000}\right) \]

It falls out of the derivation later. For now you need only the shape of arctan. Feed it a small number and you get almost the same number back. Feed it bigger and bigger numbers and the answer creeps toward a ceiling it never passes, \(\pi/2\), which is 90° in lesson 6's radians. Multiply that ceiling by 8,000 ÷ π and you get 4,000 Hz. The picture below is arctan's curve: a straight start along the diagonal, then a bend, then a flat approach to the ceiling.

[[diagram:arctan]]

So: a straight start, then a squeeze, then 4,000 Hz at infinity. Let's run it.

| analog F (Hz) | lands on digital f (Hz) | moved by |
|---|---|---|
| 0 | 0 | 0 |
| 500 | 494 | −6 |
| 1,000 | 953 | −47 |
| 2,000 | 1,695 | −305 |
| 3,000 | 2,208 | −792 |
| 3,400 | 2,363 | −1,037 |
| 5,000 | 2,800 | −2,200 |
| 10,000 | 3,365 | −6,635 |
| 20,000 | 3,678 | −16,322 |
| 100,000 | 3,935 | −96,065 |
| 1,000,000 | 3,994 | −996,006 |

Read down the second column. Low frequencies barely move: 500 Hz lands at 494 Hz. By 2,000 Hz the squeeze is obvious, and the exchange's cutoff, 3,400 Hz, lands at 2,363 Hz. There's your bug, in one row. Then everything above crowds in: the whole stretch from 10,000 Hz to a million hertz is packed into the 629 Hz between 3,365 and 3,994.

That uneven squeeze of analog frequencies onto digital tones, gentle at the bottom and ever tighter toward 4,000 Hz, is **warping**.

The next picture is the warping curve itself: analog F along the bottom, from 0 to 20,000 Hz, and digital f up the side, from 0 to 4,000 Hz. A thin diagonal shows where "no squeeze" would be. The curve hugs the diagonal at first, then bends away and flattens under a ceiling at 4,000 Hz. Read it upward, from the analog axis to the curve and across, and you get where a frequency lands. 3,400 Hz goes up and across to 2,363 Hz.

[[diagram:warping]]

And here is the rule that makes the whole thing usable. The bilinear transform never changes a gain; it only moves gains to new tones. The digital filter's response at a tone f is exactly the analog prototype's response at the frequency F that lands on f. Not roughly. Exactly. So the copy passes 71% wherever 3,400 Hz landed, at 2,363 Hz.

You can also read the curve the other way: start at a digital tone, go across to the curve and down, and you get the analog frequency that lands there. In numbers, that's the same formula run backward, with tan in place of arctan:

\[ F = \frac{8000}{\pi}\tan\!\left(\frac{\pi f}{8000}\right) \]

Let's use it to check one more of the technician's numbers. Her 3,000 Hz digital tone gives \(F = 2546.5 \times \tan(1.1781) = 2546.5 \times 2.4142 = 6{,}148\) Hz. The exchange's formula at 6,148 Hz gives 29.2%. That's the second row of her table.

Now drag a mark along the analog ruler yourself and watch where it lands on the circle.

[[lab]]

## Before the derivation: two kinds of radian

Where does the arctan come from? The derivation is from chapter 7 of Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), the book this course follows. It uses three things from lesson 6, so here they are in one line each. A digital tone turns \(\omega = 2\pi f / 8000\) radians per sample, so \(\pi\) means 4,000 Hz. Multiplying by \(j\) turns a quarter turn counter-clockwise. And an arrow \(e^{j\theta}\) plus its mirror arrow \(e^{-j\theta}\) lies flat, \(2\cos\theta\), while the arrow minus its mirror points straight up: it's \(2j\sin\theta\), of length \(2\sin\theta\).

[[diagram:arrows]]

One thing is new. An analog tone has no samples to count turns by, so we count its turning per second instead. A tone of F hertz turns \(\Omega = 2\pi F\) radians per second, written with a capital omega. So there are two kinds of radian in this lesson: \(\omega\), radians per sample, for digital tones, and \(\Omega\), radians per second, for analog ones. The picture below sets the two axes side by side: \(\omega\) runs from 0 to \(\pi\) and stops, \(\Omega\) runs from 0 to infinity.

[[diagram:two-radians]]

## Why the squeeze has to look like this

**Step one: an analog filter is a fraction too.** Here we take one fact from circuit theory on trust. For a tone of F hertz, the current through a capacitor is proportional to \(j \cdot 2\pi F\) times the voltage across it: bigger for higher tones, and turned a quarter turn. Solve any circuit of resistors, capacitors and coils with that rule and its response comes out as a fraction, with powers of \(j 2\pi F\) on top and bottom. The book gives that quantity its own letter, \(s = j 2\pi F\). The exchange's filter, written this way, is

\[ H(s) = \frac{\Omega_c^2}{s^2 + \sqrt{2}\,\Omega_c\, s + \Omega_c^2}, \qquad \Omega_c = 2\pi \cdot 3400 \]

Here \(\Omega_c\) is the cutoff in radians per second. The highest power of \(s\) is 2: that's the order. Is this the same filter as the manual's gain formula? Let's check. Write \(u = F/3400\), so a tone of F hertz is \(s = j\Omega_c u\). The bottom becomes

\[ -\Omega_c^2 u^2 + j\sqrt{2}\,\Omega_c^2 u + \Omega_c^2 = \Omega_c^2\left[(1 - u^2) + j\sqrt{2}\,u\right] \]

Its length squared is \((1 - u^2)^2 + 2u^2 = 1 + u^4\). The \(\sqrt{2}\) is exactly what makes the two \(u^2\) terms cancel. So the size of H is \(1/\sqrt{1 + (F/3400)^4}\): the manual's formula. The picture below draws the analog ruler as the line where \(s = j2\pi F\), and shows H's size along that line tracing out the gain curve.

[[diagram:s-line]]

**Step two: the substitution.** A digital filter is a fraction in z, from lesson 6, and on the unit circle \(z = e^{j\omega}\). The bilinear transform replaces every \(s\) in the analog formula by

\[ s = 2 \cdot 8000 \cdot \frac{1 - z^{-1}}{1 + z^{-1}} \]

It's "bilinear" because this is one straight-line expression in \(z^{-1}\) divided by another. A fraction in \(s\), with \(s\) replaced by a fraction in \(z^{-1}\), is still a fraction in \(z^{-1}\). That's why the recipe exists: it always produces a filter you can run. We'll count out the exchange's five coefficients in a moment. The picture below shows the machine. The manual's formula in \(s\) goes in, and the substitution is the box. Out comes a program with inputs on one side and feedback on the other.

[[diagram:bilinear]]

**Step three: what it does on the circle.** Put in a digital tone, \(z = e^{j\omega}\), and look at the fraction. Multiply its top and bottom by \(e^{j\omega/2}\):

\[ \frac{1 - e^{-j\omega}}{1 + e^{-j\omega}} = \frac{e^{j\omega/2} - e^{-j\omega/2}}{e^{j\omega/2} + e^{-j\omega/2}} = \frac{2j\sin(\omega/2)}{2\cos(\omega/2)} = j\tan(\omega/2) \]

The middle step is the arrow and its mirror, with \(\theta = \omega/2\). The top is an arrow minus its mirror, pointing straight up. The bottom is an arrow plus its mirror, lying flat.

**Step four: a digital tone becomes an analog frequency.** So on the circle the substitution says \(s = j \cdot 16000 \tan(\omega/2)\). That's \(j\) times a real number, exactly the form \(s = j 2\pi F\) of an analog tone. Every digital tone is handed exactly one analog frequency:

\[ 2\pi F = 16000 \tan(\omega/2) \]

This is why the gains are copied exactly. The digital filter at tone f computes the analog formula at the frequency F, so it gets the analog answer at F.

**Step five: in hertz.** Put \(\omega = 2\pi f/8000\) and solve, both ways:

\[ F = \frac{8000}{\pi}\tan\!\left(\frac{\pi f}{8000}\right), \qquad f = \frac{8000}{\pi}\arctan\!\left(\frac{\pi F}{8000}\right) \]

There are the two formulas we've been using, forward and backward. As f climbs to 4,000 Hz, \(\pi f / 8000\) climbs to \(\pi/2\), and the tangent shoots to infinity. The whole ruler fits.

**Step six: why the 2 × 8,000.** For small angles, \(\tan x \approx x\), so for low tones \(F \approx f\). The constant in front of the substitution, twice the sampling rate, is chosen for exactly this. The bottom of the ruler lands on the circle one for one, and only the top gets squeezed.

## What else the squeeze gives you

First, the far end of the ruler. The analog filter's gain heads to 0 as F heads to infinity, and infinity lands on 4,000 Hz. So the digital copy passes exactly 0% at 4,000 Hz. You'll see why in the formula in a moment: after the substitution, the top of the fraction is \((1 + z^{-1})^2\), which is zero at \(z = -1\). That's a double zero: two zeros sitting on the same point, the far left of the circle, lesson 6 style.

Second, the poles. The copy has feedback, so it has poles. For the filter your script built, they sit at a radius of 0.44 from the center, well inside the circle: stable. That isn't luck. An analog filter is stable in the same everyday sense as a digital one: tap the circuit and its ringing dies out. The book proves that the bilinear transform turns every stable analog filter into a stable digital one. We take that on trust and check the radius each time.

The picture below is lesson 6's unit circle with the script's filter on it. The double zero sits at the far left, and its pair of poles at radius 0.44. A dot for the tone sweeps the top half from 0 Hz to 4,000 Hz.

[[diagram:zplane]]

So the recipe never aliases, copies every gain exactly and stays stable. Its one catch is that it puts each gain at the wrong tone, and once you know where each lands, you can aim.

## Aim before you squeeze

You want the digital cutoff at 3,400 Hz, and the squeeze will move any analog cutoff down. So run the squeeze backward first. Ask which analog frequency lands on 3,400 Hz, and design the analog prototype with its cutoff there. That move is **prewarping**: choosing the prototype's cutoff by running the warping formula backward from the digital tone you want.

Before you compute it, guess. The exchange's cutoff was 3,400 Hz and it landed a thousand hertz low. Will the right prototype cutoff be 4,400 Hz? 5,000?

The picture for it is the warping curve again, read the other way. Start at 3,400 Hz on the digital axis, go across to the curve, then down to the analog axis, and read off the prototype's cutoff.

[[diagram:prewarp]]

\[ F = \frac{8000}{\pi}\tan\!\left(\frac{\pi \cdot 3400}{8000}\right) = 2546.5 \times \tan(1.3352) = 2546.5 \times 4.1653 = 10{,}607 \text{ Hz} \]

Over ten thousand. To land a digital cutoff at 3,400 Hz, you design an analog filter with its cutoff at 10,607 Hz. That's more than three times higher, far above anything the line can carry. It sounds absurd until you recall that 3,400 Hz sits deep in the squeezed part of the table.

Now build it. Put \(s = 16000\,(1 - z^{-1})/(1 + z^{-1})\) into the manual's formula, multiply top and bottom by \((1 + z^{-1})^2\), and collect the powers of \(z^{-1}\). With \(K = 16{,}000\):

\[ H(z) = \frac{\Omega_c^2\,(1 + 2z^{-1} + z^{-2})}{(K^2 + \sqrt{2}\,\Omega_c K + \Omega_c^2) + (2\Omega_c^2 - 2K^2)\,z^{-1} + (K^2 - \sqrt{2}\,\Omega_c K + \Omega_c^2)\,z^{-2}} \]

With the prewarped \(\Omega_c = 2\pi \cdot 10{,}607\), in units of a billion, the top is 4.4415 and the bottom terms are 6.2055, 8.3711 and 3.1895. Divide everything by 6.2055 and read it as a program:

\[ y[n] = 0.7157\,x[n] + 1.4315\,x[n-1] + 0.7157\,x[n-2] - 1.3490\,y[n-1] - 0.5140\,y[n-2] \]

Check 0 Hz with a pencil. Feed in a constant 1 and the output settles where \(y = 0.7157 + 1.4315 + 0.7157 - 1.3490\,y - 0.5140\,y\), so \(y = 2.8629 / 2.8630 = 1.000\). It passes 0 Hz whole. Its poles sit at radius 0.72, near the 3,560 Hz point: stable. The next picture shows a click going in and the echo coming out as stems, flipping sign and dying, with the new poles on the circle beside the old ones.

[[diagram:echo]]

And the tones:

| tone | 1,000 Hz | 2,000 Hz | 3,000 Hz | 3,400 Hz | 3,800 Hz | 4,000 Hz |
|---|---|---|---|---|---|---|
| prewarped copy | 100.0% | 99.8% | 94.8% | 70.7% | 10.7% | 0% |

70.7% at 3,400 Hz. The cutoff is back where the manual says. You changed one number: 10,607 instead of 3,400. That's the whole fix, and it works for any prototype and any tone. Compute where that tone must come from on the ruler, and put the prototype's cutoff there.

Why does the prewarped copy look the way it does? The picture below shows the 10,607 Hz prototype's own gain curve from 0 to 20,000 Hz being squeezed onto the line. Its whole stretch from 0 to 10,607 Hz lands in 0 to 3,400 Hz, and that stretch is nearly flat.

[[diagram:squeezed-prototype]]

## Your turn

The technician is waiting with her test tones. In the lab you have the exchange's filter formula, the bilinear transform, and one knob: the analog prototype's cutoff, from 1,000 Hz up to 20,000 Hz. The lab marks the exchange's 71% point, as she measured it on the real rack. A second marker shows the copy's 71% point and moves with the knob. Your job:

1. Predict what the fix will cost, then set the knob.
2. Make the digital copy pass 71% at the exchange's cutoff, within one percentage point.

You're done when the technician's meter reads 71% at the exchange's cutoff and the copy's marker sits on the exchange's.

[[lab-act2]]

## What people get wrong

After prewarping, it's tempting to believe the copy now matches the exchange everywhere. It doesn't. Prewarping pins one frequency, the one you aimed at, and every other frequency still gets squeezed.

Look at 3,000 Hz. The exchange passes 78.9%, and the prewarped copy passes 94.8%. Why? Digital 3,000 Hz is where analog 6,148 Hz lands. The 10,607 Hz prototype barely touches 6,148 Hz, so almost all of it passes. Below the cutoff the copy is flatter. Above it the copy is steeper: it reaches 0% at 4,000 Hz, where the exchange still passed 58.6%. The bilinear transform copies the response along the ruler, and the ruler is squeezed. You choose which point lines up; you don't get them all.

The picture below overlays all three curves: the exchange, the script's copy, and the prewarped copy. All three cross the 71% line: the exchange and the prewarped copy together at 3,400 Hz, the script's copy at 2,363 Hz. The gaps at 3,000 Hz and at 4,000 Hz are marked.

[[diagram:overlay]]

So your boss's "exactly the same" was never on offer. Why is pinning the cutoff the right compromise? Because the cutoff is the one number that defines this filter. It's in the manual, it's what the technician measures, and it's where a voice stops sounding bright. Below it, the prewarped copy never differs from the exchange by more than 1.6 dB; the largest gap is near 3,030 Hz. Above it sit only the top 600 Hz of the line, where a voice has little left to say.

Pin some other tone and you pay where it matters most. Pin 3,000 Hz instead, so the copy passes 78.9% there like the exchange. Digital 3,000 Hz comes from analog 6,148 Hz, and the exchange's gain depends only on F ÷ cutoff. So the prototype needs 6,148 ÷ cutoff = 3,000 ÷ 3,400, which gives a cutoff of 6,148 × 3,400 ÷ 3,000 = 6,967 Hz. That prototype's cutoff lands at 3,108 Hz, letting through only 40% at 3,400 Hz. One knob pins one point.

## Recap

- An **analog filter** works on a smooth voltage with no samples; it has a response at every frequency in Hz, from 0 to infinity.
- The **analog prototype** is the analog filter whose response you copy.
- The **bilinear transform** swaps \(s\) for \(2 \cdot 8000\,(1 - z^{-1})/(1 + z^{-1})\). A stable analog filter always gives a buildable, stable digital one, and the digital gain at f is exactly the analog gain at \(F = (8000/\pi)\tan(\pi f/8000)\).
- **Warping**: the analog ruler is squeezed onto the half circle, low frequencies barely moving, infinity landing on 4,000 Hz. The exchange's 3,400 Hz lands at 2,363 Hz.
- **Prewarping**: run the formula backward from the tone you want. For 3,400 Hz, design the prototype at 10,607 Hz. It pins that one frequency, not the whole curve, and the cutoff is the frequency worth pinning.

## Next on the line

The line sounds like the old exchange again, at least where it counts. And now that the exchange is gone, an old feature has to move to the digital side too. When a customer presses a key on their phone, the keypad sends two tones at once: a low one for the key's row and a high one for its column. The exchange used to listen for them with a bank of little analog filters. Your line has to do it now, from the samples alone. A caller presses a key. You get a few hundred numbers. Which key was it? That's the next bug.
