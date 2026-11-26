# Image Lab — configuração e publicação

O Image Lab adiciona a rota `/lab/editor` ao portfólio Pedro Vileira. Ele utiliza o Gemini 3 Pro Image (Nano Banana Pro) e aplica o mesmo prompt a cada fotografia em uma solicitação independente.

## 1. Dependências

O projeto usa `@vercel/blob` para receber arquivos diretamente do navegador e `jszip` para montar o arquivo ZIP com os resultados.

```bash
npm install
```

## 2. Chave da Gemini API

1. Acesse https://aistudio.google.com/apikey.
2. Crie uma API key.
3. Adicione `GEMINI_API_KEY` nas variáveis de ambiente do projeto na Vercel.

O modelo configurado é `gemini-3-pro-image` (Gemini 3 Pro Image / Nano Banana Pro). A chave é usada somente no servidor e nunca é enviada ao navegador.

## 3. Criar o armazenamento de imagens

1. Abra o projeto na Vercel.
2. Vá em **Storage** e crie um **Blob Store privado (Private)**.
3. Conecte o Blob ao projeto e habilite a variável `BLOB_READ_WRITE_TOKEN` em Production, Preview e Development conforme necessário. O fluxo `handleUpload` precisa do read-write token estático; OIDC sozinho não é suficiente para essa rota.

O upload é feito diretamente do navegador para o Blob privado, evitando o limite de corpo de requisição de 4,5 MB das funções Vercel. As imagens originais não ficam publicamente acessíveis e são apagadas pelo endpoint de processamento após cada tentativa. Se um upload for abandonado antes do processamento, o callback aplica expiração de um dia como proteção adicional. O pacote `@vercel/blob` precisa ser versão 2.3.0 ou superior para Private Blob. Os resultados ficam na memória do navegador e são baixados pelo usuário; não são salvos no servidor.

## 4. Proteger o editor

Gere dois valores secretos diferentes e adicione na Vercel:

- `EDITOR_ACCESS_PASSWORD`: senha que será digitada na página Image Lab.
- `EDITOR_SESSION_SECRET`: segredo aleatório longo, recomendado com pelo menos 32 caracteres.

Exemplo para gerar um segredo localmente:

```bash
openssl rand -base64 48
```

Não coloque esses valores no código-fonte nem os publique no GitHub. A sessão de acesso dura 12 horas.

## 5. Variáveis locais

Copie `.env.example` para `.env.local` e preencha as variáveis. Para uploads Blob em desenvolvimento local, use `vercel dev` e configure o callback público do Blob conforme a documentação da Vercel (por exemplo, com um túnel HTTPS). O callback de upload do Blob não consegue chamar `localhost` diretamente. Em produção, o callback é resolvido automaticamente pela Vercel.

## 6. Publicar

1. Faça commit dos arquivos no GitHub.
2. Na Vercel, confira as quatro variáveis de ambiente.
3. Confirme que o Blob Store está conectado ao mesmo projeto Vercel.
4. Faça um novo deploy.
5. Abra `https://pedrovileira.com/lab/editor` e entre com `EDITOR_ACCESS_PASSWORD`.

## 7. Limites iniciais

- Até 30 fotografias por lote.
- JPG, PNG e WEBP.
- Até 12 MB por fotografia.
- Duas imagens processadas simultaneamente.
- Resoluções de saída 1K, 2K e 4K.
- Proporções automática, 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 e 21:9.

Cada fotografia gera uma chamada independente à Gemini API. O custo depende da resolução e do uso do modelo. Consulte os preços atuais antes de processar lotes grandes: https://ai.google.dev/gemini-api/docs/pricing.

## 8. Observações de segurança e operação

- A página usa uma senha de acesso e um cookie HttpOnly assinado no servidor.
- As rotas de upload e processamento verificam a sessão.
- A chave da Gemini API permanece no servidor.
- O endpoint aceita apenas URLs de arquivos enviados ao prefixo `pv-editor/input/` do Vercel Private Blob.
- Os arquivos originais são removidos após o processamento, inclusive em caso de erro.
- Os resultados existem no navegador até o usuário baixar o arquivo ou fechar/atualizar a página.
- O processamento é feito em chamadas individuais, com duas chamadas simultâneas. O limite de duração da rota está configurado em 60 segundos; confirme o limite de duração de Functions do plano Vercel utilizado.
