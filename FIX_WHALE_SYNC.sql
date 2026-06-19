-- ============================================================
-- SYNC ALL 19 WHALE WALLETS TO tracked_whales TABLE
-- Run in Supabase SQL Editor — this fixes the Helius sync issue
-- After running, click the test signal button or wait for next whale swap
-- ============================================================

-- Step 1: Upsert all 19 current whale wallets
INSERT INTO tracked_whales (address, label, source, added_at)
VALUES
  ('Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB', 'Euris', 'kollist', NOW()),
  ('Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ', 'Heyitsyolo', 'kollist', NOW()),
  ('BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu', 'Remusofmars', 'kollist', NOW()),
  ('DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm', 'Lenion', 'kollist', NOW()),
  ('HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp', 'Hades', 'kollist', NOW()),
  ('AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51', 'Fireball', 'kollist', NOW()),
  ('EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS', 'Hachjdn', 'kollist', NOW()),
  ('CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o', 'Cented', 'kollist', NOW()),
  ('Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA', 'The Grande', 'kollist', NOW()),
  ('JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN', 'West', 'kollist', NOW()),
  ('5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG', 'Yenni', 'kollist', NOW()),
  ('5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg', 'Doji', 'kollist', NOW()),
  ('Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7', 'Trenchman', 'kollist', NOW()),
  ('215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', 'OGAntD', 'kollist', NOW()),
  ('BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd', 'Kev', 'kollist', NOW()),
  ('4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', 'decu', 'kollist', NOW()),
  ('ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT', 'trunoest', 'kollist', NOW()),
  ('G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC', 'clukz', 'kollist', NOW()),
  ('BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB', 'Limfork', 'kollist', NOW())
ON CONFLICT (address) DO UPDATE SET
  label = EXCLUDED.label,
  source = EXCLUDED.source;

-- Step 2: Verify all wallets are in the table
SELECT address, label, source, added_at
FROM tracked_whales
ORDER BY added_at DESC;
