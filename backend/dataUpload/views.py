import pandas as pd
from datetime import datetime
from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from .serializers import CSVUploadSerializer, CSVDataSerializer, CategorySerializer
from .models import CSVData, Category, Keyword
from django.db import transaction


from .keywordUtils import generate_multiple_keywords#, categorize_transactions
from .utils import categorize_transactions


class CSVUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CSVUploadSerializer(data=request.data)
        if serializer.is_valid():
            csv_file = serializer.validated_data['file']
            card_org = request.data['cardOrg']
            

            if not csv_file.name.endswith('.csv'):
                return Response({"error": "File is not a CSV"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user

            try:
                if card_org == 'TD':
                    # Read CSV data into a pandas DataFrame
                    csv_data = pd.read_csv(csv_file)

                    # Replace NaN with 0.0
                    csv_data = csv_data.where(pd.notnull(csv_data), 0.0)

                    # Convert and format the dates
                    for transaction_date in range(csv_data.iloc[:, 0].size):
                        d = datetime.strptime(csv_data.iloc[transaction_date, 0], '%m/%d/%Y')
                        csv_data.iloc[transaction_date, 0] = d.strftime('%Y-%m-%d')

                    # Create or update CSVData objects
                    for record in csv_data.to_dict(orient="records"):
                        transaction_date = record[csv_data.columns[0]]
                        vendor_name = record[csv_data.columns[1]]
                        debit = record[csv_data.columns[2]]
                        credit = record[csv_data.columns[3]]
                        #balance = record[csv_data.columns[4]]

                        category = categorize_transactions(vendor_name)

                        # Check if the record already exists
                        if not CSVData.objects.filter(
                            user=user,
                            transactionDate=transaction_date,
                            vendorName=vendor_name,
                            debit=debit,
                            credit=credit,
                            #balance=balance
                        ).exists():
                            CSVData.objects.create(
                                user=user,
                                transactionDate=transaction_date,
                                vendorName=vendor_name,
                                debit=debit,
                                credit=credit,
                                #balance=balance,
                                category=category
                            )

                    return Response({"success": "TD statement processed successfully!"}, status=status.HTTP_200_OK)
                
                elif card_org == 'AMEX':
                    # Read CSV data into a pandas DataFrame
                    csv_data = pd.read_csv(csv_file)
                    
                    # Replace NaN with 0.0
                    csv_data = csv_data.where(pd.notnull(csv_data), 0.0)

                    # Convert and format the dates
                    for transaction_date in range(csv_data.iloc[:, 0].size):
                        d = datetime.strptime(csv_data.iloc[transaction_date, 0], '%d %b %Y')
                        csv_data.iloc[transaction_date, 0] = d.strftime('%Y-%m-%d')
                    #print("csv data" + csv_data)
                    # Create or update CSVData objects
                    for record in csv_data.to_dict(orient="records"):
                        transaction_date = record['Date']
                        vendor_name = record['Description']
                        amount = record['Amount']

                        if amount >= 0:
                            debit = amount
                            credit = 0.0
                        else:
                            credit = amount
                            debit = 0.0
                        #balance = record[csv_data.columns[4]]

                        category = categorize_transactions(vendor_name)

                        # Check if the record already exists
                        if not CSVData.objects.filter(
                            user=user,
                            transactionDate=transaction_date,
                            vendorName=vendor_name,
                            debit=debit,
                            credit=credit,
                            #balance=balance
                        ).exists():
                            CSVData.objects.create(
                                user=user,
                                transactionDate=transaction_date,
                                vendorName=vendor_name,
                                debit=debit,
                                credit=credit,
                                #balance=balance,
                                category=category
                            )

                    return Response({"success": "AMEX statement processed successfully!"}, status=status.HTTP_200_OK)

            except Exception as e:
                
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomPagination(PageNumberPagination):
    page_size = 20  # Set the page size to 20
    page_size_query_param = 'page_size'  # Optional: Allows the client to change page size
    max_page_size = 100  # Optional: Limit the maximum page size

@api_view(['GET'])
def get_statements(request):
    user = request.user
    statements = CSVData.objects.filter(user=user)
    
    # Initialize pagination
    paginator = CustomPagination()
    result_page = paginator.paginate_queryset(statements, request)
    
    # Serialize the paginated data
    serializer = CSVDataSerializer(result_page, many=True)
    
    # Return paginated response
    return paginator.get_paginated_response(serializer.data)


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

            preview_data = []

            if card_org == 'TD':
                # Process TD statement
                for transaction_date in range(csv_data.iloc[:, 0].size):
                    d = datetime.strptime(csv_data.iloc[transaction_date, 0], '%m/%d/%Y')
                    csv_data.iloc[transaction_date, 0] = d.strftime('%Y-%m-%d')

                for record in csv_data.to_dict(orient="records"):
                    transaction_date = record[csv_data.columns[0]]
                    vendor_name = record[csv_data.columns[1]]
                    debit = record[csv_data.columns[2]]
                    credit = record[csv_data.columns[3]]

                    # Call the categorize_transactions function with the user
                    category = categorize_transactions(vendor_name, user)
                    all_categories = Category.objects.values_list('name', flat=True)

                    preview_data.append({
                        "transactionDate": transaction_date,
                        "vendorName": vendor_name,
                        "debit": debit,
                        "credit": credit,
                        "suggestedCategory": category,
                        "allCategories": list(all_categories),
                    })

            elif card_org == 'AMEX':
                # Process AMEX statement
                for transaction_date in range(csv_data.iloc[:, 0].size):
                    d = datetime.strptime(csv_data.iloc[transaction_date, 0], '%d %b %Y')
                    csv_data.iloc[transaction_date, 0] = d.strftime('%Y-%m-%d')

                for record in csv_data.to_dict(orient="records"):
                    transaction_date = record['Date']
                    vendor_name = record['Description']
                    amount = record['Amount']

                    if amount >= 0:
                        debit = amount
                        credit = 0.0
                    else:
                        credit = abs(amount)
                        debit = 0.0

                    # Call the categorize_transactions function with the user
                    category = categorize_transactions(vendor_name, user)
                    all_categories = Category.objects.values_list('name', flat=True)

                    preview_data.append({
                        "transactionDate": transaction_date,
                        "vendorName": vendor_name,
                        "debit": debit,
                        "credit": credit,
                        "suggestedCategory": category,
                        "allCategories": list(all_categories),
                    })

            return Response({"preview": preview_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def save_statements(request):
    user = request.user
    data = request.data.get('data', [])  

    if not data:
        return Response({"error": "No data provided."}, status=status.HTTP_400_BAD_REQUEST)

    new_categories = []  
    new_records = []     

    try:
        with transaction.atomic():  
            for row in data:
                transaction_date = row.get('transactionDate')  
                vendor_name = row.get('vendorName')
                debit = row.get('debit', 0.0)
                credit = row.get('credit', 0.0)
                category_name = row.get('category', 'Uncategorized')

                if not vendor_name or not transaction_date:
                    return Response({"error": "Transaction date and vendor name are required."},
                                    status=status.HTTP_400_BAD_REQUEST)

                try:
                    parsed_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
                except ValueError:
                    return Response({"error": f"Invalid date format: {transaction_date}. Use 'YYYY-MM-DD'."},
                                    status=status.HTTP_400_BAD_REQUEST)

                category, created = Category.objects.get_or_create(name=category_name, user=user)
                if created:
                    new_categories.append(category)

                # Generate and ensure unique keywords
                keywords = generate_multiple_keywords(vendor_name)

                for keyword in keywords:
                    Keyword.objects.get_or_create(
                        user=user,
                        category=category,
                        words=keyword,
                        vendor_name=vendor_name  #  Save vendor_name along with keyword
                    )

                exists = CSVData.objects.filter(
                    user=user,
                    transactionDate=parsed_date,
                    vendorName=vendor_name,
                    debit=debit,
                    credit=credit,
                    category=category.name,
                ).exists()

                if not exists:
                    new_records.append(CSVData(
                        user=user,
                        transactionDate=parsed_date,
                        vendorName=vendor_name,
                        debit=debit,
                        credit=credit,
                        category=category.name
                    ))

            # Bulk create CSVData entries
            if new_records:
                CSVData.objects.bulk_create(new_records)

        return Response({"message": "Statements, categories, and keywords saved successfully!"},
                        status=status.HTTP_201_CREATED)

    except Exception as e:
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