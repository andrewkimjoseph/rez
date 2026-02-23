import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const WHITELIST_CONTRACT_ADDRESS = '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as const;

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

const whitelistAbi = [
  {
    name: 'getWhitelistedRoot',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'whitelisted', type: 'address' }],
  },
] as const;

/**
 * Returns the whitelisted root address for the given account, or zero address if not whitelisted.
 * Uses the same contract as the Pax app (checkWalletVerification.ts).
 */
export async function getWhitelistedRoot(account: string): Promise<string> {
  if (!account || typeof account !== 'string') {
    return '0x0000000000000000000000000000000000000000';
  }
  const normalized = account.startsWith('0x') ? account : `0x${account}`;
  try {
    const result = await publicClient.readContract({
      address: WHITELIST_CONTRACT_ADDRESS,
      abi: whitelistAbi,
      functionName: 'getWhitelistedRoot',
      args: [normalized as `0x${string}`],
    });
    return (result as string) ?? '0x0000000000000000000000000000000000000000';
  } catch {
    return '0x0000000000000000000000000000000000000000';
  }
}

export function isWhitelisted(whitelistedRoot: string): boolean {
  const zero = '0x0000000000000000000000000000000000000000';
  return !!whitelistedRoot && whitelistedRoot.toLowerCase() !== zero.toLowerCase();
}
