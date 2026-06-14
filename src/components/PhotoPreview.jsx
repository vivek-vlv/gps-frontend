// components/PhotoPreview.jsx
export default function PhotoPreview({ src }) {
  if (!src) return null;
  return (
    <div className="preview-wrap" id="preview-wrap">
      <img id="preview-image" src={src} alt="Photo preview" />
      <label className="change-photo-btn" htmlFor="photo-input">
        Change Photo
      </label>
    </div>
  );
}
