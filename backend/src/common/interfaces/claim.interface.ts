export interface Claim {
  claimId: string;
  text: string;
  technicalElements: string[];
  problem: string;
  method: string;
}

export function buildClaimEmbeddingText(claim: Claim): string {
  const elements = claim.technicalElements.join(', ');
  return `${claim.problem}. ${claim.method}. Elements: ${elements}. ${claim.text}`;
}
