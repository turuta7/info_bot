const cron = require("node-cron-tz");
// Замените 'YOUR_CHAT_ID' на идентификатор вашей группы
const chatId = process.env.ID_CHAT;

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

// Функция для настройки и запуска таймера
function scheduleTimer(time, message, timezone) {
  if (timerData.task) {
    timerData.task.destroy();
  }
  const scheduledTime = parseTime(time);
  console.log("===========scheduledTime============");
  console.log(scheduledTime);
  console.log("====================================");
  if (scheduledTime) {
    timerData.task = cron.schedule(
      scheduledTime,
      () => {
        // Отправка сообщения всем в группе
        bot.telegram.sendMessage(chatId, message);
      },
      {
        timezone: timezone, // Додайте таймзону
      }
    );
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
};
