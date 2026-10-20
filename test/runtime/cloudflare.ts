export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname !== '/smoke')
      return new Response('Not found', { status: 404 });
    const { smoke } = await import('./smoke.js');
    return Response.json(await smoke());
  },
};
