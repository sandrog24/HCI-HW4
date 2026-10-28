// Where the Python API is running
const API_URL = "http://localhost:8005";

// Data the page keeps track of
let questions = [];    // the list of questions from the API
let currentIndex = 0;  // which question is showing in the main area
let editingId = null;  // the id of the question currently being edited

// Grab the HTML elements we need (CSS-style selectors: "#id" or ".class")
const previewList = document.querySelector("#preview-list");
const cardArea = document.querySelector("#card-area");
const errorMessage = document.querySelector("#error-message");
const newQuestion = document.querySelector("#new-question");
const newAnswer = document.querySelector("#new-answer");
const editDialog = document.querySelector("#edit-dialog");
const editQuestion = document.querySelector("#edit-question");
const editAnswer = document.querySelector("#edit-answer");
const previousButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const counter = document.querySelector("#counter");


// ---------- Errors ----------

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}


// ---------- Talking to the API ----------

async function apiGet(path) {
  try {
    const response = await fetch(API_URL + path);
    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }
    return await response.json();
  } catch (error) {
    showError("Could not reach API: " + error.message);
    return [];
  }
}

async function apiSend(method, path, data) {
  try {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }
    return true;
  } catch (error) {
    showError("Could not reach API: " + error.message);
    return false;
  }
}


// ---------- Showing the page ----------

// Get the questions from the API, then redraw everything.
async function renderPage() {
  hideError();
  questions = await apiGet("/questions");
  showPage();
}

// Redraw the sidebar and the main card from the data we already have.
function showPage() {
  // keep currentIndex inside the list (e.g. after a delete)
  if (currentIndex >= questions.length) currentIndex = questions.length - 1;
  if (currentIndex < 0) currentIndex = 0;
  renderPreviews();
  showCard();
}

// Sidebar: one preview per question. Clicking a preview shows that card.
function renderPreviews() {
  previewList.innerHTML = "";
  questions.forEach(function (question, index) {
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "preview";
    if (index === currentIndex) {
      preview.classList.add("active");
      preview.setAttribute("aria-current", "true");
    }
    preview.textContent = question.q;
    preview.addEventListener("click", function () {
      currentIndex = index;
      showPage();
      previewList.children[index].focus();
    });
    previewList.append(preview);
  });
}

// Create a card to represent current question/answer (stored at questions[currentIndex])
function showCard() {
  cardArea.innerHTML = "";
  counter.textContent = questions.length ? "Card " + (currentIndex + 1) + " of " + questions.length : "Card 0 of 0";
  previousButton.disabled = questions.length < 2;
  nextButton.disabled = questions.length < 2;
  if (questions.length === 0) {
    cardArea.textContent = "No questions to show.";
    return;
  }
  const question = questions[currentIndex];

  const card = document.createElement("div");
  card.className = "card";

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    deleteQuestion(question);
  });

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.addEventListener("click", function () {
    openEditDialog(question);
  });

  const questionText = document.createElement("h2");
  questionText.className = "question";
  questionText.textContent = question.q;

  const answerText = document.createElement("p");
  answerText.className = "answer hidden";
  answerText.id = "card-answer";
  answerText.textContent = question.a;

  const revealButton = document.createElement("button");
  revealButton.type = "button";
  revealButton.className = "reveal-button";
  revealButton.textContent = "Show answer";
  revealButton.setAttribute("aria-expanded", "false");
  revealButton.setAttribute("aria-controls", "card-answer");
  revealButton.addEventListener("click", function () {
    answerText.classList.toggle("hidden");
    const expanded = !answerText.classList.contains("hidden");
    revealButton.setAttribute("aria-expanded", String(expanded));
    revealButton.textContent = expanded ? "Hide answer" : "Show answer";
  });

  const cardActions = document.createElement("div");
  cardActions.className = "card-actions";
  deleteButton.className = "delete-button";
  cardActions.append(editButton, deleteButton);
  card.append(questionText, revealButton, answerText, cardActions);
  cardArea.append(card);
}


// ---------- Navigation ----------

function moveCard(direction) {
  if (questions.length === 0) return;
  currentIndex = (currentIndex + direction + questions.length) % questions.length;
  showPage();
}

previousButton.addEventListener("click", function () { moveCard(-1); });
nextButton.addEventListener("click", function () { moveCard(1); });


// ---------- Actions ----------

async function deleteQuestion(question) {
  if (await apiSend("DELETE", "/delete/" + question.id)) renderPage();
}

function openEditDialog(question) {
  editingId = question.id;
  editQuestion.value = question.q;
  editAnswer.value = question.a;
  editDialog.showModal();
}

document.querySelector("#close-dialog").addEventListener("click", function () {
  editDialog.close();
});

document.querySelector("#update-button").addEventListener("click", async function () {
  if (!editQuestion.value.trim() || !editAnswer.value.trim()) {
    editQuestion.setCustomValidity(editQuestion.value.trim() ? "" : "Enter a question.");
    editAnswer.setCustomValidity(editAnswer.value.trim() ? "" : "Enter an answer.");
    if (!editQuestion.reportValidity()) return;
    editAnswer.reportValidity();
    return;
  }
  const updated = await apiSend("PUT", "/update/" + editingId, {
    question: editQuestion.value.trim(),
    answer: editAnswer.value.trim()
  });
  if (!updated) return;
  editDialog.close();
  renderPage();
});

[editQuestion, editAnswer].forEach(function (input) {
  input.addEventListener("input", function () { input.setCustomValidity(""); });
});

document.querySelector("#add-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  const added = await apiSend("POST", "/add", {
    question: newQuestion.value.trim(),
    answer: newAnswer.value.trim()
  });
  if (!added) return;
  newQuestion.value = "";
  newAnswer.value = "";
  currentIndex = questions.length;
  renderPage();
});


// ---------- Start the app ----------
renderPage();
