const app = require("./server");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Telegraf, Markup } = require("telegraf");
const {
  generateTimeButtons,
  scheduleTimer,
  timerData,
  cleanTimer,
  sendBot,
} = require("./func");
// Замените 'YOUR_BOT_TOKEN' на токен вашего бота
const lockFilePath = path.join(__dirname, "bot.lock");
// Попытка получить блокировку
if (fs.existsSync(lockFilePath)) {
  console.log("Another instance of the bot is already running.");
  process.exit(1); // Выход с ошибкой
}
let timerAxios = null;
fs.writeFileSync(lockFilePath, "locked");
const bot = new Telegraf(process.env.API_TELEGRAM, { polling: true });
sendBot(bot);
bot.command("start", (ctx) => {
  const keyboard = Markup.keyboard([["set", "info"], ["Clean"]]).resize();

  // const keyboard = Markup.keyboard([["set", "info"], ["Clean"]]).resize();
  if (ctx.update.message.from.id === ctx.update.message.chat.id) {
    const username = ctx.from.username;
    ctx.reply(`Hello ${username}`, keyboard);
  } else {
    ctx.reply("", {
      reply_markup: { remove_keyboard: true },
    });
  }
});

// Команда /set - начать настройку таймера
bot.hears("set", (ctx) => {
  ctx.reply("Выберите время для отправки сообщения:", {
    reply_markup: {
      inline_keyboard: generateTimeButtons(),
    },
  });
  timerData.time = null;
});
bot.hears("info", (ctx) => {
  ctx.reply(`time: ${timerData.time}`);
  ctx.reply(`message: ${timerData.message}`);
  timerData.task ? ctx.reply(`task: OK`) : ctx.reply(`task: null`);
  ctx.reply(`dateServer: ${new Date()}`);
});
bot.hears("Clean", (ctx) => {
  ctx.reply(`Clean timer`);
  cleanTimer();
});

// Обработка выбора времени с помощью кнопок
bot.action(/(\d{2}:\d{2})/, (ctx) => {
  if (!timerData.time) {
    const selectedTime = ctx.match[1];
    timerData.time = selectedTime;
    ctx.reply("Введите сообщение для отправки всем в группе:");
  } else {
    ctx.reply("Пожалуйста, выберите только время сначала.");
  }
});

// Обработка введенного сообщения
bot.hears(/.*/, (ctx) => {
  // console.log("====================================");
  // console.log(ctx.update.message.from);
  // console.log(ctx.update.message.chat);
  // console.log("====================================");
  if (timerData.time && !timerData.message) {
    timerData.message = ctx.message.text;
    const time = timerData.time;
    ctx.reply(
      `Настроен таймер для отправки сообщения в ${time} всем в группе.`
    );
    scheduleTimer(timerData.time, timerData.message, "Europe/Kiev");
  } else {
    ctx.reply("Пожалуйста, выберите время и введите сообщение для отправкиqq.");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log("SERVER START");
  bot.launch();
  await bot.startPolling({ restart: true });
  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  process.on('SIGQUIT', stop);
  process.on('SIGINT', stop);
  if (process.env.URL && !timerAxios) {
    timerAxios = setInterval(() => {
      axios
        .get(process.env.URL)
        .then(function (response) {
          // handle success
          console.log(response.data);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    }, 15 * 60 * 1000);
  }
});

// В случае завершения работы бота, освободите блокировку
process.on("SIGINT", () => {
  fs.unlinkSync(lockFilePath);
  process.exit();
});
