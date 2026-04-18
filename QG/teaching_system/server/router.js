const routes = {};
function register(method, path, handler) {
  routes[`${method} ${path}`] = handler;
}
function router(req, res) {
  const key = `${req.method} ${req.url}`;
  const handler = routes[key];
  if (handler) {
    handler(req, res);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: '接口不存在' }));
  }
}
module.exports = { register, router };