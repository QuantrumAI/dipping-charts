import { useState, useCallback } from 'react';
import { FullFeaturedChart } from 'dipping-charts/react';
import { generateMockCandles } from 'dipping-charts';

function App() {
  const [timeframe, setTimeframe] = useState('5m');
  const [data, setData] = useState(() => generateMockCandles('5m', 200, 150));

  const handleTimeframeChange = useCallback((tf) => {
    setTimeframe(tf);
    setData(generateMockCandles(tf, 200, 150));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: '#e0e0e0' }}>
          dipping-charts
          <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 8 }}>v0.1.0</span>
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
          Financial charting library with 9 indicators, 6 drawing tools, and realtime updates.
          {' '}
          <a href="https://github.com/QuantrumAI/dipping-charts" style={{ color: '#5b9cf6' }}>
            GitHub
          </a>
          {' | '}
          <a href="https://www.npmjs.com/package/dipping-charts" style={{ color: '#5b9cf6' }}>
            npm
          </a>
        </p>
      </div>
      <FullFeaturedChart
        data={data}
        height={650}
        defaultTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        enableTimeframes={true}
        enableIndicators={true}
        enableDrawingTools={true}
      />
    </div>
  );
}

export default App;
