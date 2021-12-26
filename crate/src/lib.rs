use wasm_bindgen::prelude::*;
use web_sys::console;


// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut ENABLED: &str = "strange_string";
static arr: [i32; 5] = [1, 2, 3, 4, 5];
static arr2: [&str;1] = ["dupa"];

// This is like the `main` function, except for JavaScript.
// This is executed on import (at least with current setup :v )
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    unsafe {
        // mock of license check on module load
        ENABLED = "yes";
    }

    // Your code goes here!
    // console::log_1(&JsValue::from_str("Hello world!"));

    Ok(())
}

#[wasm_bindgen]
pub fn enable(query:String) -> Result<(), JsValue> {
    unsafe {
        ENABLED = "yes";
    }
    Ok(())
}

#[wasm_bindgen]
pub fn get_str(query:String) -> Result<String, JsValue> {
    let res: String = "res: ".to_owned();
    let space: String = String::from(" ");
    unsafe {
        // output = &(res + space + enabled + space + &query);
        Ok(res + &space + ENABLED + &space + &query + arr2[0] + &arr[4].to_string())
    }
}

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Data {
    pub key:String
}

#[wasm_bindgen]
pub fn get_field(obj: &JsValue) -> Result<String, JsValue> {
    let example: Data = obj.into_serde().unwrap();
    Ok(example.key)
}

use js_sys;

#[wasm_bindgen]
pub fn set_field(obj: &JsValue) -> Result<(), JsValue> {
    js_sys::Reflect::set(&obj, &JsValue::from_str("key"), &JsValue::from_str("dupa"))?;

    Ok(())
}

#[wasm_bindgen]
pub fn transform_value(obj: &JsValue) -> Result<(), JsValue> {
    let value = js_sys::Reflect::get(&obj, &JsValue::from_str("value"))?;
    let to_trim:String = value.into_serde().unwrap();
    let trimmed = to_trim.trim();

    js_sys::Reflect::set(&obj, &JsValue::from_str("value"), &JsValue::from_str(&trimmed))?;
    // console::log_1(&JsValue::from_str(&format!("Trimmed: {} -> {}", to_trim, trimmed)));
    unsafe {
        assert_eq!(ENABLED, "yes");
    }
    Ok(())
}