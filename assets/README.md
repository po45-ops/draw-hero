# Asset guide

DRAW HERO includes original moonlit castle, hero, and enemy artwork generated specifically for this project. The game still retains CSS fallbacks, so missing optional files never break gameplay and the project remains fully offline-capable.

Current production assets:

- `backgrounds/moonlit-castle.jpg`: shared moonlit castle environment
- `characters/hero-lineup.png`: transparent four-hero sprite source
- `enemies/enemy-lineup.png`: transparent enemy sprite source

Additional art can be added to these folders later:

- `characters/`: `es_idle.png`, `es_battle.png`, `kai_idle.png`, `leen_idle.png`, `mimi_idle.png`
- `enemies/`: `goblin.png`, `skeleton.png`, `orc.png`, `shadow.png`, `ghost.png`, `armored_demon.png`, `boss_demon.png`
- `backgrounds/`: `village-night.webp`, `forest-night.webp`, `desert-night.webp`, `language-tower.webp`, `ice-city.webp`, `demon-castle.webp`
- `ui/`, `effects/`, `icons/`, `sounds/`: optional UI and audio replacements

Keep assets optimized for the web. PNG or WebP with transparent backgrounds is recommended for sprites. Preserve relative paths so GitHub Pages continues to work from a project subfolder.
# ชุดภาพตัวละครหลายมุม

ไฟล์ใน `characters/3d` และ `enemies/3d` เป็น Sprite Sheet โปร่งใสขนาด 4 × 4 ช่อง:

- แถว 1–2: มุมมองรอบตัว 8 ทิศ
- แถว 3: ท่ายืน 2 เฟรม และท่าวิ่ง 2 เฟรม
- แถว 4: ท่าโจมตี 2 เฟรม และท่าปล่อยพลัง 2 เฟรม

หน้าเลือกตัวละครใช้ภาพ 8 ทิศเป็นมุมมอง 360° แบบเบาเครื่อง ส่วนฉากต่อสู้สลับเฟรมท่าทางตามเหตุการณ์ในเกม
