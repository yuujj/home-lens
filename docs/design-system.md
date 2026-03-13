# HomeLens Design System

> UI 컴포넌트를 새로 만들거나 수정할 때 이 문서를 기준으로 삼는다.
> 모든 색상·간격·패턴은 `globals.css`의 `@theme` 블록에서 관리한다.

---

## 1. 색상 (Color)

### 1.1 브랜드 색상

#### Navy — 신뢰·권위

| 토큰 | 값 | 유틸리티 클래스 | 용도 |
|------|----|----------------|------|
| `--color-navy-50`  | `#f0f5ff` | `bg-navy-50`  | 섹션 배경 hover |
| `--color-navy-100` | `#dce8ff` | `bg-navy-100` | 배지 배경, 강조 배경 |
| `--color-navy-600` | `#2547a1` | `text-navy-600` / `bg-navy-600` | 보조 버튼 |
| `--color-navy-700` | `#1e3a7a` | `text-navy-700` | 링크 hover |
| `--color-navy-800` | `#1a3260` | `bg-navy-800` | 기본 버튼, 헤더 배경 |
| `--color-navy-900` | `#0f2044` | `text-navy-900` | 주요 헤딩 |
| `--color-navy-950` | `#0a1628` | `text-navy-950` | 최강조 텍스트 |

#### Amber — 경고·주의

| 토큰 | 값 | 유틸리티 클래스 | 용도 |
|------|----|----------------|------|
| `--color-amber-50`  | `#fffbeb` | `bg-amber-50`  | 면책 배너 배경 |
| `--color-amber-100` | `#fef3c7` | `bg-amber-100` | 주의 배지 배경 |
| `--color-amber-400` | `#fbbf24` | `text-amber-400` | 아이콘 강조 |
| `--color-amber-500` | `#f59e0b` | `text-amber-500` | 경고 텍스트 |

### 1.2 등급 색상 (5단계)

`@theme`에 정의된 시맨틱 토큰. `globals.css`의 `.grade-*` / `.badge-*` 유틸리티로 사용.

| 등급 | 토큰 | 색상값 | 텍스트 클래스 | 배지 클래스 |
|------|------|--------|--------------|------------|
| 안전 | `--color-grade-safe` | `#16a34a` | `grade-safe` | `badge-safe` |
| 양호 | `--color-grade-good` | `#2563eb` | `grade-good` | `badge-good` |
| 주의 | `--color-grade-caution` | `#d97706` | `grade-caution` | `badge-caution` |
| 위험 | `--color-grade-danger` | `#dc2626` | `grade-danger` | `badge-danger` |
| 매우 위험 | `--color-grade-critical` | `#7f1d1d` | `grade-critical` | `badge-critical` |

### 1.3 시맨틱 색상 (shadcn/ui)

`:root` HSL 변수로 관리. shadcn/ui 컴포넌트와 호환.

| 변수 | 용도 |
|------|------|
| `--background` | 페이지 배경 (흰색) |
| `--foreground` | 기본 텍스트 |
| `--card` | 카드 배경 |
| `--muted` | 비활성 배경 |
| `--muted-foreground` | 보조 텍스트 |
| `--border` | 테두리 기본색 |
| `--primary` | 주요 액션 색 (navy blue) |
| `--destructive` | 삭제·경고 액션 |

### 1.4 신뢰도 배지 색상

데이터 신뢰도(`market_data_confidence`) 표시에 사용.

| 값 | 색상 | Tailwind 클래스 |
|----|------|----------------|
| `high` | 초록 | `bg-green-100 text-green-800` |
| `medium` | 파랑 | `bg-blue-100 text-blue-800` |
| `low` | 주황 | `bg-orange-100 text-orange-800` |
| `estimated` | 보라 | `bg-purple-100 text-purple-800` |
| `none` | 회색 | `bg-slate-100 text-slate-600` |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리

| 변수 | 폰트 | 용도 |
|------|------|------|
| `--font-sans` | Pretendard | 본문, UI 텍스트 (한국어 최적화) |
| `--font-serif` | DM Serif Display | h1, h2, h3 헤딩 |

`globals.css`의 `body`에 `font-family: "Pretendard"` 기본 적용.
`h1~h3`은 `font-family: "DM Serif Display"` 자동 적용.

### 2.2 크기 스케일

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `text-[10px]` | 10px | 극소 레이블, 단위 표기 |
| `text-xs` | 12px | 배지, 캡션, 보조 레이블 |
| `text-sm` | 14px | 폼 입력, 설명 텍스트 |
| `text-base` | 16px | 본문 기본 |
| `text-lg` | 18px | 중요 수치 강조 |
| `text-xl` | 20px | 소섹션 제목 |
| `text-2xl` | 24px | 섹션 제목 |
| `text-3xl` | 30px | 페이지 주제목 |
| `text-4xl` | 36px | 히어로 수치 (점수, 금액) |

### 2.3 굵기

| 클래스 | 용도 |
|--------|------|
| `font-normal` | 본문 |
| `font-medium` | 레이블, 보조 제목 |
| `font-semibold` | 카드 제목, 수치 강조 |
| `font-bold` | 주요 제목, CTA |

### 2.4 한국어 줄높이

한국어 가독성을 위해 `leading-relaxed` (1.625) 기본 사용.
수치·배지처럼 단일 줄 요소는 `leading-none` 또는 `leading-tight`.

---

## 3. 간격 & 레이아웃 (Spacing & Layout)

### 3.1 컨테이너

```html
<main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
```

- 최대 너비: `max-w-5xl` (1024px)
- 좌우 패딩: `px-4` (모바일) → `sm:px-6` (태블릿+)

### 3.2 카드 내부 패딩

```
p-5    (기본 카드)
p-4    (밀도 높은 목록 아이템)
p-6    (주요 결과 카드)
```

### 3.3 갭 스케일

| 갭 | 용도 |
|----|------|
| `gap-0.5` | 아이콘 + 텍스트 인라인 |
| `gap-1` | 배지 내부 요소 |
| `gap-2` | 소형 컴포넌트 간격 |
| `gap-3` | 폼 필드 간격 |
| `gap-4` | 카드 내 섹션 간격 |
| `gap-6` | 카드 간 간격 |
| `gap-8` | 섹션 간격 |
| `gap-12` | 페이지 섹션 간격 |

### 3.4 반응형 중단점

`sm: 640px` 단일 중단점 전략 (모바일 우선).

```html
<!-- 모바일: 1열, 태블릿+: 2열 -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

## 4. 컴포넌트 패턴 (Component Patterns)

### 4.1 카드

```html
<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
  <!-- 내용 -->
</div>
```

- `rounded-xl` = `--radius-card` (0.75rem)
- `shadow-card` = `--shadow-card` (0 1px 3px rgb(0 0 0 / 0.06))
- 테두리: `border border-slate-200`

### 4.2 배지

```html
<!-- 등급 배지 -->
<span class="badge-safe rounded-full px-2.5 py-0.5 text-xs font-medium">안전</span>
<span class="badge-caution rounded-full px-2.5 py-0.5 text-xs font-medium">주의</span>

<!-- 신뢰도 배지 -->
<span class="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
  높은 신뢰도
</span>
```

### 4.3 게이지 바

```html
<div class="h-3 rounded-full bg-slate-100 overflow-hidden">
  <div
    class="h-full rounded-full transition-all duration-500"
    style={{ width: `${score}%`, backgroundColor: gradeColor }}
  />
</div>
```

점수에 따른 색상 매핑:
- 0–30: `--color-grade-safe`
- 31–60: `--color-grade-good`
- 61–80: `--color-grade-caution`
- 81–90: `--color-grade-danger`
- 91–100: `--color-grade-critical`

### 4.4 폼 입력

```html
<input
  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent"
/>
```

### 4.5 버튼

```html
<!-- Primary -->
<button class="bg-navy-800 text-white rounded-lg px-4 py-2 text-sm font-medium
               hover:bg-navy-900 transition-colors">
  분석 시작
</button>

<!-- Secondary -->
<button class="bg-slate-100 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium
               hover:bg-slate-200 transition-colors">
  초기화
</button>
```

### 4.6 면책 배너

```html
<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
  <AlertTriangle class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
  <p class="text-sm text-amber-800 leading-relaxed">
    본 결과는 참고용이며 법적·금융 자문이 아닙니다. 실제 계약 전 전문가 상담 및 공문서 직접 확인을 권장합니다.
  </p>
</div>
```

---

## 5. 등급 시스템 (Grade System)

### 5.1 전세가율 5단계

| 등급 | 전세가율 기준 | 색상 클래스 | 배지 클래스 | 의미 |
|------|-------------|------------|------------|------|
| 안전 | < 60% | `grade-safe` | `badge-safe` | 매매가 대비 여유 충분 |
| 양호 | 60–70% | `grade-good` | `badge-good` | 일반적 수준 |
| 주의 | 70–80% | `grade-caution` | `badge-caution` | 주의 필요 |
| 위험 | 80–90% | `grade-danger` | `badge-danger` | 위험 구간 |
| 매우 위험 | ≥ 90% | `grade-critical` | `badge-critical` | 역전세 위험 |

### 5.2 사기위험도 4단계

| 등급 | 점수 구간 | 색상 클래스 | 배지 클래스 | 의미 |
|------|----------|------------|------------|------|
| 안전 | 0–30 | `grade-safe` | `badge-safe` | 주요 위험 없음 |
| 주의 | 31–60 | `grade-caution` | `badge-caution` | 일부 위험 요소 |
| 위험 | 61–80 | `grade-danger` | `badge-danger` | 복수 위험 요소 |
| 매우 위험 | 81–100 | `grade-critical` | `badge-critical` | 즉각 전문가 상담 필요 |

### 5.3 데이터 신뢰도 5단계

| 값 | 의미 | 배지 색상 |
|----|------|----------|
| `high` | 실거래 데이터 충분 (3건 이상) | `bg-green-100 text-green-800` |
| `medium` | 실거래 데이터 보통 (1–2건) | `bg-blue-100 text-blue-800` |
| `low` | 실거래 데이터 부족 | `bg-orange-100 text-orange-800` |
| `estimated` | 추정값 (인근 데이터 사용) | `bg-purple-100 text-purple-800` |
| `none` | 데이터 없음 | `bg-slate-100 text-slate-600` |

### 5.4 아이콘 매핑

| 등급/상태 | 아이콘 (lucide-react) | 색상 |
|----------|----------------------|------|
| 안전 | `ShieldCheck` | `grade-safe` |
| 주의 | `AlertTriangle` | `grade-caution` |
| 위험 | `AlertOctagon` | `grade-danger` |
| 매우 위험 | `XCircle` | `grade-critical` |
| 신뢰도 high | `CheckCircle2` | `text-green-600` |
| 신뢰도 none | `HelpCircle` | `text-slate-400` |

---

## 6. 아이콘 (Icons)

lucide-react 사용. 크기는 `h-4 w-4` (기본) / `h-5 w-5` (강조) / `h-6 w-6` (섹션 헤더).

| 아이콘 | 용도 |
|--------|------|
| `ShieldCheck` | 전세 사기 안전 결과 |
| `ShieldAlert` | 전세 사기 위험 결과 |
| `BarChart2` | 시세 분석 섹션 |
| `Landmark` | 정책 대출 섹션 |
| `Home` | 매물 정보 |
| `AlertTriangle` | 경고·주의 메시지 |
| `TrendingUp` / `TrendingDown` | 시세 트렌드 |
| `ChevronRight` | 목록 네비게이션 |
| `Info` | 툴팁, 추가 정보 |
| `CheckCircle2` | 자격 충족 항목 |
| `XCircle` | 자격 미충족 항목 |

---

## 7. 접근성 (Accessibility)

### 색상 대비
- 최소 4.5:1 (WCAG AA) 준수
- 배지 배경/텍스트 조합은 모두 7:1 이상 (AAA)

### 색맹 대응
- 색상만으로 정보를 전달하지 않는다: 반드시 텍스트 레이블 또는 아이콘 병행 표시
- 등급 배지: `<span class="badge-safe">안전</span>` — 텍스트 필수

### aria 패턴

```html
<!-- 게이지 바 -->
<div role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}
     aria-label="사기 위험도 점수">

<!-- 배지 -->
<span role="status" aria-label="전세가율 등급: 주의">주의</span>

<!-- 면책 배너 -->
<aside aria-label="법적 면책 고지">
```

### 키보드 내비게이션
- 버튼·링크: `focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:outline-none`
- 모달/드롭다운: `focus-trap` 적용 (shadcn/ui Dialog 기본 제공)
