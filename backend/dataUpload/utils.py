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
            pattern = [{"LOWER": keyword.words.lower()}]  # Use lowercase matching
            matcher.add(category.name, [pattern])

# Categorization function
def categorize_transactions(vendor_name, user):
    # Ensure matcher is updated
    load_categories_to_matcher()

    # Check if the user has stored keywords for categorization
    keywords = Keyword.objects.filter(user=user)  # Fetch user's keywords

    # Dynamically update matcher with user's keywords
    matcher = Matcher(nlp.vocab)
    for keyword in keywords:
        pattern = [{"LOWER": keyword.words.lower()}]  # Use lowercase matching for consistency
        matcher.add(keyword.category.name, [pattern])  # Add category pattern

    doc = nlp(vendor_name.lower())  # Preprocess vendor name
    matches = matcher(doc)  # Match vendor name against patterns
    
    if matches:
        match_id, start, end = matches[0]  # Use the first match
        category_name = nlp.vocab.strings[match_id]  # Retrieve category name
        return category_name
    else:
        return "Uncategorized"


