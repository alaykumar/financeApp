import pandas as pd
from datetime import datetime
import logging

from django.db import transaction

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import CSVDataSerializer, CategorySerializer
from .models import CSVData, Category, Keyword, Card
from .keywordUtils import generate_multiple_keywords
from .utils import categorize_transactions
from .helpers.filter_statements import filter_statements
from .helpers.custom_pagination import CustomPagination
from .helpers.process_td_statements import process_td_statement
from .helpers.process_amex_statements import process_amex_statement


logger = logging.getLogger(__name__)


@api_view(['GET'])
def get_statements(request):
    user = request.user
    category = request.query_params.get('category', '')
    month = request.query_params.get('month', '')

    statements = filter_statements(user, category, month)
    paginator = CustomPagination()
    result_page = paginator.paginate_queryset(statements, request)
    
    # Serialize the paginated data
    serializer = CSVDataSerializer(result_page, many=True)
    
    # Return paginated response
    return paginator.get_paginated_response(serializer.data)
    


@api_view(['GET'])
def get_categories(request):
    user = request.user
    categories = CSVData.objects.filter(user=user).values_list('category', flat=True).distinct()
    return Response({"categories": list(categories)})


class CSVUploadPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user  # Get the current user
        csv_file = request.FILES.get('file')
        card_org = request.data.get('cardOrg')

        if not csv_file or not csv_file.name.endswith('.csv'):
            return Response({"error": "Invalid file format. Please upload a CSV file."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            csv_data = pd.read_csv(csv_file)
            csv_data = csv_data.where(pd.notnull(csv_data), 0.0)

            if card_org == 'TD':
                preview_data = process_td_statement(csv_data, user)
            elif card_org == 'AMEX':
                preview_data = process_amex_statement(csv_data, user)
            else:
                return Response({"error": "Unsupported card organization."}, status=status.HTTP_400_BAD_REQUEST)
            
            
            return Response({"preview": preview_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def save_statements(request):
    user = request.user
    data = request.data.get('data', [])
    card_org = request.data.get('cardOrg', '').strip()
    card_type = request.data.get('cardType', '').strip()
    
    if not data:
        logger.error("No data provided in the request.")
        return Response({"error": "No data provided."}, status=status.HTTP_400_BAD_REQUEST)

    new_categories = [] 
    new_records = [] 
    new_keywords = []  # Collecting new keywords to avoid duplicates

    try:
        with transaction.atomic():  # Ensure atomicity of all DB operations
            logger.info("Starting transaction save process.")

            card = None
            if card_org and card_type:
                card, _ = Card.objects.get_or_create(user=user, card_org=card_org, card_type=card_type)
                logger.info(f"Card set: {card_org} ({card_type})")

            for row in data:
                transaction_date = row.get('transactionDate') 
                vendor_name = row.get('vendorName')
                debit = row.get('debit', 0.0)
                credit = row.get('credit', 0.0)
                category_name = row.get('category', 'Uncategorized')  # Make sure this is set from frontend

                if not vendor_name or not transaction_date:
                    logger.error(f"Missing vendor name or transaction date for row: {row}")
                    return Response({"error": "Transaction date and vendor name are required."},
                                    status=status.HTTP_400_BAD_REQUEST)

                try:
                    parsed_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
                except ValueError:
                    logger.error(f"Invalid date format for transaction {transaction_date}.")
                    return Response({"error": f"Invalid date format: {transaction_date}. Use 'YYYY-MM-DD'."},
                                     status=status.HTTP_400_BAD_REQUEST)

                logger.info(f"Processing transaction: {vendor_name} on {parsed_date}")

                # Ensure the category is not set to "Uncategorized" unless it's really uncategorized
                if category_name == "Uncategorized":
                    logger.info(f"Categorizing transaction with vendor name: {vendor_name}")
                    category_name = categorize_transactions(vendor_name, user)

                logger.info(f"Assigned category: {category_name}")

                # Create or retrieve the category
                category, created = Category.objects.get_or_create(name=category_name, user=user)
                if created:
                    new_categories.append(category)
                    logger.info(f"New category created: {category_name}")

                # Generate keywords for the vendor name
                keywords = generate_multiple_keywords(vendor_name)

                # Check if the keyword already exists for the user and only add unique ones
                existing_keywords = Keyword.objects.filter(user=user).values_list('words', flat=True)
                new_keywords_for_user = [
                    Keyword(
                        user=user,
                        category=category,
                        words=keyword,
                        vendor_name=vendor_name
                    )
                    for keyword in keywords if keyword not in existing_keywords
                ]
                
                # Add the new keywords to the list
                if new_keywords_for_user:
                    new_keywords.extend(new_keywords_for_user)
                    logger.info(f"Generated and queued {len(new_keywords_for_user)} new keyword(s).")

                exists = CSVData.objects.filter(
                    user=user,
                    transactionDate=parsed_date,
                    vendorName=vendor_name,
                    debit=debit,
                    credit=credit,
                    category=category.name,
                    card=card
                ).exists()

                if not exists:
                    new_records.append(CSVData(
                        user=user,
                        transactionDate=parsed_date,
                        vendorName=vendor_name,
                        debit=debit,
                        credit=credit,
                        category=category.name,
                        card=card  
                    ))
                    logger.info(f"New transaction added: {vendor_name}, {parsed_date}, {category_name}")

            # Bulk create new keywords only if there are any
            if new_keywords:
                Keyword.objects.bulk_create(new_keywords)
                logger.info(f"Bulk created {len(new_keywords)} new keywords.")

            # Bulk create CSVData entries
            if new_records:
                CSVData.objects.bulk_create(new_records)
                logger.info(f"Bulk created {len(new_records)} transaction records.")

        logger.info("Transaction save process completed successfully.")
        return Response({"message": "Statements, categories, and keywords saved successfully!"},
                         status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error occurred while saving transactions: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Retrieve all categories and their keywords.
        """
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        Create a new category or update an existing one with a new keyword.
        """
        data = request.data
        category_name = data.get('name')
        keyword = data.get('keyword')

        if not category_name:
            return Response({"error": "Category name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get or create the category
            category, created = Category.objects.get_or_create(name=category_name)

            # Add the keyword to the category if provided
            if keyword:
                category.keywords.add(keyword)
                category.save()

            return Response({"success": "Category updated successfully."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class UserCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        user_categories = Category.objects.filter(user=user)
        user_serializer = CategorySerializer(user_categories, many=True)

        default_categories = [
            {"id": None, "name": "Grocery"},
            {"id": None, "name": "Dining Out"},
            {"id": None, "name": "Healthcare"},
            {"id": None, "name": "Entertainment"},
            {"id": None, "name": "Home"},
        ]

        if not user_categories.exists():
            response_data = default_categories
        else:
            response_data = user_serializer.data

        return Response(response_data)