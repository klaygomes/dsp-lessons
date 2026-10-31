# The Whistle That Changed Its Mind

## A clean, wrong tone

The east route sounds crisp again. Last lesson its old smoothing circuit muffled every voice, you boosted each band back to full strength, and the callers stepped out from behind the wall. For a couple of weeks, nobody complains about anything.

Then a hearing clinic calls. They run check-ups over the phone: the patient puts on headphones at home, and the clinic plays a series of pure test whistles, one pitch at a time. The patient says "yes, I hear it" or "no". It's cheap, it's quick, and it works fine at low pitches. But at 5,000 Hz something strange happens. Patients report a clear, steady whistle. When the clinic asks them to match its pitch with a tone generator, they all land on the same pitch: 3,000 Hz.

Not a fuzzy 5,000 Hz. Not a quiet 5,000 Hz with some crackle. A clean, confident, wrong 3,000 Hz.

And that's dangerous, because it means a patient who can't hear 5,000 Hz at all will still say "yes, I hear it". The line isn't failing quietly. It's lying, fluently.

You check the obvious things first. The clinic's whistle generator really does play 5,000 Hz; you put a meter on it. The east route's boost only multiplies tones, and you know from lesson 3 that a linear, time-invariant system can't turn one tone into another. So whatever is going on happens before any of your systems even sees the sound. It happens at the very first step, where the sound becomes numbers.

Time to look hard at that step.

## What the phone stores

Sound in the air is a smooth, continuous wobble of pressure. The clinic's speaker makes one, the patient's ear would happily hear it, and the phone's microphone picks it up. That wobble, the sound that went into the phone before sampling, is what we'll call **the true tone**. It's the thing we actually care about.

The phone can't keep a smooth wobble. It's a computer, so it keeps numbers. You met those numbers in lesson 1: each **sample** is one measurement of the sound at one moment. At regular moments, the phone measures the true tone and writes down what it got.

How often? The number of samples in one second is the **sampling rate**, and on your line it's 8,000. That's one sample every 1 ÷ 8,000 of a second, which is 125 microseconds. Between two samples, the phone looks away. Whatever the sound does in those 125 microseconds, the phone never sees it.

The picture below shows it: a smooth wave, a tick every 125 microseconds, and a dot where each tick meets the wave. The dots are all the phone keeps.

[[diagram:sampler]]

So the phone ends up with a list of numbers. That list is what the phone **stores**, and nothing else survives sampling. Every system from lessons 1 to 3 works on numbers, so it only ever sees what the phone stores. So does any program you will write for this line. None of them sees the true tone.

Which raises the real question. Does the list always pin down the true tone? Could two different true tones ever hand the phone the same list?

Make a guess before reading on.

## Worked example 1: three tones

You already have a way to get a tone's samples: lesson 3's wheel. A tone is a dot on the rim of a wheel with radius 1. A tone's pitch is simply how far it turns the wheel between two samples: 360° × tone ÷ 8,000, which is 45° for every 1,000 Hz. Each sample is the dot's left-right position, far right +1, far left −1. (That left-right reading is what mathematicians call the cosine of the dot's angle, which is why cosines keep turning up.)

So let's sample three true tones. First 1,000 Hz, which turns 45° per sample. Then the clinic's whistle, 5,000 Hz, which turns 225°. And a 3,000 Hz tone, the pitch the patients heard, which turns 135°.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| 1,000 Hz | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 | 0 | 0.71 | 1 |
| 5,000 Hz | 1 | −0.71 | 0 | 0.71 | −1 | 0.71 | 0 | −0.71 | 1 |
| 3,000 Hz | 1 | −0.71 | 0 | 0.71 | −1 | 0.71 | 0 | −0.71 | 1 |

Look at the last two rows. They're identical. Not close: identical, sample for sample, forever. (Run it for ten thousand samples and the biggest difference is a rounding error in the eleventh decimal place.)

[[diagram:same-dots]]

There's the bug, sitting in a table. Draw the 5,000 Hz wave and the 3,000 Hz wave on the same axes and they look nothing alike, yet they pass through exactly the same dots at every sample. The phone stores those dots. At the other end, the line turns the list back into sound, and it has no way of knowing which true tone made it. It plays the 3,000 Hz one, for a reason we'll reach once we have the rule. First, why do the lists match at all? The wheel knows.

## When a wheel turns too far

Lesson 3's wheel table stopped at 4,000 Hz, the flip, where the dot jumps 180° straight across every sample. Let's go past it.

| tone | turn per sample |
|---|---|
| 1,000 Hz | 45° |
| 3,000 Hz | 135° |
| 4,000 Hz | 180°, a flip |
| 5,000 Hz | 225° |
| 7,000 Hz | 315° |
| 8,000 Hz | 360°, a full turn |

The clinic's whistle turns the dot 225° between two samples. That's more than half a turn. Start at the right, turn 225° counter-clockwise, and the dot lands at the lower left. The 3,000 Hz tone turns 135° and lands at the upper left. Now draw a horizontal line through the center of the wheel. Those two are mirror spots across it: one above the line, one below, equally far to the left. A sample only reads how far left or right the dot is, so both give the same sample.

The next figure shows both wheels side by side, with the horizontal line dashed and a drop line from each dot to its left-right reading.

[[diagram:wheel]]

Why do they land on mirror spots? Because 225° is exactly 135° short of a full turn (360° − 225° = 135°). So the whistle's dot ends up 135° *below* the starting point, while the 3,000 Hz dot ends up 135° *above* it. The same holds at every later sample. After n samples, the whistle's dot sits n × 135° below the right, and the 3,000 Hz dot sits n × 135° above it. Mirror spots, every time, so the two lists match sample for sample.

The picture below steps both dots together for eight samples and writes their readings side by side. They match at every step.

[[diagram:mirror]]

There's another way to say the same thing. Ending 135° below the start is what a dot turning 135° *clockwise* would do. So a dot turning 225° per sample, seen once per sample, looks exactly like a 3,000 Hz dot turning backwards. And a sample can't tell backwards from forwards, because the mirror spots read the same.

Here's the idea in one sentence: a wheel that turns more than half a turn per sample looks like a slower wheel turning backwards, and the samples can't tell backwards from forwards.

You've seen this trick at the cinema. A film camera takes 24 pictures a second. A car wheel turning 23 times a second turns 23 ÷ 24 of a full turn between pictures: 345°, which is 15° short of a full turn. On screen, the wheel seems to creep backwards by 15° per picture, one slow turn backwards per second, while the car speeds forwards. The camera didn't blur anything. It just looked too rarely. The figure shows film frames in a row, the spoke stepping back 15° each time.

[[diagram:cinema]]

Now go and play with it. In the lab, drag the true tone from 0 Hz upwards, past 4,000, all the way to 8,000. The wheel shows the dot's stop after every sample, and a meter shows the tone the phone stores. Before you start, predict three things. What does a 4,500 Hz tone get stored as? What about 7,000 Hz? And 7,800 Hz, just short of a full turn?

[[lab]]

## The limit, and the alias

Here's what the lab shows. The stored tone climbs with the true tone, right up to 4,000 Hz. Then it turns round. Past 4,000, every step up in the true tone is a step *down* in the stored one: 4,500 comes out as 3,500, and 7,000 as 1,000. At 8,000 the stored tone reaches 0 Hz, a dot that never moves. Plotted as stored tone against true tone, that's a tent: a straight climb to 4,000, then a straight fall back to 0.

[[diagram:turn-round]]

The tone where the stored tone turns round has a name. **The limit** is half the sampling rate, here 4,000 Hz; tones safely below it are stored truthfully. The limit itself is a knife edge, as you'll see in worked example 2. It's the tone that turns the dot exactly half a turn per sample. Below it, every tone turns the dot less than half a turn, the short way round is the real way round, and what's stored is what went in. Above it, the short way round is the wrong way round, and the phone stores a tone that never went in.

That false tone is an **alias**: a lower, false tone that gives the same samples as a higher, true one. The patients heard the alias of the clinic's whistle. 3,000 Hz is the alias of 5,000 Hz.

[[diagram:fold]]

The picture is a strip of paper folded at the limit. Lay the true tones along it, 0 to 8,000 Hz, and fold the part above 4,000 back under. Every true tone above the limit lands on top of its alias. 5,000 sits 1,000 above the limit, so it lands 1,000 below: 4,000 − 1,000 = 3,000.

Notice what the fold doesn't do: it doesn't blur the tone. It moves it.

## Worked example 2: an awkward tone, and the fold's far side

The whistle's numbers were suspiciously tidy, all 0.71s and 1s. Does the fold still hold for a tone that doesn't land on neat angles? Take one you'll meet again in the lab: a faint, steady squeal at 4,600 Hz, from a worn fan bearing in a caller's room. It sits 600 above the limit, so the fold says it should land 600 below: 3,400 Hz. On the wheel, 4,600 Hz turns 207° per sample, and 360° − 207° = 153°, which is 3,400 Hz. Let's check with the samples.

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| 4,600 Hz | 1 | −0.89 | 0.59 | −0.16 | −0.31 | 0.71 | −0.95 | 0.99 | −0.81 |
| 3,400 Hz | 1 | −0.89 | 0.59 | −0.16 | −0.31 | 0.71 | −0.95 | 0.99 | −0.81 |

Messy numbers, same list. The rule doesn't care whether the angles are pretty.

Now push the other way, to 8,000 Hz, the full turn. The dot turns 360° per sample and lands back on the right every single time, so every sample reads 1: 1, 1, 1, 1, 1. The phone stores a constant, 0 Hz. A loud, piercing true tone becomes no tone at all. It's the cinema wheel that looks perfectly still because it turns exactly once between pictures.

And past 8,000? A full turn per sample is invisible, so you can always take a whole turn off and get the same samples. 9,000 Hz turns 405°, which looks like 45°: stored as 1,000 Hz. 13,000 Hz turns 585°, which is 225° once a full turn comes off, so it does whatever 5,000 Hz does: stored as 3,000 Hz. The fold is really a zigzag, the climb and fall repeated. Up to 4,000, down to 0 at 8,000, up again to 4,000 at 12,000, and so on forever. Every true tone, however high, is stored somewhere between 0 and 4,000 Hz. The figure plots stored tone against true tone out to 16,000 Hz, with 5,000, 9,000 and 13,000 marked.

[[diagram:zigzag]]

Here's where the rule gets uncomfortable: a true tone at exactly 4,000 Hz, sitting on the fold itself. Start its dot at the right, as usual, and it flips between far right and far left: 1, −1, 1, −1. Now start the very same tone a quarter of a cycle later. On the wheel, its dot now starts at the bottom, a quarter turn clockwise behind, because older is clockwise (a phase of 90°, in lesson 3's words). Each half turn takes it from the bottom to the top and back. Both spots sit dead center left-right, so every sample reads 0. Start the dot anywhere in between and you get a flip of some size between full and nothing. Same true tone, same pitch, and how much of it the phone stores depends only on timing. That's the knife edge. Tones safely below the limit don't have this problem, which is why real lines keep their tones a little below 4,000 Hz.

The figure shows one 4,000 Hz wave three times: sampled at its peaks, sampled at its middle crossings, and sampled in between, with the stored samples written under each.

[[diagram:knife-edge]]

## Why the fold is exact

This course follows Oppenheim and Schafer, *Discrete-Time Signal Processing* (1989), and what you've just worked out is the heart of its chapter 3. Here it is in the book's notation, in five steps.

**Step one: sampling is reading at moments.** Write \(T\) for the time between samples, \(T = 1/8000\) of a second. The book writes the true tone as \(x_c(t)\), with \(c\) for continuous and round brackets because \(t\) can be any moment. The samples get square brackets, \(x[n]\), because \(n\) only counts whole samples. Sampling is reading the true tone at \(t = nT\):

\[ x[n] = x_c(nT) \]

**Step two: sample a tone.** A true tone at \(f\) Hz turns \(f\) full turns every second, so by time \(t\) its dot has turned \(f t\) full turns, which the book writes as \(2\pi f t\), counting one full turn as \(2\pi\). Its left-right reading is \(x_c(t) = \cos(2\pi f t)\), so

\[ x[n] = \cos(2\pi f n T) = \cos(\omega n), \qquad \omega = 2\pi f T = 2\pi \times \frac{f}{8000} \]

That \(\omega\) is lesson 3's turn per sample, measured in radians, where a full turn is \(2\pi\) instead of 360°. For 5,000 Hz, \(\omega = 2\pi \times 5/8 = 5\pi/4\), which is 225°.

**Step three: a full turn is invisible.** Take one whole turn off \(\omega\) and look at the samples:

\[ \cos\big((\omega - 2\pi)\, n\big) = \cos(\omega n - 2\pi n) = \cos(\omega n) \]

Because \(n\) is a whole number, \(2\pi n\) is a whole number of full turns, and full turns change nothing. On the wheel, the extra lap per sample is a ghost loop the dot runs between looks. It ends exactly where the dot would have been anyway.

[[diagram:full-lap]]

Taking a turn off means taking 8,000 Hz off the tone, so \(f\) and \(f - 8000\) give the same samples. For the whistle: \(5\pi/4 - 2\pi = -3\pi/4\). That's minus 135°, the backwards wheel.

**Step four: backwards is invisible too.** The cosine reads only left-right, and that doesn't care which way you turned:

\[ \cos(-\omega n) = \cos(\omega n) \]

So \(-3\pi/4\) gives the same samples as \(3\pi/4\). That's 135° per sample, and turning that back into a tone gives \(f = (3\pi/4) \div 2\pi \times 8000 = 3000\) Hz. The alias, derived.

**Step five: the general rule.** Put steps three and four together. A true tone is stored as its distance to the nearest whole multiple of 8,000 Hz. That distance can never be more than half of 8,000, so every stored tone lands between 0 and the limit. The book turns this into the sampling theorem. Keep every tone of the true sound below half the sampling rate, and the samples pin the sound down exactly.

## Why you can't fix it afterwards

So now you know what happened at the clinic. Could you write a program that spots the alias and moves it back to 5,000?

No. And this isn't a "nobody has found the trick yet" no. Look at worked example 1 again. The list the phone stores for the 5,000 Hz whistle is exactly, number for number, the list it would store for a genuine 3,000 Hz tone. Any program, however clever, only gets the list. Same list in, same answer out. A real 3,000 Hz test and the clinic's 5,000 Hz test are the same numbers, so no software anywhere can tell them apart.

The far end has the same problem when it turns the list back into sound. So it follows a rule: of all the true tones that could have made these samples, play the one below the limit. For every tone below 4,000 Hz that's the right choice. For the whistle it's the wrong one, which is why the patients hear 3,000 Hz.

So the fix has to happen before sampling, while the sound is still a smooth wobble and 5,000 Hz is still 5,000 Hz. There are two ways.

**Sample faster.** At 16,000 samples per second the limit moves up to 8,000 Hz, and the whistle turns only 112.5° per sample. It would be stored correctly. But your line runs at 8,000 samples per second, and every phone and switching center on it was built that way. You can't change the rate this month.

**Filter first.** Put a filter in front of the sampler. This one isn't a program. It's a small electronic circuit between the microphone and the sampler, so it works on the smooth sound before any numbers exist. That's the one place on the line where the true tone can still be touched. Its job is to keep the tones the line can store and remove the ones it can't. Lesson 3's frequency response still applies: it's a statement about tones, and the smooth sound is made of tones too. A circuit like this scales and delays each tone, just as the east route did.

What should its frequency response be? Gain near 100% for the voice, and gain falling to nearly 0% by 4,600 Hz. The tone where a filter switches from keeping to removing is its **cutoff**. No real filter can drop from 100% to 0% in an instant. It needs some room to do it, and that's why phone lines carry the voice only up to about 3,400 Hz. The stretch from 3,400 to 4,600 Hz is the room the filter uses to go from keeping to removing. It also keeps the voice away from the knife edge. (There's a bonus, too: the little of a true tone between 4,000 and 4,600 Hz that still leaks through the slope folds into 3,400 to 4,000, above the voice.)

The figure shows the chain: microphone, then filter, then sampler. Above it sits the filter's gain curve, flat at 100% up to 3,400 Hz and sloping down to about 0 at 4,600. The voice is shaded, and the whistle and the squeal are marked beyond the cutoff.

[[diagram:filter-first]]

With the filter in place, the whistle never reaches the sampler, so it can't be folded. The clinic gets silence at 5,000 Hz instead of a lie. And silence is the honest answer: your line can't carry that pitch, and now it says so.

## Your turn

In the lab, a call is coming in. It carries three things:

- a caller's voice, with tones up to 3,400 Hz,
- the clinic's 5,000 Hz whistle,
- the 4,600 Hz squeal from the fan.

Before you touch anything, recall where each one gets stored. The whistle lands at 3,000 Hz, and the squeal lands at 3,400 Hz. The strip below shows what that means: the voice, up to 3,400 Hz, with the two aliases drawn as spikes inside it, among the voice's own tones.

[[diagram:voice-aliases]]

1. Put the filter after the sampler first, and look for a cutoff that removes both aliases but keeps the voice.
2. Then try the filter in the other place.

You're done when every alias is out of the voice band and the voice keeps at least 90% of every tone up to 3,400 Hz.

[[lab-act2]]

If you tried the filter after the sampler, you met the wall. By then the whistle is a 3,000 Hz tone and the squeal a 3,400 Hz tone, sitting among the voice's own tones. A cutoff below 3,000 removes the aliases along with the top of the voice. A cutoff above 3,400 lets both through. Anywhere in between costs you voice and still keeps the whistle's alias. Before the sampler, the same filter wins easily, because there the whistle and the squeal are still above the voice, where a cutoff can reach them.

## What people get wrong

Most people picture sampling too slowly the way they picture a low-resolution photo. Too few samples, so you lose detail: the whistle comes through blurry, or rough, or a bit quieter. It doesn't work like that at all. Too few samples don't make a worse version of the true tone. They make a different tone, and that tone is perfectly clean, as clean as any real one, because its samples *are* the samples of a real one. That's what made the clinic's bug so nasty. A blurry whistle would have sounded broken, and someone would have reported it. A clean, wrong whistle sounded fine.

## Recap

- **The true tone** is the sound that went into the phone. The phone measures it at the **sampling rate**, here 8,000 samples per second, and the list of samples is what it **stores**.
- On the wheel, a tone turns 360° × tone ÷ 8,000 per sample. More than half a turn looks like a slower wheel turning backwards, and the samples can't tell backwards from forwards.
- **The limit** is half the sampling rate, here 4,000 Hz. Tones safely below it are stored truthfully.
- A true tone above the limit is stored as an **alias**, a lower, false tone with the same samples. Fold at the limit: 5,000 Hz is stored as 3,000 Hz, and 4,600 Hz as 3,400 Hz.
- After sampling, an alias can't be undone. Filter out tones above the limit before sampling.

## Next on the line

The filter goes in, the clinic hears honest silence at 5,000 Hz, and the line is clean. Then the company connects your line to a new wideband line, one that runs at 16,000 samples per second and carries voices with tones up to just below 8,000 Hz. To join them, you have to change the sampling rate. And on the first test call, every voice that crosses over brings a ghost: a faint mirrored copy of itself, sitting above 4,000 Hz, where nobody was speaking. Where do the ghosts come from? That's the next bug.
