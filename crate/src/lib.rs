use js_sys;
use wasm_bindgen::prelude::*;
mod crypto;
mod license;

use web_sys::console;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
static mut ENABLED: bool = false;
static mut TYPE: String = String::new();

// This is like the `main` function, except for JavaScript.
// This is executed on import (at least with current setup :v )
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    Ok(())
}

#[wasm_bindgen]
pub fn authorize(key: String) -> Result<bool, JsValue> {
    let (is_valid, license_type) = license::parse_and_validate_license(key);
    // console::log_1(&JsValue::from_str(&format!("is_valid: {:?}", is_valid)));
    unsafe {
        ENABLED = is_valid;
        TYPE = license_type;
    }

    Ok(is_valid)
}

#[wasm_bindgen]
pub fn trim_value(obj: &JsValue) -> Result<(), JsValue> {
    unsafe {
        assert_eq!(ENABLED, true);
    }
    let value = js_sys::Reflect::get(&obj, &JsValue::from_str("value"))?;
    let to_trim: String = value.into_serde().unwrap();
    let trimmed = to_trim.trim();

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("value"),
        &JsValue::from_str(&trimmed),
    )?;
    Ok(())
}
