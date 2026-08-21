# Business Rules — Lea$e

The cohesive body of rules the Lea$e business obeys. Rules are not process and not requirements:
they apply across every flow, and they outlive any single spec. When the POC is finished its
requirements are satisfied and gone; these rules are only starting their life.

**This document states** what the business permits, forbids and requires.
**It does not state** what the system does — that is `specs/<n>/spec.md` — nor who the
users are — that is [`personas/`](personas/).

## Conventions

- **One rule per entry.** One thing that is true or false, changeable on its own.
- **Identifiers are stable.** `BR-nn` is assigned once and never renumbered, never reused, even
  when the rule's wording is rewritten. Gaps in the numbering are normal and are left alone.
- **Business language, no mechanism.** A rule says what the business does, never how a system
  implements it.
- **Every rule declares its source.** Either it comes from the brief, or it is ours — and if it is
  ours it carries `[ASSUMPTION: …]`. The brief fixes no leasing mechanics, so most rules here will
  be ours. An invented rule that is not marked is a defect.
- **Cited, not quoted.** Acceptance criteria in the spec state the rule's effect and cite the
  identifier — *"The system rejects an instalment payment before receipt is confirmed (BR-08)"* —
  so that no reference is load-bearing.

Entries are ordered by identifier.

## Catalog

### BR-01 — Lea$e retains ownership

Ownership of the machine remains with Lea$e for the whole term of the contract. The client holds
the right to use it, not title to it.

- **Why:** it is what separates leasing from a financed sale, and it is what makes the machine
  itself the collateral.
- **Source:** brief — the company is a machinery leasing business.
- **Affects:** contracting, custody, default handling, end of term.

### BR-02 — Clients are companies that work by project

Lea$e serves corporates and SMEs whose work is organised as projects. It does not serve individual
consumers.

- **Why:** the gap Lea$e exists to close — equipment needed at the start, payment received at the
  end — is a property of project-based work. Outside it, the product has no reason to exist.
- **Source:** brief — corporate and SME credit growth; companies generally work by project.
- **Affects:** eligibility, underwriting, instalment scheduling.

### BR-03 — Lea$e contracts outside the financial-lease regime

Lea$e contracts the use of a machine for a term without contracting under the Peruvian
financial-lease regime, and neither party obtains that regime's tax treatment.

- **Why:** under D.L. 299 a domiciled lessor in a financial lease must be a bank, a financial
  company, a registered cooperative, or a company entered in the SBS register of leasing companies.
  Lea$e is none of these, so that regime — and the accelerated depreciation and IGV treatment that
  come with it — is closed to it. What the regime restricts is *who may be a financial lessor*, not
  whether a lease may end in the client acquiring the machine: an acquisition option agreed in an
  ordinary commercial lease is a civil-law stipulation and needs no licence. Whether the client can
  acquire is settled by BR-07, not here.
- **Source:** brief is silent on the regime · D.L. 299 fixes the restriction ·
  `[ASSUMPTION: Lea$e is a new company without an SBS licence and does not intend to obtain one.
  If Lea$e were instead to originate for a licensed bank, BR-01 would be false and the payment
  schedule of BR-04 would not be Lea$e's to set.]`
- **Affects:** contracting, pricing, tax treatment.

### BR-04 — Instalments are due against project progress, not the calendar

The payment schedule of a contract is anchored to the milestones at which the client's project is
certified and paid, not to fixed calendar dates.

- **Why:** this is the gap Lea$e exists to close. A client working by project is paid on approved
  progress — in Peruvian construction, the *valorización* — and a calendar instalment falling due
  before that certification recreates exactly the shortfall that stopped the client from buying the
  machine outright.
- **Source:** brief — payment for the project arrives at the end ·
  `[ASSUMPTION: the client's project has a certification schedule Lea$e can anchor to and the
  client discloses it at application. Public-works valorizaciones are paid within six working days
  of presentation, which sets the shortest anchor Lea$e can rely on.]`
- **Affects:** underwriting, pricing, contracting, collections, default handling.

### BR-05 — The client holds custody and answers for damage

While the machine is on the client's site, the client is responsible for its custody and for
damage caused by or with it, and bears the cost of insuring it.

- **Why:** Lea$e owns the machine (BR-01) but does not possess it and cannot supervise its use.
  Ownership without custody is only bearable if the party in possession answers for it.
- **Source:** `[ASSUMPTION: standard practice in the Peruvian machinery rental market, where the
  lessee assumes liability for damage and pays for cover, and policies exclude negligence and
  unqualified operators.]`
- **Affects:** handover, custody, incident handling, end of term.

### BR-06 — Machines are serviced by hours run, not by elapsed time

A machine's maintenance falls due at intervals of accumulated operating hours. A machine that has
reached its interval is due for service regardless of how long it has held the contract.

- **Why:** wear on machinery tracks use, not time. A machine idle for a month has aged less than
  one that ran two shifts a day for a week, and servicing on the calendar either wastes service or
  arrives late.
- **Source:** `[ASSUMPTION: standard practice in the machinery rental market; the operating-hours
  reading is the accepted measure of use.]`
- **Affects:** handover, maintenance scheduling, pricing, end of term.

### BR-07 — Paying every instalment opens the option to acquire the machine, at no further cost

Once every instalment of a contract is paid, the client gains the option to acquire the machine it
has been using, and exercising it requires no payment beyond the instalments already paid.

- **Why:** it is what Lea$e promises the client at the outset, and it is what makes a contract with
  Lea$e worth more to a client than renting the same machine. It is also the only way the ownership
  BR-01 retains ever ends. A residual payment would recreate, at the finish line, the exact
  liquidity gap the instalments already exist to avoid — the client would again need cash on hand
  it does not have.
- **Source:** brief — second diagram, *"Pago TODAS las cuotas → opciones de adquisición"*,
  the only element highlighted in the original
  ([`docs/lab-02-diagram-2-delivery-payment-acquisition.png`](docs/lab-02-diagram-2-delivery-payment-acquisition.png)) ·
  `[ASSUMPTION: the brief names the options in the plural and prices none of them. "Opciones" is
  read here as the plural of choice — acquire, or do not — not as more than one distinct financial
  instrument; and "no further cost" is our resolution of what was previously open, chosen because
  the brief prices nothing and a silent residual charge would contradict Principle III.]`
- **Affects:** contracting, collections, end of term, fleet planning.

### BR-08 — Instalments fall due only after the client confirms receipt

No instalment of a contract is payable before the client has confirmed it received the machine.

- **Why:** the client pays for use, and there is no use before delivery. Lea$e's position also
  rests on a machine that has actually reached the site (BR-01) — charging before that is
  collecting against nothing.
- **Source:** brief — the second diagram puts delivery ahead of the instalment flow ·
  `[ASSUMPTION: receipt is an explicit act of the client rather than something inferred from the
  supplier, so that the moment instalments become payable is one both parties agreed on.]`
- **Affects:** contracting, instalment scheduling, collections.

### BR-09 — A slipping project becomes default-eligible past a fixed tolerance

A live operation becomes eligible for a Default Declaration once a single Certification Milestone
of its Project remains uncertified more than 30 calendar days past its expected date, or once two
Certification Milestones of the same Project are simultaneously past their expected dates
uncertified — whichever occurs first. Reaching eligibility authorises Underwriter to consider a
Default Declaration; it does not create one by itself.

- **Why:** `personas/Carlos.MD` and the Slippage Warning (spec `002`) both need a settled line
  between "a project is running late" and "this operation has defaulted" — settled in advance, the
  same for every operation, not decided case by case once a client is already in difficulty.
- **Source:** `[ASSUMPTION: the brief fixes no tolerance. Thirty calendar days is chosen because it
  is roughly five times the six-working-day window BR-04 already treats as the shortest realistic
  certification turnaround, giving a project one full missed cycle of slack before it counts; "two
  milestones at once" catches a project whose slips are shorter but compounding. Both figures are
  ours and may be revised without changing what the rule protects.]`
- **Affects:** default handling, collections, the Slippage Warning of `002-leasing-request-underwriting`.

### BR-10 — A machine significantly overdue for service is a safety cause

A machine whose accumulated hours exceed its Service Interval by more than 20% of that interval,
with no completed service in between, gives Fleet Manager safety grounds to stop it — the same
grounds BR-06's Service Due state alone does not.

- **Why:** `personas/Julia.MD` is explicit that postponing a service window costs the client
  nothing, so nothing today stops a due service from sliding indefinitely. A machine run well past
  its service interval is a mechanical safety risk, which is the one cause Fleet Manager may always
  act on — this rule says when that cause is met; it does not invent a new ground for her to act,
  it fixes when the existing one applies.
- **Source:** `[ASSUMPTION: the brief fixes no overdue tolerance. 20% of the Service Interval is
  ours — enough slack that an ordinary scheduling delay does not trigger it, short enough that it
  is reached before wear becomes a likely failure. The figure may be revised without changing the
  mechanism: overdue-past-threshold is a Safety Stop cause, not a new capability.]`
- **Affects:** maintenance scheduling, the Safety Stop of `003-deployed-fleet-custody`.

### BR-11 — An available acquisition option lapses if it is not exercised

Once every instalment is paid and the option to acquire opens (BR-07), the client has 30 calendar
days to exercise it. If the client neither exercises nor declines within that window, the option
lapses, the contract ends without acquisition, and the machine returns to Lea$e.

- **Why:** BR-07 gives the client a right; a right with no expiry gives Lea$e an asset with no
  future. Until the client decides, the machine can neither be planned into another contract nor
  retrieved — it is owned by Lea$e, held by a client who owes nothing, and committed to nobody.
  A stated window ends that, and it is settled in advance and identical for every contract for the
  same reason BR-09's tolerance is: so that no client's outcome depends on when someone got round
  to asking.
- **Source:** `[ASSUMPTION: the brief shows the acquisition option and prices nothing around it,
  including how long it stands. Thirty calendar days is ours — long enough that a client who has
  just finished paying is not ambushed, short enough that a machine is not stranded for a quarter.
  Lapsing to return rather than to acquisition is the conservative reading of BR-01: ownership
  stays with Lea$e unless the client affirmatively takes it.]`
- **Affects:** end of term, fleet planning, contract closure.

### BR-12 — Any upfront payment is capped and cannot exceed a tenth of the machine

Where a contract requires the client to pay anything before its instalment schedule begins, that
amount may not exceed 10% of the machine's value.

- **Why:** the client comes to Lea$e precisely because it cannot produce the machine's price before
  its project pays. An unbounded upfront demand recreates that shortfall at the start line, which is
  the same objection BR-07 answers at the finish line — and a client who could pay a third of a
  machine up front did not need Lea$e for that third. A cap keeps the down payment a risk instrument
  for underwriting rather than a way of shifting the gap back onto the client.
- **Source:** `[ASSUMPTION: the brief fixes no pricing at all. Ten per cent is ours — small enough
  that it does not reproduce the problem the product exists to solve, large enough to remain a real
  condition an underwriter can set against a weaker case.]`
- **Affects:** underwriting conditions, contracting, the start of the instalment schedule.

### BR-13 — A deployed machine must stay worth at least what its contract still owes

For as long as a contract is running, the machine securing it must remain worth at least the amount
the client has still to pay. A machine that has fallen below that line leaves Lea$e lending against
less than it is owed.

- **Why:** this is the rule that separates Lea$e's interest in a machine's condition from a rental
  firm's. A rental company watches wear to price its next rental; if a machine deteriorates it
  charges less next time and loses nothing already committed. Lea$e has *already paid the supplier*
  in full (BR-01, and the brief's third diagram) and is recovering that money over instalments the
  client pays as its project certifies (BR-04). The machine is the security for money already out
  the door. Wear is therefore not a pricing input here — it is an erosion of the only collateral
  behind an outstanding balance, and it is why hours, condition and servicing are watched at all.
- **Source:** brief — Lea$e buys the equipment from the supplier before the client has paid for it ·
  `[ASSUMPTION: that the machine is the security for that outlay, and that its value should track
  the balance down rather than fall below it, is ours. The brief fixes no valuation method and this
  rule deliberately does not invent one: what it requires is that the comparison be possible and
  visible, not how a value is arrived at.]`
- **Consequence:** a machine below the line is serviced before machines above it, and its operation is treated as impaired — Lea$e does not wait for a missed payment to act on security it can already see eroding.
- **Affects:** custody, maintenance priority, underwriting of a live operation, end of term.

<!--
Add new rules below, continuing the numbering. Template:

### BR-nn — Short name

One sentence stating the rule.

- **Why:** the reason the business holds it.
- **Source:** brief · or `[ASSUMPTION: what we are supposing and why]`
- **Affects:** the flows this rule constrains.
-->
