-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (code, name, description) VALUES
('LIN', 'Linen', 'Sprei, handuk, dan perlengkapan tekstil lainnya'),
('CLS', 'Cleaning Supplies', 'Sabun, deterjen, dan perlengkapan kebersihan'),
('AMN', 'Amenities', 'Perlengkapan kamar tamu dan fasilitas hotel'),
('EQP', 'Equipment', 'Peralatan dan mesin untuk operasional hotel')
ON CONFLICT (code) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
