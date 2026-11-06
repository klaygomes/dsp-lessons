# The Keys That Blur

## A new complaint

Your keypad detector runs live. Every key sends a row tone and a column tone, and the DFT checks each block of samples against test wheels to find them (lesson 12: one wheel per bin, a dot that makes a whole number of turns in the block). Thanks to the FFT (lesson 13), the cheap chip keeps up. It reads blocks of 256 samples, 32 milliseconds of sound, and looks at the eight bins where the keypad tones land.

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

On paper, the detector is fine. Bin k sits at k × 8,000 ÷ N Hz, where N is the block length, so with 256 samples the bins are 31.25 Hz apart. The closest keypad tones are 73 Hz apart, and every tone has its own bin: the 7's row, 852 Hz, is read at bin 27, 843.75 Hz. So why does a loud 4 light up the bin that belongs to 7?

## Eight samples, two tones

Let's shrink the problem until it fits on a napkin. Take a block of only 8 samples. The bins are then 8,000 ÷ 8 = 1,000 Hz apart, so the test wheels sit at 0, 1,000, 2,000, 3,000 and 4,000 Hz.

First, a tone that lands right on a bin: 1,000 Hz.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 1,000 Hz | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 | 0.00 | 0.71 |

The matches at the five bins are 0%, 100%, 0%, 0%, 0%. One tone, one bin, everything else exactly zero. That's the picture lesson 12 started from.

Now move the tone halfway between two bins, to 1,500 Hz. Before you look at the numbers, guess what the five bins catch.

[[predict-split]]

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 1,500 Hz | 1.00 | 0.38 | −0.71 | −0.92 | 0.00 | 0.92 | 0.71 | −0.38 |

| bin | 0 Hz | 1,000 Hz | 2,000 Hz | 3,000 Hz | 4,000 Hz |
|---|---|---|---|---|---|
| match | 25% | 60% | 70% | 30% | 25% |

Not even close. The two nearest bins catch 60% and 70%, and neither sees the full tone. Every other bin matches something too, even the 0 Hz bin, and nothing is playing anywhere near 0 Hz. Remember the spill from lesson 12, when 770 Hz landed between two bins? It finally gets its name. **Leakage** is the part of a tone that shows up in bins beyond the one or two nearest it. It happens because the block ends partway through a turn.

[[diagram:leakage]]

What makes 1,500 Hz different? Look at the two tones across the block. The 1,000 Hz tone makes exactly one turn in 8 samples and ends ready to start again. The 1,500 Hz tone makes one and a half turns and stops halfway round, partway through a turn.

[[diagram:mid-turn]]

Now let's see why stopping halfway spreads the tone into every bin.

## Two arrows per tone

First, a picture from earlier lessons. Remember the wheel from lesson 3: a tone is a dot turning counter-clockwise, 360° × tone ÷ 8,000 per sample, which is 45° for every 1,000 Hz. The sample is how far left or right the dot sits.

Lesson 6 added a second arrow. A real tone, the cosine we hear, is two half-size arrows. One turns counter-clockwise. Its mirror arrow turns clockwise at the same speed. Both go all the way round, but at every sample each is the other's reflection across the horizontal line: when one is above the line, the other is below it. So their up-down parts always cancel, and their left-right parts add up to the sample. You need both to make a real tone.

[[diagram:two-arrows]]

Lesson 12 showed what a bin does with the pair. Its test wheel turns every arrow back, and the turned arrows are laid tip to tail into a chain. For a tone on the bin, that freezes the counter-clockwise arrow, so its copies pile up into one straight chain. Call that the full pile. It's the 100% every match is measured against, and since each arrow is half-size, a full pile is N ÷ 2 long, with N the block length. The mirror arrow, meanwhile, now turns clockwise twice as fast, and its chain curls up to nothing. So every bin builds two chains, one from each arrow.

## The leftover arrow

When the tone and the test wheel turn at different speeds, the frozen arrows aren't frozen anymore. They keep turning at the difference between the two speeds. Lesson 12 called the arrow that carries it the leftover arrow.

Take the 1,500 Hz tone and the 1,000 Hz bin. The tone's counter-clockwise arrow turns 67.5° per sample. The test wheel turns it back 45°, so the leftover arrow turns 22.5° per sample. Over 8 samples that's 8 × 22.5° = 180°, half a turn.

[[diagram:leftover]]

Laid tip to tail, the 8 arrows fan out, the last one 157.5° from the first. They don't pile up into a straight chain. They don't close into a loop either, because half a turn isn't enough to come back around. The chain reaches 64% as far as a full pile.

So here's the rule hiding on the napkin:

> If the leftover arrow makes a whole number of turns during the block, the chain closes into a loop and adds nothing. If it doesn't, something is left over, and that's leakage.

Check it on the 1,000 Hz tone. Against the 2,000 Hz bin, its leftover arrow turns 45° per sample, 360° in 8 samples: exactly one turn, so the chain closes. Against 3,000 Hz it makes two turns and closes again. The mirror arrow's chains close too, because the mirror also makes whole turns against every bin. A tone on a bin makes whole turns everywhere, so it leaks nowhere.

## The second chain

The mirror arrow builds a chain too. Against the 1,000 Hz bin its leftover arrow spins fast, −112.5° per sample, two and a half turns over the block. Not whole, so this chain doesn't close either, but its arrows mostly cancel and it ends up short: 15%.

The bin's match is the two chains joined end to end.

[[diagram:two-chains]]

If they point the same way, the lengths add: 64 + 15 = 79%. Opposite, they subtract: 64 − 15 = 49%. Which way the short one points depends on where the dot sits when the block begins. Our tone starts at the far right, and from there the short chain points 112.5° away from the long one, partly backwards, so the match drops to 60%.

The other bins work the same way. At the 2,000 Hz bin the chains are 64% and 13%, only 67.5° apart, so the short one pulls partly forwards: 70%. At the 3,000 Hz bin, 22.5% and 13%, 67.5° apart, give 30%.

So the long chain sets the size of a leak, and the short one nudges it up or down with the start. Hold on to that nudge. Nothing here is broken: a bin can only cancel a tone that makes whole turns in the block, and real tones don't care where your block stops.

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

The four row bins are 22, 25, 27 and 30, at 687.5, 781.25, 843.75 and 937.5 Hz. None of the tones sits on its bin: 770 Hz, for instance, sits at 24.64 bins, a third of a bin below bin 25. Here are the four row tones, each alone at full strength, matched by those bins.

| tone | 697 bin | 770 bin | 852 bin | 941 bin |
|---|---|---|---|---|
| 697 Hz | **86%** | 10% | 5% | 3% |
| 770 Hz | 10% | **81%** | 13% | 6% |
| 852 Hz | 5% | 11% | **89%** | 8% |
| 941 Hz | 2% | 2% | 4% | **98%** |

Read the 770 Hz row. A 770 Hz tone matches 81% in its own bin and 13% in the 852 bin, bin 27, which sits two and a third bins away on its second side lobe. That's the biggest leak on the keypad, and it has company: 10% into the 1's row.

[[diagram:keypad-leak]]

Now the nudge. A real 4 is two tones, each with its own start, and each sends its chains into bin 27. Join them all as arrows and a loud 4 lands anywhere from 8.9% to 14.6% in the 7's bin.

The long chain from 770 Hz into bin 27 is 12.2%. The mirror arrow is about 52 bins away, so its chain is tiny, 0.6%, and the tone alone matches 11.6% to 12.8% there. The 4's 1,209 Hz column tone adds a chain of its own, 2.3%, from an unrelated start.

[[diagram:phase-wobble]]

That's the "sometimes". Over 256 different pairs of starts, a loud 4 cleared the 12% bar in the 7's row 144 times, and in the 1's row another 60 times. That's 204 presses thrown out, and the 5, 6 and B in the same row fare about as badly.

Now put the rural keys on the same scale.

[[diagram:bar-seesaw]]

To hear every rural key, the bar must sit below 7.7%. To keep a loud 4's leak out of the 7's row, it must sit above 14.6%. No bar is both. A faint key's real tone is weaker than a loud key's leak. Moving the bar was never going to work, because the bar was never the problem.

The spectrum screen draws the whole curve, so your eye finds the rural bumps. The detector sees eight bins and a bar, and there a leak and a faint tone look the same.

## Why the leak has this shape

Here is the whole curve in one line. Call d the distance from the tone to the bin, counted in bins. With no window, the long chain's match is

\[ \text{match} = \left| \frac{\sin(\pi d)}{N \sin(\pi d / N)} \right| \]

Read it like this. The angles are in radians, where π is half a turn, so the top is zero whenever d is a whole number, which is when the leftover arrow makes whole turns: those are the zeros, one bin apart, so the main lobe reaches one bin out on each side. Between the zeros the top swings back up to 1 while the bottom, about \(\pi d\), keeps growing. So the side lobes shrink like 1 ÷ (π d). Near one and a half bins that's the first side lobe's 22%. At ten and a half bins it's still 3%. That slow fall is why a loud tone reaches so far.

Check it on the napkin: 8 samples, the tone half a bin away, so the match is \(1 / (8 \sin(\pi/16)) = 0.64\). There's the fan of arrows.

The formula comes from chapter 10 of Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), and it's one sum lesson 12 already showed you. The four steps are below if you want them.

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

**Step four: divide by N** to get the long chain's match. We used a full-size arrow, whose full pile is N long. A real tone's arrows are half-size, so both its chain and its full pile are halved, and the halves cancel: the match is the same. A tone d bins from the bin has \(\Delta = 2\pi d / N\), so \(N\Delta/2 = \pi d\) and \(\Delta/2 = \pi d / N\):

\[ \text{match} = \left| \frac{\sin(N\Delta/2)}{N \sin(\Delta/2)} \right| = \left| \frac{\sin(\pi d)}{N \sin(\pi d / N)} \right| \]

That's the line we started from.

## Taper the edges

So the trouble is at the edges of the block. The leftover arrow is cut off mid-turn. The arrows at the cut are as long as the ones in the middle, so the unfinished part of the turn counts in full.

You met a cure for a sharp cut in lesson 10. Chopping the ideal low-pass made it ring, and you tapered the chop with the Hamming window. Do the same here. Before the FFT, multiply the block by a window that fades in from zero and fades back out. We'll use the Hamming window's close cousin, the Hann window:

\[ w[n] = \tfrac12 - \tfrac12 \cos(2\pi n / N) \]

It's Hamming's shape with a half and a half in place of 0.54 and 0.46, so it reaches 0 at both ends. Hamming would fix this keypad too. We use Hann because its far side lobes die faster: ten and a half bins out, Hann leaks 0.03% and Hamming 0.4%.

[[diagram:hann-taper]]

Now the arrows near the cut are short. In the picture, look at the two ends of the chain: the first and last arrows have almost no length. So the unfinished turn barely counts, and the chain ends nearly where a whole turn would have put it. With a Hann window the first side lobe drops from 22% to 2.7% of the tone. The window also shrinks the full pile, to half the window's total instead of half of N, so we divide by that. A tone on its bin still matches 100%.

Windowing costs one multiplication per sample. That's 256 per block, small next to the FFT's 4,096 multiplications, counted the way lesson 13 counts them: four ordinary multiplications per butterfly, the FFT's step that combines two values into two.

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

In fact it's exactly twice: the Hann curve's first zero sits two bins out, not one. The reason is below, if you want it.

The window's cosine is two mirror arrows, one bin's turn each way. So the Hann chain is built from three plain chains, added as arrows before any rescaling: half the plain chain at the tone, minus a quarter of the plain chain shifted one bin each way. Each plain curve is zero at every whole bin except its own centre. Add the three as arrows, and the Hann curve is zero at every whole bin except the tone's own and the two next to it.

[[diagram:hann-three-curves]]

At 128 samples that's 125 Hz on each side of the tone, and 770 Hz is only 73 Hz from 697. The neighbor isn't catching a side lobe anymore. It's standing inside the main lobe.

[[diagram:window-trade]]

That's the trade every window makes. Low side lobes hear a faint tone far from a loud one. A narrow main lobe tells close tones apart. A plain cut has the narrowest main lobe and the worst side lobes, and a taper flips that.

## Choose both

So the keypad needs both. The faint line needs low side lobes, so: a Hann window. The close rows need something too, and it's tempting to say "keep the main lobe narrower than 73 Hz". For Hann that means 2 × 8,000 ÷ N < 73, so any block longer than 219 samples. But 224 samples clears that and still fails.

Here's why. The detector never reads the curve, only the bins. So the leak of 770 Hz into the 1's row is the 770 Hz curve read at the 1's row bin, wherever that bin happens to land. At 224 samples the bins are 35.7 Hz apart, and the 697 Hz row's bin lands at 714.3 Hz, only 55.7 Hz from 770 Hz. That's 1.56 bins, deep inside the Hann main lobe: a loud 4 leaks 14% into the 1's row, far above any rural key.

So measure each length the way the detector does: how many bins does each neighbouring tone land from the bin you read? The main lobe ends at 2 bins, and near its edge the Hann curve is already small: 5% at 1.79 bins, but 9% at 1.67 and 14% at 1.56. So the rule is about where the bins land. With loud keys about ten times as strong as the faint ones, as here, every neighbouring tone must land at least about 1.75 bins from the bin you read. A hotter line makes taller leaks and needs more room.

[[diagram:lobe-vs-length]]

There's a ceiling too. A key press can be as short as about 40 milliseconds, 320 samples, and the block must fit inside one press. Your 256 samples pass: the closest neighbour, 852 Hz, lands 2.26 bins from the 770 Hz row's bin at 781.25 Hz. Lesson 13 picked 256 for the FFT. Now it has a second reason. Longer isn't automatically better, though: 208 works and 224 doesn't.

Could length alone do it? The longest block that fits a press, 320 samples with no window, still leaks up to 10.7%, while faint keys score as little as 6.9%. Window alone failed at 128. You need both: the window for how faint a tone you must hear, and a length whose bins land clear of the neighbours, for how close a pair you must tell apart.

## Zero padding

There's one more knob people reach for. Take the 256-sample block, add 1,792 zeros to the end, and run the FFT on all 2,048 samples. That's **zero padding**: adding zeros to the end of a block before the DFT, which puts its bins closer together. Here they end up 8,000 ÷ 2,048 = 3.9 Hz apart.

The 770 Hz tone matched 81% because it fell a third of a bin from bin 25. Now a bin sits at 769.5 Hz and matches about 100%. Padding put a bin where the tone is.

And the leak? The padded bin at 843.75 Hz, where the 7's bin used to be, still matches the same as before. The zeros add no sound, so they change nothing about the curve.

[[diagram:zero-padding]]

## Your turn

Now you fix the detector. In the lab a call centre joins the line, with headsets so hot that its keys arrive twice as strong as the loud customer's. It and the rural customer each press all 16 keys. You have three controls: the window, the block length, and the bar.

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
- With no window, the main lobe reaches one bin, 8,000 ÷ N Hz, to each side and the first side lobe is 22% of the tone.
- A Hann window drops the side lobes to 2.7% but doubles the main lobe's reach.
- The keypad needs Hann and a block length whose bins land clear of every neighbouring tone: at least about 1.75 bins when loud keys are ten times the faint ones, more for a hotter line. 256 does; 224 doesn't, even though it's longer than 208, which does.
- **Zero padding** puts more bins on the same curve. It never narrows the main lobe.

## Next on the line

The keypad works. A new customer arrives with a strange request: a newspaper's anonymous tip line that disguises every caller by shifting the whole call up 300 Hz. Easy, you think. Multiply by a 300 Hz tone, the way you'd speed up any wheel. You try it, and every caller now comes with a second voice underneath, mumbling the same words a little lower. Where does that copy come from? That's the next bug.
