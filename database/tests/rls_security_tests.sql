-- =========================================================
-- TEST 1
-- A non-member must not see a private channel
-- Daniel cannot access Carlos' backend-private channel
-- =========================================================

BEGIN;

SET LOCAL ROLE rw_app_user;

SELECT set_config(
    'app.current_user_id',
    '11111111-1111-1111-1111-111111111111',
    true
);

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM rw_channels
    WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    IF v_count <> 0 THEN
        RAISE EXCEPTION
            'TEST 1 FAILED: unauthorized private channel was visible';
    END IF;

    RAISE NOTICE
        'TEST 1 PASSED: unauthorized private channel is hidden';
END;
$$;

ROLLBACK;


-- =========================================================
-- TEST 2
-- Private messages from unrelated channels must not be returned
-- Daniel cannot read messages from backend-private
-- =========================================================

BEGIN;

SET LOCAL ROLE rw_app_user;

SELECT set_config(
    'app.current_user_id',
    '11111111-1111-1111-1111-111111111111',
    true
);

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM rw_messages
    WHERE channel_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    IF v_count <> 0 THEN
        RAISE EXCEPTION
            'TEST 2 FAILED: unauthorized private messages were returned';
    END IF;

    RAISE NOTICE
        'TEST 2 PASSED: unauthorized private messages are hidden';
END;
$$;

ROLLBACK;