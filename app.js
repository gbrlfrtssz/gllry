const categoryConfig = [
  {
    key: "street",
    label: "Street",
    collectionId: "u2HkPiliuLo",
  },
  {
    key: "people",
    label: "People",
    collectionId: "KB3oPRZJpww",
  },
  {
    key: "nature",
    label: "Nature",
    collectionId: "_R91G4klRAg",
  },
  {
    key: "beach",
    label: "Beach",
    collectionId: "q6HFr0gXqoA",
  },
  {
    key: "black-and-white",
    label: "Black and White",
    collectionId: "2LrZ4j7a1mk",
  },
];

const unsplashConfig = window.GLLRY_UNSPLASH || {};
const UNSPLASH_ACCESS_KEY = unsplashConfig.accessKey || "";
const UNSPLASH_PER_CATEGORY = 30;

const galleryGrid = document.querySelector("#galleryGrid");
const galleryFilters = document.querySelector("#galleryFilters");
const galleryStatus = document.querySelector("#galleryStatus");
const sortSelect = document.querySelector("#sortSelect");
const viewer = document.querySelector("#viewer");
const viewerImage = document.querySelector("#viewerImage");
const viewerTitle = document.querySelector("#viewerTitle");
const viewerMeta = document.querySelector("#viewerMeta");
const viewerCount = document.querySelector("#viewerCount");
const presetCards = document.querySelectorAll(".preset-card");
const presetModal = document.querySelector("#presetModal");
const closePresetModal = document.querySelector("#closePresetModal");
const presetTitle = document.querySelector("#presetTitle");
const presetDescription = document.querySelector("#presetDescription");
const presetSpecs = document.querySelector("#presetSpecs");
const aboutPhoto = document.querySelector("#aboutPhoto");
const aboutPhotoFrame = document.querySelector("#aboutPhotoFrame");
const closeViewer = document.querySelector("#closeViewer");
const prevPhoto = document.querySelector("#prevPhoto");
const nextPhoto = document.querySelector("#nextPhoto");
const themeToggle = document.querySelector("#themeToggle");
const menuButton = document.querySelector("#menuButton");
const sidePanel = document.querySelector("#sidePanel");

const state = {
  category: "all",
  sort: "random",
  filteredPhotos: [],
  currentIndex: 0,
  viewerIdleTimer: null,
};

const collectionCache = new Map();

const presets = {
  "salt-fade": {
    title: "Kodak Tri-X 400",
    description: "Because everything looks good with a black & white filter.",
    specs: {
      "Film Simulation": "ACROS+G FILTER",
      "Dynamic Range": "DR200",
      Highlight: "0",
      Shadow: "+3",
      Color: "0",
      "Noise Reduction": "-4",
      Sharpening: "+1",
      Clarity: "-4",
      "Grain Effect": "Strong / Large",
      "Color Chrome Effect": "Strong",
      "Color Chrome FX Blue": "OFF",
      "White Balance": "Daylight, R:+9 B:-9",
    },
  },
  "forest-soft": {
    title: "Blue Marine",
    description: "Summer vibes, hot days and drinks.",
    specs: {
      "Film Simulation": "CLASSIC Neg",
      "Dynamic Range": "DR400",
      Highlight: "+1",
      Shadow: "0",
      Color: "+3",
      "Noise Reduction": "-4",
      Sharpening: "-4",
      Clarity: "-3",
      "Grain Effect": "Strong / Weak",
      "Color Chrome Effect": "Weak",
      "Color Chrome FX Blue": "Weak",
      "White Balance": "AUTO, R:+4 B:-4",
    },
  },
  "city-grain": {
    title: "Pastel Colours",
    description: "Chill and peacefull colours.",
    specs: {
      "Film Simulation": "CLASSIC Neg",
      "Dynamic Range": "DR200",
      Highlight: "-2",
      Shadow: "-1",
      Color: "+3",
      "Noise Reduction": "-4",
      Sharpening: "+1",
      Clarity: "+2",
      "Grain Effect": "OFF",
      "Color Chrome Effect": "WEAK",
      "Color Chrome FX Blue": "WEAK",
      "White Balance": "Daylight, R:0 B:0",
    },
  },
  "mono-quiet": {
    title: "Cinematic",
    description: "What is that? A photo or a movie?",
    specs: {
      "Film Simulation": "Eterna / Cinema",
      "Dynamic Range": "DR200",
      Highlight: "-2",
      Shadow: "0",
      Color: "-1",
      "Noise Reduction": "-4",
      Sharpening: "-2",
      Clarity: "-2",
      "Grain Effect": "Weak / Small",
      "Color Chrome Effect": "Strong",
      "Color Chrome FX Blue": "Weak",
      "White Balance": "Daylight, R:-2 B:-4",
    },
  },
};

function getCategoryLabel(categoryKey) {
  if (categoryKey === "all") return "All categories";
  return categoryConfig.find((entry) => entry.key === categoryKey)?.label || categoryKey;
}

function createChip(label, active, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chip${active ? " is-active" : ""}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderFilterGroups() {
  const chips = [
    createChip("All categories", state.category === "all", () => {
      state.category = "all";
      renderFilterGroups();
      void renderGallery();
    }),
    ...categoryConfig.map((entry) =>
      createChip(entry.label, state.category === entry.key, () => {
        state.category = entry.key;
        renderFilterGroups();
        void renderGallery();
      }),
    ),
  ];

  galleryFilters.replaceChildren(...chips);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sample(items, amount) {
  return shuffle(items).slice(0, amount);
}

function normalizeUnsplashPhoto(photo, categoryKey) {
  const displayName =
    photo.description ||
    photo.alt_description ||
    `${getCategoryLabel(categoryKey)} by ${photo.user?.name || "Unsplash"}`;

  return {
    id: photo.id,
    title: displayName,
    categoryKey,
    categoryLabel: getCategoryLabel(categoryKey),
    photographer: photo.user?.name || "Unsplash",
    image: photo.urls?.regular,
    thumb: photo.urls?.small,
    blurHash: photo.blur_hash || "",
    downloadLocation: photo.links?.download_location || "",
    html: photo.links?.html || "",
  };
}

async function fetchCollectionPhotos(categoryKey) {
  if (collectionCache.has(categoryKey)) {
    return collectionCache.get(categoryKey);
  }

  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("Missing Unsplash access key");
  }

  const config = categoryConfig.find((entry) => entry.key === categoryKey);
  if (!config) return [];

  const endpoint = new URL(`https://api.unsplash.com/collections/${config.collectionId}/photos`);
  endpoint.searchParams.set("client_id", UNSPLASH_ACCESS_KEY);
  endpoint.searchParams.set("per_page", String(UNSPLASH_PER_CATEGORY));
  endpoint.searchParams.set("orientation", "portrait");

  const response = await fetch(endpoint.toString(), {
    headers: {
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash request failed for ${categoryKey}`);
  }

  const payload = await response.json();
  const normalized = payload
    .map((photo) => normalizeUnsplashPhoto(photo, categoryKey))
    .filter((photo) => photo.image);

  collectionCache.set(categoryKey, normalized);
  return normalized;
}

function sortPhotos(items) {
  if (state.sort === "random") {
    return shuffle(items);
  }

  return [...items].sort((left, right) => {
    if (state.sort === "name-desc") {
      return right.title.localeCompare(left.title);
    }
    return left.title.localeCompare(right.title);
  });
}

async function getFilteredPhotos() {
  if (state.category === "all") {
    const collections = await Promise.all(categoryConfig.map((entry) => fetchCollectionPhotos(entry.key)));
    const grouped = collections.flatMap((photos) => sample(photos, 3));
    return sortPhotos(grouped).slice(0, 15);
  }

  const selected = await fetchCollectionPhotos(state.category);
  return sortPhotos(sample(selected, 15));
}

function createCard(photo, index) {
  const article = document.createElement("button");
  article.type = "button";
  article.className = "gallery-card";
  article.style.setProperty("--ratio", "4 / 5");
  article.setAttribute("aria-label", `Open ${photo.categoryLabel} photo`);
  article.innerHTML = `
    <div class="gallery-card__image-wrap">
      <img data-src="${photo.thumb || photo.image}" alt="${photo.categoryLabel} photo" loading="lazy" />
      <div class="gallery-card__meta">
        <span class="gallery-card__tag">${photo.categoryLabel}</span>
      </div>
    </div>
  `;
  article.addEventListener("click", () => openViewer(index));
  return article;
}

async function renderGallery() {
  galleryStatus.textContent = "Loading collection...";

  try {
    state.filteredPhotos = await getFilteredPhotos();
  } catch (error) {
    galleryGrid.innerHTML =
      '<div class="gallery-empty">Unsplash collection loading needs a valid access key in <code>unsplash-config.js</code>.</div>';
    galleryStatus.textContent = "Unsplash access required";
    return;
  }

  galleryStatus.textContent = `${state.filteredPhotos.length} photographs / ${getCategoryLabel(state.category)}`;

  if (!state.filteredPhotos.length) {
    galleryGrid.innerHTML = '<div class="gallery-empty">No photos were returned from this Unsplash collection.</div>';
    return;
  }

  const cards = state.filteredPhotos.map((photo, index) => createCard(photo, index));
  galleryGrid.replaceChildren(...cards);
  setupLazyImages();
  setupRevealAnimations();
}

function trackUnsplashDownload(photo) {
  if (!photo.downloadLocation || !UNSPLASH_ACCESS_KEY) return;

  const endpoint = new URL(photo.downloadLocation);
  endpoint.searchParams.set("client_id", UNSPLASH_ACCESS_KEY);
  fetch(endpoint.toString(), { headers: { "Accept-Version": "v1" } }).catch(() => {});
}

function openViewer(index) {
  state.currentIndex = index;
  updateViewer();
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  resetViewerIdle();
}

function closeLightbox() {
  viewer.classList.remove("is-open");
  viewer.classList.remove("is-idle");
  viewer.setAttribute("aria-hidden", "true");
  if (!presetModal.classList.contains("is-open")) {
    document.body.style.overflow = "";
  }
}

function openPresetModal(presetId) {
  const preset = presets[presetId];
  if (!preset) return;

  presetTitle.textContent = preset.title;
  presetDescription.textContent = preset.description;
  presetSpecs.replaceChildren(
    ...Object.entries(preset.specs).map(([label, value]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      return row;
    }),
  );

  presetModal.classList.add("is-open");
  presetModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePresetDetails() {
  presetModal.classList.remove("is-open");
  presetModal.setAttribute("aria-hidden", "true");
  if (!viewer.classList.contains("is-open")) {
    document.body.style.overflow = "";
  }
}

function updateViewer() {
  const photo = state.filteredPhotos[state.currentIndex];
  if (!photo) return;

  viewerImage.src = photo.image;
  viewerImage.alt = `${photo.categoryLabel} photo`;
  viewerTitle.textContent = "";
  viewerMeta.textContent = `${photo.categoryLabel} / ${photo.photographer}`;
  viewerCount.textContent = `${state.currentIndex + 1} / ${state.filteredPhotos.length}`;
  trackUnsplashDownload(photo);
}

function stepViewer(direction) {
  if (!state.filteredPhotos.length) return;

  state.currentIndex =
    (state.currentIndex + direction + state.filteredPhotos.length) % state.filteredPhotos.length;
  updateViewer();
  resetViewerIdle();
}

function setupLazyImages() {
  const images = document.querySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        img.removeAttribute("data-src");
        observer.unobserve(img);
      });
    },
    { rootMargin: "240px 0px" },
  );

  images.forEach((img) => imageObserver.observe(img));
}

function setupRevealAnimations() {
  const revealables = document.querySelectorAll(".gallery-card, .reveal");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" },
  );

  revealables.forEach((item) => revealObserver.observe(item));
}

function applyStoredTheme() {
  const stored = localStorage.getItem("gllry-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  if (theme === "dark") {
    document.body.dataset.theme = "dark";
  }
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  if (nextTheme === "light") {
    delete document.body.dataset.theme;
  } else {
    document.body.dataset.theme = "dark";
  }
  localStorage.setItem("gllry-theme", nextTheme);
}

function togglePanel(forceState) {
  const isOpen = typeof forceState === "boolean" ? forceState : !sidePanel.classList.contains("is-open");
  sidePanel.classList.toggle("is-open", isOpen);
  menuButton.classList.toggle("is-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  sidePanel.setAttribute("aria-hidden", String(!isOpen));
}

function resetViewerIdle() {
  viewer.classList.remove("is-idle");
  window.clearTimeout(state.viewerIdleTimer);
  state.viewerIdleTimer = window.setTimeout(() => {
    if (viewer.classList.contains("is-open")) {
      viewer.classList.add("is-idle");
    }
  }, 2200);
}

sortSelect.addEventListener("change", () => {
  void renderGallery();
});

themeToggle.addEventListener("click", toggleTheme);
menuButton.addEventListener("click", () => togglePanel());
closeViewer.addEventListener("click", closeLightbox);
prevPhoto.addEventListener("click", () => stepViewer(-1));
nextPhoto.addEventListener("click", () => stepViewer(1));
closePresetModal.addEventListener("click", closePresetDetails);

presetCards.forEach((card) => {
  card.addEventListener("click", () => openPresetModal(card.dataset.preset));
});

viewer.addEventListener("mousemove", resetViewerIdle);
viewer.addEventListener("touchstart", resetViewerIdle, { passive: true });
viewer.addEventListener("click", (event) => {
  if (event.target.classList.contains("viewer__backdrop")) {
    closeLightbox();
    return;
  }
  resetViewerIdle();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    closePresetDetails();
    togglePanel(false);
  }
  if (!viewer.classList.contains("is-open")) return;
  if (event.key === "ArrowRight") stepViewer(1);
  if (event.key === "ArrowLeft") stepViewer(-1);
});

presetModal.addEventListener("click", (event) => {
  if (event.target.classList.contains("preset-modal__backdrop")) {
    closePresetDetails();
  }
});

document.querySelectorAll('.panel-nav a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => togglePanel(false));
});

if (aboutPhoto && aboutPhotoFrame) {
  aboutPhoto.addEventListener("error", () => {
    aboutPhotoFrame.classList.add("is-empty");
  });
}

applyStoredTheme();
renderFilterGroups();
void renderGallery();