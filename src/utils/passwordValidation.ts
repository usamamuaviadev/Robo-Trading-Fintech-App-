export interface PasswordRulesState {
  length: boolean;
  number: boolean;
  special: boolean;
  upperLower: boolean;
}

const SPECIAL_REGEX = /[@%$#&.!?*^_\-]/;

export function evaluatePassword(pw: string): PasswordRulesState {
  return {
    length: pw.length >= 8,
    number: /\d/.test(pw),
    special: SPECIAL_REGEX.test(pw),
    upperLower: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
  };
}

export function allRulesPass(state: PasswordRulesState): boolean {
  return state.length && state.number && state.special && state.upperLower;
}
