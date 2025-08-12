-- Fix RLS policies for products and related tables

-- Products table policies
CREATE POLICY "Enable read access for all authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Product upload batches policies
CREATE POLICY "Enable read access for all authenticated users" ON product_upload_batches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON product_upload_batches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON product_upload_batches
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Admin users policies (for reading admin info)
CREATE POLICY "Enable read for authenticated users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Audit logs policies
CREATE POLICY "Enable insert for authenticated users" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');