# User Flows

## 1. Citizen — Submit Rescue Request

### Goal
Request rescue assistance during a flood emergency.

### Flow

1. Citizen opens the rescue page.
2. Citizen selects "Gửi yêu cầu cứu hộ".
3. System requests location permission.
4. Citizen provides or confirms location.
5. Citizen enters:
   - Number of people
   - Situation description
   - Contact information
6. Citizen may upload images.
7. Citizen submits the Rescue Request.
8. System creates the request with status CREATED.
9. System moves the request to VERIFYING.
10. Rescue Coordinator reviews the request.
11. If valid, the request becomes VERIFIED.
12. Coordinator determines the priority.
13. System finds suitable Rescue Teams.
14. Coordinator assigns a Rescue Team.
15. Citizen receives the request status.
16. Citizen can track the rescue progress.
17. After successful rescue, the request becomes COMPLETED.
18. Citizen may confirm the rescue result.

---

## 2. Citizen — SMS Fallback

### Goal
Submit a rescue request when Internet access is unavailable.

### Flow

1. Citizen sends an SOS SMS.
2. System receives the SMS through the configured SMS gateway.
3. System extracts available information:
   - Phone number
   - Location/address
   - Number of people
   - Situation
4. System creates a Rescue Request.
5. Request enters VERIFYING.
6. Rescue Coordinator reviews the request.
7. Coordinator continues the normal rescue workflow.

### Important Rule

AI may extract information from the SMS but must not invent missing information.

If important information is missing, the request should be flagged for Coordinator verification.

---

## 3. Rescue Coordinator — Process Rescue Request

### Goal
Ensure each rescue request is verified and handled by a suitable team.

### Flow

1. Coordinator receives a new Rescue Request.
2. Coordinator reviews request information.
3. Coordinator checks location and situation.
4. Coordinator verifies the request.
5. Coordinator determines priority.
6. System recommends suitable Rescue Teams.
7. Coordinator reviews team recommendations.
8. Coordinator assigns a Rescue Team.
9. Coordinator monitors the mission.
10. If the team rejects the mission:
    - Request returns to WAITING_FOR_TEAM.
    - System recommends other suitable teams.
    - Coordinator confirms reassignment.
11. If the rescue succeeds:
    - Request becomes COMPLETED.
12. If the rescue fails:
    - Request becomes RESCUE_FAILED.
    - Coordinator decides whether another rescue attempt is required.

---

## 4. Rescue Coordinator — Potential Duplicate

### Flow

1. System detects a potential duplicate request.
2. System notifies the Coordinator.
3. Coordinator compares the requests.
4. Coordinator chooses one action:
   - Merge requests
   - Keep requests separate
   - Mark one request as INVALID
5. System records the Coordinator's decision.

---

## 5. Rescue Team — Execute Mission

### Goal
Execute the assigned rescue mission.

### Flow

1. Rescue Team receives an assignment.
2. Team reviews:
   - Rescue location
   - Number of people
   - Situation
   - Priority
   - Required equipment
3. Team accepts or rejects the mission.

### If Accepted

4. Request becomes ACCEPTED.
5. Team starts the rescue.
6. Request becomes IN_PROGRESS.
7. Team updates rescue progress.
8. Team reports the result.
9. If successful, request becomes COMPLETED.
10. Citizen may confirm the result.

### If Rejected

4. Request returns to WAITING_FOR_TEAM.
5. Coordinator is notified.
6. System recommends another suitable team.

---

## 7. Relief Manager — Manage Relief

### Goal
Manage relief resources and distribution.

### Flow

1. Relief Manager views inventory.
2. Manager records incoming donations or supplies.
3. Manager updates inventory quantities.
4. Manager receives or creates a relief distribution request.
5. Manager checks available resources.
6. Manager approves or records distribution.
7. System updates inventory.
8. Manager can view resource usage statistics.

---

## 7. Admin — Manage System

### Goal
Maintain system configuration and access control.

### Flow

1. Admin logs into the system.
2. Admin manages users.
3. Admin manages roles and permissions.
4. Admin manages Rescue Teams.
5. Admin configures system parameters.
6. Admin reviews system reports.

---

## 8. Main Rescue Journey

Citizen
    ↓
Create Rescue Request
    ↓
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
Team Accepts
    ↓
ACCEPTED
    ↓
IN_PROGRESS
    ↓
COMPLETED
    ↓
Citizen Confirms

Alternative:

ASSIGNED
    ↓
Team Rejects
    ↓
WAITING_FOR_TEAM
    ↓
Find Another Suitable Team
    ↓
Coordinator Confirms Assignment
