import {
  deleteObject,
  GeoPoint,
  collection,
  db,
  doc,
  getDownloadURL,
  isFirebaseConfigured,
  ref,
  serverTimestamp,
  setDoc,
  storage,
  uploadBytes,
} from "./firebase-config.js";
import {
  getInputMessage,
  isInputOpen,
  loadInputPolicy,
  formatInputDateTime,
  toDate,
} from "./input-policy.js";

const form = document.querySelector("#report-form");
const locationButton = document.querySelector("#get-location");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const locationStatus = document.querySelector("#location-status");
const memoInput = document.querySelector("#memo");
const memoCount = document.querySelector("#memo-count");
const photoInput = document.querySelector("#photo");
const photoStatus = document.querySelector("#photo-status");
const errorElement = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-report");
const inputWindowStatus = document.querySelector("#input-window-status");

let currentLocation = null;
let inputOpen = false;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function validatePhoto(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "写真はJPEG・PNG・WebPのいずれかを選択してください。";
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return "写真のサイズは5MB以内にしてください。";
  }
  return "";
}

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
  title.className = `text-sm font-bold ${open ? "text-green-700" : "text-slate-700"}`;
  title.textContent = message;

  const detail = document.createElement("p");
  detail.className = "mt-1 text-xs text-slate-500";
  detail.textContent = open
    ? "現在、清掃活動の報告を受け付けています。"
    : "受付期間外はデータを登録できません。";

  inputWindowStatus.replaceChildren(title, detail);
  inputWindowStatus.className = open
    ? "mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 shadow"
    : "mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow";
  form.classList.toggle("hidden", !open);
  inputOpen = open;
}

async function checkInputWindow() {
  try {
    const policy = await loadInputPolicy();
    if (isInputOpen(policy, "cleanup")) {
      setInputWindowStatus("清掃活動の入力受付中です。", true);
      return;
    }

    const now = new Date();
    const start = toDate(policy.cleanupStartAt);
    const end = toDate(policy.cleanupEndAt);
    const nextMessage = start && start > now
      ? `受付開始前です。開始予定：${formatInputDateTime(start)}`
      : end && end < now
        ? "今回の受付は終了しました。"
        : getInputMessage(policy, "cleanup");
    setInputWindowStatus(nextMessage, false);
  } catch (error) {
    console.error("受付状況の確認に失敗しました:", error);
    setInputWindowStatus("受付状況を確認できないため、現在は閲覧のみです。", false);
  }
}

function getGeolocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "位置情報の利用が許可されていません。ブラウザの設定からGPSを許可してください。";
    case error.POSITION_UNAVAILABLE:
      return "現在地を取得できませんでした。電波状況を確認して、もう一度お試しください。";
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
  locationStatus.textContent = "GPSの応答を待っています。";

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      currentLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      latitudeInput.value = coords.latitude.toFixed(6);
      longitudeInput.value = coords.longitude.toFixed(6);
      locationStatus.textContent = `現在地を取得しました（精度 約${Math.round(coords.accuracy)}m）`;
      locationStatus.className = "mt-2 text-sm font-medium text-green-700";
      locationButton.disabled = false;
      locationButton.textContent = "📍 現在地を再取得";
    },
    (error) => {
      const message = getGeolocationErrorMessage(error);
      currentLocation = null;
      latitudeInput.value = "";
      longitudeInput.value = "";
      locationStatus.textContent = "位置情報を取得できませんでした。";
      locationStatus.className = "mt-2 text-sm font-medium text-red-700";
      locationButton.disabled = false;
      locationButton.textContent = "📍 現在地をGPSで取得";
      showError(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
});

memoInput.addEventListener("input", () => {
  memoCount.textContent = `${memoInput.value.length} / 200`;
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  const message = validatePhoto(file);
  photoStatus.textContent = message || (file ? `選択中：${file.name}` : "JPEG・PNG・WebP、1枚、5MB以内。人の顔や個人情報は写さないでください。");
  photoStatus.className = `mt-2 text-xs ${message ? "text-red-700" : "text-slate-500"}`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  if (!inputOpen) {
    showError("現在は入力受付期間外です。活動日にもう一度お試しください。");
    return;
  }

  if (!isFirebaseConfigured) {
    showError("Firebaseの設定が未完了です。js/firebase-config.js を設定してください。");
    return;
  }

  if (!currentLocation) {
    showError("先に「現在地をGPSで取得」を押してください。");
    return;
  }

  const amount = Number(new FormData(form).get("amount"));
  if (!Number.isInteger(amount) || amount < 1 || amount > 5) {
    showError("ゴミの量を1〜5から選択してください。");
    return;
  }

  const memo = memoInput.value.trim();
  if (memo.length > 200) {
    showError("メモは200文字以内で入力してください。");
    return;
  }

  const photoFile = photoInput.files[0];
  const photoError = validatePhoto(photoFile);
  if (photoError) {
    showError(photoError);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "送信しています…";

  let uploadedPhotoRef = null;
  try {
    const reportRef = doc(collection(db, "trash_reports"));
    const report = {
      date: serverTimestamp(),
      location: new GeoPoint(currentLocation.latitude, currentLocation.longitude),
      amount,
    };

    if (memo) {
      report.memo = memo;
    }

    if (photoFile) {
      const photoPath = `cleanup_reports/${reportRef.id}/photo`;
      uploadedPhotoRef = ref(storage, photoPath);
      await uploadBytes(uploadedPhotoRef, photoFile, {
        contentType: photoFile.type,
        cacheControl: "public,max-age=3600",
      });
      report.photoUrl = await getDownloadURL(uploadedPhotoRef);
      report.photoPath = photoPath;
    }

    await setDoc(reportRef, report);
    window.alert("報告ありがとうございます！");
    window.location.href = "./index.html";
  } catch (error) {
    console.error("報告の送信に失敗しました:", error);
    if (uploadedPhotoRef) {
      try {
        await deleteObject(uploadedPhotoRef);
      } catch (cleanupError) {
        console.warn("失敗した写真の後片付けに失敗しました:", cleanupError);
      }
    }
    const message = error?.code === "storage/unauthorized"
      ? "写真を保存できませんでした。Firebase Storageのルールと受付期間を確認してください。"
      : "報告を送信できませんでした。通信環境とFirebaseの設定をご確認ください。";
    showError(message);
    submitButton.disabled = false;
    submitButton.textContent = "報告を送信する";
  }
});

checkInputWindow();
