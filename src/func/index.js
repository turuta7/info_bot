const cron = require("node-cron");
const { DateTime } = require("luxon");
// Замените 'YOUR_CHAT_ID' на идентификатор вашей группы
const chatId = process.env.ID_CHAT;

let bot = null;

let allTimes = {};

// Объект для хранения данных о таймере
const timerData = {
  time: null, // Время для отправки сообщения
  message: null, // Сообщение для отправки
  task: null, // Задача cron
};

const cleanTimer = () => {
  timerData.time = null;
  timerData.message = null;
  timerData.task = null;
};

const setTimer = (ctx) => {
  allTimes[ctx.time] = { task: ctx.task, message: ctx.message };
  cleanTimer();
};

function addTimeZone(timeString) {
  console.log(timeString);
  // Ваша строка времени
  const dt = DateTime.now().setZone("Europe/Kiev");
  const match = /(\d{2}):(\d{2})/.exec(timeString);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    console.log(dt.offset / 60);
    // Добавляем 3 часа
    hours -= dt.offset / 60;

    // Обработка перехода на следующий день, если часы стали больше 23
    if (hours >= 24) {
      hours -= 24;
      // Если нужно учитывать переход на следующий день, увеличьте дату
      // Например: now.setDate(now.getDate() + 1);
    }
    // Выводим результат
    console.log(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`
    );
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  } else {
    console.error("Неверный формат времени");
  }
}
function sendBot(serBot) {
  bot = serBot;
  if (bot) console.log("Bot - ok");
}
// Генерация кнопок для выбора времени
function generateTimeButtons() {
  const buttons = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Например, каждые 15 минут
      const time = `${hour < 10 ? "0" : ""}${hour}:${
        minute < 10 ? "0" : ""
      }${minute}`;
      buttons.push([{ text: time, callback_data: time }]);
    }
  }
  return buttons;
}

function selectDeleteTimer() {
  const buttons = [];
  const keys = Object.keys(allTimes);
  console.log("keys", keys);
  console.log(keys.length);
  for (let key = 0; key < keys.length; key++) {
    console.log({ text: keys + "_", callback_data: keys + "_key" });
    buttons.push([{ text: keys[key] + "_", callback_data: keys + "_key" }]);
  }
  return buttons;
}

// Функция для настройки и запуска таймера
function scheduleTimer(time, message, timezone) {
  if (timerData.task) {
    timerData.task.destroy();
  }
  let scheduledTime = null;
  const now = new Date();
  const timeZoneOffset = now.getTimezoneOffset();

  if (timeZoneOffset === 0) {
    console.log("Сервер работает в часовом поясе UTC.");

    scheduledTime = parseTime(addTimeZone(time));
  } else {
    scheduledTime = parseTime(time);
  }
  console.log("scheduledTime: ", scheduledTime);
  if (scheduledTime) {
    return cron.schedule(scheduledTime, () => {
      // Отправка сообщения всем в группе
      bot.telegram.sendMessage(chatId, message);
    });
    // timerData.task = cron.schedule(scheduledTime, () => {
    //   // Отправка сообщения всем в группе
    //   bot.telegram.sendMessage(chatId, message);
    // });
  }
}

// Функция для преобразования времени в формат cron
function parseTime(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${minutes} ${hours} * * *`;
    }
  }
  return null;
}

module.exports = {
  generateTimeButtons,
  scheduleTimer,
  timerData,
  cleanTimer,
  sendBot,
  setTimer,
  allTimes,
  selectDeleteTimer,
};
