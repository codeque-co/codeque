use wasm_bindgen::prelude::*;
use web_sys::console;


// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut enabled: &str = "strange_string";
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


    // Your code goes here!
    console::log_1(&JsValue::from_str("Hello world!"));

    Ok(())
}

#[wasm_bindgen]
pub fn enable(query:String) -> Result<(), JsValue> {
    unsafe {
        enabled = "yes";
    }
    Ok(())
}

#[wasm_bindgen]
pub fn get_str(query:String) -> Result<String, JsValue> {
    let res: String = "res: ".to_owned();
    let space: &str = " ";
    arr;
    unsafe {
        // output = &(res + space + enabled + space + &query);
        Ok((res + space + enabled + space + &query + arr2[0] + &arr[4].to_string()))
    }
}