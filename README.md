# DRAW HERO

**วาด • คิด • พิชิตปีศาจ**

เกมเว็บเพื่อการเรียนรู้แนว Fantasy Drawing & Writing / Tower Defense ผู้เล่นดูโจทย์เหนือหัวศัตรู วาดหรือเขียนคำตอบบนกระดานเวทมนตร์ แล้วกด **ร่ายเวท** ระบบจะตรวจรูปทรงหรือลายมือใน Browser โดยไม่ส่งข้อมูลออกไปยัง Server

> วาดให้ถูก คิดให้ไว พิชิตทุกความรู้  
> Every line you draw is a brighter tomorrow.

## จุดเด่น

- เล่นได้ด้วย Mouse, Touch และ Stylus ผ่าน Pointer Events
- ระบบตรวจเส้น/รูปทรงด้วย Geometry
- ระบบตรวจตัวเลข ตัวอักษร และคำด้วย Canvas raster similarity
- คำยาวแบ่งให้เขียนทีละตัวอักษรโดยอัตโนมัติ
- 4 ระดับความยาก และ 5 โหมด: Story, Practice, Survival, Boss, Custom
- ตัวละคร 4 ตัว พร้อม Passive และ Ultimate Skill
- Story Map 6 โลก, คะแนน, Combo, XP, Coins และดาว 1–3 ดวง
- Creator สำหรับสร้างด่าน/คำถาม, Template Recorder และ Import/Export JSON
- บันทึกความก้าวหน้าด้วย LocalStorage พร้อม fallback ในหน่วยความจำ
- ภาพเกมต้นฉบับสไตล์ Chibi Fantasy พร้อมฉากปราสาทกลางคืน ตัวละคร และศัตรู
- Responsive สำหรับ Desktop, Tablet และ Mobile
- ไม่มี Framework, ไม่มี Build Step, ไม่มี Server และไม่มี API Key

## วิธีเล่น

1. เปิด `index.html`
2. กด **เริ่มเกม** แล้วเลือกโหมด ตัวละคร และความยาก
3. เลือกด่านหรือเนื้อหาที่ต้องการฝึก
4. ดูโจทย์เหนือหัวศัตรู แล้ววาดบนกระดานด้านล่าง
5. กด **ร่ายเวท** หากผ่านเกณฑ์ ฮีโร่จะโจมตีศัตรู
6. ใช้คำใบ้ สกิล Undo, Redo, Eraser และ Clear เมื่อจำเป็น

ในโหมดคำและวลี เกมจะแสดงช่องตัวอักษร ผู้เล่นเขียนทีละตัว เมื่อผ่านจะเลื่อนไปช่องถัดไปเอง

## เปิดแบบ Local

เปิดไฟล์ `index.html` ด้วย Chrome, Safari, Edge หรือ Browser บนมือถือได้โดยตรง ระบบหลักไม่ใช้ `fetch()` จึงทำงานผ่าน `file://` ได้

หาก Browser มีนโยบายจำกัด LocalStorage ในโหมด Local เกมจะใช้ข้อมูลในหน่วยความจำแทน และยังเล่นได้ตามปกติ เพียงแต่ข้อมูลอาจไม่คงอยู่หลังปิดหน้า

## นำขึ้น GitHub Pages

1. สร้าง GitHub Repository เช่น `draw-hero`
2. อัปโหลดไฟล์ทั้งหมดใน Folder นี้ไปยัง Branch `main`
3. เปิด **Settings → Pages**
4. เลือก **Deploy from a branch**
5. เลือก Branch `main` และ Folder `/ (root)`
6. รอ GitHub แสดง URL เช่น `https://username.github.io/draw-hero/`

ทุก Path ในโปรเจกต์เป็น Relative Path จึงรองรับ Project Pages ที่มีชื่อ Repository ต่อท้าย URL

## ผู้สร้างด่าน

เปิด `creator.html` หรือกด **ผู้สร้างด่าน** จากเมนูหลัก

Workflow:

1. สร้างคำถามในเมนู **สร้างคำถาม**
2. สร้างด่านและเลือกคำถามที่จะใช้
3. กด **Preview Stage** เพื่อทดสอบในเกมจริง
4. เปิด **Import / Export JSON** แล้วดาวน์โหลด Content Pack
5. เครื่องอื่นสามารถ Import ไฟล์เดิมกลับเข้าสู่ Creator แล้วเล่นผ่าน Custom Mode

ไฟล์ `custom-content/example-pack.json` เป็นตัวอย่าง Schema ที่พร้อม Import

### Template Recorder

กรอกตัวอักษรหรือสัญลักษณ์ วาดตัวอย่าง แล้วกด **บันทึกตัวอย่าง** 3 ครั้ง ข้อมูลภาพจะถูกเก็บใน `templates` ของ Content Pack และถูก Export ไปพร้อม JSON เพื่อรองรับการต่อยอด Recognition Engine ในอนาคต

## Content Pack Schema

ส่วนบนสุดของ Pack ต้องมี:

```json
{
  "schema": "draw-hero-content-pack",
  "schemaVersion": 1,
  "id": "my-pack",
  "name": "ชื่อ Pack",
  "questions": [],
  "stages": [],
  "templates": {}
}
```

Creator ตรวจ Schema ก่อน Import และไม่ใช้ `eval()`

## เพิ่มหรือเปลี่ยนภาพ

ตัวเกมมาพร้อมภาพต้นฉบับใน `assets/backgrounds`, `assets/characters` และ `assets/enemies` รวมทั้งมี CSS fallback เพื่อไม่ให้เกิด Broken Image ดูแนวทางเปลี่ยนภาพเพิ่มเติมใน `assets/README.md`

## โครงสร้างโปรเจกต์

```text
draw-hero/
├── index.html
├── creator.html
├── README.md
├── css/style.css
├── js/
│   ├── app.js             # Navigation และหน้าจอหลัก
│   ├── game.js            # Player/Game state
│   ├── battle.js          # Battle loop
│   ├── drawing.js         # Pointer drawing board
│   ├── recognizer.js      # Geometry + raster recognition
│   ├── characters.js      # Character data
│   ├── skills.js          # Extensible skill data
│   ├── enemies.js         # Enemy data
│   ├── levels.js          # Difficulty, worlds, level config
│   ├── content.js         # Starter questions
│   ├── storage.js         # LocalStorage fallback
│   ├── audio.js           # Web Audio effects
│   └── creator.js         # Creator / JSON tools
├── assets/
└── custom-content/example-pack.json
```

## เพิ่มเนื้อหาใน Code

Starter content อยู่ใน `js/content.js` และ Level config อยู่ใน `js/levels.js` Battle engine รับ Question/Stage object จากข้อมูล ไม่ผูกเงื่อนไขกับ Stage ID จึงเพิ่มประเภท ด่าน หรือศัตรูใหม่ได้โดยขยาย Data และ Recognition Mode ที่เกี่ยวข้อง

## Debug Mode

ตั้งค่าใน `js/app.js`:

```js
window.DRAW_HERO_DEBUG = true;
```

หน้าต่อสู้จะแสดง Recognition Score, Threshold, Question ID และรายละเอียด geometry ช่วยปรับเกณฑ์ได้ ปิดเป็น `false` สำหรับการใช้งานจริง

## Browser Support

Chrome, Edge, Safari และ Browser มือถือรุ่นปัจจุบันที่รองรับ Canvas และ Pointer Events เพลง/เสียงจะเริ่มหลังผู้ใช้ Interaction ตามนโยบายของ Browser หาก Web Audio ใช้ไม่ได้ เกมจะยังเล่นต่อโดยไม่มีเสียง
