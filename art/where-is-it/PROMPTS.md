# Where is it? — how the pictures are made

A first exploration (2026-11-17/18) of a place-words set for Looksee: on, under, next to,
between, in. Nothing here is in the app yet. These are drafts for David to review.

## The idea

Emoji can't show where something is, and the code can't draw it. A picture can, if **only
the child or object moves** between cards. So every card is an edit of an empty *master*
scene, and every card in a scene is cropped to the same box (`cutout.mjs`): the chair stays
the same size in the same place, and the only thing that changes is the thing being taught.

## Decisions (David, 2026-11-17)

- **Cast:** the sequence app's children, Ana, Sam, Jo and Max, from their turnaround sheets in
  `~/Code/sequence/.claude/worktrees/story-champs-research-practices-55a760/img/_cast/`.
- **Nobody stands on furniture.** Children sit on the chair or under the table; *on* the table
  or the ledge is a teddy, ball or backpack.
- **Furniture:** a classic school chair-desk, redrawn from a retailer's product photo (kept
  in `refs/`, which git ignores, and never committed), a classroom table, a window with a deep
  ledge, and a toy bin for *in*.
- **Background:** made on cream `#f7f2e7`, then cut out to transparent so a card sits on any
  stage theme.

## Files

| Path | What | In git |
|---|---|---|
| `briefs/` | every prompt, word for word, one file per image; `*.txt` in capitals are the shared blocks | yes |
| `gen.sh` | runs one brief through Codex with its reference images | yes |
| `cutout.mjs` | cuts out the background, crops each scene to one box, builds the review page | yes |
| `refs/` | chair photo, cast turnarounds, R1–R3 reference sheets | no |
| `drafts/` | masters `M*`, cards, `cut/` (512 px PNG + AVIF), `old/` (replaced versions), `index.html` | no |
| `public/where-is-it/` | the same sheet, light (AVIF cutouts, 512 px JPEG originals, `noindex`), published with the site at `…/looksee/where-is-it/`. Rewritten by every `cutout.mjs` run; no reference sheets | yes |

## Making an image

```
art/where-is-it/gen.sh drafts/T1-teddy-on-table briefs/T1-teddy-on-table.txt \
  drafts/M2-table.png refs/R3-lineup.png refs/R2-furniture.png
```

`gen.sh` calls the Codex CLI that ships inside the ChatGPT app
(`/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`, 0.166). The Homebrew one
(0.46) is too old for the model in `~/.codex/config.toml` and fails with a 400. It runs
`codex exec --ephemeral` at low reasoning effort, attaches the references with `-i` in the order
the brief names them ("Image 1 is …"), and asks Codex to save exactly one PNG. **Its stdin must
be closed** (`< /dev/null`): run in the background without that, `codex exec` waits forever for
more input. Several runs in parallel worked (nine at once).

About **1 minute and 10–30k Codex tokens per image**. Masters and cards come back 1254 × 1254.

## The blocks

Each brief is put together from these (all in `briefs/`):

- `STYLE` — flat picture-card look, brown outlines, the cast's muted palette, plain cream, no
  text, no shadows, no floor line.
- `STAGE` — the square master layout: camera at a child's eye level, every foot on one
  imaginary floor line 82% down, and where the seat, table top, ledge and bin rim fall for a
  seven-year-old 70% of the picture tall.
- `EDIT` — "This is an EDIT of Image 1 … Add ONLY what is described below."
- `CAST-ana`, `CAST-sam`, `CAST-jo`, `CAST-max` — each child described from their turnaround.

## The images

| Image | References, in order | Notes |
|---|---|---|
| R1 chair | chair photo, Sam turnaround (style) | front, side, three-quarter |
| R2 furniture | R1, Jo turnaround (style) | table, window and ledge, toy bin, backpack, ball, teddy |
| R3 line-up | R1, R2, Sam | the scale every card is held to |
| M1 chair · M2 table | the first master, R3 | redrawn smaller: the first ones left no room for a standing child (`drafts/old/`) |
| M3 window · M4 chair + table · M5 bin | R1 and/or R2 | |
| C1–C3 chair · T1–T3 table · W1–W3 window · B1–B2 between · N1–N2 bin | master, R3, then the child's turnaround or R2 for a prop | |

## Review log

| When | What | Result | Next time |
|---|---|---|---|
| 11-17 | R1 chair (smoke test) | Clean redraw, no brand marks. 26k tokens. | |
| 11-17 | R2 furniture | First run hung all night: `codex exec` was waiting on stdin. Rerun fine, 41k tokens. | Always `< /dev/null`. |
| 11-18 | R3 + M1–M5 | All usable. The ball and teddy are big beside Sam. M1 and M2 filled too much of the square. | State the furniture's height as a share of the picture, not only its positions. |
| 11-18 | W1–W3, B1–B2, N1–N2 | W1, B1, B2, N2 read at a glance. W3: Ana's feet floated above the floor strip and the window moved; redone. N1/N2: the bin drifted a little from M5. | Tie a standing child's shoes to something drawn (the strip). |
| 11-18 | cutout | A global tight-tolerance pass speckled the cream window frame and silver legs; now only enclosed cream patches are cleared, down to 0.05% of the picture (0.2% left the gap under the chair-desk's tablet). The cast's cream shirts survive. | |
| 11-18 | C1–C3, T1–T3, W3 again | All read at a glance. W3's feet now stand on the strip. T2: Max sits a little forward, his legs past the front table legs, so *under* is weaker than it should be. T3: the table drifted left a little. | For *under*, ask for the child's whole body, feet too, to be between the four legs. |
| 11-18 | T1 | David spotted the bear on the table had one eye: Codex drew it that way. Fixed by mirroring the left eye about the nose with ImageMagick (`drafts/old/T1-teddy-on-table-one-eye.png` kept), so nothing else moved. | Check faces at full size, not only at thumbnail size. |
| 11-18 | published | The sheet is on the site at `where-is-it/` so David can show it (508 KB). The service worker neither stores it nor answers a visit to it with the app (`globIgnores`, `navigateFallbackDenylist`); a test holds both. | |
