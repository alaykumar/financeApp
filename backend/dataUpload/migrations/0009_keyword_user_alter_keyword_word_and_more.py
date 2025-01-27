# Generated by Django 5.1.3 on 2025-01-25 08:05

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dataUpload', '0008_alter_csvdata_category'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='keyword',
            name='user',
            field=models.ForeignKey(default='', on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='keyword',
            name='word',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AlterUniqueTogether(
            name='keyword',
            unique_together={('user', 'word', 'category')},
        ),
    ]