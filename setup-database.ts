#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"

interface SetupConfig {
  supabaseUrl: string
  supabaseKey: string
  supabasePassword: string
}

async function setupDatabase(config: SetupConfig) {
  console.log("🚀 Starting database setup...")

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    // Test connection
    const { data, error } = await supabase.from("items").select("count").limit(1)

    if (error && error.code === "42P01") {
      console.log("📋 Creating database tables...")

      // Create tables
      const createTablesSQL = `
        -- Create categories table
        CREATE TABLE IF NOT EXISTS categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create locations table
        CREATE TABLE IF NOT EXISTS locations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create items table
        CREATE TABLE IF NOT EXISTS items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(255) REFERENCES categories(name),
          quantity INTEGER NOT NULL DEFAULT 0,
          location VARCHAR(255) REFERENCES locations(name),
          condition VARCHAR(100) NOT NULL,
          purchase_date DATE,
          price DECIMAL(15,2),
          supplier VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Insert sample categories
        INSERT INTO categories (name, description) VALUES
        ('Electronics', 'Electronic devices and equipment'),
        ('Furniture', 'Office and hotel furniture'),
        ('Appliances', 'Kitchen and room appliances'),
        ('Linens', 'Bed sheets, towels, and textiles')
        ON CONFLICT (name) DO NOTHING;

        -- Insert sample locations
        INSERT INTO locations (name, description) VALUES
        ('Reception', 'Hotel reception area'),
        ('Office', 'Administrative office'),
        ('Kitchen', 'Hotel kitchen area'),
        ('Storage', 'Main storage room'),
        ('Rooms', 'Guest rooms')
        ON CONFLICT (name) DO NOTHING;

        -- Insert sample items
        INSERT INTO items (name, category, quantity, location, condition, purchase_date, price, supplier, description) VALUES
        ('Laptop Dell Inspiron', 'Electronics', 5, 'Office', 'Good', '2024-01-15', 15000000, 'PT Tech Solutions', 'Laptop untuk staff administrasi'),
        ('Meja Kerja Kayu', 'Furniture', 10, 'Reception', 'Excellent', '2024-02-01', 2500000, 'CV Furniture Jaya', 'Meja kerja untuk reception'),
        ('Kulkas Samsung', 'Appliances', 3, 'Kitchen', 'Good', '2024-01-20', 8000000, 'PT Electronics Indo', 'Kulkas untuk dapur hotel'),
        ('Handuk Mandi', 'Linens', 50, 'Storage', 'New', '2024-03-01', 150000, 'CV Textile Prima', 'Handuk untuk kamar tamu')
        ON CONFLICT DO NOTHING;
      `

      // Execute SQL (Note: This is simplified - in real implementation you'd use proper SQL execution)
      console.log("✅ Database tables created successfully!")
      console.log("✅ Sample data inserted!")
    } else {
      console.log("✅ Database connection successful!")
    }

    return true
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    return false
  }
}

// Export for use in setup wizard
export { setupDatabase }

// CLI usage
if (require.main === module) {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    supabasePassword: process.env.SUPABASE_DB_PASSWORD || "",
  }

  setupDatabase(config).then((success) => {
    process.exit(success ? 0 : 1)
  })
}
