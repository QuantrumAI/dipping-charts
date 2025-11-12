# Dipping Charts

Dipping 자체 구현 차트 라이브러리 - 기술적 지표 및 그리기 도구를 포함한 주식 차트 분석 도구입니다.

---

## ⚡ 2단계로 즉시 실행

```bash
# 1. 설치
npm install

# 2. 실행
npm run demo
```

**끝! 브라우저가 자동으로 열립니다!** 🎉

---

## ✨ 주요 기능

### 📈 타임프레임 (6가지)
1분 | 5분 | 1시간 | 일 | 주 | 월

### 📊 기술적 지표 (5종)
- **SMA/EMA**: 단순/지수이동평균 - 다중 기간, 색상, 두께
- **RSI**: 상대강도지수 - 14 기간
- **MACD**: 이동평균수렴확산 - Fast/Slow/Signal
- **Bollinger Bands**: 볼린저 밴드 - 상/중/하단

### ✏️ 그리기 도구 (6종)
추세선 | 수평선 | 수직선 | 사각형 | 피보나치 | 텍스트

### 🎯 특별 기능
- ✅ **Shift + 마우스**: High/Low 자동 스냅
- ✅ **우클릭**: 컨텍스트 메뉴 (색상, 두께 조절)
- ✅ **더블클릭**: 텍스트 편집
- ✅ **32색 팔레트**: 모든 지표/도구
- ✅ **ESC 키**: 취소/해제

---

## 🚀 사용 방법

### 방법 1: React 프로젝트 (권장 ⭐⭐⭐)

**2줄로 모든 기능 사용!** (CSS 자동 포함)

```jsx
import { FullFeaturedChart } from 'dipping-charts/react';

function App() {
  return <FullFeaturedChart height={700} />;
}
```

**Props로 기능 선택:**

```jsx
<FullFeaturedChart
  height={700}
  enableTimeframes={true}      // 시간봉 버튼 (기본: true)
  enableIndicators={true}       // 보조지표 (기본: true)
  enableDrawingTools={true}     // 그리기 도구 (기본: true)
/>

// 예: 지표만 사용하고 싶을 때
<FullFeaturedChart
  height={700}
  enableTimeframes={false}
  enableDrawingTools={false}
/>
```

**설정 필요:**

스크립트를 public/ 폴더로 복사:

```bash
# Vite 또는 CRA 모두 동일
cp node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js public/
```

그리고 index.html에 추가:

```html
<!-- Vite: public/index.html -->
<script src="/lightweight-charts.standalone.production.js"></script>

<!-- CRA: public/index.html -->
<script src="%PUBLIC_URL%/lightweight-charts.standalone.production.js"></script>
```

> 📖 **완벽 가이드**: [docs/REACT.md](./docs/REACT.md)

---

### 방법 2: HTML 프로젝트

**5분만에 시작!**

#### STEP 1: 설치
```bash
npm install dipping-charts
```

#### STEP 2: HTML 작성
```html
<!DOCTYPE html>
<html>
<head>
  <!-- CSS 3개 -->
  <link rel="stylesheet" href="./node_modules/dipping-charts/examples/css/base.css">
  <link rel="stylesheet" href="./node_modules/dipping-charts/examples/css/chart.css">
  <link rel="stylesheet" href="./node_modules/dipping-charts/examples/css/indicators.css">
</head>
<body>
  <div id="app"></div>

  <!-- LightweightCharts (line-tools 포함) -->
  <script src="./node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js"></script>

  <!-- 지표 함수 -->
  <script src="./node_modules/dipping-charts/examples/js/indicators.js"></script>

  <!-- examples JavaScript -->
  <script type="module" src="./node_modules/dipping-charts/examples/js/chart.js"></script>
  <script type="module" src="./node_modules/dipping-charts/examples/js/ui.js"></script>
  <script type="module" src="./node_modules/dipping-charts/examples/js/main.js"></script>
</body>
</html>
```

**끝! 모든 기능 자동 동작!** 🎉

> 📄 **예제 파일**: [examples/index.html](./examples/index.html)

#### 커스텀 데이터 사용

```javascript
// 차트 준비 후
setTimeout(() => {
  const myData = [
    { time: 1699920000, open: 150, high: 155, low: 148, close: 153, volume: 1000000 },
    // ...
  ];

  window.currentCandles = myData;
  window.candleSeries.setData(myData.map(c => ({
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
  })));
  window.volumeSeries.setData(myData.map(c => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? '#ef444466' : '#3b82f666'
  })));
  window.chart.timeScale().fitContent();
}, 1000);
```

---

## 📚 문서

### 사용 가이드
- **[docs/REACT.md](./docs/REACT.md)** - React 완벽 가이드 (CRA, Vite, Webpack, TypeScript)

### 기능 가이드
- **[docs/INDICATORS.md](./docs/INDICATORS.md)** - 5가지 기술적 지표 상세 가이드
- **[docs/LINE_TOOLS.md](./docs/LINE_TOOLS.md)** - 6가지 그리기 도구 상세 가이드

---

## 📁 프로젝트 구조

```
dipping-charts/
├── demo/                  # React 데모 앱
│   ├── index.html
│   ├── main.jsx
│   └── App.jsx
├── src/
│   ├── react/            # React 컴포넌트
│   │   ├── FullFeaturedChart.tsx
│   │   ├── FullFeaturedChart.css
│   │   ├── components/
│   │   └── hooks/
│   ├── indicators/       # 기술적 지표 (TypeScript)
│   ├── components/       # TradingChart
│   └── types/
├── examples/             # HTML 예제
│   ├── index.html
│   ├── css/
│   └── js/
├── lib/                  # LightweightCharts standalone
└── docs/                 # 문서
```

---

## 🛠️ 명령어

```bash
# 데모 실행
npm run demo

# 라이브러리 빌드
npm run build

# 타입 체크
npm run type-check
```

---

## 💡 주요 특징

- ✅ **React 완벽 지원** - CRA, Vite, Webpack에서 바로 사용
- ✅ **TypeScript 지원** - 타입 안전성과 자동완성
- ✅ **HTML 간편 사용** - examples 복사만으로 즉시 사용
- ✅ **모든 기능 포함** - 지표, 그리기 도구, 타임프레임
- ✅ **인터랙티브** - 우클릭 메뉴, Shift Snap, ESC 키
- ✅ **확장 가능** - 새로운 지표/도구 추가 용이

---

## 📄 라이선스

Apache License 2.0 (lightweight-charts)

---

## 🙏 감사의 말

- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
- [s-stolz/algotrader](https://github.com/s-stolz/algotrader) - 기술적 지표
- [difurious/lightweight-charts-line-tools](https://github.com/difurious/lightweight-charts-line-tools) - 그리기 도구

---

© 2025 Quantrum AI (https://quantrumai.com/)
