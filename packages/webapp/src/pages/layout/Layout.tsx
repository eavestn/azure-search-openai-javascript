import { Outlet, NavLink } from 'react-router-dom';

import github from '../../assets/github.svg';

import styles from './Layout.module.css';

const Layout = () => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <nav>
            <ul className={styles.headerNavList}>
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}
                >
                  Chat
                </NavLink>
              </li>
              <li className={styles.headerNavLeftMargin}>
                <a
                  href="https://aka.ms/azureopenai/javascript"
                  target={'_blank'}
                  title="Github repository link"
                  rel="noreferrer"
                >
                  <img
                    src={github}
                    alt="Github logo"
                    aria-label="Azure OpenAI JavaScript Github repository link"
                    width="20px"
                    height="20px"
                    className={styles.githubLogo}
                  />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  );
};

export default Layout;
