# Your Own Voice, a Quarter Second Late

## Hello, hello

The buzz from the last lesson is fixed. The booster now multiplies by 1.6 instead of 4, so even the loudest caller stays well inside the range, and loud callers sound like loud people again.

Then this ticket arrives: "I can hear myself. Every word I say comes back to me, faint, a moment later. It's like talking in a canyon." Then another, and another. You ring a test line and say "hello". A beat later, in your own earpiece, quieter and a little blurry: "...hello".

People start to stammer on calls like this, because their own voice keeps interrupting them. You time the gap on the recording: a quarter of a second, 0.25 s. At 8,000 samples per second that's 0.25 × 8,000 = 2,000 samples. Somewhere far down the line, part of your voice is bouncing back, 2,000 samples late.

Here's who is where. Look at the figure below from left to right.

[[diagram:the-line]]

On the left is the **caller**, and right beside them your company's equipment. Everything the caller says leaves through it, and everything they hear arrives through it. On the right is the **far person**. In between, your digital line runs to a box on a street corner in another city. There it hands the call to an old copper wire into the far person's house. That box isn't perfect. A little of what arrives from the caller leaks back toward them, and that leak is the echo.

You can't open the box, and you can't replace it. So here's today's question. Can you still predict, exactly, what echo it will send back for any word the caller says? Because if you can predict the echo, you can subtract it.

## What we know about the echo path

You do know one big thing about the box: you can run the two tests from lesson 1 on it. Send it a word twice as loud and the echo comes back twice as loud. Send two words at once and the echo is the two echoes added. So the echo path is **linear**: doubling the input doubles the output, and two inputs added give their outputs added. Send the same word now or ten seconds from now, and the echo is the same, just later. So it's **time-invariant** too: delaying the input only delays the output.

In lesson 1's words, it's an LTI system. Lesson 1 also gave us the book's shorthand for a system, and we'll need it today. A system is written T. You hand it an input signal, called x, and it hands back an output signal, called y. In symbols, y[n] = T{x[n]}. Here x is the caller's voice and y is the echo.

In lesson 1, being LTI was a promise about tones: an LTI system never invents a tone that wasn't in its input. Today you'll see a bigger promise. One tiny measurement tells you everything the system will ever do.

## The shortest sound there is

What's the simplest thing you could send down the line?

Not a word, and not a tone, because both last a while and have a shape. The simplest signal is a single click: one sample at 1, and every other sample at 0.

| n | ... | −2 | −1 | 0 | 1 | 2 | 3 | ... |
|---|---|---|---|---|---|---|---|---|
| click | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |

That signal is called an **impulse**: a signal that is 1 at n = 0 and 0 everywhere else. The textbook this course follows, Oppenheim and Schafer's *Discrete-Time Signal Processing* (1989), writes it \(\delta[n]\), with the Greek letter delta.

You'll also need it moved and resized. In the figure, the top row is \(\delta[n]\), the middle row is \(\delta[n - 3]\), and the bottom row is \(0.8\,\delta[n]\).

[[diagram:impulse]]

Why does "minus 3" move the click later, to n = 3? Because \(\delta[n - 3]\) is 1 exactly when \(n - 3 = 0\), and that's at n = 3. Subtracting inside the brackets means "this happens 3 samples later". You'll see that pattern again in a moment.

Now send the impulse into the echo path and record what comes back. A system's **impulse response** is what it gives back when the input is the impulse. The book writes it \(h[n]\). Here's what your line returns:

| n | 0 | 1 | ... | 1,999 | 2,000 | 2,001 | 2,002 | ... |
|---|---|---|---|---|---|---|---|---|
| h[n] | 0 | 0 | 0 | 0 | 0.4 | 0.2 | 0 | 0 |

In the next figure, notice the long flat run and the two small bars at the far end.

[[diagram:impulse-response]]

Silence for 2,000 samples, then 0.4, then 0.2, then silence for good. The box returns 40% of a click a quarter second later, and a further 20% spills into the very next sample. Written as a list, h is 2,002 numbers long, h[0] to h[2001]: 2,000 zeros, then 0.4 and 0.2. But all the information is in two things, a delay of 2,000 and two sizes, 0.4 and 0.2.

Two practical worries. First, a full-size click is a loud pop in someone's ear. You don't need one. Send a click of size 0.1 and the line returns 0.04 and 0.02. The line is linear, so a full-size click would return ten times as much: divide by the click size, 0.1, and h is 0.4 and 0.2. Second, if the far person is talking while you listen for the click's echo, their voice lands on top of your recording. So you send the click while the line is quiet, in the first moment of a call or in a pause. (The lab gives you a perfectly quiet line, so its measurement comes out exact. Real ones are never quite exact.)

Now the real question. You have two numbers and a delay. Can they really predict the echo of a whole sentence?

## The echo of one word

Let's try a very short word. Say a caller's "hi" lasts four samples (real words last thousands, but four fit on a page):

| n | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| "hi" | 0.8 | 0.4 | −0.6 | −0.2 |

Before you compute anything, make a guess. When does the echo start? How long does it last? How loud is it at its peak?

All you know is what the box does to a click. So turn the word into clicks. The next figure shows the word coming apart into four clicks of its own sizes and going back together.

[[diagram:word-as-clicks]]

Its first sample is a click of size 0.8 at n = 0. Its second is a click of size 0.4 at n = 1. Then come a click of size −0.6 at n = 2 and a click of size −0.2 at n = 3. Add those four clicks together and you get the word back, exactly.

And you know what the system does to each click:

- A click of size 0.8 at n = 0 gives a copy of h scaled by 0.8 (that's linearity): 0.32 and 0.16, from n = 2,000.
- A click of size 0.4 at n = 1 gives a copy scaled by 0.4, starting one sample later (that's time-invariance), at n = 2,001.
- And so on for the other two.

In the next figure, each click launches its own small two-bar copy of h, and the copies then drop into one row and add up. The table below is the same picture in numbers.

[[diagram:copies]]

| n | 2,000 | 2,001 | 2,002 | 2,003 | 2,004 | 2,005 |
|---|---|---|---|---|---|---|
| copy from 0.8 at n = 0 | 0.32 | 0.16 | | | | |
| copy from 0.4 at n = 1 | | 0.16 | 0.08 | | | |
| copy from −0.6 at n = 2 | | | −0.24 | −0.12 | | |
| copy from −0.2 at n = 3 | | | | −0.08 | −0.04 | |
| **echo (sum)** | **0.32** | **0.32** | **−0.16** | **−0.20** | **−0.04** | **0** |

Every entry is one input sample times one number of h. The 0.32 at n = 2,000 is 0.8 × 0.4. The 0.32 at n = 2,001 is two copies landing on the same sample: 0.4 × 0.4 from the second click, plus 0.8 × 0.2 from the first.

Now check your guess. The echo starts at exactly 2,000, because h is silent before that. Its peak is 0.32, reached twice, well under the word's own 0.8. And it sounds for five samples. Why five? As lists, the word has 4 numbers and h has 2,002, so the echo list has 4 + 2,002 − 1 = 2,005 numbers. The last copy starts at the word's last sample and runs the full length of h, which is why you add the lengths and take one away. The first 2,000 are silence, which leaves 5 that sound: one more than the word, because h's spill adds one.

There's one more thing to notice. The echo is not just the word made quieter. A quieter copy would be 0.32, 0.16, −0.24, −0.08. The real echo is 0.32, 0.32, −0.16, −0.20, −0.04, because the spill has blended neighboring samples into each other.

So yes. Two numbers and a delay, measured with one click, predicted the echo of a word you never sent.

Now play with it. In the lab, drag the word's four samples to any heights you like. Predict where the echo starts, how long it sounds and its first two samples, then the lab stacks up the copies so you can check yourself. You can change h too.

[[lab]]

## The rule, named

What you just did is called **convolution**: building the output as a sum of shifted copies of the impulse response, each scaled by one input sample. Written out:

\[ y[n] = \sum_{k} x[k]\, h[n - k] \]

The big Σ is the Greek capital sigma, and it means "add up": one term for every value of k. Here k runs over every sample index, all the whole numbers. That sounds alarming, but almost every term is zero. A term only counts when \(x[k]\) and \(h[n - k]\) are both nonzero.

Read it the way you built the table. Each k is one row. The row takes input sample \(x[k]\) and a copy of h shifted k samples later. That shifted copy is \(h[n - k]\), the same "minus means later" as the delayed click. The row multiplies the two. Then Σ adds all the rows. The next figure labels each piece of the formula with its part of the table.

[[diagram:convolution-rule]]

If you write code, the loop in the figure is the whole thing, with x and h stored as the plain lists above, h with all 2,002 numbers. Each pass of the outer loop is one row of the table. With these lists, y has 2,005 numbers, the first 2,000 of them zero. The inner loop spends almost all its time multiplying by zeros, and we'll skip those when we build the real thing.

The book writes convolution with a star: \(y[n] = x[n] * h[n]\). That star is not multiplication, though a programmer's eye reads it that way. We'll come back to what that misreading costs.

You can also read the sum one output sample at a time. Pick n = 2,002 and ask which copies land on it. Write the word along the top and, under each x[k], the number of h it's multiplied by, \(h[2002 - k]\):

| k | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| x[k] | 0.8 | 0.4 | −0.6 | −0.2 |
| h[2002 − k] | h[2002] = 0 | h[2001] = 0.2 | h[2000] = 0.4 | h[1999] = 0 |
| product | 0 | 0.08 | −0.24 | 0 |

The products add to −0.16, the same as the column in the big table. Look at the middle row: each step right in x is a step left in h. So h's two nonzero numbers come out in reverse order, with 0.4 under x[2] and 0.2 under x[1]. That's why people describe one output sample as "flip h, slide it, multiply, add". The next figure plays exactly that: the flipped pair 0.2, 0.4 slides along the word and stops at each output sample to show its products.

[[diagram:flip-slide]]

## A system from lesson 1, unmasked

Does this work for every LTI system, or only for echoes? Let's test it on one you already know.

Lesson 1 had a smoother, which averages each sample with the one before: output[n] = (input[n] + input[n − 1]) / 2. It's linear and time-invariant. So it should have an impulse response, and that should predict everything it does.

Send it a click. At n = 0 the average is (1 + 0) / 2 = 0.5. At n = 1 it's (0 + 1) / 2 = 0.5. After that, both samples in the average are 0. So the smoother's impulse response is h = 0.5, 0.5, starting at n = 0. Everything it does fits in those two numbers.

Now convolve it with lesson 1's tone. That's a 1,000 Hz tone, so its pattern comes round every 8 samples. Its samples are the cosine of an angle that grows 45° per sample, and it's silent before n = 0. Each output sample collects two copies: \(y[n] = 0.5\,x[n] + 0.5\,x[n-1]\). The values are rounded to three places.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| tone in | 1.000 | 0.707 | 0.000 | −0.707 | −1.000 | −0.707 | 0.000 | 0.707 | 1.000 |
| convolution with 0.5, 0.5 | 0.500 | 0.854 | 0.354 | −0.354 | −0.854 | −0.854 | −0.354 | 0.354 | 0.854 |

In the next figure, the left side shows the click going in and 0.5, 0.5 coming out. The right side shows the tone and this output as dots, with the n = 0 output circled.

[[diagram:smoother-response]]

From n = 1 on, this is lesson 1's row, there rounded to 0.85, 0.35 and so on. Lesson 1 left n = 0 blank, because the average needs a sample from before the call started. Convolution fills it in: before n = 0 the tone is silent, so the first output is (1.000 + 0) / 2 = 0.500.

So convolution isn't a special trick for echoes. Any LTI system, an echo, a smoother, the whole phone line, is completely described by its impulse response.

But "LTI" is doing real work in that sentence. Try the old booster, the one that multiplied by 4 and then clipped to the range. Send it a click of size 1: four times 1 is 4, clipped to 1.0. So its "impulse response" would be a single 1.0 at n = 0. Now predict a click of size 0.1. Convolution says 0.1 × 1.0 = 0.1. The booster actually gives 4 × 0.1 = 0.4. The figure puts the predicted and real dots side by side: they're four times apart. The booster isn't linear, so its answer to one click tells you nothing reliable about anything else.

[[diagram:booster-fails]]

## Why one click is enough

Why does it always work? The book's argument is short, and it uses each property exactly once. Follow it along the chain of boxes in the figure.

[[diagram:pile-of-clicks]]

**Every signal is a pile of clicks**, the "word as four clicks" idea for any signal: \(x[n] = \sum_k x[k]\,\delta[n - k]\). **Linearity** lets the system T handle the clicks one at a time and add the results: \(y[n] = \sum_k x[k]\,T\{\delta[n - k]\}\). That's the step the booster fails. **Time-invariance** says a click delayed by k gives h delayed by k, \(T\{\delta[n - k]\} = h[n - k]\). Put that in, and out comes the rule:

\[ y[n] = \sum_{k} x[k]\, h[n - k] = x[n] * h[n] \]

One more thing falls out of the formula. In the loop above, k counted positions in x. Rename the loop variable so that it counts positions in h instead: call it m, with \(m = n - k\). Then \(k = n - m\), and the same sum reads \(\sum_m h[m]\, x[n - m]\). Same terms, added in a different order. So \(x * h = h * x\).

For the echo, that second reading is very handy. h has only two nonzero numbers, at m = 2,000 and m = 2,001, so the whole sum shrinks to two terms. The echo is the whole voice delayed by 2,000 and scaled by 0.4, plus the whole voice delayed by 2,001 and scaled by 0.2. The figure builds the same echo both ways side by side: four copies of h on one side, two copies of the word on the other.

[[diagram:two-readings]]

## Catching the echo

Back in your engineer's chair. What does your equipment receive on its way to the caller's earpiece? Two things added together: the far person's voice, which the caller wants, and the echo of the caller's own voice, which they don't.

\[ \text{earpiece}[n] = \text{far voice}[n] + (x * h)[n] \]

You can't touch the far voice. But x is the caller's voice, and it went out through your own equipment, so you've seen every sample of it. You've measured h from the same spot. So you can compute \(x * h\) yourself, at the caller's end, and subtract it:

\[ \text{earpiece}[n] - (x * h)[n] = \text{far voice}[n] \]

That's an echo canceller. Call the delay you read off the click D, and the two sizes after it a and b; on this line D is 2,000, a is 0.4 and b is 0.2. Using the two-term reading, the canceller skips all the zeros of h:

```
echo_guess[n] = a * voice[n - D] + b * voice[n - D - 1]
earpiece_clean[n] = earpiece[n] - echo_guess[n]
```

In the next figure, follow a word along both paths. One copy goes out to the box and comes back as the echo. The other goes through the canceller. Both arrive at the minus sign together and vanish.

[[diagram:canceller]]

Subtracting only works because the echo path is linear. If the box clipped like the old booster, the echo wouldn't be \(x * h\), and you'd subtract the wrong thing. It also assumes the box doesn't change while you use your measurement. A real line can drift with temperature, and then you measure again.

## How exact must the guess be?

Real measurements are never perfect, so how much does a mistake cost? First we need a way to say how much echo is left. The usual one: square every leftover sample and add them up. Squaring makes negative samples count as much as positive ones, and makes big samples count more. That sum of squares, compared with the same sum for the echo alone, is what the lab's echo meter shows: 100% with no canceller, 0% when perfect.

**Sizes a bit off.** Say you measured 0.36 and 0.18 instead of 0.4 and 0.2, 10% too small. On "hi", your guess is 0.288, 0.288, −0.144, −0.18, −0.036. What's left is 0.032, 0.032, −0.016, −0.02, −0.004. Every leftover sample is a tenth of the echo's, and that holds for any word, by linearity. So the meter reads 0.1 × 0.1 = 1%. A faint whisper instead of a canyon.

**Delay one sample off.** Now the sizes are perfect, but the guess is one sample late, at 2,001. On "hi":

[[diagram:off-by-one]]

| n | 2,000 | 2,001 | 2,002 | 2,003 | 2,004 | 2,005 |
|---|---|---|---|---|---|---|
| echo | 0.32 | 0.32 | −0.16 | −0.20 | −0.04 | 0 |
| guess, one sample late | 0 | 0.32 | 0.32 | −0.16 | −0.20 | −0.04 |
| left after subtracting | 0.32 | 0.00 | −0.48 | −0.04 | 0.16 | 0.04 |

The meter reads 133%, worse than doing nothing. But don't take the wrong rule from that yet. Make a guess first: give lesson 1's steady 1,000 Hz tone the same one-sample slip. Will more of its echo be left over than 133%, or less?

[[slip-ask]]

The next table gives the steady tone that slip. It starts at n = 2,100, well after the echo has begun, so you see the steady part. Each echo sample is built the same way as before: 0.4 × the tone 2,000 samples back plus 0.2 × the tone 2,001 samples back.

| n | 2,100 | 2,101 | 2,102 | 2,103 | 2,104 | 2,105 | 2,106 | 2,107 |
|---|---|---|---|---|---|---|---|---|
| echo | −0.541 | −0.483 | −0.141 | 0.283 | 0.541 | 0.483 | 0.141 | −0.283 |
| guess, one sample late | −0.283 | −0.541 | −0.483 | −0.141 | 0.283 | 0.541 | 0.483 | 0.141 |
| left after subtracting | −0.259 | 0.059 | 0.341 | 0.424 | 0.259 | −0.059 | −0.341 | −0.424 |

Here the meter reads 59%. That's not good, but the canceller still removes about 40% of the echo. Why the difference? A slow wave barely moves in one sample, so a guess one sample late still almost lines up with it. "Hi" zigzags from sample to sample, and a zigzag one sample late is nearly upside down, so subtracting it adds. Here's what a one-sample slip leaves for steady tones of different pitches:

[[diagram:slip-tones]]

| tone | left after a one-sample slip |
|---|---|
| 300 Hz | 5.5% |
| 1,000 Hz | 59% |
| 2,000 Hz | 200% |
| 3,400 Hz | 378% |

So here's the true rule. A small delay error hurts more the higher the pitch. The low, slow parts of a voice barely mind. The crisp, fast parts get worse than no canceller at all. A large error ruins it everywhere: guess 20 samples late, and across a voice's tones the leftover swings between 0% and 400%, about twice the echo on average. That's why you read the delay off a click instead of estimating it. The click gives you the exact sample.

A real voice lands near the slow end. Phone engineers know that most of a voice's sound sits in low, slow tones, which barely move in one sample, so on the recorded call in the lab a one-sample slip leaves only about 25%.

## Your turn

The lab has a live call with the echo on it, and a click button wired to the echo path from your equipment. Your job:

1. Wait for a quiet moment, send a click, and read the impulse response. Find the delay where the first nonzero number appears, and read off the sizes that follow.
2. Type the delay and the sizes into the canceller, and play the call.

You're done when the echo meter reads 0% and the far voice still comes through at full size.

Then, if you like, slip the delay by one and play "hi" and the 1,000 Hz tone, and the meter disagrees with itself: 133% and 59%.

[[lab-act2]]

## What people get wrong

The most common slip is to treat convolution as multiplying the input by the impulse response, sample by sample: \(x[n] \times h[n]\). The book's star invites it, and in code it's one keystroke away. In NumPy, for example, `x * h` on two arrays does exactly that, one product per index. Convolution is a separate function, `np.convolve(x, h)`.

Try the sample-by-sample version on the word. The word lives at n = 0 to 3, where h is zero. h's nonzero numbers live at 2,000 and 2,001, where the word is zero. The figure lines them up on one axis: every product has a zero in it. So that version predicts no echo at all, ever, for any word. But the echo is plainly there.

[[diagram:pointwise]]

Convolution isn't one product per n. Each input sample launches a whole shifted copy of h, and every output sample adds up all the copies landing on it. That's how the echo gets to 2,000 samples after the word: the copies carry it there.

## Recap

- An **impulse** is a signal that is 1 at n = 0 and 0 everywhere else: a single click.
- A system's **impulse response** h[n] is what it gives back when the input is the impulse. The echo's is 2,000 zeros, then 0.4 and 0.2.
- **Convolution** builds the output as a sum of shifted copies of the impulse response, each scaled by one input sample: \(y[n] = \sum_k x[k]\, h[n - k]\). The star in \(x * h\) is not multiplication.
- For a linear, time-invariant system, the impulse response predicts the output for every input. For one that isn't, like the clipping booster, it doesn't.
- An echo path is LTI, so its echo is \(x * h\). Measure h with a click in a quiet moment, compute the echo, subtract it.
- Sizes a little off leave a little echo. A delay a little off hurts the sharp parts of a voice most, and a delay far off ruins everything.

## Next on the line

The echo is gone. Callers stop stammering. Then a new complaint comes in from a town your company has just connected: "Everyone sounds muffled, like they're talking through a wall." You listen and it's true. The voices are all there, with no buzz and no echo, but the crisp edges of every word have gone soft. The line is linear and time-invariant, so you know it can't have invented anything. Something has been taken away. But what, exactly, and how do you put it back?
