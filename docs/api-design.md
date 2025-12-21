# GoGoStudy API Design

## Overview
- Base URL: `http://localhost:8080`
- Auth: `Authorization: Bearer <accessToken>`
- Common error response: `{ timestamp, path, status, code, message, details }`

## Auth
- `POST /auth/register`
  - Body: `{ email, password, name }`
  - Response: `{ user, accessToken, refreshToken }`
- `POST /auth/login`
  - Body: `{ email, password }`
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
- `PATCH /admin/users/:id/role`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Body: `{ role: USER | ADMIN }`
  - Response: `{ user }`
- `PATCH /admin/users/:id/deactivate`
  - Header: `Authorization: Bearer <accessToken>` (ADMIN)
  - Response: `{ user }`

## Studies & Attendance
- `POST /studies`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ title, description, category?, maxMembers? }`
  - Response: `{ study }`
- `POST /studies/:studyId/join`
  - Header: `Authorization: Bearer <accessToken>`
  - Response: `{ membership }`
- `POST /studies/:studyId/sessions`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Body: `{ title, date }`
  - Response: `{ session }`
- `POST /studies/:studyId/sessions/:sessionId/attendance`
  - Header: `Authorization: Bearer <accessToken>` (Study Member)
  - Body: `{ status: PRESENT | LATE | ABSENT }`
  - Response: `{ record }`
- `GET /studies/:studyId/attendance/summary`
  - Header: `Authorization: Bearer <accessToken>` (Study Leader)
  - Response: `{ studyId, summary }`
