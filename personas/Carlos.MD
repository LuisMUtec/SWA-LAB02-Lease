---
persona: Carlos
role: credit and risk analyst at the leasing company
status: proto
---

# Carlos — credit and risk analyst at the leasing company

<!--
  Who this person is and what they need. Never what the system does.
  Read by their evaluation agent (../evals/README.md) and linked from the spec.
  status: proto = we invented them. Mark every invented fact with [ASSUMPTION: ...].

  [ASSUMPTION: the brief names Pedro, Carlos and Julia but does not describe them. The role above
  is a working hypothesis covering one side of the transaction; confirm it while writing the spec.]
-->

## Context

<!-- Where they work and what they are accountable for. Behaviour, not demographics. -->

Carlos decides which companies get a machine. He works inside Lea$e, and because Lea$e owns what it
lends (BR-01), a bad decision does not lose money on paper — it puts a machine Lea$e paid for onto a
jobsite that stops paying for it.

His training is in company credit: statements, credit-bureau history, the SBS debtor grades from
Normal through Loss. All of it measures what a company did before. What he is actually being asked
to judge is different, and he knows it: instalments fall due against the progress of one specific
project (BR-04), so repayment depends on whether *that* project gets certified and paid on time —
which depends less on his applicant than on whoever is paying his applicant. He is underwriting two
companies and only has a file on one.

`[ASSUMPTION: Carlos holds delegated authority to decide operations up to USD 150,000 of machine
value. Above that a credit committee decides and he prepares the case.]`

## Main flow

<!-- Scored by D1: the agent asks whether this runs end to end in the spec. -->

**When** a company applies for a machine it needs for a named project, **I want to** judge whether
that project's payments will cover the instalments, **so I can** decide inside my authority without
betting a machine on a company that will be paid late.

1. Establish who is applying and whether they are a real, current, project-based company (BR-02).
2. Read their credit conduct and current grade, aware that one bad line drags the whole grade down
   and that the grade tells me about the past, not about this project.
3. Read the project itself: what was awarded, by whom, for how much, and on what certification
   schedule the client will be paid.
4. Judge the payer behind my applicant — a strong applicant paid by a weak or slow payer is the
   case I am here to catch.
5. Decide: approve within my limit under stated conditions, refuse with a reason, or escalate above
   my limit. Conditions are mine to set — down payment, term, guarantees, which machine.

**When it goes wrong:** I approve, and eight months in the client's own client lets three
certifications go by unpaid. My client is not a fraud and is not insolvent — he is simply not
holding money that has not arrived. The instalment goes unpaid, and by the time that reaches me it
is already an overdue account being handled as if he had chosen not to pay. I need to see the
project's payments slipping while it is still a warning, and I need it settled in advance what
happens then — whether the schedule bends, and how far, before anyone calls it a default.

## What gets in the way

<!-- Limits and frustrations today: time, information, authority, money. Feeds D2. -->

- Financial statements are annual and arrive late. They describe a company that no longer exists by
  the time I read them, and never describe the project I am being asked to finance.
- Credit bureaus report my applicant and never his payer. The risk I care most about is the one
  nobody sells me a report on.
- A clean record proves the company paid its past obligations out of past projects. It does not
  prove this project generates enough, on time, to pay this machine.
- I learn about non-payment when a grade moves, which is at least nine days late and usually a
  month. The interesting moment happened before that.
- Speed is a decision too. If I take three weeks the client loses the job and I have protected
  nothing. My only fast answer today is "no", and I am scored on the ones I approved.
- Applicants tell me about the project in whatever form they have it. I cannot compare two cases
  when each arrives shaped differently.

## Permissions

<!-- What they may do and must never do. Feeds D4 when two personas collide. -->

- **May:** approve or refuse operations within his delegated limit; set the conditions of an
  approval (down payment, term, guarantees, which machine); demand further evidence before
  deciding; escalate above his limit; declare a contract in default.
- **Must not:** approve above his limit; release a machine himself, or take any part in handing it
  over, since the decision to lend and the act of lending must not sit with the same person;
  approve without evidence he can point to; alter the agreed schedule of a signed contract on his
  own; recover a machine — deciding that a contract has defaulted and going to get the machine are
  two different people's jobs.

## Success signal

<!-- Observable sign that the system works for them. Becomes acceptance criteria. -->

- Every approval leaves behind the evidence it rested on and the conditions it carried, so a
  decision can be reviewed months later by someone who was not in the room.
- A repayment schedule is set against the project's certification dates (BR-04), not against a
  calendar Carlos chose.
- A project falling behind is visible to Carlos as a warning while the contract is still current —
  before the account is overdue, not after.
- Two applications of the same size arrive comparable, so the reason one was approved and the other
  refused is the case and not the format.
