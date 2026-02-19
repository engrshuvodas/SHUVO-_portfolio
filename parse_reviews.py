
import re
import math

def parse_reviews(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "Helpful?"
    raw_blocks = content.split('Helpful?')
    reviews = []
    
    name_counts = {}

    for block in raw_blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue

        # Logic to find country code (2 UPPERCASE letters)
        country_code_idx = -1
        for i, line in enumerate(lines):
            # Strict 2-letter uppercase check
            if re.match(r'^[A-Z]{2}$', line):
                country_code_idx = i
                break
        
        if country_code_idx == -1:
            continue
            
        # Parse data around country code
        try:
            country_code = lines[country_code_idx]
            country_name = lines[country_code_idx + 1]
            
            # Username search (backwards from country code)
            # Structure usually:
            # Initial
            # (image-docs)
            # Username
            # (Repeat Client)
            # Country Code
            
            username = "Unknown"
            is_repeat_in_text = False
            
            # Look at lines before country code
            pre_lines = lines[:country_code_idx]
            if not pre_lines:
                continue
                
            # Check for "Repeat Client" in the immediate preceding formatting lines
            if "Repeat Client" in pre_lines:
                is_repeat_in_text = True
                pre_lines = [l for l in pre_lines if l != "Repeat Client"]
            
            # Remove "image-docs"
            pre_lines = [l for l in pre_lines if l != "image-docs"]
            
            # Remove single letter Initials if they appear alone
            # But wait, sometimes username IS short? Unlikely for Fiverr.
            # Usually strict username is the last one remaining
            if pre_lines:
                username = pre_lines[-1]
            
            # Rating search (look after country name)
            # Rating is a number 3-5, usually followed by "x months ago"
            rating = 5.0
            rating_idx = -1
            for i in range(country_code_idx + 2, len(lines)):
                if re.match(r'^[0-5](\.[0-9])?$', lines[i]):
                    # Check next line for time
                    if i + 1 < len(lines) and ("ago" in lines[i+1] or "month" in lines[i+1]):
                        rating = float(lines[i])
                        rating_idx = i
                        break
            
            if rating_idx == -1:
                continue
                
            # Text is after the date line
            text_parts = []
            start_text = rating_idx + 2
            for i in range(start_text, len(lines)):
                line = lines[i]
                if line.startswith("Up to") or line.startswith("$") or line == "Price":
                    break
                text_parts.append(line)
            
            review_text = " ".join(text_parts).strip()
            
            if not review_text or not username:
                continue

            # Track counts
            name_counts[username] = name_counts.get(username, 0) + 1
            
            reviews.append({
                "name": username,
                "country_code": country_code,
                "country_name": country_name,
                "rating": rating,
                "text": review_text,
                "original_repeat": is_repeat_in_text
            })
            
        except Exception as e:
            # print(f"Skipping block due to error: {e}")
            continue

    return reviews, name_counts

def generate_html(reviews, name_counts):
    flags = {
        "ZA": "🇿🇦", "US": "🇺🇸", "AE": "🇦🇪", "IT": "🇮🇹", "FR": "🇫🇷",
        "GB": "🇬🇧", "ES": "🇪🇸", "NL": "🇳🇱", "LK": "🇱🇰", "AR": "🇦🇷",
        "DO": "🇩🇴", "IN": "🇮🇳", "BH": "🇧🇭", "CI": "🇨🇮", "IL": "🇮🇱",
        "CM": "🇨🇲", "DK": "🇩🇰", "MX": "🇲🇽", "BE": "🇧🇪", "SG": "🇸🇬",
        "UA": "🇺🇦", "GE": "🇬🇪", "NG": "🇳🇬", "CA": "🇨🇦", "AU": "🇦🇺",
        "DE": "🇩🇪", "BR": "🇧🇷", "MA": "🇲🇦", "BD": "🇧🇩", "HK": "🇭🇰",
        "ZW": "🇿🇼"
    }
    
    available_images = [
        "./assets/images/Shamim Reza.png",
        "./assets/images/Shuvankar Halder.png",
        "./assets/images/Susmita Kundu.png"
    ]
    
    def get_avatar(name):
        hash_val = sum(ord(c) for c in name)
        return available_images[hash_val % len(available_images)]

    def create_card(r):
        is_repeat = name_counts[r['name']] > 1 or r['original_repeat']
        flag = flags.get(r['country_code'], "")
        avatar = get_avatar(r['name'])
        star_count = math.floor(r['rating'])
        
        stars_html = ""
        for i in range(5):
            if i < star_count:
                stars_html += '<i class="fas fa-star"></i>'
            elif r['rating'] % 1 != 0 and i == star_count:
                stars_html += '<i class="fas fa-star-half-alt"></i>'
            else:
                stars_html += '<i class="far fa-star"></i>'
        
        # New Header Structure based on user request
        # Name | Repeat Badge
        # Flag Country
        
        repeat_html = ""
        if is_repeat:
            repeat_html = f'''
            <span class="repeat-separator">•</span>
            <span class="repeat-badge"><i class="fas fa-sync-alt"></i> Repeat Client</span>
            '''

        safe_text = r['text'].replace('"', '&quot;').replace("'", "&apos;")
        
        return f'''
        <div class="review-card" onclick="openReviewModal(this)" 
            data-name="{r['name']}" 
            data-role="Client" 
            data-flag="{flag}" 
            data-country="{r['country_name']}"
            data-stars="{r['rating']}" 
            data-image="{avatar}"
            data-text="{safe_text}">
            <div class="client-header">
                <img src="{avatar}" alt="{r['name']}" class="review-avatar">
                <div class="client-info">
                    <div class="name-row">
                        <h4>{r['name']}</h4>
                        {repeat_html}
                    </div>
                    <div class="country-row">
                        <span class="flag">{flag}</span> 
                        <span class="country-name">{r['country_name']}</span>
                    </div>
                </div>
            </div>
            <div class="stars">{stars_html}</div>
            <p class="review-text">{r['text']}</p>
            <span class="read-more-link">Read more</span>
        </div>'''

    mid = math.ceil(len(reviews) / 2)
    row1 = reviews[:mid]
    row2 = reviews[mid:]
    
    html = '<div class="review-row marquee-row-1">\n<div class="marquee-track">\n'
    html += "".join([create_card(r) for r in row1])
    html += "".join([create_card(r) for r in row1]) # Duplicate
    html += '</div>\n</div>\n'
    
    html += '<div class="review-row marquee-row-2">\n<div class="marquee-track">\n'
    html += "".join([create_card(r) for r in row2])
    html += "".join([create_card(r) for r in row2]) # Duplicate
    html += '</div>\n</div>\n'
    
    return html


reviews, counts = parse_reviews('review.txt')
with open('review_output.html', 'w', encoding='utf-8') as f:
    f.write(generate_html(reviews, counts))
print("HTML generated in review_output.html")
