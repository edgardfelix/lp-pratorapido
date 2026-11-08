# Prato Rápido · Landing page

Landing page de vendas do **Prato Rápido** (app de receitas e nutrição com IA) e o servidor Node.js que liga o pagamento na Cakto à liberação do acesso por e-mail.

- **Front-end:** React 19, TypeScript 7 (strict), styled-components 6, React Router DOM 7, Vite 8. Páginas pré-renderizadas (SSG) e hidratadas no navegador.
- **Servidor:** Node.js 22+, Express 5, Helmet, rate limiting, Zod, JWT (jose), Nodemailer, Upstash Redis.
- **Hospedagem:** Vercel (CDN para as páginas, Vercel Function em `/api`) ou qualquer servidor Node.
- **Design:** sistema Obsidian (fundo slate escuro, laranja da marca `#FE6505` extraído da logo), Geist + Geist Mono auto-hospedadas, motion segundo Emil Kowalski e as regras da Taste Skill em `.agents/`.

## Estrutura

```
lp-pratorapido/
├── api/index.js             Vercel Function: entrega /api/* ao servidor Express
├── vercel.json              build, saída, região, rewrites e cabeçalhos de segurança na Vercel
├── assets/                  arquivos originais do cliente (logo, print do app, vídeo)
├── scripts/build-media.mjs  gera logo vetorial, favicons, vídeos otimizados e recortes
├── scripts/build-og.mjs     fotografa o hero para a imagem de compartilhamento (og.jpg)
├── client/                  a landing page
│   ├── public/              favicons, manifest, robots, media/ (vídeo + pôsteres)
│   ├── scripts/prerender.mjs
│   └── src/
│       ├── components/      layout/, sections/, app-screens/ (telas do app em HTML), legal/, ui/
│       ├── content/         toda a copy (pt-BR), documentos legais e metadados
│       ├── hooks/           vídeo do hero, passo ativo, fluxo de acesso, contatos…
│       ├── lib/             checkout, sanitização, segurança, API, atribuição de campanha
│       ├── pages/           landing, páginas legais, /acesso, 404
│       └── styles/          tokens do design system e estilo global
└── server/                  integração Node.js (webhook Cakto, acesso, arquivos estáticos)
    ├── src/
    └── test/
```

## Rodando localmente

```bash
npm install
npm run dev          # client em http://localhost:5173 + servidor em http://localhost:8787
```

O Vite encaminha `/api` para o servidor. Sem SMTP configurado, o código de 4 dígitos aparece no terminal do servidor (somente em desenvolvimento).

## Build e produção

```bash
cp server/.env.example server/.env   # preencha os segredos
npm run build                        # typecheck, bundle, SSR e pré-renderização + compila o servidor
npm start                            # serve a página e a API na porta PORT
```

O build gera `client/dist/` com uma página HTML pronta por rota (`/`, `/privacidade`, `/termos`, `/cookies`, `/acesso`, `404.html`). Ela também pode ser publicada sozinha em uma CDN; nesse caso, configure no provedor os cabeçalhos de segurança equivalentes aos de `server/src/middleware/security.ts` e aponte `/api` para o servidor.

### Deploy na Vercel

O `vercel.json` já define tudo: `npm run build` na raiz, saída em `client/dist`, a Function `api/index.js` (região `gru1`, São Paulo, a mesma do Upstash) recebendo `/api/*`, URLs limpas e os mesmos cabeçalhos de segurança do servidor (CSP, HSTS, COOP/CORP, `X-Frame-Options`, Permissions-Policy). As páginas saem da CDN; só a API roda como Function.

Na Vercel, o servidor assume sozinho `NODE_ENV=production`, `TRUST_PROXY=1` e `PUBLIC_ORIGIN` = domínio de produção do projeto (`VERCEL_PROJECT_PRODUCTION_URL`), e o client usa esse mesmo domínio em canonical e Open Graph. Ao ligar um domínio próprio, basta um novo deploy.

Variáveis obrigatórias no projeto (Settings → Environment Variables, ambiente Production):

| Variável | Valor |
| --- | --- |
| `NODEJS_HELPERS` | `0` (o webhook precisa dos bytes exatos que a Cakto assinou) |
| `CAKTO_WEBHOOK_SECRET` | o segredo exibido pela Cakto ao criar o webhook |
| `CAKTO_REQUIRE_SIGNATURE` | `true` |
| `ACCESS_TOKEN_SECRET` | 32+ caracteres aleatórios |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | credenciais REST do banco Upstash (sem elas a Function responde 503) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | envio dos códigos de acesso |
| `CAKTO_PRODUCT_IDS` | (recomendado) ids do produto que liberam acesso |

Toda variável alterada só vale a partir do próximo deploy (`vercel --prod`).

### Variáveis de ambiente

| Arquivo | Variável | Para quê |
| --- | --- | --- |
| `client/.env` | `VITE_SITE_URL` | domínio público (URLs absolutas de compartilhamento e canonical) |
| `client/.env` | `VITE_APP_URL` | (opcional) link para abrir o app |
| `server/.env` | `CAKTO_WEBHOOK_SECRET` | segredo do webhook criado no painel da Cakto |
| `server/.env` | `CAKTO_PRODUCT_IDS` | ids do produto que liberam acesso (recomendado) |
| `server/.env` | `ACCESS_TOKEN_SECRET` | 32+ caracteres aleatórios para assinar os tokens |
| `server/.env` | `SMTP_*`, `MAIL_FROM` | envio do código de acesso por e-mail |
| `server/.env` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | armazenamento no Redis (obrigatório na Vercel; sem elas, arquivo JSON local) |
| `server/.env` | `PUBLIC_ORIGIN`, `TRUST_PROXY`, `APP_URL` | origem da página, proxies e link do app |

Veja todas em `server/.env.example`.

### Webhook da Cakto

1. No painel da Cakto, crie um webhook para `https://SEU-DOMINIO/api/webhooks/cakto` com os eventos `purchase_approved`, `refund`, `chargeback`, `subscription_created`, `subscription_renewed` e `subscription_canceled`.
2. A Cakto gera o `secret` ao criar o webhook: copie-o para `CAKTO_WEBHOOK_SECRET` e faça um novo deploy.
3. Cada entrega é validada pela assinatura `X-Cakto-Signature` (HMAC-SHA256 de `{timestamp}.{corpo}`, janela de 5 minutos) e aplicada uma única vez por pedido. Reembolso, chargeback e cancelamento revogam o acesso.
4. Use "Testar Webhook" no painel e confira a resposta `200`. A Cakto só reenvia sozinha em erro de rede ou timeout (8 s); uma resposta 4xx/5xx fica em "Histórico de eventos" para reenvio manual.
5. Opcional: configure a página de obrigado do checkout para `https://SEU-DOMINIO/acesso`.

## Mídia

`npm run media` regenera tudo a partir de `assets/` (ou uma etapa: `npm run media -- logo`, `screen`, `video`, `ambient`, `stills`):

- `logo`: a marca vetorizada (`client/src/assets/generated/logo.ts`), favicon SVG/ICO e ícones PWA;
- `screen`: o recorte da tela de acesso do app (`phone-pr.png`) no tamanho do mockup;
- `video`: o filme do hero em loop sem emenda (crossfade do fim para o início), sem áudio: desktop 4:5 em 800×1000 e celular 9:16 em 720×1280, com pôsteres WebP, o brilho ambiente do hero e a foto do prato (o original tem 12,7 MB);
- `ambient` e `stills`: só o brilho ambiente, ou só as fotos e o pôster, sem re-encodar o vídeo.

`npm run og` (com o servidor rodando) fotografa o hero em 1200×630 para `client/public/og.jpg`, a imagem dos links compartilhados (WhatsApp, Meta Ads, LinkedIn).

## Segurança

- CSP sem scripts inline, `frame-ancestors 'none'`, HSTS, COOP/CORP `same-origin` (bloqueia hotlink da mídia), Permissions-Policy, isolamento por Fetch Metadata.
- Link do checkout congelado, validado contra allowlist e vigiado em tempo de execução (extensões que trocam links de checkout para roubar comissão são revertidas).
- Parâmetros de campanha (`utm_*`, `sck`, `src`) sanitizados antes de seguir para a Cakto.
- Contatos de suporte codificados no bundle e decodificados só no navegador (anti-harvesting).
- Código de acesso: 4 dígitos com RNG criptográfico, guardado só como HMAC, validade de 10 minutos, 5 tentativas contadas de forma atômica (uma rajada de palpites em paralelo não passa do limite), limite por e-mail e por IP, resposta idêntica para e-mails sem compra (sem enumeração).
- Na Vercel, os limites por IP são contados no Redis, valendo para todas as instâncias da Function, e cada chave fica sob o prefixo `pratorapido:lp:`.
- Build sem source maps, minificado e com nomes reduzidos (terser), `console` removido.
- Proteção contra clickjacking também no cliente (para hospedagens sem os cabeçalhos), mídia sem menu de contexto nem arrastar, `robots.txt` bloqueando crawlers de treinamento de IA.

## O que o cliente ainda precisa fornecer

- Domínio definitivo (`VITE_SITE_URL`, `PUBLIC_ORIGIN`) e o link do app (`APP_URL`), se houver.
- Credenciais SMTP para o envio dos códigos.
- Razão social e CNPJ para os documentos legais, e revisão jurídica dos textos em `client/src/content/legal.ts`.
- Os ids do produto na Cakto para `CAKTO_PRODUCT_IDS`, para que só compras do Prato Rápido liberem acesso.

## Testes e verificações

```bash
npm test             # webhook, armazenamento, ambiente da Vercel e fluxo de acesso: 18 testes
npm run typecheck    # TypeScript 7 strict no client e no servidor
```

Com `TEST_UPSTASH_REDIS_REST_URL` e `TEST_UPSTASH_REDIS_REST_TOKEN` definidas, a mesma suíte roda no Redis, sob um prefixo temporário apagado ao final.

A página também passou pelas ferramentas da Taste Skill em `.agents/skills/design-taste-frontend`:

- `copy-lint` sem falhas;
- checador de layout em 1440, 1024, 820, 768 e 390 px: bordas iguais, hero com exatamente uma tela, seções de uma ou duas telas (o aviso "esparso" da seção fixa "Como funciona" é falso para um momento fixado e está registrado em `.taste-skill/waivers.json`);
- orçamento de performance sem falhas (CLS 0,001; JS 128 kB gzip; 2 arquivos de fonte).
