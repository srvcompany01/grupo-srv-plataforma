-- SÓ DESENVOLVIMENTO. Aplicar depois de criar o primeiro admin (as tarefas são atribuídas a ele).
-- npm run db:push -- --include-seed  (ou colar no SQL Editor do projeto dev)
do $$
declare
  admin uuid := (select id from profiles where role = 'admin' and active order by created_at limit 1);
  conteudo uuid := (select id from spaces where name = 'Conteúdo');
  cliente uuid;
  pasta uuid;
  lista uuid;
  tarefa uuid;
  nome text;
  i int;
begin
  if admin is null then
    raise notice 'Seed ignorado: crie o primeiro admin antes.';
    return;
  end if;
  foreach nome in array array['Padaria Pão Quente', 'Clínica Sorriso'] loop
    insert into clients (name) values (nome) returning id into cliente;
    insert into folders (space_id, name, position) values (conteudo, nome, 'a' || length(nome)) returning id into pasta;
    insert into lists (space_id, folder_id, client_id, name, reference_month, position)
    values (conteudo, pasta, cliente, 'Conteúdo Estratégico', '2026-10-01', 'a0') returning id into lista;
    for i in 1..5 loop
      insert into tasks (list_id, title, position, due_date)
      values (lista, 'Post ' || i, 'a' || i, date '2026-10-05' + i * 4) returning id into tarefa;
      insert into task_assignees (task_id, user_id) values (tarefa, admin);
    end loop;
  end loop;
end $$;
