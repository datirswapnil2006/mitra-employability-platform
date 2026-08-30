/**
 * Lightweight cookie parsing middleware
 */
const cookieParser = (req, res, next) => {
  if (!req.cookies) {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const items = cookieHeader.split(';');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const index = item.indexOf('=');
        if (index !== -1) {
          const key = item.substring(0, index).trim();
          const val = item.substring(index + 1).trim();
          try {
            req.cookies[key] = decodeURIComponent(val);
          } catch (e) {
            req.cookies[key] = val;
          }
        }
      }
    }
  }
  next();
};

module.exports = cookieParser;
