const RISK = {
  MAX_POSITION_PCT: 0.92, STOP_LOSS_PCT: 0.015, TAKE_PROFIT_PCT: 0.025,
  DAILY_LOSS_LIMIT: -0.15, MIN_TRADE_USD: 1.00, FEE_PCT: 0.001, MIN_BTC_AMOUNT: 0.00001,
};

class RiskManager {
  constructor() {
    this.dailyStartBalance = null;
    this.dailyPnL = 0;
    this.halted = false;
    this.openPosition = null;
    this.lastResetDate = new Date().toDateString();
  }

  resetDailyIfNeeded(balance) {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyStartBalance = balance; this.dailyPnL = 0;
      this.halted = false; this.lastResetDate = today;
      console.log('Daily reset | Balance: $' + balance.toFixed(2));
    }
    if (!this.dailyStartBalance) this.dailyStartBalance = balance;
  }

  kellySize(balance, confidence, winRate, avgWin, avgLoss) {
    winRate = winRate || 0.55; avgWin = avgWin || 0.025; avgLoss = avgLoss || 0.015;
    const edge = winRate * avgWin - (1 - winRate) * avgLoss;
    const kelly = Math.max(0, (edge / avgWin) * 0.5 * confidence);
    return Math.min(balance * kelly, balance * RISK.MAX_POSITION_PCT);
  }

  btcAmount(usdSize, price) { return Math.max(usdSize / price, RISK.MIN_BTC_AMOUNT); }

  canTrade(balance) {
    if (this.halted) { console.log('HALTED — daily loss limit hit'); return false; }
    if (balance < RISK.MIN_TRADE_USD) { console.log('Balance too low: $' + balance.toFixed(4)); return false; }
    if (this.openPosition) { console.log('Position already open'); return false; }
    return true;
  }

  openTrade(side, price, usdSize, confidence) {
    const adjusted = usdSize * (1 - RISK.FEE_PCT);
    const amount   = this.btcAmount(adjusted, price);
    const sl = side === 'buy' ? price * (1 - RISK.STOP_LOSS_PCT) : price * (1 + RISK.STOP_LOSS_PCT);
    const tp = side === 'buy' ? price * (1 + RISK.TAKE_PROFIT_PCT) : price * (1 - RISK.TAKE_PROFIT_PCT);
    this.openPosition = { side, entryPrice: price, amount, usdSize: adjusted, stopLoss: sl, takeProfit: tp, confidence, openedAt: Date.now() };
    console.log('OPEN ' + side.toUpperCase() + ' ' + amount.toFixed(6) + ' BTC @ $' + price.toFixed(2) + ' SL:$' + sl.toFixed(2) + ' TP:$' + tp.toFixed(2));
    return this.openPosition;
  }

  checkExitConditions(price) {
    if (!this.openPosition) return null;
    const pos = this.openPosition;
    let reason = null;
    if (pos.side === 'buy') { if (price <= pos.stopLoss) reason = 'STOP_LOSS'; if (price >= pos.takeProfit) reason = 'TAKE_PROFIT'; }
    else { if (price >= pos.stopLoss) reason = 'STOP_LOSS'; if (price <= pos.takeProfit) reason = 'TAKE_PROFIT'; }
    if (Date.now() - pos.openedAt > 30 * 60 * 1000) reason = 'TIMEOUT';
    return reason ? { reason, position: pos } : null;
  }

  closeTrade(exitPrice, reason) {
    if (!this.openPosition) return null;
    const pos = this.openPosition;
    const fee = exitPrice * pos.amount * RISK.FEE_PCT;
    const pnl = pos.side === 'buy' ? (exitPrice - pos.entryPrice) * pos.amount - fee : (pos.entryPrice - exitPrice) * pos.amount - fee;
    this.dailyPnL += pnl;
    const trade = { ...pos, exitPrice, exitReason: reason, pnl, pnlPct: (pnl / pos.usdSize) * 100, closedAt: Date.now(), durationMs: Date.now() - pos.openedAt };
    console.log('CLOSE ' + reason + ' PnL: ' + (pnl>=0?'+':'') + '$' + pnl.toFixed(4) + ' (' + trade.pnlPct.toFixed(2) + '%)');
    this.openPosition = null;
    if (this.dailyStartBalance && this.dailyPnL / this.dailyStartBalance <= RISK.DAILY_LOSS_LIMIT) {
      this.halted = true; console.log('DAILY LOSS LIMIT HIT — halting until tomorrow');
    }
    return trade;
  }
}

module.exports = { RiskManager, RISK };
