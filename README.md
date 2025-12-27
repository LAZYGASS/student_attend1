# 교회 영유아반 출석 체크 시스템 (Student Attendance System)

교회 영유아반 아이들이 직접 자신의 사진을 터치하여 출석할 수 있는 키오스크 기반의 웹 애플리케이션입니다. 구글 스프레드시트와 실시간으로 연동되어 출석 기록을 자동으로 관리합니다.

## ✨ 주요 기능

*   **👶 터치 친화적 키오스크 UI**: 아이들의 눈높이에 맞춘 크고 직관적인 사진 그리드 화면을 제공합니다.
*   **✅ 오입력 방지**: 사진 선택 시 본인 확인 팝업("OOO님이 맞습니까?")을 띄워 실수를 방지합니다.
*   **📊 실시간 데이터 연동**: Google Sheets를 데이터베이스로 사용하여, 관리자가 스프레드시트에서 아이들 정보를 수정하면 즉시 반영되고, 출석 기록 또한 실시간으로 시트에 저장됩니다.
*   **📱 반응형 디자인**: 태블릿(iPad, Galaxy Tab 등) 및 데스크탑 환경을 모두 지원합니다.

## 📖 사용 가이드 (User Guide)

이 시스템을 사용하기 위해 가장 중요한 **구글 스프레드시트 설정** 방법입니다.

### 1. 구글 스프레드시트 준비

새 구글 스프레드시트를 생성하고, 아래와 같이 2개의 시트(Tab)를 만들고 헤더를 설정해야 합니다.

#### 시트 1: `아이들 정보`
아이들의 정보를 관리하는 시트입니다. 관리자가 미리 데이터를 입력해 둡니다.

| 컬럼 | 헤더명 (1열) | 설명 | 데이터 예시 |
| :--- | :--- | :--- | :--- |
| **A** | **넘버** | 고유 식별 번호 | `1`, `2` |
| **B** | **이름** | 아이 이름 | `김철수` |
| **C** | **부모님이름** | (선택) 부모님 성함 | `김영희` |
| **D** | **부모님 전화번호** | (선택) 연락처 | `010-1234-5678` |
| **E** | **반** | 소속 반 이름 | `영유아부` |
| **F** | **아이들사진** | 사진 이미지 주소 (URL) | `https://drive.google.com/...` |

> 💡 **Tip**: 사진은 구글 드라이브에 올린 후, 공유 링크를 사용하면 편리합니다.

#### 시트 2: `출석기록`
아이들이 출석 체크를 하면 자동으로 쌓이는 로그 시트입니다. 헤더만 만들어두면 데이터는 자동으로 추가됩니다.

| 컬럼 | 헤더명 (1열) | 설명 |
| :--- | :--- | :--- |
| **A** | **타임스탬프** | 출석 시간 (자동 입력) |
| **B** | **이름** | 출석한 아이 이름 |
| **C** | **출석여부** | `O` 로 표시됨 |
| **D** | **특이사항** | (선택) 비고란 |
| **E** | **반** | 아이의 소속 반 |

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 Node.js가 설치되어 있어야 합니다.

### 1. 레포지토리 복제 및 의존성 설치

```bash
git clone [레포지토리 주소]
cd student-attend
npm install
```

### 2. 구글 클라우드 설정

이 프로젝트는 Google Sheets API를 사용하므로, Google Cloud Platform(GCP)에서 서비스 계정 설정이 필요합니다.

1.  GCP 프로젝트 생성 및 **Google Sheets API** 활성화.
2.  서비스 계정(Service Account) 생성 및 JSON 키 파일 다운로드.
3.  **중요**: 앞에서 생성한 구글 스프레드시트에 해당 서비스 계정 이메일(`client_email`)을 **'편집자(Editor)'** 권한으로 초대(공유)해야 합니다.

### 3. 환경 변수 설정

루트 디렉토리에 `.env.local` 파일을 생성하고 다음 변수들을 설정해주세요.

```bash
# 구글 서비스 계정 이메일 (JSON 파일의 client_email)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"

# 구글 서비스 계정 프라이빗 키 (JSON 파일의 private_key)
# 줄바꿈(\n) 처리에 유의하세요. 전체 키를 하나의 문자열로 넣어야 합니다.
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 출석부를 관리할 구글 스프레드시트의 ID (URL의 /d/ 와 /edit 사이의 문자열)
GOOGLE_SHEET_ID="your_google_sheet_id"
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요. 키오스크 태블릿에서는 브라우저의 '홈 화면에 추가' 기능을 사용하면 앱처럼 실행할 수 있습니다.

## 🛠 기술 스택

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Database & API**: [Google Sheets API v4](https://developers.google.com/sheets/api)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── api/        # Next.js API Routes (출석 처리, 데이터 조회)
│   ├── page.tsx    # 메인 키오스크 화면 (사진 그리드)
│   └── layout.tsx  # 전체 레이아웃
├── components/     # 재사용 가능한 UI 컴포넌트 (모달, 그리드 아이템 등)
├── lib/
│   └── google-sheets.ts # 구글 시트 연동 및 인증 로직
├── types/          # TypeScript 타입 정의
└── ...
```
