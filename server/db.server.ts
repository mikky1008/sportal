// PostgreSQL database (works with Neon / Vercel Postgres, Supabase, or any Postgres).
//
// SERVER ONLY. The connection string comes from DATABASE_URL (or POSTGRES_URL, which Vercel's
// Neon integration also sets). Schema changes are applied automatically through the migrations
// below, once per server process, under a Postgres advisory lock so that two cold-starting
// serverless instances never run them at the same time.
//
// Everything that talks to the database uses tagged-template queries, which send user input as
// bound parameters, so it is never concatenated into SQL.

import postgres, { type Sql } from "postgres";

export type Db = Sql;

interface Migration {
  version: number;
  name: string;
  sql: string;
}

// Append new migrations to the END of this list. Never edit one that has already shipped.
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "init",
    sql: `
      CREATE TABLE users (
        id                  TEXT PRIMARY KEY,
        email               TEXT NOT NULL,
        username            TEXT NOT NULL,
        password_hash       TEXT NOT NULL,
        display_name        TEXT NOT NULL,
        is_active           BOOLEAN NOT NULL DEFAULT TRUE,
        email_verified_at   TIMESTAMPTZ,
        password_changed_at TIMESTAMPTZ NOT NULL,
        last_login_at       TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL,
        updated_at          TIMESTAMPTZ NOT NULL,
        deleted_at          TIMESTAMPTZ
      );
      -- Email and username are case-insensitive.
      CREATE UNIQUE INDEX users_email_key ON users (lower(email));
      CREATE UNIQUE INDEX users_username_key ON users (lower(username));

      -- Profile details live apart from credentials so profile features never touch auth data.
      CREATE TABLE user_profiles (
        user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name  TEXT,
        avatar_url TEXT,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE roles (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE permissions (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE role_permissions (
        role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

      -- Many-to-many so a user can hold several roles later without a redesign.
      CREATE TABLE user_roles (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        granted_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (user_id, role_id)
      );

      -- Only a SHA-256 hash of the session token is stored, so a leaked database cannot be
      -- replayed as live sessions.
      CREATE TABLE sessions (
        token_hash   TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at   TIMESTAMPTZ NOT NULL,
        last_seen_at TIMESTAMPTZ NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        remember     BOOLEAN NOT NULL DEFAULT FALSE,
        ip           TEXT,
        user_agent   TEXT,
        revoked_at   TIMESTAMPTZ
      );
      CREATE INDEX idx_sessions_user ON sessions(user_id);
      CREATE INDEX idx_sessions_expires ON sessions(expires_at);

      -- Ready for the password-reset feature (token hash only, single use, short lived).
      CREATE TABLE password_reset_tokens (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at    TIMESTAMPTZ
      );

      -- Used for login rate limiting.
      CREATE TABLE login_attempts (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        identifier TEXT NOT NULL,
        ip         TEXT,
        success    BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier, created_at);
      CREATE INDEX idx_login_attempts_ip ON login_attempts(ip, created_at);

      -- Used for sign-up rate limiting (kept in the database because serverless instances share
      -- no memory).
      CREATE TABLE signup_attempts (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ip         TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_signup_attempts_ip ON signup_attempts(ip, created_at);

      -- Append-only trail of security-relevant events (login, logout, failures, user changes).
      CREATE TABLE audit_log (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
        event      TEXT NOT NULL,
        identifier TEXT,
        ip         TEXT,
        user_agent TEXT,
        detail     TEXT,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
      CREATE INDEX idx_audit_event ON audit_log(event, created_at);

      -- Role-specific details entered on the Sign up form. Names live in user_profiles already.
      CREATE TABLE coach_profiles (
        user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        organization         TEXT NOT NULL,
        coaching_position    TEXT NOT NULL,
        sport_specialization TEXT NOT NULL,
        created_at           TIMESTAMPTZ NOT NULL,
        updated_at           TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE university_representative_profiles (
        user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        university_name TEXT NOT NULL,
        designation     TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL,
        updated_at      TIMESTAMPTZ NOT NULL
      );

      -- Reference data (not user accounts): the roles the app knows about. People can register as
      -- student_athlete, coach or university_representative; admin is only given out by hand.
      INSERT INTO roles (name, description) VALUES
        ('student_athlete', 'Student-athlete: manages their own profile and practice sessions'),
        ('coach', 'Coach: reviews and verifies athlete sessions'),
        ('admin', 'Administrator: manages accounts and roles'),
        ('university_representative', 'University representative: represents a university''s athletics program');

      INSERT INTO permissions (name, description) VALUES
        ('sessions:verify', 'Mark a performance session as coach-verified'),
        ('users:read',      'View user accounts'),
        ('users:manage',    'Create, edit, activate and deactivate user accounts'),
        ('audit:read',      'View the login activity and audit log');

      -- A coach who signs up has NOT been approved yet, so the coach role alone does not grant
      -- 'sessions:verify'. Grant it to coaches when coach approval exists.
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin';
    `,
  },
  {
    version: 2,
    name: "coach_athlete_connections",
    sql: `
      -- One row per coach-athlete pair. A coach is a user with the 'coach' role and an athlete is a
      -- user with the 'student_athlete' role (there is no separate athlete table), so both sides
      -- reference users(id). Role checks are the API's job; the database guarantees the shape.
      -- The row is reused for the life of the relationship: declining, cancelling or disconnecting
      -- changes status, and a later re-request flips the same row back to 'pending'.
      CREATE TABLE coach_athlete_connections (
        id           TEXT PRIMARY KEY,
        coach_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status       TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT coach_athlete_connections_status_check
          CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'disconnected')),
        -- Nobody connects to themselves.
        CONSTRAINT coach_athlete_connections_distinct_users_check
          CHECK (coach_id <> athlete_id),
        -- Only one of the two people can have sent the request.
        CONSTRAINT coach_athlete_connections_requested_by_check
          CHECK (requested_by IN (coach_id, athlete_id)),
        -- A pending request has not been answered yet; an answer cannot predate the request.
        CONSTRAINT coach_athlete_connections_responded_check
          CHECK ((status <> 'pending' OR responded_at IS NULL)
             AND (responded_at IS NULL OR responded_at >= requested_at))
      );
      -- At most one record per coach-athlete pair, so a duplicate request (including a second
      -- pending or accepted one, from either side) is rejected by the database itself.
      CREATE UNIQUE INDEX coach_athlete_connections_pair_key
        ON coach_athlete_connections (coach_id, athlete_id);
      CREATE INDEX idx_coach_athlete_connections_coach   ON coach_athlete_connections (coach_id, status);
      CREATE INDEX idx_coach_athlete_connections_athlete ON coach_athlete_connections (athlete_id, status);
    `,
  },
  {
    version: 3,
    name: "training_plans",
    sql: `
      -- A coach's training plan. DRAFT plans only need a title; a PUBLISHED plan must be complete
      -- (the CHECK below), so the database itself refuses a half-finished published plan.
      CREATE TABLE training_plans (
        id           TEXT PRIMARY KEY,
        coach_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        sport        TEXT NOT NULL DEFAULT '',
        skill_focus  TEXT NOT NULL DEFAULT '',
        start_date   DATE,
        end_date     DATE,
        status       TEXT NOT NULL DEFAULT 'DRAFT',
        published_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT training_plans_status_check CHECK (status IN ('DRAFT', 'PUBLISHED')),
        CONSTRAINT training_plans_title_check CHECK (length(btrim(title)) BETWEEN 1 AND 120),
        CONSTRAINT training_plans_description_check CHECK (length(description) <= 1000),
        CONSTRAINT training_plans_dates_check CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
        CONSTRAINT training_plans_published_check CHECK (
          status = 'DRAFT'
          OR (published_at IS NOT NULL AND sport <> '' AND skill_focus <> '' AND start_date IS NOT NULL AND end_date IS NOT NULL)
        )
      );
      CREATE INDEX idx_training_plans_coach ON training_plans (coach_id, status, updated_at DESC);

      -- The weekly schedule: one row per drill, kept in the order the coach arranged them.
      CREATE TABLE training_plan_schedule_items (
        id               TEXT PRIMARY KEY,
        plan_id          TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        position         INTEGER NOT NULL,
        day_of_week      TEXT NOT NULL,
        drill_name       TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        intensity        TEXT NOT NULL,
        CONSTRAINT training_plan_schedule_position_key UNIQUE (plan_id, position),
        CONSTRAINT training_plan_schedule_day_check
          CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
        CONSTRAINT training_plan_schedule_drill_check CHECK (length(btrim(drill_name)) BETWEEN 1 AND 120),
        CONSTRAINT training_plan_schedule_duration_check CHECK (duration_minutes BETWEEN 1 AND 600),
        CONSTRAINT training_plan_schedule_intensity_check CHECK (intensity IN ('Low', 'Medium', 'High'))
      );

      CREATE TABLE training_plan_goals (
        id          TEXT PRIMARY KEY,
        plan_id     TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        position    INTEGER NOT NULL,
        description TEXT NOT NULL,
        CONSTRAINT training_plan_goals_position_key UNIQUE (plan_id, position),
        CONSTRAINT training_plan_goals_description_check CHECK (length(btrim(description)) BETWEEN 1 AND 200)
      );

      -- Which athletes a plan is assigned to. Whether the coach may assign them (an accepted
      -- coach_athlete_connections row) is enforced by the API when the plan is saved.
      CREATE TABLE training_plan_assignments (
        plan_id     TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        athlete_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (plan_id, athlete_id)
      );
      CREATE INDEX idx_training_plan_assignments_athlete ON training_plan_assignments (athlete_id);
    `,
  },
  {
    version: 4,
    name: "athlete_profiles_and_coach_dashboard",
    sql: `
      -- What a coach sees on My Athletes and in the athlete profile popup. One row per athlete;
      -- the athlete edits sport/position/school/bio. ranking, performance and consistency are
      -- NOT editable by the athlete (they are scores, set by the platform or an admin).
      CREATE TABLE athlete_profiles (
        user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sport            TEXT NOT NULL DEFAULT '',
        playing_position TEXT NOT NULL DEFAULT '',
        school           TEXT NOT NULL DEFAULT '',
        bio              TEXT NOT NULL DEFAULT '',
        ranking          INTEGER,
        performance      NUMERIC(5,2),
        consistency      NUMERIC(5,2),
        created_at       TIMESTAMPTZ NOT NULL,
        updated_at       TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_profiles_ranking_check     CHECK (ranking IS NULL OR ranking >= 1),
        CONSTRAINT athlete_profiles_performance_check CHECK (performance IS NULL OR performance BETWEEN 0 AND 100),
        CONSTRAINT athlete_profiles_consistency_check CHECK (consistency IS NULL OR consistency BETWEEN 0 AND 100),
        CONSTRAINT athlete_profiles_bio_check         CHECK (length(bio) <= 1000)
      );

      CREATE TABLE athlete_skills (
        id         TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position   INTEGER NOT NULL,
        name       TEXT NOT NULL,
        CONSTRAINT athlete_skills_position_key UNIQUE (athlete_id, position),
        CONSTRAINT athlete_skills_name_check CHECK (length(btrim(name)) BETWEEN 1 AND 60)
      );

      CREATE TABLE athlete_achievements (
        id         TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position   INTEGER NOT NULL,
        title      TEXT NOT NULL,
        year       TEXT NOT NULL DEFAULT '',
        CONSTRAINT athlete_achievements_position_key UNIQUE (athlete_id, position),
        CONSTRAINT athlete_achievements_title_check CHECK (length(btrim(title)) BETWEEN 1 AND 160)
      );

      -- Logged performance records. "skill" + "score" (0-100) are optional; when present they feed
      -- the coach's Team Performance Snapshot (average score per skill, and change vs the 30 days before).
      CREATE TABLE athlete_records (
        id          TEXT PRIMARY KEY,
        athlete_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label       TEXT NOT NULL,
        value       TEXT NOT NULL,
        skill       TEXT,
        score       NUMERIC(5,2),
        recorded_on DATE NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_records_label_check CHECK (length(btrim(label)) BETWEEN 1 AND 80),
        CONSTRAINT athlete_records_value_check CHECK (length(btrim(value)) BETWEEN 1 AND 40),
        CONSTRAINT athlete_records_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 100)
      );
      CREATE INDEX idx_athlete_records_athlete ON athlete_records (athlete_id, recorded_on DESC);

      -- Recruitment: a coach's shortlist, inquiries to athletes, the messages between them, and
      -- athletes who applied to a coach's program. The dashboard reads these.
      CREATE TABLE coach_shortlist (
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (coach_id, athlete_id),
        CONSTRAINT coach_shortlist_distinct_check CHECK (coach_id <> athlete_id)
      );

      CREATE TABLE recruitment_inquiries (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'awaiting',
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT recruitment_inquiries_status_check CHECK (status IN ('awaiting', 'replied', 'accepted', 'declined')),
        CONSTRAINT recruitment_inquiries_distinct_check CHECK (coach_id <> athlete_id)
      );
      CREATE INDEX idx_recruitment_inquiries_coach ON recruitment_inquiries (coach_id, status);

      CREATE TABLE coach_messages (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        read_at    TIMESTAMPTZ,
        CONSTRAINT coach_messages_sender_check CHECK (sender_id IN (coach_id, athlete_id)),
        CONSTRAINT coach_messages_body_check CHECK (length(btrim(body)) BETWEEN 1 AND 2000)
      );
      CREATE INDEX idx_coach_messages_thread ON coach_messages (coach_id, athlete_id, created_at DESC);

      CREATE TABLE athlete_applications (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_applications_status_check CHECK (status IN ('new', 'reviewed', 'dismissed')),
        CONSTRAINT athlete_applications_distinct_check CHECK (coach_id <> athlete_id),
        CONSTRAINT athlete_applications_pair_key UNIQUE (coach_id, athlete_id)
      );
    `,
  },
  {
    version: 5,
    name: "coach_profile_and_verification",
    sql: `
      -- The rest of the coach profile form. organization, coaching_position and sport_specialization
      -- already exist from sign up; names live in user_profiles and the email in users.
      ALTER TABLE coach_profiles
        ADD COLUMN organization_type     TEXT NOT NULL DEFAULT '',
        ADD COLUMN organization_location TEXT NOT NULL DEFAULT '',
        ADD COLUMN program_name          TEXT NOT NULL DEFAULT '',
        ADD COLUMN competition_level     TEXT NOT NULL DEFAULT '',
        ADD COLUMN years_experience      TEXT NOT NULL DEFAULT '',
        ADD COLUMN background            TEXT NOT NULL DEFAULT '',
        ADD COLUMN certifications        TEXT NOT NULL DEFAULT '',
        ADD COLUMN official_email        TEXT NOT NULL DEFAULT '',
        ADD COLUMN credential_type       TEXT NOT NULL DEFAULT '',
        ADD COLUMN credential_reference  TEXT NOT NULL DEFAULT '';

      -- One row per coach who has asked to be verified. The coach sends the request; only a reviewer
      -- (permission coaches:review) can approve or reject it. The credential details are copied in
      -- when the request is sent, so the reviewer judges exactly what was submitted even if the
      -- coach edits their profile afterwards. A coach with NO row has not asked yet.
      CREATE TABLE coach_verifications (
        coach_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        status               TEXT NOT NULL DEFAULT 'pending',
        organization         TEXT NOT NULL,
        official_email       TEXT NOT NULL,
        credential_type      TEXT NOT NULL,
        credential_reference TEXT NOT NULL,
        submitted_at         TIMESTAMPTZ NOT NULL,
        reviewed_at          TIMESTAMPTZ,
        reviewed_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
        review_note          TEXT NOT NULL DEFAULT '',
        updated_at           TIMESTAMPTZ NOT NULL,
        CONSTRAINT coach_verifications_status_check CHECK (status IN ('pending', 'verified', 'rejected')),
        CONSTRAINT coach_verifications_reviewed_check CHECK ((status = 'pending') = (reviewed_at IS NULL)),
        CONSTRAINT coach_verifications_note_check CHECK (length(review_note) <= 500)
      );
      CREATE INDEX idx_coach_verifications_status ON coach_verifications (status, submitted_at);

      -- Approval grants this role; rejecting or revoking removes it. It carries 'sessions:verify',
      -- which is what the connections API already reads as "verified coach".
      INSERT INTO roles (name, description) VALUES ('verified_coach', 'Coach whose organization Sportal has verified');
      INSERT INTO permissions (name, description) VALUES ('coaches:review', 'Review, approve and reject coach verification requests');
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'sessions:verify' WHERE r.name = 'verified_coach';
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'coaches:review' WHERE r.name = 'admin';
    `,
  },
  {
    version: 6,
    name: "athlete_profile_extras_and_sessions",
    sql: `
      -- The rest of what the Settings / Complete Profile forms hold. sport, playing_position, school and
      -- bio already exist; names live in user_profiles; achievements in athlete_achievements.
      -- municipality / province are set by the platform (Rankings location filters), not by the athlete.
      ALTER TABLE athlete_profiles
        ADD COLUMN year_level   TEXT NOT NULL DEFAULT '',
        ADD COLUMN height_cm    NUMERIC(5,1),
        ADD COLUMN weight_kg    NUMERIC(5,1),
        ADD COLUMN team_status  TEXT NOT NULL DEFAULT '',
        ADD COLUMN team_name    TEXT NOT NULL DEFAULT '',
        ADD COLUMN municipality TEXT NOT NULL DEFAULT '',
        ADD COLUMN province     TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT athlete_profiles_height_check CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 230),
        ADD CONSTRAINT athlete_profiles_weight_check CHECK (weight_kg IS NULL OR weight_kg BETWEEN 30 AND 200),
        ADD CONSTRAINT athlete_profiles_team_status_check
          CHECK (team_status IN ('', 'Varsity', 'Junior Varsity', 'Reserve', 'Club / Community', 'Not on a team'));

      -- Scholarship interests and the profile showcase (photo + highlight video link).
      -- Photos are small resized images stored inline (the form caps them at ~400 KB); there is no
      -- moderation service yet, so 'approved' means "passed the format and size checks".
      CREATE TABLE athlete_extras (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        universities TEXT[] NOT NULL DEFAULT '{}',
        coverage     TEXT NOT NULL DEFAULT '',
        course       TEXT NOT NULL DEFAULT '',
        photo_data   TEXT,
        photo_status TEXT,
        video_url    TEXT,
        video_status TEXT,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_extras_coverage_check CHECK (coverage IN ('', 'Full tuition', 'Partial tuition', 'Stipend / allowance', 'Open to any')),
        CONSTRAINT athlete_extras_course_check CHECK (length(course) <= 80),
        CONSTRAINT athlete_extras_photo_check CHECK ((photo_data IS NULL) = (photo_status IS NULL) AND (photo_data IS NULL OR length(photo_data) <= 400000)),
        CONSTRAINT athlete_extras_video_check CHECK ((video_url IS NULL) = (video_status IS NULL) AND (video_url IS NULL OR length(video_url) <= 300)),
        CONSTRAINT athlete_extras_photo_status_check CHECK (photo_status IS NULL OR photo_status IN ('approved', 'pending', 'rejected')),
        CONSTRAINT athlete_extras_video_status_check CHECK (video_status IS NULL OR video_status IN ('approved', 'pending', 'rejected'))
      );

      -- Practice sessions. The server decides the status: a new session can be ai_assessed,
      -- self_reported or pending_review, never coach_verified. Only a verified coach who is connected
      -- to the athlete can move a session to coach_verified, and the row then names that coach.
      CREATE TABLE practice_sessions (
        id            TEXT PRIMARY KEY,
        athlete_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill         TEXT NOT NULL,
        result        NUMERIC(6,2) NOT NULL,
        consistency   NUMERIC(5,2),
        status        TEXT NOT NULL,
        simulated     BOOLEAN NOT NULL DEFAULT FALSE,
        session_date  DATE NOT NULL,
        verified_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
        verified_at   TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL,
        CONSTRAINT practice_sessions_status_check CHECK (status IN ('ai_assessed', 'pending_review', 'self_reported', 'coach_verified')),
        CONSTRAINT practice_sessions_result_check CHECK (result >= 0 AND result <= 300),
        CONSTRAINT practice_sessions_consistency_check CHECK (consistency IS NULL OR consistency BETWEEN 0 AND 100),
        CONSTRAINT practice_sessions_verified_check CHECK ((status = 'coach_verified') = (verified_at IS NOT NULL))
      );
      CREATE INDEX idx_practice_sessions_athlete ON practice_sessions (athlete_id, session_date DESC, created_at DESC);
      CREATE INDEX idx_practice_sessions_status ON practice_sessions (status) WHERE status = 'pending_review';
    `,
  },
  {
    version: 7,
    name: "scholarships_and_notifications",
    sql: `
      -- Scholarships posted by a university representative (or an admin). Replaces the hardcoded list.
      CREATE TABLE scholarships (
        id          TEXT PRIMARY KEY,
        posted_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
        university  TEXT NOT NULL,
        name        TEXT NOT NULL,
        sport       TEXT NOT NULL,
        coverage    TEXT NOT NULL DEFAULT '',
        details     TEXT NOT NULL DEFAULT '',
        eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
        deadline    DATE NOT NULL,
        is_open     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT scholarships_name_check CHECK (length(btrim(name)) BETWEEN 3 AND 120),
        CONSTRAINT scholarships_university_check CHECK (length(btrim(university)) BETWEEN 2 AND 120),
        CONSTRAINT scholarships_details_check CHECK (length(details) <= 2000)
      );
      CREATE INDEX idx_scholarships_open ON scholarships (is_open, deadline);
      CREATE INDEX idx_scholarships_sport ON scholarships (lower(sport));

      -- One application per athlete per scholarship. Withdrawing keeps the row so history survives.
      CREATE TABLE scholarship_applications (
        id             TEXT PRIMARY KEY,
        scholarship_id TEXT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
        athlete_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status         TEXT NOT NULL DEFAULT 'submitted',
        created_at     TIMESTAMPTZ NOT NULL,
        updated_at     TIMESTAMPTZ NOT NULL,
        CONSTRAINT scholarship_applications_status_check CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
        CONSTRAINT scholarship_applications_pair_key UNIQUE (scholarship_id, athlete_id)
      );
      CREATE INDEX idx_scholarship_applications_athlete ON scholarship_applications (athlete_id, created_at DESC);

      -- In-app notifications. Rows are created by the server when something happens, never by a client.
      CREATE TABLE notifications (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category   TEXT NOT NULL,
        title      TEXT NOT NULL,
        message    TEXT NOT NULL,
        link       TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        read_at    TIMESTAMPTZ,
        CONSTRAINT notifications_category_check CHECK (category IN ('analysis', 'ranking', 'recruitment', 'scholarship', 'application', 'verification', 'connection', 'system'))
      );
      CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
      CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;
    `,
  },
  {
    version: 8,
    name: "athlete_showcase_visibility",
    sql: `
      -- An athlete can hide themselves from public rankings (and, later, from the recruiting directory).
      -- New and existing athletes are visible by default, which is how rankings behaved before.
      ALTER TABLE athlete_profiles ADD COLUMN showcase_visible BOOLEAN NOT NULL DEFAULT TRUE;
    `,
  },
  {
    version: 9,
    name: "recruiting_inquiries_notes_and_threads",
    sql: `
      -- An inquiry now carries what the coach wrote and which program they wrote for.
      ALTER TABLE recruitment_inquiries
        ADD COLUMN organization TEXT NOT NULL DEFAULT '',
        ADD COLUMN message      TEXT NOT NULL DEFAULT '',
        ADD COLUMN responded_at TIMESTAMPTZ,
        ADD CONSTRAINT recruitment_inquiries_message_check CHECK (length(message) <= 1000),
        ADD CONSTRAINT recruitment_inquiries_organization_check CHECK (length(organization) <= 120);

      -- A coach's private note on a shortlisted athlete (the watchlist).
      ALTER TABLE coach_shortlist
        ADD COLUMN note TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT coach_shortlist_note_check CHECK (length(note) <= 500);

      -- Messages belong to an inquiry, so each inquiry is its own conversation. Older messages
      -- (no inquiry) keep working on the coach dashboard.
      ALTER TABLE coach_messages ADD COLUMN inquiry_id TEXT REFERENCES recruitment_inquiries(id) ON DELETE CASCADE;
      CREATE INDEX idx_coach_messages_inquiry ON coach_messages (inquiry_id, created_at);
      CREATE INDEX idx_recruitment_inquiries_athlete ON recruitment_inquiries (athlete_id, updated_at DESC);
    `,
  },
  {
    version: 10,
    name: "athlete_ranking_category",
    sql: `
      -- The ranking category an athlete competes in (the Rankings page filters on it). Chosen by the
      -- athlete; empty means not chosen.
      ALTER TABLE athlete_profiles
        ADD COLUMN category TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT athlete_profiles_category_check CHECK (category IN ('', 'Men''s Collegiate', 'Women''s Collegiate', 'Juniors'));
    `,
  },
  {
    version: 11,
    name: "universities_and_coach_affiliation",
    sql: `
      -- A university as an entity: the details the My University page shows. Before this, a university
      -- existed only as free text typed into profiles. The name is matched without case or edge
      -- spaces (name_key), so "Ateneo " and "ateneo" are one university.
      CREATE TABLE universities (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        name_key    TEXT NOT NULL UNIQUE,
        logo_url    TEXT NOT NULL DEFAULT '',
        location    TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        website     TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT universities_name_check CHECK (length(btrim(name)) BETWEEN 2 AND 120),
        CONSTRAINT universities_location_check CHECK (length(location) <= 200),
        CONSTRAINT universities_description_check CHECK (length(description) <= 2000),
        CONSTRAINT universities_logo_check CHECK (logo_url = '' OR (logo_url ~* '^https?://' AND length(logo_url) <= 500)),
        CONSTRAINT universities_website_check CHECK (website = '' OR (website ~* '^https?://' AND length(website) <= 300))
      );

      -- A coach's OFFICIAL university. It is set when a reviewer approves the coach's verification (using
      -- the organization the reviewer actually saw) and cleared if the approval is withdrawn, so it is
      -- never just something a coach typed. NULL = no university (or not approved).
      ALTER TABLE coach_profiles ADD COLUMN university_id TEXT REFERENCES universities(id) ON DELETE SET NULL;
      CREATE INDEX idx_coach_profiles_university ON coach_profiles (university_id) WHERE university_id IS NOT NULL;

      -- backfill start: coaches who were approved before this existed
      INSERT INTO universities (id, name, name_key, location, created_at, updated_at)
      SELECT md5(random()::text || clock_timestamp()::text || lower(btrim(v.organization))),
             MIN(btrim(v.organization)), lower(btrim(v.organization)),
             COALESCE(MAX(NULLIF(left(btrim(cp.organization_location), 200), '')), ''), now(), now()
      FROM coach_verifications v
      JOIN coach_profiles cp ON cp.user_id = v.coach_id
      WHERE v.status = 'verified' AND cp.organization_type IN ('University', 'College')
        AND length(btrim(v.organization)) BETWEEN 2 AND 120
      GROUP BY lower(btrim(v.organization))
      ON CONFLICT (name_key) DO NOTHING;

      UPDATE coach_profiles cp SET university_id = u.id
      FROM coach_verifications v JOIN universities u ON u.name_key = lower(btrim(v.organization))
      WHERE v.coach_id = cp.user_id AND v.status = 'verified' AND cp.organization_type IN ('University', 'College');
      -- backfill end
    `,
  },
];

const MIGRATION_LOCK_ID = 727_274_001;

async function migrate(db: Db): Promise<void> {
  await db.begin(async (tx) => {
    // Held until this transaction ends, so concurrent cold starts queue up instead of colliding.
    await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_ID})`;
    await tx.unsafe(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL
    )`);
    const rows = await tx<{ version: number }[]>`SELECT version FROM schema_migrations`;
    const applied = new Set(rows.map((r) => r.version));
    for (const m of MIGRATIONS) {
      if (applied.has(m.version)) continue;
      await tx.unsafe(m.sql);
      await tx`INSERT INTO schema_migrations (version, name, applied_at) VALUES (${m.version}, ${m.name}, ${new Date()})`;
    }
  });
}

export function connectionString(): string {
  const url = process.env["DATABASE_URL"] || process.env["POSTGRES_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your Postgres connection string (see .env.example).");
  }
  return url;
}

/** Open (and migrate) a database. */
export async function openDatabase(url: string): Promise<Db> {
  const db = postgres(url, {
    // Serverless: keep the pool tiny, since every warm instance holds its own connections.
    max: Number(process.env["DB_POOL_MAX"] ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    // Required behind PgBouncer-style poolers (Neon's pooled URL, Supabase's pooler).
    prepare: false,
    // Postgres returns timestamptz as Date objects and bigint as strings; keep it that way.
    onnotice: () => {},
  });
  try {
    await migrate(db);
  } catch (err) {
    await db.end({ timeout: 1 }).catch(() => {});
    throw err;
  }
  return db;
}

const globalKey = Symbol.for("sportal.db");
type GlobalWithDb = typeof globalThis & { [globalKey]?: Promise<Db> };

/** One shared pool per server process (also survives dev-server hot reloads). */
export function getDb(): Promise<Db> {
  const g = globalThis as GlobalWithDb;
  if (!g[globalKey]) {
    const p = openDatabase(connectionString());
    // A failed start (bad URL, database waking up) must not be cached forever.
    p.catch(() => {
      if (g[globalKey] === p) delete g[globalKey];
    });
    g[globalKey] = p;
  }
  return g[globalKey];
}

/** Close the pool (command-line scripts and tests; a server never needs this). */
export async function closeDb(): Promise<void> {
  const g = globalThis as GlobalWithDb;
  const p = g[globalKey];
  delete g[globalKey];
  if (p) await (await p.catch(() => null))?.end({ timeout: 5 });
}
