const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'safeher_default_encryption_key_32';

const encrypt = (text) => {
  if (!text) return null;
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword
};
