-- Add comments field to products table for storing customer reviews
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_comments ON products USING gin(comments);

-- Add comment count computed column for efficiency
ALTER TABLE products
ADD COLUMN IF NOT EXISTS comment_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(comments)) STORED;

-- Create index on comment count for sorting
CREATE INDEX IF NOT EXISTS idx_products_comment_count ON products(comment_count);

-- Update timestamp trigger to track when comments are added
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at 
        BEFORE UPDATE ON products 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;