import styles from './BackdropMesh.module.css';

export function BackdropMesh() {
  return (
    <div
      data-testid="backdrop-mesh"
      className={`${styles['backdrop-mesh']} anim-mesh-fade`}
      aria-hidden="true"
    >
      <div className={`${styles['backdrop-mesh__blob']} ${styles['backdrop-mesh__blob--a']}`} />
      <div className={`${styles['backdrop-mesh__blob']} ${styles['backdrop-mesh__blob--b']}`} />
    </div>
  );
}

export default BackdropMesh;
