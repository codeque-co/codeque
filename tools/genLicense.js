const { Buffer } = require('buffer');
const crypto = require('crypto');

const getHash = (content) => crypto.createHash('sha256').update(content).digest();

const getAES = (buffer) => {
  const key = new Buffer.from('dSgVkXp2s5v8y/B?')

  cipher = crypto.createCipheriv("aes-128-ecb", key, '')
  cipher.setAutoPadding(false)


  result = cipher.update(buffer).toString('hex');
  const final = cipher.final().toString('hex');
  result += final
  return result;
}

const getSign = (content) => {
  const licenseString = JSON.stringify(content)
  console.log('licenseString', licenseString)
  const hash = getHash(licenseString)
  console.log('hash type', typeof hash);
  console.log('hash:', hash.toString('hex'))
  const sign = getAES(hash)
  console.log('sign:', sign)
  return sign;
}

// HAS TO BE ORDERED ALPHABETICALLY
const license = {
  created_at: Date.now(),
  email: 'user@example.com',
  license_type: 'BASIC',
}

const sign = getSign(license)

const licenseWithSign = {
  ...license,
  sign
}

console.log('license with sign:', licenseWithSign)

const licenseKey = new Buffer.from(JSON.stringify(licenseWithSign)).toString('base64')

console.log('licenseKey', licenseKey)