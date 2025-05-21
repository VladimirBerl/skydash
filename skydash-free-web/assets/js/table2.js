const API_KEY = "http://87.228.89.28:3000";
// const API_KEY = "http://localhost:3000";

const ARRAY_COURSES_GROUPS = [
  {
    "ВТс-241-ВТс-242-ТМс-241": ["ВТс-241", "ВТс-242", "ТМс-241"],
    "МДс-241-Экс-241-ПОс-241": ["МДс-241", "Экс-241", "ПОс-241"],
  },
  {
    "ВТс-231-ВТс-232-ТМс-231": ["ВТс-231", "ВТс-232", "ТМс-231"],
    "МДс-231-Экс-231-ПОс-231": ["МДс-231", "Экс-231", "ПОс-231"],
  },
  {
    "ВТс-221-ВТс-222-ВТс-223": ["ВТс-221", "ВТс-222", "ВТс-223"],
    "МДс-221-Экс-221-ПОс-221": ["МДс-221", "Экс-221", "ПОс-221"],
  },
  {
    "ВТс-211-ВТс-212": ["ВТс-211", "ВТс-212"],
  },
];

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

let STORAGE_KEY;

const table = document.getElementById("custom_table");
const links = document.querySelectorAll("#courses");
const buttonsContainer = document.querySelector(".table-send-buttons");
const buttonSave = document.getElementById("send");
const buttonCancel = document.getElementById("reset");
const loader = document.getElementById("loader");

function initializeTable() {
  initializeLinks();
  initializeStorageKeys();
  fetchingAllTables();
}

function initializeLinks() {
  links.forEach((ul, index) => {
    const group = ARRAY_COURSES_GROUPS[index];

    for (const key in group) {
      const linkItem = `<li>
        <a href="#" data-table-btn="${key}">
          ${group[key].join(" | ")}
        </a>
      </li>`;

      ul.insertAdjacentHTML("beforeend", linkItem);

      const lastLink = ul.querySelector(`li:last-child a`);
      lastLink.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        document.querySelectorAll("#courses a").forEach((link) => {
          link.style.color = "#5d7285";
        });

        e.target.style = "color: #007bff;";
        table.style = "opacity: 1;";
        buttonsContainer.style = "display: flex; position: fixed;";

        STORAGE_KEY = lastLink.getAttribute("data-table-btn");
        updateTableStructure(STORAGE_KEY);
        loadCurrentTableData(STORAGE_KEY);
        handleTableCellDblClick(STORAGE_KEY);
      });
    }
  });

  buttonSave.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveCurrentTableData(STORAGE_KEY);
    alert("Таблица сохранена");
  });

  buttonCancel.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadCurrentTableData(STORAGE_KEY);
    alert("Изменения отменены");
  });
}

function updateTableStructure(key) {
  const groups = ARRAY_GROUPS_KEYS[key];
  const headerRows = table.querySelectorAll("thead tr");
  const bodySections = table.querySelectorAll("tbody");

  if (headerRows.length >= 2) {
    const secondRow = headerRows[1];
    secondRow.innerHTML = "";

    groups.forEach((group) => {
      const th = document.createElement("th");
      th.setAttribute("colspan", "2");
      th.innerText = group;
      secondRow.appendChild(th);
    });
  }

  bodySections.forEach((tbody, index) => {
    const rows = tbody.rows;

    if (rows.length === 0) return;

    const firstRow = rows[0];

    if (firstRow && index === 0) {
      while (firstRow.cells.length > 2) {
        firstRow.deleteCell(2);
      }

      groups.forEach(() => {
        const thNumerator = document.createElement("th");
        const thDenominator = document.createElement("th");
        thNumerator.innerText = "Числитель";
        thDenominator.innerText = "Знаменатель";

        firstRow.appendChild(thDenominator);
        firstRow.appendChild(thNumerator);
      });
    }

    for (let i = index >= 1 ? 0 : 1; i < rows.length; i++) {
      const row = rows[i];

      if ((index >= 1 && i === 0) || (index === 0 && i === 1)) {
        while (row.cells.length > 2) {
          row.deleteCell(2);
        }
      } else {
        while (row.cells.length > 1) {
          row.deleteCell(1);
        }
      }

      groups.forEach(() => {
        const tdNumerator = document.createElement("td");
        const tdDenominator = document.createElement("td");
        tdNumerator.setAttribute("draggable", "true");
        tdDenominator.setAttribute("draggable", "true");

        row.appendChild(tdDenominator);
        row.appendChild(tdNumerator);
      });
    }
  });
}

function initializeStorageKeys() {
  STORAGE_KEYS.forEach((key) => {
    if (localStorage.getItem(key)) {
      return;
    }
    if (ARRAY_GROUPS_KEYS[key].length === 3) {
      localStorage.setItem(key, JSON.stringify(Array(216).fill("")));
    } else {
      localStorage.setItem(key, JSON.stringify(Array(144).fill("")));
    }
  });
}

function loadCurrentTableData(key) {
  const draggableCells = document.querySelectorAll("td[draggable='true']");

  const savedData = JSON.parse(localStorage.getItem(key));

  draggableCells.forEach((cell, index) => {
    cell.innerText = savedData[index];
    cell.classList.remove("modified");
  });
}

function saveCurrentTableData(key) {
  const draggableCells = document.querySelectorAll("td[draggable='true']");
  const tableData = [];

  draggableCells.forEach((cell) => {
    tableData.push(cell.innerText.trim());
    cell.classList.remove("modified");
  });
  localStorage.setItem(key, JSON.stringify(tableData));
  downloadTableAsPdf(table, key, `${API_KEY}/upload-pdf-mailing`);
}

function handleTableCellDblClick(key) {
  const draggableCells = document.querySelectorAll("td[draggable='true']");

  draggableCells.forEach((cell) => {
    cell.addEventListener("dblclick", () => {
      const currentText = cell.innerText;
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentText;
      input.classList.add("edit-input");

      input.addEventListener("blur", () => {
        const newValue = input.value;
        cell.innerText = newValue;

        const savedData = JSON.parse(localStorage.getItem(key) || "[]");
        const index = Array.from(draggableCells).indexOf(cell);
        const savedValue = savedData[index] || "";

        if (newValue !== savedValue) {
          cell.classList.add("modified");
        } else {
          cell.classList.remove("modified");
        }
      });

      cell.innerText = "";
      cell.appendChild(input);
      input.focus();
    });

    cell.addEventListener("dragstart", (e) => {
      draggedCell = cell;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cell.innerText);
      cell.classList.add("dragging");
    });

    cell.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      if (draggedCell !== cell) {
        const temp = draggedCell.innerText;
        draggedCell.innerText = cell.innerText;
        cell.innerText = temp;
      }
      draggedCell.classList.remove("dragging");
    });

    cell.addEventListener("dragend", () => {
      if (draggedCell) {
        draggedCell.classList.remove("dragging");
      }
    });
  });
}

async function fetchingAllTables() {
  try {
    showLoader(true);
    table.style = "opacity: 1;";
    for (let i = 0; i < STORAGE_KEYS.length; i++) {
      const key = STORAGE_KEYS[i];
      await new Promise((resolve) =>
        setTimeout(() => {
          updateTableStructure(key);
          loadCurrentTableData(key);
          resolve();
        }, 100)
      );
      await downloadTableAsPdf(table, `${key}.pdf`);
    }
    table.style = "opacity: 0;";
  } catch (err) {
    console.error("Ошибка при генерации PDF:", err);
    alert("Произошла ошибка при загрузке таблиц. См. консоль.");
  } finally {
    showLoader(false);
  }
}

async function downloadTableAsPdf(
  tableElement,
  filename = "schedule.pdf",
  url = `${API_KEY}/upload-pdf`
) {
  try {
    const opt = {
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };

    const pdfBlob = await html2pdf().set(opt).from(tableElement).outputPdf("blob");

    const formData = new FormData();
    formData.append("file", pdfBlob, filename);
    formData.append("chatId", 694603801);
    formData.append("fileName", filename);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Ошибка от сервера:", response.status, text);
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    console.log("✔ Успешный ответ:", await response.text());
    return response;
  } catch (err) {
    console.error("❌ Ошибка в downloadTableAsPdf:", err);
    throw err;
  }
}

function showLoader(show) {
  loader.style.display = show ? "flex" : "none";
}

initializeTable();
