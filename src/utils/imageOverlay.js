// utils/imageOverlay.js

function getSatelliteTileUrl(lat, lng, zoom = 15) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(n * ((lng + 180) / 360));
  const yTile = Math.floor(n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2);
  return `https://mt1.google.com/vt/lyrs=y&x=${xTile}&y=${yTile}&z=${zoom}`;
}

function loadMapTile(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // Return null on failure, don't break the whole process
    img.src = url;
  });
}

// Helper to draw a red map pin
function drawPin(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size/2, -size, -size, -size*1.5, 0, -size*2);
  ctx.bezierCurveTo(size, -size*1.5, size/2, -size, 0, 0);
  ctx.fillStyle = '#ea4335';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -size*1.6, size*0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
}

// Helper to draw GPS Map Camera Icon
function drawCameraIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  // Background (dark blue map fold)
  ctx.fillStyle = '#0288d1';
  ctx.beginPath();
  ctx.roundRect(-size/2, -size/2, size, size, size * 0.2);
  ctx.fill();
  
  // Fold lines
  ctx.strokeStyle = '#01579b';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.moveTo(-size*0.15, -size/2);
  ctx.lineTo(-size*0.15, size/2);
  ctx.moveTo(size*0.15, -size/2);
  ctx.lineTo(size*0.15, size/2);
  ctx.stroke();

  // Camera lens (yellow outer)
  ctx.fillStyle = '#ffc107';
  ctx.beginPath();
  ctx.arc(0, 0, size*0.35, 0, Math.PI * 2);
  ctx.fill();

  // Camera lens (dark inner)
  ctx.fillStyle = '#37474f';
  ctx.beginPath();
  ctx.arc(0, 0, size*0.2, 0, Math.PI * 2);
  ctx.fill();

  // Mini red pin
  ctx.fillStyle = '#ea4335';
  ctx.beginPath();
  ctx.arc(0, -size*0.1, size*0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size*0.08, -size*0.1);
  ctx.lineTo(size*0.08, -size*0.1);
  ctx.lineTo(0, size*0.1);
  ctx.fill();

  ctx.restore();
}

// Format Timezone (e.g. GMT +05:30)
function getTimezoneString(date) {
  const offsetMinutes = date.getTimezoneOffset();
  const absOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffset / 60);
  const mins = absOffset % 60;
  const sign = offsetMinutes > 0 ? '-' : '+';
  return `GMT ${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export async function drawOverlayOnImage(base64Image, lat, lng, datetime, addressObj) {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // We need scaling based on image size to look good
      const scale = Math.max(1, img.width / 1200);
      
      const padding = 20 * scale;
      const borderRadius = 10 * scale;
      const mapSize = 150 * scale;
      const overlayWidth = Math.min(img.width * 0.9, 800 * scale);
      
      // Responsive text sizing
      const titleFontSize = 26 * scale;
      const baseFontSize = 18 * scale;
      const lineHeight = baseFontSize * 1.5;
      
      // Parse address object
      let mainTitle = 'Unknown Location';
      let subAddress = 'Coordinates only';
      
      if (addressObj) {
        const details = addressObj.address || {};
        const cityOrTown = details.city || details.town || details.village || details.county || '';
        const state = details.state || '';
        const country = details.country || '';
        
        // Construct "City, State, Country"
        const parts = [cityOrTown, state, country].filter(Boolean);
        if (parts.length > 0) {
          mainTitle = parts.join(', ');
        }
        
        // Full sub-address string
        subAddress = addressObj.display_name || '';
      }

      // Load map tile
      let mapTileImg = null;
      if (lat !== null && lng !== null) {
        mapTileImg = await loadMapTile(getSatelliteTileUrl(lat, lng, 15));
      }

      // Calculate heights
      const overlayHeight = (titleFontSize * 1.5) + (lineHeight * 3.5) + (padding * 2);

      // Positions
      const startX = padding * 2;
      const startY = img.height - overlayHeight - (padding * 2);

      // Draw dark semi-transparent rectangle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      // Start a bit to the right to leave room for the map overlapping it
      ctx.roundRect(startX + (mapSize * 0.4), startY, overlayWidth - (mapSize * 0.4), overlayHeight, borderRadius);
      ctx.fill();

      // Draw Map Thumbnail
      if (mapTileImg) {
        ctx.save();
        ctx.beginPath();
        // Rounded corners for map
        ctx.roundRect(startX, startY + (overlayHeight - mapSize)/2, mapSize, mapSize, borderRadius);
        ctx.clip();
        // Draw the tile. It's 256x256, we scale it to mapSize
        ctx.drawImage(mapTileImg, startX, startY + (overlayHeight - mapSize)/2, mapSize, mapSize);
        ctx.restore();
        // Draw Pin in center of map thumbnail
        drawPin(ctx, startX + mapSize/2, startY + (overlayHeight - mapSize)/2 + mapSize/2, 12 * scale);
      }

      // Text position setup
      const textX = startX + mapSize + (padding * 1.2);
      let currentY = startY + padding * 1.2;

      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Draw GPS Map Camera Icon & Text in top right
      const iconText = "GPS Map Camera";
      ctx.font = `${14 * scale}px sans-serif`;
      const iconTextWidth = ctx.measureText(iconText).width;
      const topRightX = startX + overlayWidth - iconTextWidth - padding;
      ctx.fillText(iconText, topRightX, startY + padding);
      drawCameraIcon(ctx, topRightX - (16 * scale), startY + padding + (7 * scale), 20 * scale);

      // Draw main address (bold)
      ctx.font = `500 ${titleFontSize}px sans-serif`;
      ctx.fillText(mainTitle, textX, currentY);
      currentY += titleFontSize * 1.3;

      // Draw full address
      ctx.font = `${baseFontSize}px sans-serif`;
      // Handle long address wrapping simply by slicing (not perfect, but okay for now)
      const maxChars = Math.floor(65);
      const shortSub = subAddress.length > maxChars ? subAddress.substring(0, maxChars) + '...' : subAddress;
      ctx.fillText(shortSub, textX, currentY);
      currentY += lineHeight;

      // Draw Lat/Lng
      const latLngStr = `Lat ${lat?.toFixed(6)}° Long ${lng?.toFixed(6)}°`;
      ctx.fillText(latLngStr, textX, currentY);
      currentY += lineHeight;

      // Draw Datetime
      const dateObj = datetime ? new Date(datetime) : new Date();
      
      // Formatting like "Saturday, 13/06/2026 10:19 AM GMT +05:30"
      const weekday = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const tzStr = getTimezoneString(dateObj);
      
      const dateStr = `${weekday}, ${day}/${month}/${year} ${timeStr} ${tzStr}`;
      
      ctx.fillText(dateStr, textX, currentY);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}
