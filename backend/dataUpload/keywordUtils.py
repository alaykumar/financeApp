"""
import re
from nltk.corpus import stopwords

STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_single_keyword(vendor_name):

    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())

    words = vendor_name_cleaned.split()

    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]

    return filtered_words[0] if filtered_words else "unknown"
"""


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


"""
import spacy
from spacy.matcher import Matcher
from .models import Category, Keyword
import re
from nltk.corpus import stopwords

# Load the spaCy transformer-based model
nlp = spacy.load("en_core_web_trf")  # Transformer-based model for better accuracy
matcher = Matcher(nlp.vocab)

# Dynamically load categories and keywords from the database into the matcher
def load_categories_to_matcher():
    global matcher  # Ensure global matcher is updated
    matcher = Matcher(nlp.vocab)
    for category in Category.objects.prefetch_related('keywords').all():
        keywords = category.keywords.all()
        for keyword in keywords:
            pattern = [{"LOWER": keyword.words.lower()}]  # Use lowercase matching
            matcher.add(category.name, [pattern])

# NLTK stopwords filtering
STOP_WORDS = set(stopwords.words('english')) | {'inc', 'llc', 'store', 'company', 'corporation'}

def generate_multiple_keywords(vendor_name):
    
    #Generate multiple keywords from the vendor name by removing stop words
    #and filtering out small words.
    
    vendor_name_cleaned = re.sub(r'[^\w\s]', '', vendor_name.lower())  # Clean punctuation and make lowercase
    words = vendor_name_cleaned.split()  # Split into individual words
    filtered_words = [word for word in words if word not in STOP_WORDS and len(word) > 2]
    return filtered_words if filtered_words else ["unknown"]  # Return cleaned words or a default keyword

# Categorization function
def categorize_transactions(vendor_name, user):
    # Ensure matcher is updated
    load_categories_to_matcher()

    # Generate keywords using NLTK-based function
    keywords = generate_multiple_keywords(vendor_name)

    # Check if the user has stored keywords for categorization
    user_keywords = Keyword.objects.filter(user=user)  # Fetch user's keywords

    # Dynamically update matcher with user's keywords
    for keyword in user_keywords:
        pattern = [{"LOWER": keyword.words.lower()}]  # Use lowercase matching for consistency
        matcher.add(keyword.category.name, [pattern])  # Add category pattern

    doc = nlp(vendor_name.lower())  # Preprocess vendor name with transformer-based model
    matches = matcher(doc)  # Match vendor name against patterns

    # Check if the generated keywords from NLTK match any categories
    for keyword in keywords:
        for match_id, start, end in matches:
            category_name = nlp.vocab.strings[match_id]
            if keyword.lower() in category_name.lower():
                return category_name  # Return category name if match found

    # If no match is found, return 'Uncategorized'
    return "Uncategorized"
"""