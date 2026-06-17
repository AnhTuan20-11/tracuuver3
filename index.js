const express = require("express");
// Sử dụng puppeteer-extra thay cho puppeteer gốc để kích hoạt plugin
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();
const PORT = process.env.PORT || 3000;

// Kích hoạt chế độ tàng hình vượt tường lửa Cloudflare
puppeteer.use(StealthPlugin());

app.get("/api", async (req, res) => {
  const mst = req.query.mst;
  if (!mst) {
    return res.status(400).send("Thiếu tham số mst");
  }

  console.log(`[Render] Đang tiến hành tra cứu tàng hình MST: ${mst}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080"
      ]
    });

    const page = await browser.newPage();
    
    // Thiết lập các thông số giả lập cấu hình máy thật
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    // Tránh bị phát hiện bởi thuộc tính webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Mở trang chi tiết doanh nghiệp
    await page.goto("https://masothue.com/" + mst, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Đợi thêm 3 giây giả lập người dùng đọc trang để Cloudflare nhả dữ liệu ra
    await new Promise(r => setTimeout(r, 3000));

    const html = await page.content();
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);

  } catch (err) {
    console.error("Lỗi vận hành Puppeteer:", err.message);
    return res.status(500).send(`Lỗi hệ thống khi cào dữ liệu: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("Server Node.js API cho dự án Tra cứu MST đang hoạt động tốt!");
});

app.listen(PORT, () => {
  console.log(`Server đang vận hành tại port ${PORT}`);
});