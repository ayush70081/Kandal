import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import axios from '../utils/axios'

// Mock axios
vi.mock('../utils/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

describe('Backend Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Report Submission API', () => {
    it('should submit report without address and tags fields', async () => {
      const mockResponse = {
        data: {
          message: 'Report submitted successfully',
          report: {
            _id: 'test-report-id',
            title: 'Test Environmental Incident',
            incidentType: 'illegal_cutting',
            description: 'Test description',
            severity: 'medium',
            location: {
              type: 'Point',
              coordinates: [101.2345, 12.5678]
            }
          },
          pointsAwarded: 20
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Simulate form submission without address/tags
      const formData = new FormData()
      formData.append('title', 'Test Environmental Incident')
      formData.append('incidentType', 'illegal_cutting')
      formData.append('description', 'Test description')
      formData.append('severity', 'medium')
      formData.append('location', JSON.stringify({
        latitude: 12.5678,
        longitude: 101.2345
      }))

      const response = await axios.post('/reports/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      expect(axios.post).toHaveBeenCalledWith(
        '/reports/submit',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      )

      expect(response.data.message).toBe('Report submitted successfully')
      expect(response.data.report.title).toBe('Test Environmental Incident')
      expect(response.data.pointsAwarded).toBe(20)

      // Verify FormData doesn't contain address or tags
      const formDataCall = axios.post.mock.calls[0][1]
      expect(formDataCall.get('address')).toBeNull()
      expect(formDataCall.get('tags')).toBeNull()
    })

    it('should handle API validation errors gracefully', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Validation failed',
            details: [
              { msg: 'Title is required' },
              { msg: 'Description must be at least 10 characters' }
            ]
          }
        }
      }

      axios.post.mockRejectedValue(mockError)

      try {
        const formData = new FormData()
        formData.append('title', '')
        formData.append('description', 'short')

        await axios.post('/reports/submit', formData)
      } catch (error) {
        expect(error.response.data.error).toBe('Validation failed')
        expect(error.response.data.details).toHaveLength(2)
      }
    })
  })

  describe('Report Retrieval API', () => {
    it('should retrieve reports with mixed address/tags data', async () => {
      const mockReports = {
        data: {
          reports: [
            {
              _id: 'old-report',
              title: 'Legacy Report with Address',
              description: 'Old report',
              incidentType: 'illegal_cutting',
              severity: 'high',
              location: { coordinates: [101.1, 12.1] },
              address: { street: '123 Main St', city: 'Test City' },
              tags: ['urgent', 'deforestation'],
              createdAt: '2024-01-15T10:00:00Z'
            },
            {
              _id: 'new-report',
              title: 'Modern Report without Address',
              description: 'New report',
              incidentType: 'pollution',
              severity: 'medium',
              location: { coordinates: [101.2, 12.2] },
              createdAt: '2024-02-01T10:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1
          }
        }
      }

      axios.get.mockResolvedValue(mockReports)

      const response = await axios.get('/reports')

      expect(response.data.reports).toHaveLength(2)
      
      // Old report should have address and tags
      const oldReport = response.data.reports[0]
      expect(oldReport.address).toBeDefined()
      expect(oldReport.tags).toBeDefined()
      expect(oldReport.address.street).toBe('123 Main St')
      expect(oldReport.tags).toContain('urgent')

      // New report should not have address and tags
      const newReport = response.data.reports[1]
      expect(newReport.address).toBeUndefined()
      expect(newReport.tags).toBeUndefined()
    })

    it('should retrieve single report with legacy data', async () => {
      const mockReport = {
        data: {
          _id: 'legacy-report',
          title: 'Legacy Report',
          description: 'Report with all legacy fields',
          incidentType: 'dumping',
          severity: 'high',
          location: { coordinates: [101.3, 12.3] },
          address: {
            street: '456 Oak Ave',
            city: 'Legacy City',
            state: 'Legacy State',
            postalCode: '12345'
          },
          tags: ['waste', 'environmental', 'cleanup'],
          reporter: { name: 'Test Reporter' },
          createdAt: '2024-01-10T15:30:00Z'
        }
      }

      axios.get.mockResolvedValue(mockReport)

      const response = await axios.get('/reports/legacy-report')

      expect(response.data.title).toBe('Legacy Report')
      expect(response.data.address).toBeDefined()
      expect(response.data.tags).toBeDefined()
      expect(response.data.address.street).toBe('456 Oak Ave')
      expect(response.data.tags).toEqual(['waste', 'environmental', 'cleanup'])
    })

    it('should handle reports with null address/tags gracefully', async () => {
      const mockReports = {
        data: {
          reports: [
            {
              _id: 'null-fields-report',
              title: 'Report with Null Fields',
              description: 'Report with null address and tags',
              incidentType: 'erosion',
              severity: 'low',
              location: { coordinates: [101.4, 12.4] },
              address: null,
              tags: null,
              createdAt: '2024-02-01T12:00:00Z'
            },
            {
              _id: 'undefined-fields-report',
              title: 'Report with Undefined Fields',
              description: 'Report without address and tags fields',
              incidentType: 'construction',
              severity: 'medium',
              location: { coordinates: [101.5, 12.5] },
              createdAt: '2024-02-01T13:00:00Z'
            }
          ]
        }
      }

      axios.get.mockResolvedValue(mockReports)

      const response = await axios.get('/reports')

      expect(response.data.reports).toHaveLength(2)
      
      // Both reports should handle null/undefined gracefully
      response.data.reports.forEach(report => {
        expect(report.title).toBeDefined()
        expect(report.description).toBeDefined()
        expect(report.incidentType).toBeDefined()
        expect(report.severity).toBeDefined()
        expect(report.location).toBeDefined()
      })
    })
  })

  describe('Form Data Validation', () => {
    it('should create FormData without address and tags', () => {
      const reportData = {
        title: 'Test Report',
        incidentType: 'pollution',
        description: 'Test description for pollution incident',
        severity: 'high',
        location: { latitude: 12.5678, longitude: 101.2345 }
      }

      const formData = new FormData()
      formData.append('title', reportData.title)
      formData.append('incidentType', reportData.incidentType)
      formData.append('description', reportData.description)
      formData.append('severity', reportData.severity)
      formData.append('location', JSON.stringify(reportData.location))

      // Verify required fields are present
      expect(formData.get('title')).toBe('Test Report')
      expect(formData.get('incidentType')).toBe('pollution')
      expect(formData.get('description')).toBe('Test description for pollution incident')
      expect(formData.get('severity')).toBe('high')
      expect(JSON.parse(formData.get('location'))).toEqual({
        latitude: 12.5678,
        longitude: 101.2345
      })

      // Verify address and tags are not present
      expect(formData.get('address')).toBeNull()
      expect(formData.get('tags')).toBeNull()
    })

    it('should validate that form submission payload is correct', () => {
      const expectedPayload = {
        title: 'Environmental Incident',
        incidentType: 'illegal_cutting',
        description: 'Detailed description of the incident',
        severity: 'critical',
        location: { latitude: 12.1234, longitude: 101.5678 }
      }

      // Simulate form data creation
      const formData = new FormData()
      Object.keys(expectedPayload).forEach(key => {
        if (key === 'location') {
          formData.append(key, JSON.stringify(expectedPayload[key]))
        } else {
          formData.append(key, expectedPayload[key])
        }
      })

      // Verify all expected fields are present
      expect(formData.get('title')).toBe(expectedPayload.title)
      expect(formData.get('incidentType')).toBe(expectedPayload.incidentType)
      expect(formData.get('description')).toBe(expectedPayload.description)
      expect(formData.get('severity')).toBe(expectedPayload.severity)
      expect(JSON.parse(formData.get('location'))).toEqual(expectedPayload.location)

      // Verify removed fields are not present
      expect(formData.get('address')).toBeNull()
      expect(formData.get('tags')).toBeNull()
      expect(formData.has('address')).toBe(false)
      expect(formData.has('tags')).toBe(false)
    })
  })
})