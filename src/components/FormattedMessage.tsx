'use client';

import React, { useMemo } from 'react';

interface FormattedMessageProps {
    content: string;
    className?: string;
}

interface TableData {
    headers: string[];
    rows: string[][];
}

interface ParseResult {
    beforeTable: string;
    table: TableData | null;
    afterTable: string;
}

// INLINE FORMATTERS — Phone, Email, URL, Address, Bold, Numbers

// Render inline formatted segments (links, bold, numbers, etc.)
function renderInlineFormatted(text: string): React.ReactNode[] {
    if (!text) return [];

    // Combined regex for all inline patterns
    // Order matters: more specific patterns first
    const inlinePattern = new RegExp(
        [
            // Phone: +62xxx, 08xxx, 021-xxx, (021) xxx
            `((?:\\+62|62|0)(?:\\s?|-?)\\d{2,4}(?:\\s?|-?)\\d{3,4}(?:\\s?|-?)\\d{3,5})`,
            // Email
            `([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`,
            // URL with protocol
            `(https?://[^\\s,;)]+)`,
            // URL without protocol (domain.tld pattern)
            `((?:www\\.)?[a-zA-Z0-9-]+\\.(?:com|co\\.id|id|org|net|io|dev|info|biz)(?:/[^\\s,;)]*)?)`,
            // Bold **text** or __text__
            `\\*\\*([^*]+)\\*\\*`,
            `__([^_]+)__`,
        ].join('|'),
        'gi'
    );

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlinePattern.exec(text)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
            nodes.push(text.substring(lastIndex, match.index));
        }

        const [fullMatch, phone, email, urlWithProtocol, urlWithout, bold1, bold2] = match;

        if (phone) {
            // Normalize phone for href
            const cleanPhone = phone.replace(/[\s()-]/g, '');
            const isWA = /^(\+?62|0)8/.test(cleanPhone);
            const waNumber = cleanPhone.replace(/^0/, '62').replace(/^\+/, '');

            nodes.push(
                <a
                    key={`phone-${match.index}`}
                    href={isWA ? `https://wa.me/${waNumber}` : `tel:${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-400/40 hover:decoration-emerald-300/60 transition-colors"
                >
                    {isWA ? (
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    )}
                    {phone}
                </a>
            );
        } else if (email) {
            nodes.push(
                <a
                    key={`email-${match.index}`}
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline underline-offset-2 decoration-sky-400/40 hover:decoration-sky-300/60 transition-colors"
                >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {email}
                </a>
            );
        } else if (urlWithProtocol) {
            nodes.push(
                <a
                    key={`url-${match.index}`}
                    href={urlWithProtocol}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline underline-offset-2 decoration-sky-400/40 hover:decoration-sky-300/60 transition-colors"
                >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {urlWithProtocol.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
            );
        } else if (urlWithout) {
            nodes.push(
                <a
                    key={`url2-${match.index}`}
                    href={`https://${urlWithout}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline underline-offset-2 decoration-sky-400/40 hover:decoration-sky-300/60 transition-colors"
                >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {urlWithout}
                </a>
            );
        } else if (bold1 || bold2) {
            nodes.push(
                <strong key={`bold-${match.index}`} className="font-semibold text-white">
                    {bold1 || bold2}
                </strong>
            );
        } else {
            nodes.push(fullMatch);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Remaining text
    if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex));
    }

    return nodes.length > 0 ? nodes : [text];
}

// WORD-TO-NUMBER CONVERSION — for non-price contexts

function convertWordNumbers(text: string): string {
    // Convert Indonesian word numbers to digits in non-price contexts
    // e.g. "dua ratus proyek" → "200 proyek", "sembilan puluh lima persen" → "95%"

    const nums: Record<string, number> = {
        'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
        'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
        'sebelas': 11, 'se': 1,
    };

    // "X persen" → "X%"
    text = text.replace(
        /\b((?:se(?:ratus|puluh|belas)?|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas)(?:\s+(?:ratus|puluh|belas|ribu|juta)(?:\s+(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan))?)*)\s+persen\b/gi,
        (_, numWords) => {
            const n = parseIndonesianNumber(numWords, nums);
            return n > 0 ? `${n}%` : `${numWords} persen`;
        }
    );

    // "X tahun" / "X proyek" / "X klien" etc. (common non-price units)
    const nonPriceUnits = ['tahun', 'bulan', 'hari', 'jam', 'menit', 'proyek', 'project', 'klien', 'client', 'karyawan', 'orang', 'unit', 'cabang', 'kantor', 'negara', 'kota'];
    const unitPattern = new RegExp(
        `\\b((?:se(?:ratus|puluh|belas)?|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas)(?:\\s+(?:ratus|puluh|belas|ribu|juta)(?:\\s+(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan))?)*)\\s+(${nonPriceUnits.join('|')})\\b`,
        'gi'
    );

    text = text.replace(unitPattern, (_, numWords, unit) => {
        const n = parseIndonesianNumber(numWords, nums);
        return n > 0 ? `${n.toLocaleString('id-ID')} ${unit}` : `${numWords} ${unit}`;
    });

    return text;
}

function parseIndonesianNumber(words: string, nums: Record<string, number>): number {
    const w = words.toLowerCase().trim();

    // Direct lookup
    if (nums[w] !== undefined) return nums[w];

    let total = 0;
    let current = 0;

    const tokens = w.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token === 'ribu') {
            total += (current || 1) * 1000;
            current = 0;
        } else if (token === 'juta') {
            total += (current || 1) * 1000000;
            current = 0;
        } else if (token === 'ratus') {
            current = (current || 1) * 100;
        } else if (token === 'puluh') {
            current = (current || 1) * 10;
        } else if (token === 'belas') {
            current = current + 10;
        } else if (token === 'seratus') {
            current = 100;
        } else if (token === 'seribu') {
            total += 1000;
            current = 0;
        } else if (token === 'sejuta') {
            total += 1000000;
            current = 0;
        } else if (token === 'sebelas') {
            current = 11;
        } else if (token === 'sepuluh') {
            current = 10;
        } else if (nums[token] !== undefined) {
            current += nums[token];
        }
    }

    return total + current;
}

// SCHEDULE / OPERATING HOURS PARSER

interface ScheduleEntry {
    days: string;
    hours: string;
}

function parseSchedule(text: string): { schedules: ScheduleEntry[]; remaining: string } | null {
    const dayNames = 'Senin|Selasa|Rabu|Kamis|Jumat|Jum\'at|Sabtu|Minggu';

    // Pattern: "Hari Senin-Jumat pukul 09.00-17.00" or "Senin sampai Jumat pukul 09.00 sampai 17.00"
    const schedulePattern = new RegExp(
        `(?:hari\\s+)?((?:${dayNames})(?:\\s*(?:sampai|hingga|s\\/d|s\\.d\\.|-)\\s*(?:${dayNames}))?)\\s*(?:pukul|jam|pkl|pk|:)?\\s*(\\d{1,2}[.:][\\d]{2}\\s*(?:WIB|WITA|WIT|wib)?\\s*(?:sampai|hingga|s\\/d|s\\.d\\.|-)\\s*\\d{1,2}[.:][\\d]{2}\\s*(?:WIB|WITA|WIT|wib)?)`,
        'gi'
    );

    const schedules: ScheduleEntry[] = [];
    let remaining = text;

    let match;
    while ((match = schedulePattern.exec(text)) !== null) {
        schedules.push({
            days: match[1].trim(),
            hours: match[2].trim().replace(/\./g, ':'),
        });
    }

    if (schedules.length === 0) return null;

    // Remove matched schedule text from remaining
    remaining = text.replace(schedulePattern, '').replace(/\s{2,}/g, ' ').trim();
    // Clean up trailing "dan" or commas
    remaining = remaining.replace(/,?\s*dan\s*,?/g, ' ').replace(/\.\s*\./g, '.').trim();

    return { schedules, remaining };
}

// ADDRESS PARSER

function parseAddress(text: string): { address: string; mapsUrl: string } | null {
    // Match Indonesian address patterns
    const addressPattern = /(?:(?:beralamat|berlokasi|berada)\s+(?:di|pada)\s+|(?:alamat(?:nya)?|lokasi(?:nya)?)\s*(?:di|:)\s*)((?:Jl\.|Jln\.|Jalan|Gg\.|Gang|Komp\.|Komplek|Perumahan|Ruko|Gedung|Tower|Lt\.|Lantai)[\s\S]{10,120}?(?:\d{5}|(?:Jakarta|Bandung|Surabaya|Semarang|Yogyakarta|Medan|Makassar|Bali|Tangerang|Bekasi|Bogor|Depok)[\w\s]*?))/i;

    const match = text.match(addressPattern);
    if (!match) return null;

    const address = match[1].trim().replace(/\.\s*$/, '');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    return { address, mapsUrl };
}

// LIST / BULLET POINT PARSER

function parseListItems(text: string): string[] | null {
    // Check for markdown-style lists: "- item" or "* item" or "1. item"
    const mdListPattern = /(?:^|\n)\s*(?:[-*•]|\d+[.)]\s)\s*(.+)/g;
    const mdItems: string[] = [];
    let m;
    while ((m = mdListPattern.exec(text)) !== null) {
        mdItems.push(m[1].trim());
    }
    if (mdItems.length >= 2) return mdItems;

    // Check for comma-separated lists with keywords like "meliputi", "antara lain", "yaitu"
    const listKeywordPattern = /(?:meliputi|antara lain|yaitu|seperti|diantaranya|di antaranya|termasuk|berupa|mencakup)\s*:?\s*(.+)/i;
    const listMatch = text.match(listKeywordPattern);
    if (listMatch) {
        const listPart = listMatch[1].trim();
        // Split by comma, "dan", or "serta"
        const items = listPart
            .split(/\s*(?:,|;)\s*|\s+(?:dan|serta|maupun)\s+/i)
            .map(item => item.trim().replace(/\.$/, ''))
            .filter(item => item.length > 1 && item.length < 120);

        if (items.length >= 3) return items;
    }

    return null;
}


// PRICE TABLE PARSERS (existing logic, refactored)

// STRATEGY 1: Transition words pattern
function parseTransitionPattern(text: string): ParseResult {
    const transitionWords = [
        'Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima',
        'Keenam', 'Ketujuh', 'Kedelapan', 'Kesembilan', 'Kesepuluh',
        'Yang terakhir', 'Terakhir', 'Selanjutnya'
    ];

    const pattern = new RegExp(
        `(${transitionWords.join('|')}),\\s*`,
        'gi'
    );

    const hasPrice = /(?:Rp\.?|rupiah|ribu|juta|\d+\.?\d*\s*(?:rupiah|ribu))/i.test(text);
    const hasTransitions = pattern.test(text);

    if (!hasPrice || !hasTransitions) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    pattern.lastIndex = 0;
    const firstMatch = text.search(pattern);
    if (firstMatch === -1) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const beforeTable = text.substring(0, firstMatch).trim();
    const listSection = text.substring(firstMatch);

    const splits = listSection.split(pattern).filter(s =>
        s.trim() && !transitionWords.some(tw => tw.toLowerCase() === s.trim().toLowerCase())
    );

    if (splits.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const items: string[] = [];
    splits.forEach(item => {
        const trimmed = item.trim();
        if (trimmed && /(?:Rp\.?|rupiah|ribu|juta|\d)/i.test(trimmed)) {
            items.push(trimmed);
        }
    });

    if (items.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const rows: string[][] = [];
    let afterTable = '';

    items.forEach((item, index) => {
        const pricePatterns = [
            /(.+?)\s+seharga\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+dengan harga\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+harga(?:nya)?\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+(?:senilai|sebesar)\s+(.+?)(?:\.\s*|$)/i,
        ];

        let matched = false;
        for (const pricePattern of pricePatterns) {
            const match = item.match(pricePattern);
            if (match) {
                const description = match[1].trim();
                const price = match[2].trim().replace(/\.\s*$/, '');
                const nameSpec = splitNameAndSpecs(description);
                rows.push([nameSpec.name, nameSpec.specs, formatPrice(price)]);
                matched = true;
                break;
            }
        }

        if (!matched && index === items.length - 1) {
            afterTable = item;
        } else if (!matched) {
            rows.push([item, '', '']);
        }
    });

    if (rows.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const lastSplit = splits[splits.length - 1];
    const sentences = lastSplit.split(/\.\s+/);
    if (sentences.length > 1) {
        const possibleAfter = sentences.slice(1).join('. ').trim();
        if (possibleAfter && !/seharga|harga|rupiah|ribu/i.test(possibleAfter)) {
            afterTable = possibleAfter;
        }
    }

    return {
        beforeTable,
        table: { headers: ['Produk', 'Spesifikasi', 'Harga'], rows },
        afterTable,
    };
}

// STRATEGY 2: Colon-separated pattern
function parseColonPattern(text: string): ParseResult {
    const hasPrice = /(?:Rp\.?|rupiah|ribu|juta|\d+\.?\d*\s*(?:rupiah|ribu))/i.test(text);
    if (!hasPrice) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const colonItemPattern = /([A-Z][A-Za-z\s/()]+?):\s*((?:Mulai dari|Rp\.?|Harga|Biaya|\d).+?)(?=\.\s+[A-Z]|\.\s*$|$)/g;

    const items: { name: string; detail: string }[] = [];
    let match;
    let lastIndex = 0;
    let beforeTable = '';

    const firstColonMatch = text.match(/([A-Z][A-Za-z\s/()]+?):\s*(?:Mulai dari|Rp\.?|Harga|Biaya|\d)/);
    if (firstColonMatch && firstColonMatch.index !== undefined) {
        beforeTable = text.substring(0, firstColonMatch.index).trim();
    }

    while ((match = colonItemPattern.exec(text)) !== null) {
        const name = match[1].trim();
        const detail = match[2].trim().replace(/\.\s*$/, '');

        if (name.length > 3 && name.length < 80 && detail.length > 5) {
            items.push({ name, detail });
        }
        lastIndex = colonItemPattern.lastIndex;
    }

    if (items.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    let afterTable = '';
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText && !/:\s*(?:Mulai dari|Rp)/i.test(remainingText)) {
        afterTable = remainingText.replace(/^\.\s*/, '');
    }

    const rows = items.map(item => {
        const priceMatch = item.detail.match(
            /(.*?)\s*((?:Mulai dari\s+)?(?:\d[\d.,]*\s*(?:ribu|juta|ratus)?(?:\s+\w+)*\s*(?:rupiah)?|Rp\.?\s*[\d.,]+)(?:\s*(?:per|untuk)\s+\w+(?:\s+\w+)*)?)/i
        );

        if (priceMatch) {
            const price = extractPriceFromDetail(item.detail);
            const extra = extractExtraInfo(item.detail);
            return [item.name, extra, price];
        }

        return [item.name, item.detail, ''];
    });

    return {
        beforeTable,
        table: { headers: ['Layanan', 'Keterangan', 'Harga'], rows },
        afterTable,
    };
}

// STRATEGY 3: Sentence-based list with price
function parseSentencePattern(text: string): ParseResult {
    const sentences = text.split(/\.\s+/);
    const priceItems: { name: string; detail: string; price: string }[] = [];
    const beforeParts: string[] = [];
    const afterParts: string[] = [];
    let foundPrice = false;
    let doneWithPrices = false;

    sentences.forEach(sentence => {
        const trimmed = sentence.trim().replace(/\.$/, '');
        if (!trimmed) return;

        const hasPriceInfo = /(?:Mulai dari|seharga|harganya|Rp\.?\s*\d|rupiah\s*per|\d+\s*ribu\s*rupiah)/i.test(trimmed);

        if (hasPriceInfo && !doneWithPrices) {
            foundPrice = true;
            const patterns = [
                /^(.+?)\s*(?:mulai dari|Mulai dari)\s+(.+?)$/i,
                /^(.+?)\s*(?:seharga|harganya)\s+(.+?)$/i,
                /^(.+?)\s*:\s*(.+?)$/i,
            ];

            let matched = false;
            for (const pat of patterns) {
                const m = trimmed.match(pat);
                if (m) {
                    const price = extractPriceFromDetail(m[2]);
                    const extra = extractExtraInfo(m[2]);
                    priceItems.push({ name: m[1].trim(), detail: extra, price });
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                priceItems.push({ name: trimmed, detail: '', price: '' });
            }
        } else if (!foundPrice) {
            beforeParts.push(trimmed);
        } else {
            doneWithPrices = true;
            afterParts.push(trimmed);
        }
    });

    if (priceItems.length < 3) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const rows = priceItems.map(item => [item.name, item.detail, item.price]);

    return {
        beforeTable: beforeParts.join('. ').trim(),
        table: { headers: ['Layanan', 'Keterangan', 'Harga'], rows },
        afterTable: afterParts.join('. ').trim(),
    };
}

// HELPER FUNCTIONS (Price formatting)

function extractPriceFromDetail(detail: string): string {
    const patterns = [
        /(Mulai dari\s+)?(\d[\d.,]*\s*(?:ribu|juta|ratus)(?:\s+\w+)*\s*(?:rupiah)?(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
        /(Mulai dari\s+)?((?:se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|(?:\w+\s+belas)|(?:\w+\s+puluh)(?:\s+\w+)?)\s+(?:ribu|juta|ratus)(?:\s+\w+)*\s*(?:rupiah)?(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
        /(Rp\.?\s*[\d.,]+(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
    ];

    for (const pat of patterns) {
        const match = detail.match(pat);
        if (match) {
            // Safely handle different capture group counts
            let price: string;
            if (match[2] !== undefined) {
                price = ((match[1] || '') + match[2]).trim();
            } else {
                price = (match[1] || '').trim();
            }
            return formatPrice(price);
        }
    }

    return formatPrice(detail);
}

function extractExtraInfo(detail: string): string {
    const extraMatch = detail.match(/(?:per\s+[\w\s]+|untuk\s+[\w\s]+|durasi\s+[\w\s]+)$/i);
    if (extraMatch) {
        return extraMatch[0].trim();
    }
    return '';
}

function splitNameAndSpecs(description: string): { name: string; specs: string } {
    const splitPatterns = [
        /^(kalender\s+\w+(?:\s+\w+)?)\s+((?:ukuran|dengan|isi|bahan).+)/i,
        /^([\w\s]+?)\s+(ukuran\s+.+)/i,
        /^([\w\s]+?)\s+(dengan\s+.+)/i,
        /^([\w\s]+?)\s+(\d+\s*[xX×]\s*\d+.+)/i,
    ];

    for (const pattern of splitPatterns) {
        const match = description.match(pattern);
        if (match) {
            return { name: match[1].trim(), specs: match[2].trim() };
        }
    }

    const words = description.split(' ');
    if (words.length > 4) {
        return {
            name: words.slice(0, 3).join(' '),
            specs: words.slice(3).join(' ')
        };
    }

    return { name: description, specs: '' };
}

function formatPrice(price: string): string {
    let cleaned = price.trim();
    cleaned = cleaned.replace(/\.$/, '');

    const mulaiPrefix = /^mulai dari\s*/i.test(cleaned);
    if (mulaiPrefix) {
        cleaned = cleaned.replace(/^mulai dari\s*/i, '');
    }
    const prefix = mulaiPrefix ? 'Mulai ' : '';

    const wordToNum: Record<string, number> = {
        'seribu': 1000, 'dua ribu': 2000, 'tiga ribu': 3000, 'empat ribu': 4000,
        'lima ribu': 5000, 'enam ribu': 6000, 'tujuh ribu': 7000, 'delapan ribu': 8000,
        'sembilan ribu': 9000, 'sepuluh ribu': 10000, 'sebelas ribu': 11000,
        'dua belas ribu': 12000, 'tiga belas ribu': 13000, 'empat belas ribu': 14000,
        'lima belas ribu': 15000, 'enam belas ribu': 16000, 'tujuh belas ribu': 17000,
        'delapan belas ribu': 18000, 'sembilan belas ribu': 19000, 'dua puluh ribu': 20000,
        'tiga puluh ribu': 30000, 'empat puluh ribu': 40000, 'lima puluh ribu': 50000,
        'enam puluh ribu': 60000, 'tujuh puluh ribu': 70000, 'delapan puluh ribu': 80000,
        'sembilan puluh ribu': 90000, 'seratus ribu': 100000,
    };

    const perMatch = cleaned.match(/\s+(per\s+[\w\s]+?)(?:\s+(?:untuk|profil|Indonesia|luar)[\w\s]*)?$/i);
    const perSuffix = perMatch ? ` ${perMatch[1].trim()}` : '';
    if (perMatch) {
        cleaned = cleaned.substring(0, perMatch.index || 0).trim();
    }

    cleaned = cleaned.replace(/\s*rupiah\s*$/i, '').trim();

    const jutaPattern = /(\w+(?:\s+\w+)*)\s+juta(?:\s+(\w+(?:\s+\w+)*)\s+ribu)?/i;
    const jutaMatch = cleaned.match(jutaPattern);
    if (jutaMatch) {
        const jutaNum = parseWordNumberMulti(jutaMatch[1]);
        const ribuNum = jutaMatch[2] ? parseWordNumberMulti(jutaMatch[2]) : 0;
        if (jutaNum > 0) {
            const total = jutaNum * 1000000 + ribuNum * 1000;
            return `${prefix}Rp${total.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    const compoundRibuPattern = /(\w+(?:\s+\w+)*)\s+ribu/i;
    const compoundRibuMatch = cleaned.match(compoundRibuPattern);
    if (compoundRibuMatch) {
        const num = parseWordNumberMulti(compoundRibuMatch[1]);
        if (num > 0) {
            const remainder = cleaned.substring(compoundRibuMatch.index! + compoundRibuMatch[0].length).trim();
            const ratusMatch = remainder.match(/(\w+(?:\s+\w+)*)\s+ratus/i);
            let total = num * 1000;
            if (ratusMatch) {
                total += parseWordNumberMulti(ratusMatch[1]) * 100;
            }
            return `${prefix}Rp${total.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    for (const [word, num] of Object.entries(wordToNum)) {
        if (cleaned.toLowerCase().includes(word)) {
            return `${prefix}Rp${num.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    if (/Rp|^\d/.test(cleaned)) {
        const numCleaned = cleaned.replace(/rupiah/i, '').trim();
        return `${prefix}${numCleaned}${perSuffix}`;
    }

    return `${prefix}${cleaned}${perSuffix}`;
}

function parseWordNumberMulti(words: string): number {
    const nums: Record<string, number> = {
        'se': 1, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
        'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
        'sebelas': 11,
    };

    const w = words.toLowerCase().trim();

    if (nums[w] !== undefined) return nums[w];

    const belasMatch = w.match(/^(\w+)\s+belas$/);
    if (belasMatch && nums[belasMatch[1]] !== undefined) {
        return nums[belasMatch[1]] + 10;
    }

    const puluhMatch = w.match(/^(\w+)\s+puluh(?:\s+(\w+))?$/);
    if (puluhMatch) {
        const tens = (nums[puluhMatch[1]] || 0) * 10;
        const ones = puluhMatch[2] ? (nums[puluhMatch[2]] || 0) : 0;
        return tens + ones;
    }

    const ratusMatch = w.match(/^(\w+)\s+ratus(?:\s+(.+))?$/);
    if (ratusMatch) {
        const hundreds = (nums[ratusMatch[1]] || (ratusMatch[1] === 'se' ? 1 : 0)) * 100;
        const rest = ratusMatch[2] ? parseWordNumberMulti(ratusMatch[2]) : 0;
        return hundreds + rest;
    }

    if (w === 'seratus') return 100;

    const num = parseInt(w.replace(/[.,]/g, ''));
    if (!isNaN(num)) return num;
 
    return 0;
}

// MAIN PARSER — tries all strategies

function parseContent(text: string): ParseResult {
    // Strategy 1: Transition words
    const result1 = parseTransitionPattern(text);
    if (result1.table && result1.table.rows.length >= 2) return result1;

    // Strategy 2: Colon-separated
    const result2 = parseColonPattern(text);
    if (result2.table && result2.table.rows.length >= 2) return result2;

    // Strategy 3: Sentence-based with price
    const result3 = parseSentencePattern(text);
    if (result3.table && result3.table.rows.length >= 3) return result3;

    // No price table pattern matched
    return { beforeTable: text, table: null, afterTable: '' };
}


// PARAGRAPH RENDERER — handles lists, schedules, addresses

function RichParagraph({ text, className = '' }: { text: string; className?: string }) {
    // Convert word numbers in non-price contexts
    const processed = convertWordNumbers(text);

    // Check for schedule data
    const scheduleData = parseSchedule(processed);

    // Check for address
    const addressData = parseAddress(processed);

    // Check for list items
    const listItems = parseListItems(processed);

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Schedule Table */}
            {scheduleData && (
                <>
                    {scheduleData.remaining && (
                        <p>{renderInlineFormatted(scheduleData.remaining)}</p>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/15 bg-white/5">
                                    <th className="px-3 py-2 text-[11px] sm:text-xs font-semibold text-white/80 uppercase tracking-wider">
                                        <span className="inline-flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Hari
                                        </span>
                                    </th>
                                    <th className="px-3 py-2 text-[11px] sm:text-xs font-semibold text-white/80 uppercase tracking-wider text-right">
                                        <span className="inline-flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Jam
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scheduleData.schedules.map((entry, i) => (
                                    <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="px-3 py-2.5 font-semibold text-white/95">{entry.days}</td>
                                        <td className="px-3 py-2.5 text-right text-amber-400/90 font-medium whitespace-nowrap">{entry.hours}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Address with Maps link */}
            {addressData && !scheduleData && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <a
                            href={addressData.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/90 hover:text-rose-300 underline underline-offset-2 decoration-rose-400/40 hover:decoration-rose-300/60 transition-colors"
                        >
                            {addressData.address}
                        </a>
                        <span className="block text-[10px] text-white/40 mt-0.5">Klik untuk buka di Google Maps</span>
                    </div>
                </div>
            )}

            {/* List rendering */}
            {listItems && !scheduleData && !addressData && (
                <>
                    {/* Find the intro text before the list */}
                    {(() => {
                        const listKeywords = /(?:meliputi|antara lain|yaitu|seperti|diantaranya|di antaranya|termasuk|berupa|mencakup)\s*:?\s*/i;
                        const idx = processed.search(listKeywords);
                        const matchResult = processed.match(listKeywords);
                        if (idx > 0 && matchResult) {
                            const intro = processed.substring(0, idx + matchResult[0].length).trim();
                            return <p>{renderInlineFormatted(intro)}</p>;
                        }
                        return null;
                    })()}
                    <ul className="space-y-1.5 ml-1">
                        {listItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400/80" />
                                <span className="text-white/85">{renderInlineFormatted(item)}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Default: plain text with inline formatting */}
            {!scheduleData && !addressData && !listItems && (
                <p>{renderInlineFormatted(processed)}</p>
            )}
        </div>
    );
}


// REACT COMPONENT — Main export
const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
    const parsed = useMemo(() => parseContent(content), [content]);

    // No price table — render with rich inline formatting
    if (!parsed.table) {
        return (
            <div className={`text-xs sm:text-sm leading-relaxed ${className}`}>
                <RichParagraph text={content} />
            </div>
        );
    }

    // Has price table — render table with rich paragraphs around it
    return (
        <div className={`text-xs sm:text-sm leading-relaxed space-y-3 ${className}`}>
            {parsed.beforeTable && (
                <RichParagraph text={parsed.beforeTable} />
            )}

            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/15 bg-white/5">
                            {parsed.table.headers.map((header, i) => (
                                <th
                                    key={i}
                                    className={`px-3 py-2 text-[11px] sm:text-xs font-semibold text-white/80 uppercase tracking-wider ${i === parsed.table!.headers.length - 1 ? 'text-right' : ''
                                        }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {parsed.table.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`border-b border-white/5 transition-colors hover:bg-white/5 ${rowIndex % 2 === 0 ? 'bg-white/[0.02]' : ''
                                    }`}
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`px-3 py-2.5 ${cellIndex === 0
                                            ? 'font-semibold text-white/95'
                                            : cellIndex === row.length - 1
                                                ? 'text-right font-bold text-emerald-400/90 whitespace-nowrap'
                                                : 'text-white/70'
                                            }`}
                                    >
                                        {cell || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {parsed.afterTable && (
                <RichParagraph text={parsed.afterTable} className="text-white/70 text-[11px] sm:text-xs italic" />
            )}
        </div>
    );
};

export default FormattedMessage;
