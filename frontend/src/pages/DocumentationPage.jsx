import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';

export default function DocumentationPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                User Documentation
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* What is DynDNS */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                What is Free DynDNS?
              </Typography>
              <Typography variant="body1" paragraph>
                Free DynDNS is a Dynamic DNS service that allows you to associate a hostname with your changing IP address. 
                This is useful when you have a home server, IoT device, or any service that needs to be accessible via a 
                consistent domain name, even when your IP address changes.
              </Typography>
              <Typography variant="body1">
                Your DNS records are automatically synchronized with Azure DNS, making them accessible worldwide within minutes.
              </Typography>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Getting Started
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                1. Create a DNS Record
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Click 'Add DNS Record' button"
                    secondary="Enter your desired hostname (e.g., 'myserver' will become 'myserver.your-domain.com')"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Enter your IP address"
                    secondary="This is the IP address that the hostname will point to"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Click 'Add Record'"
                    secondary="Your record will be created with status 'added'"
                  />
                </ListItem>
              </List>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                2. Wait for Activation
              </Typography>
              <Typography variant="body2" paragraph>
                The system automatically syncs records with Azure DNS every 5 minutes. Your record will change 
                from "added" to "active" once it's live in the DNS zone.
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                3. Update When Needed
              </Typography>
              <Typography variant="body2">
                Click the edit icon next to any record to update its IP address or hostname. Updated records 
                will sync to Azure DNS within 5 minutes.
              </Typography>
            </CardContent>
          </Card>

          {/* Record Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Record Status Explained
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        Added (Gray)
                      </Typography>
                    }
                    secondary="New record waiting to be created in Azure DNS (syncs within 5 minutes)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        Active (Green)
                      </Typography>
                    }
                    secondary="Record is live in Azure DNS and accessible worldwide"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        Updated (Gray)
                      </Typography>
                    }
                    secondary="Record has been modified and is waiting to sync with Azure DNS"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        Refreshed (Green)
                      </Typography>
                    }
                    secondary="Record timestamp has been updated to prevent expiration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="bold" color="error.main">
                        Inactive (Red)
                      </Typography>
                    }
                    secondary="Record is marked for deletion and will be removed from Azure DNS"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* TTL and Expiration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Record Expiration (TTL)
              </Typography>
              <Typography variant="body1" paragraph>
                Records have a Time-To-Live (TTL) period. If a record is not updated within this period, 
                it will automatically be marked as "inactive" and removed from Azure DNS.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Default TTL:</strong> 1 hour (3600 seconds)
              </Typography>
              <Typography variant="body2">
                To keep your record active, update it regularly or implement an automated update script 
                that refreshes the record before the TTL expires.
              </Typography>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Automated Updates via API
              </Typography>
              <Typography variant="body1" paragraph>
                You can automate DNS updates using the REST API with your authentication token.
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Update Record Example (curl):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                curl -X PATCH https://your-api.com/api/dns/&#123;id&#125; \<br/>
                &nbsp;&nbsp;-H "Authorization: Bearer YOUR_TOKEN" \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '&#123;"ipAddress":"1.2.3.4"&#125;'
              </Paper>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Refresh Record Timestamp (Authorization Header):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                curl -X POST https://your-api.com/api/dns/refresh \<br/>
                &nbsp;&nbsp;-H "Authorization: Bearer YOUR_TOKEN" \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '&#123;"hostname":"myserver","ipAddress":"1.2.3.4"&#125;'
              </Paper>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Refresh Record Timestamp (Token in Body):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.9rem', mb: 2 }}>
                curl -X POST https://your-api.com/api/dns/refresh \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '&#123;"hostname":"myserver","ipAddress":"1.2.3.4","token":"YOUR_TOKEN"&#125;'
              </Paper>

              <Typography variant="body2" sx={{ mt: 2 }}>
                Replace <code>YOUR_TOKEN</code> with your authentication token from the dashboard. The Authorization header method is recommended for better security.
              </Typography>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Tips & Best Practices
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Keep your token secure"
                    secondary="Never share your authentication token publicly"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Set up automated updates"
                    secondary="Use a cron job or scheduled task to update your IP address regularly"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Hostnames are globally unique"
                    secondary="Choose a unique hostname that isn't already in use by another user"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="DNS propagation takes time"
                    secondary="After activation, it may take a few minutes for DNS changes to propagate worldwide"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Check your current IP"
                    secondary="Use services like ipify.org or ifconfig.me to find your public IP address"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
}
