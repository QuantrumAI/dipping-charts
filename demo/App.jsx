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
    <div style={{ width: '100%', paddingBottom: '5px' }}>
      <FullFeaturedChart
        data={data}
        height={700}
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
