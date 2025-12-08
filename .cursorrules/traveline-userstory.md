## Epic 1. 접근 & 온보딩

### User Story 1.1 — 소셜 로그인

나는 사용자로서, Google이나 Kakao 계정으로 간편하게 로그인하고 싶다.

왜냐하면 별도의 회원가입 절차 없이 빠르게 서비스를 이용하기 위함이다.

- **기능 범위**: 소셜 로그인, 자동 가입, 세션 유지/로그아웃
- **Acceptance Criteria**
    - 첫 화면에 Google/Kakao 버튼 노출
    - 최초 로그인 시 자동 가입 처리
    - 토큰 만료/취소 시 에러 안내
    - 로그인 상태 유지 및 로그아웃 정상 동작
- **Task Breakdown**
    - Design: 로그인 화면/버튼/에러 팝업
    - FE: UI, SDK 연동
    - BE: OAuth 콜백/토큰 검증, 세션 발급
    - DB: `users`, `user_profiles`
    - QA: 임계 케이스 점검

---

### User Story 1.2 — 게스트 모드

나는 게스트로서, 가입하지 않고도 앱의 전반적인 기능을 체험하고 싶다.

왜냐하면 서비스를 먼저 경험해본 후 가입 여부를 결정하기 위함이다.

- **기능 범위**: 데모 데이터 탐색, 편집 제한, 가입 전환
- **Acceptance Criteria**
    - 게스트는 일정/체크리스트 탐색 가능
    - 편집 시 가입 유도
    - 가입 후 기존 화면 유지
- **Task Breakdown**
    - FE: 게스트 가드, CTA
    - BE: 데모 데이터 제공, 권한 제한
    - QA: 권한 가드 정상 동작 확인

---

## Epic 2. 여행 생성 & 추천

### User Story 2.1 — 여행 생성

나는 계획가로서, 여행의 기본 정보(나라, 도시, 일정)를 입력하여 새로운 여행 계획을 시작하고 싶다.

왜냐하면 모든 계획의 기초를 마련하기 위함이다.

- **기능 범위**: 제목/기간/base_tz 입력, owner 권한 부여
- **Acceptance Criteria**
    - 여행 생성 폼에서 정보 입력 가능
    - 생성 후 DB에 저장
    - 생성자 = owner로 등록
- **Task Breakdown**
    - FE: 여행 생성 UI
    - BE: 생성 API, 멤버 레코드 생성
    - DB: `travels`

---

### User Story 2.2 — 여행지 추천

나는 여행자(혹은 계획가)로서, 조건(기간, 출발 도시, 예산, 동행자 유형, 선호)을 입력해 목적지를 추천받고 싶다.

왜냐하면 정보 탐색 시간을 줄이고 합리적인 선택을 하기 위함이다.

- **기능 범위**: AI+휴리스틱 기반 추천, Fallback 프리셋
- **Acceptance Criteria**
    - 추천 리스트와 근거 표시
    - 실패 시 계절별 큐레이션 제공
    - CTA: “이 목적지로 여행 생성” 제공
- **Task Breakdown**
    - FE: 입력 폼 + 결과 카드
    - BE: 추천 API, 캐싱
    - DB: `destination_reco_logs`

---

### User Story 2.3 — 체크리스트 초기화

나는 계획가로서, 여행을 생성할 때 국가/계절에 맞는 체크리스트 템플릿을 불러오고 싶다.

왜냐하면 기본적인 준비 항목을 빠르게 세팅하기 위함이다.

- **기능 범위**: 템플릿 선택/적용
- **Acceptance Criteria**
    - 여행 생성 직후 모달에서 템플릿 선택 가능
    - 선택 시 항목 복사, 미선택 시 비어 있음
- **Task Breakdown**
    - FE: 템플릿 모달
    - BE: 템플릿 조회 API
    - DB: `checklist_templates`

---

## Epic 3. 항공·숙소 관리 & 후보 투표

### User Story 3.1 — 항공/숙소 등록

나는 여행 팀원으로서, 항공편과 숙소 정보를 기록하고 싶다.

왜냐하면 여행의 일정과 비용을 명확히 관리하기 위함이다.

- **기능 범위**: 원천 데이터 테이블, 일정 참조
- **Acceptance Criteria**
    - 항공/숙소 정보 저장 가능
    - 일정에서는 참조만 가능
- **Task Breakdown**
    - FE: 생성/편집 폼
    - BE: CRUD API
    - DB: `flights`, `stays`

---

### User Story 3.2 — 후보 투표

나는 여행 팀원으로서, 여러 항공편/숙소 후보 중 하나를 투표하여 최종 선택하고 싶다.

왜냐하면 공정하게 의사결정을 하기 위함이다.

- **기능 범위**: 후보 등록, 투표, 최종 확정
- **Acceptance Criteria**
    - 후보 다건 등록 가능
    - 참여자 1인 1표
    - 동점 시 소유자 결정 or 재투표
- **Task Breakdown**
    - FE: 후보 목록/투표 UI
    - BE: 투표 API, 권한 가드
    - DB: `decision_topics`, `decision_options`, `votes`, `final_decisions`

---

## Epic 4. 일정 관리

### User Story 4.1 — 일정 아이템 관리

나는 계획가로서, 여행 중 장소/항공/숙소/메모를 일정에 추가하고 싶다.

왜냐하면 여행의 하루하루를 구체적으로 관리하기 위함이다.

- **기능 범위**: 일정 아이템 유형, 참조 기반, UTC 저장
- **Acceptance Criteria**
    - item 유형별 등록 가능
    - flight/stay는 참조만 허용
- **Task Breakdown**
    - FE: 타임라인 UI
    - BE: CRUD API
    - DB: `itinerary_items`

---

### User Story 4.2 — 이동 경로

나는 여행자로서, 일정 간 이동 경로와 시간을 계산하고 싶다.

왜냐하면 소요 시간을 고려한 계획을 세우기 위함이다.

- **기능 범위**: 지도 연동, 토글 계산
- **Acceptance Criteria**
    - 경로/시간 계산 옵션 제공
- **Task Breakdown**
    - FE/BE: 지도 API 연동

---

### User Story 4.3 — 일정 공유

나는 계획가로서, 여행 일정을 공유 링크로 제공하고 싶다.

왜냐하면 동행자와 간편히 계획을 공유하기 위함이다.

- **기능 범위**: 공유 링크 발급, 프린트 스타일
- **Acceptance Criteria**
    - 공유 링크 생성/회수 가능
    - 공유 페이지에서 인쇄 최적화
- **Task Breakdown**
    - FE: 공유 페이지 UI
    - BE: 토큰 발급/검증
    - DB: `share_links`

---

## Epic 5. 체크리스트

### User Story 5.1 — 체크리스트 편집

나는 계획가로서, 여행 준비 항목을 추가/편집/정렬하고 싶다.

왜냐하면 여행 준비 과정을 맞춤화하기 위함이다.

- **기능 범위**: 항목 CRUD, source 구분
- **Acceptance Criteria**
    - 항목 추가/편집/삭제 가능
    - source 표시
- **Task Breakdown**
    - FE: 편집 UI
    - BE: CRUD API
    - DB: `checklist_categories`, `checklist_items`

---

### User Story 5.2 — 사용자별 체크

나는 팀원으로서, 체크리스트에서 내 준비 상황을 표시하고 싶다.

왜냐하면 서로 준비 상황을 공유하기 위함이다.

- **기능 범위**: 사용자별 체크 상태 기록
- **Acceptance Criteria**
    - 사용자별 체크 동기화
    - 동시 편집 시 마지막 저장자 기준
- **Task Breakdown**
    - FE: 사용자별 상태 UI
    - BE: 멱등 토글 API
    - DB: `checklist_item_status`

---

## Epic 6. 사진 업로드 & 지출 & 알림

### User Story 6.1 — 사진 업로드

나는 여행자로서, 여행 사진을 업로드하고 자동으로 일정에 매핑되길 원한다.

왜냐하면 추억을 일정과 함께 정리하기 위함이다.

- **기능 범위**: EXIF 기반 추천, 수동 매핑 가능
- **Acceptance Criteria**
    - EXIF에서 일시/위치 추출
    - 여행 일정과 자동 매칭 추천
    - EXIF 원본은 저장하지 않음
- **Task Breakdown**
    - FE: 업로드 UI, 추천 배지
    - BE: EXIF 파싱, 매칭
    - DB: `photos`, `photo_place_links`

---

### User Story 6.2 — 지출 기록

나는 팀원으로서, 여행 중 지출을 기록하고 요약을 보고 싶다.

왜냐하면 정산을 대비하고 관리하기 위함이다.

- **기능 범위**: 금액/통화/메모 기록, 요약 제공
- **Acceptance Criteria**
    - 개인/공유 지출 구분
    - CSV 내보내기 선택 제공
- **Task Breakdown**
    - FE: 입력/요약 뷰
    - BE: CRUD, 집계 API
    - DB: `expenses`

---

### User Story 6.3 — 알림

나는 팀원으로서, 일정과 체크리스트 알림을 받고 싶다.

왜냐하면 준비나 일정을 놓치지 않기 위함이다.

- **기능 범위**: base_tz 기준 알림
- **Acceptance Criteria**
    - 일정/체크리스트 알림 제공
- **Task Breakdown**
    - FE: 알림 설정 UI
    - BE: 스케줄러, TZ 변환

---

## Epic 7. 공유 링크

### User Story 7.1 — 공유 링크

나는 계획가로서, 여행 계획을 공유 링크로 발급하고 싶다.

왜냐하면 팀원 외 다른 사람과도 간단히 공유하기 위함이다.

- **기능 범위**: 공유 범위 토글, 만료/회수
- **Acceptance Criteria**
    - 링크 토큰 발급/만료
    - 공유 범위(일정/체크리스트/사진) 설정
- **Task Breakdown**
    - FE: 공유 설정 패널
    - BE: 링크 발급 API
    - DB: `share_links`

---

## Epic 8. 코멘트 & 신고

### User Story 8.1 — 코멘트

나는 팀원으로서, 여행 일정/체크리스트/사진에 코멘트를 남기고 싶다.

왜냐하면 의견을 기록하고 소통하기 위함이다.

- **기능 범위**: 코멘트 작성/신고/숨김
- **Acceptance Criteria**
    - 신고 시 상태 변경, 감사 로그 기록
- **Task Breakdown**
    - FE: 코멘트 UI
    - BE: 코멘트/신고 API
    - DB: `comments`, `comment_reports`, `audit_logs`

---

## Epic 9. 권한/역할

### User Story 9.1 — 역할 관리

나는 계획가로서, 팀원에게 역할(owner, planner, editor, viewer)을 부여하고 싶다.

왜냐하면 권한에 맞게 기능을 제한하기 위함이다.

- **기능 범위**: 역할/권한 모델, 소유권 이양
- **Acceptance Criteria**
    - 역할별 권한 차등 적용
    - 소유권 이양 가능
- **Task Breakdown**
    - FE: 권한별 UI 가드
    - BE: 역할 검사 미들웨어
    - DB: `travel_members`

---

## Epic 10. 장소 데이터

### User Story 10.1 — 장소 참조

나는 계획가로서, 플랫폼 내에서 장소를 검색하여 일정에 추가하고 싶다.

왜냐하면 여행 계획에 필요한 장소를 간편하게 등록하기 위함이다.

- **기능 범위**
    - 플랫폼 내 장소 검색 기능 제공
    - 검색된 장소를 일정 아이템으로 추가 가능
    - 필요 시 수동 입력도 지원
- **Acceptance Criteria**
    - 사용자가 장소를 검색하면 관련 결과가 표시된다.
    - 선택한 장소를 일정 아이템에 추가할 수 있다.
    - 검색 결과가 없을 경우 수동 입력으로 등록할 수 있다.
- **Task Breakdown**
    - FE: 장소 검색 UI, 선택/추가 버튼
    - BE: 장소 검색 API, 저장/조회 API
    - DB: `places(id, place_name, lat, lng, address)`

---