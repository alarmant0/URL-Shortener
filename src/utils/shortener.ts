import { isAvailable } from "../services/controller.ts";
import { cput } from "../services/controller.ts";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export async function createTinyURL(url: string, code: string, env: Env): Promise<string> {
    let small_url;
    if ( code !== "" ) {
        const full_url = "https://smalito.com/" + code;
        let code_available = await isAvailable(full_url, env);
        console.log(code_available);
        if (code_available !== null) {
            return "Error";
        } else {
            let value = await cput(code, url, env);
            return code;
        }

    }
    while (true) {
        small_url = "";
        for (let i=0 ;i <= 7 ; i++) {
            small_url+=getRandomLetter();
        }
        console.log(small_url);
        let available = await isAvailable(small_url, env); // change this
        if (available === null) {
            break;
        }
    }
    let value = await cput(small_url, url, env);
    return small_url;
}

function getRandomIndex(max: number): number { // implement actually random num gen
    return Math.floor(Math.random() * max) + 1;
}

function getRandomLetter(): string {
    return ALPHABET.charAt(getRandomIndex(ALPHABET.length));
}