// components/CoordChips.jsx
export default function CoordChips({ lat, lng }) {
  return (
    <div className="coord-row">
      <div className="coord-chip">
        <span className="coord-chip-label">LAT</span>
        <span className="coord-chip-value" id="lat-display">
          {lat !== null ? lat.toFixed(6) : '—'}
        </span>
      </div>
      <div className="coord-chip">
        <span className="coord-chip-label">LNG</span>
        <span className="coord-chip-value" id="lng-display">
          {lng !== null ? lng.toFixed(6) : '—'}
        </span>
      </div>
    </div>
  );
}
