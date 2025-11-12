# React에서 Dipping Charts 사용하기

React 프로젝트 (CRA, Vite, Webpack)에서 dipping-charts를 사용하는 완벽 가이드입니다.

---

## 🎯 지원 환경

- ✅ **Create React App (CRA)**
- ✅ **Vite**
- ✅ **Webpack**
- ✅ **React Router**
- ✅ **TypeScript**
- ❌ Next.js (사용 안 함)

---

## ⚡ 3단계 빠른 시작

### 1. 설치

```bash
npm install dipping-charts
```

### 2. 스크립트 설정

#### Vite 프로젝트

```bash
# 스크립트 복사
cp node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js public/
```

**index.html:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <script src="/lightweight-charts.standalone.production.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

#### Create React App

```bash
# 스크립트 복사
cp node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js public/
```

**public/index.html:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <script src="%PUBLIC_URL%/lightweight-charts.standalone.production.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### 3. 컴포넌트 사용

**기본 사용 (모든 기능 활성화):**

```jsx
import { FullFeaturedChart } from 'dipping-charts/react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Trading Chart</h1>
      <FullFeaturedChart height={700} />
    </div>
  );
}

export default App;
```

**완료! 🎉**

---

## ⚙️ Props 설정

### 모든 Props

```typescript
interface FullFeaturedChartProps {
  data?: CandleData[];           // 커스텀 데이터 (optional)
  width?: number;                 // 차트 너비 (기본: 부모 요소 너비)
  height?: number;                // 차트 높이 (기본: 600)
  className?: string;             // CSS 클래스 (optional)
  enableTimeframes?: boolean;     // 시간봉 버튼 (기본: true)
  enableIndicators?: boolean;     // 보조지표 (기본: true)
  enableDrawingTools?: boolean;   // 그리기 도구 (기본: true)
}
```

### 기능 선택하기

**모든 기능 사용 (기본):**
```jsx
<FullFeaturedChart height={700} />
```

**지표만 사용:**
```jsx
<FullFeaturedChart
  height={700}
  enableTimeframes={false}
  enableDrawingTools={false}
/>
```

**그리기 도구만 사용:**
```jsx
<FullFeaturedChart
  height={700}
  enableTimeframes={false}
  enableIndicators={false}
/>
```

**최소 기능 (차트만):**
```jsx
<FullFeaturedChart
  height={700}
  enableTimeframes={false}
  enableIndicators={false}
  enableDrawingTools={false}
/>
```

---

## 📦 사용 예제

### 예제 1: 기본 사용 (Mock 데이터)

```jsx
import { FullFeaturedChart } from 'dipping-charts/react';

function BasicChart() {
  return <FullFeaturedChart height={600} />;
}
```

### 예제 2: 커스텀 데이터

```jsx
import { useState } from 'react';
import { FullFeaturedChart } from 'dipping-charts/react';

function CustomDataChart() {
  const [data] = useState([
    {
      time: 1699920000,
      open: 150,
      high: 155,
      low: 148,
      close: 153,
      volume: 1000000,
    },
    // ... 더 많은 데이터
  ]);

  return <FullFeaturedChart data={data} height={600} />;
}
```

### 예제 3: API 데이터 연동

```jsx
import { useState, useEffect } from 'react';
import { FullFeaturedChart } from 'dipping-charts/react';

function APIChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/market/candles');
        const json = await response.json();

        const candles = json.map(item => ({
          time: item.timestamp,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume),
        }));

        setData(candles);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <FullFeaturedChart data={data} height={600} />;
}
```

### 예제 4: React Router 통합

```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FullFeaturedChart } from 'dipping-charts/react';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<ChartPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function ChartPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Trading Chart</h1>
      <FullFeaturedChart height={600} />
    </div>
  );
}
```

### 예제 5: TypeScript

```tsx
import { useState, useEffect } from 'react';
import { FullFeaturedChart } from 'dipping-charts/react';
import type { CandleData } from 'dipping-charts';

interface ChartPageProps {
  symbol: string;
}

function ChartPage({ symbol }: ChartPageProps) {
  const [data, setData] = useState<CandleData[]>([]);

  useEffect(() => {
    fetch(`/api/candles/${symbol}`)
      .then(res => res.json())
      .then(setData);
  }, [symbol]);

  return (
    <div>
      <h1>{symbol} Chart</h1>
      <FullFeaturedChart data={data} height={600} />
    </div>
  );
}
```

### 예제 6: WebSocket 실시간 데이터

```jsx
import { useState, useEffect } from 'react';
import { FullFeaturedChart } from 'dipping-charts/react';

function RealtimeChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/market/stream');

    ws.onmessage = (event) => {
      const candle = JSON.parse(event.data);
      setData(prev => [...prev, {
        time: candle.timestamp,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }]);
    };

    return () => ws.close();
  }, []);

  return <FullFeaturedChart data={data} height={600} />;
}
```

---

## 🎨 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CandleData[]` | `undefined` | 캔들 데이터 배열. 없으면 mock 데이터 생성 |
| `width` | `number` | `undefined` | 차트 너비 (px). 없으면 100% |
| `height` | `number` | `600` | 차트 높이 (px) |
| `className` | `string` | `''` | 추가 CSS 클래스 |
| `enableTimeframes` | `boolean` | `true` | 타임프레임 선택 UI 표시 |
| `enableIndicators` | `boolean` | `true` | 지표 추가 UI 표시 |
| `enableDrawingTools` | `boolean` | `true` | 그리기 도구 UI 표시 |

### CandleData 타입

```typescript
interface CandleData {
  time: number | string;  // Unix timestamp (초) 또는 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

---

## 📊 포함된 모든 기능

### 타임프레임 (6가지)
- 1분, 5분, 1시간, 일, 주, 월
- 클릭으로 즉시 변경
- 타임프레임별 mock 데이터 자동 생성

### 기술적 지표 (5종)

#### SMA / EMA
- 다중 기간 설정 (기본: 5, 20, 60, 120)
- 각 기간별 색상, 두께, 소스 선택
- 기간 추가/삭제 버튼

#### RSI
- 색상 선택
- 기간 설정

#### MACD
- Line/Signal 색상 각각 설정
- Fast/Slow/Signal 파라미터

#### Bollinger Bands
- Upper/Middle/Lower 색상 각각 설정
- 기간, 표준편차, 두께

#### 32색 팔레트
- 8x4 그리드
- 호버 효과
- 클릭으로 즉시 적용

### 그리기 도구 (6종)
- 추세선, 수평선, 수직선, 사각형, 피보나치, 텍스트

### 컨텍스트 메뉴 (완전 기능)
- ✅ 선 두께 조절 (±버튼, 1-10)
- ✅ 색상 선택 (7색 팔레트)
- ✅ **드래그 이동** (마우스로 메뉴 이동)
- ✅ 텍스트 편집 버튼
- ✅ 삭제 버튼
- ✅ **자동 표시**: 그리기 완료 시 자동으로 메뉴 표시

### 특별 기능
- **Shift + 마우스**: High/Low 가격에 자동 스냅 + 시각적 피드백
- **우클릭**: 선택된 도구의 컨텍스트 메뉴 표시
- **더블클릭**: 텍스트 도구 편집
- **ESC 키**: 그리기 취소 또는 선택 해제
- **Outside click**: 드롭다운/메뉴 자동 닫기

---

## 🐛 트러블슈팅

### "LightweightCharts is not defined"

**문제**: 스크립트가 로드되지 않음

**해결**:
1. index.html에 스크립트 태그가 있는지 확인
2. Vite: public/ 폴더에 스크립트 복사했는지 확인
3. CRA: `%PUBLIC_URL%` 경로가 맞는지 확인
4. 브라우저 개발자 도구 Console에서 에러 확인

### 차트가 렌더링되지 않음

**문제**: 부모 요소에 height가 없음

**해결**:

```jsx
// ❌ 틀림
<div>
  <FullFeaturedChart height={600} />
</div>

// ✅ 맞음
<div style={{ height: '600px' }}>
  <FullFeaturedChart height={600} />
</div>
```

### TypeScript 에러

**문제**: 타입 정의가 없음

**해결**:

```bash
npm install --save-dev @types/react @types/react-dom
```

### Vite에서 스크립트 경로 오류

**문제**: `/node_modules/...` 경로가 작동하지 않음

**해결**: 스크립트를 public/ 폴더로 복사

```bash
cp node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js public/
```

그리고 index.html:

```html
<script src="/lightweight-charts.standalone.production.js"></script>
```

---

## 💡 유용한 팁

### 1. Mock 데이터 비활성화

```jsx
// Mock 데이터 사용 (data prop 없음)
<FullFeaturedChart height={600} />

// Mock 데이터 비활성화 (빈 배열 전달)
<FullFeaturedChart data={[]} height={600} />
```

### 2. UI 요소 선택적 표시

```jsx
// 지표만 표시
<FullFeaturedChart
  enableTimeframes={false}
  enableIndicators={true}
  enableDrawingTools={false}
  height={600}
/>

// 그리기 도구만 표시
<FullFeaturedChart
  enableTimeframes={false}
  enableIndicators={false}
  enableDrawingTools={true}
  height={600}
/>
```

### 3. 커스텀 스타일

```jsx
import './custom-chart-styles.css'; // 커스텀 스타일로 오버라이드

<FullFeaturedChart
  className="my-custom-chart"
  height={600}
/>
```

### 4. 다중 차트

```jsx
function MultiChartPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <FullFeaturedChart height={400} />
      <FullFeaturedChart height={400} />
    </div>
  );
}
```

### 5. 반응형 높이

```jsx
function ResponsiveChart() {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight * 0.7);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <FullFeaturedChart height={height} />;
}
```

---

## 📚 관련 문서

- [README.md](../README.md) - 메인 README
- [INDICATORS.md](./INDICATORS.md) - 기술적 지표 가이드
- [LINE_TOOLS.md](./LINE_TOOLS.md) - 그리기 도구 가이드

---

© 2025 Quantrum AI (https://quantrumai.com/)
