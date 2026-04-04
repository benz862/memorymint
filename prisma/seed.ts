import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Encode spaces in a public path so Next.js Image and browsers handle it correctly */
function imgUrl(file: string): string {
  return `/cards/birthday/${file.replace(/ /g, '%20')}`;
}

// ── Collection definitions ──────────────────────────────────────────────────
// Each entry describes one collection of birthday card images on disk.
// slugPrefix must be URL-safe. The seed auto-generates one DB record per card.
// nums: explicit list for non-sequential files; count: generates 1..count padded to 2 digits
const BIRTHDAY_COLLECTIONS = [
  // Plain numbered (1.jpg – 8.jpg, no padding)
  {
    slugPrefix: 'birthday-plain',
    name: 'Birthday',
    description: 'Classic birthday card designs.',
    files: ['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg'],
    sortBase: 0,
  },
  // Extra plain PNGs (58–61)
  {
    slugPrefix: 'birthday-extra',
    name: 'Birthday',
    description: 'Classic birthday card designs.',
    files: ['58.png','59.png','60.png','61.png'],
    sortBase: 10,
  },
  // Birthday Animals
  {
    slugPrefix: 'birthday-animals',
    name: 'Birthday Animals',
    description: 'Adorable animals celebrating in style.',
    prefix: 'Birthday Animals-', ext: 'jpeg', count: 16,
    sortBase: 100,
  },
  // Birthday Cake
  {
    slugPrefix: 'birthday-cake',
    name: 'Birthday Cake',
    description: 'Sweet celebration cake designs.',
    prefix: 'Birthday Cake-', ext: 'jpg', count: 5,
    sortBase: 120,
  },
  // Clown Birthday
  {
    slugPrefix: 'clown-birthday',
    name: 'Clown Birthday',
    description: 'Fun and colourful clown birthday cards.',
    prefix: 'Clown Birthday-', ext: 'png', count: 8,
    sortBase: 130,
  },
  // Couples Birthday
  {
    slugPrefix: 'couples-birthday',
    name: 'Couples Birthday',
    description: 'Birthday cards for couples.',
    prefix: 'Couples Birthday-', ext: 'png', count: 21,
    sortBase: 140,
  },
  // Dog Birthday
  {
    slugPrefix: 'dog-birthday',
    name: 'Dog Birthday',
    description: 'Birthday cards featuring man\'s best friend.',
    prefix: 'Dog Birthday-', ext: 'png', count: 6,
    sortBase: 165,
  },
  // Dog Nose Birthday
  {
    slugPrefix: 'dog-nose-birthday',
    name: 'Dog Nose Birthday',
    description: 'Cute dog nose birthday designs.',
    prefix: 'Dog Nose Birthday-', ext: 'png', count: 11,
    sortBase: 175,
  },
  // Grumpy Birthday
  {
    slugPrefix: 'grumpy-birthday',
    name: 'Grumpy Birthday',
    description: 'Hilariously grumpy birthday cards.',
    prefix: 'Grumpy Birthday-', ext: 'png', count: 95,
    sortBase: 200,
  },
  // Happy Birthday
  {
    slugPrefix: 'happy-birthday',
    name: 'Happy Birthday',
    description: 'Classic warm & joyful birthday cards.',
    prefix: 'Happy Birthday-', ext: 'jpeg', count: 26,
    sortBase: 400,
  },
  // Holy Cow Birthday
  {
    slugPrefix: 'holy-cow-birthday',
    name: 'Holy Cow Birthday',
    description: 'Holy cow, it\'s your birthday!',
    prefix: 'Holy Cow Birthday-', ext: 'png', count: 6,
    sortBase: 430,
  },
  // Pawsome Birthday
  {
    slugPrefix: 'pawsome-birthday',
    name: 'Pawsome Birthday',
    description: 'Have a paw-some birthday!',
    prefix: 'Pawsome Birthday-', ext: 'png', count: 10,
    sortBase: 440,
  },
] as const;

// Expand a collection entry into { slug, displayName, file } records
function expandCollection(col: any): Array<{ slug: string; displayName: string; file: string }> {
  if (col.files) {
    // Explicit file list
    return col.files.map((file: string, i: number) => ({
      slug: `${col.slugPrefix}-${String(i + 1).padStart(3, '0')}`,
      displayName: `${col.name} #${String(i + 1).padStart(3, '0')}`,
      file,
    }));
  }
  // Pattern-based: prefix + zero-padded number + ext
  return Array.from({ length: col.count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      slug: `${col.slugPrefix}-${n}`,
      displayName: `${col.name} #${n}`,
      file: `${col.prefix}${n}.${col.ext}`,
    };
  });
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Themes ──────────────────────────────────────────────────────────────
  const romanticTheme = await prisma.theme.upsert({
    where: { slug: 'romantic' },
    update: { name: 'Romantic', description: 'For anniversaries, dates, and just because.', sort_order: 1 },
    create: { name: 'Romantic', slug: 'romantic', description: 'For anniversaries, dates, and just because.', sort_order: 1 },
  });

  const birthdayTheme = await prisma.theme.upsert({
    where: { slug: 'birthday' },
    update: { name: 'Birthday', description: 'Celebrate the people you love.', sort_order: 2 },
    create: { name: 'Birthday', slug: 'birthday', description: 'Celebrate the people you love.', sort_order: 2 },
  });

  console.log('✅ Themes: Romantic, Birthday');

  // ── 2. Occasion Subtypes ───────────────────────────────────────────────────
  const romanticSubtypes = [
    'just-because','anniversary','first-date','first-kiss',
    'long-distance','i-miss-you','apology','valentines',
  ];
  for (const slug of romanticSubtypes) {
    await prisma.occasionSubtype.upsert({
      where: { theme_id_slug: { theme_id: romanticTheme.id, slug } },
      update: {},
      create: {
        theme_id: romanticTheme.id,
        name: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        slug,
      },
    });
  }

  const birthdaySubtypes = [
    { slug: 'happy-birthday',     name: 'Happy Birthday' },
    { slug: 'milestone-birthday', name: 'Milestone Birthday' },
    { slug: 'kids-birthday',      name: "Kid's Birthday" },
    { slug: 'funny-birthday',     name: 'Funny Birthday' },
    { slug: 'belated-birthday',   name: 'Belated Birthday' },
  ];
  for (const s of birthdaySubtypes) {
    await prisma.occasionSubtype.upsert({
      where: { theme_id_slug: { theme_id: birthdayTheme.id, slug: s.slug } },
      update: {},
      create: { theme_id: birthdayTheme.id, name: s.name, slug: s.slug },
    });
  }

  console.log('✅ Occasion subtypes: 8 romantic + 5 birthday');

  // ── 3. Fonts ───────────────────────────────────────────────────────────────
  const fonts = [
    { slug: 'dancing-script',  name: 'Dancing Script',   font_family: 'Dancing Script',   category: 'handwritten', sort_order: 1 },
    { slug: 'playfair',        name: 'Playfair Display',  font_family: 'Playfair Display',  category: 'serif',       sort_order: 2 },
    { slug: 'inter',           name: 'Inter',             font_family: 'Inter',             category: 'sans',        sort_order: 3 },
  ];
  for (const f of fonts) {
    await prisma.font.upsert({ where: { slug: f.slug }, update: {}, create: f });
  }

  console.log('✅ Fonts: Dancing Script, Playfair Display, Inter');

  // ── 4. Templates ───────────────────────────────────────────────────────────
  for (let i = 1; i <= 3; i++) {
    await prisma.template.upsert({
      where: { slug: `romantic-template-${i}` },
      update: {},
      create: {
        theme_id: romanticTheme.id,
        name: `Romantic ${i}`,
        slug: `romantic-template-${i}`,
        size_support_json: JSON.stringify(['4x6', '5x7']),
        cover_asset_url: '/assets/templates/cover-default.jpg',
        inside_left_default_asset_url: '/assets/templates/left-default.jpg',
        inside_right_background_asset_url: '/assets/templates/right-default.jpg',
        preview_watermark_style: 'diagonal',
      },
    });
  }

  // ── 5. Birthday Cards (all 216) ────────────────────────────────────────────
  let birthdayTotal = 0;
  for (const col of BIRTHDAY_COLLECTIONS) {
    const cards = expandCollection(col);
    for (let i = 0; i < cards.length; i++) {
      const { slug, displayName, file } = cards[i];
      const url = imgUrl(file);
      await prisma.designedCard.upsert({
        where: { slug },
        update: { name: displayName, front_image_url: url, preview_thumbnail_url: url, sort_order: (col as any).sortBase + i },
        create: {
          slug,
          name: displayName,
          category: 'birthday',
          description: (col as any).description,
          front_image_url: url,
          back_image_url: '/cards/card-back-logo.png',
          preview_thumbnail_url: url,
          sort_order: (col as any).sortBase + i,
        },
      });
      birthdayTotal++;
    }
    process.stdout.write(`  ✅ ${(col as any).name}: ${cards.length} cards\n`);
  }

  console.log(`\n✅ Birthday cards total: ${birthdayTotal}`);

  // ── 6. Anniversary Cards (Card 1.jpeg – Card 11.jpeg) ─────────────────────
  const anniversaryDescriptions = [
    'Timeless romance in every detail.',
    'Elegant blooms for a special day.',
    'Soft and intimate watercolour wash.',
    'Quiet luxury — understated and refined.',
    'Golden warmth celebrates your love.',
    'Botanical romance in full bloom.',
    'Modern minimalism with a warm heart.',
    'Classic and enduring — just like you.',
    'Rich jewel tones for a milestone year.',
    'Whimsical florals full of feeling.',
    'Bold and heartfelt — love in colour.',
  ];
  for (let i = 1; i <= 11; i++) {
    const slug = `anniversary-${String(i).padStart(3, '0')}`;
    const file = `Card ${i}.jpeg`;
    await prisma.designedCard.upsert({
      where: { slug },
      update: { name: `Anniversary #${String(i).padStart(3, '0')}`, front_image_url: `/cards/anniversary/${file}`, preview_thumbnail_url: `/cards/anniversary/${file}`, sort_order: 600 + i },
      create: { slug, name: `Anniversary #${String(i).padStart(3, '0')}`, category: 'anniversary', description: anniversaryDescriptions[i - 1], front_image_url: `/cards/anniversary/${file}`, back_image_url: '/cards/card-back-logo.png', preview_thumbnail_url: `/cards/anniversary/${file}`, sort_order: 600 + i },
    });
  }

  // ── 7. Anniversary Cards (Anniversary-01.jpeg – Anniversary-12.jpeg) ───────
  const anniversaryNewDesc = [
    'Delicate petals and golden light.','A love story written in florals.',
    'Soft hues for a tender occasion.','Warmth and grace in every detail.',
    'Romantic and richly illustrated.','Blossoms for the ones you cherish.',
    'Understated beauty, lasting love.','Lush and vibrant — celebrate big.',
    'Quiet elegance for a milestone day.','Garden-fresh with heartfelt warmth.',
    'Classic romance, timeless design.','Bold blooms for a bold love.',
  ];
  for (let i = 1; i <= 12; i++) {
    const n = String(i).padStart(2,'0');
    const slug = `anniversary-${String(i + 11).padStart(3,'0')}`;
    const file = `Anniversary-${n}.jpeg`;
    await prisma.designedCard.upsert({
      where: { slug },
      update: { name: `Anniversary #${String(i+11).padStart(3,'0')}`, front_image_url: `/cards/anniversary/${file}`, preview_thumbnail_url: `/cards/anniversary/${file}`, sort_order: 700 + i },
      create: { slug, name: `Anniversary #${String(i+11).padStart(3,'0')}`, category: 'anniversary', description: anniversaryNewDesc[i-1], front_image_url: `/cards/anniversary/${file}`, back_image_url: '/cards/card-back-logo.png', preview_thumbnail_url: `/cards/anniversary/${file}`, sort_order: 700 + i },
    });
  }

  // ── 8. Numbered Anniversary Cards (Numbered Anniversary-01.jpeg – 11.jpeg) ──
  const numberedAnnivDesc = [
    'A perfect number for a perfect love.',
    'Milestones marked with tenderness.',
    'Every year more beautiful than the last.',
    'Bold numerals, even bolder hearts.',
    'Celebrating the years with style.',
    'Time is the greatest love letter.',
    'Numbers that tell your love story.',
    'A milestone worth remembering forever.',
    'Joy written in gold for every year.',
    'Love counted in moments, not years.',
    'Here\'s to the years yet to come.',
  ];
  for (let i = 1; i <= 11; i++) {
    const n = String(i).padStart(2, '0');
    const slug = `anniversary-numbered-${n}`;
    const file = `Numbered Anniversary-${n}.jpeg`;
    await prisma.designedCard.upsert({
      where: { slug },
      update: { name: `Numbered Anniversary #${n}`, front_image_url: `/cards/anniversary/${file.replace(/ /g, '%20')}`, preview_thumbnail_url: `/cards/anniversary/${file.replace(/ /g, '%20')}`, sort_order: 800 + i },
      create: { slug, name: `Numbered Anniversary #${n}`, category: 'anniversary', description: numberedAnnivDesc[i - 1], front_image_url: `/cards/anniversary/${file.replace(/ /g, '%20')}`, back_image_url: '/cards/card-back-logo.png', preview_thumbnail_url: `/cards/anniversary/${file.replace(/ /g, '%20')}`, sort_order: 800 + i },
    });
  }

  console.log('✅ Anniversary cards: 34 total (11 Numbered Anniversary added)\n');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
