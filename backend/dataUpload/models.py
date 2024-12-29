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

    category = models.CharField(max_length=100, blank=True, null=True)



class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)


class Keyword(models.Model):
    category = models.ForeignKey(Category, related_name='keywords', on_delete=models.CASCADE)
    word = models.CharField(max_length=255)

    def __str__(self):
        return self.word

    

