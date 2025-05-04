## Project Description: AI-Assisted Translation Tool (Local-First, Web-Ready)

**Overview:**
This is a Vue-based application designed for **local-first translation workflows**. Users can load a text file, segment it into manageable units, and work through the translation process with the aid of AI services. The tool displays translation comparisons, allows manual edits, and tracks progress and key translation decisions—all saved to local files. The architecture is designed to be **web-app ready** for future backend integration.

---

### Core Features:

1. **File Input & Smart Segmenting:**

    * Users select a **local text file** for translation.
    * **Automatic segmenting:**

        * Default: Segments are entire paragraphs (`\n\n`).
        * If a paragraph exceeds a configurable word limit (e.g., 300 words), it is **further split into sentences** or smaller chunks based on a configurable word count (e.g., \~50–100 words per segment).
    * Users can **override auto-segmentation** by manually selecting text within the document as the **current segment** to work on.
    * Segments are indexed and stored for tracking.

2. **Translation Requests:**

    * Each segment can be sent to **multiple AI translation APIs** (via fetch/XHR).
    * Each API has:

        * A configurable prompt template.
        * Customizable API settings (stored locally, e.g., in a JSON config).
    * The system fetches and displays translation results side by side.

3. **3-Pane Translation Workspace:**

    * **Pane 1:** Original text segment (read-only).
    * **Pane 2:** Diff view showing differences between:

        * The AI-generated translations.
        * Prior translation versions (if applicable).
    * **Pane 3:** Editable translation field where the user can:

        * Manually translate.
        * Accept/merge AI suggestions.
        * Save the final translation.

4. **Translation Workflow & Tracking:**

    * Each segment has a **status:**

        * Unprocessed.
        * AI-generated (awaiting user review).
        * Finalized (marked as complete).
    * The app **tracks progress locally** (e.g., in a JSON file), including:

        * Segment text.
        * Translation state.
        * Metadata (timestamp, chosen translation).

5. **Next Segment Navigation & Manual Control:**

    * After a segment is marked as translated, the app automatically:

        * Saves the result.
        * Loads the next segment in line.
    * Users can **manually jump between segments** or **highlight/select text** within the document to set a **custom "current segment"** for translation.

6. **Translation Memory & History:**

    * After finalizing a segment, the tool:

        * Sends a request to an AI service to analyze and **extract key terms/choices.**
        * Logs translation decisions in a **local history file** for future consistency checks.

7. **Local-First Data Storage:**

    * All files (source text, translation progress, history/memory) are saved **locally.**
    * Optionally, users can **reload previous sessions** by opening their saved progress files.

---

### Architecture & Design Considerations:

* **Tech Stack:**

    * **Vue 3 + Composition API + TypeScript** (for type safety, maintainability, and modern reactive design).
    * **Local file handling:**

        * Use the File System Access API (modern browsers) or download/upload JSON files as a fallback.
    * **API Calls:**

        * Use native fetch/XHR to interact with AI translation services.
        * Abstract API logic to make it easy to swap services or move to a backend later.

* **TypeScript:**

    * **Strict typing across the codebase** for better developer experience and fewer runtime errors.
    * **Type-safe interfaces and models** for segments, translation results, progress tracking, and API configurations.
    * Integration of **type-checked API call wrappers** to ensure reliable communication with AI services.

* **Planned Extensibility:**

    * **Backend-ready:** The app is designed to make it simple to plug in a backend (e.g., Node.js, Django) later for:

        * User auth.
        * Cloud storage.
        * Collaborative workflows.
    * **UI:** Designed to handle larger files and longer sessions, with pagination or virtual scrolling as needed.

---

### Potential Future Enhancements:

* **Glossary/Termbase:**
  Build a side panel to manage key terms and ensure consistent translation across documents.

* **Collaboration Support:**
  Add user roles, shared sessions, and live editing (once a backend is introduced).

* **Advanced Diff Tools:**
  Let users highlight differences between machine translations and manual edits more granularly (e.g., word-by-word).
