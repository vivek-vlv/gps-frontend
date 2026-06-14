// App.jsx – V GPS Camera (MERN edition)
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PhotoPreview from './components/PhotoPreview';
import MetadataPanel from './components/MetadataPanel';

import {
  dmsToDecimal,
  decimalToDms,
  toLocalISO,
  parseExifDateStr,
  convertToJpeg,
  readExif,
} from './utils/exif';
import { getLiveLocation } from './utils/geo';
import { drawOverlayOnImage } from './utils/imageOverlay';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [jpegBase64, setJpegBase64]   = useState(null);
  const [previewWithOverlay, setPreviewWithOverlay] = useState(null);
  const [lat, setLat]                 = useState(null);
  const [lng, setLng]                 = useState(null);
  const [datetime, setDatetime]       = useState('');
  const [addressObj, setAddressObj]   = useState(null);
  const [status, setStatus]           = useState({ type: 'warn', msg: 'Upload a photo to start' });
  const [showMeta, setShowMeta]       = useState(false);
  const [saving, setSaving]           = useState(false);

  const setGpsStatus = (type, msg) => setStatus({ type, msg });

  // Fetch address from coordinates
  useEffect(() => {
    if (lat !== null && lng !== null) {
      axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`)
        .then(res => {
          if (res.data) {
            setAddressObj(res.data);
          }
        })
        .catch(err => {
          console.warn('Failed to reverse geocode:', err);
          setAddressObj(null);
        });
    }
  }, [lat, lng]);

  // Generate Live Preview whenever relevant data changes
  useEffect(() => {
    let isMounted = true;
    if (jpegBase64 && lat !== null && lng !== null) {
      drawOverlayOnImage(jpegBase64, lat, lng, datetime, addressObj)
        .then(newImage => {
          if (isMounted) setPreviewWithOverlay(newImage);
        })
        .catch(err => console.error("Preview generation failed", err));
    } else if (jpegBase64) {
       setPreviewWithOverlay(jpegBase64); // Fallback to raw if coords missing
    }
    return () => { isMounted = false; };
  }, [jpegBase64, lat, lng, datetime, addressObj]);

  /* ── Photo selected ── */
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setGpsStatus('warn', 'Processing image…');
    setShowMeta(false);

    try {
      // 1. Read EXIF from original file
      const tags = await readExif(file);

      // 2. Date / Time
      const exifDateStr = tags.DateTimeOriginal || tags.DateTime || null;
      setDatetime(parseExifDateStr(exifDateStr) || toLocalISO(new Date()));

      // 3. Convert to JPEG
      const jpeg = await convertToJpeg(file);
      setJpegBase64(jpeg);

      // 4. GPS from EXIF?
      let newLat = null, newLng = null;
      if (tags.GPSLatitude && tags.GPSLatitudeRef && tags.GPSLongitude && tags.GPSLongitudeRef) {
        newLat = dmsToDecimal(tags.GPSLatitude, tags.GPSLatitudeRef);
        newLng = dmsToDecimal(tags.GPSLongitude, tags.GPSLongitudeRef);
        if (newLat === 0 && newLng === 0) { newLat = null; newLng = null; }
      }

      if (newLat !== null && newLng !== null) {
        setLat(newLat); setLng(newLng);
        setGpsStatus('success', 'GPS from photo EXIF');
      } else {
        // 5. No EXIF GPS → try live geolocation
        setGpsStatus('warn', 'No GPS in photo – getting your location…');
        const live = await getLiveLocation();
        if (live) {
          setLat(live.lat); setLng(live.lng);
          setGpsStatus('success', 'Using your current live location');
        } else {
          // Fallback: Nandurbar, Maharashtra
          setLat(21.367733); setLng(74.248365);
          setGpsStatus('warn', 'GPS unavailable – defaulting to Maharashtra');
        }
      }

      setShowMeta(true);
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Could not process this image. Please try a different file.\n\n' + err.message);
    }
  }, []);

  /* ── Location adjusted via map ── */
  const handleLocationChange = useCallback((newLat, newLng, reason) => {
    setLat(newLat);
    setLng(newLng);
    if (reason === 'adjusted') setGpsStatus('info', 'Location adjusted by you');
  }, []);

  /* ── Download: inject EXIF + save record to MongoDB ── */
  const handleDownload = useCallback(async () => {
    // If preview generation is still running or missing, wait or fallback
    const baseImage = previewWithOverlay || jpegBase64;
    if (!baseImage) { alert('Please select a photo first.'); return; }

    try {
      // 1. Inject EXIF into the preview image (which already has the overlay drawn)
      const piexif = window.piexif;
      const zeroth = {}, exif = {}, gps = {};

      // Datetime
      if (datetime) {
        const exifDate = datetime.replace(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
          '$1:$2:$3 $4:$5:00'
        );
        exif[piexif.ExifIFD.DateTimeOriginal]  = exifDate;
        exif[piexif.ExifIFD.DateTimeDigitized] = exifDate;
        zeroth[piexif.ImageIFD.DateTime]       = exifDate;
      }

      // GPS
      if (lat !== null && lng !== null) {
        gps[piexif.GPSIFD.GPSVersionID]    = [2, 3, 0, 0];
        gps[piexif.GPSIFD.GPSLatitudeRef]  = lat >= 0 ? 'N' : 'S';
        gps[piexif.GPSIFD.GPSLatitude]     = decimalToDms(lat);
        gps[piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
        gps[piexif.GPSIFD.GPSLongitude]    = decimalToDms(lng);
      }

      const exifObj   = { '0th': zeroth, Exif: exif, GPS: gps };
      const exifBytes = piexif.dump(exifObj);
      const newUrl    = piexif.insert(exifBytes, baseImage);

      // Trigger download
      const filename = `VGPS_${Date.now()}.jpg`;
      const a = document.createElement('a');
      a.href = newUrl;
      a.download = filename;
      a.click();

      // Save record to MongoDB via Express API
      setSaving(true);
      try {
        await axios.post(`${API_BASE}/api/photos`, { filename, lat, lng, datetime });
        setGpsStatus('success', '✅ Photo saved & record stored in DB');
      } catch (apiErr) {
        console.warn('API save failed (server may not be running):', apiErr.message);
        setGpsStatus('info', '📥 Photo downloaded (DB not connected)');
      } finally {
        setSaving(false);
      }
    } catch (err) {
      console.error('EXIF write error:', err);
      alert('Failed to write metadata: ' + err.message);
    }
  }, [jpegBase64, datetime, lat, lng, addressObj]);

  return (
    <>
      <div className="app-bg" />
      <div className="container">
        <Header />
        <UploadZone onFileChange={handleFileChange} />
        {previewWithOverlay && <PhotoPreview src={previewWithOverlay} />}
        {showMeta && (
          <MetadataPanel
            status={status}
            datetime={datetime}
            lat={lat}
            lng={lng}
            onDatetimeChange={setDatetime}
            onLocationChange={handleLocationChange}
            onDownload={handleDownload}
            saving={saving}
          />
        )}
      </div>
    </>
  );
}
