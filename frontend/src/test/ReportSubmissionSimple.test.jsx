import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ReportSubmission from '../components/ReportSubmission'

// Mock dependencies
vi.mock('../utils/axios', () => ({
  default: {
    post: vi.fn(),
  }
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
    },
  })
}))

// Mock CSS import
vi.mock('../components/ReportSubmission.css', () => ({}))

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: vi.fn(),
}

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

describe('ReportSubmission - Address and Tags Removal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form without address section', () => {
    render(<ReportSubmission />)
    
    // Check that address fields are NOT present
    expect(screen.queryByText(/Address/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Street Address/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/City/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/State/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Postal Code/)).not.toBeInTheDocument()
  })

  it('should render form without tags section', () => {
    render(<ReportSubmission />)
    
    // Check that tags field is NOT present
    expect(screen.queryByText(/Tags/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Additional Information/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Tags/)).not.toBeInTheDocument()
  })

  it('should render all essential fields', () => {
    render(<ReportSubmission />)
    
    // Check that essential fields are present
    expect(screen.getByText('Environmental Incident Report')).toBeInTheDocument()
    expect(screen.getByLabelText(/Report Title/)).toBeInTheDocument()
    expect(screen.getByText('Incident Type')).toBeInTheDocument()
    expect(screen.getByText('Priority Level')).toBeInTheDocument()
    expect(screen.getByLabelText(/Detailed Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Latitude/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Longitude/)).toBeInTheDocument()
    expect(screen.getByText('Photo Evidence')).toBeInTheDocument()
  })

  it('should validate form correctly without address and tags', async () => {
    render(<ReportSubmission />)
    
    const user = userEvent.setup()
    const submitButton = screen.getByText('Submit Report')
    
    // Try to submit empty form
    await user.click(submitButton)
    
    // Should show validation errors for required fields
    await waitFor(() => {
      expect(screen.getByText(/Title is required/)).toBeInTheDocument()
    })
  })

  it('should show proper validation for remaining fields', async () => {
    render(<ReportSubmission />)
    
    const user = userEvent.setup()
    const titleInput = screen.getByLabelText(/Report Title/)
    const descriptionInput = screen.getByLabelText(/Detailed Description/)
    const submitButton = screen.getByText('Submit Report')
    
    // Fill title but leave description short
    await user.type(titleInput, 'Test Title')
    await user.type(descriptionInput, 'Short')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Description must be at least 10 characters long/)).toBeInTheDocument()
    })
  })

  it('should require location coordinates', async () => {
    render(<ReportSubmission />)
    
    const user = userEvent.setup()
    const titleInput = screen.getByLabelText(/Report Title/)
    const descriptionInput = screen.getByLabelText(/Detailed Description/)
    const submitButton = screen.getByText('Submit Report')
    
    await user.type(titleInput, 'Test Title')
    await user.type(descriptionInput, 'This is a long enough description')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Location coordinates are required/)).toBeInTheDocument()
    })
  })

  it('should require at least one photo', async () => {
    render(<ReportSubmission />)
    
    const user = userEvent.setup()
    const titleInput = screen.getByLabelText(/Report Title/)
    const descriptionInput = screen.getByLabelText(/Detailed Description/)
    const latitudeInput = screen.getByLabelText(/Latitude/)
    const longitudeInput = screen.getByLabelText(/Longitude/)
    const submitButton = screen.getByText('Submit Report')
    
    await user.type(titleInput, 'Test Title')
    await user.type(descriptionInput, 'This is a long enough description')
    await user.type(latitudeInput, '12.5678')
    await user.type(longitudeInput, '101.2345')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/At least one photo is required as evidence/)).toBeInTheDocument()
    })
  })
})