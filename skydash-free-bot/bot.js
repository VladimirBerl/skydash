const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const e = require("express");
const path = require("path");

const TOKEN = "7745394141:AAHoA22DRl7aW0KU6RJtEHpnLA_F1z3mbsQ";

const ARRAY_GROUPS_KEYS = {
  "ВТс-241-ВТс-242-ТМс-241": ["ВТс-241", "ВТс-242", "ТМс-241"],
  "МДс-241-Экс-241-ПОс-241": ["МДс-241", "Экс-241", "ПОс-241"],
  "ВТс-231-ВТс-232-ТМс-231": ["ВТс-231", "ВТс-232", "ТМс-231"],
  "МДс-231-Экс-231-ПОс-231": ["МДс-231", "Экс-231", "ПОс-231"],
  "ВТс-221-ВТс-222-ВТс-223": ["ВТс-221", "ВТс-222", "ВТс-223"],
  "МДс-221-Экс-221-ПОс-221": ["МДс-221", "Экс-221", "ПОс-221"],
  "ВТс-211-ВТс-212": ["ВТс-211", "ВТс-212"],
};

const STORAGE_KEYS = Object.keys(ARRAY_GROUPS_KEYS);
const STORAGE_ITEMS = Object.values(ARRAY_GROUPS_KEYS);

const bot = new Telegraf(TOKEN);

const userState = {};
const userChatIds = new Set();
const scheduleFiles = {};

const kbSchedule = Markup.keyboard(["Расписание"]).resize();
const kbCourses = Markup.keyboard([["1", "2"], ["3", "4"], ["Назад"]]).resize();

const kbGroups = {
  1: Markup.keyboard([[STORAGE_ITEMS[0].join(" | "), STORAGE_ITEMS[1].join(" | ")], ["Назад"]]).resize(),
  2: Markup.keyboard([[STORAGE_ITEMS[2].join(" | "), STORAGE_ITEMS[3].join(" | ")], ["Назад"]]).resize(),
  3: Markup.keyboard([[STORAGE_ITEMS[4].join(" | "), STORAGE_ITEMS[5].join(" | ")], ["Назад"]]).resize(),
  4: Markup.keyboard([[STORAGE_ITEMS[6].join(" | ")], ["Назад"]]).resize(),
};

bot.start((ctx) => {
  userChatIds.add(ctx.chat.id);
  userState[ctx.from.id] = "start";

  ctx.reply(
    `Привет!
Я бот для просмотра расписания.

Инструкция:
1. Нажмите кнопку 'Расписание'
2. Выберите номер курса
3. Выберите свою группу`,
    kbSchedule
  );
});

bot.hears("Привет", (ctx) => {
  userState[ctx.from.id] = "greeted";
  userChatIds.add(ctx.chat.id);
  ctx.reply("Привет! Чем могу помочь?", kbSchedule);
});

bot.hears("Пока", (ctx) => {
  userChatIds.add(ctx.chat.id);
  ctx.reply("Пока! Хорошего дня!");
});

bot.hears("Расписание", (ctx) => {
  userChatIds.add(ctx.chat.id);
  userState[ctx.from.id] = "schedule";
  ctx.reply("Выберите номер курса:", kbCourses);
});

bot.hears(["1", "2", "3", "4"], (ctx) => {
  const course = ctx.message.text;
  userChatIds.add(ctx.chat.id);
  userState[ctx.from.id] = "course_number";
  ctx.reply("Выберите группу:", kbGroups[course]);
});

bot.hears("Назад", (ctx) => {
  const state = userState[ctx.from.id];
  userChatIds.add(ctx.chat.id);
  if (state === "group") {
    userState[ctx.from.id] = "schedule";
    ctx.reply("Выберите номер курса:", kbCourses);
  } else {
    userState[ctx.from.id] = "start";
    ctx.reply("Главное меню:", kbSchedule);
  }
});

const allGroups = STORAGE_ITEMS.map((e) => e.join(" | "));

bot.hears(allGroups, async (ctx) => {
  userState[ctx.from.id] = "group";
  userChatIds.add(ctx.chat.id);

  const groupName = ctx.message.text;
  const key = groupName.split(" | ").join("-");

  const fileData = scheduleFiles[key];

  if (fileData) {
    let filename = fileData.filename;

    if (path.extname(filename).toLowerCase() !== ".pdf") {
      filename += ".pdf";
    }

    await bot.telegram.sendDocument(ctx.chat.id, {
      source: fileData.path,
      filename: filename,
    });
    ctx.reply(`Вот ваше расписание:

Если хотите вернуться — нажмите "Назад".`);
  } else {
    ctx.reply("Файл не найден для выбранной группы.");
  }
});

bot.on("text", async (ctx) => {
  const groupName = ctx.message.text.trim();
  userChatIds.add(ctx.chat.id);
  userState[ctx.from.id] = "group";

  // Найдём ключ, в котором содержится эта группа
  const matchedKey = Object.entries(ARRAY_GROUPS_KEYS).find(([key, groupArray]) =>
    groupArray.includes(groupName)
  )?.[0];

  if (!matchedKey) {
    ctx.reply("Группа не найдена. Убедитесь, что ввели название точно.");
    return;
  }

  const fileData = scheduleFiles[matchedKey];

  if (fileData) {
    let filename = fileData.filename;

    if (path.extname(filename).toLowerCase() !== ".pdf") {
      filename += ".pdf";
    }

    await bot.telegram.sendDocument(ctx.chat.id, {
      source: fileData.path,
      filename: filename,
    });

    ctx.reply(`Вот ваше расписание для группы ${groupName}:

Если хотите вернуться — нажмите "Назад".`);
  } else {
    ctx.reply("Файл не найден для выбранной группы.");
  }
});

// express

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;

app.use(cors());

app.post("/upload-pdf", upload.single("file"), async (req, res) => {
  const fileName = req.body.fileName;
  const filePath = req.file.path;

  const key = fileName.replace(".pdf", "");

  scheduleFiles[key] = {
    path: filePath,
    filename: fileName,
  };

  try {
    res.send("Файл отправлен");
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка отправки");
  }
});

app.post("/upload-pdf-mailing", upload.single("file"), async (req, res) => {
  const fileName = req.body.fileName;
  const filePath = req.file.path;

  const key = fileName.replace(".pdf", "");

  scheduleFiles[key] = {
    path: filePath,
    filename: fileName,
  };

  try {
    res.send("Файл отправлен");

    let filenameRes = fileName;

    if (path.extname(filenameRes).toLowerCase() !== ".pdf") {
      filenameRes += ".pdf";
    }

    for (const chatId of userChatIds) {
      await bot.telegram.sendMessage(
        chatId,
        `📢 Расписание для групп ${ARRAY_GROUPS_KEYS[key].join(" | ")} обновилось:`
      );
      await bot.telegram.sendDocument(chatId, {
        source: filePath,
        filename: filenameRes,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка отправки");
  }
});

app.listen(PORT, () => {
  console.log(`HTTP сервер запущен на порту ${PORT}`);
});

bot.launch();
console.log("Бот запущен");
