-- ============================================================
-- COMPESA Hub — Initial Schema Migration
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1.1 User Profiles
CREATE TABLE user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  name        text,
  prn         text,
  class       text,
  division    text,
  batch       text,
  photo_url   text,
  bio         text,
  skills      text[],
  resume_url  text,
  github_url  text,
  linkedin_url text,
  leetcode_url text,
  codechef_url text,
  hackerrank_url text,
  portfolio_url text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 1.2 User Roles
CREATE TYPE user_role_type AS ENUM ('Student', 'Committee', 'Placement Club', 'Faculty', 'Admin');

CREATE TABLE user_roles (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role     user_role_type NOT NULL,
  UNIQUE (user_id, role)
);

-- 1.3 Projects
CREATE TABLE projects (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  technologies text[],
  url          text,
  start_date   date,
  end_date     date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Certifications
CREATE TABLE certifications (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  issuer         text,
  issue_date     date,
  expiry_date    date,
  credential_url text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 1.5 Achievements
CREATE TABLE achievements (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  date        date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 1.6 Internships
CREATE TABLE internships (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company     text NOT NULL,
  role        text,
  description text,
  start_date  date,
  end_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 1.7 Assessment Tests
CREATE TYPE assessment_test_type AS ENUM ('weekly', 'company_pattern', 'topic');

CREATE TABLE assessment_tests (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            text NOT NULL,
  description      text,
  type             assessment_test_type NOT NULL,
  topic_tags       text[],
  start_time       timestamptz NOT NULL,
  end_time         timestamptz NOT NULL,
  duration_minutes int NOT NULL,
  total_questions  int NOT NULL DEFAULT 0,
  max_score        int NOT NULL DEFAULT 0,
  is_published     boolean NOT NULL DEFAULT false,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 1.8 Questions
CREATE TYPE question_type AS ENUM ('mcq', 'code_display');

CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id         uuid NOT NULL REFERENCES assessment_tests(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  question_type   question_type NOT NULL DEFAULT 'mcq',
  code_snippet    text,
  options         text[],
  correct_options int[],
  points          int NOT NULL DEFAULT 1,
  topic_tag       text,
  "order"         int NOT NULL DEFAULT 0
);

-- 1.9 Test Submissions
CREATE TABLE test_submissions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id      uuid NOT NULL REFERENCES assessment_tests(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        float NOT NULL DEFAULT 0,
  total        float NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  is_graded    boolean NOT NULL DEFAULT true
);

-- 1.10 Student Answers
CREATE TABLE student_answers (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id     uuid NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
  test_id           uuid NOT NULL REFERENCES assessment_tests(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id       uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_options  int[],
  is_correct        boolean
);

-- 1.11 DSA Contests
CREATE TABLE dsa_contests (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            text NOT NULL,
  description      text,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz NOT NULL,
  duration_minutes int,
  is_published     boolean NOT NULL DEFAULT false,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 1.12 DSA Problems
CREATE TYPE problem_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

CREATE TABLE dsa_problems (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id         uuid NOT NULL REFERENCES dsa_contests(id) ON DELETE CASCADE,
  title              text NOT NULL,
  difficulty         problem_difficulty NOT NULL DEFAULT 'Easy',
  problem_statement  text NOT NULL,
  constraints        text,
  sample_input       text,
  sample_output      text,
  function_signature text,
  topic_tags         text[],
  max_points         int NOT NULL DEFAULT 1,
  "order"            int NOT NULL DEFAULT 0
);

-- 1.13 DSA Submissions
CREATE TABLE dsa_submissions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id   uuid NOT NULL REFERENCES dsa_contests(id) ON DELETE CASCADE,
  problem_id   uuid NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         text NOT NULL,
  language     text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score        float NOT NULL DEFAULT 0,
  max_points   float NOT NULL DEFAULT 0,
  remarks      text,
  is_graded    boolean NOT NULL DEFAULT false,
  graded_by    uuid REFERENCES auth.users(id),
  graded_at    timestamptz
);

-- 1.14 News
CREATE TABLE news (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      text NOT NULL,
  content    text,
  type       text,
  image_url  text,
  event_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.15 Committee Members
CREATE TABLE committee_members (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 text NOT NULL,
  role                 text,
  bio                  text,
  photo_url            text,
  email                text,
  is_faculty_coordinator boolean NOT NULL DEFAULT false,
  batch_year           text,
  is_current           boolean NOT NULL DEFAULT true,
  "order"              int NOT NULL DEFAULT 0
);

-- 1.16 Placement Club Members
CREATE TABLE placement_club_members (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  role       text,
  bio        text,
  photo_url  text,
  email      text,
  batch_year text,
  is_current boolean NOT NULL DEFAULT true,
  "order"    int NOT NULL DEFAULT 0
);

-- 1.17 Feedback Forms
CREATE TABLE feedback_forms (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_item_id uuid REFERENCES news(id) ON DELETE SET NULL,
  title        text NOT NULL,
  start_time   timestamptz,
  end_time     timestamptz,
  is_active    boolean NOT NULL DEFAULT false
);

-- 1.18 Feedback Responses
CREATE TABLE feedback_responses (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_form_id uuid NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating           int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment          text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_form_id, user_id)
);

-- 1.19 FAQs
CREATE TABLE faqs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question     text NOT NULL,
  answer       text NOT NULL,
  "order"      int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false
);

-- 1.20 About Content
CREATE TABLE about_content (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vision    text,
  mission   text,
  objectives text[],
  structure text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.21 Contact Submissions
CREATE TABLE contact_submissions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  message      text NOT NULL,
  inquiry_type text,
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 1.22 Notifications
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text,
  type       text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

-- 2.0 Helper: is_admin / is_faculty / is_committee
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'Faculty'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('Admin', 'Faculty', 'Committee')
  );
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships             ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_contests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_problems            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE news                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_club_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_forms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;

-- 2.1 user_profiles
CREATE POLICY "profiles_select_own"     ON user_profiles FOR SELECT USING (id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "profiles_insert_own"     ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"     ON user_profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- 2.2 user_roles
CREATE POLICY "roles_select_own"      ON user_roles FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "roles_insert_admin"    ON user_roles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "roles_update_admin"    ON user_roles FOR UPDATE USING (public.is_admin());
CREATE POLICY "roles_delete_admin"    ON user_roles FOR DELETE USING (public.is_admin());

-- 2.3 projects
CREATE POLICY "projects_select"       ON projects FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "projects_insert"       ON projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_update"       ON projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "projects_delete"       ON projects FOR DELETE USING (user_id = auth.uid());

-- 2.4 certifications
CREATE POLICY "certs_select"          ON certifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "certs_insert"          ON certifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "certs_update"          ON certifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "certs_delete"          ON certifications FOR DELETE USING (user_id = auth.uid());

-- 2.5 achievements
CREATE POLICY "achievements_select"   ON achievements FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "achievements_insert"   ON achievements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "achievements_update"   ON achievements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "achievements_delete"   ON achievements FOR DELETE USING (user_id = auth.uid());

-- 2.6 internships
CREATE POLICY "internships_select"    ON internships FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "internships_insert"    ON internships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "internships_update"    ON internships FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "internships_delete"    ON internships FOR DELETE USING (user_id = auth.uid());

-- 2.7 assessment_tests
CREATE POLICY "tests_select_auth"     ON assessment_tests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tests_insert_admin"    ON assessment_tests FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "tests_update_admin"    ON assessment_tests FOR UPDATE USING (public.is_admin());
CREATE POLICY "tests_delete_admin"    ON assessment_tests FOR DELETE USING (public.is_admin());

-- 2.8 questions
CREATE POLICY "questions_select_active" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessment_tests t WHERE t.id = test_id AND t.is_published = true)
  OR public.is_admin()
);
CREATE POLICY "questions_insert_admin"  ON questions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "questions_update_admin"  ON questions FOR UPDATE USING (public.is_admin());
CREATE POLICY "questions_delete_admin"  ON questions FOR DELETE USING (public.is_admin());

-- 2.9 test_submissions
CREATE POLICY "submissions_select"    ON test_submissions FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "submissions_insert"    ON test_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions_update"    ON test_submissions FOR UPDATE USING (public.is_admin());

-- 2.10 student_answers
CREATE POLICY "answers_select"        ON student_answers FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "answers_insert"        ON student_answers FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2.11 dsa_contests
CREATE POLICY "contests_select_auth"  ON dsa_contests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contests_insert_admin" ON dsa_contests FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "contests_update_admin" ON dsa_contests FOR UPDATE USING (public.is_admin());
CREATE POLICY "contests_delete_admin" ON dsa_contests FOR DELETE USING (public.is_admin());

-- 2.12 dsa_problems
CREATE POLICY "problems_select_auth"  ON dsa_problems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "problems_insert_admin" ON dsa_problems FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "problems_update_admin" ON dsa_problems FOR UPDATE USING (public.is_admin());
CREATE POLICY "problems_delete_admin" ON dsa_problems FOR DELETE USING (public.is_admin());

-- 2.13 dsa_submissions
CREATE POLICY "dsa_subs_select"       ON dsa_submissions FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "dsa_subs_insert"       ON dsa_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "dsa_subs_update_grade" ON dsa_submissions FOR UPDATE USING (public.is_admin() OR public.is_faculty());

-- 2.14 news
CREATE POLICY "news_select_all"       ON news FOR SELECT USING (true);
CREATE POLICY "news_insert_staff"     ON news FOR INSERT WITH CHECK (public.is_admin() OR public.is_faculty() OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'Committee'
));
CREATE POLICY "news_update_staff"     ON news FOR UPDATE USING (public.is_admin() OR public.is_faculty() OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'Committee'
));
CREATE POLICY "news_delete_admin"     ON news FOR DELETE USING (public.is_admin());

-- 2.15 committee_members
CREATE POLICY "cm_select_all"         ON committee_members FOR SELECT USING (true);
CREATE POLICY "cm_insert_admin"       ON committee_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "cm_update_admin"       ON committee_members FOR UPDATE USING (public.is_admin());
CREATE POLICY "cm_delete_admin"       ON committee_members FOR DELETE USING (public.is_admin());

-- 2.16 placement_club_members
CREATE POLICY "pcm_select_all"        ON placement_club_members FOR SELECT USING (true);
CREATE POLICY "pcm_insert_admin"      ON placement_club_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "pcm_update_admin"      ON placement_club_members FOR UPDATE USING (public.is_admin());
CREATE POLICY "pcm_delete_admin"      ON placement_club_members FOR DELETE USING (public.is_admin());

-- 2.17 feedback_forms
CREATE POLICY "ff_select_all"         ON feedback_forms FOR SELECT USING (true);
CREATE POLICY "ff_insert_admin"       ON feedback_forms FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "ff_update_admin"       ON feedback_forms FOR UPDATE USING (public.is_admin());
CREATE POLICY "ff_delete_admin"       ON feedback_forms FOR DELETE USING (public.is_admin());

-- 2.18 feedback_responses
CREATE POLICY "fr_select"             ON feedback_responses FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());
CREATE POLICY "fr_insert_own"         ON feedback_responses FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM feedback_responses WHERE feedback_form_id = feedback_form_id AND user_id = auth.uid())
);

-- 2.19 faqs
CREATE POLICY "faqs_select_all"       ON faqs FOR SELECT USING (true);
CREATE POLICY "faqs_insert_admin"     ON faqs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "faqs_update_admin"     ON faqs FOR UPDATE USING (public.is_admin());
CREATE POLICY "faqs_delete_admin"     ON faqs FOR DELETE USING (public.is_admin());

-- 2.20 about_content
CREATE POLICY "about_select_all"       ON about_content FOR SELECT USING (true);
CREATE POLICY "about_insert_admin"     ON about_content FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "about_update_admin"     ON about_content FOR UPDATE USING (public.is_admin());
CREATE POLICY "about_delete_admin"     ON about_content FOR DELETE USING (public.is_admin());

-- 2.21 contact_submissions
CREATE POLICY "contact_insert_all"     ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_select_admin"   ON contact_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "contact_update_admin"   ON contact_submissions FOR UPDATE USING (public.is_admin());

-- 2.22 notifications
CREATE POLICY "notif_select_own"       ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_insert_system"    ON notifications FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff());
CREATE POLICY "notif_update_read"      ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- 3. TRIGGER: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_about_content_updated_at
  BEFORE UPDATE ON about_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true)     ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)       ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT DO NOTHING;

-- Bucket policies: allow authenticated users to read; allow owners/admin to write
CREATE POLICY "resumes_read_all"       ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.role() = 'authenticated');
CREATE POLICY "resumes_insert_own"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND (owner = auth.uid() OR public.is_admin()));
CREATE POLICY "resumes_update_own"     ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND (owner = auth.uid() OR public.is_admin()));
CREATE POLICY "resumes_delete_own"     ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND (owner = auth.uid() OR public.is_admin()));

CREATE POLICY "photos_read_all"        ON storage.objects FOR SELECT USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "photos_insert_own"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND (owner = auth.uid() OR public.is_admin()));
CREATE POLICY "photos_update_own"      ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND (owner = auth.uid() OR public.is_admin()));
CREATE POLICY "photos_delete_own"      ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND (owner = auth.uid() OR public.is_admin()));

CREATE POLICY "news_images_read_all"   ON storage.objects FOR SELECT USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');
CREATE POLICY "news_images_insert_staff" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-images' AND public.is_staff());
CREATE POLICY "news_images_update_staff" ON storage.objects FOR UPDATE USING (bucket_id = 'news-images' AND public.is_staff());
CREATE POLICY "news_images_delete_staff" ON storage.objects FOR DELETE USING (bucket_id = 'news-images' AND public.is_staff());
