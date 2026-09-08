import {
  GeoPoint,
  addDoc,
  collection,
  db,
  isFirebaseConfigured,
  serverTimestamp,
} from "./firebase-config.js";
import {
  getInputMessage,
  isInputOpen,
  loadInputPolicy,
  formatInputDateTime,
  toDate,
} from "./input-policy.js";

const form = document.querySelector("#observation-form");
const locationButton = document.querySelector("#get-location");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const locationStatus = document.querySelector("#location-status");
const errorElement = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-observation");
const inputWindowStatus = document.querySelector("#input-window-status");

let currentLocation = null;
let inputOpen = false;

function showError(message) {
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function clearError() {
  errorElement.textContent = "";
  errorElement.classList.add("hidden");
}

function setInputWindowStatus(message, open) {
  const title = document.createElement("p");
  title.className = `text-sm font-bold ${open ? "text-teal-700" : "text-slate-700"}`;
  title.textContent = message;
  const detail = document.createElement("p");
  detail.className = "mt-1 text-xs text-slate-500";
  detail.textContent = open ? "現在、自然観察の登録を受け付けています。" : "受付期間外はデータを登録できません。";
  inputWindowStatus.replaceChildren(title, detail);
  inputWindowStatus.className = open
    ? "mb-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow"
    : "mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow";
  form.classList.toggle("hidden", !open);
  inputOpen = open;
}

async function checkInputWindow() {
  try {
    const policy = await loadInputPolicy();
    if (isInputOpen(policy, "nature")) {
      setInputWindowStatus("自然観察の入力受付中です。", true);
      return;
    }
    const now = new Date();
    const start = toDate(policy.natureStartAt);
    const end = toDate(policy.natureEndAt);
    const message = start && start > now
      ? `受付開始前です。開始予定：${formatInputDateTime(start)}`
      : end && end < now
        ? "今回の受付は終了しました。"
        : getInputMessage(policy, "nature");
    setInputWindowStatus(message, false);
  } catch (error) {
    console.error("自然観察の受付状況確認に失敗しました:", error);
    setInputWindowStatus("受付状況を確認できないため、現在は閲覧のみです。", false);
  }
}

function getGeolocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "位置情報の利用が許可されていません。ブラウザの設定からGPSを許可してください。";
    case error.POSITION_UNAVAILABLE:
      return "現在地を取得できませんでした。電波状況を確認してください。";
    case error.TIMEOUT:
      return "現在地の取得がタイムアウトしました。もう一度お試しください。";
    default:
      return "現在地の取得中にエラーが発生しました。";
  }
}

locationButton.addEventListener("click", () => {
  clearError();
  if (!navigator.geolocation) {
    showError("このブラウザは位置情報の取得に対応していません。");
    return;
  }
  locationButton.disabled = true;
  locationButton.textContent = "現在地を取得しています…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      currentLocation = { latitude: coords.latitude, longitude: coords.longitude };
      latitudeInput.value = coords.latitude.toFixed(6);
      longitudeInput.value = coords.longitude.toFixed(6);
      locationStatus.textContent = `現在地を取得しました（精度 約${Math.round(coords.accuracy)}m）`;
      locationStatus.className = "mt-2 text-sm font-medium text-teal-700";
      locationButton.disabled = false;
      locationButton.textContent = "📍 現在地を再取得";
    },
    (error) => {
      currentLocation = null;
      latitudeInput.value = "";
      longitudeInput.value = "";
      locationStatus.textContent = "位置情報を取得できませんでした。";
      locationStatus.className = "mt-2 text-sm font-medium text-red-700";
      locationButton.disabled = false;
      locationButton.textContent = "📍 現在地をGPSで取得";
      showError(getGeolocationErrorMessage(error));
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  if (!inputOpen) {
    showError("現在は受付期間外です。活動日にもう一度お試しください。");
    return;
  }
  if (!isFirebaseConfigured) {
    showError("Firebaseの設定が未完了です。");
    return;
  }
  if (!currentLocation) {
    showError("先に現在地をGPSで取得してください。");
    return;
  }

  const name = document.querySelector("#name").value.trim();
  const count = Number(document.querySelector("#count").value);
  const memo = document.querySelector("#memo").value.trim();
  if (!name || name.length > 100 || !Number.isInteger(count) || count < 1 || count > 999 || memo.length > 200) {
    showError("入力内容を確認してください。");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "登録しています…";
  try {
    const observation = {
      observedAt: serverTimestamp(),
      location: new GeoPoint(currentLocation.latitude, currentLocation.longitude),
      category: document.querySelector("#category").value,
      name,
      count,
    };
    if (memo) observation.memo = memo;
    await addDoc(collection(db, "nature_observations"), observation);
    window.alert("自然観察を登録しました。ありがとうございます！");
    window.location.href = "./index.html";
  } catch (error) {
    console.error("自然観察の登録に失敗しました:", error);
    showError("登録できませんでした。通信環境とFirebaseの設定をご確認ください。");
    submitButton.disabled = false;
    submitButton.textContent = "観察を登録する";
  }
});

checkInputWindow();
