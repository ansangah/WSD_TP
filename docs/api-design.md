# GoGoStudy API Design

## Overview
- Base URL: `http://localhost:8080`
- Auth: `Authorization: Bearer <accessToken>`
- Common error response: `{ timestamp, path, status, code, message, details }`
- Error codes: `ACCOUNT_INACTIVE`, `ALREADY_JOINED`, `EMAIL_TAKEN`, `FORBIDDEN`, `GOOGLE_AUTH_NOT_CONFIGURED`, `INVALID_CREDENTIALS`, `INVALID_DATE`, `INVALID_GOOGLE_TOKEN`, `INVALID_ID`, `INVALID_MEMBER_STATUS`, `INVALID_OPERATION`, `INVALID_PASSWORD`, `INVALID_PAYLOAD`, `INVALID_ROLE`, `INVALID_STATUS`, `INVALID_STUDY`, `INVALID_TOKEN`, `INVALID_USER_ID`, `MEMBER_NOT_FOUND`, `MEMBERSHIP_NOT_FOUND`, `NOT_A_MEMBER`, `PASSWORD_TOO_SHORT`, `REFRESH_NOT_FOUND`, `SESSION_NOT_FOUND`, `STUDY_FULL`, `STUDY_NOT_FOUND`, `TOKEN_REVOKED`, `UNAUTHORIZED`, `UNKNOWN_ERROR`, `USER_NOT_FOUND`, `INTERNAL_ERROR`

## Response format
- 성공(조회): 리소스 중심으로 응답 (`{ user }`, `{ study }`, `{ data: Study[], page, pageSize, total }` 등)
- 성공(상태 변경): 명시적 성공 표시 (`{ success: true }`) 또는 변경된 리소스 반환
- 실패: `{ timestamp, path, status, code, message, details }`
  - 예시: `{ "timestamp": "2024-12-24T00:00:00.000Z", "path": "/auth/login", "status": 401, "code": "INVALID_CREDENTIALS", "message": "Invalid credentials", "details": null }`

## Auth
- `POST /auth/register`
  - Body: `{ email, password, name }`
  - Response: `{ user, accessToken, refreshToken }`
- `POST /auth/login`
  - Body: `{ email, password }`
  - Response: `{ user, accessToken, refreshToken }`
- `POST /auth/google`
  - Body: `{ idToken }`
  - Response: `{ user, accessToken, refreshToken }`
- `POST /auth/refresh`
  - Body: `{ refreshToken }`
  - Response: `{ user, accessToken, refreshToken }`
- `POST /auth/logout`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ refreshToken }`
  - Response: `{ success: true }`

## Users
- `GET /users/me`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ user }`
- `GET /users/me/attendance`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ userId, totalSessions, summary }`
- `PATCH /users/me`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ name }`
  - Response: `{ user }`
- `PATCH /users/me/password`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ currentPassword, newPassword }`
  - Response: `{ success: true }`

## Admin Users
- `GET /admin/users`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Response: `{ users }`
- `GET /admin/users/:id/attendance`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Response: `{ userId, totalSessions, summary }`
- `PATCH /admin/users/:id/role`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Body: `{ role: USER | ADMIN }`
  - Response: `{ user }`
- `PATCH /admin/users/:id/deactivate`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Response: `{ user }`

## Admin Studies & Stats
- `GET /admin/studies`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Query: `q?, category?, status?, page?, pageSize?`
  - Response: `{ data: Study[], page, pageSize, total }`
- `GET /admin/stats/overview`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Response: `{ totals }`

## Studies & Attendance
- `POST /studies`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ title, description, category?, maxMembers? }`
  - Response: `{ study }`
- `GET /studies`
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `q?, category?, status?, page?, pageSize?`
  - Response: `{ data: Study[], page, pageSize, total }`
- `GET /studies/me`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ studies }`
- `GET /studies/:studyId`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ study }`
- `PATCH /studies/:studyId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ title?, description?, category?, maxMembers? }`
  - Response: `{ study }`
- `PATCH /studies/:studyId/status`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ status: RECRUITING | CLOSED }`
  - Response: `{ study }`
- `DELETE /studies/:studyId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ success: true }`
- `POST /studies/:studyId/join`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ membership }` (status=`PENDING`; leader 승인 필요)
- `GET /studies/:studyId/members`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Query: `status?`
  - Response: `{ members }`
- `PATCH /studies/:studyId/members/:userId/status`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ status: APPROVED | PENDING | REJECTED }` (정원 초과 시 APPROVED 불가)
  - Response: `{ membership }`
- `DELETE /studies/:studyId/members/:userId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ success: true }`
- `POST /studies/:studyId/members/leave`
  - Header: `Authorization: Bearer <accessToken>` (Member)
  - Response: `{ success: true }` (리더는 탈퇴 불가)
- `POST /studies/:studyId/sessions`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ title, date }`
  - Response: `{ session }`
- `PATCH /studies/:studyId/sessions/:sessionId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ title?, date? }`
  - Response: `{ session }`
- `DELETE /studies/:studyId/sessions/:sessionId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ success: true }`
- `GET /studies/:studyId/sessions`
  - Header: `Authorization: Bearer <accessToken>` (Approved Member)
  - Response: `{ sessions }`
- `GET /studies/:studyId/sessions/:sessionId`
  - Header: `Authorization: Bearer <accessToken>` (Approved Member)
  - Response: `{ session }`
- `POST /studies/:studyId/sessions/:sessionId/attendance`
  - Header: `Authorization: Bearer <accessToken>` (Approved Member)
  - Body: `{ status: PRESENT | LATE | ABSENT }`
  - Response: `{ record }`
- `GET /studies/:studyId/sessions/:sessionId/attendance`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ sessionId, records }`
- `GET /sessions/:sessionId/attendance`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ sessionId, records }`
- `GET /studies/:studyId/attendance/summary`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ studyId, summary }`
- `GET /studies/:studyId/attendance/users/:userId`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader 또는 본인)
  - Response: `{ studyId, userId, totalSessions, summary }`
