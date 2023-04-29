/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "theme-ui";
import HomeIcon from "@mui/icons-material/Home";
import TimelineIcon from "@mui/icons-material/Timeline";
import Link from "next/link";
import TextsmsIcon from "@mui/icons-material/Textsms";
import TopicIcon from "@mui/icons-material/Topic";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import DraftsIcon from "@mui/icons-material/Drafts";
import packageJson from "package.json";
import Image from "next/image";
import CategoryIcon from "@mui/icons-material/Category";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import InfoIcon from "@mui/icons-material/Info";
import colors from "styles/colors";

/*
 * A component to layout of the application
 *
 * @component
 * @example
 * import Aggregate from './tabs/aggregate';
 *
 * const [token, setToken] = useState('');
 * const version = "0.1.0";
 *
 *
 * return (
 *   <DLayout version={version} setToken={setToken} >
 *      <Aggregated />
 *   </DLayout>
 * )
 */
export default function DLayout({ children, version }) {
  return (
    <div sx={{ minHeight: "100vh" }}>
      <div
        sx={{
          minHeight: "99vh",
        }}
      >
        <Box sx={styles.navBar}>
          <Image src="/images/logo.png" alt="AusCPI" width={180} height={180} />
          <nav aria-label="main mailbox folders">
            <List>
              <Link href="/">
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                  </ListItemButton>
                </ListItem>
              </Link>
              <Divider />
              <Link href="/category">
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Category" />
                  </ListItemButton>
                </ListItem>
              </Link>
              <Divider />
              <Link href="/city">
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <LocationCityIcon />
                    </ListItemIcon>
                    <ListItemText primary="City" />
                  </ListItemButton>
                </ListItem>
              </Link>
              <Divider />
              <Link href="/about">
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText primary="About" />
                  </ListItemButton>
                </ListItem>
              </Link>
            </List>
          </nav>
          <div sx={styles.navBarItemBottom}>v {packageJson.version}</div>
        </Box>
        <div sx={styles.mainBar}>{children}</div>
      </div>
      <nav sx={styles.navBarBottom}>
        <div sx={styles.navBarTab}>
          <Image src="/images/logo.png" alt="AusCPI" width={50} height={50} />
        </div>
        <div sx={styles.navBarTab}>
        <Link href="/">
          <HomeIcon
            fontSize="large"
            style={{ color: "grey" }}
          />
        </Link>
        </div>
        <div sx={styles.navBarTab}>
        <Link href="/category">
          <CategoryIcon
            fontSize="large"
            style={{ color: "grey" }}
          />
        </Link>
        </div>
        <div sx={styles.navBarTab}>
        <Link href="/city">
          <LocationCityIcon
            fontSize="large"
            style={{ color: "grey" }}
          />
        </Link>
        </div>
        <div sx={styles.navBarTab}>
        <Link href="/about">
          <InfoIcon
            fontSize="large"
            style={{ color: "grey" }}
          />
        </Link>
        </div>
      </nav>
    </div>
  );
}

const styles = {
  navBar: {
    width: "180px",
    display: ["none", "none", "none", "block", "block"],
    position: "fixed",
    left: 0,
    backgroundColor: "#f4f6f9",
    height: "100vh",
    top: 0,
    zIndex: 3,
  },
  navBarBottom: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    display: ["flex", "flex", "flex", "none", "none"],
    backgroundColor: "#f4f6f9",
  },
  navBarItem: {
    height: "70px",
    width: ["25vw", "25vw", "25vw", "70px", "70px"],
  },
  navBarTab: {
    height: "50px",
    width: ["20vw", "20vw", "20vw", "70px", "70px"],
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  navBarItemBottom: {
    height: "30px",
    width: "180px",
    position: ["fixed", "fixed", "fixed", "fixed", "fixed"],
    bottom: 0,
    right: [0, 0, 0, null, null],
    left: [null, null, null, 0, 0],
    textAlign: "center",
    backgroundColor: "secondary",
  },
  dboardLogo: {
    height: "70px",
    width: "70px",
    backgroundColor: "primary",
  },
  mainBar: {
    width: ["96%", "96%", "96%", "calc( 100% - 200px)", "calc( 100% - 200px)"],
    marginLeft: ["0px", "0px", "0px", "200px", "200px"],
    height: [null, null, null, "80vh", "80vh"],
    paddingBottom: ["15%", "15%", null, null, null],
  },
};
