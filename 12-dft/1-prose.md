# Which Key Did They Press?

## Press 1 for billing

Your phone line now carries voices cleanly, so the company gives it a new job. When a customer calls the support number, a recorded voice says: "Press 1 for billing, 2 for a technician, 3 to talk to a person." The customer presses a key. And your line has to work out which one.

The catch: the line never sees a key. It only sees samples, 8,000 numbers a second, the same as for a voice.

Hold a phone to your ear and press a key, and you hear a short beep. It sounds like one note. It's actually two notes at once. The keys sit in a grid of four rows and four columns. Every row has its own low tone, every column has its own high tone, and a key plays the tone of its row and the tone of its column together.

| | 1,209 Hz | 1,336 Hz | 1,477 Hz | 1,633 Hz |
|---|---|---|---|---|
| **697 Hz** | 1 | 2 | 3 | A |
| **770 Hz** | 4 | 5 | 6 | B |
| **852 Hz** | 7 | 8 | 9 | C |
| **941 Hz** | * | 0 | # | D |

So the key 5 is 770 Hz plus 1,336 Hz. The key 9 is 852 Hz plus 1,477 Hz. (The fourth column, with A to D, exists on the standard and on almost no phone you've ever held.) This two-tone scheme is called **DTMF**, short for dual-tone multi-frequency.

[[diagram:keypad]]

Why two tones per key? Because someone humming could fake a single beep, but a voice rarely holds two pure tones from these two exact groups at once.

So here's the job: a short recording arrives with two tones inside, one from each group. Which two? Let's build a tool that answers that, from nothing.

## Asking one tone a question

Forget the keypad for a moment and ask a smaller question. Here are eight samples. Is there a 2,000 Hz tone in them?

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| recording | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |

Remember the wheel? A tone is a dot on the rim of a wheel of radius 1, and we watch how far left or right it sits. Think of a lamp straight above the wheel: the dot's shadow on the floor moves only left and right, so call that position the dot's **left-right shadow**. Its height, seen on a wall beside the wheel, is its up-down shadow. Each sample, the dot turns 360° × tone ÷ 8,000, which is 45° for every 1,000 Hz. A 2,000 Hz tone turns 90° per sample: right, top, left, bottom. Its left-right shadow reads 1, 0, −1, 0. That's our recording.

But your line can't recognize numbers by eye. It needs a procedure, and here's the simplest that could work. Make your own copy of the tone you're looking for, a **test tone**. Multiply it with the recording sample by sample, and add up the products.

Why would that work? When the two agree, positive meets positive and negative meets negative, so every product is positive and the sum grows. When they disagree, the products are positive about as often as negative, and they cancel. Before you look at the table, guess: what will the sum be for a 1,000 Hz test tone?

[[predict-sum]]

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | sum |
|---|---|---|---|---|---|---|---|---|---|
| recording | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 | |
| 2,000 Hz test | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 | |
| product | 1 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | **4** |
| 1,000 Hz test | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 | 0 | 0.71 | |
| product | 1 | 0 | 0 | 0 | −1 | 0 | 0 | 0 | **0** |

The 2,000 Hz test scores 4. The 1,000 Hz test scores exactly zero: the +1 at sample 0 meets the −1 at sample 4, and nothing else survives. Try 0 Hz (a wheel that never turns, so 1, 1, 1, ...), 3,000 Hz and 4,000 Hz yourself, and every one of them scores zero too. Only the right tone scores.

The figure draws those two tables as stems: recording, test tone, and products, filled when positive and hollow when negative.

[[diagram:test-tone]]

We now have a question we can put to a recording: "is this tone in here?"

## The tone that hid

Now a nasty surprise. Here's another recording, also 2,000 Hz.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| recording | 0 | 1 | 0 | −1 | 0 | 1 | 0 | −1 |

It's the same tone, running a quarter turn behind. In the language of lesson 3, it has a different **phase**. Its dot starts at the bottom of the wheel instead of at the right, and reaches the right one sample later. Multiply it by the 2,000 Hz test tone and every product is zero. Our test says there's no 2,000 Hz tone in a recording that is nothing but a 2,000 Hz tone. That matters, because a keypad doesn't start its beep at a convenient moment for us.

What went wrong? At sample 0 the test tone's dot is at the right, but the recording's dot is at the bottom, where its left-right shadow is zero. At sample 1 the recording's dot reaches the right, but now the test tone's dot is at the top. At every sample one of the two shadows is zero. The figure shows the two stem rows and both dots on the wheel.

[[diagram:hidden-tone]]

So let's look with both shadows. Take the 2,000 Hz wheel and, this time, run it backward, clockwise: right, bottom, left, top. Its left-right shadow is the same as before, 1, 0, −1, 0, so the first test tone doesn't change. Its up-down shadow is 0, −1, 0, 1, and that's our second test tone. Each recording now gets two sums.

| recording starts at | left-right sum | up-down sum | length of the arrow |
|---|---|---|---|
| the right (1, 0, −1, 0, ...) | 4 | 0 | 4 |
| the bottom (0, 1, 0, −1, ...) | 0 | −4 | 4 |
| 45° below the right (0.71, 0.71, −0.71, −0.71, ...) | 2.83 | −2.83 | 4 |

The third row's tone starts 45° below the right, so its dot sits at −45°, 45°, 135°, 225°.

Look at the last column. Treat the two sums as an arrow: the left-right sum says how far right it points, the up-down sum how far up (a negative sum points it down). Its length, by Pythagoras, is 4 every time: for the 45° row, √(2.83² + 2.83²) = 4. And each arrow points exactly where its tone's dot started. The phase decides the direction. Only the strength of the tone decides the length.

In the figure, the dot's starting point slides from the right to the bottom, and the arrow swings with it, its length fixed at 4.

[[diagram:shadows]]

So the answer to "is this tone in here?" is a length, not a single sum. Call that length the **match**: how strongly the recording agrees with the test tone, whatever the phase.

## Turning the recording back

Why do the two sums work, and why did the second wheel turn backward? One picture answers both. It starts from lesson 6: a real tone is two arrows, each half the tone's height, one turning forward and its mirror turning backward. Laid tip to tail, they always land on the horizontal line, at the sample we hear.

[[diagram:mirror-arrows]]

The figure shows the two arrows turning opposite ways while the spot where they land slides along the horizontal line. That sliding spot is the cosine.

Now meet the **test wheel**: a wheel turning backward, clockwise, at the test tone's speed. Its two shadows were our two test tones. Use it to give every sample a little arrow. The arrow points where the test wheel points at that sample. Its length is the sample's value. A negative value flips it to the opposite side. The figure builds one such arrow in three steps: the wheel's direction, the sample's length, and the flip.

[[diagram:sample-arrow]]

Let's walk the eight arrows of a block of N = 8 samples, our first recording, against the 2,000 Hz test wheel:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| test wheel points | right | down | left | up | right | down | left | up |
| sample | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |
| arrow | 1 right | none | left, flipped: 1 right | none | 1 right | none | 1 right | none |

Lay them tip to tail and you walk 4 to the right. That's the left-right sum, 4, and the up-down sum, 0. Now take the recording that hid, 0, 1, 0, −1, and so on. Sample 1 is a 1 along "down", and sample 3 is a −1 along "up", flipped to point down. Four steps down: (0, −4), the second row of the table. The two sums were this walk all along.

Now, why backward? Think about the two arrows inside the tone. Laying a sample along the test wheel's direction turns each of its two half arrows by the test wheel's angle, because multiplying arrows adds their angles (lesson 6). The forward arrow turns 90° counter-clockwise per sample, and the test wheel turns 90° clockwise. The two cancel. The forward half's arrows all point the same way, sample after sample, and pile up. It's like a fan that seems to stand still under a strobe light flashing once per turn. Each of them is half the tone's height, so N samples pile up to N ÷ 2. The mirror half was already turning clockwise. Against the test wheel it turns clockwise twice as fast, and its walk curls around back to the start.

So a tone of height 1 (its samples swing between +1 and −1) scores N ÷ 2 in a block of N samples. That's our 4 in eight samples. The two exceptions are 0 Hz and 4,000 Hz. They sit on the horizontal line, each is its own mirror, and both halves pile up: they score N.

[[diagram:unspin]]

The figure shows both cases: at the tone's speed the arrows line up into one long walk; at any other speed they curl back near the start. Either way, the length of the walk is the match.

Now go and play. Pick a tone, pick a test wheel, and watch the arrows pile up or curl away.

[[lab]]

## Which test wheels?

There are infinitely many tones you could test for. Which ones should a detector use?

Look again at why the 1,000 Hz test scored exactly zero, not just small. In eight samples, a 1,000 Hz test wheel turns exactly once around. The 2,000 Hz tone's forward arrow turns exactly twice. The forward arrow turns 90° counter-clockwise a sample, and the test wheel turns it back 45°, leaving it turning 45° a sample: exactly one whole turn over the block. Its eight arrows point evenly in eight directions, and laid tip to tail they close an octagon: the walk ends where it began. The mirror arrow's walk closes too. Zero, exactly, whenever the tone and the test wheel make different whole numbers of turns in the block. (The one exception, a test wheel that freezes the mirror arrow, comes in a moment.)

[[diagram:polygon]]

The figure shows the octagon. Beside it, a 2,500 Hz tone meets the 2,000 Hz wheel, and its walk doesn't close.

So pick the test wheels that make a whole number of turns in the block. With a block of N samples, the wheel that makes k turns turns k × 360° ÷ N per sample, and that's the tone k × 8,000 ÷ N Hz. For our eight samples: 0 turns is 0 Hz, 1 turn is 1,000 Hz, 2 turns is 2,000 Hz, up to 4 turns, which is 4,000 Hz, the limit. The figure steps these five wheels through the eight samples.

[[diagram:bin-wheels]]

Each of these test wheels is a numbered slot called a **bin**. Bin k holds two things. One is the wheel that makes k turns in N samples, at the tone k × 8,000 ÷ N Hz. The other is the match the recording gets against it. Line up the matches of all N bins, k from 0 to N − 1. That list is the **DFT**, the discrete Fourier transform: one match per bin. The figure draws it as bars for our recording.

[[diagram:dft-bars]]

What about k from 5 to 7? Bin 6 would be 6,000 Hz, beyond the limit. Its test wheel turns back 6 × 45° = 270° per sample. But turning back 270° lands exactly where turning forward 90° does. So bin 6's test wheel really turns forward at the 2,000 Hz speed, and it freezes the mirror arrow: lesson 4's alias, seen from the other side. For a real recording, bin N − k always matches exactly as strongly as bin k, so you only need to read bins 0 to N ÷ 2.

## Tones that fall in the same bin

Now back to the keypad, with eight samples of the key 5. Our bins sit at 0, 1,000, 2,000, 3,000 and 4,000 Hz, and every row tone, 697 to 941 Hz, is closest to bin 1. The 1,000 Hz bin lights up for any row and can't say which. The bins are 1,000 Hz apart, and the row tones are less than 90 Hz apart.

That spacing has a name. The **frequency resolution** of a DFT is the spacing between neighboring bins, 8,000 ÷ N Hz. Eight samples give 1,000 Hz. Forty samples give 200 Hz. Another way to read it: N samples last N ÷ 8,000 seconds, and the resolution is one divided by that time. To tell close tones apart, you must listen longer.

How long, then? The closest pair of keypad tones is 697 and 770 Hz, 73 Hz apart. Each tone needs a bin of its own, with room to spare, so the spacing should be well below 73 Hz. Try a few lengths:

| N | resolution | lasts | nearest bins for 697, 770, 852, 941 Hz |
|---|---|---|---|
| 8 | 1,000 Hz | 1 ms | 1, 1, 1, 1 |
| 40 | 200 Hz | 5 ms | 3, 4, 4, 5 |
| 100 | 80 Hz | 12.5 ms | 9, 10, 11, 12 |
| 205 | 39.0 Hz | 25.6 ms | 18, 20, 22, 24 |

The figure draws each row of this table as a number line, bins as ticks and row tones as dots.

[[diagram:bins]]

At 40 samples, 770 and 852 Hz both land on bin 4, so the keys 5 and 8 look identical. At 100 samples every row tone gets its own bin, but neighbors sit in neighboring bins with nothing between them. At 205 samples each row tone has its own bin and an empty bin on each side.

Why is one empty bin enough? A tone that isn't on a bin spills a little into the bins around it, and the spill falls fast with distance. Here's how much of a tone a bin picks up, by how far the bin is from the tone:

| distance from the tone | 0 | half a bin | 1.5 bins | 2.5 bins |
|---|---|---|---|---|
| share the bin gets | 100% | about 63% | about 21% | about 13% |

[[diagram:spill]]

The figure plots that falloff. Now, every tone is at most half a bin from its own bin, since that's the nearest one, so its own bin gets at least 63%. If the next row's bin is at least two bins further on, it's at least one and a half bins from the tone and gets at most about 21%. Three to one. Without the empty bin, a rival can sit as little as half a bin away, and a tone exactly halfway between two bins ties them. At 100 samples the margin is already thin: the key 5 gives its own bin 77% and the 697 Hz bin 48%.

That's why 205 is the classic choice for keypad detectors. The eight tones land on bins 18, 20, 22, 24 and 31, 34, 38, 42, each with room around it. And 25.6 ms fits inside the shortest key press a keypad is allowed to send, about 40 ms.

## Decoding the key 5

Let's run the real thing. A customer presses 5. The line takes 205 samples of 770 Hz plus 1,336 Hz, each tone of height 1, both starting at the right of the wheel. The first few samples are 2.00, 1.32, −0.15, −1.24, −1.24: two tones drifting in and out of step.

We compute only the eight bins we care about. A perfect tone of height 1, sitting exactly on one of these bins, would score N ÷ 2 = 102.5. The last column shows each match as a share of that.

| tone | bin k | bin's tone | match | share of 102.5 |
|---|---|---|---|---|
| 697 Hz | 18 | 702.4 Hz | 13.1 | 13% |
| **770 Hz** | **20** | **780.5 Hz** | **91.8** | **90%** |
| 852 Hz | 22 | 858.5 Hz | 11.9 | 12% |
| 941 Hz | 24 | 936.6 Hz | 7.1 | 7% |
| 1,209 Hz | 31 | 1,209.8 Hz | 7.8 | 8% |
| **1,336 Hz** | **34** | **1,326.8 Hz** | **93.9** | **92%** |
| 1,477 Hz | 38 | 1,482.9 Hz | 5.8 | 6% |
| 1,633 Hz | 42 | 1,639.0 Hz | 3.0 | 3% |

The strongest row bin is 20 and the strongest column bin is 34: row 770, column 1,336, the key 5. Change the phases and the matches barely move, because the match is a length. With both tones a quarter turn behind, the winners still score 88% and 91%.

The decoder needs one more rule. Most of the time nobody is pressing anything, and the line carries silence. "Strongest row, strongest column" would name a key even in silence, because some bin is always the strongest. So give the detector a **bar**: a tone counts only when its bin's match clears it. The bar, like every match from here on, is read as a share of the full pile of 102.5, the table's last column. A key counts only when exactly one row tone and exactly one column tone clear the bar. Silence clears nothing, so no key.

Where should the bar sit? Try every key at every phase. A key's own bins always score at least 86%, and the worst spill into a rival bin is about 16%. The bar must sit between them, and 25% leaves room on both sides. A rival never gets near it, and a key can arrive at a third of its usual strength and still clear it, because a third of 86% is about 29%.

[[diagram:key5-bars]]

The figure shows the key 5 two ways: the 205 samples of the beep, and bins 15 to 45 as bars under the 25% line. Of the eight keypad bins, only 20 and 34 clear it.

Notice that the winners score 90% and 92%, not 100%. A 770 Hz tone turns about 19.7 times in 205 samples, not a whole number. So its arrows almost pile up, but not quite, and some of it spills next door: bin 19 gets 32%, bin 21 gets 20%. The rule "a tone scores only in its own bin" stretches here, but the empty bins keep every rival far enough away. That spill has a name, leakage, and lesson 14 is all about it.

## Your turn

Now you build the detector. In the lab, the support line is receiving a customer's four-digit account number, one key press at a time. You don't know the digits. Your job:

1. Choose the block length N. Watch the eight keypad tones land on bins, and make sure no two of them share one.
2. For each key press, find the row bin and the column bin that clear the 25% bar, and look the pair up in the grid.

You're done when the detector reads all four digits correctly. Start at N = 40 and see the keys 5 and 8 collide, then lengthen the block until they come apart.

[[lab-act2]]

## Why whole turns cancel exactly

You've fixed the line. This section is the place to slow down: chapter 8 of Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), the same octagon and pile-up in the book's notation, in six steps.

**Step one: the test wheel.** The book writes the arrow that turns one N-th of a full turn backward as

\[ W_N = e^{-j 2\pi / N} \]

In lesson 6's notation, \(j\) is a quarter turn counter-clockwise, so \(j \times j = -1\), and \(e^{j\theta}\) is the point at angle \(\theta\) on the unit circle, and the minus sign turns it clockwise. Angles are in radians, where 360° is \(2\pi\), so \(2\pi / N\) is one N-th of a turn: 45° when N = 8. Bin k's test wheel, at sample n, points along \(W_N^{kn}\): back by k × n steps of one N-th of a turn.

**Step two: the match, as a sum.** Give each sample its arrow and add:

\[ X[k] = \sum_{n=0}^{N-1} x[n]\, W_N^{kn} \]

That's the DFT as the book writes it. \(X[k]\) is the arrow at the end of the tip-to-tail walk, and its length \(|X[k]|\) is the match.

**Step three: feed it one forward arrow.** Let the recording be a single forward arrow sitting on bin m: \(x[n] = e^{j 2\pi m n / N}\). Multiplying arrows adds their angles, so each term becomes

\[ x[n]\, W_N^{kn} = e^{j 2\pi (m - k) n / N} \]

an arrow that turns by the difference between the two speeds.

**Step four: the same speed.** If \(k = m\), the difference is zero, every arrow points right with length 1, and the sum is N. The pile-up.

**Step five: a different speed.** If \(k \neq m\), call the leftover arrow \(r = e^{j 2\pi (m-k)/N}\). The sum is \(S = 1 + r + r^2 + \dots + r^{N-1}\). Multiplying by r moves every term up one power, so \(S - rS = 1 - r^N\), and

\[ S = \frac{1 - r^N}{1 - r} \]

But \(r^N = e^{j 2\pi (m-k)} = 1\), because m − k is a whole number of turns. The top is zero: the closed octagon, as algebra.

**Step six: a real tone.** A cosine is half a forward arrow plus half its mirror:

\[ \cos\!\left(\tfrac{2\pi m n}{N}\right) = \tfrac{1}{2} e^{j 2\pi m n / N} + \tfrac{1}{2} e^{-j 2\pi m n / N} \]

Each half lands in its own bin with N ÷ 2: the forward half in bin m, the mirror half in bin N − m. That's the 4 in bin 2 and the 4 in bin 6. (At m = 0 or m = N ÷ 2 the two bins are the same bin, and it gets N.)

One more fact falls out of this. Lesson 6 built H(z), the number a tone \(z^n\) is multiplied by. The book goes one step further: a signal's z-transform adds up \(x[n]\, z^{-n}\) over all its samples, turning the whole signal into a function of z. For our block of N samples it is

\[ X(z) = \sum_{n=0}^{N-1} x[n]\, z^{-n} \]

Put in \(z = e^{j 2\pi k / N}\). Then \(z^{-n} = e^{-j 2\pi k n / N} = W_N^{kn}\), and the sum is exactly \(X[k]\). So the DFT is that function read at N evenly spaced points on the unit circle, the same circle where you placed your zeros and poles. There's one bin every 360° ÷ N, starting at 0 Hz on the right. The figure puts them there.

[[diagram:circle-bins]]

## What people get wrong

It's natural to think the DFT finds the tones in a recording, as if it listened and reported "770 Hz and 1,336 Hz". It doesn't. It reports how well the recording matches N test wheels fixed in advance. Feed it 770 Hz and it says "bin 20, which is 780.5 Hz, matches at 90%, and bin 19 matches at 32%". It never says 770. If two tones fall in the same bin, it can't tell them apart at all, and only a longer block separates them. The DFT is a fixed set of questions, not an ear.

## Recap

- **DTMF**: a key is its row's low tone plus its column's high tone.
- The **match** is the length of the walk of samples turned by a backward **test wheel**: the tone's forward half piles up, whatever the phase.
- **Bin** k: the wheel making k turns in N samples (k × 8,000 ÷ N Hz) and its match. The **DFT** lists all N matches; a tone of height 1 on a bin scores N ÷ 2 (N at 0 Hz and the limit).
- **Frequency resolution** is 8,000 ÷ N Hz; an empty bin between tones keeps rivals' spill near 21% or below.
- A key counts when exactly one row and one column clear the **bar**.

## Next on the line

The detector works. Then the billing team complains: some callers get transferred mid-sentence. Now and then a voice puts strong energy at a row tone and a column tone at once, and the detector hears a key nobody pressed.

There's a clean way to tell them apart. A real key press has almost nothing outside its two tones, and a voice has energy all over. So the detector must look at every bin a real recording needs, bins 0 to 102, and reject a "key" that comes with too much else.

So you count, on the cheap chip from lesson 9. Turning one sample by a test wheel's arrow takes two multiplications, one for each part. Each bin turns 205 samples, and there are 103 bins: 2 × 103 × 205 = 42,230 multiplications per block. A new block arrives about 39 times a second, so that's 1.65 million multiplications a second. The chip manages about a million. The detector falls further behind with every call. That's the next bug.
