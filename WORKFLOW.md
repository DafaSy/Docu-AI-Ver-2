\# AI Development Workflow Comparison



\## Feature



\### Settings Panel for DocuAI



For this experiment, I selected a Settings Panel feature as the capstone-relevant feature.



The Settings Panel allows users to manage application preferences such as:

\- Theme selection (Light, Dark, System)

\- Language preference

\- Interface density

\- Account information

\- Workspace-related settings



The purpose of this experiment was to compare two different AI-assisted development workflows:

1\. Building a feature using a vague prompt with minimal guidance.

2\. Building the same feature using a precise engineering prompt with architecture references, constraints, and verification steps.



\---



\# Round 1 - Vague Prompt



\## Prompt Used

Buatkan settings panel untuk aplikasi ini.



\## AI Approach



The AI received minimal context and was allowed to make implementation decisions independently.



The AI:

\- Asked clarification questions about the desired Settings Panel structure.

\- Suggested a modern multi-tab modal approach.

\- Proposed sections such as Appearance \& Language, Profile \& Account, Webhook \& Delivery, Keyboard Shortcuts, and About.



The AI was not provided with:

\- Existing file references.

\- Theme architecture details.

\- Preference management rules.

\- Verification requirements.



\---



\## Implementation Result



The AI successfully created a functional Settings Panel UI.



Implemented sections included:



\- Theme selection:

&#x20; - Dark Mode

&#x20; - Light Mode

&#x20; - System Mode



\- Language selection:

&#x20; - Indonesian

&#x20; - English



\- Interface density settings.



\- Profile and account information.



\- Webhook information.



\- Keyboard shortcut documentation.



\- Application information.



The generated UI was functional and visually aligned with the application.



\---



\## Issues Found



During manual review, an issue was discovered related to theme synchronization.



The AI successfully created the Settings Panel UI, but failed to fully integrate it with the existing theme architecture.



The issue was discovered through this scenario:



1\. User selected Dark Mode from the Home Page.

2\. User navigated to the Workspace page.

3\. The Workspace page displayed Light Mode instead of maintaining the selected theme.



Expected behavior:



\- Home Page: Dark Mode

\- Workspace: Dark Mode



Actual behavior:



\- Home Page: Dark Mode

\- Workspace: Light Mode



This indicated that the AI implementation did not fully understand or reuse the existing theme management system.



\---



\## AI Mistake Identified



The main mistake was that the AI focused on generating the requested UI feature without first analyzing the existing project architecture.



The AI made assumptions about:

\- How theme state should be stored.

\- How preferences should be synchronized.

\- How different application routes should share state.



The feature worked visually, but required additional manual debugging and integration work.



\---



\# Round 2 - Precise Prompt



\## Prompt Used

You are a senior frontend engineer working on DocuAI.



Implement a Settings Panel feature.



Before coding:



Inspect the existing project architecture.

Inspect the current theme implementation.

Inspect preference management.

Identify reusable components and existing patterns.



Relevant files:



src/lib/preferences.ts

src/App.tsx

src/components/

src/pages/



Requirements:



Create a modern multi-tab Settings Panel.

Reuse the existing preference architecture.

Do not create duplicate theme state.

Theme changes must persist across Home Page and Workspace.

Support Light Mode and Dark Mode correctly.

Follow existing DocuAI UI design patterns.



Behavior:



User can change theme.

User can change language.

Preferences persist after refresh.

Navigation between pages must preserve the selected theme.



Constraints:



Do not modify unrelated files.

Do not add unnecessary dependencies.

Keep components modular.



Verification:



Review implementation.

Check edge cases.

Run lint/typecheck/build.

Confirm theme consistency across routes.



\---



\## AI Approach



In Round 2, the AI was instructed to understand the existing codebase before implementation.



The AI approach changed from direct generation into an explore-plan-code workflow.



The AI:

\- Inspected existing preference architecture.

\- Reviewed theme handling implementation.

\- Reused existing utilities instead of creating duplicate logic.

\- Considered cross-route synchronization.



\---



\## Implementation Result



The AI implemented the Settings Panel using the existing project architecture.



Key improvements:



\- Added a dedicated preference management hook:

&#x20; - `src/hooks/useWorkspacePreferences.ts`



\- Reused existing preference utilities:

&#x20; - `loadPreferences`

&#x20; - `savePreferences`

&#x20; - `readStoredPreferences`

&#x20; - `storePreferences`

&#x20; - `applyThemeToElement`



\- Integrated theme synchronization across routes.



\- Avoided duplicate theme state management.



\- Maintained compatibility with existing DocuAI UI patterns.



\---



\## Verification



The implementation was verified through:



\### TypeScript



Result:

\- Passed

\- No compilation errors



\### ESLint



Result:

\- Passed

\- No lint errors



\### Production Build



Result:

\- Passed successfully



\### Theme Persistence



Verified behavior:



\- Light Mode remains Light Mode.

\- Dark Mode remains Dark Mode.

\- Theme remains consistent when navigating between:

&#x20; - Home Page

&#x20; - Workspace

\- Theme preference persists after refresh.



\---



\# Comparison



\## Correctness



\### Round 1



The AI successfully generated a working Settings Panel.



However:

\- Theme synchronization was incomplete.

\- Existing architecture was not fully considered.

\- Additional manual debugging was required.



\### Round 2



The AI generated a more integrated implementation.



Improvements:

\- Existing preference logic was reused.

\- Theme behavior became consistent across routes.

\- The implementation matched the existing application structure.



\---



\## Architecture



\### Round 1



The AI focused mainly on UI generation.



The implementation did not initially consider:

\- Existing preference flow.

\- Theme synchronization architecture.

\- Existing reusable logic.



\### Round 2



The AI followed an architecture-first approach.



Specific differences:



\- Added:

&#x20; - `src/hooks/useWorkspacePreferences.ts`



\- Modified:

&#x20; - `src/App.tsx`

&#x20; - `src/components/PublicChrome.tsx`

&#x20; - `src/lib/preferences.ts`



The second approach produced a cleaner integration because the AI was instructed to inspect and reuse existing systems.



\---



\## Accessibility



\### Round 1



The UI was functional, but additional review was needed to ensure:

\- Consistent component usage.

\- Proper interaction behavior.

\- Compatibility with existing UI patterns.



\### Round 2



The implementation required less review because:

\- Requirements were explicitly defined.

\- Existing component patterns were considered.

\- Verification steps were included.



\---



\## Edge Cases



Important cases considered:



\- Switching theme between different routes.

\- Refreshing the application after changing preferences.

\- Maintaining consistent UI behavior between Home Page and Workspace.



Round 2 handled these cases better because they were explicitly included in the requirements.



\---



\## Review Effort



Round 1 required more manual review because the AI had to make assumptions about the codebase.



The developer needed to:

\- Identify theme synchronization issues.

\- Review preference handling.

\- Debug route-specific behavior.



Round 2 reduced review effort because:

\- The AI received project context.

\- Constraints were clearly defined.

\- Verification steps were included.



\---



\# Conclusion



This experiment demonstrated that AI output quality depends heavily on the quality of instructions provided.



A vague prompt can produce a functional feature quickly, but it may introduce architectural issues because the AI has to make assumptions.



A precise prompt with:

\- File references.

\- Technical constraints.

\- Expected behavior.

\- Verification steps.



produces a more maintainable implementation with fewer manual corrections.



The key lesson is that effective AI-assisted development is not only about generating code, but about directing AI with clear specifications, reviewing the result, and validating the implementation.

