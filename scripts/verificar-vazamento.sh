#!/bin/bash
# Uso: BASE=http://localhost:3000 scripts/verificar-vazamento.sh <postId> <clienteId> <token>
# sem cookie, nenhuma página do admin pode conter dados.
B=${BASE:-http://localhost:3000}
POST=$1; CLIENTE=$2; TOKEN=$3
falhou=0
for rota in /admin /admin/clientes/$CLIENTE /admin/posts/$POST /admin/posts/$POST/editar; do
  for h in "" "RSC: 1"; do
    corpo=$(curl -s ${h:+-H "$h"} "$B$rota")
    if echo "$corpo" | grep -q -e "$TOKEN" -e "Ouro vale mais" -e "\"legenda\"" -e "dev-arquivos"; then echo "VAZA: $rota [$h]"; falhou=1; fi
  done
done
[ $falhou = 0 ] && echo "SEM VAZAMENTO"
exit $falhou
