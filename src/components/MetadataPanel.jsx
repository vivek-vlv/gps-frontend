// components/MetadataPanel.jsx
import MapView from './MapView';
import CoordChips from './CoordChips';

export default function MetadataPanel({
  status,
  datetime,
  lat,
  lng,
  onDatetimeChange,
  onLocationChange,
  onDownload,
  saving,
}) {
  const { type, msg } = status;

  return (
    <section className="metadata-panel" id="metadata-section">

      {/* Status bar */}
      <div className="status-bar">
        <div className={`status-dot ${type === 'warn' ? '' : type}`} id="gps-dot" />
        <span id="gps-status-text">{msg}</span>
      </div>

      {/* Date / Time */}
      <div className="field-group">
        <label className="field-label" htmlFor="datetime-input">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Date &amp; Time
        </label>
        <input
          type="datetime-local"
          id="datetime-input"
          value={datetime}
          onChange={(e) => onDatetimeChange(e.target.value)}
        />
      </div>

      {/* Map */}
      <div className="field-group">
        <label className="field-label">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Geotag Location{' '}
          <span className="map-hint">(drag pin or tap map to adjust)</span>
        </label>
        <MapView lat={lat} lng={lng} onLocationChange={onLocationChange} />
      </div>

      {/* Coordinate chips */}
      <CoordChips lat={lat} lng={lng} />

      {/* Download button */}
      <button className="dl-btn" id="download-btn" onClick={onDownload} disabled={saving}>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {saving ? 'Saving…' : 'Save Geotagged Photo'}
      </button>

    </section>
  );
}
