# Meridian — Decision record

> Split out of CLAUDE.md when that file outgrew the context limit.
> CLAUDE.md carries what Meridian is and the standing rules; this file
> carries the detailed record of every implementation decision — what
> was tried, what it cost, and why the current shape won. **Read the
> section covering an area before changing it**, and record new
> decisions of this kind here, not in CLAUDE.md. Section references like
> §4, §5 and §7.2 point at CLAUDE.md's numbered sections.

### The theme

**Themed twice, and the second one is where the numbers below come from.**
Meridian was themed to heizen.work — cream `#FDFBF5`, deep teal `#3A738F`,
coral `#E0584C` — then to a reference dashboard (indigo chrome, ivory body,
white cards, cyan accent). Both are recorded here rather than in git alone
because the *reasoning* transfers to the next one.

**The hues below are the reference's; the lightness in the code is one step
deeper than the table says.** A readability pass reset every ink token against
a floor of 7:1 rather than AA's 4.5:1 — see *Contrast is set for a reader who
is not twenty-five*. Read the table for where a colour came from and
`globals.css` for what it is.

The structural idea is **two surfaces, not one.** Chrome — brand, surface tabs,
utilities — sits on deep indigo and is navigation. Everything below is document.
That split survives the header redesign and is in fact clearer for it: chrome is
now exactly the 48px strip at the top, and there is no second dark band under it
competing to say the same thing.

**Heizen Brand is the default now, and Daylight is gone.** What this section
records is where the product's colour reasoning came from, not what it currently
paints: see *One theme, four modes* below for the set as it stands. The
paragraphs from here down describe Daylight, which was the default for three
re-themes and is the palette every measurement in this file was first taken
against.

**No mode is ever automatic, and that has not changed.** The
`prefers-color-scheme: dark` block is gone from `globals.css` and the
`matchMedia` fallback went with the toggle: every mode other than the default is
opt-in through `[data-theme="..."]`, which `ThemePicker` sets and the inline
script in `layout.tsx` restores before first paint. A tool demoed to investors
on an unknown machine should not pick its palette from that machine's OS
setting, and dark exists so a designer can check the health colours rather than
as a preference to be guessed at.

**Nothing may read `data-theme` during its own render, and dark mode was
silently broken for as long as something did.** `ThemeToggle` seeded its state
with `useState(currentTheme)`, reading the attribute off `<html>` while
rendering. The server has no `document`, so it rendered the moon; a client with
dark stored rendered the sun. Two different **elements**, not two values of one
attribute, which is the distinction that matters: `suppressHydrationWarning`
forgives a mismatched attribute or text node and never a differing child. So
React failed hydration, regenerated the whole tree on the client, recreated
`<html>` in the process and took the inline script's `data-theme` off it. **A
stored dark choice reverted to light on every single load**, and the same
regeneration client-rendered the head script, which is the *"Encountered a
script tag while rendering React component"* error in the console. One read on
the render path, three symptoms, and the two visible ones both pointed at
`layout.tsx` rather than at the component actually responsible.

It is `useSyncExternalStore(subscribe, readTheme, serverTheme)` now: hydration
renders `getServerSnapshot` on both sides and re-reads the DOM only afterwards,
so there is nothing to disagree about. Same primitive and the same reason as the
section-collapse store and the assistant's width, including the part about not
putting a `setState` inside an effect, which `pnpm lint` rejects. The DOM
attribute stays the single source of truth and React holds no second copy that
could drift from it. The cost is one frame of the wrong **icon** under a stored
dark theme; the palette itself is right from first paint, because the CSS keys
off an attribute the inline script has already set.

**The script in `layout.tsx` has to stay a raw inline `<script>`.**
`next/script` with `strategy="beforeInteractive"` was tried and only queues the
source into `__next_s`: measured, `data-theme` was still unset at
DOMContentLoaded and at the first animation frame, landing at `load` (~180ms)
against ~35ms for the inline version. That is the palette flash the script
exists to prevent, so the React warning is not fixable from that end. It was
never the script's fault.

**None of the four harnesses could see any of this**, which is why it survived:
they set `data-theme` directly after load rather than storing a choice and
reloading, so they never exercise the restore path that breaks. It was found by
driving a real browser with a seeded `localStorage` across all eight surfaces in
both themes and reading the console. **If the theme plumbing changes, that is
the check** — `check:ui` will report green through it.

**`--primary` is `#22415b` now, on request.** A deep slate blue, replacing the
reference dashboard's indigo `#252150`. It is one value in two roles — the 48px
chrome strip and every filled button — and white on it is 10.6:1.

Three families moved with it, and the reason is that a near-black carries its
hue further than it looks:

- **The ink.** `--foreground` went from the violet-black `#1a1a2e` to the
  slate-black `#16222e`, and `--confidence-high` and `--metric-actual` with it.
  Violet ink under blue chrome reads as two palettes rather than one.
- **The masthead greys.** `--masthead-muted` was `#bcbfd6`, a violet-leaning
  grey matched to the old indigo, and read purple against slate. It is
  `#b3c3d2`, 5.90:1 on the strip.
- **The canvas.** Documented from the start as "a pale indigo pulled from the
  masthead", so it is a pale slate pulled from the masthead.

The ivory page, the white card and the warm neutrals did **not** move: that
warmth against a cool chrome is the theme's character and it works under any
chrome hue. Nor did the cyan accent, the health hues or the effort family —
none of them is derived from `--primary`.

| | Reference | Meridian token |
|---|---|---|
| Masthead | `#252150` → `#22415b` | `--masthead`, `--primary` |
| Ivory page | `#F6F4F1` | `--background` |
| White card | `#FFFFFF` | `--card` |
| Indigo ink | `#1C1C33` | `--foreground` |
| Cyan-teal | `#00A6B8` | `--accent-soft` — rules, dots, bars, fills |
| Cyan-teal, deepened | `#0B6E79` | `--accent`, `--evidence`, `--ring` — anything read |
| Green | `#0FA958` | deepened to `#107D45` for `--health-healthy` |
| Red | `#E2504F` | deepened to `#C22F2E` for `--health-critical` |

**Three hues were deepened rather than copied, for the same reason the old coral
was.** The reference is a consumer dashboard putting cyan, green and red on 20px
numbers and chart bars, where WCAG asks 3:1. Meridian puts the same roles on 13px
table text, where it asks 4.5:1. Measured against the ivory page and the white
card:

```
cyan  #00A6B8  2.68 / 2.94  ->  #0B6E79  5.43 / 5.96
green #0FA958  2.80 / 3.07  ->  #107D45  4.73 / 5.20
red   #E2504F  3.48 / 3.82  ->  #C22F2E  5.11 / 5.62
```

So the deepened value carries anything read, the sampled value carries anything
merely seen. **The hue is the reference's; the lightness is the product's.** That
sentence has now survived two themes; expect it to survive the next.

**One token family was added after the re-theme:** `--effort-*` (low / medium /
high), a colour and a surface each, defined in all three theme blocks. It is
its own family rather than a reuse of `--health-*` on purpose: health is a
reading about the client's process, and what a fix costs to deliver is not a
statement about how healthy anything is. It happens to share hex values with
health in light mode; **that is a coincidence and not a link**, and splitting
them later must not require finding every call site. Each ink is measured
against its own surface, not against the card underneath it.

A `--source-*` family was added alongside it and removed a day later — see
*The source strip*. The tokens are gone from `globals.css` rather than left
sitting unused, which is the rule: a semantic token with no call site is a
palette entry pretending to be a decision.

**Three things the re-theme changed beyond tokens**, because a palette swap could
not express them:

- **The section heading voice.** It was italic in the brand colour. It is now ink
  at 600. The reference is disciplined about its accent — cyan appears on links
  and nowhere else, so a coloured word always means somewhere to go. Meridian had
  cyan on every section heading too, which is the larger and more frequent use;
  the colour would have stopped meaning "interactive" within one screen. Size and
  weight were already doing the landmark work.
- **Cards where cards are true.** The collection surfaces — Gaps, Questions,
  Sources, Compare, Operations — are made of `Panel`: separate things side by side,
  which is the condition a card is for. Research **Full deliberately is not**. It
  is a continuous document with a navigator, and a border between "How the total
  is built" and the buckets it reconciles is a wall between two halves of one
  argument. Full gets the white-on-ivory as a **single sheet** with its sections
  open inside it. **The navigator beside it is a card, though** — it is a second
  object on the page, not an annotation on the sheet, and on the bare ivory it
  read as loose text floating next to the document. See *The navigator* below.
- **`ThemePicker` takes a `tone`.** It lives on the masthead in the app and could
  live on the page. Masthead greys are ~2:1 on ivory, so one set of tokens cannot
  serve both. This is the general shape of the trap: **masthead tokens do not
  invert with the theme and page tokens do.** Anything placed on the band must be
  coloured from the `--masthead-*` family.

  It replaced `ThemeToggle`, which was a two-state button. See *A theme is a
  register, not a palette* below for why there are now three and what a theme is
  allowed to change.

### A theme is a register, not a palette

On request, replacing the light/dark binary. The control is a menu;
`src/lib/themes.ts` is the registry and `ThemePicker` is the control. It grew to
five themes and has since collapsed to one theme in four modes — *One theme,
four modes*, below — but the rule this section states is the one that survived
both moves, and it is why the collapse cost an afternoon rather than a sweep.

**The request that shaped it: a theme is not just colour.** Style and, a little,
layout move with it. So a theme here carries five things beyond hue, and the
first two needed no new machinery because they were already tokens:

| What | Token | Why it is a theme's business |
|---|---|---|
| Corner language | `--radius` | A ledger has square corners; a dashboard has round ones |
| Shadow or rule | `--elevation-card` / `-raised` | "This floats" is a screen idiom, not a print one |
| Body tracking | `--tracking-body` | Print sets at 0, screens set slightly tight |
| Page gutter | `--frame-gutter{,-sm,-xl}` | A printed page has margins |

The last two are indirections added for this, and they are deliberately few.
**Every structural token is a value that has to be right in every mode at four
viewports**, so the list is short on purpose. The type scale is explicitly *not*
on it: it is set for a reader who is not twenty-five, and a theme that shrinks
it is a theme that fails the one rule no layout can substitute for.

**What a theme may never change is anything a reading depends on.** Colour still
encodes health and fill still encodes evidence (§4). The accent still means
"somewhere to go" and is still spent once per screen. The chrome is still one
strip that is navigation and everything under it is still document. A theme that
moved any of those would not be a theme, it would be a fork. The rule that makes
this cheap is the old one: **no component contains a raw hex or a bare Tailwind
palette class**, so a theme is a block in `globals.css` and nothing else.

#### One theme, three modes

On request, and it is a subtraction rather than a design. **The product ships
one theme, Heizen's, in three modes: Brand, Dark and Contrast.** Daylight,
Studio and Broadsheet are deleted. Brand is the default and is now the `:root`
block itself; the other two are `[data-theme]` blocks over it.

**Why it is right, and it is not only tidiness.** Heizen has an identity manual.
A product that ships that identity *and* two palettes belonging to nobody is a
product that has not decided what it looks like, and the picker was asking a
consultant minutes before a call to choose between five options, two of which
(Daylight and Studio) differed mostly in how cool the white was. A menu is a
question; five entries where there was no real decision to make is the same
overwhelm §7.1 names as the product's failure mode, applied to its own chrome.

**What each of the surviving modes is *for*, which is the test they had to
pass:**

| Mode | The situation it exists for |
|---|---|
| Brand | The default. Any screen, any time |
| Dark | A phone in a car park at 7pm, and checking the dark health hues |
| Contrast | A client's projector, a laptop seen at an angle, a reader Warm Sand fails |

Studio had no answer to that column. It was a well-drawn contemporary register
that existed because a third register was interesting, and once the brand
arrived it was the same product in someone else's clothes.

**Brand carries every token; the other two override only what their mode is
about.** The Cream, Graphite, Dusty Teal, Dusty Sky Blue and Warm Sand, the 16px
corner, the warm lift and the Inria Serif italic titles are set once in `:root`
and inherited unless a mode has a reason to move them. Dark moves the ground and
swaps which of the two brand blues is read and which is seen; Contrast moves the
legibility floor.

**`:root` and `[data-theme="heizen"]` are the same block, deliberately.**
`:root` is what makes Brand paint with no attribute set. The attribute half is
what lets the picker name it, and what makes its swatch resolve: `Swatch`
renders a mode's colours inside a `data-theme` scope on a plain `<span>`, where
the `:root` half matches nothing at all.

**The costs, recorded so they stay decisions:**

- **Inter is no longer loaded.** It carried Daylight and Studio; every mode now
  sets Figtree for body and Inria Serif for both heading voices. An unused
  Google Font is a download every reader pays for so a token nothing reads can
  resolve. `--font-sans-family` went with it.
- **A stored `light`, `studio` or `broadsheet` no longer resolves**, which is
  exactly what the whitelist in `layout.tsx`'s restore script is for: a browser
  holding any of them gets Brand and a picker that agrees with the page, rather
  than an attribute on `<html>` matching no block while the picker shows a mode
  that does not exist.
- **The picker names modes, not the brand.** "Brand", "Dark", "Contrast", with
  *Heizen theme* as the menu heading. "Heizen Contrast" on the trigger is a
  control that stops fitting beside the project switcher at 640px, and the
  masthead wordmark has already said whose product this is.

#### Contrast, and why it is a mode rather than a fifth theme

It moves one variable: every ink that carries meaning clears **7:1** against
both grounds it lands on, and most clear 9:1. Ink is black, the muted ink is
11.42 on the page, and the teal deepens a second time to `#17444F` (9.49 page /
10.63 card) with Brand's `#3A6779` dropping into the *seen* role.

**The shadow comes off and the rule comes on**, which is the one structural move
it makes. Brand separates page from card with a warm lift over a 1.06:1 step,
and a lift over a narrow step is the first thing a washed-out projector
destroys. So `--elevation-card: none` and the hairline becomes `#6B6558`, 5.79:1
on the card — a line rather than a suggestion. The 16px corner stays: the
brand's shape was never what was hard to see.

**What it does not do is spend the accent more often.** A contrast mode that
paints more things in more colours is a screen nobody can find anything on,
which is the opposite of the point. The accent still means "somewhere to go" and
is still spent once per screen, and the non-colour carriers that make the
readings survive a bad screen in the first place — `EffortChip`'s three filled
dots, the dashed stroke on an `unknown` node — are untouched, because they were
already doing this job.

**It is opt-in, and deliberately not wired to `prefers-contrast`.** Same reason
no mode reads `prefers-color-scheme`: a demo machine's OS setting is not a
decision this product gets to have made for it. If that turns out to be the
wrong call for a consultant who needs it every time, the fix is a stored
preference they set once, not a media query that surprises a room.

#### Broadsheet, and why it is gone

**Removed on request. The block, the `THEMES` entry and the restore-script id
are all deleted**, and this section stays as the record of what it was and what
went with it.

It was the one mode that changed the *register* rather than the ground or the
legibility floor, and that is what cost too much. Ground and floor are one
question each — which colours, how much contrast — and the rest of the product
does not have to know. A register reaches into the corner language, the
tracking, the gutter and whether a card is separated by a shadow or a rule, so
every new surface has to be checked twice: once as a screen and once as printed
matter. That is a second product's worth of shape to keep true, bought for a
reader who never asked for it. Aryan is minutes before a call. He is not
choosing a typographic register.

**What is worth keeping from it, and what is not lost.** Rules instead of
shadows and a real hairline live on in Contrast, which needs them for a reason a
consultant can name. The single-sheet document register Research Full uses is a
property of that surface, not of the theme, and it is untouched. The four-brown
warning below is the durable finding: on a warm palette, pushing hues past 7:1
collapses red, green and amber into one another sooner than on a cool one.

The original entry follows.

The brief was a theme matching the tool's own personality and logic, and the
product had already half-written it. Meridian is a dossier read minutes before a
call; every claim traces to a source; Research Full is described in this very
file as "a continuous document with a navigator" and is deliberately set as a
single sheet rather than as cards; the tab control is already an underline on a
rule rather than a pill. Broadsheet takes the register the product reaches for
on its most-read surface and makes it the whole product.

- **Paper, not white.** The page is warm stock, the card is a sheet laid on it.
  Daylight separates the two by 1.06:1 and leans on a shadow to finish the job;
  here the step is 1.13:1 and does the work alone.
- **Rules instead of shadows.** `--elevation-card: none`. Twelve gap rows in
  twelve floating cards is exactly the visual noise §7.1 calls this product's
  failure mode. `--elevation-raised` survives, because a drawer over a document
  genuinely is above it and has to say so.
- **Square corners.** 8px → 4px. It is 4 and not 2 because `--radius-sm` is
  `calc(var(--radius) - 4px)`: at 2px that computes to `-2px`, which is invalid,
  and the declaration is dropped rather than clamped.
- **Ink chrome.** A deep ledger green-black instead of slate blue. The
  two-surface split survives and arguably reads better: the tension becomes ink
  against paper, which is the oldest version of the same idea. Paper on it is
  15.5:1.
- **Wider margins from `sm` up, and not on the phone.** At 375 the gutter is
  most of what separates a row from the edge, and margin bought there comes
  straight out of the sentence.

Contrast is held to Daylight's floors, measured against both grounds each ink
lands on (stock `#efeae0`, sheet `#fbf8f2`): muted ink 7.28/8.23, evidence
6.19/7.00, healthy 5.70/6.45, critical 5.79/6.55, watch 6.23/7.04. The four hues
stop short of 7:1 for the reason Daylight's do, and the margin is thinner here:
on a warm palette the point where a red, a green and an amber become four browns
is nearer than it is on ivory.

#### Studio, and why a fourth is a register and not a colourway

On request: something more creative and modern. It is built as **the opposite
of Broadsheet on every structural axis**, which is the discipline that keeps a
theme list from turning into a swatch book.

| axis | Daylight | Broadsheet | Studio |
|---|---|---|---|
| radius | 8px | 4px | 14px |
| card | hairline + shadow | rule only | lifted, soft shadow |
| tracking | -0.008em | 0 | -0.011em |
| ground | warm ivory | warm stock | cool near-white |
| chrome | slate blue | ledger ink | deep violet |
| accent | deep cyan | deep teal | violet |

Broadsheet is flat, square and warm because it is print. Studio is lifted,
round and cool because it is software. Daylight sits between them, which is
what a default should do.

- **The violet is spent exactly as carefully as the cyan.** §7's restraint rule
  does not get an exemption for being modern: the accent still means "somewhere
  to go" and appears on links, the tick-box and the focus ring, and nowhere
  else. A theme that spends a vivid hue forty times a screen is not expressive,
  it is a screen nobody can find anything on.
- **The corner is the tell, and it forced the shadow.** At a 14px radius the
  3px shadow Daylight uses reads as a rendering artefact rather than as lift,
  so `--elevation-card` takes a wide, low-alpha spread. Round corners and a
  tight shadow is the combination that looks broken rather than soft.
- **The health hues are Daylight's, unchanged.** A red that means "critical"
  may not become a different red because the page got cooler. This is the line
  the whole system rests on: a theme may change the voice and never the
  reading.

Contrast holds the same floors as every other theme, measured against both
grounds each ink lands on (page `#f3f4fa`, card `#ffffff`): muted ink
7.20/7.90, accent 6.48/7.11, healthy 5.69/6.25, critical 5.89/6.47, watch
6.50/7.13. White on the chrome is 13.75:1, and the canvas edge holds the 3:1
non-text floor at 3.35 against Daylight's 3.38.

**Adding it was three lines outside the stylesheet**, which is the system
working: a block in `globals.css`, an entry in `THEMES`, and the id in the
restore script's whitelist. `check:ui` picked it up with no edit at all,
because it reads the ids out of the CSS.

#### Heizen Brand, and what happens when the palette comes from outside

On request, built from `Heizen Brand Guidelines_compressed.pdf` (2025 Identity
Manual). It is the only theme whose values come from outside this product, so
it is the one that tests the rule the other four merely follow.

The manual specifies Pure White `#FFFFFF`, Cream `#F8F6EF`, Graphite `#2A2A2A`,
Dusty Teal `#5C95A8`, Dusty Sky Blue `#ACCBD2`, Warm Sand `#E2D4C4`, with
**Inria Serif Bold Italic** for headings and titles and **Axiforma** for
sub-headings and body. Five of the six colours are used exactly as given: cream
is the page, white is the card, graphite is both the ink and the chrome, warm
sand is the hairline, dusty sky is the chrome accent.

**Dusty Teal is the one value that could not be used as specified, and this is
the third time this product has hit that exact problem.** `#5C95A8` is 3.07:1
on cream and 3.32:1 on white. A brand palette is drawn for a logo, a deck and a
business card, where a teal at that weight is right; this product puts the same
role on 14px table text, where WCAG asks 4.5:1. So the teal is deepened to
`#3A6779` for anything **read** (5.72 cream / 6.18 card) and the manual's exact
`#5C95A8` carries everything merely **seen** — rules, dots, bars, fills, where
the floor is 3:1 and it clears it. The identity survives at every size anybody
actually looks at it, which is the same split the reference dashboard's cyan
took and the original coral before that. **The hue is the brand's; the lightness
is the product's**, for the third time.

**The typography is where a theme grew a new capability.** A theme could carry
colour and structure but not a typeface, because the families were named in
`layout.tsx` and wired straight into `@theme`. There are now three
indirections — `--font-body-family`, `--font-display-family`,
`--font-accent-family` — plus style, weight and tracking tokens for the two
heading voices, so `.font-display` and `.accent-heading` can be a bold italic
serif in one theme and a grotesque at 600 in another without a component
knowing anything about it. `layout.tsx` loads every family and names them
nowhere else, so "a theme is a block in `globals.css`" is still true.

- **The serif is gone from the whole product**, on request, and the way it
  went is the argument for the indirection existing. Inria Serif Bold Italic
  carried `.font-display` and `.accent-heading`, which is every section
  heading, every document lead and the band on What to build. Removing it was
  three lines in the typography block — all three roles now point at the body
  face — with no sweep through call sites and no class renamed, so nothing
  downstream had to know the voice changed.
  - **The two heading roles stay separate tokens** even though they resolve to
    the same family. Collapsing them would make a future split a sweep again.
  - **The settings invert with the family.** Both roles were italic 700 with
    tracking near zero, which is what an italic serif wants: it is already wide
    and the -0.02em a grotesque asks for pinches it. On the geometric sans the
    display voice takes -0.02em and the section voice 600 at -0.015em, so
    weight and tracking do the separating that the family used to.
  - **The download went with it**, the same day rather than eventually. The
    note in `layout.tsx` had already recorded what was wrong with leaving Inter
    loaded after Daylight and Studio were cut: an unused Google Font is a
    download every reader pays for so that a token nothing reads can resolve.
  - What this costs is real: the manual specifies Inria Serif for headings and
    titles, so the product is now one face where its identity asks for two.
    That is a deliberate override of the brand guidelines, not an oversight.
    Restoring it is the three family lines and the `layout.tsx` import.
- **Axiforma is licensed and is not, so the body is Figtree** — the stand-in
  this repo has used for Axiforma before. Keeping the same stand-in makes the
  substitution one decision recorded once rather than a fresh guess each time.
  Buying the licensed face replaces one import.
- **The type scale is still not themeable and must not become so.** It is set
  for a reader who is not twenty-five. A theme may change the face and the
  heading voice, never the size.
- The display tracking comes back from -0.02em to -0.01em in this theme: that
  value was drawn for a grotesque and pinches an italic serif.

**Modern and creative in Studio's register**, as asked: 16px corners, cards
lifted on a warm-toned shadow, generous margins. The lift is doing real work
here rather than being decoration — cream and white are only **1.06:1** apart,
the narrowest page/card step of any theme, so the shadow is what carries the
card. A neutral grey shadow greys a cream page, hence the graphite tint.

**What does not move, here as everywhere:** colour still encodes health, fill
still encodes evidence, and the accent still means "somewhere to go". The health
hues are Daylight's, re-measured on cream (healthy 5.78, critical 5.98, watch
6.60). **A brand does not get to restate what a red means** — that is the line
between a theme and a fork, and an identity manual is exactly the pressure that
would blur it.

#### The store watches the attribute

`subscribe` runs a `MutationObserver` on `<html>`'s `data-theme` as well as
holding the listener list. Without it the claim the file makes — that the DOM is
the single source of truth — was not true: anything setting the attribute from
outside the component left the trigger showing the previous theme's name and
swatch over a page painted in the new one. Both screenshot harnesses set it that
way, which is how it surfaced. A store that does not observe its own source is
not a store.

#### The harness reads the themes out of the stylesheet

`check:ui` and `shots.mjs` both took a hardcoded `["light", "dark"]`. They now
scrape `[data-theme="..."]` out of `globals.css`, so **a mode added in CSS is
contrast-checked and screenshotted whether or not anyone remembered the
harness.** They each used to prepend the implicit `:root` default by hand; they
no longer need to, because Brand's block carries `[data-theme="heizen"]`
alongside `:root` and the scrape finds it. The failure worth preventing is a theme
nobody can see being wrong, not one nobody can pick.

One thing found while doing it, and worth knowing: **the Brief fit check only
ever ran the default theme.** It loops themes now. It also currently loops over
an empty `BRIEFS`, because Brief takes Full's scrolling layout and is no longer
a fixed screen — so several claims elsewhere in this file about Brief not being
allowed to scroll describe a constraint the code dropped. Treat them as history.

#### The picker

A menu, not a cycle button. Four modes cannot be cycled through by a control
that shows one icon, and a user who wants Brand back should not have to pass
through Dark and Contrast to reach it.

- **The trigger is the band's own idiom, because the first version hid.** It
  was a 28px circle with a palette outline in it, and on a dark strip beside a
  filled pill and a project switcher carrying a monogram and a name, a grey
  line-icon in a ring is the quietest thing on the row. It was reported as
  looking like a help button, which is exactly what it looked like. It is now
  what `ProjectMenu` already is: a mark, a name and a chevron. Three things say
  "control" where none did.
- **It is deliberately not filled.** `AiButton` is the one filled control in the
  chrome and the masthead's single place for boldness, spent on the thing that
  *does* something rather than navigating somewhere. Two filled pills side by
  side and you read both before pressing either. Obvious is bought with a
  border, a swatch and a word. Measured, it now matches `ProjectMenu`'s 32px
  exactly and sits beside `AiButton`'s 30 — it reads as the band's second
  trigger rather than as a second call to action.
- **The mark is the current theme's swatch, not a palette glyph**, so the
  control says which register you are in as well as what it is for.
- **The name says where you are**: `aria-label` is "Theme: Daylight. Change
  theme", and the name is visible from `sm`. Below that it hides exactly as the
  project switcher's does — at 375 it is competing for the last hundred pixels,
  and the swatch plus chevron still read as a control. Measured at 375 / 640 /
  1024 / 1440: 54px on the phone and 115px above it, no overlap with `AiButton`
  and no page overflow at any width. That check is not optional here, because
  two boxes overlapping is the one fault `check:ui` structurally cannot see, and
  this corner of the band has produced it before.
- **Each row carries a swatch drawn from the theme it advertises**, by putting
  `data-theme` on the swatch itself and painting it from `--background`,
  `--primary`, `--card` and `--accent`. It is the one place in the product that
  renders another theme's colours while not in that theme, and it means a swatch
  can never drift from the theme it stands for: adding a block to `globals.css`
  and an entry to `THEMES` is the whole change, with no third place to update.
- **The restore script whitelists the ids** rather than passing through whatever
  is in `localStorage`. A stored id from a renamed theme would otherwise put an
  attribute on `<html>` matching no block, and the page would paint the default
  while the picker showed something else. The list is inlined in `layout.tsx`
  because that script runs as a string before any bundle does.
- Keyboard contract is `ProjectMenu`'s, because two popovers on one strip with
  different manners is two products: Escape closes and returns focus, Tab out
  closes, a click anywhere else closes.

### Contrast is set for a reader who is not twenty-five

On request, and it is the change with the widest reach in this pass because it
touches every line of text in the product.

**Type went up one step.** Body 15px → 16px, secondary 13px → 14px, labels 11px
→ 12px. About 7% on every line of prose, which is the difference between
comfortable and squinting for a reader over fifty, and the one thing no amount
of layout can substitute for.

**The headings went the other way.** `--text-h1` was 36px because it was set on
a 213px band that needed filling. On a compact header a 36px surface name
shouts at the reader before they have read anything, so it is 28px, and the
display size that carries Money's ₹9.1 Cr came down from 56px to 44px with it.
Eight sizes total, unchanged in count.

**Every ink token is measured against both grounds it actually lands on** — the
ivory page and the white card — and the floor is **7:1**, not AA's 4.5:1:

```
muted ink   #4d5064   7.22 page / 7.93 card   (was #5b5e70, 5.87 / 6.40)
evidence    #0a656f   5.94 / 6.52
healthy     #0e6f3d   5.55 / 6.09
critical    #b32826   5.86 / 6.43
watch       #7f4c10   6.12 / 6.72
```

The four hues stop short of 7:1 on purpose: past that they stop being a red, a
green and an amber and start being four browns, and this product needs health
to be readable as *hue* at a glance on a projector. 7:1 is the floor for
anything neutral carrying prose; AA is the floor for anything carrying meaning
in its colour.

**One pairing that used to be below AA is now fixed.** `--confidence-low` was
`#8b8e9e`, which is 3.25:1 on white. It only ever painted a mark rather than
text, so nothing caught it — `check:ui` reads text nodes. It is `#6b6e80`, 5.04
on white, and the three-step ramp is still distinct at 5.04 / 7.93 / 15.6.

**The tick-box grew and its target grew more.** 16px → 18px, with
`after:-inset-1` putting a 26px hit area under it. The label *was* the box, so
the whole target was 16px square, under the 24px floor a touch device needs —
on a surface read on an actual phone minutes before a call.

**What paid for the extra height**, because a fixed screen had to absorb all of
it: the header giving back about 120px, the Run button hiding below `roomy` on
Brief, and one three-sentence Brief standfirst going to two. `check:ui` clears
all four viewports and `verify-stakeholder.mjs` clears all four (it covered
twenty person × viewport combinations before the picker went). Three Briefs clipped in between, by 24, 41 and
57px; they are the measurement that the budget was real.

### The design system is shadcn's now

On request, so the prototype reads as production rather than as a one-off.
`components.json` (new-york, `cssVariables: true`, lucide), primitives in
`src/components/ui`, Radix and `class-variance-authority` in `package.json`.

**The tokens did not move to meet it; shadcn's names were aliased onto ours.**
`--color-popover`, `--color-secondary`, `--color-destructive`, `--color-input`
and the `--radius-*` steps are `var()`s of tokens that already existed, so a
component generated by `shadcn add` inherits this product's colours with no
edit. That was only possible because `design-system` had been followed
literally: no component contains a raw hex or a bare Tailwind palette class.

**One deliberate departure from stock, and it is recorded in `ui/button.tsx` as
well as here.** shadcn's `--accent` is a hover *surface*. Meridian's `--accent`
is the cyan *ink* that means "somewhere to go" — the one colour this product
spends carefully. A stock ghost button would fill itself cyan on hover and
spend it forty times a screen, so the quiet variants hover to `--muted`
instead. **There is no `--color-accent-foreground`**, which is what makes a
stock `hover:bg-accent hover:text-accent-foreground` fail at build time rather
than quietly painting a button cyan.

What did *not* convert, and why:

- **`SelectField` stays a native `<select>`**, now wearing shadcn's trigger as
  `ui/select-native.tsx`. Radix Select would match `ProjectMenu`, but that one
  is navigation. This picks a value, which is the element's actual job, and the
  native one is keyboard-operable and screen-reader correct for free, cannot be
  scrolled off the edge of a card, and opens the platform's own picker on a
  phone. That last point is worth more here than usual.
- **`Checkbox` stays the `appearance-none` input.** It is already focusable, in
  the tab order, and themed in both palettes off `--evidence` and `--card`.
  Radix would add a dependency for no user-visible gain.
- **`SwitchTrack` stays.** Four of its tracks are `<Link>`s that navigate;
  Radix Tabs cannot be that. `ui/tabs.tsx` exists in the same underline
  register for anything that genuinely is a tab set.

#### `cn` is tailwind-merge now, and that retires a bug this file records four times

`cn` was `parts.filter(Boolean).join(" ")`. Under a plain join, two conflicting
utilities on one element are settled by their order in the **stylesheet**, not
by the order they are written — so `` `${FIELD} w-12` `` silently kept
`w-full`, a base `max-w-full` beat a caller's `max-w-[calc(...)]`, and
`` `${FIELD} text-base px-3` `` would have kept `text-small`. Every one of
those is written up below as its own trap. They were one trap.

It is `clsx` + `tailwind-merge` in `src/lib/utils.ts`, with `@/lib/cn`
re-exporting it so no import line had to change.

**The extension is not optional.** tailwind-merge classifies `text-*` as a font
size only for names it knows (`sm`, `lg`, `2xl`, …) and treats everything else
as a colour. Our scale is `micro / small / base / lead / h3 / h2 / h1 /
display`, so without `extendTailwindMerge` every `"text-small
text-muted-foreground"` in the product would collapse to the colour alone and
the size would vanish. **Adding a size to `@theme` means adding it to
`lib/utils.ts` in the same change.** `shadow-card` and `shadow-raised` are
registered there for the same reason.

### The page header, which on most surfaces draws nothing

`SurfaceHero` in `src/components/shell/`, still called that because the route
through it has not changed even though what it draws has. What is left of it is
`actions` and, on two Research directions, `titleNode`.

**The surface name and its description are gone**, on request, and they were
the last two things in this header. The masthead is two inches above with
*Operations* underlined in it, so `<h1>Operations</h1>` under that is the screen
telling you where you are for the second time; and *"How this company runs, in
three levels. The money is at the bottom one."* is the screen explaining
itself, which §7.2 rules out. Between them they cost about 70px at the top of
every surface. **`line` is deleted from the props**, so nothing can pass one by
accident.

**`title` survives as an `sr-only` `<h1>` and must keep being passed.** A page
with no `h1` is a page a screen reader user cannot orient in, and "the tab says
it" is not true for someone who has jumped straight to the main landmark. It
costs nothing rendered and it is the only reason the prop is still there. The
five Briefs that carried a `roomy`-only `Research` heading in `titleNode` lost
it to this; Stakeholder's picker lost the heading beside it the same way.

**With neither `titleNode` nor `actions` — Operations, Compare, Sources — the
header renders the heading and no box at all**, so the surface's own frame
decides the space under the masthead. That is deliberate: an empty header with
padding on it is the band coming back in miniature. Operations gains the whole
70px as map.

**`actions` has since left too**, on request, and the header on Research, Gaps
and Questions now draws nothing either. It was the cost this section used to
record as a known one: a row holding one or two buttons and a great deal of
ivory, on three surfaces. Each of those three already had a row of its own
directly underneath — Research's Direction and Detail tabs, Gaps' Order and
Area dropdowns, Questions' Arrange tabs — and each of those rows is about
350–400px of a full-width frame. The buttons drop into space that was already
empty and three more headers disappear.

**What that gives up, so it is not rediscovered as a bug.** The old split was
*work you start* on the chrome, *readings of the body* on the page, and it is
why Questions' Arrange came off the band in the first place. It does not
survive the chrome going away, because there is nothing left to put the first
half on. **Position on the row carries it instead**: settings and tabs at the
reading edge, buttons at the far end, on all three surfaces. If that turns out
not to be enough separation, the answer is a rule between them like the one
Gaps already draws between its two dropdowns, not a header brought back to hold
two buttons.

**`w-full sm:flex-1` on the tracks, not `flex-1`** — the fifth time this repo
has hit that exact trap and the first time it is written down as a rule rather
than as an incident. `flex: 1 1 0%` plus `min-w-0` is permission to shrink
below the content's own width, so beside a `shrink-0` button the Arrange tracks
collapsed to ~180px at 375 and *By text* scrolled out of sight instead of the
row wrapping. Giving the child a hypothetical size the button's line cannot
hold is what actually forces the wrap. **Any `shrink-0` control put on a row
with a scroller needs this.**

**What is left in the header is `titleNode`**, which is an opening that is
content rather than a label: Money Brief's ₹9.1 Cr display is the whole point
of that direction. **One of twelve Research views**, and nothing at all on the
other five surfaces — Stakeholder's person picker was the second and is gone;
see *Stakeholder Brief has no picker* below.

Before that, it was a compact header carrying the name and the line, and before
*that*: 

**a 213px indigo band with a photograph in it and three tiles on it.** All
three went in one pass, and the reasoning is worth keeping because each one
looked right on its own.

- **The photograph.** `public/hero-port.jpg`, a loaded container ship blended
  to luminosity so it arrived as texture in the brand colour rather than as a
  second palette. It was the best available version of a bad idea, and the
  giveaway is what it cost to keep safe: the contrast checker walks to the
  nearest opaque ancestor, so it could not see through the blend, and every
  label on every band had to be verified by screenshotting it and reading the
  composited pixels — 86 labels, four bands, two viewports, both themes, and
  a re-measure any time the crop, the opacity or the scrim moved. That is a
  standing tax on a screen a consultant opens with four minutes to go. The
  asset is deleted, along with `supply-chain.svg`, `--hero-image`, `.hero-art`
  and `.hero-scrim`. **`public/` holds no images at all now**, which is the
  cheapest way to keep it that way.
- **The tiles.** Three numbers about the surface you are already on, above the
  surface itself. Sources led with "9 sources ingested" over a list of nine
  sources; Gaps led with "12 gaps found" over twelve gaps. A count of a list
  that is fully visible two inches below it is not a first read, it is the same
  read twice — and the row of them pushed the actual material about a third of
  a screen down on every surface in the product. `HeroTile` is gone from the
  type, so nothing passes tiles by accident.
- **The indigo.** Once the picture and the tiles had gone, what was left was a
  dark block whose only remaining job was to be tall. The masthead above it is
  still indigo and still says *chrome*; a second dark band under it was saying
  it again, in three times the height.

**What that bought, measured rather than claimed.** On Gaps at 1440 the first
row of the list moved from y≈370 to y≈240. On Research Full the document lead
moved from y≈240 to y≈250 while gaining the whole direction switcher above it,
which used to sit below the band. Every surface's first useful pixel is now
above 260.

**One header, two shapes.** `tight` is Research Brief, which is a fixed screen
and pays for its own padding; everything else is the default. There is no
third variant and no `compact`. Note that `SurfaceHero`'s `tight` is not
`ResearchSwitches`' — that one no longer changes any size, only whether
`RunButton` shows below `roomy`. See *The switch*.

- **No eyebrow.** Every band opened with the company and sector in caps, which
  is what the masthead's project switcher already says on every screen. The
  prop went first, the title and the line followed, and the order is the
  argument: each one was a second statement of something already on screen.
- **On a tight header the actions hide below `roomy`.** Brief on a phone is a
  glance — one screen, no scrolling, read in a corridor — and re-running the
  pipeline is not something anybody does there. Beside a wide title the button
  wrapped to a line of its own, which is 40px of a screen that has none. This
  is one of the three changes that paid for the larger type; see below.
- **`titleNode` survives for a title that is typeset rather than written.**
  Money's ₹9.1 Cr display, and nothing else. Stakeholder's person picker was
  the other one and has been removed.

**Everything the header touches is page-toned now, and that retired a whole
class of bug.** The `--masthead-*` family exists because those values do not
invert with the theme, and anything drawn on the indigo had to be coloured from
it — Questions' toggle went up there wearing `text-muted-foreground` and landed
at 2.32:1, and Stakeholder's five picker chips were masthead-toned purely
because of where they sat. The family is still defined and still correct for
the 48px strip at the top. Nothing below that strip may use it, and there is now
much less below it that could.

**`--masthead-tile` and `--masthead-tile-border` are deleted.** A semantic token
with no call site is a palette entry pretending to be a decision.

### The masthead is one line

Wordmark, project switcher, surface tabs, utilities. It was two rows; collapsing
it buys about 30px on every screen. It is now the only dark thing in the
product, and the only chrome: the indigo band that used to sit under it is
gone. Items
`items-stretch` so the active tab's underline lands on the band's bottom edge
rather than floating inside it.

**It came back down a step, on request: 48px, from 56.** The readability pass
put every size in the product up one step, and the masthead took that rise as
well as the height it needed to hold it. That is the one place the extra size
buys nothing — nobody *reads* the chrome, they aim at it, and a tab is found by
position long before it is found by letterform. So the tabs are `text-small`
again, the project switcher with them, its monogram is 24px rather than 28, and
`Ask Helix` lost a step of padding. The gaps came in a notch each.

- **48px, not the 44 this file used to quote.** The tab's own vertical padding
  plus a 14px line clears the 44px touch floor at 48 and does not at 44 once
  the underline's 2px is inside it. Everything else on the band is a pill or a
  monogram with its own hit area.
- **Every ink pairing is unchanged.** Nothing here changed a colour, only a
  size and a box, so the `--masthead-*` contrast figures elsewhere in this file
  still hold. `check:ui` re-run and clean in both themes.

### The masthead hides on the way down

`sticky top-0`, and `useMastheadVisible` translates it off on a downward scroll
and back on an upward one. On a document that runs four screens the six surface
tabs are irrelevant while you are reading one of them — but **scrolling up is
someone looking for something**, and most often that something is another
surface.

- **`sticky`, not `fixed`.** Fixed takes the header out of flow and every page
  below it then needs a top offset kept in sync with the header's height.
- **An 8px threshold and an 80px dead zone at the top.** Without the threshold
  it twitches on elastic scroll; without the dead zone a small nudge down hides
  it before you have read anything.
- **`passive: true` on the listener.** It runs every scroll frame, and a
  non-passive one costs smoothness on exactly the long documents this is for.
- **Two things had to move under it.** `SectionNav` went `top-4` → `top-14` and
  section headings went `scroll-mt-6` → `scroll-mt-14`: the band is 48px, so at
  16px the navigator sat 28px *underneath* it and its first two entries were
  unreachable exactly when you were scrolling up to reach them.
- Reduced motion is `motion-reduce:transition-none`. The hiding stays correct,
  it just stops sliding.

**The stacking order, because making this sticky broke something.** The header
was `z-50` for an afternoon and sat on top of `EvidencePanel` (`z-40`), whose
close button then did nothing — a regression `check:ui` cannot see, because it
closes that panel with Escape rather than by clicking. The order is now written
down in `AppShell.tsx` and is:

```
page content, map overlays   z-10, z-20
masthead                     z-30
evidence panel   scrim z-40  z-50
gap panel        scrim z-54  z-56
selection menu               z-65
AI panel         scrim z-60  z-70
Operations full screen       z-80
```

`GapPanel` sits above the evidence panel because it is the more recent
deliberate act: if both are open, the one you just asked for is the one you are
looking at. It stays below the assistant for the same reason `SelectionAsk`
does.

`SelectionAsk` sits above the evidence panel and below the assistant on
purpose: its only job is to hand a question to the assistant, so it must never
be the thing covering it.

**A panel is something you opened deliberately; the chrome does not get to
cover it.** If you add a layer, add it to that list.

### The assistant

`AiPanel` in `src/components/shell/` — the AI chat, as a right-hand side panel,
with `AiButton` on the masthead beside `ThemeToggle`. §5 recorded that chat was
wanted, that the prototype's bottom bar was not the answer, and that side panel
/ popover / contextual click-to-ask were all still open. This is the side
panel.

**The argument for it over the other two is what the conversation is about.**
On every surface here the question is about the thing currently on screen. A
popover covers it. So from `lg` the panel **pushes** the page rather than
floating over it — `lg:pr-[var(--ai-w)]` on the shell — and below `lg` it is an
overlay with a scrim, because 320px of panel beside a 375px phone is not a
layout.

- **The width drags from the left edge and is remembered**, 320 to 720. The
  handle is a 7px hit area on a 1px line, because a border you have to hit
  exactly is a border nobody resizes, and it takes arrow keys as well as a
  pointer. The drag listens on `window`, not on the handle, so the pointer can
  outrun the element without the drag ending.
- **Full view** takes the whole window and keeps the dragged width underneath,
  so leaving it returns you to where you were. **Escape collapses full view
  first and closes on the second press** — one keystroke from full screen to
  nothing loses the conversation.
- **The width lives in a `useSyncExternalStore`**, not `useState` seeded in an
  effect. Same shape as the section-collapse store, same reason: the server has
  no `localStorage`, so reading it in render is a hydration mismatch and
  reading it in an effect is a synchronous `setState` inside one, which
  `pnpm lint` rejects.
- **It is designed as real and labelled honestly**, like `RunButton` and the
  connectors. The transcript has the shape of a real answer with its sources
  attached; the composer is disabled and says *"Not wired up. The prototype
  reads one static research set."* A box that takes your question and drops it
  is worse than one that admits there is nothing behind it.

#### The button is filled, and a light runs round it

`.ask-pill` in `globals.css`, on request, modelled on a *Generate Site* CTA.
`AiButton` is the one control on the masthead that *opens* something rather than
going somewhere, and it is a small pill among six tab labels, a project switcher
and a theme toggle. As an outline among outlines it was losing that fight; a
breathing shadow helped and did not settle it.

**Three layers, each doing a different job.**

1. **The fill.** A gradient in `--masthead-accent`, dark slate label on it. It
   is the only filled control in the chrome and the only saturated block
   anywhere in the product. That is the point rather than an oversight: §7's
   restraint rule says spend boldness in one place per screen, and the
   masthead's one place is the thing that does something rather than navigating
   somewhere. **`RunButton` is filled too but it is on the page**, so the two
   are never adjacent.
2. **The runner** — `.ask-ring`, a 2px masked band with `.ask-ring-blade`
   spinning inside it, so one bright core travels the edge instead of the whole
   pill pulsing. **2s linear**: a travelling light on an eased curve reads as
   hesitating rather than running, which is the opposite of the halo's own
   curve and deliberately so.
3. **The halo** — a breathing `box-shadow` on the button, 3.4s ease-in-out. A
   shadow paints outside the border box and can never wash out the label, which
   is why the halo is not a second blurred pseudo-element over the middle of it.

**It glows, it travels, and it does not resize.** No scale, no bounce, no
translation. A control in the chrome that changes size is one the eye keeps
returning to, and the masthead is on every screen of the product, so that is a
tax paid all day. Light moving along a fixed edge is not vestibular the way a
moving box is.

**The mask cutout is the whole trick and the thing to keep.** `inset: -2px` puts
the ring just outside the fill, `padding: 2px` sets its thickness, and two masks
composite so only that padding band paints. Without the cutout the conic covers
the pill and the label goes with it — and a negative `z-index` does not save
you, because a negative-z child paints *above* its parent's own background, not
below it.

**`background-color` is set as well as `background-image`, and that is
load-bearing.** `check:ui` walks to the nearest opaque ancestor and reads its
`backgroundColor`; a gradient alone leaves that `transparent`, so the checker
would have compared the dark label against the dark masthead behind it and
failed a pairing that is really 6.0:1. The solid is the gradient's *darker* end,
so what the checker measures is the worst case actually on screen. **This is the
photographic backdrop's problem, solved instead of tolerated** — make the
automated check able to see the truth rather than accepting that it cannot.

- **The mark sits still and takes the label's colour.** It used to pulse
  `--masthead-muted` → `--masthead-accent` in step with the ring, which was
  right on an outlined pill and is wrong on a filled one: on this ground the
  only colours available to it are the label's or something less legible than
  the label. One animation on one control is enough.
- **Everything stops while the panel is open, and the fill stays.** The
  invitation has been accepted. The fill staying is what keeps the button from
  changing shape at the moment it is pressed.
**Two things about the runner that took driving it to find**, and both are the
difference between a light that travels and a light that looks broken:

- **The base tint matters as much as the core.** The first version lit one arc
  and left the rest of the ring transparent. For a good part of each lap
  nothing was lit on any edge you happened to be looking at, so the eye read a
  fixed corner highlight — it looked like a rendering artefact rather than an
  animation, which is exactly how it was reported. With the ring drawn all the
  way round at a low tint, the core is unambiguously the part that is moving.
- **One core, not two.** Two cores 180° apart is the obvious way to keep
  something always visible, and on a pill it is wrong. A conic angle maps to
  perimeter position very unevenly on a 4:1 box: the top and bottom edges span
  most of the angular range while the two ends whip past. So cores 180° apart
  sit on the top and bottom edges *together*, then on the two ends together —
  the whole ring brightens and dims on a 1s beat instead of a spot going round.
  Caught by freezing the gradient at 0°, 90°, 180° and 270° and looking at the
  four frames side by side, which is the only way to see it: **a still cannot
  tell you whether a thing is moving, and a moving thing photographs the same
  as a broken one.**

- **Under `prefers-reduced-motion` the rotation and the breathing stop and the
  ring goes back to a plain top-lit bevel** — not the conic frozen at 0°. An
  animation stopped at its initial value is not a resting state, it is a paused
  one: at 0° a bright core parks on one end and reads as a fault. The static
  picture has to be a picture somebody chose, so `--ask-rim` is named once and
  used by both the resting state and the reduce state. Where `@property` is
  unsupported the conic does not rotate, and that is the one case still left
  where a core sits parked — acceptable, because those browsers are the ones
  that also cannot register the property at all.

  **This is also what the repo screenshots show**, since both harnesses emulate
  `reduce`: if the ring looks static in `screenshots/`, that is correct and not
  the animation failing.

**The rotation is a `transform`, and it started out as a registered
`@property` angle interpolated inside the `conic-gradient` itself.** That is
the tidier CSS and it is the version to not go back to. It depends on two
things that are not universal — the browser having `@property`, and it
repainting a gradient whose only change is a custom property — and where either
is missing **it does not fail loudly. It renders perfectly and never moves**,
which is indistinguishable from a static rim and was reported as one twice
before the cause was found. `transform: rotate()` on an element has neither
problem: it is the oldest animation primitive on the web, it is composited
rather than repainted, and when it is unsupported nothing is.

The cost is one real element instead of a pseudo-element, because the blade has
to be a *child* of the masked ring and a `::before` cannot have one. Worth it.

**The general rule, which is bigger than this button: prefer the primitive that
fails loudly.** A capability that degrades to "looks right, does nothing" costs
more to diagnose than one that degrades to "obviously broken", because nobody
files the first one as a bug — they file it as a design complaint.

**Two more things the blade needs.** It is square and twice the ring's width:
it rotates about its own centre, so anything short of the ring's diagonal
sweeps its own corners through the band and leaves gaps in the light. And its
trough is **fully transparent**, not a dim tint — laid over `--ask-rim` a
semi-transparent trough lifted the dark part of the lap almost to the
brightness of the light part and the whole thing went quiet. Transparent means
"the rim, unmodified", which is the darkest the ring gets, so the full range is
spent on the one thing meant to be read as moving.

**Under reduce the travel stops and the glow does not**, which is a split
rather than a compromise. Travel is what `prefers-reduced-motion` is about:
something crossing the screen, which a vestibular system reads as the world
moving. A `box-shadow` breathing in place changes no geometry and moves
nothing — the same reasoning that makes every hover in this product a colour
shift rather than a transform. So a reduced-motion user still gets a signal on
this control; they get the quiet half of it. **If the ring ever looks static on
a machine, that setting is the first thing to check** — and it is also why the
ring is static in every file in `screenshots/`, since both harnesses emulate
`reduce`.

**`check:ui` cannot see any of the motion** — it samples one frame of a paint.
It was verified by driving it: the blade's computed `transform` matrix steps
through a full lap in 2s, frames with the blade frozen at 0°, 90°, 180° and
270° put the core on the right end, the bottom, the left end and the top, and
the blade's computed `display` is `block` when shut and `none` both under
emulated `reduce` and once the panel is open.


### The detail panel, and Ask Helix from it

`EvidencePanel` is the one right-hand slot every surface opens into. Operations
opens it twice, `kind: "node"` for a process and `kind: "entity"` for a record,
and both were rebuilt to be **scanned rather than read**.

**What was wrong.** A process opened with a two-column grid carrying six lines:
two labels, two values and **two full sentences of gloss**, before anything a
consultant came for. Then, on an unevidenced node, two more paragraphs of
empty-state prose. Then the material. On a surface read in the minutes before a
call that is the wrong order and the wrong register.

- **The four facts are one strip of pairs** — how it runs, evidence, gaps here,
  worth — on a `bg-muted` ground. A label and a short value each, nothing that
  has to be parsed as a sentence. The eye lands on four values. `Fact` is the
  component; `EntityDetail` uses the same one, and **two of its headed blocks
  folded into the strip**: *Where it lives* and *How much of it* were a micro-cap
  heading over four words, which is the worst heading-to-content ratio on the
  page.
- **The two axes stay separate and are never merged into one badge.** §4's rule
  survives the compression: a healthy process with no data and a critical one
  with full evidence are opposite situations.
- **The glosses appear only where they earn a line.** `HEALTH_MEANING` under the
  strip, because "Critical" is the word a non-expert can misread.
  `COMPLETENESS_MEANING` only when there is no evidence, which is the one case
  where the label alone would let a colour be trusted. And **the health line
  hides entirely when the empty-state box is showing**, because the two ran as
  near-duplicates: *"We looked and found nothing worth raising"* directly above
  *"We looked and found nothing."*
- **The empty states are one line each, not a paragraph.** Both used to end with
  an instruction — "add a transcript or ask about it on the next call" — which is
  now the *Ask Helix* button rather than a sentence about a control that did not
  exist.
- **The metric gloss wraps and is not clamped, and that is a reversal inside the
  same change.** Truncating it to one line read as the tidier panel and is
  exactly the mistake the density pass already recorded about the claim ledger:
  truncated text is pure cost, because the words are paid for and cannot be
  read. Aryan is not an expert (§7.6) and "first-time match rate" is precisely
  the term he cannot decode. **The density win comes from the strip and the
  empty states, not from cutting a definition in half.**

**`AskHelix` is the correction route, and there is only one.** §5 says users
never hand-edit AI output: they describe the change and the assistant applies
it, so the audit log keeps one shape. Every *This isn't right* and *Describe the
correction* button in the file now arrives here, and so does the plain *Ask
Helix* in the panel header. The gap panel's button had done nothing for its
whole life.

- **It sits in the header beside Close, not in a block at the bottom.** A
  well-evidenced node runs several screens, and an action that only exists past
  the fold is one nobody finds while a call is running. Those two are also the
  only things you do *to* the panel rather than read inside it.
- **It attaches the subject; it does not compose a question.** `attach` puts a
  chip above the composer and drops the caret in the box. That matters most on
  the correction route, where §5's instruction is *describe the correction in
  your own words* — a button that sent "this is wrong" on the user's behalf
  would be answering the question it was meant to ask.
- **`matchNode` in `assistant.ts` exists for this call.** The attachment carries
  the subject's name as `query`, and a process name shares words with the topic
  routes ("invoice", "match", "freight"), so it is tried **before** them or *Ask
  Helix* on a node lands on a generic answer about the total. `nodeAnswer`
  replies with the path, the health, what sits there and what is flagged, cited
  to the node's own sources.
- **Opening the assistant closes the detail panel.** The assistant pushes the
  page from `lg` and overlays below it, so leaving both open puts two drawers on
  a phone.

### Ask Helix, from a selection

`SelectionAsk` in `src/components/shell/SelectionAsk.tsx`. Select text anywhere
in Research and a small menu appears over it: **Ask Helix** first, then **Copy
text**. Choosing the first opens `AiPanel` with the selection **attached to the
composer**, ready for a question. See *Attaching is not asking* below.

**This is not the contextual click-to-ask that §5 rejected.** That was a place
to *hold* the conversation, floating over the paragraph it was about. This is a
route *into* the panel: two verbs, nothing read inside it, and the answer lands
in the side panel that was always going to give it. The rejection stands and
this does not reopen it.

- **Research only.** `AppShell` mounts it under `onResearch`. Research is the
  surface made of prose. Gaps and Questions are lists of short rows where
  nobody selects a line, and a menu that appears on an accidental drag across a
  table would be noise on five surfaces to be useful on one.
- **The selection becomes the *subject*, and `answerFor` takes it as a
  fallback.** It is keyword routing over the loaded research, so the selected
  text is still the best query available when the typed question routes
  nowhere: select a gap title, type something vague, and `matchGap` lands on
  that gap. The panel still answers only from the research or says it has
  nothing, which is the existing contract and is not loosened here.

Four things it gets right that a first version does not, all of them found by
driving it rather than by reading it:

- **`Selection.toString()` keeps the DOM's newlines.** A drag across three gap
  rows arrives as rank, effort, title and price with a line break between every
  span, and quoted into a chat bubble that reads as a broken paste. `flatten`
  collapses whitespace before anything else touches the text. The quote also
  trims at 240 characters with an ellipsis — a *readability* limit on the
  quote, not a limit on what may be asked about.
- **The keyup listener is a whitelist, and that is load-bearing.** It re-reads
  the selection only on keys that move a caret. With a blacklist the whole
  keyboard route was silently dead: Tab's **keydown** focuses the first menu
  item, then Tab's **keyup** re-measures, finds the selection changed, and
  unmounts the menu out from under the focus that just landed on it. Tab
  appeared to do nothing at all.
- **Tab is what makes it operable without a pointer.** While the menu is
  showing, the first Tab goes into it; Escape dismisses and leaves the text
  selected, which is what pressing Escape on a menu should do. A selection
  toolbar that only takes a mouse is a control half the users cannot reach, and
  §7.8 does not have an exception for popovers.
- **It follows the page on scroll** by re-measuring the stored `Range`, rather
  than vanishing. A menu that disappears the moment you scroll to see what you
  selected is worse than one that never appeared. It hides only when the range
  leaves the viewport or goes stale.

#### Attaching is not asking

`AiAttachment` in `AiPanel.tsx`, and the two routes into the assistant both go
through it: **Ask Helix** on a selection, and **Ask Helix** in the detail
panel's header. Neither sends a question. Both put the thing on the composer as
a chip, drop the caret in the box, and wait.

**Both used to compose a question and send it.** A selection asked *"what does
this mean, and what is behind it?"*; the panel header asked *"tell me about X:
what is happening, what is behind it, and what should I ask about it?"*. That is
a guess at the question, made at the one moment the user has told us the
*subject* and nothing else. A consultant selects a sentence because he is
deciding whether he can say it on a call; he opens Transport because the freight
figure looks wrong. Both got an explanation they did not ask for, and then had
to type the real question with the unwanted answer already in the transcript.

**The subject is ours to carry, the question is his to write.**

- **The typed question wins; the attachment is the fallback.** `answerFor` takes
  an optional second argument and only routes on it when the first lands
  nowhere. Concatenating the two would let the attachment's name beat every
  topic route, because `matchGap` and `matchNode` run before the topics — so
  "why now?" with a process attached would answer about the process.
  **The fallback is detected by `cites.length === 0`**, which is the one thing
  only the no-match answer has. Every real route cites a source, which is a rule
  `assistant.ts` already keeps for its own reasons rather than a marker invented
  for this. If a route ever legitimately answers with nothing behind it, this
  needs an explicit flag instead.
- **`query` is separate from `text`.** The chip shows the selection trimmed at
  240 characters; `query` carries the untrimmed one, so the trim stays a
  readability limit on what is displayed and not on what may be asked about. For
  a node or a gap, `query` is the name, which is what the matchers want.
- **The turn keeps its attachment.** "Is this safe to say?" means nothing a
  screen later without the paragraph it was clipped to, and someone scrolling
  back is doing so precisely because he cannot remember which thing he asked
  about.
- **It replaced `ask()` and deleted `registerSend` with it.** `ask` opened the
  panel and called `send` through a ref the panel handed up, because the
  transcript lives in the panel — and that ref needed a paragraph explaining why
  it could not be a queue. Attachment state lives in the provider, so `attach`
  is a plain `setState` and there is no ordering problem to document. The old
  plumbing is gone rather than left for a hypothetical caller; if something ever
  genuinely needs to send without the user typing, the honest fix is lifting the
  transcript into the provider, which is what the removed note already said.
- **The correction route benefits most.** §5's instruction is *describe the
  correction in your own words*, and a button that sent "this is wrong" on the
  user's behalf was answering the question it was supposed to ask.
- **The caret moves to the composer**, as a DOM call in an effect keyed on the
  attachment. A chip that appears while focus is still on the node you clicked
  makes the user go and find the box, on a surface where the next thing they do
  is always type.

**It is themed, not dark.** The reference for this was a dark chat menu; this
one is `bg-card` on `border-border` like every other popover in the product,
because a permanently dark menu is a second palette on a page that has a light
mode. It sits at `z-[65]` — above the page and the evidence scrim, below the
assistant itself, because its whole job is to hand off to that panel and it
must never cover it. That number belongs in the stack list in `AppShell`.

**Helix is the assistant's name, and the masthead now uses it: *Ask Helix*.**
On request. It matches `SelectionAsk`'s first menu item exactly, so the two
routes into the same panel say the same words, and the invitation is made where
the name is.

**The panel header still says *Assistant*, and that is now the odd one out.** It
was one of the two strings this note used to list as the pair that would change
together. Half the pair has changed; if the name is meant to be the assistant's
everywhere, the header is what is left.

The label still hides below `sm` and the mark stays, for the same reason the
wordmark's does: on a 375px line the six surface tabs need every pixel, and a
spark in a pill beside the theme toggle is unambiguous.

### The wordmark

`Wordmark` in `src/components/shell/` — Heizen's mark and the name.
`src/app/icon.svg` is the same mark on indigo.

- **The mark is the real asset**, `heizen-mark.svg` from heizen.work, inlined
  as JSX rather than referenced through `<img>` so its `fill` can be
  `currentColor`. That is what lets one component be white on the indigo
  masthead and ink anywhere on the page — the masthead/page split that
  `ThemeToggle` carries a `tone` prop for.
- **The word is Inter, not the licensed face.** Heizen's own lockup sets the
  name in Axiforma and ships that pairing as a raster
  (`/images/logo-light.avif`, 567px), which cannot be recoloured by theme or
  held crisp at a 15px cap. Inter at 600 with the product's 0.12em eyebrow
  tracking is close at this size. **If the licensed lockup arrives as an SVG it
  replaces the contents of `Wordmark` and nothing else moves.**
- **The mark and the name, and nothing else.** A "Discovery Tool" descriptor
  was tried inline and then stacked under the name, and is gone: the masthead
  already says what the thing is by carrying Operations, Research, Gaps, Questions,
  Compare and Sources, and the product name is in the page title. Do not put it
  back without a reason that is not "the name should be visible".
- **Below `sm` the name hides and the mark stays.** The old text wordmark hid
  entirely, because it was costing the tabs 70px of a 375px line. The mark is
  11px wide, so the band is no longer unbranded on a phone.

**A `<button>` sizes to its content, not to its parent.** The project switcher
sat inside a `max-w-[7.5rem]` wrapper with `min-w-0` on every flex child and
still ran 23px past it, straight over the first surface tab at 375 — the mark
taking 30px is what made a pre-existing overlap visible. `max-w-full` on the
trigger is the fix. `check:ui` cannot see this: two elements overlapping is not
a clipped element, an unreachable control, or a contrast failure.

### The project switcher

`ProjectMenu` in `src/components/shell/`, fed by `src/lib/projects.ts`.
Meridian is project-first (§5), so the header's project name is a switcher, not
a label — moving between clients is the most common thing a consultant does that
is not inside one.

**It sits on the right, with the theme control.** It was on the left between the
wordmark and the tabs, where it read as part of the brand rather than as
something you operate, and pushed six tabs rightwards on every screen. On the
right it is next to the other control and its popover opens against the window
edge it is nearest — `right-0`, not `left-0`; a left-aligned popover on a
right-hand trigger runs off the screen.

**The menu is a filter field and a list of names**, on request. The rows used to
carry a monogram, the sector, a contract value and a status line each: four
facts about a project you are not in, on a control whose whole job is to get you
into one. The name is what you are looking for.

- **The one thing that survives beside a name is the reason it cannot be
  pressed.** `Open` on the current project, `No research yet` on the two that
  are listed honestly and have nothing behind them. Take that away and a
  disabled row is just a row that does not work.
- **The filter takes focus on open**, which is the whole of what makes it worth
  having: the menu opens ready to be typed into, before the pointer arrives.
  `autoFocus` is safe on an element that did not exist a moment ago and that the
  user opened deliberately; it would not be on a page.
- **It matches the name and not the sector.** A row that appears for a word the
  reader cannot see in it reads as a bug.
- **Three projects do not need searching. Thirty do**, and a consultancy
  accumulates them, so this is the connectors' rule again: build the shape the
  real thing has. If the list stays short, the cheap fix is to render the field
  only past a threshold rather than to delete it.
- **The query clears when the menu closes.** A filter that survives a close is a
  menu that opens showing one project next time, for a reason nobody remembers.

**The account keeps its mark, and the project rows no longer have one.** A
monogram from the name — `initialsOf`, two letters — with `photoUrl` on both
`Project` and `Account` rendering a real picture the moment there is one. It is
still on the trigger, where it is what identifies the current project below `sm`
once the name hides.

Two things about it worth keeping:

- **`Avatar` takes a `tone`.** The trigger is on the indigo band and the account
  row is on a white popover. This is the same trap `ThemeToggle` carries a
  `tone` for, and the switcher has now hit it twice — see the white-on-white
  note below.
- **No display name is invented from the email.** The account row shows
  `yashvi@heizen.work` and a role. An address is not a name, and a prototype
  that guesses one is showing a real person something untrue about themselves.

Below `sm` the trigger is the monogram and the chevron; the project name hides,
because on the right it is competing with the theme control for the last 120px
of a 375px line.

Only Suvarna carries data. **Kesarwani and Deccan are real entries**, not
placeholders: they are the delivered and in-flight Heizen projects the Compare
lanes are built from, with their real sectors and status. They are `disabled`
and marked "No research yet", with a line at the foot of the menu saying the
prototype holds one research set. Same rule as the connectors — designed as
real, labelled honestly. Wiring a second dataset is the change that makes them
live; nothing else has to move.

**A popover that escapes the band must reset the colour it landed in.** The
menu is a child of the masthead, which sets `text-masthead-foreground` — white.
On its white card every project *name* rendered white on white and simply was
not there, while the sector and status lines showed because they name their own
colour. `text-foreground` on the popover is load-bearing. `check:ui` was blind
to this because it never opened the menu; it now clicks
`button[aria-haspopup="menu"]` before sampling, in both themes.

### Stakeholder Brief has no picker

On request. Five chips — four first names and a dashed *Don't know yet* — sat
in this direction's header above the Direction switch, and they were the last
control in the product between the masthead and the tabs that change what the
page says. They are gone, along with `UnknownBrief`, the degraded screen only
the dashed chip could reach. Brief opens on the Head of Procurement, which is
who a first discovery call is with; the other three people and the same
don't-know fallback are one click away on Full, which the footer link already
points at.

- **Restoring it is putting `titleNode` back on this hero.** Everything else
  the picker needed is still in `suvarna.ts`, and Full renders all four people
  from the same data.
- **The third gap came back on Brief.** It was `hidden sm:block` because
  Rohan's three plain-language lines are the longest of anyone here and the
  third did not fit under his opening line at 375. The picker's row is what it
  was competing with; re-measured without it, all three clear 375×667.
  **A measured constant is only true for the layout it was measured on**, which
  is the third time that has come up in this file.
- **`verify-stakeholder.mjs` stays, and it had to be repaired rather than
  deleted.** It looped over the chips, so with none on the page it looped zero
  times and reported green without having looked at anything — the exact
  failure mode this repo keeps writing down. It is one unconditional pass per
  viewport now. The file survives the picker because Rohan is not the tallest
  of the four, so any picker restored anywhere brings the height variation back
  with it.

### Brief grows into Full's frame

Brief spends every pixel of padding out of its own content, because it may not
scroll. That is a real constraint at 375×667 and none at all at 1440×900, where
500px sat empty under the fold while Brief drew itself as a 512px column with
10px of band padding next to a Full view that was full-width with 32px. Two
views of the same dossier, and the toggle between them changed the page's whole
frame.

So from **`roomy`** — a custom variant in `globals.css`, now `min-width: 1024px`
— Brief takes Full's frame exactly: the surface-frame gutter, `py-8`, full-size
header rhythm and the full-size direction switch. Below that it
keeps the phone-shaped column and the squeezed rhythm, which is what the fixed
screen can pay for.

**The gate carried `and (min-height: 780px)` and no longer does.** It was
removed on request, and the number itself is what gave the problem away: 780px
of viewport is a 900px screen with nothing but a title bar on it. A 1440×900
laptop with a bookmarks bar renders about 760, so **the machine the product is
designed on fell through the gate** and showed the phone rhythm on a full-size
window. Brief looked like a smaller, different product than Full at the one
size where the two get compared most.

**The height gate was also stale, which is the part worth keeping.** It was
measured against a Brief that put its lead *above* the content; the lead has
since moved into the left column, the footer rules came off and the frame
tightened. Re-measured across all six Briefs after the change, **nothing clips
or scrolls down to 1024×640** — the exact viewport the old note says clipped
Money-first by 92px. The first clip now appears at **1440×620** (Money, 13px)
and 1024×560. So the trade the request asked for turned out to cost almost
nothing: a gate written for one layout was still gating a different one.
**A measured constant is only true for the layout it was measured on.**

`check:ui` and `verify-stakeholder.mjs` run **four** viewports: the two phones
plus 1024×780 and 1440×900. All four are unaffected by the gate change — the
phones are under 1024 wide and the other two are over 780 tall — so **the
harness cannot see this trade at all.** A viewport between 620 and 780 tall has
to be looked at by hand, and the numbers above are what that looked like.
Anything below 667px tall on a phone-width window is outside what Brief is
designed for and will clip; that is unchanged.

### Research has two call agendas as well as two readings

On request: a third tab, *Intro call*, carrying nine named areas, and a fourth,
*Discovery call*. `/research/intro` and `/research/discovery`,
`CallEmphasis.tsx`, with the content in `lib/calls.ts`.

**They are a different kind of thing from Brief and Full, and that is the
point.** Brief and Full both answer *what do we know about them*, cut by
subject and differing only in how much. These two answer *what do I say, and in
what order*, cut by which meeting it is. The nine areas the intro list was
given as — company overview, business context, stakeholder role, AI and tech
interest, spend areas, current systems, relevant vendors, similar past work,
likely pain points — turn out to be nine of the eleven Research directions,
sequenced. That is the argument for the tabs existing: the material was all
there, and what was missing was the order to take it in.

**The two it leaves out are the two an intro call must not open with**: the
money, which is modelled, and what we would build, which is a proposal to
somebody who has not yet agreed there is a problem. Both lead on the discovery
list instead, which is why that one is not the same nine at more depth. Six of
the nine exist to prove the homework was done, and once that is established
they are worth no more of anybody's half hour. The discovery list is confirm
the finding, the questions in ask order, what we cannot know from outside, the
numbers with their base, what we would build first, who else has to be in the
room, what could kill it, and the data request.

- **Nothing on either list is authored twice.** Every *say* line is read off
  the same data the direction it points at renders. What is authored is the
  order and the one sentence per step saying why the area earns a minute on
  *this* call. Writing the material out again would be a third copy of the
  dossier and the first to go stale.
- **Two registers per step, and the screen depends on it.** The *why* is about
  the call and sits as muted caption; the *say* is read seconds before it comes
  out of a mouth, so it is at body size on its own ground behind an accent
  rule. An agenda where the reasoning and the speech look alike is one a
  consultant has to parse while somebody is talking to him.
- **The agenda is one box in Gaps' shape**, and it took three goes to get
  there. It began as nine numbered blocks inside a white document sheet, which
  is Research Full's register: Full is an argument read top to bottom, an
  agenda is a list of separate things. Then it became nine free-standing cards
  on the page under a tenth holding the lead — which fixed the register and
  broke the reading, because the agenda then looked like nine things rather
  than one list of nine, with its own lead weighted the same as its items. It
  is now a `Panel` with its padding stripped, holding the lead, the list and
  the closing line: one object from the title to the last instruction.
  - **The rows are `bg-card` on a `bg-card` panel**, told apart by border and
    shadow rather than by fill. That is exactly what Gaps does, and it is why
    the container works at all: a fill change would need a third ground and the
    product has two.
- **The step's link is `BriefFooter`'s pill**, on request: a drawn box with the
  accent on the label and an arrow after it, the same element every Brief ends
  on. A bare cyan word reads as one more line of the row; the box is what says
  it leaves. **It sits on the title's line**, which reverses where the previous
  revision put it — a row of its own behind a rule is right on a card that is a
  screen's worth of document, and on a row in a list of nine it cost a rule and
  two lines of height nine times over.
- **The lead is written out rather than taken from `DocumentLead`**, and one
  class forced it: that component caps its standfirst at `measure`, which is
  right for a column of body text in a Research direction and wrong over nine
  full-width cards, where a narrow paragraph reads as a column that failed. The
  component is untouched — eleven directions render it and the cap is correct
  on all of them.
- **They carry no direction, so the Reading picker is not drawn on them.** An
  agenda is across the directions by construction; a control that changes
  something the page does not show reads as broken. `useResearchRoute` tells
  the two apart by the shape of the path — a one-segment tail is an agenda —
  and still returns `company` as the slug so the Brief and Full tabs have
  somewhere to point from there.
- **They render through `FullFrame`, which reverses what this file first
  argued.** The original build deliberately avoided both Research frames on the
  grounds that their navigator lists eleven directions and an agenda is a
  summary *across* those eleven rather than one of them. That got the
  navigator's job wrong: it is the table of contents for the page you are on,
  not a list of things the page is about. An agenda of eight or nine headed
  steps is exactly the shape that column exists to make scannable, and arriving
  from Brief or Full to find the page furniture gone made the tab read as a
  different product. They are now Full Research in every structural respect —
  same pinned switch row, same navigator, same sheet, same `Section` per
  heading with its chevron, bookmark and Ask Helix.
  - **The navigator had to learn about them, or it would list every page except
    the one you are standing on.** `CALL_READINGS` in `Frames.tsx` adds the two
    as a *The call* group above the four categories, with the active one filled
    and this page's step headings threaded under it, exactly as a direction's
    are. They are kept out of `directions` deliberately: a `Direction` is a
    reading at `/research/[slug]/[view]`, and widening `DirectionSlug` would
    mean teaching the route guard about two slugs it has no component for and
    giving the word index two entries it cannot fetch.
  - **The find box does not search inside an agenda, and says nothing rather
    than something false.** The call group is hidden while a query is active:
    an entry showing no count beside entries that do would read as *no matches
    here*, which is a claim this cannot make. Every line in an agenda is read
    off a direction the box does search, so the words are findable where they
    are authored. If a reader ever needs to find a step by its own heading, the
    fix is an index entry per agenda rather than a place in `directions`.
- **The catch-all redirect had to learn about them.** `/research/:direction` →
  `/research/:direction/full` swallowed `/research/intro` and sent it to a page
  that does not exist. The source pattern now carries a negative lookahead, and
  a new agenda needs adding there as well as to the switch. Found the same way
  the last three routing faults were: by asking for the URL.
- **`/research` and `/research/:direction` both pointed at
  `/research/all/full`, which 404s.** `all` came off the direction list when
  the row was re-cut, and nothing had re-read the redirect since. They point at
  `/research/company/brief` now, where the masthead tab goes. It is the exact
  failure the note above the project redirect in that same file warns about.
- **A domain term was case-folded to fit a sentence for the third time.**
  "Sourcing and RFQ" rendered as "rfq". After "sap" and "₹53 cr" this is a
  pattern rather than a slip: nothing in `calls.ts` lowercases an authored
  string, and the fix is recorded here so the fourth one does not happen.

### The switch

There is **one tab control in the product**, `SwitchTrack` in
`src/components/shell/SwitchTrack.tsx`: Research's Direction and Detail,
Questions' Arrange, Operations' View, Compare's Time and Workflow. **Gaps
left**, on request — its Order and
Area are dropdowns now, above the card rather than inside it. See *Gaps' two
dropdowns*. Everything below still holds for the four tracks that remain.

**Underline tabs on a rule.** A row of words, a hairline under the whole set,
the active word in ink at 500 with a 2px segment of that rule thickened
beneath it. It was a stadium rail with a raised `bg-card` chip for most of its
life.

**The round trip is the part worth recording.** It went rail → underline →
back to rail → underline, and what decided it was not the shape. It was the
label. Each track used to carry a tracked micro-cap to its left —
`ORDER  [Value|Effort|…]`. Beside a rail that reads as an annotation on a box;
beside underline tabs it reads as **a sixth word in the row that happens not to
be pressable**. Take the label off and the underline shape is simply correct.
So the visible label is gone, and that is what let the rail go with it.

**`label` survives as the group's `aria-label`.** A control that sets what a
list shows still has to say what it sets, and with nothing on screen to point
`aria-labelledby` at, naming the group directly is the only way left. This is
not the trade the old note warned against — that was about *hiding* visible
text to save a repetition. Here there is no visible text to hide.

**The rule is ink, not `--accent`.** The masthead's underline is cyan because
everything up there navigates, and on the page a coloured word means somewhere
to go — but four of these six tracks are buttons that rearrange what is already
on screen. `border-foreground` on all six is the honest version.

**The rule spans the tabs, not the container.** In the reference this is a lone
tab bar filling its card, so its rule runs edge to edge. Three of our surfaces
put two tracks on one line, and one continuous rule under both would make them
one bar with two active tabs in it — which is the confusion the labels used to
prevent, and there is now nothing else to prevent it. Each track's rule is its
own width; the **break** between two rules is what says they are two questions.

Five things to keep about it:

- **`-mb-px` on every tab.** The row draws the 1px rule; pulling each tab down
  a pixel lands its own 2px border *over* that line, so the active mark reads
  as a thickening of the rule. Without it you get 3px of stacked borders and a
  second line a pixel higher.
- **The two gaps must differ, and the outer one is the caller's job.** 16px
  between tabs inside a track, 24px either side of the rule between two tracks.
  The rail used to draw that boundary for free. `ResearchSwitches` sets the
  outer gap itself, and it has to beat whatever `SwitchTrack` uses inside. Only
  Research puts two tracks on one line now, so it is the only caller this
  applies to — Gaps was the other and has moved to dropdowns.
- **There is one size, and `tight` no longer changes it.** On request. Brief
  set these at `text-micro` with 6px of side padding and a 16px outer gap below
  `roomy`, against Full's `text-small`, 8px and 24px — so switching Full↔Brief
  changed the size of the control you switched with, on the one row that is
  identical between the two views and is the skeleton they are meant to share.
  Below 1024px, which is the window this product is designed on, the two rows
  were visibly different type. `switchItemClass` takes one argument now and
  `SwitchTrack` has no `tight` prop at all; the flag survives on
  `ResearchSwitches` for one job only, hiding `RunButton` below `roomy`.
  Measured after: 14px, 8px padding, 93.7 × 29.6 per tab and a 753.3px row, in
  both views at 375, 1000 and 1440. **What it costs is horizontal**, on a row
  that already scrolls at 375; the ~5px of vertical it costs Brief is inside
  what that screen has, and `check:ui` clears all four viewports.
- **The row is baseline-aligned.** Each tab carries bottom padding for the rule
  to sit in, so `items-center` would stagger tabs of different weights.
- **The wrapper `div` survives the label's removal**, holding one child, because
  `className` cannot move onto the row: Operations dresses this as a
  `rounded-lg` card and the row would fight it. Two elements, no collision —
  which is now belt and braces rather than the only defence, since `cn` merges.
  It stays split: the two elements are doing different jobs.
- **`SwitchScroller` does not set `max-w-full`.** The Operations overlay has to
  cap its track short of the zoom cluster, and under the old plain-join `cn` a
  base `max-w-full` silently beat the caller's `max-w-[calc(...)]` and the cap
  did nothing. It took a measurement to notice. `cn` merges now and the
  caller would win, but the base is still not set: a component that does not
  claim a width cannot be wrong about one.

**Losing the rail and the label together bought back real width**, which is the
one thing every track in this product is short of. Two things that used to
scroll now fit: **Research's row at 375**, where Detail used to be off-screen
and you scrolled to reach it, and **Operations' View card at 375**, which was
278px against the 239px it has beside the zoom cluster and is now inside it.
The note below about scrolling to reach Detail on a phone is history, not
behaviour.

#### Research's row

`ResearchSwitches` in `src/components/shell/ResearchSwitch.tsx` — one row on
the page above the document, rendered by `BriefFrame` and `FullFrame`.
**Direction and Detail, side by side.**

They have been in five places. First a **white bar of their own** between the
masthead and the band, which was a third horizontal strip and the only surface
chrome in the product drawn on the page rather than on the indigo. Then **one
row under the band**. Then split, with Full/Brief in the band's
top-right corner. Then reunited on the page at **opposite ends** of one row,
which is where the labels came in and made the distance unnecessary. Then side
by side, with the labels beside each track. Both change what the body says and
neither changes which surface you are on, so both belong with the body — that
part has not moved since.

**The labels are gone and a divider does their job.** `DIRECTION` and `DETAIL`
said the two tracks were two questions rather than one six-item bar. Space
alone can say it, but it has to be a lot of space — 28px against the 16px
inside a track — and it is still only an absence. A `w-px` rule between them
says it outright, so the gaps come down to 12px a side and the whole row gets
**4px narrower** rather than wider. On a 351px phone that is not nothing.

It is `self-stretch`, not a fixed height: the rule runs the full height of the
tabs including the pad their underline hangs in, so it reads as the boundary
between two bars rather than a tick floating beside them.

**The gap either side is 24px, and was 12px for a revision.** A divider does
not need much space to be read, but at 12px the rule sat close enough to
`Stakeholder` and `Full` that the three read as one clump. The row is still
narrower than the 28px-of-nothing version it replaced.

Losing the labels also bought back the ~120px that used to put Detail
off-screen at 375.

**There are seven directions, and the order is not alphabetical.** Money, Call
and **Tech** are what you open *before* a call; Timing and Risk are what you
need *in* it; Certainty and Stakeholder are what you check *after*. It was two,
two and two, and the pairing was descriptive rather than sacred — Tech joined
the first group because it is preparation, not something you read out.

Timing and Risk answer the two questions the other four cannot. Money, Call,
Certainty and Stakeholder are all sorted views of one finding set — what is
wrong, what it is worth, how sure we are, whose problem it is. None answers
*why now*, and none answers *what could kill this*, which are the two things a
consultant is asked on every call and has been answering from memory.

- **Timing** reads six signals off the company rather than off the finding set
  — leadership changes, public commitments, hiring, budget cycle, system
  events, competing priorities — scores each on whether it pushes the decision
  towards now or away from it, and ends in a verdict with its working attached.
  **It carries no rupee figure anywhere**, deliberately: the money is Money's,
  and a total here would be the fourth place ₹9.1 Cr appears on one surface.
  It is also the only direction that survives a first call where nothing has
  been shared, because it is built from public signal.
- **Risk** is six things that could stop the deal, ordered by whether they
  decide it or merely delay it. See *The counter rule* below — it is the whole
  direction.

- **Tech** is the system estate: nine systems in three groups — three SAP
  modules live, three processes worked around on email and a spreadsheet, three
  systems never bought. It answers the scoping question no other direction
  does, which is *what would we be building on*, and it is the first thing both
  an engineer and a client ask. See *The system estate* below.

Both Timing and Risk leaned on a fifth source, `src-web`, the first `web` one in the set.
Attributing "who joined when" and "what they are hiring for" to a discovery
call would have been the tidier source count and a false one. The tile label
moved from "one filing, two calls, one email thread" to "a filing, two calls,
an email thread, the web".

### The counter rule

**Every risk carries a counter, and the type will not let it not.**
`DealRisk.counter` is required, and `check:data` fails the build on an empty
one or on one under eight words — a counter that short is a label, not a line.

The reason is the user. Aryan is minutes from a call and not a domain expert.
Six things that could go wrong, with no line to say when any of them is raised,
does not prepare him — **it frightens him**, and a frightened consultant avoids
the subject. Which is exactly how an incumbent vendor or a dead 2019 project
ends up deciding the deal off-screen. A risk with a counter is ammunition; a
risk without one is a reason to stay quiet.

Three things follow from it and should survive any redesign:

- **The counter is not progressive disclosure.** It is not the detail behind
  the risk, it is the other half of the same object, so no view renders one
  without the other — including Brief, where three counters cost four lines on
  a screen that has none spare. Cutting them there would leave exactly the
  screen this direction exists not to be.
- **Counters are written as speech, second person.** They are read seconds
  before being said out loud. "Position the offering as complementary" has to
  be translated under pressure, which is when it will not be. *"We are not
  replacing them. We sit on top of SAP"* does not.
- **Severity is weight, not a hue.** Red here would collide with Operations'
  health colours, where red means the client's process is failing. The subject
  on this surface is the *pitch*, not the company.

**The chips say `Money`, `Call`, `Tech`, `Timing`, `Risk`, `Certainty`,
`Stakeholder`** — one word each, no hyphen. **`Tech`, not `Stack` and not `Tech
stack`**: one word to match the six beside it, and `Stack` was rejected for
sitting next to `Stakeholder` — two chips starting `Sta` in a row a consultant
scans in the seconds before a call. They were `Money-first` and so on, which is 419px of track: it
scrolled at 375px and cut Stakeholder off. The "-first" was doing no work the
context did not already do, since the nav is labelled "Research directions"
and the band above it says "Research". **The long form is still the internal
name** — comments and this file say Money-first, the way they say Meridian and
not Heizen Discovery Tool.

**Full is the default view, and it leads the segment.** Brief is the thing you
switch *to* in the five minutes before a call; Full is what "Research" means
when you arrive from the masthead with no particular errand. So the masthead
tab points at `/research/money/full`, and `/`'s cards give Full the filled
button.

Three things that fall out of it:

- **Both tracks are page-toned**, not `--masthead-*`: `--foreground` on the
  active label and its rule, `--muted-foreground` on the rest, `--border` on
  the rule. Masthead greys are 2.03:1 on ivory, so nothing from that family may
  appear here — and the masthead's cyan underline does not come down either,
  for the reason above.
- **The whole row is one horizontal scroller**, not two boxes that can wrap. A
  wrapped second row costs Brief around 28px it does not have, and scrolling
  costs nothing vertically, which on a screen that may not scroll is the only
  currency there is.

  **It scrolls at 375 again, and by a lot: 668px of track into 343px.** That
  note used to say it fitted exactly, at 351px. Two things broke it and only
  one of them is the seventh chip. The type scale went up a step and the body
  tracking loosened from -0.014em to -0.008em, which took the six-chip row to
  about 604px on its own; `Tech` added the last 64. **So this was already true
  before the tab was added and nobody had measured it** — the standing lesson
  being that a measured constant is only true for the type it was measured in,
  and a font-size change invalidates every width in this file.

  **The cost is real and it lands on the phone.** Arriving at Research from the
  masthead lands on Full, and the Detail switch is now off the right edge — so
  Brief, which is *the* phone view, is behind a horizontal swipe. There is a
  visible slim thumb, so it is discoverable rather than hidden, but it is not
  good.

  **The fix is to wrap below `sm`**, Direction on one line and Detail under it,
  which keeps DOM order and therefore tab order intact. It is not done here
  because it costs Brief roughly 28px at the one width Brief has none, and that
  is a trade to make deliberately rather than as a side effect of adding a tab.
  **Do not fix it with `order`** — reordering flex items visually without
  reordering the DOM puts focus order out of step with reading order.
- **Meera's Stakeholder Brief has about 5px of clearance at 375×667**, and
  Certainty about 15. Measured, not estimated — the way to check is to re-run
  `check:ui` and `verify-stakeholder.mjs` at a few heights below 667 and see
  where the first clip appears.

#### The other three

- **Gaps no longer uses this control at all.** Order and Area are two
  `SelectField` dropdowns on the page above the card — see *Gaps' two
  dropdowns* below. Both moves reverse notes that used to be here: that filters
  belong to the list they filter rather than to the page, and that there is one
  tab control in the product. The second sentence is now "there is one tab
  control, and one dropdown".
- **Questions — Arrange**, on the page above the panels. It was on the band;
  see *The Run button*. **Three tabs now, not two** — see *By text* below.
- **Compare — Time and Workflow**, on the page above the lane picker. See
  *Compare is two tabs*.
- **Operations has no View switch at all.** It is the one entry in this list
  that no longer exists. It offered Processes, Entities and List; List went, then
  Entities, and the switch went with the second one, because **a tab control
  offering one tab is a control that only says what you are already looking at.**

  Worth keeping, because neither removed view was only a view:

  - **List was the no-panning route through the map.** A pannable graph is hard
    to work through on a keyboard or a small screen, and the graph carries those
    users alone now. `check:ui` confirms every node is reachable by Tab and that
    the panel opens, closes and returns focus; whether panning-free reading is
    *comfortable* is not a thing a script can check, and is the thing to watch.
  - **Entities was the record-shaped reading of the same business** — what moves
    through it rather than what happens to it, grouped by the four areas Gaps
    filters by. `EntityList.tsx` and the `entities` data are still in the tree
    with nothing importing them, which is exactly the state `CanvasList.tsx` has
    been in since it was removed: **restoring either is one chip and one
    branch.** `check:data` still holds the entity grouping honest, so the data
    cannot rot while it is out of use.

  What the switch taught, which outlives it: **two grounds is one too many.** It
  sat in a raised card because a node can pan under anything on this map, and the
  card then fought the tinted rail inside it — the active chip ended up the same
  white as the card around it. The rail went first via a `bare` prop, the card
  went later, and by the end underline tabs on the bare canvas were the version
  that worked. The next control that needs a ground here should take one, not two.

  **The level path keeps `inset-x-3`, not `left-3`, and the row is capped short
  of the zoom cluster.** That cap was measured once and is worth keeping: at 375
  the old switch was 278px against the 239px left over, and `List` sat underneath
  the zoom buttons — not clipped, not unreachable by Tab, and so invisible to
  `check:ui`. Same blind spot as the project switcher running over the first
  surface tab, and the same fix: measure the boxes.

#### Back comes before the path

On request, and it is the right way round. `← Back` is the control; the
breadcrumb beside it is the label. A button you reach for after every drill
should not sit at the far end of a path whose width changes with the name of the
process you drilled into — at Level 2 that name is arbitrary, so the button
moved every time it was used.

It renders only below Level 0, so the row does not shift sideways at the top
level, where there is nowhere to go back to.

#### The path says what you are looking at, in words

On request, because the old one did not. It read
`Level 0 · 5 | Value chain › All processes`, in mono, which is four faults on
one line:

- **`Level 0` is a level of nothing a reader can name.** Aryan is not a
  supply-chain expert (§7.6) and the three-level model is this surface's whole
  structure (§4). Naming the tier without naming the thing is the one place
  that model is stated in the product, spent on a number.
- **The `5` counted something the line never said.** A bare count with no noun
  is the same fault the plan panel's `12 w` had.
- **`Level 0` and `Value chain` are the same fact twice**, once in jargon and
  once in English, three words apart.
- **Mono made it read as debug output** rather than as the label of the screen.

It is the crumbs on one line — `Value chain › Processes › Demand planning`, in
plain names — with one short line under them saying what this depth is and how
many boxes are in it. `LEVEL_GLOSS` in `CanvasView.tsx` holds the three.

- **This is §7.6's inline gloss, not §7.2's screen explaining itself.** The
  distinction is worth holding: a gloss names a term the reader must decode to
  use the screen, and this one changes with where the reader is standing.
  *About this view* was a paragraph about the page that was the same paragraph
  wherever you were in it.
- **The tails point down, not at where you are.** *"Open one to reach the level
  a gap is priced at"* on Level 1, *"the lowest level, and where the money is"*
  on Level 2. §4 puts all the value at the bottom, so the caption's job is to
  say there is a bottom.
- **Below `sm` only the noun survives** — `5 stages`, not the sentence after
  it. The full line took the box to 94px of a 230px map, which is 40% of the
  surface spent on its own caption. The noun on the count is the whole of the
  fault being fixed; the sentence is the part that has somewhere to go.
- **`pr-[9.5rem]` on the overlay row, and it is load-bearing at 375.** The zoom
  cluster is a 145px card pinned `right-3 top-3` in the same corner. Under
  `inset-x-3` alone the path box ran to x=363 against a cluster starting at
  x=218 and set its lines underneath it. **Nothing automated sees two
  overlapping boxes** — not a clip, not an unreachable control, not a contrast
  failure — which is the third time this exact blind spot has bitten on this
  surface. Measured after: no overlap with the cluster or the key at 375, 390,
  1024 or 1440, at all three levels.
- **`shots.mjs` threw rather than shooting a stale frame.** It drives Level 1
  by pressing the crumb by name, and the crumb was renamed. That is the right
  failure: a screenshot of a graph state that has since moved is worse than no
  screenshot.

#### Full screen is the surface's state, not the canvas's

`full` lives in `CanvasView`. The canvas cannot hide the band above it or the
masthead above that, and those are most of what "full screen" means here: the
map goes `fixed inset-0` at `z-[80]`, above the masthead's `z-30`, and the band
is simply not rendered.

- **Nothing is dimmed or scrimmed**, because there is nothing behind it the user
  is meant to see. This is not a panel over a page; it is the page.
- **Escape leaves it.** It is the only exit that does not require finding a 30px
  button on a map you have just filled the window with, and it is what every
  full-screen thing on the web has taught people to try.
- **Fit and full screen sit next to each other and are not the same thing**,
  which is why both are in the cluster: Fit changes the zoom so the graph is all
  visible, full screen changes how much window there is to be visible in.
  Confusing them is exactly what "fit to screen" invites, so the two icons are
  deliberately unalike — one frames, one pushes out.
- **`GraphCanvas` takes `full` and `onToggleFull` and owns neither.** It draws
  the button and reports the press; the surface decides what full screen means.
  A canvas that set its own `fixed inset-0` would be a component reaching past
  its own box to cover chrome it does not know about.
- The z-slot belongs in the stacking list in `AppShell`, above the AI panel:
  this is the one thing in the product meant to cover everything.

#### The bottom-left card is the key to both axes

It was the four health dots and nothing else, which left the evidence encoding
— dashed box, hatched box, solid box — **entirely unglossed on the only screen
that draws it.** A reader could tell a critical process from a healthy one and
had no way at all to tell one we have data on from one we do not, which is half
of what this surface is for. It became two labelled rows, `RUNNING` and
`EVIDENCE`, plus the correction chip on the second. Rows and labels rather than
one mixed strip, because the whole point is that the two questions are separate.

**It says what it is now, and it took two goes.** On request, and the round
trip is the part worth keeping.

Two words beside a strip of marks is not a key: nothing said the box *was* one,
and `Running` / `Evidence` named the question while leaving the mark unnamed.
The first fix was a title, three stacked rows and a sentence each — *Colour, and
how it is running* — which said everything and was reported, correctly, as too
much text on a map. It is a title and two one-word labels now.

- **The label names the mark and the values name the question.** That is the
  split the long version missed. `Colour` over *Critical · Watch · Running well*
  needs no third thing saying it is about health, because the values can only be
  a reading about how something is running. Naming the mark is the half a reader
  cannot guess; naming the question is the half the values already give away.
  So the cheap word stays and the sentence goes.
- **§4's two-axis rule survives on the two labels alone.** Colour is one
  question and fill is another, and naming both marks is what stops the card
  reading as one scale.
- **The title stays**, over a rule bleeding to both card edges: the boxed-`Field`
  voice, and inside the padding it reads as an underline on the words. Three
  words, and they are what makes this a key rather than a row of unexplained
  pills.
- **The correction chip is back at the end of the evidence row.** It is a third
  axis and does not belong under `Fill`, which is the argument for the row it
  briefly had. On a card this size one line at the end of an existing row is the
  cheaper of the two errors, and a reader meeting an ink chip on a node still
  has one place to look.
- **The measured cost of getting it wrong the other way**: the three-row version
  was 170px tall against 76px now, on a canvas that is ~230px at 375. A key that
  covers the map is not a key.

**Below `sm` the body is behind a `KEY` toggle.** At 375 the canvas is about
230px tall and the two-row key was covering all of it. One copy of the markup,
not a `sm:hidden` duplicate: the body's classes decide whether it shows and the
toggle is the only thing that appears. `openOnSmall` starts `false` and is never
seeded from the window, so there is no hydration mismatch.

**Including "not looked at" in the always-visible key** is what stopped grey
reading as a fourth shade of fine rather than as an absence of any reading, and
that is §4's data-completeness rule showing up as a pixel.

Two things removed from this card earlier stay removed, and one has come back
in a better form:

- **"scroll to zoom · drag to pan · double-click to go deeper"** is still gone,
  and **double-click is no longer the only way down**. See *Going down is a
  control now* below.
- **"What do the fills mean?" and the `CanvasLegend` it opened.** Still gone;
  the second legend row is what replaced it, at a fifth of the height and
  without an interaction. `CanvasLegend` is imported by `CanvasList` alone,
  which nothing imports.

#### The node carries three axes, and the third is about us

`needsCorrection` on `CanvasNode` — a string, not a boolean, holding what is
wrong in words. Three nodes carry one today.

**It is a third axis and not a fourth health state.** Health is a reading about
the client's process; this is a reading about *our* reading of it. Giving it red
would say Transport is on fire when what is actually on fire is our description
of Transport. So it is **ink on ink**: a filled `bg-foreground` chip with a nib
and the word *Check*, which is not a hue at all and cannot be mistaken for one.
Filled rather than outlined because it has to win a corner the health mark is
already in, and because a person put it there deliberately — it should look
placed.

- **The string is required and `check:data` enforces it**, at eight words, with
  the same argument as the counter rule: a flag with no reason is a red mark a
  consultant cannot act on, and the failure is silent — the node renders a
  perfectly tidy chip that says something is wrong and nothing about what.
- **A flagged node must have evidence.** `check:data` fails a flag on a node
  with `completeness: "none"`. A flag is a statement about our reading, so there
  has to be a reading to be wrong about; flagging an unresearched node is either
  a mistake or a request for research, and the empty states already say that.
- **In the panel the flag sits above the numbers**, not below them. Read after
  the metrics and the gaps it casts doubt on, "this may be wrong" arrives too
  late to change how they were read. Same argument the Gaps detail makes for
  putting the confidence chip in the card header.
- **It opens the prompt box; it does not let anyone retype the finding.** §5.
- **Level 0 shows the roll-up**, `correctionsUnder`, as *2 to check* on the
  drill row. A stage is a place you go down from, so the useful thing it can say
  is what is waiting below.

#### Going down is a control now

The box was one `<button>` whose double-click drilled. That was the one
interaction on this surface nothing on screen mentioned — the driving
instructions naming it were removed and the affordance went with them.

It is two controls in a box: the body opens the detail, and a footer strip
reading **`5 inside · 2 to check ›`** drills. Double-click still works for
whoever learnt it. Nested buttons are invalid, which is why the box is a `<div>`
now and not a button itself.

**A leaf says so in words** — *Lowest level. Priced here* — as a `<span>`, not a
button. A box with nothing under it looks exactly like a box whose children have
not loaded, and §4 puts all the value at the bottom level, so arriving there
should be a statement rather than an absent chevron. A second tab stop that goes
nowhere would be worse than no affordance.

#### Weight by level, and why size alone could not carry it

`NODE_SIZE` in `lib/canvas.ts` — 264×132, 264×124, 300×140 for Levels 0, 1, 2.
`GraphItem` carries `w`/`h` per node and every piece of the geometry reads them
rather than the old module-level constants.

**World-unit size on its own does nothing for §4's rule that weight increases
with depth, and it took building it to see why.** You never see two levels at
once, and each level is fitted to the same viewport, so a bigger Level 2 box
arrives on screen the same size as a smaller Level 0 one. What survives the
normalisation is the **ratio of the type to the box** and how much is inside it:
Level 0 is a 15px name and a number in a wide quiet box, Level 2 a 20px title
holding four facts. The sizes matter for the aspect the type sits in, not for
the size the reader perceives.

Three things fell out of building it:

- **Fit frames the graph, it does not magnify it.** `MAX_FIT_K = 1`, separate
  from `MAX_K = 2`. Level 2 is two or three boxes, so fitting them to a 1440px
  viewport asked for k≈1.8 and got it: two nodes at 540px wide with 28px titles,
  which **inverted the hierarchy the level sizes exist for** — the deepest level
  arrived four times the size of the value chain above it. Manual zoom still
  reaches 2, which is a different act with a different intent.
- **Level 0 was 104 tall for one revision and that was too short by about the
  height of the line it was meant to show.** The box is a column with `mt-auto`
  on the footer, so the squeeze landed on the subtitle and three of the five
  stages rendered a blank band where their plain-language line should have been.
  Nothing said so: **a clamped line that clamps to zero is not a clip**, so
  `check:ui` is blind to it. Found by looking at the screenshot.
- **Two boxes touching is not something any harness sees**, so a change to
  `NODE_SIZE` or to `positions` has to be checked by measuring the rendered
  rectangles pairwise. The three levels currently clear by 96/196/80 horizontally
  and 66/70 vertically.

#### The node has a level of detail

`COMPACT_BELOW = 0.62`. Under that zoom the node drops subtitle and status
words, and grows its title and marks in world units so they come back to a
readable physical size.

**This is the fix for the worst thing on the surface.** Level 1 is fourteen
boxes across 2200 world pixels, so it fitted at about k=0.47 — where a 17px
title rendered at eight physical pixels and the 11px health mark at five. Every
encoding this screen is built on stopped working at exactly the level that has
the most to say, and the screen read as a swarm of identical rectangles.

The compact node is not less informative, it is differently informative. What
survives is what you scan a map for: where it is, what it is called, is it on
fire, do we know anything. The plain-language gloss is what you read once when
you arrive somewhere, not what you scan fourteen of.

**A 6px health strip runs along the top of every node**, at every zoom. The
border already carries the hue, but at Level 1's fit zoom a 2px border is one
physical pixel — the strip is three, and it is the one part of the node that is
a solid block of the colour rather than an outline of it, which is what makes
fourteen boxes readable as a distribution before they are readable as names.
`unknown` gets a dashed hairline and not a grey block: on a warm palette every
neutral reads as a colour, and a filled grey strip would put "nobody has looked"
alongside the three real readings as a fourth one.

**The strip was extruded for a revision and is flat again**, both on request.
A `.health-bar` class laid white and black at low alpha over the hue for a lit
top edge and a shadow cast onto the card. The class is deleted rather than left
unused, which is the rule: a semantic class with no call site is a decision
pretending to still be one.

The part worth keeping if it is ever tried again: **do it as a lighting layer,
not as colour.** Alpha over whatever `bg-health-*` the node already carries
means one rule serves all three hues in both themes and the hue on screen stays
exactly the token's, which is what §4's two-axis rule depends on. The
alternative — six lighter/darker health tokens to shade three colours — is six
more values to keep in step and a standing invitation to reach for a shade when
a hue was meant. And `unknown` must stay flat either way: a *raised* grey strip
says "fourth reading" twice over.


**The hatch went from 0.13 to 0.2 opacity.** At the old value it was invisible
at any zoom the graph actually renders at, so *some evidence* and *well
evidenced* were the same box with a different three-bar glyph on it.

**The evidence word and the money are both on the footer now.** It was one slot,
so a priced node showed its rupees and said nothing at all about what was behind
them — the exact pairing §7.11 is about.

### The question detail is cards

`QuestionRow`'s expanded detail is three boxed `Field`s on Questions — *Why
this matters*, *Weak answer*, *Good answer* — and three plain labelled
paragraphs everywhere else. On request, and it is the same prop and the same
argument the gap detail already records.

- **Three labelled paragraphs on one ground is a wall of small grey text.**
  Three boxes is a list of answers to three questions, and a consultant two
  clicks into a question is looking for *one* of them: usually what a weak
  answer sounds like, because that is what tells him whether to push.
- **`Weak answer` and `Good answer` were run-in `<dt>`s** — bold words at the
  head of a sentence, which is the weakest heading in the product. At a glance
  the block read as one paragraph with two bold phrases in it, and those two
  are exactly the pair you want to compare side by side. The detail was also
  inconsistent with itself: *Why this matters* directly above them was already
  a stacked label.
- **It is a `boxed` prop and not the default, because `QuestionRow` renders on
  Research too** — inside Call's probe beat and under each person on
  Stakeholder. Research Full is a continuous document, where a border between
  two sections is a wall between two halves of one argument. Boxed on
  `/questions` and in `QuestionScript`, plain in the dossier. Same split
  `Field`'s own prop was written for.
- **Research does change, in one way that is an improvement rather than a side
  effect**: the two run-in answers become stacked labels there too, matching
  the *Why this matters* above them. The cap still applies unboxed, and
  `.prose-full` still releases it on Full.
- **`check:ui` sees none of this**, for the reason that section already
  records: it samples the default paint, and on Questions that is By call with
  every row shut. Measured by driving it instead — all three arrangements ×
  375, 1024 and 1440 × both themes, with **every** row opened: 3,300 text nodes
  checked, **zero contrast failures**, and the only overflowing elements are
  the masthead's own tab scroller and the 2px the ask pill's ring sits outside
  its box. `/questions` is unchanged at 277 words and 24 controls, because
  three cards are not three more controls.

### By text

**Superseded: the tab is gone and `QuestionScript.tsx` is deleted, on request.
Arrange is two tabs.** The argument below is why it existed, and it survives in
a different place: what it was really for was *taking a question out of the
tool*, not a third cut of the same eleven rows. **Every `QuestionRow` now
carries its own copy button, beside the chevron** — a sibling of the disclosure
button, because a button inside a button is invalid markup, and always visible
rather than revealed on hover, because a hover-reveal is out of reach of the
phone this surface is read on. It copies the question and its data-request
parenthetical, which is the marker the doctrine below insists must travel with
it, and it reports its own failure for the reason recorded there. **What is
genuinely lost is the whole script as one object**; if that is wanted again,
the cheap version is a Copy all on the panel header rather than a tab.

The linked-gap chips went at the same time, also on request: the `Tests:` strip
at the foot of the expanded detail, one pill per gap with its rupee figure.
That was the last money on Questions, and *Gaps has no money on it* is the
larger version of the same argument.

`QuestionScript` in `src/components/meridian/`. A third Arrange tab on
Questions, and it is **built out of the same parts as the other two**: one
`Panel`, a person heading, `QuestionRow` for every question.

**It had a typography of its own for one revision, and that was the wrong
trade.** Plain numbered sentences, no rows, nothing that opened. Two things
were wrong with it. A third tab rendering in a register the surface does not
otherwise use reads as a different product rather than as a third arrangement.
And it cost the reader everything a row carries: why the question matters, what
a weak answer sounds like, which gaps it tests. **The distinction between the
three is the cut, not the styling** — By call is two panels split by occasion,
By person is a panel each, and By text is all eleven in one panel with a Copy
all button on it: the whole script as a single object, which is the thing you
take away.

**The argument for the tab existing is the one `SaveMenu` already makes about
the plan.** A consultant does not read this surface during the call. He reads it
before, and then he is in Meet or on a phone with the tool behind something
else. A question he has to retype into his notes is a question he shortens, and
a shortened discovery question is a different question.

- **The words on screen and the words on the clipboard are the same words.**
  Both walk one `SCRIPT_ROWS` array, and `whoLine` and `questionLine` are the
  only places either form is composed. What differs is what a row can do that a
  line of text cannot: on the page it opens. The blank lines in the copy are
  computed from what precedes each line rather than written in, so a group
  gaining or losing its occasion heading cannot leave a double gap behind it.
- **The data request keeps its marker in the copied form.** `QuestionRow` puts a
  chip on it because it changes the register of the call, and a script that
  drops the marker drops the warning: the parenthetical says the same words the
  chip does.
- **It is last in the track**, because it is what you reach for once you have
  decided what to ask, not while you are deciding.
- **The copy genuinely works, so the failure is reported too.**
  `navigator.clipboard` needs a secure context and is absent over plain http, so
  the button says *Copy failed* and a line beside it says *Select the text
  instead*. Same doctrine as the connectors and `SaveMenu`: a control that
  swallows a press is worse than one that admits what happened. The label change
  is mirrored in an `aria-live` region, because a screen reader does not
  reliably re-announce a button whose own text has changed under the focus.
- **The company name is on it, once, as the script's title.** Everywhere else in
  the product that would be the third statement of something the masthead
  already says. Here it is the top of a document that leaves the tool, where
  nothing else says which client this is.

**The ask mark is the bare number, on all three.** It was `1st`, `2nd`, `3rd`
for most of its life, in a `w-12` column. The ordinal was there to say "ask this
first", but the spine already says it: eleven numbers running down a rule in one
direction is an order, and nothing else on the row is numbered for it to be
confused with. The suffix cost two glyphs on every row and 20px of column on a
surface whose sentences now run the full width. `min-w-6` and `text-center` on
the mark, so 1 and 11 are the same width and the spine below them is one line
rather than two that step.

**`check:ui` does not see two thirds of this**, because it samples the default
paint and the default arrangement is By call. It was measured the same way the
hover states and the hero backdrop were: drive each tab, read every text node
against its composited background, check the boxes. Zero contrast failures and
zero overflow across three arrangements × 375×667, 1024×780 and 1440×900 ×
both themes, and all eleven rows still open on Enter under By text.
**Re-measure by driving the tabs if this surface changes** — running `check:ui`
alone will report green without having looked at two of the three.

### Entities is a list, Processes is a graph

**Superseded: Entities has been removed from Operations on request.** The
component and its data stay in the tree unimported, so this section is the
argument for putting it back rather than a description of what is on screen.

`EntityList` in `src/components/surfaces/`. Operations' second view was a second
node graph and became a grouped list, on request. The change is larger than a
layout, and the reason is worth keeping.

**A graph asserts that the shape of the connections is the point.** For
processes that is true: §4 says Level 2 is where companies differ, and it is the
cross-links at Level 1 that show you where to go down. For entities it is not.
Eleven records with eleven arrows between them is a flow anyone in procurement
could draw from memory — requisition, order, receipt, invoice, payment — so the
picture spent a whole viewport restating what §8 already defines. What a
consultant cannot get from the shape is **which of these are in the ERP, how
many there are a month, and which ones are on fire.** That is a list, and now it
is one.

- **The four groups are Gaps' four areas.** Not a taxonomy invented for this
  view: someone who has filtered Gaps by *Paying for what they buy* meets the
  same four names when they ask what moves through it. `bucketId` is a field on
  `EntityNode` rather than something derived from its gaps, so the filing is a
  visible decision, and **`check:data` fails the build if an entity sits in a
  different area from its own gaps.** Derivation would have been fewer
  keystrokes and would have hidden exactly the disagreement worth catching.
- **The flow survives without the arrows.** Each row ends with what it follows,
  read off the same `entityEdges` the graph drew. That is the one thing the
  picture carried which a list has no column for, so it is stated in words.
  `entityEdges` stays; **`entityPositions` is deleted**, because coordinates
  were the only part of that data about the drawing rather than the business.
- **System first in the meta line.** "Excel", "Paper, then SAP MM", "PDF and
  paper, keyed into SAP FI" — that is the finding on half these rows and most of
  why the view exists. Volume and evidence follow it.
- **The switch moves out of its card.** On the graph it needs a ground because a
  node can pan under it; on a list there is nothing to pan, so it takes the page
  tone every other switch in the product uses. `CanvasView` renders one
  `ModeSwitch` and hands it to whichever view is showing rather than each view
  building its own, because two copies of the control that switches between them
  is how they drift apart.
- **The health legend comes with it.** The graph keeps its own in the bottom
  left corner, which the list does not inherit. Four words at the top beats a
  health word repeated on eleven rows.

`check:ui` does not see any of this: it loads `/operations` in its default
Processes mode and never presses the chip. Contrast in the list was measured by
hand instead, every visible text node in both themes, and came back clean.

### Gaps' two dropdowns

`SelectField` in `src/components/shell/SelectField.tsx`. Order and Area, as
labelled dropdowns, on the page above the list card rather than in its header
strip. Both on request.

**Order lost *Value* when the prices came off, and gained *Sequence* in its
place.** Sorting by a number that appears nowhere on the surface is a control
whose effect cannot be read: the list rearranges and nothing on it says why.
Sequence is now the default, which is the ordering the plan panel beside it is
built out of, and it is computed by the same `sequenceWaves` the plan uses so
the two can never disagree. The remaining three are Sequence, Effort, How sure.

**What the move buys, independent of the request.** Area carries four bucket
names in full and ran 729px as a track, so inside the card it was a horizontal
scroller that hid its own last option, and the two tracks wrapped against each
other at anything narrower than a wide monitor. A dropdown is the width of its
longest label plus a chevron, at every viewport, and it cannot push an option
off the right edge.

- **It is a native `<select>`.** A custom popover would match `ProjectMenu`,
  but that one is *navigation* — you press a project and go somewhere. This
  picks a value, which is what the element is for, and the native one is
  keyboard-operable and screen-reader correct for free, cannot be scrolled off
  the edge of a card, and opens the platform's own picker on a phone. That last
  point is worth more here than usual: this is read minutes before a call,
  sometimes on an actual phone.
- **The label is visible again, and that is a deliberate reversal.**
  `SwitchTrack` lost its labels because beside underline tabs a micro-cap reads
  as a sixth word in the row that happens not to be pressable. Beside a box
  with a chevron it reads as what it is. A dropdown showing `Value` with
  nothing next to it does not say *value of what*, and unlike a tab row it has
  no siblings to imply the question.
- **A real `<label htmlFor>`, not `aria-label`.** There is visible text, so
  pointing at it beats repeating it.
- **The chevron is drawn, not the platform's.** `appearance-none` plus a
  positioned `ChevronIcon`, because the native arrow is a different shape,
  weight and colour on every OS and two of these side by side is exactly where
  that shows. `pointer-events-none` on the icon so it does not eat the click.
- The row is `mb-3` with `gap-x-6`, matching Questions' `Arrange` row above its
  panels. Two surfaces that both put a setting on the page should not disagree
  about where it sits.
- **A `w-px` rule sits between them**, the same one Research puts between
  Direction and Detail, and for the same reason: two settings side by side read
  as one four-item strip, and space alone has to be a lot of space to say
  otherwise. It is `self-stretch` so it runs the height of the select boxes and
  reads as a boundary between two controls rather than a tick floating beside
  them — **which means the row has to be `items-stretch`**; on `items-center` a
  self-stretched child has nothing to stretch to and the rule measures zero.
  It hides below `sm`, where the two dropdowns stack: a vertical rule between
  two stacked things points the wrong way.

**One row on Gaps still uses `SwitchTrack`'s siblings and one does not**, so if
a third surface converts, take `SelectField` rather than inventing a second
dropdown.

### What to build is the project's front page

On request: *the top of the page should immediately answer "what should we
build for this client?"*, with the meetings, the research, the workflows and
the findings behind a click. `/build`, `BuildView.tsx`, `recommend.ts`, and the
leading tab in the masthead. Opening a project from the list lands here.

**What it replaced was not a page, it was an assumption.** Opening a project
landed on Research › Company Brief, and before that on Operations. Both are
material with the answer somewhere inside them: a map of how the company runs,
or six directions of dossier. Neither says what we would sell them. A
consultant with four minutes does not read a dossier and derive a pitch; he
arrives with a pitch and reads backwards from the first challenge to it. So the
page is that order, top to bottom: the answer, then the rest of the list, then
four ways back down into the surfaces that own the evidence.

**The ranking is computed and the weights are the design.** `buildOrder()`
scores every priced finding on four things already on the `Gap`: the money
doubled, then how sure we are, what the fix costs to deliver, and whether
Heizen has built it before, with a penalty for a fix that cannot start until
another one lands. Nothing is authored, so the order cannot go stale against
the findings list, and the one-line rationale on each row is composed from the
same three fields the chips beside it draw.

- **`gap.rank` is not this order.** That is the value ranking. A build order
  that ignored tier, effort and prerequisites would put a ₹2.1 Cr guess with an
  unmet dependency above a confirmed fix we have shipped twice.
- **The first weighting was wrong, and the way it was wrong is worth keeping.**
  Tier, effort and precedent started heavy enough to outrun the rupee figure,
  and the page recommended the three safest small builds: a confirmed, cheap,
  done-before ₹75 L fix at number one, on a company leaking ₹9.1 Cr. That is a
  good list of *first deliveries* and a terrible answer to *what should we
  build*. The three adjustments now move a finding by about ₹1.5 Cr of apparent
  value: enough to lift a proven cheap build over a slightly larger guess, not
  enough to bury the largest number on the list.
- **Three, because three is what gets said out loud.** `FIRST_COUNT`.
- **Unpriced findings are out of the ranking, not at the bottom of it.**
  Scoring a blank as zero reads as *worth nothing*, which is a different claim
  from *not costed yet*. They get their own block and carry `unpricedReason`.

**There is money on this surface, and *Gaps has no money on it* still holds.**
The rule that decision rests on is §7.11: a rupee figure is only honest with
its base and its rate attached. Gaps could not meet that twelve times over, so
it shows none. Here there are three, each showing base × rate on the card and
the full `ValuationBridge` one click down, which is the same component Research
› Money renders. The other eight rows carry no price at all, for exactly the
reason Gaps carries none, and the band states the overlap deduction (§7.12) and
keeps the one-off cash release separate from the annual figure (§7.13) rather
than leaving a reader to notice that three rows do not sum to the headline.

**The band says what has not been looked at, on the same screen as the total.**
§7.14. Make and Return are unresearched, and a headline number that does not
say so is the first thing a client corrects.

**The card is two columns from `lg`, and the second one is the money.** The
price sits in a 20rem rail, so the three figures line up down one edge and the
three recommendations can be compared as a column. It was 16rem: the rail holds
two wrapped sentences under the figure, and at that width the base line broke
to five lines beside a title with room to spare. Below `lg` it is a block under the
text. It is rendered twice, `hidden lg:block` against `lg:hidden`, so exactly
one copy is in the tree at any width; `PriceBlock` is the shared body, so the
two cannot drift.

**No prose on this page is held to `measure`**, on request. The class is for a
column of body text in a document; here the band is one paragraph on its own
ground and the card's text column is already bounded by the price rail beside
it, so capping either again left a second stripe of blank inside the first.

**The whole card opens the panel, and the footer is gone**, on request. It
carried two controls: a *How this is priced* disclosure holding
`ValuationBridge`, and an *Evidence and what it takes* link into the shared
panel. What replaced both is the card itself, with an info mark in the corner
saying there is more behind it.

- **The mark is an icon, not a control**, and that is forced rather than
  chosen: a button inside a button is invalid markup. It is drawn in the shape
  the info control has on a question row and moves on the card's own
  `group-hover`, because a mark that lights up under the cursor while not being
  pressable is a control that lies.
- **The valuation had to survive the disclosure going.** §7.11 asks for four
  things, not two: a named base, a stated rate, the range, and whose numbers
  they are. Base × rate = claim was already on the card; the range and the
  whose-numbers line joined it rather than going behind a click. The full
  `ValuationBridge` is not here — a range bar, a deduction row and a benchmark
  note make a component to read, and this is a card to scan. It still lives on
  Research › Money, the surface built around nothing else.

**The qualifiers under the headline are gone, and this is the one thing on the
page to keep an eye on.** They were three shapes across three revisions: a
four-cell definition list, then four folding `Section`s, then a single caption
line, then nothing. Each removal was asked for, and the last one leaves the
band as a headline and one sentence.

What went with them is not decoration. Three of the four carried standing
rules — §7.12 (savings do not add, show the deduction), §7.13 (a one-off cash
release is never blended into an annual figure), §7.14 (a total says what it is
not a total of) — and the headline is a *netted* number, so it is now a figure
whose netting is stated nowhere on the surface that shows it. The facts are
still in the product: the overlap and the bridge are on Research › Money, the
one-off is on the card that earns it, and coverage is on Research. **If this
surface ever gets read to a client off the screen, the deduction line is the
first thing to put back**, and one `text-micro` line under the standfirst is
the cheapest form of it — that shape existed and worked.

The confidence strip that used to close the panel — a badge, a researched date
and a link to Money — went in the same sequence.

**The evidence block moved to the top, became the platform's metrics, and then
merged into the answer band**, across two requests. It was four cards under a
*Why we say this* heading at the foot of the page, each with a title, a count
and two lines of prose. It is now the lower half of one tinted panel: sources
ingested, directions written, workflow lanes to compare against, findings made,
under the headline they add up to. Read *before* the recommendation instead of
after it, the same four counts make a different statement — not "here is where
to check our working" but "here is how much work is standing behind this
number", which is the first thing an investor asks. Every tile is still a link
into the surface that owns it, so nothing became less reachable by moving.

- **One box, because it is one subject.** Stacked as two panels with a gap
  between them they read as *what the platform holds*, then *what we would
  build*. The four numbers are the scale the headline rests on: nine sources
  and twelve findings came out at three builds worth ₹5.3 Cr, and that is one
  sentence.
- **The brand colour is the dark ink, not the cyan**, and the box was built
  wrong once before that was said out loud. It went out as `--evidence-muted`,
  a pale blue tint — a reasonable reading of "use the brand colour" and the
  wrong one. Heizen's colour is the near-black the masthead is painted in.
- **So the band borrows the masthead's whole family** rather than defining a
  dark of its own: `--masthead` for the ground, and its foreground, muted,
  border, hover and accent for everything on it. Two things come free. The box
  reads as an extension of the bar above it instead of as a second idea, and it
  is theme-correct in all three modes without a line of work, because those
  tokens are already defined per mode for the chrome. Checked by driving Brand,
  Dark and Contrast.
- **`--masthead-accent`, not `--accent`, for the figures.** The page-level
  accent is a cyan chosen against ivory and has nothing like the contrast to
  sit on near-black; the masthead's accent is the one built for this ground and
  already in use a few pixels above. Same argument for the dividers being
  `--masthead-border`: a hairline in the page's neutral drawn across a filled
  ground reads as a seam where the fill failed.
- **It is the only filled object on the surface.** Everything else is `bg-card`
  on the page ground, so the one block carrying the answer is the one that
  cannot be missed. A second filled box on this page would turn this one into a
  category.

- **The prose did not survive the move, and should not have.** A count and a
  destination is what a strip is for; the paragraph explaining what a source is
  was the page telling a consultant something he already knows.
- **`pluralise` cannot label these tiles**, and finding out cost a render that
  read "9 9 sources". The helper returns the count with the noun, and this is
  the one place in the product that deliberately separates them: the figure is
  set larger and `tabular` so four tiles line up on it.
- **The figures are in `--accent`**, on request, and that is a legitimate spend
  of the token rather than an exception to it. `globals.css` records `--accent`
  as the cyan meaning *somewhere to go*; every tile here is a link into the
  surface that owns its number. It is the ink `text-evidence` already spends on
  a link in running text, at display size instead of body size. The arrow
  appears on hover rather than sitting on all four: four static arrows read as
  four things to do, which is the opposite of what a measurement is for.

**The page is laid out around one action: prep for the call.** On request,
after confirming the premise — that roughly four sessions in five are the same
session. The evidence for which action that is comes out of CLAUDE.md §2 rather
than out of a guess: the archetype's own words are *"I have a call with them
today"*, the standing test for every screen is *what do I say on this call*, and
`PrepView` was already built around a consultant with four minutes who will not
assemble a briefing out of five surfaces. **Research runs once per project; the
pitch is read before every call.** That ratio is the whole argument for giving
one control this much weight.

- **It is cream on graphite, and that is the strongest thing the palette can
  do.** Everywhere else the single filled control is `AiButton` on the chrome
  strip. Here the band is the chrome's own colour, so the inversion — the
  page's ink used as a ground — is available, and it is spent exactly once on
  the whole surface.
- **The destination is chosen for the reader, and the button says which.**
  `nextCall()` in `lib/calls.ts` reads whether any call transcript exists: none
  means the intro call has not happened, one or more means the next
  conversation is the discovery call. Derived from `sources` rather than
  flagged on the project, because a flag would be a second place for the same
  truth to live and the one that goes stale.
  - **The label carries the disclosure, and nothing else survived beside it.**
    The button read *Prep for the call* with sixteen words after it — "Next up:
    discovery call · 8 steps · about 45 minutes. 3 calls on file, so the intro
    is done." Two cuts took all of it: the label absorbed the destination
    (*Prep for the discovery call*), then the step count and the minutes went
    too. Both the reasoning (`NEXT_CALL.why`) and the length are still computed
    and still true, and the agenda states both in its own standfirst — one
    press away, and where somebody querying the choice would actually look. The
    cost is real and is the point: a reader deciding whether it fits the gap
    before a call finds that out on arrival rather than before pressing. On the
    page whose whole job is one action, one object beats one object explained.
- **The band is three blocks, not four.** It grew a greeting, a headline, a
  standfirst and a line under the button, and at that point the most expensive
  space on the page was four-fifths prose. The standfirst went down to the
  section it was actually about: *"Take them in this order. 2 of the 3 we have
  built before, and the first could be live in 7 weeks"* describes the three
  builds, and it was sitting above a button that goes somewhere else — a line
  of the wrong subject in the best place on the screen. It is now the
  standfirst of *What we would build*, and the placeholder line that had been
  written for that heading is gone rather than kept alongside it.
- **What was demoted, and what deliberately was not.** The three builds, the
  later findings and the unpriced list move under the fold behind a *What we
  would build* heading — a section that previously needed no heading, because
  while it was the first thing under the band it *was* the page. The eight
  surface tabs did not move. A secondary nav for demoted entry points was
  offered and declined, and it would have contradicted the one-nav decision
  recorded in *The masthead is one line*: workspace above a project, surfaces
  inside one, no third state.
- **The risk taken, stated plainly.** A dominant CTA above an answer can
  compete with the answer. It works here because the two say different things —
  the band says *what* we would build, the button says *go and get ready to say
  it* — and because the button is the only filled object on the page. If the
  band ever grows a second control, this is the note that was relied on.

**The band greets the reader by name**, on request. *Hi Sai, here is what we
would build for Suvarna Agro Foods.* It is the only second-person line in the
product, and this is the one screen that has earned it: everything else is
written *about* the client, and this is the first thing a consultant sees on
opening a project and the only surface whose subject is what *he* should do
next.

- **The standfirst had to move person with it.** It read "Ranked by how sure we
  are…", which is the product describing its own method. A greeting followed by
  three sentences of methodology is a letter that forgets who it is addressed to
  after the first line, so it says what the reader gets instead: take them in
  this order, two of the three are things we have shipped, you could have the
  first live in about seven weeks.
- **It is set at body weight, not as an eyebrow.** It went out at `text-small`
  in `--masthead-muted`, which is the treatment the product uses for a label
  above a heading — so the one line in the product addressed to the reader was
  the quietest thing in the box it opens. At body size in the full foreground
  it reads as somebody talking, which is what it is.
- **First name only, and it degrades honestly.** `Member.name` is optional by
  deliberate design — `workspace.ts` refuses to invent a display name from an
  email address, because a prototype that guesses one shows a real person
  something untrue about themselves. A member with no name gets the line
  without the greeting rather than "Hi sai@heizen.work". The split to a first
  name happens here rather than where the string is written, so the line cannot
  grow a surname when somebody edits their profile.

**The whole surface was cut for length**, on request: short, plain, scannable.
Four passes, and the rule each one followed is that the page keeps every fact
and loses the reasoning behind it.

- **The band's standfirst went from three sentences to one.** It explained the
  ranking method, then the precedent count, then the timeline. The method is
  the page's business rather than the reader's — he wants the order, not how it
  was arrived at — so it is "Take them in this order. 2 of the 3 we have built
  before, and the first could be live in 7 weeks."
- **`whoseNumbers` came off the cards and the basis badge answers for it.** It
  read "Rohan's 'less than half' gives the 53% uncontracted share; the ₹66 Cr
  indirect line and the 6% rate are both ours" — forty words of provenance on a
  card meant to be scanned in a corridor. *Sector default* is that sentence's
  conclusion, and carrying it is what the basis token is for. The sentence is
  untouched in the data and still renders in full on Research › Money, where
  there is room to argue with it. §7.11 still has all four of its parts on the
  card: base, rate, range, basis.
- **The two list standfirsts lost a clause each** and the unpriced one lost
  two, while keeping the distinction that matters: out of the ranking is not
  the bottom of it, because a blank is not a zero.

**The numbered cards carry the chips and nothing under them**, on request. A
composed rationale line ("Inferred, not confirmed, built before at Malwa Auto
Components, starts after Supplier master data") and a blocker line sat under
the two chips on each card. Everything they said was already on screen or one
click away: the tier and the precedent are the chips themselves, the weeks are
on the precedent badge, and the prerequisite is in the panel's next steps. Three
grey lines restating two chips is the overwhelm §7.1 names, on the one screen in
the product that cannot afford it. `Recommendation.reason` is unchanged and
still labels the list below, where the rows have no chips of their own.

**The later-findings list is Gaps' list, not a table.** A drawn card per
finding, 10px apart, hovering its border rather than its fill, inside a `Panel`
with its own padding taken off — the shape `SelectableGapRow` records and for
the same reason: rows under hairlines read as a printed table, and these are
separate things a consultant picks one of. What this list keeps that Gaps' does
not is the one-line ranking rationale under each row, because over there the
order is whatever the reader sorted by and here it is ours, so it has to say
why. The unpriced block takes the same card, so the two read as one list in two
parts.

**Two copy rules were broken by tidying and are recorded so they are not broken
again.** Lowercasing a prerequisite's name to fit a sentence turned
"Duplicate supplier records in SAP" into "sap", and lowercasing a valuation's
base label printed "₹53 cr". Both are the product misspelling something it is
telling a client about, in the line whose job is defending a number. Titles and
base labels go in as authored.

### Gaps' strip shows every filter, and Add is a plus

Two corrections to a declutter pass, both on request, and both worth recording
because they reverse decisions made one revision earlier in this same file.

**Every filter is on the strip.** They had gone behind one *Filter and sort*
button that opened them in a row underneath, on the argument that a reader
arriving at Gaps is here to read twelve findings rather than to configure a
list. The argument against wins: these are the surface's working controls, and
a control you have to open a panel to reach is one you stop using.

What the collapse was really fixing was that the row looked like nine competing
objects, and that part is fixed by what *stayed* from the pass rather than by
hiding anything:

- **Three dividers came off.** They were marking boundaries between controls
  that are all the same kind of thing.
- **The icon-only sort became a labelled `Order` select.** It had been a 36px
  square with a dot on it when the order was not the default, carrying its
  value only in a tooltip and an accessible name — a deliberate trade recorded
  at the time, and one that stops being worth making once the row is legible.
  Five like-shaped dropdowns read as one bank; an icon, four boxes and a pile
  of rules read as nine things.

**Add a gap is a plus beside Run, not an overflow.** It had been moved into a
`⋯` menu as a secondary action, which left a menu holding exactly one item —
something you have to open to discover is nearly empty. Icon-only rather than
the words spelled out, because it sits directly beside the filled primary and
two labelled buttons in one corner read as two things of equal weight when only
one of them is. The words survive as the accessible name and the tooltip, which
is the trade `ThemePicker` already makes.

**What the pass kept.** The row-level overflow stays: a bookmark and a pencil
on every one of twelve findings is twenty-four controls to look past, and
neither is pressed while scanning. That one was about a control repeated per
row; this one was about the surface's own controls, and the two are not the
same problem.

**The row overflow centres itself, and the margin it replaced is why.** It
inherited `mt-0.5` from the pair of 32px boxes it stands in for, which wanted
the row's first baseline: two controls beside a finding read as belonging to
the first line of it. One 28px box does not, and against a card taller than its
single line of text it read as pinned to the top corner. The card keeps
`items-start` for the plan tick-box, which does still belong on the first line,
so the menu takes `self-center` rather than the row centring everything.

### Gaps has no money on it

On request, and it is the largest single decision recorded in this file about
what a surface is *for*. There is no price on a gap row, no rupee figure on the
band, and no total in the plan. `GapRow` takes `mode="delivery"`; Research's
three gap-bearing directions keep `mode="value"` and are untouched.

**The argument, which is the same one §7.11 already makes.** A rupee figure is
only honest with its base, its rate and its range attached, and there is exactly
one place in the product with room for all three: Research › Money, which is
built around nothing else. Twelve prices down a list with the working two clicks
away is the number a client challenges first and the one an error hides behind
longest. Money did not get deleted. It got put where it can defend itself.

**What Gaps is instead.** The question the price was standing in for: twelve
problems, what each one needs before it can start, what it costs in weeks, and a
plan that turns a tick-list into dates. That is a delivery conversation, and it
is the one a consultant has after the money conversation has gone well.

What changed, surface by surface:

- **The row** is finding, effort chip, chevron. The chip moved from the front to
  the far end, into the slot the price vacated — on a surface with no money, what
  a fix costs to deliver is the only quantity left that anybody sorts on, and the
  end of the row is where the sortable quantity has always sat.
- **The band tiles are gone with the band.** They were `12 gaps found`, `3 need
  something first`, `8 of 12 confirmed` — three counts of a list that starts
  twelve rows below them. See *The page header*. The one of the three that was
  not a restatement, `3 need something first`, is what the plan panel orders by
  and says in words.
- **The detail** trades `ValuationBridge` for five cards: *What we think is
  happening*, then the existing *Why we believe it* and *Expected impact*, then
  *Still unknown* and *Next steps*, and then the evidence chain. See *The detail
  is cards* below.
- **The plan panel** is a schedule. See below.

**Three costs, stated rather than discovered later:**

- **The overlap deduction is no longer displayed on Gaps.** §7.12 requires it to
  be shown somewhere, and it is: `Less the same saving counted twice` in Money's
  bridge, and again in Stakeholder's standfirst. It moved with the money, which
  is the only place it means anything.
- **The evidence panel still shows a price.** It is opened deliberately, from
  four surfaces, and it is the one view that shows a figure *with* its valuation
  bridge attached, which is the exact condition §7.11 asks for. Making it
  mode-aware would break Money and Operations to tidy a boundary nobody crosses
  by accident.
- **Gaps and Money can now disagree about how many findings matter**, because
  Gaps no longer ranks by value at all. That is the point, but it means a
  consultant reading the two surfaces in the same minute sees two different
  orders. The plan panel's sequence is the one that decides delivery.

#### The detail is cards, and it runs the full width

On request, and modelled on the shape Call's beats already use: a micro-cap
label, a hairline box, nothing else. `Field` in `GapRow.tsx` takes `boxed`, and
Research does not pass it.

- **Five labelled paragraphs on one ground is a wall of small grey text with
  headings in it.** Five boxes is a list of answers to five questions, and a
  consultant two clicks into a row is looking for one of them rather than
  reading all five. That is the whole argument, and it is why the cards are on
  Gaps and not on Research: Research Full is a document read top to bottom,
  where a border between two sections is a wall between two halves of one
  argument. Same distinction the theme note draws about `Panel`.
- **`boxed` is a prop and not a second component.** The two are the same content
  in the same order and only the ground changes. A `BoxedField` beside a `Field`
  is where the two would quietly drift apart.
- **A boxed label is ink at 600 over a rule, not an 11px grey caption.** Grey
  micro-caps read as a caption *on* the paragraph rather than as the question
  the paragraph answers, and five identical captions down a stack say nothing
  about which card to read first. Ink at 600 is the weight the section headings
  already use, so this is the existing landmark voice and not a new one.
  **The rule has to bleed to both card edges** — inside the padding it becomes
  an underline on the words, which is the exact trap the navigator's heading
  documents. It also matches its own box: dashed across the dashed card, because
  a solid line there is where the caveat register slips.
- **The header is a row, so a field can put something at the far end of its own
  label.** One does: *Why we believe it* carries the confidence chip up there,
  on request, with `confidenceReason` left in the body as a muted line. It is
  the better split. How sure we are is a property of the whole card, and read
  before the paragraph it tells you what weight to give what follows, rather
  than qualifying it after the fact. It also retires the wrap trap the chip and
  the reason used to share on one line. The chip's wrapper needs
  `normal-case tracking-normal` — the header is uppercase at 0.12em and a chip
  inheriting that reads "MEDIUM CONFIDENCE" as a second heading.
- **No mark before a label.** A cyan dot sat on the lead card's label for a
  revision and came off on request. The lead is still the lead: its body is a
  size up at `text-base`, which was always doing most of that work.
- **Still unknown is the dashed one**, with a `--health-watch` label. The product
  already codes a caveat that way: *Do not sell this alone* right below it,
  Certainty's *Check before you say it*, Call's *Hold back*. Everything else in
  the stack is something we are telling the consultant, and this is the part we
  cannot. The prerequisite callout underneath took the cards' radius so it reads
  as the last block in the stack rather than as a different kind of thing.
- **Full width means no `.measure` inside a card and no left indent.** The
  `sm:pl-8` had nothing left to align to once the rank came off this surface.
  **The cost is real and larger than Research's**: a released paragraph in this
  column sets at about 150 characters at 1440, against the ~120 `.prose-full`
  produces and the 77 the cap allowed. `.reading` stays on every paragraph,
  which is the mitigation that section already records, and the cards are the
  rest of it — the eye returns to a labelled edge every three lines instead of
  running down one undifferentiated column. If this ever reads as too wide, the
  fix is a cap on the card rather than on the paragraph inside it.
- **In dark mode the cards are the same colour as the panel under them**, so
  only the border draws them; `shadow-card` does nothing on a dark ground, which
  the theme note already records. Checked in both themes rather than assumed.

**Three blocks were cut from below the cards, and one was kept.** On request.
The detail now ends at the evidence chain.

- **The prerequisite callout**, because the plan panel beside it is what
  actually acts on prerequisites: it orders the waves by them, refuses a move
  that breaks one, and names any that have not been ticked with a link to add
  them. A second statement of the same fact, inside a row that has to be opened
  first, is the weaker of the two. Its overlap half was a rupee reconciliation
  on a surface with no rupees on it.
- **The metric lines.** Benchmarking is the persuasion mechanic (§4) and it
  belongs where the argument is being made, which is Operations and Research.
- **The meta line**, whose four facts are each stated somewhere the consultant
  is already looking: the weeks are in the plan, the owner is on Stakeholder,
  the SCOR path is Operations' whole subject.
- **`Open in panel` stayed**, alone, right-aligned. It is not a statement, it is
  the route out to the full evidence chain, and §7.4 has no exception for a tidy
  surface.

**The evidence chain itself is `compact` here**, which is a prop on
`EvidenceChain`: source name, kind icon and locator on one line, no quote, no
rail, no dots. The excerpt is the right thing to show where the claim is being
*argued* — Research quotes the line that supports the sentence above it — and
the wrong thing at the end of five cards about what to do next, where the only
question is whether there is something behind this and what it was. The quote is
one click away in the panel, which is what §7.4 asks for; it does not ask for it
to be on the page. **The label and the count stay**: a strip of links with
nothing naming it is a row of unexplained pills, which is the mistake
`SourceStrip` already documents.

**The known cost, so it stays a decision.** `TIER_LABEL` was in that meta line,
so **the tier is now stated nowhere on Gaps** except inside the evidence panel;
the band tile that carried the count went with the band. Order still offers *How sure*, which sorts by it.
That is the same gap the row's own note already records about `TierMark`, one
level deeper, and the same cheap fix applies: show it while that ordering is
active, not on every row for the eleven-twelfths of the time nobody is sorting
by it.

**The third instance of one trap, now fixed in all three places.** The
confidence chip and its reason live in a `flex-wrap` row, and the reason carried
`flex-1` with `min-w-0` beside a `shrink-0` chip: `flex: 1 1 0%` plus permission
to shrink, so at 375 it agreed to be zero wide and rendered one word per line
down a 60px column. It is `w-full sm:w-auto sm:flex-1` now, the same fix as the
row title above and the delivery chip beside it. **This one predates the
redesign and was on Research too** — full width is what made it visible, not
what caused it.

#### The plan is a schedule now

`src/lib/plan.ts`, rendered by `PlanPanel`. It was a rupee display figure with a
sequence underneath. It is now weeks and dates, and the consultant can edit
them.

- **Weeks is the display figure.** It is the number a consultant is asked for out
  loud, and unlike a total it does not need a base to be true.
- **The two dates are one line under it**, not a labelled field beside a stated
  one. `STARTS` in micro-caps over a bordered box made the panel's most editable
  thing also its heaviest, and put a second landmark directly under the display
  figure where the eye had nowhere to go. A plan runs from a date to a date;
  that is one sentence. Two rules in the card now, where there were four.
- **`DateField` lays a real `<input type="date">` at zero opacity over the
  formatted text.** A bare date input renders in the reader's locale, so
  `08/17/2026` sat beside `1 Mar 2027` in the same sentence, and an input cannot
  be formatted. The input keeps its label, its place in the tab order, the
  platform's picker and its screen-reader semantics; the visible text takes the
  ring off it through `peer-focus-visible`, and a dotted underline says it is
  editable. **This is a presentation layer over a real control, not a button
  pretending to be one** — the moment it becomes the latter it stops being
  operable and the trade is no longer worth making.
- **The duration is a drawn box, on request, and the ghost is gone.** Number
  and unit share one `border border-border rounded-md` field that hovers to
  `border-border-strong` like the card around it.

  They were two borderless fields sharing a hover ground with a dotted underline
  under them, which was right while the gaps were tinted rectangles and stopped
  being right the moment they became cards: on a `bg-card` block the hover
  ground *was* `bg-card`, so the one thing saying "you can edit this" fired and
  painted nothing, and a dotted underline on its own is a hint rather than a
  control. A field on a card is expected to be drawn.

  The old argument against drawing it — three rows of number-box plus
  select-box plus close-box is nine outlined controls in a 400px column —
  survives as **one box rather than two**, so the count is three and three, and
  the number and the unit read as one quantity rather than as two settings that
  happen to be adjacent.

- **`w-11` on the number input, up from `w-9`.** The stroke needed 6px of left
  padding to not sit on the digits, and that came straight out of the field:
  `16` rendered with its second digit sliced, in dark mode first. Measured
  after — 44px box, 44px scroll width, no clipping at 375 or 1440. **The spin
  buttons are hidden with `opacity-0` rather than `appearance-none`, so they
  still take their width**, which is what makes this measurement necessary every
  time the padding moves.
- **Work inside a wave runs in parallel, so a wave costs its longest job**, and
  the plan costs the sum of the waves. This is why moving a gap *later* can make
  the plan shorter, which looks wrong for a second and is right: it stops being
  the thing that sets its wave's length.
- **And the panel now says so, in one line above the waves.** Wave 1 held a
  12-week job and an 8-week job and announced 12 weeks, which a consultant reads
  as an error until somebody tells them the work runs at the same time. The
  parallelism was a rule in `plan.ts` and a paragraph in this file, and the
  screen showed only its result. *"Everything in a wave starts together, so a
  wave takes as long as its longest job."* **This is not a screen explaining
  itself**, which §7.2 rules out. It is the key to a quantity already on
  display, in the place the quantity is read, which is the move Money's bridge
  makes with the overlap deduction. Once, not once per wave.
- **The duration is on its own line under the title, and it says what it is.**
  It was `12  w` at the end of the title's line, which is three faults in eleven
  pixels: `w` is not a word, nothing said whether the number was how long the
  fix takes or how long the problem had been running, and on one row it sat
  beside a finding that already contains a duration — *"Vendor onboarding takes
  21 days"* next to `12 w`, two numbers in different units meaning opposite
  things. It reads `12 weeks` now. **`to deliver` came off a revision later**,
  on request: it was a three-word tail on every row of a panel headed *Plan*
  whose display figure is `28 weeks, end to end`, and in a schedule a duration
  against a job is the job's length and cannot be anything else. Spelling the
  unit is what fixed all three faults; the phrase was belt over braces.
  **It moved down rather than getting more room across** because there is no room across: at the panel's 320px floor a spelled
  unit leaves the title about 140px, and at 1440 the longest title wraps anyway,
  so the second line is free most of the time and clear all of it.
- **`w-9` on the number input, not `w-7`.** The spin buttons are hidden with
  `opacity-0` rather than `appearance-none`, so they still take their width and
  a two-digit value renders as `1:` with the second digit sliced. Hiding them
  outright would cost the hover affordance the row is built around.
- **Each gap in the plan is a card, and it is the gap detail's card**, on
  request: `rounded-lg border border-border bg-card shadow-card` with `px-4
  py-3`, which is `Field`'s `boxed` shape written out. The two are the most
  closely related things on this surface — open a row and you get five of these,
  tick it and it appears over here — so a plan block that was a tinted rectangle
  beside a stack of bordered cards made them read as two kinds of object.

  It got there in three steps and the steps are the argument. A wave is two or
  three gaps under one heading, and on the bare panel the only thing separating
  one from the next was the leading between a duration line and the next title;
  `bg-muted` fixed that, `bg-background` made it subtler on request, and the
  border is what finally made it a *thing* rather than a region of the panel.
  Which is what a draggable object has to look like: you pick up the box you can
  see.

  - **The hover is the border, not a fill.** On `bg-card` there is no tint left
    to shift to that would not undo the card, so what deepens is the edge —
    `border-border-strong`, the same step the detail's cards take. It changes a
    colour on a border that is already there, so nothing inside moves a pixel.
  - **8px between cards, up from 6.** Two borders 6px apart read as one double
    rule.
  - **The wave's drop highlight stays a ring.** It lost its fill when the gaps
    first took a ground of their own and it is still right: a tint behind three
    bordered blocks shows only in the gaps between them.
  - **It retires a contrast pairing rather than adding one.**
    `--muted-foreground` on `--muted` is the one pairing nothing automated used
    to look at, and the tinted version had made it a rest state. The duration
    line is back on `--card`, which is checked everywhere.
- **The sprint heading is typeset as a title.** `text-small` at 600 in ink,
  with the date span left grey at `text-micro` beside it. It was an 11px grey
  line, and once the gaps under it became bordered white cards that read as a
  caption on the first card rather than as the heading of all three. Ink at 600
  is the voice `Field`'s boxed labels use one panel across, so the heading over
  a stack of cards and the heading on a card are now the same voice. The dates
  stay small on purpose: the sprint number is what you scan the column for, the
  span is what you read once you have found it, and promoting both would make
  the line a second title rather than a title with a note.
- **The two stats under the waves are gone**, on request. *"waves, run one after
  another: 2"* and *"rest on inference, not observation: 1 of 3"*. Both were
  restatements: the wave count is the number of headed blocks directly above it,
  and how many rest on inference is a reading about the *findings* rather than
  about the schedule, which each row's confidence chip already carries. A summary of a list that is fully visible two inches up is weight with
  no second read in it.
- **The order is computed and then editable, and both halves matter.** Computed,
  because five of twelve gaps do not pay until something else lands and holding
  that in your head is the same mistake §7.12 records about overlapping savings.
  Editable, because a delivery date is a negotiation and the pipeline is not in
  the meeting.
- **A prerequisite is the one edit the panel refuses.** Moving a gap in front of
  something it depends on is not a preference, it is a plan that does not
  deliver. `ScheduledGap.earliest` says how far up it may go, both the drop and
  the arrow key refuse anything above it, and the grip's tooltip names the gap
  that is blocking it. **Refusing with a reason beats accepting and warning
  afterwards** — the warning arrives after the consultant has written the date
  down. The refusal is in the panel and not in `schedule()`, which would accept
  the drop and then repair it: the gap would snap back with no explanation.
- **Reordering is a drag, and the same grip takes the arrow keys.** The two
  arrow buttons were removed on request. What replaced them is one control with
  two ways in rather than a gesture plus a fallback that drifts: a grip you can
  drag, and, when it has focus, ↑ and ↓ move the gap a wave. **The keyboard half
  is not optional** — a drag is a pointer-only gesture and §7.8 has no exception
  for controls that feel modern.
- **A wave is the drop target, not a position in a list.** Order inside a wave
  means nothing: the work runs in parallel and the wave costs its longest job,
  so dragging a row above another row in the same wave would be a gesture with
  no result. A dashed *Drop here for a wave of its own* zone appears under the
  plan only while a drag is in progress, because it is the one move a
  wave-shaped target cannot express, and a permanent empty box under the plan
  is worse than not offering it.
- **`dataTransfer.setData` on drag start is load-bearing**, not ceremony:
  Firefox will not begin a drag without data on the transfer.
- **A duration is a number and a unit**, days, weeks or months, per gap. A
  three-day cleanse and a four-month rollout are both real answers, and rounding
  either into whole weeks makes the plan lie in a way a client notices. The
  schedule converts to weeks to do its arithmetic — two jobs can only be
  compared in one unit — but the number the consultant typed is the number they
  see. **A month is 4.345 weeks, not 4**: twelve four-week months is 336 days,
  which loses a month off a year-long plan. `formatSpan` drops to days under one
  week, because "0.4 weeks" is not something anybody says.
- **The start date is a native `<input type="date">`**, for the reason
  `SelectField` is a native `<select>`: keyboard-operable and screen-reader
  correct for free, and on a phone it opens the platform's own picker. It renders
  in the reader's locale, so `08/17/2026` next to `ends 1 Mar 2027` is the
  platform's format meeting the product's, and that is the honest trade rather
  than a bug.
- **`PLAN_START` is a constant, not `today + 2 weeks`.** `new Date()` in a client
  component renders one date on the server and another in the browser, which is a
  hydration error. Same class of trap as the `useSyncExternalStore` note on the
  assistant's width.
- **An override on a gap that leaves the plan is deleted.** The suggested order
  is recomputed from whatever is ticked, so a wave index held over from a
  different selection would put the gap somewhere arbitrary if it came back. The
  duration survives, because that is the consultant's own estimate rather than a
  position in a list that no longer exists.
- **Wave indices are compacted before anything is rendered.** Moving the only gap
  out of wave 2 must not leave a labelled empty wave behind, and "Wave 4" on a
  three-wave plan is a bug the consultant reads as data.

#### Saving the plan, and adding or editing a gap

Two controls that leave the surface, and both follow the connectors' doctrine:
designed as real, labelled honestly.

**`SaveMenu`** sits in the plan card's header, and it is the one control on
Gaps that is *not* designed-as-real-and-labelled-honestly: **it really
downloads.** A plan that only exists inside the tool gets retyped into a deck,
and a retyped plan is where the dates stop matching the ones the client was
shown, so this is the control worth wiring first.

- **The button says `Download`, not `Save`.** "Save" in a tool with no server is
  a promise about storage that nothing here keeps. A file arriving in the
  downloads folder is the whole of what this does, and `DownloadIcon` says it a
  second way, which is worth 13px on a control that leaves the product.
- **The formats changed when it was wired, and that is the honest trade.** It
  offered PDF, PNG and JPG. None of the three can be produced in the browser
  without a rendering library, and **a text file named `.pdf` is worse than a
  button that admits it is not wired**: the consultant emails it to a client and
  it does not open. What is there instead covers the same three destinations
  with three formats that are genuinely written — **CSV** for a spreadsheet,
  **Markdown** for the proposal, **plain text** for a message.
- **The file is built from `sched`, not from the fixture.** Whatever was
  dragged, retimed or restarted is what comes out. A plan that exports the
  suggested order rather than the agreed one is how the dates stop matching
  again. The parallelism gloss goes into the file with the wave lengths, for the
  same reason it is on the panel.
- **The foot names the file that arrived, in a `role="status"`.** A download is
  a line in a tray the consultant is not looking at, so a menu that appears to
  do nothing gets pressed three more times. It is also the only thing that says
  *which* plan came out, now that the filename carries the start date
  (`suvarna-agro-foods-delivery-plan-2026-08-17.csv`).
- **Two browser quirks the download helper exists for.** The anchor is appended
  to the document, because Firefox will not follow one that is not in the tree;
  and `revokeObjectURL` goes on the next tick, because Safari has historically
  dropped a download whose URL was revoked in the same task.

**`GapPanel`** is a right-hand drawer, opened from *Add a gap* on the band or
from the edit control on a row. It is the same shape as `EvidencePanel` on
purpose: this product has one way of examining a thing in depth, and a second
drawer with different manners would be a second product.

**It is one component and one prop, not two panels.** `gap` present is an edit,
absent is an addition. The two are the same fields in the same order and only
the verb changes, so a `NewGapPanel` beside an `EditGapPanel` is where they
would quietly drift apart. Same argument `Field`'s `boxed` prop makes on the
detail cards. The file was `NewGapPanel.tsx` and is now `GapPanel.tsx`.

- **Its scrim is full width**, where the evidence panel's is `lg:hidden`. That
  one is a reading surface you keep open beside the page; this is a form you
  finish and close, and a form the page can be clicked behind is one you fill in
  twice.
- **The parent mounts and unmounts it rather than passing `open`.** A half-typed
  gap has to be gone when the drawer reopens, and resetting that on an `open`
  prop is a `setState` inside an effect, which `pnpm lint` rejects. Unmounting is
  the version of "reset the form" that needs no code. **Editing needs the same
  trick one level finer**: the caller passes `key={gap.id}`, or pressing edit on
  a second row while the first is open keeps the first row's text in the boxes.
- **Focus returns to the button that opened it.** `NewGapButton` takes a `ref`
  as an ordinary prop, which React 19 allows and this codebase prefers to
  `forwardRef`. The row's edit button hands its own element up through the
  click instead, because there are twelve of them and a ref per row is a map
  kept in step with a list that filters and re-sorts under it. Escape closes.
  Found by driving it: the first version left focus on `<body>`.
- **The fields are the ones a gap cannot exist without, and no more.** There is
  no price field. A number typed into a box has no base, no rate and no range,
  which is the whole of §7.11, and there is no money on this surface anyway.
  *Expected impact*, *Still unknown* and *Next steps* joined the form when
  editing arrived, and they belong in the add form too: `check:data` fails the
  build on a gap missing any of them, so a form that could not fill them was a
  form that produced an invalid gap.
- **The last thing in the form is not a field.** It is the line stating what
  would be recorded against the gap: added or changed by, and when. A gap with
  no origin is what §4 forbids, and a form that does not show the consultant
  their own name on it is one that will eventually be used to smuggle one in.

**The finding is the record's name, and it is typeset as one.** It sat at the
same 13px in the same hairline box as the ten fields under it, so the one line
saying which gap you are editing read as the first of a list rather than as its
subject. It takes `text-base` at 500 — **the size and weight the row it was
opened from uses for the same string**, so the title does not change register on
the way into the drawer — with `--border-strong` and a step more padding. The
border is what does the defining *at rest*: on open the field carries the focus
ring and looks primary for that reason alone, and the moment focus moved
anywhere else it went back to looking like everything else.

- **It is a textarea, and that was measured rather than assumed.** At
  `text-base` the longest of the twelve findings, "Approvals happen on email and
  WhatsApp with no audit trail", overruns a single-line input by **58px at 1440
  and 103px at 375** — so the drawer opened on the *tail* of the title with the
  first word scrolled out of sight, which is worse than the small type it
  replaced. Two rows hold the worst case at both widths, checked across all
  twelve gaps. **If a longer finding ever lands, this is the thing to re-measure.**
- **It stays a one-line title in every other respect.** Enter is suppressed and
  newlines are stripped on the way in, so a paste out of a document cannot turn
  the name of the record into a paragraph, and `resize-none` keeps the drawer's
  rhythm. The textarea is the wrapping, not the licence.
- **`TITLE_FIELD` is written out in full, not `` `${FIELD} text-base px-3` ``.**
  Third instance of a trap `cn` no longer has: under the plain join `text-small`
  and `px-2` would have quietly won and the change would have looked like it did
  nothing. It stays written out, because reading the field's own classes beats
  reasoning about which of two lists wins. Width is still the caller's.

**Editing is the edge of §5, and the line is drawn inside the form rather than
around it.** §5 says users never hand-edit AI output, because a hand-corrected
claim loses its provenance and the chain in §4 stops being walkable. That rule
is about the *claim*, not about every string on the object, so the split is
**what you observed against what the evidence says**:

- Editable: the finding, the plain line, the hypothesis, the area, the effort,
  how long it takes, who it sits with, the expected impact, what is still
  unknown, what to do next. Every one of those is a judgement a consultant is
  better placed to make after a call than the pipeline was before one.
- **Read-only: *why we believe it*, the confidence chip, and the evidence.**
  They are the chain. They change when a source changes, not when an opinion
  does. They are **shown** rather than left out, with a line saying they are not
  editable here and that correcting the reasoning is the assistant's job — an
  absence reads as an oversight, and the next revision puts a box around it.

**The edit control is a sibling of `GapRow`, not part of it**, and both reasons
are load-bearing. `GapRow`'s whole collapsed row is a `<button>`, and a button
inside a button is invalid markup that browsers repair by moving the inner one
out of the row. And editing belongs to Gaps rather than to the component:
Research renders the same rows, and nothing on Research is a working list you
correct.

**It is always visible, not revealed on hover.** A hover-reveal is the quieter
list and puts the control out of reach of every touch device, which is the phone
this surface is read on in the minutes before a call. **The cost is measured and
is the one to watch**: `check:density` goes 47 → 59 controls on `/gaps` with the
words column unmoved at 252, which is exactly the weight §7.1 warns about and
the words counter cannot see. It is a 24px ghost in `--muted-foreground` rather
than a labelled button for that reason. If the list starts reading as a form,
the cheap fix is to move it into the expanded detail beside *Open in panel*,
which costs a click and gives back twelve tab stops.

**One trap, caught four times before it was fixed at the root.** `FIELD` carried
`w-full`, and `` `${FIELD} w-12` `` on the duration input did nothing: under the
plain-join `cn` the number box took the whole row and the unit select was crushed
to `we`. `FIELD` no longer sets a width; the caller does. See *`cn` is
tailwind-merge now* — the merge is the fix, and these four call sites stay as
they are because a component that does not claim a width cannot be wrong about
one.

#### The tick-box

`Checkbox` in `src/components/shell/Checkbox.tsx`. It was
`<input type="checkbox" className="accent-foreground">` — the browser's own
control, tinted: a different box on macOS, Windows and Android, a different
corner radius from every other box on the page, and a focus ring the platform
draws rather than the one `check:ui` measures.

- **The fill is `--evidence`, not `--foreground`.** On the page a cyan thing is a
  thing you operate, which is what this is. Ink would have made it agree with the
  text beside it, and a control that matches the prose is a control you stop
  seeing.
- **The tick is `--card`, and that is what makes one component work in both
  themes.** Light fills deep teal and cuts a white tick out of it; dark fills
  lifted cyan and cuts a near-black one. A hardcoded white tick sits at about
  2:1 on the dark theme's `#4FC9D8`.
- **`appearance-none` on the real input**, not a hidden input beside a drawn box.
  The element stays focusable and in the tab order, so the ring lands on the box
  the user can see. The tick is a `peer-checked` sibling because a
  background-image tick cannot take a token colour.

### The Run button

`RunButton` in `src/components/shell/` — the band's `actions` slot on
**Research (all eight), Gaps and Questions**, the three surfaces whose whole
content is pipeline output. Operations, Compare and Sources do not have it:
Sources is where you *add* the input rather than re-read it, and Operations and
Compare are views onto research run elsewhere.

**The label names the surface, not the pipeline** — `Run research`, `Run Gaps`,
`Run Questions`. From the band you can only see the surface you are on, and a
button that says "research" on the Questions screen is ambiguous about whether
it regenerates the eleven questions or the whole dossier.

Like the data-source connectors and the "Run research on this section" buttons
in the empty states, it is **designed as real and labelled honestly**: a real
control in the real place, wired to nothing, because the prototype reads one
static research set.

**It carried a "Last run 6 August 2026, 4:20 pm" line for one revision and no
longer does.** The argument for it was staleness — a dossier with no date on it
is one you cannot tell is stale. It is worth knowing what it cost before
putting it back: the block ran 280px, which on Stakeholder Brief at 1024×780
is wider than the ~220px left beside the title and the five-chip person
picker, so it wrapped, the band grew 32px and that Brief clipped by 21.
`check:ui` caught it. Fitting it needed the date at three separate lengths in
`suvarna.ts` and the icon dropped from the tight button. **If the timestamp
returns, it belongs somewhere with room** — the project switcher already says
"Researched 6 August 2026" on its row.

**It was the only thing in `actions` on every band, and on Gaps it now has
company.** Questions' By call / By person used to sit to its left and is now on
the page with the questions it rearranges, because rearranging is a reading of
the body rather than work you start. `NewGapButton` is not that. **Adding a
finding is the other verb on a surface whose whole subject is a list of
findings**, so the band still says one kind of thing: this is the work you can
start from here.

**`NewGapButton` is an outline, not a second white pill.** Re-running is the
thing you do far more often, and two filled buttons side by side make you read
both before pressing either. Measured against the composited band, its white
label is 9.36:1 at 1440 and 8.77:1 at 1024, which is the check *The backdrop*
asks for whenever something new lands on the right of a band.

**It is not the manual editing §5 rules out.** That rule is about not
hand-correcting pipeline output, because a hand-edited claim loses its
provenance and its audit trail. A gap the consultant heard on the call and the
research never saw is a new observation with a person as its source, not a
rewrite of one the model produced. **When it is wired it has to record who added
it and when**, or the chain in §4 ends nowhere.

#### There is no backdrop

`public/` holds no images. See *The page header* for what was there and why it
went. `.hero-art`, `.hero-scrim` and `--hero-image` are gone from
`globals.css`, and with them the one thing in the product that the contrast
checker structurally could not see.

The rule that outlives it, because it will come up again the next time a
photograph is proposed: **a decoration that defeats the automated check has to
be re-verified by hand every time anything near it moves.** That cost is paid
on every future change, not once.

The reference has no dark mode, so one is derived: indigo-charcoal `#12101F` page,
`#1B1930` card, cyan lifted to `#4FC9D8`. Elevation is carried by the card being
lighter than the page rather than by the shadow, which does nothing on a dark
ground — but `--elevation-*` stays defined in both themes so no component branches.

**Note on the shadow tokens.** The root variables are `--elevation-card` /
`--elevation-raised`, and `@theme inline` maps them to `--shadow-card` /
`--shadow-raised`. The names must differ: a theme key defined as `var()` of
itself resolves to itself.

**One typeface: Inter.** The platform ran a geometric sans (Figtree, standing in
for the site's licensed Axiforma) against **Inria Serif italic** for section
headings, mirroring heizen.work's two-voice pairing. That was dropped on request —
**Inter now carries everything**, and the three font tokens all resolve to it:

- `--font-sans` / `--font-display` — Inter. `.font-display` adds weight 700 and
  `-0.02em`, keeping the site's tight headline tracking.
- `--font-accent` + the `.accent-heading` class — used **only** on section
  headings. It was Inter italic in `--accent`; the re-theme made it ink at 600
  (see *The theme* above for why). Tracking stays at `-0.01em`, between body and
  display, to keep the two heading voices reading as siblings. Wider than section
  headings it stops being a signal and becomes decoration on a working tool.
  Italic is still loaded — `Evidence`, `MetricDelta`, `Certainty` and `Compare`
  use it for "nothing attached", "not measured yet" and similar.
- Uppercase micro labels track at `0.12em`, matching the site's wide-tracked
  eyebrows.

The tokens stay separate even though they point at one family, so a future split
is a `globals.css` edit and not a sweep through call sites. Changing the face is
still one import in `src/app/layout.tsx` — italic is loaded there because
`.accent-heading` needs it.

**Body tracking is -0.008em, and it was -0.014em for the wrong reason.** The
tighter value was tuned to stop a 15px Brief clipping at 375×667 — a layout fix
wearing a typography setting, and the kind that quietly costs a reader with less
than perfect vision. At 16px the letterfit no longer needs the help, so -0.008em
is the optical correction alone and nothing else. The fit is held where it
should have been held all along: by the header giving back 120px and by
`pnpm check:ui`.

**A face or size change here is a layout change, not a one-line change, and it
is not done until `check:ui` and `verify-stakeholder.mjs` both pass.** That has
not changed and will not.

Re-theming stayed a two-file change (`globals.css`, `layout.tsx`) because no
component contains a raw hex or a bare Tailwind palette class. Keep it that way.

### Reading rules — three classes, and when each applies

Research Full is the one surface that is genuinely *read* rather than scanned,
so line length and leading are set explicitly rather than left to the container.
Three classes in `globals.css` carry it. Use them; do not hand-tune leading at a
call site.

| Class | What it does | Where |
|---|---|---|
| `.measure` | caps at 64ch ≈ 77 characters | any prose at body or small size |
| `.measure-lead` | caps at 52ch ≈ 62 characters | prose at `text-lead` — a thesis, a line to say out loud |
| `.reading` | line-height 1.55 | multi-line 13px prose on **Full only** |
| `.reading-airy` | lifts `.reading` inside it to 1.7 | `FullFrame` only |
| `.prose-full` | **releases both caps inside it** | `BriefFrame` and `FullFrame` only |

**`.reading-airy` is a scope and not a change to `.reading`, for the same
reason `.reading` is not a change to `--text-small`.** On the straight edit
Stakeholder Brief clipped by 3px at 1024×780 and `check:ui` failed. Brief is a
fixed screen and three pixels is what it has; the view with a scrollbar gets
the air, the view without it does not. The extra leading exists because the
paragraphs are uncapped — at ~120 characters the eye needs more help finding
the start of the next line than it did at 77.

**Research sets to the full width of its column, on request, and `.prose-full`
is how.** It is a scope rather than a sweep through call sites because the caps
also live inside shared components — `ValuationBridge`, `MetricDelta`,
`Evidence` — which Gaps and Questions render too, and those keep the cap.

The cost is real and belongs on the record rather than in a rediscovery: at
13px a released paragraph in Full's column sets at roughly **120 characters**
against the 77 the cap allowed, which is past the comfortable range. Two things
pay for it, and if the width is ever reconsidered these are what to check:

- **Leading matters more now, not less.** `.reading` stays on every paragraph
  in Research. The longer the line, the more the eye needs help finding the
  start of the next one.
- **Shorter sentences wrap less**, which is why the readability pass and the
  width change were the same job and not two.

Four things about the caps that are easy to get wrong:

- **`ch` is a digit, not an average character.** Inter's digit is 0.6em against
  an average lowercase of about 0.5em, so `68ch` — the old cap, written for
  "~75 characters" — actually rendered ~82. It is 64ch now. If the face changes,
  this number is wrong again.
- **The cap cannot go much below 64ch.** At 13px, 64ch is still wider than
  Brief's own column, so the class never decides a line break there. Tighten it
  and it starts setting Brief's wraps, which a fixed-height screen cannot absorb.
- **`.reading` is deliberately a class and not a change to `--text-small`.**
  Brief keeps the tighter 1.38 token: it has four pixels of clearance and never
  runs a paragraph past two lines. Full has a scrollbar and can afford leading.
- **The classes stay on the elements even inside `prose-full`.** Nothing was
  stripped from a call site, so releasing or restoring the cap on any surface
  is one CSS rule, not a hunt.

The corollary for layout, which the release does not change: **a container is
widened, a sentence is decided.** `FullFrame` runs the surface frame and the
sheet fills it; what a paragraph does inside that is a stated decision in
`globals.css` and not a side effect of the column.

### Page width — one class, one exception

**Every scrolling surface runs the full width of the window.** Operations, Gaps,
Questions, Compare, Sources, Research Full and the hero band above each of them
use `.surface-frame` in `globals.css`: 100% wide, gutter opening 12px → 24px →
40px as the window does. They were capped between 3xl and 6xl, which put a
768px column of cards in the middle of a 1900px screen. The band and the
surface share the class because if they disagree on the gutter, every left edge
on the page is off by the difference.

**Research Brief is the exception**, and stays `max-w-lg`. It is the one fixed
phone-shaped screen in the product — one viewport, no scrollbar, read minutes
before a call and sometimes on an actual phone. Its width cap is what makes it
a single readable column rather than four rows stretched across a monitor.

Full was capped at 5xl for a while on the argument that prose caps at ~500px
and a wider column leaves an empty right-hand third. That is true of the
paragraphs and false of the page: most of what is in Full is **rows** — a gap
with its meta and its price, a claim with its source, a coverage line with its
count — and a two-edge row uses every pixel you give it. What the argument was
really protecting is the sentences, and `.measure` protects those directly.

So: **the frame widens containers, and widening a sentence is a separate
decision.** If you widen a container, check what inside it is a sentence.

**Research and Questions have both had that second decision taken the other
way**, and in both cases because it was asked for.

- Research runs its paragraphs the width of the column via `.prose-full`, at
  about 120 characters. See *Reading rules*.
- **Questions has no `.measure` left on it at all.** `QuestionRow` lost the cap
  on the question, the gloss, *Why this matters* and the two answers, and the
  surface's three loose paragraphs lost it with them. Measured at 1440 the
  longest question now sets at **142 characters**, past both the 77 the cap
  allowed and the ~120 Research runs at. Two things pay for it, and they are the
  same two Gaps' detail cards record: `.reading` stays on every multi-line
  paragraph in the expanded detail, and a question is one sentence rather than a
  column of prose, so the eye returns to a numbered mark on the spine every two
  lines. **`QuestionRow` is rendered on Research too** — inside Call's probe beat
  and under each person on Stakeholder — where `.prose-full` had already released
  the cap, so nothing changed there. Restoring it is adding `measure` back to
  four spans in one file.

Everywhere else the rule above stands unchanged.

### Compare is two tabs

`CompareView`, with a `SwitchTrack` on the page above the lane picker. **Time**
is the original surface, unchanged. **Workflow** is the flow-chart
representation §3 left open.

**The two tabs slice the same data in opposite directions, and that is the
point.** Time is six stage cards with every company inside each one, because a
duration only means something next to the same duration elsewhere. Workflow is
one card per company, because a workflow is a *sequence*: cutting it into six
pieces to compare each piece separately destroys the one thing it has to show,
which is shape. *"You are two days slower"* and *"you run two steps they do
not"* are different sentences, and only the second says what to fix.

- **A step a company does not run is simply absent from its chain**, and
  `Handling` carries `none` for exactly that. **It runs both ways**, which is
  what makes it worth modelling: best in class has no *Chase the sign-off*
  because nothing needs chasing, and Suvarna has no *Check they are not already
  on the system*, which is why it carries duplicate suppliers. Two lines under
  the client's chain name both sets out loud, because that is the sentence a
  consultant repeats on the call.
- **`none` is not "not measured", and the surface says both.** A lane with no
  steps recorded for a whole stage gets an italic line naming the stage and
  restating what the cycle figure therefore covers — Kesarwani has no freight
  mapped. A chain that just stops reads as a short flow rather than an unmapped
  one, which is §7.14 at the scale of one lane.
- **The chain wraps rather than scrolling.** Nineteen chips run past 2,500px,
  and a scroller per lane desynchronises the moment there are two: you would
  scroll one company's flow and be reading it against the start of another's.
  **The arrow lives inside the chip it follows, not between two chips** — as a
  sibling it is its own flex child, so a wrap can put it first on the next line
  and the chain appears to begin with an arrow pointing at nothing.
- **Four figures per lane, and every one is computed.** Cycle, steps, by hand,
  automatic, from the flow and the stage days already on the Time view.
  **Nothing is invented for that row, which is why there is no cost-per-
  transaction column** even though the reference has one: a rupee figure with
  no base, no rate and no range is the number a client challenges first
  (§7.11), and there is no room beside a company name for any of the three.
- **`HandlingMark` is shape, not hue** — filled, half, open, dashed — for the
  reason `TierMark` is: colour in this product encodes health, and how a step
  is handled is a statement about the process rather than about how healthy the
  company is.
- **The third band tile used to follow the tab**, because a days-based reading
  on the Workflow view is a number about something the screen is no longer
  showing. The tiles are gone; the rule survives and is worth more than they
  were: **a number on the chrome has to be about what is currently underneath
  it, or it is furniture.**
- **Below `sm` the lane name takes its own line and each figure carries its own
  label**, because the column heads are `hidden sm:flex` and four bare numbers
  with nothing naming them is the fault the plan panel's `12 w` had. The name is
  `w-full sm:w-auto sm:flex-1` and not `flex-1`: **the fourth place in this
  product that exact fix has been needed**, and the failure is always the same,
  a `flex: 1 1 0%` child beside a `shrink-0` sibling agreeing to be zero wide
  rather than wrapping.

### The source strip

`SourceStrip` in `Evidence.tsx`, under the document lead on **all six** Full
views. It was a one-off in Money.

- **It is titled `SOURCES`, with the count, on its own line above the chips.**
  Without a title the strip is a row of unexplained pills under a headline: a
  chip reading `FY25 Annual Report  Filing` says what it is and not what the
  row of them is *for*. It was beside the chips for most of its life, which was
  worse than useless — it sat on the same baseline as the first pill and read
  as the first item in the row, and it took about 90px off the scroller on
  exactly the screens with the least of it. Above, the row starts at the
  sheet's left edge like everything else on the page.
- **The chip is neutral.** A ground per kind was built — filing indigo,
  transcript teal, email amber, web green, as a `--source-*` token family — and
  taken off on request; the tokens went with it. Worth recording why it looked
  right and was not. Nine chips in four colours turns a strip that is
  *provenance* into a strip that is *taxonomy*, and taxonomy is not the
  question anyone brings to it: what a consultant does here is check that a
  claim has something behind it and then open the thing. Sorting filings from
  emails at a glance is not a task. Four hues bought that non-task and spent
  the page's whole colour budget doing it, on a surface where cyan is supposed
  to mean "somewhere to go".
- **What survived the colour is the weight step.** The source **name** is in
  ink and the kind word is grey. That is what the four grounds were really for.
  If a version of the colour comes back, the cheaper move is one hue on the
  icon, not four on the grounds.
- **It scrolls sideways rather than wrapping.** Nine chips run well past
  1400px, so the scroll is now a behaviour you can see rather than a claim
  about one, and there will be more the moment a real project is loaded; a
  wrapped second row pushes the document down on every screen. The title sits
  outside the scroller so it does not scroll away from the thing it names.
  `min-w-0` on the scroller and `w-max` on the row inside — a flex child
  defaults to `min-width: auto` and would otherwise refuse to shrink. The
  scroller bleeds into the sheet's padding (`-mx-4 px-4 sm:-mx-6 sm:px-6`), so
  a chip leaving the viewport runs off the sheet's edge rather than stopping
  short of it.
- **There are nine sources, and four of them carry nothing.** `src-inv`,
  `src-mca`, `src-call3` and `src-email2` are ingested and read but cited by no
  gap, claim, signal or risk. That is a true state and not a hole in the
  fixture: a consultant drops a folder in, the pipeline reads all of it, and
  most documents corroborate rather than carry a finding of their own.
  Certainty's source ledger shows them at **0 claims**, which is the honest
  reading and the reason that count is there. `check:data` checks that every
  cited source exists, not that every source is cited — deliberately.
- **Nothing counts the sources by hand any more.** Two hero tile labels
  enumerated them in prose ("a filing, two calls, an email thread, the web") and
  Certainty's sources section opened "Four." and put a literal `4` in its
  header. All of it is `sources.length` now — the tiles have since gone
  entirely, but the rule is why the strip's own count is still right: a count
  written as a word is a count that goes stale the first time the data grows.
- **The confidence badge came off it**, on request. Worth knowing what that
  cost: it was **the only confidence display on Full**. Brief still carries one
  in its footer. §7.5 says the product states how sure it is; if Full needs to
  say so again, the header's `actions` row is the only slot left that is not a
  caption on the sources — and that slot holds work you start, not readings, so
  putting it there is the thing that would reopen the rule.

### The scrollbars

`.scroll-slim` in `globals.css`, on **every horizontal scroller in the
product**: the source strip, `SwitchScroller`, the masthead's tab row,
Certainty's and Stakeholder's tables, `NodeCard`'s. Thin, no track, a thumb in
`--border-strong` going to `--muted-foreground` while the pointer is inside the
scroller.

**It cannot be hidden, only quieted.** Everything here that scrolls sideways
does so because the alternative is worse — the strip's nine chips would wrap and
push the document down on every screen, and a wrapped tab track is a different
object from a tab track. The scroll is a real behaviour a user has to discover,
and the bar is how they discover it. `--border-strong` is the hairline the
dividers already use, so at rest it reads as part of the furniture rather than
as a control.

**Standards properties only, and no `::-webkit-scrollbar`.** The pseudo-element
route has the fine-grained control and a cost this product cannot pay: defining
it opts the element out of macOS overlay scrollbars, so the bar becomes
always-visible and **reserves layout space**. Six pixels off the height of a
scroller inside `BriefFrame`, which may not scroll, is a layout change dressed
as a paint change. `scrollbar-width` and `scrollbar-color` style the overlay bar
where there is one and the classic bar where there is not; **measured, they
reserve zero pixels** on all four scrollers on Research Full. Safari supports
neither and keeps its own overlay bar, which is already thin and already
subtle — the fallback is the thing being asked for.

**One class rather than a prop.** Applying it only to Research would mean a
prop on `SwitchScroller` and on `SourceStrip`, both of which render on other
surfaces, and a scrollbar that is quiet on one strip and chunky on the next is
worse than either alone.

### The navigator

`SectionNav` in `Frames.tsx` — the "Research topics" list beside Research
Full. It is a card, one line per entry, and **it carries no money**.

- **It is a card**, matching the sheet beside it. A bare rail on ivory read as
  loose text set next to the document rather than as the page's second object.
- **The entries are `text-base`, up from `text-small`, on request.** The counts
  went `text-micro` → `text-small` with them. This is the one list on the page
  you read by scanning rather than by reading, and at 13px it was set a size
  below the document it points at. The `RESEARCH TOPICS` header stays at
  `text-micro`: it is a tracked eyebrow, and enlarging a 0.12em uppercase label
  makes it shout rather than read.
- **One line per entry, and the column is sized to make that true.** Count
  sits right of the label on the first baseline, no truncation — an ellipsis
  lands on exactly the words you navigate by. The old two-line entry doubled
  the navigator's height on a list of eight for a number you get again at the
  top of the section you land on; at 200px, five of Money's nine labels then
  wrapped, which is the same doubling arriving through the back door. The
  column is **19rem to `xl`, then 22rem**, and 22rem is the width at which the
  longest label in any of the six directions — Certainty's "The money by how it
  was priced", with its count — holds one line. **It was a flat 19rem, and the
  size bump is what moved it**: at `text-base` that one label wrapped and
  nothing else did. Change either the size or the width and re-measure all six,
  not just the one on screen — there is no permanent check for this, so it means
  dividing each label's rendered height by its computed line-height.
- **Brief's lead column carries the same two widths**, so the two views line up
  at every size: switching Brief↔Full keeps one skeleton, something fixed on
  the left and the material on the right. If one grows, both grow.
- **It is a step and not a flat 22rem, and `verify-stakeholder.mjs` is why.**
  On the flat version, Stakeholder Brief with Vikram selected **clipped by 22px
  at 1024×780** — the 48px the lead column took came straight out of the content
  beside it, which then wrapped one line further. `check:ui` passed, because
  Stakeholder's height moves with the person selected and `check:ui` does not
  change the selection. **This is the third time that note has earned its
  place.** Below `xl` the columns stay at 19rem, which costs one wrapped
  navigator entry on one direction, on a page that scrolls. A wrapped label
  beats a clipped fixed screen.
- **No rupee figures.** Every entry used to carry its own total, which made the
  navigator a second summary of the page competing with the band — `₹9.7 Cr`
  appeared three times on one screen at three sizes. The `meta` string is a
  count of what is inside (`4 gaps`, `19 claims`, `2 of 5`) or nothing at all.
  Money belongs where it can show its base (§7.11), and the navigator cannot.
- **The active entry is a filled row**, not an accent rail. Inside a card the
  rail was a second vertical line 12px from the card's own border.
- **The heading sits above a divider, not inside the padding.** The card is
  `overflow-hidden` with no padding of its own; the "Research topics" line
  carries the rule and the list carries its own inset, so the rule reaches
  both edges. Inside the padding it read as an underline on the words rather
  than as a divider between the label and the list.
- **The list opens at `pt-3`, not the `p-1.5` it insets by.** At 6px the first
  entry sat almost on the rule, which brought the underline reading back
  through the other side — the rule reaching both edges is necessary and was
  not sufficient. The space under it is the rest of what makes it a divider.
- **A click opens the section, then glides to it.** The entries are still
  anchors, so the URL stays sendable, but `goTo` takes over: it expands the
  target, scrolls smoothly, and `replaceState`s the hash rather than assigning
  `location.hash`, which would re-trigger the browser's own jump and undo the
  animation. `behavior` follows `prefers-reduced-motion` — a long smooth scroll
  is exactly what that setting is for, and both harnesses emulate `reduce`.

  Two things this got wrong first, both worth keeping:

  - **Expanding has to happen before the scroll, not after.** A section that
    opens after the target position is computed pushes everything below it, and
    the landing is wrong by the height of the body that just appeared.
  - **`setStored` compares against the raw entry, not `?? false`.** A section
    with no entry yet is not necessarily open — Benchmarks ships folded — so an
    early return keyed on `(readAll()[id] ?? false) === collapsed` made "open
    this one" a no-op on exactly the sections a navigator click most needs to
    open. It looked like it worked, because the scroll still happened.
- **No tint behind the heading.** `bg-muted` is the exact fill the active row
  uses, so a tinted header reads as a selected entry — and an alpha tint is
  worse: the contrast checker cannot blend layers, so `bg-muted/40` reported
  3.28:1 on text that is 5.9:1 on the card, and `check:ui` failed.

`meta` is optional and several entries now omit it — a label that is not a
count ("reference", "fallback") was noise dressed as information.

**The navigator's header shares its row with `Fold all`.** See below.

### Hover is a colour shift, everywhere

**There is no `hover:underline` left in the product.** All twenty-four of them
are gone, replaced by a shift in text colour. It started as one change to
Research's section headings and then went platform-wide, which is the right
end state: a hover convention that holds on one surface and not the next is
worse than either convention on its own.

The reason it was wrong even on the headings: an underline on a 26px heading is
a heavy mark, and a page carrying eight or nine of them read as a row of links.
**They are not links.** They fold in place. The same is true of gap rows,
question rows, claim rows, source rows and the Operations level chips — almost
everything that was underlining on hover in this product opens something in
place rather than going anywhere.

**Four directions, and which one applies is decided by what the text already
is**, not by what it does:

| Text at rest | On hover | Where |
|---|---|---|
| `--foreground` | `--muted-foreground` | row titles, section headings, Brief footer links, claim buttons |
| `--muted-foreground` | `--foreground` | already the pattern; only the underline came off |
| `--evidence` | `--foreground` | "Full breakdown", "Open in panel", evidence-chain sources |
| `--masthead-foreground` | `--masthead-accent` | the wordmark, the one hover on the band |

Ink going grey is the one that needs justifying, because dimming can read as
*disabled*. Three things stop it: the row usually takes `hover:bg-muted` at the
same moment, section chevrons rotate as they dim, and **nothing that is
disabling also moves.** `--muted-foreground` is also the only other ink token
in the theme, so on a section heading the label and its chevron become one
object on hover rather than a heading with a tick beside it.

Everything carries `transition-colors`. Colour transitions are not vestibular,
so there is no `motion-reduce` branch here.

**Two underlines survive and are not hover states.** `Gloss` keeps its dotted
underline, which marks a domain term permanently; and `:focus-visible` keeps
its outline ring, which is what `check:ui` checks and is unrelated.

**`check:ui` cannot see any of this** — it samples the default paint. So the
hovered state was measured by hand instead: drive each kind of hover, read the
computed colour against its composited background, and confirm the shift
actually fires. Across nine kinds of control in both themes the worst hovered
contrast is **5.24:1** — a row title on the muted hover ground in light mode —
against AA's 4.5. **Re-measure if a hover colour changes to anything that is
not already a checked pairing.** The trap is real: `--muted-foreground` on
`--card` is safe and checked everywhere, but `--muted-foreground` on
`--muted` only exists during a hover and nothing automated looks at it.

### Fold all

One button that collapses the whole dossier or opens it back up, in
`Frames.tsx`. Every section already folds on its own, which is the wrong
granularity for the two things actually done on a three-to-four-screen
document: collapse the lot to see its shape, or open the lot to read or search
it. Either was eight clicks.

**It sits in the sheet's top right, on the eyebrow's row.** `DocumentLead`
renders it, picking the section list up from `SectionsContext` — a context and
not a prop because the lead is inside `children`, so `FullFrame` cannot hand it
anything directly. Brief has no provider and therefore no button.

It was in the navigator's header for a revision, which is where it belongs
semantically: the navigator lists exactly the sections it folds. But
`SectionNav` is `hidden lg:block`, so that needed a second copy inside the
sheet below `lg` — on the width with the longest scroll. **One control at every
width beats two that are each correct somewhere.**

**It is a flex row, not an absolutely positioned corner**, and that was
measured rather than assumed. At 375 the sheet has 319px of content and every
one of these titles wraps in it; an absolute button would have landed on the
second line. In a row anything on the left wraps inside what is left, at every
width, with no breakpoint to get wrong. `items-start` so the button sits on the
first line.

**The title shares that row now, and the standfirst gained the space.** The row
was written for the eyebrow, and when the eyebrows went it held one button and
an empty `<span />` — so every Full sheet opened with about 28px of nothing
above its headline, and then ran the headline straight into the standfirst at
`mt-2`. Moving the title into the row spends that gap where it earns something:
the headline starts at the top of the sheet and the standfirst sits at `mt-3`,
which is what separates the thing being said from the sentence explaining it.
The eyebrow, if anything ever passes one again, stacks above the title inside
the row's left column.

**It is a drawn button, not bare words.** Border, ground and a shadow. On a
page where every section heading is also pressable, unbordered text in the
corner read as one more heading rather than as the one control that acts on all
of them. It does not take the accent colour: cyan on this page means somewhere
to go, and this goes nowhere.

**No lead carries an eyebrow any more.** All eight said `Suvarna Agro Foods ·
annual leakage` or similar — the company name a third time on one screen, after
the masthead's project switcher and above a direction you had just picked from
a switch two inches up. The `eyebrow` prop survives on `DocumentLead` for a
lead that needs to name *which* project or *when* it was researched, the same
reason `SurfaceHero` kept its own. Nothing passes it.

Two things it needs that are easy to miss:

- **`defaultCollapsed` lives on `SectionRef`, not on `<Section>`.** Two things
  need it and only one renders the section: the section itself, and the button,
  which has to tell "untouched and folded" — Benchmarks — from "open" or its
  label lies for one click. It was briefly a prop plus a module-level registry
  written during render; that is exactly what `react-hooks/immutability`
  catches, and `pnpm lint` failed on it. `Section` reads its own default out of
  the context by id.
- **`useAllCollapsed` returns a boolean**, so `useSyncExternalStore`'s identity
  check is a value comparison. A derived array or object would be a new
  reference every read and would loop.

**Open all is not the inverse of fold all**, on purpose: folding gives 0 open
and opening gives 9, one more than the 8 you started with, because Benchmarks
ships folded. "Open all" that left one section shut would be the wrong control.

State is per section id in one `localStorage` key, so folding Money's sections
leaves Call's alone.

### Verification harness

`scripts/verify.mjs` (`pnpm check:ui`) checks the constraints that are easy to claim
and easy to get wrong. Run the production server first (`pnpm build && pnpm start -p
4311`), and **kill the old server by port, not by name** — `pkill -f "next start"`
misses it, because the process renames itself to `next-server`. A stale server
holding 4311 serves a `.next` that has been replaced underneath it, every page
404s, and the harnesses report cheerfully green nonsense:

- Research Brief does not scroll, and nothing inside it is clipped, at 375×667 and 390×844
- Text contrast meets AA against its computed background, in light **and** dark, across all seventeen pages
- Every interactive element is reachable by Tab; the detail panel opens on Enter, closes on Escape, and returns focus to its trigger

**It now exits non-zero**, and its failures name the element and the overflow
in pixels — the first version printed `[object Object]`, which told you a Brief
clipped and nothing about where or by how much. For its whole life this script printed its findings and
exited 0 regardless, so a contrast regression scrolled past in the output and the
build stayed green — which is how the re-theme's first pass shipped a 2.03:1
control on `/` and was told everything passed. A check that cannot fail is
documentation, not a check. If you add a check here, add it to the verdict block
at the bottom too.

One known blind spot: the contrast check reads the nearest opaque ancestor background,
so it cannot see decorative overlays such as Operations' hatch fill. Those have to be
checked by eye — `pnpm shots` exists for that.

`scripts/check-data.ts` (`pnpm check:data`) does two jobs and needs no server.

**Reconciliation** — every gap price, money bucket, stakeholder subtotal and evidence
tier must sum to `company.grossLeakageCr` (₹9.68 Cr); no gap may be priced by two
claims; nothing may appear without a source.

**Arithmetic sanity** — added after the supply-chain audit (see `AUDIT.md`), because
the reconciliation checks passed for four commits while the top-ranked gap was priced
at five times the total cost of the function it automated. Everything summed correctly
to a number that could not be true. It now also fails the build when:

- a claim exceeds the base it is a percentage of, or falls outside its own range
- a one-off balance-sheet figure is used as an annual one
- an overlap group's cap is not below the sum of its members
- a gap's SCOR stage disagrees with its Operations node, or the node does not list it back
- an entity is filed under an area that does not exist, or under a different one
  from its own gaps. Entities are grouped by that field rather than drawn as a
  graph, so a misfiled one renders as a perfectly tidy list in the wrong place
- an unresearched Operations node wears a health colour, or an evidenced one refuses a reading
- a "this call" question targets someone the consultant has not met
- **a deal risk has no counter**, or one under eight words. See *The counter
  rule*. This is the one check in the file that guards a piece of writing
  rather than a number, and it is here because the failure it prevents is
  silent: a risk with an empty counter renders as a perfectly tidy row.
- a timing signal has no readings behind it, cites a source that does not
  exist, or says "2 signals" over three readings
- **a gap is not filed under exactly one system**, or is filed under two. The
  Tech direction's subtotals only add up if the filing is total and exclusive,
  and both failures are silent: a gap on two systems double-counts the money,
  and a gap on none quietly stops appearing on a screen that claims to show all
  of them. The system subtotals are reconciled against the same ₹9.68 Cr as
  every other direction.
- **a system that is worked around or missing does not say who absorbs it**,
  under eight words. Same shape as the counter rule and here for the same
  reason: a row that raises a problem and names nobody who has it is a perfectly
  tidy row. A `live` system claiming a workaround fails too — the work has not
  fallen anywhere.
- **a gap has no hypothesis, nothing still unknown, or no next step**, or any of
  those is too short to act on. Same shape as the counter rule and here for the
  same reason: the failure is silent. A gap with an empty `stillUnknown` renders
  as a perfectly tidy detail panel that happens to claim the finding is
  finished, and none of them are finished. §7.14 is written about totals; it
  applies to a finding too.

`scripts/audit-density.mjs` (`pnpm check:density`) counts the visible words,
focusable controls and screens of scroll on every page. Information density is the
whole problem in this product, so it is measured rather than argued about.

**The counter had a bug worth knowing about.** It tested `display` on each text
node's immediate parent, but `getComputedStyle` on a child of a `display:none`
element still reports `block` — so every folded section counted as visible. The
one tool that actually reduces on-screen density looked like it did nothing.
It now uses `checkVisibility()`, which walks the chain. **Numbers measured before
that fix are not comparable to numbers after it** — the historical 9,244 and
~5,200 are inflated by roughly a fifth.

On the honest counter: **4,604 before the supply-chain audit, 5,171 after** (+12%).
That increase buys the base and rate behind every price, the overlap
reconciliation, the coverage section, three more questions and the second
confidence axis. Every Brief is unchanged at one screen and under 165 words; the
growth sits on the Full pages, which are reference documents.

**Words are not the only axis, and the readability pass proves it.** Research
Full went from 5,171 words to 5,145 — nothing was cut, a few section chevrons
stopped being counted as glyphs — while scroll went from 2.9–3.9 screens to
3.4–4.6 (+18%). That is the trade the pass makes on purpose: same content,
more air. The counter measures reading *load*; it does not measure reading
*ease*, and a page can be too tight as easily as too full. Watch both columns.
Brief is the one place where the screens column is a pass/fail rather than a
judgement, and `pnpm check:ui` is what enforces it.

**And the counter will not thank you for deleting hidden text.** Removing
*About this view* from six surfaces took the total from 5,523 to 5,499 — the
three words on the closed trigger, six times over, plus a navigator entry. The
paragraphs behind it never counted, because `checkVisibility()` was already
excluding them. The controls column is where it shows: six fewer. **A page can
carry a lot of weight the words column cannot see, and a control the reader has
to decide about is weight.**

**The Research readability pass moved both columns the right way**, which is
rare enough to record: **5,499 → 5,449 words** and Full's scroll **3.6–4.9 →
3.3–4.5 screens**, about 8% shorter with nothing cut. Three changes compounded,
and the order matters if it is ever repeated:

1. **Full-width prose.** A paragraph released from 77 characters to ~120 wraps
   to fewer lines, and Full is mostly paragraphs and rows.
2. **The dashes coming out.** Splitting a dash clause into a sentence costs a
   word or two and saves a line more often than it adds one, because the clause
   was usually the part that wrapped.
3. **The rhythm.** 48px between sections became 40px, and the inner gaps came
   down with it. **What has to hold is the ratio, not the pixel** — the earlier
   attempt at 32px failed because only the outer gap moved, and the page read
   as one undifferentiated column.

Every Brief is still one screen, and `check:ui` clears all four viewports.

**The header redesign moved the words column and the screens column together,
and it did it by deleting furniture rather than copy.** The current reading:

```
17 pages, 6,761 words
/gaps        214 words   (was 252)      /operations   143
/questions   290                        /compare      281
/sources     280                        every Brief   106-200, one screen
Research Full  659-960 words, 2.5-4.6 screens
```

Three things account for it and none of them cut a sentence a consultant reads:

1. **The hero tiles.** Three per surface × eleven surfaces, each a value and a
   label, all of them restating a list directly underneath.
2. **The index page.** `/` was the design-review page — a review instruction, a
   hundred-word principle per direction, an *Optimises for* / *Deliberately
   sacrifices* pair each, and a six-point constraints list. About eleven hundred
   words on the first screen anybody sees, for an argument three people have
   already had. It is a way in now; the argument is in this file, which is where
   a decision record belongs.
3. **Five reference sections folded by default.** Money's *Company*, Certainty's
   *The money by how it was priced*, Timing's *Where these came from*, Risk's
   *Why every one has a counter* and Stakeholder's *If you don't know*. The rule
   is **reference folds, argument opens** — and the heading and its summary stay
   visible either way, so what you lose is the body and what you keep is knowing
   it is there. Risk's is the clearest case: a section explaining the method
   rather than reporting a finding is a screen explaining itself, which §7.2
   rules out.

**The controls column is where a header redesign shows up worst, and it did not
move.** Removing eleven tiles removed zero tab stops, because a tile was never
pressable. What went instead was height.

Two things the earlier density pass taught, worth reusing:

- **Truncated text is pure cost.** The claim ledger rendered a 25-word basis on
  every row clamped to one line. Nineteen rows of text in the page, two thirds of
  it behind an ellipsis nobody can read. Replaced with the source names, which fit;
  the reasoning moved to the panel, which is where a third read belongs.
- **A heading that names something should stop its rows repeating it.** `QuestionRow`
  takes `showTarget={false}` for exactly this.

`scripts/verify-stakeholder.mjs` repeats the fit check for every stakeholder
selection, because that direction's Brief changes height with the person chosen.
`scripts/shots.mjs` writes `screenshots/` for review.

Both harnesses emulate `prefers-reduced-motion: reduce`. Without it, reading a
computed colour immediately after a theme switch returns the mid-transition value
and every element carrying `transition-colors` reports a false contrast failure.
