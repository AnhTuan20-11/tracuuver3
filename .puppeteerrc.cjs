const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Ép Puppeteer lưu trình duyệt vào ngay trong thư mục dự án để Render không bị lỗi phân quyền cache
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};