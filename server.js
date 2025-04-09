const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const moment = require('moment-timezone');
const jMoment = require('jalali-moment');

const app = express();
const PORT = 3000;

// سرو فایل‌های استاتیک از پوشه‌ی public
app.use(express.static('public'));
app.use(express.json());

// فایل پیام‌ها
const messagesFile = path.join(__dirname, 'messages.txt');
if (!fs.existsSync(messagesFile)) {
  fs.writeFileSync(messagesFile, '');
}

// اجرای سرور
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// ایجاد WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('💬 New client connected');

  // ارسال تاریخچه به کاربر جدید
  try {
    const history = fs.readFileSync(messagesFile, 'utf-8')
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    ws.send(JSON.stringify({ type: 'history', data: history }));
  } catch (err) {
    console.error("❌ مشکل در خواندن پیام‌های قبلی:", err);
  }

  // دریافت پیام جدید از کاربر
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      const { user, text } = parsed.data || {};

      if (parsed.type === 'message' && user && text) {
        // زمان فعلی با تقویم شمسی
        const nowTehran = moment().tz("Asia/Tehran");
        const time = nowTehran.format("HH:mm:ss");
        const date = jMoment(nowTehran).locale('fa').format("YYYY/MM/DD");

        const fullMessage = {
          user,
          text,
          date,
          time
        };

        // ذخیره در فایل
        fs.appendFileSync(messagesFile, JSON.stringify(fullMessage) + '\n');

        // ارسال به تمام کاربران
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', data: fullMessage }));
          }
        });
      }
    } catch (err) {
      console.error("❌ پیام نامعتبر:", err);
    }
  });
});
