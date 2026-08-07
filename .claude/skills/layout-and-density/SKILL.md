---
name: layout-and-density
description: Screen composition, information hierarchy, progressive disclosure, and spacing for Meridian. Use when laying out any screen, deciding what goes above the fold, structuring panels, or solving information overload.
---

# Layout and Density

The team's own words about the current product: *"there's a lot of information being
shown everywhere."* Information overload is Meridian's defining problem. Everything here
serves that.

## The three-read rule

Every screen has exactly three levels of reading:

| Read | Interaction | Content |
|---|---|---|
| **First** | Glance, no scroll | The one thing worth saying on the call |
| **Second** | Scroll | Supporting structure — the ranked list, the lanes |
| **Third** | Click | Evidence, rationale, method, full detail |

Never present all three at once. The Full dossier's problem is that it is entirely third-read
content presented as first-read content.

Test for any screen: *if Aryan reads only the top of this page thirty seconds before a
call, does he have something to say?* If not, the layout is wrong regardless of how good
the data is.

## Research — the highest-priority redesign

**Brief** is not a shorter Full. It is a different artefact with a different job: the
call-prep card.

Brief should carry, roughly in this order:
1. The thesis in one sentence
2. The leakage number with its confidence
3. Three things to raise on this call
4. Who to raise them with, if stakeholders are known

That is a single screen. No scrolling.

**Full** is a reference document read by scanning, not reading. It needs:
- A persistent section navigator, always visible, showing position
- Section-level collapse, with a remembered state
- A dense summary strip at the top of each section so a scanner gets the point without
  entering the section
- Anchor links, because a consultant sends a colleague a specific section

The current Full has all the right content in the wrong container. Do not delete content
to fix it — restructure access to it.

## Panel geometry

| Zone | Contains | Behaviour |
|---|---|---|
| Top bar | Project, tabs, global actions | Persistent, compact |
| Main | The current surface | Scrolls independently |
| Right panel | Node detail, gap detail, chat | Overlays on narrow screens, splits on wide |
| Bottom | Nothing persistent | The prototype's bottom bar is out |

The right panel is one slot. Node detail, gap detail, and chat share it — never two
panels at once. A consultant with three panels open has lost the thread.

## Chat placement

Wanted, placement unresolved. Constraints for whichever direction is chosen:

- Must show its scope — project, node, or gap — so the user knows what it can see
- Must be summonable from any element, not only from one fixed control
- Must not permanently consume horizontal space
- Must not be the persistent bottom bar from the prototype

Side panel, popover-from-element, and command-palette-style are all viable. Build two,
do not argue about them.

## Canvas layout

Level 0 is a legend, not a destination. It is universal across every company on earth, so
it carries no insight — give it less visual weight than the current prototype does.

Weight should increase with depth. Level 2 is where companies differ and where gaps live.
A user should feel they are arriving somewhere as they descend.

Always visible on Canvas:
- Current level and path (Level 0 → Sourcing → Invoice Processing)
- Which nodes can be drilled into, distinguished from which cannot
- The legend for both encoding axes

## Comparison layout

Lanes stack vertically, aligned on shared process stages. The delta between lanes is the
content — give the gap between them more visual emphasis than either lane's own values.

Selecting a company to compare adds a lane below; it never replaces the view. Support at
least three lanes and degrade gracefully beyond that.

## Spacing

Four spacing steps. Tight within a group, one clear step between groups, a rule or
background shift between sections. Consistency matters more than the exact values.

Line length caps at ~75 characters for prose. The dossier is genuinely read as text and
full-width paragraphs on a wide monitor are unreadable.

## Responsive

Desktop-first — this is a work tool. But a consultant checks Brief on a phone in a taxi.
Brief must work at 375px. Full, Canvas, and Compare may reasonably degrade to a "open on
desktop" state, provided Brief is complete on mobile.

## The removal test

Before finishing a screen, remove the least important element. If nothing is lost, leave
it out. Meridian's failure mode is addition — every new insight wants a slot on the same
screen. Someone has to say no.
