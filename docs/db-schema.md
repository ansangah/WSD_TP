# GoGoStudy DB Schema

## Entities

### User
- `id` (PK)
- `email` (unique)
- `passwordHash`
- `name`
- `role` (USER | ADMIN)
- `status` (ACTIVE | INACTIVE)
- `provider` (LOCAL, GOOGLE, KAKAO, FIREBASE)
- `providerId` (nullable, unique)
- `createdAt`, `updatedAt`

### Study
- `id` (PK)
- `title`
- `description`
- `category`
- `maxMembers`
- `status` (RECRUITING by default)
- `leaderId` (FK -> User)
- `createdAt`

### StudyMember
- `id` (PK)
- `studyId` (FK -> Study)
- `userId` (FK -> User)
- `memberRole` (LEADER | MEMBER)
- `status` (APPROVED)
- `joinedAt`
- Unique: `(studyId, userId)`

### AttendanceSession
- `id` (PK)
- `studyId` (FK -> Study)
- `title`
- `date`
- `createdAt`

### AttendanceRecord
- `id` (PK)
- `sessionId` (FK -> AttendanceSession)
- `userId` (FK -> User)
- `status` (PRESENT | LATE | ABSENT)
- `recordedAt`

## ERD (Text)
- User 1 --- N Study (leader)
- User 1 --- N StudyMember
- Study 1 --- N StudyMember
- Study 1 --- N AttendanceSession
- AttendanceSession 1 --- N AttendanceRecord
- User 1 --- N AttendanceRecord
