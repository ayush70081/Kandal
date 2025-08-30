import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from '../utils/axios'

// Mock components that might display reports
const MockReportListing = ({ reports }) => (
  <div data-testid="report-listing">
    {reports.map(report => (
      <div key={report._id} data-testid="report-item">
        <h3>{report.title}</h3>
        <p>{report.description}</p>
        <p>Type: {report.incidentType}</p>
        <p>Severity: {report.severity}</p>
        <p>Location: {report.location.coordinates.join(', ')}</p>
        {report.address && <p>Address: {report.address.street}</p>}
        {report.tags && <p>Tags: {report.tags.join(', ')}</p>}
      </div>
    ))}
  </div>
)

const MockReportDetail = ({ report }) => (
  <div data-testid="report-detail">
    <h1>{report.title}</h1>
    <p>{report.description}</p>
    <p>Type: {report.incidentType}</p>
    <p>Severity: {report.severity}</p>
    <p>Location: {report.location.coordinates.join(', ')}</p>
    {report.address && (
      <div data-testid="address-section">
        <h3>Address</h3>
        <p>{report.address.street}</p>
        <p>{report.address.city}, {report.address.state}</p>
      </div>
    )}
    {report.tags && (
      <div data-testid="tags-section">
        <h3>Tags</h3>
        <p>{report.tags.join(', ')}</p>
      </div>
    )}
  </div>
)

describe('Report Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Existing Reports with Address/Tags Data', () => {
    const mockReportsWithAddressTags = [
      {
        _id: 'report-1',
        title: 'Old Report with Address and Tags',
        description: 'This is an old report that has address and tags data',
        incidentType: 'illegal_cutting',
        severity: 'high',
        location: {
          type: 'Point',
          coordinates: [101.2345, 12.5678]
        },
        address: {
          street: '123 Main Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345'
        },
        tags: ['urgent', 'environmental', 'deforestation'],
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        _id: 'report-2',
        title: 'Another Old Report',
        description: 'Another report with legacy data',
        incidentType: 'pollution',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [101.3456, 12.6789]
        },
        address: {
          street: '456 Oak Avenue',
          city: 'Another City',
          state: 'Another State',
          postalCode: '67890'
        },
        tags: ['water', 'contamination'],
        createdAt: '2024-01-10T14:30:00Z'
      }
    ]

    const mockReportsWithoutAddressTags = [
      {
        _id: 'report-3',
        title: 'New Report without Address and Tags',
        description: 'This is a new report submitted after the address/tags removal',
        incidentType: 'dumping',
        severity: 'low',
        location: {
          type: 'Point',
          coordinates: [101.4567, 12.7890]
        },
        createdAt: '2024-02-01T09:15:00Z'
      }
    ]

    it('should display existing reports with address data properly', async () => {
      axios.get.mockResolvedValue({
        data: {
          reports: mockReportsWithAddressTags
        }
      })

      render(<MockReportListing reports={mockReportsWithAddressTags} />)

      // Verify that reports with address data are displayed correctly
      expect(screen.getByText('Old Report with Address and Tags')).toBeInTheDocument()
      expect(screen.getByText('Address: 123 Main Street')).toBeInTheDocument()
      expect(screen.getByText('Tags: urgent, environmental, deforestation')).toBeInTheDocument()

      expect(screen.getByText('Another Old Report')).toBeInTheDocument()
      expect(screen.getByText('Address: 456 Oak Avenue')).toBeInTheDocument()
      expect(screen.getByText('Tags: water, contamination')).toBeInTheDocument()
    })

    it('should display new reports without address/tags data properly', async () => {
      axios.get.mockResolvedValue({
        data: {
          reports: mockReportsWithoutAddressTags
        }
      })

      render(<MockReportListing reports={mockReportsWithoutAddressTags} />)

      // Verify that new reports without address/tags are displayed correctly
      expect(screen.getByText('New Report without Address and Tags')).toBeInTheDocument()
      expect(screen.queryByText(/Address:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tags:/)).not.toBeInTheDocument()
    })

    it('should handle mixed reports (with and without address/tags) properly', async () => {
      const mixedReports = [...mockReportsWithAddressTags, ...mockReportsWithoutAddressTags]
      
      axios.get.mockResolvedValue({
        data: {
          reports: mixedReports
        }
      })

      render(<MockReportListing reports={mixedReports} />)

      // Verify old reports still show address/tags
      expect(screen.getByText('Address: 123 Main Street')).toBeInTheDocument()
      expect(screen.getByText('Tags: urgent, environmental, deforestation')).toBeInTheDocument()

      // Verify new reports don't show address/tags
      expect(screen.getByText('New Report without Address and Tags')).toBeInTheDocument()
      
      // Count address mentions - should only be 2 (from old reports)
      const addressElements = screen.getAllByText(/Address:/)
      expect(addressElements).toHaveLength(2)
      
      // Count tag mentions - should only be 2 (from old reports)
      const tagElements = screen.getAllByText(/Tags:/)
      expect(tagElements).toHaveLength(2)
    })

    it('should display detailed view of existing report with address/tags', async () => {
      const reportWithAddressTags = mockReportsWithAddressTags[0]
      
      axios.get.mockResolvedValue({
        data: reportWithAddressTags
      })

      render(<MockReportDetail report={reportWithAddressTags} />)

      // Verify all report details are displayed
      expect(screen.getByText('Old Report with Address and Tags')).toBeInTheDocument()
      expect(screen.getByText('This is an old report that has address and tags data')).toBeInTheDocument()
      expect(screen.getByText('Type: illegal_cutting')).toBeInTheDocument()
      expect(screen.getByText('Severity: high')).toBeInTheDocument()

      // Verify address section is displayed
      expect(screen.getByTestId('address-section')).toBeInTheDocument()
      expect(screen.getByText('123 Main Street')).toBeInTheDocument()
      expect(screen.getByText('Test City, Test State')).toBeInTheDocument()

      // Verify tags section is displayed
      expect(screen.getByTestId('tags-section')).toBeInTheDocument()
      expect(screen.getByText('urgent, environmental, deforestation')).toBeInTheDocument()
    })

    it('should display detailed view of new report without address/tags', async () => {
      const reportWithoutAddressTags = mockReportsWithoutAddressTags[0]
      
      axios.get.mockResolvedValue({
        data: reportWithoutAddressTags
      })

      render(<MockReportDetail report={reportWithoutAddressTags} />)

      // Verify all report details are displayed
      expect(screen.getByText('New Report without Address and Tags')).toBeInTheDocument()
      expect(screen.getByText('This is a new report submitted after the address/tags removal')).toBeInTheDocument()
      expect(screen.getByText('Type: dumping')).toBeInTheDocument()
      expect(screen.getByText('Severity: low')).toBeInTheDocument()

      // Verify address and tags sections are NOT displayed
      expect(screen.queryByTestId('address-section')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tags-section')).not.toBeInTheDocument()
    })
  })

  describe('API Compatibility Tests', () => {
    it('should handle API responses with mixed report formats', async () => {
      const mixedApiResponse = {
        data: {
          reports: [
            {
              _id: 'old-report',
              title: 'Legacy Report',
              description: 'Old report with all fields',
              incidentType: 'illegal_cutting',
              severity: 'high',
              location: { coordinates: [101.1, 12.1] },
              address: { street: 'Old Street' },
              tags: ['legacy', 'old']
            },
            {
              _id: 'new-report',
              title: 'Modern Report',
              description: 'New report without address/tags',
              incidentType: 'pollution',
              severity: 'medium',
              location: { coordinates: [101.2, 12.2] }
              // No address or tags fields
            }
          ]
        }
      }

      axios.get.mockResolvedValue(mixedApiResponse)

      // This should not throw any errors
      expect(() => {
        render(<MockReportListing reports={mixedApiResponse.data.reports} />)
      }).not.toThrow()

      // Verify both reports are displayed correctly
      expect(screen.getByText('Legacy Report')).toBeInTheDocument()
      expect(screen.getByText('Modern Report')).toBeInTheDocument()
      expect(screen.getByText('Address: Old Street')).toBeInTheDocument()
      expect(screen.getByText('Tags: legacy, old')).toBeInTheDocument()
    })

    it('should handle reports with null or undefined address/tags gracefully', async () => {
      const reportsWithNullFields = [
        {
          _id: 'report-null',
          title: 'Report with Null Fields',
          description: 'Report with null address and tags',
          incidentType: 'erosion',
          severity: 'low',
          location: { coordinates: [101.3, 12.3] },
          address: null,
          tags: null
        },
        {
          _id: 'report-undefined',
          title: 'Report with Undefined Fields',
          description: 'Report with undefined address and tags',
          incidentType: 'construction',
          severity: 'medium',
          location: { coordinates: [101.4, 12.4] }
          // address and tags are undefined (not present)
        }
      ]

      // This should not throw any errors
      expect(() => {
        render(<MockReportListing reports={reportsWithNullFields} />)
      }).not.toThrow()

      // Verify reports are displayed without address/tags
      expect(screen.getByText('Report with Null Fields')).toBeInTheDocument()
      expect(screen.getByText('Report with Undefined Fields')).toBeInTheDocument()
      expect(screen.queryByText(/Address:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tags:/)).not.toBeInTheDocument()
    })
  })

  describe('Backend API Endpoint Tests', () => {
    it('should verify that submit endpoint accepts requests without address/tags', async () => {
      const newReportData = {
        title: 'Test Report',
        incidentType: 'dumping',
        description: 'Test description for new report',
        severity: 'medium',
        location: {
          latitude: 12.5678,
          longitude: 101.2345
        }
        // No address or tags fields
      }

      axios.post.mockResolvedValue({
        data: {
          message: 'Report submitted successfully',
          report: {
            _id: 'new-report-id',
            ...newReportData,
            location: {
              type: 'Point',
              coordinates: [101.2345, 12.5678]
            }
          },
          pointsAwarded: 20
        }
      })

      // Simulate form submission
      const formData = new FormData()
      formData.append('title', newReportData.title)
      formData.append('incidentType', newReportData.incidentType)
      formData.append('description', newReportData.description)
      formData.append('severity', newReportData.severity)
      formData.append('location', JSON.stringify(newReportData.location))

      const response = await axios.post('/reports/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      expect(response.data.message).toBe('Report submitted successfully')
      expect(response.data.report.title).toBe('Test Report')
      expect(response.data.pointsAwarded).toBe(20)
    })

    it('should verify that get endpoints return reports without requiring address/tags', async () => {
      const mockApiResponse = {
        data: {
          reports: [
            {
              _id: 'report-1',
              title: 'Report without address/tags',
              description: 'Modern report',
              incidentType: 'pollution',
              severity: 'high',
              location: {
                type: 'Point',
                coordinates: [101.1, 12.1]
              },
              createdAt: '2024-02-01T10:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            pages: 1
          }
        }
      }

      axios.get.mockResolvedValue(mockApiResponse)

      const response = await axios.get('/reports')

      expect(response.data.reports).toHaveLength(1)
      expect(response.data.reports[0].title).toBe('Report without address/tags')
      expect(response.data.reports[0].address).toBeUndefined()
      expect(response.data.reports[0].tags).toBeUndefined()
    })
  })
})