export interface TokenInfo {
  id: number;
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  imagePath: string;
}

export const supportedTokens: Record<number, TokenInfo> = {
  1: {
    id: 1,
    address: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
    decimals: 18,
    name: "Good Dollar",
    symbol: "G$",
    imagePath: "/currencies/good_dollar.svg",
  },
  2: {
    id: 2,
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    decimals: 18,
    name: "Celo Dollar",
    symbol: "cUSD",
    imagePath: "/currencies/celo_dollar.svg",
  },
  3: {
    id: 3,
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    decimals: 6,
    name: "Tether USD",
    symbol: "USDT",
    imagePath: "/currencies/tether_usd.svg",
  },
  4: {
    id: 4,
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    imagePath: "/currencies/usd_coin.svg",
  },
};

export function getTokenInfo(currencyId: number | null | undefined): TokenInfo | null {
  if (currencyId == null) return null;
  return supportedTokens[currencyId] || null;
}

export function getTokenSymbol(currencyId: number | null | undefined): string {
  const token = getTokenInfo(currencyId);
  return token?.symbol || "—";
}

export function getTokenImagePath(currencyId: number | null | undefined): string | null {
  const token = getTokenInfo(currencyId);
  return token?.imagePath || null;
}

export function formatRewardAmount(
  amount: number | null | undefined,
  currencyId: number | null | undefined
): string {
  if (amount == null) return "—";
  const symbol = getTokenSymbol(currencyId);
  return `${symbol} ${amount.toLocaleString()}`;
}

