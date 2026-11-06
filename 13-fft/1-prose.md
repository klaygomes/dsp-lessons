# The Detector That Couldn't Keep Up

## Falling behind

The keypad detector from the last lesson works, and it now rejects voices that fake a key. Remember how: a voice that happens to hit a row tone and a column tone at once still has energy all over the spectrum. A real key press has almost nothing outside its two tones. To see that, the detector computes every bin a real recording needs, bins 0 to 102 of each block of 205 samples. Then you put it on the line's cheap chip, the one from lesson 9, and it starts falling behind.

The chip has more work than time. Let's count the work in the one unit the chip cares about: ordinary **multiplications**, one number times another. Each sample becomes an arrow, pointing where the test wheel points (the last lesson's turning arrow, one per bin, that the DFT holds every sample against), with the sample's value as its length. An arrow has two parts, how far right and how far up. So making it from a sample takes two multiplications: the sample times the wheel's left-right part, and the sample times its up-down part.

Later we'll also need to turn something that's already an arrow, and that costs more. Turning an arrow by a wheel's arrow mixes all four parts. The new left-right part is (left-right × left-right) − (up-down × up-down). The new up-down part is (left-right × up-down) + (up-down × left-right). Four multiplications. The figure draws both: two small tiles for a sample, four for an arrow.

[[diagram:multiply-cost]]

Now the bill. One bin turns 205 samples at two multiplications each, and there are 103 bins:

2 × 103 × 205 = 42,230 multiplications per block.

Picture it as a grid with one row per bin and one column per sample, every cell a sample turned by an arrow. A new block arrives 8,000 ÷ 205 ≈ 39 times a second, so the chip must fill that grid 39 times a second: about 1.65 million multiplications. It manages about a million. The figure shows the grid filling, with the chip's share for one block outlined inside it: 25,625 multiplications, about 61% of the grid.

[[diagram:work-grid]]

So the detector needs 65% more than the chip can give. With every call it drifts further behind the sound, until key presses get decoded seconds late, or not at all.

You could buy a faster chip. Or you could ask: is the DFT really doing 42,230 different things, or the same things over and over?

## The DFT repeats itself

Let's use a block small enough to see everything: N = 8. Its bins sit at 0, 1,000, 2,000, up to 7,000 Hz, and bins 5 to 7 are the mirror arrows of bins 3 to 1. (A mirror arrow, from the last lesson, is the same arrow flipped top to bottom: same left-right part, opposite up-down part.) Bin 1's test wheel turns back 360° ÷ 8 = 45° per sample. Bin 5's turns back five times as fast, 225° per sample.

One reminder before the table. "Back" means clockwise. A wheel turned back 90° from the right points down, turned back 180° points left, and turned back 270° points up. Our textbook, Oppenheim and Schafer's *Discrete-Time Signal Processing*, measures the same angles in radians, where a full turn, 360°, is 2π, so 45° is 2π ÷ 8. The figure marks one wheel both ways.

[[diagram:back-wheel]]

Now guess. Bin 1 and bin 5 turn at very different speeds. Do their test wheels ever point the same way at the same sample? Commit to an answer before the table shows you.

[[predict-same]]

Here's how far back each wheel has turned at each sample. Past a full turn the count wraps around, because 360° is the same as 0°.

| n | bin 1 | bin 5 | same way? |
|---|---|---|---|
| 0 | 0° | 0° | yes |
| 1 | 45° | 225° | opposite |
| 2 | 90° | 90° | yes |
| 3 | 135° | 315° | opposite |
| 4 | 180° | 180° | yes |
| 5 | 225° | 45° | opposite |
| 6 | 270° | 270° | yes |
| 7 | 315° | 135° | opposite |

Look at the even samples, 0, 2, 4 and 6. The two wheels point exactly the same way. Look at the odd ones. They point exactly opposite, half a turn apart, every time. The figure steps the two wheels through the eight samples so you can watch it happen.

[[diagram:shared-arrows]]

Why? Bin 5 turns 180° per sample faster than bin 1 (225° − 45°). After an even number of samples, that extra 180° has piled up into whole turns, which don't count. After an odd number, there's always half a turn left over.

Now think about the work. To compute bin 1, the DFT turns each of the eight samples and adds them. To compute bin 5, it turns the same eight samples by the same arrows, except that the odd ones come out flipped. So split the job in two. Add up the turned even samples once: call that the **even part**. Add up the turned odd samples once: the **odd part**. Then

bin 1 = even part + odd part, bin 5 = even part − odd part.

Two bins for the price of one, plus an add and a subtract. The same holds for every pair of bins half a block apart: bins 0 and 4, 1 and 5, 2 and 6, 3 and 7.

## Splitting eight samples by hand

Let's do it with real numbers. Here's a recording of eight samples, a rough 1,000 Hz tone rounded to whole numbers:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| recording | 1 | 1 | 0 | −1 | −1 | −1 | 0 | 1 |

Split it into the even samples, 1, 0, −1, 0, and the odd samples, 1, −1, −1, 1. Here's the useful thing about the even samples: they are just a block of four. From one even sample to the next, bin 1's wheel turns back 90° (45° per sample, two samples per step). That's bin 1 of a four-sample DFT. So the even part is itself a smaller DFT:

| even sample | wheel turned back | arrow |
|---|---|---|
| x[0] = 1 | 0° (right) | 1 to the right |
| x[2] = 0 | 90° (down) | none |
| x[4] = −1 | 180° (left) | the left arrow flipped: 1 to the right |
| x[6] = 0 | 270° (up) | none |

Even part: 2, pointing right.

The odd samples each sit one sample later than an even one, so on each of them the full wheel has turned an extra 45°. So we treat them the same way. First compute the odd samples as a four-sample DFT, exactly like the even ones. Then turn that result back the extra 45° in one go.

| odd sample | wheel turned back | arrow |
|---|---|---|
| x[1] = 1 | 0° (right) | 1 to the right |
| x[3] = −1 | 90° (down) | the down arrow flipped: 1 up |
| x[5] = −1 | 180° (left) | the left arrow flipped: 1 to the right |
| x[7] = 1 | 270° (up) | 1 up |

Laid tip to tail, that's 2 to the right and 2 up: an arrow of length √(2² + 2²) ≈ 2.83, pointing 45° up. Now turn it back the extra 45°, clockwise, and it points straight right, still 2.83 long.

[[predict-bin5]]

The figure walks the four odd arrows, turns the result, and lines it up with the even part.

[[diagram:odd-walk]]

So, with no other work:

- bin 1 = 2 + 2.83 = **4.83**
- bin 5 = 2 − 2.83 = **−0.83**, an arrow of length 0.83 pointing left

This little step deserves a name, because the whole fast method is built from it. A **butterfly** takes the odd result and turns it by one arrow of the test wheel. Then it adds the turned result to the even result for bin k, and subtracts it for bin k + N ÷ 2. That one turn is an arrow times an arrow, so a butterfly costs four multiplications. Drawn with the two results on the left and the two bins on the right, its crossing lines look a bit like a butterfly's wings. The figure writes the turn as W₈¹: W for the test wheel's arrow, 8 for the block length, and 1 for one step back, 45°. It also writes bin k as X[k], so X[1] is bin 1, and the even and odd parts for bin 1 as E[1] and O[1].

[[diagram:butterfly]]

The figure draws this butterfly with our numbers on it: 2 and 2.83 going in, 4.83 and −0.83 coming out.

Now go and play with it. Edit the recording, pick a bin, and before the lab shows you, predict its partner half a block away from the same even and odd parts. You're done when three of your predictions match the lab's slow DFT, the one that turns every sample for every bin.

[[lab]]

## Again, and again

So what did splitting save? The direct DFT of eight samples does 8 × 8 sample turns at two multiplications each: 128. After one split, we do two four-sample DFTs at 2 × 4 × 4 = 32 multiplications each. On top come four butterflies, the turn-add-subtract step that made bins 1 and 5, at four multiplications each: 32 + 32 + 16 = 80. Better, but not dramatic.

Here's the move that makes it dramatic. A four-sample DFT is a DFT, so split it too, into its own even and odd samples. A two-sample DFT splits into two one-sample DFTs, and those cost nothing at all, because the DFT of a single sample is that sample. Keep splitting until there's nothing left to split. The figure splits eight samples all the way down to single samples, then builds them back up.

[[diagram:split-tree]]

What's left is only butterflies, arranged in columns. Each column is a **layer**: all the butterflies that combine small DFTs of one size into DFTs twice that size. For eight samples, the first layer turns eight single samples into four two-sample DFTs. The second turns those into two four-sample DFTs. The third turns those into the eight bins. Between the layers, the numbers sit in a list of eight places, and each place is a **position**.

Why does every layer hold exactly N ÷ 2 butterflies? Each layer puts out N numbers in total: all the bins of all its DFTs, which together add up to N. Each butterfly puts out two of them. So a layer needs N ÷ 2 butterflies, four for eight samples. You can halve eight three times (8, 4, 2, 1), so there are three layers: 12 butterflies, 48 multiplications instead of 128. Here's the whole network. Each turn in it is labelled W₈ᵏ, the 8-sample test wheel's arrow after k steps back, k × 45°. And the inputs on the left come in a shuffled order; we'll see why in a moment.

[[diagram:butterfly-network]]

That method has a name. Split the DFT into even and odd samples again and again until only butterflies are left, and you have the **FFT**, the fast Fourier transform. It needs (N ÷ 2) × log₂ N butterflies, where log₂ N is the number of times you can halve N before you reach 1. At four multiplications each, that's 2 × N × log₂ N multiplications, against 2 × N × N for the direct DFT. For eight samples the gain is under three times. It grows quickly with N, as the next figure shows. Both its axes are on log scales: going up, each grid line is ten times the one below, and going right, N doubles at each tick. That's how 48 and 2 million fit on one picture. By 1,024 samples, the direct DFT needs about 2.1 million multiplications and the FFT 20,480, about a hundred times fewer. That's why the FFT is one of the most used algorithms ever written.

[[diagram:growth]]

One side effect: look at which sample enters at each position of the first layer. For eight samples, positions 0 to 7 hold samples 0, 4, 2, 6, 1, 5, 3, 7. Write a position number in binary and read it backwards: position 1 is 001, backwards 100, which is 4. So position 1 holds sample 4. Every FFT program starts by shuffling its input into this bit-reversed order.

[[diagram:bit-reverse]]

## Making it fit on the chip

Now the real line, and first a catch. The FFT halves the block, then halves it again, all the way down to 1. That only works if N is a power of two. And 205 isn't: 205 = 5 × 41, so you can't even halve it once.

So the block length has to change. The nearest power of two above 205 is 256. Is that still a good detector? Check it the way the last lesson taught. Frequency resolution is 8,000 ÷ 256 = 31.25 Hz, finer than before, and the block lasts 32 ms, still inside the shortest key press, about 40 ms. The eight keypad tones land on:

| tone (Hz) | bin at N = 256 | bin's tone (Hz) |
|---|---|---|
| 697 | 22 | 687.5 |
| 770 | 25 | 781.25 |
| 852 | 27 | 843.75 |
| 941 | 30 | 937.5 |
| 1,209 | 39 | 1,218.75 |
| 1,336 | 43 | 1,343.75 |
| 1,477 | 47 | 1,468.75 |
| 1,633 | 52 | 1,625 |

[[diagram:bins-256]]

Eight different bins, with an empty bin between neighbors, as the figure shows. With the last lesson's 25% bar (a tone counts only if its bin scores at least 25% of what a perfect on-bin tone would), every key decodes at every phase we checked (the phase is where in its turn each tone's wheel starts): its own bins score at least 77%, and every rival scores at most 15%. The live line, though, sets its bar lower, at 12%, so that quieter callers still count. Keep that number in mind.

Now count. The chip does a million multiplications a second, and 31.25 blocks arrive each second, so each block gets 32,000.

Here's what splitting costs for 256 samples. Each small DFT left over costs 2 × size × size, and a one-sample DFT costs nothing. On top of that, every layer adds 128 butterflies at four multiplications each. The table counts both in multiplications per block, and "fits?" compares the total with 32,000.

| splits | DFTs left | small DFTs | butterflies | total | fits? |
|---|---|---|---|---|---|
| 0 | 1 of 256 | 131,072 | 0 | 131,072 | no |
| 1 | 2 of 128 | 65,536 | 512 | 66,048 | no |
| 3 | 8 of 32 | 16,384 | 1,536 | 17,920 | yes |
| 8 | 256 of 1 | 0 | 4,096 | 4,096 | yes |

The row for no splits counts all 256 bins. A direct detector could skip the mirror bins and read only bins 0 to 128, which halves it to 66,048, still twice the budget. (FFT programs for real recordings play the same halving trick, so the comparison stays fair.)

[[diagram:budget]]

The figure plots every row from 0 to 8 splits against the 32,000 line. Two splits still miss it (33,792). Three splits get you under budget. All eight get you to 1,024 butterflies, 4,096 multiplications. Per second, the FFT needs 128,000, about an eighth of what the chip can do.

## Why the split works

The hand example split one block of eight and one pair of bins. Oppenheim and Schafer, in chapter 9, do the same split for every N that's a power of two and every bin at once, and it comes down to two lines. Write \(X[k]\) for bin k, \(E[k]\) and \(O[k]\) for the DFTs of the even and odd samples, each N ÷ 2 long, and \(W_N^k\) for the test wheel's arrow after k steps back:

\[ X[k] = E[k] + W_N^{k} O[k] \]

\[ X[k + N/2] = E[k] - W_N^{k} O[k] \]

That's the general rule: compute E and O once, at half the size, and each turn \(W_N^k O[k]\) serves two bins, k and k + N ÷ 2. The book gets there from the DFT's formula in five steps; open them below if you want to see how.

**Step one: the DFT.** First, lesson 6's notation, briefly. \(j\) is a quarter turn counter-clockwise, so \(j \times j = -1\). \(e^{j\theta}\) is the point at angle \(\theta\) on the unit circle, and angles are in radians, \(2\pi\) to the full turn. From the last lesson, with the test wheel \(W_N = e^{-j2\pi/N}\), one N-th of a turn clockwise:

\[ X[k] = \sum_{n=0}^{N-1} x[n]\, W_N^{kn} \]

**Step two: split the sum** into even samples, \(n = 2r\), and odd ones, \(n = 2r + 1\). Here r just counts the pairs, from 0 to N ÷ 2 − 1. Nothing has changed yet. We've only sorted the terms.

\[ X[k] = \sum_{r=0}^{N/2-1} x[2r]\, W_N^{2rk} + \sum_{r=0}^{N/2-1} x[2r+1]\, W_N^{(2r+1)k} \]

**Step three: pull out the extra turn.** Every odd term has one more step of the wheel, \(W_N^k\), the same for all of them, so it comes out of the sum:

\[ X[k] = \sum_{r} x[2r]\, W_N^{2rk} + W_N^{k} \sum_{r} x[2r+1]\, W_N^{2rk} \]

**Step four: two smaller DFTs.** Two steps of an N-sample wheel are one step of an (N ÷ 2)-sample wheel: \(W_N^2 = W_{N/2}\). So each sum is a DFT of half the length. Call them \(E[k]\) for the even samples and \(O[k]\) for the odd ones (the book writes \(G[k]\) and \(H[k]\)):

\[ X[k] = E[k] + W_N^{k}\, O[k] \]

**Step five: the butterfly.** This step needs one new fact: a DFT of N ÷ 2 samples repeats after N ÷ 2 bins. Bin k + N ÷ 2 of it turns back a whole extra turn per sample, and whole turns don't count, so it lands on bin k. The figure shows it for a four-sample wheel.

[[diagram:wrap-wheel]]

So \(E[k + N/2] = E[k]\) and \(O[k + N/2] = O[k]\). And half a block more of turning is half a turn, which flips the arrow: \(W_N^{k + N/2} = -W_N^k\). Together:

\[ X[k] = E[k] + W_N^{k} O[k] \]

\[ X[k + N/2] = E[k] - W_N^{k} O[k] \]

Those are the two lines from the top of this section.

Now count butterflies. The two lines say an N-sample FFT is two half-size FFTs plus N ÷ 2 butterflies. So if it needs \(B(N)\), then \(B(N) = 2\,B(N/2) + N/2\), and a one-sample DFT needs none, \(B(1) = 0\). Each halving adds N ÷ 2, and there are log₂ N halvings, so

\[ B(N) = \tfrac{N}{2}\log_2 N \]

For 256 samples: 128 × 8 = 1,024.

## Do you even need every bin?

Here's a twist. Decoding the key only reads eight bins. Computing those eight directly costs 2 × 8 × 205 = 3,280 multiplications, already cheaper than the 256-sample FFT's 4,096. Can a single bin be cheaper still?

It can, with a filter you already know how to build. A quick reminder from lesson 6: a filter's H(z) is a fraction, and z⁻¹ means "one sample ago". The unit circle is the circle of radius 1 that the test wheel's tip traces. A **pole** is a point where the bottom of the fraction is zero; a pole on the unit circle makes the filter ring forever at that point's tone, which is why poles had to stay inside. A **zero** is where the top is zero, and it cancels a tone. Now break that rule on purpose. Put a pole right on the circle at bin k's point, call it p, and, because a real filter's poles come in mirror pairs, a second one at its mirror, p̄. For bin 20 at N = 205, the bin nearest 770 Hz, that point sits 360° × 20 ÷ 205 ≈ 35.1° up from the right.

Read as a program, the way lesson 6 read its feedback, that pole pair is one line. It uses the cosine, cos θ, which is the book's name for the left-right part of the arrow at angle θ:

\[ s[n] = x[n] + 2\cos\!\left(\tfrac{2\pi k}{N}\right) s[n-1] - s[n-2] \]

The number in front of \(s[n-1]\) is twice the left-right part of p's arrow. For bin 20, 2 × cos 35.1° ≈ 1.636.

Multiply the two pole factors out and you get the bottom of H(z):

\[ \left(1 - p\, z^{-1}\right)\left(1 - \bar p\, z^{-1}\right) = 1 - \left(p + \bar p\right) z^{-1} + p \bar p\, z^{-2} \]

An arrow plus its mirror, \(p + \bar p\), keeps twice the left-right part, because the up-down parts cancel: that's the 1.636. And \(p \bar p\) multiplies two arrows of length 1 at opposite angles, so it points right with length 1. The bottom is \(1 - 1.636\, z^{-1} + z^{-2}\), which read as feedback is the line above.

Feed it the key 5, the same test signal as last lesson: 770 Hz plus 1,336 Hz, each of height 1, both starting at the right of the wheel. The 770 Hz tone pushes this filter at almost exactly the speed it wants to ring. It's like pushing a swing at the right moment every time, and the ring grows steadily through the block. In the first ten samples it swings at most about 8.5 either side of zero. Around sample 100 it reaches about 90, and the last-but-one value is −158, a swing of 158. A tone at the wrong speed pushes against the swing as often as with it, and the ring stays small. The figure draws both rings side by side.

[[diagram:goertzel-swing]]

A pole on the circle rings forever, so this filter is not stable. It doesn't matter: we run it for one block, read the result, and start again from zero.

One last step turns the ring into the bin. Take the last output, and subtract the one before it, turned back by one step of the test wheel. The bars mean length: |X[k]| is the length of bin k's arrow, its match.

\[ |X[k]| = \left| s[N-1] - W_N^{k}\, s[N-2] \right| \]

For key 5 and bin 20 that length is 91.8, 90% of the 102.5 a perfect on-bin tone would score (N ÷ 2), matching the DFT's answer to every printed digit. This is the **Goertzel** algorithm. It is a filter with a pole pair on the unit circle at one bin's point, run for N samples, whose last two outputs give that one bin.

The ring has both poles, the forward one at p and its mirror, and the DFT's walk wants only the forward one. That subtraction is a zero placed on the mirror pole, applied once at the end, because you only need the last output. With the mirror gone, what's left is a filter with one pole at p. Every input sample, once it arrives, turns forward by p's angle at each later sample, and the output adds them all tip to tail. At the end of the block, sample m has turned forward by N − 1 − m steps. That's the same as turning it back by m steps, as the DFT does, and then turning the whole walk forward by N − 1 steps. Turning a whole walk doesn't change its length.

For bin 20, the last two values are \(s[N-1] \approx -117.2\) and \(s[N-2] \approx -158.1\). Turned back 35.1°, the second becomes an arrow 129.3 to the left and 91.0 up. Subtract it from the first, tip to tail, and you land 12.2 to the right and 91.0 down: an arrow of length 91.8. The figure draws that subtraction.

[[diagram:goertzel-final]]

Why is Goertzel cheaper? The number in front of \(s[n-1]\) is a single ordinary number, not an arrow, so each sample costs one multiplication. In the final step, \(s[N-2]\) is an ordinary number too, so turning it into an arrow costs two. So:

- Goertzel, 8 bins of 205 samples: 8 × (205 + 2) = **1,656**
- direct DFT, the same 8 bins: **3,280**
- FFT, 256 samples, all bins: **4,096**

For the eight keypad bins, Goertzel wins. For the whole spectrum, the FFT wins easily. Where's the crossover? At 256 samples, Goertzel costs 258 multiplications a bin, and 4,096 ÷ 258 is about 16. Want fewer than about 16 bins? Use Goertzel. More? Use the FFT. The figure draws Goertzel's cost rising with the number of bins against the FFT's flat line.

[[diagram:crossover]]

Real keypad detectors use Goertzel for exactly this reason. Your line needs the whole spectrum to reject voices, so it runs the FFT. Back to the bug.

## Your turn

Now you make the detector fit. In the lab, the chip's budget is a dashed mark on a meter: 25,625 multiplications per block at 205 samples, 32,000 at 256. The meter is on a log scale, like the growth figure, so each labelled mark is ten times the one before. A caller is pressing keys, live, and the detector is falling behind. You have two controls, the block length and the number of splits, and a list of where the eight keypad tones land for the block you pick, so you can check the detector still tells them apart.

You're done when the meter stays inside the budget and the detector decodes the caller's digits as they press them, against the lab's 25% bar. Then, if you're curious, switch the detector to eight Goertzel filters and see what the same meter says.

[[lab-act2]]

## What people get wrong

It's natural to think the FFT is a faster, rougher DFT. It isn't. It computes exactly the same N numbers, only in a smarter order. Run both on 256 random samples and they differ by about 0.000000000002, which is just rounding in the last digits. The bins are the same, and the frequency resolution is still 8,000 ÷ N. The FFT doesn't make your detector hear any better. It only makes it hear in time.

## Recap

- Cost is counted in **multiplications**: a sample turned into an arrow costs two, an arrow turned by an arrow costs four. The direct DFT costs 2 × N × N.
- Bins half a block apart use the same arrows on the even samples and flipped arrows on the odd ones.
- A **butterfly** turns the odd result by one arrow, then adds it to the even result for bin k and subtracts it for bin k + N ÷ 2.
- The **FFT** splits the DFT into even and odd samples again and again: N ÷ 2 butterflies in each of log₂ N layers. For 256 samples that's 4,096 multiplications instead of 131,072. It needs N to be a power of two, and it gives exactly the DFT.
- **Goertzel** is a filter with a pole pair on the unit circle at one bin's point. It costs one multiplication per sample per bin, and beats the FFT below about 16 bins.

## Next on the line

The detector keeps up now, live, on the cheap chip, with the line's 12% bar. For a week, everything is fine. Then two new complaints arrive.

Most presses of a loud 4 are thrown away, and the same goes for 5, 6 and B. Along with 770 Hz, the bin of a neighboring row clears the 12% bar: the 852 Hz row of 7, or the 697 Hz row of 1. To the detector it looks like two keys pressed at once. And on a long, faint rural line, keys arrive at a tenth of their usual strength. Their bins score about 8% to 10%, just under the bar, so the detector never hears them, while the spectrum screen shows them right there.

Remember the spill from the last lesson, when 770 Hz landed between two bins? It's back, and this time it's costing keys. That's the next bug.
