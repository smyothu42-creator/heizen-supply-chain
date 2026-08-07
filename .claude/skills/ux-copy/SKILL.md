---
name: ux-copy
description: Interface writing, labels, empty states, errors, and domain-term glossing for Meridian. Use when writing any user-facing text — buttons, headings, messages, tooltips, or explanatory copy.
---

# UX Copy

Two people read this interface: a consultant who is not a supply-chain expert, and an
investor with no domain knowledge at all. Write for both.

## Plain language wins

Domain terms are unavoidable but never unexplained. First appearance on a screen gets an
inline gloss — not a tooltip, which nobody hovers under time pressure.

```
✗  First-time match rate: 58%
✓  First-time match rate  58%
   Invoices that match automatically on the first try. Best in class: 90%+
```

The gloss earns its space because it converts a number a consultant cannot use into a
sentence they can say out loud.

Terms needing a gloss on first use: 3-way match, exception, first-time match rate,
touchless, maverick buying, early-payment discount, P2P, cycle time, leakage.

## Say what happens, not what the system does

```
✗  Submit       →  ✓  Create project
✗  Execute      →  ✓  Run research
✗  Process      →  ✓  Ingest sources
✗  Configure    →  ✓  Connect your ERP
```

An action keeps its name through the whole flow. "Run research" produces "Researching…"
then "Research complete". Never three different words for one thing.

## Labels

| Instead of | Write |
|---|---|
| Research prompt | What should we focus on? *(e.g. Vedanta Goa copper)* |
| Stakeholders | Who are you meeting? |
| Data completeness | Evidence we have |
| Process health | How this is running |
| Ingest | Add sources |
| Needs correction | This isn't right |

The field labelled "What should we focus on?" is doing real work — it narrows research
from a whole conglomerate to one site. A user who reads "Research prompt" will leave it
blank; a user who reads the question will answer it.

## Empty states are instructions

Each of the three empty states says something different and offers the right next step.

```
Not researched      "Not yet researched"
                    → Run research on this section

No sources          "Add a transcript or filing and we'll research this"
                    → Add sources

Confirmed none      "No issues found here"
                    (no action — this is a good outcome)
```

Never `N/A`, never `No data`, never a blank cell. Each of those makes three different
situations look identical.

## Errors

Say what happened and what to do. No apology, no blame, no jargon.

```
✗  Error: RESEARCH_MALFORMED
✓  Research came back incomplete. The sources are saved — try running it again.

✗  Failed to process file
✓  We couldn't read invoice-log.pdf. It may be a scan. Try a text PDF, or add the
   key figures as a note.
```

A partial failure states what survived. A consultant needs to know whether they still
have something to work with before a call.

## Loading

Name the work, not a percentage.

```
✗  47%
✓  Researching procurement operations…
✓  Reading Discovery call 2…
```

Research takes minutes. A named step tells the user the system is working on something
real and lets them judge whether to wait.

## Confidence

State it plainly, with the reason attached.

```
Medium-high
Based on FY25 annual report, 2 discovery calls, and public hiring signals
```

Never soften a low confidence into vague language. "Low — based on one public webpage" is
useful. "We think" is not.

## The correction prompt

```
Heading    What's wrong here?
Help       Describe the correction in your own words. We'll update it and keep a record
           of the change.
Example    "Approvals moved to Coupa in March, not email."
Button     Apply correction
```

Do not call it "feedback". Feedback goes into a void; a correction changes the screen.

## Voice

Direct, plain, sentence case. No exclamation marks. No "Oops". No personality in error
states. This tool sits open next to a client conversation about millions of rupees — it
should read like a competent colleague, not a consumer app.

Numbers and units are written the way the audience says them: `₹14.7 Cr`, `9.5 days`,
`42% exceptions`.
