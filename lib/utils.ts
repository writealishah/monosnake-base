export function shortenAddress(address?: string): string {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDateTime(value: number | string): string {
  const date = new Date(value);
  return date.toLocaleString();
}

