import re
from nltk.corpus import stopwords

STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_single_keyword(vendor_name):

    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())

    words = vendor_name_cleaned.split()

    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]

    return filtered_words[0] if filtered_words else "unknown"