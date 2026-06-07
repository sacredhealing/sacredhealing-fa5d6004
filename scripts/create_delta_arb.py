import urllib.request, json, os

PAT = os.environ.get("SUPABASE_PAT", "")
DB  = "https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/database/query"

def q(sql):
    data = json.dumps({"query": sql}).encode()
    req  = urllib.request.Request(DB, data=data,
           headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
           method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode()
    except Exception as e:
        return str(e)

sqls = [
    """CREATE TABLE IF NOT EXISTS delta_arb_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        poly_wallet_address text,
        tier text NOT NULL DEFAULT 'free',
        platform_fee_pct integer NOT NULL DEFAULT 50,
        is_active boolean NOT NULL DEFAULT true,
        paper_mode boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS delta_arb_trades (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        asset text NOT NULL,
        interval text NOT NULL DEFAULT '15m',
        signal text NOT NULL,
        delta text,
        size_usd numeric(12,4),
        entry_price numeric(8,6),
        status text NOT NULL DEFAULT 'open',
        pnl_usdc numeric(12,4),
        net_pnl_usdc numeric(12,4),
        mode text NOT NULL DEFAULT 'PAPER',
        created_at timestamptz NOT NULL DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS delta_arb_fee_ledger (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        trade_id uuid,
        gross_pnl_usdc numeric(12,4) NOT NULL,
        fee_pct integer NOT NULL,
        fee_usdc numeric(12,4) NOT NULL,
        net_pnl_usdc numeric(12,4) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS delta_arb_platform_config (
        id integer PRIMARY KEY DEFAULT 1,
        platform_wallet text,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT single_row CHECK (id = 1)
    )""",
    """INSERT INTO delta_arb_platform_config (id, platform_wallet)
       VALUES (1, '0x8BdcA3db0AAECb67b0818AAbAa5398765c649335')
       ON CONFLICT (id) DO UPDATE SET platform_wallet = '0x8BdcA3db0AAECb67b0818AAbAa5398765c649335', updated_at = now()""",
    """CREATE TABLE IF NOT EXISTS delta_arb_affiliate_rates (
        tier text PRIMARY KEY,
        l1_pct numeric(5,2) NOT NULL,
        l2_pct numeric(5,2) NOT NULL
    )""",
    """INSERT INTO delta_arb_affiliate_rates (tier, l1_pct, l2_pct) VALUES
       ('free', 10.00, 3.00),
       ('prana_flow', 8.00, 2.00),
       ('siddha_quantum', 5.00, 1.00),
       ('akasha_infinity', 3.00, 1.00)
       ON CONFLICT (tier) DO UPDATE SET l1_pct=EXCLUDED.l1_pct, l2_pct=EXCLUDED.l2_pct""",
    """ALTER TABLE delta_arb_members ENABLE ROW LEVEL SECURITY""",
    """ALTER TABLE delta_arb_trades ENABLE ROW LEVEL SECURITY""",
    """ALTER TABLE delta_arb_fee_ledger ENABLE ROW LEVEL SECURITY""",
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delta_arb_members' AND policyname='Users own delta_arb_members') THEN
            CREATE POLICY "Users own delta_arb_members" ON delta_arb_members FOR ALL USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delta_arb_trades' AND policyname='Users own delta_arb_trades') THEN
            CREATE POLICY "Users own delta_arb_trades" ON delta_arb_trades FOR ALL USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delta_arb_fee_ledger' AND policyname='Users own delta_arb_fee_ledger') THEN
            CREATE POLICY "Users own delta_arb_fee_ledger" ON delta_arb_fee_ledger FOR ALL USING (auth.uid() = user_id);
        END IF;
    END $$""",
]

for sql in sqls:
    result = q(sql.strip())
    print(f"SQL: {sql.strip()[:60]}...")
    print(f"Result: {result[:100]}")
    print()

print("DONE — all delta-arb tables created and wallet set")
