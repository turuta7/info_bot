const app = require("./server");
require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const {
  generateTimeButtons,
  scheduleTimer,
  timerData,
  cleanTimer,
} = require("./func");
const bot = new Telegraf(process.env.API_TELEGRAM);

const port = process.env.PORT || 3000;

bot.command("start", (ctx) => {
  const keyboard = Markup.keyboard([
    ["Задати текст і час"]["Перевірити дані"],
    ["Очистити"],
  ]).resize();

  const userName = ctx.from.first_name;
  console.log(ctx, userName);
  ctx.reply(`Привет ${userName}`, keyboard);
});

// Команда /set - начать настройку таймера
bot.hears("Задати текст і час", (ctx) => {
  ctx.reply("Виберіть час для відправлення повідомлення:", {
    reply_markup: {
      inline_keyboard: generateTimeButtons(),
    },
  });
  timerData.time = null;
});
bot.hears("Перевірити дані", (ctx) => {
  ctx.reply(`time: ${timerData.time}`);
  ctx.reply(`message: ${timerData.message}`);
  timerData.task ? ctx.reply(`task: OK`) : ctx.reply(`task: null`);
});
bot.hears("Очистити", (ctx) => {
  ctx.reply("Очищенно");
  cleanTimer();
});

// Обработка выбора времени с помощью кнопок
bot.action(/(\d{2}:\d{2})/, (ctx) => {
  if (!timerData.time) {
    const selectedTime = ctx.match[1];
    timerData.time = selectedTime;
    ctx.reply("Введіть повідомлення для відправки всім в групі:");
  } else {
    ctx.reply("Будь ласка, виберіть тільки час спочатку");
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
      `Таймер для надсилання повідомлення о ${time} усім у групі налаштований.`
    );
    scheduleTimer(timerData.time, timerData.message);
  } else {
    ctx.reply("Будь ласка, оберіть час і введіть повідомлення для відправки");
  }
});

app.listen(port, () => {
  console.log("SERVER START");
  bot.launch();
});
