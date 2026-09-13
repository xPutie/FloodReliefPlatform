# Rescue Request State Machine

## 1. Overview

A Rescue Request follows a controlled lifecycle.

Each state represents the current condition of the request.

State transitions are triggered by user or system actions.

---

## 2. States

### CREATED
The Citizen has successfully submitted a Rescue Request.

### VERIFYING
The Rescue Coordinator is reviewing the request.

### INVALID
The request is determined to be invalid.

### VERIFIED
The request has been verified as valid.

### PRIORITIZED
The request has been assigned a priority level.

### WAITING_FOR_TEAM
The request is waiting for a suitable Rescue Team.

### ASSIGNED
A Rescue Team has been assigned to the request.

### ACCEPTED
The assigned Rescue Team has accepted the mission.

### IN_PROGRESS
The Rescue Team is currently executing the rescue mission.

### COMPLETED
The rescue mission has been successfully completed.

### RESCUE_FAILED
The rescue mission could not be completed.

### CANCELLED
The request has been cancelled.

---

## 3. Main State Flow

CREATED
    ↓
VERIFYING
    ↓
VERIFIED
    ↓
PRIORITIZED
    ↓
WAITING_FOR_TEAM
    ↓
ASSIGNED
    ↓
ACCEPTED
    ↓
IN_PROGRESS
    ↓
COMPLETED

---

## 4. Alternative Transitions

### Invalid Request

VERIFYING
    ↓
INVALID

---

### No Suitable Team

WAITING_FOR_TEAM
    ↓
WAITING_FOR_TEAM

The request remains in WAITING_FOR_TEAM until a suitable team becomes available.

---

### Team Rejects Mission

ASSIGNED
    ↓
WAITING_FOR_TEAM

The system may recommend another suitable team.

The Rescue Coordinator confirms the next assignment.

---

### Rescue Failure

IN_PROGRESS
    ↓
RESCUE_FAILED

If another rescue attempt is required:

RESCUE_FAILED
    ↓
WAITING_FOR_TEAM

---

### Cancellation

A request may become CANCELLED when cancellation is allowed by the current state.

---

## 5. State Transition Rules

| Current State | Action | Next State |
|---|---|---|
| CREATED | Submit request | VERIFYING |
| VERIFYING | Request is valid | VERIFIED |
| VERIFYING | Request is invalid | INVALID |
| VERIFIED | Coordinator sets priority | PRIORITIZED |
| PRIORITIZED | Waiting for team | WAITING_FOR_TEAM |
| WAITING_FOR_TEAM | Coordinator assigns team | ASSIGNED |
| ASSIGNED | Team accepts | ACCEPTED |
| ASSIGNED | Team rejects | WAITING_FOR_TEAM |
| ACCEPTED | Team starts rescue | IN_PROGRESS |
| IN_PROGRESS | Rescue succeeds | COMPLETED |
| IN_PROGRESS | Rescue fails | RESCUE_FAILED |
| RESCUE_FAILED | Another attempt required | WAITING_FOR_TEAM |
| Allowed states | Citizen/Coordinator cancels | CANCELLED |

---

## 6. State vs Event

A State represents the current condition of a Rescue Request.

Examples:

- ASSIGNED
- ACCEPTED
- IN_PROGRESS
- COMPLETED

An Event or Action causes a state transition.

Examples:

- Team accepts mission
- Team rejects mission
- Team starts rescue
- Team reports rescue result
- Citizen cancels request

Example:

ASSIGNED
    ↓
Team accepts mission
    ↓
ACCEPTED

"ASSIGNED" and "ACCEPTED" are states.

"Team accepts mission" is the event/action.

---

## 7. Important Rules

1. The system must not allow arbitrary state changes.
2. Each state transition must follow a defined business rule.
3. Critical transitions should be recorded in the system.
4. AI must not bypass the defined state machine.
5. Invalid requests should remain in the system with status INVALID.
6. Team rejection does not permanently terminate the request.
7. A failed rescue may require another rescue attempt.
