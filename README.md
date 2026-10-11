# Economic

Plataforma web para acompanhar o mercado financeiro, entender conceitos de investimento e simular quanto um investimento pode render.

- **Mercado**: índices, câmbio, cripto, ouro, maiores altas e quedas, setores da bolsa, humor do mercado e indicadores do Banco Central (Selic, CDI, IPCA, dólar).
- **Explorar**: ~65 ativos (ações da B3, FIIs, ETFs, EUA, cripto, moedas, commodities) com busca, ordenação e favoritos.
- **Ativo**: gráfico de linha/velas com volume, períodos de 1D a MAX, números-chave e um resumo em linguagem simples.
- **Simulador**: aporte inicial + mensal + prazo → cenários pessimista / provável / otimista (Monte Carlo com 2.000 trajetórias), comparação com o CDI e "e se eu tivesse investido há 1, 3 ou 5 anos?".
- **Aprender**: 4 passos para começar, quiz de perfil de investidor, glossário e guia de leitura de candles.
- Tema escuro/claro, responsivo (celular, tablet, desktop).

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS · TanStack Query · Recharts · TradingView Lightweight Charts · funções serverless da Vercel (`/api`).

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173 — já serve as funções de /api
```

Outros comandos: `npm run typecheck`, `npm run build`, `npm run preview`.

## Publicar (grátis): GitHub + Vercel

```bash
git init
git add .
git commit -m "Economic: primeira versão"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/economic.git
git push -u origin main
```

1. Em [vercel.com](https://vercel.com), entre com o GitHub e clique em **Add New → Project**.
2. Importe o repositório. A Vercel detecta o Vite sozinha (build `npm run build`, saída `dist`). Não precisa configurar nada.
3. **Deploy.** A cada `git push`, o site é atualizado automaticamente.

Variável opcional (Settings → Environment Variables): `BRAPI_TOKEN`, token gratuito de [brapi.dev](https://brapi.dev), usado só como fonte reserva para ações da B3.

## Como os dados ficam atualizados sem custo

| Dado | Fonte (sem chave) | Cache de borda |
| --- | --- | --- |
| Cotações, histórico (ações, FIIs, ETFs, cripto, câmbio, índices, commodities) | Yahoo Finance (endpoint público `chart`), com brapi.dev como reserva para a B3 | 30 s (cotações) · 1–10 min (histórico) |
| Selic, CDI, IPCA, dólar | API aberta do Banco Central (SGS) | 30 min |

O navegador consulta `/api/*` a cada 20–30 s enquanto a aba está aberta e também ao voltar para ela (TanStack Query). O cache de borda da Vercel (`s-maxage`) faz com que todos os visitantes compartilhem a mesma resposta, então o número de chamadas às fontes e às funções fica baixo mesmo com muito acesso.

## Estrutura

```
api/            funções serverless (quotes, history, macro) + _lib/providers.ts
shared/         tipos e universo de ativos, usados pelo servidor e pelo front
src/
  pages/        Mercado, Explorar, Ativo, Simulador, Aprender
  components/   layout, tabela, gráficos, cards
  hooks/        useMarket.ts (consultas reativas)
  lib/          formatação, tema, favoritos e simulate.ts (estatística + Monte Carlo)
```

Para acompanhar outros ativos nos rankings, edite `shared/universe.ts`. Qualquer símbolo do Yahoo Finance também funciona pela busca (ex.: `MSFT`, `PETR4`, `ETH`).

## Pontos de atenção

- **Fonte de dados não oficial.** O endpoint do Yahoo Finance é público, mas não é uma API oficial nem tem garantia de continuidade ou de uso comercial. Funciona bem para começar; se a plataforma crescer, troque para um provedor com contrato (Twelve Data, Finnhub, Alpha Vantage, brapi paga). Basta reimplementar `getQuote` e `getHistory` em `api/_lib/providers.ts` mantendo os tipos de retorno.
- **Plano Hobby da Vercel** é gratuito, mas seus termos o limitam a uso pessoal/não comercial. Se o Economic virar produto com receita, será preciso migrar para o plano Pro (ou hospedar em outro serviço gratuito para projetos comerciais).
- **Cotações com atraso.** Dependendo do ativo e da bolsa, o dado pode ter alguns minutos de atraso. Os textos do site já avisam isso.
- **Conteúdo educacional.** O simulador projeta cenários estatísticos a partir do histórico; não é recomendação de investimento e não considera impostos nem taxas. Se o site for divulgado ao público, vale revisar os avisos legais com atenção às regras da CVM sobre divulgação de conteúdo de investimento.
