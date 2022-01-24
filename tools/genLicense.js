const { Buffer } = require('buffer');
const crypto = require('crypto');

const getHash = (content) => crypto.createHash('sha256').update(content).digest('string');

const getAES = (content) => {
  var key = new Buffer.from('dSgVkXp2s5v8y/B?')
  var src = new Buffer.from(getHash(JSON.stringify(content)))

  cipher = crypto.createCipheriv("aes-128-ecb", key, '')
  cipher.setAutoPadding(false)


  result = cipher.update(src).toString('hex');
  result += cipher.final().toString('hex');
  return result;
}

const license = {
  email: 'user@example.com',
  createdAt: Date.now(),
  type: 'BASIC',
}

const sign = getAES(license)

const licenseWithSign = {
  ...license,
  sign
}

const licenseKey = new Buffer.from(JSON.stringify(licenseWithSign)).toString('base64')
console.log(licenseWithSign)

console.log(licenseKey)