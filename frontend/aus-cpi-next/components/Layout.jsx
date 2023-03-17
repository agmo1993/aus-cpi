/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from 'theme-ui';
import { useState } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import TimelineIcon from '@mui/icons-material/Timeline';
import Tooltip from '@mui/material/Tooltip';
import TextsmsIcon from '@mui/icons-material/Textsms';
import TopicIcon from '@mui/icons-material/Topic';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import packageJson from 'package.json';

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
    <div sx={{ minHeight : '100vh'}}>
        <div
        sx={{
            minHeight: '99vh',
        }}
        >
        <Box sx={styles.navBar}>
        <nav aria-label="main mailbox folders">
            <List>
            <ListItem disablePadding>
                <ListItemButton>
                <ListItemIcon>
                    <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
                </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
                <ListItemButton>
                <ListItemIcon>
                    <DraftsIcon />
                </ListItemIcon>
                <ListItemText primary="Category" />
                </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
                <ListItemButton>
                <ListItemIcon>
                    <DraftsIcon />
                </ListItemIcon>
                <ListItemText primary="City" />
                </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
                <ListItemButton>
                <ListItemIcon>
                    <DraftsIcon />
                </ListItemIcon>
                <ListItemText primary="Drafts" />
                </ListItemButton>
            </ListItem>
            </List>
        </nav>
        <div sx={styles.navBarItemBottom}>
            v {packageJson.version}
        </div>
        </Box>
        <div
            sx={styles.mainBar}
        >
            {children}
        </div>
        </div>
        <nav sx={styles.navBarBottom}>
            <div sx={styles.navBarTab}>
                <HomeIcon
                    fontSize="large"
                    style={{ margin : '22.5%', color : 'black' }}
                />
            </div>
            <div sx={styles.navBarTab}>
                <TimelineIcon
                    fontSize="large"
                    style={{ margin : '22.5%', color : 'black' }}
                />
            </div>
            <div sx={styles.navBarTab}>
                <TextsmsIcon
                    fontSize="large"
                    style={{ margin : '22.5%', color : 'black'  }}
                />
            </div>
            <div sx={styles.navBarTab}>
                <TopicIcon
                    fontSize="large"
                    style={{ margin : '22.5%', color : 'black'  }}
                />
            </div>
            <div sx={styles.navBarTab}>
                <FindInPageIcon
                    fontSize="large"
                    style={{ margin : '22.5%', color : 'black'  }}
                />
            </div>
        </nav>
    </div>
  );
}

const styles = {
    navBar : {
        width : '200px',
        display: ['none', 'none', 'none', 'block', 'block'],
        position: 'fixed',
        left : 0,
        backgroundColor: 'white',
        height: '100vh',
        top: 0,
        zIndex : 3
    },
    navBarBottom : {
        position : 'fixed',
        bottom : 0,
        width : '100%',
        display: ['flex', 'flex', 'flex', 'none', 'none'],
        backgroundColor: 'white'
    },
    navBarItem : {
        height : '70px',
        width : ['20vw', '20vw', '20vw', '70px', '70px'],
    },
    navBarTab : {
        height : '70px',
        width : ['20vw', '20vw', '20vw', '70px', '70px'],
        display: 'flex',
        justifyContent : 'center',
        alignItems : 'center'
    },
    navBarItemBottom : {
        height : '30px',
        width : '200px',
        position : ['fixed', 'fixed', 'fixed', 'fixed', 'fixed'],
        bottom : 0,
        right : [0, 0, 0, null, null],
        left : [null, null, null, 0, 0],
        textAlign: 'center',
        backgroundColor: 'secondary'
    },
    dboardLogo : {
        height : '70px',
        width : '70px',
        backgroundColor: 'primary'
    },
    mainBar : {
        width: ['96%', '96%', '96%', "calc( 100% - 200px)", "calc( 100% - 200px)"],
        marginLeft: ['0px', '0px', '0px', '200px', '200px'],
        height : [null, null, null, "80vh",  "80vh"],
        paddingBottom : [ '15%', '15%',  null, null, null],
    }
}
