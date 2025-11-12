// Import indicators from built library
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateCurrencyStrength
} from '../../dist/indicators/index.js';

// Export for use in other modules
export {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateCurrencyStrength
};

// Make available globally for backward compatibility
window.calculateSMA = calculateSMA;
window.calculateEMA = calculateEMA;
window.calculateRSI = calculateRSI;
window.calculateMACD = calculateMACD;
window.calculateBollingerBands = calculateBollingerBands;
window.calculateCurrencyStrength = calculateCurrencyStrength;
