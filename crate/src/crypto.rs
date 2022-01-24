use aes::cipher::{
  generic_array::GenericArray, BlockCipher, BlockDecrypt, BlockEncrypt, NewBlockCipher,
};
use aes::{Aes128, Block, ParBlocks};
use wasm_bindgen::prelude::*;
use web_sys::console;
use std::ffi::CStr;
pub fn aes_decrypt(secret_raw:String) -> String {
  console::log_1(&JsValue::from_str(&format!("secret: {:}", secret_raw)));
  
  let mut secret: [u8; 16] = Default::default();
  let secret_bytes = hex::decode(&secret_raw).unwrap();

  // AES ECB
  let key = GenericArray::from_slice(&[
    100, 83, 103, 86, 107, 88, 112, 50, 115, 53, 118, 56, 121, 47, 66, 63,
  ]);

  let cipher = Aes128::new(&key);

  let mut decoded_string:String = "".to_owned();

  for n in 0..4 {
    console::log_1(&JsValue::from_str(&format!("n: {:}", n)));

    secret.copy_from_slice(&secret_bytes[16*n..16*(n+1)]);

    let mut block = Block::from(secret);
  
    cipher.decrypt_block(&mut block);
  
    let decoded_block = String::from_utf8(block.to_vec()).unwrap();
    decoded_string = decoded_string + &decoded_block
  }

  return decoded_string;
}


use sha256::digest;

pub fn sha256(input:String)->String {
  return digest(input)
}

