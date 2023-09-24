require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const {
  generateTimeButtons,
  scheduleTimer,
  timerData,
  cleanTimer,
} = require("./func");
// Замените 'YOUR_BOT_TOKEN' на токен вашего бота
const bot = new Telegraf(process.env.API_TELEGRAM);

bot.command("start", (ctx) => {
  const keyboard = Markup.keyboard([
    ["set", "info"],
    // ["set timer", "kjnk"],
    // ["Команда 3", "Команда 4"],
    ["Clean"], // Кнопка для отмены
  ])
    .resize()
    .oneTime();

  // ctx.reply("Выберите опцию:", keyboard);
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
    scheduleTimer(timerData.time, timerData.message);
  } else {
    ctx.reply("Пожалуйста, выберите время и введите сообщение для отправкиqq.");
  }
});

bot.hears("Команда 1", (ctx) => {
  ctx.reply("Вы выбрали Команду 1");
});

// Запуск бота
bot.launch();
