// Capture a screenshot of the user's active screen or application window using browser displayMedia
export async function captureScreenRegion(): Promise<File> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' },
  });

  const track = stream.getVideoTracks()[0];
  const imageCapture = new (window as any).ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();
  track.stop();

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(bitmap, 0, 0);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to encode screenshot blob'));
      const file = new File([blob], `screen_capture_${Date.now()}.png`, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

// Capture a photo directly from webcam or camera
export async function captureCameraPhoto(): Promise<File> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });

  const track = stream.getVideoTracks()[0];
  const imageCapture = new (window as any).ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();
  track.stop();

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(bitmap, 0, 0);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to capture camera photo'));
      const file = new File([blob], `whiteboard_photo_${Date.now()}.png`, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

