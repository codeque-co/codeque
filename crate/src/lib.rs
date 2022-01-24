use wasm_bindgen::prelude::*;
use web_sys::console;
use js_sys;
mod crypto;
mod license;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut ENABLED: bool = false;

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
pub fn authorize(key: String) -> Result<(), JsValue> {
    unsafe {
        ENABLED = license::is_license_valid(key);
    }

    Ok(())
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
