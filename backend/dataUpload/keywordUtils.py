"""
import re
#from nltk.corpus import stopwords
import nltk

stopwords = nltk.download('stopwords')

STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_multiple_keywords(vendor_name):
    
    #Generate multiple keywords from the vendor name by removing stop words
    #and filtering out small words.
    
    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())  # Clean punctuation and make lowercase

    words = vendor_name_cleaned.split()  # Split into individual words

    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]

    return filtered_words if filtered_words else ["unknown"]


"""
"""
import re
import nltk

# Ensure stopwords are downloaded first
nltk.download('stopwords')
from nltk.corpus import stopwords  # Import stopwords after download

STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_multiple_keywords(vendor_name):
    
    #Generate multiple keywords from the vendor name by removing stop words
    #and filtering out small words.
    
    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())  # Clean punctuation and make lowercase

    words = vendor_name_cleaned.split()  # Split into individual words

    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]

    return filtered_words if filtered_words else ["unknown"]
"""

import spacy
import pandas as pd
import re
from spacy.tokenizer import Tokenizer

nlp = spacy.load("en_core_web_sm")

def custom_tokenizer(nlp):
    infix_re = re.compile(r'''[.\,\?\:\;\!\&\/]''')
    return Tokenizer(nlp.vocab, infix_finditer=infix_re.finditer)

nlp.tokenizer = custom_tokenizer(nlp)

def clean_vendor_name(vendor_name):
    if pd.isna(vendor_name):
        return ""
    vendor_name = vendor_name.lower()
    vendor_name = re.sub(r'\.(com|net|org|biz|info|io|co|us|ca|uk|in)(/.*)?$', '', vendor_name)
    vendor_name = re.sub(r'[^a-zA-Z0-9&\s]', ' ', vendor_name)
    return vendor_name.strip()


def categorize_keyword(vendor_name):
    cleaned_name = clean_vendor_name(vendor_name)
    doc = nlp(cleaned_name)

    keywords = [
        token.lemma_ for token in doc
        if token.is_alpha or "&" in token.text
    ]

    return keywords