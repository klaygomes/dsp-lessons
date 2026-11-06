# Ghosts on the Wideband Line

## A new neighbor

Your phone line is in good shape. Lesson 4 fixed the whistle by putting a low-pass filter in front of the sampler. It passes low tones and removes high ones, so no tone above 4,000 Hz gets in to come back as an alias. Calls are clean.

Then the company makes a deal. A wideband line wants to connect to yours. Its phones take 16,000 samples per second, so they carry tones up to 8,000 Hz, with all the hiss of an "s" intact. Your job is the bridge between the two: 8,000 numbers a second go in on your side, 16,000 have to come out on theirs.

The bridge goes live on Monday. On Tuesday the tickets arrive, all from wideband customers calling people on your line. "There's a second voice under every voice, thin and high, like someone whispering through a tin can." "When my mother talks, something squeaks along with her, and it goes *down* when her voice goes *up*."

That last one sounds like nonsense, so you test it. A colleague on your line hums a steady 1,000 Hz, and you put the wideband side on a frequency meter, a display of how strong each tone is. The meter shows the 1,000 Hz hum, but at only half the height it should have. It also shows a second tone, just as strong, at 7,000 Hz. Your colleague slides the hum down to 500 Hz. The second tone slides *up*, to 7,500 Hz.

[[diagram:meter]]

So the customer was right: every voice from your line arrives with a ghost above 4,000 Hz that moves the opposite way. Your line can't even store 7,000 Hz. Where does it come from?

## The obvious bridge

Here is the bridge the previous engineer wrote, the first thing anyone would write. The wideband side wants two numbers for every one you have, so pass each sample through and put a zero between every two.

```
in:   a     b     c     d
out:  a  0  b  0  c  0  d  0
```

That's all, and it has a name: to **upsample** by 2 is to put one zero between every two samples, so 8,000 samples per second become 16,000. The zeros are placeholders: "I don't know what happened here, so I'll say nothing."

[[diagram:upsample]]

It looks harmless. The zeros are silence, and your samples are untouched, yet the meter showed a second tone. To see where it comes from, we need to see a tone at twice the sampling rate.

## The wheel, at two speeds

You know the wheel from lesson 3. A tone is a dot turning 360° × tone ÷ 8,000 per sample. Its samples are the dot's left-right position, +1 at the far right and −1 at the far left. A 1,000 Hz tone turns 45° per sample, and the 4,000 Hz tone at the limit turns 180°, a flip. Two more facts we'll need. When the dot sits at angle θ, its left-right position is cos θ, and its up-down position is sin θ. That's what cosine and sine *are*: the dot's shadow on the horizontal line, and on the vertical one.

The 8,000 is the sampling rate: the samples are snapshots of a turning wheel. Take them twice as often and the dot moves half as far between two. So on the wideband line, at 16,000 samples per second, a tone is a dot turning 360° × tone ÷ 16,000 per sample.

| tone | turn per sample at 8,000/s | turn per sample at 16,000/s |
|---|---|---|
| 1,000 Hz | 45° | 22.5° |
| 2,000 Hz | 90° | 45° |
| 4,000 Hz | 180°, a flip | 90° |
| 7,000 Hz | 315°, same as 45° backwards | 157.5° |
| 8,000 Hz | 360°, no visible turn | 180°, a flip |

On your line, 7,000 Hz turns 315°, the same spot as 45° backwards. A dot turning backwards casts the same left-right shadow as one turning forwards, so 7,000 Hz is stored as its alias, 1,000 Hz. On the wideband line it turns 157.5°, less than half a turn, a real tone. And the flip, the limit, has moved up to 8,000 Hz.

[[diagram:wheel-two-speeds]]

Notice one more thing in the table. On the wideband line, 1,000 Hz turns 22.5° and 7,000 Hz turns 157.5°. Together that's exactly 180°, a flip. Keep it in mind for the next section.

## One tone through the bridge

Let's push your colleague's 1,000 Hz hum through the bridge. On your line, the dot turns 45° per sample, so the samples are 1.00, 0.71, 0.00, −0.71, −1.00, and so on. The bridge spreads them out and puts a zero in each gap. Call the wideband sample number m, so your sample n lands at m = 2n. For comparison, the true 1,000 Hz tone at 16,000 per second turns 22.5° per sample. The figure draws each sample as a stem, a vertical line from zero up or down to the sample's value, with the true tone as a smooth curve behind.

[[diagram:stems]]

Every even sample of the bridge output matches the true tone. Every odd sample, where the bridge said 0, is wrong. So what is the bridge output?

Here's the guess worth testing: half of 1,000 Hz plus half of 7,000 Hz, both on the wideband line.

| m | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| true 1,000 Hz | 1.00 | 0.92 | 0.71 | 0.38 | 0.00 | −0.38 | −0.71 | −0.92 | −1.00 |
| bridge output | 1.00 | 0 | 0.71 | 0 | 0.00 | 0 | −0.71 | 0 | −1.00 |
| half of 1,000 Hz | 0.50 | 0.46 | 0.35 | 0.19 | 0.00 | −0.19 | −0.35 | −0.46 | −0.50 |
| half of 7,000 Hz | 0.50 | −0.46 | 0.35 | −0.19 | 0.00 | 0.19 | −0.35 | 0.46 | −0.50 |
| sum of the halves | 1.00 | 0 | 0.71 | 0 | 0.00 | 0 | −0.71 | 0 | −1.00 |

The sum is the bridge output, number for number. Compare the two half rows: on even samples, the two halves are identical, so they add up to the full sample you sent. On odd samples, they are exact opposites, so they cancel to zero, and zero is what the bridge put there.

So the zeros weren't silence after all. Zeros in every other slot are exactly your tone at half height plus a second tone at half height. That's why the hum on the meter was at half height. The wideband phone plays both, and the second one is the ghost.

The wheel tells you why the halves behave like that. Look at both dots on one wheel first:

[[diagram:two-dots]]

Where is each dot at sample m? The 1,000 Hz dot has made m steps of 22.5°, so it sits at 22.5° × m. The 7,000 Hz dot has made m steps of 157.5°, and each of those steps is a flip followed by 22.5° backwards. So it sits at m flips plus −22.5° × m.

On even m, the flips pair up into whole turns and vanish. The 7,000 Hz dot sits at −22.5° × m: the 1,000 Hz dot's mirror spot below the horizontal line, as in lesson 4. (From one even sample to the next it moves 45° backwards, while the 1,000 Hz dot moves 45° forwards.) A mirror spot below the line has the same left-right shadow, so the two halves agree. On odd m, one flip is left over and throws the 7,000 Hz dot to the far side of the wheel, so its shadow is the opposite. Same, opposite, same, opposite: the pattern in the table.

Now play with it. In the lab, a slider moves the hum from 0 Hz to 4,000 Hz. You see both wheels turning, the samples with their zeros, and a meter from 0 to 8,000 Hz, and you can listen to the wideband side. Before each move, predict where the ghost will land, then check.

[[lab]]

## The mirror rule

1,000 Hz made a ghost at 7,000 Hz, and 500 Hz made one at 7,500 Hz. The wheel argument works for any tone, not just these two. If a tone turns φ per sample on the wideband line, the ghost turns 180° − φ, the rest of the flip. On the wideband line 180° is 8,000 Hz, so the ghost always sits at 8,000 Hz minus the tone. The two sit equally far either side of 4,000 Hz, your old limit, reflected across a mirror line there. One goes up, the other goes down, just like the customer's mother and her squeak. The mirror figure below shows a tone and its image sliding apart along a frequency line, folded across 4,000 Hz.

The ghost has a proper name. An **image** is a copy of a tone that upsampling creates at the mirror pitch, 8,000 Hz minus the tone. A phone voice lives between about 300 Hz and 3,400 Hz, so its images fill 4,600 Hz to 7,700 Hz. That's the whole voice again, upside down: the "whisper through a tin can".

[[diagram:mirror]]

Two more things follow. The table showed that the tone arrives at half height, and so does its image. And the image is not an accident that hits unlucky tones. It happens to every tone, and lesson 1's linearity does the rest. A voice is a sum of tones, so the bridge output is a sum of tones plus their images.

So, in lesson 3's language: after the zeros, every tone below 4,000 Hz needs a gain of 2, to give back the half it lost. Every tone above 4,000 Hz, where the images live, needs a gain of 0. That's a low-pass filter again, on the wideband line.

## Filling the gaps

The simplest idea: fill each zero with the average of its two neighbors. If the samples on either side are 1.00 and 0.71, the gap gets 0.85. The true value was 0.92, so that's close but not right.

[[diagram:fill]]

Notice what kind of rule that is. Each output sample is the zero-filled sample plus half of each neighbor: a convolution, from lesson 2, with the impulse response 0.5, 1, 0.5. The even samples come through untouched, because their neighbors are zeros; only the gaps get filled. And as a convolution, it has a frequency response, so we can find its gain for any tone.

Take a tone that turns φ per sample on the wideband line, so sample m is cos(φm). The rule adds the sample itself to half of the one before and half of the one after. A school identity says cos(a − b) + cos(a + b) = 2 cos a cos b. Apply it to the two neighbors, and their halves add up to cos φ × cos(φm). The output is

\[ \cos(\varphi m)\,\left(1 + \cos\varphi\right) \]

The same tone comes out, multiplied by 1 + cos φ. That's the gain. For a slow tone, φ is near 0 and the gain is near 2, exactly what we wanted. For a tone near 8,000 Hz, φ is near 180° and the gain is near 0. So the averaging is a low-pass filter. Is it good enough? The gain figure plots what that leaves of each tone, half of 1 + cos φ since the zeros already halved it, against the ideal: 100% up to 4,000 Hz, 0% above.

[[diagram:average-gain]]

Try the hum. 1,000 Hz turns 22.5°, so its gain is 1 + 0.924 = 1.92. It came out of the bridge at half height, so it ends at 0.96 of its original height. Its image at 7,000 Hz turns 157.5°, gain 1 − 0.924 = 0.08, and half of that is 0.04. The voice keeps 96%. The ghost drops to 4%.

Now try 3,000 Hz, where the "t" and "k" sounds live. It turns 67.5°: gain 1.38, so it ends at 69%. Its image at 5,000 Hz turns 112.5°: gain 0.62, so it ends at 31%, almost half as strong as the tone.

Why so much worse? 1,000 Hz and its image are 6,000 Hz apart, easy for a gentle filter to tell apart. 3,000 Hz and its image are only 2,000 Hz apart. The top of the voice, 3,400 Hz, is just 1,200 Hz from its image at 4,600 Hz. Separating those takes a gain curve that drops in a steep step at 4,000 Hz. The neighbor average slopes down gently across the whole range.

To step more steeply, a rule has to look at more samples. The bridge team has ready-made rules of the same kind, each output a weighted sum of nearby samples, that weigh 7, 15 or 31 samples instead of 3. Their weights come from a recipe for the perfect step at 4,000 Hz, cut off after that many samples; lesson 10 opens that recipe. The longer the rule, the steeper its step, as the figure shows.

[[diagram:gain-curves]]

Look closely at the long ones, though. Their curves overshoot a little just below 4,000 Hz, and wobble just above it in a small ripple. The 15-sample rule lets up to 9% through above 4,600 Hz. Going to 31 samples, about twice as long, only brings that down to 7%. (The lengths are odd so each rule has a middle sample.) Keep an eye on that ripple.

## The other direction

The bridge runs both ways. When a wideband customer calls your line, 16,000 samples a second must become 8,000, and the obvious bridge is just as short. To **downsample** by 2 is to keep every other sample and drop the rest, so 16,000 samples per second become 8,000.

Guess before you compute. The hiss of an "s" lives around 6,000 Hz, which your line can't carry. What arrives instead?

On the wideband line, 6,000 Hz turns 360° × 6,000 ÷ 16,000 = 135° per sample:

| m | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 6,000 Hz at 16,000/s | 1.00 | −0.71 | 0.00 | 0.71 | −1.00 | 0.71 | 0.00 | −0.71 | 1.00 | −0.71 | 0.00 |

Keep the even ones, m = 0, 2, 4, and so on, and number them again as n on your line:

| n | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| kept samples | 1.00 | 0.00 | −1.00 | 0.00 | 1.00 | 0.00 |

You've seen those numbers before. 1, 0, −1, 0 is the dot turning 90° per sample on your line: a 2,000 Hz tone. The downsample figure shows it on a wheel. Keeping every other sample means the dot turns twice as far between two kept samples, 270°, and 270° forwards lands exactly where 90° backwards would. That's an alias, straight out of lesson 4. Every "s" a wideband caller says arrives on your line as a 2,000 Hz squeal, at full height.

[[diagram:downsample]]

And where is 2,000 Hz? At 8,000 minus 6,000: the same mirror, across the same 4,000 Hz. Upsampling made a tone's mirror appear. Downsampling folds a tone onto its mirror.

Lesson 4 already taught the fix for this side: you can't remove an alias after sampling, because the true tone and its alias give the same samples. So the low-pass filter has to come *before* you drop the samples. On the wideband line, 6,000 Hz is still 6,000 Hz, above the cutoff, so a filter can still remove it. The same rule run after the drop would not even keep its cutoff: at 8,000 samples per second every tone turns twice as far per sample, so the rule's cutoff lands at 2,000 Hz instead of 4,000 Hz. This time its gain below 4,000 Hz is 1, not 2. Nothing was halved on the way down, so the voice should come out as it went in.

## Bigger steps

Why stop at 2? Upsample by 3, with two zeros after every sample, and you reach 24,000 samples per second, where the limit is 12,000 Hz. Your hum becomes 1, 0, 0, 0.71, 0, 0, 0.00, 0, 0, −0.71, and so on (the 0.00 is a real sample: the hum passes through the middle there). Where should the images sit? Each one sits the tone's distance either side of 8,000 Hz: 8,000 minus 1,000 and 8,000 plus 1,000. At 24,000 per second, 1,000 Hz turns 15° per sample, 7,000 Hz turns 105°, and 9,000 Hz turns 135°. Take a third of each:

| m | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| bridge output | 1.00 | 0 | 0 | 0.71 | 0 | 0 | 0.00 | 0 | 0 | −0.71 |
| third of 1,000 Hz | 0.33 | 0.32 | 0.29 | 0.24 | 0.17 | 0.09 | 0.00 | −0.09 | −0.17 | −0.24 |
| third of 7,000 Hz | 0.33 | −0.09 | −0.29 | 0.24 | 0.17 | −0.32 | 0.00 | 0.32 | −0.17 | −0.24 |
| third of 9,000 Hz | 0.33 | −0.24 | 0.00 | 0.24 | −0.33 | 0.24 | 0.00 | −0.24 | 0.33 | −0.24 |
| sum of the thirds | 1.00 | 0 | 0 | 0.71 | 0 | 0 | 0.00 | 0 | 0 | −0.71 |

The sum is the bridge output again. Now there are two images, at 7,000 Hz and 9,000 Hz, each at a third of the height, and the hum itself keeps a third. In general, upsampling by L makes L − 1 images of every tone, at each multiple of 8,000 Hz plus and minus the tone, up to the new limit. The filter afterwards needs a gain of L.

[[diagram:triple]]

Why doesn't upsampling by 2 have a 9,000 Hz image too? At 16,000 per second, 9,000 Hz is above the limit, and it turns 202.5° per sample, the same spot as 157.5° backwards. So it gives exactly the same samples as 7,000 Hz: it isn't a second image, just another name for the first. That's why the image for L = 2 is a single tone at half height, not two.

[[diagram:by-two]]

What matters most for your bridge is where the filter goes:

[[diagram:bridge]]

On the way up: put the zeros in first, then filter, because the images don't exist until the zeros make them. On the way down: filter first, then drop the samples, because once they're gone, the alias and the true tone can't be told apart. The step at 4,000 Hz is the same both ways. What changes is the place, and the gain: 2 after the zeros, 1 before the drop.

> **Optional: the same fact in the book's notation.** Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), the edition this course follows, treat changing the sampling rate in chapter 3. The book writes the upsampled signal as \(x_e[m]\) ("e" for expanded), equal to \(x[m/2]\) on even m and 0 on odd m, using the bracket notation from lesson 1. Your tone turns θ per sample on your line, so on the wideband line it turns \(\varphi = \theta / 2\), and on even slots \(x_e[m] = \cos(\varphi m)\). The sequence \((-1)^m\), a dot flipping 180° every sample, turns that into a switch: \((1 + (-1)^m)/2\) is 1, 0, 1, 0. So \(x_e[m] = \tfrac12 \cos(\varphi m) + \tfrac12 (-1)^m \cos(\varphi m)\). The flip figure shows the last step on the wheel: flipping a dot every sample while it turns φ forwards gives the same shadow as turning it \(180° - \varphi\). In symbols, \((-1)^m \cos(\varphi m) = \cos\big((180° - \varphi)\, m\big)\), which is the image. Downsampling, \(x_d[n] = x[2n]\), doubles the turn instead.

[[diagram:flip]]

## Your turn

Now you fix the bridge. The bridge team warms you up first on a smaller job, a walkie-talkie gateway whose spec you only see in the lab. Then comes your own bridge, where a recorded call waits in each direction. Your colleague's voice goes up to the wideband line, and a wideband caller full of "s" sounds comes down to yours. You choose the rule's length (none, the neighbor average, or the ready-made 7, 15 or 31; a 47-sample rule is on the shelf, over budget) and, going down, where it sits.

1. Going up: after the zeros, with a gain of 2, choose a length that clears the images.
2. Going down: put the same step, with a gain of 1, in the right place, before or after dropping the samples. Get it right, and no "s" lands on your line as a squeal.

The meter measures each tone's height at the output, as a share of the tone's height on the line it came from. Every voice tone from 300 Hz to 3,400 Hz must come out between 90% and 110%. Going up, every image, from 4,600 Hz to 7,700 Hz, must come out under 8%. Going down, every wideband tone that would fold onto the voice, from 4,600 Hz to 7,700 Hz, must also stay under 8%. The bridge chip can afford 31 weights per output sample, so any longer rule is over budget, however well it works. The lab measures every setting you try against the spec.

[[diagram:target]]

[[lab-act2]]

## What people get wrong

Upsampling sounds like an upgrade. Twice as many samples, room for tones up to 8,000 Hz: surely the call sounds richer now? It can't. Your line never stored anything above 4,000 Hz, so there is no hidden detail to recover. Above 4,000 Hz, all the bridge can produce is images, and the best bridge produces none. The "s" was lost the moment your line sampled it.

## Recap

- Upsampling by 2 puts a zero between every two samples; downsampling by 2 keeps every other sample.
- Upsampling turns every tone into itself at half height plus an **image** at 8,000 Hz minus the tone, also at half height: a mirror across 4,000 Hz.
- Downsampling folds every tone above 4,000 Hz onto the same mirror, as an alias.
- The fix is one step at 4,000 Hz in both directions. It goes after the zeros on the way up, with a gain of 2, and before dropping samples on the way down, with a gain of 1.
- The closer a tone sits to 4,000 Hz, the closer its image, and the longer the rule must be.

## Next on the line

The bridge is clean, apart from the small ripple of leftover image the 31-sample rule still lets through. Nobody has complained. Yet.

A week later, a new kind of ticket comes in, from your own customers. "There's a thin, high whine on every call." "It sounds like an old TV left on in the next room." You put a recording on the meter: a steady tone, exactly at 4,000 Hz, right on the mirror line, where a tone is its own image. A cheap clock chip somewhere in the line is leaking its tick into the audio. It doesn't come in through the microphone, so lesson 4's filter never sees it. It's born inside your samples. How do you remove one tone and leave the voice alone? That's the next bug.
