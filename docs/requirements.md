# Flood Rescue Coordination and Relief Management System

## 1. Overview

The system is designed to support flood rescue coordination and relief management.

The system helps citizens submit rescue requests and helps rescue coordinators verify, prioritize, assign, and monitor rescue missions.

The system also supports rescue teams, relief managers, and administrators.

---

## 2. Actors

### Citizen
- Submit rescue request
- Provide location and situation information
- Upload images
- Track rescue request status
- Confirm rescue completion
- Request or confirm relief support

### Rescue Team
- View assigned rescue missions
- View rescue request details
- View request location on map
- Accept or reject assigned missions
- Update rescue progress
- Report rescue results

### Rescue Coordinator
- Receive rescue requests
- Verify requests
- Classify request priority
- Find suitable rescue teams
- Assign rescue teams
- Monitor rescue progress
- Handle rejected assignments
- Handle potential duplicate requests

### Relief Manager
- Manage relief inventory
- Manage donations
- Manage relief distribution
- Track resource usage

### Admin
- Manage users
- Manage roles and permissions
- Manage rescue teams
- Configure system parameters
- View system reports

---

## 3. Core Rescue Flow

Citizen
→ Create Rescue Request
→ Verify
→ Prioritize
→ Find Suitable Team
→ Assign
→ Team Accepts
→ Rescue
→ Complete

---

## 4. Rescue Request

A rescue request should contain:

- Requester
- Location
- Number of people
- Situation description

Optional information:

- Children
- Elderly people
- Injured people
- Photos
- Contact information

---

## 5. Communication Channels

The system should support multiple communication channels:

- Web
- PWA
- SMS fallback

Different channels should eventually be normalized into the same Rescue Request model.

---

## 6. AI Principle

AI is used as a decision-support mechanism.

AI may:

- Recommend request priority
- Detect potential duplicate requests
- Recommend suitable rescue teams
- Extract information from SMS

AI must not:

- Invent missing information
- Automatically make critical rescue decisions without human approval

The Rescue Coordinator remains responsible for final decisions.
