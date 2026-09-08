import {
  collection,
  db,
  getDocs,
  isFirebaseConfigured,
  orderBy,
  query,
} from "./firebase-config.js";

// BONJONOひとまち公園周辺。公式案内の城野駅北側エリアを初期表示する。
const BONJONO_CENTER = [33.861, 130.8863];
const statusElement = document.querySelector("#map-status");

const map = L.map("map", {
  zoomControl: true,
}).setView(BONJONO_CENTER, 16);

function refreshMapSize() {
  window.requestAnimationFrame(() => {
    map.invalidateSize({ pan: false });
  });
}

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

window.addEventListener("resize", refreshMapSize);
window.addEventListener("orientationchange", refreshMapSize);
window.addEventListener("pageshow", refreshMapSize);
refreshMapSize();

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.classList.toggle("text-red-700", type === "error");
  statusElement.classList.toggle("text-slate-700", type !== "error");
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return "日時不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}

const observationCategories = {
  bird: "鳥",
  insect: "昆虫",
  water: "水生生物",
  amphibian: "カエル・両生類",
  plant: "植物",
  other: "その他",
};

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

async function renderReports() {
  if (!isFirebaseConfigured) {
    setStatus("Firebaseの設定値を入力すると、報告データが表示されます。", "error");
    return;
  }

  try {
    const [snapshot, observationSnapshot] = await Promise.all([
      getDocs(query(collection(db, "trash_reports"), orderBy("date", "desc"))),
      getDocs(query(collection(db, "nature_observations"), orderBy("observedAt", "desc"))),
    ]);
    const heatPoints = [];

    snapshot.forEach((documentSnapshot) => {
      const report = documentSnapshot.data();
      const latitude = report.location?.latitude;
      const longitude = report.location?.longitude;
      const amount = Number(report.amount);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 5
      ) {
        return;
      }

      heatPoints.push([latitude, longitude, amount / 5]);

      const memo = typeof report.memo === "string" ? report.memo.trim() : "";
      const popup = [
        `<strong>${escapeHtml(formatDate(report.date))}</strong>`,
        `ゴミの量：${amount} / 5`,
        memo ? `メモ：${escapeHtml(memo)}` : "",
      ]
        .filter(Boolean)
        .join("<br>");

      L.circleMarker([latitude, longitude], {
        radius: 7,
        color: "#166534",
        weight: 1,
        fillColor: "#22c55e",
        fillOpacity: 0.12,
      })
        .bindPopup(popup)
        .addTo(map);
    });

    let observationCount = 0;
    observationSnapshot.forEach((documentSnapshot) => {
      const observation = documentSnapshot.data();
      const latitude = observation.location?.latitude;
      const longitude = observation.location?.longitude;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      observationCount += 1;
      const category = observationCategories[observation.category] || observationCategories.other;
      const name = typeof observation.name === "string" ? observation.name.trim() : "名称不明";
      const count = Number(observation.count);
      const memo = typeof observation.memo === "string" ? observation.memo.trim() : "";
      const popup = [
        `<strong>${escapeHtml(name)}</strong>`,
        `分類：${escapeHtml(category)}`,
        `観察数：${Number.isInteger(count) ? count : "-"}`,
        `日時：${escapeHtml(formatDate(observation.observedAt))}`,
        memo ? `メモ：${escapeHtml(memo)}` : "",
      ].filter(Boolean).join("<br>");

      L.circleMarker([latitude, longitude], {
        radius: 8,
        color: "#0f766e",
        weight: 2,
        fillColor: "#14b8a6",
        fillOpacity: 0.5,
      }).bindPopup(popup).addTo(map);
    });

    if (heatPoints.length > 0) {
      L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.35,
        max: 1,
      }).addTo(map);
    }

    setStatus(
      heatPoints.length > 0 || observationCount > 0
        ? `清掃${heatPoints.length}件・自然観察${observationCount}件を表示中`
        : "まだ活動データはありません。",
    );

    window.setTimeout(() => {
      statusElement.classList.add("hidden");
    }, 3500);
  } catch (error) {
    console.error("活動データの読み込みに失敗しました:", error);
    setStatus("データを読み込めませんでした。Firebaseの設定とルールをご確認ください。", "error");
  }
}

renderReports();
