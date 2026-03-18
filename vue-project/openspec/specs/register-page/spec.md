# Register Page Specification

## Purpose

This specification defines the requirements for the registration page UI component.

## ADDED Requirements

### Requirement: Register Form Must Have Email Field

The registration form SHALL include an email input field.

#### Scenario: Email field exists

- **WHEN** register page renders
- **THEN** email input field SHALL be visible

#### Scenario: Email accepts input

- **WHEN** user types in email field
- **THEN** input SHALL be captured in form state

### Requirement: Register Form Must Have Password Field

The registration form SHALL include a password input field.

#### Scenario: Password field exists

- **WHEN** register page renders
- **THEN** password input field SHALL be visible

#### Scenario: Password masks input

- **WHEN** user types in password field
- **THEN** input SHALL be masked

### Requirement: Register Form Must Have Confirm Password Field

The registration form SHALL include a confirm password field.

#### Scenario: Confirm password field exists

- **WHEN** register page renders
- **THEN** confirm password input field SHALL be visible

#### Scenario: Confirm password matches password

- **WHEN** user enters same password in both fields
- **THEN** validation SHALL pass

#### Scenario: Confirm password does not match

- **WHEN** user enters different password in confirm field
- **THEN** validation SHALL show error

### Requirement: Register Form Must Have Name Fields

The registration form SHALL include first name and last name fields.

#### Scenario: First name field exists

- **WHEN** register page renders
- **THEN** first name input field SHALL be visible

#### Scenario: Last name field exists

- **WHEN** register page renders
- **THEN** last name input field SHALL be visible

### Requirement: Register Form Must Have Optional Company Name Field

The registration form SHALL include an optional company name field.

#### Scenario: Company name field exists

- **WHEN** register page renders
- **THEN** company name input field SHALL be visible
- **AND** field SHALL be marked as optional

### Requirement: Register Form Must Validate Email Format

The registration form SHALL validate email format.

#### Scenario: Valid email

- **WHEN** user enters "<user@example.com>"
- **THEN** email validation SHALL pass

#### Scenario: Invalid email

- **WHEN** user enters "invalid"
- **THEN** email validation SHALL show error

### Requirement: Register Form Must Validate Password Length

The registration form SHALL require minimum password length.

#### Scenario: Short password

- **WHEN** user enters password with less than 8 characters
- **THEN** error SHALL indicate minimum 8 characters

#### Scenario: Valid password length

- **WHEN** user enters password with 8 or more characters
- **THEN** password validation SHALL pass

### Requirement: Register Form Must Validate Password Maximum Length

The registration form SHALL enforce maximum password length.

#### Scenario: Password exceeds maximum

- **WHEN** user enters password with more than 72 characters
- **THEN** error SHALL indicate maximum 72 characters

#### Scenario: Valid password length (at max)

- **WHEN** user enters password with exactly 72 characters
- **THEN** password validation SHALL pass

### Requirement: Register Form Must Validate Password Contains Uppercase

The registration form SHALL require at least one uppercase letter in password.

#### Scenario: Password missing uppercase

- **WHEN** user enters password without uppercase letter
- **THEN** error SHALL indicate need for uppercase letter

#### Scenario: Password has uppercase

- **WHEN** user enters password with at least one uppercase letter
- **THEN** uppercase validation SHALL pass

### Requirement: Register Form Must Validate Password Contains Lowercase

The registration form SHALL require at least one lowercase letter in password.

#### Scenario: Password missing lowercase

- **WHEN** user enters password without lowercase letter
- **THEN** error SHALL indicate need for lowercase letter

#### Scenario: Password has lowercase

- **WHEN** user enters password with at least one lowercase letter
- **THEN** lowercase validation SHALL pass

### Requirement: Register Form Must Validate Password Contains Number

The registration form SHALL require at least one number (digit) in password.

#### Scenario: Password missing number

- **WHEN** user enters password without a digit
- **THEN** error SHALL indicate need for a number

#### Scenario: Password has number

- **WHEN** user enters password with at least one digit
- **THEN** number validation SHALL pass

### Requirement: Register Form Must Validate Password Contains Special Character

The registration form SHALL require at least one special character (@$!%\*?&) in password.

#### Scenario: Password missing special character

- **WHEN** user enters password without special character
- **THEN** error SHALL indicate need for special character

#### Scenario: Password has special character

- **WHEN** user enters password with at least one special character (@$!%\*?&)
- **THEN** special character validation SHALL pass

### Requirement: Register Form Must Show Live Password Validation Feedback

The registration form SHALL show real-time validation feedback as user types.

#### Scenario: Live validation shows progress

- **WHEN** user types in password field
- **THEN** validation status SHALL update in real-time
- **AND** each requirement SHALL show check/cross icon

### Requirement: Register Form Must Submit to Backend

The registration form SHALL submit to the registration endpoint.

#### Scenario: Successful registration

- **WHEN** user submits valid form data
- **THEN** API SHALL be called with user data
- **AND** response SHALL contain accessToken and refreshToken
- **AND** new company SHALL be created if companyName provided

#### Scenario: Registration failure

- **WHEN** user submits with existing email
- **THEN** API SHALL return error
- **AND** error message SHALL be displayed

### Requirement: Register Form Must Show Loading State

The registration form SHALL indicate when submission is in progress.

#### Scenario: Loading during submission

- **WHEN** registration request is in progress
- **THEN** submit button SHALL be disabled
- **AND** loading indicator SHALL be shown

### Requirement: Register Form Must Navigate on Success

The registration form SHALL navigate to protected area on successful registration.

#### Scenario: Redirect after registration

- **WHEN** registration succeeds
- **THEN** user SHALL be redirected to main application

### Requirement: Register Form Must Link to Login

The registration form SHALL provide link to login page.

#### Scenario: Login link exists

- **WHEN** register page renders
- **THEN** link to login page SHALL be visible
