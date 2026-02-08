-- Pilot feedback collection for qualitative user insights
-- Part of the AMPLIFY Router pilot program

-- Feedback table
CREATE TABLE router_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES router_users(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES router_artists(id) ON DELETE SET NULL,
    page_url TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_context TEXT,                                                   -- User-editable page/feature description
    category TEXT CHECK (category IN ('bug', 'suggestion', 'question', 'praise')),
    message TEXT NOT NULL,
    screenshot_url TEXT,
    browser_info JSONB,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',           -- Just submitted, not yet triaged
        'triaging',    -- Under consideration
        'in_progress',   -- Being worked on
        'completed',     -- Fixed or implemented
        'blocked',       -- Cannot proceed without external dependency
        'wont_fix'       -- Declined or out of scope
    )),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to TEXT,
    related_to UUID REFERENCES router_feedback(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_router_feedback_user ON router_feedback(user_id);
CREATE INDEX idx_router_feedback_artist ON router_feedback(artist_id);
CREATE INDEX idx_router_feedback_status ON router_feedback(status);
CREATE INDEX idx_router_feedback_priority ON router_feedback(priority);
CREATE INDEX idx_router_feedback_created_at ON router_feedback(created_at DESC);

-- RLS policies
ALTER TABLE router_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_router_feedback"
    ON router_feedback FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('router-feedback-screenshots', 'router-feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Service role can upload screenshots
CREATE POLICY "service_role_all_feedback_screenshots"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'router-feedback-screenshots')
    WITH CHECK (bucket_id = 'router-feedback-screenshots');

-- Anyone can view screenshots (needed for display in admin review)
CREATE POLICY "public_read_feedback_screenshots"
    ON storage.objects FOR SELECT TO anon, public
    USING (bucket_id = 'router-feedback-screenshots');
