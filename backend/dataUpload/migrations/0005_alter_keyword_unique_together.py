# Generated by Django 5.1.3 on 2025-01-28 08:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dataUpload', '0004_alter_keyword_unique_together'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='keyword',
            unique_together=set(),
        ),
    ]
