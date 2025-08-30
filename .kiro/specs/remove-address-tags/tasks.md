# Implementation Plan

- [x] 1. Update backend data model and validation

  - Remove address and tags fields from the Report model schema
  - Remove address and tags validation rules from report routes
  - Update report controller to not process address and tags data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4, 3.5_

- [x] 2. Update frontend form component

  - Remove address section UI components from ReportSubmission.jsx
  - Remove tags input field from ReportSubmission.jsx

  - Update form state management to exclude address and tags properties
  - Update form submission logic to not include address and tags data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

- [x] 3. Clean up frontend styling


  - Remove address-related CSS styles from ReportSubmission.css
  - Remove tags-related CSS styles from ReportSubmission.css
  - Update form layout styles to maintain proper spacing after component removal
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 4. Test the updated functionality



  - Test report submission form renders correctly without address and tags sections
  - Test successful report submission without address and tags 
data
  - Verify form validation works correctly for remaining fields
  - Test that existing reports with address/tags data still display properly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_
