/**
 * 지표 정확도 검증 테스트
 * 수동으로 계산한 기대값과 실제 출력을 비교합니다.
 */
import { describe, it, expect } from 'vitest';
import { calculateStochastic } from '../indicators/stochastic';
import { calculateATR } from '../indicators/atr';
import { calculateVWAP } from '../indicators/vwap';
import { calculateWilliamsR } from '../indicators/williamsR';
import type { CandleData } from '../types';

// H, L, C, V를 개별 지정하는 헬퍼
function hlc(
  data: { h: number; l: number; c: number; v?: number }[],
  baseTime = 1000,
): CandleData[] {
  return data.map((d, i) => ({
    time: baseTime + i * 60,
    open: d.c,
    high: d.h,
    low: d.l,
    close: d.c,
    volume: d.v ?? 1000,
  }));
}

// =============================================
// Stochastic — 손 계산 검증
// =============================================
describe('Stochastic 정확도', () => {
  /**
   * kPeriod=3, smooth=1, dPeriod=2
   *
   * 캔들:
   *   i=0: H=12, L=8,  C=10
   *   i=1: H=14, L=9,  C=11
   *   i=2: H=15, L=10, C=13
   *   i=3: H=13, L=8,  C=9
   *   i=4: H=16, L=11, C=15
   *
   * Fast %K (lookback=3):
   *   i=2: HH=max(12,14,15)=15, LL=min(8,9,10)=8  → (13-8)/(15-8)*100 = 5/7*100 ≈ 71.4286
   *   i=3: HH=max(14,15,13)=15, LL=min(9,10,8)=8  → (9-8)/(15-8)*100  = 1/7*100 ≈ 14.2857
   *   i=4: HH=max(15,13,16)=16, LL=min(10,8,11)=8 → (15-8)/(16-8)*100 = 7/8*100 = 87.5
   *
   * smooth=1 이므로 %K = Fast %K 그대로
   *   %K = [71.4286, 14.2857, 87.5]
   *
   * %D = SMA(%K, 2):
   *   d[0] = (71.4286 + 14.2857) / 2 = 42.8571
   *   d[1] = (14.2857 + 87.5) / 2   = 50.8929
   */
  it('kPeriod=3, smooth=1, dPeriod=2 손 계산 결과 일치', () => {
    const candles = hlc([
      { h: 12, l: 8, c: 10 },
      { h: 14, l: 9, c: 11 },
      { h: 15, l: 10, c: 13 },
      { h: 13, l: 8, c: 9 },
      { h: 16, l: 11, c: 15 },
    ]);
    const result = calculateStochastic(candles, { kPeriod: 3, dPeriod: 2, smooth: 1 });

    // %K 길이 = fastK개수(3) - smooth + 1 = 3 - 1 + 1 = 3
    expect(result.k).toHaveLength(3);
    expect(result.k[0].value).toBeCloseTo(71.4286, 3);
    expect(result.k[1].value).toBeCloseTo(14.2857, 3);
    expect(result.k[2].value).toBeCloseTo(87.5, 3);

    // %D 길이 = kValues개수(3) - dPeriod + 1 = 3 - 2 + 1 = 2
    expect(result.d).toHaveLength(2);
    expect(result.d[0].value).toBeCloseTo(42.8571, 3);
    expect(result.d[1].value).toBeCloseTo(50.8929, 3);
  });

  /**
   * smooth=3 테스트
   * kPeriod=3, smooth=3, dPeriod=2, 캔들 7개
   *
   *   i=0: H=12, L=8,  C=10
   *   i=1: H=14, L=9,  C=11
   *   i=2: H=15, L=10, C=13
   *   i=3: H=13, L=8,  C=9
   *   i=4: H=16, L=11, C=15
   *   i=5: H=14, L=10, C=12
   *   i=6: H=18, L=12, C=17
   *
   * Fast %K:
   *   i=2: (13-8)/(15-8)*100    = 71.4286
   *   i=3: (9-8)/(15-8)*100     = 14.2857
   *   i=4: (15-8)/(16-8)*100    = 87.5
   *   i=5: (12-8)/(16-8)*100    = 50.0      (HH=max(13,16,14)=16, LL=min(8,11,10)=8)
   *   i=6: (17-10)/(18-10)*100  = 87.5      (HH=max(16,14,18)=18, LL=min(11,10,12)=10)
   *
   * %K = SMA(fastK, 3):
   *   k[0] = (71.4286 + 14.2857 + 87.5) / 3     = 57.7381
   *   k[1] = (14.2857 + 87.5 + 50.0) / 3         = 50.5952
   *   k[2] = (87.5 + 50.0 + 87.5) / 3             = 75.0
   *
   * %D = SMA(%K, 2):
   *   d[0] = (57.7381 + 50.5952) / 2 = 54.1667
   *   d[1] = (50.5952 + 75.0) / 2    = 62.7976
   */
  it('kPeriod=3, smooth=3, dPeriod=2 스무딩 적용 검증', () => {
    const candles = hlc([
      { h: 12, l: 8, c: 10 },
      { h: 14, l: 9, c: 11 },
      { h: 15, l: 10, c: 13 },
      { h: 13, l: 8, c: 9 },
      { h: 16, l: 11, c: 15 },
      { h: 14, l: 10, c: 12 },
      { h: 18, l: 12, c: 17 },
    ]);
    const result = calculateStochastic(candles, { kPeriod: 3, dPeriod: 2, smooth: 3 });

    expect(result.k).toHaveLength(3);
    expect(result.k[0].value).toBeCloseTo(57.7381, 3);
    expect(result.k[1].value).toBeCloseTo(50.5952, 3);
    expect(result.k[2].value).toBeCloseTo(75.0, 3);

    expect(result.d).toHaveLength(2);
    expect(result.d[0].value).toBeCloseTo(54.1667, 3);
    expect(result.d[1].value).toBeCloseTo(62.7976, 3);
  });

  it('range=0 (HH==LL) 일 때 50 반환', () => {
    const candles = hlc([
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
    ]);
    const result = calculateStochastic(candles, { kPeriod: 3, dPeriod: 1, smooth: 1 });
    expect(result.k[0].value).toBe(50);
  });

  it('타임스탬프가 올바른 캔들에 매핑됨', () => {
    const candles = hlc([
      { h: 12, l: 8, c: 10 },
      { h: 14, l: 9, c: 11 },
      { h: 15, l: 10, c: 13 },
      { h: 13, l: 8, c: 9 },
      { h: 16, l: 11, c: 15 },
    ], 5000);
    const result = calculateStochastic(candles, { kPeriod: 3, dPeriod: 2, smooth: 1 });

    // %K[0]은 i=2 캔들 → time=5000+2*60=5120
    expect(result.k[0].time).toBe(5120);
    // %D[0]은 %K[0..1]의 SMA → i=3 캔들 시간 → 5180
    expect(result.d[0].time).toBe(5180);
  });
});

// =============================================
// ATR — 손 계산 검증
// =============================================
describe('ATR 정확도', () => {
  /**
   * period=3, 캔들 5개
   *
   *   i=0: H=110, L=90,  C=100
   *   i=1: H=115, L=95,  C=105
   *   i=2: H=108, L=88,  C=95
   *   i=3: H=120, L=100, C=115
   *   i=4: H=105, L=85,  C=90
   *
   * TR (index 1부터):
   *   i=1: max(115-95, |115-100|, |95-100|) = max(20, 15, 5) = 20
   *   i=2: max(108-88, |108-105|, |88-105|) = max(20, 3, 17) = 20
   *   i=3: max(120-100, |120-95|, |100-95|) = max(20, 25, 5) = 25
   *   i=4: max(105-85, |105-115|, |85-115|) = max(20, 10, 30) = 30
   *
   * First ATR = SMA(TR[0..2], 3) = (20+20+25)/3 = 21.6667
   *   → time = candles[3].time
   *
   * Wilder RMA:
   *   ATR[1] = (21.6667 * 2 + 30) / 3 = 73.3333/3 = 24.4444
   *   → time = candles[4].time
   */
  it('period=3 손 계산 결과 일치', () => {
    const candles = hlc([
      { h: 110, l: 90, c: 100 },
      { h: 115, l: 95, c: 105 },
      { h: 108, l: 88, c: 95 },
      { h: 120, l: 100, c: 115 },
      { h: 105, l: 85, c: 90 },
    ]);
    const result = calculateATR(candles, { period: 3 });

    expect(result).toHaveLength(2);
    expect(result[0].value).toBeCloseTo(21.6667, 3);
    expect(result[0].time).toBe(candles[3].time);

    expect(result[1].value).toBeCloseTo(24.4444, 3);
    expect(result[1].time).toBe(candles[4].time);
  });

  /**
   * gap-up 시나리오: prevClose 대비 갭이 큰 경우
   * TR은 H-prevC를 사용해야 함
   *
   *   i=0: H=100, L=90,  C=95
   *   i=1: H=150, L=140, C=145   ← 큰 갭 업
   *
   * TR[0] = max(150-140, |150-95|, |140-95|) = max(10, 55, 45) = 55
   * H-L=10 이지만, H-prevC=55가 더 큼 → 갭 반영 확인
   */
  it('갭 업/다운 시 TR에 |H-prevC| 또는 |L-prevC| 반영', () => {
    const candles = hlc([
      { h: 100, l: 90, c: 95 },
      { h: 150, l: 140, c: 145 },
      { h: 155, l: 142, c: 148 },
      { h: 160, l: 145, c: 155 },
    ]);
    const result = calculateATR(candles, { period: 2 });

    // TR[0] = max(10, 55, 45) = 55   (i=1)
    // TR[1] = max(13, 10, 3)  = 13   (i=2, prevC=145)
    // TR[2] = max(15, 12, 3)  = 15   (i=3, prevC=148)
    // First ATR = (55 + 13) / 2 = 34
    // Next ATR = (34 * 1 + 15) / 2 = 24.5
    expect(result).toHaveLength(2);
    expect(result[0].value).toBeCloseTo(34.0, 3);
    expect(result[1].value).toBeCloseTo(24.5, 3);
  });

  it('Wilder RMA 수렴 특성: 일정 TR이면 ATR이 TR로 수렴', () => {
    // 모든 캔들 H-L=20, 갭 없음 → TR=20 고정
    // ATR은 결국 20으로 수렴해야 함
    const candles = hlc(
      Array.from({ length: 30 }, (_, i) => ({
        h: 110 + i,
        l: 90 + i,
        c: 100 + i,
      })),
    );
    const result = calculateATR(candles, { period: 5 });

    // 마지막 ATR은 20에 매우 가까워야 함
    const lastATR = result[result.length - 1].value;
    expect(lastATR).toBeCloseTo(20, 1);
  });
});

// =============================================
// VWAP — 손 계산 검증
// =============================================
describe('VWAP 정확도', () => {
  /**
   * 캔들 3개:
   *   i=0: H=110, L=90,  C=100, V=2000  → TP=(110+90+100)/3=100
   *   i=1: H=220, L=180, C=200, V=3000  → TP=(220+180+200)/3=200
   *   i=2: H=165, L=135, C=150, V=5000  → TP=(165+135+150)/3=150
   *
   * VWAP 계산:
   *   i=0: cumTPV=100*2000=200000, cumVol=2000 → VWAP=100
   *   i=1: cumTPV=200000+200*3000=800000, cumVol=5000 → VWAP=160
   *   i=2: cumTPV=800000+150*5000=1550000, cumVol=10000 → VWAP=155
   */
  it('3개 캔들 손 계산 결과 일치', () => {
    const candles = hlc([
      { h: 110, l: 90, c: 100, v: 2000 },
      { h: 220, l: 180, c: 200, v: 3000 },
      { h: 165, l: 135, c: 150, v: 5000 },
    ]);
    const result = calculateVWAP(candles);

    expect(result).toHaveLength(3);
    expect(result[0].value).toBeCloseTo(100.0, 4);
    expect(result[1].value).toBeCloseTo(160.0, 4);
    expect(result[2].value).toBeCloseTo(155.0, 4);
  });

  it('볼륨이 매우 큰 캔들 쪽으로 VWAP 가중', () => {
    const candles = hlc([
      { h: 110, l: 90, c: 100, v: 1 },        // TP=100, negligible volume
      { h: 310, l: 290, c: 300, v: 1000000 },  // TP=300, massive volume
    ]);
    const result = calculateVWAP(candles);

    // VWAP ≈ (100*1 + 300*1000000) / (1+1000000) ≈ 300
    expect(result[1].value).toBeCloseTo(300.0, 0);
  });

  it('볼륨=0 캔들은 건너뜀', () => {
    const candles = hlc([
      { h: 110, l: 90, c: 100, v: 0 },
      { h: 210, l: 190, c: 200, v: 1000 },
    ]);
    const result = calculateVWAP(candles);

    // 첫 캔들 cumVol=0이므로 skip → 결과는 1개
    expect(result).toHaveLength(1);
    // TP = (210+190+200)/3 = 200
    expect(result[0].value).toBeCloseTo(200.0, 4);
  });
});

// =============================================
// Williams %R — 손 계산 검증
// =============================================
describe('Williams %R 정확도', () => {
  /**
   * period=3, 캔들 5개
   *
   *   i=0: H=12, L=8,  C=10
   *   i=1: H=14, L=9,  C=11
   *   i=2: H=15, L=10, C=13
   *   i=3: H=13, L=8,  C=9
   *   i=4: H=16, L=11, C=15
   *
   * Williams %R:
   *   i=2: HH=max(12,14,15)=15, LL=min(8,9,10)=8
   *        %R = (15-13)/(15-8)*(-100) = -2/7*100 ≈ -28.5714
   *   i=3: HH=max(14,15,13)=15, LL=min(9,10,8)=8
   *        %R = (15-9)/(15-8)*(-100) = -6/7*100 ≈ -85.7143
   *   i=4: HH=max(15,13,16)=16, LL=min(10,8,11)=8
   *        %R = (16-15)/(16-8)*(-100) = -1/8*100 = -12.5
   */
  it('period=3 손 계산 결과 일치', () => {
    const candles = hlc([
      { h: 12, l: 8, c: 10 },
      { h: 14, l: 9, c: 11 },
      { h: 15, l: 10, c: 13 },
      { h: 13, l: 8, c: 9 },
      { h: 16, l: 11, c: 15 },
    ]);
    const result = calculateWilliamsR(candles, { period: 3 });

    expect(result).toHaveLength(3);
    expect(result[0].value).toBeCloseTo(-28.5714, 3);
    expect(result[1].value).toBeCloseTo(-85.7143, 3);
    expect(result[2].value).toBeCloseTo(-12.5, 3);
  });

  it('Close=HH일 때 %R = 0 (최고가 도달)', () => {
    const candles = hlc([
      { h: 100, l: 90, c: 95 },
      { h: 110, l: 95, c: 100 },
      { h: 120, l: 100, c: 120 }, // close == HH
    ]);
    const result = calculateWilliamsR(candles, { period: 3 });
    // HH=120, LL=90 → (120-120)/(120-90)*(-100) = 0
    expect(result[0].value).toBeCloseTo(0, 4);
  });

  it('Close=LL일 때 %R = -100 (최저가 도달)', () => {
    const candles = hlc([
      { h: 120, l: 90, c: 110 },
      { h: 115, l: 85, c: 100 },
      { h: 110, l: 80, c: 80 }, // close == LL
    ]);
    const result = calculateWilliamsR(candles, { period: 3 });
    // HH=120, LL=80 → (120-80)/(120-80)*(-100) = -100
    expect(result[0].value).toBeCloseTo(-100, 4);
  });

  it('range=0일 때 -50 반환 (division by zero 방지)', () => {
    const candles = hlc([
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
    ]);
    const result = calculateWilliamsR(candles, { period: 3 });
    expect(result[0].value).toBe(-50);
  });

  it('Stochastic %K와 Williams %R의 관계: %R = %K - 100 (smooth=1일 때)', () => {
    // 이론적으로: Williams %R = Fast %K - 100
    // (단 같은 period, 같은 H/L 윈도우 사용 시)
    const candles = hlc([
      { h: 12, l: 8, c: 10 },
      { h: 14, l: 9, c: 11 },
      { h: 15, l: 10, c: 13 },
      { h: 13, l: 8, c: 9 },
      { h: 16, l: 11, c: 15 },
    ]);

    const stoch = calculateStochastic(candles, { kPeriod: 3, dPeriod: 1, smooth: 1 });
    const wr = calculateWilliamsR(candles, { period: 3 });

    // %R = -(100 - %K) = %K - 100
    expect(stoch.k).toHaveLength(wr.length);
    for (let i = 0; i < wr.length; i++) {
      expect(wr[i].value).toBeCloseTo(stoch.k[i].value - 100, 4);
    }
  });
});
