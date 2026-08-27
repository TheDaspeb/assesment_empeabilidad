-- =========================================================
-- Transactional function: create message
-- =========================================================

CREATE OR REPLACE FUNCTION rw_create_message(
    p_channel_id UUID,
    p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
BEGIN
    v_user_id := current_setting(
        'app.current_user_id',
        true
    )::UUID;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authenticated user is required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM rw_channel_members
        WHERE channel_id = p_channel_id
          AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this channel';
    END IF;

    INSERT INTO rw_messages (
        channel_id,
        sender_id,
        content,
        status
    )
    VALUES (
        p_channel_id,
        v_user_id,
        p_content,
        'SENT'
    )
    RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$;


-- =========================================================
-- Transactional function: soft delete message
-- Physical deletion is prohibited.
-- =========================================================

CREATE OR REPLACE FUNCTION rw_delete_message(
    p_message_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := current_setting(
        'app.current_user_id',
        true
    )::UUID;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authenticated user is required';
    END IF;

    UPDATE rw_messages
    SET
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_message_id
      AND sender_id = v_user_id
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found or operation not permitted';
    END IF;

    RETURN TRUE;
END;
$$;


-- =========================================================
-- User conversation view
-- RLS on rw_channels restricts the visible channels.
-- =========================================================

CREATE OR REPLACE VIEW rw_user_conversations
WITH (security_invoker = true)
AS
SELECT
    c.id AS channel_id,
    c.name AS channel_name,
    c.type AS channel_type,

    (
        SELECT m.content
        FROM rw_messages m
        WHERE m.channel_id = c.id
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
    ) AS last_message,

    (
        SELECT m.created_at
        FROM rw_messages m
        WHERE m.channel_id = c.id
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
    ) AS last_message_at

FROM rw_channels c;