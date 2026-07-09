export const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
    ...init,
  });

export const noStoreHeaders = {
  'cache-control': 'no-store',
};
