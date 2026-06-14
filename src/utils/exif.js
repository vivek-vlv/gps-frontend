// utils/exif.js – EXIF helper utilities (ported from script.js)

/** DMS rational → decimal degrees */
export function dmsToDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 3) return 0;
  const deg = dms[0][0] / dms[0][1];
  const min = dms[1][0] / dms[1][1];
  const sec = dms[2][0] / dms[2][1];
  let dec = deg + min / 60 + sec / 3600;
  if (ref === 'S' || ref === 'W') dec = -dec;
  return dec;
}

/** Decimal degrees → DMS rational array for piexif */
export function decimalToDms(dec) {
  const abs = Math.abs(dec);
  const d   = Math.floor(abs);
  const mf  = (abs - d) * 60;
  const m   = Math.floor(mf);
  const s   = (mf - m) * 60;
  return [[d, 1], [m, 1], [Math.round(s * 10000), 10000]];
}

/** Pad number to 2 digits */
export const pad = (n) => String(n).padStart(2, '0');

/** JS Date → YYYY-MM-DDTHH:MM (datetime-local format) */
export function toLocalISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse EXIF DateTimeOriginal "YYYY:MM:DD HH:MM:SS" → datetime-local string */
export function parseExifDateStr(str) {
  if (!str) return null;
  const m = str.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}

/** Convert any image file → JPEG data URL (max 2048px on longest side) */
export function convertToJpeg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 2048;
        let w = img.naturalWidth,
          h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round((h * MAX) / w); w = MAX; }
          else        { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Read EXIF tags from a File using exif-js */
export function readExif(file) {
  return new Promise((resolve) => {
    window.EXIF.getData(file, function () {
      resolve(window.EXIF.getAllTags(this));
    });
  });
}
