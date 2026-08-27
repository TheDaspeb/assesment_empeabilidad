CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rw_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    job_title VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE rw_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_rw_channels_type
        CHECK (type IN ('PUBLIC', 'PRIVATE'))
);

CREATE TABLE rw_channel_members (
    channel_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (channel_id, user_id),

    CONSTRAINT fk_rw_channel_members_channel
        FOREIGN KEY (channel_id)
        REFERENCES rw_channels(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rw_channel_members_user
        FOREIGN KEY (user_id)
        REFERENCES rw_users(id)
        ON DELETE CASCADE
);

CREATE TABLE rw_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_rw_messages_channel
        FOREIGN KEY (channel_id)
        REFERENCES rw_channels(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_rw_messages_sender
        FOREIGN KEY (sender_id)
        REFERENCES rw_users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_rw_messages_status
        CHECK (status IN ('PENDING', 'SENT', 'FAILED')),

    CONSTRAINT chk_rw_messages_content
        CHECK (char_length(trim(content)) > 0)
);

CREATE TABLE rw_message_reads (
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (message_id, user_id),

    CONSTRAINT fk_rw_message_reads_message
        FOREIGN KEY (message_id)
        REFERENCES rw_messages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rw_message_reads_user
        FOREIGN KEY (user_id)
        REFERENCES rw_users(id)
        ON DELETE CASCADE
);

CREATE TABLE rw_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rw_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES rw_users(id)
        ON DELETE CASCADE
);

CREATE TABLE rw_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tokens_used INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rw_ai_usage_user
        FOREIGN KEY (user_id)
        REFERENCES rw_users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_rw_ai_usage_tokens
        CHECK (tokens_used >= 0)
);

CREATE UNIQUE INDEX ux_rw_users_active_email
ON rw_users (lower(email))
WHERE deleted_at IS NULL;

CREATE INDEX ix_rw_messages_channel_created
ON rw_messages (channel_id, created_at DESC);

CREATE INDEX ix_rw_channel_members_user
ON rw_channel_members (user_id);