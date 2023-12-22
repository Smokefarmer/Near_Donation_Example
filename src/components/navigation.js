import Image from 'next/image';
import Link from 'next/link';
import NearLogo from '../../public/near-logo.svg';
import styles from '../app/app.module.css';
import { useAuth } from '../wallets/authContext';




export const Navigation = () => {
  const { user, login, logout} = useAuth();

  return (
    <nav className={styles.nav}>
      <div className={styles.buttonContainer}>
        <button onClick={user ? logout : login} >
          <Link href="/" passHref legacyBehavior>
            <Image className={styles.near} priority src={NearLogo} alt="NEAR" width="30" height="24" />
          </Link>
          {user ? `Logout (${user.email})`: 'Login'}
        </button>
      </div>
    </nav>
  );
};