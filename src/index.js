const app = require("./server");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Telegraf, Markup } = require("telegraf");
const {
  generateTimeButtons,
  scheduleTimer,
  timerData,
  cleanTimer,
} = require("./func");
// Замените 'YOUR_BOT_TOKEN' на токен вашего бота
const lockFilePath = path.join(__dirname, "bot.lock");
// Попытка получить блокировку
if (fs.existsSync(lockFilePath)) {
  console.log("Another instance of the bot is already running.");
  process.exit(1); // Выход с ошибкой
}

fs.writeFileSync(lockFilePath, "locked");
const bot = new Telegraf(process.env.API_TELEGRAM);

bot.command("start", (ctx) => {
  const keyboard = Markup.keyboard([["set", "info"], ["Clean"]]).resize();

  // const keyboard = Markup.keyboard([["set", "info"], ["Clean"]]).resize();
  if (ctx.update.message.from.id === ctx.update.message.chat.id) {
    ctx.reply("Привет1", keyboard);
  } else {
    ctx.reply("Привет2", {
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

bot.hears("Команда 1", (ctx) => {
  ctx.reply("Вы выбрали Команду 1");
});

// const main = async () => {
//   // Запуск бота
//   try {
//     bot.botInfo = await bot.telegram.getMe();
//     console.log("Bot started");
//     bot.launch();
//   } catch (err) {
//     console.error("Ошибка запуска бота", err);
//   }
// };

// main();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("SERVER START");
  bot.launch();
});

// В случае завершения работы бота, освободите блокировку
process.on("SIGINT", () => {
  fs.unlinkSync(lockFilePath);
  process.exit();
});
