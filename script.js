const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const thumbList = document.getElementById('thumbList');
const layoutSelect = document.getElementById('layoutSelect');
const backgroundInput = document.getElementById('backgroundInput');
const gapRange = document.getElementById('gapRange');
const gapValue = document.getElementById('gapValue');
const widthInput = document.getElementById('widthInput');
const canvas = document.getElementById('collageCanvas');
const emptyState = document.getElementById('emptyState');
const downloadButton = document.getElementById('downloadButton');
const shuffleButton = document.getElementById('shuffleButton');
const clearButton = document.getElementById('clearButton');

const ctx = canvas.getContext('2d');

const state = {
  images: [],
};

fileInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }
  handleFiles(files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.add('is-dragover');
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove('is-dragover');
  });
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  dropArea.classList.remove('is-dragover');
  const files = Array.from(event.dataTransfer?.files || []);
  if (!files.length) {
    return;
  }
  handleFiles(files);
});

// Cho phép kích hoạt bằng bàn phím
['keydown', 'keyup'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.type === 'keyup') {
        fileInput.click();
      }
    }
  });
});

layoutSelect.addEventListener('change', renderCollage);
backgroundInput.addEventListener('input', renderCollage);
widthInput.addEventListener('change', () => {
  clampWidthInput();
  renderCollage();
});

gapRange.addEventListener('input', () => {
  gapValue.textContent = gapRange.value;
  renderCollage();
});

shuffleButton.addEventListener('click', () => {
  if (state.images.length < 2) return;
  state.images = shuffleArray(state.images);
  renderThumbnails();
  renderCollage();
});

clearButton.addEventListener('click', () => {
  if (!state.images.length) return;
  if (!confirm('Bạn có chắc muốn xóa toàn bộ ảnh đã chọn?')) {
    return;
  }
  state.images = [];
  renderThumbnails();
  renderCollage();
});

downloadButton.addEventListener('click', () => {
  if (!state.images.length) return;
  const link = document.createElement('a');
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const filename = `collage-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}.png`;
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
});

thumbList.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const thumbnail = event.target.closest('.thumbnail');
  if (!thumbnail) return;
  const id = thumbnail.dataset.id;
  const index = state.images.findIndex((item) => item.id === id);
  if (index === -1) return;

  const action = button.dataset.action;
  switch (action) {
    case 'remove':
      state.images.splice(index, 1);
      renderThumbnails();
      renderCollage();
      break;
    case 'move-up':
      if (index === 0) return;
      swap(state.images, index, index - 1);
      renderThumbnails();
      renderCollage();
      break;
    case 'move-down':
      if (index === state.images.length - 1) return;
      swap(state.images, index, index + 1);
      renderThumbnails();
      renderCollage();
      break;
    default:
      break;
  }
});

let draggedId = null;

thumbList.addEventListener('dragstart', (event) => {
  const thumbnail = event.target.closest('.thumbnail');
  if (!thumbnail) return;
  const pathNodes = getEventPath(event);
  const isHandle = pathNodes.some(
    (node) => node instanceof HTMLElement && node.classList?.contains('drag-handle')
  );
  if (!isHandle) {
    event.preventDefault();
    return;
  }
  draggedId = thumbnail.dataset.id;
  thumbnail.classList.add('dragging');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
    event.dataTransfer.setDragImage(thumbnail, thumbnail.offsetWidth / 2, thumbnail.offsetHeight / 2);
  }
});

thumbList.addEventListener('dragover', (event) => {
  const draggingEl = thumbList.querySelector('.thumbnail.dragging');
  if (!draggingEl) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  const thumbnail = event.target.closest('.thumbnail');
  if (!thumbnail || thumbnail === draggingEl) return;
  const rect = thumbnail.getBoundingClientRect();
  const isBefore = event.clientY - rect.top < rect.height / 2;
  if (isBefore) {
    thumbList.insertBefore(draggingEl, thumbnail);
  } else {
    thumbList.insertBefore(draggingEl, thumbnail.nextSibling);
  }
});

thumbList.addEventListener('drop', (event) => {
  event.preventDefault();
});

thumbList.addEventListener('dragend', () => {
  const orderedIds = Array.from(thumbList.querySelectorAll('.thumbnail')).map(
    (element) => element.dataset.id
  );
  state.images.sort(
    (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
  );
  thumbList.querySelectorAll('.thumbnail').forEach((element) =>
    element.classList.remove('dragging')
  );
  draggedId = null;
  renderCollage();
});

async function handleFiles(files) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    alert('Không tìm thấy tệp ảnh hợp lệ.');
    return;
  }

  dropArea.classList.add('is-loading');

  try {
    const loadedImages = await Promise.all(imageFiles.map(loadImage));
    state.images = state.images.concat(loadedImages);
    renderThumbnails();
    renderCollage();
  } catch (error) {
    console.error(error);
    alert('Đã xảy ra lỗi khi tải ảnh. Vui lòng thử lại.');
  } finally {
    dropArea.classList.remove('is-loading');
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          dataUrl: reader.result,
          element: img,
        });
      };
      img.onerror = () => reject(new Error('Không thể tải ảnh.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Không đọc được tệp.'));
    reader.readAsDataURL(file);
  });
}

function renderThumbnails() {
  thumbList.innerHTML = '';
  if (!state.images.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Chưa có ảnh nào được chọn.';
    thumbList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.images.forEach((item, index) => {
    const thumbnail = document.createElement('article');
    thumbnail.className = 'thumbnail';
    thumbnail.dataset.id = item.id;
    thumbnail.draggable = true;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'drag-handle';
    handle.dataset.action = 'drag-handle';
    handle.title = 'Kéo để sắp xếp lại';
    handle.setAttribute('aria-label', 'Kéo để sắp xếp lại');
    handle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M9 6h6v2H9zm0 5h6v2H9zm0 5h6v2H9z" />
      </svg>
    `;

    const preview = document.createElement('img');
    preview.src = item.dataUrl;
    preview.alt = `Ảnh ${index + 1}`;
    preview.width = 64;
    preview.height = 64;
    preview.className = 'thumbnail__preview';

    const info = document.createElement('div');
    info.className = 'thumbnail__info';
    const name = document.createElement('span');
    name.className = 'thumbnail__name';
    name.textContent = item.name || `Ảnh ${index + 1}`;
    const meta = document.createElement('span');
    meta.className = 'thumbnail__meta';
    meta.textContent = `${item.width}×${item.height}px · ${formatBytes(item.size)}`;
    info.append(name, meta);

    const actions = document.createElement('div');
    actions.className = 'thumbnail__actions';

    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.innerHTML = '↑';
    upButton.dataset.action = 'move-up';
    upButton.title = 'Di chuyển lên trên';

    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.innerHTML = '↓';
    downButton.dataset.action = 'move-down';
    downButton.title = 'Di chuyển xuống dưới';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.innerHTML = '✕';
    removeButton.dataset.action = 'remove';
    removeButton.title = 'Xóa ảnh';

    actions.append(upButton, downButton, removeButton);

    thumbnail.append(handle, preview, info, actions);
    fragment.append(thumbnail);
  });

  thumbList.append(fragment);
}

function renderCollage() {
  if (!state.images.length) {
    canvas.hidden = true;
    emptyState.hidden = false;
    downloadButton.disabled = true;
    return;
  }

  emptyState.hidden = true;
  canvas.hidden = false;
  downloadButton.disabled = false;

  const width = clampWidthInput();
  const gap = Number(gapRange.value) || 0;
  const layout = layoutSelect.value;
  const background = backgroundInput.value || '#ffffff';

  const { cols, rows } = computeGrid(state.images.length, layout);
  const safeCols = Math.max(cols, 1);
  const safeRows = Math.max(rows, 1);

  const cellWidth = Math.max(
    1,
    Math.floor((width - gap * (safeCols + 1)) / safeCols)
  );
  const cellHeight = cellWidth;
  const height = safeRows * cellHeight + gap * (safeRows + 1);

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  state.images.forEach((item, index) => {
    const row = Math.floor(index / safeCols);
    const col = index % safeCols;
    const x = gap + col * (cellWidth + gap);
    const y = gap + row * (cellHeight + gap);

    const image = item.element;
    const ratio = Math.min(cellWidth / image.naturalWidth, cellHeight / image.naturalHeight);
    const drawWidth = image.naturalWidth * ratio;
    const drawHeight = image.naturalHeight * ratio;
    const offsetX = x + (cellWidth - drawWidth) / 2;
    const offsetY = y + (cellHeight - drawHeight) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 25, 40, 0.18)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = background;
    ctx.fillRect(x, y, cellWidth, cellHeight);
    ctx.restore();

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  });
}

function computeGrid(total, layout) {
  if (layout === 'horizontal') {
    return { cols: Math.max(total, 1), rows: 1 };
  }
  if (layout === 'vertical') {
    return { cols: 1, rows: Math.max(total, 1) };
  }

  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  if (layout === 'grid') {
    return { cols, rows };
  }

  // Tự động: ưu tiên nhiều cột khi ảnh nhiều
  if (total <= 3) {
    return { cols: total, rows: 1 };
  }
  if (total <= 6) {
    return { cols: 3, rows: Math.ceil(total / 3) };
  }
  const autoCols = Math.min(Math.max(Math.round(Math.sqrt(total) + 0.5), 3), 6);
  const autoRows = Math.ceil(total / autoCols);
  return { cols: autoCols, rows: autoRows };
}

function clampWidthInput() {
  let value = parseInt(widthInput.value, 10);
  if (Number.isNaN(value)) {
    value = 1400;
  }
  value = Math.min(Math.max(value, 600), 2400);
  widthInput.value = value;
  return value;
}

function swap(arr, indexA, indexB) {
  [arr[indexA], arr[indexB]] = [arr[indexB], arr[indexA]];
}

function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function getEventPath(event) {
  if (typeof event.composedPath === 'function') {
    return event.composedPath();
  }
  const path = [];
  let node = event.target instanceof Node ? event.target : null;
  while (node) {
    path.push(node);
    node = node.parentElement;
  }
  return path;
}

// Hiển thị giá trị mặc định ngay từ đầu
gapValue.textContent = gapRange.value;
renderThumbnails();
renderCollage();
