# Storyboard: The Whine on Line Two

**Problem:** every call on your line carries a whine. **Audience:** software engineers who finished lesson 1. **Goal:** the viewer can say where to put zeros and poles to remove one tone and keep the rest. **Emotion:** from annoyance at the bug to the satisfaction of a clean notch.

Voice: `female, middle-aged, low pitch, american accent`, designed for a calm technical teacher, one speaker locked from the first sentence. Natural speed. Two non-verbal tags: `[sigh]` at the first ticket, `[surprise-oh]` at the reveal.

Accent (coral) means one thing: the result to notice (the removed whine, the zero, the notch). Teal marks what the filter designer moves. Motion grammar: crisp hard steps for samples; smooth eased draws for curves; slow scale drift on held scenes. Palette and type from `lesson.css`; labels in Geist Mono at 48px or more.

| # | Time | Purpose | Composition | Motion | Narration (line) | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | from line 1 | hook | a call's waveform across the frame: slow voice shape with a thin fast ripple riding on it | the waveform scrolls; the ripple is drawn in coral | 1 | `4,000 Hz` | voice | hard cut | the viewer sees the whine as a fast ripple on the voice |
| 2 | line 2 | familiar situation | rows of sample values streaming left | numbers step in as crisp hard steps | 2 | `8,000 per second` | voice | hard cut | only numbers are available |
| 3 | line 3 | worked example 1 | two big rows: `+1 −1 +1 −1 ...` and their averages | each average lands as `0` in coral, one per beat | 3 | the two rows | voice | hard cut | the averages are all zero |
| 4 | line 4 | the voice survives | a slow wave's dots and their averages, nearly on top of each other | averages drop in half a sample late | 4 | `voice passes` | voice | hard cut | slow tones barely change |
| 5 | line 5 | mechanism: the circle | the unit circle draws; tone points walk from 0 Hz to 4,000 Hz | the whine's point lands on the coral zero | 5 | `0 Hz`, `4,000 Hz`, `zero` | voice | continuous | each tone has a point, the zero sits on the whine |
| 6 | line 6 | the rule | a tone point slides along the arc with a dashed line to the zero | a counter shows passes falling from 100% to 0% | 6 | `passes 100%` to `0%` | voice | hard cut | distance to the zero sets what passes |
| 7 | line 7 | the bug moves | the same circle; the whine point jumps to the top | a zero pair appears, top and mirror | 7 | `2,000 Hz` | voice | continuous | zeros move to the whine |
| 8 | line 8 | visible cost | the response curve with zeros only: a wide dip over the voice band | the voice band shades; the dip widens | 8 | `1,500 Hz: 38%` | voice | hard cut | zeros dull the neighbors |
| 9 | line 9 (hero at about 70%) | discovery: poles | poles slide in beside the zeros on a small circle inset; the curve morphs from wide dip to a sharp notch | the curve redraws as r rises to 0.9 | 9 | `38% → 97%`, `pole` | voice | continuous | the notch keeps the voice |
| 10 | line 10 | consequence: stability | a pole slides past the circle; an echo stem plot grows | stems grow by 1.1× per sample | 10 | `× 1.1 per sample` | voice | hard cut | poles must stay inside |
| 11 | line 11 | recap and next bug | the circle with zeros and poles, still; a ring of circles spreading from 2,000 Hz | gentle drift to the end | 11 | `next: the ring` | voice | end hold | the viewer leaves with the rule and the cliffhanger |

Times are filled from `vo/lines.json` and `schedule.json` once the narration exists.
