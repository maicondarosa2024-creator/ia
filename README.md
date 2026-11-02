# Assistente com IA (PWA)

App de celular com comando de voz e agentes que aprendem com o seu dia a dia.
Ao abrir, ele pergunta se você precisa de ajuda.

## Como usar no celular

O microfone exige HTTPS (ou localhost). Opções:

1. **Teste rápido no PC:** na pasta `versao`, rode `npx serve .` e abra `http://localhost:3000`.
2. **No celular:** publique a pasta `versao` em um host HTTPS gratuito (GitHub Pages, Netlify, Cloudflare Pages), abra o link no **Chrome do Android** e use **Menu > Adicionar à tela inicial**. Ele passa a abrir como app.

## Comandos de voz

- "tarefa comprar café" / "preciso pagar a conta de luz"
- "estou estudando inglês" ... "terminei"
- "concluir café"
- "minhas tarefas", "resumo do dia", "sugestões", "ajuda"

## Agentes (aprendem sozinhos, tudo salvo só no seu aparelho)

| Agente | O que aprende | O que sugere |
|---|---|---|
| Rotina | Atividades repetidas no mesmo horário (3+ dias) | Criar rotina e te avisar ao abrir o app |
| Foco | Acúmulo de tarefas e tarefas paradas | Priorizar 3 e dividir em primeiro passo |
| Hábitos | Sessões longas (90+ min) | Pausas regulares |
| Comandos | Frases que você repete e o app não entendeu | Salvar como atalho |

Na tela **Início** aparecem os bonecos dos agentes (Rita, Fábio, Helena e Caio) com o que cada um está fazendo. Na aba **Escritório** eles aparecem em 3D, sentados nas mesas trabalhando (arraste para girar, pinça para aproximar). O 3D usa a biblioteca Three.js, que precisa de internet para carregar.

### Pesquisa, base de conhecimento e gravação

- **Perguntas** ("o que é fotossíntese?", "pesquise sobre sono"): o agente mais adequado primeiro consulta a própria base; se não souber, pesquisa na web (API da Wikipédia em português, que funciona direto do navegador) e salva a resposta com a fonte. Sem internet, a pergunta fica na fila e é refeita quando a conexão volta.
- **Base de conhecimento** (aba **Base**): cada agente guarda pesquisas, notas, tarefas concluídas, atividades e um resumo diário escrito automaticamente. Tem busca, filtro por agente, exclusão e exportação em `.md`.
- **Conversas gravadas**: todas as mensagens são salvas automaticamente no aparelho (últimas 600). Dá para desligar a gravação na aba Base.
- **Melhorias sugeridas**: o agente de Foco acompanha a taxa de conclusão e o período do dia em que você mais conclui tarefas; o de Comandos percebe assuntos que você pesquisa repetidamente e propõe tarefas de estudo.

### Configurar IAs gratuitas (botão ⚙️ no topo)

Na tela de configuração você cola a chave de cada serviço e toca em **Testar**:

| Serviço | Pesquisa na web | Onde criar a chave grátis |
|---|---|---|
| Google Gemini | Sim (Google embutido, com fontes) | aistudio.google.com/apikey |
| Groq | Não | console.groq.com/keys |
| OpenRouter (modelos `:free`) | Não | openrouter.ai/keys |

Ordem de uso a cada pergunta: servidor próprio (Claude) → Gemini → Groq → OpenRouter → Wikipédia. Se um falhar (limite diário, chave errada), o app passa ao próximo. O campo **Modelo** é editável, pois os serviços gratuitos trocam nomes de modelos com frequência. As chaves ficam só no navegador do aparelho e não são apagadas pelo botão "Apagar meus dados".

### Busca web completa (servidor com Claude)

O `server.js` serve o app e responde perguntas com o Claude usando busca na web (notícias, preços, assuntos atuais). A chave fica só no servidor.

```
set ANTHROPIC_API_KEY=sua_chave        (Windows)   |   export ANTHROPIC_API_KEY=sua_chave   (Mac/Linux)
node server.js
```

Abra `http://localhost:3300`. Opcionais: `PORT`, `CLAUDE_MODEL` (padrão `claude-sonnet-5-5`) e `APP_TOKEN` (se definido, o app precisa enviar o mesmo token; cole-o em **⚙️ > Meu servidor > Token do servidor**). Sem servidor ou sem chave, o app usa a Wikipédia automaticamente. Para usar no celular fora de casa, o servidor precisa ficar atrás de HTTPS (ex.: Cloudflare Tunnel) e, nesse caso, defina `APP_TOKEN`.

Use o botão **Carregar exemplo de uso** na aba Agentes para ver tudo funcionando de imediato.

## Próximos passos (se quiser IA generativa de verdade)

Hoje os agentes usam regras locais, sem enviar nada para fora. Para conversa livre e sugestões mais inteligentes, o caminho é criar um pequeno backend que chama a API do Claude (a chave nunca deve ficar no app) e enviar a ele o resumo das atividades. Também dá para empacotar o PWA como app nativo (Capacitor) para ter notificações em segundo plano.
