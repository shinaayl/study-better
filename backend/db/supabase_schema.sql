-- ==============================================================================
-- CourseAware AI Study Agent: Supabase / PostgreSQL DDL & RBAC Security Schema
-- ==============================================================================

-- 1. Custom Types & Enums
CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'admin');
CREATE TYPE document_type AS ENUM ('marking_scheme', 'past_question', 'lecture_note', 'handout');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department TEXT NOT NULL,
    institution TEXT DEFAULT 'Higher Institution',
    level TEXT,
    title TEXT,
    picture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email and role for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE, -- e.g. CSC301, ECO101
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    level INTEGER DEFAULT 300,
    semester VARCHAR(64) DEFAULT 'First Semester',
    credit_units INTEGER DEFAULT 3,
    lecturer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses (code);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses (department);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON public.courses (lecturer_id);

-- 4. Documents Table (Past Questions, Marking Schemes, Lecture Notes, Handouts)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    doc_type document_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_course_id ON public.documents (course_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON public.documents (doc_type);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can view profiles; users can update their own profile
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Courses: Read-only for students; Lecturers & Admins can create/update
CREATE POLICY "Courses are viewable by all authenticated users"
ON public.courses FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Lecturers can create or update courses"
ON public.courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('lecturer', 'admin')
    )
);

-- Documents: Students have SELECT only; Lecturers have INSERT/UPDATE/DELETE
CREATE POLICY "Students and lecturers can view documents"
ON public.documents FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Only lecturers and admins can upload and manage documents"
ON public.documents FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('lecturer', 'admin')
    )
);
