use aes::cipher::{generic_array::GenericArray, BlockDecrypt, NewBlockCipher};
use aes::{Aes128, Block};
pub fn aes_decrypt(secret_raw: String) -> String {
  let mut secret: [u8; 16] = Default::default();
  let secret_bytes = hex::decode(&secret_raw).unwrap();

  // AES ECB
  let key = GenericArray::from_slice(&[
    100, 83, 103, 86, 107, 88, 112, 50, 115, 53, 118, 56, 121, 47, 66, 63,
  ]);

  let cipher = Aes128::new(&key);

  let mut result = vec![];

  for n in 0..2 {
    secret.copy_from_slice(&secret_bytes[16 * n..16 * (n + 1)]);

    let mut block = Block::from(secret);
    cipher.decrypt_block(&mut block);
    result.append(&mut block.to_vec());
  }

  return hex::encode(result);
}

use sha256::digest;

pub fn sha256(input: String) -> String {
  return digest(input);
}
