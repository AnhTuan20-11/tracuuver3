const express = require("express");
const { connect } = require("puppeteer-real-browser");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api", async (req, res) => {
  const mst = req.query.mst;
  if (!mst) {
    return res.status(400).send("Thiếu tham số mst");
  }

  console.log(`[Render] Đang kết nối trình duyệt thực tế tra cứu MST: ${mst}`);

  try {
    // Khởi chạy trình duyệt bằng lõi chống Cloudflare chuyên dụng
    const { browser, page } = await connect({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      turnstile: true, // Tự động click ô "Tôi không phải là robot" nếu Cloudflare yêu cầu
    });

    // Cấu hình định dạng như người dùng thật lướt mạng
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    // Truy cập trực tiếp trang mã số thuế
    await page.goto("https://masothue.com/" + mst, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Chờ thêm 5 giây ngầm để hệ thống đồng bộ mã hóa Cloudflare nhả dữ liệu sạch ra
    await new Promise(r => setTimeout(r, 5000));

    // Lấy toàn bộ HTML sạch sau khi tường lửa đã mở cửa
    const html = await page.content();
    
    // Đóng trình duyệt giải phóng RAM cho gói Render Free
    await browser.close();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);

  } catch (err) {
    console.error("Lỗi hệ thống chống chặn:", err.message);
    return res.status(500).send(`Lỗi hệ thống khi cào dữ liệu: ${err.message}`);
  }
});

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("Server Node.js API cho dự án Tra cứu MST đang hoạt động tốt!");
});

app.listen(PORT, () => {
  console.log(`Server đang vận hành tại port ${PORT}`);
});