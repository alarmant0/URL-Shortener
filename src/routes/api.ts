import { createTinyURL } from "../utils/shortener.ts";

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {

    const url = new URL(request.url);
    const endpoint = url.pathname.split("/")[2];
    if (endpoint == "status") {
       return new Response(
            JSON.stringify({status:"healthy"}), 
            { headers : {"Content-Type": "application/json"}
        }); 
    }
    if (endpoint == "create") {
        const body = await request.json();
        const { full_url } = body;
        const { custom_code } = body;
        console.log(body);
        const shortcode = await createTinyURL(full_url, custom_code, env);
        if (shortcode === "Error" ) {
            const options = {
                status: 409 // change the status
            };
            return new Response("Already exists", options);
        } 
        let tinyurl = "https://smalito.com/" + shortcode;
        return new Response(JSON.stringify({ url : tinyurl}), { headers: {"Content-Type": "application/json"}});
    }
}

async function handleHealthStatus() : Promise<Response> {
    return new Response(
        JSON.stringify({status:"healthy"}), 
        { headers : {"Content-Type": "application/json"}
    });
}