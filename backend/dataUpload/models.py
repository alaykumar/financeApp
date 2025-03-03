from django.db import models
from django.conf import settings

# Create your models here.
class CSVData(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transactionDate = models.DateField()
    vendorName = models.CharField(max_length=100)
    debit = models.DecimalField(default=0, max_digits=7, decimal_places=2)
    credit = models.DecimalField(default=0, max_digits=7, decimal_places=2)
    balance = models.DecimalField(default=0, max_digits=7, decimal_places=2)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=255, default="Uncategorized")

    # Relate category to CSVData using ForeignKey and include the user
    #category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.vendorName} - {self.transactionDate}"
    

class Category(models.Model):
    # Relate category to a specific user
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    # Ensure the combination of user and category name is unique
    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} (User: {self.user.username})"



class Keyword(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    #category = models.ForeignKey('Category', on_delete=models.CASCADE)
    category = models.ForeignKey(Category, related_name="keywords", on_delete=models.CASCADE)
    words = models.TextField(default='')
    vendor_name = models.CharField(max_length=255, null=False, default="unknown_vendor")

    #class Meta:
    #    unique_together = ('user', 'words')

    def __str__(self):
        return self.words



"""
class Keyword(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, default="")  # Ensure this field is required
    category = models.ForeignKey(Category, related_name="keywords", on_delete=models.CASCADE, null=False)  # Ensure this field is required

    words = models.TextField(default='')
    vendor_name = models.CharField(max_length=255, null=False, default="unknown_vendor")  

    #class Meta:
    #    unique_together = ("user", "vendor_name", "words")

    def __str__(self):
        return self.words

"""

"""
class Keyword(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, default='')  # Ensure this field is required
    category = models.ForeignKey(Category, related_name='keywords', on_delete=models.CASCADE, null=False)  # Ensure this field is required
    
    word = models.CharField(max_length=255, null=False, default='')  # Default to an empty string
    

    class Meta:
        unique_together = ('user', 'word', 'category')

    def __str__(self):
        return self.word

"""