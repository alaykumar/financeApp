from django.shortcuts import render
from django.db.models import Sum
from django.utils.timezone import now
from django.db.models.functions import TruncMonth

#import datetime
from datetime import timedelta
from collections import defaultdict

from dataUpload.models import CSVData

from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def category_pie_chart(request):
    user = request.user
    time_range = request.GET.get("range", "all_time")  # Default to "all_time" if no range is provided

    # Calculate date filter based on selected range
    end_date = now()
    if time_range == "last_month":
        start_date = end_date - timedelta(days=30)
    elif time_range == "last_6_months":
        start_date = end_date - timedelta(days=6 * 30)
    elif time_range == "last_year":
        start_date = end_date - timedelta(days=365)
    else:
        start_date = None  # Fetch all-time data

    # Filter transactions based on selected time range
    expenses = CSVData.objects.filter(user=user)
    if start_date:
        expenses = expenses.filter(transactionDate__gte=start_date)

    # Aggregate category totals
    category_totals = (
        expenses.values("category")
        .annotate(total=Sum("debit"))
        .order_by("-total")
    )

    # Prepare data for the pie chart
    chart_data = [["Category", "Amount"]]
    for item in category_totals:
        chart_data.append([item["category"], float(item["total"])])

    return Response({"data": chart_data})


@api_view(['GET'])
def category_monthly_spending(request):
    user = request.user
    today = now().date()
    one_year_ago = today - timedelta(days=365)

    # Filter expenses within the last year
    expenses = CSVData.objects.filter(user=user, transactionDate__gte=one_year_ago)

    # Annotate expenses by month and category, summing debits
    monthly_spending = (
        expenses
            .annotate(month=TruncMonth('transactionDate'))
            .values('month', 'category')
            .annotate(total=Sum('debit'))
            .order_by('month')
    )

    categories = set()
    data_dict = defaultdict(lambda: defaultdict(float))

    # Populate the data dictionary and categories set
    for item in monthly_spending:
        # Keep the full date for sorting purposes
        month = item["month"]
        category = item["category"]
        total = float(item["total"])
        data_dict[month][category] = total
        categories.add(category)

    # Sort the months by actual date first, then format as 'Aug 24'
    sorted_months = sorted(data_dict.keys())
    formatted_months = [month.strftime("%b %y") for month in sorted_months]

    chart_data = [["Month"] + sorted(categories)]

    # Prepare the chart data
    for month in sorted_months:
        formatted_month = month.strftime("%b %y")  # Format for display
        row = [formatted_month] + [data_dict[month].get(cat, 0) for cat in sorted(categories)]
        chart_data.append(row)

    return Response({"data": chart_data})

    



