/**
 * BINANCE API CLIENT
 * REST: api.binance.com | WS: stream.binance.com | Pair: BTCUSDT
 */
const crypto = require('crypto');
const fetch  = require('node-fetch');
const WS     = require('ws');
const BASE_URL = 'https://api.binance.com';
const WS_BASE  = 'wss://stream.binance.com:9443/ws';
class BinanceClient {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey; this.apiSecret = apiSecret;
    this.paperMode = !apiKey || apiKey === 'PAPER';
    this.recvWindow = 5000;
  }
  _sign(q) { return crypto.createHmac('sha256', this.apiSecret).update(q).digest('hex'); }
  async _privateRequest(method, endpoint, params = {}) {
    const ts = Date.now();
    const qp = new URLSearchParams({...params, timestamp: ts, recvWindow: this.recvWindow}).toString();
    const sig = this._sign(qp);
    const url = BASE_URL + endpoint + '?' + qp + '&signature=' + sig;
    const res = await fetch(url, { method, headers: { 'X-MBX-APIKEY': this.apiKey } });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error('Binance ' + res.status + ': ' + (e.msg||'')); }
    return res.json();
  }
  async getTicker() {
    const res = await fetch(BASE_URL + '/api/v3/ticker/price?symbol=BTCUSDT');
    const d = await res.json(); return { last: d.price, price: d.price, bid: d.price, ask: d.price };
  }
  async getCandles(interval = '1m', limit = 100) {
    const res = await fetch(BASE_URL + '/api/v3/klines?symbol=BTCUSDT&interval=' + interval + '&limit=' + limit);
    const raw = await res.json(); return raw.map(c => parseFloat(c[4]));
  }
  async getBalances() {
    if (this.paperMode) return [{ asset:'USDT', free:'10.00', locked:'0' },{ asset:'BTC', free:'0', locked:'0' }];
    const d = await this._privateRequest('GET', '/api/v3/account');
    return d.balances.filter(b => ['BTC','USDT'].includes(b.asset));
  }
  async placeOrder(side, quantity, price = null) {
    const s = side.toUpperCase();
    if (this.paperMode) {
      const fp = price || parseFloat((await this.getTicker()).price);
      console.log('PAPER ' + s + ' ' + quantity.toFixed(6) + ' BTC @ $' + fp.toFixed(2));
      return { orderId: 'paper_' + Date.now(), status:'FILLED', price: String(fp), executedQty: String(quantity), avgExecutedPrice: String(fp) };
    }
    const qty = parseFloat(quantity.toFixed(5));
    const params = { symbol:'BTCUSDT', side:s, type: price ? 'LIMIT' : 'MARKET', quantity: qty, ...(price ? { price: price.toFixed(2), timeInForce:'IOC' } : {}) };
    return this._privateRequest('POST', '/api/v3/order', params);
  }
  async cancelOrder(orderId) {
    if (this.paperMode) return { orderId, status:'CANCELED' };
    return this._privateRequest('DELETE', '/api/v3/order', { symbol:'BTCUSDT', orderId: String(orderId) });
  }
  subscribeMarketData(onPrice, onError) {
    const ws = new WS(WS_BASE + '/btcusdt@trade');
    ws.on('open', () => console.log('Binance WS connected'));
    ws.on('message', raw => { try { const m = JSON.parse(raw); if (m.e==='trade') onPrice({ price: parseFloat(m.p), amount: parseFloat(m.q), side: m.m?'sell':'buy', timestamp: m.T }); } catch(e){} });
    ws.on('error', err => { console.error('WS error:', err.message); if (onError) onError(err); });
    ws.on('close', () => { console.log('WS closed - reconnecting 5s...'); setTimeout(() => this.subscribeMarketData(onPrice, onError), 5000); });
    const pi = setInterval(() => { if (ws.readyState === WS.OPEN) ws.ping(); }, 180000);
    ws.on('close', () => clearInterval(pi));
    return ws;
  }
}
module.exports = BinanceClient;
