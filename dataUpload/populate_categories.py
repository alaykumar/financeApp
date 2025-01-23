# myapp/management/commands/populate_categories.py
from django.core.management.base import BaseCommand
from .models import Category, Keyword

CATEGORIES = {
    "Groceries": ["grocery", "supermarket", "market", "foodland", "seafood"],
    "DiningOut": ["restaurant", "cafe", "coffee", "burger", "taco", "tea", "shawarma", "express", "sweets", "pizza", "chai", "cha", "ubereats", "doordash"],
    "Healthcare": ["clinic", "doctor", "health", "dentist", "pharmacy", "invisalign"],
    "Transportation": ["parking", "transit", "gas", "fuel", "uber"],
    "Shopping": ["amazon", "uniqlo", "store", "shop", "apple"],
    "Entertainment": ["netflix", "spotify", "gym", "fitness", "movie", "stadium", "video"],
}

class Command(BaseCommand):
    help = "Populate Category and Keyword tables with predefined data"

    def handle(self, *args, **kwargs):
        for category_name, keywords in CATEGORIES.items():
            category, created = Category.objects.get_or_create(name=category_name)
            for word in keywords:
                Keyword.objects.get_or_create(category=category, word=word)
        self.stdout.write(self.style.SUCCESS("Categories and keywords have been added successfully."))
