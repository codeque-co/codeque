use crate::crypto;
use base64::decode;
use serde::Deserialize;
use serde_json::json;
#[derive(Deserialize)]
struct License {
  email: String,
  created_at: u64,
  license_type: String,
  sign: String,
}

pub fn parse_and_validate_license(key: String) -> (bool, String) {
  let json_string: &[u8] = &decode(key).unwrap()[..];
  let license: License = serde_json::from_slice(json_string).unwrap();
  let license_sign_data = json!({
    "created_at": license.created_at,
    "email": license.email,
    "license_type": license.license_type,
  })
  .to_string();

  let decrypted_sign = crypto::aes_decrypt(license.sign);
  let license_sign_hash = crypto::sha256(license_sign_data);

  let sign_match = license_sign_hash == decrypted_sign;

  let now = instant::now() as u64;
  let ms_in_year: u64 = 1000 * 60 * 60 * 24 * 365;

  let license_still_valid = (now - license.created_at) < ms_in_year;

  return (sign_match && license_still_valid, license.license_type);
}
