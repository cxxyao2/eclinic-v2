export function toNumber(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
}
