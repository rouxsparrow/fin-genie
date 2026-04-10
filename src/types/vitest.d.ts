declare module "vitest" {
  export const describe: (...args: unknown[]) => void;
  export const it: (...args: unknown[]) => void;
  export const expect: (actual: unknown) => {
    toBe(expected: unknown): void;
  };
}
