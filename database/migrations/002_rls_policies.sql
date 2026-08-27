ALTER TABLE rw_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rw_messages ENABLE ROW LEVEL SECURITY;

CREATE ROLE rw_app_user NOLOGIN NOBYPASSRLS;

GRANT SELECT, INSERT, UPDATE ON rw_channels TO rw_app_user;
GRANT SELECT, INSERT, UPDATE ON rw_messages TO rw_app_user;
GRANT SELECT ON rw_channel_members TO rw_app_user;

CREATE POLICY rw_channels_select_policy
ON rw_channels
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM rw_channel_members cm
        WHERE cm.channel_id = rw_channels.id
          AND cm.user_id = current_setting('app.current_user_id', true)::uuid
    )
);

CREATE POLICY rw_messages_select_policy
ON rw_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM rw_channel_members cm
        WHERE cm.channel_id = rw_messages.channel_id
          AND cm.user_id = current_setting('app.current_user_id', true)::uuid
    )
);

CREATE POLICY rw_messages_insert_policy
ON rw_messages
FOR INSERT
WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)::uuid
    AND EXISTS (
        SELECT 1
        FROM rw_channel_members cm
        WHERE cm.channel_id = rw_messages.channel_id
          AND cm.user_id = current_setting('app.current_user_id', true)::uuid
    )
);

CREATE POLICY rw_messages_update_policy
ON rw_messages
FOR UPDATE
USING (
    sender_id = current_setting('app.current_user_id', true)::uuid
)
WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)::uuid
);