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
