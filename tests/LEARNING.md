# Handwriting and lesson update

Scope: requested learning, practice, mobile character/boss proportions, question layout and UI depth refinements. Existing stage IDs and saved stars are retained. No account, server, or paid service is required. Character rendering still uses animated multi-view sprites, not real 3D meshes.

## Recognition

`js/handwriting.js` compares individual ink segments against competing character templates, rather than assigning correctness from a whole-word resemblance score. It compensates for display aspect ratio and pen thickness, replays erasers, and requires every segment to match. A low-confidence or inseparable answer returns “uncertain”, with no immediate wrong-answer record or reward. Normal battle time still runs.

Similar shapes are accepted with a small competing-template tolerance; stroke count and drawing order are not checked. This is **not a trained handwriting OCR model** and cannot promise universal accuracy. Connected letters, overlapping Thai marks, very cursive handwriting, punctuation and multi-line sentences may need rewriting with clearer spacing. Spaces are ignored. Uppercase/lowercase use the lesson alphabet. No handwritten data is uploaded by the recognizer.

Borderline glyphs are retried with bounded rotation (±10°), shear and width adjustments against both the expected character and its strongest competitors. Nearby Thai vowel/tone variants are compared explicitly. Ambiguous readings do not immediately record a mistake. Pointer input follows one active pointer and includes coalesced movement samples when available; this prevents a second simultaneous touch from corrupting the active pen stroke, but is not full palm rejection.

Local recognition fonts: Mali and Noto Sans Thai Looped, from the Google Fonts repository, distributed with their SIL OFL licenses in `assets/fonts/`. These do not replace the UI fonts.

## Lessons and sources

- All 44 Thai consonants in order, 26 uppercase and 26 lowercase English letters and numbers 1–100 are covered by stages. All four worlds and their stages are selectable immediately.
- Word lists are divided into P1–P6 for both languages, with category/grade filters and 24-stage pagination. Source tokens with unsupported punctuation/ambiguous extraction were omitted: coverage of all six grades is not a claim to reproduce every entry of every official edition.
- Thai extracted counts by grade: 690, 1077, 1195, 997, 997, 847. Source collection: https://www.spcvedu.com/academic/thai_words_1-6/ . P4–P6 documents include new lesson words and words pupils should know, not solely the same basic-list series as P1–P3.
- English extracted counts by grade: 155, 156, 154, 254, 253, 249. Source: *คำศัพท์ภาษาอังกฤษพื้นฐาน ระดับชั้นประถมศึกษา*, English Language Institute, November 2559: https://drive.google.com/file/d/1ltUGCqyQb5-jcM_LbzWPR70FOY_55pZj/view . Multi-line and ambiguous entries are excluded.
- 576 additional arithmetic questions across six grades: addition, non-negative subtraction, multiplication, exact division and missing operands. Mixed stages interleave the four operations. Grade bands are game difficulty bands, not a claim of complete curriculum alignment.
- 80 selected Thai words: *บัญชีคำพื้นฐาน ป.1*, โรงเรียนบ้านหนองกา สพป.ประจวบคีรีขันธ์ เขต 2, pages 3–18: https://site.pkn2.go.th/fileupload/downloads/682318041.45959.pdf
- Source information is also retained on each added question. This is a selection, not the entire 708-word list or a claim of a national standardized edition.

## Reading audio

Uses the browser's Speech Synthesis voices for Thai and English. A compatible device voice is required; voice availability and pronunciation vary. The manual listen button reports unavailable voices. Device/browser voices may use their provider's network service. Math audio reads the problem only, not the answer. Speech stops on pause, exit, completion or mute. A gentle retry effect accompanies uncertain recognition.

## Practice

Thai/English letters and numbers have faint practice frames and optional guide shapes. Both guided and unguided practice now use the same character classifier as battle; tracing proximity alone neither grants a pass nor rejects a legible alternative style. Substantial out-of-frame ink is still rejected. Arithmetic never displays an answer trace. Unlimited time is available; enemies approach in practice without removing hearts. Frames measure placement, not linguistic stroke order.

## Regression checks

Run `node tests/learning.test.cjs` with `@napi-rs/canvas` installed or available via `NODE_PATH`.

Also run `node tests/handwriting-variation.test.cjs` for 126 tilted/sheared/narrow/wide fixtures, three independently drawn loop sizes and 48 wrong-answer controls. `node tests/browser-smoke.test.cjs` uses Playwright and Chrome against a running local server (`DRAW_HERO_TEST_URL`, default localhost:8765); it checks navigation and browser recognition at desktop, tablet and phone viewport sizes with isolated saves. Layout overflow is reported, not silently treated as a passing layout assertion.

Checks include correct and incorrect text fixtures, an independently drawn curved “61”, all digit confusions, random scribble, blank/erased ink, responsive aspect ratio, uncertain-answer integration, lesson coverage/IDs and speech text/mute. These are synthetic regression fixtures, **not a measured accuracy rate on children's handwriting**. A full-content font survey logs ambiguous shapes for visibility; it must not mark legible fixtures incorrect.
