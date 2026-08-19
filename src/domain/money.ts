export function roundBRL(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function pointsValueBRL(points: number, valuePer1000BRL: number): number {
  return roundBRL((points / 1_000) * valuePer1000BRL);
}

export function roundPointsUp(value: number, block = 5_000): number {
  return Math.ceil(value / block) * block;
}

