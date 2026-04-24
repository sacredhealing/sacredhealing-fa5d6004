function ema(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let value = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) value = prices[i] * k + value * (1 - k);
  return value;
}

function rsi(prices, period) {
  period = period || 14;
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    diff > 0 ? (gains += diff) : (losses -= diff);
  }
  const rs = gains / (losses || 0.0001);
  return 100 - 100 / (1 + rs);
}

function macd(prices) {
  const fast = ema(prices, 12), slow = ema(prices, 26), line = fast - slow;
  const macdHistory = [];
  for (let i = Math.max(0, prices.length - 35); i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    if (slice.length >= 26) macdHistory.push(ema(slice, 12) - ema(slice, 26));
  }
  const signal = macdHistory.length >= 9 ? ema(macdHistory, 9) : line;
  return { line, signal, histogram: line - signal };
}

function bollingerBands(prices, period, multiplier) {
  period = period || 20; multiplier = multiplier || 2;
  if (prices.length < period) {
    const last = prices[prices.length - 1];
    return { upper: last * 1.02, middle: last, lower: last * 0.98 };
  }
  const slice = prices.slice(-period);
  const mean  = slice.reduce((a, b) => a + b, 0) / period;
  const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  return { upper: mean + multiplier * std, middle: mean, lower: mean - multiplier * std };
}

function generateSignal(prices, strategy) {
  strategy = strategy || 'scalp';
  if (prices.length < 30) return { action: 'HOLD', confidence: 0, reason: 'Insufficient data', indicators: {} };
  const rsiVal = rsi(prices), ema9 = ema(prices, 9), ema21 = ema(prices, 21);
  const bb = bollingerBands(prices);
  const { line: macdLine, histogram } = macd(prices);
  const cur = prices[prices.length - 1];
  let action = 'HOLD', confidence = 0, reason = '';

  if (strategy === 'scalp') {
    if (rsiVal < 32 && cur <= bb.lower * 1.002) { action = 'BUY'; confidence = 0.70 + (32 - rsiVal) / 100; reason = 'RSI ' + rsiVal.toFixed(1) + ' oversold + BB lower'; }
    else if (rsiVal > 68 && cur >= bb.upper * 0.998) { action = 'SELL'; confidence = 0.70 + (rsiVal - 68) / 100; reason = 'RSI ' + rsiVal.toFixed(1) + ' overbought + BB upper'; }
  } else if (strategy === 'trend') {
    const pe9 = ema(prices.slice(0,-1),9), pe21 = ema(prices.slice(0,-1),21);
    if (pe9 < pe21 && ema9 > ema21 && histogram > 0) { action = 'BUY'; confidence = 0.75; reason = 'EMA9 crossed above EMA21 | MACD bullish'; }
    else if (pe9 > pe21 && ema9 < ema21 && histogram < 0) { action = 'SELL'; confidence = 0.75; reason = 'EMA9 crossed below EMA21 | MACD bearish'; }
  } else if (strategy === 'compound') {
    let bull = 0, bear = 0;
    if (rsiVal < 40) bull++; if (rsiVal > 60) bear++;
    if (ema9 > ema21) bull++; else bear++;
    if (histogram > 0) bull++; else bear++;
    if (cur < bb.middle) bull++; else bear++;
    if (bull >= 3) { action = 'BUY'; confidence = 0.60 + bull * 0.08; reason = bull + '/4 indicators bullish'; }
    else if (bear >= 3) { action = 'SELL'; confidence = 0.60 + bear * 0.08; reason = bear + '/4 indicators bearish'; }
  }

  return { action, confidence: Math.min(confidence, 0.95), reason, indicators: { rsi: rsiVal, ema9, ema21, macd: macdLine, bb, price: cur } };
}

module.exports = { ema, rsi, macd, bollingerBands, generateSignal };
