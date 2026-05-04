# Security Specification - DNA Cult Fitness

## 1. Data Invariants
- A `UserProfile` must be linked to a valid Firebase Auth UID.
- A user's `role` can only be set or modified by an `Admin` or on initial creation (defaulting to `client`).
- `Membership` status can only be updated by `Admin`.
- `DailyWorkout` status can only be updated by `Admin`.
- `PlanApprovalRequest` must be created by a user with the `trainer` role.
- `Appointment` status can only be updated by a `Trainer` or `Admin`.
- `trainerId` in a `Membership` or `Appointment` must exist in the `trainers` collection or link to a valid user with the `trainer` role.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

1. **Role Escalation**: Client attempts to update their own `role` to `admin`.
2. **Identity Spoofing**: User A attempts to create a `UserProfile` with User B's UID.
3. **Ghost Field Injection**: User attempts to add a `secret_discount` field to a `MembershipPlan`.
4. **Relationship Poisoning**: Trainer A attempts to read User B's profile when they are not the assigned trainer.
5. **Admin Lockdown**: Attacker attempts to delete the primary admin user's profile.
6. **Denial of Wallet**: Attacker sends a 1MB string as a `name` in `PersonalDetails`.
7. **Orphaned Record**: Trainer creates a `PlanApprovalRequest` for a non-existent `userId`.
8. **Date Manipulation**: Client attempts to 'approve' their own pending `Membership` by setting status to `approved`.
9. **Workout Fraud**: Client attempts to update their `workoutIndex` without admin approval.
10. **ID Overwrite**: User attempts to create a document with an ID containing `../../../` (Path traversal in document IDs).
11. **PII Scraping**: Authenticated user attempts to list all `PersonalDetails` for all users in the system.
12. **System Field Overwrite**: User attempts to modify `createdAt` to backdate their membership start.

## 3. The Test Runner Plan
Using `@firebase/rules-unit-testing`, we will verify:
- `client` can read/write own data.
- `client` CANNOT read other client data.
- `trainer` can read data of clients where `membership.trainerId == trainer.uid`.
- `trainer` CANNOT read data of clients assigned to others.
- `admin` can bypass all relational checks.
- All writes must pass `isValid[Entity]` checks (keys, types, sizes).
