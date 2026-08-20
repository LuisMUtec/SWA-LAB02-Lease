---
persona: Julia
role: manager of the leased machinery fleet in the field
status: proto
---

# Julia — manager of the leased machinery fleet in the field

<!--
  Read by the persona agent that judges the spec on this person's behalf, and linked from
  specs/<n>/spec.md § Users and their needs. See evals/README.md.

  This file states WHO THIS PERSON IS AND WHAT THEY NEED.
  It never states what the system does — that is the spec.

  Traceability runs one way: the spec names its personas, this file never lists user stories.
  Coverage is computed by the evaluation, not maintained by hand here.

  status: proto = assumption-based, not validated against a real person. Every invented fact
  carries [ASSUMPTION: what we suppose and why]. An unmarked invention is a defect.

  [ASSUMPTION: the brief names Pedro, Carlos and Julia but does not describe them. The role above
  is a working hypothesis covering one side of the leasing transaction; confirm or replace it
  while writing the spec.]

  Every field below is read by some dimension of the evaluation. Do not add fields, do not
  leave one empty.
-->

## Context

<!-- Where they work, what they are accountable for, what they are measured on.
     Behaviour and accountability, never demographics: age and photo change no requirement. -->

[CONTEXT]

## Goal

<!-- The one thing this person is trying to achieve. Singular. Read by D1. -->

[GOAL]

## Constraints

<!-- What limits them: time, information, authority, money, tools. Most frustration starts here. -->

- [CONSTRAINT]

## Permissions

<!-- What they may see, do and approve, and what they must never. Read by D4: when two personas'
     permissions collide, the spec must decide the tension rather than leave it open. -->

- **May:** [WHAT THEY ARE ALLOWED TO DO]
- **Must not:** [WHAT THEY MUST NEVER BE ABLE TO DO]

## Main flow

<!-- Scored by D1, one point per persona. The agent asks: does this run end to end in the spec?
     Stated as a job story so the situation is explicit, then the steps. -->

**When** [SITUATION], **I want to** [MOTIVATION], **so I can** [OUTCOME].

1. [STEP]

## The exception that must not break them

<!-- The failure case this person lives with. Without it the spec covers only the happy path,
     and #684's rule is one normal scenario plus one exception per persona. -->

[EXCEPTION]

## Pains today

<!-- What is broken before Lea$e exists. Read by D2: the spec must narrow these, not restate them. -->

- [PAIN]

## Success signal

<!-- How this person declares the system works. Must be observable: it becomes acceptance
     criteria in the spec, and D3 scores whether those criteria are demonstrable. -->

- [SIGNAL]
