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

<!--
Add new rules below, continuing the numbering. Template:

### BR-nn — Short name

One sentence stating the rule.

- **Why:** the reason the business holds it.
- **Source:** brief · or `[ASSUMPTION: what we are supposing and why]`
- **Affects:** the flows this rule constrains.
-->
