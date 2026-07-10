export const json = (body, init = {}) => {
  const { headers, ...responseInit } = init;

  return new Response(JSON.stringify(body), {
    ...responseInit,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(headers ?? {}),
    },
  });
};

export const noStoreHeaders = {
  'cache-control': 'no-store',
};
