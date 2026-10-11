/**
 * Universo de ativos acompanhados pela plataforma.
 * Qualquer outro símbolo do Yahoo Finance também funciona na página do ativo
 * (basta buscar pelo código), mas só estes entram nos rankings do painel.
 */

export type Market = 'BR' | 'US' | 'CRYPTO' | 'FX' | 'INDEX' | 'COM'
export type AssetKind = 'Ação' | 'FII' | 'ETF' | 'Cripto' | 'Câmbio' | 'Índice' | 'Commodity'

export interface Asset {
  /** símbolo no Yahoo Finance */
  symbol: string
  /** código de exibição */
  code: string
  name: string
  market: Market
  kind: AssetKind
  sector?: string
}

const br = (code: string, name: string, sector: string, kind: AssetKind = 'Ação'): Asset => ({
  symbol: `${code}.SA`,
  code,
  name,
  market: 'BR',
  kind,
  sector,
})
const us = (code: string, name: string, sector: string): Asset => ({
  symbol: code,
  code,
  name,
  market: 'US',
  kind: 'Ação',
  sector,
})
const crypto = (code: string, name: string): Asset => ({
  symbol: `${code}-USD`,
  code,
  name,
  market: 'CRYPTO',
  kind: 'Cripto',
})

export const UNIVERSE: Asset[] = [
  // Índices
  { symbol: '^BVSP', code: 'IBOV', name: 'Ibovespa', market: 'INDEX', kind: 'Índice' },
  { symbol: '^GSPC', code: 'S&P 500', name: 'S&P 500 (EUA)', market: 'INDEX', kind: 'Índice' },
  { symbol: '^IXIC', code: 'NASDAQ', name: 'Nasdaq Composite', market: 'INDEX', kind: 'Índice' },

  // Câmbio
  { symbol: 'BRL=X', code: 'USD/BRL', name: 'Dólar comercial', market: 'FX', kind: 'Câmbio' },
  { symbol: 'EURBRL=X', code: 'EUR/BRL', name: 'Euro', market: 'FX', kind: 'Câmbio' },
  { symbol: 'GBPBRL=X', code: 'GBP/BRL', name: 'Libra esterlina', market: 'FX', kind: 'Câmbio' },

  // Commodities
  { symbol: 'GC=F', code: 'OURO', name: 'Ouro (futuro)', market: 'COM', kind: 'Commodity' },
  { symbol: 'CL=F', code: 'PETRÓLEO', name: 'Petróleo WTI (futuro)', market: 'COM', kind: 'Commodity' },

  // Brasil — ações
  br('PETR4', 'Petrobras PN', 'Petróleo e Gás'),
  br('PRIO3', 'PRIO', 'Petróleo e Gás'),
  br('VBBR3', 'Vibra Energia', 'Petróleo e Gás'),
  br('UGPA3', 'Ultrapar', 'Petróleo e Gás'),
  br('VALE3', 'Vale', 'Mineração e Siderurgia'),
  br('GGBR4', 'Gerdau PN', 'Mineração e Siderurgia'),
  br('CSNA3', 'CSN', 'Mineração e Siderurgia'),
  br('ITUB4', 'Itaú Unibanco PN', 'Bancos e Finanças'),
  br('BBDC4', 'Bradesco PN', 'Bancos e Finanças'),
  br('BBAS3', 'Banco do Brasil', 'Bancos e Finanças'),
  br('BPAC11', 'BTG Pactual', 'Bancos e Finanças'),
  br('B3SA3', 'B3', 'Bancos e Finanças'),
  br('ITSA4', 'Itaúsa PN', 'Bancos e Finanças'),
  br('BBSE3', 'BB Seguridade', 'Bancos e Finanças'),
  br('WEGE3', 'WEG', 'Indústria'),
  br('EMBR3', 'Embraer', 'Indústria'),
  br('ABEV3', 'Ambev', 'Consumo'),
  br('JBSS3', 'JBS', 'Consumo'),
  br('LREN3', 'Lojas Renner', 'Varejo'),
  br('MGLU3', 'Magazine Luiza', 'Varejo'),
  br('RADL3', 'RaiaDrogasil', 'Saúde'),
  br('HAPV3', 'Hapvida', 'Saúde'),
  br('RDOR3', "Rede D'Or", 'Saúde'),
  br('ELET3', 'Eletrobras', 'Energia Elétrica e Saneamento'),
  br('EQTL3', 'Equatorial', 'Energia Elétrica e Saneamento'),
  br('CMIG4', 'Cemig PN', 'Energia Elétrica e Saneamento'),
  br('SBSP3', 'Sabesp', 'Energia Elétrica e Saneamento'),
  br('RAIL3', 'Rumo', 'Logística e Construção'),
  br('RENT3', 'Localiza', 'Logística e Construção'),
  br('CYRE3', 'Cyrela', 'Logística e Construção'),
  br('SUZB3', 'Suzano', 'Papel e Celulose'),
  br('KLBN11', 'Klabin', 'Papel e Celulose'),
  br('VIVT3', 'Vivo (Telefônica)', 'Telecom e Tecnologia'),
  br('TIMS3', 'TIM', 'Telecom e Tecnologia'),
  br('TOTS3', 'Totvs', 'Telecom e Tecnologia'),

  // Brasil — ETFs e FIIs (bons pontos de partida para iniciantes)
  br('BOVA11', 'iShares Ibovespa', 'ETF', 'ETF'),
  br('IVVB11', 'iShares S&P 500 (em reais)', 'ETF', 'ETF'),
  br('MXRF11', 'Maxi Renda', 'FII', 'FII'),
  br('HGLG11', 'CSHG Logística', 'FII', 'FII'),
  br('KNRI11', 'Kinea Renda Imobiliária', 'FII', 'FII'),

  // EUA
  us('AAPL', 'Apple', 'Tecnologia'),
  us('MSFT', 'Microsoft', 'Tecnologia'),
  us('NVDA', 'NVIDIA', 'Tecnologia'),
  us('GOOGL', 'Alphabet (Google)', 'Tecnologia'),
  us('AMZN', 'Amazon', 'Consumo'),
  us('META', 'Meta Platforms', 'Tecnologia'),
  us('TSLA', 'Tesla', 'Consumo'),
  us('JPM', 'JPMorgan Chase', 'Finanças'),
  us('KO', 'Coca-Cola', 'Consumo'),
  us('XOM', 'ExxonMobil', 'Energia'),

  // Cripto
  crypto('BTC', 'Bitcoin'),
  crypto('ETH', 'Ethereum'),
  crypto('SOL', 'Solana'),
  crypto('BNB', 'BNB'),
  crypto('XRP', 'XRP'),
  crypto('ADA', 'Cardano'),
]

const BY_SYMBOL = new Map(UNIVERSE.map((a) => [a.symbol.toUpperCase(), a]))
const BY_CODE = new Map(UNIVERSE.map((a) => [a.code.toUpperCase(), a]))

export function findAsset(symbol: string): Asset | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase())
}

/** Converte o que a pessoa digitou ("petr4", "aapl", "btc") em um símbolo do Yahoo. */
export function resolveSymbol(input: string): string {
  const raw = input.trim().toUpperCase()
  if (!raw) return ''
  const known = BY_SYMBOL.get(raw) ?? BY_CODE.get(raw)
  if (known) return known.symbol
  if (/^[A-Z]{4}\d{1,2}$/.test(raw)) return `${raw}.SA` // formato de ticker da B3
  const crypto = BY_CODE.get(`${raw}`)
  if (crypto) return crypto.symbol
  return raw
}

export function searchAssets(term: string, limit = 7): Asset[] {
  const t = term.trim().toLowerCase()
  if (!t) return []
  const starts: Asset[] = []
  const contains: Asset[] = []
  for (const a of UNIVERSE) {
    const code = a.code.toLowerCase()
    const name = a.name.toLowerCase()
    if (code.startsWith(t) || name.startsWith(t)) starts.push(a)
    else if (code.includes(t) || name.includes(t)) contains.push(a)
  }
  return [...starts, ...contains].slice(0, limit)
}

export const MARKET_LABEL: Record<Market, string> = {
  BR: 'Brasil',
  US: 'EUA',
  CRYPTO: 'Cripto',
  FX: 'Moedas',
  INDEX: 'Índices',
  COM: 'Commodities',
}
