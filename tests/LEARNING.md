# Handwriting and lesson update

Scope: handwriting validation, lesson coverage, and question audio only. Existing stage IDs and saved stars are retained. No account, server, or paid service is required.

## Recognition

`js/handwriting.js` compares individual ink segments against competing character templates, rather than assigning correctness from a whole-word resemblance score. It compensates for display aspect ratio and pen thickness, replays erasers, and requires every segment to match. A low-confidence or inseparable answer returns “uncertain”, with no immediate wrong-answer record or reward. Normal battle time still runs.

This is **not a trained handwriting OCR model** and cannot promise universal accuracy. Connected letters, overlapping Thai marks, very cursive handwriting, punctuation and multi-line sentences may need rewriting with clearer spacing. Spaces are ignored. Uppercase/lowercase shapes are normalized within the lesson alphabet. No handwritten data is uploaded by the recognizer.

Local recognition fonts: Mali and Noto Sans Thai Looped, from the Google Fonts repository, distributed with their SIL OFL licenses in `assets/fonts/`. These do not replace the UI fonts.

## Lessons and sources

- All 44 Thai consonants, 26 uppercase English letters and numbers 1–100 are covered by story stages.
- 12 additional stages: 2 Thai-letter groups, 1 English-letter group, 1 existing English-word group and 8 Thai basic-word groups.
- 80 selected Thai words: *บัญชีคำพื้นฐาน ป.1*, โรงเรียนบ้านหนองกา สพป.ประจวบคีรีขันธ์ เขต 2, pages 3–18: https://site.pkn2.go.th/fileupload/downloads/682318041.45959.pdf
- Source information is also retained on each added question. This is a selection, not the entire 708-word list or a claim of a national standardized edition.

## Reading audio

Uses the browser's Speech Synthesis voices for Thai and English. A compatible device voice is required; voice availability and pronunciation vary. The manual listen button reports unavailable voices. Device/browser voices may use their provider's network service. Math audio reads the problem only, not the answer. Speech stops on pause, exit, completion or mute. A gentle retry effect accompanies uncertain recognition.

## Regression checks

Run `node tests/learning.test.cjs` with `@napi-rs/canvas` installed or available via `NODE_PATH`.

Checks include correct and incorrect text fixtures, an independently drawn curved “61”, all digit confusions, random scribble, blank/erased ink, responsive aspect ratio, uncertain-answer integration, lesson coverage/IDs and speech text/mute. These are synthetic regression fixtures, **not a measured accuracy rate on children's handwriting**. A full-content font survey logs ambiguous shapes for visibility; it must not mark legible fixtures incorrect.
