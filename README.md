# GoGoStudy API

GoGoStudy는 스터디 그룹 관리와 출석 기록을 위한 백엔드 API입니다.

## 프로젝트 개요
- 문제 정의: 스터디 개설, 멤버 승인, 출석 관리를 일관된 규칙으로 처리
- 핵심 기능:
  - 인증: 회원가입/로그인/토큰 재발급/로그아웃 (JWT)
  - 사용자: 내 정보 조회/수정, 비밀번호 변경
  - 관리자: 사용자 목록, 권한 변경, 비활성화
  - 스터디: 개설/검색/가입/승인, 세션 생성, 출석 기록 및 요약

## 실행 방법
### 로컬 실행
1. 환경변수 템플릿 복사:
   ```bash
   cp .env.example .env
   ```
2. 의존성 설치:
   ```bash
   npm install
   ```
3. 마이그레이션 및 시드:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
4. 서버 실행:
   ```bash
   npm run dev
   ```

### Docker 실행
1. 환경변수 템플릿 복사 및 값 설정:
   ```bash
   cp .env.example .env
   ```
2. 컨테이너 빌드 및 실행:
   ```bash
   docker compose up -d --build
   ```
3. 마이그레이션 및 시드:
   ```bash
   docker compose exec app npx prisma migrate deploy
   docker compose exec app npm run seed
   ```

### 테스트
```bash
npm test
```
- e2e: `tests/e2e/auth.test.js`, `tests/e2e/study-attendance.test.js`
- unit: `tests/unit/auth.service.test.js`

## 환경변수 설명 (.env.example)
비밀키(API_KEY, DB_PASSWORD, JWT_SECRET 등)는 절대 공개 레포에 커밋하지 말고 `.env`에만 보관하세요.

| Key | 설명 |
| --- | --- |
| `PORT` | API 포트 (기본 8080) |
| `NODE_ENV` | 실행 환경 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `REDIS_HOST` | Redis 호스트 |
| `REDIS_PORT` | Redis 포트 |
| `JWT_ACCESS_SECRET` | JWT 액세스 시크릿 |
| `JWT_REFRESH_SECRET` | JWT 리프레시 시크릿 |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase 서비스 계정 이메일 |
| `FIREBASE_PRIVATE_KEY` | Firebase 개인키 (`\n`으로 줄바꿈) |
| `FIREBASE_WEB_API_KEY` | Firebase 웹 API 키 |
| `FIREBASE_WEB_CLIENT_ID` | Firebase 웹 클라이언트 ID |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |

참고: `.env.example`에 Firebase Admin 키가 중복되어 있으니 실제 `.env`에는 하나의 세트만 사용하세요.

## 배포 주소
- Base URL(로컬): `http://localhost:8080`
- Swagger URL: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/docs.json`
- Health URL: `http://localhost:8080/health`
- 운영 Base URL: `https://<your-domain>`

## 인증 플로우
1. 회원가입/로그인 → `accessToken`, `refreshToken` 발급
2. 보호 API 호출 시 `Authorization: Bearer <accessToken>` 헤더 사용
3. 액세스 토큰 만료 시 `POST /auth/refresh`로 재발급
4. 로그아웃: `POST /auth/logout`

## 역할/권한
| 역할 | 설명 |
| --- | --- |
| `ROLE_USER` | 기본 사용자 권한 |
| `ROLE_ADMIN` | 사용자 관리 권한 |
| Study Leader | 스터디 생성자(리더) |
| Approved Member | 승인된 멤버 |

## 예시 계정 (Seed)
- `ROLE_ADMIN`: `user1@example.com / Password123!`
- `ROLE_USER`: `user2@example.com / Password123!`

## Postman 환경설정
- 컬렉션 파일: `docs/GoGoStudy.postman_collection.json`
- 변수:
  - `BASE_URL` (기본 `http://localhost:8080`)
  - `ACCESS_TOKEN`
  - `REFRESH_TOKEN`

## DB 연결 정보(테스트/로컬 Docker)
- Host: `localhost`
- Port: `15432`
- DB: `gogostudy`
- User: `gogo`
- Password: `gogo_pw` (로컬 개발용)

## 엔드포인트 요약표
| Method | URL | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/auth/register` | 회원가입 | Public |
| POST | `/auth/login` | 로그인 | Public |
| POST | `/auth/refresh` | 토큰 재발급 | Public |
| POST | `/auth/logout` | 로그아웃 | ROLE_USER |
| GET | `/users/me` | 내 정보 조회 | ROLE_USER |
| PATCH | `/users/me` | 내 정보 수정 | ROLE_USER |
| PATCH | `/users/me/password` | 비밀번호 변경 | ROLE_USER |
| GET | `/admin/users` | 사용자 목록 | ROLE_ADMIN |
| PATCH | `/admin/users/:id/role` | 사용자 권한 변경 | ROLE_ADMIN |
| PATCH | `/admin/users/:id/deactivate` | 사용자 비활성화 | ROLE_ADMIN |
| POST | `/studies` | 스터디 생성 | ROLE_USER |
| GET | `/studies` | 스터디 목록/검색 | ROLE_USER |
| GET | `/studies/:studyId` | 스터디 상세 | ROLE_USER |
| POST | `/studies/:studyId/join` | 스터디 가입 요청 | ROLE_USER |
| GET | `/studies/:studyId/members` | 멤버 목록 | Leader |
| PATCH | `/studies/:studyId/members/:userId/status` | 멤버 승인/거절 | Leader |
| DELETE | `/studies/:studyId/members/:userId` | 멤버 제거 | Leader |
| POST | `/studies/:studyId/members/leave` | 스터디 탈퇴 | Member(Leader 제외) |
| POST | `/studies/:studyId/sessions` | 세션 생성 | Leader |
| GET | `/studies/:studyId/sessions` | 세션 목록 | Approved Member |
| GET | `/studies/:studyId/sessions/:sessionId` | 세션 상세 | Approved Member |
| POST | `/studies/:studyId/sessions/:sessionId/attendance` | 출석 기록 | Approved Member |
| GET | `/studies/:studyId/sessions/:sessionId/attendance` | 출석 리스트 | Leader |
| GET | `/studies/:studyId/attendance/summary` | 출석 요약 | Leader |
| GET | `/studies/:studyId/attendance/users/:userId` | 개인 출석 요약 | Leader 또는 본인 |

## 주요 설계·보안·성능 고려사항
- JWT 액세스/리프레시 토큰, bcrypt 해시
- 관리자/리더 권한 체크
- Helmet, CORS 적용 (Swagger UI는 CSP 완화)
- Prisma 유니크 제약 (`User.email`, `StudyMember` 복합키)
- 목록 조회 시 필터/페이지네이션 지원

## 한계와 개선 계획
- 레이트 리밋 적용 및 요청 유효성 검증 확대
- 카테고리/상태 등 검색 인덱스 추가
- 모니터링/알림, 로그 집계 연동
