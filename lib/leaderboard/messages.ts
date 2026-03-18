export function createUsernameMessage(address: string, username: string, nonce: number): string {
  return [
    "MonoSnake Base Username Update",
    `Address: ${address.toLowerCase()}`,
    `Username: ${username}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function createScoreClaimMessage(
  address: string,
  score: number,
  nonce: number,
  sessionId: string,
): string {
  return [
    "MonoSnake Base Score Claim",
    `Address: ${address.toLowerCase()}`,
    `Score: ${score}`,
    `Session: ${sessionId}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

