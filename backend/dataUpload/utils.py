import spacy
from spacy.matcher import Matcher
from .models import Category, Keyword  

# Load the spaCy language model
nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)

# Dynamically load categories and keywords from the database into the matcher
def load_categories_to_matcher():
    global matcher  # Ensure global matcher is updated
    matcher = Matcher(nlp.vocab)
    for category in Category.objects.prefetch_related('keywords').all():
        keywords = category.keywords.all()
        for keyword in keywords:
            pattern = [{"LOWER": keyword.word.lower()}]  # Use lowercase matching
            matcher.add(category.name, [pattern])

# Categorization function
def categorize_transactions(vendor_name):
    # Ensure matcher is updated
    load_categories_to_matcher()

    doc = nlp(vendor_name.lower())  # Preprocess vendor name
    matches = matcher(doc)  # Match vendor name against patterns
    
    # Debugging: print matches for insights
    print(f"Vendor Name: {vendor_name}")
    print(f"Matches: {matches}")
    
    if matches:
        match_id, start, end = matches[0]  # Use the first match
        category_name = nlp.vocab.strings[match_id]  # Retrieve category name
        print(f"Categorized as: {category_name}")
        return category_name
    else:
        print("Categorized as: Uncategorized")
        return "Uncategorized"



"""
import spacy
from spacy.matcher import Matcher
from .models import Category, Keyword  # Adjust import to your app structure

nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)

# Dynamically load categories and keywords from the database into the matcher
def load_categories_to_matcher():
    matcher = Matcher(nlp.vocab)
    for category in Category.objects.prefetch_related('keywords').all():
        keywords = category.keywords.all()
        for keyword in keywords:
            pattern = [{"LOWER": keyword.word.lower()}]
            matcher.add(category.name, [pattern])
    return matcher

# Updated categorization function
def categorize_transactions(vendor_name):
    doc = nlp(vendor_name.lower())
    matches = matcher(doc)
    
    if matches:
        match_id, start, end = matches[0]
        category_name = nlp.vocab.strings[match_id]  # Get category name from match ID
        return category_name
    else:
        return "Uncategorized"
"""
