-- Posts de vídeo único marcados como "feed" saíram no Instagram como Reels (o Instagram não aceita mais vídeo no
-- feed). A publicação agora grava o formato que saiu; aqui os que já foram publicados, pelo link (/reel/).
update public.content_posts
set format = 'reels'
where format = 'feed' and publish_status = 'publicado' and ig_permalink like '%instagram.com/reel/%';
