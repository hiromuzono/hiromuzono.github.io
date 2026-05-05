CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, tickets_requested INTEGER NOT NULL, tickets_negotiated INTEGER,
  preferred_datetime TIMESTAMPTZ, parent_comment TEXT, child_comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','negotiating','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ticket_settings (id INTEGER PRIMARY KEY DEFAULT 1, total_limit INTEGER NOT NULL DEFAULT 40);
INSERT INTO ticket_settings (id, total_limit) VALUES (1, 40) ON CONFLICT (id) DO NOTHING;
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $func$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$func$ LANGUAGE plpgsql;
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all on requests" ON requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all on ticket_settings" ON ticket_settings FOR ALL USING (true) WITH CHECK (true);
