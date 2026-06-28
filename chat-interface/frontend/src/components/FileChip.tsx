import { downloadProjectFileUrl } from '../api/projectFiles';
import styles from './FileChip.module.css';

export interface FileChipProps {
  fileId: number;
  filename: string;
  variant?: 'bubble' | 'user';
}

export function FileChip({ fileId, filename, variant = 'bubble' }: FileChipProps) {
  const url = downloadProjectFileUrl(fileId);
  const className = `${styles.chip} ${variant === 'user' ? styles['chip--user'] : ''}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-testid="file-chip"
      data-file-id={fileId}
      onClick={(event) => {
        // Use a fetch+blob to ensure credentials travel; open in a new tab.
        event.preventDefault();
        void fetch(url, { credentials: 'include' })
          .then(async (res) => {
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(body.error ?? `Request failed with status ${res.status}`);
            }
            return res.blob();
          })
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          })
          .catch(() => {
            // ignore: the anchor is still usable for direct download via the
            // browser's download manager (which will include the auth cookie).
          });
      }}
    >
      <span className={styles.label} title={filename}>
        {filename}
      </span>
    </a>
  );
}

export default FileChip;
