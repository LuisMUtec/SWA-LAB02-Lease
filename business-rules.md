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
  identifier — *"The system rejects applications from companies operating under 12 months
  (BR-03)"* — so that no reference is load-bearing.

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

### BR-03 — Lea$e leases for use, not for eventual ownership

Lea$e contracts the use of a machine for a term. It does not offer the client a purchase option at
the end of the term, and it does not lease under the Peruvian financial-lease regime.

- **Why:** under D.L. 299 a domiciled lessor in a financial lease must be a bank, a financial
  company, a registered cooperative, or a company entered in the SBS register of leasing companies.
  Lea$e is none of these, so the financial-lease regime is closed to it. Operating leasing carries
  no equivalent supervisory requirement.
- **Source:** brief is silent · D.L. 299 fixes the restriction ·
  `[ASSUMPTION: Lea$e is a new company without an SBS licence and does not intend to obtain one.
  If Lea$e were instead to originate for a licensed bank, BR-01 would be false and the payment
  schedule of BR-04 would not be Lea$e's to set.]`
- **Affects:** eligibility, contracting, end of term, pricing.

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

<!--
Add new rules below, continuing the numbering. Template:

### BR-nn — Short name

One sentence stating the rule.

- **Why:** the reason the business holds it.
- **Source:** brief · or `[ASSUMPTION: what we are supposing and why]`
- **Affects:** the flows this rule constrains.
-->
