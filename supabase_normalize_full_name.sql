-- ============================================================
-- Normalize candidate full_name capitalization.
-- Adds a smart_title_case() function + BEFORE INSERT/UPDATE
-- trigger on candidate_profiles.full_name (and profiles.full_name
-- since the recruiter header reads from there too).
--
-- Handles:
--   "joseph"             -> "Joseph"
--   "JOHN SMITH"         -> "John Smith"
--   "jean-paul sartre"   -> "Jean-Paul Sartre"  (initcap keeps hyphen)
--   "mcdonald"           -> "McDonald"          (Mc prefix preserved)
--   "maclaren"           -> "MacLaren"          (short Mac preserved)
--   "o'brien"            -> "O'Brien"           (apostrophe preserved)
--   NULL/empty           -> unchanged
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ---------- 1. The smart-title-case function ----------
CREATE OR REPLACE FUNCTION public.smart_title_case(input text)
RETURNS text AS $$
DECLARE
  parts text[];
  word text;
  out_text text := '';
  i int;
BEGIN
  IF input IS NULL OR btrim(input) = '' THEN
    RETURN input;
  END IF;

  -- Collapse internal whitespace, trim, split on space.
  parts := string_to_array(btrim(regexp_replace(input, '\s+', ' ', 'g')), ' ');

  FOR i IN 1..array_length(parts, 1) LOOP
    word := parts[i];
    IF word = '' THEN
      CONTINUE;
    END IF;

    -- McDonald, McLean, ...
    IF word ~ '^Mc[a-z]' THEN
      word := 'Mc' || upper(substr(word, 3, 1)) || lower(substr(word, 4));
    -- Mac prefix only when word is short (MacLeod, MacKay — not Machinery)
    ELSIF word ~ '^Mac[a-z]' AND length(word) <= 7 THEN
      word := 'Mac' || upper(substr(word, 4, 1)) || lower(substr(word, 5));
    -- O'Brien, O'Connor, O'Neal
    ELSIF word ~ '^O''[a-z]' THEN
      word := 'O''' || upper(substr(word, 3, 1)) || lower(substr(word, 4));
    -- Everything else: rely on initcap (handles hyphens, keeps letters)
    ELSE
      word := initcap(lower(word));
    END IF;

    out_text := out_text || word || ' ';
  END LOOP;

  RETURN btrim(out_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------- 2. Trigger function for candidate_profiles ----------
CREATE OR REPLACE FUNCTION public.normalize_candidate_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := public.smart_title_case(NEW.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_candidate_full_name ON public.candidate_profiles;
CREATE TRIGGER trg_normalize_candidate_full_name
  BEFORE INSERT OR UPDATE OF full_name ON public.candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_candidate_full_name();

-- ---------- 3. Same trigger for profiles (header shows profiles.full_name) ----------
CREATE OR REPLACE FUNCTION public.normalize_profile_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := public.smart_title_case(NEW.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_profile_full_name ON public.profiles;
CREATE TRIGGER trg_normalize_profile_full_name
  BEFORE INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_profile_full_name();

-- ---------- 4. One-time cleanup of existing rows ----------
-- Run once after installing the function to fix existing lowercase data.
UPDATE public.candidate_profiles
SET full_name = public.smart_title_case(full_name)
WHERE full_name IS NOT NULL
  AND full_name <> public.smart_title_case(full_name);

UPDATE public.profiles
SET full_name = public.smart_title_case(full_name)
WHERE full_name IS NOT NULL
  AND full_name <> public.smart_title_case(full_name);

-- ---------- 5. Sanity check ----------
SELECT id, full_name, updated_at
FROM public.candidate_profiles
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;