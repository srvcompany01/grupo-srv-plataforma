@AGENTS.md

# MCP da plataforma

A plataforma expõe suas funcionalidades para IAs (Claude, Codex) em `POST /api/mcp`. O catálogo único de ferramentas é `src/mcp/ferramentas.ts`.
Ao criar ou alterar uma funcionalidade que uma IA deva poder usar, registre ou atualize a ferramenta correspondente nesse arquivo
(reaproveite as funções de `src/servicos/`, sem duplicar regra) e mantenha `descrever_plataforma` fiel às regras. Leitura: `escrita: false`.
Escrita: `escrita: true`. Não exponha exclusão definitiva.
