---
name: keyboard-navigation
description: Keyboard interaction patterns, focus management, and shortcuts for Meridian. Use when building interactive components, panels, dialogs, the canvas, or anything with focus behaviour.
---

# Keyboard Navigation

Everything achievable with a mouse is achievable with a keyboard. No exceptions, and the
canvas is not exempt.

There is also a speed argument: a consultant preparing during a call is faster on the
keyboard than on a trackpad, and the fastest path to "what do I say" is the product's
whole value.

## Tab order

Follows visual order. Interactive elements only — no `tabIndex` above 0, ever.

Per screen, the order is: skip link → project header → tabs → main content → right panel.

Provide a skip link to main content. On Research Full, also provide a skip to the section
navigator, because tabbing through a long dossier to reach navigation is punishing.

## Standard keys

| Key | Behaviour |
|---|---|
| `Tab` / `Shift+Tab` | Move between controls |
| `Enter` / `Space` | Activate |
| `Escape` | Close panel, dialog, or popover; cancel in-progress input |
| `Arrow` | Move within a composite widget — tabs, lists, canvas, tables |
| `Home` / `End` | First / last item in a list or row |

Radix primitives under shadcn implement most of this. Do not reimplement it; do verify it
survives your composition.

## Tabs

Arrow keys move between the six tabs. Follow the automatic-activation pattern — focus
moves and the panel changes together, since panels are cheap to switch and the user's
intent is unambiguous.

## Right panel

Opening a node or gap detail moves focus into the panel, to its heading. `Escape` closes
it and returns focus to the element that opened it. Never drop focus to `<body>` — the
user loses their place in a forty-item list.

The panel is not a modal. Focus is not trapped. A user can tab out into the main content
while the panel stays open, because comparing panel content against the list behind it is
a real workflow.

Dialogs — correction prompt, delete confirmation — do trap focus, and restore it on close.

## Canvas

The hardest surface to get right and the most often skipped.

| Key | Behaviour |
|---|---|
| `Tab` | Move between nodes in reading order |
| `Arrow` | Move to a spatially adjacent node |
| `Enter` | Open node detail |
| `Enter` on a drillable node | Descend a level |
| `Backspace` / `Escape` | Ascend a level |
| `+` / `-` | Zoom |
| `0` | Fit to view |

Focused nodes scroll into view automatically. A focus ring on an off-screen node is a
failure, and it is the most common canvas accessibility bug.

Provide a linear alternative: a list view of the same nodes, with the same health,
completeness, and drill-down. Some users will never navigate a graph spatially, and the
list is also faster for everyone when searching for a known node.

## Gaps and Questions lists

Arrow keys move between cards. `Enter` expands "why we believe it" in place — focus stays
on the card, and the expanded content follows in tab order.

`Space` toggles selection for the plan. Selection state is announced.

## Search and command

`/` focuses the node or content search. `Cmd/Ctrl+K` opens a command palette if one
exists. Both are escapable without side effects.

## Shortcuts

Keep them few and unsurprising. Never single-letter shortcuts without a modifier outside
a focused widget — a user typing in the correction prompt must never trigger navigation.

Any shortcut that exists is discoverable: listed in a help panel and shown next to its
control where space allows.

## Focus after async work

Research completing, a correction applying, or a source finishing ingestion must not steal
focus. Announce via live region and leave focus where the user put it.

The one exception: if the user explicitly triggered an action whose result is a new panel,
move focus into that panel.
