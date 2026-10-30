# The phone line: lessons in digital signal processing

A series of story-driven lessons on Oppenheim and Schafer's *Discrete-Time Signal Processing* (Prentice Hall, 1989). You are building a digital phone line. Every lesson opens on a bug your customers can hear, and ends when you fix it yourself in an interactive lab.

| # | Lesson | Bug | Page | Video |
|---|---|---|---|---|
| 1 | Sampling and aliasing | a 5,000 Hz whistle comes out at 3,000 Hz | [3-page.html](01-sampling-aliasing/3-page.html) | [final.mp4](01-sampling-aliasing/4-video/final.mp4) |
| 2 | Zeros and poles | every call carries a whine | [3-page.html](02-zeros-and-poles/3-page/3-page.html) | [final.mp4](02-zeros-and-poles/4-video/final.mp4) |

Each lesson folder holds four representations of the same idea:

- `1-prose.md` and `1-sheet.md`: the lesson text, and the teacher's sheet (objective, terms, misconception, numbers).
- `2-diagram-*.html`, `2-machine/`: the figures. The test bench in lesson 2 is an interactive isometric figure.
- `3-page/`: the interactive page, built from the prose (`python3 build.py`).
- `4-video/`: the storyboard, the narration script and the film.

`series.md` holds the story world, the glossary every lesson shares, and the next bug.

Lesson 1 was made with an earlier version of the process and will be rebuilt.

## How they are made

With the `klay-learning-ladder` skill for Claude Code: [diagram-design](https://github.com/cathrynlavery/diagram-design) for diagrams, [anatomy](https://github.com/wheresryan22/anatomy) for the test bench, [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) for the films, and [agent-voice](https://github.com/klaygomes/agent-voice) for the narration.

## License

Lesson text, figures, pages and videos: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Code (labs, build scripts, figure builders): MIT. The narration and the caller's voice were generated with OmniVoice, whose weights are non-commercial only. See [NOTICE](NOTICE).
