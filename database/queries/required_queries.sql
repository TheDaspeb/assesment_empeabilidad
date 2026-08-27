-- =========================================================
-- QUERY 1
-- Channel message history using keyset pagination
-- =========================================================

SELECT
    id,
    channel_id,
    sender_id,
    content,
    status,
    created_at,
    updated_at
FROM rw_messages
WHERE channel_id = $1
  AND deleted_at IS NULL
  AND (
      $2::timestamptz IS NULL
      OR (created_at, id) < ($2::timestamptz, $3::uuid)
  )
ORDER BY created_at DESC, id DESC
LIMIT $4;


-- =========================================================
-- QUERY 2
-- Message search with highlighted results
-- =========================================================

SELECT
    id,
    channel_id,
    sender_id,
    content,
    ts_headline(
        'spanish',
        content,
        plainto_tsquery('spanish', $1)
    ) AS highlighted_content,
    created_at
FROM rw_messages
WHERE deleted_at IS NULL
  AND to_tsvector('spanish', content)
      @@ plainto_tsquery('spanish', $1)
ORDER BY created_at DESC
LIMIT $2;


-- =========================================================
-- QUERY 3
-- Authorized context retrieval for the AI copilot
-- =========================================================

SELECT
    m.id,
    m.channel_id,
    m.sender_id,
    m.content,
    m.created_at,
    1 - (m.embedding <=> $1::vector) AS similarity
FROM rw_messages m
WHERE m.deleted_at IS NULL

  AND EXISTS (
      SELECT 1
      FROM rw_channel_members cm
      WHERE cm.channel_id = m.channel_id
        AND cm.user_id =
            current_setting('app.current_user_id', true)::uuid
  )

  AND m.embedding IS NOT NULL

ORDER BY m.embedding <=> $1::vector
LIMIT $2;


-- =========================================================
-- QUERY 4
-- Accumulated AI usage by user
-- =========================================================

SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(SUM(a.tokens_used), 0) AS total_tokens_used
FROM rw_users u
LEFT JOIN rw_ai_usage a
    ON a.user_id = u.id
WHERE u.id = $1
GROUP BY
    u.id,
    u.name,
    u.email;