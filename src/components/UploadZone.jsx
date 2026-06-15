// components/UploadZone.jsx
export default function UploadZone({ onFileChange }) {
  return (
    <label className="upload-zone" htmlFor="photo-input" id="upload-zone">
      <input
        type="file"
        id="photo-input"
        accept="image/*"
        onChange={onFileChange}
      />
      <div className="upload-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <p className="upload-title">Tap to capture or choose photo</p>
      <p className="upload-sub">JPG, PNG, HEIC supported</p>
    </label>
  );
}
