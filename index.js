const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();
const PORT = process.env.PORT || 3000;

// Kích hoạt chế độ ẩn mình chống bị Cloudflare phát hiện
puppeteer.use(StealthPlugin());

app.get("/api", async (req, res) => {
  const mst = req.query.mst;
  if (!mst) {
    return res.status(400).send("Thiếu tham số mst");
  }

  console.log(`[Render] Tiến hành cào tàng hình cho MST: ${mst}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1440,900",
        "--lang=vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
      ]
    });

    const page = await browser.newPage();
    
    // 1. Cấu hình các thông số trình duyệt người dùng thật (Bypass Cloudflare)
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    // Xóa bỏ hoàn toàn vết tích biến webdriver chạy ngầm
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    });

    // 2. Đi tới trang masothue với thời gian chờ tối đa 60 giây
    const response = await page.goto("https://masothue.com/" + mst, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Nếu gặp trang chặn hoặc lỗi kết nối, ném lỗi ra để xử lý
    if (!response) {
      throw new Error("Không thể kết nối tới masothue.com");
    }

    // 3. Đợi thêm 4 giây giả lập hành vi người thật cuộn chuột đọc trang để Cloudflare nhả dữ liệu sạch ra
    await new Promise(r => setTimeout(r, 4000));

    // Lấy toàn bộ nội dung HTML sau khi đã vượt qua màn hình kiểm tra bảo mật
    const html = await page.content();
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);

  } catch (err) {
    console.error("Lỗi Puppeteer Stealth:", err.message);
    return res.status(500).send(`Lỗi hệ thống khi cào dữ liệu: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Trang chủ hiển thị hệ thống chạy bình thường
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("Server Node.js API cho dự án Tra cứu MST đang hoạt động ổn định!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});