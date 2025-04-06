import spacy 
import pandas as pd
import re
from spacy.lang.en.stop_words import STOP_WORDS
from spacy.tokenizer import Tokenizer
from .models import Category, Keywords2  # Make sure Keyword2 is imported
import json

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Function to clean and normalize vendor names
def clean_vendor_name(vendor_name):
    if pd.isna(vendor_name):  # Handle missing values
        return ""
    
    # Convert to lowercase
    vendor_name = vendor_name.lower()
    
    # Remove domain extensions (.com, .net, .org, etc.)
    vendor_name = re.sub(r'\.(com|net|org|biz|info|io|co|us|ca|uk)(/.*)?$', '', vendor_name)
    
    # Keep ampersands, but remove other special characters
    vendor_name = re.sub(r'[^a-zA-Z09&\s]', ' ', vendor_name)

    return vendor_name.strip()

# Function to extract keywords
def extract_keywords(vendor_name):
    cleaned_name = clean_vendor_name(vendor_name)  # Clean the vendor name
    doc = nlp(cleaned_name)
    
    keywords = [
        token.lemma_ for token in doc 
        if token.is_alpha or "&" in token.text  # Preserve '&' in brand names like A&W
    ]
    return keywords

def categorize_transactions(vendor_name, user):
    # Extract and clean vendor name keywords
    new_vendor_keywords = extract_keywords(vendor_name)

    # Load keywords dynamically from Keyword2 model for the given user
    keyword_matches = Keywords2.objects.filter(user=user)

    # Now find the best match in the Keyword2 model based on extracted keywords
    for keyword_entry in keyword_matches:
        # Compare keywords between extracted ones and stored ones in Keyword2
        if all(kw in keyword_entry.words for kw in new_vendor_keywords):  # Check if all extracted keywords are in the stored keyword list
            return keyword_entry.category.name  # Return the vendor name from the match
    
    return "Uncategorized"  # If no match found, categorize as uncategorized
