use aes::cipher::{
  generic_array::GenericArray, BlockCipher, BlockDecrypt, BlockEncrypt, NewBlockCipher,
};
use aes::{Aes128, Block, ParBlocks};
use wasm_bindgen::prelude::*;
use web_sys::console;

pub fn aes_test() -> bool {
  // AES ECB
  let key = GenericArray::from_slice(&[
    100, 83, 103, 86, 107, 88, 112, 50, 115, 53, 118, 56, 121, 47, 66, 63,
  ]);

  let mut secret: [u8; 16] = Default::default();
  let secret_bytes = hex::decode("87bf66c78071ec9713178d30be52d1ae").unwrap();

  secret.copy_from_slice(&secret_bytes[0..16]);
  let mut block = Block::from(secret);

  // Initialize cipher
  let cipher = Aes128::new(&key);

  // Decrypt block
  cipher.decrypt_block(&mut block);

  let decoded_string = String::from_utf8(block.to_vec()).unwrap();

  // console::log_1(&JsValue::from_str(&format!("decoded block: {:?}", block)));
  // console::log_1(&JsValue::from_str(&format!(
  //   "decoded str: ${}$",
  //   decoded_string
  // )));

  // console::log_1(&JsValue::from_str(&format!(
  //   "secret bytes: {:?}",
  //   secret_bytes
  // )));
  return decoded_string.eq(&"hello world\u{5}\u{5}\u{5}\u{5}\u{5}".to_owned());
}

use rand::rngs::OsRng;
use rsa::{PaddingScheme, PublicKey, RsaPrivateKey, RsaPublicKey};

pub fn rsa_test() {
  let mut rng = OsRng;
  let bits = 2048;
  let private_key = RsaPrivateKey::new(&mut rng, bits).expect("failed to generate a key");
  let public_key = RsaPublicKey::from(&private_key);

  // Encrypt
  let data = b"hello world";
  let padding = PaddingScheme::new_pkcs1v15_encrypt();
  let enc_data = public_key
    .encrypt(&mut rng, padding, &data[..])
    .expect("failed to encrypt");
  assert_ne!(&data[..], &enc_data[..]);

  // Decrypt
  let padding = PaddingScheme::new_pkcs1v15_encrypt();
  let dec_data = private_key
    .decrypt(padding, &enc_data)
    .expect("failed to decrypt");
  assert_eq!(&data[..], &dec_data[..]);
}

use p256::ecdsa::{signature::Signer, Signature, SigningKey};

pub fn p256_test() {
  // Signing
  let signing_key = SigningKey::random(&mut OsRng); // Serialize with `::to_bytes()`
  let message = b"ECDSA proves knowledge of a secret number in the context of a single message";
  let signature = signing_key.sign(message);

  // Verification
  use p256::ecdsa::{signature::Verifier, VerifyingKey};
  let verify_key = VerifyingKey::from(&signing_key); // Serialize with `::to_encoded_point()`
  assert!(verify_key.verify(message, &signature).is_ok());
}

use sha256::digest;

pub fn test_sha2() {
  let input = "hello";
  let val = digest(input);
  assert_eq!(
    val,
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
  );

  console::log_1(&JsValue::from_str(&format!("sha2 {:?}", val)));
}

use aes_gcm::aead::{Aead, NewAead};
use aes_gcm::{Aes256Gcm, Key, Nonce}; // Or `Aes128Gcm`

pub fn aes_gcm() {
  let key = Key::from_slice(b"an example very very secret key.");
  let cipher = Aes256Gcm::new(key);

  let nonce = Nonce::from_slice(b"unique nonce"); // 96-bits; unique per message

  let ciphertext = cipher
    .encrypt(nonce, b"plaintext message".as_ref())
    .expect("encryption failure!"); // NOTE: handle this error to avoid panics!

  console::log_1(&JsValue::from_str(&format!("ciphertext {:?}", ciphertext)));
  let plaintext = cipher
    .decrypt(nonce, ciphertext.as_ref())
    .expect("decryption failure!"); // NOTE: handle this error to avoid panics!

  console::log_1(&JsValue::from_str(&format!("plaintext {:?}", plaintext)));

  assert_eq!(&plaintext, b"plaintext message");
}
