# Requirements Document

## Introduction

This feature adds an interactive quiz and practice mode to the AWS DOP-C02 DevOps Engineer Professional static study guide site. The quiz is implemented entirely within the Docusaurus 3.10.1 framework as client-side React components embedded in MDX pages — no backend, no database, and no external services. Users can practice exam-style multiple-choice questions filtered by domain, track their session progress in browser memory, and review explanations after answering. A question data file (`src/data/questions.ts`) provides all question content, answer choices, correct answers, and domain metadata derived from the existing cross-reference index.

## Glossary

- **Quiz**: The interactive practice mode that presents multiple-choice questions to the user one at a time.
- **Question**: A single exam-style multiple-choice item with a stem, four answer choices (A–D), a correct answer letter, a domain label, and an explanation.
- **Question Data File**: The TypeScript file `src/data/questions.ts` that exports the full array of question objects used by all quiz components.
- **QuizPage**: The dedicated Docusaurus page at `/quiz` (implemented as `src/pages/quiz.tsx`) that hosts the full quiz experience.
- **QuizWidget**: A lightweight React component embeddable in any MDX doc page that presents a small subset of questions relevant to that domain.
- **Session**: A single uninterrupted quiz run from the first question to the last, held in React component state (not persisted across page reloads unless localStorage is used).
- **Domain**: One of the six DOP-C02 exam domains: SDLC Automation, Configuration Management and IaC, Resilient Cloud Solutions, Monitoring and Logging, Incident and Event Response, Security and Compliance.
- **Score**: The count of correct answers divided by the total questions answered in a session, expressed as a percentage.
- **Explanation**: The rationale for the correct answer, stored in the Question Data File and displayed after the user submits an answer.
- **localStorage**: The browser's Web Storage API used to persist quiz progress across page reloads within the same browser session.
- **QuizProvider**: A React context provider that manages shared quiz state (current question index, answers, score) for the QuizPage.

---

## Requirements

### Requirement 1 — Question Data File

**User Story:** As a developer maintaining the study guide, I want all question content stored in a single typed TypeScript file, so that quiz components have a single source of truth that is easy to update and type-check.

#### Acceptance Criteria

1. THE Question Data File SHALL export a TypeScript array named `questions` typed as `ReadonlyArray<Question>`.
2. THE Question Data File SHALL define a `Question` interface with the fields: `id` (number), `domain` (string union of the six domain names), `stem` (string), `choices` (object with keys A, B, C, D each mapping to a string), `answer` (literal union `'A' | 'B' | 'C' | 'D'`), and `explanation` (string).
3. THE Question Data File SHALL include at least one representative question per domain as placeholder content, with a comment indicating where the full 360-question set is to be populated.
4. WHEN the Docusaurus TypeScript build runs (`yarn typecheck`), THE Question Data File SHALL produce zero TypeScript errors.
5. THE Question Data File SHALL be located at `src/data/questions.ts` within the project root.

---

### Requirement 2 — Quiz Page

**User Story:** As a student preparing for the DOP-C02 exam, I want a dedicated quiz page accessible from the site navigation, so that I can practice questions without leaving the study guide.

#### Acceptance Criteria

1. THE QuizPage SHALL be implemented as a Docusaurus page at `src/pages/quiz.tsx` and served at the `/quiz` route.
2. THE QuizPage SHALL render a domain filter control that lists all six exam domains plus an "All Domains" option.
3. WHEN the user selects a domain filter and starts a quiz, THE QuizPage SHALL present only questions whose `domain` field matches the selected filter (or all questions when "All Domains" is selected).
4. THE QuizPage SHALL display questions one at a time in the order they appear in the filtered question set.
5. THE QuizPage SHALL display a progress indicator showing the current question number and total question count for the active session (e.g., "Question 3 of 47").
6. THE QuizPage SHALL display the question stem and all four answer choices (A, B, C, D) for each question.
7. WHEN the user selects an answer choice and submits, THE QuizPage SHALL immediately reveal whether the choice was correct or incorrect using distinct visual styling.
8. WHEN the user submits an answer, THE QuizPage SHALL display the explanation text for that question.
9. WHEN the user submits an answer, THE QuizPage SHALL display a "Next" button to advance to the following question.
10. WHEN the user reaches the last question and submits an answer, THE QuizPage SHALL display a session summary showing the final score as a percentage and the count of correct and incorrect answers.
11. THE QuizPage SHALL display a "Restart" button on the session summary screen that resets the session to the first question with the same domain filter applied.
12. WHILE a quiz session is active, THE QuizPage SHALL prevent the user from changing their submitted answer for a question already answered.

---

### Requirement 3 — Quiz Widget (Inline Domain Practice)

**User Story:** As a student reading a domain doc page, I want to practice a few questions relevant to that domain without navigating away, so that I can test my understanding in context.

#### Acceptance Criteria

1. THE QuizWidget SHALL be a React component exported from `src/components/QuizWidget/index.tsx` that accepts a `domain` prop (one of the six domain names) and an optional `maxQuestions` prop (number, default 5).
2. WHEN rendered with a `domain` prop, THE QuizWidget SHALL randomly sample up to `maxQuestions` questions from the Question Data File whose `domain` field matches the provided prop.
3. THE QuizWidget SHALL present questions one at a time with the same answer-reveal and explanation behavior as the QuizPage.
4. WHEN the QuizWidget session ends, THE QuizWidget SHALL display the score and a "Try Again" button that re-samples a new random set of questions for the same domain.
5. THE QuizWidget SHALL be usable inside any MDX doc file by importing and rendering the component inline.
6. IF the Question Data File contains fewer questions for a domain than `maxQuestions`, THEN THE QuizWidget SHALL present all available questions for that domain without error.

---

### Requirement 4 — Answer State and Session Persistence

**User Story:** As a student who may accidentally reload the page mid-quiz, I want my in-progress quiz session to survive a page reload, so that I do not lose my progress.

#### Acceptance Criteria

1. WHEN the user starts a quiz session on the QuizPage, THE QuizPage SHALL serialize the session state (current question index, all submitted answers, domain filter) to `localStorage` under a key namespaced to the feature (e.g., `dop-c02-quiz-session`).
2. WHEN the QuizPage loads and a serialized session exists in `localStorage`, THE QuizPage SHALL restore the session to the question the user was on before the reload.
3. WHEN the user completes a session or clicks "Restart", THE QuizPage SHALL clear the session entry from `localStorage`.
4. IF `localStorage` is unavailable (e.g., private browsing with storage blocked), THEN THE QuizPage SHALL fall back to in-memory state only and SHALL NOT throw an unhandled error.
5. THE QuizWidget SHALL NOT use `localStorage`; QuizWidget state SHALL be held in React component state only and reset on unmount.

---

### Requirement 5 — Scoring and Results Display

**User Story:** As a student finishing a practice session, I want to see a clear summary of my performance broken down by domain, so that I know which areas need more study.

#### Acceptance Criteria

1. THE QuizPage session summary SHALL display the overall score as both a raw fraction (e.g., "38 / 47") and a percentage rounded to the nearest whole number.
2. WHERE the session used the "All Domains" filter, THE QuizPage session summary SHALL display a per-domain breakdown table showing the number correct and total attempted for each domain that had at least one question in the session.
3. THE QuizPage session summary SHALL visually distinguish scores below 72% (the approximate passing threshold) from scores at or above 72% using distinct color or iconography consistent with the site's Infima CSS theme.
4. THE QuizPage session summary SHALL include a link to the relevant domain doc page for each domain where the user scored below 72%, using the existing Docusaurus internal link format.

---

### Requirement 6 — Accessibility and Theme Compatibility

**User Story:** As a student using the site in dark mode or with keyboard navigation, I want the quiz components to be fully usable, so that the quiz experience is consistent with the rest of the study guide.

#### Acceptance Criteria

1. THE QuizPage and QuizWidget SHALL apply Docusaurus Infima CSS variables for all colors so that both light and dark themes are supported without additional CSS overrides.
2. THE QuizPage and QuizWidget SHALL render all interactive controls (answer choices, submit button, next button) as native `<button>` elements or `<input type="radio">` elements so that keyboard navigation and screen readers work without custom ARIA roles.
3. WHEN an answer choice is selected, THE QuizPage and QuizWidget SHALL move focus to the submit button so that keyboard-only users can submit without additional tab presses.
4. THE QuizPage and QuizWidget SHALL provide visible focus indicators on all interactive elements that meet WCAG 2.1 AA contrast requirements against both the light and dark Infima themes.
5. THE QuizPage and QuizWidget SHALL not rely on color alone to convey correct/incorrect state; each state SHALL also include a text label or icon with an accessible text alternative.

---

### Requirement 7 — Navigation Integration

**User Story:** As a student browsing the study guide, I want to find the quiz easily from the top navigation bar, so that I can start practicing without hunting for a link.

#### Acceptance Criteria

1. THE Docusaurus site configuration (`docusaurus.config.ts`) SHALL include a navbar item linking to `/quiz` with the label "Practice Quiz".
2. THE navbar quiz link SHALL be positioned to the right of the existing "Domains" sidebar link.
3. WHEN the user is on the `/quiz` route, THE navbar quiz link SHALL render in the active state consistent with Docusaurus navbar behavior for page links.

---

### Requirement 8 — Static Build Compatibility

**User Story:** As the site owner deploying to a static host, I want the quiz feature to build successfully with `yarn build`, so that the site can be deployed without a server.

#### Acceptance Criteria

1. WHEN `yarn build` is executed, THE quiz components SHALL produce no build errors and no TypeScript errors.
2. THE quiz components SHALL use the `useEffect` hook or equivalent guard to access `localStorage` and `window` only on the client side, preventing server-side rendering errors during the Docusaurus static build.
3. THE QuizPage SHALL be excluded from Docusaurus's docs sidebar and SHALL NOT appear in the `studyGuide` sidebar defined in `sidebars.ts`.
4. WHEN `yarn build` is executed, THE static output in `build/quiz/index.html` SHALL exist and SHALL contain the quiz page markup.
