-- Writewise Database Migrations for Document Sharing and History
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- ========== DOCUMENT SHARING TABLES ==========

-- Table for direct document shares (user to user)
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'comment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(document_id, shared_with_email)
);

-- Table for public share links
CREATE TABLE IF NOT EXISTS public_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'comment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- ========== DOCUMENT VERSION HISTORY ==========

-- Table for document versions
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT,
  UNIQUE(document_id, version_number)
);

-- ========== INDEXES FOR PERFORMANCE ==========

-- Indexes for document_shares
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with_email ON document_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by_user_id ON document_shares(shared_by_user_id);

-- Indexes for public_shares
CREATE INDEX IF NOT EXISTS idx_public_shares_document_id ON public_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_share_token ON public_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_shares_is_active ON public_shares(is_active);

-- Indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(document_id, version_number);

-- ========== ROW LEVEL SECURITY (RLS) POLICIES ==========

-- Enable RLS on all new tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Document Shares Policies
-- Users can view shares for documents they own or shares directed to them
CREATE POLICY "Users can view relevant document shares" ON document_shares
  FOR SELECT USING (
    shared_by_user_id = auth.uid() 
    OR shared_with_email = auth.email()
    OR EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can create shares for documents they own
CREATE POLICY "Users can create shares for their documents" ON document_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can delete shares they created or for documents they own
CREATE POLICY "Users can delete relevant document shares" ON document_shares
  FOR DELETE USING (
    shared_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Public Shares Policies
-- Users can view public shares for documents they own
CREATE POLICY "Users can view public shares for their documents" ON public_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = public_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can create public shares for documents they own
CREATE POLICY "Users can create public shares for their documents" ON public_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = public_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can update public shares for documents they own
CREATE POLICY "Users can update public shares for their documents" ON public_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = public_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Document Versions Policies
-- Users can view versions for documents they own or have access to
CREATE POLICY "Users can view document versions" ON document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_versions.document_id 
      AND documents.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.document_id = document_versions.document_id 
      AND document_shares.shared_with_email = auth.email()
    )
  );

-- Users can create versions for documents they own or have edit access to
CREATE POLICY "Users can create document versions" ON document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_versions.document_id 
      AND documents.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.document_id = document_versions.document_id 
      AND document_shares.shared_with_email = auth.email()
      AND document_shares.permission IN ('edit')
    )
  );

-- ========== FUNCTIONS FOR AUTOMATIC VERSION CREATION ==========

-- Function to automatically create a version when a document is significantly updated
CREATE OR REPLACE FUNCTION create_document_version_on_major_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Create version if content has changed significantly (more than 20 characters difference OR title changed)
  IF (OLD.content IS DISTINCT FROM NEW.content 
     AND ABS(LENGTH(NEW.content) - LENGTH(OLD.content)) > 20)
     OR (OLD.title IS DISTINCT FROM NEW.title) THEN
    
    INSERT INTO document_versions (
      document_id,
      content,
      title,
      version_number,
      created_by_user_id,
      change_summary
    )
    SELECT 
      OLD.id,
      OLD.content,
      OLD.title,
      COALESCE(MAX(version_number), 0) + 1,
      OLD.user_id,
      CASE 
        WHEN OLD.title IS DISTINCT FROM NEW.title THEN 'Auto-saved version (title changed)'
        ELSE 'Auto-saved version'
      END
    FROM document_versions 
    WHERE document_id = OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create versions on major updates
DROP TRIGGER IF EXISTS trigger_create_document_version ON documents;
CREATE TRIGGER trigger_create_document_version
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version_on_major_update();

-- ========== HELPER FUNCTIONS ==========

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deactivate expired public shares
  UPDATE public_shares 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Delete expired direct shares
  DELETE FROM document_shares 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========== SAMPLE DATA (OPTIONAL) ==========

-- Uncomment the following lines to create some sample shared documents for testing
-- Note: Replace the UUIDs with actual document and user IDs from your database

/*
-- Sample direct share
INSERT INTO document_shares (document_id, shared_with_email, shared_by_user_id, permission)
VALUES (
  'YOUR_DOCUMENT_ID_HERE',
  'test@example.com',
  'YOUR_USER_ID_HERE',
  'edit'
);

-- Sample public share
INSERT INTO public_shares (document_id, share_token, permission)
VALUES (
  'YOUR_DOCUMENT_ID_HERE',
  'share_abcdef123456',
  'view'
);
*/

-- ========== VERIFICATION QUERIES ==========

-- Run these queries to verify the tables were created successfully:

-- Check table creation
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('document_shares', 'public_shares', 'document_versions')
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('document_shares', 'public_shares', 'document_versions')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('document_shares', 'public_shares', 'document_versions')
ORDER BY tablename, policyname; 