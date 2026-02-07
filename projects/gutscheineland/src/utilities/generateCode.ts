export const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowedChars[Math.floor(Math.random() * allowedChars.length)]
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
