import styles from "./Header.module.css";

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function Header({
  title = "Generic Store",
  subtitle = "Inventory System",
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>
    </header>
  );
}