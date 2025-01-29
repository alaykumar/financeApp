import re
from nltk.corpus import stopwords

STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_multiple_keywords(vendor_name):
    
    #Generate multiple keywords from the vendor name by removing stop words
    #and filtering out small words.
    
    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())  # Clean punctuation and make lowercase

    words = vendor_name_cleaned.split()  # Split into individual words

    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]

    return filtered_words if filtered_words else ["unknown"]


