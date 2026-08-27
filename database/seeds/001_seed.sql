CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================

INSERT INTO rw_users (
    id,
    name,
    email,
    password_hash,
    job_title
)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Daniel Perez',
    'daniel@riwi.local',
    crypt('Daniel123*', gen_salt('bf')),
    'Software Developer'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Ana Gomez',
    'ana@riwi.local',
    crypt('Ana123*', gen_salt('bf')),
    'Product Manager'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Carlos Ruiz',
    'carlos@riwi.local',
    crypt('Carlos123*', gen_salt('bf')),
    'Backend Developer'
);


-- =========================================================
-- CHANNELS
-- =========================================================

INSERT INTO rw_channels (
    id,
    name,
    type
)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'general',
    'PUBLIC'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'frontend-team',
    'PRIVATE'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'backend-private',
    'PRIVATE'
);


-- =========================================================
-- CHANNEL MEMBERS
-- =========================================================

INSERT INTO rw_channel_members (channel_id, user_id)
VALUES

-- General
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333'
),

-- Frontend
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222'
),

-- Backend private: Carlos only
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333'
);


-- =========================================================
-- MESSAGES
-- =========================================================

INSERT INTO rw_messages (
    channel_id,
    sender_id,
    content,
    status
)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'The general meeting is tomorrow at nine in the morning.',
    'SENT'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Great, I will check the pending tasks before the meeting.',
    'SENT'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'The frontend team must finish the responsive interface this week.',
    'SENT'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'I am working on the conversations view and the copilot panel.',
    'SENT'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'The test environment temporary password must change before deployment.',
    'SENT'
);
