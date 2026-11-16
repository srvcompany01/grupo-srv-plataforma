-- Reels de teste (Trial Reels do Instagram): o Reels aparece primeiro só para quem não segue o perfil.
-- MANUAL = a pessoa libera para os seguidores pelo aplicativo; SS_PERFORMANCE = o Instagram libera sozinho se o Reels for bem. null = Reels normal.
alter table public.content_posts
  add column if not exists trial_graduation text check (trial_graduation in ('MANUAL', 'SS_PERFORMANCE'));
