# Changelog

All notable user-facing changes to Onihayo are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/).

## Unreleased

- A landing page that explains what Onihayo is, with one clear first step: a "Start here" button that opens the first hiragana lesson.
- Japanese text uses a Japanese system font where one is available, so kana and kanji show their Japanese forms.
- Every page has a header with the site name and main navigation, a footer, and a "Skip to main content" link for keyboard and screen reader users.
- Pages fit screens from 320 px wide and stay readable at 200 % zoom without sideways scrolling; long words and links wrap.
- Missing and unexpected pages now show a friendly way back home; unexpected errors include a reference ID without exposing internal details.
- An About page explains what Onihayo is and the learning path from zero to JLPT N5, and a Privacy page, linked from every page's footer, explains that Onihayo stores nothing about you and uses no cookies, tracking, or third parties.
- A Licences page, linked from the footer, lists every open-source package included in Onihayo with its version, licence, and full licence text. The list is generated automatically each time Onihayo is built.
- Hiragana lessons: a new Hiragana section in the main navigation lists 18 short lessons, one row of kana at a time. Each lesson shows every character large with its reading, explains how the row is pronounced, notes the characters that sound different from what their spelling suggests, and links to the next lesson.
- Hiragana practice: every lesson has a "Practise this lesson" button. You see each character of the lesson twice in random order, type its romaji, and learn straight away whether it was right; after a miss the correct reading is shown and announced to screen readers. Enter checks your answer and moves on. At the end a summary shows how many you got right and which characters to look at again. Practice runs entirely in your browser: nothing is sent or stored.
- A hiragana chart, linked from the lesson list, shows all 104 hiragana with their romaji on one page: the basic characters in the traditional grid of consonant rows and vowel columns, then those with dakuten and handakuten, then the combined sounds. The charts are real tables, so screen readers announce the row and column of every character.
- The Privacy page now says explicitly that practice answers are checked in your browser and are never sent or saved.
- Kana quiz: a new Kana quiz section in the main navigation. Pick any rows of hiragana and katakana from tiles that show every character with its romaji, or a whole group at once with "All", and practise them together. The number of selected kana is always shown, and the quiz explains when nothing is selected yet. At the end, "Change selection" brings you back with the same rows chosen. Like lesson practice, the quiz runs entirely in your browser.
- The kana quiz also offers the 12 extended katakana that loanwords use (ティ, ディ, ファ, フィ, フェ, フォ, ウィ, ウェ, ウォ, シェ, ジェ, チェ) as a "Loanword sounds" group under Katakana.
- Katakana lessons: a new Katakana section in the main navigation lists 20 short lessons, one row at a time, ending with two lessons on the sounds loanwords need. Each lesson shows every character large with its reading and notes on pronunciation. The K row lesson explains the long vowel mark ー and the T row lesson the small ッ, each with example words that use only katakana you have already met. The last hiragana lesson now leads on to katakana.
- Katakana lessons point out characters that are easy to mix up, such as シ and ツ, ソ and ン, or ク and ケ. An "Easy to mix up" section shows them side by side with their readings and explains what sets them apart, in the lesson where you meet the second one.
- In a kana quiz that mixes hiragana and katakana, each question's answer field now names the script it shows ("Romaji for this katakana").
- Katakana practice and chart: every katakana lesson has a "Practise this lesson" button that works like hiragana practice and leads on to the next lesson, and a katakana chart, linked from the lesson list, shows all 116 katakana in tables, including the loanword sounds.
