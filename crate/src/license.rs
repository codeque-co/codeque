use wasm_bindgen::prelude::*;
use web_sys::console;
use crate::crypto;
use base64::{decode};
use serde::{Deserialize};
use serde_json::{Result,json};

#[derive(Deserialize)]
struct License {
  email: String,
  createdAt: u64,
  r#type: String,
  sign:String,
}

pub fn is_license_valid(key: String)-> bool {
  let a = b"hello world";
  let json_string:&[u8] = &decode(key).unwrap()[..];
  let license:License = serde_json::from_slice(json_string).unwrap();
  let license_sign_data = json!({
    "email": license.email,
    "createdAt": license.createdAt,
    "type": license.r#type,
  }).to_string();

  let decrypted_sign = crypto::aes_decrypt(license.sign);
  let license_sign_hash = crypto::sha256(license_sign_data);

  console::log_1(&JsValue::from_str(&format!("decrypted_sign: {:?}", decrypted_sign)));
  console::log_1(&JsValue::from_str(&format!("sha265: {:?}", license_sign_hash)));

  let sign_match = license_sign_hash == decrypted_sign;

  console::log_1(&JsValue::from_str(&format!("sign match: {:?}", sign_match)));
  // console::log_1(&JsValue::from_str(&format!("toSign: {:?}", license_sign_data)));

  return sign_match
}