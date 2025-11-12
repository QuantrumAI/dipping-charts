# Line Tools 가이드

Tradingview-lib는 [lightweight-charts-line-tools](https://github.com/difurious/lightweight-charts-line-tools)를 기반으로 하여 19가지 인터랙티브 그리기 도구를 제공합니다.

## 기반 버전

- **lightweight-charts 3.8.0** (line-tools 버전)
- 원본 lightweight-charts의 모든 기능 + 19가지 그리기 도구

## 사용 가능한 Line Tools

### 1. 기본 선 도구
- **TrendLine** - 추세선
- **HorizontalLine** - 수평선
- **VerticalLine** - 수직선
- **Ray** - 레이 (한쪽으로 무한 연장)
- **HorizontalRay** - 수평 레이
- **ExtendedLine** - 확장선 (양쪽으로 무한 연장)

### 2. 도형 도구
- **Rectangle** - 사각형
- **Circle** - 원
- **Triangle** - 삼각형

### 3. 채널 및 범위 도구
- **ParallelChannel** - 평행 채널
- **PriceRange** - 가격 범위

### 4. 피보나치 도구
- **FibRetracement** - 피보나치 되돌림

### 5. 주석 도구
- **Arrow** - 화살표
- **Text** - 텍스트 라벨
- **Callout** - 콜아웃

### 6. 강조 도구
- **Brush** - 브러시
- **Highlighter** - 하이라이터
- **Path** - 자유 경로
- **CrossLine** - 십자선

## 사용 방법

### 기본 사용법

```javascript
// Line Tool 추가 (사용자가 차트에서 그리기 시작)
chart.addLineTool('TrendLine', [], {});

// 특정 위치에 Line Tool 추가
const point1 = { price: 100, timestamp: Date.parse('2019-04-11') };
const point2 = { price: 120, timestamp: Date.parse('2019-04-15') };
chart.addLineTool('TrendLine', [point1, point2], {
  line: {
    color: 'blue',
    width: 2,
  }
});
```

### Export / Import

```javascript
// 모든 Line Tools를 JSON으로 내보내기
const savedTools = chart.exportLineTools();
localStorage.setItem('lineTools', savedTools);

// JSON에서 불러오기
const savedTools = localStorage.getItem('lineTools');
chart.importLineTools(savedTools);
```

### 삭제

```javascript
// 선택된 Line Tool 삭제
chart.removeSelectedLineTools();

// 모든 Line Tools 삭제
chart.removeAllLineTools();

// 특정 ID의 Line Tools 삭제
chart.removeLineToolsById(['id1', 'id2', 'id3']);
```

### 이벤트 구독

```javascript
// Line Tool 더블클릭 이벤트
chart.subscribeLineToolsDoubleClick((params) => {
  console.log('Double clicked:', params);
});

// Line Tool 편집 완료 이벤트
chart.subscribeLineToolsAfterEdit((params) => {
  console.log('Edited:', params);
  // params.stage: 'lineToolFinished', 'lineToolEdited', 'pathFinished'
  // params.selectedLineTool: 편집된 Line Tool 데이터
});

// 구독 해제
chart.unsubscribeLineToolsDoubleClick(callback);
chart.unsubscribeLineToolsAfterEdit(callback);
```

### 선택된 Line Tool 가져오기

```javascript
const selectedTool = chart.getSelectedLineTools();
console.log(selectedTool);
```

### Line Tool 옵션 적용

```javascript
const options = {
  id: 'tool-id',
  toolType: 'TrendLine',
  options: {
    line: {
      color: 'red',
      width: 3,
    }
  },
  points: [point1, point2]
};

chart.applyLineToolOptions(options);
```

## 특별 기능

### Shift 키로 수평 고정

다음 도구들은 **Shift 키를 누른 채로 그리면** 수평으로 고정됩니다:
- ParallelChannel
- TrendLine
- Arrow
- ExtendedLine
- Ray
- Rectangle
- FibRetracement

### 옵션 예제

```javascript
// 수평선 옵션
const horizontalLineOptions = {
  text: {
    value: "Support Level",
    alignment: "left",
    font: {
      color: "rgba(41,98,255,1)",
      size: 20,
      bold: false,
      italic: false,
      family: "Arial"
    },
    box: {
      alignment: {
        vertical: "top",
        horizontal: "left"
      }
    }
  },
  line: {
    color: "rgba(41,98,255,1)",
    width: 2,
    style: 0 // 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed, 4=SparseDotted
  }
};

chart.addLineTool('HorizontalLine', [point], horizontalLineOptions);
```

## Demo

`examples/index.html`을 브라우저에서 열어 모든 기능을 테스트할 수 있습니다:

```bash
# 방법 1: 직접 열기
open examples/index.html

# 방법 2: 로컬 서버 (권장)
cd examples
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 알려진 제약사항

1. **버전**: lightweight-charts 3.8.0 기반 (최신 버전은 5.x)
2. **첫 데이터 포인트 왼쪽**: 일부 도구는 데이터 시작점 왼쪽에서 작동하지 않을 수 있음
3. **Circle 도구**: 두 번째 점이 첫 번째 점 왼쪽에 있고 화면을 오른쪽으로 패닝하면 원이 사라질 수 있음
4. **미사용 옵션**: `angle`, `scale`, `cap`, `join` 옵션은 현재 작동하지 않음

## 원본 프로젝트

이 기능은 [difurious/lightweight-charts-line-tools](https://github.com/difurious/lightweight-charts-line-tools)의 훌륭한 작업을 기반으로 합니다.

### 감사의 말

- **randalhsu**: Sync crosshairs, draggable 기능
- **iosiftalmacel**: 초기 line tools 코드
- **shinobaki**: lightweight-charts 3.8.0 병합
- **difurious**: 추가 line tools 및 개선
