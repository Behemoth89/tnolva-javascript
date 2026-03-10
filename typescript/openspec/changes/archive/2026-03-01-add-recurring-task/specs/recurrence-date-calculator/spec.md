## ADDED Requirements

### Requirement: Calculate Next Occurrence from Template Intervals
The system SHALL calculate the next occurrence date by applying template intervals sequentially.

#### Scenario: Simple interval - every 3 days
- **GIVEN** a template with intervals `[{value: 3, unit: "days"}]` and current date 2026-02-28
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-03

#### Scenario: Simple interval - every 1 week
- **GIVEN** a template with intervals `[{value: 1, unit: "weeks"}]` and current date 2026-02-28 (Saturday)
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-07 (Saturday)

#### Scenario: Simple interval - every 1 month
- **GIVEN** a template with intervals `[{value: 1, unit: "months"}]` and current date 2026-02-15
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-15

#### Scenario: Simple interval - every 1 year
- **GIVEN** a template with intervals `[{value: 1, unit: "years"}]` and current date 2026-02-28
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2027-02-28

### Requirement: Compound Interval Calculation
The system SHALL handle templates with multiple interval components.

#### Scenario: Compound - months and days
- **GIVEN** a template with intervals `[{value: 3, unit: "months"}, {value: 5, unit: "days"}]` and current date 2026-01-15
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-04-20 (add 3 months → 2026-04-15, then add 5 days → 2026-04-20)

#### Scenario: Compound - weeks and days
- **GIVEN** a template with intervals `[{value: 2, unit: "weeks"}, {value: 3, unit: "days"}]` and current date 2026-02-01
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-02-18 (add 14 days → 2026-02-15, then add 3 days → 2026-02-18)

#### Scenario: Compound - years and months
- **GIVEN** a template with intervals `[{value: 1, unit: "years"}, {value: 6, unit: "months"}]` and current date 2026-01-15
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2027-07-15 (add 1 year → 2027-01-15, then add 6 months → 2027-07-15)

### Requirement: Edge Cases for Month Addition
The system SHALL handle month addition edge cases correctly.

#### Scenario: Monthly on 31st for short month
- **GIVEN** a template with intervals `[{value: 1, unit: "months"}]` and current date 2026-01-31
- **WHEN** calculating the next occurrence for February
- **THEN** the result SHALL be 2026-02-28 (last day of February)

#### Scenario: Monthly on 31st for March (leap year)
- **GIVEN** a template with intervals `[{value: 1, unit: "months"}]` and current date 2026-01-31
- **WHEN** calculating the next occurrence for March in leap year
- **THEN** the result SHALL be 2026-03-31

### Requirement: Minimum Interval Validation
The system SHALL validate that interval values are positive.

#### Scenario: Zero interval value
- **GIVEN** a template with intervals `[{value: 0, unit: "days"}]`
- **WHEN** calculating the next occurrence
- **THEN** the system SHALL throw a validation error

#### Scenario: Negative interval value
- **GIVEN** a template with intervals `[{value: -1, unit: "days"}]`
- **WHEN** calculating the next occurrence
- **THEN** the system SHALL throw a validation error

### Requirement: Weekday-Based Recurrence (occurrenceInMonth)
The system SHALL calculate next occurrence for patterns like "First Monday of month".

#### Scenario: First Monday of month
- **GIVEN** a template with weekday=1 (Monday), occurrenceInMonth=1, intervals=[{value: 1, unit: "months"}], current date is 2026-02-02 (Monday)
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-02 (first Monday of March)

#### Scenario: Last Friday of month
- **GIVEN** a template with weekday=5 (Friday), occurrenceInMonth=-1, intervals=[{value: 1, unit: "months"}], current date is 2026-02-27 (Thursday)
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-27 (last Friday of March)

#### Scenario: Second Tuesday of month
- **GIVEN** a template with weekday=2 (Tuesday), occurrenceInMonth=2, intervals=[{value: 1, unit: "months"}], current date is 2026-02-10 (Monday)
- **WHEN** calculating the next occurrence
- **THEN** the result SHALL be 2026-03-10 (second Tuesday of March)

#### Scenario: Fifth occurrence when exists
- **GIVEN** a template with weekday=4 (Thursday), occurrenceInMonth=5, current date 2026-01-29 (Wednesday)
- **WHEN** calculating the next occurrence
- **THEN** if the month has 5 Thursdays, return the 5th; otherwise return the 4th

#### Scenario: First Monday when month starts on Monday
- **GIVEN** a template with weekday=1 (Monday), occurrenceInMonth=1, intervals=[{value: 1, unit: "months"}], current date is 2026-06-01 (Monday - first day of month)
- **WHEN** calculating the next occurrence for June
- **THEN** the result SHALL be 2026-06-01 (same day, it's already the first Monday)
