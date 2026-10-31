# The phone line: lessons in digital signal processing

A series of story-driven lessons on Oppenheim and Schafer's *Discrete-Time Signal Processing* (Prentice Hall, 1989). You are building a digital phone line. Every lesson opens on a bug your customers can hear, and ends when you fix it yourself in an interactive lab.

Open [index.html](index.html) in a browser for the course: sixteen lessons in the book's order, each linked once its page is ready. The pages are plain HTML files with `lesson.css` beside them; they need no server.

Each lesson folder holds four representations of the same idea:

- `1-prose.md` and `1-sheet.md`: the lesson text, and the teacher's sheet (objective, terms, misconception, numbers).
- `2-figures/`: the figures, one per concept, built from `figures.mjs` with the shared kit in `_kit/`.
- `3-page/`: the interactive page, built from the prose (`python3 build.py`).
- `4-video/`: the storyboard, the narration script and the film.

`series.md` holds the story world, the glossary every lesson shares, and the next bug.

`_kit/` holds the shared figure, page and lab code. `python3 _kit/index.py` rebuilds `index.html` from `series.md`.

## How they are made

With the `klay-learning-ladder` skill for Claude Code: [diagram-design](https://github.com/cathrynlavery/diagram-design) for diagrams, [anatomy](https://github.com/wheresryan22/anatomy) for the test bench, [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) for the films, and [agent-voice](https://github.com/klaygomes/agent-voice) for the narration.

## License

Lesson text, figures, pages and videos: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Code (labs, build scripts, figure builders): MIT. The narration and the caller's voice were generated with OmniVoice, whose weights are non-commercial only. See [NOTICE](NOTICE).
