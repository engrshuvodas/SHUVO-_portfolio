
const fs = require('fs');
const path = require('path');

const reviewFile = './review.txt';
const content = fs.readFileSync(reviewFile, 'utf8');

// Split by "Helpful?" as it seems to be the terminator
const rawReviews = content.split('Helpful?').filter(r => r.trim().length > 0);

const reviews = [];
const nameCounts = {};

// Clean up and parse
rawReviews.forEach(block => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Heuristic parsing
    // Line 0: Initial (e.g. "D")
    // Line 1: Username (e.g. "dillinmoodley")
    // Check if line 2 is "Repeat Client"

    let usernameIdx = 1;
    let username = lines[usernameIdx];

    // Use regex to find country code (2 uppercase letters) to anchor position
    let countryCodeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (/^[A-Z]{2}$/.test(lines[i]) && lines[i + 1]) {
            countryCodeIdx = i;
            break;
        }
    }

    if (countryCodeIdx === -1) return; // Skip if invalid

    // Check for Repeat Client label in text validly
    // It usually appears before Country Code
    let isRepeatInText = false;
    for (let i = usernameIdx + 1; i < countryCodeIdx; i++) {
        if (lines[i].includes('Repeat Client')) {
            isRepeatInText = true;
        }
    }

    const countryCode = lines[countryCodeIdx];
    const countryName = lines[countryCodeIdx + 1];

    // Rating is usually a number like "5" or "4.7" shortly after
    let ratingIdx = -1;
    for (let i = countryCodeIdx + 2; i < lines.length; i++) {
        if (/^[0-5](\.[0-9])?$/.test(lines[i])) { // Matches 5 or 4.7
            // Check if next line is a date (contains "ago")
            if (lines[i + 1] && lines[i + 1].includes('ago')) {
                ratingIdx = i;
                break;
            }
        }
    }

    if (ratingIdx === -1) return;

    const rating = parseFloat(lines[ratingIdx]);
    const reviewTextStart = ratingIdx + 2;

    // Review text is the block after date until "Up to" or "Price" or end
    let reviewText = "";
    for (let i = reviewTextStart; i < lines.length; i++) {
        if (lines[i].startsWith("Up to") || lines[i].startsWith("$") || lines[i] === "Price") break;
        reviewText += lines[i] + " ";
    }

    if (!username || !reviewText) return;

    nameCounts[username] = (nameCounts[username] || 0) + 1;

    reviews.push({
        name: username,
        countryCode: countryCode,
        countryName: countryName,
        rating: rating,
        text: reviewText.trim(),
        originalRepeat: isRepeatInText
    });
});

// Flag Map
const flags = {
    "ZA": "🇿🇦", "US": "🇺🇸", "AE": "🇦🇪", "IT": "🇮🇹", "FR": "🇫🇷",
    "GB": "🇬🇧", "ES": "🇪🇸", "NL": "🇳🇱", "LK": "🇱🇰", "AR": "🇦🇷",
    "DO": "🇩🇴", "IN": "🇮🇳", "BH": "🇧🇭", "CI": "🇨🇮", "IL": "🇮🇱",
    "CM": "🇨🇲", "DK": "🇩🇰", "MX": "🇲🇽", "BE": "🇧🇪", "SG": "🇸🇬",
    "UA": "🇺🇦", "GE": "🇬🇪", "NG": "🇳🇬", "CA": "🇨🇦", "AU": "🇦🇺",
    "DE": "🇩🇪", "BR": "🇧🇷", "MA": "🇲🇦", "BD": "🇧🇩", "HK": "🇭🇰",
    "ZW": "🇿🇼" // Zimbabwe just in case
};

// Image Map (Deterministic Random)
// We'll use the existing images we saw in file list, or placeholders if needed.
// File list: Shamim Reza.png, Shuvankar Halder.png, Susmita Kundu.png, Engr Shuvo Das.png (skip shuvo)
const availableImages = [
    "./assets/images/Shamim Reza.png",
    "./assets/images/Shuvankar Halder.png",
    "./assets/images/Susmita Kundu.png",
    // We can reuse these or add placeholdes. The user said "random client photo".
    // I will use a placeholder service for variety if allowed, otherwise rotate these.
    // The user provided specific images in the prompt example but said "random client photo".
    // I will simply rotate the local ones to be safe.
];

function getAvatar(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % availableImages.length;
    return availableImages[index];
}

// Generate HTML
let htmlRow1 = '<div class="marquee-track">\n';
let htmlRow2 = '<div class="marquee-track">\n';

// Split reviews into two halves
const mid = Math.ceil(reviews.length / 2);
const row1Reviews = reviews.slice(0, mid);
const row2Reviews = reviews.slice(mid);

function generateCard(r) {
    const isRepeat = nameCounts[r.name] > 1 || r.originalRepeat;
    const flag = flags[r.countryCode] || "";
    const avatar = getAvatar(r.name);
    const starCount = Math.floor(r.rating);
    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
        if (i < starCount) starsHtml += '<i class="fas fa-star"></i>';
        else starsHtml += '<i class="far fa-star"></i>'; // Empty star if needed, easier to just show filled count or all 5 for high ratings
    }

    // Repeat Label
    const repeatHtml = isRepeat ?
        `<div class="repeat-badge"><i class="fas fa-sync-alt"></i> Repeat Client</div>` : "";

    return `
    <div class="review-card" onclick="openReviewModal(this)"
        data-name="${r.name}"
        data-role="Client"
        data-flag="${flag}"
        data-stars="${r.rating}"
        data-image="${avatar}"
        data-text="${r.text.replace(/"/g, '&quot;')}">
        <div class="client-header">
            <img src="${avatar}" alt="${r.name}" class="review-avatar">
            <div class="client-info">
                <h4>${r.name}</h4>
                <div class="country-info">
                    <span class="country-name">${r.countryName}</span>
                    <span class="flag">${flag}</span>
                </div>
                ${repeatHtml}
            </div>
        </div>
        <div class="stars">${starsHtml}</div>
        <p class="review-text">${r.text}</p>
        <span class="read-more-link">Read more</span>
    </div>`;
}

row1Reviews.forEach(r => htmlRow1 += generateCard(r));
row2Reviews.forEach(r => htmlRow2 += generateCard(r));

htmlRow1 += '</div>'; // Close track
htmlRow2 += '</div>';

// We need to duplicate the track for infinite scroll
const fullHtmlRow1 = htmlRow1 + htmlRow1;
const fullHtmlRow2 = htmlRow2 + htmlRow2;

// Output to console or file
console.log("ROW1_START");
console.log(fullHtmlRow1);
console.log("ROW1_END");
console.log("ROW2_START");
console.log(fullHtmlRow2);
console.log("ROW2_END");
