-- Caixa de entrada: andamento do áudio extraído e da transcrição (Whisper) de cada vídeo, e o texto transcrito.
alter table public.content_inbox
  add column if not exists audio_ready boolean not null default false,
  add column if not exists transcript_state text not null default 'nao_pedida' check (transcript_state in ('nao_pedida', 'processando', 'pronta', 'erro')),
  add column if not exists transcript text not null default '',
  add column if not exists transcript_error text not null default '',
  add column if not exists transcript_requested_at timestamptz;
