import { UploadedDocumentFile } from '@/types/personnel';

/**
 * Converts a base64 Data URL (e.g. data:application/pdf;base64,...) to a Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Safely creates a Blob URL for a document file to avoid about:blank#blocked
 */
export function getDocumentBlobUrl(file: UploadedDocumentFile): string | null {
  if (!file?.file_data) return null;
  if (
    file.file_data.startsWith('http://') ||
    file.file_data.startsWith('https://') ||
    file.file_data.startsWith('blob:')
  ) {
    return file.file_data;
  }
  try {
    const blob = dataURLtoBlob(file.file_data);
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to create blob from data URL:', err);
    return null;
  }
}

/**
 * Opens a document file in a new browser tab without getting blocked by Chromium's about:blank#blocked
 */
export function openDocumentInNewTab(file: UploadedDocumentFile): void {
  if (!file?.file_data) {
    alert('No document data available to preview.');
    return;
  }

  // If already standard HTTP / HTTPS URL
  if (
    file.file_data.startsWith('http://') ||
    file.file_data.startsWith('https://')
  ) {
    window.open(file.file_data, '_blank');
    return;
  }

  try {
    const blob = dataURLtoBlob(file.file_data);
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      // In case browser popup blocker prevented opening, fallback to downloading
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.file_name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Error opening document in new tab:', err);
    alert('Could not render document in a new tab. Please try downloading it instead.');
  }
}

/**
 * Triggers a direct download for a document file
 */
export function downloadDocument(file: UploadedDocumentFile): void {
  if (!file?.file_data) return;
  try {
    const blobUrl = getDocumentBlobUrl(file);
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.file_name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
  }
}
