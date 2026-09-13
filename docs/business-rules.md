# Business Rules

## BR-01 — Create Rescue Request

A Citizen can create a Rescue Request.

A Rescue Request must contain:

- Requester
- Location
- Number of people
- Situation description

---

## BR-02 — Request Verification

Every Rescue Request must be verified before it can be assigned to a Rescue Team.

The Rescue Coordinator is responsible for verification.

---

## BR-03 — Request Priority

Every verified Rescue Request must have a priority level.

Possible priority levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

AI may recommend a priority level, but the Rescue Coordinator makes the final decision.

---

## BR-04 — Suitable Rescue Team

The nearest Rescue Team is not automatically the best team.

Team suitability should consider:

- Distance
- Availability
- Vehicle
- Equipment
- Capacity
- Rescue capability

The Rescue Coordinator confirms the final assignment.

---

## BR-05 — Team Rejection

If an assigned Rescue Team rejects a mission:

1. The request returns to WAITING_FOR_TEAM.
2. The system recommends other suitable teams.
3. The Rescue Coordinator confirms the reassignment.

---

## BR-06 — No Available Team

If no suitable Rescue Team is available:

- The request remains in WAITING_FOR_TEAM.
- The Rescue Coordinator is notified.

---

## BR-07 — Potential Duplicate Request

The system may detect potential duplicate Rescue Requests.

A potential duplicate must not be automatically merged or deleted.

The Rescue Coordinator reviews the requests and decides whether to:

- Merge them
- Keep them separate
- Mark one as invalid

---

## BR-08 — Invalid Request

Invalid requests must be kept in the system and marked as INVALID.

The system must not delete invalid requests automatically.

---

## BR-09 — Rescue Completion

A Rescue Request can be marked as COMPLETED after the Rescue Team reports that the rescue has been successfully completed.

The Citizen may confirm the rescue result.

---

## BR-10 — Rescue Failure

If a rescue mission cannot be completed:

- The request may be marked as RESCUE_FAILED.
- The request can return to WAITING_FOR_TEAM if another rescue attempt is required.
- The Rescue Coordinator is notified.

---

## BR-11 — Cancellation

A Citizen may cancel a Rescue Request when cancellation is allowed by the current request state.

Critical rescue decisions should be handled by the Rescue Coordinator.

---

## BR-12 — Communication Channels

Rescue Requests may originate from:

- Web
- PWA
- SMS

All channels should eventually be normalized into the same Rescue Request model.

---

## BR-13 — AI Safety

AI is a decision-support mechanism.

AI may:

- Recommend priority
- Detect potential duplicates
- Recommend suitable Rescue Teams
- Extract information from SMS

AI must not:

- Invent missing information
- Automatically make critical rescue decisions
- Automatically assign a Rescue Team without Coordinator approval
- Automatically merge duplicate requests

---

## BR-14 — Human-in-the-loop

The Rescue Coordinator remains responsible for final decisions in critical rescue workflows.

AI recommendations must be reviewable before they affect critical operations.
