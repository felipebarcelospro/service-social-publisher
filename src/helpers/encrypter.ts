import * as CryptoJS from 'crypto-js'

const secretKey = 'LV88p7DA4dMBevAWrDA7:t8dNFtxbu4CwR8yy2dtR'

export function encrypt(text?: string): string {
  if (!text) return ''
  const encrypted = CryptoJS.AES.encrypt(text, secretKey)
  return encrypted.toString()
}

export function decrypt(encryptedText?: string): string {
  if (!encryptedText) return ''
  const decrypted = CryptoJS.AES.decrypt(encryptedText, secretKey)
  return decrypted.toString(CryptoJS.enc.Utf8)
}
