---
persona: Pedro
role: owner of an SME that needs machinery it cannot yet pay for
status: proto
---

# Pedro — owner of an SME that needs machinery it cannot yet pay for

<!--
  Who this person is and what they need. Never what the system does.
  Read by their evaluation agent (../evals/README.md) and linked from the spec.
  status: proto = we invented them. Mark every invented fact with [ASSUMPTION: ...].

  [ASSUMPTION: the brief names Pedro, Carlos and Julia but does not describe them. The role above
  is a working hypothesis covering one side of the transaction; confirm it while writing the spec.]
-->

## Context

<!-- Where they work and what they are accountable for. Behaviour, not demographics. -->

Pedro runs a Peruvian SME that takes on client projects — the kind of corporate/SME work BR-02
describes. `[ASSUMPTION: Pedro is the owner or the manager directly responsible for a project,
not a specialised procurement or finance role — the brief gives him no title, so this is the
simplest hypothesis that still accounts for him needing to both request financing and answer for
its repayment.]` He is accountable to his own client for delivering the project, and to Lea$e for
the Lease he takes on to be able to deliver it. He is not a machinery or leasing specialist; the
leasing request is a means to an end, not his main job.

## Main flow

<!-- Scored by D1: the agent asks whether this runs end to end in the spec. -->

**When** his company wins or is running a project that needs machinery he cannot pay for
outright, **I want to** get that machinery financed and delivered without stalling the project,
**so I can** execute the project and repay the financing out of what the project itself earns.

1. Pedro identifies the machinery his project needs.
2. He submits a leasing request for it, tied to that project.
3. He checks the request's status until it is decided.
4. Once approved, he waits for the machinery to arrive and confirms he received it.
5. He reviews the installments the resulting lease carries — how many, and what each one costs him.
6. He pays installments as they come due, and at any point can tell which are already paid and
   which remain.
7. Once every installment is paid, he checks whether the acquisition option is available.
8. He exercises it, and confirms the leasing operation is closed and the machinery is his.

**When it goes wrong:** his request is rejected, or stays pending long enough to threaten the
project's timeline, or the machinery that arrives does not match what the operation was approved
for. He needs to know which of these happened — not be left guessing whether the silence means
"still deciding" or "something failed."

## What gets in the way

<!-- Limits and frustrations today: time, information, authority, money. Feeds D2. -->

- His project's own payment lands only at the end, so he cannot front the full cost of the
  machinery himself — that is the entire reason he needs Lea$e instead of buying outright.
- He cannot tell, without asking someone, whether his request is still pending, was approved, or
  was rejected.
- Once approved, he has no way to confirm that the machinery that shows up is the machinery his
  operation actually covers.
- He loses track of which installments he has already paid versus what is still outstanding,
  especially once several are involved.
- He cannot tell in advance when he has paid enough to be allowed to acquire the machinery — he
  finds out only by asking.

## Permissions

<!-- What they may do and must never do. Feeds D4 when two personas collide. -->

- **May:** record a machinery need for his project; submit a leasing request for it; check the
  status of his own leasing requests; confirm receipt of machinery for his own approved requests;
  pay a pending installment on his own lease; view the paid/pending status of his own
  installments; exercise the acquisition option once it is available for his own lease.
- **Must not:** see or act on another company's leasing requests, leases, or installments; pay an
  installment that is already paid; exercise the acquisition option while any installment on his
  lease is still pending; confirm receipt of machinery for a request that has not been approved.

## Success signal

<!-- Observable sign that the system works for them. Becomes acceptance criteria. -->

- At every point from request to acquisition, Pedro can state exactly where his leasing operation
  stands — request status, machinery receipt, installments paid versus pending, and acquisition
  availability — without asking anyone, and the operation ends in a state that leaves no doubt
  that the machinery is his and the lease is closed.
