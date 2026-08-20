# EVAL — Lea$e specification

Evaluation apparatus for the specification. Run by hand, outside the Spec Kit flow.

## Inputs

| Input | Role |
|---|---|
| `specs/<n>-<feature>/spec.md` | **Scored.** The only document with authority over what the system does |
| [`../personas/*.MD`](../personas/) | Read by each persona agent — its own file only |

Everything downstream of the spec (plan, tasks, code) derives from it and is not scored here.

**The POC is not part of the score.** They are two separate deliverables: the spec is scored, the
POC either runs or it does not. What this rubric does enforce is that they cannot drift apart — see
D4.

## Rubric — 10 points

| Dim | Pts | What it measures | Judged by |
|---|---|---|---|
| **D1** Persona satisfaction | 3 | The spec resolves the working day of [Pedro](../personas/Pedro.MD), [Carlos](../personas/Carlos.MD) and [Julia](../personas/Julia.MD): each main flow runs end to end. 1 pt per persona, **deductions only** | The 3 agents |
| **D2** Fit to the problem | 3 | It attacks the brief's actual gap — machinery needed now, payment only at project end — not generic leasing | Aggregator |
| **D3** Demonstrable acceptance criteria | 2 | Every main flow carries criteria someone can declare met or unmet | Aggregator |
| **D4** Coherence and staged scope | 2 | No contradictions or covert duplicates; the staged scope is real **and its first stage is exactly the POC happy path** | Aggregator |

**Gate: ≥ 8/10.** Two points may be lost, no more.

A score below the gate does not lower the bar: the spec is corrected and the evaluation is run again.

## The asymmetry rule

**A persona agent may only deduct from D1. Never add.** Its job is to detect the failure, not to
certify the success. If no agent objects, D1 is worth 3. A high score must cost something.

## Who judges what

| Question | Who answers | Why |
|---|---|---|
| Does this spec serve this person? | Their agent | Only someone working from that position recognises whether it resolves their day |
| Does it close the brief's financing gap? | Aggregator | Each persona sees one angle; none sees the whole problem |
| Are the acceptance criteria demonstrable? | Aggregator | Form is outside any single persona's perspective |
| Are there contradictions or duplicates? | Aggregator | Requires the whole document in view |
| Is the first stage buildable as the POC? | Aggregator | A comparison between stages, not within one |

## Persona-agent protocol

Run **once per persona, separately**. Each agent reads exactly two things and nothing else: its own
file in `personas/` and `spec.md`. It does not read the other verdicts or the history.

Each agent answers, in this order:

1. **Does my main flow run end to end in the spec?** Cite the sections that cover it. If it breaks
   off, say where.
2. **What frustrates me about this spec?** What the spec decides against me, or leaves undecided so
   that I am the one who absorbs it.
3. **Verdict:** `Works` (deduct 0) · `Works with reservations` (deduct 0.5) · `Does not work`
   (deduct 1).

A verdict with no citation to the spec is inadmissible and counts as `Does not work`.

## Running one iteration

1. Run the 3 persona agents separately against the current `spec.md`.
2. Run the aggregator: D2, D3 and D4 over the same document.
3. Compute `D1 = 3 − Σ(deductions)` and the total out of 10.
4. Write `evals/iteraciones/YYYY-MM-DD-NN.md` following [the template](iteraciones/_PLANTILLA.md).
5. Append a row to [`HISTORY.md`](HISTORY.md).
6. If the total is below 8: correct `spec.md` and return to step 1. The spec changes; the rubric
   does not.

## Writing rules the aggregator enforces on the spec

These are what D3 and D4 check. Deliberately few.

- **Verifiable.** "Fast", "intuitive" and "reliable" are replaced by their measure. A statement
  nobody can declare met or unmet is not an acceptance criterion.
- **Atomic.** One thing that is true or false, changeable on its own.
- **No mechanism.** The spec states the guarantee, not the technology. A queue, a cloud product or
  a topology inside a criterion is an architecture decision in disguise.
- **Ambiguity is marked, never filled in.** The brief leaves much of the domain open. What is
  undefined carries one of two markers and is never resolved silently:
  - `[CLARIFY: specific question]` when the answer determines the content.
  - `[ASSUMPTION: statement]` when work continues under a declared hypothesis.
- **No load-bearing references.** A trailing pointer — `(RN-03)` — is fine. A sentence that cannot
  be understood without following it is not.
- **Nothing is named by its visible text.** A button's label changes without the spec changing.
