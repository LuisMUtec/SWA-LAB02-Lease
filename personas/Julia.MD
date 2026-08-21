---
persona: Julia
role: manager of the leased machinery fleet in the field
status: proto
---

# Julia — manager of the leased machinery fleet in the field

<!--
  Who this person is and what they need. Never what the system does.
  Read by their evaluation agent (../evals/README.md) and linked from the spec.
  status: proto = we invented them. Mark every invented fact with [ASSUMPTION: ...].

  [ASSUMPTION: the brief names Pedro, Carlos and Julia but does not describe them. The role above
  is a working hypothesis covering one side of the transaction; confirm it while writing the spec.]
-->

## Context

<!-- Where they work and what they are accountable for. Behaviour, not demographics. -->

Julia answers for machines that belong to Lea$e (BR-01) and are standing on ground she does not
control, run by operators who do not work for her, on projects whose deadlines are not hers.
`[ASSUMPTION: Julia works for Lea$e, not for the client. Her accountability is the fleet's value
over time, which is why custody sitting with the client (BR-05) is her central problem rather than
a detail.]`

What she is measured on is what comes back: a machine returned in the condition it left, with its
use accounted for, still worth what the next contract needs it to be worth. Not everything comes
back — a client who pays every instalment may acquire the machine instead (BR-07), and that one
leaves her fleet for good, on a date the client's last payment decides and she does not. Her
difficulty is that
between handover and return she has almost no claim on the machine. It wears by hours run, not by
days elapsed (BR-06), so its maintenance clock advances at a speed only the site knows — and the
site's schedule beats a service window every time, because the site is not paying for the engine.

She also carries the end of the story nobody plans for: when a contract stops, the machine is still
900 km away in the middle of an excavation, and getting it back is a lowboy, a permit and a week —
not a letter.

## Main flow

<!-- Scored by D1: the agent asks whether this runs end to end in the spec. -->

**When** a machine goes out to a client's project, **I want to** know where it is, how many hours it
has run and when it is next due for service, **so I can** keep it working through the contract and
know, at its end, whether it comes back to me or leaves the fleet.

1. Hand the machine over with its condition and its hours agreed by both sides at that moment, and
   with a named person on the client side who is holding it (BR-05).
2. Follow the hours it accumulates, because that is the only clock that says when it is due
   (BR-06), and it advances whether or not anyone tells me.
3. Agree the service window with a site that never wants to stop, and get the service done inside
   it.
4. Know when the machine leaves the site it was contracted to, so the machine I am responsible for
   is where I believe it is.
5. Know, before the term ends, which of the two ends it is heading for — back to my fleet, or
   acquired by the client who has paid every instalment (BR-07) — because one returns me an asset
   and the other removes it.
6. Close it against the same record we agreed at handover: settle what changed if it comes back, or
   hand the condition and hours record over for good if the client acquires it.

**When it goes wrong:** the machine comes back four hundred hours past a service it never had, from
a second site nobody told me about, with damage the client says was already there. Nothing was
recorded at handover, so it is my word against theirs and Lea$e absorbs it. The other version is
worse: Carlos declares a contract in default and I have to recover a machine that is holding up
somebody's work, from people who have every reason not to help me find it.

## What gets in the way

<!-- Limits and frustrations today: time, information, authority, money. Feeds D2. -->

- The machine's use is invisible to me between visits. I learn the hours when someone chooses to
  tell me, which is usually when something has already broken.
- A service window costs the client a day of production and costs him nothing to postpone. He is
  optimising his project; I am optimising an asset he gives back.
- The operator is not mine. I cannot check who is at the controls, and the insurance the client
  carries (BR-05) stops covering exactly when it matters — negligence, an unqualified operator.
- Damage is discovered at return, which is the worst possible moment to establish when it happened.
  Without a condition both parties accepted at handover, every claim becomes a negotiation.
- Recovery is logistics, not law. By the time someone decides a machine must come back, I still
  need transport, access and a route, and I am starting from zero.
- Machines that are idle on one site while another contract waits are invisible to me as idle. I
  only find out when the client mentions it.
- Whether a machine returns at all is decided by the client's last instalment (BR-07), not by me
  and not by the calendar. I plan the next contract around a machine that may never come back, and
  nothing tells me which ones those are until it is done.

## Permissions

<!-- What they may do and must never do. Feeds D4 when two personas collide. -->

- **May:** record the condition and hours of a machine at handover and at return; inspect a machine
  on site with notice to the client; set when a machine is due for service and require a window for
  it; stop a machine from working on a safety cause; recover a machine once a contract has been
  declared in default; settle the condition and hours record when a machine is acquired instead of
  returned, and retire it from the fleet.
- **Must not:** decide that a contract is in default, or that a client has stopped paying — that is
  Carlos's call and she acts on it, never ahead of it; stop a machine from working for any reason
  other than safety unless a default has been declared; change what a client owes or when, to
  compensate for a service stop or a breakdown; hold a machine, or refuse its release, once the
  client has met the contract; refuse or delay an acquisition the client has earned under BR-07, or
  make it conditional on a damage or missed-service claim — a machine the client is acquiring is one
  she no longer has a return condition to protect.

## Success signal

<!-- Observable sign that the system works for them. Becomes acceptance criteria. -->

- The accumulated hours of every deployed machine are known to Julia without her having to ask the
  site for them.
- A service falls due while there is still time to schedule it, not after it has been missed.
- Return condition is settled against a handover record both parties accepted, so damage is
  assessed rather than argued.
- A machine that has left its contracted site is known to be somewhere else, at the time it
  happens.
- When a default is declared, Julia already knows where the machine is and what it takes to get it
  back, instead of starting to find out.
- A machine on track to leave the fleet by acquisition (BR-07) is known to Julia as such before its
  term ends, so no next contract is planned around a machine that will never come back.
