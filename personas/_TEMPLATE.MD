---
persona: [NAME]
role: [ONE LINE — who they are in the leasing transaction]
status: proto
---

# [NAME] — [ROLE]

<!--
  Who this person is and what they need. Never what the system does.
  Read by their evaluation agent (../evals/README.md) and linked from the spec.
  status: proto = we invented them. Mark every invented fact with [ASSUMPTION: ...].
-->

## Context

<!-- Where they work and what they are accountable for. Behaviour, not demographics. -->

[CONTEXT]

## Main flow

<!-- Scored by D1: the agent asks whether this runs end to end in the spec. -->

**When** [SITUATION], **I want to** [MOTIVATION], **so I can** [OUTCOME].

1. [STEP]

**When it goes wrong:** [THE FAILURE THEY LIVE WITH, WHICH THE SPEC MUST HANDLE]

## What gets in the way

<!-- Limits and frustrations today: time, information, authority, money. Feeds D2. -->

- [OBSTACLE]

## Permissions

<!-- What they may do and must never do. Feeds D4 when two personas collide. -->

- **May:** [WHAT THEY ARE ALLOWED TO DO]
- **Must not:** [WHAT THEY MUST NEVER BE ABLE TO DO]

## Success signal

<!-- Observable sign that the system works for them. Becomes acceptance criteria. -->

- [SIGNAL]
