import { FullFeaturedChart } from 'dipping-charts/react';

function App() {
  return (
    <FullFeaturedChart
      height={700}
      enableTimeframes={true}
      enableIndicators={true}
      enableDrawingTools={true}
    />
  );
}

export default App;
