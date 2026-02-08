export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// console.log(request);
		let endpoint = request.url.split("/")[3]
		if ( endpoint !== "" ) {
			return Response.redirect("https://example.com", 302);
		}
		let value = await env.urls.get("test");
		console.log(value);
		return new Response(value);
	},
} satisfies ExportedHandler<Env>;
