## ADDED Requirements

### Requirement: Frontend language switching

The frontend SHALL provide runtime language switching for key user-facing pages without requiring a full page reload.

#### Scenario: User switches the active language

- **WHEN** the user changes the language from the language switcher
- **THEN** the application updates visible UI text immediately
- **AND** the selected language is persisted for the next visit

### Requirement: Locale-aware time formatting

The frontend SHALL format prompt-related dates and times using the currently active application language.

#### Scenario: User views prompt metadata in a non-default language

- **WHEN** the current application language is different from Simplified Chinese
- **THEN** prompt list and prompt detail timestamps are rendered using the active locale
