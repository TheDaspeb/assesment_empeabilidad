-- =========================================================
-- Procedure 1: query user
-- =========================================================

CREATE OR REPLACE PROCEDURE rw_get_user(
    IN p_user_id UUID,
    INOUT p_result REFCURSOR DEFAULT 'user_result'
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_result FOR
    SELECT
        id,
        name,
        email,
        job_title,
        is_active,
        created_at,
        updated_at
    FROM rw_users
    WHERE id = p_user_id
      AND deleted_at IS NULL;
END;
$$;


-- =========================================================
-- Procedure 2: edit or soft delete user
-- =========================================================

CREATE OR REPLACE PROCEDURE rw_manage_user(
    p_user_id UUID,
    p_action VARCHAR,
    p_name VARCHAR DEFAULT NULL,
    p_job_title VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_action = 'UPDATE' THEN

        UPDATE rw_users
        SET
            name = COALESCE(p_name, name),
            job_title = COALESCE(p_job_title, job_title),
            updated_at = NOW()
        WHERE id = p_user_id
          AND deleted_at IS NULL;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'User not found';
        END IF;

    ELSIF p_action = 'DELETE' THEN

        UPDATE rw_users
        SET
            is_active = FALSE,
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = p_user_id
          AND deleted_at IS NULL;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'User not found';
        END IF;

    ELSE
        RAISE EXCEPTION 'Invalid action. Use UPDATE or DELETE';
    END IF;
END;
$$;