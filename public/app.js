let username = prompt("اسم خودتو وارد کن:") || "ناشناس";
const socket = new WebSocket(`ws://${location.host}`);
const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");

// دریافت پیام‌ها از سرور
socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "history") {
    msg.data.forEach(renderMessage);
  } else if (msg.type === "message") {
    renderMessage(msg.data);
  }
});

// ارسال پیام به سرور
function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    type: "message",
    data: {
      user: username,
      text
    }
  };

  socket.send(JSON.stringify(msg));
  input.value = "";
}

// نمایش پیام در صفحه
function renderMessage({ user, text, time, date }) {
  const div = document.createElement("div");
  div.className = `max-w-md p-3 rounded-2xl text-sm ${
    user === username ? 'bg-blue-500/20 self-end' : 'bg-white/10 self-start'
  }`;

  // ساختن بخش زمان (اگه وجود داشته باشه)
  let timeInfo = '';
  if (date || time) {
    const showDate = date ? date : '';
    const showTime = time
      ? time.includes('T') ? new Date(time).toLocaleTimeString('fa-IR') : time
      : '';
    timeInfo = `<div class="text-gray-400 text-xs mt-1">${showDate} ${showTime}</div>`;
  }

  div.innerHTML = `
    <div class="font-semibold">${user}</div>
    <div>${text}</div>
    ${timeInfo}
  `;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
