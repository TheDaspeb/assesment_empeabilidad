CREATE OR REPLACE FUNCTION rw_invalidate_message_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.content IS DISTINCT FROM OLD.content THEN
        NEW.embedding := NULL;
    END IF;

    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rw_messages_embedding_consistency
BEFORE UPDATE ON rw_messages
FOR EACH ROW
EXECUTE FUNCTION rw_invalidate_message_embedding();