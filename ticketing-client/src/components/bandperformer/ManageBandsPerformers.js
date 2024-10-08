// src/components/Admin/ManageBandsPerformers.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
  Paper,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { Add, Remove, Edit, Delete } from '@mui/icons-material';

const ManageBandsPerformers = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [bands, setBands] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [editData, setEditData] = useState(null); // Data being edited
  const [editType, setEditType] = useState(null); // 'band' or 'performer'
  const [editIndex, setEditIndex] = useState(null); // Index of the band or performer being edited
  const [loading, setLoading] = useState(false); // Loading state for event selection
  const [openDialog, setOpenDialog] = useState(false); // Dialog open state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Snackbar state

  // Error states for edit dialog
  const [editErrors, setEditErrors] = useState({
    name: '',
    email: '',
    phone: '',
    paymentAmount: '',
  });

  // Regex Patterns
  const namePattern = /^[A-Za-z0-9 ]*$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9()+\- ]*$/; // Allows numbers, parentheses, plus, minus, and spaces
  const paymentAmountPattern = /^\d+(\.\d{1,2})?$/;

  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/admin/organizer-events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setSnackbar({ open: true, message: 'Failed to fetch events.', severity: 'error' });
      }
    };

    fetchEvents();
  }, []);

  // Fetch bands and performers for the selected event
  const fetchBandsPerformers = async (eventId) => {
    try {
      setLoading(true); // Start loading
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/bands-performers/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBands(response.data.bands || []); // Ensure it defaults to an empty array if undefined
      setPerformers(response.data.performers || []); // Ensure it defaults to an empty array if undefined
    } catch (error) {
      console.error('Error fetching bands and performers:', error);
      setSnackbar({ open: true, message: 'Failed to fetch bands and performers.', severity: 'error' });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Handle event selection
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    setBands([]); // Clear old data
    setPerformers([]); // Clear old data
    if (eventId) {
      fetchBandsPerformers(eventId);
    }
  };

  // Handle delete of a band or performer
  const handleDelete = async (bandIndex, performerIndex = null) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this item?');
    if (!confirmDelete) return;

    let updatedBands = [...bands];
    let updatedPerformers = [...performers];

    if (performerIndex === null) {
      // Delete the entire band
      updatedBands.splice(bandIndex, 1);
    } else {
      // Delete only a performer
      updatedPerformers.splice(performerIndex, 1);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/bands-performers/${selectedEvent}`,
        { bands: updatedBands, performers: updatedPerformers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update state after successful deletion
      setBands(updatedBands);
      setPerformers(updatedPerformers);

      setSnackbar({ open: true, message: 'Item deleted successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error deleting item:', error);
      setSnackbar({ open: true, message: 'Failed to delete item.', severity: 'error' });
    }
  };

  // Handle editing of band/performer details (opens dialog)
  const handleEdit = (bandIndex, performerIndex = null) => {
    if (performerIndex !== null) {
      // Edit performer
      if (performers[performerIndex]) {
        setEditType('performer');
        setEditData({ ...performers[performerIndex] });
        setEditIndex({ performerIndex });
      } else {
        console.error('Performer not found or undefined');
        return;
      }
    } else {
      // Edit band
      if (bands[bandIndex]) {
        setEditType('band');
        setEditData({ ...bands[bandIndex] });
        setEditIndex({ bandIndex });
      } else {
        console.error('Band not found or undefined');
        return;
      }
    }
    setEditErrors({ name: '', email: '', phone: '', paymentAmount: '' }); // Reset errors
    setOpenDialog(true); // Open dialog for editing
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditData(null);
    setEditType(null);
    setEditIndex(null);
    setEditErrors({ name: '', email: '', phone: '', paymentAmount: '' });
  };

  // Handle save of the edited data
  const handleSave = async () => {
    // Validate before saving
    const { name, email, phone, paymentAmount } = editData;
    let valid = true;
    let errors = { name: '', email: '', phone: '', paymentAmount: '' };

    // Name Validation
    if (!name.trim()) {
      errors.name = `${editType === 'band' ? 'Band' : 'Performer'} name is required`;
      valid = false;
    } else if (!namePattern.test(name.trim())) {
      errors.name = 'Only letters and numbers are allowed';
      valid = false;
    }

    // Email Validation
    if (!email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!emailPattern.test(email.trim())) {
      errors.email = 'Invalid email format';
      valid = false;
    }

    // Phone Validation
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
      valid = false;
    } else if (!phonePattern.test(phone.trim())) {
      errors.phone = 'Invalid phone number format';
      valid = false;
    }

    // Payment Amount Validation
    if (!paymentAmount.toString().trim()) {
      errors.paymentAmount = 'Payment amount is required';
      valid = false;
    } else if (!paymentAmountPattern.test(paymentAmount.toString().trim())) {
      errors.paymentAmount = 'Invalid payment amount';
      valid = false;
    }

    setEditErrors(errors);

    if (!valid) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    let updatedBands = [...bands];
    let updatedPerformers = [...performers];

    if (editType === 'performer') {
      updatedPerformers[editIndex.performerIndex] = editData;
    } else {
      updatedBands[editIndex.bandIndex] = editData;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/bands-performers/${selectedEvent}`,
        { bands: updatedBands, performers: updatedPerformers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update state after successful edit
      if (editType === 'performer') {
        setPerformers(updatedPerformers);
      } else {
        setBands(updatedBands);
      }

      setSnackbar({ open: true, message: 'Item updated successfully!', severity: 'success' });
      handleDialogClose();
    } catch (error) {
      console.error('Error updating item:', error);
      setSnackbar({ open: true, message: 'Failed to update item.', severity: 'error' });
    }
  };

  // Handle input changes in the dialog with validations
  const handleInputChange = (field, value) => {
    // Update editData
    setEditData((prev) => ({ ...prev, [field]: value }));

    // Validate input
    let errorMsg = '';

    if (field === 'name') {
      if (!value.trim()) {
        errorMsg = `${editType === 'band' ? 'Band' : 'Performer'} name is required`;
      } else if (!namePattern.test(value.trim())) {
        errorMsg = 'Only letters and numbers are allowed';
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        errorMsg = 'Email is required';
      } else if (!emailPattern.test(value.trim())) {
        errorMsg = 'Invalid email format';
      }
    } else if (field === 'phone') {
      if (!value.trim()) {
        errorMsg = 'Phone number is required';
      } else if (!phonePattern.test(value.trim())) {
        errorMsg = 'Invalid phone number format';
      }
    } else if (field === 'paymentAmount') {
      if (!value.toString().trim()) {
        errorMsg = 'Payment amount is required';
      } else if (!paymentAmountPattern.test(value.toString().trim())) {
        errorMsg = 'Invalid payment amount';
      }
    }

    setEditErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Manage Bands and Performers
      </Typography>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Select Event */}
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="select-event-label">Select Event</InputLabel>
        <Select
          labelId="select-event-label"
          id="select-event"
          value={selectedEvent}
          label="Select Event"
          onChange={handleEventChange}
        >
          {events.map((event) => (
            <MenuItem key={event._id} value={event._id}>
              {event.eventName} - {new Date(event.eventDate).toLocaleDateString()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Loading indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Show Bands and Performers for the selected event */}
      {!loading && selectedEvent && (
        <>
          {bands.length === 0 && performers.length === 0 ? (
            <Typography variant="h6" align="center" color="textSecondary">
              No bands or performers found for this event.
            </Typography>
          ) : (
            <Grid container spacing={4}>
              {/* Bands Section */}
              {bands.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      Bands
                    </Typography>
                    {bands.map((band, bandIndex) => (
                      <Box
                        key={band._id || bandIndex}
                        sx={{
                          border: '1px solid #ddd',
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          position: 'relative',
                        }}
                      >
                        <Typography variant="h6">{band.name}</Typography>
                        <Typography>Email: {band.email}</Typography>
                        <Typography>Phone: {band.phone}</Typography>
                        <Typography>Payment Amount: ${band.paymentAmount}</Typography>
                        <Typography>Payment Status: {band.paymentStatus}</Typography>
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(bandIndex)}
                            aria-label="edit band"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(bandIndex)}
                            aria-label="delete band"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              )}

              {/* Performers Section */}
              {performers.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      Performers
                    </Typography>
                    {performers.map((performer, performerIndex) => (
                      <Box
                        key={performer._id || performerIndex}
                        sx={{
                          border: '1px solid #ddd',
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          position: 'relative',
                        }}
                      >
                        <Typography variant="h6">{performer.name}</Typography>
                        <Typography>Email: {performer.email}</Typography>
                        <Typography>Phone: {performer.phone}</Typography>
                        <Typography>Payment Amount: ${performer.paymentAmount}</Typography>
                        <Typography>Payment Status: {performer.paymentStatus}</Typography>
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(null, performerIndex)}
                            aria-label="edit performer"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(null, performerIndex)}
                            aria-label="delete performer"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit {editType === 'performer' ? 'Performer' : 'Band'} Details</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            {/* Name Field */}
            <TextField
              margin="normal"
              label="Name"
              fullWidth
              required
              value={editData?.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyPress={(e) => {
                if (!/[A-Za-z0-9 ]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData('text');
                if (!namePattern.test(pasteData)) {
                  e.preventDefault();
                }
              }}
              error={Boolean(editErrors.name)}
              helperText={editErrors.name}
            />

            {/* Email Field */}
            <TextField
              margin="normal"
              label="Email"
              type="email"
              fullWidth
              required
              value={editData?.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData('text');
                if (!emailPattern.test(pasteData)) {
                  e.preventDefault();
                }
              }}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
            />

            {/* Phone Number Field */}
            <TextField
              margin="normal"
              label="Phone"
              type="tel"
              fullWidth
              required
              value={editData?.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onKeyPress={(e) => {
                if (!/[0-9()+\- ]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData('text');
                if (!phonePattern.test(pasteData)) {
                  e.preventDefault();
                }
              }}
              error={Boolean(editErrors.phone)}
              helperText={editErrors.phone}
            />

            {/* Payment Amount Field */}
            <TextField
              margin="normal"
              label="Payment Amount ($)"
              type="number"
              fullWidth
              required
              value={editData?.paymentAmount || ''}
              onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
              inputProps={{ min: "0", step: "0.01" }}
              onKeyPress={(e) => {
                if (!/[0-9.]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData('text');
                if (!paymentAmountPattern.test(pasteData)) {
                  e.preventDefault();
                }
              }}
              error={Boolean(editErrors.paymentAmount)}
              helperText={editErrors.paymentAmount}
            />

            {/* Payment Status Field */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="payment-status-label">Payment Status</InputLabel>
              <Select
                labelId="payment-status-label"
                label="Payment Status"
                value={editData?.paymentStatus || 'pending'}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={
              !editData ||
              !editData.name.trim() ||
              !editData.email.trim() ||
              !editData.phone.trim() ||
              !editData.paymentAmount.toString().trim() ||
              Boolean(editErrors.name) ||
              Boolean(editErrors.email) ||
              Boolean(editErrors.phone) ||
              Boolean(editErrors.paymentAmount)
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageBandsPerformers;
