-- Excluir artigo do blog: a equipe pode, desde que ele não esteja publicado (tirar do ar antes evita link quebrado
-- no Google). Os eventos de leitura do artigo vão junto (on delete cascade).
create policy blog_posts_excluir on public.blog_posts for delete to authenticated using (is_team() and status <> 'publicado');
