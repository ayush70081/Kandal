import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportSubmission from '../components/ReportSubmission'
import axios from '../utils/axios'

// Mock the CSS import
vi.mock('../components/ReportSubmission.css', () => ({}))

describe('ReportSubmission Component', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering Tests', () => {
    it('should render the form without address section', () => {
      render(<ReportSubmission />)
      
      // Check that main form elements are present
      expect(screen.getByText('Environmental Incident Report')).toBeInTheDocument()
      expect(screen.getByLabelText(/Report Title/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Incident Type/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Priority Level/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Detailed Description/)).toBeInTheDocument()
      
      // Check that address fields are NOT present
      expect(screen.queryByText(/Address/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Street Address/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/City/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/State/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Postal Code/)).not.toBeInTheDocument()
    })

    it('should render the form without tags section', () => {
      render(<ReportSubmission />)
      
      // Check that tags field is NOT present
      expect(screen.queryByText(/Tags/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Additional Information/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Tags/)).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText(/Enter tags/)).not.toBeInTheDocument()
    })

    it('should render all remaining essential fields', () => {
      render(<ReportSubmission />)
      
      // Basic Information section
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByLabelText(/Report Title/)).toBeInTheDocument()
      expect(screen.getByText('Incident Type')).toBeInTheDocument()
      expect(screen.getByText('Priority Level')).toBeInTheDocument()
      
      // Incident Details section
      expect(screen.getByText('Incident Details')).toBeInTheDocument()
      expect(screen.getByLabelText(/Detailed Description/)).toBeInTheDocument()
      
      // Location Information section
      expect(screen.getByText('Location Information')).toBeInTheDocument()
      expect(screen.getByLabelText(/Latitude/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Longitude/)).toBeInTheDocument()
      expect(screen.getByText('Capture Current Location')).toBeInTheDocument()
      
      // Photo Evidence section
      expect(screen.getByText('Photo Evidence')).toBeInTheDocument()
      expect(screen.getByText(/Drag and drop photos here/)).toBeInTheDocument()
      
      // Form actions
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Submit Report')).toBeInTheDocument()
    })

    it('should render all incident type options', () => {
      render(<ReportSubmission />)
      
      const incidentTypes = [
        'Illegal Tree Cutting',
        'Waste Dumping',
        'Water/Soil Pollution',
        'Land Reclamation',
        'Wildlife Disturbance',
        'Coastal Erosion',
        'Oil Spill',
        'Unauthorized Construction',
        'Other Environmental Issue'
      ]
      
      incidentTypes.forEach(type => {
        expect(screen.getByText(type)).toBeInTheDocument()
      })
    })

    it('should render all priority level options', () => {
      render(<ReportSubmission />)
      
      expect(screen.getByText('Low Priority')).toBeInTheDocument()
      expect(screen.getByText('Medium Priority')).toBeInTheDocument()
      expect(screen.getByText('High Priority')).toBeInTheDocument()
      expect(screen.getByText('Critical Priority')).toBeInTheDocument()
    })
  })

  describe('Form Validation Tests', () => {
    it('should show error when title is empty', async () => {
      render(<ReportSubmission />)
      
      const submitButton = screen.getByText('Submit Report')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Title is required/)).toBeInTheDocument()
      })
    })

    it('should show error when description is too short', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const submitButton = screen.getByText('Submit Report')
      
      await user.type(titleInput, 'Test Title')
      await user.type(descriptionInput, 'Short')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Description must be at least 10 characters long/)).toBeInTheDocument()
      })
    })

    it('should show error when location coordinates are missing', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const submitButton = screen.getByText('Submit Report')
      
      await user.type(titleInput, 'Test Title')
      await user.type(descriptionInput, 'This is a detailed description with more than 10 characters')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Location coordinates are required/)).toBeInTheDocument()
      })
    })

    it('should show error when no photos are uploaded', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const latitudeInput = screen.getByLabelText(/Latitude/)
      const longitudeInput = screen.getByLabelText(/Longitude/)
      const submitButton = screen.getByText('Submit Report')
      
      await user.type(titleInput, 'Test Title')
      await user.type(descriptionInput, 'This is a detailed description with more than 10 characters')
      await user.type(latitudeInput, '12.5678')
      await user.type(longitudeInput, '101.2345')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/At least one photo is required as evidence/)).toBeInTheDocument()
      })
    })

    it('should validate form correctly with all required fields', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const latitudeInput = screen.getByLabelText(/Latitude/)
      const longitudeInput = screen.getByLabelText(/Longitude/)
      
      await user.type(titleInput, 'Test Environmental Incident')
      await user.type(descriptionInput, 'This is a detailed description of an environmental incident with sufficient length')
      await user.type(latitudeInput, '12.5678')
      await user.type(longitudeInput, '101.2345')
      
      // Mock file upload
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/Drag and drop photos here/)
      
      // Simulate file drop
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file]
        }
      })
      
      // No validation errors should be shown
      expect(screen.queryByText(/Title is required/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Description must be at least 10 characters/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Location coordinates are required/)).not.toBeInTheDocument()
      expect(screen.queryByText(/At least one photo is required/)).not.toBeInTheDocument()
    })
  })

  describe('Form Interaction Tests', () => {
    it('should update form state when inputs change', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      
      await user.type(titleInput, 'Test Title')
      await user.type(descriptionInput, 'Test Description')
      
      expect(titleInput.value).toBe('Test Title')
      expect(descriptionInput.value).toBe('Test Description')
    })

    it('should update incident type when radio button is selected', async () => {
      render(<ReportSubmission />)
      
      const dumpingOption = screen.getByLabelText('Waste Dumping')
      await user.click(dumpingOption)
      
      expect(dumpingOption).toBeChecked()
    })

    it('should update severity when priority option is selected', async () => {
      render(<ReportSubmission />)
      
      const highPriorityOption = screen.getByLabelText('High Priority')
      await user.click(highPriorityOption)
      
      expect(highPriorityOption).toBeChecked()
    })

    it('should update location coordinates when inputs change', async () => {
      render(<ReportSubmission />)
      
      const latitudeInput = screen.getByLabelText(/Latitude/)
      const longitudeInput = screen.getByLabelText(/Longitude/)
      
      await user.type(latitudeInput, '12.5678')
      await user.type(longitudeInput, '101.2345')
      
      expect(latitudeInput.value).toBe('12.5678')
      expect(longitudeInput.value).toBe('101.2345')
    })

    it('should handle geolocation capture', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 12.5678,
              longitude: 101.2345
            }
          })
        })
      }
      
      global.navigator.geolocation = mockGeolocation
      
      render(<ReportSubmission />)
      
      const locationButton = screen.getByText('Capture Current Location')
      await user.click(locationButton)
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission Tests', () => {
    beforeEach(() => {
      // Mock successful API response
      axios.post.mockResolvedValue({
        data: {
          report: {
            _id: 'test-report-id',
            title: 'Test Report'
          },
          pointsAwarded: 20
        }
      })
    })

    it('should submit form successfully without address and tags data', async () => {
      render(<ReportSubmission />)
      
      // Fill out the form
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const latitudeInput = screen.getByLabelText(/Latitude/)
      const longitudeInput = screen.getByLabelText(/Longitude/)
      
      await user.type(titleInput, 'Test Environmental Incident')
      await user.type(descriptionInput, 'This is a detailed description of an environmental incident')
      await user.type(latitudeInput, '12.5678')
      await user.type(longitudeInput, '101.2345')
      
      // Mock file upload
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/Drag and drop photos here/)
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file]
        }
      })
      
      const submitButton = screen.getByText('Submit Report')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/reports/submit',
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        )
      })
      
      // Verify that the FormData doesn't contain address or tags
      const formDataCall = axios.post.mock.calls[0][1]
      expect(formDataCall).toBeInstanceOf(FormData)
      
      // Check that required fields are present
      expect(formDataCall.get('title')).toBe('Test Environmental Incident')
      expect(formDataCall.get('incidentType')).toBe('illegal_cutting')
      expect(formDataCall.get('description')).toBe('This is a detailed description of an environmental incident')
      expect(formDataCall.get('severity')).toBe('medium')
      expect(JSON.parse(formDataCall.get('location'))).toEqual({
        latitude: 12.5678,
        longitude: 101.2345
      })
      
      // Check that address and tags are NOT present
      expect(formDataCall.get('address')).toBeNull()
      expect(formDataCall.get('tags')).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Validation failed',
            details: [{ msg: 'Invalid data' }]
          }
        }
      })
      
      render(<ReportSubmission />)
      
      // Fill out the form
      const titleInput = screen.getByLabelText(/Report Title/)
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      const latitudeInput = screen.getByLabelText(/Latitude/)
      const longitudeInput = screen.getByLabelText(/Longitude/)
      
      await user.type(titleInput, 'Test Environmental Incident')
      await user.type(descriptionInput, 'This is a detailed description of an environmental incident')
      await user.type(latitudeInput, '12.5678')
      await user.type(longitudeInput, '101.2345')
      
      // Mock file upload
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/Drag and drop photos here/)
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file]
        }
      })
      
      const submitButton = screen.getByText('Submit Report')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid data/)).toBeInTheDocument()
      })
    })
  })

  describe('Character Count Tests', () => {
    it('should display character count for title field', async () => {
      render(<ReportSubmission />)
      
      const titleInput = screen.getByLabelText(/Report Title/)
      await user.type(titleInput, 'Test Title')
      
      expect(screen.getByText('10/200 characters')).toBeInTheDocument()
    })

    it('should display character count for description field', async () => {
      render(<ReportSubmission />)
      
      const descriptionInput = screen.getByLabelText(/Detailed Description/)
      await user.type(descriptionInput, 'Test description')
      
      expect(screen.getByText('16/2000 characters (minimum 10 required)')).toBeInTheDocument()
    })
  })

  describe('File Upload Tests', () => {
    it('should handle file upload correctly', async () => {
      render(<ReportSubmission />)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/Drag and drop photos here/)
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file]
        }
      })
      
      await waitFor(() => {
        expect(screen.getByAltText('Evidence')).toBeInTheDocument()
      })
    })

    it('should allow removing uploaded photos', async () => {
      render(<ReportSubmission />)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/Drag and drop photos here/)
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file]
        }
      })
      
      await waitFor(() => {
        const removeButton = screen.getByTitle('Remove photo')
        expect(removeButton).toBeInTheDocument()
      })
      
      const removeButton = screen.getByTitle('Remove photo')
      await user.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByAltText('Evidence')).not.toBeInTheDocument()
      })
    })
  })
})