DO $$
DECLARE
  canonical_id UUID := '896ffdc9-2c50-4746-aac8-b9fc8820f3a6';
  duplicate_id UUID := 'e75b60db-c97b-4e0b-84a3-246c41e81edf';
  dup_prose TEXT;
  dup_closing TEXT;
  next_pos INT;
BEGIN
  SELECT prose_woven, closing_reflection INTO dup_prose, dup_closing
  FROM codex_chapters WHERE id = duplicate_id;

  IF dup_prose IS NULL THEN
    RAISE NOTICE 'duplicate already removed';
    RETURN;
  END IF;

  UPDATE codex_chapters
  SET prose_woven = COALESCE(prose_woven, '') || E'\n\n' || COALESCE(dup_prose, ''),
      closing_reflection = COALESCE(dup_closing, closing_reflection),
      subject_key = 'bhagavad gita',
      title = 'Bhagavad Gita: The Kurukshetra Download',
      version = COALESCE(version, 1) + 1,
      updated_at = now()
  WHERE id = canonical_id;

  INSERT INTO codex_chapter_versions (chapter_id, version, prose_snapshot, trigger_event)
  SELECT id, version, prose_woven, 'manual_merge'
  FROM codex_chapters WHERE id = canonical_id;

  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM codex_fragments WHERE chapter_id = canonical_id;

  UPDATE codex_fragments
  SET chapter_id = canonical_id,
      position = next_pos + position
  WHERE chapter_id = duplicate_id;

  -- Just nuke any cross-refs touching the duplicate; rebuild later if needed
  DELETE FROM codex_cross_refs
    WHERE from_chapter_id = duplicate_id OR to_chapter_id = duplicate_id;

  DELETE FROM codex_chapter_versions WHERE chapter_id = duplicate_id;
  DELETE FROM codex_chapters WHERE id = duplicate_id;
END $$;