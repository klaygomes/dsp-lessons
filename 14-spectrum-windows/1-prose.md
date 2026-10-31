# The Keys That Blur

## A new complaint

Your keypad detector runs live. Every key sends a row tone and a column tone, and the DFT checks each block of samples against test wheels to find them (lesson 12). Thanks to the FFT (lesson 13), the cheap chip keeps up. It reads blocks of 256 samples, 32 milliseconds of sound, and looks at the eight bins where the keypad tones land.

| | 1,209 Hz | 1,336 Hz | 1,477 Hz | 1,633 Hz |
|---|---|---|---|---|
| **697 Hz** | 1 | 2 | 3 | A |
| **770 Hz** | 4 | 5 | 6 | B |
| **852 Hz** | 7 | 8 | 9 | C |
| **941 Hz** | * | 0 | # | D |

The rule comes from lesson 12. A tone counts when its bin's match clears the bar. A key counts only when exactly one row tone and one column tone clear it. The live bar is 12%. A match is a percentage of what a full-strength tone sitting exactly on its bin would score.

Then two complaints arrive. First, presses of 4 keep getting thrown away. In those blocks the 852 Hz bin, the row of 7, clears the bar along with 770 Hz. It looks like 4 and 7 at once, so the press is thrown out. Second, on a long, faint rural line, keys arrive at a tenth of their usual strength. Their bins score 7.7% to 10.2%, and the detector never hears them. Yet the engineers' spectrum screen, which plots every bin's match from 0 to 4,000 Hz, shows those keys plainly.

[[diagram:spectrum-screen]]

Easy, you think: lower the bar to 6%. The rural keys come through. But now every loud key in the top three rows clears the bar in two or three rows at once. Every one of those presses is thrown out, and many presses of *, 0 and # are too. Raise the bar back, and the rural line goes silent again.

On paper, the detector is fine. The bins are 8,000 ÷ 256 = 31.25 Hz apart, the closest keypad tones are 73 Hz apart, and every tone has its own bin. So why does a loud 4 light up the bin that belongs to 7?

Remember the spill from lesson 12, when 770 Hz landed between two bins and a little of it showed up next door? That's our suspect.

## Eight samples, two tones

Let's shrink the problem until it fits on a napkin. Take a block of only 8 samples. The bins are then 8,000 ÷ 8 = 1,000 Hz apart, so the test wheels sit at 0, 1,000, 2,000, 3,000 and 4,000 Hz.

First, a tone that lands right on a bin: 1,000 Hz.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 1,000 Hz | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 | 0.00 | 0.71 |

The matches at the five bins are 0%, 100%, 0%, 0%, 0%. One tone, one bin, everything else exactly zero. That's the picture lesson 12 started from.

Now move the tone halfway between two bins, to 1,500 Hz. Before you look, guess. Will the 1,000 and 2,000 Hz bins split it, half each, and the rest stay at zero?

[[predict-split]]

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 1,500 Hz | 1.00 | 0.38 | −0.71 | −0.92 | 0.00 | 0.92 | 0.71 | −0.38 |

| bin | 0 Hz | 1,000 Hz | 2,000 Hz | 3,000 Hz | 4,000 Hz |
|---|---|---|---|---|---|
| match | 25% | 60% | 70% | 30% | 25% |

Not even close. The two nearest bins catch 60% and 70%, and neither sees the full tone. Every other bin matches something too, even the 0 Hz bin, and nothing is playing anywhere near 0 Hz. (The 0 Hz and 4,000 Hz bins are their own mirrors, so a tone sitting exactly on one would score 200% on our scale. Their 25% is leak, not a quarter of a tone.) That spill finally gets its name. **Leakage** is the part of a tone that shows up in bins other than its own. It happens because the block ends partway through a turn.

[[diagram:leakage]]

What does "partway through a turn" mean? Look at the two tones across the block. The 1,000 Hz tone makes exactly one turn in 8 samples and ends ready to start again. The 1,500 Hz tone makes one and a half turns and stops halfway round.

[[diagram:mid-turn]]

Now let's see why stopping halfway spreads the tone into every bin.

## Two arrows per tone

First, a picture from earlier lessons. Remember the wheel from lesson 3: a tone is a dot turning counter-clockwise, 360° × tone ÷ 8,000 per sample, which is 45° for every 1,000 Hz. The sample is how far left or right the dot sits.

Lesson 6 added a second arrow. A real tone, the cosine we hear, is two half-size arrows. One turns counter-clockwise. Its mirror arrow turns clockwise at the same speed. Both go all the way round, but at every sample each is the other's reflection across the horizontal line: when one is above the line, the other is below it. So their up-down parts always cancel, and their left-right parts add up to the sample. You need both to make a real tone.

[[diagram:two-arrows]]

Lesson 12 showed what a bin does with the pair. Its test wheel turns every arrow back, and the turned arrows are laid tip to tail into a chain. For a tone on the bin, that freezes the counter-clockwise arrow, so its copies pile up into one straight chain. Call that the full pile. It's the 100% every match is measured against, and since each arrow is half-size, a full pile is N ÷ 2 long. The mirror arrow, meanwhile, now turns clockwise twice as fast, and its chain curls up to nothing. So every bin builds two chains, one from each arrow.

## The leftover arrow

When the tone and the test wheel turn at different speeds, the frozen arrows aren't frozen anymore. They keep turning at the difference between the two speeds. Lesson 12 called the arrow that carries it the leftover arrow.

Take the 1,500 Hz tone and the 1,000 Hz bin. The tone's counter-clockwise arrow turns 67.5° per sample. The test wheel turns it back 45°, so the leftover arrow turns 22.5° per sample. Over 8 samples that's 8 × 22.5° = 180°, half a turn.

[[diagram:leftover]]

Laid tip to tail, the 8 arrows fan out, the last one 157.5° from the first. They don't pile up into a straight chain. They don't close into a loop either, because half a turn isn't enough to come back around. The chain reaches 64% as far as a full pile.

So here's the rule hiding on the napkin:

> If the leftover arrow makes a whole number of turns during the block, the chain closes into a loop and adds nothing. If it doesn't, something is left over, and that's leakage.

Check it on the 1,000 Hz tone. Against the 2,000 Hz bin, its leftover arrow turns 45° per sample, 360° in 8 samples: exactly one turn, so the chain closes. Against 3,000 Hz it makes two turns and closes again. The mirror arrow's chains close too, because the mirror also makes whole turns against every bin. A tone on a bin makes whole turns everywhere, so it leaks nowhere.

## The second chain

Now the 1,500 Hz tone's mirror arrow. It turns −67.5° per sample, clockwise. The 1,000 Hz test wheel turns it back another 45°, so its leftover arrow turns −112.5° per sample. Over the block that's −900°, two and a half turns. Not whole, so this chain doesn't close either. It's a short chain, 15% long, because the arrows spin around fast and mostly cancel.

The bin's match is the length of the two chains joined end to end. If they point the same way, the lengths add: 64 + 15 = 79%. If they point opposite ways, they subtract: 64 − 15 = 49%. Which way each chain points depends on where the dot sits when the block begins. Our 1,500 Hz tone starts at the far right, at 1.00. From that start, the short chain points 112.5° away from the long one at the 1,000 Hz bin. That's more than a right angle, so it pulls partly backwards, and the match drops to 60%. At the 2,000 Hz bin the chains are 64% and 13%, only 67.5° apart, so the short one pulls partly forwards: 70%.

[[diagram:two-chains]]

The 3,000 Hz bin works the same way: 22.5% and 13%, 67.5° apart, giving 30%.

So every bin a tone doesn't sit on gets two chains that don't close. The long one sets the size of the leak. The short one nudges it up or down, depending on where the tone started. Hold on to that nudge.

Nothing here is broken. The tone is steady and the DFT is exact. A bin can only cancel a tone that makes whole turns in the block, and real tones don't care where your block stops.

Try it. Slide the tone between two bins and watch the matches spread. Then change the tone's starting point, and watch the matches breathe.

[[lab]]

## The shape of a leak

Drag the tone slowly from one bin to the next, in the lab or in your head, and the matches aren't random. They follow one smooth curve centred on the tone, and the bins just sample it wherever they happen to sit.

In the middle is the hump you met in lesson 10, around the tone itself. It falls to zero exactly one bin away on each side, where the leftover arrow makes one whole turn. That hump is the **main lobe**: the hump of matches around a tone, out to the first zero on each side. With 256 samples one bin is 31.25 Hz, so the main lobe runs from 31.25 Hz below the tone to 31.25 Hz above it.

[[diagram:main-lobe]]

Beyond it, the curve rises again into a row of smaller humps, one between each pair of whole turns. These are lesson 10's side lobes, now named precisely. Each **side lobe** is a smaller hump beyond the main lobe, carrying leakage to bins far from the tone. The first side lobe, about one and a half bins out, reaches 22% of the tone. The ones after it shrink slowly.

[[diagram:side-lobes]]

Now back to the loud 4.

## The keypad at 256 samples

Here are the four row tones, each alone at full strength, matched by the four row bins.

| row bin | 22 | 25 | 27 | 30 |
|---|---|---|---|---|
| tone of the bin | 687.5 Hz | 781.25 Hz | 843.75 Hz | 937.5 Hz |

None of the tones sits on its bin. 770 Hz, for instance, sits at 24.64 bins, a third of a bin below bin 25.

| tone | 697 bin | 770 bin | 852 bin | 941 bin |
|---|---|---|---|---|
| 697 Hz | **86%** | 10% | 5% | 3% |
| 770 Hz | 10% | **81%** | 13% | 6% |
| 852 Hz | 5% | 11% | **89%** | 8% |
| 941 Hz | 2% | 2% | 4% | **98%** |

Read the 770 Hz row. A 770 Hz tone matches 81% in its own bin and 13% in the 852 bin. Bin 27 sits two and a third bins away, on the 770 Hz tone's second side lobe, between the zeros at two and three bins.

[[diagram:keypad-leak]]

That's the biggest leak on the keypad, but it has company. The same tone puts 10% into the 697 bin, the row of 1, and the 852 Hz tone puts 11% back into the 770 bin.

Now the nudge. The long chain from 770 Hz into bin 27 is 12.2%. The mirror arrow is about 52 bins away, so its chain is tiny, 0.6%, and the tone alone matches 11.6% to 12.8% there. But a real 4 also carries its 1,209 Hz column tone, which leaks 1.8% to 2.7% into bin 27, from an unrelated start. Join all the chains and a loud 4 lands anywhere from 8.9% to 14.6% in the 7's bin.

[[diagram:phase-wobble]]

That's the "sometimes". Over 256 different pairs of starts, a loud 4 cleared the 12% bar in the 7's row 144 times, and in the 1's row another 60 times. That's 204 presses thrown out, and the 5, 6 and B in the same row fare about as badly.

Now the rural customer. Everything is a tenth as strong, so across all 16 keys their own bins score 7.7% to 10.2%.

[[diagram:bar-seesaw]]

Put the two numbers on one scale. To hear every rural key, the bar must sit below 7.7%. To keep a loud 4's leak out of the 7's row, it must sit above 14.6%. No bar is both. A faint key's real tone is weaker than a loud key's leak. Moving the bar was never going to work, because the bar was never the problem.

The spectrum screen draws the whole curve, so your eye finds the rural bumps. The detector sees eight bins and a bar, and there a leak and a faint tone look the same.

## Why the leak has this shape

Let's derive the curve and check the 22%. This is chapter 10 of Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), and it's one sum lesson 12 already showed you.

Two reminders from lesson 6 first. The angle per sample in radians is \(\omega = 2\pi \times \text{tone} / 8000\), so \(\pi\) means 4,000 Hz. And \(j\) is a quarter turn counter-clockwise, so \(j \times j = -1\), and \(e^{j\omega n}\) is the dot itself after \(n\) samples.

**Step one: one arrow, one bin.** Bin k's test wheel makes k turns in N samples, so it turns \(\omega_k = 2\pi k / N\) per sample. Take the counter-clockwise arrow at full size, \(e^{j\omega n}\), and the test wheel turning back, \(e^{-j\omega_k n}\). The bin multiplies each arrow by its test wheel and adds:

\[ X[k] = \sum_{n=0}^{N-1} e^{j\omega n} e^{-j\omega_k n} = \sum_{n=0}^{N-1} e^{j\Delta n}, \qquad \Delta = \omega - \omega_k \]

The tone and the test wheel combine into one arrow turning at the difference \(\Delta\). That's the leftover arrow, in symbols. The mirror arrow gives the same sum with \(-\omega\) in place of \(\omega\): the short second chain. We'll follow the long one.

**Step two: add up the arrows.** Each term is the one before times \(e^{j\Delta}\), a geometric series, as in lesson 12:

\[ \sum_{n=0}^{N-1} e^{j\Delta n} = \frac{1 - e^{j\Delta N}}{1 - e^{j\Delta}} \]

In lesson 12, \(\Delta N\) was always a whole number of turns, so the top was zero. Now it isn't. In the picture, the chain is a polygon, and the gap between its start and its end is the top of this fraction.

[[diagram:chain-gap]]

**Step three: take the length.** One fact first. Lesson 6 built a cosine as the sum of two mirror arrows, \(e^{jy} + e^{-jy} = 2\cos y\). Their difference gives the sine: \(e^{jy} - e^{-jy} = 2j \sin y\), because the left-right parts cancel and the up-down parts add. Now, both the top and the bottom of the fraction have the shape \(1 - e^{jx}\). Pull out half the angle, and the difference of two mirror arrows is left:

\[ 1 - e^{jx} = e^{jx/2}\left(e^{-jx/2} - e^{jx/2}\right) = -2j\, e^{jx/2} \sin(x/2) \]

The factors \(e^{jx/2}\) and \(-j\) only turn the arrow, so they have length 1. That leaves \(\left|1 - e^{jx}\right| = 2\left|\sin(x/2)\right|\). In a picture, it's the chord from the point 1 to the point \(e^{jx}\) on the circle.

[[diagram:chord]]

Use it on the top, with \(x = N\Delta\), and on the bottom, with \(x = \Delta\). The 2s cancel:

\[ \left| X[k] \right| = \left| \frac{\sin(N\Delta/2)}{\sin(\Delta/2)} \right| \]

**Step four: divide by N** to get the long chain's match. We used a full-size arrow, whose full pile is N long. A real tone's arrows are half-size, so both its chain and its full pile are halved, and the halves cancel. That's why a full pile is N ÷ 2 for a real tone and N here: the match is the same.

\[ \text{match} = \left| \frac{\sin(N\Delta/2)}{N \sin(\Delta/2)} \right| \]

**Step five: the zeros.** The top is zero when \(N\Delta/2\) is a whole multiple of \(\pi\), which means the leftover arrow makes whole turns. One whole turn over the block is a gap of 8,000 ÷ N Hz, one bin. So the zeros sit one bin apart, and the main lobe reaches one bin out on each side.

**Step six: the side lobes.** Between the zeros, the top swings back up to 1 while the bottom keeps growing. Measure the gap in bins: a tone d bins from the bin has \(\Delta = 2\pi d / N\), so the bottom is \(N \sin(\pi d / N)\), which is about \(\pi d\). So the side lobes shrink like 1 ÷ (π d). Near one and a half bins that's the first side lobe's 22%. At ten and a half bins it's still 3%. That slow fall is why a loud tone reaches so far.

Check it on the napkin. With 8 samples and the tone halfway between bins, \(N\Delta/2 = \pi/2\) and \(\Delta/2 = \pi/16\). The match is \(1 / (8 \sin(\pi/16)) = 0.64\). There's the fan of arrows.

## Taper the edges

So the trouble is at the edges of the block. The leftover arrow is cut off mid-turn. The arrows at the cut are as long as the ones in the middle, so the unfinished part of the turn counts in full.

You met a cure for a sharp cut in lesson 10. Chopping the ideal low-pass made it ring, and you tapered the chop with the Hamming window. Do the same here. Before the FFT, multiply the block by a window that fades in from zero and fades back out. We'll use the Hamming window's close cousin, the Hann window:

\[ w[n] = \tfrac12 - \tfrac12 \cos(2\pi n / N) \]

It's Hamming's shape with a half and a half in place of 0.54 and 0.46, so it reaches 0 at both ends. Hamming would fix this keypad too. We use Hann because its far side lobes die faster: ten and a half bins out, Hann leaks 0.03% and Hamming 0.4%.

[[diagram:hann-taper]]

Now the arrows near the cut are short. In the picture, look at the two ends of the chain: the first and last arrows have almost no length. So the unfinished turn barely counts, and the chain ends nearly where a whole turn would have put it. With a Hann window the first side lobe drops from 22% to 2.7% of the tone. The window also shrinks the full pile, to half the window's total instead of half of N, so we divide by that. A tone on its bin still matches 100%.

Windowing costs one multiplication per sample. That's 256 per block, small next to the FFT's 4,096 multiplications, counted the way lesson 13 counts them: four ordinary multiplications per butterfly.

Here's the keypad at 256 samples with a Hann window, each row tone alone.

| tone | 697 bin | 770 bin | 852 bin | 941 bin |
|---|---|---|---|---|
| 697 Hz | **94%** | 2% | 0% | 0% |
| 770 Hz | 2% | **92%** | 3% | 0% |
| 852 Hz | 0% | 3% | **96%** | 1% |
| 941 Hz | 0% | 0% | 0% | **99%** |

Now try whole keys, both tones, every key, many starts. The worst leak is 2.7%, and the weakest own bin is 92%, so a rural key scores at least 9.2%. Put the bar at 5% and every press decodes, loud and faint.

So, just add a window? Not quite. Why not a shorter block too, and half the wait? Try 128 samples with Hann. The bins move to 687.5, 750, 875 and 937.5 Hz.

| tone | 697 bin | 770 bin | 852 bin | 941 bin |
|---|---|---|---|---|
| 697 Hz | **99%** | 61% | 1% | 0% |
| 770 Hz | 27% | **94%** | 9% | 2% |
| 852 Hz | 2% | 11% | **92%** | 24% |
| 941 Hz | 0% | 0% | 46% | **100%** |

A disaster. A loud 1 now matches 61% in the 4's bin. The far bins stayed quiet, but the near ones got far louder. Why?

The window paid for its low side lobes with a fatter main lobe. Look at where its weight sits. The Hann window is above one half only in the middle half of the block, from sample 32 to sample 96 out of 128. So the windowed block acts roughly like a block half as long, and half the length means a main lobe about twice as wide.

[[diagram:effective-length]]

In fact it's exactly twice. The window's cosine is two mirror arrows, one bin's turn each way. So the Hann chain is built from three plain chains, added as arrows before any rescaling. It's half the plain chain at the tone, minus a quarter of the plain chain shifted one bin each way. Each plain curve is zero at every whole bin except its own centre. Add the three as arrows, and the Hann curve is zero at every whole bin except the tone's own and the two next to it. Its first zero is two bins out.

[[diagram:hann-three-curves]]

At 128 samples that's 125 Hz on each side of the tone, and 770 Hz is only 73 Hz from 697. The neighbor isn't catching a side lobe anymore. It's standing inside the main lobe.

[[diagram:window-trade]]

That's the trade every window makes. Low side lobes hear a faint tone far from a loud one. A narrow main lobe tells close tones apart. A plain cut has the narrowest main lobe and the worst side lobes, and a taper flips that.

## Choose both

So the keypad needs both. The faint line needs low side lobes, so: a Hann window. The close rows need the main lobe to end before the neighbor's tone. For Hann it reaches 2 × 8,000 ÷ N Hz to each side, so to keep 73 Hz outside it:

\[ \frac{2 \times 8000}{N} < 73 \quad\Rightarrow\quad N > 219 \]

There's a ceiling too. A key press can be as short as about 40 milliseconds, 320 samples, and the block must fit inside one press. Your 256 samples sit between the two, with the main lobe reaching 62.5 Hz to each side, inside the 73 Hz gap. Lesson 13 picked 256 for the FFT. Now it has a second reason.

[[diagram:lobe-vs-length]]

Could length alone do it? The longest block that fits a press, 320 samples with no window, still leaks up to 10.7%, while faint keys score as little as 6.8%. Window alone failed at 128. You need both: the window for how faint a tone you must hear, the length for how close a pair you must tell apart.

## Zero padding

There's one more knob people reach for. Take the 256-sample block, add 1,792 zeros to the end, and run the FFT on all 2,048 samples. That's **zero padding**: adding zeros to the end of a block before the DFT, which puts its bins closer together. Here they end up 8,000 ÷ 2,048 = 3.9 Hz apart.

The 770 Hz tone matched 81% because it fell a third of a bin from bin 25. Now a bin sits at 769.5 Hz and matches about 100%. Padding put a bin where the tone is.

And the leak? The padded bin at 843.75 Hz, where the 7's bin used to be, still matches 11.6% to 12.8%, the same as before. The zeros add no sound, so they change nothing about the curve.

[[diagram:zero-padding]]

## Your turn

Now you fix the detector. In the lab, a loud customer and the rural customer each press all 16 keys. You have three controls: the window, the block length, and the bar.

1. Find a setting where all 32 presses decode correctly.
2. Keep the block inside one 40 millisecond key press.

The lab draws two marks on one scale: the worst leak from any loud key, and the weakest own bin of any faint key. A setting works when the faint mark sits above the leak mark and your bar sits in the gap between them.

[[lab-act2]]

## What people get wrong

The most common belief is that zero padding improves frequency resolution. It looks that way. The bins get closer, the curve gets smoother, and the peaks look sharper. But telling two tones apart means seeing two humps. The width of each hump is set by the real samples and the window, never by the zeros. Take the 128-sample Hann block of a loud 697 Hz tone and pad it out to a million samples. The curve still reads 38% at 770 Hz, inside the main lobe.

[[diagram:padding-myth]]

Zero padding shows the same curve in finer steps. To separate close tones, you need more real samples.

## Recap

- A tone that doesn't land on a bin spreads into every bin. That's **leakage**, and it comes from the block ending partway through a turn of the leftover arrow.
- Each bin builds two chains, one per arrow. The long one sets the leak. The short one, and other tones' leaks, nudge it with the starts.
- The matches follow one curve around the tone: the **main lobe** out to the first zeros, then the **side lobes** carrying leakage to far bins.
- With no window, the main lobe reaches 8,000 ÷ N Hz to each side and the first side lobe is 22% of the tone.
- A Hann window drops the side lobes to 2.7% but doubles the main lobe's reach.
- The keypad needs Hann and more than about 220 samples, and 256 fits.
- **Zero padding** puts more bins on the same curve. It never narrows the main lobe.

## Next on the line

The keypad works. A new customer arrives with a strange request: a newspaper's anonymous tip line that disguises every caller by shifting the whole call up 300 Hz. Easy, you think. Multiply by a 300 Hz tone, the way you'd speed up any wheel. You try it, and every caller now comes with a second voice underneath, mumbling the same words a little lower. Where does that copy come from? That's the next bug.
