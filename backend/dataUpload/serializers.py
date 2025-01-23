from rest_framework import serializers
from .models import CSVData, Category

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

class CSVDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSVData
        fields = '__all__'

    def validate(self, data):
        if data['debit'] < 0 or data['credit'] < 0:
            raise serializers.ValidationError("Debit and credit values must be non-negative.")
        return data

class CategorySerializer(serializers.ModelSerializer):
    #keywords = serializers.StringRelatedField(many=True)

    class Meta:
        model = Category
        fields = ['id', 'name']
